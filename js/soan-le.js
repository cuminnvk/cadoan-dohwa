/**
 * CA ĐOÀN DOHWA - SOẠN BỘ LỄ THÔNG MINH (ZERO-SCROLL DASHBOARD)
 * - Tự động tính Lịch Phụng Vụ Công Giáo
 * - Khung nhập và tự động phân tích danh sách ca viên
 * - Phân công 4 người đọc sách & phụng vụ (2x2 grid compact)
 * - Kéo thả 6 - 8 file PDF (nhận diện bài phụng vụ)
 * - 6 bài hát thiết kế compact 1 hàng duy nhất
 */

class DohwaSoanLe {
  constructor() {
    this.uploadedSongs = [];
    this.rosterDebounceTimer = null;
    this.defaultRoles = [
      { key: 'duc_me',  label: 'Kính Đức Mẹ' },
      { key: 'nhap_le', label: 'Nhập Lễ' },
      { key: 'dap_ca',  label: 'Thánh Vịnh' },
      { key: 'alleluia',label: 'Alleluia' },
      { key: 'dang_le', label: 'Dâng Lễ' },
      { key: 'hiep_le', label: 'Hiệp Lễ' },
      { key: 'ket_le',  label: 'Kết Lễ' },
      { key: 'khac',    label: 'Bài Hát Khác' }
    ];

    this.liturgicalRoles = [
      { key: 'reader1', label: 'Bài đọc 1', icon: '📖' },
      { key: 'psalmist', label: 'Thánh Vịnh', icon: '🎶' },
      { key: 'reader2', label: 'Bài đọc 2', icon: '📖' },
      { key: 'petitions', label: 'Lời Nguyện', icon: '🙏' }
    ];

    this.initDefaultSongs();
    this.initEvents();
  }

  initDefaultSongs() {
    this.uploadedSongs = [
      { id: 's-1', role: 'duc_me',  roleLabel: 'Kính Đức Mẹ', title: '', composer: '', youtubeUrl: '', pdfName: '', pdfData: null },
      { id: 's-2', role: 'nhap_le', roleLabel: 'Nhập Lễ',     title: '', composer: '', youtubeUrl: '', pdfName: '', pdfData: null },
      { id: 's-3', role: 'dap_ca',  roleLabel: 'Thánh Vịnh',  title: '', composer: '', youtubeUrl: '', pdfName: '', pdfData: null },
      { id: 's-4', role: 'alleluia',roleLabel: 'Alleluia',    title: '', composer: '', youtubeUrl: '', pdfName: '', pdfData: null },
      { id: 's-5', role: 'dang_le', roleLabel: 'Dâng Lễ',     title: '', composer: '', youtubeUrl: '', pdfName: '', pdfData: null },
      { id: 's-6', role: 'hiep_le', roleLabel: 'Hiệp Lễ',     title: '', composer: '', youtubeUrl: '', pdfName: '', pdfData: null },
      { id: 's-7', role: 'ket_le',  roleLabel: 'Kết Lễ',      title: '', composer: '', youtubeUrl: '', pdfName: '', pdfData: null }
    ];
  }

