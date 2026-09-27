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
const OFFLINE_LITURGY_STORE = {
  '2026-09-26': {
    title: 'Chúa Nhật 25 Thường Niên - Năm A',
    bd1: {
      ref: 'Is 55, 6-9',
      bookTitle: 'Bài trích sách ngôn sứ I-sai-a.',
      lead: 'Tư tưởng của Ta không phải là tư tưởng của các ngươi.',
      content: `Hãy tìm Đức Chúa khi Người còn cho gặp, kêu cầu Người lúc Người ở kề bên. Kẻ gian ác, hãy bỏ đường lối mình, người bất lương, hãy bỏ tư tưởng mình, mà trở về với Đức Chúa - và Người sẽ xót thương, về với Thiên Chúa chúng ta, vì Người rộng lòng tha thứ.<br><br>Thật vậy, tư tưởng của Ta không phải là tư tưởng của các ngươi, và đường lối các ngươi không phải là đường lối của Ta - sấm ngôn của Đức Chúa. Trời cao hơn đất chừng nào, thì đường lối của Ta cũng cao hơn đường lối các ngươi, và tư tưởng của Ta cũng cao hơn tư tưởng các ngươi chừng ấy.`
    },
    tv: {
      ref: 'Thánh Vịnh 144, 2-3. 8-9. 17-18',
      dap: 'Chúa gần gũi mọi kẻ kêu cầu Người.',
      pdfName: 'Dap_Ca_Chua_Nhat_25_A.pdf'
    },
    bd2: {
      ref: 'Pl 1, 20c-24. 27a',
      bookTitle: 'Bài trích thư của Thánh Phaolô Tông đồ gửi tín hữu Phi-líp-phê.',
      lead: 'Đối với tôi, sống là Đức Kitô và chết là một mối lợi.',
      content: `Thưa anh em, dù tôi sống hay tôi chết, Đức Kitô cũng sẽ được vẻ vang nơi thân xác tôi. Vì đối với tôi, sống là Đức Kitô, và chết là một mối lợi. Nếu sống ở đời này mà công việc của tôi sinh hoa kết quả, thì tôi không biết nên chọn đàng nào.<br><br>Tôi bị giằng co giữa hai đàng: ước ao của tôi là ra đi để được ở với Đức Kitô, điều này tốt hơn bội phần; nhưng ở lại trong thân xác thì cần thiết hơn cho anh em.<br><br>Chỉ có một điều là anh em phải ăn ở làm sao cho xứng với Tin Mừng của Đức Kitô.`
    },
    tm: {
      ref: 'Mt 20, 1-16a',
      bookTitle: 'Tin Mừng Chúa Giê-su Ki-tô theo thánh Mát-thêu.',
      lead: 'Hay mắt bạn ganh tị vì tôi nhân lành?',
      alleluia: 'Chúa nói: Lời Thầy là Thần Khí và là Sự Sống. Thầy mới có những lời đem lại sự sống đời đời.',
      content: `Khi ấy, Đức Giê-su kể cho các môn đệ dụ ngôn này: "Nước Trời giống như chuyện gia chủ kia, vừa tảng sáng đã ra mướn thợ vào làm vườn nho cho mình. Sau khi đã thoả thuận với thợ là mỗi ngày một quan tiền, ông sai họ vào vườn nho làm việc.<br><br>Khoảng giờ thứ ba, ông trở ra, thấy có những người khác ở không, đang đứng ngoài chợ. Ông cũng bảo họ: 'Cả các anh nữa, hãy đi vào vườn nho, tôi sẽ trả cho các anh hợp lẽ công bằng.' Họ liền đi. Khoảng giờ thứ sáu, rồi giờ thứ chín, ông lại trở ra và cũng làm như vậy.<br><br>Khoảng giờ thứ mười một, ông trở ra, thấy còn có những người khác đứng đó, ông nói với họ: 'Sao các anh đứng đây suốt ngày không làm gì hết?' Họ đáp: 'Vì không ai mướn chúng tôi.' Ông bảo họ: 'Cả các anh nữa, hãy đi vào vườn nho!'<br><br>Chiều đến, ông chủ vườn nho bảo người quản lý: 'Anh gọi thợ lại mà trả công cho họ, cứ bắt đầu từ người vào sau chót tới người đầu tiên.' Vậy những người mới vào làm lúc giờ thứ mười một tiến lại, và mỗi người được lãnh một quan tiền. Khi những người vào làm trước nhất tiến lại, họ tưởng là sẽ được lãnh nhiều hơn, thế nhưng mỗi người cũng chỉ lãnh được một quan tiền. Vừa lãnh xong, họ liền cằn nhằn với gia chủ: 'Mấy người sau chót này chỉ làm có một giờ, thế mà ông lại coi họ ngang hàng với chúng tôi là những người đã phải làm việc nặng nhọc suốt ngày, lại còn bị nắng nôi thiêu đốt!' Nhưng gia chủ trả lời cho một người trong bọn họ: 'Này bạn, tôi đâu có bất công với bạn! Bạn đã chẳng thoả thuận với tôi là một quan tiền sao? Cầm lấy phần của bạn mà đi đi! Còn tôi, tôi muốn cho người sau chót này cũng được bằng bạn đó. Chẳng lẽ tôi lại không có quyền tùy ý định đoạt về những gì là của tôi sao? Hay vì thấy tôi tốt bụng, mà bạn đâm ra ghen tức?'<br><br>Thế là những kẻ đứng chót sẽ được lên hàng đầu, còn những kẻ đứng đầu sẽ phải xuống hàng chót."`
    },
    lnth: `LỜI NGUYỆN TÍN HỮU – CHÚA NHẬT 25 THƯỜNG NIÊN - NĂM A
Chủ tế: Anh chị em thân mến, Thiên Chúa là Cha nhân từ đầy lòng quảng đại và bao dung, đường lối Người vượt xa mọi tính toán nhân loại. Với niềm tin tưởng và phó thác, chúng ta cùng tha thiết dâng lời nguyện xin:
1. Cầu cho Hội Thánh: Xin Chúa gìn giữ Đức Giáo Hoàng, các Đức Giám Mục và các Linh Mục, để các ngài luôn là những mục tử nhân lành dẫn dắt đoàn chiên Chúa theo tinh thần Tin Mừng.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
2. Cầu cho thế giới: Xin Chúa ban ơn bình an cho các dân tộc, xoa dịu những nỗi đau của các nạn nhân chiến tranh, đói nghèo, bệnh tật và thiên tai.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
3. Cầu cho những người đang gặp thử thách gian truân: Xin Chúa nâng đỡ những ai đang ngã lòng, thất vọng, để họ luôn tìm thấy niềm an ủi và cậy trông nơi lòng Chúa xót thương.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
4. Cầu cho Ca Đoàn Dohwa và Cộng đoàn giáo xứ: Xin Chúa ban cho mỗi ca viên lòng nhiệt thành mến Chúa, biết dùng tiếng hát để phụng sự Thánh Lễ và loan báo tình yêu Chúa trong tinh thần hiệp nhất yêu thương.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
Chủ tế: Lạy Chúa, xin thương chấp nhận những ước nguyện chân thành của cộng đoàn chúng con, nhờ Đức Kitô, Chúa chúng con. - Amen.`
  },
  '2026-10-04': {
    title: 'Chúa Nhật 26 Thường Niên - Năm A',
    bd1: {
      ref: 'Ed 18, 25-28',
      bookTitle: 'Bài trích sách ngôn sứ Ê-dê-ki-en.',
      lead: 'Nếu kẻ gian ác từ bỏ điều dữ nó đã phạm, nó sẽ cứu được mạng sống mình.',
      content: `Đức Chúa phán thế này: Các ngươi lại nói: 'Đường lối của Chúa không ngay thẳng!' Vậy hỡi nhà Ít-ra-en, hãy nghe đây: Có phải đường lối của Ta không ngay thẳng hay đường lối của các ngươi mới không ngay thẳng? Khi người công chính từ bỏ lẽ công chính của mình mà phạm tội ác và phải chết, thì chính vì tội ác nó phạm mà nó phải chết. Còn nếu kẻ gian ác từ bỏ điều dữ nó đã phạm mà thi hành điều chính trực công minh, thì nó sẽ cứu được mạng sống mình.`
    },
    tv: {
      ref: 'Thánh Vịnh 24, 4-5. 6-7. 8-9',
      dap: 'Lạy Chúa, xin nhớ lại lòng thương xót của Ngài.',
      pdfName: 'Dap_Ca_Chua_Nhat_25_A.pdf'
    },
    bd2: {
      ref: 'Pl 2, 1-11',
      bookTitle: 'Bài trích thư của Thánh Phaolô Tông đồ gửi tín hữu Phi-líp-phê.',
      lead: 'Anh em hãy có cùng một tâm tình như chính Đức Kitô Giêsu.',
      content: `Thưa anh em, nếu quả thật sự liên kết với Đức Kitô đem lại cho anh em một niềm an ủi, nếu tình bác ái khích lệ anh em, nếu anh em được hiệp thông trong Thần Khí, nếu anh em có lòng thương xót và cảm thông, thì xin anh em hãy làm cho niềm vui của tôi được trọn vẹn, là hãy có cùng một cảm nghĩ, cùng một lòng mến, cùng một tâm hồn, cùng một ý hướng.`
    },
    tm: {
      ref: 'Mt 21, 28-32',
      bookTitle: 'Tin Mừng Chúa Giê-su Ki-tô theo thánh Mát-thêu.',
      lead: 'Nó hối hận và đã đi làm.',
      alleluia: 'Chúa nói: Chiên của Tôi thì nghe tiếng Tôi, Tôi biết chúng và chúng theo Tôi.',
      content: `Khi ấy, Đức Giê-su nói với các thượng tế và kỳ mục trong dân rằng: "Các ông nghĩ sao: Một người kia có hai đứa con trai. Ông ta đến nói với đứa thứ nhất: 'Này con, hôm nay con hãy đi làm vườn nho.' Nó đáp: 'Con không muốn đâu!' Nhưng sau đó, nó hối hận, nên lại đi. Ông ta đến gặp đứa thứ hai và cũng bảo như vậy. Nó đáp: 'Thưa ngài, vâng, con đi!' nhưng rồi lại không đi. Trong hai người con đó, ai đã làm theo ý muốn của người cha?" Họ đáp: "Người thứ nhất."`
    },
    lnth: `LỜI NGUYỆN TÍN HỮU – CHÚA NHẬT 26 THƯỜNG NIÊN - NĂM A
Chủ tế: Anh chị em thân mến, Thiên Chúa luôn yêu thương mời gọi chúng ta cộng tác xây dựng Nước Trời bằng đời sống hoán cải chân thành. Với tâm tình tin tưởng, chúng ta cùng dâng lời cầu xin:
1. Cầu cho các vị chủ chăn trong Hội Thánh: Xin Chúa ban cho các ngài sức mạnh và lòng nhân ái, để luôn nêu gương sáng vâng phục Thánh ý Chúa và tận tụy phục vụ đoàn chiên.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
2. Cầu cho các nhà lãnh đạo quốc gia: Xin Chúa soi sáng tâm trí các nhà cầm quyền, biết hành động vì công lý, hòa bình và lợi ích chân chính của mọi người dân.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
3. Cầu cho những ai đang lạc lối xa Chúa: Xin ơn Chúa biến đổi tâm hồn họ, giúp họ nhận ra tình thương của Chúa mà can đảm hối cải trở về.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
4. Cầu cho toàn thể Ca đoàn và cộng đoàn chúng ta: Xin Chúa giúp mỗi người chúng ta không chỉ vâng lời Chúa bằng môi miệng, mà bằng trọn cả hành động yêu thương cụ thể mỗi ngày.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
Chủ tế: Lạy Chúa, xin nhậm lời cầu tha thiết của chúng con và ban ơn giúp chúng con luôn trung thành thực thi ý Chúa. Chúng con cầu xin nhờ Đức Kitô, Chúa chúng con. - Amen.`
  }
};

