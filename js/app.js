/**
 * CA ĐOÀN DOHWA - MAIN APPLICATION ORCHESTRATOR
 * Điều phối tab, render Thẻ Bộ Lễ chuẩn, Kho Lễ thu gọn 20-30 bộ/màn hình,
 * Nút Chia Sẻ tổng hợp, Trình phát nhạc Playlist & Modal Cài Đặt ca viên.
 */

class DohwaApp {
  constructor() {
    this.currentMassSet = null;
    this.allMassSets = [];
    this.initEvents();
  }

  async init() {
    const savedTheme = localStorage.getItem('dohwa_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    this.updateAdminUI();

    // Tự động đồng bộ dữ liệu mới nhất từ Cloud ngay khi mở web (mọi thiết bị)
    if (window.dohwaStore) {
      try {
        await window.dohwaStore.syncAllFromCloud();
      } catch (e) {
        console.warn('Sync on init error:', e);
      }
    }

    await this.loadCurrentMassSet();
    await this.loadMassSetsArchive();
    await this.renderBaiDaSoanTrongNam();

    // Cổng xác nhận ca viên vào phòng (Member Gate modal)
    await this.checkMemberGate();

    if (window.location.hash) {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'baidoc') {
        if (window.openMassBaiDoc) window.openMassBaiDoc('mass-cn-25-tn-a');
      } else if (hash === 'baidoc-lnth') {
        if (window.openMassBaiDoc) {
          window.openMassBaiDoc('mass-cn-25-tn-a');
          if (window.baiDocViewer) window.baiDocViewer.switchTab('lnth');
        }
      } else if (hash === 'aidaxem') {
        if (window.dohwaStore?.isAdmin()) {
          this.openAiDaXemModal();
        } else {
          this.switchTab('tab-hientai');
        }
      } else if (hash === 'chonten') {
        this.openMemberGateModal();
      } else if (hash === 'baidasoan') {
        this.scrollToBaiDaSoan();
      } else if (hash === 'caidat' || hash === 'admin') {
        if (window.dohwaStore?.isAdmin()) {
          this.openCaiDatModal();
        } else {
          this.switchTab('tab-hientai');
        }
      } else if (document.getElementById(hash)) {
        this.switchTab(hash);
      }
    }
  }

