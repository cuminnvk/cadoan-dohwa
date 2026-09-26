/**
 * CA ĐOÀN DOHWA - PHÂN CÔNG PHỤNG VỤ & XOAY VÒNG BÀI ĐỌC
 * Tự động xoay vòng công bằng, không lặp lại tuần trước, sao chép tin nhắn Zalo 1 chạm
 */

class DohwaPhanCong {
  constructor() {
    this.dutyRoles = [
      { key: 'bd1', name: 'Bài Đọc 1', icon: '📖' },
      { key: 'dapca', name: 'Đáp Ca (Thánh Vịnh)', icon: '🎵' },
      { key: 'bd2', name: 'Bài Đọc 2', icon: '📜' },
      { key: 'loinguyen', name: 'Lời Nguyện Tín Hữu', icon: '🙏' },
      { key: 'dangle', name: 'Dâng Của Lễ', icon: '🍇' }
    ];

    this.currentAssignments = {};
    this.selectedWeek = this.getNextSundayDate();

    this.initEvents();
  }

  getNextSundayDate() {
    const today = new Date();
    const day = today.getDay();
    const diff = (7 - day) % 7;
    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + (diff === 0 ? 0 : diff));
    return nextSunday.toISOString().split('T')[0];
  }

  initEvents() {
    const weekInput = document.getElementById('dutyWeekSelect');
    if (weekInput) {
      weekInput.value = this.selectedWeek;
      weekInput.addEventListener('change', (e) => {
        this.selectedWeek = e.target.value;
        this.loadScheduleForWeek(this.selectedWeek);
      });
    }

    const autoRotateBtn = document.getElementById('btnAutoRotateDuty');
    if (autoRotateBtn) {
      autoRotateBtn.addEventListener('click', () => this.autoRotateSchedule());
    }

    const saveDutyBtn = document.getElementById('btnSaveDuty');
    if (saveDutyBtn) {
      saveDutyBtn.addEventListener('click', () => this.saveSchedule());
    }

    const copyZaloBtn = document.getElementById('btnCopyDutyZalo');
    if (copyZaloBtn) {
      copyZaloBtn.addEventListener('click', () => this.copyToZalo());
    }

    const addMemberBtn = document.getElementById('btnAddMember');
    if (addMemberBtn) {
      addMemberBtn.addEventListener('click', () => this.addNewMember());
    }
  }

  async loadScheduleForWeek(weekKey) {
    const roster = await window.dohwaStore.getRoster();
    const saved = await window.dohwaStore.getAssignment(weekKey);

    this.currentAssignments = {};
    if (saved && saved.duties) {
      saved.duties.forEach(d => {
        this.currentAssignments[d.roleKey] = d.personId;
      });
    }

    this.renderDutySlots(roster);
    this.renderRosterList(roster);
  }

  renderDutySlots(roster) {
    const container = document.getElementById('dutySlotsContainer');
    if (!container) return;

    const availableReaders = roster.filter(m => m.canRead !== false);

    container.innerHTML = this.dutyRoles.map(role => {
      const selectedId = this.currentAssignments[role.key] || '';
      return `
        <div class="duty-slot-card" style="background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); padding:12px 14px; margin-bottom:10px; display:flex; align-items:center; justify-content:space-between; gap:12px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="font-size:1.5rem;">${role.icon}</div>
            <div>
              <div style="font-weight:700; color:var(--text-main); font-size:0.92rem;">${role.name}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">Phụ trách đọc & xướng phụng vụ</div>
            </div>
          </div>
          <div style="min-width:200px;">
            <select class="form-control" onchange="dohwaPhanCong.setAssignment('${role.key}', this.value)">
              <option value="">-- Chưa phân công --</option>
              ${availableReaders.map(m => `
                <option value="${m.id}" ${m.id === selectedId ? 'selected' : ''}>${m.name} (${m.voice})</option>
              `).join('')}
            </select>
          </div>
        </div>
      `;
    }).join('');
  }

  setAssignment(roleKey, personId) {
    this.currentAssignments[roleKey] = personId;
  }

  // --- THUẬT TOÁN TỰ ĐỘNG XOAY VÒNG THÔNG MINH (ROUND-ROBIN) ---
  async autoRotateSchedule() {
    const roster = await window.dohwaStore.getRoster();
    const available = roster.filter(m => m.canRead !== false);

    if (available.length < this.dutyRoles.length) {
      alert(`Số lượng ca viên có thể đọc (${available.length}) ít hơn số vai trò (${this.dutyRoles.length}). Vui lòng bổ sung thêm nhân sự!`);
    }

    // Lấy lịch sử các tuần trước
    const allAssignments = await window.dohwaStore.getAllAssignments();
    
    // Tìm tuần gần nhất trước tuần này
    const pastWeeks = allAssignments
      .filter(a => a.weekKey < this.selectedWeek)
      .sort((a, b) => b.weekKey.localeCompare(a.weekKey));

    const lastWeek = pastWeeks[0];
    const lastWeekPeopleIds = lastWeek ? lastWeek.duties.map(d => d.personId) : [];

    // Tính điểm nghỉ (người nào càng nhiều tuần chưa được phân công thì ưu tiên)
    const personScore = {};
    available.forEach(m => {
      personScore[m.id] = 0;
      // Trừ điểm nếu tuần trước vừa mới đọc (tránh lặp lại tuần liên tiếp)
      if (lastWeekPeopleIds.includes(m.id)) {
        personScore[m.id] -= 10;
      }
    });

    // Cộng điểm cho mỗi tuần mà người đó không có tên
    pastWeeks.slice(0, 4).forEach((pw, weekIdx) => {
      const assignedInPw = pw.duties.map(d => d.personId);
      available.forEach(m => {
        if (!assignedInPw.includes(m.id)) {
          personScore[m.id] += (4 - weekIdx) * 2;
        }
      });
    });

    // Thêm yếu tố ngẫu nhiên nhẹ để xoay đều các bạn có điểm bằng nhau
    available.forEach(m => {
      personScore[m.id] += Math.random() * 0.5;
    });

    // Sắp xếp danh sách người theo điểm ưu tiên từ cao xuống thấp
    const sortedCandidates = [...available].sort((a, b) => personScore[b.id] - personScore[a.id]);

    // Gán vai trò
    this.currentAssignments = {};
    this.dutyRoles.forEach((role, idx) => {
      if (sortedCandidates[idx]) {
        this.currentAssignments[role.key] = sortedCandidates[idx].id;
      }
    });

    this.renderDutySlots(roster);
    alert('Đã tạo đề xuất xoay vòng phân công thông minh (không lặp lại người tuần trước)!');
  }

  async saveSchedule() {
    const roster = await window.dohwaStore.getRoster();
    const massTitleInput = document.getElementById('dutyMassTitle');
    const massTitle = massTitleInput ? massTitleInput.value : `Chúa Nhật ngày ${this.selectedWeek}`;

    const duties = this.dutyRoles.map(role => {
      const personId = this.currentAssignments[role.key] || '';
      const person = roster.find(m => m.id === personId);
      return {
        roleKey: role.key,
        roleName: role.name,
        personId: personId,
        personName: person ? person.name : 'Chưa phân công',
        voice: person ? person.voice : ''
      };
    });

    const assignment = {
      weekKey: this.selectedWeek,
      massTitle: massTitle,
      duties: duties,
      updatedAt: new Date().toISOString()
    };

    await window.dohwaStore.saveAssignment(assignment);
    alert('Đã lưu bảng phân công phụng vụ tuần này thành công!');

    if (window.dohwaApp) {
      window.dohwaApp.loadCurrentMassSet();
    }
  }

  async copyToZalo() {
    const roster = await window.dohwaStore.getRoster();
    const saved = await window.dohwaStore.getAssignment(this.selectedWeek);
    const mass = await window.dohwaStore.getActiveMassSet();

    const title = saved ? saved.massTitle : (mass ? mass.title : `Lễ Chúa Nhật ${this.selectedWeek}`);
    
    let msg = `📋 PHÂN CÔNG PHỤNG VỤ - CA ĐOÀN DOHWA\n`;
    msg += `⛪ ${title}\n`;
    msg += `🗓 Ngày: ${this.selectedWeek}\n`;
    msg += `------------------------------------\n`;
    msg += `📖 PHÂN CÔNG BÀI ĐỌC:\n`;

    this.dutyRoles.forEach(r => {
      const personId = this.currentAssignments[r.key];
      const person = roster.find(m => m.id === personId);
      const name = person ? `${person.name} (${person.voice})` : 'Chưa phân công';
      msg += `• ${r.name}: ${name}\n`;
    });

    if (mass && mass.songs && mass.songs.length) {
      msg += `\n🎶 BỘ LỄ HÁT:\n`;
      mass.songs.forEach((s, idx) => {
        msg += `${idx + 1}. ${s.roleLabel}: ${s.title}${s.composer ? ` (${s.composer})` : ''}\n`;
      });
    }

    msg += `\n👉 Ca viên mở web để xem nốt nhạc & nghe mẫu bài hát!`;

    navigator.clipboard.writeText(msg).then(() => {
      alert('Đã sao chép nội dung thông báo! Bạn có thể mở nhóm Zalo ca đoàn và dán (Ctrl+V) ngay.');
    }).catch(() => {
      prompt('Hãy sao chép nội dung bên dưới để gửi Zalo:', msg);
    });
  }

  // --- QUẢN LÝ THÀNH VIÊN CA ĐOÀN ---
  renderRosterList(roster) {
    const tbody = document.getElementById('rosterTableBody');
    if (!tbody) return;

    if (roster.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:16px;">Chưa có ca viên nào. Bấm "Thêm Ca Viên" để nhập!</td></tr>`;
      return;
    }

    tbody.innerHTML = roster.map((m, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${m.name}</strong></td>
        <td><span class="voice-badge voice-${m.voice.toLowerCase()}">${m.voice}</span></td>
        <td>${m.phone || '---'}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="dohwaPhanCong.deleteMember('${m.id}')">🗑️</button>
        </td>
      </tr>
    `).join('');
  }

  async addNewMember() {
    const name = prompt('Nhập Họ và Tên ca viên (kèm Tên Thánh nếu có):');
    if (!name || !name.trim()) return;

    const voice = prompt('Chọn Bè (Soprano, Alto, Tenor, Bass):', 'Soprano');
    const phone = prompt('Số điện thoại (tùy chọn):', '');

    await window.dohwaStore.saveMember({
      name: name.trim(),
      voice: voice ? voice.trim() : 'Soprano',
      phone: phone ? phone.trim() : '',
      canRead: true
    });

    const roster = await window.dohwaStore.getRoster();
    this.renderDutySlots(roster);
    this.renderRosterList(roster);
  }

  async deleteMember(id) {
    if (confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi danh sách ca đoàn?')) {
      await window.dohwaStore.deleteMember(id);
      const roster = await window.dohwaStore.getRoster();
      this.renderDutySlots(roster);
      this.renderRosterList(roster);
    }
  }
}

// Global PhanCong
window.dohwaPhanCong = new DohwaPhanCong();
