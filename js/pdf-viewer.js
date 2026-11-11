/**
 * CA ĐOÀN DOHWA - FULLSCREEN PDF SHEET MUSIC VIEWER (NÂNG CẤP ĐA NỀN TẢNG)
 * - Hỗ trợ tải on-demand PDF từ IndexedDB / Firebase Cloud (pdf_store)
 * - Tích hợp PDF.js render đa trang sắc nét trên iPhone (Safari), Android & Zalo WebView
 * - Có thanh công cụ Phóng to (+), Thu nhỏ (-), 100%, Mở tab mới & Tải về máy
 * - Tự động fallback sang <object>/<iframe> khi ngoại tuyến
 */

const PDFJS_CDN_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

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
    this.currentTitle = 'Bản Nhạc PDF';
    this.pdfDoc = null;
    this.zoomScale = 1.0;
    this.pdfJsLoadingPromise = null;

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

  async ensurePdfJsLoaded() {
    if (window.pdfjsLib) return window.pdfjsLib;
    if (this.pdfJsLoadingPromise) return this.pdfJsLoadingPromise;

    this.pdfJsLoadingPromise = new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = PDFJS_CDN_SRC;
      script.async = true;
      script.onload = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
          resolve(window.pdfjsLib);
        } else {
          resolve(null);
        }
      };
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    });

    return this.pdfJsLoadingPromise;
  }

  async open(pdfData, title, fileName, pdfKey = null) {
    if (!this.modal) return;

    this.currentTitle = title || 'Bản Nhạc PDF Phụng Vụ';
    this.currentFileName = (fileName && fileName.endsWith('.pdf'))
      ? fileName
      : `${(title || 'bai-hat').replace(/[^a-zA-Z0-9_\-]/g, '_')}.pdf`;

    if (this.titleEl) {
      this.titleEl.textContent = title ? `${title} (Bản PDF)` : 'Bản Nhạc PDF Phụng Vụ';
    }

    this.modal.style.display = 'flex';
    this.modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Nếu pdfData là mã khóa pdfKey (bắt đầu bằng "pdf_") hoặc truyền pdfKey riêng, nạp từ DohwaStore
    let resolvedData = pdfData;
    const lookupKey = pdfKey || ((typeof pdfData === 'string' && pdfData.startsWith('pdf_')) ? pdfData : null);
    if (lookupKey && window.dohwaStore && typeof window.dohwaStore.getPdfBlob === 'function') {
      if (this.frameWrapper) {
        this.frameWrapper.innerHTML = `
          <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:#fff; background:#334155; padding:24px; text-align:center;">
            <div style="font-size:2.5rem; margin-bottom:10px;">⏳</div>
            <div style="font-weight:700; font-size:0.95rem;">Đang tải bản nhạc PDF...</div>
          </div>
        `;
      }
      const cloudOrIdbData = await window.dohwaStore.getPdfBlob(lookupKey);
      if (cloudOrIdbData) {
        resolvedData = cloudOrIdbData;
      } else if (resolvedData === lookupKey) {
        resolvedData = '';
      }
    }

    // Xác định URL cuối cùng cho PDF
    if (typeof resolvedData === 'string' && (resolvedData.startsWith('http') || resolvedData.startsWith('blob:') || resolvedData.startsWith('data:'))) {
      this.currentPdfUrl = resolvedData;
    } else if (typeof resolvedData === 'string' && (resolvedData.startsWith('sheets/') || resolvedData.endsWith('.pdf'))) {
      this.currentPdfUrl = resolvedData;
    } else if (resolvedData instanceof Blob) {
      this.currentPdfUrl = URL.createObjectURL(resolvedData);
    } else if (fileName) {
      this.currentPdfUrl = fileName.startsWith('sheets/') ? fileName : `sheets/${fileName}`;
    } else {
      this.currentPdfUrl = `sheets/${this.currentFileName}`;
    }

    this.zoomScale = 1.0;
    this.renderViewerShell();
    await this.renderPdfContent();
  }

  renderViewerShell() {
    if (!this.frameWrapper) return;
    const safeTitle = this.currentTitle || 'Bản Nhạc PDF';

    this.frameWrapper.innerHTML = `
      <div style="display:flex; flex-direction:column; width:100%; height:100%;">
        <!-- Sub-toolbar điều khiển phóng to / thu nhỏ / tải file -->
        <div style="background:var(--bg-card-subtle,#f8fafc); border-bottom:1px solid var(--border,#e2e8f0); padding:8px 14px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div style="display:flex; align-items:center; gap:8px; min-width:0;">
            <span style="font-size:1.15rem;">🎼</span>
            <div style="min-width:0;">
              <div style="font-size:0.88rem; font-weight:800; color:var(--text-main,#0f172a); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${safeTitle}</div>
              <div id="pdfPageCountInfo" style="font-size:0.72rem; color:var(--text-muted,#64748b); font-family:monospace;">${this.currentFileName}</div>
            </div>
          </div>

          <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
            <div style="display:inline-flex; align-items:center; background:var(--bg-card,#fff); border:1px solid var(--border,#cbd5e1); border-radius:8px; overflow:hidden;">
              <button type="button" onclick="window.dohwaPDFViewer.zoomOut()" style="border:none; background:transparent; padding:4px 10px; font-weight:800; font-size:0.9rem; cursor:pointer; color:var(--text-main);" title="Thu nhỏ">−</button>
              <button type="button" id="pdfZoomLabelBtn" onclick="window.dohwaPDFViewer.resetZoom()" style="border:none; border-left:1px solid var(--border,#cbd5e1); border-right:1px solid var(--border,#cbd5e1); background:transparent; padding:4px 8px; font-weight:700; font-size:0.75rem; cursor:pointer; color:var(--primary,#6b3fa0);" title="Đặt lại 100%">100%</button>
              <button type="button" onclick="window.dohwaPDFViewer.zoomIn()" style="border:none; background:transparent; padding:4px 10px; font-weight:800; font-size:0.9rem; cursor:pointer; color:var(--text-main);" title="Phóng to">+</button>
            </div>

            <a href="${this.currentPdfUrl}" target="_blank" rel="noopener" class="action-btn btn-view" style="text-decoration:none; padding:5px 10px; font-size:0.78rem; font-weight:700; display:inline-flex; align-items:center; gap:4px;">
              ↗️ Mở Tab Mới
            </a>
            <button type="button" class="action-btn btn-pdf" onclick="window.dohwaPDFViewer.downloadCurrentPdf()" style="padding:5px 12px; font-size:0.78rem; font-weight:800; background:#0284c7; color:#fff; border:none; display:inline-flex; align-items:center; gap:4px; cursor:pointer;">
              📥 Tải PDF
            </button>
          </div>
        </div>

        <!-- Vùng hiển thị bản nhạc PDF -->
        <div id="pdfRenderViewport" style="flex:1; width:100%; height:calc(100% - 52px); background:#334155; position:relative; overflow:auto; -webkit-overflow-scrolling:touch;">
          <div id="pdfCanvasList" style="display:flex; flex-direction:column; align-items:center; gap:12px; padding:12px 8px; min-height:100%;">
            <div style="color:#e2e8f0; padding:30px; text-align:center; font-size:0.9rem;">⏳ Đang dựng trang bản nhạc...</div>
          </div>
        </div>
      </div>
    `;
  }

  async renderPdfContent() {
    const canvasList = document.getElementById('pdfCanvasList');
    if (!canvasList || !this.currentPdfUrl) return;

    // Thử dựng đa trang bằng PDF.js trước để mượt trên cả iPhone/Zalo/Android và Desktop
    try {
      const pdfjsLib = await this.ensurePdfJsLoaded();
      if (pdfjsLib) {
        let loadingTask;
        if (this.currentPdfUrl.startsWith('data:application/pdf;base64,')) {
          const base64 = this.currentPdfUrl.split(',')[1];
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          loadingTask = pdfjsLib.getDocument({ data: bytes });
        } else {
          loadingTask = pdfjsLib.getDocument(this.currentPdfUrl);
        }

        this.pdfDoc = await loadingTask.promise;
        const numPages = this.pdfDoc.numPages;
        const infoEl = document.getElementById('pdfPageCountInfo');
        if (infoEl) {
          infoEl.textContent = `${this.currentFileName} • ${numPages} trang`;
        }

        await this.renderAllPagesToCanvas();
        return;
      }
    } catch (err) {
      console.warn('[PDFViewer] Chuyển sang chế độ hiển thị khung chuẩn:', err);
    }

    // Fallback về <object> / <iframe> khi offline hoặc file:///
    this.renderFallbackFrame();
  }

  async renderAllPagesToCanvas() {
    const canvasList = document.getElementById('pdfCanvasList');
    const viewportEl = document.getElementById('pdfRenderViewport');
    if (!canvasList || !this.pdfDoc) return;

    canvasList.innerHTML = '';
    const containerWidth = Math.min((viewportEl ? viewportEl.clientWidth : window.innerWidth) - 20, 960);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    for (let pageNum = 1; pageNum <= this.pdfDoc.numPages; pageNum++) {
      const page = await this.pdfDoc.getPage(pageNum);
      const unscaledViewport = page.getViewport({ scale: 1 });
      const fitScale = (containerWidth / unscaledViewport.width) * this.zoomScale;
      const viewport = page.getViewport({ scale: fitScale });

      const pageWrap = document.createElement('div');
      pageWrap.style.cssText = 'background:#fff; border-radius:6px; box-shadow:0 6px 20px rgba(0,0,0,0.35); overflow:hidden; position:relative;';

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      canvas.style.display = 'block';

      pageWrap.appendChild(canvas);
      canvasList.appendChild(pageWrap);

      await page.render({
        canvasContext: ctx,
        transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null,
        viewport
      }).promise;
    }
  }

  renderFallbackFrame() {
    const viewportEl = document.getElementById('pdfRenderViewport');
    if (!viewportEl) return;
    const safeTitle = this.currentTitle || 'Bản Nhạc PDF';

    viewportEl.innerHTML = `
      <object data="${this.currentPdfUrl}" type="application/pdf" width="100%" height="100%">
        <iframe src="${this.currentPdfUrl}" width="100%" height="100%" style="border:none;">
          <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; background:#fff; padding:30px; text-align:center;">
            <div style="font-size:3.5rem; margin-bottom:12px;">📄</div>
            <h3 style="font-size:1.2rem; font-weight:800; color:#1e293b; margin-bottom:8px;">${safeTitle}</h3>
            <p style="color:#64748b; font-size:0.9rem; margin-bottom:16px;">Trình duyệt đang bảo mật hoặc chưa hỗ trợ xem trực tiếp file này.</p>
            <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
              <a href="${this.currentPdfUrl}" target="_blank" rel="noopener" class="btn btn-outline" style="padding:10px 18px; font-weight:700;">
                ↗️ Mở Trong Tab Mới
              </a>
              <a href="${this.currentPdfUrl}" download="${this.currentFileName}" class="btn btn-primary" style="padding:10px 22px; font-weight:800; background:#0284c7;">
                📥 Tải File PDF Về Máy
              </a>
            </div>
          </div>
        </iframe>
      </object>
    `;
  }

  async zoomIn() {
    this.zoomScale = Math.min(2.5, Math.round((this.zoomScale + 0.2) * 10) / 10);
    this.updateZoomLabel();
    if (this.pdfDoc) await this.renderAllPagesToCanvas();
  }

  async zoomOut() {
    this.zoomScale = Math.max(0.6, Math.round((this.zoomScale - 0.2) * 10) / 10);
    this.updateZoomLabel();
    if (this.pdfDoc) await this.renderAllPagesToCanvas();
  }

  async resetZoom() {
    this.zoomScale = 1.0;
    this.updateZoomLabel();
    if (this.pdfDoc) await this.renderAllPagesToCanvas();
  }

  updateZoomLabel() {
    const lbl = document.getElementById('pdfZoomLabelBtn');
    if (lbl) lbl.textContent = `${Math.round(this.zoomScale * 100)}%`;
  }

  close() {
    if (!this.modal) return;
    this.modal.style.display = 'none';
    this.modal.classList.remove('open');
    document.body.style.overflow = '';
    this.pdfDoc = null;
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