  initEvents() {
    // Top tabs click (Desktop/Tablet)
    document.querySelectorAll('.top-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        this.switchTab(tabId);
      });
    });

    // Navigation bar click (Mobile)
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        this.switchTab(tabId);
      });
    });

    // Theme toggle
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => this.toggleTheme());
    }

    // Modal Member select
    const memberSelect = document.getElementById('modalMemberSelect');
    const customFields = document.getElementById('modalCustomFields');
    if (memberSelect && customFields) {
      memberSelect.addEventListener('change', () => {
        customFields.style.display = memberSelect.value === '__other__' ? 'block' : 'none';
      });
    }

    const saveUserBtn = document.getElementById('btnSaveUserModal');
    if (saveUserBtn) {
      saveUserBtn.addEventListener('click', () => window.dohwaThongKe?.saveSelectedUser());
    }

    const userBadge = document.getElementById('userHeaderBadge');
    if (userBadge) {
      userBadge.addEventListener('click', () => this.handleUserBadgeClick());
    }

    // Đóng Modal Bài Đọc
    const closeBdBtn = document.getElementById('baiDocModalClose');
    if (closeBdBtn) {
      closeBdBtn.addEventListener('click', () => window.baiDocViewer?.close());
    }
  }

  switchTab(tabId) {
    if ((tabId === 'tab-soanle' || tabId === 'tab-thongke') && window.dohwaStore && !window.dohwaStore.isAdmin()) {
      this.openAdminLoginModal(() => this.switchTab(tabId));
      return;
    }

    // Ẩn toàn bộ tab khác
    document.querySelectorAll('.tab-pane').forEach(el => {
      el.classList.remove('active');
      el.style.display = 'none';
    });
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.top-tab-btn').forEach(el => el.classList.remove('active'));

    const targetPane = document.getElementById(tabId);
    const targetNav = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
    const targetTop = document.querySelector(`.top-tab-btn[data-tab="${tabId}"]`);

    if (targetPane) {
      targetPane.classList.add('active');
      targetPane.style.display = 'block';
    }
    if (targetNav) targetNav.classList.add('active');
    if (targetTop) targetTop.classList.add('active');

    if (tabId === 'tab-kho') {
      this.loadMassSetsArchive();
    } else if (tabId === 'tab-thongke') {
      if (this.currentMassSet && window.dohwaThongKe) {
        window.dohwaThongKe.loadStats(this.currentMassSet.id);
      }
    }

    // Cuộn lên đầu trang ngay lập tức
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // --- TẢI VÀ RENDER THẺ BỘ LỄ HIỆN TẠI ---
  async loadCurrentMassSet() {
    if (window.dohwaStore) {
      // Kiểm tra tham số trên URL (?massId=... hoặc ?id=... hoặc ?mass=...)
      const urlParams = new URLSearchParams(window.location.search);
      let targetId = urlParams.get('massId') || urlParams.get('id') || urlParams.get('mass');

      if (!targetId && window.location.hash) {
        const h = window.location.hash.replace('#', '');
        if (h.startsWith('mass=')) {
          targetId = h.replace('mass=', '');
        } else if (h.startsWith('mass-')) {
          targetId = h;
        }
      }

      if (targetId) {
        this.currentMassSet = await window.dohwaStore.get('mass_sets', targetId);
      }

      if (!this.currentMassSet) {
        this.currentMassSet = await window.dohwaStore.getActiveMassSet();
      }
    }

    const container = document.getElementById('massSetCardContainer');
    if (!container) return;

    if (!this.currentMassSet) {
      container.innerHTML = `
        <div style="text-align:center; padding:40px; color:var(--text-muted); background:var(--bg-card); border-radius:var(--radius-lg); border:1px solid var(--border);">
          <div style="font-size:3rem; margin-bottom:12px;">🎼</div>
          <h3>Chưa có bộ lễ nào được chọn</h3>
          <p style="margin-top:6px;">Ca trưởng hãy bấm vào tab <strong>"Soạn Bộ Lễ"</strong> để tạo bộ lễ mới!</p>
        </div>
      `;
      return;
    }

    // Ghi nhận chuyên cần khi mở bộ lễ
    if (window.dohwaStore && this.currentMassSet) {
      const session = window.dohwaStore.getUserSession() || window.dohwaStore.getUserProfile();
      if (session && session.name && session.memberId !== 'admin' && session.name !== 'Admin' && session.name !== 'Chọn tên') {
        window.dohwaStore.recordView(this.currentMassSet.id, session.name);
      }
    }

    container.innerHTML = this.renderMassSetCardHTML(this.currentMassSet);
  }

  renderMassSetCardHTML(m) {
    const roles = m.liturgicalRoles || {};
    const songs = m.songs || [];
    const dateFormatted = this.formatDisplayDate(m.date);
    const updatedDate = this.formatDisplayDate(m.updatedAt || m.createdAt || m.date);

    // Khung vàng phân công 4 vị trí
    const roleItems = [
      { key: 'reader1', label: 'Bài đọc 1', icon: '📖', val: roles.reader1 || 'Chưa phân công' },
      { key: 'psalmist', label: 'Thánh Vịnh', icon: '🎶', val: roles.psalmist || roles.dapca || 'Chưa phân công' },
      { key: 'reader2', label: 'Bài đọc 2', icon: '📖', val: roles.reader2 || 'Chưa phân công' },
      { key: 'petitions', label: 'Lời Nguyện Tín Hữu', icon: '🙏', val: roles.petitions || roles.loinguyen || 'Chưa phân công' }
    ];

    const rolesHtml = `
      <div class="boleht-role-summary-compact">
        <div class="boleht-role-grid">
          ${roleItems.map(r => `
            <div class="boleht-role-item-compact">
              <span class="boleht-role-name">${r.icon} ${r.label}:</span>
              <span class="boleht-role-assignee">${r.val}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Danh sách bài hát
    const songsHtml = songs.length ? `
      <div class="massset-songs-list-compact">
        ${songs.map((s, idx) => `
          <div class="massset-song-line" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(0,0,0,0.05); padding:4px 0;">
            <div>
              <span class="massset-song-role" style="font-weight:700; color:var(--primary); margin-right:4px;">${s.roleLabel || 'Bài hát'}:</span> 
              <strong>${s.title}</strong> 
              ${s.composer ? `<span class="massset-song-composer">- ${s.composer}</span>` : ''}
            </div>
            <div style="display:flex; gap:6px; flex-shrink:0;">
              ${(s.pdfData || s.pdfName) ? `<button type="button" class="btn-xs btn-outline" style="color:#0284c7; border-color:#bae6fd; background:#f0f9ff; padding:2px 8px; border-radius:6px; font-weight:700; font-size:0.78rem;" onclick="window.dohwaPDFViewer.open('${s.pdfData||''}','${(s.title||'').replace(/'/g, "\\'")}','${s.pdfName||''}')">📄 Nốt</button>` : ''}
              ${s.youtubeUrl ? `<button type="button" class="btn-xs btn-outline" style="color:#dc2626; border-color:#fca5a5; background:#fef2f2; padding:2px 8px; border-radius:6px; font-weight:700; font-size:0.78rem; display:inline-flex; align-items:center; gap:3px;" onclick="window.dohwaPlayer.playMassSet(window.dohwaApp.findMassSet('${m.id}'), '${s.id}')">▶ Nghe</button>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    ` : '<div style="color:var(--text-muted); font-size:0.86rem; margin:10px 0;">Chưa có bài hát nào trong bộ lễ này.</div>';

    // Thẻ chuẩn 2 cột Zero-Scroll trên Desktop
    return `
      <div class="massset-saved-card" id="card-${m.id}">
        <!-- HEADER -->
        <div class="massset-card-header">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap;">
            <div>
              <h2 class="massset-card-title">${m.title}</h2>
              <div class="massset-card-subtitle">${m.weekName || m.title}</div>
            </div>
            <div class="massset-card-meta">
              <div class="massset-card-meta-line">👥 Ca đoàn ca-doan-dohwa</div>
              <div class="massset-card-meta-line">👤 ✝ Peter Nguyễn ✝ • ${dateFormatted}</div>
            </div>
          </div>
        </div>

        <!-- 2 CỘT ZERO-SCROLL TRÊN MÁY TÍNH -->
        <div class="massset-card-body-grid">
          <!-- CỘT TRÁI: PHÂN CÔNG PHỤNG VỤ & DÀN NÚT BẤM -->
          <div class="massset-card-left-part">
            ${rolesHtml}

            <!-- DÀN NÚT BẤM THAO TÁC GỌN GÀNG -->
            <div class="massset-card-actions-compact">
              <button type="button" class="action-btn btn-play" style="background:linear-gradient(135deg,#dc2626,#991b1b); color:#fff; font-weight:800; border:none; box-shadow:0 2px 8px rgba(220,38,38,0.35);" onclick="window.playMassSet('${m.id}')">
                ▶ Nghe Toàn Bộ Lễ
              </button>
              <button type="button" class="action-btn btn-view" onclick="window.openFullViewModal('${m.id}')">
                👁️ Chi Tiết
              </button>
              <button type="button" class="action-btn btn-share" onclick="window.shareMassSet('${m.id}')">
                📤 Chia sẻ
              </button>
              <button type="button" class="action-btn btn-pdf" onclick="window.downloadMassSetPdfs('${m.id}')">
                📄 Tải PDF
              </button>
              <button type="button" class="action-btn btn-baidoc" onclick="window.openMassBaiDoc('${m.id}')">
                📖 Bài Đọc & Lời Nguyện
              </button>
              ${window.dohwaStore?.isAdmin() ? `
                <button type="button" class="action-btn btn-viewers" onclick="window.viewMassAttendance('${m.id}')">
                  👤 Ai đã xem
                </button>
              ` : ''}
              <button type="button" class="action-btn btn-view" onclick="window.dohwaApp.scrollToBaiDaSoan()">
                📚 Bài đã soạn
              </button>
              <button type="button" class="action-btn btn-baidoc" onclick="window.dohwaApp.openMemberGateModal()">
                📝 Chọn lại tên
              </button>
              ${window.dohwaStore?.isAdmin() ? `
                <button type="button" class="action-btn btn-edit" onclick="window.editMassSet('${m.id}')">
                  ✏️ Sửa
                </button>
                <button type="button" class="action-btn btn-delete" onclick="window.deleteMassSet('${m.id}')">
                  🗑️ Xóa
                </button>
              ` : ''}
            </div>
          </div>

          <!-- CỘT PHẢI: DANH SÁCH BÀI HÁT & FOOTER -->
          <div class="massset-card-right-part">
            ${songsHtml}
            <div class="massset-saved-footer-compact">
              <span>${songs.length} mục đã chọn</span>
              <span>Cập nhật ${updatedDate}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // --- KHO BỘ LỄ GỌN GÀNG (HIỂN THỊ 20-30 BỘ LỄ TRÊN 1 MÀN HÌNH) ---
  async loadMassSetsArchive() {
    const container = document.getElementById('massSetsArchiveContainer');
    if (!container) return;

    if (window.dohwaStore) {
      this.allMassSets = await window.dohwaStore.getAllMassSets();
    }

    if (!this.allMassSets || !this.allMassSets.length) {
      if (this.currentMassSet) this.allMassSets = [this.currentMassSet];
    }

    this.allMassSets.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    this.renderArchiveTable(this.allMassSets);
  }

  renderArchiveTable(massSets) {
    const container = document.getElementById('massSetsArchiveContainer');
    if (!container) return;

    if (!massSets.length) {
      container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted);">Không tìm thấy bộ lễ nào.</div>`;
      return;
    }

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; gap:10px; flex-wrap:wrap;">
        <input type="text" class="form-control" id="khoSearchInput" placeholder="🔍 Tìm kiếm theo tên lễ hoặc ngày..." style="max-width:320px; font-size:0.86rem; padding:7px 12px;" oninput="window.dohwaApp.filterKho(this.value)">
        <span style="font-size:0.84rem; color:var(--text-muted); font-weight:700;">Tổng cộng: ${massSets.length} bộ lễ</span>
      </div>

      <div class="kho-table-wrap">
        <table class="kho-table">
          <thead>
            <tr>
              <th style="width:36px; text-align:center;">#</th>
              <th style="width:105px;">Ngày</th>
              <th>Tên Bộ Lễ</th>
              <th style="width:110px;">Mùa Phụng Vụ</th>
              <th>Người Đọc</th>
              <th style="width:65px; text-align:center;">Bài Hát</th>
              <th style="width:100px; text-align:center;">Trạng Thái</th>
              <th style="text-align:center; width:180px;">Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            ${massSets.map((m, idx) => {
              const r = m.liturgicalRoles || {};
              const readersSummary = [r.reader1, r.psalmist, r.reader2, r.petitions].filter(Boolean).join(', ') || '---';
              const isCur = m.active || (this.currentMassSet && this.currentMassSet.id === m.id);

              return `
                <tr class="${isCur ? 'is-active-mass' : ''}">
                  <td style="text-align:center; color:var(--text-muted);">${idx + 1}</td>
                  <td style="font-weight:700; color:var(--primary);">${this.formatDisplayDate(m.date)}</td>
                  <td>
                    <div style="font-weight:700; color:var(--text-main); font-size:0.9rem;">${m.title}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${m.weekName || ''}</div>
                  </td>
                  <td><span class="kho-season-badge">${m.season || 'Thường Niên'}</span></td>
                  <td style="font-size:0.8rem; color:var(--text-muted); max-width:180px; overflow:hidden; text-overflow:ellipsis;" title="${readersSummary}">${readersSummary}</td>
                  <td style="text-align:center;"><span style="font-weight:700; color:#0284c7;">${(m.songs || []).length}</span> bài</td>
                  <td style="text-align:center;">
                    ${isCur ? '<span class="kho-badge-active">✓ Hiện tại</span>' : (window.dohwaStore?.isAdmin() ? `<button class="action-btn-sm" onclick="window.dohwaApp.setActiveMass('${m.id}')" title="Chọn làm bộ lễ hiện tại">📌 Chọn</button>` : '<span style="color:var(--text-muted); font-size:0.75rem;">—</span>')}
                  </td>
                  <td style="text-align:center;">
                    <div style="display:flex; justify-content:center; gap:4px;">
                      <button class="action-btn-sm" onclick="window.openFullViewModal('${m.id}')" title="Xem chi tiết">👁️</button>
                      ${window.dohwaStore?.isAdmin() ? `
                        <button class="action-btn-sm" onclick="window.openAiDaXemModal('${m.id}')" title="Ai đã xem bộ lễ này">👤</button>
                      ` : ''}
                      <button class="action-btn-sm" onclick="window.openMassBaiDoc('${m.id}')" title="Xem Bài Đọc & Lời Nguyện">📖</button>
                      <button class="action-btn-sm" onclick="window.shareMassSet('${m.id}')" title="Chia sẻ">📤</button>
                      ${window.dohwaStore?.isAdmin() ? `
                        <button class="action-btn-sm" onclick="window.editMassSet('${m.id}')" title="Sửa">✏️</button>
                        <button class="action-btn-sm" style="color:#ef4444;" onclick="window.deleteMassSet('${m.id}')" title="Xóa">🗑️</button>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  filterKho(keyword) {
    if (!this.allMassSets) return;
    const kw = (keyword || '').toLowerCase().trim();
    if (!kw) {
      this.renderArchiveTable(this.allMassSets);
      return;
    }
    const filtered = this.allMassSets.filter(m => 
      (m.title && m.title.toLowerCase().includes(kw)) ||
      (m.date && m.date.includes(kw)) ||
      (m.season && m.season.toLowerCase().includes(kw))
    );
    this.renderArchiveTable(filtered);
  }

  async setActiveMass(id) {
    if (window.dohwaStore) {
      await window.dohwaStore.setActiveMassSet(id);
    }
    await this.loadCurrentMassSet();
    await this.loadMassSetsArchive();

    const toast = document.createElement('div');
    toast.className = 'dohwa-toast';
    toast.textContent = '📌 Đã đặt làm Bộ Lễ Hiện Tại!';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);

    this.switchTab('tab-hientai');
  }

  // --- NÚT [ 📤 CHIA SẺ ] TỔNG HỢP VỚI TỰ ĐỘNG TẠO LINK RÚT GỌN SIÊU ĐẸP ---
  async shareMassSet(msId) {
    let ms = null;
    if (window.dohwaStore) {
      ms = await window.dohwaStore.get('mass_sets', msId);
    }
    if (!ms) ms = this.currentMassSet;
    if (!ms) return;

    const baseUrl = window.location.origin + window.location.pathname;
    const directUrl = `${baseUrl}?massId=${encodeURIComponent(ms.id)}`;

    // Kiểm tra cache link rút gọn đã tạo trước đó
    const cacheKey = `dohwa_short_${ms.id}`;
    let shareUrl = localStorage.getItem(cacheKey);

    if (!shareUrl || !shareUrl.startsWith('https://da.gd/')) {
      try {
        // Đặt tên slug rút gọn dễ nhớ (ví dụ: dohwa-25 hoặc dohwa-cn25)
        let candidateSlug = 'dohwa';
        if (ms.id === 'mass-cn-25-tn-a') {
          candidateSlug = 'dohwa-25';
        } else {
          const cleanId = ms.id.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toLowerCase();
          candidateSlug = `dohwa-${cleanId}`;
        }

        // Thử tạo link rút gọn với slug ưu tiên
        let shortRes = await fetch(`https://da.gd/s?url=${encodeURIComponent(directUrl)}&shorturl=${encodeURIComponent(candidateSlug)}`);
        let shortText = shortRes.ok ? (await shortRes.text()).trim() : '';
        
        if (shortText.startsWith('https://da.gd/')) {
          shareUrl = shortText;
        } else {
          // Nếu slug đã bị trùng thì tạo ngẫu nhiên
          let randomRes = await fetch(`https://da.gd/s?url=${encodeURIComponent(directUrl)}`);
          if (randomRes.ok) {
            let randText = (await randomRes.text()).trim();
            if (randText.startsWith('https://da.gd/')) {
              shareUrl = randText;
            }
          }
        }

        if (shareUrl && shareUrl.startsWith('https://da.gd/')) {
          localStorage.setItem(cacheKey, shareUrl);
        }
      } catch (e) {
        console.warn('Lỗi tạo link rút gọn:', e);
      }
    }

    if (!shareUrl) {
      shareUrl = directUrl;
    }

    const dateFormatted = this.formatDisplayDate(ms.date);
    const r = ms.liturgicalRoles || {};

    let text = `✝ ${ms.title.toUpperCase()}\n`;
    text += `🗓 Ngày cử hành: ${dateFormatted}\n`;
    text += `👥 Ca đoàn: Ca Đoàn Dohwa\n\n`;

    text += `📖 PHÂN CÔNG ĐỌC SÁCH & PHỤNG VỤ:\n`;
    text += `• Bài đọc 1: ${r.reader1 || '---'}\n`;
    text += `• Thánh Vịnh: ${r.psalmist || r.dapca || '---'}\n`;
    text += `• Bài đọc 2: ${r.reader2 || '---'}\n`;
    text += `• Lời Nguyện Tín Hữu: ${r.petitions || r.loinguyen || '---'}\n\n`;

    text += `🎶 BỘ LỄ VÀ NỐT NHẠC:\n`;
    (ms.songs || []).forEach((s, i) => {
      text += `${i + 1}. [${s.roleLabel || 'Bài hát'}] ${s.title}${s.composer ? ` - ${s.composer}` : ''}\n`;
    });

    text += `\n🔗 Link xem bộ lễ & nốt nhạc trực tiếp:\n${shareUrl}\n`;

    // 1. Sao chép vào Clipboard
    try {
      await navigator.clipboard.writeText(text);
      const toast = document.createElement('div');
      toast.className = 'dohwa-toast';
      toast.textContent = `📋 Đã sao chép link rút gọn: ${shareUrl}`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2500);
    } catch(e) {}

    // 2. Kích hoạt native share trên điện thoại nếu có
    if (navigator.share) {
      try {
        await navigator.share({
          title: ms.title,
          text: text,
          url: shareUrl
        });
      } catch (e) {}
    }
  }

  // --- NGHE TOÀN BỘ BÀI TRONG BỘ LỄ (PLAYLIST MODE) ---
  async playAllSongs(msId) {
    let ms = null;
    if (window.dohwaStore) {
      ms = await window.dohwaStore.get('mass_sets', msId);
    }
    if (!ms) ms = this.findMassSet(msId);
    if (!ms || !ms.songs || !ms.songs.length) return;

    if (window.dohwaPlayer) {
      window.dohwaPlayer.playMassSet(ms, null);
    }
  }

  async openFullViewModal(msId) {
    let ms = null;
    if (window.dohwaStore) {
      ms = await window.dohwaStore.get('mass_sets', msId);
    }
    if (!ms) ms = this.currentMassSet;
    if (!ms || !ms.songs || !ms.songs.length) {
      alert('Bộ lễ này chưa có bài hát nào!');
      return;
    }

    const modal = document.getElementById('fullViewModal');
    const container = document.getElementById('fullViewSongsList');
    const titleEl = document.getElementById('fullViewModalTitle');

    // Ghi nhận lượt xem riêng cho bộ lễ này
    if (window.dohwaStore) {
      const session = window.dohwaStore.getUserSession();
      if (session && session.name) {
        await window.dohwaStore.recordView(ms.id, session.name);
      }
    }

    if (titleEl) titleEl.textContent = ms.title;
    if (container) {
      container.innerHTML = ms.songs.map((s, idx) => `
        <div class="song-card" data-song-id="${s.id}" style="display:flex; justify-content:space-between; align-items:center; padding:12px; margin-bottom:8px; border:1px solid var(--border); border-radius:8px; background:var(--bg-card);">
          <div>
            <div style="font-weight:700; color:var(--text-main); font-size:0.95rem;">
              <span style="color:#6d28d9; margin-right:6px;">${idx + 1}. [${s.roleLabel || 'Bài hát'}]</span>
              ${s.title}
            </div>
            <div class="song-meta" style="font-size:0.82rem; color:var(--text-muted); margin-top:2px;">
              ${s.composer ? `<span>✍️ Nhạc sĩ: ${s.composer}</span>` : ''}
              ${s.pdfName ? `<span style="margin-left:8px;">📄 ${s.pdfName}</span>` : ''}
            </div>
          </div>
          <div class="song-actions" style="display:flex; gap:6px;">
            <button class="action-btn btn-view" style="font-size:0.78rem; padding:4px 8px;" onclick="window.dohwaPDFViewer.open('${s.pdfData || ''}', '${s.title}', '${s.pdfName || ''}')">📄 Nốt Nhạc</button>
            ${s.youtubeUrl ? `<button class="action-btn btn-play" style="font-size:0.78rem; padding:4px 8px;" onclick="window.dohwaPlayer.playSong(window.dohwaApp.findSongInMass('${ms.id}', '${s.id}'))">▶ Nghe</button>` : ''}
          </div>
        </div>
      `).join('');
    }

    if (modal) modal.style.display = 'flex';
  }

  closeFullViewModal() {
    const modal = document.getElementById('fullViewModal');
    if (modal) modal.style.display = 'none';
  }

  findSongInMass(msId, songId) {
    if (this.currentMassSet && this.currentMassSet.id === msId && this.currentMassSet.songs) {
      const found = this.currentMassSet.songs.find(s => s.id === songId);
      if (found) return found;
    }
    if (this.archiveMassSets && this.archiveMassSets.length) {
      const ms = this.archiveMassSets.find(m => m.id === msId);
      if (ms && ms.songs) {
        const found = ms.songs.find(s => s.id === songId);
        if (found) return found;
      }
    }
    if (this.currentMassSet && this.currentMassSet.songs) {
      const found = this.currentMassSet.songs.find(s => s.id === songId);
      if (found) return found;
    }
    return null;
  }

  findMassSet(id) {
    if (this.currentMassSet && this.currentMassSet.id === id) return this.currentMassSet;
    if (this.archiveMassSets && this.archiveMassSets.length) {
      const found = this.archiveMassSets.find(m => m.id === id);
      if (found) return found;
    }
    return this.currentMassSet;
  }

  async downloadAllPdfs(msId) {
    let ms = null;
    if (window.dohwaStore) {
      ms = await window.dohwaStore.get('mass_sets', msId);
    }
    if (!ms) ms = this.currentMassSet;
    if (!ms || !ms.songs) return;

    const pdfSongs = ms.songs.filter(s => s.pdfData);
    if (!pdfSongs.length) {
      const firstSong = ms.songs[0];
      if (firstSong && window.dohwaPDFViewer) {
        window.dohwaPDFViewer.open(firstSong.pdfData, firstSong.title, firstSong.pdfName);
      } else {
        alert('Bộ lễ này chưa có file PDF nào!');
      }
      return;
    }

    pdfSongs.forEach(s => {
      const a = document.createElement('a');
      a.href = s.pdfData;
      a.download = s.pdfName || `${s.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  }

  viewAttendance(msId) {
    this.openAiDaXemModal(msId);
  }

  async editMassSet(msId) {
    if (window.dohwaStore && !window.dohwaStore.isAdmin()) {
      this.openAdminLoginModal(() => this.editMassSet(msId));
      return;
    }

    let ms = null;
    if (window.dohwaStore) {
      ms = await window.dohwaStore.get('mass_sets', msId);
    }
    if (!ms) ms = this.currentMassSet;
    if (!ms) return;

    const titleEl = document.getElementById('soanMassTitle');
    const dateEl = document.getElementById('soanMassDate');
    const seasonEl = document.getElementById('soanMassSeason');

    if (titleEl) titleEl.value = ms.title;
    if (dateEl) dateEl.value = ms.date;
    if (seasonEl) seasonEl.value = ms.season || 'Mùa Thường Niên';

    const r = ms.liturgicalRoles || {};
    if (window.dohwaSoanLe) {
      window.dohwaSoanLe.liturgicalRoles.forEach(role => {
        const val = r[role.key] || '';
        const sel = document.getElementById(`soan-role-select-${role.key}`);
        const inp = document.getElementById(`soan-role-${role.key}`);
        if (sel) {
          if (Array.from(sel.options).some(o => o.value === val)) {
            sel.value = val;
          } else if (val) {
            sel.value = '__custom__';
            if (inp) { inp.style.display = 'block'; inp.value = val; }
          }
        }
      });

      window.dohwaSoanLe.uploadedSongs = [...(ms.songs || [])];
      window.dohwaSoanLe.renderUploadedSlots();
    }

    this.switchTab('tab-soanle');
  }

  async deleteMass(id) {
    if (window.dohwaStore && !window.dohwaStore.isAdmin()) {
      this.openAdminLoginModal(() => this.deleteMass(id));
      return;
    }

    if (confirm('Bạn có chắc chắn muốn xóa bộ lễ này?')) {
      if (window.dohwaStore) {
        await window.dohwaStore.deleteMassSet(id);
      }
      await this.loadCurrentMassSet();
      await this.loadMassSetsArchive();
    }
  }

  // ==========================================
  // CỔNG XÁC THỰC CA VIÊN VÀO PHÒNG (MEMBER GATE - BẮT BUỘC ĐỂ VÀO BỘ LỄ)
  // ==========================================
  async checkMemberGate() {
    const modal = document.getElementById('sbMemberGateOverlay');
    const badge = document.getElementById('userHeaderBadge');
    const isAdmin = window.dohwaStore?.isAdmin();
    const session = window.dohwaStore?.getUserSession();

    // 1. Nếu là Admin: luôn được vào thẳng
    if (isAdmin || (session && (session.memberId === 'admin' || session.isAdmin))) {
      if (modal) modal.style.display = 'none';
      if (badge) badge.innerHTML = `👑 <span>Admin</span>`;
      return true;
    }

    // 2. Lấy danh sách ca viên hiện tại
    const roster = await window.dohwaStore.getRoster();

    // 3. Nếu đã có session ca viên: kiểm tra ca viên đó có tồn tại trong danh sách thật và không bị khóa
    if (session && session.memberId) {
      const current = roster.find(m => m.id === session.memberId);
      if (current && !current.banned) {
        // Hợp lệ: Cho phép truy cập bộ lễ
        if (modal) modal.style.display = 'none';
        if (badge) badge.innerHTML = `👤 <span>${current.name}</span>`;
        return true;
      } else {
        // Tên này đã bị xóa hoặc bị khóa: hủy session và bắt chọn lại
        window.dohwaStore.setUserSession(null);
      }
    }

    // 4. CHƯA CHỌN TÊN HOẶC CHƯA CÓ QUYỀN: BẮT BUỘC HIỂN THỊ CỔNG CHỌN TÊN (GATE) CHẶN TOÀN BỘ WEB
    this.openMemberGateModal();
    return false;
  }

  async openMemberGateModal() {
    const modal = document.getElementById('sbMemberGateOverlay');
    if (!modal) return;
    modal.style.display = 'flex';
    await this.renderMemberGateGrid();
  }

  async renderMemberGateGrid() {
    const grid = document.getElementById('memberGateButtonsGrid');
    const subNotice = document.getElementById('memberGateSubNotice');
    if (!grid) return;
    const roster = await window.dohwaStore.getRoster();
    const curDev = window.dohwaStore.getDeviceId();

    if (!roster || roster.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:22px 14px; background:#fff7ed; border:1px dashed #f97316; border-radius:14px; margin-bottom:8px;">
          <div style="font-size:1.8rem; margin-bottom:6px;">🔒</div>
          <div style="font-size:0.95rem; font-weight:800; color:#9a3412; margin-bottom:6px;">Phòng Đang Khóa</div>
          <div style="font-size:0.83rem; color:#78350f; line-height:1.5;">
            Chưa có danh sách ca viên nào được thiết lập.<br>
            Bạn cần có tên trong danh sách ca viên mới có thể xem bộ lễ.<br><br>
            <span style="font-weight:700;">Nếu bạn là Ca Trưởng / Admin, vui lòng bấm nút "👑 BẠN LÀ ADMIN?" ở trên để đăng nhập và thiết lập danh sách ca viên.</span>
          </div>
        </div>
      `;
      if (subNotice) subNotice.style.display = 'none';
      return;
    }

    if (subNotice) subNotice.style.display = 'block';

    grid.innerHTML = roster.map(m => {
      const isCurrentDev = m.lockDeviceId === curDev;
      const isLockedOther = m.claimed && m.lockDeviceId && m.lockDeviceId !== curDev;
      const isBanned = !!m.banned;

      let btnStyle = `padding:10px 8px; border-radius:10px; font-weight:700; font-size:0.85rem; border:1px solid; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:3px; transition:all 0.2s;`;
      let disabled = false;
      let note = '';

      if (isBanned) {
        btnStyle += `background:#fef2f2; border-color:#fecaca; color:#991b1b; opacity:0.6; cursor:not-allowed;`;
        disabled = true;
        note = '🚫 Đã bị cấm';
      } else if (isLockedOther) {
        btnStyle += `background:#f1f5f9; border-color:#cbd5e1; color:#64748b; opacity:0.75; cursor:not-allowed;`;
        disabled = true;
        note = '🔒 Máy khác đã nhận';
      } else if (isCurrentDev) {
        btnStyle += `background:rgba(107,63,160,0.12); border-color:var(--primary); color:var(--primary); font-weight:800;`;
        note = '✓ Thiết bị này';
      } else {
        btnStyle += `background:var(--bg-card,#fff); border-color:var(--border); color:var(--text-main);`;
      }

      return `
        <button type="button" 
          ${disabled ? 'disabled' : ''} 
          style="${btnStyle}" 
          onclick="window.dohwaApp.selectMemberFromGate('${m.id}')"
          class="member-gate-btn"
        >
          <span style="font-size:0.95rem; font-weight:700;">👤 ${m.name}</span>
          ${note ? `<span style="font-size:0.72rem; opacity:0.85;">${note}</span>` : ''}
        </button>
      `;
    }).join('');
  }

  async selectMemberFromGate(memberId) {
    const pWrap = document.getElementById('memberGateProgressWrap');
    const pBar = document.getElementById('memberGateProgressBar');
    const pText = document.getElementById('memberGateProgressText');
    const errEl = document.getElementById('memberGateError');
    if (errEl) errEl.style.display = 'none';

    if (pWrap && pBar) {
      pWrap.style.display = 'block';
      pBar.style.width = '30%';
      if (pText) pText.textContent = '⏳ Đang xác thực thiết bị...';
    }

    try {
      if (pBar) pBar.style.width = '70%';
      await new Promise(r => setTimeout(r, 260));

      const member = await window.dohwaStore.claimMember(memberId);
      if (pBar) pBar.style.width = '100%';
      if (pText) pText.textContent = `✅ Thành công! Xin chào ${member.name}`;

      await new Promise(r => setTimeout(r, 360));

      const modal = document.getElementById('sbMemberGateOverlay');
      if (modal) modal.style.display = 'none';
      if (pWrap) {
        pWrap.style.display = 'none';
        if (pBar) pBar.style.width = '0%';
      }

      const badge = document.getElementById('userHeaderBadge');
      if (badge) {
        badge.innerHTML = `👤 <span>${member.name}</span>`;
      }
      this.updateAdminUI();

      // Ghi nhận chuyên cần riêng cho bộ lễ hiện tại
      if (this.currentMassSet && window.dohwaStore) {
        await window.dohwaStore.recordView(this.currentMassSet.id, member.name);
      }

      const toast = document.createElement('div');
      toast.className = 'dohwa-toast';
      toast.textContent = `👋 Chào ${member.name}! Thiết bị đã được kết nối thành công.`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2500);

    } catch (err) {
      if (pWrap) pWrap.style.display = 'none';
      if (errEl) {
        errEl.textContent = err.message || 'Lỗi kết nối thiết bị!';
        errEl.style.display = 'block';
      }
    }
  }

  // ==========================================
  // ADMIN AUTHENTICATION & UI MANAGEMENT
  // ==========================================
  handleUserBadgeClick() {
    if (window.dohwaStore?.isAdmin()) {
      this.openCaiDatModal();
    } else {
      this.openMemberGateModal();
    }
  }

  handleAdminClick() {
    if (window.dohwaStore?.isAdmin()) {
      this.openCaiDatModal();
    } else {
      this.openAdminLoginModal(() => this.openCaiDatModal());
    }
  }

  updateAdminUI() {
    const isAdmin = !!window.dohwaStore?.isAdmin();
    const adminWrap = document.getElementById('adminHeaderBadgeWrap');
    const badge = document.getElementById('userHeaderBadge');
    const openCaiDatBtn = document.getElementById('openCaiDatBtn');

    if (isAdmin) {
      document.body.classList.add('is-admin');
      // Khi là Admin: hiển thị nút 👑 Admin trong header, ẩn badge chọn tên
      if (badge) badge.style.display = 'none';
      if (openCaiDatBtn) openCaiDatBtn.style.display = 'inline-flex';
      if (adminWrap) {
        adminWrap.style.display = 'inline-flex';
        adminWrap.innerHTML = `
          <button type="button" class="btn-xs" onclick="window.dohwaApp.handleAdminClick()" style="background:linear-gradient(135deg,#78350f,#d97706); color:#fff; border:1px solid #f59e0b; padding:5px 12px; font-weight:800; border-radius:8px; font-size:0.8rem; display:inline-flex; align-items:center; gap:5px; cursor:pointer;" title="Bấm để mở Cài Đặt / Đăng xuất">
            👑 <span>Admin</span>
          </button>
        `;
      }
    } else {
      document.body.classList.remove('is-admin');
      // Khi là ca viên: hiển thị tên ca viên, TUYỆT ĐỐI ẨN nút Admin/Quản trị và nút Cài đặt
      if (adminWrap) {
        adminWrap.style.display = 'none';
        adminWrap.innerHTML = '';
      }
      if (openCaiDatBtn) {
        openCaiDatBtn.style.display = 'none';
      }
      if (badge) {
        badge.style.display = 'inline-flex';
        const session = window.dohwaStore?.getUserSession();
        if (session && session.name) {
          badge.innerHTML = `👤 <span>${session.name}</span>`;
        } else {
          badge.innerHTML = `👤 <span>Chọn tên</span>`;
        }
      }
    }

    // Ẩn/Hiện toàn bộ các tab và nút chỉ dành cho Admin (Top Nav, Bottom Nav)
    document.querySelectorAll('.admin-only, .admin-only-tab').forEach(el => {
      if (isAdmin) {
        if (el.classList.contains('nav-item')) {
          el.style.display = 'flex';
        } else {
          el.style.display = 'inline-flex';
        }
      } else {
        el.style.display = 'none';
      }
    });

    const bNavText = document.getElementById('bottomNavAdminText');
    const bNavIcon = document.getElementById('bottomNavAdminIcon');
    if (bNavText) bNavText.textContent = 'Admin';
    if (bNavIcon) bNavIcon.textContent = '👑';

    const topAdminText = document.getElementById('topTabAdminText');
    const topAdminIcon = document.getElementById('topTabAdminIcon');
    if (topAdminText) topAdminText.textContent = 'Admin';
    if (topAdminIcon) topAdminIcon.textContent = '👑';

    const khoBtn = document.getElementById('khoSoanMoiBtn');
    if (khoBtn) khoBtn.style.display = isAdmin ? 'inline-flex' : 'none';

    // Ẩn tất cả nút 'Ai đã xem' trên mass cards nếu không phải admin
    document.querySelectorAll('.btn-viewers').forEach(btn => {
      btn.style.display = isAdmin ? 'inline-flex' : 'none';
    });
  }

  openAdminLoginModal(onSuccessCallback = null) {
    this.adminLoginSuccessCallback = onSuccessCallback;
    const modal = document.getElementById('adminLoginModalOverlay');
    const input = document.getElementById('adminPinInput');
    const err = document.getElementById('adminPinError');
    if (input) input.value = '';
    if (err) err.style.display = 'none';
    if (modal) modal.style.display = 'flex';
    if (input) setTimeout(() => input.focus(), 100);
  }

  closeAdminLoginModal() {
    const modal = document.getElementById('adminLoginModalOverlay');
    if (modal) modal.style.display = 'none';
    this.adminLoginSuccessCallback = null;
    this.checkMemberGate();
  }

  submitAdminLogin() {
    const input = document.getElementById('adminPinInput');
    const err = document.getElementById('adminPinError');
    const pin = input ? input.value.trim() : '';

    if (!pin) {
      if (err) { err.textContent = 'Vui lòng nhập mã PIN!'; err.style.display = 'block'; }
      return;
    }

    const success = window.dohwaStore?.loginAdmin(pin);
    if (success) {
      this.closeAdminLoginModal();
      
      // Đóng luôn popup chọn tên ca viên nếu đang mở
      const gateModal = document.getElementById('sbMemberGateOverlay');
      if (gateModal) gateModal.style.display = 'none';

      // Tự động hiển thị nick là Admin
      const badge = document.getElementById('userHeaderBadge');
      if (badge) {
        badge.innerHTML = `👑 <span>Admin</span>`;
      }

      this.updateAdminUI();
      this.loadCurrentMassSet();
      this.loadMassSetsArchive();

      if (document.getElementById('caiDatModal')?.style.display === 'flex') {
        this.renderCaiDatContent();
      }

      const toast = document.createElement('div');
      toast.className = 'dohwa-toast';
      toast.textContent = `👑 Đã đăng nhập quyền Admin thành công!`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2500);

      if (typeof this.adminLoginSuccessCallback === 'function') {
        const cb = this.adminLoginSuccessCallback;
        this.adminLoginSuccessCallback = null;
        cb();
      }
    } else {
      if (err) {
        err.textContent = 'Mã PIN không đúng, vui lòng thử lại!';
        err.style.display = 'block';
      }
    }
  }

  logoutAdmin() {
    if (confirm('Bạn có muốn đăng xuất quyền Admin và quay lại chế độ thành viên chỉ xem?')) {
      window.dohwaStore?.logoutAdmin();
      const badge = document.getElementById('userHeaderBadge');
      if (badge) {
        badge.innerHTML = `👤 <span>Chọn tên</span>`;
      }
      this.updateAdminUI();
      this.closeCaiDatModal();
      this.loadCurrentMassSet();
      this.loadMassSetsArchive();
      this.switchTab('tab-hientai');

      const toast = document.createElement('div');
      toast.className = 'dohwa-toast';
      toast.textContent = `👋 Đã trở về chế độ thành viên chỉ xem!`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2500);
    }
  }

  openAdminMenuModal() {
    this.openCaiDatModal();
  }

  changeAdminPin() {
    const inp = document.getElementById('settingNewAdminPin');
    if (!inp || !inp.value.trim()) {
      alert('Vui lòng nhập mã PIN mới (ít nhất 4 số)!');
      return;
    }
    try {
      window.dohwaStore?.setAdminPin(inp.value.trim());
      inp.value = '';
      alert('✅ Đã cập nhật mã PIN Admin mới thành công! Hãy ghi nhớ mã PIN này.');
    } catch(err) {
      alert(err.message || 'Lỗi đặt mã PIN!');
    }
  }

  async clearEntireRoster() {
    if (confirm('⚠️ BẠN CÓ CHẮC CHẮN MUỐN XÓA SẠCH TOÀN BỘ DANH SÁCH CA VIÊN?\n\nThao tác này sẽ xóa toàn bộ ca viên cũ (bao gồm cả Kính Nguyễn và các nick đã lưu) để bạn dán và thiết lập một danh sách ca viên hoàn toàn mới.\n\nSau khi xóa, danh sách sẽ được lưu một lần để dùng mãi mãi.')) {
      await window.dohwaStore?.clearEntireRoster();
      
      const curSession = window.dohwaStore?.getUserSession();
      if (curSession && curSession.memberId !== 'admin') {
        window.dohwaStore?.setUserSession(null);
        const badge = document.getElementById('userHeaderBadge');
        if (badge) badge.innerHTML = `👤 <span>Chọn tên</span>`;
      }

      await this.renderCaiDatContent();
      const textarea = document.getElementById('settingRosterBatchInput');
      if (textarea) {
        textarea.value = '';
        textarea.focus();
      }
      alert('🗑️ Đã xóa sạch toàn bộ danh sách cũ!\n\nBây giờ bạn hãy dán danh sách ca viên mới vào ô (mỗi dòng 1 tên) và bấm "💾 Lưu Danh Sách Ca Viên".');
    }
  }

  // ==========================================
  // MODAL CÀI ĐẶT (QUẢN LÝ CA VIÊN & THIẾT LẬP MÁY NÀY)
  // ==========================================
  async openCaiDatModal() {
    if (window.dohwaStore && !window.dohwaStore.isAdmin()) {
      this.openAdminLoginModal(() => this.openCaiDatModal());
      return;
    }

    let modal = document.getElementById('caiDatModal');
    if (!modal) return;

    await this.renderCaiDatContent();
    modal.style.display = 'flex';
  }

  closeCaiDatModal() {
    const modal = document.getElementById('caiDatModal');
    if (modal) modal.style.display = 'none';
  }

  async renderCaiDatContent() {
    const container = document.getElementById('caiDatBody');
    if (!container) return;

    let roster = [];
    if (window.dohwaStore) {
      roster = await window.dohwaStore.getRoster();
    }
    const currentSession = window.dohwaStore?.getUserSession() || null;
    const curDev = window.dohwaStore?.getDeviceId() || '';
    const isAdmin = window.dohwaStore?.isAdmin();

    // Chuẩn bị danh sách tên mỗi dòng 1 tên
    const defaultBatchText = roster.map(m => m.name).join('\n');
    const curFirebaseUrl = window.dohwaStore ? window.dohwaStore.getFirebaseUrl() : '';
    const hasCloud = !!curFirebaseUrl;

    let cloudSyncCard = '';
    if (isAdmin) {
      cloudSyncCard = `
        <!-- CẤU HÌNH ĐỒNG BỘ ĐÁM MÂY (FIREBASE REALTIME SYNC) -->
        <div style="background:var(--bg-card-subtle); border:1.5px solid #0284c7; border-radius:12px; padding:14px; margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-wrap:wrap; gap:6px;">
            <h4 style="font-size:0.95rem; font-weight:800; color:#0284c7; margin:0; display:flex; align-items:center; gap:6px;">
              ☁️ Đồng Bộ Đám Mây Tự Động (Cloud Sync)
            </h4>
            <span id="cloudStatusBadge" style="font-size:0.75rem; font-weight:700; padding:3px 8px; border-radius:6px; ${hasCloud ? 'background:#dcfce7; color:#15803d;' : 'background:#fee2e2; color:#b91c1c;'}">
              ${hasCloud ? '🟢 Đã kết nối Cloud' : '⚪ Chưa kết nối Cloud'}
            </span>
          </div>
          <p style="font-size:0.78rem; color:var(--text-muted); margin-bottom:10px;">
            Đồng bộ thời gian thực dữ liệu danh sách ca viên & bộ lễ giữa máy tính của bạn và điện thoại của tất cả ca viên (Google Firebase miễn phí 100%).
          </p>

          <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:10px;">
            <input type="text" id="settingFirebaseUrlInput" class="form-control" placeholder="https://<tên-dự-án>-default-rtdb.firebaseio.com" value="${curFirebaseUrl}" style="flex:1; min-width:240px; font-size:0.84rem; padding:7px 10px; border-radius:8px; border:1px solid var(--border);">
            <button type="button" class="btn btn-primary" onclick="window.dohwaApp.saveAndTestFirebaseConfig()" style="font-size:0.82rem; padding:7px 14px; font-weight:800; background:#0284c7; border-radius:8px; cursor:pointer;">
              🔗 Kết Nối Cloud
            </button>
          </div>

          <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
            <button type="button" class="btn-xs btn-outline" onclick="window.dohwaApp.pushLocalDataToCloud()" style="color:#0284c7; border-color:#38bdf8; font-size:0.78rem; font-weight:700; padding:6px 12px; border-radius:8px; cursor:pointer;">
              ⬆️ Đẩy Dữ Liệu Máy Này Lên Cloud
            </button>
            <button type="button" class="btn-xs btn-outline" onclick="window.dohwaApp.pullCloudDataToLocal()" style="color:#059669; border-color:#34d399; font-size:0.78rem; font-weight:700; padding:6px 12px; border-radius:8px; cursor:pointer;">
              ⬇️ Tải Dữ Liệu Mới Nhất Từ Cloud
            </button>
          </div>
        </div>
      `;
    }

    let adminBanner = '';
    if (isAdmin) {
      adminBanner = `
        <div style="background:linear-gradient(135deg, rgba(120,53,15,0.08), rgba(217,119,6,0.12)); border:2px solid #f59e0b; border-radius:12px; padding:12px 16px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:1.8rem;">👑</span>
            <div>
              <div style="font-size:1rem; font-weight:900; color:#b45309;">Bạn Đang Quản Trị Với Quyền ADMIN</div>
              <div style="font-size:0.76rem; color:#78350f;">Toàn quyền sửa / xóa bộ lễ, soạn lễ mới và thiết lập danh sách ca viên</div>
            </div>
          </div>
          <button type="button" class="btn-xs btn-outline" onclick="window.dohwaApp.logoutAdmin()" style="color:#ef4444; border-color:#f87171; font-weight:800; padding:6px 12px; border-radius:8px; background:#fff; cursor:pointer;">
            🚪 Đăng Xuất Admin
          </button>
        </div>
      `;
    } else {
      adminBanner = `
        <div style="background:#fffbeb; border:2px solid #f59e0b; border-radius:12px; padding:14px 16px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:1.8rem;">🔐</span>
            <div>
              <div style="font-size:0.95rem; font-weight:900; color:#92400e;">Đang ở chế độ Ca Viên (${currentSession ? currentSession.name : 'Chưa chọn tên'})</div>
              <div style="font-size:0.76rem; color:#78350f;">Đăng nhập quyền Admin để toàn quyền quản trị, xóa/dán danh sách ca viên</div>
            </div>
          </div>
          <button type="button" class="btn btn-primary" onclick="window.dohwaApp.openAdminLoginModal()" style="background:linear-gradient(135deg,#78350f,#d97706); border:none; color:#fff; font-weight:800; padding:8px 16px; font-size:0.85rem; border-radius:10px; box-shadow:0 4px 12px rgba(217,119,6,0.3); cursor:pointer;">
            👑 BẤM ĐÂY ĐỂ ĐĂNG NHẬP ADMIN
          </button>
        </div>
      `;
    }

    container.innerHTML = `
      ${adminBanner}
      ${cloudSyncCard}

      <!-- THÔNG TIN CA VIÊN TRÊN MÁY NÀY -->
      <div style="background:var(--bg-card-subtle); border:1px solid var(--border); border-radius:12px; padding:10px 14px; margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:1.2rem;">👤</span>
            <div>
              <div style="font-size:0.9rem; font-weight:800; color:var(--text-main);">
                Nick máy này: <strong>${currentSession ? currentSession.name : '<span style="color:#d97706;">Chưa chọn tên</span>'}</strong>
              </div>
              <div style="font-size:0.74rem; color:var(--text-muted);">
                ${currentSession ? '✓ Thiết bị này đã liên kết' : 'Mỗi ca viên chỉ cần chọn tên 1 lần đầu tiên'}
              </div>
            </div>
          </div>
          <button type="button" class="btn-xs btn-outline" onclick="window.dohwaApp.closeCaiDatModal(); window.dohwaApp.openMemberGateModal();" style="font-size:0.78rem; padding:5px 12px; font-weight:700; border-radius:8px;">
            🔄 Đổi / Chọn Tên
          </button>
        </div>
      </div>

      <!-- KHUNG NHẬP DANH SÁCH CA VIÊN MỖI DÒNG MỘT TÊN -->
      <div style="background:var(--bg-card-subtle); border:1px solid var(--border); border-radius:12px; padding:14px; margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <h4 style="font-size:0.95rem; font-weight:800; color:var(--text-main); margin:0;">
            📝 Danh Sách Ca Viên Ca Đoàn
          </h4>
          <span style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">${roster.length} thành viên</span>
        </div>
        <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:8px;">
          Mỗi dòng một tên. Khi bạn xóa tên ai khỏi khung này và bấm <strong>"Lưu Danh Sách"</strong>, tên người đó sẽ bị xóa hoàn toàn khỏi ca đoàn:
        </p>
        <textarea id="settingRosterBatchInput" class="form-control" rows="6" style="width:100%; font-size:0.88rem; font-family:inherit; resize:vertical; padding:10px 12px; border-radius:10px; border:1px solid var(--border); margin-bottom:10px;" placeholder="Đôn Đôn&#10;Hồ Hoàng&#10;Kính Nguyễn...">${defaultBatchText}</textarea>
        
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
          <button type="button" class="btn-xs btn-outline" onclick="window.dohwaApp.clearEntireRoster()" style="color:#ef4444; border-color:#fca5a5; font-size:0.8rem; padding:8px 14px; font-weight:800; border-radius:8px; background:#fff; cursor:pointer;" title="Xóa sạch toàn bộ danh sách cũ để dán danh sách mới">
            🗑️ Xóa Sạch Danh Sách (Thiết lập danh sách mới)
          </button>
          <button type="button" class="btn btn-primary" onclick="window.dohwaApp.saveRosterFromCaiDat()" style="font-size:0.85rem; padding:8px 20px; font-weight:800; background:#6b3fa0; border-radius:8px; cursor:pointer;">
            💾 Lưu Danh Sách Ca Viên
          </button>
        </div>
      </div>

      <!-- BẢNG THEO DÕI VÀ THAO TÁC CA VIÊN -->
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <h4 style="font-size:0.92rem; font-weight:800; color:var(--text-main); margin:0;">
            👥 Trạng Thái Chọn Tên & Lượt Vào
          </h4>
          <span style="font-size:0.74rem; color:var(--text-muted);">Tự động cập nhật khi ca viên truy cập</span>
        </div>

        <div style="max-height:280px; overflow-y:auto; border:1px solid var(--border); border-radius:10px;">
          <table style="width:100%; border-collapse:collapse; font-size:0.84rem;">
            <thead>
              <tr style="background:var(--bg-card-subtle); border-bottom:1px solid var(--border); position:sticky; top:0; z-index:1; color:var(--text-muted); font-size:0.78rem;">
                <th style="padding:8px 10px; text-align:left;">Họ và Tên</th>
                <th style="padding:8px 8px; text-align:center;">Trạng Thái</th>
                <th style="padding:8px 8px; text-align:center;">Lượt Vào</th>
                <th style="padding:8px 8px; text-align:center;">Lần Cuối</th>
                <th style="padding:8px 8px; text-align:center; min-width:140px;">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              ${roster.map(m => {
                const isCur = m.lockDeviceId === curDev || (currentSession && currentSession.memberId === m.id);
                const isClaimed = !!m.claimed;

                let statusTag = '';
                if (isCur) {
                  statusTag = `<span style="color:#16a34a; font-weight:700; font-size:0.75rem;">✓ Máy này</span>`;
                } else if (isClaimed) {
                  statusTag = `<span style="color:#ef4444; font-weight:700; font-size:0.75rem;">Đã chọn</span>`;
                } else {
                  statusTag = `<span style="color:#16a34a; font-weight:700; font-size:0.75rem;">Chưa chọn</span>`;
                }

                let lastDate = 'Chưa vào';
                if (m.lastVisitAt) {
                  const d = new Date(m.lastVisitAt);
                  lastDate = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
                }

                return `
                  <tr style="border-bottom:1px solid var(--border); ${isCur ? 'background:rgba(107,63,160,0.04);' : ''}">
                    <td style="padding:8px 10px; font-weight:700; color:var(--text-main);">
                      ${m.name} ${isCur ? '<span style="font-size:0.7rem; color:var(--primary); font-weight:700;">(Bạn)</span>' : ''}
                    </td>
                    <td style="padding:8px 8px; text-align:center;">${statusTag}</td>
                    <td style="padding:8px 8px; text-align:center; font-weight:700; color:#475569;">${m.totalVisits || 0}</td>
                    <td style="padding:8px 8px; text-align:center; color:#64748b; font-size:0.78rem;">${lastDate}</td>
                    <td style="padding:8px 8px; text-align:center;">
                      <div style="display:flex; justify-content:center; gap:4px; flex-wrap:wrap;">
                        ${isClaimed ? `
                          <button type="button" class="btn-xs btn-outline" title="Mở khóa nếu ca viên đổi điện thoại" onclick="window.dohwaApp.unlockMemberDevice('${m.id}')" style="padding:2px 6px; font-size:0.72rem; color:#d97706; border-color:#d97706;">
                            🔓 Mở khóa
                          </button>
                        ` : ''}
                        <button type="button" class="btn-xs btn-outline" title="Gán hoặc đổi sang ca viên này trên thiết bị này" onclick="window.dohwaApp.claimMemberForCurrentDevice('${m.id}')" style="padding:2px 6px; font-size:0.72rem; color:#6b3fa0; border-color:#6b3fa0;">
                          🔄 Chọn lại
                        </button>
                        <button type="button" class="btn-icon" title="Xóa ca viên khỏi danh sách" style="color:#ef4444; width:22px; height:22px; font-size:0.78rem;" onclick="window.dohwaApp.deleteMemberFromRoster('${m.id}')">
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- PHẦN THIẾT LẬP BẢO MẬT & MÃ PIN QUẢN TRỊ -->
      <div style="background:var(--bg-card-subtle); border:1px solid var(--border); border-radius:12px; padding:14px; margin-top:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <h4 style="font-size:0.92rem; font-weight:800; color:var(--text-main); margin:0;">
            🔐 Thiết Lập Mã PIN Ca Trưởng / Admin
          </h4>
          <span style="font-size:0.75rem; color:#16a34a; font-weight:700;">👑 Đang đăng nhập Admin</span>
        </div>
        <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:10px;">
          Chỉ người có mã PIN này mới được quyền Soạn bộ lễ, Sửa/Xóa bộ lễ và Chỉnh sửa danh sách ca viên. Thành viên bình thường không có mã PIN chỉ có thể xem lễ và tải PDF.
        </p>
        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:12px;">
          <input type="text" id="settingNewAdminPin" class="form-control" placeholder="Nhập mã PIN mới (ít nhất 4 số)..." style="font-size:0.85rem; max-width:240px; padding:6px 10px; border-radius:8px;">
          <button type="button" class="btn btn-outline" onclick="window.dohwaApp.changeAdminPin()" style="font-size:0.82rem; padding:6px 14px; font-weight:700;">
            💾 Cập Nhật Mã PIN
          </button>
        </div>
        <div style="border-top:1px solid var(--border); padding-top:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <span style="font-size:0.75rem; color:var(--text-muted);">Bảo mật quản trị ca đoàn</span>
          <button type="button" class="btn-xs btn-outline" onclick="window.dohwaApp.logoutAdmin()" style="color:#ef4444; border-color:#ef4444; padding:5px 12px; font-size:0.78rem; font-weight:700;">
            🚪 Đăng Xuất Quyền Admin (Về chế độ thành viên)
          </button>
        </div>
      </div>
    `;
  }

  // Lưu danh sách ca viên từ Textarea Cài Đặt (Xóa tên = Xóa hoàn toàn khỏi ca đoàn)
  async saveRosterFromCaiDat() {
    const textarea = document.getElementById('settingRosterBatchInput');
    if (!textarea || !textarea.value.trim()) {
      alert('Vui lòng nhập danh sách ca viên!');
      return;
    }

    const lines = textarea.value.split('\n').map(s => s.trim()).filter(Boolean);
    const unique = [...new Set(lines)];
    if (unique.length === 0) {
      alert('Danh sách không có tên hợp lệ!');
      return;
    }

    await window.dohwaStore.updateRosterFromNames(unique);
    await this.renderCaiDatContent();
    if (window.dohwaSoanLe) {
      window.dohwaSoanLe.renderDutyInputs();
    }

    const toast = document.createElement('div');
    toast.className = 'dohwa-toast';
    toast.textContent = `💾 Đã lưu danh sách ${unique.length} ca viên thành công!`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  // --- CLOUD SYNC ACTIONS (FIREBASE REALTIME DATABASE) ---
  async saveAndTestFirebaseConfig() {
    const inp = document.getElementById('settingFirebaseUrlInput');
    const val = inp ? inp.value.trim() : '';
    if (!val) {
      if (confirm('Bạn có muốn gỡ bỏ kết nối Cloud và chỉ dùng bộ nhớ cục bộ trên máy?')) {
        window.dohwaStore.setFirebaseUrl('');
        alert('Đã gỡ kết nối Cloud.');
        await this.renderCaiDatContent();
      }
      return;
    }

    try {
      await window.dohwaStore.testCloudConnection(val);
      window.dohwaStore.setFirebaseUrl(val);
      await window.dohwaStore.pushAllToCloud();
      alert('🎉 Kết nối Google Firebase Cloud thành công!\n\nToàn bộ danh sách ca viên và bộ lễ trên máy này đã được đồng bộ lên Cloud. Mọi điện thoại ca viên mở web sẽ tự động nhận dữ liệu này!');
      await this.renderCaiDatContent();
    } catch (err) {
      alert('❌ Lỗi kết nối Firebase:\n' + err.message + '\n\nVui lòng kiểm tra lại URL hoặc đảm bảo Rules trong Firebase Realtime Database đã mở (.read: true, .write: true).');
    }
  }

  async pushLocalDataToCloud() {
    if (!window.dohwaStore.getFirebaseUrl()) {
      alert('Vui lòng kết nối Firebase URL trước!');
      return;
    }
    const ok = await window.dohwaStore.pushAllToCloud();
    if (ok) {
      alert('✓ Đã tải toàn bộ danh sách ca viên và bộ lễ máy này lên Cloud thành công!');
    } else {
      alert('❌ Lỗi khi đẩy dữ liệu lên Cloud. Vui lòng kiểm tra lại kết nối mạng hoặc Firebase URL.');
    }
  }

  async pullCloudDataToLocal() {
    if (!window.dohwaStore.getFirebaseUrl()) {
      alert('Vui lòng kết nối Firebase URL trước!');
      return;
    }
    const ok = await window.dohwaStore.syncAllFromCloud();
    if (ok) {
      alert('✓ Đã tải dữ liệu mới nhất từ Cloud về máy!');
      await this.loadCurrentMassSet();
      await this.loadMassSetsArchive();
      await this.renderBaiDaSoanTrongNam();
      await this.renderCaiDatContent();
    } else {
      alert('Không có dữ liệu mới trên Cloud hoặc lỗi kết nối.');
    }
  }

  async parseBulkRoster() {
    return this.saveRosterFromCaiDat();
  }

  async unlockMemberDevice(id) {
    await window.dohwaStore.unlockMember(id);
    await this.renderCaiDatContent();
    const toast = document.createElement('div');
    toast.className = 'dohwa-toast';
    toast.textContent = `🔓 Đã mở khóa ca viên thành công!`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  async toggleBanMember(id) {
    await window.dohwaStore.toggleBanMember(id);
    await this.renderCaiDatContent();
  }

  async claimMemberForCurrentDevice(id) {
    try {
      const member = await window.dohwaStore.claimMember(id);
      const badge = document.getElementById('userHeaderBadge');
      if (badge) {
        badge.innerHTML = `👤 <span>${member.name}</span>`;
      }
      await this.renderCaiDatContent();
      const toast = document.createElement('div');
      toast.className = 'dohwa-toast';
      toast.textContent = `✅ Đã chọn ca viên: ${member.name} cho thiết bị này!`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2500);
    } catch (err) {
      alert(err.message || 'Lỗi gán thiết bị!');
    }
  }

  async addNewMember() {
    const nameInp = document.getElementById('newMemberName');
    if (!nameInp || !nameInp.value.trim()) {
      alert('Vui lòng nhập họ tên ca viên!');
      return;
    }
    const name = nameInp.value.trim();

    await window.dohwaStore.saveMember({
      id: 'mb-' + Date.now(),
      name,
      canRead: true,
      claimed: false,
      lockDeviceId: null,
      totalVisits: 0,
      lastVisitAt: null,
      banned: false
    });

    nameInp.value = '';
    if (window.dohwaSoanLe) {
      window.dohwaSoanLe.renderDutyInputs();
    }
  }

  async deleteMemberFromRoster(id) {
    if (confirm('Bạn có chắc chắn muốn xóa ca viên này khỏi danh sách?')) {
      await window.dohwaStore.deleteMember(id);
      await this.renderCaiDatContent();
      if (window.dohwaSoanLe) {
        window.dohwaSoanLe.renderDutyInputs();
      }
    }
  }

  toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') || 'light';
    const next = cur === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('dohwa_theme', next);
  }

  formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    const parts = String(dateStr).split('T')[0].split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  }

  // ==========================================
  // MODAL 1: AI ĐÃ XEM (CHUẨN SOANBOLE SCREENSHOT 1)
  // ==========================================
  async openAiDaXemModal(msId) {
    if (window.dohwaStore && !window.dohwaStore.isAdmin()) {
      this.openAdminLoginModal(() => this.openAiDaXemModal(msId));
      return;
    }

    const modal = document.getElementById('aiDaXemModalOverlay');
    if (!modal) return;
    modal.style.display = 'flex';

    const targetId = msId || this.currentMassSet?.id || 'mass-cn-25-tn-a';

    // Tìm tên bộ lễ để hiển thị rõ ràng trên tiêu đề modal
    let ms = null;
    if (window.dohwaStore) {
      ms = await window.dohwaStore.get('mass_sets', targetId);
    }
    if (!ms && this.currentMassSet?.id === targetId) ms = this.currentMassSet;
    const msTitle = ms?.title || 'Bộ Lễ';

    const titleEl = document.getElementById('aiDaXemMassTitle');
    if (titleEl) {
      titleEl.textContent = msTitle;
    }

    const tbody = document.getElementById('aiDaXemModalTableBody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:16px; color:var(--text-muted);">⏳ Đang tải dữ liệu từ Đám Mây...</td></tr>`;

    const list = await window.dohwaStore.getAttendanceForMass(targetId);

    if (!list || list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="3" style="text-align:center; padding:30px 10px; color:var(--text-muted); font-size:0.86rem;">
            <div style="font-size:2rem; margin-bottom:6px;">👀</div>
            Chưa có ca viên nào xem bộ lễ này.<br>
            <span style="font-size:0.75rem; color:var(--text-muted); margin-top:4px; display:inline-block;">Mỗi bộ lễ lưu và hiển thị kết quả lượt xem riêng biệt.</span>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map(item => {
      let timeStr = 'Vừa mới';
      const vTime = item.lastViewed || item.lastViewedAt;
      if (vTime) {
        const d = new Date(vTime);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const MM = String(d.getMonth() + 1).padStart(2, '0');
        timeStr = `${hh}:${mm} ${dd}-${MM}`;
      }

      return `
        <tr style="border-bottom:1px solid var(--border);">
          <td style="padding:10px 8px; font-weight:600; color:var(--text-main);">${item.name || item.memberName}</td>
          <td style="padding:10px 8px; text-align:center; font-weight:800; color:#0284c7; font-size:0.95rem;">${item.count || item.viewsCount || 1}</td>
          <td style="padding:10px 8px; text-align:right; color:#64748b; font-size:0.8rem; font-family:monospace;">${timeStr}</td>
        </tr>
      `;
    }).join('');
  }

  closeAiDaXemModal() {
    const modal = document.getElementById('aiDaXemModalOverlay');
    if (modal) modal.style.display = 'none';
  }

  // ==========================================
  // MODAL 2: DANH SÁCH CHỌN TÊN KHÔNG CẦN ĐĂNG NHẬP (CHUẨN SOANBOLE SCREENSHOT 2)
  // ==========================================
  async openDanhSachChonTenModal() {
    const modal = document.getElementById('danhSachChonTenModalOverlay');
    if (!modal) return;
    modal.style.display = 'flex';
    await this.renderDanhSachChonTenTable();
  }

  closeDanhSachChonTenModal() {
    const modal = document.getElementById('danhSachChonTenModalOverlay');
    if (modal) modal.style.display = 'none';
  }

  async renderDanhSachChonTenTable() {
    const roster = await window.dohwaStore.getRoster();
    const curDev = window.dohwaStore.getDeviceId();
    const currentSession = window.dohwaStore.getUserSession();

    const textarea = document.getElementById('modalRosterTextarea');
    if (textarea) {
      textarea.value = roster.map(m => m.name).join('\n');
    }

    const tbody = document.getElementById('modalRosterTableBody');
    if (!tbody) return;

    tbody.innerHTML = roster.map(m => {
      const isCur = m.lockDeviceId === curDev || (currentSession && currentSession.memberId === m.id);
      const isClaimed = !!m.claimed;

      let statusHtml = isClaimed
        ? `<span style="color:#ef4444; font-weight:700;">Đã chọn</span>`
        : `<span style="color:#16a34a; font-weight:700;">Chưa chọn</span>`;

      let lastDate = 'Chưa vào';
      if (m.lastVisitAt) {
        const d = new Date(m.lastVisitAt);
        lastDate = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
      }

      return `
        <tr style="border-bottom:1px solid var(--border); ${isCur ? 'background:rgba(107,63,160,0.04);' : ''}">
          <td style="padding:10px 12px; font-weight:600; color:var(--text-main);">
            ${m.name} ${isCur ? '<span style="font-size:0.7rem; color:var(--primary); font-weight:700;">(Máy này)</span>' : ''}
          </td>
          <td style="padding:10px 8px; text-align:center;">${statusHtml}</td>
          <td style="padding:10px 8px; text-align:center; font-weight:700; color:#475569;">${m.totalVisits || 0}</td>
          <td style="padding:10px 8px; text-align:center; color:#64748b; font-size:0.8rem;">${lastDate}</td>
          <td style="padding:10px 12px; text-align:center;">
            <div style="display:flex; justify-content:center; gap:6px; flex-wrap:wrap;">
              ${isClaimed ? `
                <button type="button" class="btn-xs" style="color:#d97706; border:1px solid #d97706; background:#fff; border-radius:6px; padding:3px 8px; font-weight:700; cursor:pointer;" onclick="window.dohwaApp.unlockMemberFromModal('${m.id}')">
                  Mở khoá
                </button>
              ` : ''}
              <button type="button" class="btn-xs" style="color:#6b3fa0; border:1px solid #6b3fa0; background:${isCur ? 'rgba(107,63,160,0.1)' : '#fff'}; border-radius:6px; padding:3px 8px; font-weight:700; cursor:pointer;" onclick="window.dohwaApp.selectMemberDirectly('${m.id}')">
                🔄 Chọn lại tên
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  async saveRosterFromTextarea() {
    const textarea = document.getElementById('modalRosterTextarea');
    if (!textarea || !textarea.value.trim()) {
      alert('Vui lòng nhập danh sách ca viên!');
      return;
    }
    const lines = textarea.value.split('\n').map(s => s.trim()).filter(Boolean);
    const unique = [...new Set(lines)];
    await window.dohwaStore.updateRosterFromNames(unique);
    await this.renderDanhSachChonTenTable();

    const toast = document.createElement('div');
    toast.className = 'dohwa-toast';
    toast.textContent = `💾 Đã lưu danh sách ${unique.length} ca viên thành công!`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  async reloadRosterTextarea() {
    await this.renderDanhSachChonTenTable();
  }

  async unlockMemberFromModal(memberId) {
    await window.dohwaStore.unlockMember(memberId);
    await this.renderDanhSachChonTenTable();
  }

  async selectMemberDirectly(memberId) {
    try {
      const member = await window.dohwaStore.claimMember(memberId);
      const badge = document.getElementById('userHeaderBadge');
      if (badge) {
        badge.innerHTML = `👤 <span>${member.name}</span>`;
      }
      await this.renderDanhSachChonTenTable();

      const toast = document.createElement('div');
      toast.className = 'dohwa-toast';
      toast.textContent = `✅ Đã chọn ca viên: ${member.name} cho thiết bị này!`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2500);
    } catch (err) {
      alert(err.message || 'Lỗi khi chọn tên!');
    }
  }

  // ==========================================
  // SECTION: CÁC BÀI ĐÃ SOẠN TRONG NĂM (CHUẨN SOANBOLE SCREENSHOT 3)
  // ==========================================
  async renderBaiDaSoanTrongNam() {
    const container = document.getElementById('baiDaSoanCategoriesContainer');
    if (!container) return;

    const data = await window.dohwaStore.getYearlySongsSummary();
    const subtitle = document.getElementById('baiDaSoanMainSubtitle');
    if (subtitle) {
      subtitle.textContent = `${data.totalUniqueSongs} bài khác nhau • ${data.totalSlots} lượt qua ${data.totalMassSets} bộ lễ • bấm để đóng`;
    }

    this.yearlySongsData = data;
    this.categoryStates = this.categoryStates || {};

    container.innerHTML = data.categories.map(cat => {
      const isOpen = this.categoryStates[cat.id] !== false; // default open
      const showAll = !!this.categoryStates[`${cat.id}_showAll`];
      const visibleSongs = showAll ? cat.songs : cat.songs.slice(0, 6);
      const remainingCount = cat.songs.length - 6;

      return `
        <div class="card" style="border:1px solid var(--border); border-radius:12px; padding:12px 16px; background:var(--bg-card,#fff); margin-bottom:0;">
          <!-- Category Header -->
          <div style="display:flex; justify-content:space-between; align-items:center; cursor:pointer;" onclick="window.dohwaApp.toggleCategoryAccordion('${cat.id}')">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="background:#0f766e; color:#fff; border-radius:4px; width:18px; height:18px; display:inline-flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:800;">
                ${isOpen ? '−' : '+'}
              </span>
              <strong style="color:var(--text-main); font-size:0.92rem;">${cat.title}</strong>
            </div>
            <span style="font-size:0.78rem; color:var(--text-muted); font-weight:600;">
              ${cat.songsCount} bài • ${cat.slotsCount} lượt
            </span>
          </div>

          <!-- Category Songs List -->
          <div id="cat-body-${cat.id}" style="display:${isOpen ? 'block' : 'none'}; margin-top:10px;">
            <div style="display:flex; flex-direction:column; gap:6px;">
              ${visibleSongs.map(s => {
                const countBadge = s.count > 1 
                  ? `<span style="color:#0d9488; font-weight:700; font-size:0.8rem; white-space:nowrap;">x${s.count} (lặp lại ${s.count - 1} lần)</span>`
                  : `<span style="color:#0d9488; font-weight:700; font-size:0.8rem; white-space:nowrap;">x1</span>`;

                return `
                  <div style="display:flex; justify-content:space-between; align-items:center; padding:5px 0; border-bottom:1px solid rgba(0,0,0,0.04); gap:8px;">
                    <div style="font-size:0.86rem; font-weight:600; color:var(--text-main); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                      ${s.title}
                    </div>
                    <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
                      ${countBadge}
                      <button type="button" class="btn-xs" style="color:#dc2626; border:1px solid #fecaca; background:#fff; border-radius:6px; padding:2px 8px; font-weight:700; cursor:pointer;" onclick="window.dohwaApp.playSongFromBaiDaSoan('${encodeURIComponent(s.title)}')">
                        🎧 Nghe
                      </button>
                      <button type="button" class="btn-xs" style="color:#0d9488; border:1px solid #99f6e4; background:#fff; border-radius:6px; padding:2px 8px; font-weight:700; cursor:pointer;" onclick="window.dohwaApp.viewPdfFromBaiDaSoan('${encodeURIComponent(s.title)}')">
                        👁️ Xem
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            ${(!showAll && remainingCount > 0) ? `
              <button type="button" class="btn-xs btn-outline" style="width:100%; margin-top:8px; color:#0f766e; border-color:#ccfbf1; font-weight:700; padding:5px; border-radius:6px; background:transparent; cursor:pointer;" onclick="window.dohwaApp.toggleCategoryShowMore('${cat.id}')">
                + Xem thêm ${remainingCount} bài
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  toggleBaiDaSoanMain() {
    const body = document.getElementById('baiDaSoanCategoriesContainer');
    const icon = document.getElementById('baiDaSoanMainIcon');
    const sub = document.getElementById('baiDaSoanMainSubtitle');
    if (!body) return;

    if (body.style.display === 'none') {
      body.style.display = 'flex';
      if (icon) icon.textContent = '−';
      if (sub) sub.textContent = sub.textContent.replace('bấm để mở', 'bấm để đóng');
    } else {
      body.style.display = 'none';
      if (icon) icon.textContent = '+';
      if (sub) sub.textContent = sub.textContent.replace('bấm để đóng', 'bấm để mở');
    }
  }

  toggleCategoryAccordion(catId) {
    this.categoryStates = this.categoryStates || {};
    this.categoryStates[catId] = this.categoryStates[catId] === false ? true : false;
    this.renderBaiDaSoanTrongNam();
  }

  toggleCategoryShowMore(catId) {
    this.categoryStates = this.categoryStates || {};
    this.categoryStates[`${catId}_showAll`] = !this.categoryStates[`${catId}_showAll`];
    this.renderBaiDaSoanTrongNam();
  }

  scrollToBaiDaSoan() {
    this.switchTab('tab-hientai');
    const el = document.getElementById('sec-baidasoan');
    if (el) {
      const body = document.getElementById('baiDaSoanCategoriesContainer');
      if (body && body.style.display === 'none') {
        this.toggleBaiDaSoanMain();
      }
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  playSongFromBaiDaSoan(encodedTitle) {
    const title = decodeURIComponent(encodedTitle);
    if (window.dohwaPlayer) {
      window.dohwaPlayer.playSong({
        id: 'yearly-' + Date.now(),
        title: title,
        composer: 'Ca Đoàn Dohwa',
        audioUrl: '',
        youtubeUrl: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(title + ' thánh ca')
      });
    }
  }

  viewPdfFromBaiDaSoan(encodedTitle) {
    const title = decodeURIComponent(encodedTitle);
    if (window.dohwaPDFViewer) {
      window.dohwaPDFViewer.open(null, title, title.toLowerCase().replace(/\s+/g, '_') + '.pdf');
    }
  }
}

// Global App Initialization
function startAppNow() {
  if (!window.dohwaApp) {
    window.dohwaApp = new DohwaApp();
    window.dohwaApp.init();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startAppNow);
} else {
  startAppNow();
}

// Global bridge functions
window.openFullViewModal = (id) => window.dohwaApp?.openFullViewModal(id);
window.shareMassSet = (id) => window.dohwaApp?.shareMassSet(id);
window.playMassSet = (id) => window.dohwaApp?.playAllSongs(id);
window.downloadMassSetPdfs = (id) => window.dohwaApp?.downloadAllPdfs(id);
window.viewMassAttendance = (id) => window.dohwaApp?.viewAttendance(id);
window.openAiDaXemModal = (id) => window.dohwaApp?.openAiDaXemModal(id);
window.openDanhSachChonTenModal = () => window.dohwaApp?.openDanhSachChonTenModal();
window.editMassSet = (id) => window.dohwaApp?.editMassSet(id);
window.deleteMassSet = (id) => window.dohwaApp?.deleteMass(id);
