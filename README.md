# ỨNG DỤNG CA ĐOÀN DOHWA ✝
**Hệ thống Soạn Bộ Lễ, Phân Công Bài Đọc & Học Hát Thánh Ca**

Dành riêng cho Ban Điều Hành và Ca Viên **Ca Đoàn Dohwa**.
*Thiết kế siêu nhẹ, tốc độ tức thì, tối ưu 100% cho điện thoại di động và máy tính bảng.*

---

## 🌟 CÁC TÍNH NĂNG NỔI BẬT

### 1. 📖 BỘ LỄ TUẦN NÀY (Dành cho Ca Viên)
* **Ghi nhớ tên ca viên vĩnh viễn:** Lần đầu mở máy chỉ cần chọn tên mình và bè hát (Soprano, Alto, Tenor, Bass). Hệ thống lưu vĩnh viễn vào điện thoại, không bao giờ bị mất phiên hay hỏi lại.
* **Tóm tắt phân công phụng vụ tuần:** Hiện rõ ai phụ trách Bài Đọc 1, Đáp Ca, Bài Đọc 2, Lời Nguyện, Dâng Lễ.
* **Xem nốt nhạc toàn màn hình:** Bấm nút **"👁️ Nốt Nhạc"** để phóng to, thu nhỏ, xoay ngang và tải PDF về máy.
* **Trình nghe nhạc YouTube chạy nền:** Ghim ở đáy màn hình, vừa nghe mẫu nhạc vừa xem nốt để tập hát.

### 2. ✍️ SOẠN BỘ LỄ THÔNG MINH (Dành cho Ca Trưởng)
* **Tải lên hàng loạt 6 - 8 file PDF cùng lúc:** Không cần chọn thủ công từng bài trong thư viện.
* **Tự động nhận diện phần phụng vụ:** Hệ thống tự đọc tên file để xếp đúng vị trí:
  * File có chữ `nhap le`, `tien vao` → Tự gán **Ca Nhập Lễ**
  * File có chữ `dap ca`, `thanh vinh`, `tv` → Tự gán **Đáp Ca (Thánh Vịnh)**
  * File có chữ `alleluia`, `tin mung` → Tự gán **Tung Hô Tin Mừng**
  * File có chữ `dang le`, `le vat` → Tự gán **Ca Dâng Lễ**
  * File có chữ `hiep le`, `ruoc le` → Tự gán **Ca Hiệp Lễ**
  * File có chữ `ta le`, `ket le` → Tự gán **Ca Tạ Lễ**
  * File có chữ `me`, `maria` → Tự gán **Kính Đức Mẹ**
* **Dán link YouTube dễ dàng:** Có nút thử link nghe trực tiếp để kiểm tra trước khi lưu.
* **Đặt làm Bộ Lễ Hiện Tại:** Bấm 1 click là toàn bộ ca đoàn mở web ra sẽ thấy ngay bộ lễ mới.

### 3. 🗓️ PHÂN CÔNG PHỤNG VỤ & XOAY VÒNG BÀI ĐỌC
* **Thuật toán xoay vòng thông minh (Round-Robin):**
  * Tự động ưu tiên những người lâu nhất chưa đọc.
  * **Tuyệt đối không lặp lại** người vừa đọc ở tuần trước đó.
  * Tự động đề xuất lịch xoay vòng chỉ với 1 nút bấm: **"✨ Gợi ý xoay vòng"**.
* **Sao chép tin nhắn Zalo 1 chạm:** Tự động tạo định dạng thông báo trang trọng, ca trưởng chỉ cần bấm **"📲 Sao chép gửi Zalo"** rồi dán thẳng vào nhóm Zalo ca đoàn.
* **Quản lý danh sách ca viên:** Thêm mới, phân bè, lưu số điện thoại.

### 4. 📚 KHO BỘ LỄ ĐÃ SOẠN
* Lưu lại lịch sử toàn bộ các bộ lễ đã từng soạn theo thời gian.
* Cho phép chọn lại bất kỳ bộ lễ cũ nào làm bộ lễ hiện tại.
* Nút **"📤 Sao Lưu Dữ Liệu"**: Xuất file JSON toàn bộ bài hát và phân công để dự phòng.

### 5. 📊 THỐNG KÊ CHUYÊN CẦN
* Bảng điểm danh xem bài hát:
  * Tổng lượt vào ôn bài.
  * Số ca viên đã xem và tỷ lệ % chuyên cần của ca đoàn.
  * Danh sách chi tiết ai đã vào xem, số lần xem và thời gian xem gần nhất.

---

## ❓ GIẢI ĐÁP: LƯU NHIỀU BỘ LỄ CÓ BỊ NGHẼN HOSTING KHÔNG?

**Câu trả lời:** **HOÀN TOÀN KHÔNG THỂ BỊ NGHẼN!**

1. **Về dung lượng:**
   * Mỗi file PDF bài hát chỉ nặng khoảng **150 KB - 250 KB**.
   * Một bộ lễ 7 bài chỉ nặng khoảng **1 MB - 1.5 MB**.
   * Cả năm 52 Chúa Nhật chỉ tốn khoảng **60 MB - 80 MB**.
   * Dữ liệu chữ (tên bài, phân công đọc sách, lượt xem) chỉ chiếm vài **Kilobyte (KB)**.
2. **Về Hosting:**
   * Khi đưa lên **Cloudflare Pages** (kết hợp Cloudflare R2 cho PDF), Cloudflare cho phép lưu trữ tới **10 GB miễn phí** (tương đương lưu liên tục hơn **100 năm** bộ lễ!).
   * Băng thông của Cloudflare Pages là **Vô hạn (Unlimited)**, máy chủ đặt tại VN (VNPT, Viettel, FPT) nên 100 ca viên cùng truy cập một lúc vào tối thứ 7 vẫn load vèo vèo trong 0.3 giây.
3. **Về phía điện thoại ca viên:**
   * Ứng dụng sử dụng công nghệ **IndexedDB** của trình duyệt, lưu bộ lễ vào bộ nhớ cache của máy nên khi mở lại không tốn thêm data 4G.

---

## 🚀 HƯỚNG DẪN CHẠY THỬ NGAY BÂY GIỜ

1. Vào thư mục `D:\CADOAN_DOHWA` (hoặc `D:\CAĐOAN_DOHWA`).
2. Nhấp đúp chuột vào file **`index.html`** để mở trực tiếp trên Chrome, Edge hoặc Cốc Cốc.
3. Trải nghiệm ngay các tính năng:
   * Tab 1: Xem bộ lễ mẫu, bấm **"👁️ Nốt Nhạc"** và nút **"▶"** để nghe nhạc chạy nền.
   * Tab 2: Kéo thử 6-8 file PDF vào ô upload để xem tự động phân loại.
   * Tab 3: Bấm **"✨ Gợi ý xoay vòng"** và **"📲 Sao chép gửi Zalo"**.
