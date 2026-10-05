import * as pdfjsLib from 'pdfjs-dist';
import { Capacitor, registerPlugin } from '@capacitor/core';

// Configure PDF.js worker
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.0.379'}/build/pdf.worker.min.mjs`;
} catch (e) {
  console.warn('PDF.js worker initialization:', e);
}

interface NativePrintPlugin {
  print(options: { html?: string; title?: string }): Promise<{ success: boolean }>;
}

const NativePrint = registerPlugin<NativePrintPlugin>('NativePrint');

/**
 * Builds printable HTML document for images
 */
function buildPrintableHtml(images: string[], title: string): string {
  const pagesHtml = images
    .map(
      (src, idx) =>
        `<div class="page-container ${idx < images.length - 1 ? 'page-break' : ''}">
          <img src="${src}" alt="Página ${idx + 1}" />
        </div>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @page {
      size: auto;
      margin: 6mm;
    }
    *, *:before, *:after {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      color: #000000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .page-container {
      width: 100%;
      text-align: center;
      margin: 0 auto;
      padding: 0;
    }
    .page-break {
      page-break-after: always;
      break-after: page;
    }
    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 0 auto;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
        background: transparent;
      }
      .page-container {
        page-break-inside: avoid;
      }
      .page-break {
        page-break-after: always;
        break-after: page;
      }
    }
  </style>
</head>
<body>
  ${pagesHtml}
</body>
</html>`;
}

/**
 * Native in-app print helper for Android / iOS / Web without opening external browser tabs.
 * In Android APK: invokes native Android PrintManager (Print Spooler).
 * In Web/PWA: uses an in-place hidden iframe to trigger OS print dialog.
 */
export async function printImages(images: string[], title = 'Documento'): Promise<void> {
  if (!images || images.length === 0) return;

  const html = buildPrintableHtml(images, title);

  // 1. If running natively in Android/iOS APK, invoke the NativePrint plugin
  if (Capacitor.isNativePlatform()) {
    try {
      await NativePrint.print({ html, title });
      return;
    } catch (e) {
      console.warn('Native print plugin error, falling back to iframe print:', e);
    }
  }

  // 2. In-place hidden iframe printing for Web / Desktop / PWA
  const existingIframe = document.getElementById('fleet-print-iframe');
  if (existingIframe) {
    existingIframe.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'fleet-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.zIndex = '-9999';
  iframe.style.visibility = 'hidden';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const triggerPrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.warn('Iframe print error, falling back to window.print():', e);
      window.print();
    }
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        iframe.remove();
      }
    }, 60000);
  };

  const iframeImages = doc.getElementsByTagName('img');
  let loadedCount = 0;
  const total = iframeImages.length;

  if (total === 0) {
    setTimeout(triggerPrint, 300);
  } else {
    for (let i = 0; i < total; i++) {
      const img = iframeImages[i];
      if (img.complete) {
        loadedCount++;
        if (loadedCount === total) {
          setTimeout(triggerPrint, 300);
        }
      } else {
        img.onload = () => {
          loadedCount++;
          if (loadedCount === total) {
            setTimeout(triggerPrint, 300);
          }
        };
        img.onerror = () => {
          loadedCount++;
          if (loadedCount === total) {
            setTimeout(triggerPrint, 300);
          }
        };
      }
    }
  }
}

/**
 * Print a single image URL or Data URL directly
 */
export async function printImage(imageUrl: string, title = 'Imagem'): Promise<void> {
  if (!imageUrl) return;
  await printImages([imageUrl], title);
}

/**
 * Print a PDF dataUrl or blob by rendering pages to sharp images and printing in-place
 */
export async function printPdfDataUrl(pdfDataUrl: string, title = 'Documento PDF'): Promise<void> {
  if (!pdfDataUrl) return;

  try {
    let pdfData: Uint8Array;
    if (pdfDataUrl.startsWith('data:')) {
      const base64Index = pdfDataUrl.indexOf(';base64,');
      if (base64Index !== -1) {
        const base64 = pdfDataUrl.substring(base64Index + 8);
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        pdfData = bytes;
      } else {
        const res = await fetch(pdfDataUrl);
        const buffer = await res.arrayBuffer();
        pdfData = new Uint8Array(buffer);
      }
    } else if (pdfDataUrl.startsWith('blob:') || pdfDataUrl.startsWith('http')) {
      const res = await fetch(pdfDataUrl);
      const buffer = await res.arrayBuffer();
      pdfData = new Uint8Array(buffer);
    } else {
      const binaryString = window.atob(pdfDataUrl);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      pdfData = bytes;
    }

    const loadingTask = pdfjsLib.getDocument({ data: pdfData });
    const pdfDoc = await loadingTask.promise;
    const images: string[] = [];

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      if (context) {
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: context, viewport } as any).promise;
        images.push(canvas.toDataURL('image/jpeg', 0.95));
      }
    }

    if (images.length > 0) {
      await printImages(images, title);
    } else {
      window.print();
    }
  } catch (err) {
    console.error('Error in printPdfDataUrl:', err);
    window.print();
  }
}