  initEvents() {
    // 1. Khi chọn Ngày cử hành -> TỰ ĐỘNG ĐIỀN TÊN CHÚA NHẬT & MÙA PHỤNG VỤ
    const dateInput = document.getElementById('soanMassDate');
    if (dateInput) {
      const nextSun = this.getNextSundayDate();
      dateInput.value = nextSun;
      this.handleDateChange(nextSun);

      dateInput.addEventListener('change', (e) => {
        this.handleDateChange(e.target.value);
      });
    }

    // 2. Kéo thả file PDF
    const dropzone = document.getElementById('uploadDropzone');
    const fileInput = document.getElementById('pdfBatchInput');

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', (e) => {
        if (e.target !== fileInput) fileInput.click();
      });

      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length) {
          this.handleFiles(e.dataTransfer.files);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length) {
          this.handleFiles(e.target.files);
        }
      });
    }

    // 3. Nút Lưu bộ lễ
    const saveBtn = document.getElementById('saveMassSetBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveCurrentMassSet());
    }

    // 4. Thêm bài thủ công
    const addSongBtn = document.getElementById('addManualSongBtn');
    if (addSongBtn) {
      addSongBtn.addEventListener('click', () => this.addEmptySlot());
    }

    // 5. Gợi ý xoay vòng người đọc
    const autoSuggestBtn = document.getElementById('soanAutoSuggestDutyBtn');
    if (autoSuggestBtn) {
      autoSuggestBtn.addEventListener('click', () => this.autoSuggestDuties());
    }

    // 6. Render giao diện
    this.renderUploadedSlots();
    this.renderDutyInputs();
  }

  getNextSundayDate() {
    const today = new Date();
    const day = today.getDay();
    const diff = (7 - day) % 7;
    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + (diff === 0 ? 0 : diff));
    const y = nextSunday.getFullYear();
    const m = String(nextSunday.getMonth() + 1).padStart(2, '0');
    const d = String(nextSunday.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  handleDateChange(dateStr) {
    if (!dateStr || typeof window.calculateLiturgicalInfo !== 'function') return;

    const info = window.calculateLiturgicalInfo(dateStr);
    if (!info) return;

    const titleInput = document.getElementById('soanMassTitle');
    const seasonInput = document.getElementById('soanMassSeason');

    if (titleInput) {
      titleInput.value = `Bộ lễ ${info.title}`;
    }
    if (seasonInput) {
      seasonInput.value = info.season;
    }

    this.renderDutyInputs();
  }

  // --- QUẢN LÝ KHUNG NHẬP & PHÂN TÍCH CA VIÊN ---
  async initRosterUI() {
    let roster = [];
    if (window.dohwaStore) {
      roster = await window.dohwaStore.getRoster();
    }
    const names = (roster || []).map(m => m.name).filter(Boolean);

    const textarea = document.getElementById('rosterBatchInput');
    if (textarea && !textarea.value) {
      textarea.value = names.join('\n');
    }

    this.renderRosterTags(names);
    await this.renderDutyInputs();
  }

  parseRosterInput(text) {
    if (!text) return [];
    const lines = text.split(/[\r\n,;]+/);
    const names = [];
    const seen = new Set();

    for (let l of lines) {
      // Bỏ số thứ tự, gạch đầu dòng, dấu sao
      let clean = l.replace(/^[\s\d\.\-\*\•\)\(]+/, '').trim();
      if (clean && !seen.has(clean.toLowerCase())) {
        seen.add(clean.toLowerCase());
        names.push(clean);
      }
    }
    return names;
  }

  onRosterInputDebounced(val) {
    clearTimeout(this.rosterDebounceTimer);
    this.rosterDebounceTimer = setTimeout(() => {
      const names = this.parseRosterInput(val);
      const countEl = document.getElementById('rosterParsedCount');
      if (countEl) {
        countEl.textContent = `Đã nhận diện: ${names.length} ca viên (Bấm "⚡ Phân Tích & Cập Nhật" để áp dụng)`;
      }
    }, 250);
  }

  async parseAndSaveRoster() {
    const textarea = document.getElementById('rosterBatchInput');
    const raw = textarea ? textarea.value : '';
    const names = this.parseRosterInput(raw);

    if (!names.length) {
      alert('Vui lòng nhập ít nhất một tên ca viên vào khung!');
      return;
    }

    if (window.dohwaStore) {
      await window.dohwaStore.updateRosterFromNames(names);
    }

    this.renderRosterTags(names);
    await this.renderDutyInputs();

    const toast = document.createElement('div');
    toast.className = 'dohwa-toast';
    toast.textContent = `👥 Đã phân tích & cập nhật ${names.length} ca viên!`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  renderRosterTags(names) {
    const container = document.getElementById('rosterTagsContainer');
    const countEl = document.getElementById('rosterParsedCount');

    if (countEl) {
      countEl.textContent = `Đã nhận diện: ${names.length} ca viên`;
    }

    if (!container) return;
    container.innerHTML = names.map(name => `
      <span class="roster-tag">
        <span>${name}</span>
        <span class="roster-tag-del" onclick="window.dohwaSoanLe.removeRosterTag('${name}')" title="Bỏ tên này">&times;</span>
      </span>
    `).join('');
  }

  async removeRosterTag(nameToRemove) {
    const textarea = document.getElementById('rosterBatchInput');
    const raw = textarea ? textarea.value : '';
    let names = this.parseRosterInput(raw);
    names = names.filter(n => n.toLowerCase() !== nameToRemove.toLowerCase());

    if (textarea) textarea.value = names.join('\n');
    if (window.dohwaStore) {
      await window.dohwaStore.updateRosterFromNames(names);
    }

    this.renderRosterTags(names);
    await this.renderDutyInputs();
  }

  // --- PHÂN CÔNG ĐỌC SÁCH & PHỤNG VỤ ---
  async renderDutyInputs() {
    const container = document.getElementById('soanDutyInputsContainer');
    if (!container) return;

    let roster = [];
    if (window.dohwaStore) {
      roster = await window.dohwaStore.getRoster();
    }
    if (!roster) roster = [];

    // Giữ nguyên giá trị đã chọn
    const prevValues = {};
    this.liturgicalRoles.forEach(r => {
      const el = document.getElementById(`soan-role-${r.key}`);
      const sel = document.getElementById(`soan-role-select-${r.key}`);
      if (el && el.value) prevValues[r.key] = el.value;
      else if (sel && sel.value) prevValues[r.key] = sel.value;
    });

    container.innerHTML = this.liturgicalRoles.map(role => `
      <div class="duty-item-compact">
        <label class="duty-label-compact">
          ${role.icon} ${role.label}
        </label>
        <div style="display:flex; gap:4px;">
          <select id="soan-role-select-${role.key}" class="form-control-compact" style="font-size:0.8rem; padding:3px 6px;" onchange="window.dohwaSoanLe.onDutySelectChange('${role.key}', this.value)">
            <option value="">-- Chọn ca viên --</option>
            ${roster.map(m => `<option value="${m.name}">${m.name}</option>`).join('')}
            <option value="__custom__">Nhập tên khác...</option>
          </select>
          <input type="text" id="soan-role-${role.key}" value="${prevValues[role.key] || ''}" class="form-control-compact" style="font-size:0.8rem; padding:3px 6px; display:none;" placeholder="Tên...">
        </div>
      </div>
    `).join('');

    // Khôi phục giá trị đã chọn
    this.liturgicalRoles.forEach(r => {
      const val = prevValues[r.key];
      if (val) {
        const sel = document.getElementById(`soan-role-select-${r.key}`);
        const inp = document.getElementById(`soan-role-${r.key}`);
        if (sel && Array.from(sel.options).some(o => o.value === val)) {
          sel.value = val;
        } else if (inp && val) {
          sel.value = '__custom__';
          inp.style.display = 'block';
          inp.value = val;
        }
      }
    });
  }

  onDutySelectChange(roleKey, val) {
    const input = document.getElementById(`soan-role-${roleKey}`);
    if (!input) return;

    if (val === '__custom__') {
      input.style.display = 'block';
      input.focus();
    } else {
      input.style.display = 'none';
      input.value = val;
    }
  }

  async autoSuggestDuties() {
    let roster = [];
    if (window.dohwaStore) {
      roster = await window.dohwaStore.getRoster();
    }
    const available = (roster || []).filter(m => m.canRead !== false);
    if (!available.length) {
      alert('Chưa có danh sách ca viên. Vui lòng vào Cài Đặt lưu danh sách ca viên trước khi gợi ý xoay vòng!');
      return;
    }

    const shuffled = [...available].sort(() => Math.random() - 0.5);

    this.liturgicalRoles.forEach((role, idx) => {
      const sel = document.getElementById(`soan-role-select-${role.key}`);
      const inp = document.getElementById(`soan-role-${role.key}`);
      const person = shuffled[idx % shuffled.length];

      if (person) {
        if (sel) sel.value = person.name;
        if (inp) {
          inp.value = person.name;
          inp.style.display = 'none';
        }
      }
    });

    const toast = document.createElement('div');
    toast.className = 'dohwa-toast';
    toast.textContent = '✨ Đã tự động gợi ý phân công 4 người đọc sách!';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  // --- THUẬT TOÁN NHẬN DIỆN FILE PDF ---
  detectRoleFromFilename(fileName) {
    const clean = fileName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    if (clean.includes('me') || clean.includes('maria') || clean.includes('hoa dang') || clean.includes('duc me')) {
      return { role: 'duc_me', label: 'Kính Đức Mẹ' };
    }
    if (clean.includes('nhap') || clean.includes('tien vao') || clean.includes('dau le')) {
      return { role: 'nhap_le', label: 'Nhập Lễ' };
    }
    if (clean.includes('thanh vinh') || clean.includes('dap ca') || clean.includes('tv ') || clean.includes('tv_')) {
      return { role: 'dap_ca', label: 'Thánh Vịnh' };
    }
    if (clean.includes('alleluia') || clean.includes('tin mung')) {
      return { role: 'alleluia', label: 'Alleluia' };
    }
    if (clean.includes('dang le') || clean.includes('tien dang') || clean.includes('le vat')) {
      return { role: 'dang_le', label: 'Dâng Lễ' };
    }
    if (clean.includes('hiep le') || clean.includes('ruoc le')) {
      return { role: 'hiep_le', label: 'Hiệp Lễ' };
    }
    if (clean.includes('ket le') || clean.includes('ta le') || clean.includes('ra ve')) {
      return { role: 'ket_le', label: 'Kết Lễ' };
    }
    return { role: 'khac', label: 'Bài Hát Khác' };
  }

  parseTitleAndComposer(fileName) {
    let name = fileName.replace(/\.[^/.]+$/, "");
    name = name.replace(/^[0-9]+[\.\-\_\s]*/, '');
    name = name.replace(/^(kinh duc me|duc me|nhap le|thanh vinh|dap ca|alleluia|dang le|hiep le|ket le|ta le)[\s\-\_\:]*/i, '');

    let composer = '';
    const parenMatch = name.match(/^(.*?)\((.*?)\)$/);
    if (parenMatch) {
      name = parenMatch[1].trim();
      composer = parenMatch[2].trim();
    } else if (name.includes(' - ')) {
      const parts = name.split(' - ');
      name = parts[0].trim();
      composer = parts.slice(1).join(' - ').trim();
    }

    name = name.replace(/_/g, ' ').trim();
    return { title: name || fileName, composer: composer || '' };
  }

  async handleFiles(files) {
    const list = Array.from(files).filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (list.length === 0) {
      alert('Vui lòng chọn các file định dạng PDF!');
      return;
    }

    for (const file of list) {
      const detected = this.detectRoleFromFilename(file.name);
      const { title, composer } = this.parseTitleAndComposer(file.name);
      const dataUrl = await this.readFileAsDataURL(file);

      // Tìm xem có slot phụng vụ tương ứng chưa có file không
      const targetSlot = this.uploadedSongs.find(s => s.role === detected.role && !s.pdfData);
      if (targetSlot) {
        targetSlot.title = title;
        targetSlot.composer = composer;
        targetSlot.pdfName = file.name;
        targetSlot.pdfData = dataUrl;
      } else {
        this.uploadedSongs.push({
          id: 'song-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          role: detected.role,
          roleLabel: detected.label,
          title,
          composer,
          youtubeUrl: '',
          pdfName: file.name,
          pdfData: dataUrl
        });
      }
    }

    this.renderUploadedSlots();

    const toast = document.createElement('div');
    toast.className = 'dohwa-toast';
    toast.textContent = `📥 Đã nhận diện & ghép ${list.length} file PDF vào bộ lễ!`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  readFileAsDataURL(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  addEmptySlot() {
    this.uploadedSongs.push({
      id: 'song-' + Date.now(),
      role: 'khac',
      roleLabel: 'Bài Hát Khác',
      title: '',
      composer: '',
      youtubeUrl: '',
      pdfName: '',
      pdfData: null
    });
    this.renderUploadedSlots();
  }

  // --- RENDER CÁC BÀI HÁT DẠNG 1 HÀNG COMPACT ZERO-SCROLL ---
  renderUploadedSlots() {
    const container = document.getElementById('soanSongSlotsContainer');
    if (!container) return;

    container.innerHTML = this.uploadedSongs.map((s, index) => `
      <div class="song-row-compact" data-index="${index}">
        <!-- Cột vai trò phụng vụ -->
        <select class="form-control-compact" style="font-weight:700; color:var(--primary); font-size:0.78rem;" onchange="window.dohwaSoanLe.updateRole(${index}, this.value)">
          ${this.defaultRoles.map(r => `<option value="${r.key}" ${r.key === s.role ? 'selected' : ''}>${r.label}</option>`).join('')}
          ${(!this.defaultRoles.some(r => r.key === s.role) && s.role) ? `<option value="${s.role}" selected>${s.roleLabel || s.role}</option>` : ''}
        </select>

        <!-- Cột Tên bài hát -->
        <input type="text" class="form-control-compact song-title-input" value="${s.title || ''}" placeholder="Tên bài hát..." oninput="window.dohwaSoanLe.updateSongTitle(${index}, this.value)">

        <!-- Cột Điền link YouTube (Bỏ nhạc sĩ) -->
        <div style="position:relative; display:flex; align-items:center;">
          <span style="position:absolute; left:7px; font-size:0.75rem; pointer-events:none; color:#ef4444; line-height:1;">▶</span>
          <input type="url" class="form-control-compact song-youtube-input" style="padding-left:22px; font-size:0.78rem;" value="${s.youtubeUrl || ''}" placeholder="Dán link YouTube nghe thử..." oninput="window.dohwaSoanLe.updateSongYouTube(${index}, this.value)">
        </div>

        <!-- Cột Đính kèm PDF -->
        <label class="pdf-status-pill ${s.pdfName ? 'has-pdf' : 'no-pdf'}" title="${s.pdfName ? s.pdfName : 'Bấm để chọn file PDF cho bài này'}">
          ${s.pdfName ? `📄 ${s.pdfName.substring(0, 10)}...` : '📎 Chọn PDF'}
          <input type="file" accept="application/pdf" style="display:none;" onchange="window.dohwaSoanLe.uploadSingleSongPdf(${index}, this.files[0])">
        </label>

        <!-- Nút Xóa bài -->
        <button type="button" class="btn-icon" style="width:26px; height:26px; color:#ef4444; font-size:0.85rem;" onclick="window.dohwaSoanLe.removeSong(${index})" title="Xóa bài hát này">✕</button>
      </div>
    `).join('') + `
      <div style="margin-top:10px; display:flex; justify-content:flex-end;">
        <button type="button" class="btn-xs btn-outline" onclick="window.dohwaSoanLe.addEmptySlot()" style="font-size:0.8rem; font-weight:700; padding:6px 14px; border-radius:6px; cursor:pointer; background:var(--bg-card);">
          ➕ Thêm bài hát khác
        </button>
      </div>
    `;
  }

  updateSongTitle(index, val) {
    if (this.uploadedSongs[index]) {
      this.uploadedSongs[index].title = val;
    }
  }

  updateSongYouTube(index, val) {
    if (this.uploadedSongs[index]) {
      this.uploadedSongs[index].youtubeUrl = val;
    }
  }

  async uploadSingleSongPdf(index, file) {
    if (!file) return;
    const dataUrl = await this.readFileAsDataURL(file);
    this.uploadedSongs[index].pdfName = file.name;
    this.uploadedSongs[index].pdfData = dataUrl;
    if (!this.uploadedSongs[index].title) {
      const { title } = this.parseTitleAndComposer(file.name);
      this.uploadedSongs[index].title = title;
    }
    this.renderUploadedSlots();
  }

  updateRole(index, roleKey) {
    const found = this.defaultRoles.find(r => r.key === roleKey);
    this.uploadedSongs[index].role = roleKey;
    this.uploadedSongs[index].roleLabel = found ? found.label : 'Bài Hát Khác';
  }

  removeSong(index) {
    this.uploadedSongs.splice(index, 1);
    this.renderUploadedSlots();
  }

  // --- LƯU BỘ LỄ ---
  async saveCurrentMassSet() {
    const titleInput = document.getElementById('soanMassTitle');
    const dateInput = document.getElementById('soanMassDate');
    const seasonInput = document.getElementById('soanMassSeason');
    const setActiveCheckbox = document.getElementById('soanSetActive');

    const title = titleInput ? titleInput.value.trim() : '';
    const date = dateInput ? dateInput.value : '';
    const season = seasonInput ? seasonInput.value : 'Mùa Thường Niên';
    const isActive = setActiveCheckbox ? setActiveCheckbox.checked : true;

    if (!title) {
      alert('Vui lòng chọn ngày cử hành để tự động tạo tên Chúa Nhật!');
      return;
    }

    // Thu thập 4 vai trò phân công phụng vụ
    const liturgicalRoles = {};
    this.liturgicalRoles.forEach(r => {
      const sel = document.getElementById(`soan-role-select-${r.key}`);
      const inp = document.getElementById(`soan-role-${r.key}`);
      liturgicalRoles[r.key] = (inp && inp.value.trim()) || (sel && sel.value !== '__custom__' ? sel.value : '');
    });

    // Thu thập bài hát trực tiếp từ các ô nhập trên giao diện
    const rows = document.querySelectorAll('.song-row-compact');
    if (rows.length) {
      rows.forEach((el, idx) => {
        const titleInp = el.querySelector('.song-title-input');
        const ytInp = el.querySelector('.song-youtube-input');
        if (this.uploadedSongs[idx]) {
          if (titleInp) this.uploadedSongs[idx].title = titleInp.value.trim();
          if (ytInp) this.uploadedSongs[idx].youtubeUrl = ytInp.value.trim();
        }
      });
    }

    if (window.dohwaStore && !window.dohwaStore.isAdmin()) {
      alert('🔒 Chỉ Ca Trưởng / Admin mới có quyền lưu bộ lễ!');
      window.dohwaApp?.openAdminLoginModal();
      return;
    }

    const validSongs = this.uploadedSongs.filter(s => s.title.trim() || s.pdfName || (s.youtubeUrl && s.youtubeUrl.trim()));

    const massSet = {
      id: 'mass-' + Date.now(),
      title,
      weekName: title,
      date: date || new Date().toISOString().split('T')[0],
      season,
      liturgicalRoles,
      active: isActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      songs: validSongs.length ? validSongs : this.uploadedSongs
    };

    if (window.dohwaStore) {
      await window.dohwaStore.saveMassSet(massSet);
    }

    const toast = document.createElement('div');
    toast.className = 'dohwa-toast';
    toast.textContent = `💾 Đã lưu thành công "${title}"!`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);

    if (window.dohwaApp) {
      window.dohwaApp.currentMassSet = massSet;
      await window.dohwaApp.loadCurrentMassSet();
      await window.dohwaApp.loadMassSetsArchive();
      window.dohwaApp.switchTab('tab-hientai');
    }
  }
}

// Global instance
window.dohwaSoanLe = new DohwaSoanLe();
