/**
 * CA ĐOÀN DOHWA - TRÌNH NGHE NHẠC BỘ LỄ THUẦN TÚY (AUDIO-ONLY)
 * - Tự động phát từ bài này sang bài khác và lặp lại liên tục cả bộ lễ
 * - Ẩn hoàn toàn video, tập trung trải nghiệm nghe nhạc thánh ca
 * - Hỗ trợ chạy ngầm màn hình khóa qua MediaSession API (iOS Dynamic Island & Android)
 * - Chế độ "Tắt Màn Hình (Bỏ túi)" OLED siêu tiết kiệm pin, nghe xuyên suốt không gián đoạn
 */

class DohwaPlayer {
  constructor() {
    this.playlist = [];
    this.currentIndex = -1;
    this.currentSong = null;
    this.currentMassSetTitle = 'Bộ Lễ Phụng Vụ';
    this.isPlaying = false;
    this.ytPlayer = null;
    this.audioElement = new Audio();
    this.backgroundAudio = null;
    this.isYouTubeMode = false;
    this.ytReady = false;
    this.repeatMode = 'all'; // Mặc định luôn lặp lại toàn bộ lễ
    this.wakeLock = null;
    this.sleepClockInterval = null;
    this.progressTimer = null;
    this.isDraggingSeek = false;
    this.playbackRate = 1.0;
    this.lastSleepTap = 0;

    this.initElements();
    this.initYouTubeAPI();
  }

