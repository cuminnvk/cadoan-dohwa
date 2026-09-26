/**
 * CA ĐOÀN DOHWA - STICKY MUSIC PLAYER (Playlist Bộ Lễ + Lặp lại + Chạy nền)
 * Hỗ trợ nghe tuần tự toàn bộ các bài trong bộ lễ, tùy chọn lặp lại 1 bài / tất cả,
 * và ẩn hiện video YouTube mượt mà.
 */

class DohwaPlayer {
  constructor() {
    this.playlist = [];
    this.currentIndex = -1;
    this.currentSong = null;
    this.isPlaying = false;
    this.ytPlayer = null;
    this.audioElement = new Audio();
    this.isYouTubeMode = false;
    this.ytReady = false;
    this.repeatMode = 'all'; // 'all', 'one', 'none'

    this.initElements();
    this.initYouTubeAPI();
  }

  initElements() {
    this.playerBar = document.getElementById('stickyPlayer');
    this.titleEl = document.getElementById('playerTitle');
    this.artistEl = document.getElementById('playerArtist');
    this.playBtn = document.getElementById('playerPlayBtn');
    this.prevBtn = document.getElementById('playerPrevBtn');
    this.nextBtn = document.getElementById('playerNextBtn');
    this.repeatBtn = document.getElementById('playerRepeatBtn');
    this.closeBtn = document.getElementById('playerCloseBtn');
    this.videoToggleBtn = document.getElementById('playerVideoToggleBtn');
    this.videoPopover = document.getElementById('youtubePopover');
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
    if (this.videoToggleBtn) {
      this.videoToggleBtn.addEventListener('click', () => this.toggleVideoPopup());
    }

    // Audio element listener
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
    if (str.length === 11 && !str.includes('/') && !str.includes('?')) return str;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = str.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  // Phát danh sách toàn bộ bài hát trong bộ lễ
  playMassPlaylist(songs, startIndex = 0) {
    if (!songs || !songs.length) return;

    // Lọc các bài có link nghe
    const playable = songs.filter(s => s.youtubeUrl || s.audioUrl);
    if (!playable.length) {
      alert('Các bài hát trong bộ lễ này chưa được gắn link YouTube nghe thử!');
      return;
    }

    this.playlist = playable;
    this.currentIndex = (startIndex >= 0 && startIndex < this.playlist.length) ? startIndex : 0;
    this.playCurrentIndex();
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
    if (this.titleEl) this.titleEl.textContent = indexBadge + (song.title || 'Bài hát');
    if (this.artistEl) this.artistEl.textContent = (song.roleLabel || '') + (song.composer ? ` • ${song.composer}` : '');
    if (this.playerBar) this.playerBar.style.display = 'flex';

    // Highlight card đang phát nếu có
    document.querySelectorAll('.song-card').forEach(c => c.classList.remove('now-playing'));
    const activeCard = document.querySelector(`.song-card[data-song-id="${song.id}"]`);
    if (activeCard) activeCard.classList.add('now-playing');

    const ytId = this.extractYouTubeId(song.youtubeUrl);

    if (ytId) {
      this.playYouTube(ytId);
    } else if (song.audioUrl) {
      this.playAudioFile(song.audioUrl);
    } else {
      this.handleSongEnded();
    }
  }

  playYouTube(videoId) {
    this.isYouTubeMode = true;
    this.audioElement.pause();

    if (this.videoPopover) {
      this.videoPopover.style.display = 'block';
      if (this.videoToggleBtn) this.videoToggleBtn.classList.add('active');
    }

    if (!this.ytPlayer) {
      if (!this.ytReady && !window.YT) {
        this.ytContainer.innerHTML = `<iframe id="ytIframeDirect" width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
        this.isPlaying = true;
        this.updatePlayBtnState();
        return;
      }

      this.ytPlayer = new YT.Player('ytPlayerContainer', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 1,
          rel: 0,
          modestbranding: 1
        },
        events: {
          onReady: (event) => {
            event.target.playVideo();
            this.isPlaying = true;
            this.updatePlayBtnState();
          },
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PLAYING) {
              this.isPlaying = true;
            } else if (event.data === YT.PlayerState.PAUSED) {
              this.isPlaying = false;
            } else if (event.data === YT.PlayerState.ENDED) {
              this.isPlaying = false;
              this.handleSongEnded();
            }
            this.updatePlayBtnState();
          }
        }
      });
    } else {
      this.ytPlayer.loadVideoById(videoId);
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
    this.audioElement.play().then(() => {
      this.isPlaying = true;
      this.updatePlayBtnState();
    }).catch(e => {
      console.warn('Audio play error:', e);
      this.isPlaying = false;
      this.updatePlayBtnState();
    });
  }

  handleSongEnded() {
    if (this.repeatMode === 'one') {
      // Lặp lại đúng bài này
      this.playCurrentIndex();
      return;
    }

    if (this.currentIndex < this.playlist.length - 1) {
      this.currentIndex++;
      this.playCurrentIndex();
    } else {
      // Hết danh sách
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
      this.currentIndex = 0;
    }
    this.playCurrentIndex();
  }

  playPrevious() {
    if (!this.playlist.length) return;
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else {
      this.currentIndex = this.playlist.length - 1;
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
      this.repeatBtn.title = 'Chế độ: Lặp lại tất cả bài trong bộ lễ';
      this.repeatBtn.style.color = '#7c3aed';
    } else if (this.repeatMode === 'one') {
      this.repeatBtn.innerHTML = '🔂';
      this.repeatBtn.title = 'Chế độ: Lặp lại 1 bài hiện tại';
      this.repeatBtn.style.color = '#0284c7';
    } else {
      this.repeatBtn.innerHTML = '➡️';
      this.repeatBtn.title = 'Chế độ: Không lặp lại (hết bài thì dừng)';
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
  }

  stop() {
    this.isPlaying = false;
    this.currentSong = null;

    if (this.isYouTubeMode && this.ytPlayer && this.ytPlayer.stopVideo) {
      this.ytPlayer.stopVideo();
    }
    this.audioElement.pause();
    this.audioElement.currentTime = 0;

    if (this.playerBar) this.playerBar.style.display = 'none';
    if (this.videoPopover) this.videoPopover.style.display = 'none';

    document.querySelectorAll('.song-card').forEach(c => c.classList.remove('now-playing'));
    this.updatePlayBtnState();
  }

  toggleVideoPopup() {
    if (!this.videoPopover) return;
    const isShowing = this.videoPopover.style.display === 'block';
    this.videoPopover.style.display = isShowing ? 'none' : 'block';
    if (this.videoToggleBtn) {
      this.videoToggleBtn.classList.toggle('active', !isShowing);
    }
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
