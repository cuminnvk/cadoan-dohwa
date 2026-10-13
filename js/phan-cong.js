/**
 * CA ĐOÀN DOHWA - PHÂN CÔNG PHỤNG VỤ & XOAY VÒNG BÀI ĐỌC
 * 
 * Tính năng chính:
 * 1. Phân công 4 vai trò phụng vụ: Bài đọc 1, Thánh Vịnh (Đáp Ca), Bài đọc 2, Lời nguyện tín hữu.
 * 2. Thống kê chi tiết từng ca viên: Đã đọc Bài đọc mấy lần, hát Thánh Vịnh mấy lần, đọc Lời nguyện mấy lần.
 * 3. Thống kê thời gian: Đã cách bao lâu rồi chưa đọc (số tuần / lần đọc gần nhất).
 * 4. Thuật toán tự động xoay vòng thông minh:
 *    - TUYỆT ĐỐI LOẠI TRỪ tài khoản Admin và Admin Web (không tham gia phân công).
 *    - Ưu tiên cao nhất cho ca viên chưa đọc lần nào hoặc cách lâu nhất chưa làm phụng vụ.
 *    - Tự động tránh lặp lại người vừa đọc tuần trước (thời gian nghỉ ngơi).
 * 5. Tự động đồng bộ với Bộ Lễ & Kho Bộ Lễ.
 * 6. Sao chép thông báo gửi nhóm Zalo Ca Đoàn 1 chạm.
 */

class DohwaPhanCong {
  constructor() {
    this.dutyRoles = [
      { key: 'reader1', name: 'Bài Đọc 1', icon: '📖', desc: 'Đọc Bài đọc 1 (Cựu Ước / Tân Ước)' },
      { key: 'psalmist', name: 'Thánh Vịnh (Đáp Ca)', icon: '🎵', desc: 'Hát Đáp Ca Thánh Vịnh phụng vụ' },
      { key: 'reader2', name: 'Bài Đọc 2', icon: '📜', desc: 'Đọc Bài đọc 2 (Thư các Thánh Tông Đồ)' },
      { key: 'petitions', name: 'Lời Nguyện Tín Hữu', icon: '🙏', desc: 'Xướng các ý cầu nguyện chung của cộng đoàn' }
    ];

    this.selectedMassId = null;
    this.currentAssignments = {
      reader1: '',
      psalmist: '',
      reader2: '',
      petitions: ''
    };

    this.memberStats = new Map();
    this.massSetsCache = [];
    this.rosterCache = [];
    this.searchQuery = '';
  }

  /**
   * KIỂM TRA LOẠI TRỪ NICK ADMIN & ADMIN WEB
   * Yêu cầu người dùng: "Ngoài trừ nick Admin và nick Admin Web hiện tại có trong danh sách
   * của ca viên thì không tham gia vào đó. Còn bao nhiêu nữa thì hãy để cho cơ chế phân công."
   */
  isExcludedMember(memberOrName) {
    if (!memberOrName) return true;
    const name = typeof memberOrName === 'string' ? memberOrName : (memberOrName.name || '');
    const clean = name.trim().toLowerCase();
    if (!clean) return true;
    
    // Loại trừ Admin, Admin Web, Peter Nguyễn, Chưa phân công, Chọn tên
    if (clean === 'admin' || clean === 'admin web' || clean === 'peter nguyễn' || 
        clean === 'chọn tên' || clean === 'chưa phân công' || clean === 'chua phan cong') {
      return true;
    }
    if (clean.startsWith('admin') || clean.endsWith('admin')) {
      return true;
    }
    return false;
  }

  /**
   * Khởi tạo hoặc render toàn bộ giao diện Tab Phân Công Phụng Vụ
   */
  async render() {
    const container = document.getElementById('tab-phancong');
    if (!container) return;

    // Tải dữ liệu bộ lễ và danh sách ca viên
    if (window.dohwaStore) {
      this.massSetsCache = await window.dohwaStore.getAllMassSets();
      this.rosterCache = await window.dohwaStore.getRoster();
    } else {
      this.massSetsCache = [];
      this.rosterCache = [];
    }

    // Xác định bộ lễ được chọn (ưu tiên active mass set)
    if (!this.selectedMassId || !this.massSetsCache.some(m => m.id === this.selectedMassId)) {
      const activeMass = this.massSetsCache.find(m => m.active) || this.massSetsCache[0];
      this.selectedMassId = activeMass ? activeMass.id : null;
    }

    // Tải thông tin phân công của bộ lễ đang chọn
    this.loadSelectedMassAssignments();

    // Tính toán thống kê toàn diện
    this.calculateMemberStats();

    // Render HTML toàn bộ giao diện
    container.innerHTML = this.buildFullViewHtml();

    // Khởi tạo các sự kiện giao diện
    this.bindEvents();
  }

  /**
   * Tải vai trò của bộ lễ hiện đang chọn
   */
  loadSelectedMassAssignments() {
    const curMass = this.massSetsCache.find(m => m.id === this.selectedMassId);
    this.currentAssignments = {
      reader1: '',
      psalmist: '',
      reader2: '',
      petitions: ''
    };

    if (curMass && curMass.liturgicalRoles) {
      const r = curMass.liturgicalRoles;
      this.currentAssignments.reader1 = r.reader1 || '';
      this.currentAssignments.psalmist = r.psalmist || r.dapca || '';
      this.currentAssignments.reader2 = r.reader2 || '';
      this.currentAssignments.petitions = r.petitions || r.loinguyen || '';
    }
  }