  initElements() {
    this.playerBar = document.getElementById('stickyPlayer');
    this.titleEl = document.getElementById('playerTitle');
    this.artistEl = document.getElementById('playerArtist');
    this.timeEl = document.getElementById('playerTimeDisplay');
    this.seekInput = document.getElementById('playerSeekInput');
    this.speedBtn = document.getElementById('playerSpeedBtn');
    this.playBtn = document.getElementById('playerPlayBtn');
    this.prevBtn = document.getElementById('playerPrevBtn');
    this.nextBtn = document.getElementById('playerNextBtn');
    this.repeatBtn = document.getElementById('playerRepeatBtn');
    this.closeBtn = document.getElementById('playerCloseBtn');
    this.ytContainer = document.getElementById('ytPlayerContainer');

    if (this.playBtn) {
      this.playBtn.addEventListener('click', () => this.togglePlay());
    }
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.playPrevious());
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.playNext());
    }
    if (this.repeatBtn) {
      this.repeatBtn.addEventListener('click', () => this.cycleRepeatMode());
    }
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.stop());
    }
    if (this.seekInput) {
      this.seekInput.addEventListener('mousedown', () => { this.isDraggingSeek = true; });
      this.seekInput.addEventListener('touchstart', () => { this.isDraggingSeek = true; }, { passive: true });
      this.seekInput.addEventListener('input', (e) => {
        this.isDraggingSeek = true;
        const pct = parseFloat(e.target.value) || 0;
        const dur = this.getDurationSeconds();
        if (dur > 0 && this.timeEl) {
          this.timeEl.textContent = `${this.formatSeconds((pct / 100) * dur)} / ${this.formatSeconds(dur)}`;
        }
      });
      this.seekInput.addEventListener('change', (e) => {
        const pct = parseFloat(e.target.value) || 0;
        this.seekToPercent(pct);
        this.isDraggingSeek = false;
      });
    }

    // Lắng nghe audio element kết thúc
    this.audioElement.addEventListener('ended', () => {
      this.handleSongEnded();
    });

    this.updateRepeatBtnDisplay();
  }

  initYouTubeAPI() {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }

      window.onYouTubeIframeAPIReady = () => {
        this.ytReady = true;
      };
    } else {
      this.ytReady = true;
    }
  }

  extractYouTubeId(url) {
    if (!url) return null;
    const str = url.trim();
    if (str.endsWith('.mp3') || str.endsWith('.m4a') || str.endsWith('.wav') || str.endsWith('.ogg')) return null;
    if (str.length === 11 && !str.includes('/') && !str.includes('?')) return str;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = str.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  // --- PHÁT TOÀN BỘ BỘ LỄ (TUẦN TỰ + TỰ ĐỘNG CHUYỂN BÀI + LẶP LẠI) ---
  playMassSet(massSet, startSongId = null) {
    if (!massSet || !massSet.songs) return;
    const playable = massSet.songs.filter(s => (s.youtubeUrl && s.youtubeUrl.trim()) || s.audioUrl);
    if (!playable.length) {
      alert('Bộ lễ này chưa được gắn link YouTube nghe thử!');
      return;
    }

    this.playlist = playable;
    this.currentMassSetTitle = massSet.title || massSet.weekName || 'Bộ Lễ';

    let startIndex = 0;
    if (startSongId) {
      const foundIdx = this.playlist.findIndex(s => s.id === startSongId);
      if (foundIdx !== -1) startIndex = foundIdx;
    }

    this.currentIndex = startIndex;
    this.repeatMode = 'all'; // Luôn lặp lại toàn bộ lễ
    this.updateRepeatBtnDisplay();
    this.playCurrentIndex();
  }

  // Tương thích ngược với các hàm cũ
  playMassPlaylist(songs, startIndex = 0) {
    this.playMassSet({ songs, title: 'Bộ Lễ' }, (songs && songs[startIndex]) ? songs[startIndex].id : null);
  }

  playSong(song) {
    if (!song) return;
    this.playlist = [song];
    this.currentIndex = 0;
    this.playCurrentIndex();
  }

  playCurrentIndex() {
    if (this.currentIndex < 0 || this.currentIndex >= this.playlist.length) return;

    const song = this.playlist[this.currentIndex];
    this.currentSong = song;

    const indexBadge = this.playlist.length > 1 ? `[${this.currentIndex + 1}/${this.playlist.length}] ` : '';
    if (this.titleEl) this.titleEl.textContent = `${indexBadge}${song.title || 'Bài hát'}`;
    if (this.artistEl) this.artistEl.textContent = `${song.roleLabel || 'Thánh Ca'} • Ca Đoàn Do Hwa`;
    if (this.playerBar) this.playerBar.style.display = 'flex';

    // Hiện thông báo toast đang phát để người dùng nhận biết ngay lập tức
    const oldToast = document.querySelector('.dohwa-player-toast');
    if (oldToast) oldToast.remove();
    const toast = document.createElement('div');
    toast.className = 'dohwa-toast dohwa-player-toast';
    toast.textContent = `▶ Đang phát [${this.currentIndex + 1}/${this.playlist.length}]: ${song.roleLabel ? song.roleLabel + ' - ' : ''}${song.title || ''}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);

    // Cập nhật text trên màn hình tối nếu đang bật
    const sleepTitle = document.getElementById('sleepSongTitle');
    if (sleepTitle) {
      sleepTitle.textContent = `${indexBadge}${song.roleLabel || ''}: ${song.title || ''}`;
    }

    // Thiết lập MediaSession để hỗ trợ màn hình khóa trên iOS và Android
    this.updateMediaSession(song);

    // Kích hoạt audio nền anchor để giữ tiến trình trên di động
    this.startBackgroundAudioAnchor();

    const ytId = this.extractYouTubeId(song.youtubeUrl);
    if (ytId) {
      this.playYouTube(ytId);
    } else if (song.audioUrl || (song.youtubeUrl && (song.youtubeUrl.endsWith('.mp3') || song.youtubeUrl.endsWith('.m4a') || song.youtubeUrl.includes('.mp3')))) {
      this.playAudioFile(song.audioUrl || song.youtubeUrl);
    } else {
      this.handleSongEnded();
    }
  }

  // --- AUDIO ANCHOR: GIỮ TIẾN TRÌNH AUDIO NỀN TRÊN SAFARI/CHROME MOBILE ---
  startBackgroundAudioAnchor() {
    try {
      if (!this.backgroundAudio) {
        // 1-giây silent wav base64
        const SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
        this.backgroundAudio = new Audio(SILENT_WAV);
        this.backgroundAudio.loop = true;
      }
      this.backgroundAudio.play().catch(() => {});
    } catch (e) {}
  }

  // --- MEDIASESSION API: HIỂN THỊ ĐIỀU KHIỂN TRÊN MÀN HÌNH KHÓA IPHONE & ANDROID ---
  updateMediaSession(song) {
    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title || 'Thánh Ca',
        artist: `${song.roleLabel || 'Hát Lễ'} • Ca Đoàn Do Hwa`,
        album: this.currentMassSetTitle || 'Bộ Lễ Phụng Vụ',
        artwork: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      });

      navigator.mediaSession.playbackState = 'playing';

      navigator.mediaSession.setActionHandler('play', () => this.togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => this.togglePlay());
      navigator.mediaSession.setActionHandler('previoustrack', () => this.playPrevious());
      navigator.mediaSession.setActionHandler('nexttrack', () => this.playNext());
      navigator.mediaSession.setActionHandler('seekbackward', () => this.seekRelative(-10));
      navigator.mediaSession.setActionHandler('seekforward', () => this.seekRelative(10));
    } catch (e) {
      console.warn('MediaSession error:', e);
    }
  }

  // --- CHẾ ĐỘ MÀN HÌNH TỐI TIẾT KIỆM PIN & KHÓA BỎ TÚI (NGHE CHẠY NGẦM) ---
  async enableOledSleepMode() {
    const overlay = document.getElementById('oledSleepOverlay');
    if (!overlay) return;

    overlay.style.display = 'flex';
    this.updateSleepClock();
    if (!this.sleepClockInterval) {
      this.sleepClockInterval = setInterval(() => this.updateSleepClock(), 1000);
    }

    // Yêu cầu WakeLock để màn hình không bị khóa phần cứng làm ngắt YouTube trên web
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
      } catch (e) {}
    }
  }

  updateSleepClock() {
    const clockEl = document.getElementById('sleepClock');
    if (clockEl) {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      clockEl.textContent = `${h}:${m}`;
    }
  }

  handleSleepTap() {
    const now = Date.now();
    if (this.lastSleepTap && (now - this.lastSleepTap < 500)) {
      // Double tap -> thoát chế độ màn hình tối
      this.disableOledSleepMode();
      this.lastSleepTap = 0;
    } else {
      this.lastSleepTap = now;
      const hint = document.querySelector('#oledSleepOverlay div:last-child');
      if (hint) {
        hint.style.color = '#38bdf8';
        hint.textContent = '✨ Chạm thêm 1 lần nữa để mở lại màn hình!';
        setTimeout(() => {
          if (hint) {
            hint.style.color = '#555';
            hint.textContent = '📱 Chế độ bỏ túi tiết kiệm pin • Chạm 2 lần để bật sáng';
          }
        }, 1500);
      }
    }
  }

  disableOledSleepMode() {
    const overlay = document.getElementById('oledSleepOverlay');
    if (overlay) overlay.style.display = 'none';
    if (this.sleepClockInterval) {
      clearInterval(this.sleepClockInterval);
      this.sleepClockInterval = null;
    }
    if (this.wakeLock) {
      try { this.wakeLock.release(); } catch (e) {}
      this.wakeLock = null;
    }
  }

  // --- ENGINE PHÁT YOUTUBE AUDIO-ONLY (CHUẨN SOANBOLE.COM: KHÔNG QUẢNG CÁO) ---
  playYouTube(videoId) {
    this.isYouTubeMode = true;
    this.audioElement.pause();

    const container = document.getElementById('ytPlayerContainer');
    if (!container) return;

    // 1. Luôn giải phóng (destroy) instance cũ trước khi nạp bài mới để ngăn YouTube tích lũy session chèn quảng cáo giữa/đầu video
    if (this.ytPlayer) {
      try { this.ytPlayer.destroy(); } catch (e) {}
      this.ytPlayer = null;
    }

    container.innerHTML = '<div id="yt-player-instance"></div>';

    // 2. KHÔNG dùng youtube-nocookie.com (vì nocookie tước quyền đăng nhập/Premium và ép chèn quảng cáo đại trà)
    // Dùng chuẩn https://www.youtube.com với origin chính xác để YouTube handshake bảo mật và loại bỏ quảng cáo ép buộc
    const originUrl = (window.location.origin && window.location.origin !== 'null') 
      ? window.location.origin 
      : (window.location.protocol + '//' + window.location.host);

    const fallbackSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&controls=0&disablekb=1&modestbranding=1&rel=0&iv_load_policy=3&enablejsapi=1&origin=${encodeURIComponent(originUrl)}`;

    if (!window.YT || !window.YT.Player) {
      container.innerHTML = `<iframe id="ytIframeDirect" width="320" height="180" src="${fallbackSrc}" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
      this.isPlaying = true;
      this.updatePlayBtnState();
      return;
    }

    try {
      this.ytPlayer = new YT.Player('yt-player-instance', {
        height: '180',
        width: '320',
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          iv_load_policy: 3,
          origin: originUrl
        },
        events: {
          onReady: (event) => {
            try {
              event.target.setVolume(100);
              if (this.playbackRate !== 1.0 && event.target.setPlaybackRate) {
                event.target.setPlaybackRate(this.playbackRate);
              }
              event.target.playVideo();
            } catch (e) {}
            this.isPlaying = true;
            this.startProgressTimer();
            this.updatePlayBtnState();
          },
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PLAYING) {
              this.isPlaying = true;
              this.startProgressTimer();
              if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
            } else if (event.data === YT.PlayerState.PAUSED) {
              this.isPlaying = false;
              if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
            } else if (event.data === YT.PlayerState.ENDED) {
              this.isPlaying = false;
              this.handleSongEnded(); // Tự động nhảy sang bài tiếp theo!
            }
            this.updatePlayBtnState();
          },
          onError: (event) => {
            console.warn('YouTube Player error code:', event.data);
            this.handleSongEnded(); // Tự động chuyển bài tiếp nếu video lỗi
          }
        }
      });
    } catch (err) {
      console.warn('YT.Player create error, falling back to direct iframe:', err);
      container.innerHTML = `<iframe id="ytIframeDirect" width="320" height="180" src="${fallbackSrc}" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
      this.isPlaying = true;
      this.updatePlayBtnState();
    }
  }

  playAudioFile(url) {
    this.isYouTubeMode = false;
    if (this.ytPlayer && this.ytPlayer.stopVideo) {
      this.ytPlayer.stopVideo();
    }

    this.audioElement.src = url;
    this.audioElement.playbackRate = this.playbackRate || 1.0;
    this.audioElement.play().then(() => {
      this.isPlaying = true;
      this.startProgressTimer();
      this.updatePlayBtnState();
    }).catch(e => {
      console.warn('Audio play error:', e);
      this.isPlaying = false;
      this.updatePlayBtnState();
    });
  }

  // --- THANH TUA NHẠC (SEEKBAR), THỜI LƯỢNG & CHỈNH TỐC ĐỘ TẬP HÁT ---
  formatSeconds(sec) {
    if (!sec || !isFinite(sec) || sec < 0) return '00:00';
    const total = Math.floor(sec);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  getCurrentSeconds() {
    try {
      if (this.isYouTubeMode && this.ytPlayer && typeof this.ytPlayer.getCurrentTime === 'function') {
        return this.ytPlayer.getCurrentTime() || 0;
      }
      if (!this.isYouTubeMode && this.audioElement) {
        return this.audioElement.currentTime || 0;
      }
    } catch (e) {}
    return 0;
  }

  getDurationSeconds() {
    try {
      if (this.isYouTubeMode && this.ytPlayer && typeof this.ytPlayer.getDuration === 'function') {
        return this.ytPlayer.getDuration() || 0;
      }
      if (!this.isYouTubeMode && this.audioElement) {
        return this.audioElement.duration || 0;
      }
    } catch (e) {}
    return 0;
  }

  startProgressTimer() {
    this.stopProgressTimer();
    this.progressTimer = setInterval(() => {
      if (!this.isPlaying || this.isDraggingSeek) return;
      const cur = this.getCurrentSeconds();
      const dur = this.getDurationSeconds();
      if (this.timeEl) {
        this.timeEl.textContent = `${this.formatSeconds(cur)} / ${this.formatSeconds(dur)}`;
      }
      if (this.seekInput && dur > 0) {
        this.seekInput.value = String(Math.min(100, (cur / dur) * 100));
      }
    }, 500);
  }

  stopProgressTimer() {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }

  seekToPercent(pct) {
    const dur = this.getDurationSeconds();
    if (!dur || dur <= 0) return;
    const targetSec = Math.max(0, Math.min(dur - 1, (pct / 100) * dur));
    this.seekToSeconds(targetSec);
  }

  seekToSeconds(targetSec) {
    try {
      if (this.isYouTubeMode && this.ytPlayer && typeof this.ytPlayer.seekTo === 'function') {
        this.ytPlayer.seekTo(targetSec, true);
      } else if (!this.isYouTubeMode && this.audioElement) {
        this.audioElement.currentTime = targetSec;
      }
      const dur = this.getDurationSeconds();
      if (this.timeEl) {
        this.timeEl.textContent = `${this.formatSeconds(targetSec)} / ${this.formatSeconds(dur)}`;
      }
      if (this.seekInput && dur > 0) {
        this.seekInput.value = String(Math.min(100, (targetSec / dur) * 100));
      }
    } catch (e) {}
  }

  seekRelative(deltaSec) {
    const dur = this.getDurationSeconds();
    if (!dur || dur <= 0) return;
    const cur = this.getCurrentSeconds();
    const target = Math.max(0, Math.min(dur - 1, cur + deltaSec));
    this.seekToSeconds(target);
  }

  cyclePlaybackSpeed() {
    const speeds = [1.0, 0.85, 0.75, 1.15];
    const idx = speeds.indexOf(this.playbackRate);
    this.playbackRate = speeds[(idx + 1) % speeds.length];

    if (this.speedBtn) {
      this.speedBtn.textContent = `${this.playbackRate}x`;
      this.speedBtn.style.background = this.playbackRate !== 1.0 ? 'var(--primary-light)' : 'transparent';
    }

    try {
      if (this.isYouTubeMode && this.ytPlayer && typeof this.ytPlayer.setPlaybackRate === 'function') {
        this.ytPlayer.setPlaybackRate(this.playbackRate);
      }
      if (this.audioElement) {
        this.audioElement.playbackRate = this.playbackRate;
      }
    } catch (e) {}
  }

  // --- XỬ LÝ HẾT BÀI: TỰ ĐỘNG CHUYỂN BÀI & LẶP LẠI BỘ LỄ ---
  handleSongEnded() {
    if (this.repeatMode === 'one') {
      this.playCurrentIndex();
      return;
    }

    if (this.currentIndex < this.playlist.length - 1) {
      this.currentIndex++;
      this.playCurrentIndex(); // Sang bài kế tiếp
    } else {
      // Đã hết bài cuối cùng (Kết Lễ) -> LẶP LẠI TỪ BÀI ĐẦU TIÊN (Kính Đức Mẹ)
      if (this.repeatMode === 'all') {
        this.currentIndex = 0;
        this.playCurrentIndex();
      } else {
        this.isPlaying = false;
        this.updatePlayBtnState();
      }
    }
  }

  playNext() {
    if (!this.playlist.length) return;
    if (this.currentIndex < this.playlist.length - 1) {
      this.currentIndex++;
    } else {
      this.currentIndex = 0; // Quay về bài 1
    }
    this.playCurrentIndex();
  }

  playPrevious() {
    if (!this.playlist.length) return;
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else {
      this.currentIndex = this.playlist.length - 1; // Nhảy tới bài cuối
    }
    this.playCurrentIndex();
  }

  cycleRepeatMode() {
    if (this.repeatMode === 'all') {
      this.repeatMode = 'one';
    } else if (this.repeatMode === 'one') {
      this.repeatMode = 'none';
    } else {
      this.repeatMode = 'all';
    }
    this.updateRepeatBtnDisplay();
  }

  updateRepeatBtnDisplay() {
    if (!this.repeatBtn) return;
    if (this.repeatMode === 'all') {
      this.repeatBtn.innerHTML = '🔁';
      this.repeatBtn.title = 'Chế độ: Lặp lại liên tục toàn bộ lễ';
      this.repeatBtn.style.color = '#7c3aed';
    } else if (this.repeatMode === 'one') {
      this.repeatBtn.innerHTML = '🔂';
      this.repeatBtn.title = 'Chế độ: Lặp lại 1 bài hiện tại';
      this.repeatBtn.style.color = '#0284c7';
    } else {
      this.repeatBtn.innerHTML = '➡️';
      this.repeatBtn.title = 'Chế độ: Không lặp lại';
      this.repeatBtn.style.color = 'var(--text-muted)';
    }
  }

  togglePlay() {
    if (!this.currentSong) return;

    if (this.isYouTubeMode) {
      if (this.ytPlayer && this.ytPlayer.getPlayerState) {
        const state = this.ytPlayer.getPlayerState();
        if (state === YT.PlayerState.PLAYING) {
          this.ytPlayer.pauseVideo();
          this.isPlaying = false;
        } else {
          this.ytPlayer.playVideo();
          this.isPlaying = true;
        }
      }
    } else {
      if (this.audioElement.paused) {
        this.audioElement.play();
        this.isPlaying = true;
      } else {
        this.audioElement.pause();
        this.isPlaying = false;
      }
    }
    this.updatePlayBtnState();
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = this.isPlaying ? 'playing' : 'paused';
    }
  }

  stop() {
    this.isPlaying = false;
    this.currentSong = null;
    this.stopProgressTimer();
    if (this.seekInput) this.seekInput.value = '0';
    if (this.timeEl) this.timeEl.textContent = '00:00 / 00:00';

    if (this.isYouTubeMode && this.ytPlayer && this.ytPlayer.stopVideo) {
      try { this.ytPlayer.stopVideo(); } catch(e) {}
    }
    const container = document.getElementById('ytPlayerContainer');
    if (container) {
      container.innerHTML = '';
      this.ytPlayer = null;
    }
    this.audioElement.pause();
    this.audioElement.currentTime = 0;
    if (this.backgroundAudio) {
      this.backgroundAudio.pause();
    }

    this.disableOledSleepMode();

    if (this.playerBar) this.playerBar.style.display = 'none';
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'none';
    }

    this.updatePlayBtnState();
  }

  updatePlayBtnState() {
    if (this.playBtn) {
      this.playBtn.innerHTML = this.isPlaying ? '⏸' : '▶';
      this.playBtn.title = this.isPlaying ? 'Tạm dừng' : 'Tiếp tục phát';
    }
  }
}

// Global player
window.dohwaPlayer = new DohwaPlayer();
