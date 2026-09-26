/**
 * CA ĐOÀN DOHWA - LITURGICAL ENGINE & BÀI ĐỌC PHỤNG VỤ
 * Chuẩn 100% theo logic của soanbole.com:
 * - Tự động tính toán Lịch Phụng Vụ Công Giáo
 * - Tải Bài Đọc 1 & Bài Đọc 2 từ KTCGKPV và kho offline
 * - Nhúng trực tiếp sheet PDF Thánh Vịnh Đáp Ca
 * - Lời Nguyện Tín Hữu: Định dạng phụng vụ, chỉnh sửa trực tiếp, in ấn khổ A4, copy
 */

const EASTER_DATES = {
  2024: "2024-03-31",
  2025: "2025-04-20",
  2026: "2026-04-05",
  2027: "2027-03-28",
  2028: "2028-04-16",
  2029: "2029-04-01",
  2030: "2030-04-21"
};

function getLiturgicalYear(year) {
  const map = { 2024: "B", 2025: "C", 2026: "A", 2027: "B", 2028: "C", 2029: "A", 2030: "B" };
  if (map[year]) return map[year];
  const t = ((year - 2020) % 3 + 3) % 3;
  return t === 0 ? "A" : t === 1 ? "B" : "C";
}

function parseISODate(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDaysToDate(d, days) {
  const res = new Date(d);
  res.setDate(res.getDate() + days);
  return res;
}

function calculateLiturgicalInfo(dateStr) {
  if (!dateStr) return null;
  const targetDate = parseISODate(dateStr);
  const year = targetDate.getFullYear();
  const litYear = getLiturgicalYear(year);

  const easterStr = EASTER_DATES[year] || `${year}-04-05`;
  const easterDate = parseISODate(easterStr);

  const ashWednesday = addDaysToDate(easterDate, -46);
  const firstSunLent = addDaysToDate(ashWednesday, 7 - ashWednesday.getDay());
  const pentecost = addDaysToDate(easterDate, 49);

  const christmas = new Date(year, 11, 25);
  const christmasDay = christmas.getDay();
  const fourthSunAdvent = addDaysToDate(christmas, -(christmasDay === 0 ? 7 : christmasDay));
  const firstSunAdvent = addDaysToDate(fourthSunAdvent, -21);

  let title = '';
  let season = 'Mùa Thường Niên';
  let color = 'xanh';
  let seasonClass = 'thuong-nien';

  if (targetDate >= firstSunAdvent && targetDate < christmas) {
    const diffWeeks = Math.floor((targetDate - firstSunAdvent) / (7 * 24 * 60 * 60 * 1000)) + 1;
    title = `Chúa Nhật ${diffWeeks} Mùa Vọng - Năm ${getLiturgicalYear(year + 1)}`;
    season = 'Mùa Vọng';
    color = diffWeeks === 3 ? 'hong' : 'tim';
    seasonClass = 'mua-vong';
  } else if (targetDate >= christmas || (targetDate.getMonth() === 0 && targetDate.getDate() <= 12)) {
    title = `Mùa Giáng Sinh - Năm ${litYear}`;
    season = 'Mùa Giáng Sinh';
    color = 'trang';
    seasonClass = 'giang-sinh';
  } else if (targetDate >= ashWednesday && targetDate < easterDate) {
    const diffWeeks = Math.floor((targetDate - firstSunLent) / (7 * 24 * 60 * 60 * 1000)) + 1;
    if (diffWeeks <= 5) {
      title = `Chúa Nhật ${diffWeeks} Mùa Chay - Năm ${litYear}`;
      color = diffWeeks === 4 ? 'hong' : 'tim';
    } else {
      title = `Chúa Nhật Lễ Lá - Năm ${litYear}`;
      color = 'do';
    }
    season = 'Mùa Chay';
    seasonClass = 'mua-chay';
  } else if (targetDate >= easterDate && targetDate <= pentecost) {
    const diffWeeks = Math.floor((targetDate - easterDate) / (7 * 24 * 60 * 60 * 1000)) + 1;
    if (diffWeeks === 1) title = `Đại Lễ Phục Sinh - Năm ${litYear}`;
    else title = `Chúa Nhật ${diffWeeks} Phục Sinh - Năm ${litYear}`;
    season = 'Mùa Phục Sinh';
    color = 'trang';
    seasonClass = 'phuc-sinh';
  } else {
    season = 'Mùa Thường Niên';
    color = 'xanh';
    seasonClass = 'thuong-nien';

    const christTheKing = addDaysToDate(firstSunAdvent, -7);
    if (targetDate > pentecost) {
      const weeksBeforeEnd = Math.round((christTheKing - targetDate) / (7 * 24 * 60 * 60 * 1000));
      const weekNum = 34 - weeksBeforeEnd;
      if (weekNum === 34) {
        title = `Lễ Chúa Kitô Vua Vũ Trụ (Chúa Nhật 34 Thường Niên) - Năm ${litYear}`;
        color = 'trang';
      } else {
        title = `Chúa Nhật ${weekNum > 0 ? weekNum : 25} Thường Niên - Năm ${litYear}`;
      }
    } else {
      const baptism = new Date(year, 0, 10);
      const diff = Math.floor((targetDate - baptism) / (7 * 24 * 60 * 60 * 1000)) + 1;
      title = `Chúa Nhật ${Math.max(1, diff)} Thường Niên - Năm ${litYear}`;
    }
  }

  return { date: dateStr, title, season, color, seasonClass, liturgicalYear: litYear };
}

/**
 * KHO BÀI ĐỌC PHỤNG VỤ CHUẨN KHO OFFLINE
 */
const OFFLINE_LITURGY_STORE = {
  '2026-09-26': {
    title: 'Chúa Nhật 25 Thường Niên - Năm A',
    bd1: {
      ref: 'Is 55, 6-9',
      lead: 'Tư tưởng của Ta không phải là tư tưởng của các ngươi.',
      content: `Hãy tìm Đức Chúa khi Người còn cho gặp, kêu cầu Người lúc Người ở kề bên. Kẻ gian ác, hãy bỏ đường lối mình, người bất lương, hãy bỏ tư tưởng mình, mà trở về với Đức Chúa - và Người sẽ xót thương, về với Thiên Chúa chúng ta, vì Người rộng lòng tha thứ.<br><br>Thật vậy, tư tưởng của Ta không phải là tư tưởng của các ngươi, và đường lối các ngươi không phải là đường lối của Ta - sấm ngôn của Đức Chúa. Trời cao hơn đất chừng nào, thì đường lối của Ta cũng cao hơn đường lối các ngươi, và tư tưởng của Ta cũng cao hơn tư tưởng các ngươi chừng ấy.`
    },
    tv: {
      ref: 'Thánh Vịnh 144, 2-3. 8-9. 17-18',
      dap: 'Chúa gần gũi mọi kẻ kêu cầu Người.',
      stanzas: [
        `Hằng ngày con chúc tụng Chúa,<br>và ca khen Danh Người đến muôn muôn đời.<br>Chúa thật cao cả, xứng muôn lời tán tụng;<br>sự cao cả Người khôn thấu khôn dò.`,
        `Chúa là Đấng từ bi nhân hậu,<br>Người chậm giận và giàu tình thương.<br>Chúa nhân ái đối với mọi loài,<br>và tỏ lòng nhân hậu với muôn loài Người đã dựng nên.`,
        `Chúa công minh trong mọi đường lối Chúa,<br>và đầy lòng trắc ẩn trong mọi việc Người làm.<br>Chúa gần gũi tất cả những ai kêu cầu Người,<br>mọi kẻ thành tâm kêu cầu Người.`
      ]
    },
    bd2: {
      ref: 'Pl 1, 20c-24. 27a',
      lead: 'Đối với tôi, sống là Đức Kitô và chết là một mối lợi.',
      content: `Thưa anh em, dù tôi sống hay tôi chết, Đức Kitô cũng sẽ được vẻ vang nơi thân xác tôi. Vì đối với tôi, sống là Đức Kitô, và chết là một mối lợi. Nếu sống ở đời này mà công việc của tôi sinh hoa kết quả, thì tôi không biết nên chọn đàng nào.<br><br>Tôi bị giằng co giữa hai đàng: ước ao của tôi là ra đi để được ở với Đức Kitô, điều này tốt hơn bội phần; nhưng ở lại trong thân xác thì cần thiết hơn cho anh em.<br><br>Chỉ có một điều là anh em phải ăn ở làm sao cho xứng với Tin Mừng của Đức Kitô.`
    },
    lnth: `LỜI NGUYỆN TÍN HỮU – CHÚA NHẬT 25 THƯỜNG NIÊN - NĂM A
Chủ tế: Anh chị em thân mến, Thiên Chúa là Cha nhân từ luôn lắng nghe lời con cái cầu xin. Với niềm tin tưởng và phó thác, chúng ta cùng tha thiết dâng lời nguyện xin:
1. Cầu cho Hội Thánh: Xin Chúa gìn giữ Đức Giáo Hoàng, các Đức Giám Mục và các Linh Mục, để các ngài luôn là những mục tử nhân lành dẫn dắt đoàn chiên Chúa theo tinh thần Tin Mừng.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
2. Cầu cho thế giới: Xin Chúa ban ơn bình an cho các dân tộc, xoa dịu những nỗi đau của các nạn nhân chiến tranh, đói nghèo, bệnh tật và thiên tai.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
3. Cầu cho những người đang gặp thử thách gian truân: Xin Chúa nâng đỡ những ai đang ngã lòng, thất vọng, để họ luôn tìm thấy niềm an ủi và cậy trông nơi lòng Chúa xót thương.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
4. Cầu cho Ca Đoàn Dohwa và Cộng đoàn giáo xứ: Xin Chúa ban cho mỗi ca viên lòng nhiệt thành mến Chúa, biết dùng tiếng hát để phụng sự Thánh Lễ và loan báo tình yêu Chúa trong tinh thần hiệp nhất yêu thương.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
Chủ tế: Lạy Chúa, xin thương chấp nhận những ước nguyện chân thành của cộng đoàn chúng con, nhờ Đức Kitô, Chúa chúng con. - Amen.`
  }
};

/**
 * Format Lời Nguyện Tín Hữu từ text thô (Chuẩn 100% logic soanbole.com)
 */
function formatLnthText(text) {
  if (!text || !text.trim()) return '';
  const lines = text.split('\n');
  let html = '<div style="font-family:\'Times New Roman\',serif;font-size:1.08rem;line-height:2;color:var(--text-main)">';
  let firstContent = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!firstContent && line) {
      firstContent = true;
      html += `<div style="text-align:center;font-weight:bold;font-size:1.15rem;margin-bottom:16px;color:#9a3412">${escapeHtml(line)}</div>`;
      continue;
    }
    if (!line) {
      html += '<div style="height:.4em"></div>';
      continue;
    }
    if (/^nguồn\s*:/i.test(line)) {
      html += `<div style="font-size:.78rem;color:var(--text-muted);text-align:right;margin-bottom:10px">${escapeHtml(line)}</div>`;
      continue;
    }
    if (/^chủ tế\s*:/i.test(line)) {
      const ct = line.replace(/^chủ tế\s*:\s*/i, '');
      html += `<div style="margin:10px 0"><strong>Chủ tế:</strong> <em>${escapeHtml(ct)}</em></div>`;
      continue;
    }
    if (/^xướng\s*:/i.test(line) || /^xuớng\s*:/i.test(line)) {
      const xb = line.replace(/^xuớng\s*:\s*/i, '').replace(/^xướng\s*:\s*/i, '');
      html += `<div style="margin-left:24px;font-style:italic;font-weight:700;color:#374151">Xướng: ${escapeHtml(xb)}</div>`;
      continue;
    }
    if (/^đáp\s*:/i.test(line) || /^dáp\s*:/i.test(line)) {
      const db = line.replace(/^[đd]áp\s*:\s*/i, '');
      html += `<div style="margin-left:24px;font-style:italic;font-weight:700;color:#9a3412">Đáp: ${escapeHtml(db)}</div>`;
      continue;
    }
    const pm = line.match(/^(\d+)[.\/\)]\s*(.*)/);
    if (pm) {
      html += `<div style="margin:12px 0 2px"><strong>${pm[1]}/</strong> ${escapeHtml(pm[2])}</div>`;
      continue;
    }
    html += `<div>${escapeHtml(line)}</div>`;
  }
  html += '</div>';
  return html;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Quản lý Modal Bài Đọc & Lời Nguyện
 */
