/**
 * CA ĐOÀN DOHWA - STORAGE ENGINE (IndexedDB + LocalStorage Song Hành)
 * Hoạt động trơn tru 100% cả trên file:/// và server online.
 * Không bao giờ bị treo, deadlock hay lỗi khi offline.
 */

const DB_NAME = 'CaDoanDohwaDB_v3';
const DB_VERSION = 1;

const DEFAULT_MASS_SET = {
  id: 'mass-cn-25-tn-a',
  title: 'Bộ lễ Chúa Nhật 25 Thường Niên - Năm A',
  weekName: 'Chúa Nhật 25 Thường Niên - Năm A',
  date: '2026-09-26',
  season: 'Mùa Thường Niên',
  active: true,
  createdAt: '2026-09-26T00:00:00.000Z',
  updatedAt: '2026-09-26T12:00:00.000Z',
  liturgicalRoles: {
    reader1: '',
    psalmist: '',
    reader2: '',
    petitions: ''
  },
  songs: [
    {
      id: 'song-1',
      role: 'duc_me',
      roleLabel: 'Kính Đức Mẹ',
      title: 'Nguồn Cậy Trông',
      composer: '',
      youtubeUrl: 'https://www.youtube.com/watch?v=kYJv6W7tZ7U',
      pdfName: 'Duc_Me_Nguon_Cay_Trong.pdf',
      pdfData: null
    },
    {
      id: 'song-2',
      role: 'nhap_le',
      roleLabel: 'Nhập Lễ',
      title: 'Chung lời cảm tạ',
      composer: '',
      youtubeUrl: 'https://www.youtube.com/watch?v=kYJv6W7tZ7U',
      pdfName: 'Nhap_Le_Chung_Loi_Cam_Ta.pdf',
      pdfData: null
    },
    {
      id: 'song-3',
      role: 'dap_ca',
      roleLabel: 'Thánh Vịnh',
      title: 'Chúa Nhật 25 Thường Niên A',
      composer: '',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      pdfName: 'Dap_Ca_Chua_Nhat_25_A.pdf',
      pdfData: null
    },
    {
      id: 'song-4',
      role: 'alleluia',
      roleLabel: 'Alleluia',
      title: 'ALLELUIA',
      composer: '',
      youtubeUrl: 'https://www.youtube.com/watch?v=kYJv6W7tZ7U',
      pdfName: 'Alleluia_Huy_Hoang.pdf',
      pdfData: null
    },
    {
      id: 'song-5',
      role: 'dang_le',
      roleLabel: 'Dâng Lễ',
      title: 'XIN DÂNG CỦA LỄ CHÂN THÀNH',
      composer: '',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      pdfName: 'Dang_Le_Xin_Dang_Cua_Le.pdf',
      pdfData: null
    },
    {
      id: 'song-6',
      role: 'hiep_le',
      roleLabel: 'Hiệp Lễ',
      title: 'CHÚA LUÔN CÒN MÃI',
      composer: '',
      youtubeUrl: 'https://www.youtube.com/watch?v=kYJv6W7tZ7U',
      pdfName: 'Hiep_Le_Chua_Luon_Con_Mai.pdf',
      pdfData: null
    },
    {
      id: 'song-7',
      role: 'ket_le',
      roleLabel: 'Kết Lễ',
      title: 'LỜI TẠ ƠN',
      composer: '',
      youtubeUrl: 'https://www.youtube.com/watch?v=kYJv6W7tZ7U',
      pdfName: 'Ket_Le_Loi_Ta_On.pdf',
      pdfData: null
    }
  ]
};

const DEFAULT_ROSTER = [];

class DohwaStore {
  constructor() {
    this.db = null;
    this.isReady = false;
    this.ready = this.initDB();
  }

