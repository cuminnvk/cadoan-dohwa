/**
 * CA ĐOÀN DOHWA - FULLSCREEN PDF SHEET MUSIC VIEWER
 * Xem nốt nhạc toàn màn hình, mượt mà trên điện thoại và máy tính bảng
 */

class DohwaPDFViewer {
  constructor() {
    this.modal = document.getElementById('pdfModal');
    this.titleEl = document.getElementById('pdfModalTitle');
    this.frameWrapper = document.getElementById('pdfFrameWrapper');
    this.closeBtn = document.getElementById('pdfCloseBtn');
    this.downloadBtn = document.getElementById('pdfDownloadBtn');
    this.fullscreenBtn = document.getElementById('pdfFullscreenBtn');

    this.currentPdfUrl = null;
    this.currentFileName = 'not-nhac.pdf';

    this.initEvents();
  }

  initEvents() {
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }

    if (this.downloadBtn) {
      this.downloadBtn.addEventListener('click', () => this.downloadCurrentPdf());
    }

    if (this.fullscreenBtn) {
      this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
    }

    // Đóng khi ấn Escape
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal && this.modal.style.display !== 'none') {
        this.close();
      }
    });
  }

  open(pdfData, title, fileName) {
    if (!this.modal) return;

    this.currentFileName = (fileName && fileName.endsWith('.pdf')) ? fileName : `${(title || 'bai-hat').replace(/[^a-zA-Z0-9_\-]/g, '_')}.pdf`;
    if (this.titleEl) this.titleEl.textContent = title ? `${title} (Bản PDF)` : 'Bản Nhạc PDF Phụng Vụ';

    // Xử lý source PDF (ưu tiên base64/url, fallback vào thư mục sheets/)
    if (typeof pdfData === 'string' && (pdfData.startsWith('http') || pdfData.startsWith('blob:') || pdfData.startsWith('data:'))) {
      this.currentPdfUrl = pdfData;
    } else if (typeof pdfData === 'string' && (pdfData.startsWith('sheets/') || pdfData.endsWith('.pdf'))) {
      this.currentPdfUrl = pdfData;
    } else if (pdfData instanceof Blob) {
      this.currentPdfUrl = URL.createObjectURL(pdfData);
    } else if (fileName) {
      this.currentPdfUrl = fileName.startsWith('sheets/') ? fileName : `sheets/${fileName}`;
    } else {
      this.currentPdfUrl = `sheets/${this.currentFileName}`;
    }

    if (this.currentPdfUrl) {
      this.frameWrapper.innerHTML = `
        <div style="display:flex; flex-direction:column; width:100%; height:100%;">
          <div style="background:var(--bg-card-subtle,#f8fafc); border-bottom:1px solid var(--border,#e2e8f0); padding:10px 16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:1.2rem;">📄</span>
              <div>
                <div style="font-size:0.92rem; font-weight:800; color:var(--text-main,#0f172a);">${title || 'Bản Nhạc PDF'}</div>
                <div style="font-size:0.75rem; color:var(--text-muted,#64748b); font-family:monospace;">${this.currentFileName}</div>
              </div>
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
              <a href="${this.currentPdfUrl}" target="_blank" rel="noopener" class="action-btn btn-view" style="text-decoration:none; padding:6px 14px; font-size:0.82rem; font-weight:700; display:inline-flex; align-items:center; gap:4px;">
                ↗️ Mở Trang Mới
              </a>
              <button type="button" class="action-btn btn-pdf" onclick="window.dohwaPDFViewer.downloadCurrentPdf()" style="padding:6px 16px; font-size:0.82rem; font-weight:800; background:#0284c7; color:#fff; border:none; display:inline-flex; align-items:center; gap:4px; cursor:pointer;">
                📥 Tải PDF Về Máy
              </button>
            </div>
          </div>
          <div style="flex:1; width:100%; height:calc(100% - 55px); background:#525659; position:relative; overflow:hidden;">
            <object data="${this.currentPdfUrl}" type="application/pdf" width="100%" height="100%">
              <iframe src="${this.currentPdfUrl}" width="100%" height="100%" style="border:none;">
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; background:#fff; padding:30px; text-align:center;">
                  <div style="font-size:3.5rem; margin-bottom:12px;">📄</div>
                  <h3 style="font-size:1.2rem; font-weight:800; color:#1e293b; margin-bottom:8px;">${title}</h3>
                  <p style="color:#64748b; font-size:0.9rem; margin-bottom:16px;">Trình duyệt của bạn đang bảo mật hoặc không hỗ trợ đọc PDF trực tiếp trong khung.</p>
                  <div style="display:flex; gap:10px; justify-content:center;">
                    <a href="${this.currentPdfUrl}" target="_blank" rel="noopener" class="btn btn-outline" style="padding:10px 18px; font-weight:700;">
                      ↗️ Mở Trong Tab Mới
                    </a>
                    <a href="${this.currentPdfUrl}" download="${this.currentFileName}" class="btn btn-primary" style="padding:10px 22px; font-weight:800; background:#0284c7;">
                      📥 Tải File PDF Này Về Máy
                    </a>
                  </div>
                </div>
              </iframe>
            </object>
          </div>
        </div>
      `;
    } else {
      this.frameWrapper.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:#555; padding:20px; text-align:center;">
          <div style="font-size:3.5rem; margin-bottom:12px;">📄</div>
          <h3 style="margin-bottom:8px; font-weight:800; color:#1e293b;">${title || 'Bản Nhạc PDF'}</h3>
          <p style="color:#64748b; font-size:0.95rem;">File nốt nhạc PDF đang được ca trưởng chuẩn bị và cập nhật.</p>
        </div>
      `;
    }

    this.modal.style.display = 'flex';
    this.modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  close() {
    if (!this.modal) return;
    this.modal.style.display = 'none';
    this.modal.classList.remove('open');
    document.body.style.overflow = '';
    if (this.frameWrapper) this.frameWrapper.innerHTML = '';
  }

  downloadCurrentPdf() {
    if (!this.currentPdfUrl) {
      alert('Chưa có file PDF để tải về!');
      return;
    }
    const a = document.createElement('a');
    a.href = this.currentPdfUrl;
    a.download = this.currentFileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 100);
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.modal.requestFullscreen().catch(err => {
        console.warn(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }
}

// Global instance
window.dohwaPDFViewer = new DohwaPDFViewer();