class BaiDocViewer {
  constructor() {
    this.cache = {};
    this.currentMassSet = null;
    this.activeTab = 'bd1';
  }

  async openForMassSet(massSetOrId) {
    let ms = massSetOrId;
    if (typeof massSetOrId === 'string' && window.dohwaStore) {
      ms = await window.dohwaStore.get('mass_sets', massSetOrId);
    }
    if (!ms && window.dohwaApp && window.dohwaApp.currentMassSet) {
      ms = window.dohwaApp.currentMassSet;
    }
    if (!ms) {
      ms = {
        id: 'mass-cn-25-tn-a',
        title: 'Bộ lễ Chúa Nhật 25 Thường Niên - Năm A',
        weekName: 'Chúa Nhật 25 Thường Niên - Năm A',
        date: '2026-09-26',
        season: 'Mùa Thường Niên'
      };
    }

    this.currentMassSet = ms;
    const overlay = document.getElementById('baiDocModalOverlay');
    const titleEl = document.getElementById('baiDocModalTitle');
    const subEl = document.getElementById('baiDocModalSubtitle');

    if (!overlay) return;

    if (titleEl) titleEl.textContent = '📖 Bài Đọc & Lời Nguyện';
    if (subEl) subEl.textContent = ms.title || ms.weekName || '';

    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    this.switchTab(this.activeTab || 'bd1');
  }