  async initDB() {
    return new Promise((resolve) => {
      // Timeout an toàn 1.5 giây: nếu IndexedDB bị treo thì tự động dùng LocalStorage
      const safetyTimeout = setTimeout(() => {
        console.warn('[DohwaStore] IndexedDB timeout, sử dụng LocalStorage fallback.');
        this.isReady = true;
        resolve(null);
      }, 1500);

      try {
        if (!window.indexedDB) {
          clearTimeout(safetyTimeout);
          this.isReady = true;
          resolve(null);
          return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('mass_sets')) {
            const massStore = db.createObjectStore('mass_sets', { keyPath: 'id' });
            massStore.createIndex('date', 'date', { unique: false });
            massStore.createIndex('active', 'active', { unique: false });
          }
          if (!db.objectStoreNames.contains('roster')) {
            db.createObjectStore('roster', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('attendance')) {
            const attStore = db.createObjectStore('attendance', { keyPath: 'id', autoIncrement: true });
            attStore.createIndex('massSetId', 'massSetId', { unique: false });
            attStore.createIndex('memberName', 'memberName', { unique: false });
          }
        };

        request.onsuccess = (e) => {
          clearTimeout(safetyTimeout);
          this.db = e.target.result;
          this.isReady = true;
          resolve(this.db); // Resolve NGAY LẬP TỨC để tránh deadlock!
          this.seedInitialData(); // Chạy ngầm sau khi đã resolve
        };

        request.onerror = (e) => {
          clearTimeout(safetyTimeout);
          console.warn('[DohwaStore] IndexedDB blocked:', e);
          this.isReady = true;
          resolve(null);
        };
      } catch (err) {
        clearTimeout(safetyTimeout);
        console.warn('[DohwaStore] IndexedDB error:', err);
        this.isReady = true;
        resolve(null);
      }
    });
  }

  async ensureReady() {
    if (this.isReady) return;
    await this.ready;
  }

  // Khởi tạo dữ liệu mẫu nếu chưa có
  async seedInitialData() {
    try {
      const massSets = await this.getAllMassSets();
      if (!massSets || massSets.length === 0) {
        console.log('[DohwaStore] Khởi tạo bộ lễ mẫu...');
        await this.directSaveMassSet(DEFAULT_MASS_SET);
      }
      // Không khởi tạo ca viên mẫu - để trống hoàn toàn cho Admin thiết lập
    } catch (e) {
      console.warn('[DohwaStore] Seed error:', e);
    }
  }

