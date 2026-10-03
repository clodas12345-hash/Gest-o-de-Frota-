import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Loader2, AlertCircle, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

// Configure PDF.js worker
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.0.379'}/build/pdf.worker.min.mjs`;
} catch (e) {
  console.warn('PDF.js worker initialization:', e);
}

interface PdfViewerProps {
  pdfDataUrl: string;
  fileName?: string;
  className?: string;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  pdfDataUrl,
  fileName = 'documento.pdf',
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.2);
  const [renderedPages, setRenderedPages] = useState<{ pageNum: number; dataUrl: string; width: number; height: number }[]>([]);

  useEffect(() => {
    let isCancelled = false;

    async function loadAndRenderPdf() {
      if (!pdfDataUrl) {
        setError('Nenhum dado de PDF fornecido.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Convert base64 / data URL to Uint8Array
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
            // Blob URL or raw URI
            const res = await fetch(pdfDataUrl);
            const buffer = await res.arrayBuffer();
            pdfData = new Uint8Array(buffer);
          }
        } else if (pdfDataUrl.startsWith('blob:') || pdfDataUrl.startsWith('http')) {
          const res = await fetch(pdfDataUrl);
          const buffer = await res.arrayBuffer();
          pdfData = new Uint8Array(buffer);
        } else {
          // Raw base64 string
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

        if (isCancelled) return;

        setNumPages(pdfDoc.numPages);
        const pages: { pageNum: number; dataUrl: string; width: number; height: number }[] = [];

        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
          if (isCancelled) return;
          const page = await pdfDoc.getPage(pageNum);
          const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for sharp text on retina/mobile

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          if (context) {
            // White background
            context.fillStyle = '#FFFFFF';
            context.fillRect(0, 0, canvas.width, canvas.height);

            const renderContext = {
              canvasContext: context,
              viewport: viewport
            };

            await page.render(renderContext as any).promise;
            pages.push({
              pageNum,
              dataUrl: canvas.toDataURL('image/jpeg', 0.92),
              width: viewport.width,
              height: viewport.height
            });
          }
        }

        if (!isCancelled) {
          setRenderedPages(pages);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Erro ao renderizar PDF via Canvas:', err);
        if (!isCancelled) {
          setError(err?.message || 'Falha ao renderizar as páginas do documento PDF.');
          setLoading(false);
        }
      }
    }

    loadAndRenderPdf();

    return () => {
      isCancelled = true;
    };
  }, [pdfDataUrl]);

  return (
    <div className={`flex flex-col h-full bg-[#18181b] text-white select-none ${className}`}>
      {/* Zoom / Page Controls Toolbar */}
      {!loading && !error && renderedPages.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-[#202024] border-b border-white/10 text-xs text-gray-300">
          <span className="font-mono text-[11px] text-gray-400">
            Total: <strong className="text-white">{numPages}</strong> {numPages === 1 ? 'página' : 'páginas'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setScale((s) => Math.max(0.6, s - 0.2))}
              className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-colors cursor-pointer"
              title="Diminuir Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] w-12 text-center text-amber-400 font-bold">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setScale((s) => Math.min(2.5, s + 0.2))}
              className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-colors cursor-pointer"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setScale(1.2)}
              className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors ml-1 cursor-pointer"
              title="Resetar Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-3 sm:p-6 flex flex-col items-center gap-6 bg-[#0f0f12]"
      >
        {loading && (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            <p className="text-xs font-medium">Renderizando páginas do documento PDF...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center p-6 text-center max-w-md my-auto space-y-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
            <AlertCircle className="w-10 h-10 text-rose-400" />
            <div>
              <h4 className="text-sm font-bold text-white">Não foi possível exibir a prévia</h4>
              <p className="text-xs text-gray-300 mt-1">{error}</p>
            </div>
            {pdfDataUrl && (
              <a
                href={pdfDataUrl}
                download={fileName}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl transition-all shadow-lg"
              >
                Baixar Documento Diretamente
              </a>
            )}
          </div>
        )}

        {!loading && !error && renderedPages.map((page) => (
          <div 
            key={page.pageNum}
            className="flex flex-col items-center gap-2 transition-transform duration-150"
            style={{ width: `${Math.min(100, Math.round(scale * 100))}%`, maxWidth: `${850 * scale}px` }}
          >
            <div className="w-full bg-white rounded-lg shadow-2xl overflow-hidden border border-white/20">
              <img 
                src={page.dataUrl} 
                alt={`Página ${page.pageNum}`}
                className="w-full h-auto block select-none pointer-events-none"
              />
            </div>
            <span className="text-[10px] font-mono text-gray-500">
              Página {page.pageNum} de {numPages}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