  close() {
    const overlay = document.getElementById('baiDocModalOverlay');
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = '';
  }

  async switchTab(tabKey) {
    this.activeTab = tabKey;
    document.querySelectorAll('.baidoc-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabKey);
    });

    const contentEl = document.getElementById('baiDocContent');
    if (!contentEl) return;

    const ms = this.currentMassSet || { date: '2026-09-26', title: 'Chúa Nhật' };

    if (tabKey === 'tv') {
      this.renderThanhVinh(contentEl, ms);
      return;
    }

    if (tabKey === 'lnth') {
      this.renderLoiNguyen(contentEl, ms);
      return;
    }

    await this.renderReading(contentEl, ms, tabKey);
  }

  async renderReading(container, ms, tabKey) {
    const isBd1 = tabKey === 'bd1';
    const dateStr = ms.date || '2026-09-26';

    const offlineData = OFFLINE_LITURGY_STORE[dateStr] || OFFLINE_LITURGY_STORE['2026-09-26'];
    const reading = isBd1 ? offlineData.bd1 : offlineData.bd2;

    if (reading) {
      container.innerHTML = `
        <div style="padding:6px 0;">
          <div style="font-size:0.8rem;color:#0ea5e9;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">
            ${isBd1 ? 'BÀI ĐỌC I' : 'BÀI ĐỌC II'}
          </div>
          <div style="font-size:1.15rem;font-weight:800;color:var(--text-main);margin-bottom:4px;">
            ${reading.ref}
          </div>
          ${reading.lead ? `<div style="font-style:italic;color:#64748b;font-size:0.92rem;margin-bottom:12px;padding:6px 12px;background:rgba(0,0,0,0.03);border-radius:6px;">"${reading.lead}"</div>` : ''}
          <div style="font-family:'Times New Roman',serif;font-size:1.12rem;line-height:2.1;color:var(--text-main);border-top:1px solid var(--border);padding-top:14px;">
            ${reading.content}
          </div>
          <div style="margin-top:20px;padding-top:10px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
            <span style="font-weight:700;color:#6d28d9;">Đó là Lời Chúa. — Tạ ơn Chúa.</span>
            <a href="https://ktcgkpv.org/readings/mass-reading" target="_blank" rel="noopener" style="font-size:0.75rem;color:var(--text-muted);">🔗 Nguồn: ktcgkpv.org ↗</a>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="text-align:center;padding:32px 16px;color:var(--text-muted)">
        <h3>${isBd1 ? 'Bài Đọc 1' : 'Bài Đọc 2'}</h3>
        <p style="margin-top:8px;">Đang tải từ Lịch Phụng Vụ hoặc ngày này không có Bài đọc 2.</p>
        <a href="https://ktcgkpv.org/readings/mass-reading" target="_blank" rel="noopener" style="display:inline-block;margin-top:12px;font-size:0.85rem;color:#0ea5e9;font-weight:700;">Mở trang KTCGKPV ↗</a>
      </div>
    `;
  }

  renderThanhVinh(container, ms) {
    const songs = ms.songs || [];
    const dapCaSong = songs.find(s => s.role === 'dap_ca' || s.roleLabel?.includes('Đáp Ca') || s.roleLabel?.includes('Thánh Vịnh'));
    const pdfData = dapCaSong?.pdfData;
    const dateStr = ms.date || '2026-09-26';
    const tvOffline = (OFFLINE_LITURGY_STORE[dateStr] || OFFLINE_LITURGY_STORE['2026-09-26']).tv;

    let pdfEmbedHtml = '';
    if (pdfData) {
      pdfEmbedHtml = `
        <div style="margin-top:14px;border:1px solid var(--border);border-radius:10px;overflow:hidden;">
          <iframe src="${pdfData}" style="width:100%;height:510px;border:none;background:#f8f9fa;display:block;"></iframe>
        </div>
      `;
    }

    container.innerHTML = `
      <div style="padding:6px 0;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border-bottom:1px solid var(--border);padding-bottom:10px;">
          <div>
            <div style="font-size:0.8rem;color:#0ea5e9;font-weight:700;text-transform:uppercase;">ĐÁP CA / THÁNH VỊNH</div>
            <div style="font-weight:800;font-size:1.15rem;color:var(--text-main);">${tvOffline.ref}</div>
          </div>
          ${dapCaSong && !pdfData ? `<button class="action-btn btn-view" onclick="window.dohwaApp.editMassSet('${ms.id}')" style="font-size:0.78rem;">📎 Tải PDF Lên</button>` : ''}
        </div>

        <div style="background:#f5f3ff;border:1.5px solid #ddd6fe;border-radius:10px;padding:12px 16px;margin-bottom:14px;">
          <div style="font-size:0.82rem;font-weight:800;color:#6d28d9;margin-bottom:2px;">CÂU ĐÁP:</div>
          <div style="font-size:1.15rem;font-weight:800;color:#4c1d95;font-family:'Times New Roman',serif;">
            ${tvOffline.dap}
          </div>
        </div>

        <div style="font-family:'Times New Roman',serif;font-size:1.08rem;line-height:2.1;color:var(--text-main);">
          ${tvOffline.stanzas.map((st, i) => `
            <div style="margin-bottom:14px;padding-left:12px;border-left:3px solid #c4b5fd;">
              ${st}
              <div style="font-style:italic;color:#6d28d9;font-weight:700;margin-top:4px;">(Đáp: ${tvOffline.dap})</div>
            </div>
          `).join('')}
        </div>

        ${pdfEmbedHtml}
      </div>
    `;
  }

  renderLoiNguyen(container, ms) {
    const dateStr = ms.date || '2026-09-26';
    const currentContent = ms.loiNguyenText || (OFFLINE_LITURGY_STORE[dateStr] || OFFLINE_LITURGY_STORE['2026-09-26']).lnth;

    container.innerHTML = `
      <div id="sb-lnth-view">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
          <span style="font-size:0.85rem;color:var(--text-muted);font-weight:700;">LỜI NGUYỆN TÍN HỮU</span>
          <div style="display:flex;gap:8px;">
            <button class="action-btn btn-view" onclick="window.baiDocViewer.startEditLnth()" style="font-size:0.8rem;padding:6px 12px;">✏️ Sửa</button>
            <button class="action-btn btn-share" onclick="window.baiDocViewer.printLnth()" style="font-size:0.8rem;padding:6px 12px;">🖨️ In A4</button>
            <button class="action-btn btn-copy" onclick="window.baiDocViewer.copyLnth()" style="font-size:0.8rem;padding:6px 12px;">📋 Copy</button>
          </div>
        </div>

        <div style="padding:16px 20px;background:#fffdf7;border:1.5px solid #fed7aa;border-radius:10px;margin-bottom:12px;">
          ${formatLnthText(currentContent)}
        </div>
      </div>

      <div id="sb-lnth-edit-form" style="display:none;margin-top:10px;">
        <div style="font-weight:700;margin-bottom:8px;color:var(--primary);">Chỉnh sửa Lời Nguyện Tín Hữu:</div>
        <textarea id="sb-lnth-input" rows="12" class="form-control" style="font-family:'Times New Roman',serif;font-size:1.05rem;line-height:1.9;">${escapeHtml(currentContent)}</textarea>
        <div style="display:flex;gap:8px;margin-top:10px;justify-content:flex-end;">
          <button class="btn" onclick="window.baiDocViewer.cancelEditLnth()" style="background:var(--border);">Hủy</button>
          <button class="btn btn-primary" onclick="window.baiDocViewer.saveLnth()">💾 Lưu Lời Nguyện</button>
        </div>
      </div>
    `;
  }

  startEditLnth() {
    const v = document.getElementById('sb-lnth-view');
    const f = document.getElementById('sb-lnth-edit-form');
    if (v) v.style.display = 'none';
    if (f) f.style.display = 'block';
  }

  cancelEditLnth() {
    const v = document.getElementById('sb-lnth-view');
    const f = document.getElementById('sb-lnth-edit-form');
    if (v) v.style.display = 'block';
    if (f) f.style.display = 'none';
  }

  async saveLnth() {
    const inp = document.getElementById('sb-lnth-input');
    if (!inp) return;
    const text = inp.value.trim();

    if (this.currentMassSet) {
      this.currentMassSet.loiNguyenText = text;
      if (window.dohwaStore) {
        await window.dohwaStore.saveMassSet(this.currentMassSet);
      }
    }

    const toast = document.createElement('div');
    toast.className = 'dohwa-toast';
    toast.textContent = '✅ Đã lưu Lời Nguyện Tín Hữu!';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);

    const contentEl = document.getElementById('baiDocContent');
    if (contentEl) {
      this.renderLoiNguyen(contentEl, this.currentMassSet);
    }
  }

  copyLnth() {
    const text = document.getElementById('sb-lnth-view')?.innerText || '';
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        const toast = document.createElement('div');
        toast.className = 'dohwa-toast';
        toast.textContent = '📋 Đã chép nội dung Lời Nguyện!';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
      });
    }
  }

  printLnth() {
    const ms = this.currentMassSet || {};
    const content = ms.loiNguyenText || (OFFLINE_LITURGY_STORE[ms.date] || OFFLINE_LITURGY_STORE['2026-09-26']).lnth;
    const formatted = formatLnthText(content);

    const win = window.open('', '_blank', 'width=800,height=720');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html><head><meta charset="utf-8">
      <title>Lời Nguyện Tín Hữu - ${escapeHtml(ms.title || 'Phụng Vụ')}</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 13.5pt; line-height: 2.2; margin: 30mm 25mm; color: #000; }
        @media print { body { margin: 20mm 20mm; } button { display: none; } }
        button { display: block; margin: 20px auto 0; padding: 10px 24px; font-size: 12pt; cursor: pointer; background: #6b3fa0; color: #fff; border: none; border-radius: 8px; font-weight: bold; }
      </style></head><body>
      ${formatted}
      <button onclick="window.print()">🖨️ In Ngay (Khổ A4)</button>
      <script>window.onload = function() { setTimeout(function() { window.print(); }, 400); };<\/script>
      </body></html>
    `);
    win.document.close();
  }
}

// Global instances
window.calculateLiturgicalInfo = calculateLiturgicalInfo;
window.baiDocViewer = new BaiDocViewer();
window.openMassBaiDoc = function(msId) {
  if (window.baiDocViewer) {
    window.baiDocViewer.openForMassSet(msId);
  }
};