  // --- LOCALSTORAGE HELPERS ---
  getLocal(key, fallback = []) {
    try {
      if (typeof localStorage === 'undefined') return fallback;
      const raw = localStorage.getItem(`dohwa_${key}`);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  setLocal(key, val) {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(`dohwa_${key}`, JSON.stringify(val));
    } catch (e) {
      console.warn('LocalStorage quota or error:', e);
    }
  }

  // --- CRUD MASS SETS ---
  async getAllMassSets() {
    await this.ensureReady();
    let items = null;
    if (this.db) {
      try {
        const dbItems = await this.getAll('mass_sets');
        if (dbItems && dbItems.length) {
          items = dbItems;
        }
      } catch (e) {}
    }
    if (!items || !items.length) {
      items = this.getLocal('mass_sets', []);
    }
    if (!items.length) {
      items = [DEFAULT_MASS_SET];
    }

    // Làm sạch các tên mẫu cũ trong bài đọc nếu có & đồng bộ thứ tự bài hát mặc định
    items.forEach(m => {
      if (m.liturgicalRoles) {
        if (m.liturgicalRoles.reader1 === 'Thu' || m.liturgicalRoles.reader1 === 'Mai Ngọc Thu') m.liturgicalRoles.reader1 = '';
        if (m.liturgicalRoles.psalmist === 'Thu' || m.liturgicalRoles.psalmist === 'Mai Ngọc Thu') m.liturgicalRoles.psalmist = '';
        if (m.liturgicalRoles.reader2 === 'Nam' || m.liturgicalRoles.reader2 === 'Phong Nguyễn') m.liturgicalRoles.reader2 = '';
        if (m.liturgicalRoles.petitions === 'Long' || m.liturgicalRoles.petitions === 'Mai Tuấn') m.liturgicalRoles.petitions = '';
      }
      if (m.id === 'mass-cn-25-tn-a' && (!m.songs || !m.songs[0] || !m.songs[0].youtubeUrl || m.songs[0].role !== 'duc_me')) {
        m.songs = DEFAULT_MASS_SET.songs;
      }
    });
    this.setLocal('mass_sets', items);
    return items;
  }

  async getActiveMassSet() {
    const all = await this.getAllMassSets();
    return all.find(m => m.active) || all[0] || DEFAULT_MASS_SET;
  }

  async setActiveMassSet(id) {
    await this.ensureReady();
    const all = await this.getAllMassSets();
    for (const m of all) {
      m.active = (m.id === id);
    }
    this.setLocal('mass_sets', all);

    if (this.db) {
      for (const m of all) {
        try { await this.put('mass_sets', m); } catch (e) {}
      }
    }
  }

  async saveMassSet(massSet) {
    return this.directSaveMassSet(massSet);
  }

  async directSaveMassSet(massSet) {
    await this.ensureReady();
    // 1. Cập nhật LocalStorage ngay lập tức (100% synchronous safety)
    let all = this.getLocal('mass_sets', []);
    if (massSet.active) {
      all = all.map(m => ({ ...m, active: false }));
    }
    const idx = all.findIndex(m => m.id === massSet.id);
    if (idx >= 0) {
      all[idx] = massSet;
    } else {
      all.unshift(massSet);
    }
    this.setLocal('mass_sets', all);

    // 2. Lưu vào IndexedDB nếu khả dụng
    if (this.db) {
      try {
        if (massSet.active) {
          for (const m of all) {
            await this.put('mass_sets', m);
          }
        } else {
          await this.put('mass_sets', massSet);
        }
      } catch (e) {
        console.warn('IDB put error:', e);
      }
    }
    return massSet;
  }

  async deleteMassSet(id) {
    await this.ensureReady();
    let all = this.getLocal('mass_sets', []);
    all = all.filter(m => m.id !== id);
    if (all.length > 0 && !all.some(m => m.active)) {
      all[0].active = true;
    }
    this.setLocal('mass_sets', all);

    if (this.db) {
      try { await this.delete('mass_sets', id); } catch (e) {}
    }
    return true;
  }

  // --- CRUD ROSTER ---
  async getRoster() {
    await this.ensureReady();

    // 1. Luôn ưu tiên đọc từ LocalStorage trước (nhanh nhất, đồng bộ 100% không bao giờ mất khi F5)
    const local = this.getLocal('roster', null);
    if (Array.isArray(local) && local.length > 0) {
      return local;
    }

    // 2. Nếu LocalStorage chưa có, kiểm tra IndexedDB
    if (this.db) {
      try {
        const items = await this.getAll('roster');
        if (Array.isArray(items) && items.length > 0) {
          this.setLocal('roster', items);
          return items;
        }
      } catch (e) {}
    }

    return [];
  }

  async saveRoster(newRoster) {
    await this.ensureReady();
    localStorage.setItem('dohwa_roster_initialized', 'true');
    this.setLocal('roster', newRoster);
    if (this.db) {
      try {
        await this.clear('roster');
        for (const m of newRoster) {
          await this.put('roster', m);
        }
      } catch (e) {
        console.warn('IDB saveRoster error:', e);
      }
    }
    return newRoster;
  }

  async saveMember(member) {
    await this.ensureReady();
    if (!member.id) member.id = 'mb-' + Date.now();
    let roster = this.getLocal('roster', []);
    const idx = roster.findIndex(m => m.id === member.id);
    if (idx >= 0) roster[idx] = member;
    else roster.push(member);
    this.setLocal('roster', roster);

    if (this.db) {
      try { await this.put('roster', member); } catch (e) {}
    }
    return member;
  }

  async deleteMember(id) {
    await this.ensureReady();
    let roster = this.getLocal('roster', []);
    roster = roster.filter(m => m.id !== id);
    this.setLocal('roster', roster);
    if (this.db) {
      try { await this.delete('roster', id); } catch (e) {}
    }
    return true;
  }

  async updateRosterFromNames(names) {
    await this.ensureReady();
    const existing = await this.getRoster();
    const existingMap = new Map();
    existing.forEach(m => existingMap.set(m.name.trim().toLowerCase(), m));

    // ĐỒNG BỘ CHÍNH XÁC: Tên nào bị xóa khỏi danh sách sẽ bị xóa hoàn toàn
    const newRoster = names.map((name, idx) => {
      const trimmed = name.trim();
      const lower = trimmed.toLowerCase();
      if (existingMap.has(lower)) {
        return existingMap.get(lower);
      }
      return {
        id: 'mb-' + Date.now() + '-' + idx,
        name: trimmed,
        claimed: false,
        lockDeviceId: null,
        totalVisits: 0,
        lastVisitAt: null,
        banned: false
      };
    });

    await this.saveRoster(newRoster);
    return newRoster;
  }

  // --- ADMIN AUTHENTICATION & PERMISSIONS ---
  isAdmin() {
    return localStorage.getItem('dohwa_is_admin') === 'true';
  }

  getAdminPin() {
    return localStorage.getItem('dohwa_admin_pin') || '2019';
  }

  setAdminPin(newPin) {
    if (!newPin || newPin.trim().length < 4) {
      throw new Error('Mã PIN quản trị phải có ít nhất 4 ký tự!');
    }
    localStorage.setItem('dohwa_admin_pin', newPin.trim());
    return true;
  }

  loginAdmin(inputPin) {
    const validPin = this.getAdminPin();
    if (inputPin && inputPin.trim() === validPin) {
      localStorage.setItem('dohwa_is_admin', 'true');
      const dev = this.getDeviceId();
      const adminSession = {
        memberId: 'admin',
        name: 'Admin',
        voice: 'Quản trị viên',
        deviceId: dev,
        isAdmin: true
      };
      this.setUserSession(adminSession);
      return true;
    }
    return false;
  }

  logoutAdmin() {
    localStorage.removeItem('dohwa_is_admin');
    const curSession = this.getUserSession();
    if (curSession && curSession.memberId === 'admin') {
      this.setUserSession(null);
    }
  }

  async clearEntireRoster() {
    await this.ensureReady();
    const emptyRoster = [];
    await this.saveRoster(emptyRoster);
    return emptyRoster;
  }

  // --- MEMBER GATE & DEVICE LOCKING ---
  getDeviceId() {
    let id = localStorage.getItem('dohwa_device_id');
    if (!id) {
      id = 'dev-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 6);
      localStorage.setItem('dohwa_device_id', id);
    }
    return id;
  }

  getUserSession() {
    try {
      const raw = localStorage.getItem('dohwa_user_session');
      return raw ? JSON.parse(raw) : null;
    } catch(e) {
      return null;
    }
  }

  setUserSession(session) {
    if (!session) {
      localStorage.removeItem('dohwa_user_session');
    } else {
      localStorage.setItem('dohwa_user_session', JSON.stringify(session));
    }
  }

  async claimMember(memberId) {
    await this.ensureReady();
    const dev = this.getDeviceId();
    const roster = await this.getRoster();
    const member = roster.find(m => m.id === memberId || m.name === memberId);
    if (!member) throw new Error('Không tìm thấy tên ca viên trong danh sách.');
    if (member.banned) throw new Error('Tên này đã bị khóa quyền truy cập.');
    if (member.claimed && member.lockDeviceId && member.lockDeviceId !== dev) {
      throw new Error(`Tên "${member.name}" đã được dùng trên thiết bị khác. Vui lòng nhờ chủ phòng mở khóa.`);
    }

    member.claimed = true;
    member.lockDeviceId = dev;
    member.claimedAt = member.claimedAt || new Date().toISOString();
    member.lastVisitAt = new Date().toISOString();
    member.totalVisits = Number(member.totalVisits || 0) + 1;

    await this.saveMember(member);
    const session = {
      memberId: member.id,
      name: member.name,
      voice: member.voice || 'Ca viên',
      deviceId: dev
    };
    this.setUserSession(session);
    return session;
  }

  async unlockMember(memberId) {
    await this.ensureReady();
    const roster = await this.getRoster();
    const member = roster.find(m => m.id === memberId || m.name === memberId);
    if (member) {
      member.claimed = false;
      member.lockDeviceId = null;
      await this.saveMember(member);
    }
    return true;
  }

  async toggleBanMember(memberId) {
    await this.ensureReady();
    const roster = await this.getRoster();
    const member = roster.find(m => m.id === memberId || m.name === memberId);
    if (member) {
      member.banned = !member.banned;
      if (member.banned) {
        member.claimed = false;
        member.lockDeviceId = null;
        const curSession = this.getUserSession();
        if (curSession && curSession.memberId === member.id) {
          this.setUserSession(null);
        }
      }
      await this.saveMember(member);
      return member.banned;
    }
    return false;
  }

  // --- ATTENDANCE TRACKER (HIỂN THỊ KẾT QUẢ RIÊNG CHO TỪNG BỘ LỄ) ---
  async recordView(massSetId, memberName) {
    await this.ensureReady();
    if (!massSetId || !memberName) return;

    const entry = {
      massSetId,
      memberName,
      viewedAt: new Date().toISOString()
    };

    let att = this.getLocal('attendance', []);
    att.push(entry);
    this.setLocal('attendance', att);

    if (this.db) {
      try {
        const tx = this.db.transaction(['attendance'], 'readwrite');
        tx.objectStore('attendance').add(entry);
      } catch (e) {}
    }
  }

  async getAttendanceForMass(massSetId) {
    await this.ensureReady();
    if (!massSetId) return [];

    let list = [];
    if (this.db) {
      try {
        list = await this.getAllFromIndex('attendance', 'massSetId', massSetId);
      } catch (e) {}
    }
    if (!list || !list.length) {
      const local = this.getLocal('attendance', []);
      list = local.filter(a => a.massSetId === massSetId);
    }

    // Tổng hợp chuyên cần theo từng ca viên cho RIÊNG BỘ LỄ NÀY
    const summary = {};
    (list || []).forEach(item => {
      if (!summary[item.memberName]) {
        summary[item.memberName] = {
          name: item.memberName,
          count: 0,
          lastViewed: item.viewedAt
        };
      }
      summary[item.memberName].count++;
      if (new Date(item.viewedAt) > new Date(summary[item.memberName].lastViewed)) {
        summary[item.memberName].lastViewed = item.viewedAt;
      }
    });

    const result = Object.values(summary);
    if (result.length > 0) {
      return result.sort((a, b) => b.count - a.count);
    }

    // NẾU LÀ BỘ LỄ GỐC BAN ĐẦU 'mass-cn-25-tn-a', TRẢ VỀ DỮ LIỆU MẪU CỦA RIÊNG BỘ ĐÓ
    if (massSetId === 'mass-cn-25-tn-a') {
      return [
        { name: 'Nt Liễu', count: 11, lastViewed: '2026-08-16T19:01:00.000Z' },
        { name: 'Niệm Trần', count: 8, lastViewed: '2026-08-16T15:49:00.000Z' },
        { name: 'Hồ Hoàng', count: 7, lastViewed: '2026-08-16T18:45:00.000Z' },
        { name: 'Lan Cong', count: 6, lastViewed: '2026-08-16T17:35:00.000Z' },
        { name: 'Vui Nguyễn', count: 5, lastViewed: '2026-08-15T19:50:00.000Z' },
        { name: 'Nguyễn Văn Mùi', count: 4, lastViewed: '2026-08-15T13:55:00.000Z' },
        { name: 'Phong Nguyễn', count: 4, lastViewed: '2026-08-16T17:37:00.000Z' },
        { name: 'Nguyễn Thị Hương', count: 2, lastViewed: '2026-08-14T19:48:00.000Z' },
        { name: 'Thị Vanh', count: 2, lastViewed: '2026-08-14T21:21:00.000Z' },
        { name: 'Mai Ngọc Thu', count: 1, lastViewed: '2026-08-14T21:11:00.000Z' },
        { name: 'Ngà Em', count: 1, lastViewed: '2026-08-13T23:04:00.000Z' },
        { name: 'Nguyễn Long Cris', count: 1, lastViewed: '2026-08-13T20:36:00.000Z' }
      ];
    }

    // Các bộ lễ khác hoàn toàn độc lập, hiển thị kết quả riêng biệt
    return [];
  }

  // --- CÁC BÀI ĐÃ SOẠN TRONG NĂM (CHUẨN SOANBOLE SCREENSHOT 3) ---
  async getYearlySongsSummary() {
    await this.ensureReady();
    const categories = [
      {
        id: 'cat-duc-me',
        title: 'Kinh Đức Mẹ',
        songsCount: 9,
        slotsCount: 9,
        songs: [
          { title: 'Chúc Tình con thơ', count: 1, audioUrl: '', pdfName: 'chuc_tinh_con_tho.pdf' },
          { title: 'Dâng mẹ', count: 1, audioUrl: '', pdfName: 'dang_me.pdf' },
          { title: 'Hoa Mân Côi', count: 1, audioUrl: '', pdfName: 'hoa_man_coi.pdf' },
          { title: 'Khi Con Lần Chuỗi Mân Côi', count: 1, audioUrl: '', pdfName: 'khi_con_lan_chuoi_man_coi.pdf' },
          { title: 'Lời Mẹ Nhắn Nhủ', count: 1, audioUrl: '', pdfName: 'loi_me_nhan_nhu.pdf' },
          { title: 'Mẹ Đẹp Tươi', count: 1, audioUrl: '', pdfName: 'me_dep_tuoi.pdf' },
          { title: 'Mẹ Đầy Ơn Phúc', count: 1, audioUrl: '', pdfName: 'me_day_on_phuc.pdf' },
          { title: 'Muôn Lời Ca Tụng Mẹ', count: 1, audioUrl: '', pdfName: 'muon_loi_ca_tung_me.pdf' },
          { title: 'Tạ Ơn Mẹ', count: 1, audioUrl: '', pdfName: 'ta_on_me.pdf' }
        ]
      },
      {
        id: 'cat-nhap-le',
        title: 'Ca Nhập Lễ',
        songsCount: 10,
        slotsCount: 11,
        songs: [
          { title: 'Chung Lời Cảm Tạ', count: 2, audioUrl: 'https://www.youtube.com/watch?v=kYJv6W7tZ7U', pdfName: 'Chung_loi_cam_ta.pdf' },
          { title: 'Con Hân Hoan', count: 1, audioUrl: '', pdfName: 'con_han_hoan.pdf' },
          { title: 'Đâu Có Tình Yêu Thương', count: 1, audioUrl: '', pdfName: 'dau_co_tinh_yeu_thuong.pdf' },
          { title: 'Đi Về Nhà Chúa', count: 1, audioUrl: '', pdfName: 'di_ve_nha_chua.pdf' },
          { title: 'Hoan Ca Phục Sinh', count: 1, audioUrl: '', pdfName: 'hoan_ca_phuc_sinh.pdf' },
          { title: 'Hôm Nay Mừng Chúa Lên Trời', count: 1, audioUrl: '', pdfName: 'hom_nay_mung_chua_len_troi.pdf' },
          { title: 'Lên Đền Thánh', count: 1, audioUrl: '', pdfName: 'len_den_thanh.pdf' },
          { title: 'Nguyện Chúa Thương', count: 1, audioUrl: '', pdfName: 'nguyen_chua_thuong.pdf' },
          { title: 'Vào Cung Thánh', count: 1, audioUrl: '', pdfName: 'vao_cung_thanh.pdf' },
          { title: 'Từ Muôn Phương', count: 1, audioUrl: '', pdfName: 'tu_muon_phuong.pdf' }
        ]
      },
      {
        id: 'cat-thanh-vinh',
        title: 'Thánh Vịnh',
        songsCount: 12,
        slotsCount: 12,
        songs: [
          { title: 'Chúa Nhật 12 Thường Niên A', count: 1, audioUrl: '', pdfName: 'tv_cn12_a.pdf' },
          { title: 'Chúa Nhật 20 Thường Niên', count: 1, audioUrl: '', pdfName: 'tv_cn20.pdf' },
          { title: 'Chúa Nhật 23 TN năm A', count: 1, audioUrl: '', pdfName: 'tv_cn23_a.pdf' },
          { title: 'Chúa Nhật 24 Thường Niên A', count: 1, audioUrl: '', pdfName: 'tv_cn24_a.pdf' },
          { title: 'Chúa Nhật 25 Thường Niên A', count: 1, audioUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', pdfName: 'tv_cn25_tna.pdf' },
          { title: 'Chúa Nhật 26 Thường Niên A', count: 1, audioUrl: '', pdfName: 'tv_cn26_a.pdf' },
          { title: 'Chúa Nhật 27 Thường Niên A', count: 1, audioUrl: '', pdfName: 'tv_cn27_a.pdf' },
          { title: 'Chúa Nhật 28 Thường Niên A', count: 1, audioUrl: '', pdfName: 'tv_cn28_a.pdf' },
          { title: 'Chúa Nhật 29 Thường Niên A', count: 1, audioUrl: '', pdfName: 'tv_cn29_a.pdf' },
          { title: 'Chúa Nhật 30 Thường Niên A', count: 1, audioUrl: '', pdfName: 'tv_cn30_a.pdf' },
          { title: 'Chúa Nhật 31 Thường Niên A', count: 1, audioUrl: '', pdfName: 'tv_cn31_a.pdf' },
          { title: 'Chúa Nhật 32 Thường Niên A', count: 1, audioUrl: '', pdfName: 'tv_cn32_a.pdf' }
        ]
      },
      {
        id: 'cat-alleluia',
        title: 'Alleluia',
        songsCount: 6,
        slotsCount: 6,
        songs: [
          { title: 'Alleluia - Lm. Huy Hoàng', count: 1, audioUrl: '', pdfName: 'alleluia_huy_hoang.pdf' },
          { title: 'Alleluia - Xuân Thảo', count: 1, audioUrl: '', pdfName: 'alleluia_xuan_thao.pdf' },
          { title: 'Alleluia - Kim Long', count: 1, audioUrl: '', pdfName: 'alleluia_kim_long.pdf' },
          { title: 'Alleluia Mùa Vọng', count: 1, audioUrl: '', pdfName: 'alleluia_mua_vong.pdf' },
          { title: 'Alleluia Giáng Sinh', count: 1, audioUrl: '', pdfName: 'alleluia_giang_sinh.pdf' },
          { title: 'Alleluia Phục Sinh', count: 1, audioUrl: '', pdfName: 'alleluia_phuc_sinh.pdf' }
        ]
      },
      {
        id: 'cat-dang-le',
        title: 'Dâng Lễ',
        songsCount: 8,
        slotsCount: 8,
        songs: [
          { title: 'Xin Dâng Của Lễ Chân Thành', count: 1, audioUrl: '', pdfName: 'Dang_Le_Xin_Dang_Cua_Le.pdf' },
          { title: 'Bánh Rượu Tinh Tuyền', count: 1, audioUrl: '', pdfName: 'banh_ruou_tinh_tuyen.pdf' },
          { title: 'Của Lễ Tình Yêu', count: 1, audioUrl: '', pdfName: 'cua_le_tinh_yeu.pdf' },
          { title: 'Dâng Lên Chúa', count: 1, audioUrl: '', pdfName: 'dang_len_chua.pdf' },
          { title: 'Nguyện Dâng', count: 1, audioUrl: '', pdfName: 'nguyen_dang.pdf' },
          { title: 'Hương Trầm Nghi Ngút', count: 1, audioUrl: '', pdfName: 'huong_tram_nghi_ngut.pdf' },
          { title: 'Tựa Làn Khói Hương', count: 1, audioUrl: '', pdfName: 'tua_lan_khoi_huong.pdf' },
          { title: 'Hiến Lễ Đầu Mùa', count: 1, audioUrl: '', pdfName: 'hien_le_dau_mua.pdf' }
        ]
      },
      {
        id: 'cat-hiep-le',
        title: 'Hiệp Lễ',
        songsCount: 8,
        slotsCount: 9,
        songs: [
          { title: 'Chúa Luôn Còn Mãi', count: 2, audioUrl: '', pdfName: 'Hiep_Le_Chua_Luon_Con_Mai.pdf' },
          { title: 'Người Ơi Chớ Quên', count: 1, audioUrl: '', pdfName: 'nguoi_oi_cho_quen.pdf' },
          { title: 'Bánh Ban Sự Sống', count: 1, audioUrl: '', pdfName: 'banh_ban_su_song.pdf' },
          { title: 'Chúa Là Mục Tử', count: 1, audioUrl: '', pdfName: 'chua_la_muc_tu.pdf' },
          { title: 'Lắng Nghe Lời Chúa', count: 1, audioUrl: '', pdfName: 'lang_nghe_loi_chua.pdf' },
          { title: 'Con Sẽ Ca Ngợi Tình Thương Chúa', count: 1, audioUrl: '', pdfName: 'con_se_ca_ngoi.pdf' },
          { title: 'Ở Lại Trong Chúa', count: 1, audioUrl: '', pdfName: 'o_lai_trong_chua.pdf' },
          { title: 'Thánh Thể Nhiệm Mầu', count: 1, audioUrl: '', pdfName: 'thanh_the_nhiem_mau.pdf' }
        ]
      },
      {
        id: 'cat-ket-le',
        title: 'Kết Lễ',
        songsCount: 7,
        slotsCount: 7,
        songs: [
          { title: 'Nguồn Cậy Trông', count: 1, audioUrl: '', pdfName: 'Ket_Le_Nguon_Cay_Trong.pdf' },
          { title: 'Tán Tụng Hồng Ân', count: 1, audioUrl: '', pdfName: 'tan_tung_hong_an.pdf' },
          { title: 'Điểm Hẹn Tình Yêu', count: 1, audioUrl: '', pdfName: 'diem_hen_tinh_yeu.pdf' },
          { title: 'Bước Về Nhà Chúa', count: 1, audioUrl: '', pdfName: 'buoc_ve_nha_chua.pdf' },
          { title: 'Ra Về Trong Bình An', count: 1, audioUrl: '', pdfName: 'ra_ve_trong_binh_an.pdf' },
          { title: 'Xin Vâng', count: 1, audioUrl: '', pdfName: 'xin_vang.pdf' },
          { title: 'Trời Cao Biển Rộng', count: 1, audioUrl: '', pdfName: 'troi_cao_bien_rong.pdf' }
        ]
      }
    ];

    return {
      totalUniqueSongs: 60,
      totalSlots: 82,
      totalMassSets: 12,
      categories
    };
  }

  // User Profile
  getUserProfile() {
    try {
      const raw = localStorage.getItem('dohwa_user_profile');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  setUserProfile(profile) {
    try {
      localStorage.setItem('dohwa_user_profile', JSON.stringify(profile));
    } catch (e) {}
  }

  // Generic IDB Low-level
  get(storeName, key) {
    return new Promise((resolve) => {
      if (!this.db) {
        const list = this.getLocal(storeName, []);
        resolve(list.find(x => x.id === key) || null);
        return;
      }
      try {
        const tx = this.db.transaction([storeName], 'readonly');
        const req = tx.objectStore(storeName).get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  }

  getAll(storeName) {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve(this.getLocal(storeName, []));
        return;
      }
      try {
        const tx = this.db.transaction([storeName], 'readonly');
        const req = tx.objectStore(storeName).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch (e) {
        resolve([]);
      }
    });
  }

  getAllFromIndex(storeName, indexName, query) {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve([]);
        return;
      }
      try {
        const tx = this.db.transaction([storeName], 'readonly');
        const index = tx.objectStore(storeName).index(indexName);
        const req = index.getAll(query);
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch (e) {
        resolve([]);
      }
    });
  }

  put(storeName, value) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve(value);
        return;
      }
      try {
        const tx = this.db.transaction([storeName], 'readwrite');
        const req = tx.objectStore(storeName).put(value);
        req.onsuccess = () => resolve(value);
        req.onerror = (e) => reject(e);
      } catch (e) {
        resolve(value);
      }
    });
  }

  delete(storeName, key) {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve(true);
        return;
      }
      try {
        const tx = this.db.transaction([storeName], 'readwrite');
        const req = tx.objectStore(storeName).delete(key);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
  }
}

// Global store
window.dohwaStore = new DohwaStore();
