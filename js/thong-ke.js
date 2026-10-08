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
    const currentMs = window.dohwaApp?.currentMassSet;
    const currentTitleEl = document.getElementById('statCurrentMassTitle');
    if (currentTitleEl) {
      currentTitleEl.textContent = currentMs ? `${currentMs.title} (${window.dohwaApp?.formatDisplayDate(currentMs.date) || ''})` : 'Bộ Lễ Đang Chọn';
    }

    const records = await window.dohwaStore.getAttendanceForMass(massSetId);
    const roster = await window.dohwaStore.getRoster();

    const totalViews = records.reduce((sum, r) => sum + (r.count || r.viewsCount || 1), 0);
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

    // Render bảng chi tiết bộ lễ hiện tại
    const tbody = document.getElementById('statAttendanceBody');
    if (tbody) {
      if (records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:16px; color:var(--text-muted);">Chưa có ca viên nào vào xem bài hát tuần này.</td></tr>`;
      } else {
        const sorted = [...records].sort((a, b) => new Date(b.lastViewed || b.lastViewedAt) - new Date(a.lastViewed || a.lastViewedAt));
        tbody.innerHTML = sorted.map((r, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>
              <strong>${r.name || r.memberName}</strong>
              <span class="voice-badge voice-${(r.voice || '').toLowerCase()}" style="margin-left:6px;">${r.voice || 'Ca Viên'}</span>
            </td>
            <td><span style="font-weight:700; color:var(--primary); font-size:1rem;">${r.count || r.viewsCount || 1}</span> lần</td>
            <td style="color:var(--text-muted); font-size:0.8rem;">${this.formatTimeAgo(r.lastViewed || r.lastViewedAt)}</td>
          </tr>
        `).join('');
      }
    }

    // Tải toàn bộ thống kê tất cả các bộ lễ & Leaderboard ca viên
    try {
      if (window.dohwaStore?.getAllMassAttendanceSummary) {
        const summary = await window.dohwaStore.getAllMassAttendanceSummary();
        if (summary) {
          // 1. Leaderboard
          const lbBody = document.getElementById('statLeaderboardBody');
          if (lbBody) {
            if (!summary.leaderboard || !summary.leaderboard.length) {
              lbBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:16px; color:var(--text-muted);">Chưa có dữ liệu chuyên cần.</td></tr>`;
            } else {
              lbBody.innerHTML = summary.leaderboard.map((m, idx) => {
                let rankText = `#${idx + 1}`;
                if (idx === 0) rankText = '🥇 1';
                else if (idx === 1) rankText = '🥈 2';
                else if (idx === 2) rankText = '🥉 3';

                return `
                  <tr>
                    <td style="text-align:center; font-weight:800; color:${idx < 3 ? '#d97706' : 'var(--text-muted)'};">${rankText}</td>
                    <td>
                      <strong>${m.name}</strong>
                      <span style="font-size:0.72rem; color:var(--text-muted); margin-left:4px;">(${m.voice})</span>
                    </td>
                    <td style="text-align:center; font-weight:800; color:#6b3fa0;">${m.totalViews} lần</td>
                    <td style="text-align:center; font-weight:600; color:#475569;">${m.massSetsCount} bộ lễ</td>
                    <td style="text-align:center;">
                      <span style="font-size:0.72rem; font-weight:700; color:${m.badgeColor || '#64748b'}; background:rgba(0,0,0,0.04); padding:2px 6px; border-radius:6px; white-space:nowrap;">
                        ${m.rankBadge || '---'}
                      </span>
                    </td>
                  </tr>
                `;
              }).join('');
            }
          }

          // 2. Thống kê từng bộ lễ
          const massBody = document.getElementById('statMassSetsBody');
          if (massBody) {
            if (!summary.massStats || !summary.massStats.length) {
              massBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:16px; color:var(--text-muted);">Chưa có bộ lễ nào.</td></tr>`;
            } else {
              massBody.innerHTML = summary.massStats.map((ms, idx) => `
                <tr>
                  <td style="text-align:center; color:var(--text-muted);">${idx + 1}</td>
                  <td>
                    <div style="font-weight:700; color:var(--text-main);">${ms.title} ${ms.active ? '<span style="color:#16a34a; font-size:0.72rem;">(Hiện tại)</span>' : ''}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${window.dohwaApp?.formatDisplayDate(ms.date) || ms.date}</div>
                  </td>
                  <td style="text-align:center;">
                    <span style="font-weight:800; color:#0284c7; background:rgba(2,132,199,0.1); padding:2px 8px; border-radius:6px;">
                      ${ms.totalViews}
                    </span>
                  </td>
                  <td style="text-align:center; font-weight:600; color:#475569;">${ms.uniqueCount} người</td>
                  <td style="text-align:center;">
                    <button type="button" class="btn-xs btn-outline" onclick="window.dohwaApp?.openAiDaXemModal('${ms.id}')" style="padding:3px 8px; font-size:0.72rem; font-weight:700; color:#6b3fa0; border-color:#6b3fa0; border-radius:6px; cursor:pointer;">
                      🔍 Chi tiết
                    </button>
                  </td>
                </tr>
              `).join('');
            }
          }
        }
      }
    } catch (e) {
      console.warn('Lỗi tải toàn bộ thống kê:', e);
    }
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
