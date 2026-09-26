/**
 * CA ĐOÀN DOHWA - THỐNG KÊ CHUYÊN CẦN & ĐIỂM DANH HỌC BÀI
 * Lưu vĩnh viễn tên ca viên trên máy, ghi nhận số lần vào xem nốt nhạc
 */

class DohwaThongKe {
  constructor() {
    this.currentMassSetId = null;
  }

  async loadStats(massSetId) {
    this.currentMassSetId = massSetId;
    const records = await window.dohwaStore.getAttendanceForMass(massSetId);
    const roster = await window.dohwaStore.getRoster();

    const totalViews = records.reduce((sum, r) => sum + (r.viewsCount || 1), 0);
    const uniqueCount = records.length;
    const rosterCount = roster.length;
    const percent = rosterCount > 0 ? Math.round((uniqueCount / rosterCount) * 100) : 0;

    // Cập nhật card tổng quan
    const totalViewsEl = document.getElementById('statTotalViews');
    const uniqueMembersEl = document.getElementById('statUniqueMembers');
    const percentEl = document.getElementById('statPercent');

    if (totalViewsEl) totalViewsEl.textContent = totalViews;
    if (uniqueMembersEl) uniqueMembersEl.textContent = `${uniqueCount} / ${rosterCount}`;
    if (percentEl) percentEl.textContent = `${percent}%`;

    // Render bảng chi tiết
    const tbody = document.getElementById('statAttendanceBody');
    if (!tbody) return;

    if (records.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:16px; color:var(--text-muted);">Chưa có ca viên nào vào xem bài hát tuần này.</td></tr>`;
      return;
    }

    // Sắp xếp người xem gần nhất lên đầu
    const sorted = [...records].sort((a, b) => new Date(b.lastViewedAt) - new Date(a.lastViewedAt));

    tbody.innerHTML = sorted.map((r, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>
          <strong>${r.memberName}</strong>
          <span class="voice-badge voice-${(r.voice || '').toLowerCase()}" style="margin-left:6px;">${r.voice || 'Ca Viên'}</span>
        </td>
        <td><span style="font-weight:700; color:var(--primary); font-size:1rem;">${r.viewsCount || 1}</span> lần</td>
        <td style="color:var(--text-muted); font-size:0.8rem;">${this.formatTimeAgo(r.lastViewedAt)}</td>
      </tr>
    `).join('');
  }

  formatTimeAgo(isoString) {
    if (!isoString) return '---';
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'Vừa mới xem';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  checkAndPromptUser() {
    const profile = window.dohwaStore ? window.dohwaStore.getUserProfile() : null;
    if (profile) {
      this.updateHeaderBadge(profile);
    }
  }

  async showNamePromptModal() {
    const roster = await window.dohwaStore.getRoster();
    const modal = document.getElementById('nameSelectModal');
    const select = document.getElementById('modalMemberSelect');

    if (!modal) return;

    if (select && roster.length) {
      select.innerHTML = `
        <option value="">-- Chọn tên bạn trong danh sách --</option>
        ${roster.map(m => `<option value="${m.name}" data-voice="${m.voice}">${m.name} (${m.voice})</option>`).join('')}
        <option value="__other__">+ Nhập tên khác...</option>
      `;
    }

    modal.style.display = 'flex';
  }

  saveSelectedUser() {
    const select = document.getElementById('modalMemberSelect');
    const customInput = document.getElementById('modalCustomName');
    const customVoice = document.getElementById('modalCustomVoice');
    const modal = document.getElementById('nameSelectModal');

    let name = '';
    let voice = 'Soprano';

    if (select && select.value === '__other__') {
      name = customInput ? customInput.value.trim() : '';
      voice = customVoice ? customVoice.value : 'Soprano';
    } else if (select && select.value) {
      name = select.value;
      const opt = select.selectedOptions[0];
      voice = opt ? opt.getAttribute('data-voice') : 'Soprano';
    }

    if (!name) {
      alert('Vui lòng chọn hoặc nhập tên của bạn để ca trưởng ghi nhận nhé!');
      return;
    }

    const profile = window.dohwaStore.setUserProfile(name, voice);
    this.updateHeaderBadge(profile);

    if (modal) modal.style.display = 'none';

    // Ghi nhận lượt xem ngay lập tức
    if (window.dohwaApp && window.dohwaApp.currentMassSet) {
      window.dohwaStore.recordView(window.dohwaApp.currentMassSet.id, name, voice);
    }
  }

  updateHeaderBadge(profile) {
    const badge = document.getElementById('userHeaderBadge');
    if (!badge || !profile) return;
    badge.innerHTML = `👤 ${profile.name} <span class="voice-pill">${profile.voice}</span>`;
  }
}

// Global ThongKe
window.dohwaThongKe = new DohwaThongKe();
