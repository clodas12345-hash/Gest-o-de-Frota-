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
  saveToDownloads(options: { base64: string; fileName: string; mimeType?: string }): Promise<{ success: boolean; fileName: string }>;
  openFile(options: { base64: string; fileName: string; mimeType?: string }): Promise<{ success: boolean }>;
}

const NativePrint = registerPlugin<NativePrintPlugin>('NativePrint');
const Filesystem = registerPlugin<any>('Filesystem');
const Share = registerPlugin<any>('Share');
const Directory = { Cache: 'CACHE', Documents: 'DOCUMENTS', Data: 'DATA' };

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

async function extractBase64AndMime(contentUrl: string, defaultMime = 'application/pdf'): Promise<{ base64: string; mimeType: string }> {
  if (contentUrl.startsWith('data:')) {
    const [header, data] = contentUrl.split(',');
    const mimeMatch = header.match(/data:([^;]+)/);
    return {
      base64: data || '',
      mimeType: mimeMatch ? mimeMatch[1] : defaultMime
    };
  }
  const res = await fetch(contentUrl);
  const blob = await res.blob();
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = (reader.result as string) || '';
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.readAsDataURL(blob);
  });
  return {
    base64,
    mimeType: blob.type || defaultMime
  };
}

/**
 * Saves/downloads a file directly to the device's Downloads folder (on Android APK)
 * or triggers a direct browser download (on Web), WITHOUT opening the Share dialog.
 */
export async function downloadFileDirect(contentUrl: string, rawFileName: string): Promise<boolean> {
  const cleanName = (rawFileName || 'documento.pdf').replace(/[\\/:*?"<>|]/g, '-');
  const fileName = cleanName.includes('.') ? cleanName : `${cleanName}.pdf`;

  if (Capacitor.isNativePlatform() && contentUrl) {
    try {
      const { base64, mimeType } = await extractBase64AndMime(contentUrl);
      try {
        await NativePrint.saveToDownloads({
          base64,
          fileName,
          mimeType
        });
        return true;
      } catch (nativeErr) {
        console.warn('saveToDownloads fallback to Filesystem Documents:', nativeErr);
        await Filesystem.writeFile({
          path: fileName,
          data: base64,
          directory: Directory.Documents
        });
        return true;
      }
    } catch (err) {
      console.error('Erro ao salvar documento diretamente no aparelho:', err);
    }
  }

  // Web / Browser direct download
  try {
    const link = document.createElement('a');
    if (contentUrl && contentUrl.startsWith('data:')) {
      const { base64, mimeType } = await extractBase64AndMime(contentUrl);
      const binary = window.atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
      return true;
    }
    link.href = contentUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.error('Erro no download web:', err);
    return false;
  }
}

/**
 * Opens the native Share sheet with the file attached (WhatsApp, Drive, Quick Share, etc.)
 */
export async function shareFileWithAttachment(contentUrl: string, rawFileName: string, title?: string): Promise<void> {
  if (!contentUrl) return;
  const cleanName = (rawFileName || 'documento.pdf').replace(/[\\/:*?"<>|]/g, '-');
  const fileName = cleanName.includes('.') ? cleanName : `${cleanName}.pdf`;

  if (Capacitor.isNativePlatform()) {
    try {
      const { base64 } = await extractBase64AndMime(contentUrl);
      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Cache
      });

      await Share.share({
        title: title || rawFileName || fileName,
        url: result.uri,
        dialogTitle: 'Compartilhar Documento'
      });
      return;
    } catch (err) {
      console.error('Erro ao compartilhar documento nativamente:', err);
    }
  }

  // Web fallback using navigator.share with file
  try {
    const { base64, mimeType } = await extractBase64AndMime(contentUrl);
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });
    const file = new File([blob], fileName, { type: mimeType });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: title || fileName,
        files: [file]
      });
      return;
    }
  } catch (err) {
    console.warn('Web share fallback to download:', err);
  }

  await downloadFileDirect(contentUrl, fileName);
}

/**
 * Opens a PDF or document externally (in Android native PDF viewer via ACTION_VIEW,
 * or in a new browser tab with a Blob URL on Web).
 */
export async function openFileExternal(contentUrl: string, rawFileName = 'documento.pdf'): Promise<void> {
  if (!contentUrl) return;
  const cleanName = (rawFileName || 'documento.pdf').replace(/[\\/:*?"<>|]/g, '-');
  const fileName = cleanName.includes('.') ? cleanName : `${cleanName}.pdf`;

  if (Capacitor.isNativePlatform()) {
    try {
      const { base64, mimeType } = await extractBase64AndMime(contentUrl);
      try {
        await NativePrint.openFile({
          base64,
          fileName,
          mimeType
        });
        return;
      } catch (nativeOpenErr) {
        console.warn('NativePrint.openFile fallback to Share:', nativeOpenErr);
        const result = await Filesystem.writeFile({
          path: fileName,
          data: base64,
          directory: Directory.Cache
        });
        await Share.share({
          title: fileName,
          url: result.uri,
          dialogTitle: 'Abrir Documento'
        });
        return;
      }
    } catch (err) {
      console.error('Erro ao abrir documento externamente no Android:', err);
    }
  }

  // Web / Browser: open Blob URL in new tab
  try {
    const { base64, mimeType } = await extractBase64AndMime(contentUrl);
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);
    const win = window.open(blobUrl, '_blank');
    if (!win) {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  } catch (err) {
    console.error('Erro ao abrir documento em nova aba:', err);
  }
}