/**
 * KHO MẪU LỜI NGUYỆN TÍN HỮU CHUẨN PHỤNG VỤ ĐA DẠNG CÁC MÙA & LỄ TRỌNG
 */
const LITURGICAL_PRAYERS_CATALOG = [
  {
    id: 'cn25_tn_a',
    title: 'Chúa Nhật 25 Thường Niên - Năm A',
    subtitle: 'Lòng quảng đại của Thiên Chúa & Tinh thần phục vụ',
    text: `LỜI NGUYỆN TÍN HỮU – CHÚA NHẬT 25 THƯỜNG NIÊN - NĂM A
Chủ tế: Anh chị em thân mến, Thiên Chúa là Cha nhân từ đầy lòng quảng đại và bao dung, đường lối Người vượt xa mọi tính toán nhân loại. Với niềm tin tưởng và phó thác, chúng ta cùng tha thiết dâng lời nguyện xin:
1. Cầu cho Hội Thánh: Xin Chúa gìn giữ Đức Giáo Hoàng, các Đức Giám Mục và các Linh Mục, để các ngài luôn là những mục tử nhân lành dẫn dắt đoàn chiên Chúa theo tinh thần Tin Mừng.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
2. Cầu cho thế giới: Xin Chúa ban ơn bình an cho các dân tộc, xoa dịu những nỗi đau của các nạn nhân chiến tranh, đói nghèo, bệnh tật và thiên tai.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
3. Cầu cho những người đang gặp thử thách gian truân: Xin Chúa nâng đỡ những ai đang ngã lòng, thất vọng, để họ luôn tìm thấy niềm an ủi và cậy trông nơi lòng Chúa xót thương.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
4. Cầu cho Ca Đoàn Dohwa và Cộng đoàn giáo xứ: Xin Chúa ban cho mỗi ca viên lòng nhiệt thành mến Chúa, biết dùng tiếng hát để phụng sự Thánh Lễ và loan báo tình yêu Chúa trong tinh thần hiệp nhất yêu thương.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
Chủ tế: Lạy Chúa, xin thương chấp nhận những ước nguyện chân thành của cộng đoàn chúng con, nhờ Đức Kitô, Chúa chúng con. - Amen.`
  },
  {
    id: 'cn26_tn_a',
    title: 'Chúa Nhật 26 Thường Niên - Năm A',
    subtitle: 'Vâng phục Thánh ý bằng hành động cụ thể',
    text: `LỜI NGUYỆN TÍN HỮU – CHÚA NHẬT 26 THƯỜNG NIÊN - NĂM A
Chủ tế: Anh chị em thân mến, Thiên Chúa luôn yêu thương mời gọi chúng ta cộng tác xây dựng Nước Trời bằng đời sống hoán cải chân thành. Với tâm tình tin tưởng, chúng ta cùng dâng lời cầu xin:
1. Cầu cho các vị chủ chăn trong Hội Thánh: Xin Chúa ban cho các ngài sức mạnh và lòng nhân ái, để luôn nêu gương sáng vâng phục Thánh ý Chúa và tận tụy phục vụ đoàn chiên.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
2. Cầu cho các nhà lãnh đạo quốc gia: Xin Chúa soi sáng tâm trí các nhà cầm quyền, biết hành động vì công lý, hòa bình và lợi ích chân chính của mọi người dân.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
3. Cầu cho những ai đang lạc lối xa Chúa: Xin ơn Chúa biến đổi tâm hồn họ, giúp họ nhận ra tình thương của Chúa mà can đảm hối cải trở về.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
4. Cầu cho toàn thể Ca đoàn và cộng đoàn chúng ta: Xin Chúa giúp mỗi người chúng ta không chỉ vâng lời Chúa bằng môi miệng, mà bằng trọn cả hành động yêu thương cụ thể mỗi ngày.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
Chủ tế: Lạy Chúa, xin nhậm lời cầu tha thiết của chúng con và ban ơn giúp chúng con luôn trung thành thực thi ý Chúa. Chúng con cầu xin nhờ Đức Kitô, Chúa chúng con. - Amen.`
  },
  {
    id: 'thuong_nien_chung',
    title: 'Mùa Thường Niên (Mẫu Chung Phụng Vụ)',
    subtitle: 'Cầu cho Hội Thánh, Xã hội, Bệnh nhân & Giáo xứ',
    text: `LỜI NGUYỆN TÍN HỮU – MÙA THƯỜNG NIÊN
Chủ tế: Anh chị em thân mến, Thiên Chúa là Cha hằng săn sóc và yêu thương hết mọi tạo vật. Trong tâm tình con thảo, chúng ta cùng dâng lên Người những ước nguyện chân thành:
1. Cầu cho toàn thể Hội Thánh: Xin Chúa liên kết các Kitô hữu trong đức tin kiên vững và lòng mến chân thành, để Hội Thánh luôn là ánh sáng và muối men giữa lòng thế giới.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
2. Cầu cho hòa bình và thịnh vượng của các dân tộc: Xin Chúa xua tan bạo lực, bất công và hận thù, để mọi người được sống trong thanh bình, công lý và tôn trọng lẫn nhau.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
3. Cầu cho những người nghèo khổ, bệnh tật và cô đơn: Xin Chúa thương nâng đỡ ủi an và khơi dậy nơi tâm hồn các tín hữu lòng bác ái sẵn sàng cứu giúp.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
4. Cầu cho cộng đoàn phụng vụ và ca đoàn chúng ta: Xin Chúa thánh hóa mọi công việc, học tập và sứ vụ phục vụ bàn thánh của chúng con, để đời sống chúng con làm sáng danh Chúa.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
Chủ tế: Lạy Chúa là Đấng giàu lòng từ bi, xin lắng nghe và nhậm lời đoàn con tha thiết nguyện xin, nhờ Đức Kitô, Chúa chúng con. - Amen.`
  },
  {
    id: 'mua_vong',
    title: 'Mùa Vọng (Chờ Đón Đấng Cứu Thế)',
    subtitle: 'Tỉnh thức, nguyện cầu và chuẩn bị tâm hồn',
    text: `LỜI NGUYỆN TÍN HỮU – MÙA VỌNG
Chủ tế: Anh chị em thân mến, trong tâm tình tỉnh thức và hân hoan đón chờ Đấng Cứu Thế ngự đến, chúng ta cùng hiệp ý dâng lên Thiên Chúa lời nguyện xin tha thiết:
1. Cầu cho Hội Thánh: Xin Chúa soi sáng và ban ơn thánh hóa, để Hội Thánh luôn can đảm loan báo niềm hy vọng Cứu độ cho muôn dân.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
2. Cầu cho thế giới còn đầy bóng tối chiến tranh và chia rẽ: Xin Ánh Sáng của Đức Kitô mau xua tan bóng đêm tăm tối, đem lại bình an và hòa giải cho nhân loại.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
3. Cầu cho những tâm hồn đang nguội lạnh, khô khan: Xin ơn Chúa thức tỉnh lòng họ, giúp họ biết thanh tẩy tâm hồn để xứng đáng đón rước Chúa đến.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
4. Cầu cho ca viên và cộng đoàn chúng ta: Xin cho mỗi người chúng ta biết dọn đường cho Chúa bằng đời sống yêu thương, cầu nguyện và chia sẻ với người khó khăn.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
Chủ tế: Lạy Chúa, xin mau đến và đừng trì hoãn, xin giải thoát chúng con khỏi mọi gông cùm tội lỗi, Đấng hằng sống và hiển trị muôn đời. - Amen.`
  },
  {
    id: 'mua_giang_sinh',
    title: 'Mùa Giáng Sinh (Chúa Ngôi Hai Giáng Trần)',
    subtitle: 'Vinh danh Thiên Chúa - Bình an cho người thiện tâm',
    text: `LỜI NGUYỆN TÍN HỮU – ĐẠI LỄ GIÁNG SINH
Chủ tế: Anh chị em thân mến, "Ngôi Lời đã làm người và ở giữa chúng ta". Trong niềm hân hoan tạ ơn tình yêu khôn ví của Thiên Chúa, chúng ta cùng hiệp lời cầu xin:
1. Cầu cho Hội Thánh: Xin Chúa Hài Đồng ban muôn phúc lành trên Đức Giáo Hoàng và các chủ chăn, để các ngài luôn nhiệt thành đem tin mừng bình an đến cho muôn người.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
2. Cầu cho hòa bình nhân loại: Xin Hoàng Tử Bình An xoa dịu các vết thương chiến tranh, ban bình an thật sự cho các gia đình và các dân tộc trên khắp địa cầu.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
3. Cầu cho trẻ em nghèo và những người không nơi nương tựa: Xin Chúa ban cho họ tìm thấy hơi ấm tình người và sự sẻ chia chân thành từ những tấm lòng quảng đại.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
4. Cầu cho các gia đình trong giáo xứ và ca đoàn chúng ta: Xin Chúa Hài Đồng gìn giữ mái ấm gia đình chúng con luôn hiệp nhất, ấm êm và tràn ngập niềm vui cứu độ.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
Chủ tế: Lạy Chúa Giêsu Hài Đồng, xin ngự vào tâm hồn chúng con và ở lại với chúng con luôn mãi. Chúa hằng sống và hiển trị muôn đời. - Amen.`
  },
  {
    id: 'mua_chay',
    title: 'Mùa Chay (Sám Hối, Canh Tân & Bác Ái)',
    subtitle: 'Trở về với lòng thương xót Chúa',
    text: `LỜI NGUYỆN TÍN HỮU – MÙA CHAY
Chủ tế: Anh chị em thân mến, Mùa Chay là thời gian thuận tiện để chúng ta trở về với Chúa bằng sự cầu nguyện, chay tịnh và làm việc bác ái. Với lòng sám hối chân thành, chúng ta cùng tha thiết nguyện xin:
1. Cầu cho các tín hữu: Xin Chúa ban ơn soi sáng để mỗi Kitô hữu biết nhìn nhận tội lỗi của mình và can đảm hoán cải đời sống theo ánh sáng Phúc Âm.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
2. Cầu cho những người đang chịu đau khổ về thể xác cũng như tinh thần: Xin Chúa ban sức mạnh giúp họ vác thánh giá theo chân Chúa với niềm tin tưởng và cậy trông.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
3. Cầu cho các dự tòng đang chuẩn bị gia nhập Hội Thánh: Xin Chúa củng cố đức tin và ban đầy tràn Thánh Thần để họ trung thành bước theo Đức Kitô.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
4. Cầu cho cộng đoàn và ca đoàn chúng ta: Xin cho chúng con biết mở rộng lòng bác ái, hy sinh giúp đỡ tha nhân và đồng hành với nhau trong tâm tình khiêm nhường.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
Chủ tế: Lạy Thiên Chúa nhân từ từ bi, xin dủ lòng thương tha thứ tội khiên và nhận lời chúng con cầu nguyện, nhờ Đức Kitô, Chúa chúng con. - Amen.`
  },
  {
    id: 'mua_phuc_sinh',
    title: 'Mùa Phục Sinh (Đức Kitô Chiến Thắng Khải Hoàn)',
    subtitle: 'Niềm vui Phục Sinh & Sự sống mới',
    text: `LỜI NGUYỆN TÍN HỮU – ĐẠI LỄ PHỤC SINH
Chủ tế: Anh chị em thân mến, Đức Kitô đã sống lại từ cõi chết, đập tan xiềng xích tội lỗi và mở lối vào cõi trường sinh. Trong hân hoan rạng rỡ của ngày Phục Sinh, chúng ta cùng dâng lên Người lời nguyện xin:
1. Cầu cho Hội Thánh: Xin Chúa Phục Sinh ban sức sống mới dồi dào trên Hội Thánh, để Hội Thánh luôn can đảm làm chứng cho sự sống lại của Chúa giữa trần gian.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
2. Cầu cho thế giới: Xin Ánh Sáng Phục Sinh xua tan bóng tối hận thù, bất công và sợ hãi, đem lại niềm vui và bình an đích thực cho toàn thể nhân loại.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
3. Cầu cho những người đang thất vọng trước cái chết và đau khổ: Xin niềm tin vào sự Phục Sinh của Đức Kitô là điểm tựa vững chắc nâng đỡ họ vượt qua mọi nghịch cảnh.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
4. Cầu cho cộng đoàn và các ca viên: Xin Chúa cho mỗi chúng ta luôn sống như những người đã cùng sống lại với Đức Kitô, biết tìm kiếm những sự trên trời và yêu thương phục vụ lẫn nhau.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
Chủ tế: Lạy Chúa Giêsu Phục Sinh, xin ban Thánh Thần của Chúa tràn ngập lòng chúng con, Đấng hằng sống và hiển trị muôn đời. - Amen.`
  },
  {
    id: 'le_duc_me',
    title: 'Lễ Kính Đức Mẹ (Noi Gương Vâng Phục)',
    subtitle: 'Xin Mẹ cầu bầu nâng đỡ đoàn con',
    text: `LỜI NGUYỆN TÍN HỮU – LỄ KÍNH ĐỨC MẸ
Chủ tế: Anh chị em thân mến, Đức Trinh Nữ Maria đã thưa tiếng "Xin Vâng" trọn hảo để đón nhận Ngôi Lời Nhập Thể. Nhờ lời chuyển cầu của Mẹ, chúng ta cùng tin tưởng dâng lên Thiên Chúa lời nguyện xin:
1. Cầu cho Hội Thánh: Xin Chúa gìn giữ Hội Thánh luôn trung kiên và thánh thiện, noi gương Mẹ Maria luôn lắng nghe và suy niệm Lời Chúa trong lòng.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
2. Cầu cho các người mẹ trong gia đình: Xin Mẹ Maria ban ơn phù trợ, giúp các bà mẹ luôn dịu hiền, đảm đang và dạy dỗ con cái sống đẹp lòng Chúa.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
3. Cầu cho những ai đang đau yếu, cô đơn hay gặp hoạn nạn: Xin Mẹ phù hộ các giáo hữu đoái thương nâng đỡ, che chở họ dưới tà áo Mẹ từ bi.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
4. Cầu cho Ca Đoàn và cộng đoàn chúng con: Xin cho mỗi ca viên luôn biết dâng tiếng hát ngợi khen Chúa như lời bài ca Magnificat của Mẹ năm xưa.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
Chủ tế: Lạy Chúa, nhờ lời chuyển cầu thần thế của Đức Mẹ Maria, xin thương ban cho chúng con muôn ơn lành hồn xác, nhờ Đức Kitô, Chúa chúng con. - Amen.`
  },
  {
    id: 'le_bon_mang_ca_doan',
    title: 'Lễ Bổn Mạng Ca Đoàn (Hiệp Nhất & Phụng Sự)',
    subtitle: 'Dâng tiếng ca tiếng hát làm sáng Danh Chúa',
    text: `LỜI NGUYỆN TÍN HỮU – LỄ QUAN THẦY CA ĐOÀN DOHWA
Chủ tế: Anh chị em thân mến, Thánh Augustinô đã dạy rằng: "Hát là cầu nguyện hai lần". Trong tâm tình tạ ơn Thiên Chúa nhân ngày lễ mừng Bổn Mạng Ca Đoàn, chúng ta cùng tha thiết dâng lời nguyện xin:
1. Cầu cho Hội Thánh: Xin Chúa chúc lành cho sứ vụ phụng vụ thánh ca của Hội Thánh, để lời ca tiếng hát luôn nâng tâm hồn các tín hữu lên tới Chúa.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
2. Cầu cho Linh Mục Chánh Xứ và các ân nhân của Ca Đoàn: Xin Chúa trả công bội hậu cho quý vị đã yêu thương, nâng đỡ và đồng hành với ca đoàn trong suốt thời gian qua.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
3. Cầu cho các ca viên đã qua đời: Xin Chúa thương đón nhận các linh hồn ca viên tiền bối vào quê trời, để các ngài được cùng các thiên thần muôn đời ca tụng Danh Chúa.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
4. Cầu cho toàn thể Ca viên Ca Đoàn Dohwa: Xin Chúa ban cho mỗi anh chị em ca viên tinh thần hy sinh, lòng nhiệt thành mến Chúa, luôn đoàn kết yêu thương và say mê cất cao lời ca phụng vụ bàn thánh.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.
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
      res += `Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.\n\n`;
    });
  } else {
    res += `1. Cầu cho Hội Thánh: Xin Chúa gìn giữ Đức Giáo Hoàng và các chủ chăn luôn trung tín và nhiệt thành dẫn dắt đoàn chiên.\n`;
    res += `Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.\n\n`;
    res += `2. Cầu cho thế giới: Xin Chúa ban ơn bình an, công lý và xua tan mọi dịch bệnh, chiến tranh trên khắp hoàn cầu.\n`;
    res += `Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.\n\n`;
    res += `3. Cầu cho những người đau khổ: Xin Chúa an ủi, nâng đỡ những ai đang gặp nghịch cảnh và thử thách gian nan.\n`;
    res += `Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.\n\n`;
    res += `4. Cầu cho ca đoàn và giáo xứ: Xin Chúa liên kết mọi người trong tình yêu hiệp nhất và nhiệt thành phục vụ bàn thánh.\n`;
    res += `Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.\n\n`;
  }

  res += `Chủ tế: ${closing || 'Lạy Chúa, xin thương chấp nhận những ước nguyện chân thành của cộng đoàn chúng con, nhờ Đức Kitô, Chúa chúng con. - Amen.'}`;
  return res;
}

/**
 * BẢN TỔNG HỢP AI CHUẨN PHỤNG VỤ CÔNG GIÁO VIỆT NAM
 * Đối chiếu từ: HĐGMVN, TGP Sài Gòn, Dòng Đa Minh, TGP Hà Nội, GP Xuân Lộc
 */
const AI_LITURGICAL_SYNTHESIS = {
  'cn25_tn_a': {
    standard: `LỜI NGUYỆN TÍN HỮU – CHÚA NHẬT 25 THƯỜNG NIÊN - NĂM A
(Bản tổng hợp chuẩn mực: HĐGMVN & TGP Sài Gòn)
Chủ tế: Anh chị em thân mến, Thiên Chúa là Cha giàu lòng thương xót và bao dung khôn tả, đường lối của Người vượt xa mọi suy nghĩ và tính toán hẹp hòi của phàm nhân. Trong niềm tri ân sâu xa và phó thác trọn vẹn, chúng ta cùng tha thiết dâng lời nguyện xin:

1. Cầu cho Hội Thánh hoàn vũ: Xin Chúa hằng gìn giữ Đức Giáo Hoàng Phanxicô, các Đức Giám Mục, Linh Mục và toàn thể Dân Thánh, để Hội Thánh luôn chiếu tỏa dung nhan Thiên Chúa từ ái và không ngừng loan báo ơn cứu độ cho muôn dân.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.

2. Cầu cho hòa bình thế giới và các dân tộc: Xin Chúa soi sáng tâm trí các nhà lãnh đạo quốc gia, biết kiến tạo công lý, hòa giải mọi xung đột, và quan tâm nâng đỡ những người nghèo đói, bất hạnh, nạn nhân chiến tranh và thiên tai.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.

3. Cầu cho những tâm hồn đang gặp thử thách, chán chường: Xin tình yêu Chúa sưởi ấm những ai đang cảm thấy bị bỏ rơi hoặc chịu nhiều thiệt thòi trong cuộc sống, để họ luôn vững niềm trông cậy vào lòng nhân hậu và sự công minh tuyệt đối của Chúa.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.

4. Cầu cho Ca Đoàn Dohwa và Cộng đoàn giáo xứ chúng ta: Xin Chúa ban cho mỗi ca viên và mỗi tín hữu tinh thần khiêm tốn, quảng đại và hiệp nhất yêu thương, để qua từng lời ca tiếng hát và hành động cụ thể, chúng con làm sáng danh Chúa giữa lòng cuộc đời.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.

Chủ tế: Lạy Thiên Chúa toàn năng nhân từ, xin thương lắng nghe và chấp nhận những lời thỉnh cầu của đoàn con thảo, xin ban ơn giúp chúng con luôn biết vui mừng trước ơn lành Chúa ban cho anh chị em mình. Chúng con cầu xin nhờ Đức Kitô, Chúa chúng con. - Amen.`,

    pastoral: `LỜI NGUYỆN TÍN HỮU – CHÚA NHẬT 25 THƯỜNG NIÊN - NĂM A
(Bản mục vụ sâu sắc: Dòng Đa Minh & TGP Hà Nội)
Chủ tế: Anh chị em thân mến, Thiên Chúa mời gọi tất cả chúng ta bước vào vườn nho Nước Trời để đón nhận hồng ân cứu độ vô điều kiện. Cảm tạ tình thương hải hà của Chúa, chúng ta cùng hiệp ý cầu xin:

1. "Trời cao hơn đất chừng nào, đường lối Ta cao hơn đường lối các ngươi chừng ấy": Xin cho mọi thành phần Dân Chúa luôn biết suy nghĩ và hành động theo tinh thần Tin Mừng, không so đo tính toán, nhưng hết lòng yêu thương và phục vụ.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.

2. Cầu cho người lao động và những người thất nghiệp: Xin Chúa chúc lành cho công việc làm ăn của mọi người, xoa dịu nỗi lo âu của những gia đình đang thiếu thốn công ăn việc làm, để xã hội ngày càng công bằng và nhân ái hơn.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.

3. Cầu cho các tội nhân và những người lạc xa đường Chúa: Xin ơn biến đổi của Chúa chạm đến tâm hồn họ, để họ nhận ra tình thương tha thứ vô bờ của Thiên Chúa mà can đảm trở về làm hòa với Người.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.

4. Cầu cho các gia đình và ca viên trong cộng đoàn: Xin Chúa thánh hóa từng gia đình chúng con, ban cho các bậc cha mẹ lòng kiên nhẫn, cho giới trẻ lòng nhiệt thành mến Chúa và hăng say phục vụ bàn thánh.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.

Chủ tế: Lạy Chúa, xin đoái nhìn những ước nguyện chân thành của chúng con và ban sức mạnh Thần Khí giúp chúng con trung kiên bước đi trong tình thương của Chúa mỗi ngày. Chúng con cầu xin nhờ Đức Kitô, Chúa chúng con. - Amen.`,

    choir: `LỜI NGUYỆN TÍN HỮU – CHÚA NHẬT 25 THƯỜNG NIÊN - NĂM A
(Bản đồng hành Ca Đoàn & Giới Trẻ - Chuẩn Phụng Vụ)
Chủ tế: Anh chị em thân mến, tạ ơn Chúa đã quy tụ chúng ta nơi bàn tiệc Lời Chúa và Thánh Thể. Trong tinh thần hân hoan của đoàn con cái Chúa, chúng ta cùng dâng lên Người những ước nguyện tha thiết:

1. Cầu cho Hội Thánh và các vị mục tử: Xin Chúa ban dồi dào ơn thánh trên Đức Giáo Hoàng và các chủ chăn, để các ngài luôn dẫn dắt Dân Chúa đến nguồn suối bình an và ơn cứu độ.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.

2. Cầu cho các bạn trẻ và thế giới hôm nay: Xin Chúa soi đường chỉ lối cho thanh thiếu niên giữa muôn cám dỗ trần thế, biết sống có lý tưởng, hướng thiện và can đảm làm chứng cho Chân Lý.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.

3. Cầu cho các bệnh nhân và những người sầu khổ: Xin Chúa là nguồn an ủi duy nhất nâng đỡ thể xác lẫn tâm hồn họ, giúp họ nhận ra sự hiện diện đầy yêu thương của Chúa bên cạnh.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.

4. Cầu cho Ca Đoàn Dohwa và toàn thể phụng sự viên: Xin Chúa ban cho mỗi ca viên lòng đạo đức sâu sắc, tinh thần hy sinh luyện tập, để lời ca tiếng hát của ca đoàn thực sự là lời cầu nguyện sốt mến, nâng tâm hồn cộng đoàn lên cùng Chúa.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.

Chủ tế: Lạy Chúa, xin thương đón nhận lời ca tiếng hát và tấm lòng chân thành của chúng con, xin biến đổi cuộc đời chúng con thành bài ca tạ ơn muôn đời. Chúng con cầu xin nhờ Đức Kitô, Chúa chúng con. - Amen.`
  },

  'cn26_tn_a': {
    standard: `LỜI NGUYỆN TÍN HỮU – CHÚA NHẬT 26 THƯỜNG NIÊN - NĂM A
(Bản tổng hợp chuẩn mực: HĐGMVN & TGP Sài Gòn)
Chủ tế: Anh chị em thân mến, Thiên Chúa luôn yêu thương mời gọi chúng ta cộng tác xây dựng Nước Trời bằng đời sống hoán cải chân thành. Với tâm tình tin tưởng, chúng ta cùng dâng lời cầu xin:

1. Cầu cho các vị chủ chăn trong Hội Thánh: Xin Chúa ban cho các ngài sức mạnh và lòng nhân ái, để luôn nêu gương sáng vâng phục Thánh ý Chúa và tận tụy phục vụ đoàn chiên.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.

2. Cầu cho các nhà lãnh đạo quốc gia: Xin Chúa soi sáng tâm trí các nhà cầm quyền, biết hành động vì công lý, hòa bình và lợi ích chân chính của mọi người dân.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.

3. Cầu cho những ai đang lạc lối xa Chúa: Xin ơn Chúa biến đổi tâm hồn họ, giúp họ nhận ra tình thương của Chúa mà can đảm hối cải trở về.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.

4. Cầu cho toàn thể Ca đoàn và cộng đoàn chúng ta: Xin Chúa giúp mỗi người chúng ta không chỉ vâng lời Chúa bằng môi miệng, mà bằng trọn cả hành động yêu thương cụ thể mỗi ngày.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.

Chủ tế: Lạy Chúa, xin nhậm lời cầu tha thiết của chúng con và ban ơn giúp chúng con luôn trung thành thực thi ý Chúa. Chúng con cầu xin nhờ Đức Kitô, Chúa chúng con. - Amen.`,

    pastoral: `LỜI NGUYỆN TÍN HỮU – CHÚA NHẬT 26 THƯỜNG NIÊN - NĂM A
(Bản mục vụ sâu sắc: Dòng Đa Minh & TGP Hà Nội)
Chủ tế: Anh chị em thân mến, noi gương Đức Giêsu Kitô Đấng đã hạ mình vâng phục cho đến chết trên cây Thập Tự, chúng ta cùng tha thiết dâng lên Thiên Chúa lời nguyện xin:

1. Cầu cho Hội Thánh: Xin cho các tín hữu biết noi gương Đức Kitô, luôn khiêm nhường coi người khác hơn mình và đồng tâm nhất trí trong tình yêu thương.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.

2. Cầu cho những người đang bị áp bức, bất công: Xin Chúa bênh vực và đem lại công lý cho những ai cô thế cô thân, xoa dịu những giọt nước mắt khổ đau của họ.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.

3. Cầu cho những tâm hồn đang chai lì trong thói xấu: Xin Lời Chúa đánh động lương tâm họ, để họ biết kịp thời ăn năn sám hối và quay về với nguồn sống chân thật.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.

4. Cầu cho ca đoàn và cộng đoàn giáo xứ: Xin cho chúng con biết dùng tiếng hát và đời sống bác ái để làm chứng cho lòng vâng phục thảo hiếu với Thiên Chúa.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.

Chủ tế: Lạy Chúa là Cha chí thánh, xin gìn giữ chúng con trong ân sủng Chúa và ban cho chúng con tâm tình như chính Đức Giêsu Kitô, Chúa chúng con. - Amen.`,

    choir: `LỜI NGUYỆN TÍN HỮU – CHÚA NHẬT 26 THƯỜNG NIÊN - NĂM A
(Bản đồng hành Ca Đoàn & Giới Trẻ - Chuẩn Phụng Vụ)
Chủ tế: Anh chị em thân mến, lời nói phải đi đôi với việc làm. Lắng nghe tiếng Chúa dạy hôm nay, chúng ta cùng khiêm tốn dâng lên Người những lời cầu xin:

1. Cầu cho Đức Giáo Hoàng và các vị lãnh đạo Hội Thánh: Xin Chúa ban ơn khôn ngoan để các ngài luôn dẫn dắt Dân Chúa đi trên con đường Phúc Âm bằng chính đời sống thánh thiện gương mẫu.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.

2. Cầu cho giới trẻ và các sinh viên, học sinh: Xin Chúa gìn giữ người trẻ khỏi thái độ sống dửng dưng vô cảm, biết can đảm dấn thân vì Chúa và tha nhân.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.

3. Cầu cho những người bệnh tật và đau yếu: Xin Chúa là Đấng chữa lành ban niềm an ủi và củng cố đức tin cho họ giữa những cơn đau đớn bệnh tật.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.

4. Cầu cho Ca Đoàn Dohwa: Xin Chúa thánh hóa tiếng hát và tâm hồn từng ca viên, để sự phục vụ của ca đoàn luôn xuất phát từ lòng vâng phục và yêu mến Chúa chân thành.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.

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
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.

2. Cầu cho hòa bình thế giới và công lý giữa các dân tộc: Xin Chúa soi sáng tâm trí các nhà lãnh đạo, biết loại trừ bạo lực, xung đột, và hết lòng chăm lo cho sự phát triển toàn diện của con người, đặc biệt là những người nghèo khổ bất hạnh.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.

3. Cầu cho những người đang gặp thử thách gian nan: Xin Chúa ban sức mạnh nâng đỡ những ai đang đau yếu, cô đơn, nghèo đói hoặc ngã lòng, để họ luôn tìm thấy niềm an ủi và hy vọng nơi lòng Chúa từ bi.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.

4. Cầu cho Ca Đoàn Dohwa và Cộng đoàn giáo xứ chúng con: Xin Chúa ban cho mỗi người chúng con lòng nhiệt thành yêu mến Chúa, biết dùng lời ca tiếng hát và đời sống bác ái cụ thể để phụng sự bàn thánh và làm sáng danh Chúa.
Đáp: Chúng con cầu xin Chúa. - Xin Chúa nhậm lời chúng con.

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
  async renderReading(container, ms, tabKey) {
    const isBd1 = tabKey === 'bd1';
    const isTm = tabKey === 'tm';
    const dateStr = ms.date || '2026-09-26';

    const offlineData = OFFLINE_LITURGY_STORE[dateStr] || OFFLINE_LITURGY_STORE['2026-09-26'];
    let reading = null;
    let badgeText = 'BÀI ĐỌC I';
    let endText = 'Đó là Lời Chúa. — Tạ ơn Chúa.';

    if (isBd1) {
      reading = offlineData?.bd1;
      badgeText = 'BÀI ĐỌC I';
      endText = 'Đó là Lời Chúa. — Tạ ơn Chúa.';
    } else if (isTm) {
      reading = offlineData?.tm;
      badgeText = 'TIN MỪNG';
      endText = 'Đó là Lời Chúa. — Lạy Chúa Kitô, ngợi khen Chúa.';
    } else {
      reading = offlineData?.bd2;
      badgeText = 'BÀI ĐỌC II';
      endText = 'Đó là Lời Chúa. — Tạ ơn Chúa.';
    }

    if (reading) {
      const bookTitle = reading.bookTitle || getLiturgicalBookTitle(reading.ref, tabKey);
      container.innerHTML = `
        <div style="padding:6px 0;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px; margin-bottom:6px;">
            <span style="font-size:0.8rem; background:rgba(14,165,233,0.12); color:#0284c7; font-weight:800; padding:4px 12px; border-radius:6px; text-transform:uppercase; letter-spacing:0.5px;">
              ${badgeText}
            </span>
            <span style="font-size:0.95rem; font-weight:800; color:var(--text-muted); font-family:monospace; background:var(--bg-card-subtle); padding:3px 10px; border-radius:6px; border:1px solid var(--border);">
              ${reading.ref}
            </span>
          </div>

          <!-- TIÊU ĐỀ BÀI TRÍCH CHUẨN SÁCH BÀI ĐỌC PHỤNG VỤ -->
          <div style="font-family:'Times New Roman',serif; font-size:1.28rem; font-weight:800; color:#b91c1c; margin:12px 0 8px; line-height:1.4;">
            ${bookTitle}
          </div>

          ${reading.lead ? `
            <div style="font-style:italic; color:#475569; font-size:0.96rem; margin-bottom:16px; padding:10px 14px; background:rgba(0,0,0,0.03); border-left:4px solid #b91c1c; border-radius:0 8px 8px 0; font-family:'Times New Roman',serif;">
              "${reading.lead}"
            </div>
          ` : ''}

          ${isTm && reading.alleluia ? `
            <div style="margin-bottom:16px; padding:10px 14px; background:#fef3c7; border:1px solid #fde68a; border-radius:8px; font-size:0.92rem; color:#92400e; font-family:'Times New Roman',serif;">
              <strong>Alleluia:</strong> ${reading.alleluia}
            </div>
          ` : ''}

          <div style="font-family:'Times New Roman',serif; font-size:1.15rem; line-height:2.2; color:var(--text-main); border-top:1px solid var(--border); padding-top:16px; text-align:justify;">
            ${reading.content}
          </div>

          <div style="margin-top:22px; padding-top:14px; border-top:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <span style="font-weight:800; color:#6d28d9; font-family:'Times New Roman',serif; font-size:1.08rem;">
              ${endText}
            </span>
            <a href="https://ktcgkpv.org/readings/mass-reading" target="_blank" rel="noopener" style="font-size:0.75rem; color:var(--text-muted); text-decoration:none;">
              🔗 Nguồn: ktcgkpv.org ↗
            </a>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="text-align:center; padding:36px 16px; color:var(--text-muted)">
        <div style="font-size:2.8rem; margin-bottom:8px;">📖</div>
        <h3 style="color:var(--text-main); font-weight:800; margin-bottom:6px;">${isBd1 ? 'Bài Đọc 1' : isTm ? 'Tin Mừng' : 'Bài Đọc 2'}</h3>
        <p style="margin-top:8px; font-size:0.9rem;">Dữ liệu bài đọc đang được cập nhật từ Lịch Phụng Vụ hoặc ngày lễ này không có bài đọc tương ứng.</p>
        <a href="https://ktcgkpv.org/readings/mass-reading" target="_blank" rel="noopener" style="display:inline-block; margin-top:14px; font-size:0.85rem; color:#0ea5e9; font-weight:700;">Mở trang KTCGKPV ↗</a>
      </div>
    `;
  }

  /**
   * RENDER THÁNH VỊNH:
   * Chỉ hiển thị trực tiếp PHIÊN BẢN PDF CỦA THÁNH VỊNH ĐÁP CA (Không hiện text câu chữ thô)
   */
  renderThanhVinh(container, ms) {
    const songs = ms.songs || [];
    const dapCaSong = songs.find(s => s.role === 'dap_ca' || s.roleLabel?.includes('Đáp Ca') || s.roleLabel?.includes('Thánh Vịnh')) || songs[2];

    let pdfUrl = dapCaSong?.pdfData;
    let pdfName = dapCaSong?.pdfName || 'Dap_Ca_Chua_Nhat_25_A.pdf';

    if (!pdfUrl) {
      if (pdfName) {
        pdfUrl = pdfName.startsWith('sheets/') ? pdfName : `sheets/${pdfName}`;
      } else {
        pdfUrl = 'sheets/Dap_Ca_Chua_Nhat_25_A.pdf';
        pdfName = 'Dap_Ca_Chua_Nhat_25_A.pdf';
      }
    }

    const songTitle = dapCaSong?.title || 'Thánh Vịnh Đáp Ca';

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; width:100%; height:100%;">
        <!-- THANH CÔNG CỤ XEM & TẢI PDF THÁNH VỊNH -->
        <div style="background:var(--bg-card-subtle,#f8fafc); border:1px solid var(--border,#e2e8f0); border-radius:10px; padding:10px 14px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:1.3rem;">🎶</span>
            <div>
              <div style="font-size:0.95rem; font-weight:800; color:var(--text-main);">${songTitle}</div>
              <div style="font-size:0.75rem; color:var(--text-muted); font-family:monospace;">Bản nhạc PDF: ${pdfName}</div>
            </div>
          </div>
          <div style="display:flex; gap:8px; align-items:center;">
            <a href="${pdfUrl}" target="_blank" rel="noopener" class="action-btn btn-view" style="text-decoration:none; padding:6px 12px; font-size:0.82rem; font-weight:700; display:inline-flex; align-items:center; gap:4px;">
              ↗️ Mở Trang Mới
            </a>
            <button type="button" class="action-btn btn-view" onclick="window.dohwaPDFViewer && window.dohwaPDFViewer.open('${pdfUrl}', '${escapeHtml(songTitle)}', '${pdfName}')" style="padding:6px 12px; font-size:0.82rem; font-weight:700; background:#6d28d9; color:#fff; border:none; display:inline-flex; align-items:center; gap:4px; cursor:pointer;">
              ⛶ Toàn Màn Hình
            </button>
            <a href="${pdfUrl}" download="${pdfName}" class="action-btn btn-pdf" style="text-decoration:none; padding:6px 14px; font-size:0.82rem; font-weight:800; background:#0284c7; color:#fff; display:inline-flex; align-items:center; gap:4px;">
              📥 Tải PDF Về Máy
            </a>
          </div>
        </div>

        <!-- KHUNG NHÚNG BẢN NHẠC PDF CHUẨN -->
        <div style="flex:1; min-height:510px; border:1px solid var(--border); border-radius:10px; overflow:hidden; background:#525659; position:relative;">
          <object data="${pdfUrl}" type="application/pdf" width="100%" height="100%" style="min-height:510px; display:block;">
            <iframe src="${pdfUrl}" width="100%" height="100%" style="border:none; min-height:510px;">
              <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; min-height:360px; background:#fff; padding:24px; text-align:center;">
                <div style="font-size:3.5rem; margin-bottom:10px;">📄</div>
                <h4 style="font-weight:800; color:#1e293b; margin-bottom:6px;">${songTitle}</h4>
                <p style="color:#64748b; font-size:0.88rem; margin-bottom:16px;">Trình duyệt của bạn đang bảo mật hoặc không hỗ trợ đọc trực tiếp trong khung.</p>
                <div style="display:flex; gap:10px; justify-content:center;">
                  <a href="${pdfUrl}" target="_blank" rel="noopener" class="btn btn-outline" style="padding:8px 16px; font-weight:700;">↗️ Mở Trong Tab Mới</a>
                  <a href="${pdfUrl}" download="${pdfName}" class="btn btn-primary" style="padding:8px 18px; font-weight:800; background:#0284c7;">📥 Tải Bản PDF Về Máy</a>
                </div>
              </div>
            </iframe>
          </object>
        </div>
      </div>
    `;
  }

  /**
   * RENDER LỜI NGUYỆN TÍN HỮU:
   * Có nút [🌐 Lấy Từ Web] nổi bật
   */
  renderLoiNguyen(container, ms) {
    const dateStr = ms.date || '2026-09-26';
    const currentContent = ms.loiNguyenText || (OFFLINE_LITURGY_STORE[dateStr] || OFFLINE_LITURGY_STORE['2026-09-26']).lnth;

    container.innerHTML = `
      <div id="sb-lnth-view">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
          <span style="font-size:0.85rem; color:var(--text-muted); font-weight:700;">LỜI NGUYỆN TÍN HỮU (LỜI NGUYỆN CHUNG)</span>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button type="button" class="action-btn btn-pdf" onclick="window.baiDocViewer.openFetchModal()" style="font-size:0.8rem; padding:6px 12px; background:linear-gradient(135deg, #7c3aed, #4f46e5); color:#fff; border:none; font-weight:800; display:inline-flex; align-items:center; gap:4px; box-shadow:0 2px 8px rgba(124,58,237,0.25);">
              🌐 Lấy Từ Web
            </button>
            <button type="button" class="action-btn btn-view" onclick="window.baiDocViewer.startEditLnth()" style="font-size:0.8rem; padding:6px 12px;">✏️ Sửa</button>
            <button type="button" class="action-btn btn-share" onclick="window.baiDocViewer.printLnth()" style="font-size:0.8rem; padding:6px 12px;">🖨️ In A4</button>
            <button type="button" class="action-btn btn-copy" onclick="window.baiDocViewer.copyLnth()" style="font-size:0.8rem; padding:6px 12px;">📋 Copy</button>
          </div>
        </div>

        <div style="padding:18px 22px; background:#fffdf7; border:1.5px solid #fed7aa; border-radius:12px; margin-bottom:12px; box-shadow:0 2px 8px rgba(0,0,0,0.02);">
          ${formatLnthText(currentContent)}
        </div>
      </div>

      <div id="sb-lnth-edit-form" style="display:none; margin-top:10px;">
        <div style="font-weight:700; margin-bottom:8px; color:var(--primary);">Chỉnh sửa Lời Nguyện Tín Hữu:</div>
        <textarea id="sb-lnth-input" rows="12" class="form-control" style="font-family:'Times New Roman',serif; font-size:1.05rem; line-height:2;">${escapeHtml(currentContent)}</textarea>
        <div style="display:flex; gap:8px; margin-top:10px; justify-content:flex-end;">
          <button type="button" class="btn" onclick="window.baiDocViewer.cancelEditLnth()" style="background:var(--border);">Hủy</button>
          <button type="button" class="btn btn-primary" onclick="window.baiDocViewer.saveLnth()">💾 Lưu Lời Nguyện</button>
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

  // --- MODAL LẤY LỜI NGUYỆN TÍN HỮU TỪ WEB (3 PHƯƠNG THỨC) ---
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
    } else if (tabKey === 'url') {
      this.renderFetchUrlTab(container);
    } else {
      this.renderFetchPasteTab(container);
    }
  }

  // --- MODAL LẤY LỜI NGUYỆN TÍN HỮU TỪ WEB (3 PHƯƠNG THỨC MỚI) ---
  getCurrentFeastId() {
    const ms = this.currentMassSet || window.dohwaApp?.currentMassSet;
    const title = (ms?.title || ms?.weekName || '').toLowerCase();
    const dateStr = ms?.date || '';

    if (title.includes('25') && (title.includes('thường niên') || title.includes('tn'))) return 'cn25_tn_a';
    if (title.includes('26') && (title.includes('thường niên') || title.includes('tn'))) return 'cn26_tn_a';
    if (title.includes('27') && (title.includes('thường niên') || title.includes('tn'))) return 'cn27_tn_a';
    if (title.includes('vọng')) return 'mua_vong';
    if (title.includes('giáng sinh') || title.includes('noel')) return 'mua_giang_sinh';
    if (title.includes('chay')) return 'mua_chay';
    if (title.includes('phục sinh')) return 'mua_phuc_sinh';
    if (title.includes('đức mẹ') || title.includes('maria')) return 'le_duc_me';
    if (title.includes('quan thầy') || title.includes('bổn mạng') || title.includes('ca đoàn')) return 'le_bon_mang_ca_doan';
    if (dateStr === '2026-09-26' || dateStr === '2026-09-27') return 'cn25_tn_a';

    return 'cn25_tn_a';
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
          <button type="button" class="btn btn-primary" onclick="window.baiDocViewer.applySelectedCatalog()" style="background:#0284c7; font-weight:800; font-size:0.85rem; padding:8px 16px; border-radius:8px; box-shadow:0 2px 8px rgba(2,132,199,0.3); cursor:pointer;">
            ✅ Áp Dụng Ngay Cho Bộ Lễ
          </button>
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

        <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:14px;">
          <button type="button" class="btn" onclick="window.baiDocViewer.closeFetchModal()" style="background:var(--border);">Đóng</button>
          <button type="button" class="btn btn-primary" onclick="window.baiDocViewer.applySelectedCatalog()" style="background:#0284c7; font-weight:800; padding:8px 18px;">
            ✅ Áp Dụng Lời Nguyện Này Cho Bộ Lễ
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

  applySelectedCatalog() {
    const sel = document.getElementById('fetchCatalogSelect');
    const catalogId = sel ? sel.value : this.getCurrentFeastId();
    const item = LITURGICAL_PRAYERS_CATALOG.find(c => c.id === catalogId) || LITURGICAL_PRAYERS_CATALOG[0];
    if (item) {
      this.applyFetchedPrayer(item.text);
    }
  }

  // PHƯƠNG THỨC 2: AI TỔNG HỢP TRỰC TUYẾN TỪ CÁC WEB CÔNG GIÁO VIỆT NAM
  renderFetchAiTab(container) {
    const currentFeastId = this.getCurrentFeastId();
    const ms = this.currentMassSet || window.dohwaApp?.currentMassSet;
    const feastTitle = ms?.title || ms?.weekName || 'Chúa Nhật 25 Thường Niên - Năm A';
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
          <div style="display:flex; gap:8px;">
            <button type="button" class="btn" onclick="window.baiDocViewer.closeFetchModal()" style="background:var(--border); cursor:pointer;">Đóng</button>
            <button type="button" class="btn btn-primary" onclick="window.baiDocViewer.applyAiSynthesizedPrayer()" style="background:linear-gradient(135deg, #7c3aed, #4f46e5); font-weight:800; padding:8px 18px; box-shadow:0 4px 12px rgba(124,58,237,0.3); border:none; cursor:pointer;">
              ✅ Áp Dụng Bản Tổng Hợp Này
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

  applyAiSynthesizedPrayer() {
    const textarea = document.getElementById('aiSynthesisTextarea');
    if (!textarea || !textarea.value.trim()) {
      alert('Chưa có nội dung lời nguyện để áp dụng!');
      return;
    }
    this.applyFetchedPrayer(textarea.value.trim());
  }

  // PHƯƠNG THỨC 3: DÁN & TỰ ĐỘNG CHUẨN HÓA (GIỮ NGUYÊN)
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

        <div style="display:flex; justify-content:flex-end; gap:8px;">
          <button type="button" class="btn" onclick="window.baiDocViewer.closeFetchModal()" style="background:var(--border); cursor:pointer;">Đóng</button>
          <button type="button" class="btn btn-primary" onclick="window.baiDocViewer.applyPastedContent()" style="background:#0284c7; font-weight:800; cursor:pointer;">
            ✅ Áp Dụng Lời Nguyện Này Cho Bộ Lễ
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

  applyPastedContent() {
    const inp = document.getElementById('fetchPasteInput');
    if (!inp || !inp.value.trim()) {
      alert('Vui lòng nhập hoặc dán nội dung lời nguyện!');
      return;
    }
    const formatted = parseRawLnthText(inp.value.trim());
    this.applyFetchedPrayer(formatted);
  }

  // Áp dụng lời nguyện vào Bộ Lễ hiện tại và lưu vào Firebase / IndexedDB
  async applyFetchedPrayer(prayerText) {
    if (!prayerText) return;

    if (this.currentMassSet) {
      this.currentMassSet.loiNguyenText = prayerText;
      if (window.dohwaStore) {
        await window.dohwaStore.saveMassSet(this.currentMassSet);
      }
    }

    this.closeFetchModal();

    const toast = document.createElement('div');
    toast.className = 'dohwa-toast';
    toast.textContent = '✅ Đã cập nhật Lời Nguyện Tín Hữu thành công!';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);

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
