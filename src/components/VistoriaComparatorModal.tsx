import React, { useState } from 'react';
import { Vehicle, Vistoria } from '../types';
import { 
  X, 
  GitCompare, 
  ArrowRight, 
  Calendar, 
  Gauge, 
  Check, 
  AlertTriangle, 
  ZoomIn, 
  Download, 
  Sparkles, 
  FileText,
  ShieldCheck,
  Camera
} from 'lucide-react';
import jsPDF from 'jspdf';
import { urlToDataUrl } from '../utils/pdfGenerator';

interface VistoriaComparatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle;
  vistorias: Vistoria[];
}

export const VistoriaComparatorModal: React.FC<VistoriaComparatorModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  vistorias
}) => {
  const vehicleVistorias = vistorias.filter(
    v => v.vehicleId === vehicle.id || (v.vehiclePlate && v.vehiclePlate.replace(/[^A-Z0-9]/gi, '').toUpperCase() === vehicle.plate.replace(/[^A-Z0-9]/gi, '').toUpperCase())
  );

  const [vistoriaAId, setVistoriaAId] = useState<string>(() => {
    // Default to first (e.g. Entrega if available)
    const entrega = vehicleVistorias.find(v => v.type === 'entrega');
    return entrega ? entrega.id : vehicleVistorias[vehicleVistorias.length - 1]?.id || '';
  });

  const [vistoriaBId, setVistoriaBId] = useState<string>(() => {
    // Default to latest (e.g. Devolução or most recent)
    const devolucao = vehicleVistorias.find(v => v.type === 'devolução');
    if (devolucao && devolucao.id !== vistoriaAId) return devolucao.id;
    return vehicleVistorias[0]?.id || '';
  });

  const [enlargedPhoto, setEnlargedPhoto] = useState<{ url: string; title: string } | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  if (!isOpen) return null;

  const vistoriaA = vehicleVistorias.find(v => v.id === vistoriaAId) || vehicleVistorias[1] || vehicleVistorias[0];
  const vistoriaB = vehicleVistorias.find(v => v.id === vistoriaBId) || vehicleVistorias[0];

  // Collect all unique checklist keys from both
  const allChecklistKeys = Array.from(new Set([
    ...Object.keys(vistoriaA?.checklist || {}),
    ...Object.keys(vistoriaB?.checklist || {})
  ]));

  const kmA = vistoriaA?.km || 0;
  const kmB = vistoriaB?.km || 0;
  const kmDelta = kmB && kmA ? kmB - kmA : 0;

  const handleExportComparisonPDF = async () => {
    if (!vistoriaA || !vistoriaB) return;
    setIsExportingPdf(true);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Header
      doc.setFillColor(15, 15, 20);
      doc.rect(0, 0, 210, 32, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('RELATÓRIO COMPARATIVO DE VISTORIAS', 14, 15);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(180, 180, 190);
      doc.text(
        `Veículo: ${vehicle.brand} ${vehicle.model} | Placa: ${vehicle.plate} | Locatário: ${vehicle.driver || 'Não informado'}`,
        14,
        24
      );

      let y = 42;

      // Overview box
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(14, y, 182, 22, 2, 2, 'F');
      doc.setTextColor(30, 30, 40);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`VISTORIA INICIAL (A): ${vistoriaA.type || 'Vistoria'} (${vistoriaA.date})`, 18, y + 8);
      doc.text(`VISTORIA COMPARADA (B): ${vistoriaB.type || 'Vistoria'} (${vistoriaB.date})`, 18, y + 16);

      if (kmDelta > 0) {
        doc.setTextColor(16, 185, 129);
        doc.text(`KM Rodados no Período: +${kmDelta.toLocaleString('pt-BR')} KM`, 115, y + 16);
      }

      y += 30;

      // Checklist Comparison Table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(20, 20, 30);
      doc.text('COMPARATIVO DO CHECKLIST DE ITENS', 14, y);
      y += 6;

      // Table header
      doc.setFillColor(230, 235, 245);
      doc.rect(14, y, 182, 7, 'F');
      doc.setFontSize(8.5);
      doc.setTextColor(50, 50, 60);
      doc.text('ITEM INSPEÇÃO', 18, y + 5);
      doc.text(`STATUS EM ${vistoriaA.date}`, 100, y + 5);
      doc.text(`STATUS EM ${vistoriaB.date}`, 150, y + 5);
      y += 8;

      allChecklistKeys.forEach((key, idx) => {
        if (y > 270) {
          doc.addPage();
          y = 15;
        }

        const isOkA = vistoriaA.checklist ? vistoriaA.checklist[key] : undefined;
        const isOkB = vistoriaB.checklist ? vistoriaB.checklist[key] : undefined;

        if (idx % 2 === 0) {
          doc.setFillColor(250, 250, 252);
          doc.rect(14, y - 2, 182, 6, 'F');
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(40, 40, 50);
        doc.text(key, 18, y + 2.5);

        // Status A
        if (isOkA === true) {
          doc.setTextColor(16, 185, 129);
          doc.text('[OK / APROVADO]', 100, y + 2.5);
        } else if (isOkA === false) {
          doc.setTextColor(225, 29, 72);
          doc.text('[PENDENTE / AVARIA]', 100, y + 2.5);
        } else {
          doc.setTextColor(150, 150, 160);
          doc.text('-', 100, y + 2.5);
        }

        // Status B
        if (isOkB === true) {
          doc.setTextColor(16, 185, 129);
          doc.text('[OK / APROVADO]', 150, y + 2.5);
        } else if (isOkB === false) {
          doc.setTextColor(225, 29, 72);
          doc.text('[PENDENTE / AVARIA]', 150, y + 2.5);
        } else {
          doc.setTextColor(150, 150, 160);
          doc.text('-', 150, y + 2.5);
        }

        y += 6;
      });

      // Photos side-by-side
      const maxPhotos = Math.max(vistoriaA.photos?.length || 0, vistoriaB.photos?.length || 0);
      if (maxPhotos > 0) {
        doc.addPage();
        y = 15;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(20, 20, 30);
        doc.text('REGISTRO FOTOGRÁFICO LADO A LADO', 14, y);
        y += 8;

        for (let i = 0; i < maxPhotos; i++) {
          if (y > 210) {
            doc.addPage();
            y = 15;
          }

          const photoA = vistoriaA.photos?.[i];
          const photoB = vistoriaB.photos?.[i];

          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(60, 60, 70);
          doc.text(`Foto #${i + 1} - Inicial (${vistoriaA.date})`, 14, y);
          doc.text(`Foto #${i + 1} - Comparada (${vistoriaB.date})`, 110, y);
          y += 3;

          if (photoA) {
            const dataUrlA = await urlToDataUrl(photoA);
            if (dataUrlA) {
              try {
                doc.addImage(dataUrlA.dataUrl, dataUrlA.format, 14, y, 85, 55);
              } catch (e) {}
            }
          }

          if (photoB) {
            const dataUrlB = await urlToDataUrl(photoB);
            if (dataUrlB) {
              try {
                doc.addImage(dataUrlB.dataUrl, dataUrlB.format, 110, y, 85, 55);
              } catch (e) {}
            }
          }

          y += 62;
        }
      }

      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150, 150, 160);
        doc.text(
          `Relatório comparativo gerado em ${new Date().toLocaleDateString('pt-BR')} - Página ${p} de ${totalPages}`,
          14,
          290
        );
      }

      doc.save(`comparativo_vistoria_${vehicle.plate}_${vistoriaA.date}_vs_${vistoriaB.date}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF comparativo:', err);
      alert('Erro ao gerar relatório comparativo em PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[110] p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#121214] border border-white/10 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-[#18181b]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Comparador Inteligente de Vistorias
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {vehicle.plate}
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                {vehicle.brand} {vehicle.model} • Compare fotos, odômetro e itens entre Entrega e Devolução
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportComparisonPDF}
              disabled={isExportingPdf || vehicleVistorias.length < 2}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-purple-900/30"
              title="Exportar laudo comparativo em PDF"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPdf ? 'Gerando PDF...' : 'Baixar Comparativo (PDF)'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Selection Bar */}
        {vehicleVistorias.length < 2 ? (
          <div className="p-8 text-center space-y-3 bg-[#16161a]">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">Vistorias Insuficientes para Comparação</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Este veículo possui apenas {vehicleVistorias.length} vistoria cadastrada. Para comparar lado a lado, realize pelo menos duas vistorias (ex: Entrega e Devolução ou Vistorias Periódicas).
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-black/40 border-b border-white/10">
              {/* Select Vistoria A */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-blue-400 flex items-center gap-1">
                  <span>Vistoria Inicial / Base (A):</span>
                </label>
                <select
                  value={vistoriaAId}
                  onChange={(e) => setVistoriaAId(e.target.value)}
                  className="w-full bg-[#1e1e24] border border-blue-500/30 text-white text-xs rounded-xl p-2.5 font-medium focus:outline-hidden focus:border-blue-400 cursor-pointer"
                >
                  {vehicleVistorias.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.type || 'Vistoria'} - {v.date} ({v.photos?.length || 0} fotos{v.km ? ` • ${v.km.toLocaleString('pt-BR')} KM` : ''})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Vistoria B */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-purple-400 flex items-center gap-1">
                  <span>Vistoria Comparada / Final (B):</span>
                </label>
                <select
                  value={vistoriaBId}
                  onChange={(e) => setVistoriaBId(e.target.value)}
                  className="w-full bg-[#1e1e24] border border-purple-500/30 text-white text-xs rounded-xl p-2.5 font-medium focus:outline-hidden focus:border-purple-400 cursor-pointer"
                >
                  {vehicleVistorias.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.type || 'Vistoria'} - {v.date} ({v.photos?.length || 0} fotos{v.km ? ` • ${v.km.toLocaleString('pt-BR')} KM` : ''})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Metrics Delta Bar */}
            <div className="grid grid-cols-3 gap-2 px-4 py-2.5 bg-[#16161a] border-b border-white/5 text-center">
              <div className="p-2 bg-black/40 rounded-xl border border-white/5">
                <span className="text-[10px] text-gray-400 uppercase font-bold block">KM Vistoria A</span>
                <span className="text-xs font-mono font-bold text-white">
                  {kmA ? `${kmA.toLocaleString('pt-BR')} KM` : 'Não registrado'}
                </span>
              </div>
              <div className="p-2 bg-black/40 rounded-xl border border-white/5">
                <span className="text-[10px] text-gray-400 uppercase font-bold block">KM Vistoria B</span>
                <span className="text-xs font-mono font-bold text-white">
                  {kmB ? `${kmB.toLocaleString('pt-BR')} KM` : 'Não registrado'}
                </span>
              </div>
              <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
                <span className="text-[10px] text-purple-300 uppercase font-bold block">KM Rodados no Período</span>
                <span className={`text-xs font-mono font-bold ${kmDelta >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {kmDelta >= 0 ? `+${kmDelta.toLocaleString('pt-BR')} KM` : `${kmDelta.toLocaleString('pt-BR')} KM`}
                </span>
              </div>
            </div>

            {/* Comparison Content Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
              
              {/* Checklist Comparison */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Comparativo de Checklist e Integridade
                </h3>

                <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-12 p-3 bg-white/5 border-b border-white/10 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    <div className="col-span-6">Item de Inspeção</div>
                    <div className="col-span-3 text-center text-blue-400">Vistoria A ({vistoriaA?.date})</div>
                    <div className="col-span-3 text-center text-purple-400">Vistoria B ({vistoriaB?.date})</div>
                  </div>

                  <div className="divide-y divide-white/5">
                    {allChecklistKeys.map((key) => {
                      const isOkA = vistoriaA?.checklist?.[key];
                      const isOkB = vistoriaB?.checklist?.[key];
                      const hasDivergence = isOkA !== isOkB;

                      return (
                        <div 
                          key={key} 
                          className={`grid grid-cols-12 p-3 items-center text-xs transition-colors ${
                            hasDivergence ? 'bg-amber-500/5' : 'hover:bg-white/5'
                          }`}
                        >
                          <div className="col-span-6 font-medium text-gray-200 flex items-center gap-2">
                            <span>{key}</span>
                            {hasDivergence && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Divergência
                              </span>
                            )}
                          </div>

                          <div className="col-span-3 flex justify-center">
                            {isOkA === true && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                <Check className="w-3 h-3" /> OK
                              </span>
                            )}
                            {isOkA === false && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                                <X className="w-3 h-3" /> Avaria
                              </span>
                            )}
                            {isOkA === undefined && <span className="text-gray-500 text-[10px]">-</span>}
                          </div>

                          <div className="col-span-3 flex justify-center">
                            {isOkB === true && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                <Check className="w-3 h-3" /> OK
                              </span>
                            )}
                            {isOkB === false && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                                <X className="w-3 h-3" /> Avaria
                              </span>
                            )}
                            {isOkB === undefined && <span className="text-gray-500 text-[10px]">-</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Photos Comparison Side-by-Side */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Camera className="w-4 h-4 text-purple-400" />
                  Comparativo Fotográfico Lado a Lado
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Photos A */}
                  <div className="p-4 bg-black/40 border border-blue-500/20 rounded-xl space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-blue-500/20">
                      <span className="text-xs font-bold text-blue-300">
                        Vistoria A: {vistoriaA?.type || 'Vistoria'} ({vistoriaA?.date})
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {vistoriaA?.photos?.length || 0} fotos
                      </span>
                    </div>

                    {vistoriaA?.photos && vistoriaA.photos.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {vistoriaA.photos.map((photo, pIdx) => (
                          <div 
                            key={pIdx} 
                            onClick={() => setEnlargedPhoto({ url: photo, title: `Vistoria A (${vistoriaA.date}) - Foto #${pIdx + 1}` })}
                            className="relative group rounded-lg overflow-hidden border border-white/10 aspect-video bg-black/60 cursor-pointer"
                          >
                            <img src={photo} alt={`Vistoria A Foto ${pIdx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ZoomIn className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic py-4 text-center">Nenhuma foto anexada nesta vistoria.</p>
                    )}

                    {vistoriaA?.notes && (
                      <div className="p-2.5 bg-black/30 rounded-lg border border-white/5 text-[11px] text-gray-300">
                        <strong className="text-blue-300 block mb-0.5">Observações:</strong>
                        {vistoriaA.notes}
                      </div>
                    )}
                  </div>

                  {/* Photos B */}
                  <div className="p-4 bg-black/40 border border-purple-500/20 rounded-xl space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
                      <span className="text-xs font-bold text-purple-300">
                        Vistoria B: {vistoriaB?.type || 'Vistoria'} ({vistoriaB?.date})
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {vistoriaB?.photos?.length || 0} fotos
                      </span>
                    </div>

                    {vistoriaB?.photos && vistoriaB.photos.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {vistoriaB.photos.map((photo, pIdx) => (
                          <div 
                            key={pIdx} 
                            onClick={() => setEnlargedPhoto({ url: photo, title: `Vistoria B (${vistoriaB.date}) - Foto #${pIdx + 1}` })}
                            className="relative group rounded-lg overflow-hidden border border-white/10 aspect-video bg-black/60 cursor-pointer"
                          >
                            <img src={photo} alt={`Vistoria B Foto ${pIdx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ZoomIn className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic py-4 text-center">Nenhuma foto anexada nesta vistoria.</p>
                    )}

                    {vistoriaB?.notes && (
                      <div className="p-2.5 bg-black/30 rounded-lg border border-white/5 text-[11px] text-gray-300">
                        <strong className="text-purple-300 block mb-0.5">Observações:</strong>
                        {vistoriaB.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </>
        )}

      </div>

      {/* Enlarged Photo Modal */}
      {enlargedPhoto && (
        <div 
          className="fixed inset-0 bg-black/95 z-[130] flex flex-col items-center justify-center p-4"
          onClick={() => setEnlargedPhoto(null)}
        >
          <div className="max-w-4xl max-h-[85vh] flex flex-col items-center space-y-3">
            <div className="flex items-center justify-between w-full text-white">
              <span className="text-sm font-bold">{enlargedPhoto.title}</span>
              <button 
                onClick={() => setEnlargedPhoto(null)}
                className="p-1 hover:bg-white/10 rounded-lg cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <img 
              src={enlargedPhoto.url} 
              alt="Foto ampliada" 
              className="max-w-full max-h-[75vh] object-contain rounded-xl border border-white/20 shadow-2xl" 
            />
          </div>
        </div>
      )}
    </div>
  );
};