  /**
   * Tính toán thống kê số lần làm phụng vụ và thời gian cách bao lâu chưa đọc
   */
  calculateMemberStats() {
    this.memberStats.clear();

    // 1. Lọc danh sách ca viên hợp lệ (LOẠI BỎ ADMIN VÀ ADMIN WEB)
    const eligibleMembers = this.rosterCache.filter(m => !this.isExcludedMember(m));

    // Khởi tạo thống kê ban đầu cho tất cả ca viên hợp lệ
    eligibleMembers.forEach(m => {
      this.memberStats.set(m.name.trim(), {
        member: m,
        reader1: 0,
        psalmist: 0,
        reader2: 0,
        petitions: 0,
        total: 0,
        historyList: [],
        lastServedDate: null,
        lastServedMassTitle: '',
        lastServedRole: '',
        weeksAgo: Infinity
      });
    });

    // 2. Sắp xếp các bộ lễ theo thứ tự ngày tăng dần để quét lịch sử
    const sortedMasses = [...this.massSetsCache].sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return da - db;
    });

    const today = new Date();

    // 3. Quét qua toàn bộ các bộ lễ trong quá khứ và hiện tại
    sortedMasses.forEach((m, massIdx) => {
      if (!m.liturgicalRoles) return;
      const r = m.liturgicalRoles;
      const massDateStr = m.date || '';
      const massDate = massDateStr ? new Date(massDateStr) : null;

      const roles = [
        { key: 'reader1', name: r.reader1, label: 'Bài Đọc 1' },
        { key: 'psalmist', name: r.psalmist || r.dapca, label: 'Thánh Vịnh' },
        { key: 'reader2', name: r.reader2, label: 'Bài Đọc 2' },
        { key: 'petitions', name: r.petitions || r.loinguyen, label: 'Lời Nguyện' }
      ];

      roles.forEach(role => {
        const personName = (role.name || '').trim();
        if (!personName || this.isExcludedMember(personName)) return;

        // Nếu ca viên chưa có trong Map (ví dụ được nhập tay ngoài danh sách)
        if (!this.memberStats.has(personName)) {
          this.memberStats.set(personName, {
            member: { id: 'custom-' + personName, name: personName, voice: 'Ca viên' },
            reader1: 0,
            psalmist: 0,
            reader2: 0,
            petitions: 0,
            total: 0,
            historyList: [],
            lastServedDate: null,
            lastServedMassTitle: '',
            lastServedRole: '',
            weeksAgo: Infinity
          });
        }

        const stat = this.memberStats.get(personName);
        stat[role.key]++;
        stat.total++;
        stat.historyList.push({
          massId: m.id,
          massTitle: m.title,
          date: massDateStr,
          roleKey: role.key,
          roleLabel: role.label,
          massIndex: massIdx
        });

        // Cập nhật lần phục vụ gần nhất
        stat.lastServedDate = massDateStr || stat.lastServedDate;
        stat.lastServedMassTitle = m.title;
        stat.lastServedRole = role.label;
      });
    });

    // 4. Tính khoảng cách "Đã cách bao lâu rồi chưa đọc"
    // Dựa trên số tuần trôi qua kể từ lần phục vụ gần nhất
    this.memberStats.forEach((stat) => {
      if (!stat.lastServedDate) {
        stat.weeksAgo = Infinity; // Chưa đọc lần nào
      } else {
        const lastDate = new Date(stat.lastServedDate);
        const diffMs = today.getTime() - lastDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays <= 4) {
          stat.weeksAgo = 0; // Vừa đọc tuần này/tuần trước
        } else {
          stat.weeksAgo = Math.max(1, Math.round(diffDays / 7));
        }
      }
    });
  }

  /**
   * Tạo chuỗi nhãn hiển thị khoảng cách "Cách bao lâu"
   */
  getWeeksAgoBadge(stat) {
    if (stat.total === 0 || stat.weeksAgo === Infinity) {
      return `<span style="display:inline-flex; align-items:center; gap:4px; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:800; background:rgba(234,179,8,0.15); color:#ca8a04; border:1px solid rgba(234,179,8,0.3);">
        ⭐ Chưa đọc lần nào (Ưu tiên)
      </span>`;
    }
    if (stat.weeksAgo === 0) {
      return `<span style="display:inline-flex; align-items:center; gap:4px; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:700; background:rgba(100,116,139,0.12); color:#64748b; border:1px solid rgba(100,116,139,0.25);">
        🌿 Vừa đọc tuần trước (Nghỉ)
      </span>`;
    }
    if (stat.weeksAgo === 1) {
      return `<span style="display:inline-flex; align-items:center; gap:4px; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:700; background:rgba(59,130,246,0.1); color:#2563eb; border:1px solid rgba(59,130,246,0.25);">
        ⏳ Cách 1 tuần
      </span>`;
    }
    if (stat.weeksAgo === 2) {
      return `<span style="display:inline-flex; align-items:center; gap:4px; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:700; background:rgba(14,165,233,0.12); color:#0284c7; border:1px solid rgba(14,165,233,0.25);">
        ⏳ Cách 2 tuần
      </span>`;
    }
    if (stat.weeksAgo === 3) {
      return `<span style="display:inline-flex; align-items:center; gap:4px; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:800; background:rgba(249,115,22,0.12); color:#ea580c; border:1px solid rgba(249,115,22,0.3);">
        ⚡ Cách 3 tuần (Nên xoay vòng)
      </span>`;
    }
    return `<span style="display:inline-flex; align-items:center; gap:4px; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:800; background:rgba(239,68,68,0.12); color:#dc2626; border:1px solid rgba(239,68,68,0.3);">
      🔥 Cách ${stat.weeksAgo} tuần (Ưu tiên xoay)
    </span>`;
  }

  /**
   * THUẬT TOÁN TỰ ĐỘNG XOAY VÒNG THÔNG MINH (SMART ROTATION)
   * Yêu cầu:
   * - Loại trừ tài khoản Admin và Admin Web 100%.
   * - Tránh người vừa mới đọc tuần trước (để họ được nghỉ ngơi).
   * - Ưu tiên người chưa đọc lần nào (Score cao nhất).
   * - Ưu tiên người có khoảng cách lâu nhất (weeksAgo cao) và tổng số lần phục vụ ít nhất.
   */
  autoRotate() {
    const curMass = this.massSetsCache.find(m => m.id === this.selectedMassId);
    if (!curMass) {
      alert('Vui lòng chọn một bộ lễ để phân công!');
      return;
    }

    // 1. Lấy danh sách ca viên hợp lệ (không có Admin/Admin Web)
    const eligibleMembers = this.rosterCache.filter(m => !this.isExcludedMember(m));
    if (eligibleMembers.length < 4) {
      alert(`Số lượng ca viên hợp lệ hiện tại (${eligibleMembers.length}) ít hơn 4 vị trí phụng vụ. Vui lòng thêm thêm ca viên!`);
      return;
    }

    // 2. Tìm bộ lễ gần nhất trước bộ lễ đang chọn để lấy danh sách người vừa đọc tuần trước
    const curDate = curMass.date ? new Date(curMass.date).getTime() : Infinity;
    const pastMasses = this.massSetsCache
      .filter(m => m.id !== curMass.id && m.date && new Date(m.date).getTime() <= curDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const immediatelyLastMass = pastMasses[0];
    const justReadNames = new Set();
    if (immediatelyLastMass && immediatelyLastMass.liturgicalRoles) {
      const lr = immediatelyLastMass.liturgicalRoles;
      [lr.reader1, lr.psalmist || lr.dapca, lr.reader2, lr.petitions || lr.loinguyen].forEach(n => {
        if (n && !this.isExcludedMember(n)) justReadNames.add(n.trim());
      });
    }

    // 3. Tính điểm ưu tiên phân công cho từng ca viên
    const scoredCandidates = eligibleMembers.map(m => {
      const stat = this.memberStats.get(m.name.trim()) || {
        total: 0,
        weeksAgo: Infinity,
        reader1: 0,
        psalmist: 0,
        reader2: 0,
        petitions: 0
      };

      let score = 0;
      let reason = '';

      if (stat.total === 0 || stat.weeksAgo === Infinity) {
        score = 1000 + Math.random() * 2;
        reason = '⭐ Chưa phục vụ lần nào (Ưu tiên số 1)';
      } else if (justReadNames.has(m.name.trim())) {
        score = -500 + Math.random(); // Phạt điểm người vừa đọc tuần trước để nghỉ ngơi
        reason = '🌿 Vừa đọc tuần trước (Nên nghỉ)';
      } else {
        // Càng nhiều tuần chưa đọc -> điểm càng cao
        // Tổng số lần phục vụ càng ít -> điểm càng cao
        score = (stat.weeksAgo * 15) - (stat.total * 3) + (Math.random() * 2);
        reason = `⏳ Đã cách ${stat.weeksAgo} tuần chưa đọc (Tổng ${stat.total} lần)`;
      }

      return {
        member: m,
        stat: stat,
        score: score,
        reason: reason
      };
    });

    // Sắp xếp giảm dần theo điểm ưu tiên
    scoredCandidates.sort((a, b) => b.score - a.score);

    // 4. Gán 4 vai trò cho 4 ứng viên điểm cao nhất
    const chosen = scoredCandidates.slice(0, 4);

    this.currentAssignments.reader1 = chosen[0].member.name;
    this.currentAssignments.psalmist = chosen[1].member.name;
    this.currentAssignments.reader2 = chosen[2].member.name;
    this.currentAssignments.petitions = chosen[3].member.name;

    // Cập nhật lên UI dropdowns
    this.dutyRoles.forEach(r => {
      const sel = document.getElementById(`phancong-select-${r.key}`);
      const val = this.currentAssignments[r.key];
      if (sel) sel.value = val;
    });

    // Hiển thị thông báo giải thích cơ chế
    const msg = `🎉 ĐÃ TỰ ĐỘNG GỢI Ý XOAY VÒNG PHÙ HỢP CHO 4 VAI TRÒ:\n` +
      `------------------------------------\n` +
      `1. 📖 Bài Đọc 1: ${chosen[0].member.name} (${chosen[0].reason})\n` +
      `2. 🎵 Thánh Vịnh: ${chosen[1].member.name} (${chosen[1].reason})\n` +
      `3. 📜 Bài Đọc 2: ${chosen[2].member.name} (${chosen[2].reason})\n` +
      `4. 🙏 Lời Nguyện: ${chosen[3].member.name} (${chosen[3].reason})\n` +
      `------------------------------------\n` +
      `💡 Thuật toán đã tự động bỏ qua nick Admin/Admin Web và người vừa đọc tuần trước. Nhấn "Lưu Bảng Phân Công" để xác nhận!`;

    alert(msg);
    this.render(); // Vẽ lại để cập nhật gợi ý
  }

  /**
   * Lưu bảng phân công và tự động cập nhật vào Bộ Lễ
   */
  async saveSchedule() {
    const curMass = this.massSetsCache.find(m => m.id === this.selectedMassId);
    if (!curMass) {
      alert('Không tìm thấy thông tin bộ lễ cần lưu!');
      return;
    }

    // Thu thập giá trị từ các dropdown
    this.dutyRoles.forEach(r => {
      const sel = document.getElementById(`phancong-select-${r.key}`);
      const customInp = document.getElementById(`phancong-custom-${r.key}`);
      if (sel && sel.value === '__custom__' && customInp) {
        this.currentAssignments[r.key] = customInp.value.trim();
      } else if (sel) {
        this.currentAssignments[r.key] = sel.value;
      }
    });

    // Cập nhật liturgicalRoles trên Mass Set
    curMass.liturgicalRoles = {
      reader1: this.currentAssignments.reader1 || '',
      psalmist: this.currentAssignments.psalmist || '',
      reader2: this.currentAssignments.reader2 || '',
      petitions: this.currentAssignments.petitions || ''
    };
    curMass.updatedAt = new Date().toISOString();

    // Lưu qua DohwaStore
    if (window.dohwaStore) {
      await window.dohwaStore.saveMassSet(curMass);
    }

    alert(`✅ Đã lưu phân công phụng vụ cho "${curMass.title}" thành công!\nCác thông tin đã được đồng bộ lên thẻ Bộ Lễ và Kho Lễ.`);

    // Đồng bộ lại App chính
    if (window.dohwaApp) {
      await window.dohwaApp.loadCurrentMassSet();
      await window.dohwaApp.loadMassSetsArchive();
    }

    // Tính lại thống kê và vẽ lại giao diện
    this.render();
  }

  /**
   * Sao chép thông báo gửi Zalo 1 chạm
   */
  copyZalo() {
    const curMass = this.massSetsCache.find(m => m.id === this.selectedMassId);
    const title = curMass ? curMass.title : 'CHÚA NHẬT PHỤNG VỤ';
    const dateFormatted = curMass && curMass.date ? new Date(curMass.date).toLocaleDateString('vi-VN', {
      weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric'
    }) : '';

    let msg = `📋 PHÂN CÔNG PHỤNG VỤ - CA ĐOÀN DOHWA\n`;
    msg += `⛪ ${title.toUpperCase()}\n`;
    if (dateFormatted) msg += `🗓 Ngày: ${dateFormatted}\n`;
    msg += `------------------------------------\n`;
    msg += `📖 BÀI ĐỌC & THÁNH VỊNH:\n`;
    
    this.dutyRoles.forEach(r => {
      const personName = this.currentAssignments[r.key] || 'Chưa phân công';
      const person = this.rosterCache.find(m => m.name === personName);
      const voiceInfo = person ? ` (${person.voice})` : '';
      msg += `• ${r.icon} ${r.name}: ${personName}${voiceInfo}\n`;
    });

    if (curMass && curMass.songs && curMass.songs.length) {
      msg += `------------------------------------\n`;
      msg += `🎶 BỘ LỄ HÁT:\n`;
      curMass.songs.forEach((s, idx) => {
        msg += `${idx + 1}. [${s.roleLabel || 'Bài hát'}] ${s.title}${s.composer ? ` - ${s.composer}` : ''}\n`;
      });
    }

    // Link truy cập chính thức của Dohwa
    let shareUrl = 'https://cadoan-dohwa.web.app';
    if (curMass && curMass.id) {
      const cnMatch = curMass.id.match(/cn-(\d+)/);
      if (cnMatch) {
        shareUrl += `/?cn=${cnMatch[1]}`;
      } else {
        shareUrl += `/?mass=${encodeURIComponent(curMass.id)}`;
      }
    }

    msg += `------------------------------------\n`;
    msg += `👉 Ca viên vào tập bài & xem bản nốt nhạc tại:\n${shareUrl}`;

    navigator.clipboard.writeText(msg).then(() => {
      alert('📋 Đã sao chép nội dung phân công phụng vụ!\nBạn hãy mở Zalo nhóm Ca Đoàn và dán (Ctrl+V) để gửi cho mọi người nhé.');
    }).catch(() => {
      prompt('Hãy sao chép nội dung bên dưới để gửi Zalo:', msg);
    });
  }

  /**
   * Tạo giao diện HTML hoàn chỉnh của Tab Phân Công Phụng Vụ
   */
  buildFullViewHtml() {
    const curMass = this.massSetsCache.find(m => m.id === this.selectedMassId);
    const eligibleMembers = this.rosterCache.filter(m => !this.isExcludedMember(m));

    // Thống kê nhanh toàn đoàn
    const statsArray = Array.from(this.memberStats.values());
    const totalEligible = eligibleMembers.length;
    const neverServedCount = statsArray.filter(s => s.total === 0 || s.weeksAgo === Infinity).length;
    const waitingOver2WeeksCount = statsArray.filter(s => s.weeksAgo >= 2 && s.weeksAgo !== Infinity).length;

    return `
      <div style="max-width:1100px; margin:0 auto; padding:4px 0 32px 0;">
        
        <!-- CARD 1: TIÊU ĐỀ & THANH ĐIỀU HÀNH PHÂN CÔNG TUẦN NÀY -->
        <div class="card" style="margin-bottom:20px; padding:20px; border-radius:16px; box-shadow:0 4px 20px rgba(0,0,0,0.06);">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px; margin-bottom:16px;">
            <div>
              <div style="display:inline-flex; align-items:center; gap:6px; background:rgba(107,63,160,0.1); color:#6b3fa0; padding:4px 10px; border-radius:20px; font-size:0.8rem; font-weight:800; margin-bottom:8px;">
                <span>📋 PHÂN CÔNG PHỤNG VỤ & XOAY VÒNG BÀI ĐỌC</span>
              </div>
              <h2 style="font-size:1.35rem; font-weight:800; color:var(--text-main); margin-bottom:4px;">
                Xoay Vòng & Thống Kê Phụng Vụ Ca Đoàn
              </h2>
              <div style="font-size:0.84rem; color:var(--text-muted);">
                Tự động xoay vòng công bằng, tính toán thời gian chưa đọc của từng ca viên (Đã loại trừ tài khoản Admin).
              </div>
            </div>

            <!-- CHỌN BỘ LỄ CẦN PHÂN CÔNG -->
            <div style="min-width:280px; flex:1; max-width:420px; background:var(--bg-card-subtle,#f8fafc); padding:12px 14px; border-radius:12px; border:1px solid var(--border);">
              <label style="display:block; font-size:0.78rem; font-weight:700; color:var(--text-muted); margin-bottom:6px;">
                ⛪ BỘ LỄ ÁP DỤNG PHÂN CÔNG:
              </label>
              <select id="phanCongMassSelect" class="form-control" style="font-size:0.88rem; font-weight:700; padding:8px 10px; border-radius:8px; width:100%;">
                ${this.massSetsCache.map(m => `
                  <option value="${m.id}" ${m.id === this.selectedMassId ? 'selected' : ''}>
                    ${m.active ? '⭐ [HIỆN TẠI] ' : ''}${m.title} ${m.date ? `(${m.date})` : ''}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>

          <!-- NÚT HÀNH ĐỘNG -->
          <div style="display:flex; flex-wrap:wrap; gap:10px; padding-top:12px; border-top:1px solid var(--border);">
            <button type="button" class="btn btn-primary" id="btnAutoRotateSchedule" style="display:inline-flex; align-items:center; gap:6px; background:#6b3fa0; font-weight:700; padding:9px 18px; border-radius:8px; cursor:pointer;">
              <span>🔄 Tự Động Xoay Vòng Phù Hợp</span>
            </button>
            <button type="button" class="btn btn-outline" id="btnSaveSchedule" style="display:inline-flex; align-items:center; gap:6px; font-weight:700; padding:9px 18px; border-radius:8px; border:1.5px solid #0284c7; color:#0284c7; cursor:pointer;">
              <span>💾 Lưu Bảng Phân Công & Cập Nhật Lễ</span>
            </button>
            <button type="button" class="btn btn-outline" id="btnCopyScheduleZalo" style="display:inline-flex; align-items:center; gap:6px; font-weight:700; padding:9px 18px; border-radius:8px; border:1.5px solid #16a34a; color:#16a34a; cursor:pointer;">
              <span>📋 Sao Chép Gửi Zalo</span>
            </button>
          </div>

          <!-- GỢI Ý CỦA THUẬT TOÁN -->
          <div style="margin-top:14px; background:linear-gradient(135deg, rgba(107,63,160,0.06), rgba(2,132,199,0.06)); border:1px dashed rgba(107,63,160,0.3); border-radius:10px; padding:10px 14px; font-size:0.82rem; color:var(--text-main); display:flex; align-items:center; gap:10px;">
            <span style="font-size:1.2rem;">💡</span>
            <div>
              <strong>Cơ chế xoay vòng thông minh:</strong> Hệ thống tự động ưu tiên ca viên chưa đọc lần nào hoặc đã nghỉ lâu nhất, đồng thời cho ca viên vừa phục vụ tuần trước được nghỉ ngơi (Loại trừ vĩnh viễn tài khoản <code>Admin</code> và <code>Admin Web</code>).
            </div>
          </div>
        </div>

        <!-- CARD 2: KHUNG 4 VAI TRÒ PHỤNG VỤ TUẦN NÀY -->
        <div class="card" style="margin-bottom:20px; padding:20px; border-radius:16px;">
          <h3 style="font-size:1.1rem; font-weight:800; color:var(--text-main); margin-bottom:14px; display:flex; align-items:center; gap:8px;">
            <span>📖 Bảng Phân Công 4 Vị Trí Phụng Vụ</span>
            <span style="font-size:0.8rem; font-weight:600; color:var(--text-muted); background:var(--bg-card-subtle); padding:2px 8px; border-radius:12px;">
              ${curMass ? curMass.title : ''}
            </span>
          </h3>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:14px;">
            ${this.dutyRoles.map(role => this.buildDutySlotCardHtml(role, eligibleMembers)).join('')}
          </div>
        </div>

        <!-- CARD 3: THỐNG KÊ XOAY VÒNG TOÀN CA ĐOÀN -->
        <div class="card" style="margin-bottom:20px; padding:20px; border-radius:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
            <div>
              <h3 style="font-size:1.15rem; font-weight:800; color:var(--text-main); margin-bottom:2px;">
                📊 Thống Kê Xoay Vòng Toàn Ca Đoàn
              </h3>
              <div style="font-size:0.82rem; color:var(--text-muted);">
                Theo dõi ai đã đọc Bài đọc, ai đã hát Thánh Vịnh, ai đã đọc Lời nguyện và đã cách bao lâu rồi chưa đọc
              </div>
            </div>

            <!-- TÌM KIẾM CA VIÊN -->
            <div style="min-width:220px;">
              <input type="text" id="phanCongSearchInput" value="${this.searchQuery}" class="form-control" placeholder="🔍 Tìm tên ca viên..." style="font-size:0.85rem; padding:6px 12px; border-radius:8px;">
            </div>
          </div>

          <!-- MINI STATS BOXES -->
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px; margin-bottom:18px;">
            <div style="background:var(--bg-card-subtle,#f8fafc); border:1px solid var(--border); border-radius:12px; padding:12px 14px; text-align:center;">
              <div style="font-size:1.6rem; font-weight:900; color:#6b3fa0;">${totalEligible}</div>
              <div style="font-size:0.78rem; font-weight:700; color:var(--text-muted);">Ca Viên Tham Gia Xoay Vòng</div>
            </div>
            <div style="background:var(--bg-card-subtle,#f8fafc); border:1px solid var(--border); border-radius:12px; padding:12px 14px; text-align:center;">
              <div style="font-size:1.6rem; font-weight:900; color:#ca8a04;">${neverServedCount}</div>
              <div style="font-size:0.78rem; font-weight:700; color:var(--text-muted);">Chưa Đọc Lần Nào (Ưu tiên)</div>
            </div>
            <div style="background:var(--bg-card-subtle,#f8fafc); border:1px solid var(--border); border-radius:12px; padding:12px 14px; text-align:center;">
              <div style="font-size:1.6rem; font-weight:900; color:#ea580c;">${waitingOver2WeeksCount}</div>
              <div style="font-size:0.78rem; font-weight:700; color:var(--text-muted);">Đã Nghỉ ≥ 2 Tuần (Sẵn sàng)</div>
            </div>
          </div>

          <!-- BẢNG THỐNG KÊ CHI TIẾT -->
          <div style="overflow-x:auto;">
            <table class="roster-table" style="width:100%; border-collapse:collapse; font-size:0.88rem;">
              <thead>
                <tr style="background:var(--bg-card-subtle,#f8fafc); border-bottom:2px solid var(--border); text-align:left;">
                  <th style="padding:10px 12px; width:45px; text-align:center;">STT</th>
                  <th style="padding:10px 12px;">Tên Ca Viên</th>
                  <th style="padding:10px 12px; text-align:center;">Bè</th>
                  <th style="padding:10px 12px; text-align:center;">📖 BĐ 1</th>
                  <th style="padding:10px 12px; text-align:center;">🎵 Thánh Vịnh</th>
                  <th style="padding:10px 12px; text-align:center;">📜 BĐ 2</th>
                  <th style="padding:10px 12px; text-align:center;">🙏 Lời Nguyện</th>
                  <th style="padding:10px 12px; text-align:center;">Tổng Lần</th>
                  <th style="padding:10px 12px;">Lần Đọc Gần Nhất</th>
                  <th style="padding:10px 12px; text-align:center;">Cách Bao Lâu?</th>
                </tr>
              </thead>
              <tbody>
                ${this.buildStatsTableRowsHtml()}
              </tbody>
            </table>
          </div>
        </div>

        <!-- CARD 4: NHẬT KÝ LỊCH SỬ PHÂN CÔNG CÁC TUẦN -->
        <div class="card" style="padding:20px; border-radius:16px;">
          <h3 style="font-size:1.1rem; font-weight:800; color:var(--text-main); margin-bottom:12px;">
            📜 Nhật Ký Lịch Sử Phân Công Các Tuần Trước
          </h3>
          <div style="overflow-x:auto;">
            <table class="roster-table" style="width:100%; border-collapse:collapse; font-size:0.85rem;">
              <thead>
                <tr style="background:var(--bg-card-subtle,#f8fafc); border-bottom:2px solid var(--border); text-align:left;">
                  <th style="padding:10px 12px;">Bộ Lễ / Ngày</th>
                  <th style="padding:10px 12px;">📖 Bài Đọc 1</th>
                  <th style="padding:10px 12px;">🎵 Thánh Vịnh</th>
                  <th style="padding:10px 12px;">📜 Bài Đọc 2</th>
                  <th style="padding:10px 12px;">🙏 Lời Nguyện</th>
                  <th style="padding:10px 12px; text-align:center;">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                ${this.buildHistoryTableRowsHtml()}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  }

  /**
   * Tạo HTML cho từng ô phân công vai trò
   */
  buildDutySlotCardHtml(role, eligibleMembers) {
    const selectedName = this.currentAssignments[role.key] || '';
    const stat = selectedName ? this.memberStats.get(selectedName.trim()) : null;

    let suggestionHtml = '';
    if (stat) {
      suggestionHtml = `
        <div style="margin-top:6px; font-size:0.75rem; color:var(--text-muted); display:flex; align-items:center; justify-content:space-between;">
          <span>Tổng đã đọc: <strong>${stat.total} lần</strong></span>
          <span>${this.getWeeksAgoBadge(stat)}</span>
        </div>
      `;
    } else if (selectedName) {
      suggestionHtml = `
        <div style="margin-top:6px; font-size:0.75rem; color:var(--text-muted);">
          <span>Nhập tùy chỉnh: <strong>${selectedName}</strong></span>
        </div>
      `;
    } else {
      suggestionHtml = `
        <div style="margin-top:6px; font-size:0.75rem; color:#ca8a04;">
          ⚡ Chưa phân công ca viên
        </div>
      `;
    }

    const isCustom = selectedName && !eligibleMembers.some(m => m.name === selectedName);

    return `
      <div style="background:var(--bg-card-subtle,#f8fafc); border:1.5px solid var(--border); border-radius:12px; padding:14px; position:relative;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
          <span style="font-size:1.4rem;">${role.icon}</span>
          <div>
            <div style="font-weight:800; font-size:0.92rem; color:var(--text-main);">${role.name}</div>
            <div style="font-size:0.72rem; color:var(--text-muted);">${role.desc}</div>
          </div>
        </div>

        <div style="margin-top:10px;">
          <select id="phancong-select-${role.key}" class="form-control" style="font-size:0.85rem; font-weight:700; padding:8px 10px; border-radius:8px; width:100%;" onchange="window.dohwaPhanCong.onRoleSelectChange('${role.key}', this.value)">
            <option value="">-- Chọn ca viên --</option>
            ${eligibleMembers.map(m => {
              const mStat = this.memberStats.get(m.name.trim());
              const countText = mStat ? ` [Đã đọc: ${mStat.total} lần]` : '';
              return `
                <option value="${m.name}" ${m.name === selectedName ? 'selected' : ''}>
                  ${m.name} (${m.voice || 'Ca viên'})${countText}
                </option>
              `;
            }).join('')}
            <option value="__custom__" ${isCustom ? 'selected' : ''}>Nhập tên khác ngoài danh sách...</option>
          </select>

          <input type="text" id="phancong-custom-${role.key}" value="${isCustom ? selectedName : ''}" placeholder="Nhập tên người đọc..." class="form-control" style="margin-top:6px; font-size:0.85rem; padding:6px 10px; border-radius:8px; display:${isCustom ? 'block' : 'none'}; width:100%;">
        </div>

        ${suggestionHtml}
      </div>
    `;
  }

  /**
   * Tạo các dòng bảng thống kê
   */
  buildStatsTableRowsHtml() {
    let list = Array.from(this.memberStats.values());

    // Tìm kiếm lọc theo tên
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      list = list.filter(s => s.member.name.toLowerCase().includes(q));
    }

    // Sắp xếp: Ưu tiên người chưa đọc lần nào trước, rồi đến người cách nhiều tuần nhất
    list.sort((a, b) => {
      if (a.weeksAgo === Infinity && b.weeksAgo !== Infinity) return -1;
      if (b.weeksAgo === Infinity && a.weeksAgo !== Infinity) return 1;
      if (b.weeksAgo !== a.weeksAgo) return b.weeksAgo - a.weeksAgo;
      return a.total - b.total;
    });

    if (list.length === 0) {
      return `<tr><td colspan="10" style="text-align:center; padding:20px; color:var(--text-muted);">Không tìm thấy ca viên phù hợp!</td></tr>`;
    }

    return list.map((stat, idx) => {
      const m = stat.member;
      const lastInfo = stat.lastServedMassTitle ? `
        <div style="font-weight:700; color:var(--text-main); font-size:0.82rem;">${stat.lastServedRole}</div>
        <div style="font-size:0.75rem; color:var(--text-muted);">${stat.lastServedMassTitle} ${stat.lastServedDate ? `(${stat.lastServedDate})` : ''}</div>
      ` : `<span style="color:var(--text-muted); font-size:0.78rem;">Chưa tham gia</span>`;

      return `
        <tr style="border-bottom:1px solid var(--border);">
          <td style="padding:10px 12px; text-align:center; font-weight:700; color:var(--text-muted);">${idx + 1}</td>
          <td style="padding:10px 12px;">
            <strong style="color:var(--text-main);">${m.name}</strong>
          </td>
          <td style="padding:10px 12px; text-align:center;">
            <span class="voice-badge voice-${(m.voice || 'soprano').toLowerCase()}" style="font-size:0.75rem; padding:2px 8px; border-radius:10px;">
              ${m.voice || 'Ca viên'}
            </span>
          </td>
          <td style="padding:10px 12px; text-align:center; font-weight:700; color:${stat.reader1 > 0 ? '#0284c7' : 'var(--text-muted)'};">${stat.reader1}</td>
          <td style="padding:10px 12px; text-align:center; font-weight:700; color:${stat.psalmist > 0 ? '#6d28d9' : 'var(--text-muted)'};">${stat.psalmist}</td>
          <td style="padding:10px 12px; text-align:center; font-weight:700; color:${stat.reader2 > 0 ? '#0284c7' : 'var(--text-muted)'};">${stat.reader2}</td>
          <td style="padding:10px 12px; text-align:center; font-weight:700; color:${stat.petitions > 0 ? '#16a34a' : 'var(--text-muted)'};">${stat.petitions}</td>
          <td style="padding:10px 12px; text-align:center; font-weight:900; font-size:0.95rem; color:#6b3fa0;">${stat.total}</td>
          <td style="padding:10px 12px;">${lastInfo}</td>
          <td style="padding:10px 12px; text-align:center;">${this.getWeeksAgoBadge(stat)}</td>
        </tr>
      `;
    }).join('');
  }

  /**
   * Tạo các dòng bảng lịch sử các tuần trước
   */
  buildHistoryTableRowsHtml() {
    const sorted = [...this.massSetsCache].sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da; // Mới nhất lên đầu
    });

    if (sorted.length === 0) {
      return `<tr><td colspan="6" style="text-align:center; padding:16px;">Chưa có lịch sử bộ lễ nào.</td></tr>`;
    }

    return sorted.map(m => {
      const r = m.liturgicalRoles || {};
      const isCur = m.id === this.selectedMassId;

      return `
        <tr style="border-bottom:1px solid var(--border); ${isCur ? 'background:rgba(107,63,160,0.04);' : ''}">
          <td style="padding:10px 12px;">
            <div style="font-weight:700; color:var(--text-main); font-size:0.88rem;">${m.title}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${m.date || '---'} ${m.active ? '⭐ (Hiện tại)' : ''}</div>
          </td>
          <td style="padding:10px 12px; color:var(--text-main);">${r.reader1 || '<span style="color:var(--text-muted);">-</span>'}</td>
          <td style="padding:10px 12px; color:var(--text-main);">${r.psalmist || r.dapca || '<span style="color:var(--text-muted);">-</span>'}</td>
          <td style="padding:10px 12px; color:var(--text-main);">${r.reader2 || '<span style="color:var(--text-muted);">-</span>'}</td>
          <td style="padding:10px 12px; color:var(--text-main);">${r.petitions || r.loinguyen || '<span style="color:var(--text-muted);">-</span>'}</td>
          <td style="padding:10px 12px; text-align:center;">
            <button type="button" class="btn btn-sm btn-outline" onclick="window.dohwaPhanCong.selectMass('${m.id}')" style="font-size:0.75rem; padding:4px 8px; border-radius:6px; cursor:pointer;">
              ${isCur ? 'Đang chọn' : 'Chọn lễ này'}
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  /**
   * Chuyển bộ lễ cần phân công
   */
  selectMass(massId) {
    this.selectedMassId = massId;
    this.loadSelectedMassAssignments();
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Xử lý khi thay đổi lựa chọn ca viên
   */
  onRoleSelectChange(roleKey, val) {
    const customInp = document.getElementById(`phancong-custom-${roleKey}`);
    if (val === '__custom__') {
      if (customInp) customInp.style.display = 'block';
      this.currentAssignments[roleKey] = customInp ? customInp.value.trim() : '';
    } else {
      if (customInp) customInp.style.display = 'none';
      this.currentAssignments[roleKey] = val;
    }
  }

  /**
   * Gán các sự kiện click, change
   */
  bindEvents() {
    const massSelect = document.getElementById('phanCongMassSelect');
    if (massSelect) {
      massSelect.addEventListener('change', (e) => {
        this.selectMass(e.target.value);
      });
    }

    const autoBtn = document.getElementById('btnAutoRotateSchedule');
    if (autoBtn) {
      autoBtn.addEventListener('click', () => this.autoRotate());
    }

    const saveBtn = document.getElementById('btnSaveSchedule');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveSchedule());
    }

    const copyBtn = document.getElementById('btnCopyScheduleZalo');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => this.copyZalo());
    }

    const searchInp = document.getElementById('phanCongSearchInput');
    if (searchInp) {
      searchInp.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        const tbody = document.querySelector('#tab-phancong .roster-table tbody');
        if (tbody) {
          tbody.innerHTML = this.buildStatsTableRowsHtml();
        }
      });
    }
  }
}

// Khởi tạo đối tượng toàn cục
window.dohwaPhanCong = new DohwaPhanCong();
