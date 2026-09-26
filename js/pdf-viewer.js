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

    this.currentFileName = fileName || `${title || 'bai-hat'}.pdf`;
    if (this.titleEl) this.titleEl.textContent = title || 'Nốt Nhạc Thánh Ca';

    // Xử lý source PDF
    if (typeof pdfData === 'string' && (pdfData.startsWith('http') || pdfData.startsWith('blob:') || pdfData.startsWith('data:'))) {
      this.currentPdfUrl = pdfData;
    } else if (pdfData instanceof Blob) {
      this.currentPdfUrl = URL.createObjectURL(pdfData);
    } else {
      this.currentPdfUrl = null;
    }

    if (this.currentPdfUrl) {
      this.frameWrapper.innerHTML = `
        <object data="${this.currentPdfUrl}" type="application/pdf" width="100%" height="100%">
          <iframe src="${this.currentPdfUrl}" width="100%" height="100%" style="border:none;">
            <p>Trình duyệt của bạn không hỗ trợ xem trực tiếp PDF. <a href="${this.currentPdfUrl}" target="_blank">Bấm vào đây để tải về</a></p>
          </iframe>
        </object>
      `;
    } else {
      this.frameWrapper.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:#555; padding:20px; text-align:center;">
          <div style="font-size:3.5rem; margin-bottom:12px;">📄</div>
          <h3 style="margin-bottom:8px; font-weight:800; color:#1e293b;">${title || 'Nốt Nhạc Thánh Ca'}</h3>
          <p style="color:#64748b; font-size:0.95rem;">File nốt nhạc PDF đang được ca trưởng chuẩn bị và cập nhật.</p>
          <p style="color:#94a3b8; font-size:0.85rem; margin-top:8px;">Tên file dự kiến: ${fileName || 'Chưa đính kèm file'}</p>
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
      alert('Chưa có file PDF thực tế để tải về! Ca trưởng có thể tải lên file PDF trong tab "Soạn Lễ".');
      return;
    }
    const a = document.createElement('a');
    a.href = this.currentPdfUrl;
    a.download = this.currentFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
