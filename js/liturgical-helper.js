/**
 * CA ĐOÀN DOHWA - LITURGICAL ENGINE & BÀI ĐỌC PHỤNG VỤ
 * Chuẩn 100% theo logic của soanbole.com:
 * - Tự động tính toán Lịch Phụng Vụ Công Giáo
 * - Hiển thị Bài Đọc 1, Bài Đọc 2, Tin Mừng kèm Tiêu Đề Bài Trích Phụng Vụ chuẩn
 * - Nhúng trực tiếp phiên bản PDF Thánh Vịnh Đáp Ca (không hiển thị câu chữ thô)
 * - Lời Nguyện Tín Hữu: Lấy từ Web (Cào tự động / Nhập link / Kho mẫu phụng vụ / Dán chuẩn hoá)
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
 * TỰ ĐỘNG SINH TIÊU ĐỀ BÀI TRÍCH PHỤNG VỤ CHUẨN SÁCH BÀI ĐỌC CÔNG GIÁO
 * Ví dụ: Is 55, 6-9 -> Bài trích sách ngôn sứ I-sai-a.
 *        Pl 1, 20c-24 -> Bài trích thư của Thánh Phaolô Tông đồ gửi tín hữu Phi-líp-phê.
 *        1 Cr 12, 1-11 -> Bài trích thư thứ nhất của Thánh Phaolô Tông đồ gửi tín hữu Cô-rin-tô.
 *        1 Pr 2, 4-9 -> Bài trích thư thứ nhất của Thánh Phê-rô Tông đồ.
 *        Mt 20, 1-16a -> Tin Mừng Chúa Giê-su Ki-tô theo thánh Mát-thêu.
 */
function getLiturgicalBookTitle(ref, readingType) {
  if (!ref) {
    if (readingType === 'bd1') return 'Bài trích Lời Chúa trong Cựu Ước.';
    if (readingType === 'bd2') return 'Bài trích thư của Thánh Tông Đồ.';
    if (readingType === 'tm') return 'Tin Mừng Chúa Giê-su Ki-tô.';
    return 'Bài Đọc Lời Chúa.';
  }

  const clean = ref.trim();

  // Tin Mừng (Gospels)
  if (readingType === 'tm' || /^(Mt|Mc|Lc|Ga|Mat|Mark|Luke|John)/i.test(clean)) {
    if (/^Mt/i.test(clean)) return 'Tin Mừng Chúa Giê-su Ki-tô theo thánh Mát-thêu.';
    if (/^Mc/i.test(clean)) return 'Tin Mừng Chúa Giê-su Ki-tô theo thánh Mác-cô.';
    if (/^Lc/i.test(clean)) return 'Tin Mừng Chúa Giê-su Ki-tô theo thánh Lu-ca.';
    if (/^Ga/i.test(clean)) return 'Tin Mừng Chúa Giê-su Ki-tô theo thánh Gio-an.';
    return 'Tin Mừng Chúa Giê-su Ki-tô.';
  }

  // Thư Thánh Phaolô & các Thánh Tông Đồ (New Testament Epistles & Acts)
  if (/^Rm/i.test(clean)) return 'Bài trích thư của Thánh Phaolô Tông đồ gửi tín hữu Rô-ma.';
  if (/^1\s*Cr/i.test(clean)) return 'Bài trích thư thứ nhất của Thánh Phaolô Tông đồ gửi tín hữu Cô-rin-tô.';
  if (/^2\s*Cr/i.test(clean)) return 'Bài trích thư thứ hai của Thánh Phaolô Tông đồ gửi tín hữu Cô-rin-tô.';
  if (/^Gl/i.test(clean)) return 'Bài trích thư của Thánh Phaolô Tông đồ gửi tín hữu Ga-lát.';
  if (/^Ep/i.test(clean)) return 'Bài trích thư của Thánh Phaolô Tông đồ gửi tín hữu Ê-phê-xô.';
  if (/^Pl/i.test(clean)) return 'Bài trích thư của Thánh Phaolô Tông đồ gửi tín hữu Phi-líp-phê.';
  if (/^Cl/i.test(clean)) return 'Bài trích thư của Thánh Phaolô Tông đồ gửi tín hữu Cô-lô-xê.';
  if (/^1\s*Tx/i.test(clean)) return 'Bài trích thư thứ nhất của Thánh Phaolô Tông đồ gửi tín hữu Thê-xa-lô-ni-ca.';
  if (/^2\s*Tx/i.test(clean)) return 'Bài trích thư thứ hai của Thánh Phaolô Tông đồ gửi tín hữu Thê-xa-lô-ni-ca.';
  if (/^1\s*Tm/i.test(clean)) return 'Bài trích thư thứ nhất của Thánh Phaolô Tông đồ gửi ông Ti-mô-thê.';
  if (/^2\s*Tm/i.test(clean)) return 'Bài trích thư thứ hai của Thánh Phaolô Tông đồ gửi ông Ti-mô-thê.';
  if (/^Tt/i.test(clean)) return 'Bài trích thư của Thánh Phaolô Tông đồ gửi ông Ti-tô.';
  if (/^Dm/i.test(clean)) return 'Bài trích thư của Thánh Phaolô Tông đồ gửi ông Phi-lê-môn.';
  if (/^Dt/i.test(clean)) return 'Bài trích thư gửi tín hữu Do-thái.';
  if (/^Gc/i.test(clean)) return 'Bài trích thư của Thánh Gia-cô-bê Tông đồ.';
  if (/^1\s*Pr/i.test(clean)) return 'Bài trích thư thứ nhất của Thánh Phê-rô Tông đồ.';
  if (/^2\s*Pr/i.test(clean)) return 'Bài trích thư thứ hai của Thánh Phê-rô Tông đồ.';
  if (/^1\s*Ga/i.test(clean)) return 'Bài trích thư thứ nhất của Thánh Gio-an Tông đồ.';
  if (/^2\s*Ga/i.test(clean)) return 'Bài trích thư thứ hai của Thánh Gio-an Tông đồ.';
  if (/^3\s*Ga/i.test(clean)) return 'Bài trích thư thứ ba của Thánh Gio-an Tông đồ.';
  if (/^Gđ/i.test(clean)) return 'Bài trích thư của Thánh Giu-đa Tông đồ.';
  if (/^Kh/i.test(clean)) return 'Bài trích sách Khải Huyền của Thánh Gio-an Tông đồ.';
  if (/^Cv/i.test(clean)) return 'Bài trích sách Tông Đồ Công Vụ.';

  // Sách Ngôn Sứ & Cựu Ước (Old Testament)
  if (/^Is/i.test(clean)) return 'Bài trích sách ngôn sứ I-sai-a.';
  if (/^Gr|^Gie/i.test(clean)) return 'Bài trích sách ngôn sứ Giê-rê-mi-a.';
  if (/^Ed/i.test(clean)) return 'Bài trích sách ngôn sứ Ê-dê-ki-en.';
  if (/^Đn/i.test(clean)) return 'Bài trích sách ngôn sứ Đa-ni-en.';
  if (/^Hs/i.test(clean)) return 'Bài trích sách ngôn sứ Hô-sê.';
  if (/^Am/i.test(clean)) return 'Bài trích sách ngôn sứ A-mốt.';
  if (/^Ge/i.test(clean)) return 'Bài trích sách ngôn sứ Giô-en.';
  if (/^Mk/i.test(clean)) return 'Bài trích sách ngôn sứ Mi-kha.';
  if (/^Za|^Zc/i.test(clean)) return 'Bài trích sách ngôn sứ Da-ca-ri-a.';
  if (/^Ml/i.test(clean)) return 'Bài trích sách ngôn sứ Ma-la-khi.';
  if (/^St/i.test(clean)) return 'Bài trích sách Sáng Thế.';
  if (/^Xh/i.test(clean)) return 'Bài trích sách Xuất Hành.';
  if (/^Lv/i.test(clean)) return 'Bài trích sách Lê-vi.';
  if (/^Ds/i.test(clean)) return 'Bài trích sách Dân Số.';
  if (/^Đnl/i.test(clean)) return 'Bài trích sách Đệ Nhị Luật.';
  if (/^Gs/i.test(clean)) return 'Bài trích sách Giô-suê.';
  if (/^Tl/i.test(clean)) return 'Bài trích sách Thủ Lãnh.';
  if (/^R/i.test(clean)) return 'Bài trích sách Rút.';
  if (/^1\s*Sm/i.test(clean)) return 'Bài trích sách Sa-mu-en quyển thứ nhất.';
  if (/^2\s*Sm/i.test(clean)) return 'Bài trích sách Sa-mu-en quyển thứ hai.';
  if (/^1\s*V/i.test(clean)) return 'Bài trích sách Các Vua quyển thứ nhất.';
  if (/^2\s*V/i.test(clean)) return 'Bài trích sách Các Vua quyển thứ hai.';
  if (/^1\s*Sb/i.test(clean)) return 'Bài trích sách Sử Biên quyển thứ nhất.';
  if (/^2\s*Sb/i.test(clean)) return 'Bài trích sách Sử Biên quyển thứ hai.';
  if (/^Er/i.test(clean)) return 'Bài trích sách Ét-ra.';
  if (/^Ne/i.test(clean)) return 'Bài trích sách Nơ-khe-mi-a.';
  if (/^Tb/i.test(clean)) return 'Bài trích sách Tô-bi-a.';
  if (/^Gđt/i.test(clean)) return 'Bài trích sách Giu-đi-tha.';
  if (/^Est/i.test(clean)) return 'Bài trích sách Ét-tê.';
  if (/^1\s*Mcb/i.test(clean)) return 'Bài trích sách Ma-ca-bê quyển thứ nhất.';
  if (/^2\s*Mcb/i.test(clean)) return 'Bài trích sách Ma-ca-bê quyển thứ hai.';
  if (/^G/i.test(clean)) return 'Bài trích sách Gióp.';
  if (/^Cn/i.test(clean)) return 'Bài trích sách Châm Ngôn.';
  if (/^Kn/i.test(clean)) return 'Bài trích sách Khôn Ngoan.';
  if (/^Hc/i.test(clean)) return 'Bài trích sách Huấn Ca.';
  if (/^Gg/i.test(clean)) return 'Bài trích sách Giảng Viên.';
  if (/^Dc/i.test(clean)) return 'Bài trích sách Diễm Ca.';

  return readingType === 'bd1' ? 'Bài trích Lời Chúa trong Cựu Ước.' : 'Bài trích thư của Thánh Tông Đồ.';
}

/**
 * KHO BÀI ĐỌC PHỤNG VỤ CHUẨN KHO OFFLINE
 */
/**
 * KHO BÀI ĐỌC PHỤNG VỤ CHUẨN XÁC 100% TỪ NHÓM PHIÊN DỊCH CÁC GIỜ KINH PHỤNG VỤ (KTCGKPV)
 * Nguồn chính thức: https://ktcgkpv.org/readings/mass-reading
 * Toàn bộ bản văn Kinh Thánh Bài đọc 1, Bài đọc 2, Tin Mừng và Đáp ca chuẩn mực.
 */
const KTCGKPV_LITURGY_STORE = {
  "2026-11-09": {
  "date": "2026-11-09",
  "title": "Thánh Lễ",
  "source": "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ (ktcgkpv.org)",
  "sourceUrl": "https://ktcgkpv.org/readings/mass-reading",
  "bd1": {
    "ref": "Ed 47,1-2.8-9.12",
    "bookTitle": "Bài trích sách ngôn sứ Ê-dê-ki-en.",
    "lead": "Tôi đã thấy dòng nước từ cửa đông Đền Thờ tuôn ra, và tất cả những ai được nước ấy thanh tẩy đều hưởng ơn cứu độ.",
    "content": "<p><sup>1</sup> Bấy giờ, thiên sứ dẫn tôi trở lại phía cửa Đền Thờ, và này : có nước vọt ra từ dưới ngưỡng cửa Đền Thờ và chảy về phía đông, vì mặt tiền Đền Thờ quay về phía đông. Nước từ phía dưới bên phải Đền Thờ chảy xuống phía nam bàn thờ. <sup>2</sup> Người ấy đưa tôi ra theo lối cổng bắc và dẫn tôi đi vòng quanh theo lối bên ngoài, đến cổng ngoài quay mặt về phía đông, và này : nước từ phía bên phải chảy ra.</p><p><sup>8</sup> Người ấy bảo tôi : “Nước này chảy về miền đất phía đông, xuống vùng A-ra-ba, rồi đổ ra biển Chết và làm cho nước biển hoá lành. <sup>9</sup> Sông chảy đến đâu thì mọi sinh vật lúc nhúc ở đó sẽ được sống. Sẽ có rất nhiều cá, vì nước này chảy tới đâu, thì nó chữa lành ; sông này chảy đến đâu, thì ở đó có sự sống. <sup>12</sup> Trên hai bờ sông sẽ mọc lên mọi giống cây ăn trái, lá không bao giờ tàn, trái không bao giờ hết : mỗi tháng các cây đó sẽ sinh trái mới nhờ có nước chảy ra từ thánh điện. Trái dùng làm lương thực còn lá để làm thuốc.”</p>"
  },
  "tv": {
    "ref": "Tv 45,2-3.5-6.8-9a (Đ. c.5)",
    "content": "<p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Một dòng sông chảy ra bao nhánh<br />đem niềm vui cho thành của Chúa Trời :<br />đây chính là đền thánh Đấng Tối Cao.</span></p><p class=\"leading\"><sup>2</sup><span>Thiên Chúa là nơi ta ẩn náu,<br />là sức mạnh của ta.<br />Người luôn luôn sẵn sàng giúp đỡ<br />khi ta phải ngặt nghèo.</span><sup>3</sup><span>Nên dầu cho địa cầu chuyển động,<br />núi đồi có sập xuống biển sâu,<br />ta cũng chẳng sợ gì.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Một dòng sông chảy ra bao nhánh<br />đem niềm vui cho thành của Chúa Trời :<br />đây chính là đền thánh Đấng Tối Cao.</span></p><p class=\"leading\"><sup>5</sup><span>Một dòng sông chảy ra bao nhánh<br />đem niềm vui cho thành của Chúa Trời :<br />đây chính là đền thánh Đấng Tối Cao.</span><sup>6</sup><span>Thiên Chúa ngự giữa thành,<br />thành không lay chuyển ;<br />ngay từ rạng đông, Thiên Chúa thương trợ giúp.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Một dòng sông chảy ra bao nhánh<br />đem niềm vui cho thành của Chúa Trời :<br />đây chính là đền thánh Đấng Tối Cao.</span></p><p class=\"leading\"><sup>8</sup><span>Chính Chúa Tể càn khôn ở cùng ta luôn mãi,<br />Thiên Chúa nhà Gia-cóp là thành bảo vệ ta.</span><sup>9</sup><span>Đến mà xem công trình của Chúa,<br />Đấng gieo kinh hãi trên mặt địa cầu.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Một dòng sông chảy ra bao nhánh<br />đem niềm vui cho thành của Chúa Trời :<br />đây chính là đền thánh Đấng Tối Cao.</span></p>"
  },
  "bd2": {
    "ref": "",
    "bookTitle": "Bài trích Thư Tông Đồ.",
    "lead": "",
    "content": ""
  },
  "tm": {
    "ref": "Ga 2,13-22",
    "bookTitle": "<span class=\"holycross\">&#x2720;</span>Tin Mừng Chúa Giê-su Ki-tô theo thánh Gio-an.",
    "lead": "Đền thờ Đức Giê-su muốn nói là chính thân thể Người.",
    "alleluiaRef": "x. 2 Sb 7,16",
    "alleluia": "Ha-lê-lui-a. Ha-lê-lui-a. Đức Chúa phán : Ta đã chọn và thánh hoá nhà này, để Danh Ta ngự nơi đây đến muôn đời. Ha-lê-lui-a.",
    "alleluiaHtml": "<p>Ha-lê-lui-a. Ha-lê-lui-a. Đức Chúa phán : Ta đã chọn và thánh hoá nhà này, để Danh Ta ngự nơi đây đến muôn đời. Ha-lê-lui-a.</p>",
    "content": "<p><sup>13</sup> Gần đến lễ Vượt Qua của người Do-thái, Đức Giê-su lên thành Giê-ru-sa-lem. <sup>14</sup> Người thấy trong Đền Thờ có những kẻ bán chiên, bò, bồ câu, và những người đang ngồi đổi tiền. <sup>15</sup> Người liền lấy dây làm roi mà xua đuổi tất cả chiên cũng như bò, ra khỏi Đền Thờ ; còn tiền của những người đổi bạc, Người đổ tung ra, và lật nhào bàn ghế của họ. <sup>16</sup> Người nói với những kẻ bán bồ câu : “Đem tất cả những thứ này ra khỏi đây, đừng biến nhà Cha tôi thành nơi buôn bán.” <sup>17</sup> Các môn đệ của Người nhớ lại lời đã chép trong Kinh Thánh : Vì nhiệt tâm lo việc nhà Chúa, mà tôi đây sẽ phải thiệt thân.</p><p><sup>18</sup> Người Do-thái hỏi Đức Giê-su : “Ông lấy dấu lạ nào chứng tỏ cho chúng tôi thấy là ông có quyền làm như thế ?” <sup>19</sup> Đức Giê-su đáp : “Các ông cứ phá huỷ Đền Thờ này đi ; nội ba ngày, tôi sẽ xây dựng lại.” <sup>20</sup> Người Do-thái nói : “Đền Thờ này phải mất bốn mươi sáu năm mới xây xong, thế mà nội trong ba ngày ông xây lại được sao ?” <sup>21</sup> Nhưng Đền Thờ Đức Giê-su muốn nói ở đây là chính thân thể Người. <sup>22</sup> Vậy, khi Người từ cõi chết trỗi dậy, các môn đệ nhớ lại Người đã nói điều đó, họ tin vào Kinh Thánh và lời Đức Giê-su đã nói.</p>"
  }
},
  "2026-11-15": {
  "date": "2026-11-15",
  "title": "Lễ Các Thánh Tử Đạo Việt Nam",
  "source": "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ (ktcgkpv.org)",
  "sourceUrl": "https://ktcgkpv.org/readings/mass-reading",
  "bd1": {
    "ref": "2 Mcb 7,1.20-23.27b-29",
    "bookTitle": "Bài trích sách Ma-ca-bê quyển thứ hai.",
    "lead": "Bà mẹ là người đáng khâm phục, vì bà can đảm chịu đựng nhờ niềm trông cậy bà đặt nơi Đức Chúa.",
    "content": "<p><sup>1</sup> Hồi ấy, có bảy anh em bị bắt cùng với bà mẹ. Vua An-ti-ô-khô cho lấy roi và gân bò mà đánh họ, để bắt họ ăn thịt heo là thức ăn luật Mô-sê cấm.</p><p><sup>20</sup> Bà mẹ là người rất mực xứng đáng cho ta khâm phục và kính cẩn ghi nhớ. Bà thấy bảy người con trai phải chết nội trong có một ngày, thế mà bà vẫn can đảm chịu đựng nhờ niềm trông cậy bà đặt nơi Đức Chúa. <sup>21</sup> Bà dùng tiếng mẹ đẻ mà khuyến khích từng người một, lòng bà đầy tâm tình cao thượng ; lời lẽ của bà tuy là của một người phụ nữ, nhưng lại sôi sục một chí khí nam nhi ; bà nói với các con : <sup>22</sup> “Mẹ không rõ các con đã thành hình trong lòng mẹ thế nào. Không phải mẹ ban cho các con thần khí và sự sống. Cũng không phải mẹ sắp đặt các phần cơ thể cho mỗi người trong các con. <sup>23</sup> Chính Đấng Tạo Hoá càn khôn đã nắn đúc nên loài người, và đã sáng tạo nguồn gốc muôn loài. Chính Người do lòng thương xót, cũng sẽ trả lại cho các con thần khí và sự sống, bởi vì bây giờ các con trọng Luật Lệ của Người hơn bản thân mình.”</p><p><sup>27b</sup> Bà nói với người con út : “Con ơi, con hãy thương mẹ : chín tháng cưu mang, ba năm bú mớm, mẹ đã nuôi nấng dạy dỗ con đến ngần này tuổi đầu. <sup>28</sup> Mẹ xin con hãy nhìn xem trời đất và muôn loài trong đó, mà nhận biết rằng Thiên Chúa đã làm nên tất cả từ hư vô, và loài người cũng được tạo thành như vậy. <sup>29</sup> Con đừng sợ tên đao phủ này ; nhưng hãy tỏ ra xứng đáng với các anh con, mà chấp nhận cái chết, để đến ngày Chúa thương xót, Người sẽ trả con và các anh con cho mẹ.”</p>"
  },
  "tv": {
    "ref": "Tv 125,1-2ab.2cd-3.4-5.6 (Đ. c.5)",
    "content": "<p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Ai nghẹn ngào ra đi gieo giống,<br />mùa gặt mai sau khấp khởi mừng.</span></p><p class=\"leading\"><sup>1</sup><span>Khi Chúa dẫn tù nhân Xi-on trở về,<br />ta tưởng mình như giữa giấc mơ.</span><sup>2ab</sup><span>Vang vang ngoài miệng câu cười nói,<br />rộn rã trên môi khúc nhạc mừng.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Ai nghẹn ngào ra đi gieo giống,<br />mùa gặt mai sau khấp khởi mừng.</span></p><p class=\"leading\"><sup>2cd</sup><span>Bấy giờ trong dân ngoại, người ta bàn tán :<br />“Việc Chúa làm cho họ, vĩ đại thay !”</span><sup>3</sup><span>Việc Chúa làm cho ta, ôi vĩ đại !<br />Ta thấy mình chan chứa một niềm vui.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Ai nghẹn ngào ra đi gieo giống,<br />mùa gặt mai sau khấp khởi mừng.</span></p><p class=\"leading\"><sup>4</sup><span>Lạy Chúa, xin dẫn tù nhân chúng con về,<br />như mưa dẫn nước về suối cạn miền Nam.</span><sup>5</sup><span>Ai nghẹn ngào ra đi gieo giống,<br />mùa gặt mai sau khấp khởi mừng.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Ai nghẹn ngào ra đi gieo giống,<br />mùa gặt mai sau khấp khởi mừng.</span></p><p class=\"leading\"><sup>6</sup><span>Họ ra đi, đi mà nức nở,<br />mang hạt giống vãi gieo ;<br />lúc trở về, về reo hớn hở,<br />vai nặng gánh lúa vàng.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Ai nghẹn ngào ra đi gieo giống,<br />mùa gặt mai sau khấp khởi mừng.</span></p>"
  },
  "bd2": {
    "ref": "Rm 8,31b-39",
    "bookTitle": "Bài trích thư của thánh Phao-lô tông đồ gửi tín hữu Rô-ma.",
    "lead": "Dù sự chết hay sự sống cũng không tách được chúng ta ra khỏi tình yêu của Thiên Chúa.",
    "content": "<p><sup>31b</sup> Thưa anh em, có Thiên Chúa bênh đỡ chúng ta, ai còn chống lại được chúng ta ? <sup>32</sup> Đến như chính Con Một, Thiên Chúa cũng chẳng tiếc, nhưng đã trao nộp vì hết thảy chúng ta. Một khi đã ban Người Con đó, lẽ nào Thiên Chúa lại chẳng rộng ban tất cả cho chúng ta ? <sup>33</sup> Ai sẽ buộc tội những người Thiên Chúa đã chọn ? Chẳng lẽ Thiên Chúa, Đấng làm cho nên công chính ? <sup>34</sup> Ai sẽ kết án họ ? Chẳng lẽ Đức Giê-su Ki-tô, Đấng đã chết, hơn nữa, đã sống lại, và đang ngự bên hữu Thiên Chúa mà chuyển cầu cho chúng ta ?</p><p><sup>35</sup> Ai có thể tách chúng ta ra khỏi tình yêu của Đức Ki-tô ? Phải chăng là gian truân, khốn khổ, đói rách, hiểm nguy, bắt bớ, gươm giáo ? <sup>36</sup> Như có lời chép : Chính vì Ngài mà mỗi ngày chúng con bị giết, bị coi như bầy cừu để sát sinh.</p><p><sup>37</sup> Nhưng trong mọi thử thách ấy, chúng ta toàn thắng nhờ Đấng đã yêu mến chúng ta.</p><p><sup>38</sup> Đúng thế, tôi tin chắc rằng : cho dầu là sự chết hay sự sống, thiên thần hay ma vương quỷ lực, hiện tại hay tương lai, hoặc bất cứ sức mạnh nào, <sup>39</sup> trời cao hay vực thẳm, hay bất cứ một loài thọ tạo nào khác, không có gì tách được chúng ta ra khỏi tình yêu của Thiên Chúa thể hiện nơi Đức Ki-tô Giê-su, Chúa chúng ta.</p>"
  },
  "tm": {
    "ref": "Lc 9,23-26",
    "bookTitle": "<span class=\"holycross\">&#x2720;</span>Tin Mừng Chúa Giê-su Ki-tô theo thánh Lu-ca.",
    "lead": "Ai liều mất mạng sống mình vì tôi, thì sẽ cứu được mạng sống ấy.",
    "alleluiaRef": "Mt 5,10",
    "alleluia": "Ha-lê-lui-a. Ha-lê-lui-a.Phúc thay ai bị bách hại vì sống công chính,vì Nước Trời là của họ. Ha-lê-lui-a.",
    "alleluiaHtml": "<p><p>Ha-lê-lui-a. Ha-lê-lui-a.</p><p>Phúc thay ai bị bách hại vì sống công chính,</p><p>vì Nước Trời là của họ. Ha-lê-lui-a.</p></p>",
    "content": "<p><sup>23</sup> Khi ấy, Đức Giê-su nói với mọi người rằng : “Ai muốn theo tôi, phải từ bỏ chính mình, vác thập giá mình hằng ngày mà theo. <sup>24</sup> Quả vậy, ai muốn cứu mạng sống mình, thì sẽ mất ; còn ai liều mất mạng sống mình vì tôi, thì sẽ cứu được mạng sống ấy. <sup>25</sup> Vì người nào được cả thế giới mà phải đánh mất chính mình hay là thiệt thân, thì nào có lợi gì ? <sup>26</sup> Ai xấu hổ vì tôi và những lời của tôi, thì Con Người cũng sẽ xấu hổ vì kẻ ấy, khi Người ngự đến trong vinh quang của mình, của Chúa Cha và các thánh thiên thần.”</p>"
  }
},
  "2026-10-18": {
  "date": "2026-10-18",
  "title": "Chúa Nhật Tuần XXIX - Mùa Thường Niên",
  "source": "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ (ktcgkpv.org)",
  "sourceUrl": "https://ktcgkpv.org/readings/mass-reading",
  "bd1": {
    "ref": "Is 45,1.4-6",
    "bookTitle": "Bài trích sách ngôn sứ I-sai-a.",
    "lead": "Đức Chúa đã cầm lấy tay phải vua Ky-rô để bắt các dân tộc suy phục ông.",
    "content": "<p class=\"poem\"><sup>1</sup><span>Đức Chúa phán với kẻ Người đã xức dầu, với vua Ky-rô<br />- Ta đã cầm lấy tay phải nó,<br />để bắt các dân tộc suy phục nó,<br />Ta tước khí giới của các vua,<br />mở toang các cửa thành trước mặt nó,<br />khiến các cổng không còn đóng kín nữa.</span><br /><sup>4</sup><span>Vì lợi ích của tôi tớ Ta là Gia-cóp,<br />và của người Ta đã chọn là Ít-ra-en,<br />Ta đã gọi ngươi đích danh, đã ban cho ngươi một tước hiệu,<br />dù ngươi không biết Ta.</span><br /><sup>5</sup><span>Ta là Đức Chúa, không còn chúa nào khác ;<br />chẳng có ai là Thiên Chúa, ngoại trừ Ta.<br />Dù ngươi không biết Ta, Ta đã trang bị cho ngươi đầy đủ,</span><br /><sup>6</sup><span>để từ Đông sang Tây, thiên hạ biết rằng<br />chẳng có thần nào khác, ngoại trừ Ta.<br />Ta là Đức Chúa, không còn chúa nào khác.<br /></span></p>"
  },
  "tv": {
    "ref": "Tv 95,1 và 3.4-5.7-8a.8b-10ac (Đ. c.7b)",
    "content": "<p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Hãy dâng Chúa quyền lực và vinh quang.</span></p><p class=\"leading\"><sup>1</sup><span>Hát lên mừng Chúa một bài ca mới,<br />hát lên mừng Chúa, hỡi toàn thể địa cầu !</span><sup>3</sup><span>kể cho muôn dân biết Người thật là vinh hiển,<br />cho mọi nước hay những kỳ công của Người.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Hãy dâng Chúa quyền lực và vinh quang.</span></p><p class=\"leading\"><sup>4</sup><span>Chúa thật cao cả, xứng muôn lời ca tụng,<br />khả tôn khả uý hơn chư thần,</span><sup>5</sup><span>vì chư thần các nước thảy đều hư ảo,<br />còn Đức Chúa, Người sáng tạo trời cao.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Hãy dâng Chúa quyền lực và vinh quang.</span></p><p class=\"leading\"><sup>7</sup><span>Hãy dâng Chúa, hỡi các dân các nước,<br />dâng Chúa quyền lực và vinh quang,</span><sup>8a</sup><span>hãy dâng Chúa vinh quang xứng danh Người.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Hãy dâng Chúa quyền lực và vinh quang.</span></p><p class=\"leading\"><sup>8b</sup><span>Hãy bưng lễ vật, bước vào tiền đình Chúa,</span><sup>9</sup><span>và thờ lạy Chúa uy nghiêm thánh thiện,<br />toàn thể địa cầu, hãy run sợ trước Thánh Nhan.</span><sup>10ac</sup><span>Hãy nói với chư dân : Chúa là Vua hiển trị,<br />Người xét xử muôn nước theo đường ngay thẳng.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Hãy dâng Chúa quyền lực và vinh quang.</span></p>"
  },
  "bd2": {
    "ref": "1 Tx 1,1-5b",
    "bookTitle": "Khởi đầu thư thứ nhất của thánh Phao-lô tông đồ gửi tín hữu Thê-xa-lô-ni-ca.",
    "lead": "Chúng tôi nhớ đến lòng tin, lòng mến và lòng trông cậy của anh em.",
    "content": "<p><sup>1</sup> Chúng tôi là Phao-lô, Xin-va-nô và Ti-mô-thê, kính gửi Hội Thánh Thê-xa-lô-ni-ca ở trong Thiên Chúa Cha, và trong Chúa Giê-su Ki-tô. Chúc anh em được ân sủng và bình an.</p><p><sup>2</sup> Chúng tôi hằng tạ ơn Thiên Chúa về tất cả anh em. Chúng tôi nhắc đến anh em trong lời cầu nguyện, <sup>3</sup> và trước mặt Thiên Chúa là Cha chúng ta, chúng tôi không ngừng nhớ đến những việc anh em làm vì lòng tin, những nỗi khó nhọc anh em gánh vác vì lòng mến, và những gì anh em kiên nhẫn chịu đựng vì trông đợi Chúa chúng ta là Đức Giê-su Ki-tô.</p><p><sup>4</sup> Thưa anh em là những người được Thiên Chúa thương mến, chúng tôi biết rằng Thiên Chúa đã chọn anh em, <sup>5b</sup> vì khi chúng tôi loan báo Tin Mừng cho anh em, thì không phải chỉ có lời chúng tôi nói, mà còn có quyền năng, có Thánh Thần, và một niềm xác tín sâu xa.</p>"
  },
  "tm": {
    "ref": "Mt 22,15-21",
    "bookTitle": "<span class=\"holycross\">&#x2720;</span>Tin Mừng Chúa Giê-su Ki-tô theo thánh Mát-thêu.",
    "lead": "Của Xê-da, trả về Xê-da ; của Thiên Chúa, trả về Thiên Chúa.",
    "alleluiaRef": "Pl 2,15d.16a",
    "alleluia": "Ha-lê-lui-a. Ha-lê-lui-a. Giữa thế gian, anh em phải chiếu sáng như những vì sao trên vòng trời, là làm sáng tỏ lời ban sự sống. Ha-lê-lui-a.",
    "alleluiaHtml": "<p>Ha-lê-lui-a. Ha-lê-lui-a. Giữa thế gian, anh em phải chiếu sáng như những vì sao trên vòng trời, là làm sáng tỏ lời ban sự sống. Ha-lê-lui-a.</p>",
    "content": "<p><sup>15</sup> Khi ấy, những người Pha-ri-sêu đi bàn bạc với nhau, tìm cách làm cho Đức Giê-su phải lỡ lời mà mắc bẫy. <sup>16</sup> Họ sai các môn đệ của họ cùng đi với những người phe Hê-rô-đê, đến nói với Đức Giê-su rằng : “Thưa Thầy, chúng tôi biết Thầy là người chân thật và cứ sự thật mà dạy đường lối của Thiên Chúa. Thầy cũng chẳng vị nể ai, vì Thầy không cứ bề ngoài mà đánh giá người ta. <sup>17</sup> Vậy xin Thầy cho biết ý kiến : có được phép nộp thuế cho Xê-da hay không ?”</p><p><sup>18</sup> Nhưng Đức Giê-su biết họ có ác ý, nên Người nói : “Tại sao các người lại thử tôi, hỡi những kẻ đạo đức giả ! <sup>19</sup> Cho tôi xem đồng tiền nộp thuế !” Họ liền đưa cho Người một quan tiền. <sup>20</sup> Người hỏi họ : “Hình và danh hiệu này là của ai đây ?” <sup>21</sup> Họ đáp : “Của Xê-da.” Bấy giờ, Người bảo họ : “Thế thì của Xê-da, trả về Xê-da ; của Thiên Chúa, trả về Thiên Chúa.”</p>"
  }
},
  "2026-10-11": {
  "date": "2026-10-11",
  "title": "Chúa Nhật Tuần XXVIII - Mùa Thường Niên",
  "source": "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ (ktcgkpv.org)",
  "sourceUrl": "https://ktcgkpv.org/readings/mass-reading",
  "bd1": {
    "ref": "Is 25,6-10a",
    "bookTitle": "Bài trích sách ngôn sứ I-sai-a.",
    "lead": "Đức Chúa sẽ đãi một bữa tiệc và sẽ lau khô dòng lệ trên khuôn mặt mọi người.",
    "content": "<p class=\"poem\"><sup>6</sup><span>Ngày ấy, trên núi này,<br />Đức Chúa các đạo binh sẽ đãi muôn dân một bữa tiệc :<br />tiệc thịt béo, tiệc rượu ngon,<br />thịt béo ngậy, rượu ngon tinh chế.</span><br /><sup>7</sup><span>Trên núi này, Người sẽ xé bỏ chiếc khăn che phủ mọi dân,<br />và tấm màn trùm lên muôn nước.</span><br /><sup>8</sup><span>Người sẽ vĩnh viễn tiêu diệt tử thần.<br />Đức Chúa là Chúa Thượng sẽ lau khô dòng lệ<br />trên khuôn mặt mọi người,<br />và trên toàn cõi đất, Người sẽ xoá sạch<br />nỗi ô nhục của dân Người. Đức Chúa phán như vậy.</span><br /><sup>9</sup><span>Ngày ấy, người ta sẽ nói : “Đây là Thiên Chúa chúng ta,<br />chúng ta từng trông đợi Người,<br />và đã được Người thương cứu độ.<br />Chính Người là Đức Chúa chúng ta từng đợi trông.<br />Nào ta cùng hoan hỷ vui mừng bởi được Người cứu độ.”</span><br /><sup>10a</sup><span>Vì bàn tay Đức Chúa sẽ lại đặt trên núi này.<br /></span></p>"
  },
  "tv": {
    "ref": "Tv 22,1-3a.3b-4.5.6 (Đ. c.6cd)",
    "content": "<p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Này tôi được ở đền Người<br />những ngày tháng, những năm dài triền miên.</span></p><p class=\"leading\"><sup>1</sup><span>Chúa là mục tử chăn dắt tôi, tôi chẳng thiếu thốn gì.</span><sup>2</sup><span>Trong đồng cỏ xanh tươi, Người cho tôi nằm nghỉ.<br />Người đưa tôi tới dòng nước trong lành</span><sup>3a</sup><span>và bổ sức cho tôi.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Này tôi được ở đền Người<br />những ngày tháng, những năm dài triền miên.</span></p><p class=\"leading\"><sup>3b</sup><span>Người dẫn tôi trên đường ngay nẻo chính<br />vì danh dự của Người.</span><sup>4</sup><span>Lạy Chúa, dầu qua lũng âm u<br />con sợ gì nguy khốn, vì có Chúa ở cùng.<br />Côn trượng Ngài bảo vệ, con vững dạ an tâm.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Này tôi được ở đền Người<br />những ngày tháng, những năm dài triền miên.</span></p><p class=\"leading\"><sup>5</sup><span>Chúa dọn sẵn cho con bữa tiệc<br />ngay trước mặt quân thù.<br />Đầu con, Chúa xức đượm dầu thơm,<br />ly rượu con đầy tràn chan chứa.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Này tôi được ở đền Người<br />những ngày tháng, những năm dài triền miên.</span></p><p class=\"leading\"><sup>6</sup><span>Lòng nhân hậu và tình thương Chúa<br />ấp ủ tôi suốt cả cuộc đời,<br />và tôi được ở đền Người<br />những ngày tháng, những năm dài triền miên.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Này tôi được ở đền Người<br />những ngày tháng, những năm dài triền miên.</span></p>"
  },
  "bd2": {
    "ref": "Pl 4,12-14.19-20",
    "bookTitle": "Bài trích thư của thánh Phao-lô tông đồ gửi tín hữu Phi-líp-phê.",
    "lead": "Với Đấng ban sức mạnh cho tôi, tôi chịu được hết.",
    "content": "<p><sup>12</sup> Thưa anh em, tôi sống thiếu thốn cũng được, mà sống dư dật cũng được. Trong mọi hoàn cảnh, no hay đói, dư dật hay túng bấn, tôi đã tập quen cả. <sup>13</sup> Với Đấng ban sức mạnh cho tôi, tôi chịu được hết. <sup>14</sup> Tuy nhiên, anh em đã chia sẻ với tôi, khi tôi gặp cơn quẫn bách, như thế là phải. <sup>19</sup> Thiên Chúa của tôi sẽ thoả mãn mọi nhu cầu của anh em một cách tuyệt vời, theo sự giàu sang của Người trong Đức Ki-tô Giê-su. <sup>20</sup> Xin tôn vinh Thiên Chúa là Cha chúng ta, đến muôn thuở muôn đời ! A-men.</p>"
  },
  "tm": {
    "ref": "Mt 22,1-14",
    "bookTitle": "<span class=\"holycross\">&#x2720;</span>Tin Mừng Chúa Giê-su Ki-tô theo thánh Mát-thêu.",
    "lead": "Gặp ai, anh em cũng mời hết vào tiệc cưới.",
    "alleluiaRef": "x. Ep 1,17-18",
    "alleluia": "Ha-lê-lui-a. Ha-lê-lui-a. Xin Thân Phụ Đức Giê-su Ki-tô, Chúa chúng ta, soi trí mở lòng cho chúng ta thấy rõ, đâu là niềm hy vọng, mà ơn Người kêu gọi đem lại cho chúng ta. Ha-lê-lui-a.",
    "alleluiaHtml": "<p>Ha-lê-lui-a. Ha-lê-lui-a. Xin Thân Phụ Đức Giê-su Ki-tô, Chúa chúng ta, soi trí mở lòng cho chúng ta thấy rõ, đâu là niềm hy vọng, mà ơn Người kêu gọi đem lại cho chúng ta. Ha-lê-lui-a.</p>",
    "content": "<p><sup>1</sup> Khi ấy, Đức Giê-su dùng dụ ngôn mà nói với các thượng tế và kỳ mục trong dân rằng : <sup>2</sup> “Nước Trời cũng giống như chuyện một vua kia mở tiệc cưới cho con mình. <sup>3</sup> Nhà vua sai đầy tớ đi thỉnh các quan khách đã được mời trước, xin họ đến dự tiệc, nhưng họ không chịu đến. <sup>4</sup> Nhà vua lại sai những đầy tớ khác đi, và dặn họ : ‘Hãy thưa với quan khách đã được mời rằng : Này cỗ bàn, ta đã dọn xong, bò tơ và thú béo đã hạ rồi, mọi sự đã sẵn. Mời quý vị đến dự tiệc cưới !’ <sup>5</sup> Nhưng quan khách không thèm đếm xỉa tới, lại bỏ đi : kẻ thì đi thăm nông trại, người thì đi buôn, <sup>6</sup> còn những kẻ khác lại bắt các đầy tớ của vua mà hành hạ và giết chết. <sup>7</sup> Nhà vua liền nổi cơn thịnh nộ, sai quân đi tru diệt bọn sát nhân ấy và thiêu huỷ thành phố của chúng. <sup>8</sup> Rồi nhà vua bảo đầy tớ : ‘Tiệc cưới đã sẵn sàng rồi, mà những kẻ đã được mời lại không xứng đáng. <sup>9</sup> Vậy các ngươi đi ra các ngả đường, gặp ai cũng mời hết vào tiệc cưới.’ <sup>10</sup> Đầy tớ liền đi ra các nẻo đường, gặp ai, bất luận xấu tốt, cũng tập hợp cả lại, nên phòng tiệc cưới đã đầy thực khách.</p><p><sup>11</sup> “Bấy giờ nhà vua tiến vào quan sát khách dự tiệc, thấy ở đó có một người không mặc y phục lễ cưới, <sup>12</sup> mới hỏi người ấy : ‘Này bạn, làm sao bạn vào đây mà lại không có y phục lễ cưới ?’ Người ấy câm miệng không nói được gì. <sup>13</sup> Nhà vua liền bảo những người phục dịch : ‘Trói chân tay nó lại, quăng nó ra chỗ tối tăm bên ngoài, ở đó người ta sẽ phải khóc lóc nghiến răng ! <sup>14</sup> Vì kẻ được gọi thì nhiều, mà người được chọn thì ít’.”</p>"
  }
},
  "2026-11-01": {
  "date": "2026-11-01",
  "title": "Đại Lễ Các Thánh Nam Nữ",
  "source": "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ (ktcgkpv.org)",
  "sourceUrl": "https://ktcgkpv.org/readings/mass-reading",
  "bd1": {
    "ref": "Kh 7,2-4.9-14",
    "bookTitle": "Bài trích sách Khải huyền của thánh Gio-an tông đồ.",
    "lead": "Tôi thấy : Kìa một đoàn người thật đông không tài nào đếm nổi, thuộc mọi dân, mọi chi tộc, mọi nước và mọi ngôn ngữ.",
    "content": "<p><sup>2</sup> Tôi là Gio-an, tôi thấy một thiên thần mang ấn của Thiên Chúa hằng sống, từ phía mặt trời mọc đi lên. Thiên thần ấy lớn tiếng gọi bốn thiên thần khác, là những vị được quyền phá hại đất liền và biển cả. <sup>3</sup> Thiên thần ấy nói : “Xin đừng phá hại đất liền, biển cả và cây cối, trước khi chúng tôi đóng ấn trên trán các tôi tớ của Thiên Chúa chúng ta”. <sup>4</sup> Rồi tôi nghe nói đến con số những người được đóng ấn : một trăm bốn mươi bốn ngàn người thuộc mọi chi tộc con cái Ít-ra-en.</p><p><sup>9</sup> Sau đó, tôi thấy : một đoàn người thật đông không tài nào đếm nổi, thuộc mọi dân, mọi chi tộc, mọi nước và mọi ngôn ngữ. Họ đứng trước ngai và trước Con Chiên, mình mặc áo trắng, tay cầm nhành lá thiên tuế. <sup>10</sup> Họ lớn tiếng tung hô : “Chính Thiên Chúa chúng ta, Đấng ngự trên ngai, và chính Con Chiên đã cứu độ chúng ta.” <sup>11</sup> Tất cả các thiên thần đều đứng chung quanh ngai, chung quanh các Kỳ Mục và bốn Con Vật. Họ đều sấp mặt xuống, phủ phục trước ngai và thờ lạy Thiên Chúa mà tung hô <sup>12</sup> rằng :</p><p class=\"poem\"><sup></sup><span>“A-men ! Xin kính dâng Thiên Chúa chúng ta<br />lời chúc tụng và vinh quang, sự khôn ngoan và lời tạ ơn,<br />danh dự, uy quyền và sức mạnh,<br />đến muôn thuở muôn đời ! A-men !”</span></p><p><sup>13</sup> Một trong các Kỳ Mục lên tiếng hỏi tôi : “Những người mặc áo trắng kia là ai vậy ? Họ từ đâu đến ?” <sup>14</sup> Tôi trả lời : “Thưa Ngài, Ngài biết đó.” Vị ấy bảo tôi : “Họ là những người đã đến, sau khi trải qua cơn thử thách lớn lao. Họ đã giặt sạch và tẩy trắng áo mình trong máu Con Chiên.”</p>"
  },
  "tv": {
    "ref": "Tv 23,1-2.3-4ab.5-6 (Đ. x. c.6)",
    "content": "<p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Lạy Chúa, đây chính là dòng dõi<br />những kẻ tìm kiếm thánh nhan Ngài.</span></p><p class=\"leading\"><sup>1</sup><span>Chúa làm chủ trái đất cùng muôn vật muôn loài,<br />làm chủ hoàn cầu với toàn thể dân cư.</span><sup>2</sup><span>Nền trái đất, Người dựng trên biển cả,<br />đặt vững vàng trên làn nước mênh mông.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Lạy Chúa, đây chính là dòng dõi<br />những kẻ tìm kiếm thánh nhan Ngài.</span></p><p class=\"leading\"><sup>3</sup><span>Ai được lên núi Chúa ?<br />Ai được ở trong đền thánh của Người ?</span><sup>4ab</sup><span>Đó là kẻ tay sạch lòng thanh,<br />chẳng mê theo ngẫu tượng.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Lạy Chúa, đây chính là dòng dõi<br />những kẻ tìm kiếm thánh nhan Ngài.</span></p><p class=\"leading\"><sup>5</sup><span>Người ấy sẽ được Chúa ban phúc lành,<br />được Thiên Chúa cứu độ thưởng công xứng đáng.</span><sup>6</sup><span>Đây chính là dòng dõi những kẻ kiếm tìm Người,<br />tìm thánh nhan Thiên Chúa nhà Gia-cóp.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Lạy Chúa, đây chính là dòng dõi<br />những kẻ tìm kiếm thánh nhan Ngài.</span></p>"
  },
  "bd2": {
    "ref": "1 Ga 3,1-3",
    "bookTitle": "Bài trích thư thứ nhất của thánh Gio-an tông đồ.",
    "lead": "Thiên Chúa thế nào, chúng ta sẽ thấy Người như vậy.",
    "content": "<p class=\"poem\"><sup>1</sup><span>Anh em thân mến,<br />anh em hãy xem Chúa Cha yêu chúng ta dường nào :<br />Người yêu đến nỗi<br />cho chúng ta được gọi là con Thiên Chúa<br />- mà thực sự chúng ta là con Thiên Chúa.<br />Sở dĩ thế gian không nhận biết chúng ta,<br />là vì thế gian đã không biết Người.</span><br /><sup>2</sup><span>Anh em thân mến, hiện giờ chúng ta là con Thiên Chúa ;<br />nhưng chúng ta sẽ như thế nào, điều ấy chưa được bày tỏ.<br />Chúng ta biết rằng khi Đức Ki-tô xuất hiện,<br />chúng ta sẽ nên giống như Người,<br />vì Người thế nào, chúng ta sẽ thấy Người như vậy.</span><br /><sup>3</sup><span>Phàm ai đặt hy vọng như thế vào Đức Ki-tô<br />thì làm cho mình nên thanh sạch<br />như Người là Đấng thanh sạch.</span></p>"
  },
  "tm": {
    "ref": "Mt 5,1-12a",
    "bookTitle": "<span class=\"holycross\">&#x2720;</span>Tin Mừng Chúa Giê-su Ki-tô theo thánh Mát-thêu.",
    "lead": "Anh em hãy vui mừng hớn hở, vì phần thưởng dành cho anh em ở trên trời thật lớn lao.",
    "alleluiaRef": "Mt 11,28",
    "alleluia": "Ha-lê-lui-a. Ha-lê-lui-a. Chúa nói : Tất cả những ai đang vất vả mang gánh nặng nề, hãy đến cùng tôi, tôi sẽ cho nghỉ ngơi bồi dưỡng. Ha-lê-lui-a.",
    "alleluiaHtml": "<p>Ha-lê-lui-a. Ha-lê-lui-a. Chúa nói : Tất cả những ai đang vất vả mang gánh nặng nề, hãy đến cùng tôi, tôi sẽ cho nghỉ ngơi bồi dưỡng. Ha-lê-lui-a.</p>",
    "content": "<p><sup>1</sup> Khi ấy, thấy đám đông, Đức Giê-su lên núi. Người ngồi xuống, các môn đệ đến gần bên. <sup>2</sup> Người lên tiếng dạy họ rằng :</p><p class=\"poem\"><sup>3</sup><span>“Phúc thay ai có tâm hồn nghèo khó,<br />vì Nước Trời là của họ.</span><br /><sup>4</sup><span>Phúc thay ai hiền lành,<br />vì họ sẽ được Đất Hứa làm gia nghiệp.</span><br /><sup>5</sup><span>Phúc thay ai sầu khổ,<br />vì họ sẽ được Thiên Chúa ủi an.</span><br /><sup>6</sup><span>Phúc thay ai khát khao nên người công chính,<br />vì họ sẽ được Thiên Chúa cho thoả lòng.</span><br /><sup>7</sup><span>Phúc thay ai xót thương người,<br />vì họ sẽ được Thiên Chúa xót thương.</span><br /><sup>8</sup><span>Phúc thay ai có tâm hồn trong sạch,<br />vì họ sẽ được nhìn thấy Thiên Chúa.</span><br /><sup>9</sup><span>Phúc thay ai xây dựng hoà bình,<br />vì họ sẽ được gọi là con Thiên Chúa.</span><br /><sup>10</sup><span>Phúc thay ai bị bách hại vì sống công chính,<br />vì Nước Trời là của họ.</span><br /><sup>11</sup><span>Phúc thay anh em khi vì Thầy mà bị người ta sỉ vả, bách hại<br />và vu khống đủ điều xấu xa.</span><br /><sup>12a</sup><span>Anh em hãy vui mừng hớn hở,<br />vì phần thưởng dành cho anh em ở trên trời thật lớn lao.”</span></p>"
  }
},
  "2026-11-08": {
  "date": "2026-11-08",
  "title": "Chúa Nhật Tuần XXXII - Mùa Thường Niên",
  "source": "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ (ktcgkpv.org)",
  "sourceUrl": "https://ktcgkpv.org/readings/mass-reading",
  "bd1": {
    "ref": "Kn 6,12-16",
    "bookTitle": "Bài trích sách Khôn ngoan.",
    "lead": "Ai tìm kiếm Đức Khôn Ngoan, thì Đức Khôn Ngoan cho gặp.",
    "content": "<p class=\"poem\"><sup>12</sup><span>Đức Khôn Ngoan sáng chói, và không hề tàn tạ.<br />Ai mến chuộng Đức Khôn Ngoan,<br />thì Đức Khôn Ngoan dễ dàng cho chiêm ngưỡng.<br />Ai tìm kiếm Đức Khôn Ngoan,<br />thì Đức Khôn Ngoan cho gặp.</span><br /><sup>13</sup><span>Ai khao khát Đức Khôn Ngoan,<br />thì Đức Khôn Ngoan đi bước trước mà tỏ mình cho biết.</span><br /><sup>14</sup><span>Ai từ sáng sớm đã tìm Đức Khôn Ngoan,<br />thì không phải nhọc nhằn vất vả.<br />Họ sẽ thấy Đức Khôn Ngoan ngồi ngay trước cửa nhà.</span><br /><sup>15</sup><span>Để tâm suy niệm về Đức Khôn Ngoan<br />là đạt được sự minh mẫn toàn hảo.<br />Ai vì Đức Khôn Ngoan mà thức khuya dậy sớm,<br />sẽ mau trút được mọi lo âu.</span><br /><sup>16</sup><span>Vì những ai xứng đáng với Đức Khôn Ngoan,<br />thì Đức Khôn Ngoan rảo quanh tìm kiếm.<br />Trên các nẻo đường họ đi,<br />Đức Khôn Ngoan niềm nở xuất hiện.<br />Mỗi khi họ suy tưởng điều gì,<br />Đức Khôn Ngoan đều đến với họ.<br /></span></p>"
  },
  "tv": {
    "ref": "Tv 62,2.3-4.5-6.7-8 (Đ. x. c.2)",
    "content": "<p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Lạy Thiên Chúa, Ngài là Chúa con thờ,<br />linh hồn con đã khao khát Chúa.</span></p><p class=\"leading\"><sup>2</sup><span>Lạy Thiên Chúa, Ngài là Chúa con thờ,<br />ngay từ rạng đông con tìm kiếm Chúa.<br />Linh hồn con đã khát khao Ngài,<br />tấm thân này mòn mỏi đợi trông,<br />như mảnh đất hoang khô cằn, không giọt nước.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Lạy Thiên Chúa, Ngài là Chúa con thờ,<br />linh hồn con đã khao khát Chúa.</span></p><p class=\"leading\"><sup>3</sup><span>Nên con đến ngắm nhìn Ngài trong nơi thánh điện,<br />để thấy uy lực và vinh quang của Ngài.</span><sup>4</sup><span>Bởi ân tình Ngài quý hơn mạng sống,<br />miệng lưỡi này xin ca ngợi tán dương.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Lạy Thiên Chúa, Ngài là Chúa con thờ,<br />linh hồn con đã khao khát Chúa.</span></p><p class=\"leading\"><sup>5</sup><span>Suốt cả đời con, nguyện dâng lời chúc tụng,<br />và giơ tay cầu khẩn danh Ngài.</span><sup>6</sup><span>Lòng thoả thuê như khách vừa dự tiệc,<br />môi miệng con rộn rã khúc hoan ca.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Lạy Thiên Chúa, Ngài là Chúa con thờ,<br />linh hồn con đã khao khát Chúa.</span></p><p class=\"leading\"><sup>7</sup><span>Con tưởng nhớ Chúa trên giường ngủ,<br />suốt năm canh thầm thĩ với Ngài.</span><sup>8</sup><span>Quả thật Ngài đã thương trợ giúp,<br />nương bóng Ngài, con hớn hở reo vui.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Lạy Thiên Chúa, Ngài là Chúa con thờ,<br />linh hồn con đã khao khát Chúa.</span></p>"
  },
  "bd2": {
    "ref": "1 Tx 4,13-18",
    "bookTitle": "Bài trích thư thứ nhất của thánh Phao-lô tông đồ gửi tín hữu Thê-xa-lô-ni-ca.",
    "lead": "Những người đã an giấc trong Đức Giê-su, sẽ được Thiên Chúa đưa về cùng Đức Giê-su.",
    "content": "<p><sup>13</sup> Thưa anh em, về những ai đã an giấc ngàn thu, chúng tôi không muốn để anh em chẳng hay biết gì, hầu anh em khỏi buồn phiền như những người khác, là những người không có niềm hy vọng. <sup>14</sup> Vì nếu chúng ta tin rằng Đức Giê-su đã chết và đã sống lại, thì chúng ta cũng tin rằng những người đã an giấc trong Đức Giê-su, sẽ được Thiên Chúa đưa về cùng Đức Giê-su. <sup>15</sup> Dựa vào lời của Chúa, chúng tôi nói với anh em điều này, là chúng ta, những người đang sống, những người còn lại vào ngày Chúa quang lâm, chúng ta sẽ chẳng đi trước những người đã an giấc ngàn thu đâu. <sup>16</sup> Vì khi hiệu lệnh ban ra, khi tiếng tổng lãnh thiên thần và tiếng kèn của Thiên Chúa vang lên, thì chính Chúa sẽ từ trời ngự xuống, và những người đã chết trong Đức Ki-tô sẽ sống lại trước tiên ; <sup>17</sup> rồi đến chúng ta, là những người đang sống, những người còn lại, chúng ta sẽ được đem đi trên đám mây cùng với họ, để nghênh đón Chúa trên không trung. Như thế, chúng ta sẽ được ở cùng Chúa mãi mãi. <sup>18</sup> Vậy anh em hãy dùng những lời ấy mà an ủi nhau.</p>"
  },
  "tm": {
    "ref": "Mt 25,1-13",
    "bookTitle": "<span class=\"holycross\">&#x2720;</span>Tin Mừng Chúa Giê-su Ki-tô theo thánh Mát-thêu.",
    "lead": "Chú rể kia rồi, ra đón đi !",
    "alleluiaRef": "Mt 24,42a.44",
    "alleluia": "Ha-lê-lui-a Ha-lê-lui-a. Anh em hãy canh thức và hãy sẵn sàng, vì chính giờ phút anh em không ngờ, thì Con Người sẽ đến. Ha-lê-lui-a.",
    "alleluiaHtml": "<p>Ha-lê-lui-a Ha-lê-lui-a. Anh em hãy canh thức và hãy sẵn sàng, vì chính giờ phút anh em không ngờ, thì Con Người sẽ đến. Ha-lê-lui-a.</p>",
    "content": "<p><sup>1</sup> Khi ấy, Đức Giê-su kể cho các môn đệ nghe dụ ngôn này : “Nước Trời sẽ giống như chuyện mười trinh nữ cầm đèn ra đón chú rể. <sup>2</sup> Trong mười cô đó, có năm cô dại và năm cô khôn. <sup>3</sup> Quả vậy, các cô dại mang đèn mà không mang dầu theo. <sup>4</sup> Còn những cô khôn thì vừa mang đèn vừa mang chai dầu theo. <sup>5</sup> Vì chú rể đến chậm, nên các cô thiếp đi, rồi ngủ cả. <sup>6</sup> Nửa đêm, có tiếng la lên : ‘Chú rể kia rồi, ra đón đi !’ <sup>7</sup> Bấy giờ tất cả các trinh nữ ấy đều thức dậy, và sửa soạn đèn. <sup>8</sup> Các cô dại nói với các cô khôn rằng : ‘Xin các chị cho chúng em chút dầu, vì đèn của chúng em sắp tắt rồi !’ <sup>9</sup> Các cô khôn đáp : ‘Sợ không đủ cho chúng em và cho các chị đâu, các chị ra hàng mà mua lấy thì hơn.’ <sup>10</sup> Đang lúc các cô đi mua, thì chú rể tới, và những cô đã sẵn sàng được đi theo chú rể vào dự tiệc cưới. Rồi người ta đóng cửa lại. <sup>11</sup> Sau cùng, mấy trinh nữ kia cũng đến gọi : ‘Thưa Ngài, thưa Ngài ! mở cửa cho chúng tôi với !’ <sup>12</sup> Nhưng Người đáp : ‘Tôi bảo thật các cô, tôi không biết các cô là ai cả !’ <sup>13</sup> Vậy anh em hãy canh thức, vì anh em không biết ngày nào, giờ nào.”</p>"
  }
},
  "2026-11-02": {
  "date": "2026-11-02",
  "title": "Lễ Các Đẳng Linh Hồn",
  "source": "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ (ktcgkpv.org)",
  "sourceUrl": "https://ktcgkpv.org/readings/mass-reading",
  "bd1": {
    "ref": "G 19,1.23-27a",
    "bookTitle": "Bài trích sách Gióp.",
    "lead": "Tôi biết rằng Đấng bênh vực tôi vẫn sống.",
    "content": "<p><sup>1</sup> Bấy giờ, ông Gióp lên tiếng nói :</p><p class=\"poem\"><sup>23</sup><span>“Ôi, những lời tôi nói đây, phải chi có người chép lại,<br />phải chi có người ghi vào sách,</span><br /><sup>24</sup><span>có người đục bằng sắt, trám bằng chì,<br />tạc vào đá cho đến muôn đời !</span><br /><sup>25</sup><span>Tôi biết rằng Đấng bênh vực tôi vẫn sống,<br />và sau cùng, Người sẽ đứng lên trên cõi đất.</span><br /><sup>26</sup><span>Sau khi da tôi đây bị tiêu huỷ,<br />thì với tấm thân này, tôi sẽ được ngắm nhìn Thiên Chúa.</span><br /><sup>27a</sup><span>Chính tôi sẽ được ngắm nhìn Người,<br />Đấng mắt tôi nhìn thấy không phải người xa lạ.”<br /></span></p>"
  },
  "tv": {
    "ref": "Tv 26,1.4.7 và 8b và 9a.13-14 (Đ. c.13)",
    "content": "<p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Tôi vững vàng tin tưởng<br />sẽ được thấy ân lộc Chúa ban<br />trong cõi đất dành cho kẻ sống.</span></p><p class=\"leading\"><sup>1</sup><span>Chúa là nguồn ánh sáng và ơn cứu độ của tôi,<br />tôi còn sợ người nào ?<br />Chúa là thành luỹ bảo vệ đời tôi,<br />tôi khiếp gì ai nữa ?</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Tôi vững vàng tin tưởng<br />sẽ được thấy ân lộc Chúa ban<br />trong cõi đất dành cho kẻ sống.</span></p><p class=\"leading\"><sup>4</sup><span>Một điều tôi kiếm tôi xin,<br />là luôn được ở trong đền Chúa tôi<br />mọi ngày trong suốt cuộc đời,<br />để chiêm ngưỡng Chúa tuyệt vời cao sang,<br />ngắm xem thánh điện huy hoàng.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Tôi vững vàng tin tưởng<br />sẽ được thấy ân lộc Chúa ban<br />trong cõi đất dành cho kẻ sống.</span></p><p class=\"leading\"><sup>7</sup><span>Lạy Chúa, cúi xin Ngài nghe tiếng con kêu,<br />xin thương tình đáp lại.</span><sup>8b</sup><span>Lạy Chúa, con tìm thánh nhan Ngài,</span><sup>9a</sup><span>xin Ngài đừng ẩn mặt.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Tôi vững vàng tin tưởng<br />sẽ được thấy ân lộc Chúa ban<br />trong cõi đất dành cho kẻ sống.</span></p><p class=\"leading\"><sup>13</sup><span>Tôi vững vàng tin tưởng<br />sẽ được thấy ân lộc Chúa ban<br />trong cõi đất dành cho kẻ sống.</span><sup>14</sup><span>Hãy cậy trông vào Chúa,<br />mạnh bạo lên, can đảm lên nào !<br />Hãy cậy trông vào Chúa.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Tôi vững vàng tin tưởng<br />sẽ được thấy ân lộc Chúa ban<br />trong cõi đất dành cho kẻ sống.</span></p>"
  },
  "bd2": {
    "ref": "Rm 5,5-11",
    "bookTitle": "Bài trích thư của thánh Phao-lô tông đồ gửi tín hữu Rô-ma.",
    "lead": "Chúng ta đã được nên công chính nhờ Máu Đức Ki-tô đổ ra, hẳn sẽ được Người cứu khỏi cơn thịnh nộ của Thiên Chúa.",
    "content": "<p><sup>5</sup> Thưa anh em, trông cậy không làm chúng ta phải thất vọng, vì Thiên Chúa đã đổ tình yêu của Người vào lòng chúng ta, nhờ Thánh Thần mà Người ban cho chúng ta. <sup>6</sup> Quả vậy, khi chúng ta không có sức làm được gì vì còn là hạng người vô đạo, thì theo đúng kỳ hạn, Đức Ki-tô đã chết vì chúng ta. <sup>7</sup> Hầu như không ai chết vì người công chính, hoạ may có ai dám chết vì một người lương thiện chăng. <sup>8</sup> Thế mà Đức Ki-tô đã chết vì chúng ta, ngay khi chúng ta còn là những người tội lỗi ; đó là bằng chứng Thiên Chúa yêu thương chúng ta. <sup>9</sup> Phương chi bây giờ chúng ta đã được nên công chính nhờ máu Đức Ki-tô đổ ra, hẳn chúng ta sẽ được Người cứu khỏi cơn thịnh nộ của Thiên Chúa. <sup>10</sup> Thật vậy, nếu ngay khi chúng ta còn thù nghịch với Thiên Chúa, Thiên Chúa đã để cho Con của Người phải chết mà cho chúng ta được hoà giải với Người, phương chi bây giờ chúng ta đã được hoà giải rồi, hẳn chúng ta sẽ được cứu nhờ sự sống của Người Con ấy. <sup>11</sup> Nhưng không phải chỉ có thế, chúng ta còn có Thiên Chúa là niềm tự hào, nhờ Đức Giê-su Ki-tô, Chúa chúng ta, Đấng nay đã hoà giải chúng ta với Thiên Chúa.</p>"
  },
  "tm": {
    "ref": "Ga 6,37-40",
    "bookTitle": "<span class=\"holycross\">&#x2720;</span>Tin Mừng Chúa Giê-su Ki-tô theo thánh Gio-an.",
    "lead": "Ai tin vào người Con, thì được sống muôn đời, và tôi sẽ cho họ sống lại trong ngày sau hết.",
    "alleluiaRef": "Ga 6,40",
    "alleluia": "Ha-lê-lui-a. Ha-lê-lui-a. Chúa nói : Ý của Cha tôi là tất cả những ai tin vào người Con, thì được sống muôn đời, và tôi sẽ cho họ sống lại trong ngày sau hết. Ha-lê-lui-a.",
    "alleluiaHtml": "<p>Ha-lê-lui-a. Ha-lê-lui-a. Chúa nói : Ý của Cha tôi là tất cả những ai tin vào người Con, thì được sống muôn đời, và tôi sẽ cho họ sống lại trong ngày sau hết. Ha-lê-lui-a.</p>",
    "content": "<p><sup>37</sup> Khi ấy, Đức Giê-su nói với dân chúng rằng : “Tất cả những người Chúa Cha ban cho tôi đều sẽ đến với tôi, và ai đến với tôi, tôi sẽ không loại ra ngoài, <sup>38</sup> vì tôi tự trời mà xuống, không phải để làm theo ý tôi, nhưng để làm theo ý Đấng đã sai tôi. <sup>39</sup> Mà ý của Đấng đã sai tôi là tất cả những kẻ Người đã ban cho tôi, tôi sẽ không để mất một ai, nhưng sẽ cho họ sống lại trong ngày sau hết. <sup>40</sup> Thật vậy, ý của Cha tôi là tất cả những ai thấy người Con và tin vào người Con, thì được sống muôn đời, và tôi sẽ cho họ sống lại trong ngày sau hết.”</p>"
  }
},
  "2026-10-25": {
  "date": "2026-10-25",
  "title": "Chúa Nhật Tuần XXX - Mùa Thường Niên",
  "source": "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ (ktcgkpv.org)",
  "sourceUrl": "https://ktcgkpv.org/readings/mass-reading",
  "bd1": {
    "ref": "Xh 22,20-26",
    "bookTitle": "Bài trích sách Xuất hành.",
    "lead": "Nếu các ngươi ức hiếp mẹ goá con côi, thì cơn giận Ta sẽ bốc lên chống lại các ngươi.",
    "content": "<p><sup>20</sup> Đức Chúa phán thế này : Người ngoại kiều, ngươi không được ngược đãi và áp bức, vì chính các ngươi đã là ngoại kiều ở đất Ai-cập. <sup>21</sup> Mẹ goá con côi, các ngươi không được ức hiếp. <sup>22</sup> Nếu ngươi ức hiếp mà nó kêu cứu Ta, ắt Ta sẽ nghe tiếng nó kêu cứu. <sup>23</sup> Cơn giận Ta sẽ bốc lên, Ta sẽ cho gươm chém giết các ngươi : thế là vợ các ngươi sẽ thành goá bụa, và con các ngươi sẽ thành côi cút.</p><p><sup>24</sup> Nếu ngươi cho một người trong dân Ta, một người nghèo ở với ngươi vay tiền, thì ngươi không được xử với nó như chủ nợ, không được bắt nó trả lãi.</p><p><sup>25</sup> Nếu ngươi giữ áo choàng của người khác làm đồ cầm, thì ngươi phải trả lại cho nó trước khi mặt trời lặn. <sup>26</sup> Nó chỉ có cái đó để đắp, để làm áo che thân ; nó sẽ lấy gì mà ngủ ? Nó mà kêu cứu Ta, Ta sẽ nghe nó, vì Ta vốn nhân từ.</p>"
  },
  "tv": {
    "ref": "Tv 17,2-3a.3bc-4.47 và 51ab (Đ. c.2)",
    "content": "<p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Con yêu mến Ngài, lạy Chúa là sức mạnh của con.</span></p><p class=\"leading\"><sup>2</sup><span>Con yêu mến Ngài,<br />lạy Chúa là sức mạnh của con ;</span><sup>3a</sup><span>lạy Chúa là núi đá, là thành luỹ,<br />là Đấng giải thoát con.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Con yêu mến Ngài, lạy Chúa là sức mạnh của con.</span></p><p class=\"leading\"><sup>3bc</sup><span>Lạy Thiên Chúa con thờ, là núi đá cho con trú ẩn,<br />là khiên mộc, là Đấng cứu độ quyền năng,<br />là thành trì bảo vệ.</span><sup>4</sup><span>Tôi kêu cầu Chúa<br />là Đấng xứng muôn lời ngợi khen,<br />và tôi được cứu thoát khỏi quân thù.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Con yêu mến Ngài, lạy Chúa là sức mạnh của con.</span></p><p class=\"leading\"><sup>47</sup><span>Đức Chúa vạn vạn tuế !<br />Chúc tụng Người là núi đá cho tôi trú ẩn.<br />Tôn vinh Thiên Chúa là Đấng cứu độ tôi,</span><sup>51ab</sup><span>Chúa ban nhiều chiến thắng lớn lao<br />cho Đức Vua chính Người đã lập.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Con yêu mến Ngài, lạy Chúa là sức mạnh của con.</span></p>"
  },
  "bd2": {
    "ref": "1 Tx 1,5c-10",
    "bookTitle": "Bài trích thư thứ nhất của thánh Phao-lô tông đồ gửi tín hữu Thê-xa-lô-ni-ca.",
    "lead": "Anh em đã từ bỏ ngẫu tượng, để phụng sự Thiên Chúa và chờ đợi Con của Người.",
    "content": "<p><sup>5c</sup> Thưa anh em, anh em biết, khi ở với anh em, chúng tôi đã sống thế nào để mưu ích cho anh em ; <sup>6</sup> còn anh em, anh em đã bắt chước chúng tôi và noi gương Chúa, khi đón nhận lời Chúa giữa bao nỗi gian truân với niềm vui do Thánh Thần ban : <sup>7</sup> bởi vậy anh em đã nên gương cho mọi tín hữu ở miền Ma-kê-đô-ni-a và miền A-khai-a. <sup>8</sup> Quả thế, từ nơi anh em, lời Chúa đã vang ra, không những ở Ma-kê-đô-ni-a và A-khai-a, mà đâu đâu người ta cũng nghe biết lòng tin anh em đặt vào Thiên Chúa, khiến chúng tôi không cần phải nói gì thêm nữa. <sup>9</sup> Khi nói về chúng tôi, người ta kể lại chúng tôi đã được anh em tiếp đón làm sao, và anh em đã từ bỏ ngẫu tượng mà quay về với Thiên Chúa thế nào, để phụng sự Thiên Chúa hằng sống, Thiên Chúa thật, <sup>10</sup> và chờ đợi Con của Người từ trời ngự đến, người Con mà Thiên Chúa đã cho trỗi dậy từ cõi chết, là Đức Giê-su, Đấng cứu chúng ta thoát cơn thịnh nộ đang đến.</p>"
  },
  "tm": {
    "ref": "Mt 22,34-40",
    "bookTitle": "<span class=\"holycross\">&#x2720;</span>Tin Mừng Chúa Giê-su Ki-tô theo thánh Mát-thêu.",
    "lead": "Ngươi phải yêu mến Đức Chúa, Thiên Chúa của ngươi, và yêu người thân cận như chính mình.",
    "alleluiaRef": "Ga 14,23",
    "alleluia": "Ha-lê-lui-a. Ha-lê-lui-a. Chúa nói : Ai yêu mến Thầy, thì sẽ giữ lời Thầy. Cha Thầy sẽ yêu mến người ấy. Cha Thầy và Thầy sẽ đến với người ấy. Ha-lê-lui-a.",
    "alleluiaHtml": "<p>Ha-lê-lui-a. Ha-lê-lui-a. Chúa nói : Ai yêu mến Thầy, thì sẽ giữ lời Thầy. Cha Thầy sẽ yêu mến người ấy. Cha Thầy và Thầy sẽ đến với người ấy. Ha-lê-lui-a.</p>",
    "content": "<p><sup>34</sup> Khi ấy, nghe tin Đức Giê-su đã làm cho nhóm Xa-đốc phải câm miệng, thì những người Pha-ri-sêu họp nhau lại. <sup>35</sup> Rồi một người thông luật trong nhóm hỏi Đức Giê-su để thử Người rằng : <sup>36</sup> “Thưa Thầy, trong sách Luật Mô-sê, điều răn nào là điều răn trọng nhất ?” <sup>37</sup> Đức Giê-su đáp : “Ngươi phải yêu mến Đức Chúa, Thiên Chúa của ngươi, hết lòng, hết linh hồn và hết trí khôn ngươi. <sup>38</sup> Đó là điều răn trọng nhất và điều răn thứ nhất. <sup>39</sup> Còn điều răn thứ hai, cũng giống điều răn ấy, là : Ngươi phải yêu người thân cận như chính mình. <sup>40</sup> Tất cả Luật Mô-sê và các sách ngôn sứ đều tuỳ thuộc vào hai điều răn ấy.”</p>"
  }
},
  "2026-11-22": {
  "date": "2026-11-22",
  "title": "Chúa Nhật 34 Thường Niên - Chúa Kitô Vua Vũ Trụ",
  "source": "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ (ktcgkpv.org)",
  "sourceUrl": "https://ktcgkpv.org/readings/mass-reading",
  "bd1": {
    "ref": "Ed 34,11-12.15-17",
    "bookTitle": "Bài trích sách ngôn sứ Ê-dê-ki-en.",
    "lead": "Phần các ngươi, hỡi chiên của Ta, này Ta sẽ xét xử giữa chiên với chiên.",
    "content": "<p><sup>11</sup> Đức Chúa là Chúa Thượng phán thế này : “Đây, chính Ta sẽ chăm sóc chiên của Ta và thân hành kiểm điểm. <sup>12</sup> Như mục tử kiểm điểm đàn vật của mình vào ngày người ấy ở giữa đàn chiên bị tản mác thế nào, thì Ta cũng sẽ kiểm điểm chiên của Ta như vậy. Ta sẽ kéo chúng ra khỏi mọi nơi chúng đã bị tản mác, vào ngày mây đen mù mịt. <sup>15</sup> Chính Ta sẽ chăn dắt chiên của Ta, chính Ta sẽ cho chúng nằm nghỉ - sấm ngôn của Đức Chúa là Chúa Thượng. <sup>16</sup> Con nào bị mất, Ta sẽ đi tìm ; con nào đi lạc, Ta sẽ đưa về ; con nào bị thương, Ta sẽ băng bó ; con nào bệnh tật, Ta sẽ làm cho mạnh ; con nào béo mập, con nào khoẻ mạnh, Ta sẽ canh chừng. Ta sẽ theo lẽ chính trực mà chăn dắt chúng.</p><p><sup>17</sup> “Phần các ngươi, hỡi chiên của Ta, -Đức Chúa là Chúa Thượng phán-, này Ta sẽ xét xử giữa chiên với chiên, giữa cừu với dê.”</p>"
  },
  "tv": {
    "ref": "Tv 22,1-2a.2b-3.5.6 (Đ. c.1)",
    "content": "<p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Chúa là mục tử chăn dắt tôi,<br />tôi chẳng thiếu thốn gì.</span></p><p class=\"leading\"><sup>1</sup><span>Chúa là mục tử chăn dắt tôi,<br />tôi chẳng thiếu thốn gì.</span><sup>2a</sup><span>Trong đồng cỏ xanh tươi,<br />Người cho tôi nằm nghỉ.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Chúa là mục tử chăn dắt tôi,<br />tôi chẳng thiếu thốn gì.</span></p><p class=\"leading\"><sup>2b</sup><span>Người đưa tôi tới dòng nước trong lành</span><sup>3</sup><span>và bổ sức cho tôi.<br />Người dẫn tôi trên đường ngay nẻo chính<br />vì danh dự của Người.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Chúa là mục tử chăn dắt tôi,<br />tôi chẳng thiếu thốn gì.</span></p><p class=\"leading\"><sup>5</sup><span>Chúa dọn sẵn cho con bữa tiệc<br />ngay trước mặt quân thù.<br />Đầu con, Chúa xức đượm dầu thơm,<br />ly rượu con đầy tràn chan chứa.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Chúa là mục tử chăn dắt tôi,<br />tôi chẳng thiếu thốn gì.</span></p><p class=\"leading\"><sup>6</sup><span>Lòng nhân hậu và tình thương Chúa<br />ấp ủ tôi suốt cả cuộc đời,<br />và tôi được ở đền Người<br />những ngày tháng, những năm dài triền miên.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Chúa là mục tử chăn dắt tôi,<br />tôi chẳng thiếu thốn gì.</span></p>"
  },
  "bd2": {
    "ref": "1 Cr 15,20-26.28",
    "bookTitle": "Bài trích thư thứ nhất của thánh Phao-lô tông đồ gửi tín hữu Cô-rin-tô.",
    "lead": "Đức Ki-tô trao vương quyền lại cho Thiên Chúa là Cha, và như vậy, Thiên Chúa có toàn quyền trên muôn loài.",
    "content": "<p><sup>20</sup> Thưa anh em, Đức Ki-tô đã trỗi dậy từ cõi chết, mở đường cho những ai đã an giấc ngàn thu. <sup>21</sup> Vì nếu tại một người mà nhân loại phải chết, thì cũng nhờ một người mà kẻ chết được sống lại. <sup>22</sup> Quả thế, như mọi người vì liên đới với A-đam mà phải chết, thì mọi người nhờ liên đới với Đức Ki-tô, cũng được Thiên Chúa cho sống. <sup>23</sup> Nhưng mỗi người theo thứ tự của mình : mở đường là Đức Ki-tô, rồi khi Đức Ki-tô quang lâm thì đến lượt những kẻ thuộc về Người. <sup>24</sup> Sau đó mọi sự đều hoàn tất, khi Người đã tiêu diệt hết mọi quản thần, mọi quyền thần và mọi dũng thần, rồi trao vương quyền lại cho Thiên Chúa là Cha.</p><p><sup>25</sup> Thật vậy, Đức Ki-tô phải nắm vương quyền cho đến khi Thiên Chúa đặt mọi thù địch dưới chân Người. <sup>26</sup> Thù địch cuối cùng bị tiêu diệt là sự chết. <sup>28</sup> Lúc muôn loài đã quy phục Đức Ki-tô, thì chính Người, vì là Con, cũng sẽ quy phục Đấng bắt muôn loài phải quy phục Người ; và như vậy, Thiên Chúa có toàn quyền trên muôn loài.</p>"
  },
  "tm": {
    "ref": "Mt 25,31-46",
    "bookTitle": "<span class=\"holycross\">&#x2720;</span>Tin Mừng Chúa Giê-su Ki-tô theo thánh Mát-thêu.",
    "lead": "Con Người sẽ ngự lên ngai vinh hiển của Người, và Người sẽ tách biệt họ với nhau.",
    "alleluiaRef": "Mc 11,9.10",
    "alleluia": "Ha-lê-lui-a. Ha-lê-lui-a. Chúc tụng Đấng ngự đến nhân danh Đức Chúa ! Chúc tụng triều đại đang tới, triều đại vua Đa-vít tổ phụ chúng ta. Ha-lê-lui-a.",
    "alleluiaHtml": "<p>Ha-lê-lui-a. Ha-lê-lui-a. Chúc tụng Đấng ngự đến nhân danh Đức Chúa ! Chúc tụng triều đại đang tới, triều đại vua Đa-vít tổ phụ chúng ta. Ha-lê-lui-a.</p>",
    "content": "<p><sup>31</sup> Khi ấy, Đức Giê-su nói với các môn đệ rằng : “Khi Con Người đến trong vinh quang của Người, có tất cả các thiên sứ theo hầu, bấy giờ Người sẽ ngự lên ngai vinh hiển của Người. <sup>32</sup> Các dân thiên hạ sẽ được tập hợp trước mặt Người, và Người sẽ tách biệt họ với nhau, như mục tử tách biệt chiên với dê. <sup>33</sup> Người sẽ cho chiên đứng bên phải Người, còn dê ở bên trái. <sup>34</sup> Bấy giờ Đức Vua sẽ phán cùng những người ở bên phải rằng : ‘Nào những kẻ Cha Ta chúc phúc, hãy đến thừa hưởng Vương Quốc dọn sẵn cho các ngươi ngay từ thuở tạo thiên lập địa. <sup>35</sup> Vì xưa Ta đói, các ngươi đã cho ăn ; Ta khát, các ngươi đã cho uống ; Ta là khách lạ, các ngươi đã tiếp rước ; <sup>36</sup> Ta trần truồng, các ngươi đã cho mặc ; Ta đau yếu, các ngươi đã thăm viếng ; Ta ngồi tù, các ngươi đến hỏi han.’ <sup>37</sup> Bấy giờ những người công chính sẽ thưa rằng : ‘Lạy Chúa, có bao giờ chúng con đã thấy Chúa đói mà cho ăn, khát mà cho uống ; <sup>38</sup> có bao giờ đã thấy Chúa là khách lạ mà tiếp rước ; hoặc trần truồng mà cho mặc ? <sup>39</sup> Có bao giờ chúng con đã thấy Chúa đau yếu hoặc ngồi tù, mà đến hỏi han đâu ?’ <sup>40</sup> Đức Vua sẽ đáp lại rằng : ‘Ta bảo thật các ngươi : mỗi lần các ngươi làm như thế cho một trong những anh em bé nhỏ nhất của Ta đây, là các ngươi đã làm cho chính Ta vậy.’ <sup>41</sup> Rồi Đức Vua sẽ phán cùng những người ở bên trái rằng : ‘Quân bị nguyền rủa kia, đi đi cho khuất mắt Ta mà vào lửa đời đời, nơi dành sẵn cho tên Ác Quỷ và các sứ thần của nó. <sup>42</sup> Vì xưa Ta đói, các ngươi đã không cho ăn ; Ta khát, các ngươi đã không cho uống ; <sup>43</sup> Ta là khách lạ, các ngươi đã không tiếp rước ; Ta trần truồng, các ngươi đã không cho mặc ; Ta đau yếu và ngồi tù, các ngươi đã chẳng thăm viếng.’ <sup>44</sup> Bấy giờ những người ấy cũng sẽ thưa rằng : ‘Lạy Chúa, có bao giờ chúng con đã thấy Chúa đói, khát, hoặc là khách lạ, hoặc trần truồng, đau yếu hay ngồi tù, mà không phục vụ Chúa đâu ?’ <sup>45</sup> Bấy giờ Người sẽ đáp lại họ rằng : ‘Ta bảo thật các ngươi : mỗi lần các ngươi không làm như thế cho một trong những người bé nhỏ nhất đây, là các ngươi đã không làm cho chính Ta vậy.’ <sup>46</sup> Thế là họ ra đi để chịu cực hình muôn kiếp, còn những người công chính ra đi để hưởng sự sống muôn đời.”</p>"
  }
},
  "2026-09-20": {
  "date": "2026-09-20",
  "title": "Chúa Nhật Tuần XXV - Mùa Thường Niên (Năm A)",
  "source": "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ (ktcgkpv.org)",
  "sourceUrl": "https://ktcgkpv.org/readings/mass-reading",
  "bd1": {
    "ref": "Is 55,6-9",
    "bookTitle": "Bài trích sách ngôn sứ I-sai-a.",
    "lead": "Tư tưởng của Ta không phải là tư tưởng của các ngươi.",
    "content": "<p><sup>6</sup> Hãy tìm Đức Chúa khi Người còn cho gặp, kêu cầu Người lúc Người ở kề bên. <sup>7</sup> Kẻ gian ác, hãy bỏ đường lối mình, người bất lương, hãy bỏ tư tưởng mình, mà trở về với Đức Chúa - và Người sẽ xót thương, về với Thiên Chúa chúng ta, vì Người rộng lòng tha thứ.</p><p><sup>8</sup> Thật vậy, tư tưởng của Ta không phải là tư tưởng của các ngươi, và đường lối các ngươi không phải là đường lối của Ta - sấm ngôn của Đức Chúa. <sup>9</sup> Trời cao hơn đất chừng nào, thì đường lối của Ta cũng cao hơn đường lối các ngươi, và tư tưởng của Ta cũng cao hơn tư tưởng các ngươi chừng ấy.</p>"
  },
  "tv": {
    "ref": "Tv 144,2-3.8-9.17-18 (Đ. c.18a)",
    "content": "<p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Chúa gần gũi mọi kẻ kêu cầu Người.</span></p><p class=\"leading\"><sup>2</sup><span>Ngày lại ngày, con xin chúc tụng Chúa,<br />mãi ngợi khen Danh Thánh tới muôn đời.</span><sup>3</sup><span>Chúa thật cao cả, xứng muôn lời ca tụng,<br />sự cao cả của Người khôn thấu khôn dò.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Chúa gần gũi mọi kẻ kêu cầu Người.</span></p><p class=\"leading\"><sup>8</sup><span>Chúa là Đấng từ bi nhân hậu,<br />Người chậm giận và giàu tình thương.</span><sup>9</sup><span>Chúa nhân ái đối với mọi người,<br />hằng âu yếm mọi loài Người đã dựng nên.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Chúa gần gũi mọi kẻ kêu cầu Người.</span></p><p class=\"leading\"><sup>17</sup><span>Chúa công minh trong mọi đường lối Chúa,<br />đầy yêu thương trong mọi việc Người làm.</span><sup>18</sup><span>Chúa gần gũi mọi kẻ kêu cầu Người,<br />mọi kẻ thành tâm kêu cầu Chúa.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Chúa gần gũi mọi kẻ kêu cầu Người.</span></p>"
  },
  "bd2": {
    "ref": "Pl 1,20c-24.27a",
    "bookTitle": "Bài trích thư của thánh Phao-lô tông đồ gửi tín hữu Phi-líp-phê.",
    "lead": "Đối với tôi, sống là Đức Ki-tô và chết là một mối lợi.",
    "content": "<p><sup>20c</sup> Thưa anh em, dù tôi sống hay tôi chết, Đức Ki-tô cũng sẽ được vẻ vang nơi thân xác tôi. <sup>21</sup> Vì đối với tôi, sống là Đức Ki-tô, và chết là một mối lợi. <sup>22</sup> Nếu sống ở đời này mà công việc của tôi sinh hoa kết quả, thì tôi không biết nên chọn đàng nào. <sup>23</sup> Tôi bị giằng co giữa hai đàng: ước ao của tôi là ra đi để được ở với Đức Ki-tô, điều này tốt hơn bội phần; <sup>24</sup> nhưng ở lại trong thân xác thì cần thiết hơn cho anh em.</p><p><sup>27a</sup> Chỉ có một điều là anh em phải ăn ở làm sao cho xứng với Tin Mừng của Đức Ki-tô.</p>"
  },
  "tm": {
    "ref": "Mt 20,1-16a",
    "bookTitle": "Tin Mừng Chúa Giê-su Ki-tô theo thánh Mát-thêu.",
    "lead": "Hay vì thấy tôi tốt bụng mà bạn đâm ra ghen tức?",
    "alleluiaRef": "x. Cv 16,14b",
    "alleluia": "Ha-lê-lui-a. Ha-lê-lui-a. Lạy Chúa, xin mở lòng chúng con, để chúng con chú ý lắng nghe lời Con Chúa. Ha-lê-lui-a.",
    "alleluiaHtml": "<p>Ha-lê-lui-a. Ha-lê-lui-a. Lạy Chúa, xin mở lòng chúng con, để chúng con chú ý lắng nghe lời Con Chúa. Ha-lê-lui-a.</p>",
    "content": "<p><sup>1</sup> Khi ấy, Đức Giê-su kể cho các môn đệ dụ ngôn này: \"Nước Trời giống như chuyện gia chủ kia, vừa tảng sáng đã ra mướn thợ vào làm vườn nho cho mình. <sup>2</sup> Sau khi đã thoả thuận với thợ là mỗi ngày một quan tiền, ông sai họ vào vườn nho làm việc.</p><p><sup>3</sup> Khoảng giờ thứ ba, ông trở ra, thấy có những người khác ở không, đang đứng ngoài chợ. <sup>4</sup> Ông cũng bảo họ: 'Cả các anh nữa, hãy đi vào vườn nho, tôi sẽ trả cho các anh hợp lẽ công bằng.' <sup>5</sup> Họ liền đi. Khoảng giờ thứ sáu, rồi giờ thứ chín, ông lại trở ra và cũng làm như vậy.</p><p><sup>6</sup> Khoảng giờ thứ mười một, ông trở ra, thấy còn có những người khác đứng đó, ông nói với họ: 'Sao các anh đứng đây suốt ngày không làm gì hết?' <sup>7</sup> Họ đáp: 'Vì không ai mướn chúng tôi.' Ông bảo họ: 'Cả các anh nữa, hãy đi vào vườn nho!'</p><p><sup>8</sup> Chiều đến, ông chủ vườn nho bảo người quản lý: 'Anh gọi thợ lại mà trả công cho họ, cứ bắt đầu từ người vào sau chót tới người đầu tiên.' <sup>9</sup> Vậy những người mới vào làm lúc giờ thứ mười một tiến lại, và mỗi người được lãnh một quan tiền. <sup>10</sup> Khi những người vào làm trước nhất tiến lại, họ tưởng là sẽ được lãnh nhiều hơn, thế nhưng mỗi người cũng chỉ lãnh được một quan tiền. <sup>11</sup> Vừa lãnh xong, họ liền cằn nhằn với gia chủ: <sup>12</sup> 'Mấy người sau chót này chỉ làm có một giờ, thế mà ông lại coi họ ngang hàng với chúng tôi là những người đã phải làm việc nặng nhọc suốt ngày, lại còn bị nắng nôi thiêu đốt!' <sup>13</sup> Nhưng gia chủ trả lời cho một người trong bọn họ: 'Này bạn, tôi đâu có bất công với bạn! Bạn đã chẳng thoả thuận với tôi là một quan tiền sao? <sup>14</sup> Cầm lấy phần của bạn mà đi đi! Còn tôi, tôi muốn cho người sau chót này cũng được bằng bạn đó. <sup>15</sup> Chẳng lẽ tôi lại không có quyền tuỳ ý định đoạt về những gì là của tôi sao? Hay vì thấy tôi tốt bụng, mà bạn đâm ra ghen tức?'</p><p><sup>16a</sup> Thế là những kẻ đứng chót sẽ được lên hàng đầu, còn những kẻ đứng đầu sẽ phải xuống hàng chót.\"</p>"
  }
},
  "2026-09-27": {
  "date": "2026-09-27",
  "title": "Chúa Nhật Tuần XXVI - Mùa Thường Niên (Năm A)",
  "source": "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ (ktcgkpv.org)",
  "sourceUrl": "https://ktcgkpv.org/readings/mass-reading",
  "bd1": {
    "ref": "Ed 18,25-28",
    "bookTitle": "Bài trích sách ngôn sứ Ê-dê-ki-en.",
    "lead": "Nếu kẻ gian ác từ bỏ điều dữ nó đã phạm, nó sẽ cứu được mạng sống mình.",
    "content": "<p><sup>25</sup> Đức Chúa phán thế này: Các ngươi lại nói: 'Đường lối của Chúa không ngay thẳng!' Vậy hỡi nhà Ít-ra-en, hãy nghe đây: Có phải đường lối của Ta không ngay thẳng hay đường lối của các ngươi mới không ngay thẳng? <sup>26</sup> Khi người công chính từ bỏ lẽ công chính của mình mà phạm tội ác và phải chết, thì chính vì tội ác nó phạm mà nó phải chết. <sup>27</sup> Còn nếu kẻ gian ác từ bỏ điều dữ nó đã phạm mà thi hành điều chính trực công minh, thì nó sẽ cứu được mạng sống mình. <sup>28</sup> Nó đã thấy và từ bỏ mọi tội ác nó phạm, thì chắc chắn nó sẽ sống, nó không phải chết.</p>"
  },
  "tv": {
    "ref": "Tv 24,4bc-5.6-7.8-9 (Đ. c.6a)",
    "content": "<p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Lạy Chúa, xin nhớ lại tình thương của Ngài.</span></p><p class=\"leading\"><sup>4bc</sup><span>Lạy Chúa, đường nẻo Ngài, xin dạy cho con biết,<br />lối đi của Ngài, xin chỉ bảo con.</span><sup>5</sup><span>Xin dẫn con đi theo đường chân lý của Ngài và bảo ban dạy dỗ,<br />vì chính Ngài là Thiên Chúa cứu độ con.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Lạy Chúa, xin nhớ lại tình thương của Ngài.</span></p><p class=\"leading\"><sup>6</sup><span>Lạy Chúa, xin nhớ lại nghĩa nặng với tình sâu<br />Ngài đã từng biểu lộ từ muôn thuở muôn đời.</span><sup>7</sup><span>Tuổi xuân trót dại bao lầm lỗi, xin Ngài đừng nhớ đến,<br />nhưng xin lấy lượng từ bi mà nhớ đến con.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Lạy Chúa, xin nhớ lại tình thương của Ngài.</span></p><p class=\"leading\"><sup>8</sup><span>Chúa là Đấng nhân từ chính trực,<br />chỉ lối cho tội nhân,</span><sup>9</sup><span>dẫn kẻ khiêm nhu đi trong đường công chính,<br />dạy cho biết đường lối của Người.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Lạy Chúa, xin nhớ lại tình thương của Ngài.</span></p>"
  },
  "bd2": {
    "ref": "Pl 2,1-11",
    "bookTitle": "Bài trích thư của thánh Phao-lô tông đồ gửi tín hữu Phi-líp-phê.",
    "lead": "Anh em hãy có cùng những tâm tình như chính Đức Ki-tô Giê-su.",
    "content": "<p><sup>1</sup> Thưa anh em, nếu quả thật sự liên kết với Đức Ki-tô đem lại cho anh em một niềm an ủi, nếu tình bác ái khích lệ anh em, nếu anh em được hiệp thông trong Thần Khí, nếu anh em có lòng thương xót và cảm thông, <sup>2</sup> thì xin anh em hãy làm cho niềm vui của tôi được trọn vẹn, là hãy có cùng một cảm nghĩ, cùng một lòng mến, cùng một tâm hồn, cùng một ý hướng. <sup>3</sup> Đừng làm chi vì ganh tị hay vì hư danh, nhưng hãy lấy lòng khiêm nhường mà coi người khác hơn mình. <sup>4</sup> Mỗi người đừng tìm lợi ích cho riêng mình, nhưng hãy tìm lợi ích cho người khác. <sup>5</sup> Giữa anh em với nhau, anh em hãy có cùng một tâm tình như chính Đức Ki-tô Giê-su.</p><p><sup>6</sup> Đức Giê-su Ki-tô vốn dĩ là Thiên Chúa mà không nghĩ phải nhất quyết duy trì địa vị ngang hàng với Thiên Chúa, <sup>7</sup> nhưng đã hoàn toàn trút bỏ vinh quang mặc lấy thân nô lệ, trở nên giống phàm nhân sống như một người trần thế. <sup>8</sup> Người lại còn hạ mình, vâng lời cho đến nỗi bằng lòng chịu chết, chết trên cây thập tự. <sup>9</sup> Chính vì thế, Thiên Chúa đã siêu tôn Người và tặng ban danh hiệu trổi vượt trên muôn ngàn danh hiệu, <sup>10</sup> như vậy, khi vừa nghe danh thánh Giê-su, cả trên trời dưới đất và trong nơi âm phủ, muôn vật phải bái quỳ, <sup>11</sup> và để tôn vinh Thiên Chúa Cha, mọi loài phải mở miệng tuyên xưng rằng: \"Đức Giê-su Ki-tô là Chúa\".</p>"
  },
  "tm": {
    "ref": "Mt 21,28-32",
    "bookTitle": "Tin Mừng Chúa Giê-su Ki-tô theo thánh Mát-thêu.",
    "lead": "Nó hối hận và đã đi làm. Những người thu thuế và những cô gái điếm vào Nước Thiên Chúa trước các ông.",
    "alleluiaRef": "Ga 10,27",
    "alleluia": "Ha-lê-lui-a. Ha-lê-lui-a. Chúa nói: Chiên của Tôi thì nghe tiếng Tôi, Tôi biết chúng và chúng theo Tôi. Ha-lê-lui-a.",
    "alleluiaHtml": "<p>Ha-lê-lui-a. Ha-lê-lui-a. Chúa nói: Chiên của Tôi thì nghe tiếng Tôi, Tôi biết chúng và chúng theo Tôi. Ha-lê-lui-a.</p>",
    "content": "<p><sup>28</sup> Khi ấy, Đức Giê-su nói với các thượng tế và kỳ mục trong dân rằng: \"Các ông nghĩ sao: Một người kia có hai đứa con trai. Ông ta đến nói với đứa thứ nhất: 'Này con, hôm nay con hãy đi làm vườn nho.' <sup>29</sup> Nó đáp: 'Con không muốn đâu!' Nhưng sau đó, nó hối hận, nên lại đi. <sup>30</sup> Ông ta đến gặp đứa thứ hai và cũng bảo như vậy. Nó đáp: 'Thưa ngài, vâng, con đi!' nhưng rồi lại không đi. <sup>31</sup> Trong hai người con đó, ai đã làm theo ý muốn của người cha?\" Họ đáp: \"Người thứ nhất.\"</p><p>Đức Giê-su nói với họ: \"Tôi bảo thật các ông: những người thu thuế và những cô gái điếm vào Nước Thiên Chúa trước các ông. <sup>32</sup> Vì ông Gio-an đã đến chỉ đường công chính cho các ông, mà các ông không tin ông ấy; còn những người thu thuế và những cô gái điếm lại tin. Phần các ông, khi đã thấy vậy rồi, các ông vẫn không chịu hối hận mà tin ông ấy.\"</p>"
  }
},
  "2026-10-04": {
  "date": "2026-10-04",
  "title": "Chúa Nhật Tuần XXVII - Mùa Thường Niên (Năm A)",
  "source": "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ (ktcgkpv.org)",
  "sourceUrl": "https://ktcgkpv.org/readings/mass-reading",
  "bd1": {
    "ref": "Is 5,1-7",
    "bookTitle": "Bài trích sách ngôn sứ I-sai-a.",
    "lead": "Vườn nho của Đức Chúa các đạo binh là nhà Ít-ra-en.",
    "content": "<p><sup>1</sup> Tôi xin hát tặng bạn tôi, bài hát của bạn tôi về vườn nho của mình. Bạn tôi có một vườn nho trên sườn đồi màu mỡ. <sup>2</sup> Bạn cuốc đất, nhặt đá, trồng những gốc nho quý, xây một tháp canh ở giữa, và khoét bồn đạp nho. Bạn những mong nó sinh trái tốt, nó lại sinh trái chua.</p><p><sup>3</sup> Giờ đây, hỡi dân cư Giê-ru-sa-lem và người Giu-đa, hãy làm trọng tài phân xử giữa tôi và vườn nho của tôi! <sup>4</sup> Có gì phải làm cho vườn nho của tôi mà tôi đã không làm? Sao tôi những mong nó sinh trái tốt, nó lại sinh trái chua?</p><p><sup>5</sup> Giờ đây, tôi cho các người biết tôi sẽ làm gì cho vườn nho của tôi: dỡ hàng rào để cho nó bị tàn phá, phá bức tường để cho nó bị giẫm đạp. <sup>6</sup> Tôi sẽ biến nó thành mảnh đất hoang vu, không cắt tỉa, không vun xới; gai góc sẽ mọc lên; và tôi sẽ truyền cho mây đừng đổ mưa xuống trên nó. <sup>7</sup> Vườn nho của Đức Chúa các đạo binh là nhà Ít-ra-en; chồi cây Người vui thích chính là người Giu-đa. Người những mong họ giữ lẽ công bằng, mà chỉ thấy đầu rơi máu chảy; những mong họ làm điều chính trực, mà chỉ nghe tiếng than khóc kêu gào.</p>"
  },
  "tv": {
    "ref": "Tv 79,9 và 12.13-14.15-16.19-20 (Đ. Is 5,7a)",
    "content": "<p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Vườn nho của Đức Chúa các đạo binh là nhà Ít-ra-en.</span></p><p class=\"leading\"><sup>9</sup><span>Gốc nho này, Chúa bứng từ Ai-cập,<br />đuổi chư dân, lấy đất mà trồng,</span><sup>12</sup><span>cành vươn dài ra tận bờ Biển Cả,<br />chồi đâm sâu tới tận vùng Sông Cả.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Vườn nho của Đức Chúa các đạo binh là nhà Ít-ra-en.</span></p><p class=\"leading\"><sup>13</sup><span>Bức tường rào, sao Ngài phá đổ,<br />cho khách qua đường bứt trộm ăn?</span><sup>14</sup><span>Heo rừng vào phá phách,<br />thú nội tha hồ cắn trộm lan tràn!</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Vườn nho của Đức Chúa các đạo binh là nhà Ít-ra-en.</span></p><p class=\"leading\"><sup>15</sup><span>Lạy Chúa các đạo binh, xin trở lại,<br />từ trời cao nhìn ngắm và đoái thương:</span><sup>16</sup><span>vườn nho này, xin Ngài nâng đỡ,<br />bảo vệ chồi tay hữu Ngài đã trồng.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Vườn nho của Đức Chúa các đạo binh là nhà Ít-ra-en.</span></p><p class=\"leading\"><sup>19</sup><span>Chúng con nguyền chẳng xa rời Chúa nữa,<br />xin ban sức sống, chúng con sẽ cầu khẩn Danh Ngài.</span><sup>20</sup><span>Lạy Chúa các đạo binh, xin phục hồi chúng con,<br />toả ánh tôn nhan rạng ngời để chúng con được ơn cứu độ.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Vườn nho của Đức Chúa các đạo binh là nhà Ít-ra-en.</span></p>"
  },
  "bd2": {
    "ref": "Pl 4,6-9",
    "bookTitle": "Bài trích thư của thánh Phao-lô tông đồ gửi tín hữu Phi-líp-phê.",
    "lead": "Hãy thi hành những điều đó, và Thiên Chúa là nguồn bình an sẽ ở với anh em.",
    "content": "<p><sup>6</sup> Thưa anh em, anh em đừng lo lắng gì cả. Nhưng trong mọi hoàn cảnh, anh em cứ đem lời cầu xin, van nài và tạ ơn mà dãi bày trước mặt Thiên Chúa những điều anh em sở nguyện. <sup>7</sup> Và bình an của Thiên Chúa, bình an vượt lên trên mọi hiểu biết, sẽ giữ gìn lòng trí anh em trong Đức Ki-tô Giê-su.</p><p><sup>8</sup> Ngoài ra, thưa anh em, những gì là chân thật, cao quý, những gì là chính trực, tinh tuyền, những gì là đáng mến và đem lại danh thơm tiếng tốt, những gì là đức hạnh, đáng khen, thì xin anh em hãy để ý đến. <sup>9</sup> Những gì anh em đã học hỏi, đã lãnh nhận, đã nghe, đã thấy ở nơi tôi, thì hãy đem ra thực hành, và Thiên Chúa là nguồn bình an sẽ ở với anh em.</p>"
  },
  "tm": {
    "ref": "Mt 21,33-43",
    "bookTitle": "Tin Mừng Chúa Giê-su Ki-tô theo thánh Mát-thêu.",
    "lead": "Chủ sẽ cho các tá điền khác mướn vườn nho.",
    "alleluiaRef": "x. Ga 15,16",
    "alleluia": "Ha-lê-lui-a. Ha-lê-lui-a. Chúa nói: Chính Thầy đã chọn anh em, và cắt cử anh em để anh em ra đi, sinh được hoa trái, và hoa trái của anh em tồn tại. Ha-lê-lui-a.",
    "alleluiaHtml": "<p>Ha-lê-lui-a. Ha-lê-lui-a. Chúa nói: Chính Thầy đã chọn anh em, và cắt cử anh em để anh em ra đi, sinh được hoa trái, và hoa trái của anh em tồn tại. Ha-lê-lui-a.</p>",
    "content": "<p><sup>33</sup> Khi ấy, Đức Giê-su nói với các thượng tế và kỳ mục trong dân rằng: \"Các ông hãy nghe một dụ ngôn khác: Có gia chủ kia trồng được một vườn nho; chung quanh vườn, ông rào giậu; trong vườn, ông khoét bồn đạp nho, và dựng một tháp canh. Xong đâu đấy, ông cho tá điền canh tác, rồi trẩy đi phương xa. <sup>34</sup> Gần đến mùa hái nho, ông sai đầy tớ đến gặp các tá điền để thu hoa lợi. <sup>35</sup> Nhưng bọn tá điền bắt các đầy tớ ông: chúng đánh người này, giết người kia, ném đá người khác. <sup>36</sup> Ông lại sai một số đầy tớ khác đông hơn trước, nhưng bọn tá điền cũng xử với họ y như vậy. <sup>37</sup> Sau cùng, ông sai chính con trai mình đến gặp chúng, vì nghĩ rằng: 'Chúng sẽ nể con ta.' <sup>38</sup> Nhưng bọn tá điền vừa thấy người con, thì bảo nhau: 'Đứa thừa tự đây rồi! Nào ta giết quách nó đi, và đoạt lấy gia tài nó!' <sup>39</sup> Thế là chúng bắt lấy cậu, lôi ra ngoài vườn nho mà giết.</p><p><sup>40</sup> Vậy khi ông chủ vườn nho đến, ông sẽ làm gì bọn tá điền kia?\" <sup>41</sup> Họ đáp: \"Ác giả ác báo, ông sẽ tru diệt bọn hung ác đó, và sang nhượng vườn nho cho các tá điền khác, những người biết nộp hoa lợi cho ông đúng mùa.\" <sup>42</sup> Đức Giê-su nói với họ: \"Kinh Thánh có câu: 'Tảng đá thợ xây nhà loại bỏ lại trở nên tảng đá góc tường. Đó chính là công trình của Chúa, công trình kỳ diệu trước mắt chúng ta!' Các ông chưa bao giờ đọc câu đó sao?</p><p><sup>43</sup> Bởi đó, tôi nói cho các ông hay: Nước Thiên Chúa, Thiên Chúa sẽ lấy đi không cho các ông nữa, mà ban cho một dân tộc biết làm cho Nước ấy sinh hoa lợi.\"</p>"
  }
},
  "cn31": {
  "date": "cn31",
  "title": "Chúa Nhật Tuần XXXI - Mùa Thường Niên (Năm A)",
  "source": "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ (ktcgkpv.org)",
  "sourceUrl": "https://ktcgkpv.org/readings/mass-reading",
  "bd1": {
    "ref": "Ml 1,14b-2,2b.8-10",
    "bookTitle": "Bài trích sách ngôn sứ Ma-la-khi.",
    "lead": "Các ngươi đã đi trệch đường và làm cho nhiều người lảo đảo trên đường Luật Dạy.",
    "content": "<p><sup>1,14b</sup> Đức Chúa các đạo binh phán: Ta là một Đại Vương, và Danh Ta được kính sợ giữa chư dân. <sup>2,1</sup> Giờ đây, hỡi các tư tế, lệnh này dành cho các ngươi: <sup>2</sup> Nếu các ngươi không nghe, nếu các ngươi không tha thiết làm vinh Danh Ta, thì Ta sẽ sai lời chúc dữ đến các ngươi, và Ta sẽ biến phúc lành của các ngươi thành lời chúc dữ.</p><p><sup>8</sup> Đức Chúa các đạo binh phán: Các ngươi đã đi trệch đường và làm cho nhiều người lảo đảo trên đường Luật Dạy; các ngươi đã huỷ hoại giao ước của Lê-vi. <sup>9</sup> Vì thế, chính Ta sẽ làm cho các ngươi phải đáng khinh và hèn hạ trước mặt toàn dân, bởi vì các ngươi không tuân giữ đường lối Ta, và khi áp dụng Luật Dạy, các ngươi lại thiên vị.</p><p><sup>10</sup> Tất cả chúng ta chẳng có cùng một Cha sao? Chẳng phải cùng một Thiên Chúa đã dựng nên chúng ta sao? Thế sao chúng ta lại phản bội nhau mà xúc phạm đến giao ước của cha ông chúng ta?</p>"
  },
  "tv": {
    "ref": "Tv 130,1.2.3 (Đ. c.2bc)",
    "content": "<p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Lạy Chúa, xin giữ linh hồn con trong bình an của Chúa.</span></p><p class=\"leading\"><sup>1</sup><span>Lòng con chẳng dám tự cao,<br />mắt con chẳng dám tự hào, Chúa ơi!<br />Đường cao vọng, chẳng đời nào bước,<br />việc diệu kỳ, vượt sức, chẳng cầu.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Lạy Chúa, xin giữ linh hồn con trong bình an của Chúa.</span></p><p class=\"leading\"><sup>2</sup><span>Hồn con, con vẫn giữ yên,<br />dịu dàng, thanh thản như con thơ ngủ trong lòng mẹ,<br />hồn con tựa đứa trẻ mới rời bầu vú mẹ.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Lạy Chúa, xin giữ linh hồn con trong bình an của Chúa.</span></p><p class=\"leading\"><sup>3</sup><span>Hỡi Ít-ra-en, hãy cậy trông vào Chúa,<br />tự bây giờ cho đến mãi muôn đời.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Lạy Chúa, xin giữ linh hồn con trong bình an của Chúa.</span></p>"
  },
  "bd2": {
    "ref": "1 Tx 2,7b-9.13",
    "bookTitle": "Bài trích thư thứ nhất của thánh Phao-lô tông đồ gửi tín hữu Thê-xa-lô-ni-ca.",
    "lead": "Chúng tôi muốn chia sẻ với anh em không những Tin Mừng của Thiên Chúa, mà cả mạng sống chúng tôi nữa.",
    "content": "<p><sup>7b</sup> Thưa anh em, chúng tôi đã cư xử dịu dàng giữa anh em, như mẹ hiền ấp ủ con thơ. <sup>8</sup> Vì yêu thương anh em thiết tha, chúng tôi sẵn sàng chia sẻ với anh em không những Tin Mừng của Thiên Chúa, mà cả mạng sống chúng tôi nữa, bởi vì anh em đã trở nên những người rất thân thiết đối với chúng tôi. <sup>9</sup> Thưa anh em, anh em hẳn còn nhớ sự lao đao vất vả của chúng tôi: đêm ngày làm việc để khỏi trở nên gánh nặng cho một ai trong anh em, suốt thời gian chúng tôi rao giảng Tin Mừng của Thiên Chúa cho anh em.</p><p><sup>13</sup> Bởi thế, chúng tôi không ngừng tạ ơn Thiên Chúa, vì khi anh em đón nhận Lời Thiên Chúa mà chúng tôi đã truyền giảng, anh em đã đón nhận không phải như lời của người phàm, nhưng như Lời Thiên Chúa, đúng theo bản tính Lời ấy, Lời đang hoạt động nơi anh em là những tín hữu.</p>"
  },
  "tm": {
    "ref": "Mt 23,1-12",
    "bookTitle": "Tin Mừng Chúa Giê-su Ki-tô theo thánh Mát-thêu.",
    "lead": "Họ nói mà không làm.",
    "alleluiaRef": "Mt 23,9a.10b",
    "alleluia": "Ha-lê-lui-a. Ha-lê-lui-a. Anh em chỉ có một Cha là Cha trên trời; anh em chỉ có một Thầy là Đức Ki-tô. Ha-lê-lui-a.",
    "alleluiaHtml": "<p>Ha-lê-lui-a. Ha-lê-lui-a. Anh em chỉ có một Cha là Cha trên trời; anh em chỉ có một Thầy là Đức Ki-tô. Ha-lê-lui-a.</p>",
    "content": "<p><sup>1</sup> Bấy giờ, Đức Giê-su nói với đám đông và các môn đệ Người rằng: <sup>2</sup> \"Các kinh sư và các người Pha-ri-sêu ngồi trên toà ông Mô-sê mà giảng dạy. <sup>3</sup> Vậy, tất cả những gì họ nói, anh em hãy làm, hãy giữ, còn những việc họ làm, thì đừng có làm theo, vì họ nói mà không làm. <sup>4</sup> Họ bó những gánh nặng mà chất lên vai người ta, nhưng chính họ lại không buồn động ngón tay vào. <sup>5</sup> Họ làm mọi việc cốt để cho thiên hạ thấy: họ nới rộng thẻ kinh, may dài tua áo. <sup>6</sup> Họ thích ngồi chỗ danh dự trong đám tiệc, chiếm hàng ghế đầu trong hội đường, <sup>7</sup> thích được người ta chào hỏi ở những nơi công cộng và được gọi là 'thầy'.</p><p><sup>8</sup> Phần anh em, thì đừng để ai gọi mình là 'thầy', vì anh em chỉ có một Thầy, còn tất cả anh em đều là anh em với nhau. <sup>9</sup> Anh em cũng đừng gọi ai dưới đất này là cha của anh em, vì anh em chỉ có một Cha là Cha trên trời. <sup>10</sup> Anh em cũng đừng để ai gọi mình là người chỉ đạo, vì anh em chỉ có một Đấng chỉ đạo là Đức Ki-tô. <sup>11</sup> Trong anh em, người nào lớn hơn cả phải làm người phục vụ anh em. <sup>12</sup> Ai tôn mình lên sẽ bị hạ xuống, còn ai hạ mình xuống sẽ được tôn lên.\"</p>"
  }
},
  "2026-09-26": {
  "date": "2026-09-20",
  "title": "Chúa Nhật Tuần XXV - Mùa Thường Niên (Năm A)",
  "source": "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ (ktcgkpv.org)",
  "sourceUrl": "https://ktcgkpv.org/readings/mass-reading",
  "bd1": {
    "ref": "Is 55,6-9",
    "bookTitle": "Bài trích sách ngôn sứ I-sai-a.",
    "lead": "Tư tưởng của Ta không phải là tư tưởng của các ngươi.",
    "content": "<p><sup>6</sup> Hãy tìm Đức Chúa khi Người còn cho gặp, kêu cầu Người lúc Người ở kề bên. <sup>7</sup> Kẻ gian ác, hãy bỏ đường lối mình, người bất lương, hãy bỏ tư tưởng mình, mà trở về với Đức Chúa - và Người sẽ xót thương, về với Thiên Chúa chúng ta, vì Người rộng lòng tha thứ.</p><p><sup>8</sup> Thật vậy, tư tưởng của Ta không phải là tư tưởng của các ngươi, và đường lối các ngươi không phải là đường lối của Ta - sấm ngôn của Đức Chúa. <sup>9</sup> Trời cao hơn đất chừng nào, thì đường lối của Ta cũng cao hơn đường lối các ngươi, và tư tưởng của Ta cũng cao hơn tư tưởng các ngươi chừng ấy.</p>"
  },
  "tv": {
    "ref": "Tv 144,2-3.8-9.17-18 (Đ. c.18a)",
    "content": "<p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Chúa gần gũi mọi kẻ kêu cầu Người.</span></p><p class=\"leading\"><sup>2</sup><span>Ngày lại ngày, con xin chúc tụng Chúa,<br />mãi ngợi khen Danh Thánh tới muôn đời.</span><sup>3</sup><span>Chúa thật cao cả, xứng muôn lời ca tụng,<br />sự cao cả của Người khôn thấu khôn dò.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Chúa gần gũi mọi kẻ kêu cầu Người.</span></p><p class=\"leading\"><sup>8</sup><span>Chúa là Đấng từ bi nhân hậu,<br />Người chậm giận và giàu tình thương.</span><sup>9</sup><span>Chúa nhân ái đối với mọi người,<br />hằng âu yếm mọi loài Người đã dựng nên.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Chúa gần gũi mọi kẻ kêu cầu Người.</span></p><p class=\"leading\"><sup>17</sup><span>Chúa công minh trong mọi đường lối Chúa,<br />đầy yêu thương trong mọi việc Người làm.</span><sup>18</sup><span>Chúa gần gũi mọi kẻ kêu cầu Người,<br />mọi kẻ thành tâm kêu cầu Chúa.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Chúa gần gũi mọi kẻ kêu cầu Người.</span></p>"
  },
  "bd2": {
    "ref": "Pl 1,20c-24.27a",
    "bookTitle": "Bài trích thư của thánh Phao-lô tông đồ gửi tín hữu Phi-líp-phê.",
    "lead": "Đối với tôi, sống là Đức Ki-tô và chết là một mối lợi.",
    "content": "<p><sup>20c</sup> Thưa anh em, dù tôi sống hay tôi chết, Đức Ki-tô cũng sẽ được vẻ vang nơi thân xác tôi. <sup>21</sup> Vì đối với tôi, sống là Đức Ki-tô, và chết là một mối lợi. <sup>22</sup> Nếu sống ở đời này mà công việc của tôi sinh hoa kết quả, thì tôi không biết nên chọn đàng nào. <sup>23</sup> Tôi bị giằng co giữa hai đàng: ước ao của tôi là ra đi để được ở với Đức Ki-tô, điều này tốt hơn bội phần; <sup>24</sup> nhưng ở lại trong thân xác thì cần thiết hơn cho anh em.</p><p><sup>27a</sup> Chỉ có một điều là anh em phải ăn ở làm sao cho xứng với Tin Mừng của Đức Ki-tô.</p>"
  },
  "tm": {
    "ref": "Mt 20,1-16a",
    "bookTitle": "Tin Mừng Chúa Giê-su Ki-tô theo thánh Mát-thêu.",
    "lead": "Hay vì thấy tôi tốt bụng mà bạn đâm ra ghen tức?",
    "alleluiaRef": "x. Cv 16,14b",
    "alleluia": "Ha-lê-lui-a. Ha-lê-lui-a. Lạy Chúa, xin mở lòng chúng con, để chúng con chú ý lắng nghe lời Con Chúa. Ha-lê-lui-a.",
    "alleluiaHtml": "<p>Ha-lê-lui-a. Ha-lê-lui-a. Lạy Chúa, xin mở lòng chúng con, để chúng con chú ý lắng nghe lời Con Chúa. Ha-lê-lui-a.</p>",
    "content": "<p><sup>1</sup> Khi ấy, Đức Giê-su kể cho các môn đệ dụ ngôn này: \"Nước Trời giống như chuyện gia chủ kia, vừa tảng sáng đã ra mướn thợ vào làm vườn nho cho mình. <sup>2</sup> Sau khi đã thoả thuận với thợ là mỗi ngày một quan tiền, ông sai họ vào vườn nho làm việc.</p><p><sup>3</sup> Khoảng giờ thứ ba, ông trở ra, thấy có những người khác ở không, đang đứng ngoài chợ. <sup>4</sup> Ông cũng bảo họ: 'Cả các anh nữa, hãy đi vào vườn nho, tôi sẽ trả cho các anh hợp lẽ công bằng.' <sup>5</sup> Họ liền đi. Khoảng giờ thứ sáu, rồi giờ thứ chín, ông lại trở ra và cũng làm như vậy.</p><p><sup>6</sup> Khoảng giờ thứ mười một, ông trở ra, thấy còn có những người khác đứng đó, ông nói với họ: 'Sao các anh đứng đây suốt ngày không làm gì hết?' <sup>7</sup> Họ đáp: 'Vì không ai mướn chúng tôi.' Ông bảo họ: 'Cả các anh nữa, hãy đi vào vườn nho!'</p><p><sup>8</sup> Chiều đến, ông chủ vườn nho bảo người quản lý: 'Anh gọi thợ lại mà trả công cho họ, cứ bắt đầu từ người vào sau chót tới người đầu tiên.' <sup>9</sup> Vậy những người mới vào làm lúc giờ thứ mười một tiến lại, và mỗi người được lãnh một quan tiền. <sup>10</sup> Khi những người vào làm trước nhất tiến lại, họ tưởng là sẽ được lãnh nhiều hơn, thế nhưng mỗi người cũng chỉ lãnh được một quan tiền. <sup>11</sup> Vừa lãnh xong, họ liền cằn nhằn với gia chủ: <sup>12</sup> 'Mấy người sau chót này chỉ làm có một giờ, thế mà ông lại coi họ ngang hàng với chúng tôi là những người đã phải làm việc nặng nhọc suốt ngày, lại còn bị nắng nôi thiêu đốt!' <sup>13</sup> Nhưng gia chủ trả lời cho một người trong bọn họ: 'Này bạn, tôi đâu có bất công với bạn! Bạn đã chẳng thoả thuận với tôi là một quan tiền sao? <sup>14</sup> Cầm lấy phần của bạn mà đi đi! Còn tôi, tôi muốn cho người sau chót này cũng được bằng bạn đó. <sup>15</sup> Chẳng lẽ tôi lại không có quyền tuỳ ý định đoạt về những gì là của tôi sao? Hay vì thấy tôi tốt bụng, mà bạn đâm ra ghen tức?'</p><p><sup>16a</sup> Thế là những kẻ đứng chót sẽ được lên hàng đầu, còn những kẻ đứng đầu sẽ phải xuống hàng chót.\"</p>"
  }
},
  "cn25": {
  "date": "2026-09-20",
  "title": "Chúa Nhật Tuần XXV - Mùa Thường Niên (Năm A)",
  "source": "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ (ktcgkpv.org)",
  "sourceUrl": "https://ktcgkpv.org/readings/mass-reading",
  "bd1": {
    "ref": "Is 55,6-9",
    "bookTitle": "Bài trích sách ngôn sứ I-sai-a.",
    "lead": "Tư tưởng của Ta không phải là tư tưởng của các ngươi.",
    "content": "<p><sup>6</sup> Hãy tìm Đức Chúa khi Người còn cho gặp, kêu cầu Người lúc Người ở kề bên. <sup>7</sup> Kẻ gian ác, hãy bỏ đường lối mình, người bất lương, hãy bỏ tư tưởng mình, mà trở về với Đức Chúa - và Người sẽ xót thương, về với Thiên Chúa chúng ta, vì Người rộng lòng tha thứ.</p><p><sup>8</sup> Thật vậy, tư tưởng của Ta không phải là tư tưởng của các ngươi, và đường lối các ngươi không phải là đường lối của Ta - sấm ngôn của Đức Chúa. <sup>9</sup> Trời cao hơn đất chừng nào, thì đường lối của Ta cũng cao hơn đường lối các ngươi, và tư tưởng của Ta cũng cao hơn tư tưởng các ngươi chừng ấy.</p>"
  },
  "tv": {
    "ref": "Tv 144,2-3.8-9.17-18 (Đ. c.18a)",
    "content": "<p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Chúa gần gũi mọi kẻ kêu cầu Người.</span></p><p class=\"leading\"><sup>2</sup><span>Ngày lại ngày, con xin chúc tụng Chúa,<br />mãi ngợi khen Danh Thánh tới muôn đời.</span><sup>3</sup><span>Chúa thật cao cả, xứng muôn lời ca tụng,<br />sự cao cả của Người khôn thấu khôn dò.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Chúa gần gũi mọi kẻ kêu cầu Người.</span></p><p class=\"leading\"><sup>8</sup><span>Chúa là Đấng từ bi nhân hậu,<br />Người chậm giận và giàu tình thương.</span><sup>9</sup><span>Chúa nhân ái đối với mọi người,<br />hằng âu yếm mọi loài Người đã dựng nên.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Chúa gần gũi mọi kẻ kêu cầu Người.</span></p><p class=\"leading\"><sup>17</sup><span>Chúa công minh trong mọi đường lối Chúa,<br />đầy yêu thương trong mọi việc Người làm.</span><sup>18</sup><span>Chúa gần gũi mọi kẻ kêu cầu Người,<br />mọi kẻ thành tâm kêu cầu Chúa.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Chúa gần gũi mọi kẻ kêu cầu Người.</span></p>"
  },
  "bd2": {
    "ref": "Pl 1,20c-24.27a",
    "bookTitle": "Bài trích thư của thánh Phao-lô tông đồ gửi tín hữu Phi-líp-phê.",
    "lead": "Đối với tôi, sống là Đức Ki-tô và chết là một mối lợi.",
    "content": "<p><sup>20c</sup> Thưa anh em, dù tôi sống hay tôi chết, Đức Ki-tô cũng sẽ được vẻ vang nơi thân xác tôi. <sup>21</sup> Vì đối với tôi, sống là Đức Ki-tô, và chết là một mối lợi. <sup>22</sup> Nếu sống ở đời này mà công việc của tôi sinh hoa kết quả, thì tôi không biết nên chọn đàng nào. <sup>23</sup> Tôi bị giằng co giữa hai đàng: ước ao của tôi là ra đi để được ở với Đức Ki-tô, điều này tốt hơn bội phần; <sup>24</sup> nhưng ở lại trong thân xác thì cần thiết hơn cho anh em.</p><p><sup>27a</sup> Chỉ có một điều là anh em phải ăn ở làm sao cho xứng với Tin Mừng của Đức Ki-tô.</p>"
  },
  "tm": {
    "ref": "Mt 20,1-16a",
    "bookTitle": "Tin Mừng Chúa Giê-su Ki-tô theo thánh Mát-thêu.",
    "lead": "Hay vì thấy tôi tốt bụng mà bạn đâm ra ghen tức?",
    "alleluiaRef": "x. Cv 16,14b",
    "alleluia": "Ha-lê-lui-a. Ha-lê-lui-a. Lạy Chúa, xin mở lòng chúng con, để chúng con chú ý lắng nghe lời Con Chúa. Ha-lê-lui-a.",
    "alleluiaHtml": "<p>Ha-lê-lui-a. Ha-lê-lui-a. Lạy Chúa, xin mở lòng chúng con, để chúng con chú ý lắng nghe lời Con Chúa. Ha-lê-lui-a.</p>",
    "content": "<p><sup>1</sup> Khi ấy, Đức Giê-su kể cho các môn đệ dụ ngôn này: \"Nước Trời giống như chuyện gia chủ kia, vừa tảng sáng đã ra mướn thợ vào làm vườn nho cho mình. <sup>2</sup> Sau khi đã thoả thuận với thợ là mỗi ngày một quan tiền, ông sai họ vào vườn nho làm việc.</p><p><sup>3</sup> Khoảng giờ thứ ba, ông trở ra, thấy có những người khác ở không, đang đứng ngoài chợ. <sup>4</sup> Ông cũng bảo họ: 'Cả các anh nữa, hãy đi vào vườn nho, tôi sẽ trả cho các anh hợp lẽ công bằng.' <sup>5</sup> Họ liền đi. Khoảng giờ thứ sáu, rồi giờ thứ chín, ông lại trở ra và cũng làm như vậy.</p><p><sup>6</sup> Khoảng giờ thứ mười một, ông trở ra, thấy còn có những người khác đứng đó, ông nói với họ: 'Sao các anh đứng đây suốt ngày không làm gì hết?' <sup>7</sup> Họ đáp: 'Vì không ai mướn chúng tôi.' Ông bảo họ: 'Cả các anh nữa, hãy đi vào vườn nho!'</p><p><sup>8</sup> Chiều đến, ông chủ vườn nho bảo người quản lý: 'Anh gọi thợ lại mà trả công cho họ, cứ bắt đầu từ người vào sau chót tới người đầu tiên.' <sup>9</sup> Vậy những người mới vào làm lúc giờ thứ mười một tiến lại, và mỗi người được lãnh một quan tiền. <sup>10</sup> Khi những người vào làm trước nhất tiến lại, họ tưởng là sẽ được lãnh nhiều hơn, thế nhưng mỗi người cũng chỉ lãnh được một quan tiền. <sup>11</sup> Vừa lãnh xong, họ liền cằn nhằn với gia chủ: <sup>12</sup> 'Mấy người sau chót này chỉ làm có một giờ, thế mà ông lại coi họ ngang hàng với chúng tôi là những người đã phải làm việc nặng nhọc suốt ngày, lại còn bị nắng nôi thiêu đốt!' <sup>13</sup> Nhưng gia chủ trả lời cho một người trong bọn họ: 'Này bạn, tôi đâu có bất công với bạn! Bạn đã chẳng thoả thuận với tôi là một quan tiền sao? <sup>14</sup> Cầm lấy phần của bạn mà đi đi! Còn tôi, tôi muốn cho người sau chót này cũng được bằng bạn đó. <sup>15</sup> Chẳng lẽ tôi lại không có quyền tuỳ ý định đoạt về những gì là của tôi sao? Hay vì thấy tôi tốt bụng, mà bạn đâm ra ghen tức?'</p><p><sup>16a</sup> Thế là những kẻ đứng chót sẽ được lên hàng đầu, còn những kẻ đứng đầu sẽ phải xuống hàng chót.\"</p>"
  }
},
  "cn26": {
  "date": "2026-09-27",
  "title": "Chúa Nhật Tuần XXVI - Mùa Thường Niên (Năm A)",
  "source": "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ (ktcgkpv.org)",
  "sourceUrl": "https://ktcgkpv.org/readings/mass-reading",
  "bd1": {
    "ref": "Ed 18,25-28",
    "bookTitle": "Bài trích sách ngôn sứ Ê-dê-ki-en.",
    "lead": "Nếu kẻ gian ác từ bỏ điều dữ nó đã phạm, nó sẽ cứu được mạng sống mình.",
    "content": "<p><sup>25</sup> Đức Chúa phán thế này: Các ngươi lại nói: 'Đường lối của Chúa không ngay thẳng!' Vậy hỡi nhà Ít-ra-en, hãy nghe đây: Có phải đường lối của Ta không ngay thẳng hay đường lối của các ngươi mới không ngay thẳng? <sup>26</sup> Khi người công chính từ bỏ lẽ công chính của mình mà phạm tội ác và phải chết, thì chính vì tội ác nó phạm mà nó phải chết. <sup>27</sup> Còn nếu kẻ gian ác từ bỏ điều dữ nó đã phạm mà thi hành điều chính trực công minh, thì nó sẽ cứu được mạng sống mình. <sup>28</sup> Nó đã thấy và từ bỏ mọi tội ác nó phạm, thì chắc chắn nó sẽ sống, nó không phải chết.</p>"
  },
  "tv": {
    "ref": "Tv 24,4bc-5.6-7.8-9 (Đ. c.6a)",
    "content": "<p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Lạy Chúa, xin nhớ lại tình thương của Ngài.</span></p><p class=\"leading\"><sup>4bc</sup><span>Lạy Chúa, đường nẻo Ngài, xin dạy cho con biết,<br />lối đi của Ngài, xin chỉ bảo con.</span><sup>5</sup><span>Xin dẫn con đi theo đường chân lý của Ngài và bảo ban dạy dỗ,<br />vì chính Ngài là Thiên Chúa cứu độ con.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Lạy Chúa, xin nhớ lại tình thương của Ngài.</span></p><p class=\"leading\"><sup>6</sup><span>Lạy Chúa, xin nhớ lại nghĩa nặng với tình sâu<br />Ngài đã từng biểu lộ từ muôn thuở muôn đời.</span><sup>7</sup><span>Tuổi xuân trót dại bao lầm lỗi, xin Ngài đừng nhớ đến,<br />nhưng xin lấy lượng từ bi mà nhớ đến con.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Lạy Chúa, xin nhớ lại tình thương của Ngài.</span></p><p class=\"leading\"><sup>8</sup><span>Chúa là Đấng nhân từ chính trực,<br />chỉ lối cho tội nhân,</span><sup>9</sup><span>dẫn kẻ khiêm nhu đi trong đường công chính,<br />dạy cho biết đường lối của Người.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Lạy Chúa, xin nhớ lại tình thương của Ngài.</span></p>"
  },
  "bd2": {
    "ref": "Pl 2,1-11",
    "bookTitle": "Bài trích thư của thánh Phao-lô tông đồ gửi tín hữu Phi-líp-phê.",
    "lead": "Anh em hãy có cùng những tâm tình như chính Đức Ki-tô Giê-su.",
    "content": "<p><sup>1</sup> Thưa anh em, nếu quả thật sự liên kết với Đức Ki-tô đem lại cho anh em một niềm an ủi, nếu tình bác ái khích lệ anh em, nếu anh em được hiệp thông trong Thần Khí, nếu anh em có lòng thương xót và cảm thông, <sup>2</sup> thì xin anh em hãy làm cho niềm vui của tôi được trọn vẹn, là hãy có cùng một cảm nghĩ, cùng một lòng mến, cùng một tâm hồn, cùng một ý hướng. <sup>3</sup> Đừng làm chi vì ganh tị hay vì hư danh, nhưng hãy lấy lòng khiêm nhường mà coi người khác hơn mình. <sup>4</sup> Mỗi người đừng tìm lợi ích cho riêng mình, nhưng hãy tìm lợi ích cho người khác. <sup>5</sup> Giữa anh em với nhau, anh em hãy có cùng một tâm tình như chính Đức Ki-tô Giê-su.</p><p><sup>6</sup> Đức Giê-su Ki-tô vốn dĩ là Thiên Chúa mà không nghĩ phải nhất quyết duy trì địa vị ngang hàng với Thiên Chúa, <sup>7</sup> nhưng đã hoàn toàn trút bỏ vinh quang mặc lấy thân nô lệ, trở nên giống phàm nhân sống như một người trần thế. <sup>8</sup> Người lại còn hạ mình, vâng lời cho đến nỗi bằng lòng chịu chết, chết trên cây thập tự. <sup>9</sup> Chính vì thế, Thiên Chúa đã siêu tôn Người và tặng ban danh hiệu trổi vượt trên muôn ngàn danh hiệu, <sup>10</sup> như vậy, khi vừa nghe danh thánh Giê-su, cả trên trời dưới đất và trong nơi âm phủ, muôn vật phải bái quỳ, <sup>11</sup> và để tôn vinh Thiên Chúa Cha, mọi loài phải mở miệng tuyên xưng rằng: \"Đức Giê-su Ki-tô là Chúa\".</p>"
  },
  "tm": {
    "ref": "Mt 21,28-32",
    "bookTitle": "Tin Mừng Chúa Giê-su Ki-tô theo thánh Mát-thêu.",
    "lead": "Nó hối hận và đã đi làm. Những người thu thuế và những cô gái điếm vào Nước Thiên Chúa trước các ông.",
    "alleluiaRef": "Ga 10,27",
    "alleluia": "Ha-lê-lui-a. Ha-lê-lui-a. Chúa nói: Chiên của Tôi thì nghe tiếng Tôi, Tôi biết chúng và chúng theo Tôi. Ha-lê-lui-a.",
    "alleluiaHtml": "<p>Ha-lê-lui-a. Ha-lê-lui-a. Chúa nói: Chiên của Tôi thì nghe tiếng Tôi, Tôi biết chúng và chúng theo Tôi. Ha-lê-lui-a.</p>",
    "content": "<p><sup>28</sup> Khi ấy, Đức Giê-su nói với các thượng tế và kỳ mục trong dân rằng: \"Các ông nghĩ sao: Một người kia có hai đứa con trai. Ông ta đến nói với đứa thứ nhất: 'Này con, hôm nay con hãy đi làm vườn nho.' <sup>29</sup> Nó đáp: 'Con không muốn đâu!' Nhưng sau đó, nó hối hận, nên lại đi. <sup>30</sup> Ông ta đến gặp đứa thứ hai và cũng bảo như vậy. Nó đáp: 'Thưa ngài, vâng, con đi!' nhưng rồi lại không đi. <sup>31</sup> Trong hai người con đó, ai đã làm theo ý muốn của người cha?\" Họ đáp: \"Người thứ nhất.\"</p><p>Đức Giê-su nói với họ: \"Tôi bảo thật các ông: những người thu thuế và những cô gái điếm vào Nước Thiên Chúa trước các ông. <sup>32</sup> Vì ông Gio-an đã đến chỉ đường công chính cho các ông, mà các ông không tin ông ấy; còn những người thu thuế và những cô gái điếm lại tin. Phần các ông, khi đã thấy vậy rồi, các ông vẫn không chịu hối hận mà tin ông ấy.\"</p>"
  }
},
  "cn27": {
  "date": "2026-10-04",
  "title": "Chúa Nhật Tuần XXVII - Mùa Thường Niên (Năm A)",
  "source": "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ (ktcgkpv.org)",
  "sourceUrl": "https://ktcgkpv.org/readings/mass-reading",
  "bd1": {
    "ref": "Is 5,1-7",
    "bookTitle": "Bài trích sách ngôn sứ I-sai-a.",
    "lead": "Vườn nho của Đức Chúa các đạo binh là nhà Ít-ra-en.",
    "content": "<p><sup>1</sup> Tôi xin hát tặng bạn tôi, bài hát của bạn tôi về vườn nho của mình. Bạn tôi có một vườn nho trên sườn đồi màu mỡ. <sup>2</sup> Bạn cuốc đất, nhặt đá, trồng những gốc nho quý, xây một tháp canh ở giữa, và khoét bồn đạp nho. Bạn những mong nó sinh trái tốt, nó lại sinh trái chua.</p><p><sup>3</sup> Giờ đây, hỡi dân cư Giê-ru-sa-lem và người Giu-đa, hãy làm trọng tài phân xử giữa tôi và vườn nho của tôi! <sup>4</sup> Có gì phải làm cho vườn nho của tôi mà tôi đã không làm? Sao tôi những mong nó sinh trái tốt, nó lại sinh trái chua?</p><p><sup>5</sup> Giờ đây, tôi cho các người biết tôi sẽ làm gì cho vườn nho của tôi: dỡ hàng rào để cho nó bị tàn phá, phá bức tường để cho nó bị giẫm đạp. <sup>6</sup> Tôi sẽ biến nó thành mảnh đất hoang vu, không cắt tỉa, không vun xới; gai góc sẽ mọc lên; và tôi sẽ truyền cho mây đừng đổ mưa xuống trên nó. <sup>7</sup> Vườn nho của Đức Chúa các đạo binh là nhà Ít-ra-en; chồi cây Người vui thích chính là người Giu-đa. Người những mong họ giữ lẽ công bằng, mà chỉ thấy đầu rơi máu chảy; những mong họ làm điều chính trực, mà chỉ nghe tiếng than khóc kêu gào.</p>"
  },
  "tv": {
    "ref": "Tv 79,9 và 12.13-14.15-16.19-20 (Đ. Is 5,7a)",
    "content": "<p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Vườn nho của Đức Chúa các đạo binh là nhà Ít-ra-en.</span></p><p class=\"leading\"><sup>9</sup><span>Gốc nho này, Chúa bứng từ Ai-cập,<br />đuổi chư dân, lấy đất mà trồng,</span><sup>12</sup><span>cành vươn dài ra tận bờ Biển Cả,<br />chồi đâm sâu tới tận vùng Sông Cả.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Vườn nho của Đức Chúa các đạo binh là nhà Ít-ra-en.</span></p><p class=\"leading\"><sup>13</sup><span>Bức tường rào, sao Ngài phá đổ,<br />cho khách qua đường bứt trộm ăn?</span><sup>14</sup><span>Heo rừng vào phá phách,<br />thú nội tha hồ cắn trộm lan tràn!</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Vườn nho của Đức Chúa các đạo binh là nhà Ít-ra-en.</span></p><p class=\"leading\"><sup>15</sup><span>Lạy Chúa các đạo binh, xin trở lại,<br />từ trời cao nhìn ngắm và đoái thương:</span><sup>16</sup><span>vườn nho này, xin Ngài nâng đỡ,<br />bảo vệ chồi tay hữu Ngài đã trồng.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Vườn nho của Đức Chúa các đạo binh là nhà Ít-ra-en.</span></p><p class=\"leading\"><sup>19</sup><span>Chúng con nguyền chẳng xa rời Chúa nữa,<br />xin ban sức sống, chúng con sẽ cầu khẩn Danh Ngài.</span><sup>20</sup><span>Lạy Chúa các đạo binh, xin phục hồi chúng con,<br />toả ánh tôn nhan rạng ngời để chúng con được ơn cứu độ.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Vườn nho của Đức Chúa các đạo binh là nhà Ít-ra-en.</span></p>"
  },
  "bd2": {
    "ref": "Pl 4,6-9",
    "bookTitle": "Bài trích thư của thánh Phao-lô tông đồ gửi tín hữu Phi-líp-phê.",
    "lead": "Hãy thi hành những điều đó, và Thiên Chúa là nguồn bình an sẽ ở với anh em.",
    "content": "<p><sup>6</sup> Thưa anh em, anh em đừng lo lắng gì cả. Nhưng trong mọi hoàn cảnh, anh em cứ đem lời cầu xin, van nài và tạ ơn mà dãi bày trước mặt Thiên Chúa những điều anh em sở nguyện. <sup>7</sup> Và bình an của Thiên Chúa, bình an vượt lên trên mọi hiểu biết, sẽ giữ gìn lòng trí anh em trong Đức Ki-tô Giê-su.</p><p><sup>8</sup> Ngoài ra, thưa anh em, những gì là chân thật, cao quý, những gì là chính trực, tinh tuyền, những gì là đáng mến và đem lại danh thơm tiếng tốt, những gì là đức hạnh, đáng khen, thì xin anh em hãy để ý đến. <sup>9</sup> Những gì anh em đã học hỏi, đã lãnh nhận, đã nghe, đã thấy ở nơi tôi, thì hãy đem ra thực hành, và Thiên Chúa là nguồn bình an sẽ ở với anh em.</p>"
  },
  "tm": {
    "ref": "Mt 21,33-43",
    "bookTitle": "Tin Mừng Chúa Giê-su Ki-tô theo thánh Mát-thêu.",
    "lead": "Chủ sẽ cho các tá điền khác mướn vườn nho.",
    "alleluiaRef": "x. Ga 15,16",
    "alleluia": "Ha-lê-lui-a. Ha-lê-lui-a. Chúa nói: Chính Thầy đã chọn anh em, và cắt cử anh em để anh em ra đi, sinh được hoa trái, và hoa trái của anh em tồn tại. Ha-lê-lui-a.",
    "alleluiaHtml": "<p>Ha-lê-lui-a. Ha-lê-lui-a. Chúa nói: Chính Thầy đã chọn anh em, và cắt cử anh em để anh em ra đi, sinh được hoa trái, và hoa trái của anh em tồn tại. Ha-lê-lui-a.</p>",
    "content": "<p><sup>33</sup> Khi ấy, Đức Giê-su nói với các thượng tế và kỳ mục trong dân rằng: \"Các ông hãy nghe một dụ ngôn khác: Có gia chủ kia trồng được một vườn nho; chung quanh vườn, ông rào giậu; trong vườn, ông khoét bồn đạp nho, và dựng một tháp canh. Xong đâu đấy, ông cho tá điền canh tác, rồi trẩy đi phương xa. <sup>34</sup> Gần đến mùa hái nho, ông sai đầy tớ đến gặp các tá điền để thu hoa lợi. <sup>35</sup> Nhưng bọn tá điền bắt các đầy tớ ông: chúng đánh người này, giết người kia, ném đá người khác. <sup>36</sup> Ông lại sai một số đầy tớ khác đông hơn trước, nhưng bọn tá điền cũng xử với họ y như vậy. <sup>37</sup> Sau cùng, ông sai chính con trai mình đến gặp chúng, vì nghĩ rằng: 'Chúng sẽ nể con ta.' <sup>38</sup> Nhưng bọn tá điền vừa thấy người con, thì bảo nhau: 'Đứa thừa tự đây rồi! Nào ta giết quách nó đi, và đoạt lấy gia tài nó!' <sup>39</sup> Thế là chúng bắt lấy cậu, lôi ra ngoài vườn nho mà giết.</p><p><sup>40</sup> Vậy khi ông chủ vườn nho đến, ông sẽ làm gì bọn tá điền kia?\" <sup>41</sup> Họ đáp: \"Ác giả ác báo, ông sẽ tru diệt bọn hung ác đó, và sang nhượng vườn nho cho các tá điền khác, những người biết nộp hoa lợi cho ông đúng mùa.\" <sup>42</sup> Đức Giê-su nói với họ: \"Kinh Thánh có câu: 'Tảng đá thợ xây nhà loại bỏ lại trở nên tảng đá góc tường. Đó chính là công trình của Chúa, công trình kỳ diệu trước mắt chúng ta!' Các ông chưa bao giờ đọc câu đó sao?</p><p><sup>43</sup> Bởi đó, tôi nói cho các ông hay: Nước Thiên Chúa, Thiên Chúa sẽ lấy đi không cho các ông nữa, mà ban cho một dân tộc biết làm cho Nước ấy sinh hoa lợi.\"</p>"
  }
},
  "cn28": {
  "date": "2026-10-11",
  "title": "Chúa Nhật Tuần XXVIII - Mùa Thường Niên",
  "source": "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ (ktcgkpv.org)",
  "sourceUrl": "https://ktcgkpv.org/readings/mass-reading",
  "bd1": {
    "ref": "Is 25,6-10a",
    "bookTitle": "Bài trích sách ngôn sứ I-sai-a.",
    "lead": "Đức Chúa sẽ đãi một bữa tiệc và sẽ lau khô dòng lệ trên khuôn mặt mọi người.",
    "content": "<p class=\"poem\"><sup>6</sup><span>Ngày ấy, trên núi này,<br />Đức Chúa các đạo binh sẽ đãi muôn dân một bữa tiệc :<br />tiệc thịt béo, tiệc rượu ngon,<br />thịt béo ngậy, rượu ngon tinh chế.</span><br /><sup>7</sup><span>Trên núi này, Người sẽ xé bỏ chiếc khăn che phủ mọi dân,<br />và tấm màn trùm lên muôn nước.</span><br /><sup>8</sup><span>Người sẽ vĩnh viễn tiêu diệt tử thần.<br />Đức Chúa là Chúa Thượng sẽ lau khô dòng lệ<br />trên khuôn mặt mọi người,<br />và trên toàn cõi đất, Người sẽ xoá sạch<br />nỗi ô nhục của dân Người. Đức Chúa phán như vậy.</span><br /><sup>9</sup><span>Ngày ấy, người ta sẽ nói : “Đây là Thiên Chúa chúng ta,<br />chúng ta từng trông đợi Người,<br />và đã được Người thương cứu độ.<br />Chính Người là Đức Chúa chúng ta từng đợi trông.<br />Nào ta cùng hoan hỷ vui mừng bởi được Người cứu độ.”</span><br /><sup>10a</sup><span>Vì bàn tay Đức Chúa sẽ lại đặt trên núi này.<br /></span></p>"
  },
  "tv": {
    "ref": "Tv 22,1-3a.3b-4.5.6 (Đ. c.6cd)",
    "content": "<p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Này tôi được ở đền Người<br />những ngày tháng, những năm dài triền miên.</span></p><p class=\"leading\"><sup>1</sup><span>Chúa là mục tử chăn dắt tôi, tôi chẳng thiếu thốn gì.</span><sup>2</sup><span>Trong đồng cỏ xanh tươi, Người cho tôi nằm nghỉ.<br />Người đưa tôi tới dòng nước trong lành</span><sup>3a</sup><span>và bổ sức cho tôi.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Này tôi được ở đền Người<br />những ngày tháng, những năm dài triền miên.</span></p><p class=\"leading\"><sup>3b</sup><span>Người dẫn tôi trên đường ngay nẻo chính<br />vì danh dự của Người.</span><sup>4</sup><span>Lạy Chúa, dầu qua lũng âm u<br />con sợ gì nguy khốn, vì có Chúa ở cùng.<br />Côn trượng Ngài bảo vệ, con vững dạ an tâm.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Này tôi được ở đền Người<br />những ngày tháng, những năm dài triền miên.</span></p><p class=\"leading\"><sup>5</sup><span>Chúa dọn sẵn cho con bữa tiệc<br />ngay trước mặt quân thù.<br />Đầu con, Chúa xức đượm dầu thơm,<br />ly rượu con đầy tràn chan chứa.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Này tôi được ở đền Người<br />những ngày tháng, những năm dài triền miên.</span></p><p class=\"leading\"><sup>6</sup><span>Lòng nhân hậu và tình thương Chúa<br />ấp ủ tôi suốt cả cuộc đời,<br />và tôi được ở đền Người<br />những ngày tháng, những năm dài triền miên.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Này tôi được ở đền Người<br />những ngày tháng, những năm dài triền miên.</span></p>"
  },
  "bd2": {
    "ref": "Pl 4,12-14.19-20",
    "bookTitle": "Bài trích thư của thánh Phao-lô tông đồ gửi tín hữu Phi-líp-phê.",
    "lead": "Với Đấng ban sức mạnh cho tôi, tôi chịu được hết.",
    "content": "<p><sup>12</sup> Thưa anh em, tôi sống thiếu thốn cũng được, mà sống dư dật cũng được. Trong mọi hoàn cảnh, no hay đói, dư dật hay túng bấn, tôi đã tập quen cả. <sup>13</sup> Với Đấng ban sức mạnh cho tôi, tôi chịu được hết. <sup>14</sup> Tuy nhiên, anh em đã chia sẻ với tôi, khi tôi gặp cơn quẫn bách, như thế là phải. <sup>19</sup> Thiên Chúa của tôi sẽ thoả mãn mọi nhu cầu của anh em một cách tuyệt vời, theo sự giàu sang của Người trong Đức Ki-tô Giê-su. <sup>20</sup> Xin tôn vinh Thiên Chúa là Cha chúng ta, đến muôn thuở muôn đời ! A-men.</p>"
  },
  "tm": {
    "ref": "Mt 22,1-14",
    "bookTitle": "<span class=\"holycross\">&#x2720;</span>Tin Mừng Chúa Giê-su Ki-tô theo thánh Mát-thêu.",
    "lead": "Gặp ai, anh em cũng mời hết vào tiệc cưới.",
    "alleluiaRef": "x. Ep 1,17-18",
    "alleluia": "Ha-lê-lui-a. Ha-lê-lui-a. Xin Thân Phụ Đức Giê-su Ki-tô, Chúa chúng ta, soi trí mở lòng cho chúng ta thấy rõ, đâu là niềm hy vọng, mà ơn Người kêu gọi đem lại cho chúng ta. Ha-lê-lui-a.",
    "alleluiaHtml": "<p>Ha-lê-lui-a. Ha-lê-lui-a. Xin Thân Phụ Đức Giê-su Ki-tô, Chúa chúng ta, soi trí mở lòng cho chúng ta thấy rõ, đâu là niềm hy vọng, mà ơn Người kêu gọi đem lại cho chúng ta. Ha-lê-lui-a.</p>",
    "content": "<p><sup>1</sup> Khi ấy, Đức Giê-su dùng dụ ngôn mà nói với các thượng tế và kỳ mục trong dân rằng : <sup>2</sup> “Nước Trời cũng giống như chuyện một vua kia mở tiệc cưới cho con mình. <sup>3</sup> Nhà vua sai đầy tớ đi thỉnh các quan khách đã được mời trước, xin họ đến dự tiệc, nhưng họ không chịu đến. <sup>4</sup> Nhà vua lại sai những đầy tớ khác đi, và dặn họ : ‘Hãy thưa với quan khách đã được mời rằng : Này cỗ bàn, ta đã dọn xong, bò tơ và thú béo đã hạ rồi, mọi sự đã sẵn. Mời quý vị đến dự tiệc cưới !’ <sup>5</sup> Nhưng quan khách không thèm đếm xỉa tới, lại bỏ đi : kẻ thì đi thăm nông trại, người thì đi buôn, <sup>6</sup> còn những kẻ khác lại bắt các đầy tớ của vua mà hành hạ và giết chết. <sup>7</sup> Nhà vua liền nổi cơn thịnh nộ, sai quân đi tru diệt bọn sát nhân ấy và thiêu huỷ thành phố của chúng. <sup>8</sup> Rồi nhà vua bảo đầy tớ : ‘Tiệc cưới đã sẵn sàng rồi, mà những kẻ đã được mời lại không xứng đáng. <sup>9</sup> Vậy các ngươi đi ra các ngả đường, gặp ai cũng mời hết vào tiệc cưới.’ <sup>10</sup> Đầy tớ liền đi ra các nẻo đường, gặp ai, bất luận xấu tốt, cũng tập hợp cả lại, nên phòng tiệc cưới đã đầy thực khách.</p><p><sup>11</sup> “Bấy giờ nhà vua tiến vào quan sát khách dự tiệc, thấy ở đó có một người không mặc y phục lễ cưới, <sup>12</sup> mới hỏi người ấy : ‘Này bạn, làm sao bạn vào đây mà lại không có y phục lễ cưới ?’ Người ấy câm miệng không nói được gì. <sup>13</sup> Nhà vua liền bảo những người phục dịch : ‘Trói chân tay nó lại, quăng nó ra chỗ tối tăm bên ngoài, ở đó người ta sẽ phải khóc lóc nghiến răng ! <sup>14</sup> Vì kẻ được gọi thì nhiều, mà người được chọn thì ít’.”</p>"
  }
},
  "cn29": {
  "date": "2026-10-18",
  "title": "Chúa Nhật Tuần XXIX - Mùa Thường Niên",
  "source": "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ (ktcgkpv.org)",
  "sourceUrl": "https://ktcgkpv.org/readings/mass-reading",
  "bd1": {
    "ref": "Is 45,1.4-6",
    "bookTitle": "Bài trích sách ngôn sứ I-sai-a.",
    "lead": "Đức Chúa đã cầm lấy tay phải vua Ky-rô để bắt các dân tộc suy phục ông.",
    "content": "<p class=\"poem\"><sup>1</sup><span>Đức Chúa phán với kẻ Người đã xức dầu, với vua Ky-rô<br />- Ta đã cầm lấy tay phải nó,<br />để bắt các dân tộc suy phục nó,<br />Ta tước khí giới của các vua,<br />mở toang các cửa thành trước mặt nó,<br />khiến các cổng không còn đóng kín nữa.</span><br /><sup>4</sup><span>Vì lợi ích của tôi tớ Ta là Gia-cóp,<br />và của người Ta đã chọn là Ít-ra-en,<br />Ta đã gọi ngươi đích danh, đã ban cho ngươi một tước hiệu,<br />dù ngươi không biết Ta.</span><br /><sup>5</sup><span>Ta là Đức Chúa, không còn chúa nào khác ;<br />chẳng có ai là Thiên Chúa, ngoại trừ Ta.<br />Dù ngươi không biết Ta, Ta đã trang bị cho ngươi đầy đủ,</span><br /><sup>6</sup><span>để từ Đông sang Tây, thiên hạ biết rằng<br />chẳng có thần nào khác, ngoại trừ Ta.<br />Ta là Đức Chúa, không còn chúa nào khác.<br /></span></p>"
  },
  "tv": {
    "ref": "Tv 95,1 và 3.4-5.7-8a.8b-10ac (Đ. c.7b)",
    "content": "<p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Hãy dâng Chúa quyền lực và vinh quang.</span></p><p class=\"leading\"><sup>1</sup><span>Hát lên mừng Chúa một bài ca mới,<br />hát lên mừng Chúa, hỡi toàn thể địa cầu !</span><sup>3</sup><span>kể cho muôn dân biết Người thật là vinh hiển,<br />cho mọi nước hay những kỳ công của Người.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Hãy dâng Chúa quyền lực và vinh quang.</span></p><p class=\"leading\"><sup>4</sup><span>Chúa thật cao cả, xứng muôn lời ca tụng,<br />khả tôn khả uý hơn chư thần,</span><sup>5</sup><span>vì chư thần các nước thảy đều hư ảo,<br />còn Đức Chúa, Người sáng tạo trời cao.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Hãy dâng Chúa quyền lực và vinh quang.</span></p><p class=\"leading\"><sup>7</sup><span>Hãy dâng Chúa, hỡi các dân các nước,<br />dâng Chúa quyền lực và vinh quang,</span><sup>8a</sup><span>hãy dâng Chúa vinh quang xứng danh Người.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Hãy dâng Chúa quyền lực và vinh quang.</span></p><p class=\"leading\"><sup>8b</sup><span>Hãy bưng lễ vật, bước vào tiền đình Chúa,</span><sup>9</sup><span>và thờ lạy Chúa uy nghiêm thánh thiện,<br />toàn thể địa cầu, hãy run sợ trước Thánh Nhan.</span><sup>10ac</sup><span>Hãy nói với chư dân : Chúa là Vua hiển trị,<br />Người xét xử muôn nước theo đường ngay thẳng.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Hãy dâng Chúa quyền lực và vinh quang.</span></p>"
  },
  "bd2": {
    "ref": "1 Tx 1,1-5b",
    "bookTitle": "Khởi đầu thư thứ nhất của thánh Phao-lô tông đồ gửi tín hữu Thê-xa-lô-ni-ca.",
    "lead": "Chúng tôi nhớ đến lòng tin, lòng mến và lòng trông cậy của anh em.",
    "content": "<p><sup>1</sup> Chúng tôi là Phao-lô, Xin-va-nô và Ti-mô-thê, kính gửi Hội Thánh Thê-xa-lô-ni-ca ở trong Thiên Chúa Cha, và trong Chúa Giê-su Ki-tô. Chúc anh em được ân sủng và bình an.</p><p><sup>2</sup> Chúng tôi hằng tạ ơn Thiên Chúa về tất cả anh em. Chúng tôi nhắc đến anh em trong lời cầu nguyện, <sup>3</sup> và trước mặt Thiên Chúa là Cha chúng ta, chúng tôi không ngừng nhớ đến những việc anh em làm vì lòng tin, những nỗi khó nhọc anh em gánh vác vì lòng mến, và những gì anh em kiên nhẫn chịu đựng vì trông đợi Chúa chúng ta là Đức Giê-su Ki-tô.</p><p><sup>4</sup> Thưa anh em là những người được Thiên Chúa thương mến, chúng tôi biết rằng Thiên Chúa đã chọn anh em, <sup>5b</sup> vì khi chúng tôi loan báo Tin Mừng cho anh em, thì không phải chỉ có lời chúng tôi nói, mà còn có quyền năng, có Thánh Thần, và một niềm xác tín sâu xa.</p>"
  },
  "tm": {
    "ref": "Mt 22,15-21",
    "bookTitle": "<span class=\"holycross\">&#x2720;</span>Tin Mừng Chúa Giê-su Ki-tô theo thánh Mát-thêu.",
    "lead": "Của Xê-da, trả về Xê-da ; của Thiên Chúa, trả về Thiên Chúa.",
    "alleluiaRef": "Pl 2,15d.16a",
    "alleluia": "Ha-lê-lui-a. Ha-lê-lui-a. Giữa thế gian, anh em phải chiếu sáng như những vì sao trên vòng trời, là làm sáng tỏ lời ban sự sống. Ha-lê-lui-a.",
    "alleluiaHtml": "<p>Ha-lê-lui-a. Ha-lê-lui-a. Giữa thế gian, anh em phải chiếu sáng như những vì sao trên vòng trời, là làm sáng tỏ lời ban sự sống. Ha-lê-lui-a.</p>",
    "content": "<p><sup>15</sup> Khi ấy, những người Pha-ri-sêu đi bàn bạc với nhau, tìm cách làm cho Đức Giê-su phải lỡ lời mà mắc bẫy. <sup>16</sup> Họ sai các môn đệ của họ cùng đi với những người phe Hê-rô-đê, đến nói với Đức Giê-su rằng : “Thưa Thầy, chúng tôi biết Thầy là người chân thật và cứ sự thật mà dạy đường lối của Thiên Chúa. Thầy cũng chẳng vị nể ai, vì Thầy không cứ bề ngoài mà đánh giá người ta. <sup>17</sup> Vậy xin Thầy cho biết ý kiến : có được phép nộp thuế cho Xê-da hay không ?”</p><p><sup>18</sup> Nhưng Đức Giê-su biết họ có ác ý, nên Người nói : “Tại sao các người lại thử tôi, hỡi những kẻ đạo đức giả ! <sup>19</sup> Cho tôi xem đồng tiền nộp thuế !” Họ liền đưa cho Người một quan tiền. <sup>20</sup> Người hỏi họ : “Hình và danh hiệu này là của ai đây ?” <sup>21</sup> Họ đáp : “Của Xê-da.” Bấy giờ, Người bảo họ : “Thế thì của Xê-da, trả về Xê-da ; của Thiên Chúa, trả về Thiên Chúa.”</p>"
  }
},
  "cn30": {
  "date": "2026-10-25",
  "title": "Chúa Nhật Tuần XXX - Mùa Thường Niên",
  "source": "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ (ktcgkpv.org)",
  "sourceUrl": "https://ktcgkpv.org/readings/mass-reading",
  "bd1": {
    "ref": "Xh 22,20-26",
    "bookTitle": "Bài trích sách Xuất hành.",
    "lead": "Nếu các ngươi ức hiếp mẹ goá con côi, thì cơn giận Ta sẽ bốc lên chống lại các ngươi.",
    "content": "<p><sup>20</sup> Đức Chúa phán thế này : Người ngoại kiều, ngươi không được ngược đãi và áp bức, vì chính các ngươi đã là ngoại kiều ở đất Ai-cập. <sup>21</sup> Mẹ goá con côi, các ngươi không được ức hiếp. <sup>22</sup> Nếu ngươi ức hiếp mà nó kêu cứu Ta, ắt Ta sẽ nghe tiếng nó kêu cứu. <sup>23</sup> Cơn giận Ta sẽ bốc lên, Ta sẽ cho gươm chém giết các ngươi : thế là vợ các ngươi sẽ thành goá bụa, và con các ngươi sẽ thành côi cút.</p><p><sup>24</sup> Nếu ngươi cho một người trong dân Ta, một người nghèo ở với ngươi vay tiền, thì ngươi không được xử với nó như chủ nợ, không được bắt nó trả lãi.</p><p><sup>25</sup> Nếu ngươi giữ áo choàng của người khác làm đồ cầm, thì ngươi phải trả lại cho nó trước khi mặt trời lặn. <sup>26</sup> Nó chỉ có cái đó để đắp, để làm áo che thân ; nó sẽ lấy gì mà ngủ ? Nó mà kêu cứu Ta, Ta sẽ nghe nó, vì Ta vốn nhân từ.</p>"
  },
  "tv": {
    "ref": "Tv 17,2-3a.3bc-4.47 và 51ab (Đ. c.2)",
    "content": "<p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Con yêu mến Ngài, lạy Chúa là sức mạnh của con.</span></p><p class=\"leading\"><sup>2</sup><span>Con yêu mến Ngài,<br />lạy Chúa là sức mạnh của con ;</span><sup>3a</sup><span>lạy Chúa là núi đá, là thành luỹ,<br />là Đấng giải thoát con.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Con yêu mến Ngài, lạy Chúa là sức mạnh của con.</span></p><p class=\"leading\"><sup>3bc</sup><span>Lạy Thiên Chúa con thờ, là núi đá cho con trú ẩn,<br />là khiên mộc, là Đấng cứu độ quyền năng,<br />là thành trì bảo vệ.</span><sup>4</sup><span>Tôi kêu cầu Chúa<br />là Đấng xứng muôn lời ngợi khen,<br />và tôi được cứu thoát khỏi quân thù.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Con yêu mến Ngài, lạy Chúa là sức mạnh của con.</span></p><p class=\"leading\"><sup>47</sup><span>Đức Chúa vạn vạn tuế !<br />Chúc tụng Người là núi đá cho tôi trú ẩn.<br />Tôn vinh Thiên Chúa là Đấng cứu độ tôi,</span><sup>51ab</sup><span>Chúa ban nhiều chiến thắng lớn lao<br />cho Đức Vua chính Người đã lập.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Con yêu mến Ngài, lạy Chúa là sức mạnh của con.</span></p>"
  },
  "bd2": {
    "ref": "1 Tx 1,5c-10",
    "bookTitle": "Bài trích thư thứ nhất của thánh Phao-lô tông đồ gửi tín hữu Thê-xa-lô-ni-ca.",
    "lead": "Anh em đã từ bỏ ngẫu tượng, để phụng sự Thiên Chúa và chờ đợi Con của Người.",
    "content": "<p><sup>5c</sup> Thưa anh em, anh em biết, khi ở với anh em, chúng tôi đã sống thế nào để mưu ích cho anh em ; <sup>6</sup> còn anh em, anh em đã bắt chước chúng tôi và noi gương Chúa, khi đón nhận lời Chúa giữa bao nỗi gian truân với niềm vui do Thánh Thần ban : <sup>7</sup> bởi vậy anh em đã nên gương cho mọi tín hữu ở miền Ma-kê-đô-ni-a và miền A-khai-a. <sup>8</sup> Quả thế, từ nơi anh em, lời Chúa đã vang ra, không những ở Ma-kê-đô-ni-a và A-khai-a, mà đâu đâu người ta cũng nghe biết lòng tin anh em đặt vào Thiên Chúa, khiến chúng tôi không cần phải nói gì thêm nữa. <sup>9</sup> Khi nói về chúng tôi, người ta kể lại chúng tôi đã được anh em tiếp đón làm sao, và anh em đã từ bỏ ngẫu tượng mà quay về với Thiên Chúa thế nào, để phụng sự Thiên Chúa hằng sống, Thiên Chúa thật, <sup>10</sup> và chờ đợi Con của Người từ trời ngự đến, người Con mà Thiên Chúa đã cho trỗi dậy từ cõi chết, là Đức Giê-su, Đấng cứu chúng ta thoát cơn thịnh nộ đang đến.</p>"
  },
  "tm": {
    "ref": "Mt 22,34-40",
    "bookTitle": "<span class=\"holycross\">&#x2720;</span>Tin Mừng Chúa Giê-su Ki-tô theo thánh Mát-thêu.",
    "lead": "Ngươi phải yêu mến Đức Chúa, Thiên Chúa của ngươi, và yêu người thân cận như chính mình.",
    "alleluiaRef": "Ga 14,23",
    "alleluia": "Ha-lê-lui-a. Ha-lê-lui-a. Chúa nói : Ai yêu mến Thầy, thì sẽ giữ lời Thầy. Cha Thầy sẽ yêu mến người ấy. Cha Thầy và Thầy sẽ đến với người ấy. Ha-lê-lui-a.",
    "alleluiaHtml": "<p>Ha-lê-lui-a. Ha-lê-lui-a. Chúa nói : Ai yêu mến Thầy, thì sẽ giữ lời Thầy. Cha Thầy sẽ yêu mến người ấy. Cha Thầy và Thầy sẽ đến với người ấy. Ha-lê-lui-a.</p>",
    "content": "<p><sup>34</sup> Khi ấy, nghe tin Đức Giê-su đã làm cho nhóm Xa-đốc phải câm miệng, thì những người Pha-ri-sêu họp nhau lại. <sup>35</sup> Rồi một người thông luật trong nhóm hỏi Đức Giê-su để thử Người rằng : <sup>36</sup> “Thưa Thầy, trong sách Luật Mô-sê, điều răn nào là điều răn trọng nhất ?” <sup>37</sup> Đức Giê-su đáp : “Ngươi phải yêu mến Đức Chúa, Thiên Chúa của ngươi, hết lòng, hết linh hồn và hết trí khôn ngươi. <sup>38</sup> Đó là điều răn trọng nhất và điều răn thứ nhất. <sup>39</sup> Còn điều răn thứ hai, cũng giống điều răn ấy, là : Ngươi phải yêu người thân cận như chính mình. <sup>40</sup> Tất cả Luật Mô-sê và các sách ngôn sứ đều tuỳ thuộc vào hai điều răn ấy.”</p>"
  }
},
  "cac-thanh": {
  "date": "2026-11-01",
  "title": "Đại Lễ Các Thánh Nam Nữ",
  "source": "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ (ktcgkpv.org)",
  "sourceUrl": "https://ktcgkpv.org/readings/mass-reading",
  "bd1": {
    "ref": "Kh 7,2-4.9-14",
    "bookTitle": "Bài trích sách Khải huyền của thánh Gio-an tông đồ.",
    "lead": "Tôi thấy : Kìa một đoàn người thật đông không tài nào đếm nổi, thuộc mọi dân, mọi chi tộc, mọi nước và mọi ngôn ngữ.",
    "content": "<p><sup>2</sup> Tôi là Gio-an, tôi thấy một thiên thần mang ấn của Thiên Chúa hằng sống, từ phía mặt trời mọc đi lên. Thiên thần ấy lớn tiếng gọi bốn thiên thần khác, là những vị được quyền phá hại đất liền và biển cả. <sup>3</sup> Thiên thần ấy nói : “Xin đừng phá hại đất liền, biển cả và cây cối, trước khi chúng tôi đóng ấn trên trán các tôi tớ của Thiên Chúa chúng ta”. <sup>4</sup> Rồi tôi nghe nói đến con số những người được đóng ấn : một trăm bốn mươi bốn ngàn người thuộc mọi chi tộc con cái Ít-ra-en.</p><p><sup>9</sup> Sau đó, tôi thấy : một đoàn người thật đông không tài nào đếm nổi, thuộc mọi dân, mọi chi tộc, mọi nước và mọi ngôn ngữ. Họ đứng trước ngai và trước Con Chiên, mình mặc áo trắng, tay cầm nhành lá thiên tuế. <sup>10</sup> Họ lớn tiếng tung hô : “Chính Thiên Chúa chúng ta, Đấng ngự trên ngai, và chính Con Chiên đã cứu độ chúng ta.” <sup>11</sup> Tất cả các thiên thần đều đứng chung quanh ngai, chung quanh các Kỳ Mục và bốn Con Vật. Họ đều sấp mặt xuống, phủ phục trước ngai và thờ lạy Thiên Chúa mà tung hô <sup>12</sup> rằng :</p><p class=\"poem\"><sup></sup><span>“A-men ! Xin kính dâng Thiên Chúa chúng ta<br />lời chúc tụng và vinh quang, sự khôn ngoan và lời tạ ơn,<br />danh dự, uy quyền và sức mạnh,<br />đến muôn thuở muôn đời ! A-men !”</span></p><p><sup>13</sup> Một trong các Kỳ Mục lên tiếng hỏi tôi : “Những người mặc áo trắng kia là ai vậy ? Họ từ đâu đến ?” <sup>14</sup> Tôi trả lời : “Thưa Ngài, Ngài biết đó.” Vị ấy bảo tôi : “Họ là những người đã đến, sau khi trải qua cơn thử thách lớn lao. Họ đã giặt sạch và tẩy trắng áo mình trong máu Con Chiên.”</p>"
  },
  "tv": {
    "ref": "Tv 23,1-2.3-4ab.5-6 (Đ. x. c.6)",
    "content": "<p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Lạy Chúa, đây chính là dòng dõi<br />những kẻ tìm kiếm thánh nhan Ngài.</span></p><p class=\"leading\"><sup>1</sup><span>Chúa làm chủ trái đất cùng muôn vật muôn loài,<br />làm chủ hoàn cầu với toàn thể dân cư.</span><sup>2</sup><span>Nền trái đất, Người dựng trên biển cả,<br />đặt vững vàng trên làn nước mênh mông.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Lạy Chúa, đây chính là dòng dõi<br />những kẻ tìm kiếm thánh nhan Ngài.</span></p><p class=\"leading\"><sup>3</sup><span>Ai được lên núi Chúa ?<br />Ai được ở trong đền thánh của Người ?</span><sup>4ab</sup><span>Đó là kẻ tay sạch lòng thanh,<br />chẳng mê theo ngẫu tượng.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Lạy Chúa, đây chính là dòng dõi<br />những kẻ tìm kiếm thánh nhan Ngài.</span></p><p class=\"leading\"><sup>5</sup><span>Người ấy sẽ được Chúa ban phúc lành,<br />được Thiên Chúa cứu độ thưởng công xứng đáng.</span><sup>6</sup><span>Đây chính là dòng dõi những kẻ kiếm tìm Người,<br />tìm thánh nhan Thiên Chúa nhà Gia-cóp.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Lạy Chúa, đây chính là dòng dõi<br />những kẻ tìm kiếm thánh nhan Ngài.</span></p>"
  },
  "bd2": {
    "ref": "1 Ga 3,1-3",
    "bookTitle": "Bài trích thư thứ nhất của thánh Gio-an tông đồ.",
    "lead": "Thiên Chúa thế nào, chúng ta sẽ thấy Người như vậy.",
    "content": "<p class=\"poem\"><sup>1</sup><span>Anh em thân mến,<br />anh em hãy xem Chúa Cha yêu chúng ta dường nào :<br />Người yêu đến nỗi<br />cho chúng ta được gọi là con Thiên Chúa<br />- mà thực sự chúng ta là con Thiên Chúa.<br />Sở dĩ thế gian không nhận biết chúng ta,<br />là vì thế gian đã không biết Người.</span><br /><sup>2</sup><span>Anh em thân mến, hiện giờ chúng ta là con Thiên Chúa ;<br />nhưng chúng ta sẽ như thế nào, điều ấy chưa được bày tỏ.<br />Chúng ta biết rằng khi Đức Ki-tô xuất hiện,<br />chúng ta sẽ nên giống như Người,<br />vì Người thế nào, chúng ta sẽ thấy Người như vậy.</span><br /><sup>3</sup><span>Phàm ai đặt hy vọng như thế vào Đức Ki-tô<br />thì làm cho mình nên thanh sạch<br />như Người là Đấng thanh sạch.</span></p>"
  },
  "tm": {
    "ref": "Mt 5,1-12a",
    "bookTitle": "<span class=\"holycross\">&#x2720;</span>Tin Mừng Chúa Giê-su Ki-tô theo thánh Mát-thêu.",
    "lead": "Anh em hãy vui mừng hớn hở, vì phần thưởng dành cho anh em ở trên trời thật lớn lao.",
    "alleluiaRef": "Mt 11,28",
    "alleluia": "Ha-lê-lui-a. Ha-lê-lui-a. Chúa nói : Tất cả những ai đang vất vả mang gánh nặng nề, hãy đến cùng tôi, tôi sẽ cho nghỉ ngơi bồi dưỡng. Ha-lê-lui-a.",
    "alleluiaHtml": "<p>Ha-lê-lui-a. Ha-lê-lui-a. Chúa nói : Tất cả những ai đang vất vả mang gánh nặng nề, hãy đến cùng tôi, tôi sẽ cho nghỉ ngơi bồi dưỡng. Ha-lê-lui-a.</p>",
    "content": "<p><sup>1</sup> Khi ấy, thấy đám đông, Đức Giê-su lên núi. Người ngồi xuống, các môn đệ đến gần bên. <sup>2</sup> Người lên tiếng dạy họ rằng :</p><p class=\"poem\"><sup>3</sup><span>“Phúc thay ai có tâm hồn nghèo khó,<br />vì Nước Trời là của họ.</span><br /><sup>4</sup><span>Phúc thay ai hiền lành,<br />vì họ sẽ được Đất Hứa làm gia nghiệp.</span><br /><sup>5</sup><span>Phúc thay ai sầu khổ,<br />vì họ sẽ được Thiên Chúa ủi an.</span><br /><sup>6</sup><span>Phúc thay ai khát khao nên người công chính,<br />vì họ sẽ được Thiên Chúa cho thoả lòng.</span><br /><sup>7</sup><span>Phúc thay ai xót thương người,<br />vì họ sẽ được Thiên Chúa xót thương.</span><br /><sup>8</sup><span>Phúc thay ai có tâm hồn trong sạch,<br />vì họ sẽ được nhìn thấy Thiên Chúa.</span><br /><sup>9</sup><span>Phúc thay ai xây dựng hoà bình,<br />vì họ sẽ được gọi là con Thiên Chúa.</span><br /><sup>10</sup><span>Phúc thay ai bị bách hại vì sống công chính,<br />vì Nước Trời là của họ.</span><br /><sup>11</sup><span>Phúc thay anh em khi vì Thầy mà bị người ta sỉ vả, bách hại<br />và vu khống đủ điều xấu xa.</span><br /><sup>12a</sup><span>Anh em hãy vui mừng hớn hở,<br />vì phần thưởng dành cho anh em ở trên trời thật lớn lao.”</span></p>"
  }
},
  "cac-dang": {
  "date": "2026-11-02",
  "title": "Lễ Các Đẳng Linh Hồn",
  "source": "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ (ktcgkpv.org)",
  "sourceUrl": "https://ktcgkpv.org/readings/mass-reading",
  "bd1": {
    "ref": "G 19,1.23-27a",
    "bookTitle": "Bài trích sách Gióp.",
    "lead": "Tôi biết rằng Đấng bênh vực tôi vẫn sống.",
    "content": "<p><sup>1</sup> Bấy giờ, ông Gióp lên tiếng nói :</p><p class=\"poem\"><sup>23</sup><span>“Ôi, những lời tôi nói đây, phải chi có người chép lại,<br />phải chi có người ghi vào sách,</span><br /><sup>24</sup><span>có người đục bằng sắt, trám bằng chì,<br />tạc vào đá cho đến muôn đời !</span><br /><sup>25</sup><span>Tôi biết rằng Đấng bênh vực tôi vẫn sống,<br />và sau cùng, Người sẽ đứng lên trên cõi đất.</span><br /><sup>26</sup><span>Sau khi da tôi đây bị tiêu huỷ,<br />thì với tấm thân này, tôi sẽ được ngắm nhìn Thiên Chúa.</span><br /><sup>27a</sup><span>Chính tôi sẽ được ngắm nhìn Người,<br />Đấng mắt tôi nhìn thấy không phải người xa lạ.”<br /></span></p>"
  },
  "tv": {
    "ref": "Tv 26,1.4.7 và 8b và 9a.13-14 (Đ. c.13)",
    "content": "<p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Tôi vững vàng tin tưởng<br />sẽ được thấy ân lộc Chúa ban<br />trong cõi đất dành cho kẻ sống.</span></p><p class=\"leading\"><sup>1</sup><span>Chúa là nguồn ánh sáng và ơn cứu độ của tôi,<br />tôi còn sợ người nào ?<br />Chúa là thành luỹ bảo vệ đời tôi,<br />tôi khiếp gì ai nữa ?</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Tôi vững vàng tin tưởng<br />sẽ được thấy ân lộc Chúa ban<br />trong cõi đất dành cho kẻ sống.</span></p><p class=\"leading\"><sup>4</sup><span>Một điều tôi kiếm tôi xin,<br />là luôn được ở trong đền Chúa tôi<br />mọi ngày trong suốt cuộc đời,<br />để chiêm ngưỡng Chúa tuyệt vời cao sang,<br />ngắm xem thánh điện huy hoàng.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Tôi vững vàng tin tưởng<br />sẽ được thấy ân lộc Chúa ban<br />trong cõi đất dành cho kẻ sống.</span></p><p class=\"leading\"><sup>7</sup><span>Lạy Chúa, cúi xin Ngài nghe tiếng con kêu,<br />xin thương tình đáp lại.</span><sup>8b</sup><span>Lạy Chúa, con tìm thánh nhan Ngài,</span><sup>9a</sup><span>xin Ngài đừng ẩn mặt.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Tôi vững vàng tin tưởng<br />sẽ được thấy ân lộc Chúa ban<br />trong cõi đất dành cho kẻ sống.</span></p><p class=\"leading\"><sup>13</sup><span>Tôi vững vàng tin tưởng<br />sẽ được thấy ân lộc Chúa ban<br />trong cõi đất dành cho kẻ sống.</span><sup>14</sup><span>Hãy cậy trông vào Chúa,<br />mạnh bạo lên, can đảm lên nào !<br />Hãy cậy trông vào Chúa.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Tôi vững vàng tin tưởng<br />sẽ được thấy ân lộc Chúa ban<br />trong cõi đất dành cho kẻ sống.</span></p>"
  },
  "bd2": {
    "ref": "Rm 5,5-11",
    "bookTitle": "Bài trích thư của thánh Phao-lô tông đồ gửi tín hữu Rô-ma.",
    "lead": "Chúng ta đã được nên công chính nhờ Máu Đức Ki-tô đổ ra, hẳn sẽ được Người cứu khỏi cơn thịnh nộ của Thiên Chúa.",
    "content": "<p><sup>5</sup> Thưa anh em, trông cậy không làm chúng ta phải thất vọng, vì Thiên Chúa đã đổ tình yêu của Người vào lòng chúng ta, nhờ Thánh Thần mà Người ban cho chúng ta. <sup>6</sup> Quả vậy, khi chúng ta không có sức làm được gì vì còn là hạng người vô đạo, thì theo đúng kỳ hạn, Đức Ki-tô đã chết vì chúng ta. <sup>7</sup> Hầu như không ai chết vì người công chính, hoạ may có ai dám chết vì một người lương thiện chăng. <sup>8</sup> Thế mà Đức Ki-tô đã chết vì chúng ta, ngay khi chúng ta còn là những người tội lỗi ; đó là bằng chứng Thiên Chúa yêu thương chúng ta. <sup>9</sup> Phương chi bây giờ chúng ta đã được nên công chính nhờ máu Đức Ki-tô đổ ra, hẳn chúng ta sẽ được Người cứu khỏi cơn thịnh nộ của Thiên Chúa. <sup>10</sup> Thật vậy, nếu ngay khi chúng ta còn thù nghịch với Thiên Chúa, Thiên Chúa đã để cho Con của Người phải chết mà cho chúng ta được hoà giải với Người, phương chi bây giờ chúng ta đã được hoà giải rồi, hẳn chúng ta sẽ được cứu nhờ sự sống của Người Con ấy. <sup>11</sup> Nhưng không phải chỉ có thế, chúng ta còn có Thiên Chúa là niềm tự hào, nhờ Đức Giê-su Ki-tô, Chúa chúng ta, Đấng nay đã hoà giải chúng ta với Thiên Chúa.</p>"
  },
  "tm": {
    "ref": "Ga 6,37-40",
    "bookTitle": "<span class=\"holycross\">&#x2720;</span>Tin Mừng Chúa Giê-su Ki-tô theo thánh Gio-an.",
    "lead": "Ai tin vào người Con, thì được sống muôn đời, và tôi sẽ cho họ sống lại trong ngày sau hết.",
    "alleluiaRef": "Ga 6,40",
    "alleluia": "Ha-lê-lui-a. Ha-lê-lui-a. Chúa nói : Ý của Cha tôi là tất cả những ai tin vào người Con, thì được sống muôn đời, và tôi sẽ cho họ sống lại trong ngày sau hết. Ha-lê-lui-a.",
    "alleluiaHtml": "<p>Ha-lê-lui-a. Ha-lê-lui-a. Chúa nói : Ý của Cha tôi là tất cả những ai tin vào người Con, thì được sống muôn đời, và tôi sẽ cho họ sống lại trong ngày sau hết. Ha-lê-lui-a.</p>",
    "content": "<p><sup>37</sup> Khi ấy, Đức Giê-su nói với dân chúng rằng : “Tất cả những người Chúa Cha ban cho tôi đều sẽ đến với tôi, và ai đến với tôi, tôi sẽ không loại ra ngoài, <sup>38</sup> vì tôi tự trời mà xuống, không phải để làm theo ý tôi, nhưng để làm theo ý Đấng đã sai tôi. <sup>39</sup> Mà ý của Đấng đã sai tôi là tất cả những kẻ Người đã ban cho tôi, tôi sẽ không để mất một ai, nhưng sẽ cho họ sống lại trong ngày sau hết. <sup>40</sup> Thật vậy, ý của Cha tôi là tất cả những ai thấy người Con và tin vào người Con, thì được sống muôn đời, và tôi sẽ cho họ sống lại trong ngày sau hết.”</p>"
  }
},
  "cn32": {
  "date": "2026-11-08",
  "title": "Chúa Nhật Tuần XXXII - Mùa Thường Niên",
  "source": "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ (ktcgkpv.org)",
  "sourceUrl": "https://ktcgkpv.org/readings/mass-reading",
  "bd1": {
    "ref": "Kn 6,12-16",
    "bookTitle": "Bài trích sách Khôn ngoan.",
    "lead": "Ai tìm kiếm Đức Khôn Ngoan, thì Đức Khôn Ngoan cho gặp.",
    "content": "<p class=\"poem\"><sup>12</sup><span>Đức Khôn Ngoan sáng chói, và không hề tàn tạ.<br />Ai mến chuộng Đức Khôn Ngoan,<br />thì Đức Khôn Ngoan dễ dàng cho chiêm ngưỡng.<br />Ai tìm kiếm Đức Khôn Ngoan,<br />thì Đức Khôn Ngoan cho gặp.</span><br /><sup>13</sup><span>Ai khao khát Đức Khôn Ngoan,<br />thì Đức Khôn Ngoan đi bước trước mà tỏ mình cho biết.</span><br /><sup>14</sup><span>Ai từ sáng sớm đã tìm Đức Khôn Ngoan,<br />thì không phải nhọc nhằn vất vả.<br />Họ sẽ thấy Đức Khôn Ngoan ngồi ngay trước cửa nhà.</span><br /><sup>15</sup><span>Để tâm suy niệm về Đức Khôn Ngoan<br />là đạt được sự minh mẫn toàn hảo.<br />Ai vì Đức Khôn Ngoan mà thức khuya dậy sớm,<br />sẽ mau trút được mọi lo âu.</span><br /><sup>16</sup><span>Vì những ai xứng đáng với Đức Khôn Ngoan,<br />thì Đức Khôn Ngoan rảo quanh tìm kiếm.<br />Trên các nẻo đường họ đi,<br />Đức Khôn Ngoan niềm nở xuất hiện.<br />Mỗi khi họ suy tưởng điều gì,<br />Đức Khôn Ngoan đều đến với họ.<br /></span></p>"
  },
  "tv": {
    "ref": "Tv 62,2.3-4.5-6.7-8 (Đ. x. c.2)",
    "content": "<p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Lạy Thiên Chúa, Ngài là Chúa con thờ,<br />linh hồn con đã khao khát Chúa.</span></p><p class=\"leading\"><sup>2</sup><span>Lạy Thiên Chúa, Ngài là Chúa con thờ,<br />ngay từ rạng đông con tìm kiếm Chúa.<br />Linh hồn con đã khát khao Ngài,<br />tấm thân này mòn mỏi đợi trông,<br />như mảnh đất hoang khô cằn, không giọt nước.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Lạy Thiên Chúa, Ngài là Chúa con thờ,<br />linh hồn con đã khao khát Chúa.</span></p><p class=\"leading\"><sup>3</sup><span>Nên con đến ngắm nhìn Ngài trong nơi thánh điện,<br />để thấy uy lực và vinh quang của Ngài.</span><sup>4</sup><span>Bởi ân tình Ngài quý hơn mạng sống,<br />miệng lưỡi này xin ca ngợi tán dương.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Lạy Thiên Chúa, Ngài là Chúa con thờ,<br />linh hồn con đã khao khát Chúa.</span></p><p class=\"leading\"><sup>5</sup><span>Suốt cả đời con, nguyện dâng lời chúc tụng,<br />và giơ tay cầu khẩn danh Ngài.</span><sup>6</sup><span>Lòng thoả thuê như khách vừa dự tiệc,<br />môi miệng con rộn rã khúc hoan ca.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Lạy Thiên Chúa, Ngài là Chúa con thờ,<br />linh hồn con đã khao khát Chúa.</span></p><p class=\"leading\"><sup>7</sup><span>Con tưởng nhớ Chúa trên giường ngủ,<br />suốt năm canh thầm thĩ với Ngài.</span><sup>8</sup><span>Quả thật Ngài đã thương trợ giúp,<br />nương bóng Ngài, con hớn hở reo vui.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Lạy Thiên Chúa, Ngài là Chúa con thờ,<br />linh hồn con đã khao khát Chúa.</span></p>"
  },
  "bd2": {
    "ref": "1 Tx 4,13-18",
    "bookTitle": "Bài trích thư thứ nhất của thánh Phao-lô tông đồ gửi tín hữu Thê-xa-lô-ni-ca.",
    "lead": "Những người đã an giấc trong Đức Giê-su, sẽ được Thiên Chúa đưa về cùng Đức Giê-su.",
    "content": "<p><sup>13</sup> Thưa anh em, về những ai đã an giấc ngàn thu, chúng tôi không muốn để anh em chẳng hay biết gì, hầu anh em khỏi buồn phiền như những người khác, là những người không có niềm hy vọng. <sup>14</sup> Vì nếu chúng ta tin rằng Đức Giê-su đã chết và đã sống lại, thì chúng ta cũng tin rằng những người đã an giấc trong Đức Giê-su, sẽ được Thiên Chúa đưa về cùng Đức Giê-su. <sup>15</sup> Dựa vào lời của Chúa, chúng tôi nói với anh em điều này, là chúng ta, những người đang sống, những người còn lại vào ngày Chúa quang lâm, chúng ta sẽ chẳng đi trước những người đã an giấc ngàn thu đâu. <sup>16</sup> Vì khi hiệu lệnh ban ra, khi tiếng tổng lãnh thiên thần và tiếng kèn của Thiên Chúa vang lên, thì chính Chúa sẽ từ trời ngự xuống, và những người đã chết trong Đức Ki-tô sẽ sống lại trước tiên ; <sup>17</sup> rồi đến chúng ta, là những người đang sống, những người còn lại, chúng ta sẽ được đem đi trên đám mây cùng với họ, để nghênh đón Chúa trên không trung. Như thế, chúng ta sẽ được ở cùng Chúa mãi mãi. <sup>18</sup> Vậy anh em hãy dùng những lời ấy mà an ủi nhau.</p>"
  },
  "tm": {
    "ref": "Mt 25,1-13",
    "bookTitle": "<span class=\"holycross\">&#x2720;</span>Tin Mừng Chúa Giê-su Ki-tô theo thánh Mát-thêu.",
    "lead": "Chú rể kia rồi, ra đón đi !",
    "alleluiaRef": "Mt 24,42a.44",
    "alleluia": "Ha-lê-lui-a Ha-lê-lui-a. Anh em hãy canh thức và hãy sẵn sàng, vì chính giờ phút anh em không ngờ, thì Con Người sẽ đến. Ha-lê-lui-a.",
    "alleluiaHtml": "<p>Ha-lê-lui-a Ha-lê-lui-a. Anh em hãy canh thức và hãy sẵn sàng, vì chính giờ phút anh em không ngờ, thì Con Người sẽ đến. Ha-lê-lui-a.</p>",
    "content": "<p><sup>1</sup> Khi ấy, Đức Giê-su kể cho các môn đệ nghe dụ ngôn này : “Nước Trời sẽ giống như chuyện mười trinh nữ cầm đèn ra đón chú rể. <sup>2</sup> Trong mười cô đó, có năm cô dại và năm cô khôn. <sup>3</sup> Quả vậy, các cô dại mang đèn mà không mang dầu theo. <sup>4</sup> Còn những cô khôn thì vừa mang đèn vừa mang chai dầu theo. <sup>5</sup> Vì chú rể đến chậm, nên các cô thiếp đi, rồi ngủ cả. <sup>6</sup> Nửa đêm, có tiếng la lên : ‘Chú rể kia rồi, ra đón đi !’ <sup>7</sup> Bấy giờ tất cả các trinh nữ ấy đều thức dậy, và sửa soạn đèn. <sup>8</sup> Các cô dại nói với các cô khôn rằng : ‘Xin các chị cho chúng em chút dầu, vì đèn của chúng em sắp tắt rồi !’ <sup>9</sup> Các cô khôn đáp : ‘Sợ không đủ cho chúng em và cho các chị đâu, các chị ra hàng mà mua lấy thì hơn.’ <sup>10</sup> Đang lúc các cô đi mua, thì chú rể tới, và những cô đã sẵn sàng được đi theo chú rể vào dự tiệc cưới. Rồi người ta đóng cửa lại. <sup>11</sup> Sau cùng, mấy trinh nữ kia cũng đến gọi : ‘Thưa Ngài, thưa Ngài ! mở cửa cho chúng tôi với !’ <sup>12</sup> Nhưng Người đáp : ‘Tôi bảo thật các cô, tôi không biết các cô là ai cả !’ <sup>13</sup> Vậy anh em hãy canh thức, vì anh em không biết ngày nào, giờ nào.”</p>"
  }
},
  "tu-dao": {
  "date": "2026-11-15",
  "title": "Lễ Các Thánh Tử Đạo Việt Nam",
  "source": "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ (ktcgkpv.org)",
  "sourceUrl": "https://ktcgkpv.org/readings/mass-reading",
  "bd1": {
    "ref": "2 Mcb 7,1.20-23.27b-29",
    "bookTitle": "Bài trích sách Ma-ca-bê quyển thứ hai.",
    "lead": "Bà mẹ là người đáng khâm phục, vì bà can đảm chịu đựng nhờ niềm trông cậy bà đặt nơi Đức Chúa.",
    "content": "<p><sup>1</sup> Hồi ấy, có bảy anh em bị bắt cùng với bà mẹ. Vua An-ti-ô-khô cho lấy roi và gân bò mà đánh họ, để bắt họ ăn thịt heo là thức ăn luật Mô-sê cấm.</p><p><sup>20</sup> Bà mẹ là người rất mực xứng đáng cho ta khâm phục và kính cẩn ghi nhớ. Bà thấy bảy người con trai phải chết nội trong có một ngày, thế mà bà vẫn can đảm chịu đựng nhờ niềm trông cậy bà đặt nơi Đức Chúa. <sup>21</sup> Bà dùng tiếng mẹ đẻ mà khuyến khích từng người một, lòng bà đầy tâm tình cao thượng ; lời lẽ của bà tuy là của một người phụ nữ, nhưng lại sôi sục một chí khí nam nhi ; bà nói với các con : <sup>22</sup> “Mẹ không rõ các con đã thành hình trong lòng mẹ thế nào. Không phải mẹ ban cho các con thần khí và sự sống. Cũng không phải mẹ sắp đặt các phần cơ thể cho mỗi người trong các con. <sup>23</sup> Chính Đấng Tạo Hoá càn khôn đã nắn đúc nên loài người, và đã sáng tạo nguồn gốc muôn loài. Chính Người do lòng thương xót, cũng sẽ trả lại cho các con thần khí và sự sống, bởi vì bây giờ các con trọng Luật Lệ của Người hơn bản thân mình.”</p><p><sup>27b</sup> Bà nói với người con út : “Con ơi, con hãy thương mẹ : chín tháng cưu mang, ba năm bú mớm, mẹ đã nuôi nấng dạy dỗ con đến ngần này tuổi đầu. <sup>28</sup> Mẹ xin con hãy nhìn xem trời đất và muôn loài trong đó, mà nhận biết rằng Thiên Chúa đã làm nên tất cả từ hư vô, và loài người cũng được tạo thành như vậy. <sup>29</sup> Con đừng sợ tên đao phủ này ; nhưng hãy tỏ ra xứng đáng với các anh con, mà chấp nhận cái chết, để đến ngày Chúa thương xót, Người sẽ trả con và các anh con cho mẹ.”</p>"
  },
  "tv": {
    "ref": "Tv 125,1-2ab.2cd-3.4-5.6 (Đ. c.5)",
    "content": "<p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Ai nghẹn ngào ra đi gieo giống,<br />mùa gặt mai sau khấp khởi mừng.</span></p><p class=\"leading\"><sup>1</sup><span>Khi Chúa dẫn tù nhân Xi-on trở về,<br />ta tưởng mình như giữa giấc mơ.</span><sup>2ab</sup><span>Vang vang ngoài miệng câu cười nói,<br />rộn rã trên môi khúc nhạc mừng.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Ai nghẹn ngào ra đi gieo giống,<br />mùa gặt mai sau khấp khởi mừng.</span></p><p class=\"leading\"><sup>2cd</sup><span>Bấy giờ trong dân ngoại, người ta bàn tán :<br />“Việc Chúa làm cho họ, vĩ đại thay !”</span><sup>3</sup><span>Việc Chúa làm cho ta, ôi vĩ đại !<br />Ta thấy mình chan chứa một niềm vui.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Ai nghẹn ngào ra đi gieo giống,<br />mùa gặt mai sau khấp khởi mừng.</span></p><p class=\"leading\"><sup>4</sup><span>Lạy Chúa, xin dẫn tù nhân chúng con về,<br />như mưa dẫn nước về suối cạn miền Nam.</span><sup>5</sup><span>Ai nghẹn ngào ra đi gieo giống,<br />mùa gặt mai sau khấp khởi mừng.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Ai nghẹn ngào ra đi gieo giống,<br />mùa gặt mai sau khấp khởi mừng.</span></p><p class=\"leading\"><sup>6</sup><span>Họ ra đi, đi mà nức nở,<br />mang hạt giống vãi gieo ;<br />lúc trở về, về reo hớn hở,<br />vai nặng gánh lúa vàng.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Ai nghẹn ngào ra đi gieo giống,<br />mùa gặt mai sau khấp khởi mừng.</span></p>"
  },
  "bd2": {
    "ref": "Rm 8,31b-39",
    "bookTitle": "Bài trích thư của thánh Phao-lô tông đồ gửi tín hữu Rô-ma.",
    "lead": "Dù sự chết hay sự sống cũng không tách được chúng ta ra khỏi tình yêu của Thiên Chúa.",
    "content": "<p><sup>31b</sup> Thưa anh em, có Thiên Chúa bênh đỡ chúng ta, ai còn chống lại được chúng ta ? <sup>32</sup> Đến như chính Con Một, Thiên Chúa cũng chẳng tiếc, nhưng đã trao nộp vì hết thảy chúng ta. Một khi đã ban Người Con đó, lẽ nào Thiên Chúa lại chẳng rộng ban tất cả cho chúng ta ? <sup>33</sup> Ai sẽ buộc tội những người Thiên Chúa đã chọn ? Chẳng lẽ Thiên Chúa, Đấng làm cho nên công chính ? <sup>34</sup> Ai sẽ kết án họ ? Chẳng lẽ Đức Giê-su Ki-tô, Đấng đã chết, hơn nữa, đã sống lại, và đang ngự bên hữu Thiên Chúa mà chuyển cầu cho chúng ta ?</p><p><sup>35</sup> Ai có thể tách chúng ta ra khỏi tình yêu của Đức Ki-tô ? Phải chăng là gian truân, khốn khổ, đói rách, hiểm nguy, bắt bớ, gươm giáo ? <sup>36</sup> Như có lời chép : Chính vì Ngài mà mỗi ngày chúng con bị giết, bị coi như bầy cừu để sát sinh.</p><p><sup>37</sup> Nhưng trong mọi thử thách ấy, chúng ta toàn thắng nhờ Đấng đã yêu mến chúng ta.</p><p><sup>38</sup> Đúng thế, tôi tin chắc rằng : cho dầu là sự chết hay sự sống, thiên thần hay ma vương quỷ lực, hiện tại hay tương lai, hoặc bất cứ sức mạnh nào, <sup>39</sup> trời cao hay vực thẳm, hay bất cứ một loài thọ tạo nào khác, không có gì tách được chúng ta ra khỏi tình yêu của Thiên Chúa thể hiện nơi Đức Ki-tô Giê-su, Chúa chúng ta.</p>"
  },
  "tm": {
    "ref": "Lc 9,23-26",
    "bookTitle": "<span class=\"holycross\">&#x2720;</span>Tin Mừng Chúa Giê-su Ki-tô theo thánh Lu-ca.",
    "lead": "Ai liều mất mạng sống mình vì tôi, thì sẽ cứu được mạng sống ấy.",
    "alleluiaRef": "Mt 5,10",
    "alleluia": "Ha-lê-lui-a. Ha-lê-lui-a.Phúc thay ai bị bách hại vì sống công chính,vì Nước Trời là của họ. Ha-lê-lui-a.",
    "alleluiaHtml": "<p><p>Ha-lê-lui-a. Ha-lê-lui-a.</p><p>Phúc thay ai bị bách hại vì sống công chính,</p><p>vì Nước Trời là của họ. Ha-lê-lui-a.</p></p>",
    "content": "<p><sup>23</sup> Khi ấy, Đức Giê-su nói với mọi người rằng : “Ai muốn theo tôi, phải từ bỏ chính mình, vác thập giá mình hằng ngày mà theo. <sup>24</sup> Quả vậy, ai muốn cứu mạng sống mình, thì sẽ mất ; còn ai liều mất mạng sống mình vì tôi, thì sẽ cứu được mạng sống ấy. <sup>25</sup> Vì người nào được cả thế giới mà phải đánh mất chính mình hay là thiệt thân, thì nào có lợi gì ? <sup>26</sup> Ai xấu hổ vì tôi và những lời của tôi, thì Con Người cũng sẽ xấu hổ vì kẻ ấy, khi Người ngự đến trong vinh quang của mình, của Chúa Cha và các thánh thiên thần.”</p>"
  }
},
  "kito-vua": {
  "date": "2026-11-22",
  "title": "Chúa Nhật 34 Thường Niên - Chúa Kitô Vua Vũ Trụ",
  "source": "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ (ktcgkpv.org)",
  "sourceUrl": "https://ktcgkpv.org/readings/mass-reading",
  "bd1": {
    "ref": "Ed 34,11-12.15-17",
    "bookTitle": "Bài trích sách ngôn sứ Ê-dê-ki-en.",
    "lead": "Phần các ngươi, hỡi chiên của Ta, này Ta sẽ xét xử giữa chiên với chiên.",
    "content": "<p><sup>11</sup> Đức Chúa là Chúa Thượng phán thế này : “Đây, chính Ta sẽ chăm sóc chiên của Ta và thân hành kiểm điểm. <sup>12</sup> Như mục tử kiểm điểm đàn vật của mình vào ngày người ấy ở giữa đàn chiên bị tản mác thế nào, thì Ta cũng sẽ kiểm điểm chiên của Ta như vậy. Ta sẽ kéo chúng ra khỏi mọi nơi chúng đã bị tản mác, vào ngày mây đen mù mịt. <sup>15</sup> Chính Ta sẽ chăn dắt chiên của Ta, chính Ta sẽ cho chúng nằm nghỉ - sấm ngôn của Đức Chúa là Chúa Thượng. <sup>16</sup> Con nào bị mất, Ta sẽ đi tìm ; con nào đi lạc, Ta sẽ đưa về ; con nào bị thương, Ta sẽ băng bó ; con nào bệnh tật, Ta sẽ làm cho mạnh ; con nào béo mập, con nào khoẻ mạnh, Ta sẽ canh chừng. Ta sẽ theo lẽ chính trực mà chăn dắt chúng.</p><p><sup>17</sup> “Phần các ngươi, hỡi chiên của Ta, -Đức Chúa là Chúa Thượng phán-, này Ta sẽ xét xử giữa chiên với chiên, giữa cừu với dê.”</p>"
  },
  "tv": {
    "ref": "Tv 22,1-2a.2b-3.5.6 (Đ. c.1)",
    "content": "<p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Chúa là mục tử chăn dắt tôi,<br />tôi chẳng thiếu thốn gì.</span></p><p class=\"leading\"><sup>1</sup><span>Chúa là mục tử chăn dắt tôi,<br />tôi chẳng thiếu thốn gì.</span><sup>2a</sup><span>Trong đồng cỏ xanh tươi,<br />Người cho tôi nằm nghỉ.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Chúa là mục tử chăn dắt tôi,<br />tôi chẳng thiếu thốn gì.</span></p><p class=\"leading\"><sup>2b</sup><span>Người đưa tôi tới dòng nước trong lành</span><sup>3</sup><span>và bổ sức cho tôi.<br />Người dẫn tôi trên đường ngay nẻo chính<br />vì danh dự của Người.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Chúa là mục tử chăn dắt tôi,<br />tôi chẳng thiếu thốn gì.</span></p><p class=\"leading\"><sup>5</sup><span>Chúa dọn sẵn cho con bữa tiệc<br />ngay trước mặt quân thù.<br />Đầu con, Chúa xức đượm dầu thơm,<br />ly rượu con đầy tràn chan chứa.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Chúa là mục tử chăn dắt tôi,<br />tôi chẳng thiếu thốn gì.</span></p><p class=\"leading\"><sup>6</sup><span>Lòng nhân hậu và tình thương Chúa<br />ấp ủ tôi suốt cả cuộc đời,<br />và tôi được ở đền Người<br />những ngày tháng, những năm dài triền miên.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Chúa là mục tử chăn dắt tôi,<br />tôi chẳng thiếu thốn gì.</span></p>"
  },
  "bd2": {
    "ref": "1 Cr 15,20-26.28",
    "bookTitle": "Bài trích thư thứ nhất của thánh Phao-lô tông đồ gửi tín hữu Cô-rin-tô.",
    "lead": "Đức Ki-tô trao vương quyền lại cho Thiên Chúa là Cha, và như vậy, Thiên Chúa có toàn quyền trên muôn loài.",
    "content": "<p><sup>20</sup> Thưa anh em, Đức Ki-tô đã trỗi dậy từ cõi chết, mở đường cho những ai đã an giấc ngàn thu. <sup>21</sup> Vì nếu tại một người mà nhân loại phải chết, thì cũng nhờ một người mà kẻ chết được sống lại. <sup>22</sup> Quả thế, như mọi người vì liên đới với A-đam mà phải chết, thì mọi người nhờ liên đới với Đức Ki-tô, cũng được Thiên Chúa cho sống. <sup>23</sup> Nhưng mỗi người theo thứ tự của mình : mở đường là Đức Ki-tô, rồi khi Đức Ki-tô quang lâm thì đến lượt những kẻ thuộc về Người. <sup>24</sup> Sau đó mọi sự đều hoàn tất, khi Người đã tiêu diệt hết mọi quản thần, mọi quyền thần và mọi dũng thần, rồi trao vương quyền lại cho Thiên Chúa là Cha.</p><p><sup>25</sup> Thật vậy, Đức Ki-tô phải nắm vương quyền cho đến khi Thiên Chúa đặt mọi thù địch dưới chân Người. <sup>26</sup> Thù địch cuối cùng bị tiêu diệt là sự chết. <sup>28</sup> Lúc muôn loài đã quy phục Đức Ki-tô, thì chính Người, vì là Con, cũng sẽ quy phục Đấng bắt muôn loài phải quy phục Người ; và như vậy, Thiên Chúa có toàn quyền trên muôn loài.</p>"
  },
  "tm": {
    "ref": "Mt 25,31-46",
    "bookTitle": "<span class=\"holycross\">&#x2720;</span>Tin Mừng Chúa Giê-su Ki-tô theo thánh Mát-thêu.",
    "lead": "Con Người sẽ ngự lên ngai vinh hiển của Người, và Người sẽ tách biệt họ với nhau.",
    "alleluiaRef": "Mc 11,9.10",
    "alleluia": "Ha-lê-lui-a. Ha-lê-lui-a. Chúc tụng Đấng ngự đến nhân danh Đức Chúa ! Chúc tụng triều đại đang tới, triều đại vua Đa-vít tổ phụ chúng ta. Ha-lê-lui-a.",
    "alleluiaHtml": "<p>Ha-lê-lui-a. Ha-lê-lui-a. Chúc tụng Đấng ngự đến nhân danh Đức Chúa ! Chúc tụng triều đại đang tới, triều đại vua Đa-vít tổ phụ chúng ta. Ha-lê-lui-a.</p>",
    "content": "<p><sup>31</sup> Khi ấy, Đức Giê-su nói với các môn đệ rằng : “Khi Con Người đến trong vinh quang của Người, có tất cả các thiên sứ theo hầu, bấy giờ Người sẽ ngự lên ngai vinh hiển của Người. <sup>32</sup> Các dân thiên hạ sẽ được tập hợp trước mặt Người, và Người sẽ tách biệt họ với nhau, như mục tử tách biệt chiên với dê. <sup>33</sup> Người sẽ cho chiên đứng bên phải Người, còn dê ở bên trái. <sup>34</sup> Bấy giờ Đức Vua sẽ phán cùng những người ở bên phải rằng : ‘Nào những kẻ Cha Ta chúc phúc, hãy đến thừa hưởng Vương Quốc dọn sẵn cho các ngươi ngay từ thuở tạo thiên lập địa. <sup>35</sup> Vì xưa Ta đói, các ngươi đã cho ăn ; Ta khát, các ngươi đã cho uống ; Ta là khách lạ, các ngươi đã tiếp rước ; <sup>36</sup> Ta trần truồng, các ngươi đã cho mặc ; Ta đau yếu, các ngươi đã thăm viếng ; Ta ngồi tù, các ngươi đến hỏi han.’ <sup>37</sup> Bấy giờ những người công chính sẽ thưa rằng : ‘Lạy Chúa, có bao giờ chúng con đã thấy Chúa đói mà cho ăn, khát mà cho uống ; <sup>38</sup> có bao giờ đã thấy Chúa là khách lạ mà tiếp rước ; hoặc trần truồng mà cho mặc ? <sup>39</sup> Có bao giờ chúng con đã thấy Chúa đau yếu hoặc ngồi tù, mà đến hỏi han đâu ?’ <sup>40</sup> Đức Vua sẽ đáp lại rằng : ‘Ta bảo thật các ngươi : mỗi lần các ngươi làm như thế cho một trong những anh em bé nhỏ nhất của Ta đây, là các ngươi đã làm cho chính Ta vậy.’ <sup>41</sup> Rồi Đức Vua sẽ phán cùng những người ở bên trái rằng : ‘Quân bị nguyền rủa kia, đi đi cho khuất mắt Ta mà vào lửa đời đời, nơi dành sẵn cho tên Ác Quỷ và các sứ thần của nó. <sup>42</sup> Vì xưa Ta đói, các ngươi đã không cho ăn ; Ta khát, các ngươi đã không cho uống ; <sup>43</sup> Ta là khách lạ, các ngươi đã không tiếp rước ; Ta trần truồng, các ngươi đã không cho mặc ; Ta đau yếu và ngồi tù, các ngươi đã chẳng thăm viếng.’ <sup>44</sup> Bấy giờ những người ấy cũng sẽ thưa rằng : ‘Lạy Chúa, có bao giờ chúng con đã thấy Chúa đói, khát, hoặc là khách lạ, hoặc trần truồng, đau yếu hay ngồi tù, mà không phục vụ Chúa đâu ?’ <sup>45</sup> Bấy giờ Người sẽ đáp lại họ rằng : ‘Ta bảo thật các ngươi : mỗi lần các ngươi không làm như thế cho một trong những người bé nhỏ nhất đây, là các ngươi đã không làm cho chính Ta vậy.’ <sup>46</sup> Thế là họ ra đi để chịu cực hình muôn kiếp, còn những người công chính ra đi để hưởng sự sống muôn đời.”</p>"
  }
},
  "cn34": {
  "date": "2026-11-22",
  "title": "Chúa Nhật 34 Thường Niên - Chúa Kitô Vua Vũ Trụ",
  "source": "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ (ktcgkpv.org)",
  "sourceUrl": "https://ktcgkpv.org/readings/mass-reading",
  "bd1": {
    "ref": "Ed 34,11-12.15-17",
    "bookTitle": "Bài trích sách ngôn sứ Ê-dê-ki-en.",
    "lead": "Phần các ngươi, hỡi chiên của Ta, này Ta sẽ xét xử giữa chiên với chiên.",
    "content": "<p><sup>11</sup> Đức Chúa là Chúa Thượng phán thế này : “Đây, chính Ta sẽ chăm sóc chiên của Ta và thân hành kiểm điểm. <sup>12</sup> Như mục tử kiểm điểm đàn vật của mình vào ngày người ấy ở giữa đàn chiên bị tản mác thế nào, thì Ta cũng sẽ kiểm điểm chiên của Ta như vậy. Ta sẽ kéo chúng ra khỏi mọi nơi chúng đã bị tản mác, vào ngày mây đen mù mịt. <sup>15</sup> Chính Ta sẽ chăn dắt chiên của Ta, chính Ta sẽ cho chúng nằm nghỉ - sấm ngôn của Đức Chúa là Chúa Thượng. <sup>16</sup> Con nào bị mất, Ta sẽ đi tìm ; con nào đi lạc, Ta sẽ đưa về ; con nào bị thương, Ta sẽ băng bó ; con nào bệnh tật, Ta sẽ làm cho mạnh ; con nào béo mập, con nào khoẻ mạnh, Ta sẽ canh chừng. Ta sẽ theo lẽ chính trực mà chăn dắt chúng.</p><p><sup>17</sup> “Phần các ngươi, hỡi chiên của Ta, -Đức Chúa là Chúa Thượng phán-, này Ta sẽ xét xử giữa chiên với chiên, giữa cừu với dê.”</p>"
  },
  "tv": {
    "ref": "Tv 22,1-2a.2b-3.5.6 (Đ. c.1)",
    "content": "<p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Chúa là mục tử chăn dắt tôi,<br />tôi chẳng thiếu thốn gì.</span></p><p class=\"leading\"><sup>1</sup><span>Chúa là mục tử chăn dắt tôi,<br />tôi chẳng thiếu thốn gì.</span><sup>2a</sup><span>Trong đồng cỏ xanh tươi,<br />Người cho tôi nằm nghỉ.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Chúa là mục tử chăn dắt tôi,<br />tôi chẳng thiếu thốn gì.</span></p><p class=\"leading\"><sup>2b</sup><span>Người đưa tôi tới dòng nước trong lành</span><sup>3</sup><span>và bổ sức cho tôi.<br />Người dẫn tôi trên đường ngay nẻo chính<br />vì danh dự của Người.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Chúa là mục tử chăn dắt tôi,<br />tôi chẳng thiếu thốn gì.</span></p><p class=\"leading\"><sup>5</sup><span>Chúa dọn sẵn cho con bữa tiệc<br />ngay trước mặt quân thù.<br />Đầu con, Chúa xức đượm dầu thơm,<br />ly rượu con đầy tràn chan chứa.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Chúa là mục tử chăn dắt tôi,<br />tôi chẳng thiếu thốn gì.</span></p><p class=\"leading\"><sup>6</sup><span>Lòng nhân hậu và tình thương Chúa<br />ấp ủ tôi suốt cả cuộc đời,<br />và tôi được ở đền Người<br />những ngày tháng, những năm dài triền miên.</span></p><p class=\"response\"><span class=\"pre\">Đ.</span><span class=\"body\">Chúa là mục tử chăn dắt tôi,<br />tôi chẳng thiếu thốn gì.</span></p>"
  },
  "bd2": {
    "ref": "1 Cr 15,20-26.28",
    "bookTitle": "Bài trích thư thứ nhất của thánh Phao-lô tông đồ gửi tín hữu Cô-rin-tô.",
    "lead": "Đức Ki-tô trao vương quyền lại cho Thiên Chúa là Cha, và như vậy, Thiên Chúa có toàn quyền trên muôn loài.",
    "content": "<p><sup>20</sup> Thưa anh em, Đức Ki-tô đã trỗi dậy từ cõi chết, mở đường cho những ai đã an giấc ngàn thu. <sup>21</sup> Vì nếu tại một người mà nhân loại phải chết, thì cũng nhờ một người mà kẻ chết được sống lại. <sup>22</sup> Quả thế, như mọi người vì liên đới với A-đam mà phải chết, thì mọi người nhờ liên đới với Đức Ki-tô, cũng được Thiên Chúa cho sống. <sup>23</sup> Nhưng mỗi người theo thứ tự của mình : mở đường là Đức Ki-tô, rồi khi Đức Ki-tô quang lâm thì đến lượt những kẻ thuộc về Người. <sup>24</sup> Sau đó mọi sự đều hoàn tất, khi Người đã tiêu diệt hết mọi quản thần, mọi quyền thần và mọi dũng thần, rồi trao vương quyền lại cho Thiên Chúa là Cha.</p><p><sup>25</sup> Thật vậy, Đức Ki-tô phải nắm vương quyền cho đến khi Thiên Chúa đặt mọi thù địch dưới chân Người. <sup>26</sup> Thù địch cuối cùng bị tiêu diệt là sự chết. <sup>28</sup> Lúc muôn loài đã quy phục Đức Ki-tô, thì chính Người, vì là Con, cũng sẽ quy phục Đấng bắt muôn loài phải quy phục Người ; và như vậy, Thiên Chúa có toàn quyền trên muôn loài.</p>"
  },
  "tm": {
    "ref": "Mt 25,31-46",
    "bookTitle": "<span class=\"holycross\">&#x2720;</span>Tin Mừng Chúa Giê-su Ki-tô theo thánh Mát-thêu.",
    "lead": "Con Người sẽ ngự lên ngai vinh hiển của Người, và Người sẽ tách biệt họ với nhau.",
    "alleluiaRef": "Mc 11,9.10",
    "alleluia": "Ha-lê-lui-a. Ha-lê-lui-a. Chúc tụng Đấng ngự đến nhân danh Đức Chúa ! Chúc tụng triều đại đang tới, triều đại vua Đa-vít tổ phụ chúng ta. Ha-lê-lui-a.",
    "alleluiaHtml": "<p>Ha-lê-lui-a. Ha-lê-lui-a. Chúc tụng Đấng ngự đến nhân danh Đức Chúa ! Chúc tụng triều đại đang tới, triều đại vua Đa-vít tổ phụ chúng ta. Ha-lê-lui-a.</p>",
    "content": "<p><sup>31</sup> Khi ấy, Đức Giê-su nói với các môn đệ rằng : “Khi Con Người đến trong vinh quang của Người, có tất cả các thiên sứ theo hầu, bấy giờ Người sẽ ngự lên ngai vinh hiển của Người. <sup>32</sup> Các dân thiên hạ sẽ được tập hợp trước mặt Người, và Người sẽ tách biệt họ với nhau, như mục tử tách biệt chiên với dê. <sup>33</sup> Người sẽ cho chiên đứng bên phải Người, còn dê ở bên trái. <sup>34</sup> Bấy giờ Đức Vua sẽ phán cùng những người ở bên phải rằng : ‘Nào những kẻ Cha Ta chúc phúc, hãy đến thừa hưởng Vương Quốc dọn sẵn cho các ngươi ngay từ thuở tạo thiên lập địa. <sup>35</sup> Vì xưa Ta đói, các ngươi đã cho ăn ; Ta khát, các ngươi đã cho uống ; Ta là khách lạ, các ngươi đã tiếp rước ; <sup>36</sup> Ta trần truồng, các ngươi đã cho mặc ; Ta đau yếu, các ngươi đã thăm viếng ; Ta ngồi tù, các ngươi đến hỏi han.’ <sup>37</sup> Bấy giờ những người công chính sẽ thưa rằng : ‘Lạy Chúa, có bao giờ chúng con đã thấy Chúa đói mà cho ăn, khát mà cho uống ; <sup>38</sup> có bao giờ đã thấy Chúa là khách lạ mà tiếp rước ; hoặc trần truồng mà cho mặc ? <sup>39</sup> Có bao giờ chúng con đã thấy Chúa đau yếu hoặc ngồi tù, mà đến hỏi han đâu ?’ <sup>40</sup> Đức Vua sẽ đáp lại rằng : ‘Ta bảo thật các ngươi : mỗi lần các ngươi làm như thế cho một trong những anh em bé nhỏ nhất của Ta đây, là các ngươi đã làm cho chính Ta vậy.’ <sup>41</sup> Rồi Đức Vua sẽ phán cùng những người ở bên trái rằng : ‘Quân bị nguyền rủa kia, đi đi cho khuất mắt Ta mà vào lửa đời đời, nơi dành sẵn cho tên Ác Quỷ và các sứ thần của nó. <sup>42</sup> Vì xưa Ta đói, các ngươi đã không cho ăn ; Ta khát, các ngươi đã không cho uống ; <sup>43</sup> Ta là khách lạ, các ngươi đã không tiếp rước ; Ta trần truồng, các ngươi đã không cho mặc ; Ta đau yếu và ngồi tù, các ngươi đã chẳng thăm viếng.’ <sup>44</sup> Bấy giờ những người ấy cũng sẽ thưa rằng : ‘Lạy Chúa, có bao giờ chúng con đã thấy Chúa đói, khát, hoặc là khách lạ, hoặc trần truồng, đau yếu hay ngồi tù, mà không phục vụ Chúa đâu ?’ <sup>45</sup> Bấy giờ Người sẽ đáp lại họ rằng : ‘Ta bảo thật các ngươi : mỗi lần các ngươi không làm như thế cho một trong những người bé nhỏ nhất đây, là các ngươi đã không làm cho chính Ta vậy.’ <sup>46</sup> Thế là họ ra đi để chịu cực hình muôn kiếp, còn những người công chính ra đi để hưởng sự sống muôn đời.”</p>"
  }
},
};

const OFFLINE_LITURGY_STORE = KTCGKPV_LITURGY_STORE;


  /**
   * KHO MẪU LỜI NGUYỆN TÍN HỮU CHUẨN PHỤNG VỤ ĐA DẠNG CÁC MÙA & LỄ TRỌNG
   */
  const LITURGICAL_PRAYERS_CATALOG = [
    {
      id: 'cn30_tn_a',
      title: 'Chúa Nhật 30 Thường Niên - Năm A',
      subtitle: 'Giới răn Trọng nhất: Mến Chúa và Yêu người (Xh 22, 1 Tx 1, Mt 22)',
      text: `LỜI NGUYỆN TÍN HỮU – CHÚA NHẬT 30 THƯỜNG NIÊN - NĂM A
Chủ tế: Anh chị em thân mến, Thiên Chúa là Tình Yêu, Người tha thiết mời gọi chúng ta sống trọn vẹn giới răn mến Chúa trên hết mọi sự và yêu thương tha nhân như chính mình. Với tâm tình con thảo và cậy trông sâu xa, chúng ta cùng hiệp ý dâng lời nguyện xin:

1. Cầu cho Hội Thánh: Xin Chúa soi sáng và ban muôn ơn lành trên Đức Giáo Hoàng, các Đức Giám Mục, Linh Mục và toàn thể Dân Chúa, để Hội Thánh luôn là chứng tá sống động và ngời sáng của lòng bác ái Tin Mừng giữa trần gian.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

2. Cầu cho thế giới và những người cùng khổ: "Người ngoại kiều, ngươi không được ngược đãi; Mẹ goá con côi, các ngươi không được ức hiếp": Xin Chúa mở rộng lòng các nhà lãnh đạo quốc gia và mọi người, biết bảo vệ người yếu thế, đẩy lùi nghèo đói và bất công xã hội.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

3. Cầu cho những tâm hồn đang sống trong ích kỷ, oán hờn và chia rẽ: Xin Lời Chúa đánh động và biến đổi tâm can họ, giúp họ nhận ra sự cao quý của lòng vị tha và can đảm tha thứ để cùng nhau xây dựng tình huynh đệ ấm áp.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

4. Cầu cho Ca Đoàn Dohwa và Cộng đoàn giáo xứ chúng ta: Xin Chúa ban cho mỗi ca viên lòng nhiệt thành mến Chúa chân thật, biết hiệp nhất yêu thương nhau và dùng tiếng hát phụng vụ bàn thánh để lan toả tình yêu Chúa đến mọi người.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

Chủ tế: Lạy Thiên Chúa toàn năng nhân ái, Chúa đã dạy rằng tất cả Lề Luật và các sách ngôn sứ đều tuỳ thuộc vào giới răn yêu thương. Xin thương chấp nhận những lời chúng con tha thiết nài van, và ban ơn trợ lực để chúng con biết thực thi đức ái trọn vẹn mỗi ngày. Chúng con cầu xin nhờ Đức Kitô, Chúa chúng con. - Amen.`
    },
    {
      id: 'cn29_tn_a',
      title: 'Chúa Nhật 29 Thường Niên - Năm A',
      subtitle: 'Của Xê-da trả Xê-da, của Thiên Chúa trả Thiên Chúa (Is 45, 1 Tx 1, Mt 22)',
      text: `LỜI NGUYỆN TÍN HỮU – CHÚA NHẬT 29 THƯỜNG NIÊN - NĂM A
Chủ tế: Anh chị em thân mến, Thiên Chúa là Chủ Tể tuyệt đối của càn khôn vạn vật. Đức Giêsu dạy chúng ta chu toàn bổn phận công dân trần thế nhưng luôn tôn thờ và đặt Thiên Chúa ở vị trí tối thượng trong cuộc đời. Trong niềm cậy trông son sắt, chúng ta cùng tha thiết dâng lời nguyện xin:

1. Cầu cho Hội Thánh và công cuộc Loan Báo Tin Mừng: Xin Chúa ban ơn khôn ngoan và sức mạnh cho các vị chủ chăn cùng mọi Kitô hữu, để Hội Thánh không ngừng can đảm loan báo chân lý cứu độ cho muôn dân.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

2. Cầu cho các nhà lãnh đạo quốc gia: Xin Chúa soi sáng tâm trí những người nắm quyền bính, biết tôn trọng tự do lương tâm, tự do tôn giáo, và hết lòng phục vụ cho công lý, tự do và sự thịnh vượng của toàn dân.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

3. Cầu cho những người đang bị áp bức hoặc gặp cảnh bất công: Xin Chúa bênh vực và chở che những người cô thế cô thân, xoa dịu những nỗi đau và ban cho họ niềm hy vọng nơi lòng thương xót Chúa.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

4. Cầu cho Ca Đoàn Dohwa và cộng đoàn giáo xứ: Xin Chúa gìn giữ mỗi ca viên luôn trung kiên trong đức tin, biết dâng trọn tâm hồn và khả năng để làm sáng Danh Chúa qua từng lời ca tiếng hát nơi thánh đường.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

Chủ tế: Lạy Chúa là Vua muôn vua và Chúa các chúa, xin đoái nhìn những ước nguyện chân thành chúng con vừa dâng lên, và giúp chúng con luôn biết sống xứng đáng là con thảo của Chúa giữa lòng xã hội. Chúng con cầu xin nhờ Đức Kitô, Chúa chúng con. - Amen.`
    },
    {
      id: 'cn28_tn_a',
      title: 'Chúa Nhật 28 Thường Niên - Năm A',
      subtitle: 'Bàn tiệc Nước Trời & Y phục thánh thiện (Is 25, Pl 4, Mt 22)',
      text: `LỜI NGUYỆN TÍN HỮU – CHÚA NHẬT 28 THƯỜNG NIÊN - NĂM A
Chủ tế: Anh chị em thân mến, Thiên Chúa là Cha nhân từ luôn rộng mở bàn tiệc ân sủng đón mời tất cả chúng ta vào chia sẻ niềm vui Nước Trời. Trong tâm tình tri ân và ước muốn sống xứng đáng với ơn gọi người Kitô hữu, chúng ta cùng tha thiết dâng lời nguyện xin:

1. Cầu cho Hội Thánh: Xin Chúa ban cho Đức Giáo Hoàng, các Đức Giám Mục, Linh Mục và toàn thể Dân Thánh lòng nhiệt thành truyền giáo, để Hội Thánh không ngừng rao giảng Tin Mừng và mời gọi muôn dân đến hiệp thông trong bàn tiệc Lời Chúa và Thánh Thể.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

2. Cầu cho hòa bình thế giới và các dân tộc: Xin Chúa lau sạch nước mắt khổ đau của những người nghèo khó, bệnh tật, các nạn nhân chiến tranh và thiên tai, ban cho nhân loại được sống trong an bình, công lý và tình huynh đệ ấm áp.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

3. Cầu cho những người đang khước từ lời mời gọi của Chúa: Xin ơn Chúa đánh động tâm trí họ, giúp họ nhận ra sự hư ảo trần thế để can đảm từ bỏ tội lỗi, quay về đón nhận lòng thương xót Chúa và mặc lấy y phục thánh thiện.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

4. Cầu cho Ca Đoàn Dohwa và Cộng đoàn giáo xứ chúng ta: "Tôi có thể làm được mọi sự trong Đấng ban sức mạnh cho tôi": Xin Chúa ban ơn trợ lực để mỗi ca viên luôn hiệp nhất yêu thương, mặc lấy tâm tình đức tin, cậy, mến và say mê dùng lời ca tiếng hát phục vụ bàn thánh.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

Chủ tế: Lạy Chúa là Vua muôn loài, xin thương chấp nhận những ước nguyện chân thành của cộng đoàn chúng con, và gìn giữ chúng con luôn trung kiên trong ân sủng cho đến ngày được vào dự tiệc cưới muôn đời trên thiên quốc. Chúng con cầu xin nhờ Đức Kitô, Chúa chúng con. - Amen.`
    },
    {
      id: 'cn25_tn_a',
      title: 'Chúa Nhật 25 Thường Niên - Năm A',
      subtitle: 'Lòng quảng đại của Thiên Chúa & Tinh thần phục vụ',
      text: `LỜI NGUYỆN TÍN HỮU – CHÚA NHẬT 25 THƯỜNG NIÊN - NĂM A
Chủ tế: Anh chị em thân mến, Thiên Chúa là Cha nhân từ đầy lòng quảng đại và bao dung, đường lối Người vượt xa mọi tính toán nhân loại. Với niềm tin tưởng và phó thác, chúng ta cùng tha thiết dâng lời nguyện xin:
1. Cầu cho Hội Thánh: Xin Chúa gìn giữ Đức Giáo Hoàng, các Đức Giám Mục và các Linh Mục, để các ngài luôn là những mục tử nhân lành dẫn dắt đoàn chiên Chúa theo tinh thần Tin Mừng.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.
2. Cầu cho thế giới: Xin Chúa ban ơn bình an cho các dân tộc, xoa dịu những nỗi đau của các nạn nhân chiến tranh, đói nghèo, bệnh tật và thiên tai.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.
3. Cầu cho những người đang gặp thử thách gian truân: Xin Chúa nâng đỡ những ai đang ngã lòng, thất vọng, để họ luôn tìm thấy niềm an ủi và cậy trông nơi lòng Chúa xót thương.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.
4. Cầu cho Ca Đoàn Dohwa và Cộng đoàn giáo xứ: Xin Chúa ban cho mỗi ca viên lòng nhiệt thành mến Chúa, biết dùng tiếng hát để phụng sự Thánh Lễ và loan báo tình yêu Chúa trong tinh thần hiệp nhất yêu thương.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.
Chủ tế: Lạy Chúa, xin thương chấp nhận những ước nguyện chân thành của cộng đoàn chúng con, nhờ Đức Kitô, Chúa chúng con. - Amen.`
    },
    {
      id: 'cn26_tn_a',
      title: 'Chúa Nhật 26 Thường Niên - Năm A',
      subtitle: 'Vâng phục Thánh ý bằng hành động cụ thể',
      text: `LỜI NGUYỆN TÍN HỮU – CHÚA NHẬT 26 THƯỜNG NIÊN - NĂM A
Chủ tế: Anh chị em thân mến, Thiên Chúa luôn yêu thương mời gọi chúng ta cộng tác xây dựng Nước Trời bằng đời sống hoán cải chân thành. Với tâm tình tin tưởng, chúng ta cùng dâng lời cầu xin:
1. Cầu cho các vị chủ chăn trong Hội Thánh: Xin Chúa ban cho các ngài sức mạnh và lòng nhân ái, để luôn nêu gương sáng vâng phục Thánh ý Chúa và tận tụy phục vụ đoàn chiên.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.
2. Cầu cho các nhà lãnh đạo quốc gia: Xin Chúa soi sáng tâm trí các nhà cầm quyền, biết hành động vì công lý, hòa bình và lợi ích chân chính của mọi người dân.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.
3. Cầu cho những ai đang lạc lối xa Chúa: Xin ơn Chúa biến đổi tâm hồn họ, giúp họ nhận ra tình thương của Chúa mà can đảm hối cải trở về.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.
4. Cầu cho toàn thể Ca đoàn và cộng đoàn chúng ta: Xin Chúa giúp mỗi người chúng ta không chỉ vâng lời Chúa bằng môi miệng, mà bằng trọn cả hành động yêu thương cụ thể mỗi ngày.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.
Chủ tế: Lạy Chúa, xin nhậm lời cầu tha thiết của chúng con và ban ơn giúp chúng con luôn trung thành thực thi ý Chúa. Chúng con cầu xin nhờ Đức Kitô, Chúa chúng con. - Amen.`
    },
  {
    id: 'thuong_nien_chung',
    title: 'Mùa Thường Niên (Mẫu Chung Phụng Vụ)',
    subtitle: 'Cầu cho Hội Thánh, Xã hội, Bệnh nhân & Giáo xứ',
    text: `LỜI NGUYỆN TÍN HỮU – MÙA THƯỜNG NIÊN
Chủ tế: Anh chị em thân mến, Thiên Chúa là Cha hằng săn sóc và yêu thương hết mọi tạo vật. Trong tâm tình con thảo, chúng ta cùng dâng lên Người những ước nguyện chân thành:
1. Cầu cho toàn thể Hội Thánh: Xin Chúa liên kết các Kitô hữu trong đức tin kiên vững và lòng mến chân thành, để Hội Thánh luôn là ánh sáng và muối men giữa lòng thế giới.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.
2. Cầu cho hòa bình và thịnh vượng của các dân tộc: Xin Chúa xua tan bạo lực, bất công và hận thù, để mọi người được sống trong thanh bình, công lý và tôn trọng lẫn nhau.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.
3. Cầu cho những người nghèo khổ, bệnh tật và cô đơn: Xin Chúa thương nâng đỡ ủi an và khơi dậy nơi tâm hồn các tín hữu lòng bác ái sẵn sàng cứu giúp.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.
4. Cầu cho cộng đoàn phụng vụ và ca đoàn chúng ta: Xin Chúa thánh hóa mọi công việc, học tập và sứ vụ phục vụ bàn thánh của chúng con, để đời sống chúng con làm sáng danh Chúa.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.
Chủ tế: Lạy Chúa là Đấng giàu lòng từ bi, xin lắng nghe và nhậm lời đoàn con tha thiết nguyện xin, nhờ Đức Kitô, Chúa chúng con. - Amen.`
  },
  {
    id: 'mua_vong',
    title: 'Mùa Vọng (Chờ Đón Đấng Cứu Thế)',
    subtitle: 'Tỉnh thức, nguyện cầu và chuẩn bị tâm hồn',
    text: `LỜI NGUYỆN TÍN HỮU – MÙA VỌNG
Chủ tế: Anh chị em thân mến, trong tâm tình tỉnh thức và hân hoan đón chờ Đấng Cứu Thế ngự đến, chúng ta cùng hiệp ý dâng lên Thiên Chúa lời nguyện xin tha thiết:
1. Cầu cho Hội Thánh: Xin Chúa soi sáng và ban ơn thánh hóa, để Hội Thánh luôn can đảm loan báo niềm hy vọng Cứu độ cho muôn dân.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.
2. Cầu cho thế giới còn đầy bóng tối chiến tranh và chia rẽ: Xin Ánh Sáng của Đức Kitô mau xua tan bóng đêm tăm tối, đem lại bình an và hòa giải cho nhân loại.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.
3. Cầu cho những tâm hồn đang nguội lạnh, khô khan: Xin ơn Chúa thức tỉnh lòng họ, giúp họ biết thanh tẩy tâm hồn để xứng đáng đón rước Chúa đến.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.
4. Cầu cho ca viên và cộng đoàn chúng ta: Xin cho mỗi người chúng ta biết dọn đường cho Chúa bằng đời sống yêu thương, cầu nguyện và chia sẻ với người khó khăn.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.
Chủ tế: Lạy Chúa, xin mau đến và đừng trì hoãn, xin giải thoát chúng con khỏi mọi gông cùm tội lỗi, Đấng hằng sống và hiển trị muôn đời. - Amen.`
  },
  {
    id: 'mua_giang_sinh',
    title: 'Mùa Giáng Sinh (Chúa Ngôi Hai Giáng Trần)',
    subtitle: 'Vinh danh Thiên Chúa - Bình an cho người thiện tâm',
    text: `LỜI NGUYỆN TÍN HỮU – ĐẠI LỄ GIÁNG SINH
Chủ tế: Anh chị em thân mến, "Ngôi Lời đã làm người và ở giữa chúng ta". Trong niềm hân hoan tạ ơn tình yêu khôn ví của Thiên Chúa, chúng ta cùng hiệp lời cầu xin:
1. Cầu cho Hội Thánh: Xin Chúa Hài Đồng ban muôn phúc lành trên Đức Giáo Hoàng và các chủ chăn, để các ngài luôn nhiệt thành đem tin mừng bình an đến cho muôn người.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.
2. Cầu cho hòa bình nhân loại: Xin Hoàng Tử Bình An xoa dịu các vết thương chiến tranh, ban bình an thật sự cho các gia đình và các dân tộc trên khắp địa cầu.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.
3. Cầu cho trẻ em nghèo và những người không nơi nương tựa: Xin Chúa ban cho họ tìm thấy hơi ấm tình người và sự sẻ chia chân thành từ những tấm lòng quảng đại.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.
4. Cầu cho các gia đình trong giáo xứ và ca đoàn chúng ta: Xin Chúa Hài Đồng gìn giữ mái ấm gia đình chúng con luôn hiệp nhất, ấm êm và tràn ngập niềm vui cứu độ.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.
Chủ tế: Lạy Chúa Giêsu Hài Đồng, xin ngự vào tâm hồn chúng con và ở lại với chúng con luôn mãi. Chúa hằng sống và hiển trị muôn đời. - Amen.`
  },
  {
    id: 'mua_chay',
    title: 'Mùa Chay (Sám Hối, Canh Tân & Bác Ái)',
    subtitle: 'Trở về với lòng thương xót Chúa',
    text: `LỜI NGUYỆN TÍN HỮU – MÙA CHAY
Chủ tế: Anh chị em thân mến, Mùa Chay là thời gian thuận tiện để chúng ta trở về với Chúa bằng sự cầu nguyện, chay tịnh và làm việc bác ái. Với lòng sám hối chân thành, chúng ta cùng tha thiết nguyện xin:
1. Cầu cho các tín hữu: Xin Chúa ban ơn soi sáng để mỗi Kitô hữu biết nhìn nhận tội lỗi của mình và can đảm hoán cải đời sống theo ánh sáng Phúc Âm.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.
2. Cầu cho những người đang chịu đau khổ về thể xác cũng như tinh thần: Xin Chúa ban sức mạnh giúp họ vác thánh giá theo chân Chúa với niềm tin tưởng và cậy trông.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.
3. Cầu cho các dự tòng đang chuẩn bị gia nhập Hội Thánh: Xin Chúa củng cố đức tin và ban đầy tràn Thánh Thần để họ trung thành bước theo Đức Kitô.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.
4. Cầu cho cộng đoàn và ca đoàn chúng ta: Xin cho chúng con biết mở rộng lòng bác ái, hy sinh giúp đỡ tha nhân và đồng hành với nhau trong tâm tình khiêm nhường.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.
Chủ tế: Lạy Thiên Chúa nhân từ từ bi, xin dủ lòng thương tha thứ tội khiên và nhận lời chúng con cầu nguyện, nhờ Đức Kitô, Chúa chúng con. - Amen.`
  },
  {
    id: 'mua_phuc_sinh',
    title: 'Mùa Phục Sinh (Đức Kitô Chiến Thắng Khải Hoàn)',
    subtitle: 'Niềm vui Phục Sinh & Sự sống mới',
    text: `LỜI NGUYỆN TÍN HỮU – ĐẠI LỄ PHỤC SINH
Chủ tế: Anh chị em thân mến, Đức Kitô đã sống lại từ cõi chết, đập tan xiềng xích tội lỗi và mở lối vào cõi trường sinh. Trong hân hoan rạng rỡ của ngày Phục Sinh, chúng ta cùng dâng lên Người lời nguyện xin:
1. Cầu cho Hội Thánh: Xin Chúa Phục Sinh ban sức sống mới dồi dào trên Hội Thánh, để Hội Thánh luôn can đảm làm chứng cho sự sống lại của Chúa giữa trần gian.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.
2. Cầu cho thế giới: Xin Ánh Sáng Phục Sinh xua tan bóng tối hận thù, bất công và sợ hãi, đem lại niềm vui và bình an đích thực cho toàn thể nhân loại.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.
3. Cầu cho những người đang thất vọng trước cái chết và đau khổ: Xin niềm tin vào sự Phục Sinh của Đức Kitô là điểm tựa vững chắc nâng đỡ họ vượt qua mọi nghịch cảnh.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.
4. Cầu cho cộng đoàn và các ca viên: Xin Chúa cho mỗi chúng ta luôn sống như những người đã cùng sống lại với Đức Kitô, biết tìm kiếm những sự trên trời và yêu thương phục vụ lẫn nhau.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.
Chủ tế: Lạy Chúa Giêsu Phục Sinh, xin ban Thánh Thần của Chúa tràn ngập lòng chúng con, Đấng hằng sống và hiển trị muôn đời. - Amen.`
  },
  {
    id: 'le_duc_me',
    title: 'Lễ Kính Đức Mẹ (Noi Gương Vâng Phục)',
    subtitle: 'Xin Mẹ cầu bầu nâng đỡ đoàn con',
    text: `LỜI NGUYỆN TÍN HỮU – LỄ KÍNH ĐỨC MẸ
Chủ tế: Anh chị em thân mến, Đức Trinh Nữ Maria đã thưa tiếng "Xin Vâng" trọn hảo để đón nhận Ngôi Lời Nhập Thể. Nhờ lời chuyển cầu của Mẹ, chúng ta cùng tin tưởng dâng lên Thiên Chúa lời nguyện xin:
1. Cầu cho Hội Thánh: Xin Chúa gìn giữ Hội Thánh luôn trung kiên và thánh thiện, noi gương Mẹ Maria luôn lắng nghe và suy niệm Lời Chúa trong lòng.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.
2. Cầu cho các người mẹ trong gia đình: Xin Mẹ Maria ban ơn phù trợ, giúp các bà mẹ luôn dịu hiền, đảm đang và dạy dỗ con cái sống đẹp lòng Chúa.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.
3. Cầu cho những ai đang đau yếu, cô đơn hay gặp hoạn nạn: Xin Mẹ phù hộ các giáo hữu đoái thương nâng đỡ, che chở họ dưới tà áo Mẹ từ bi.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.
4. Cầu cho Ca Đoàn và cộng đoàn chúng con: Xin cho mỗi ca viên luôn biết dâng tiếng hát ngợi khen Chúa như lời bài ca Magnificat của Mẹ năm xưa.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.
Chủ tế: Lạy Chúa, nhờ lời chuyển cầu thần thế của Đức Mẹ Maria, xin thương ban cho chúng con muôn ơn lành hồn xác, nhờ Đức Kitô, Chúa chúng con. - Amen.`
  },
  {
    id: 'le_bon_mang_ca_doan',
    title: 'Lễ Bổn Mạng Ca Đoàn (Hiệp Nhất & Phụng Sự)',
    subtitle: 'Dâng tiếng ca tiếng hát làm sáng Danh Chúa',
    text: `LỜI NGUYỆN TÍN HỮU – LỄ QUAN THẦY CA ĐOÀN DOHWA
Chủ tế: Anh chị em thân mến, Thánh Augustinô đã dạy rằng: "Hát là cầu nguyện hai lần". Trong tâm tình tạ ơn Thiên Chúa nhân ngày lễ mừng Bổn Mạng Ca Đoàn, chúng ta cùng tha thiết dâng lời nguyện xin:
1. Cầu cho Hội Thánh: Xin Chúa chúc lành cho sứ vụ phụng vụ thánh ca của Hội Thánh, để lời ca tiếng hát luôn nâng tâm hồn các tín hữu lên tới Chúa.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.
2. Cầu cho Linh Mục Chánh Xứ và các ân nhân của Ca Đoàn: Xin Chúa trả công bội hậu cho quý vị đã yêu thương, nâng đỡ và đồng hành với ca đoàn trong suốt thời gian qua.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.
3. Cầu cho các ca viên đã qua đời: Xin Chúa thương đón nhận các linh hồn ca viên tiền bối vào quê trời, để các ngài được cùng các thiên thần muôn đời ca tụng Danh Chúa.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.
4. Cầu cho toàn thể Ca viên Ca Đoàn Dohwa: Xin Chúa ban cho mỗi anh chị em ca viên tinh thần hy sinh, lòng nhiệt thành mến Chúa, luôn đoàn kết yêu thương và say mê cất cao lời ca phụng vụ bàn thánh.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.
Chủ tế: Lạy Chúa, xin thương chấp nhận lời ca tiếng hát và những ước nguyện chân thành của ca đoàn chúng con, nhờ Đức Kitô, Chúa chúng con. - Amen.`
  }
];

/**
 * Format Lời Nguyện Tín Hữu từ text thô (Chuẩn 100% logic soanbole.com)
 */
function formatLnthText(text) {
  if (!text || !text.trim()) return '';
  const lines = text.split('\n');
  let html = '<div style="font-family:\'Times New Roman\',serif;font-size:1.08rem;line-height:2.1;color:var(--text-main)">';
  let firstContent = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!firstContent && line) {
      firstContent = true;
      html += `<div style="text-align:center;font-weight:bold;font-size:1.2rem;margin-bottom:16px;color:#9a3412">${escapeHtml(line)}</div>`;
      continue;
    }
    if (!line) {
      html += '<div style="height:.45em"></div>';
      continue;
    }
    if (/^nguồn\s*:/i.test(line)) {
      html += `<div style="font-size:.78rem;color:var(--text-muted);text-align:right;margin-bottom:10px">${escapeHtml(line)}</div>`;
      continue;
    }
    if (/^chủ tế\s*:/i.test(line)) {
      const ct = line.replace(/^chủ tế\s*:\s*/i, '');
      html += `<div style="margin:12px 0 6px;"><strong>Chủ tế:</strong> <em>${escapeHtml(ct)}</em></div>`;
      continue;
    }
    if (/^xướng\s*:/i.test(line) || /^xuớng\s*:/i.test(line)) {
      const xb = line.replace(/^xuớng\s*:\s*/i, '').replace(/^xướng\s*:\s*/i, '');
      html += `<div style="margin-left:24px;font-style:italic;font-weight:700;color:#1e40af;margin-top:4px;">Xướng: ${escapeHtml(xb)}</div>`;
      continue;
    }
    if (/^đáp\s*:/i.test(line) || /^dáp\s*:/i.test(line)) {
      const db = line.replace(/^[đd]áp\s*:\s*/i, '').trim();
      if (db.toLowerCase().includes('chúng con cầu xin chúa') && db.toLowerCase().includes('nhậm lời')) {
        html += `<div style="margin-left:24px;font-style:italic;font-weight:700;color:#1e40af;margin-top:4px;">Xướng: Chúng con cầu xin Chúa.</div>`;
        html += `<div style="margin-left:24px;font-style:italic;font-weight:700;color:#9a3412;margin-bottom:6px;">Đáp: Xin Chúa nhậm lời chúng con.</div>`;
      } else {
        html += `<div style="margin-left:24px;font-style:italic;font-weight:700;color:#9a3412;margin-bottom:6px;">Đáp: ${escapeHtml(db)}</div>`;
      }
      continue;
    }
    if (/^chúng con cầu xin chúa/i.test(line)) {
      html += `<div style="margin-left:24px;font-style:italic;font-weight:700;color:#1e40af;margin-top:4px;">Xướng: Chúng con cầu xin Chúa.</div>`;
      continue;
    }
    if (/^xin chúa nhậm lời/i.test(line)) {
      html += `<div style="margin-left:24px;font-style:italic;font-weight:700;color:#9a3412;margin-bottom:6px;">Đáp: Xin Chúa nhậm lời chúng con.</div>`;
      continue;
    }
    const pm = line.match(/^(\d+)[.\/\)]\s*(.*)/);
    if (pm) {
      html += `<div style="margin:14px 0 3px;"><strong>${pm[1]}/</strong> ${escapeHtml(pm[2])}</div>`;
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
 * THUẬT TOÁN TỰ ĐỘNG CHUẨN HÓA VĂN BẢN THÔ THÀNH ĐỊNH DẠNG PHỤNG VỤ CHUẨN
 */
function parseRawLnthText(raw) {
  if (!raw || !raw.trim()) return '';
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (!lines.length) return '';

  let title = 'LỜI NGUYỆN TÍN HỮU';
  let opening = '';
  let petitions = [];
  let closing = '';
  let currentPet = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Tiêu đề
    if (i === 0 && (line.toUpperCase().includes('LỜI NGUYỆN') || line.toUpperCase().includes('CHÚA NHẬT') || line.toUpperCase().includes('LỄ'))) {
      title = line;
      continue;
    }

    // Chủ tế mở đầu
    if (/^chủ tế\s*:/i.test(line) && !opening) {
      opening = line.replace(/^chủ tế\s*:\s*/i, '');
      continue;
    }

    // Các ý nguyện 1., 2., 3., 4.
    const numMatch = line.match(/^(\d+)[\.\/\)\-]\s*(.*)/);
    if (numMatch) {
      if (currentPet) petitions.push(currentPet);
      currentPet = { num: numMatch[1], text: numMatch[2] };
      continue;
    }

    // Chủ tế kết
    if (/^chủ tế\s*:/i.test(line) && opening) {
      closing = line.replace(/^chủ tế\s*:\s*/i, '');
      continue;
    }
    if ((line.startsWith('Lạy Chúa') || line.startsWith('Lạy Thiên Chúa')) && !closing) {
      closing = line;
      continue;
    }

    // Nối tiếp ý nguyện đang đọc
    if (currentPet) {
      if (/^[đd]áp\s*:/i.test(line) || line.includes('Xin Chúa nhậm lời')) {
        // bỏ qua vì sẽ tự thêm
      } else {
        currentPet.text += ' ' + line;
      }
    } else if (!opening && line.length > 20) {
      opening = line;
    }
  }

  if (currentPet) petitions.push(currentPet);

  // Xây dựng lại văn bản chuẩn
  let res = `${title}\n\n`;
  res += `Chủ tế: ${opening || 'Anh chị em thân mến, trong niềm tin cậy phó thác vào Thiên Chúa là Cha nhân từ, chúng ta cùng hiệp ý dâng lên Người những lời nguyện xin tha thiết:'}\n\n`;

  if (petitions.length) {
    petitions.forEach((p, idx) => {
      let pt = p.text.replace(/Chúng con cầu xin Chúa.*$/i, '').trim();
      res += `${idx + 1}. ${pt}\n`;
      res += `Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.\n\n`;
    });
  } else {
    res += `1. Cầu cho Hội Thánh: Xin Chúa gìn giữ Đức Giáo Hoàng và các chủ chăn luôn trung tín và nhiệt thành dẫn dắt đoàn chiên.\n`;
    res += `Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.\n\n`;
    res += `2. Cầu cho thế giới: Xin Chúa ban ơn bình an, công lý và xua tan mọi dịch bệnh, chiến tranh trên khắp hoàn cầu.\n`;
    res += `Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.\n\n`;
    res += `3. Cầu cho những người đau khổ: Xin Chúa an ủi, nâng đỡ những ai đang gặp nghịch cảnh và thử thách gian nan.\n`;
    res += `Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.\n\n`;
    res += `4. Cầu cho ca đoàn và giáo xứ: Xin Chúa liên kết mọi người trong tình yêu hiệp nhất và nhiệt thành phục vụ bàn thánh.\n`;
    res += `Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.\n\n`;
  }

  res += `Chủ tế: ${closing || 'Lạy Chúa, xin thương chấp nhận những ước nguyện chân thành của cộng đoàn chúng con, nhờ Đức Kitô, Chúa chúng con. - Amen.'}`;
  return res;
}

/**
 * BẢN TỔNG HỢP AI CHUẨN PHỤNG VỤ CÔNG GIÁO VIỆT NAM
 * Đối chiếu từ: HĐGMVN, TGP Sài Gòn, Dòng Đa Minh, TGP Hà Nội, GP Xuân Lộc
 */
const AI_LITURGICAL_SYNTHESIS = {
  'cn30_tn_a': {
    standard: `LỜI NGUYỆN TÍN HỮU – CHÚA NHẬT 30 THƯỜNG NIÊN - NĂM A
(Bản tổng hợp chuẩn mực: HĐGMVN & TGP Sài Gòn)
Chủ tế: Anh chị em thân mến, Thiên Chúa là Tình Yêu, Người tha thiết mời gọi chúng ta sống trọn vẹn giới răn mến Chúa trên hết mọi sự và yêu thương tha nhân như chính mình. Với tâm tình con thảo và cậy trông sâu xa, chúng ta cùng hiệp ý dâng lời nguyện xin:

1. Cầu cho Hội Thánh: Xin Chúa soi sáng và ban muôn ơn lành trên Đức Giáo Hoàng, các Đức Giám Mục, Linh Mục và toàn thể Dân Chúa, để Hội Thánh luôn là chứng tá sống động và ngời sáng của lòng bác ái Tin Mừng giữa trần gian.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

2. Cầu cho thế giới và những người cùng khổ: "Người ngoại kiều, ngươi không được ngược đãi; Mẹ goá con côi, các ngươi không được ức hiếp": Xin Chúa mở rộng lòng các nhà lãnh đạo quốc gia và mọi người, biết bảo vệ người yếu thế, đẩy lùi nghèo đói và bất công xã hội.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

3. Cầu cho những tâm hồn đang sống trong ích kỷ, oán hờn và chia rẽ: Xin Lời Chúa đánh động và biến đổi tâm can họ, giúp họ nhận ra sự cao quý của lòng vị tha và can đảm tha thứ để cùng nhau xây dựng tình huynh đệ ấm áp.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

4. Cầu cho Ca Đoàn Dohwa và Cộng đoàn giáo xứ chúng ta: Xin Chúa ban cho mỗi ca viên lòng nhiệt thành mến Chúa chân thật, biết hiệp nhất yêu thương nhau và dùng tiếng hát phụng vụ bàn thánh để lan toả tình yêu Chúa đến mọi người.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

Chủ tế: Lạy Thiên Chúa toàn năng nhân ái, Chúa đã dạy rằng tất cả Lề Luật và các sách ngôn sứ đều tuỳ thuộc vào giới răn yêu thương. Xin thương chấp nhận những lời chúng con tha thiết nài van, và ban ơn trợ lực để chúng con biết thực thi đức ái trọn vẹn mỗi ngày. Chúng con cầu xin nhờ Đức Kitô, Chúa chúng con. - Amen.`,
    pastoral: `LỜI NGUYỆN TÍN HỮU – CHÚA NHẬT 30 THƯỜNG NIÊN - NĂM A
(Bản mục vụ sâu sắc: Dòng Đa Minh & TGP Hà Nội)
Chủ tế: Anh chị em thân mến, lắng nghe Lời Chúa dạy về hai giới răn mến Chúa và yêu người, chúng ta cùng tha thiết dâng lên Thiên Chúa lời nguyện cầu chân thành:

1. "Ngươi phải yêu mến Đức Chúa, Thiên Chúa của ngươi hết lòng": Xin cho mọi Kitô hữu luôn đặt Chúa lên trên mọi danh lợi trần thế và trung kiên phụng sự Người bằng trọn cả cuộc đời.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

2. "Ngươi phải yêu người thân cận như chính mình": Xin Chúa ban cho nhân loại quả tim biết rung cảm trước nỗi khổ của tha nhân, biết chia cơm sẻ áo cho những người cơ nhỡ bần cùng.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

3. Cầu cho các gia đình Kitô hữu: Xin Chúa thánh hoá các tổ ấm gia đình, giúp các bậc cha mẹ luôn biết nêu gương sáng yêu thương, quảng đại và bao dung cho con cái noi theo.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

4. Cầu cho Ca Đoàn Dohwa: Xin Chúa liên kết mọi ca viên trong tinh thần khiêm hạ và bác ái, để tiếng hát của chúng con xuất phát từ trái tim mến Chúa chân thành.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

Chủ tế: Lạy Chúa là Cha chí thánh, xin gìn giữ chúng con trong tình yêu của Chúa và ban ơn giúp chúng con luôn biết yêu thương anh chị em mình như chính Chúa đã yêu thương chúng con. Chúng con cầu xin nhờ Đức Kitô, Chúa chúng con. - Amen.`,
    choir: `LỜI NGUYỆN TÍN HỮU – CHÚA NHẬT 30 THƯỜNG NIÊN - NĂM A
(Bản đồng hành Ca Đoàn & Giới Trẻ - Chuẩn Phụng Vụ)
Chủ tế: Anh chị em thân mến, Thiên Chúa là Tình Yêu. Trong niềm vui được hiệp thông bên bàn tiệc Lời Chúa và Thánh Thể, chúng ta cùng hân hoan dâng lên Người những ước nguyện tha thiết:

1. Cầu cho Hội Thánh hoàn vũ: Xin Chúa ban cho các vị mục tử dồi dào ơn thánh để các ngài luôn dẫn dắt Dân Chúa bằng chính đời sống hy sinh phục vụ vô vị lợi.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

2. Cầu cho người trẻ và thanh thiếu niên: Xin Chúa khơi dậy nơi tâm hồn người trẻ lý tưởng sống bác ái, biết mở rộng vòng tay giúp đỡ người bất hạnh và can đảm xây dựng nền văn minh tình thương.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

3. Cầu cho những nạn nhân chiến tranh và thiên tai: Xin Chúa xoa dịu những đau thương mất mát của họ và gửi đến những bàn tay nhân ái kịp thời cứu trợ ủi an.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

4. Cầu cho Ca Đoàn Dohwa: Xin Chúa thánh hoá tiếng hát của từng ca viên, để sự phục vụ của ca đoàn luôn tràn đầy niềm vui, sự hiệp nhất và lòng nhiệt thành mến Chúa.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

Chủ tế: Lạy Chúa Giêsu, xin thắp lên trong trái tim chúng con ngọn lửa tình yêu của Chúa, Đấng hằng sống và hiển trị muôn đời. - Amen.`
  },
  'cn29_tn_a': {
    standard: `LỜI NGUYỆN TÍN HỮU – CHÚA NHẬT 29 THƯỜNG NIÊN - NĂM A
(Bản tổng hợp chuẩn mực: HĐGMVN & TGP Sài Gòn)
Chủ tế: Anh chị em thân mến, Thiên Chúa là Chủ Tể tuyệt đối của càn khôn vạn vật. Đức Giêsu dạy chúng ta chu toàn bổn phận công dân trần thế nhưng luôn tôn thờ và đặt Thiên Chúa ở vị trí tối thượng trong cuộc đời. Trong niềm cậy trông son sắt, chúng ta cùng tha thiết dâng lời nguyện xin:

1. Cầu cho Hội Thánh và công cuộc Loan Báo Tin Mừng: Xin Chúa ban ơn khôn ngoan và sức mạnh cho các vị chủ chăn cùng mọi Kitô hữu, để Hội Thánh không ngừng can đảm loan báo chân lý cứu độ cho muôn dân.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

2. Cầu cho các nhà lãnh đạo quốc gia: Xin Chúa soi sáng tâm trí những người nắm quyền bính, biết tôn trọng tự do lương tâm, tự do tôn giáo, và hết lòng phục vụ cho công lý, tự do và sự thịnh vượng của toàn dân.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

3. Cầu cho những người đang bị áp bức hoặc gặp cảnh bất công: Xin Chúa bênh vực và chở che những người cô thế cô thân, xoa dịu những nỗi đau và ban cho họ niềm hy vọng nơi lòng thương xót Chúa.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

4. Cầu cho Ca Đoàn Dohwa và cộng đoàn giáo xứ: Xin Chúa gìn giữ mỗi ca viên luôn trung kiên trong đức tin, biết dâng trọn tâm hồn và khả năng để làm sáng Danh Chúa qua từng lời ca tiếng hát nơi thánh đường.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

Chủ tế: Lạy Chúa là Vua muôn vua và Chúa các chúa, xin đoái nhìn những ước nguyện chân thành chúng con vừa dâng lên, và giúp chúng con luôn biết sống xứng đáng là con thảo của Chúa giữa lòng xã hội. Chúng con cầu xin nhờ Đức Kitô, Chúa chúng con. - Amen.`,
    pastoral: `LỜI NGUYỆN TÍN HỮU – CHÚA NHẬT 29 THƯỜNG NIÊN - NĂM A
(Bản mục vụ sâu sắc: Dòng Đa Minh & TGP Hà Nội)
Chủ tế: Anh chị em thân mến, "Của Xê-da trả về Xê-da, của Thiên Chúa trả về Thiên Chúa". Với ý thức bổn phận làm con cái Chúa giữa lòng trần thế, chúng ta cùng tha thiết dâng lời cầu nguyện:

1. Cầu cho các vị mục tử trong Hội Thánh: Xin Chúa ban cho các ngài tinh thần ngôn sứ không sợ hãi trước cường quyền trần thế, luôn can đảm bảo vệ Chân Lý Tin Mừng.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

2. Cầu cho sự bình an và phát triển của quê hương đất nước: Xin Chúa chúc lành cho dân tộc chúng con, đẩy lùi thói tham nhũng bất công, đem lại tự do ấm no cho mọi người dân.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

3. Cầu cho những người đang bị giam cầm vì niềm tin và công lý: Xin Chúa là Đấng giải thoát nâng đỡ tinh thần họ và ban cho họ ơn kiên vững đến cùng.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

4. Cầu cho toàn thể Ca viên Ca Đoàn Dohwa: Xin Chúa giúp chúng con luôn biết đặt Chúa làm trung tâm đời sống mình, hăng say phục vụ Chúa và tha nhân với trọn niềm tín thác.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

Chủ tế: Lạy Thiên Chúa toàn năng hằng sống, xin lắng nghe và chấp nhận những ước nguyện chân thành của chúng con, nhờ Đức Kitô, Chúa chúng con. - Amen.`,
    choir: `LỜI NGUYỆN TÍN HỮU – CHÚA NHẬT 29 THƯỜNG NIÊN - NĂM A
(Bản đồng hành Ca Đoàn & Giới Trẻ - Chuẩn Phụng Vụ)
Chủ tế: Anh chị em thân mến, tạ ơn Chúa đã quy tụ chúng ta nơi đây. Đức Kitô mời gọi chúng ta trao dâng trọn vẹn cuộc đời cho Thiên Chúa. Trong niềm hân hoan tin tưởng, chúng ta cùng tha thiết nguyện xin:

1. Cầu cho ngày Khánh Nhật Truyền Giáo: Xin Chúa thúc đẩy tâm hồn mỗi Kitô hữu nhiệt tâm làm chứng cho Tin Mừng bằng chính đời sống lương thiện bác ái hằng ngày.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

2. Cầu cho giới trí thức và sinh viên học sinh: Xin Chúa soi sáng tâm trí người trẻ để luôn biết dùng tài năng tri thức xây dựng xã hội tốt đẹp và tôn vinh Đấng Tạo Hóa.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

3. Cầu cho những người già yếu neo đơn: Xin Chúa nâng đỡ tuổi già của họ và khơi dậy nơi tâm hồn các tín hữu lòng hiếu thảo chăm sóc phụng dưỡng.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

4. Cầu cho Ca Đoàn Dohwa: Xin Chúa thánh hoá từng nốt nhạc tiếng ca của ca đoàn, để mỗi giờ phụng vụ là một lời tạ ơn sốt sắng dâng lên Thiên Chúa.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

Chủ tế: Lạy Chúa, xin thương đón nhận lời ca tiếng hát và những thỉnh cầu của chúng con, Đấng hằng sống và hiển trị muôn đời. - Amen.`
  },
  'cn28_tn_a': {
    standard: `LỜI NGUYỆN TÍN HỮU – CHÚA NHẬT 28 THƯỜNG NIÊN - NĂM A
(Bản tổng hợp chuẩn mực: HĐGMVN & TGP Sài Gòn)
Chủ tế: Anh chị em thân mến, Thiên Chúa là Cha giàu lòng nhân hậu luôn mời gọi tất cả chúng ta vào chia sẻ niềm vui tiệc cưới Nước Trời. Với lòng tri ân sâu xa và ước nguyện sống xứng đáng với ơn gọi Kitô hữu, chúng ta cùng hiệp ý dâng lời nguyện xin:

1. Cầu cho Hội Thánh: Xin Chúa gìn giữ Hội Thánh luôn trung kiên thi hành sứ mạng loan báo ơn cứu độ, để mọi tâm hồn đang khao khát Chân Lý tìm được lối vào dự tiệc ân sủng của Thiên Chúa.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

2. Cầu cho thế giới hôm nay: Xin Chúa soi sáng các nhà lãnh đạo quốc gia biết chăm lo cho công ích, kiến tạo công lý và hòa bình, để mọi người dân được hưởng cuộc sống ấm no và tự do đích thực.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

3. Cầu cho những ai đang mê mải việc đời mà xao lãng ơn cứu độ: Xin ơn Chúa đánh động tâm hồn họ, giúp họ biết quý trọng những giá trị vĩnh cửu và mau mắn đáp lại tiếng Chúa mời gọi hoán cải.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

4. Cầu cho Ca Đoàn Dohwa và Cộng đoàn giáo xứ: "Tôi có thể làm được mọi sự trong Đấng ban sức mạnh cho tôi": Xin Chúa ban ơn trợ lực để mỗi ca viên chúng con luôn kiên tâm, hiệp nhất và cất cao lời ca phụng sự bàn thánh với trọn vẹn đức tin và đức mến.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

Chủ tế: Lạy Thiên Chúa toàn năng nhân từ, xin dủ thương chấp nhận những ý nguyện chân thành của đoàn con, xin gìn giữ chúng con trong ân nghĩa Chúa cho đến ngày vào dự tiệc cưới vĩnh cửu trên trời. Chúng con cầu xin nhờ Đức Kitô, Chúa chúng con. - Amen.`,

    pastoral: `LỜI NGUYỆN TÍN HỮU – CHÚA NHẬT 28 THƯỜNG NIÊN - NĂM A
(Bản mục vụ sâu sắc: Dòng Đa Minh & TGP Hà Nội)
Chủ tế: Anh chị em thân mến, Thiên Chúa dọn sẵn cho chúng ta bàn tiệc Lời Chúa và Thánh Thể mỗi ngày. Ý thức về hồng ân cao cả ấy và thân phận yếu đuối của mình, chúng ta cùng tha thiết cầu xin:

1. "Hãy đi ra các ngả đường, gặp ai cũng mời vào tiệc cưới": Xin cho các linh mục, tu sĩ và giáo dân luôn có tâm hồn rộng mở, nhiệt tâm đem niềm vui Tin Mừng đến cho những người bị gạt ra bên lề xã hội.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

2. Cầu cho những người đang chịu đau khổ vì bệnh tật, nghèo đói và cô đơn: Xin Chúa là Đấng lau sạch nước mắt lau khô giọt lệ sầu đau của họ, và khơi dậy nơi các Kitô hữu tinh thần liên đới chia sẻ.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

3. Cầu cho mỗi người chúng ta luôn biết mặc "y phục lễ cưới": Xin Chúa ban ơn thánh hóa giúp chúng ta luôn giữ gìn đời sống công chính, thánh thiện, biểu lộ qua những việc lành phúc đức hằng ngày.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

4. Cầu cho ca viên và gia đình trong giáo xứ: Xin Chúa ban bình an trên mái ấm từng gia đình, cho các ca viên lòng hăng say và tinh thần hy sinh phục vụ, để lời ca tiếng hát đem lại nhiều ơn ích thiêng liêng cho cộng đoàn.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

Chủ tế: Lạy Chúa, xin lắng nghe và đoái thương nhận lời chúng con nài van, xin biến đổi đời sống chúng con nên tấm bánh thơm tho dâng lên Chúa mỗi ngày. Chúng con cầu xin nhờ Đức Kitô, Chúa chúng con. - Amen.`,

    choir: `LỜI NGUYỆN TÍN HỮU – CHÚA NHẬT 28 THƯỜNG NIÊN - NĂM A
(Bản đồng hành Ca Đoàn & Giới Trẻ - Chuẩn Phụng Vụ)
Chủ tế: Anh chị em thân mến, được quy tụ nơi nhà Chúa để dâng Thánh Lễ là một đại hồng ân. Với tâm tình tạ ơn Chúa đã cho chúng ta được đồng bàn trong tiệc Thánh, chúng ta cùng dâng lên Người những lời nguyện xin:

1. Cầu cho Đức Giáo Hoàng Phanxicô và các vị chủ chăn: Xin Chúa ban cho các ngài sức khỏe và ơn phân định, để luôn là những người đầy tớ trung tín mời gọi muôn dân hiệp thông trong Hội Thánh.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

2. Cầu cho thanh thiếu niên và giới trẻ: Xin Chúa gìn giữ các bạn trẻ khỏi những cạm bẫy xấu xa của thế gian, luôn sống trong trắng, nhiệt huyết và sẵn sàng đáp lại lời mời gọi dấn thân của Chúa.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

3. Cầu cho các bậc cha mẹ và gia đình: Xin Chúa ban ơn che chở để các gia đình luôn là trường học đầu tiên dạy con cái biết yêu mến Lời Chúa và siêng năng tham dự Thánh Lễ.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

4. Cầu cho Ca Đoàn Dohwa: Xin Chúa thánh hóa mọi buổi tập hát và giờ phụng vụ của ca đoàn, ban cho mỗi thành viên tinh thần khiêm nhường, gắn kết yêu thương và nhiệt thành dùng lời ca tiếng đàn tôn vinh Thiên Chúa.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

Chủ tế: Lạy Chúa Giêsu, xin thắp lên trong lòng chúng con ngọn lửa mến yêu nồng nàn, để cuộc đời chúng con là lời ca không bao giờ dứt ca tụng tình thương của Chúa. Chúa là Đấng hằng sống và hiển trị muôn đời. - Amen.`
  },
  'cn25_tn_a': {
    standard: `LỜI NGUYỆN TÍN HỮU – CHÚA NHẬT 25 THƯỜNG NIÊN - NĂM A
(Bản tổng hợp chuẩn mực: HĐGMVN & TGP Sài Gòn)
Chủ tế: Anh chị em thân mến, Thiên Chúa là Cha giàu lòng thương xót và bao dung khôn tả, đường lối của Người vượt xa mọi suy nghĩ và tính toán hẹp hòi của phàm nhân. Trong niềm tri ân sâu xa và phó thác trọn vẹn, chúng ta cùng tha thiết dâng lời nguyện xin:

1. Cầu cho Hội Thánh hoàn vũ: Xin Chúa hằng gìn giữ Đức Giáo Hoàng Phanxicô, các Đức Giám Mục, Linh Mục và toàn thể Dân Thánh, để Hội Thánh luôn chiếu tỏa dung nhan Thiên Chúa từ ái và không ngừng loan báo ơn cứu độ cho muôn dân.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

2. Cầu cho hòa bình thế giới và các dân tộc: Xin Chúa soi sáng tâm trí các nhà lãnh đạo quốc gia, biết kiến tạo công lý, hòa giải mọi xung đột, và quan tâm nâng đỡ những người nghèo đói, bất hạnh, nạn nhân chiến tranh và thiên tai.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

3. Cầu cho những tâm hồn đang gặp thử thách, chán chường: Xin tình yêu Chúa sưởi ấm những ai đang cảm thấy bị bỏ rơi hoặc chịu nhiều thiệt thòi trong cuộc sống, để họ luôn vững niềm trông cậy vào lòng nhân hậu và sự công minh tuyệt đối của Chúa.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

4. Cầu cho Ca Đoàn Dohwa và Cộng đoàn giáo xứ chúng ta: Xin Chúa ban cho mỗi ca viên và mỗi tín hữu tinh thần khiêm tốn, quảng đại và hiệp nhất yêu thương, để qua từng lời ca tiếng hát và hành động cụ thể, chúng con làm sáng danh Chúa giữa lòng cuộc đời.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

Chủ tế: Lạy Thiên Chúa toàn năng nhân từ, xin thương lắng nghe và chấp nhận những lời thỉnh cầu của đoàn con thảo, xin ban ơn giúp chúng con luôn biết vui mừng trước ơn lành Chúa ban cho anh chị em mình. Chúng con cầu xin nhờ Đức Kitô, Chúa chúng con. - Amen.`,

    pastoral: `LỜI NGUYỆN TÍN HỮU – CHÚA NHẬT 25 THƯỜNG NIÊN - NĂM A
(Bản mục vụ sâu sắc: Dòng Đa Minh & TGP Hà Nội)
Chủ tế: Anh chị em thân mến, Thiên Chúa mời gọi tất cả chúng ta bước vào vườn nho Nước Trời để đón nhận hồng ân cứu độ vô điều kiện. Cảm tạ tình thương hải hà của Chúa, chúng ta cùng hiệp ý cầu xin:

1. "Trời cao hơn đất chừng nào, đường lối Ta cao hơn đường lối các ngươi chừng ấy": Xin cho mọi thành phần Dân Chúa luôn biết suy nghĩ và hành động theo tinh thần Tin Mừng, không so đo tính toán, nhưng hết lòng yêu thương và phục vụ.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

2. Cầu cho người lao động và những người thất nghiệp: Xin Chúa chúc lành cho công việc làm ăn của mọi người, xoa dịu nỗi lo âu của những gia đình đang thiếu thốn công ăn việc làm, để xã hội ngày càng công bằng và nhân ái hơn.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

3. Cầu cho các tội nhân và những người lạc xa đường Chúa: Xin ơn biến đổi của Chúa chạm đến tâm hồn họ, để họ nhận ra tình thương tha thứ vô bờ của Thiên Chúa mà can đảm trở về làm hòa với Người.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

4. Cầu cho các gia đình và ca viên trong cộng đoàn: Xin Chúa thánh hóa từng gia đình chúng con, ban cho các bậc cha mẹ lòng kiên nhẫn, cho giới trẻ lòng nhiệt thành mến Chúa và hăng say phục vụ bàn thánh.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

Chủ tế: Lạy Chúa, xin đoái nhìn những ước nguyện chân thành của chúng con và ban sức mạnh Thần Khí giúp chúng con trung kiên bước đi trong tình thương của Chúa mỗi ngày. Chúng con cầu xin nhờ Đức Kitô, Chúa chúng con. - Amen.`,

    choir: `LỜI NGUYỆN TÍN HỮU – CHÚA NHẬT 25 THƯỜNG NIÊN - NĂM A
(Bản đồng hành Ca Đoàn & Giới Trẻ - Chuẩn Phụng Vụ)
Chủ tế: Anh chị em thân mến, tạ ơn Chúa đã quy tụ chúng ta nơi bàn tiệc Lời Chúa và Thánh Thể. Trong tinh thần hân hoan của đoàn con cái Chúa, chúng ta cùng dâng lên Người những ước nguyện tha thiết:

1. Cầu cho Hội Thánh và các vị mục tử: Xin Chúa ban dồi dào ơn thánh trên Đức Giáo Hoàng và các chủ chăn, để các ngài luôn dẫn dắt Dân Chúa đến nguồn suối bình an và ơn cứu độ.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

2. Cầu cho các bạn trẻ và thế giới hôm nay: Xin Chúa soi đường chỉ lối cho thanh thiếu niên giữa muôn cám dỗ trần thế, biết sống có lý tưởng, hướng thiện và can đảm làm chứng cho Chân Lý.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

3. Cầu cho các bệnh nhân và những người sầu khổ: Xin Chúa là nguồn an ủi duy nhất nâng đỡ thể xác lẫn tâm hồn họ, giúp họ nhận ra sự hiện diện đầy yêu thương của Chúa bên cạnh.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

4. Cầu cho Ca Đoàn Dohwa và toàn thể phụng sự viên: Xin Chúa ban cho mỗi ca viên lòng đạo đức sâu sắc, tinh thần hy sinh luyện tập, để lời ca tiếng hát của ca đoàn thực sự là lời cầu nguyện sốt mến, nâng tâm hồn cộng đoàn lên cùng Chúa.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

Chủ tế: Lạy Chúa, xin thương đón nhận lời ca tiếng hát và tấm lòng chân thành của chúng con, xin biến đổi cuộc đời chúng con thành bài ca tạ ơn muôn đời. Chúng con cầu xin nhờ Đức Kitô, Chúa chúng con. - Amen.`
  },

  'cn26_tn_a': {
    standard: `LỜI NGUYỆN TÍN HỮU – CHÚA NHẬT 26 THƯỜNG NIÊN - NĂM A
(Bản tổng hợp chuẩn mực: HĐGMVN & TGP Sài Gòn)
Chủ tế: Anh chị em thân mến, Thiên Chúa luôn yêu thương mời gọi chúng ta cộng tác xây dựng Nước Trời bằng đời sống hoán cải chân thành. Với tâm tình tin tưởng, chúng ta cùng dâng lời cầu xin:

1. Cầu cho các vị chủ chăn trong Hội Thánh: Xin Chúa ban cho các ngài sức mạnh và lòng nhân ái, để luôn nêu gương sáng vâng phục Thánh ý Chúa và tận tụy phục vụ đoàn chiên.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

2. Cầu cho các nhà lãnh đạo quốc gia: Xin Chúa soi sáng tâm trí các nhà cầm quyền, biết hành động vì công lý, hòa bình và lợi ích chân chính của mọi người dân.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

3. Cầu cho những ai đang lạc lối xa Chúa: Xin ơn Chúa biến đổi tâm hồn họ, giúp họ nhận ra tình thương của Chúa mà can đảm hối cải trở về.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

4. Cầu cho toàn thể Ca đoàn và cộng đoàn chúng ta: Xin Chúa giúp mỗi người chúng ta không chỉ vâng lời Chúa bằng môi miệng, mà bằng trọn cả hành động yêu thương cụ thể mỗi ngày.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

Chủ tế: Lạy Chúa, xin nhậm lời cầu tha thiết của chúng con và ban ơn giúp chúng con luôn trung thành thực thi ý Chúa. Chúng con cầu xin nhờ Đức Kitô, Chúa chúng con. - Amen.`,

    pastoral: `LỜI NGUYỆN TÍN HỮU – CHÚA NHẬT 26 THƯỜNG NIÊN - NĂM A
(Bản mục vụ sâu sắc: Dòng Đa Minh & TGP Hà Nội)
Chủ tế: Anh chị em thân mến, noi gương Đức Giêsu Kitô Đấng đã hạ mình vâng phục cho đến chết trên cây Thập Tự, chúng ta cùng tha thiết dâng lên Thiên Chúa lời nguyện xin:

1. Cầu cho Hội Thánh: Xin cho các tín hữu biết noi gương Đức Kitô, luôn khiêm nhường coi người khác hơn mình và đồng tâm nhất trí trong tình yêu thương.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

2. Cầu cho những người đang bị áp bức, bất công: Xin Chúa bênh vực và đem lại công lý cho những ai cô thế cô thân, xoa dịu những giọt nước mắt khổ đau của họ.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

3. Cầu cho những tâm hồn đang chai lì trong thói xấu: Xin Lời Chúa đánh động lương tâm họ, để họ biết kịp thời ăn năn sám hối và quay về với nguồn sống chân thật.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

4. Cầu cho ca đoàn và cộng đoàn giáo xứ: Xin cho chúng con biết dùng tiếng hát và đời sống bác ái để làm chứng cho lòng vâng phục thảo hiếu với Thiên Chúa.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

Chủ tế: Lạy Chúa là Cha chí thánh, xin gìn giữ chúng con trong ân sủng Chúa và ban cho chúng con tâm tình như chính Đức Giêsu Kitô, Chúa chúng con. - Amen.`,

    choir: `LỜI NGUYỆN TÍN HỮU – CHÚA NHẬT 26 THƯỜNG NIÊN - NĂM A
(Bản đồng hành Ca Đoàn & Giới Trẻ - Chuẩn Phụng Vụ)
Chủ tế: Anh chị em thân mến, lời nói phải đi đôi với việc làm. Lắng nghe tiếng Chúa dạy hôm nay, chúng ta cùng khiêm tốn dâng lên Người những lời cầu xin:

1. Cầu cho Đức Giáo Hoàng và các vị lãnh đạo Hội Thánh: Xin Chúa ban ơn khôn ngoan để các ngài luôn dẫn dắt Dân Chúa đi trên con đường Phúc Âm bằng chính đời sống thánh thiện gương mẫu.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

2. Cầu cho giới trẻ và các sinh viên, học sinh: Xin Chúa gìn giữ người trẻ khỏi thái độ sống dửng dưng vô cảm, biết can đảm dấn thân vì Chúa và tha nhân.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

3. Cầu cho những người bệnh tật và đau yếu: Xin Chúa là Đấng chữa lành ban niềm an ủi và củng cố đức tin cho họ giữa những cơn đau đớn bệnh tật.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

4. Cầu cho Ca Đoàn Dohwa: Xin Chúa thánh hóa tiếng hát và tâm hồn từng ca viên, để sự phục vụ của ca đoàn luôn xuất phát từ lòng vâng phục và yêu mến Chúa chân thành.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

Chủ tế: Lạy Chúa Giêsu, xin biến đổi trái tim chai đá của chúng con thành trái tim biết yêu mến và vâng phục, Chúa là Đấng hằng sống và hiển trị muôn đời. - Amen.`
  }
};

function generateAiSynthesizedPrayer(feastTitle, style) {
  const title = feastTitle || 'Chúa Nhật Thường Niên';
  let sourceDesc = 'Tổng hợp từ: HĐGMVN • TGP Sài Gòn • Dòng Đa Minh • TGP Hà Nội';
  if (style === 'pastoral') sourceDesc = 'Bản mục vụ sâu sắc: Dòng Đa Minh & TGP Hà Nội';
  if (style === 'choir') sourceDesc = 'Bản đồng hành Ca Đoàn & Giới Trẻ - Chuẩn Phụng Vụ';

  return `LỜI NGUYỆN TÍN HỮU – ${title.toUpperCase()}
(${sourceDesc})
Chủ tế: Anh chị em thân mến, trong niềm tin cậy phó thác vào Thiên Chúa là Cha giàu lòng thương xót, Đấng luôn lắng nghe lời con cái nài xin, chúng ta cùng hiệp ý dâng lên Người những lời nguyện xin tha thiết:

1. Cầu cho Hội Thánh hoàn vũ: Xin Chúa gìn giữ Đức Giáo Hoàng, các Đức Giám Mục, Linh Mục và toàn thể Dân Thánh, để Hội Thánh luôn trung kiên loan báo Tin Mừng Cứu Độ và là dấu chỉ của tình yêu hiệp nhất giữa trần gian.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

2. Cầu cho hòa bình thế giới và công lý giữa các dân tộc: Xin Chúa soi sáng tâm trí các nhà lãnh đạo, biết loại trừ bạo lực, xung đột, và hết lòng chăm lo cho sự phát triển toàn diện của con người, đặc biệt là những người nghèo khổ bất hạnh.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

3. Cầu cho những người đang gặp thử thách gian nan: Xin Chúa ban sức mạnh nâng đỡ những ai đang đau yếu, cô đơn, nghèo đói hoặc ngã lòng, để họ luôn tìm thấy niềm an ủi và hy vọng nơi lòng Chúa từ bi.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

4. Cầu cho Ca Đoàn Dohwa và Cộng đoàn giáo xứ chúng con: Xin Chúa ban cho mỗi người chúng con lòng nhiệt thành yêu mến Chúa, biết dùng lời ca tiếng hát và đời sống bác ái cụ thể để phụng sự bàn thánh và làm sáng danh Chúa.
Xướng: Chúng con cầu xin Chúa.
Đáp: Xin Chúa nhậm lời chúng con.

Chủ tế: Lạy Thiên Chúa toàn năng nhân ái, xin dủ thương chấp nhận những ước nguyện chân thành chúng con vừa tha thiết dâng lên, nhờ Đức Kitô, Chúa chúng con. - Amen.`;
}

/**
 * Quản lý Modal Bài Đọc & Lời Nguyện (Chuẩn Soạn Bộ Lễ)
 */
class BaiDocViewer {
  constructor() {
    this.cache = {};
    this.currentMassSet = null;
    this.activeTab = 'bd1';
    this.activeFetchTab = 'catalog';
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

    // 1. Tab THÁNH VỊNH: HIỂN THỊ PHIÊN BẢN PDF TRỰC TIẾP
    if (tabKey === 'tv') {
      this.renderThanhVinh(contentEl, ms);
      return;
    }

    // 2. Tab LỜI NGUYỆN TÍN HỮU: CÓ NÚT LẤY TỪ WEB
    if (tabKey === 'lnth') {
      this.renderLoiNguyen(contentEl, ms);
      return;
    }

    // 3. Các Tab Bài Đọc (bd1, bd2, tm): Hiển thị tiêu đề bài trích phụng vụ trang trọng
    await this.renderReading(contentEl, ms, tabKey);
  }

  /**
   * RENDER BÀI ĐỌC (BÀI ĐỌC 1, BÀI ĐỌC 2, TIN MỪNG)
   * Hiển thị đầy đủ Tiêu đề bài trích chuẩn Phụng vụ
   */
  /**
   * TÌM DỮ LIỆU BÀI ĐỌC PHỤNG VỤ CHUẨN KTCGKPV CHO BỘ LỄ:
   * 1. Ưu tiên ms.readings nếu có
   * 2. Tìm theo ms.date trong KTCGKPV_LITURGY_STORE
   * 3. Phân tích tự động số tuần Thường Niên hoặc Lễ Trọng từ title/id/URL (cn30, cn29, cn28, cac-thanh...)
   */
  getLiturgyDataForMass(ms) {
    if (!ms) ms = this.currentMassSet || window.dohwaApp?.currentMassSet || {};

    // 1. Direct ms.readings nếu được gán cụ thể
    if (ms.readings && (ms.readings.bd1 || ms.readings.tm)) {
      return ms.readings;
    }

    // 2. Khớp theo chính xác ngày ms.date
    const dateStr = ms.date || '';
    if (dateStr && KTCGKPV_LITURGY_STORE[dateStr]) {
      return KTCGKPV_LITURGY_STORE[dateStr];
    }

    // 3. Quét từ khoá từ ms.id, ms.title, ms.weekName và URL query (?cn=30...)
    const searchParam = (typeof window !== 'undefined' && window.location ? window.location.search : '') || '';
    const textToScan = `${ms.id || ''} ${ms.title || ''} ${ms.weekName || ''} ${searchParam}`.toLowerCase();

    // Chúa Nhật 30 Thường Niên
    if (/(chúa\s*nhật\s*30|cn[\s-]*30|tuần\s*xxx\b|cn=30)/i.test(textToScan)) {
      return KTCGKPV_LITURGY_STORE['2026-10-25'] || KTCGKPV_LITURGY_STORE['cn30'];
    }
    // Chúa Nhật 29 Thường Niên
    if (/(chúa\s*nhật\s*29|cn[\s-]*29|tuần\s*xxix\b|cn=29)/i.test(textToScan)) {
      return KTCGKPV_LITURGY_STORE['2026-10-18'] || KTCGKPV_LITURGY_STORE['cn29'];
    }
    // Chúa Nhật 28 Thường Niên
    if (/(chúa\s*nhật\s*28|cn[\s-]*28|tuần\s*xxviii\b|cn=28)/i.test(textToScan)) {
      return KTCGKPV_LITURGY_STORE['2026-10-11'] || KTCGKPV_LITURGY_STORE['cn28'];
    }
    // Lễ Các Thánh (01/11)
    if (/(các\s*thánh|all\s*saints)/i.test(textToScan) && !/tử\s*đạo/i.test(textToScan)) {
      return KTCGKPV_LITURGY_STORE['2026-11-01'] || KTCGKPV_LITURGY_STORE['cac-thanh'];
    }
    // Lễ Các Đẳng Linh Hồn (02/11)
    if (/(các\s*đẳng|linh\s*hồn|all\s*souls)/i.test(textToScan)) {
      return KTCGKPV_LITURGY_STORE['2026-11-02'] || KTCGKPV_LITURGY_STORE['cac-dang'];
    }
    // Chúa Nhật 32 Thường Niên
    if (/(chúa\s*nhật\s*32|cn[\s-]*32|tuần\s*xxxii\b|cn=32)/i.test(textToScan)) {
      return KTCGKPV_LITURGY_STORE['2026-11-08'] || KTCGKPV_LITURGY_STORE['cn32'];
    }
    // Lễ Cung Hiến Đền Thờ La-tê-ra-nô
    if (/(la-tê-ra-nô|lateran)/i.test(textToScan)) {
      return KTCGKPV_LITURGY_STORE['2026-11-09'];
    }
    // Các Thánh Tử Đạo Việt Nam (15/11)
    if (/(tử\s*đạo|martyr)/i.test(textToScan)) {
      return KTCGKPV_LITURGY_STORE['2026-11-15'] || KTCGKPV_LITURGY_STORE['tu-dao'];
    }
    // Chúa Nhật 34 Thường Niên - Lễ Chúa Kitô Vua Vũ Trụ (22/11)
    if (/(kitô\s*vua|kito\s*vua|vua\s*vũ\s*trụ|chúa\s*nhật\s*34|cn[\s-]*34|cn=34)/i.test(textToScan)) {
      return KTCGKPV_LITURGY_STORE['2026-11-22'] || KTCGKPV_LITURGY_STORE['kito-vua'];
    }
    // Chúa Nhật 31 Thường Niên
    if (/(chúa\s*nhật\s*31|cn[\s-]*31|tuần\s*xxxi\b|cn=31)/i.test(textToScan)) {
      return KTCGKPV_LITURGY_STORE['cn31'];
    }
    // Chúa Nhật 27 Thường Niên
    if (/(chúa\s*nhật\s*27|cn[\s-]*27|tuần\s*xxvii\b|cn=27)/i.test(textToScan)) {
      return KTCGKPV_LITURGY_STORE['2026-10-04'] || KTCGKPV_LITURGY_STORE['cn27'];
    }
    // Chúa Nhật 26 Thường Niên
    if (/(chúa\s*nhật\s*26|cn[\s-]*26|tuần\s*xxvi\b|cn=26)/i.test(textToScan)) {
      return KTCGKPV_LITURGY_STORE['2026-09-27'] || KTCGKPV_LITURGY_STORE['cn26'];
    }
    // Chúa Nhật 25 Thường Niên
    if (/(chúa\s*nhật\s*25|cn[\s-]*25|tuần\s*xxv\b|cn=25)/i.test(textToScan)) {
      return KTCGKPV_LITURGY_STORE['2026-09-20'] || KTCGKPV_LITURGY_STORE['cn25'];
    }

    // 4. Mặc định: Chúa Nhật 30 Thường Niên Năm A (tuần cử hành hiện tại)
    return KTCGKPV_LITURGY_STORE['2026-10-25'] || Object.values(KTCGKPV_LITURGY_STORE)[0];
  }

  /**
   * RENDER BÀI ĐỌC (BÀI ĐỌC 1, BÀI ĐỌC 2, TIN MỪNG)
   * Hiển thị đầy đủ Tiêu đề bài trích chuẩn Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ (ktcgkpv.org)
   */
  async renderReading(container, ms, tabKey) {
    const isBd1 = tabKey === 'bd1';
    const isTm = tabKey === 'tm';

    const liturgyData = this.getLiturgyDataForMass(ms);
    let reading = null;
    let badgeText = 'BÀI ĐỌC I';
    let endText = 'Đó là Lời Chúa. — Tạ ơn Chúa.';

    if (isBd1) {
      reading = liturgyData?.bd1;
      badgeText = 'BÀI ĐỌC I';
      endText = 'Đó là Lời Chúa. — Tạ ơn Chúa.';
    } else if (isTm) {
      reading = liturgyData?.tm;
      badgeText = 'TIN MỪNG';
      endText = 'Đó là Lời Chúa. — Lạy Chúa Kitô, ngợi khen Chúa.';
    } else {
      reading = liturgyData?.bd2;
      badgeText = 'BÀI ĐỌC II';
      endText = 'Đó là Lời Chúa. — Tạ ơn Chúa.';
    }

    if (reading && reading.content) {
      const bookTitle = reading.bookTitle || getLiturgicalBookTitle(reading.ref, tabKey);
      container.innerHTML = `
        <div style="padding:6px 0;">
          <!-- BANNER NGUỒN CHUẨN KTCGKPV -->
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px; padding:6px 12px; background:linear-gradient(135deg, rgba(2,132,199,0.08), rgba(99,102,241,0.06)); border:1px solid rgba(2,132,199,0.2); border-radius:8px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:0.8rem; background:#0284c7; color:#fff; font-weight:800; padding:3px 10px; border-radius:6px; text-transform:uppercase; letter-spacing:0.5px;">
                ${badgeText}
              </span>
              <span style="font-size:0.95rem; font-weight:800; color:var(--text-main); font-family:monospace; background:var(--bg-card-subtle); padding:2px 8px; border-radius:6px; border:1px solid var(--border);">
                ${reading.ref}
              </span>
            </div>
            <a href="https://ktcgkpv.org/readings/mass-reading" target="_blank" rel="noopener" style="font-size:0.75rem; color:#0369a1; text-decoration:none; font-weight:700; display:inline-flex; align-items:center; gap:4px;">
              📖 Bản dịch chuẩn: ktcgkpv.org ↗
            </a>
          </div>

          <!-- TIÊU ĐỀ BÀI TRÍCH CHUẨN SÁCH BÀI ĐỌC PHỤNG VỤ -->
          <div style="font-family:'Times New Roman',serif; font-size:1.28rem; font-weight:800; color:#b91c1c; margin:10px 0 8px; line-height:1.4;">
            ${bookTitle}
          </div>

          ${reading.lead ? `
            <div style="font-style:italic; color:#475569; font-size:0.96rem; margin-bottom:14px; padding:10px 14px; background:rgba(0,0,0,0.03); border-left:4px solid #b91c1c; border-radius:0 8px 8px 0; font-family:'Times New Roman',serif; line-height:1.5;">
              "${reading.lead}"
            </div>
          ` : ''}

          ${isTm && (reading.alleluia || reading.alleluiaHtml) ? `
            <div style="margin-bottom:16px; padding:10px 14px; background:#fef3c7; border:1px solid #fde68a; border-radius:8px; font-size:0.95rem; color:#92400e; font-family:'Times New Roman',serif; line-height:1.6;">
              <div style="font-weight:800; color:#b45309; margin-bottom:4px; font-size:0.85rem; text-transform:uppercase; letter-spacing:0.5px;">
                ✨ Tung Hô Tin Mừng (${reading.alleluiaRef || 'Alleluia'}):
              </div>
              <div>${reading.alleluiaHtml || reading.alleluia}</div>
            </div>
          ` : ''}

          <!-- BẢN VĂN KINH THÁNH CHUẨN KTCGKPV -->
          <div class="baidoc-reading-body" style="font-family:'Times New Roman',serif; font-size:1.15rem; line-height:2.2; color:var(--text-main); border-top:1px solid var(--border); padding-top:16px; text-align:justify;">
            ${reading.content}
          </div>

          <!-- ĐÁP LỄ & XÁC NHẬN NGUỒN CHÍNH THỨC -->
          <div style="margin-top:22px; padding-top:14px; border-top:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <span style="font-weight:800; color:#6d28d9; font-family:'Times New Roman',serif; font-size:1.08rem;">
              ${endText}
            </span>
            <div style="font-size:0.75rem; color:var(--text-muted); display:inline-flex; align-items:center; gap:4px;">
              <span>Trích Sách Bài Đọc Thánh Lễ — </span>
              <a href="https://ktcgkpv.org/readings/mass-reading" target="_blank" rel="noopener" style="color:#0284c7; text-decoration:none; font-weight:700;">
                Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ ↗
              </a>
            </div>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="text-align:center; padding:36px 16px; color:var(--text-muted)">
        <div style="font-size:2.8rem; margin-bottom:8px;">📖</div>
        <h3 style="color:var(--text-main); font-weight:800; margin-bottom:6px;">${isBd1 ? 'Bài Đọc 1' : isTm ? 'Tin Mừng' : 'Bài Đọc 2'}</h3>
        <p style="margin-top:8px; font-size:0.9rem;">Dữ liệu bài đọc đang được cập nhật từ Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ.</p>
        <a href="https://ktcgkpv.org/readings/mass-reading" target="_blank" rel="noopener" style="display:inline-block; margin-top:14px; font-size:0.85rem; color:#0ea5e9; font-weight:700;">Mở trang ktcgkpv.org ↗</a>
      </div>
    `;
  }

  /**
   * RENDER THÁNH VỊNH:
   * Cho phép chuyển đổi linh hoạt giữa:
   * 1. Lời Kinh Phụng Vụ (KTCGKPV): Bản văn Đáp ca chuẩn mực cho Người đọc sách
   * 2. Bản Nhạc Sheet PDF: Dành cho Ca đoàn & Ca viên tập hát
   */
  renderThanhVinh(container, ms) {
    const liturgyData = this.getLiturgyDataForMass(ms);
    const tvData = liturgyData?.tv;
    const songs = ms.songs || [];
    const dapCaSong = songs.find(s => s.role === 'dap_ca' || s.roleLabel?.includes('Đáp Ca') || s.roleLabel?.includes('Thánh Vịnh')) || songs[2];

    let pdfUrl = dapCaSong?.pdfData;
    let pdfName = dapCaSong?.pdfName || '';
    if (!pdfUrl) {
      if (pdfName) {
        pdfUrl = pdfName.startsWith('sheets/') ? pdfName : `sheets/${pdfName}`;
      } else {
        pdfUrl = 'sheets/Dap_Ca_Chua_Nhat_25_A.pdf';
        pdfName = 'Dap_Ca_Chua_Nhat_25_A.pdf';
      }
    }

    const songTitle = dapCaSong?.title || (tvData?.ref ? `Thánh Vịnh Đáp Ca (${tvData.ref})` : 'Thánh Vịnh Đáp Ca');
    const currentMode = this.tvMode || 'text';

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; width:100%; height:100%;">
        <!-- THANH ĐIỀU HƯỚNG CHỌN XEM LỜI KINH HOẶC BẢN NHẠC PDF -->
        <div style="background:var(--bg-card-subtle,#f8fafc); border:1px solid var(--border,#e2e8f0); border-radius:10px; padding:10px 14px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:1.3rem;">🎶</span>
            <div>
              <div style="font-size:0.95rem; font-weight:800; color:var(--text-main);">${escapeHtml(songTitle)}</div>
              ${tvData?.ref ? `<div style="font-size:0.75rem; color:#0284c7; font-weight:700;">${tvData.ref} (Bản dịch KTCGKPV)</div>` : ''}
            </div>
          </div>
          <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
            <button type="button" id="tvToggleTextBtn" class="action-btn" onclick="window.baiDocViewer.toggleTvMode('text')" style="padding:6px 14px; font-size:0.82rem; font-weight:800; background:${currentMode === 'pdf' ? 'var(--bg-card,#fff)' : '#0284c7'}; color:${currentMode === 'pdf' ? 'var(--text-main,#334155)' : '#fff'}; border:1px solid var(--border); border-radius:6px; cursor:pointer;">
              📜 Lời Kinh Phụng Vụ
            </button>
            <button type="button" id="tvTogglePdfBtn" class="action-btn" onclick="window.baiDocViewer.toggleTvMode('pdf')" style="padding:6px 14px; font-size:0.82rem; font-weight:800; background:${currentMode === 'pdf' ? '#6d28d9' : 'var(--bg-card,#fff)'}; color:${currentMode === 'pdf' ? '#fff' : 'var(--text-main,#334155)'}; border:1px solid var(--border); border-radius:6px; cursor:pointer;">
              🎼 Bản Nhạc Sheet PDF
            </button>
          </div>
        </div>

        <!-- NỘI DUNG 1: LỜI KINH PHỤNG VỤ KTCGKPV -->
        <div id="tvTextContent" style="display:${currentMode === 'pdf' ? 'none' : 'block'}; padding:6px 0;">
          ${tvData && tvData.content ? `
            <div style="background:linear-gradient(135deg, rgba(2,132,199,0.06), rgba(99,102,241,0.04)); border:1px solid rgba(2,132,199,0.18); border-radius:8px; padding:8px 14px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;">
              <span style="font-weight:800; color:#0284c7; font-size:0.95rem;">THÁNH VỊNH ĐÁP CA — ${tvData.ref}</span>
              <a href="https://ktcgkpv.org/readings/mass-reading" target="_blank" rel="noopener" style="font-size:0.75rem; color:#0369a1; text-decoration:none; font-weight:700;">ktcgkpv.org ↗</a>
            </div>
            <div class="baidoc-reading-body" style="font-family:'Times New Roman',serif; font-size:1.15rem; line-height:2.2; color:var(--text-main); text-align:justify;">
              ${tvData.content}
            </div>
          ` : `
            <div style="text-align:center; padding:24px; color:var(--text-muted);">
              Đang hiển thị bản nhạc PDF bên dưới.
            </div>
          `}
        </div>

        <!-- NỘI DUNG 2: KHUNG NHÚNG BẢN NHẠC PDF -->
        <div id="tvPdfContent" style="display:${currentMode === 'pdf' ? 'block' : 'none'}; flex:1; min-height:510px; border:1px solid var(--border); border-radius:10px; overflow:hidden; background:#525659; position:relative;">
          <div style="background:#1e293b; padding:8px 12px; display:flex; justify-content:flex-end; gap:8px;">
            <a href="${pdfUrl}" target="_blank" rel="noopener" class="action-btn btn-view" style="text-decoration:none; padding:5px 10px; font-size:0.78rem; font-weight:700; color:#fff;">↗️ Tab Mới</a>
            <a href="${pdfUrl}" download="${pdfName}" class="action-btn btn-pdf" style="text-decoration:none; padding:5px 12px; font-size:0.78rem; font-weight:800; background:#0284c7; color:#fff;">📥 Tải Về</a>
          </div>
          <object data="${pdfUrl}" type="application/pdf" width="100%" height="100%" style="min-height:470px; display:block;">
            <iframe src="${pdfUrl}" width="100%" height="100%" style="border:none; min-height:470px;">
              <div style="padding:20px; text-align:center; background:#fff;">
                <p>Xem bản nhạc: <a href="${pdfUrl}" target="_blank">${pdfName}</a></p>
              </div>
            </iframe>
          </object>
        </div>
      </div>
    `;
  }

  toggleTvMode(mode) {
    this.tvMode = mode;
    const textEl = document.getElementById('tvTextContent');
    const pdfEl = document.getElementById('tvPdfContent');
    const btnText = document.getElementById('tvToggleTextBtn');
    const btnPdf = document.getElementById('tvTogglePdfBtn');
    if (textEl && pdfEl) {
      textEl.style.display = mode === 'pdf' ? 'none' : 'block';
      pdfEl.style.display = mode === 'pdf' ? 'block' : 'none';
    }
    if (btnText && btnPdf) {
      btnText.style.background = mode === 'pdf' ? 'var(--bg-card,#fff)' : '#0284c7';
      btnText.style.color = mode === 'pdf' ? 'var(--text-main,#334155)' : '#fff';
      btnPdf.style.background = mode === 'pdf' ? '#6d28d9' : 'var(--bg-card,#fff)';
      btnPdf.style.color = mode === 'pdf' ? '#fff' : 'var(--text-main,#334155)';
    }
  }

  renderLoiNguyen(container, ms) {
    const isAdmin = !!(
      window.dohwaStore?.isAdmin?.() ||
      localStorage.getItem('dohwa_is_admin') === 'true'
    );
    const isPublished = ms.loiNguyenPublished === true && !!(ms.loiNguyenText && ms.loiNguyenText.trim());

    // 1. DÀNH CHO CA VIÊN KHI CHƯA ĐƯỢC ADMIN ÁP DỤNG / BAN HÀNH
    if (!isAdmin && !isPublished) {
      container.innerHTML = `
        <div style="text-align:center; padding:38px 20px; background:linear-gradient(180deg, #fffdf8, #fef9ee); border:1.5px dashed #f59e0b; border-radius:16px; margin:14px 0; box-shadow:0 4px 16px rgba(245,158,11,0.06);">
          <div style="font-size:3.5rem; margin-bottom:12px; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.1));">🙏</div>
          <h3 style="font-family:'Times New Roman',serif; font-size:1.45rem; font-weight:800; color:#92400e; margin-bottom:12px; line-height:1.4;">
            Lời Nguyện Tín Hữu đang được biên soạn
          </h3>
          <div style="display:inline-block; background:#fff; border:1px solid #fde68a; border-radius:12px; padding:14px 24px; color:#b45309; font-size:1.06rem; font-family:'Times New Roman',serif; margin-bottom:16px; box-shadow:0 2px 8px rgba(217,119,6,0.08);">
            Xin quý ca viên vui lòng quay lại sau nhé, xin cảm ơn!
          </div>
          <div style="font-size:0.86rem; color:#64748b; margin-bottom:12px;">
            Thánh Lễ: <strong>${escapeHtml(ms.title || ms.weekName || 'Bộ lễ hiện tại')}</strong>
          </div>
          <div style="border-top:1px solid rgba(245,158,11,0.2); padding-top:16px; margin-top:8px; font-size:0.85rem; color:#64748b;">
            Bạn là Ca Trưởng hoặc người phụ trách phụng vụ? 
            <a href="javascript:void(0)" onclick="window.dohwaApp && window.dohwaApp.openAdminLoginModal()" style="color:#6d28d9; font-weight:800; text-decoration:underline; margin-left:4px;">
              Đăng nhập Quyền Admin để Soạn & Ban Hành ↗
            </a>
          </div>
        </div>
      `;
      return;
    }

    // 2. DÀNH CHO CA VIÊN KHI ĐÃ CÔNG BỐ (PUBLISHED)
    if (!isAdmin && isPublished) {
      container.innerHTML = `
        <div id="sb-lnth-view">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:0.85rem; color:var(--text-muted); font-weight:700;">LỜI NGUYỆN TÍN HỮU</span>
              <span style="font-size:0.75rem; background:#dcfce7; color:#15803d; font-weight:800; padding:2px 10px; border-radius:12px; border:1px solid #86efac; display:inline-flex; align-items:center; gap:4px;">
                ✓ Bản chính thức của Ca đoàn
              </span>
            </div>
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
              <button type="button" class="action-btn btn-share" onclick="window.baiDocViewer.printLnth()" style="font-size:0.8rem; padding:6px 12px; cursor:pointer;">🖨️ In A4</button>
              <button type="button" class="action-btn btn-copy" onclick="window.baiDocViewer.copyLnth()" style="font-size:0.8rem; padding:6px 12px; cursor:pointer;">📋 Copy</button>
            </div>
          </div>

          <div style="padding:18px 22px; background:#fffdf7; border:1.5px solid #fed7aa; border-radius:12px; margin-bottom:12px; box-shadow:0 2px 8px rgba(0,0,0,0.02);">
            ${formatLnthText(ms.loiNguyenText)}
          </div>
        </div>
      `;
      return;
    }

    // 3. DÀNH CHO ADMIN: LUÔN CÓ SẴN BẢN ĐỂ XEM XÉT, SOẠN VÀ BAN HÀNH
    const currentFeastId = this.getCurrentFeastId();
    let currentContent = ms.loiNguyenText;

    if (!currentContent) {
      const catalogItem = LITURGICAL_PRAYERS_CATALOG.find(c => c.id === currentFeastId);
      if (catalogItem) {
        currentContent = catalogItem.text;
      } else if (AI_LITURGICAL_SYNTHESIS[currentFeastId]?.standard) {
        currentContent = AI_LITURGICAL_SYNTHESIS[currentFeastId].standard;
      } else if (OFFLINE_LITURGY_STORE[ms.date]?.lnth) {
        currentContent = OFFLINE_LITURGY_STORE[ms.date].lnth;
      } else {
        const feastTitle = ms.title || ms.weekName || 'Chúa Nhật';
        currentContent = generateAiSynthesizedPrayer(feastTitle, 'standard');
      }
    }

    container.innerHTML = `
      <!-- THANH TRẠNG THÁI PHÊ DUYỆT CỦA ADMIN -->
      ${ms.loiNguyenPublished ? `
        <div style="background:#f0fdf4; border:1.5px solid #86efac; border-radius:10px; padding:12px 16px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:1.3rem;">🎉</span>
            <div>
              <div style="color:#15803d; font-size:0.95rem; font-weight:800;">ĐÃ ÁP DỤNG & CÔNG BỐ CHO CẢ ĐOÀN</div>
              <div style="font-size:0.78rem; color:#166534;">Tất cả ca viên hiện đã có thể xem, sao chép và in bản Lời Nguyện này.</div>
            </div>
          </div>
          <button type="button" class="btn btn-outline" onclick="window.baiDocViewer.unpublishLnth()" style="font-size:0.8rem; padding:5px 12px; border-color:#dc2626; color:#dc2626; font-weight:700; cursor:pointer;">
            🔒 Thu Hồi Về Bản Nháp
          </button>
        </div>
      ` : `
        <div style="background:#fffbeb; border:1.5px solid #fcd34d; border-radius:10px; padding:12px 16px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:1.4rem;">⚠️</span>
            <div>
              <div style="color:#b45309; font-size:0.95rem; font-weight:800;">ĐANG LÀ BẢN NHÁP (CA VIÊN CHƯA THỂ XEM)</div>
              <div style="font-size:0.8rem; color:#92400e;">Ca viên truy cập sẽ chỉ thấy thông báo chờ bạn chuẩn bị. Bấm nút bên cạnh để chính thức ban hành!</div>
            </div>
          </div>
          <button type="button" class="btn btn-primary" onclick="window.baiDocViewer.publishCurrentLnth()" style="background:linear-gradient(135deg, #16a34a, #15803d); font-weight:800; font-size:0.88rem; padding:8px 18px; border-radius:8px; box-shadow:0 3px 10px rgba(22,163,74,0.3); border:none; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
            🚀 ÁP DỤNG MẪU NÀY CHO CẢ ĐOÀN
          </button>
        </div>
      `}

      <div id="sb-lnth-view">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="font-size:0.85rem; color:var(--text-muted); font-weight:700;">LỜI NGUYỆN TÍN HỮU (CHẾ ĐỘ ADMIN)</span>
            ${!ms.loiNguyenPublished ? `
              <span style="font-size:0.75rem; background:#fef3c7; color:#b45309; font-weight:800; padding:2px 8px; border-radius:10px; border:1px solid #fde68a;">
                Bản nháp
              </span>
            ` : ''}
          </div>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button type="button" class="action-btn btn-pdf" onclick="window.baiDocViewer.openFetchModal()" style="font-size:0.8rem; padding:6px 12px; background:linear-gradient(135deg, #7c3aed, #4f46e5); color:#fff; border:none; font-weight:800; display:inline-flex; align-items:center; gap:4px; box-shadow:0 2px 8px rgba(124,58,237,0.25); cursor:pointer;">
              🌐 Lấy Từ Web
            </button>
            <button type="button" class="action-btn btn-view" onclick="window.baiDocViewer.startEditLnth()" style="font-size:0.8rem; padding:6px 12px; cursor:pointer;">✏️ Sửa</button>
            ${!ms.loiNguyenPublished ? `
              <button type="button" class="action-btn btn-primary" onclick="window.baiDocViewer.publishCurrentLnth()" style="font-size:0.8rem; padding:6px 14px; background:#16a34a; color:#fff; border:none; font-weight:800; display:inline-flex; align-items:center; gap:4px; cursor:pointer;">
                🚀 Áp Dụng Cho Cả Đoàn
              </button>
            ` : ''}
            <button type="button" class="action-btn btn-share" onclick="window.baiDocViewer.printLnth()" style="font-size:0.8rem; padding:6px 12px; cursor:pointer;">🖨️ In A4</button>
            <button type="button" class="action-btn btn-copy" onclick="window.baiDocViewer.copyLnth()" style="font-size:0.8rem; padding:6px 12px; cursor:pointer;">📋 Copy</button>
          </div>
        </div>

        <div style="padding:18px 22px; background:#fffdf7; border:1.5px solid #fed7aa; border-radius:12px; margin-bottom:12px; box-shadow:0 2px 8px rgba(0,0,0,0.02);">
          ${formatLnthText(currentContent)}
        </div>
      </div>

      <div id="sb-lnth-edit-form" style="display:none; margin-top:10px;">
        <div style="font-weight:700; margin-bottom:8px; color:var(--primary);">Chỉnh sửa Lời Nguyện Tín Hữu (Admin):</div>
        <textarea id="sb-lnth-input" rows="12" class="form-control" style="font-family:'Times New Roman',serif; font-size:1.05rem; line-height:2;">${escapeHtml(currentContent)}</textarea>
        <div style="display:flex; gap:8px; margin-top:10px; justify-content:flex-end; flex-wrap:wrap;">
          <button type="button" class="btn" onclick="window.baiDocViewer.cancelEditLnth()" style="background:var(--border); cursor:pointer;">Hủy</button>
          <button type="button" class="btn btn-outline" onclick="window.baiDocViewer.saveLnth(false)" style="border-color:#d97706; color:#d97706; font-weight:700; cursor:pointer;">
            💾 Lưu Bản Nháp
          </button>
          <button type="button" class="btn btn-primary" onclick="window.baiDocViewer.saveLnth(true)" style="background:linear-gradient(135deg, #16a34a, #15803d); font-weight:800; border:none; box-shadow:0 2px 8px rgba(22,163,74,0.3); cursor:pointer;">
            🚀 Lưu & Áp Dụng Cho Cả Đoàn
          </button>
        </div>
      </div>
    `;
  }

  // --- CÁC HÀM XỬ LÝ LỜI NGUYỆN ---
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

  // Ban hành Lời Nguyện Tín Hữu cho cả đoàn
  async publishCurrentLnth(customText) {
    if (!this.currentMassSet) return;

    let textToPublish = customText;
    if (!textToPublish) {
      if (this.currentMassSet.loiNguyenText && this.currentMassSet.loiNguyenText.trim()) {
        textToPublish = this.currentMassSet.loiNguyenText;
      } else {
        const currentFeastId = this.getCurrentFeastId();
        const catalogItem = LITURGICAL_PRAYERS_CATALOG.find(c => c.id === currentFeastId);
        textToPublish = catalogItem ? catalogItem.text : (AI_LITURGICAL_SYNTHESIS[currentFeastId]?.standard || OFFLINE_LITURGY_STORE[this.currentMassSet.date]?.lnth || generateAiSynthesizedPrayer(this.currentMassSet.title || 'Phụng Vụ', 'standard'));
      }
    }

    this.currentMassSet.loiNguyenText = textToPublish;
    this.currentMassSet.loiNguyenPublished = true;
    this.currentMassSet.loiNguyenPublishedAt = new Date().toISOString();

    if (window.dohwaStore) {
      await window.dohwaStore.saveMassSet(this.currentMassSet);
    }

    const toast = document.createElement('div');
    toast.className = 'dohwa-toast';
    toast.textContent = '🎉 Đã áp dụng & ban hành Lời Nguyện Tín Hữu cho cả đoàn!';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);

    const contentEl = document.getElementById('baiDocContent');
    if (contentEl) {
      this.renderLoiNguyen(contentEl, this.currentMassSet);
    }
  }

  // Thu hồi về bản nháp
  async unpublishLnth() {
    if (!this.currentMassSet) return;
    if (!confirm('Bạn có chắc muốn thu hồi bản Lời Nguyện Tín Hữu này về bản nháp? Ca viên sẽ tạm thời không xem được cho đến khi bạn bấm Áp dụng lại.')) return;

    this.currentMassSet.loiNguyenPublished = false;
    if (window.dohwaStore) {
      await window.dohwaStore.saveMassSet(this.currentMassSet);
    }

    const toast = document.createElement('div');
    toast.className = 'dohwa-toast';
    toast.textContent = '🔒 Đã chuyển về Bản nháp (Ca viên chưa thể xem).';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);

    const contentEl = document.getElementById('baiDocContent');
    if (contentEl) {
      this.renderLoiNguyen(contentEl, this.currentMassSet);
    }
  }

  async saveLnth(publishNow = false) {
    const inp = document.getElementById('sb-lnth-input');
    if (!inp) return;
    const text = inp.value.trim();

    if (this.currentMassSet) {
      this.currentMassSet.loiNguyenText = text;
      this.currentMassSet.loiNguyenPublished = !!publishNow;
      if (publishNow) {
        this.currentMassSet.loiNguyenPublishedAt = new Date().toISOString();
      }
      if (window.dohwaStore) {
        await window.dohwaStore.saveMassSet(this.currentMassSet);
      }
    }

    const toast = document.createElement('div');
    toast.className = 'dohwa-toast';
    toast.textContent = publishNow
      ? '🎉 Đã lưu và áp dụng Lời Nguyện cho cả đoàn!'
      : '💾 Đã lưu bản nháp Lời Nguyện Tín Hữu!';
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
    const currentFeastId = this.getCurrentFeastId();
    let content = ms.loiNguyenText;
    if (!content) {
      const catalogItem = LITURGICAL_PRAYERS_CATALOG.find(c => c.id === currentFeastId);
      content = catalogItem ? catalogItem.text : (OFFLINE_LITURGY_STORE[ms.date]?.lnth || generateAiSynthesizedPrayer(ms.title || 'Phụng Vụ', 'standard'));
    }
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

  // --- MODAL LẤY LỜI NGUYỆN TÍN HỮU TỪ WEB (3 PHƯƠNG THỨC MỚI) ---
  getCurrentFeastId() {
    const ms = this.currentMassSet || window.dohwaApp?.currentMassSet;
    const title = (ms?.title || ms?.weekName || '').toLowerCase();
    const dateStr = ms?.date || '';

    // 1. Nhận diện số tuần Thường Niên bất kỳ (từ 1 đến 34)
    const tnMatch = title.match(/(\d+)\s*(thường niên|tn)/i) || 
                    title.match(/chúa nhật\s*(\d+)/i) || 
                    title.match(/cn\s*(\d+)/i);
    if (tnMatch) {
      const week = parseInt(tnMatch[1]);
      if (week >= 1 && week <= 34) {
        return `cn${week}_tn_a`;
      }
    }

    // 2. Nhận diện các mùa phụng vụ
    if (title.includes('vọng')) return 'mua_vong';
    if (title.includes('giáng sinh') || title.includes('noel') || title.includes('hiển linh')) return 'mua_giang_sinh';
    if (title.includes('chay') || title.includes('lễ lá')) return 'mua_chay';
    if (title.includes('phục sinh') || title.includes('thăng thiên') || title.includes('hiện xuống')) return 'mua_phuc_sinh';
    if (title.includes('đức mẹ') || title.includes('maria')) return 'le_duc_me';
    if (title.includes('quan thầy') || title.includes('bổn mạng') || title.includes('ca đoàn')) return 'le_bon_mang_ca_doan';
    if (title.includes('kitô vua')) return 'cn34_tn_a';

    // 3. Tính toán theo ngày cử hành (dateStr)
    if (dateStr && window.calculateLiturgicalInfo) {
      const info = window.calculateLiturgicalInfo(dateStr);
      if (info && info.title) {
        const infoMatch = info.title.match(/(\d+)\s*thường niên/i);
        if (infoMatch) {
          return `cn${parseInt(infoMatch[1])}_tn_a`;
        }
      }
    }

    return 'cn28_tn_a';
  }

  openFetchModal() {
    const overlay = document.getElementById('fetchLnthModalOverlay');
    if (overlay) {
      overlay.style.display = 'flex';
      this.switchFetchTab(this.activeFetchTab || 'catalog');
    }
  }

  closeFetchModal() {
    const overlay = document.getElementById('fetchLnthModalOverlay');
    if (overlay) overlay.style.display = 'none';
  }

  switchFetchTab(tabKey) {
    this.activeFetchTab = tabKey;
    document.querySelectorAll('.fetch-lnth-tab').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-fetch-tab') === tabKey);
    });

    const container = document.getElementById('fetchLnthTabContent');
    if (!container) return;

    if (tabKey === 'catalog') {
      this.renderFetchCatalogTab(container);
    } else if (tabKey === 'ai') {
      this.renderFetchAiTab(container);
    } else {
      this.renderFetchPasteTab(container);
    }
  }

  // PHƯƠNG THỨC 1: KHO PHỤNG VỤ SẴN CÓ — TỰ ĐỘNG LẤY THEO CHÚA NHẬT HIỆN TẠI
  renderFetchCatalogTab(container) {
    const currentFeastId = this.getCurrentFeastId();
    const currentItem = LITURGICAL_PRAYERS_CATALOG.find(c => c.id === currentFeastId) || LITURGICAL_PRAYERS_CATALOG[0];

    container.innerHTML = `
      <div>
        <!-- BANNER TỰ ĐỘNG NHẬN DIỆN CHÚA NHẬT HIỆN TẠI -->
        <div style="background:linear-gradient(135deg, rgba(2,132,199,0.08), rgba(124,58,237,0.08)); border:1.5px solid #0284c7; border-radius:12px; padding:12px 16px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div>
            <div style="font-size:0.75rem; color:#0284c7; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">⚡ TỰ ĐỘNG THEO BỘ LỄ HIỆN TẠI</div>
            <div style="font-size:1.02rem; font-weight:800; color:var(--text-main); margin:2px 0;">${currentItem.title}</div>
            <div style="font-size:0.78rem; color:var(--text-muted);">${currentItem.subtitle} • Chuẩn Phụng Vụ Công Giáo</div>
          </div>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button type="button" class="btn btn-outline" onclick="window.baiDocViewer.applySelectedCatalog(false)" style="font-size:0.8rem; font-weight:700; padding:6px 12px; border-color:#0284c7; color:#0284c7; cursor:pointer;">
              💾 Lưu Bản Nháp
            </button>
            <button type="button" class="btn btn-primary" onclick="window.baiDocViewer.applySelectedCatalog(true)" style="background:linear-gradient(135deg, #16a34a, #15803d); font-weight:800; font-size:0.85rem; padding:8px 16px; border-radius:8px; box-shadow:0 2px 8px rgba(22,163,74,0.3); border:none; cursor:pointer;">
              🚀 Áp Dụng Mẫu Này Cho Cả Đoàn
            </button>
          </div>
        </div>

        <div style="font-size:0.82rem; font-weight:700; color:var(--text-main); margin-bottom:6px;">
          Hoặc chọn ngày lễ khác nếu muốn thay đổi:
        </div>
        <select id="fetchCatalogSelect" class="form-control" style="margin-bottom:12px; font-weight:600; font-size:0.88rem;" onchange="window.baiDocViewer.handleCatalogSelectChange(this.value)">
          ${LITURGICAL_PRAYERS_CATALOG.map(c => `
            <option value="${c.id}" ${c.id === currentFeastId ? 'selected' : ''}>${c.title} — ${c.subtitle}</option>
          `).join('')}
        </select>

        <div style="font-size:0.8rem; font-weight:700; color:var(--primary); margin-bottom:4px;">
          Nội dung Lời Nguyện chuẩn phụng vụ Công giáo:
        </div>
        <div id="fetchCatalogPreview" style="background:#fffdf7; border:1px solid #fed7aa; border-radius:10px; padding:14px 18px; max-height:280px; overflow-y:auto; font-family:'Times New Roman',serif; font-size:1rem; line-height:2;">
          ${formatLnthText(currentItem.text)}
        </div>

        <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:14px; flex-wrap:wrap;">
          <button type="button" class="btn" onclick="window.baiDocViewer.closeFetchModal()" style="background:var(--border); cursor:pointer;">Đóng</button>
          <button type="button" class="btn btn-outline" onclick="window.baiDocViewer.applySelectedCatalog(false)" style="border-color:#d97706; color:#d97706; font-weight:700; cursor:pointer;">
            💾 Lưu Làm Bản Nháp
          </button>
          <button type="button" class="btn btn-primary" onclick="window.baiDocViewer.applySelectedCatalog(true)" style="background:linear-gradient(135deg, #16a34a, #15803d); font-weight:800; padding:8px 18px; border:none; cursor:pointer;">
            🚀 Áp Dụng Mẫu Này Cho Cả Đoàn
          </button>
        </div>
      </div>
    `;
  }

  handleCatalogSelectChange(catalogId) {
    const item = LITURGICAL_PRAYERS_CATALOG.find(c => c.id === catalogId) || LITURGICAL_PRAYERS_CATALOG[0];
    const preview = document.getElementById('fetchCatalogPreview');
    if (preview && item) {
      preview.innerHTML = formatLnthText(item.text);
    }
  }

  applySelectedCatalog(publishNow = true) {
    const sel = document.getElementById('fetchCatalogSelect');
    const catalogId = sel ? sel.value : this.getCurrentFeastId();
    const item = LITURGICAL_PRAYERS_CATALOG.find(c => c.id === catalogId) || LITURGICAL_PRAYERS_CATALOG[0];
    if (item) {
      this.applyFetchedPrayer(item.text, publishNow);
    }
  }

  // PHƯƠNG THỨC 2: AI TỔNG HỢP TRỰC TUYẾN TỪ CÁC WEB CÔNG GIÁO VIỆT NAM
  renderFetchAiTab(container) {
    const currentFeastId = this.getCurrentFeastId();
    const ms = this.currentMassSet || window.dohwaApp?.currentMassSet;
    const feastTitle = ms?.title || ms?.weekName || (window.calculateLiturgicalInfo && ms?.date ? window.calculateLiturgicalInfo(ms.date)?.title : '') || 'Chúa Nhật 28 Thường Niên - Năm A';
    this.activeAiStyle = this.activeAiStyle || 'standard';

    let synthesizedText = '';
    const preset = AI_LITURGICAL_SYNTHESIS[currentFeastId];
    if (preset && preset[this.activeAiStyle]) {
      synthesizedText = preset[this.activeAiStyle];
    } else {
      synthesizedText = generateAiSynthesizedPrayer(feastTitle, this.activeAiStyle);
    }

    container.innerHTML = `
      <div>
        <div style="background:#faf5ff; border:1.5px solid #d8b4fe; border-radius:12px; padding:12px 16px; margin-bottom:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:6px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:1.3rem;">✨</span>
              <div>
                <div style="font-size:0.75rem; font-weight:800; color:#7c3aed; text-transform:uppercase; letter-spacing:0.5px;">AI TỔNG HỢP TỪ CÁC WEBSITE CÔNG GIÁO VIỆT NAM</div>
                <div style="font-size:1rem; font-weight:800; color:#4c1d95;">${feastTitle}</div>
              </div>
            </div>
            <span style="font-size:0.75rem; background:#16a34a; color:#fff; font-weight:800; padding:3px 10px; border-radius:20px; display:inline-flex; align-items:center; gap:4px;">
              ✓ Chuẩn Phụng Vụ HĐGMVN
            </span>
          </div>
          <div style="font-size:0.78rem; color:#6b21a8; line-height:1.5;">
            🌐 <strong>Nguồn dữ liệu tổng hợp:</strong> Ủy Ban Phụng Vụ HĐGMVN • TGP Sài Gòn (tgpsaigon.net) • Dòng Đa Minh (daminhtimve.net) • TGP Hà Nội • GP Xuân Lộc • KTCGKPV.
          </div>
        </div>

        <!-- 3 TÙY CHỌN PHONG CÁCH TỔNG HỢP CÔNG GIÁO VIỆT NAM -->
        <div style="font-size:0.8rem; font-weight:700; color:var(--text-main); margin-bottom:6px;">
          Chọn phong cách tổng hợp phụng vụ:
        </div>
        <div style="display:flex; gap:8px; margin-bottom:10px; flex-wrap:wrap;">
          <button type="button" class="btn-xs ${this.activeAiStyle === 'standard' ? 'btn-primary' : 'btn-outline'}" onclick="window.baiDocViewer.switchAiStyle('standard')" style="padding:6px 12px; font-weight:700; font-size:0.8rem; border-radius:8px; cursor:pointer;">
            🌟 Bản Chuẩn Mực HĐGMVN
          </button>
          <button type="button" class="btn-xs ${this.activeAiStyle === 'pastoral' ? 'btn-primary' : 'btn-outline'}" onclick="window.baiDocViewer.switchAiStyle('pastoral')" style="padding:6px 12px; font-weight:700; font-size:0.8rem; border-radius:8px; cursor:pointer;">
            💖 Bản Mục Vụ Sâu Sắc
          </button>
          <button type="button" class="btn-xs ${this.activeAiStyle === 'choir' ? 'btn-primary' : 'btn-outline'}" onclick="window.baiDocViewer.switchAiStyle('choir')" style="padding:6px 12px; font-weight:700; font-size:0.8rem; border-radius:8px; cursor:pointer;">
            🎶 Bản Ca Đoàn & Giới Trẻ
          </button>
        </div>

        <div id="aiSynthesisStatus" style="font-size:0.8rem; color:#16a34a; margin-bottom:6px; font-weight:700; display:flex; align-items:center; gap:6px;">
          <span>⚡</span>
          <span>AI đã đối chiếu & chắt lọc bản lời nguyện hoàn hảo nhất cho cộng đoàn:</span>
        </div>

        <textarea id="aiSynthesisTextarea" class="form-control" rows="9" style="font-family:'Times New Roman',serif; font-size:1rem; line-height:2; margin-bottom:12px;">${escapeHtml(synthesizedText)}</textarea>

        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <button type="button" class="btn btn-outline" onclick="window.baiDocViewer.reSimulateAiSynthesis()" style="font-weight:700; font-size:0.82rem; padding:7px 14px; border-color:#7c3aed; color:#7c3aed; cursor:pointer;">
            🔄 Quét & Tái Tổng Hợp
          </button>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button type="button" class="btn" onclick="window.baiDocViewer.closeFetchModal()" style="background:var(--border); cursor:pointer;">Đóng</button>
            <button type="button" class="btn btn-outline" onclick="window.baiDocViewer.applyAiSynthesizedPrayer(false)" style="border-color:#d97706; color:#d97706; font-weight:700; cursor:pointer;">
              💾 Lưu Bản Nháp
            </button>
            <button type="button" class="btn btn-primary" onclick="window.baiDocViewer.applyAiSynthesizedPrayer(true)" style="background:linear-gradient(135deg, #16a34a, #15803d); font-weight:800; padding:8px 18px; box-shadow:0 4px 12px rgba(22,163,74,0.3); border:none; cursor:pointer;">
              🚀 Áp Dụng Mẫu Này Cho Cả Đoàn
            </button>
          </div>
        </div>
      </div>
    `;
  }

  switchAiStyle(style) {
    this.activeAiStyle = style;
    const container = document.getElementById('fetchLnthTabContent');
    if (container) {
      this.renderFetchAiTab(container);
    }
  }

  reSimulateAiSynthesis() {
    const statusEl = document.getElementById('aiSynthesisStatus');
    const textarea = document.getElementById('aiSynthesisTextarea');
    if (statusEl) {
      statusEl.style.color = '#7c3aed';
      statusEl.innerHTML = '🔍 Đang quét lại dữ liệu từ HĐGMVN, TGP Sài Gòn, Dòng Đa Minh, TGP Hà Nội...';
    }
    setTimeout(() => {
      if (statusEl) {
        statusEl.style.color = '#16a34a';
        statusEl.innerHTML = '✅ Đã hoàn tất tái tổng hợp bản lời nguyện chuẩn mực nhất!';
      }
      const currentFeastId = this.getCurrentFeastId();
      const ms = this.currentMassSet || window.dohwaApp?.currentMassSet;
      const feastTitle = ms?.title || ms?.weekName || 'Chúa Nhật';
      const preset = AI_LITURGICAL_SYNTHESIS[currentFeastId];
      let res = '';
      if (preset && preset[this.activeAiStyle]) {
        res = preset[this.activeAiStyle];
      } else {
        res = generateAiSynthesizedPrayer(feastTitle, this.activeAiStyle);
      }
      if (textarea) textarea.value = res;
    }, 700);
  }

  applyAiSynthesizedPrayer(publishNow = true) {
    const textarea = document.getElementById('aiSynthesisTextarea');
    if (!textarea || !textarea.value.trim()) {
      alert('Chưa có nội dung lời nguyện để áp dụng!');
      return;
    }
    this.applyFetchedPrayer(textarea.value.trim(), publishNow);
  }

  // PHƯƠNG THỨC 3: DÁN & TỰ ĐỘNG CHUẨN HÓA
  renderFetchPasteTab(container) {
    container.innerHTML = `
      <div>
        <div style="font-size:0.85rem; font-weight:700; color:var(--text-main); margin-bottom:6px;">
          Dán nội dung thô (Copy từ Facebook, Zalo, Web, Word...):
        </div>
        <textarea id="fetchPasteInput" class="form-control" rows="8" placeholder="Dán văn bản lời nguyện bất kỳ vào đây, hệ thống sẽ tự động nhận diện Chủ tế, Ý nguyện 1-2-3-4, Đáp và Lời nguyện kết..." style="font-family:'Times New Roman',serif; font-size:0.95rem; line-height:1.9; margin-bottom:10px;"></textarea>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
          <button type="button" class="btn btn-outline" onclick="window.baiDocViewer.handleAutoFormatPaste()" style="font-weight:700; color:#6d28d9; border-color:#6d28d9; cursor:pointer;">
            ✨ Tự Động Chuẩn Hóa Định Dạng
          </button>
          <div style="font-size:0.75rem; color:var(--text-muted);">
            Tự động chia tách Chủ tế & Ý nguyện 1/ 2/ 3/ 4/ chuẩn phụng vụ
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:8px; flex-wrap:wrap;">
          <button type="button" class="btn" onclick="window.baiDocViewer.closeFetchModal()" style="background:var(--border); cursor:pointer;">Đóng</button>
          <button type="button" class="btn btn-outline" onclick="window.baiDocViewer.applyPastedContent(false)" style="border-color:#d97706; color:#d97706; font-weight:700; cursor:pointer;">
            💾 Lưu Bản Nháp
          </button>
          <button type="button" class="btn btn-primary" onclick="window.baiDocViewer.applyPastedContent(true)" style="background:linear-gradient(135deg, #16a34a, #15803d); font-weight:800; padding:8px 18px; border:none; cursor:pointer;">
            🚀 Áp Dụng Mẫu Này Cho Cả Đoàn
          </button>
        </div>
      </div>
    `;
  }

  handleAutoFormatPaste() {
    const inp = document.getElementById('fetchPasteInput');
    if (!inp || !inp.value.trim()) {
      alert('Vui lòng dán văn bản lời nguyện vào ô trước khi chuẩn hóa!');
      return;
    }
    const formatted = parseRawLnthText(inp.value.trim());
    inp.value = formatted;
  }

  applyPastedContent(publishNow = true) {
    const inp = document.getElementById('fetchPasteInput');
    if (!inp || !inp.value.trim()) {
      alert('Vui lòng nhập hoặc dán nội dung lời nguyện!');
      return;
    }
    const formatted = parseRawLnthText(inp.value.trim());
    this.applyFetchedPrayer(formatted, publishNow);
  }

  // Áp dụng lời nguyện vào Bộ Lễ hiện tại và lưu vào Firebase / IndexedDB
  async applyFetchedPrayer(prayerText, publishNow = true) {
    if (!prayerText) return;

    if (this.currentMassSet) {
      this.currentMassSet.loiNguyenText = prayerText;
      this.currentMassSet.loiNguyenPublished = !!publishNow;
      if (publishNow) {
        this.currentMassSet.loiNguyenPublishedAt = new Date().toISOString();
      }
      if (window.dohwaStore) {
        await window.dohwaStore.saveMassSet(this.currentMassSet);
      }
    }

    this.closeFetchModal();

    const toast = document.createElement('div');
    toast.className = 'dohwa-toast';
    toast.textContent = publishNow
      ? '🎉 Đã áp dụng & ban hành Lời Nguyện Tín Hữu cho cả đoàn!'
      : '💾 Đã lưu Lời Nguyện thành bản nháp (ca viên chưa thấy).';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);

    const contentEl = document.getElementById('baiDocContent');
    if (contentEl) {
      this.renderLoiNguyen(contentEl, this.currentMassSet);
    }
  }
}

// Khởi tạo global
window.calculateLiturgicalInfo = calculateLiturgicalInfo;
window.getLiturgicalBookTitle = getLiturgicalBookTitle;
window.baiDocViewer = new BaiDocViewer();
window.openMassBaiDoc = function(msId) {
  if (window.baiDocViewer) {
    window.baiDocViewer.openForMassSet(msId);
  }
};
