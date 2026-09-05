import React, { useState, useRef } from 'react';
import { Camera, Check, X, ShieldCheck, FileCheck2, Trash2, Send, Info } from 'lucide-react';
import { Vehicle, Vistoria } from '../types';
import { generateVistoriaPDF } from '../utils/pdfGenerator';

interface DriverVistoriaFormProps {
  vehicle: Vehicle | undefined;
  plateRequested: string;
  checklistConfig: string[];
  onSaveVistoria: (v: Vistoria, pdfDataUrl?: string, pdfFileName?: string) => void;
  onExit: () => void;
  initialType?: 'Entrega de Veículo' | 'Periódica' | 'Devolução de Veículo';
}

export function DriverVistoriaForm({ 
  vehicle, 
  plateRequested, 
  checklistConfig,
  onSaveVistoria, 
  onExit,
  initialType
}: DriverVistoriaFormProps) {
  
  const [vistoriaType, setVistoriaType] = useState<'Entrega de Veículo' | 'Periódica' | 'Devolução de Veículo'>(() => {
    if (initialType) return initialType;
    const params = new URLSearchParams(window.location.search);
    const typeFromUrl = params.get('type');
    if (typeFromUrl === 'Entrega de Veículo' || typeFromUrl === 'Periódica' || typeFromUrl === 'Devolução de Veículo') {
      return typeFromUrl;
    }
    return 'Periódica';
  });

  const [checklist, setChecklist] = useState<Record<string, { isOk: boolean, photoUrl: string | null }>>(() => {
    const initial: Record<string, { isOk: boolean, photoUrl: string | null }> = {};
    if (checklistConfig && checklistConfig.length > 0) {
      checklistConfig.forEach(item => {
        initial[item] = { isOk: true, photoUrl: null };
      });
    } else {
      initial['Checklist Padrão'] = { isOk: true, photoUrl: null };
    }
    return initial;
  });

  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [generatedPdf, setGeneratedPdf] = useState<{pdfDataUrl: string, fileName: string} | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [targetPhotoItem, setTargetPhotoItem] = useState<string | null>(null);

  const checkIsExpired = () => {
    if (!vehicle?.nextVistoriaDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(vehicle.nextVistoriaDate + 'T00:00:00');
    deadline.setHours(0, 0, 0, 0);
    return today.getTime() > deadline.getTime();
  };
  const isExpired = checkIsExpired();

  const handleToggleChecklist = (key: string) => {
    setChecklist(prev => ({
      ...prev,
      [key]: { ...prev[key], isOk: !prev[key].isOk }
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    } else {
      setTargetPhotoItem(null);
    }
  };

  const processFiles = (fileList: FileList) => {
    Array.from(fileList).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;
              const maxDim = 600;
              if (width > maxDim || height > maxDim) {
                if (width > height) {
                  height = Math.round((height * maxDim) / width);
                  width = maxDim;
                } else {
                  width = Math.round((width * maxDim) / height);
                  height = maxDim;
                }
              }
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
                if (targetPhotoItem) {
                  setChecklist(prev => ({
                    ...prev,
                    [targetPhotoItem]: { ...prev[targetPhotoItem], photoUrl: compressedDataUrl }
                  }));
                  setTargetPhotoItem(null);
                } else {
                  setPhotos(prev => [...prev, compressedDataUrl]);
                }
              }
            };
            img.src = event.target.result as string;
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingPdf(true);
    
    const combinedPhotos = [...photos, ...Object.values(checklist).map((v: any) => v.photoUrl).filter(Boolean)] as string[];
    const booleanChecklist = Object.fromEntries(Object.entries(checklist).map(([k, v]: [string, any]) => [k, v.isOk]));

    const newVistoria: Vistoria = {
      id: `vist-pub-${Date.now()}`,
      vehicleId: vehicle?.id || 'unknown',
      date: new Date().toISOString().split('T')[0],
      type: vistoriaType,
      checklist: booleanChecklist,
      photos: combinedPhotos,
      notes: notes.trim() || undefined
    };

    if (vehicle) {
      try {
        const { pdfDataUrl, fileName } = await generateVistoriaPDF(vehicle, newVistoria);
        setGeneratedPdf({ pdfDataUrl, fileName });
        onSaveVistoria(newVistoria, pdfDataUrl, fileName);
      } catch (err) {
        console.error('Error generating PDF during submit:', err);
        onSaveVistoria(newVistoria);
      }
    } else {
      onSaveVistoria(newVistoria);
    }

    setIsGeneratingPdf(false);
    setIsSubmitted(true);
  };

  const dataURLtoFile = (dataurl: string, filename: string) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleSendWhatsAppConfirmation = async () => {
    if (!vehicle) return;
    const checklistText = Object.entries(checklist).filter(([_, state]: [string, any]) => state.isOk)
      .map(([key]) => `✅ ${key}`)
      .join('\n') || 'Nenhum item marcado';
    const whatsappMessage = 
`✅ *RETORNO DE VISTORIA CONCLUÍDO*
📌 *Tipo:* ${vistoriaType}

🚗 *Veículo:* ${vehicle.brand} ${vehicle.model}
🏷️ *Placa:* ${vehicle.plate}
👤 *Locatário:* ${vehicle.driver || 'Não definido'}
📅 *Data da Vistoria:* ${new Date().toLocaleDateString('pt-BR')}

*CHECKLIST DE INSPEÇÃO:*
${checklistText}

⚠️ *Observações:* ${notes.trim() || 'Nenhuma'}
📸 *Fotos Enviadas:* ${photos.length + Object.values(checklist).filter((v: any) => v.photoUrl).length} fotos registradas.

---
_Enviado via sistema de vistoria digital._`;
    let fallbackPdfDataUrl = generatedPdf?.pdfDataUrl || '';
    let fallbackFileName = generatedPdf?.fileName || '';
    if (!fallbackPdfDataUrl) {
      try {
        const combinedPhotos = [...photos, ...Object.values(checklist).map((v: any) => v.photoUrl).filter(Boolean)] as string[];
        const booleanChecklist = Object.fromEntries(Object.entries(checklist).map(([k, v]: [string, any]) => [k, v.isOk]));
        const tempVistoria: Vistoria = {
          id: 'temp',
          vehicleId: vehicle.id,
          date: new Date().toISOString().split('T')[0],
          type: vistoriaType,
          checklist: booleanChecklist,
          photos: combinedPhotos,
          notes
        };
        const { pdfDataUrl, fileName } = await generateVistoriaPDF(vehicle, tempVistoria);
        fallbackPdfDataUrl = pdfDataUrl;
        fallbackFileName = fileName;
      } catch (err) {
        console.error('Error generating fallback PDF:', err);
      }
    }
    if (navigator.share && fallbackPdfDataUrl) {
      try {
        const file = dataURLtoFile(fallbackPdfDataUrl, fallbackFileName);
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Vistoria ${vehicle.plate}`,
            text: whatsappMessage,
            files: [file]
          });
          return;
        }
      } catch (err) {
        console.error('Error sharing via Web Share API:', err);
      }
    }
    const encodedMessage = encodeURIComponent(whatsappMessage);
    const waUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(waUrl, '_blank');
  };

  const allPhotosTaken = Object.values(checklist).every((state: any) => state.photoUrl !== null);

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col fixed inset-0 z-50 overflow-y-auto">
      <header className="bg-[#111111] border-b border-white/5 py-4 px-6 flex items-center justify-between sticky top-0 z-10 shadow-md">
        <div>
          <h1 className="text-sm font-bold text-emerald-400 tracking-wider">VISTORIA DIGITAL</h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Gestão de Frota</p>
        </div>
        {vehicle && (
          <div className="text-right">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest block">Placa</span>
            <span className="text-xs font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded border border-white/20">
              {vehicle.plate}
            </span>
          </div>
        )}
      </header>
      <main className="flex-1 p-4 max-w-lg w-full mx-auto pb-32">
        {!vehicle ? (
          <div className="bg-[#111111] border border-red-500/20 rounded-2xl p-6 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <X className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Veículo Não Encontrado</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Não conseguimos localizar o veículo com a placa <span className="font-mono text-red-400 font-semibold">{plateRequested}</span> em nosso sistema de gestão.
              </p>
            </div>
            <button
              onClick={onExit}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs text-white transition-colors cursor-pointer"
            >
              Ver Todos os Veículos
            </button>
          </div>
        ) : isSubmitted ? (
          <div className="bg-[#111111] border border-emerald-500/20 rounded-2xl p-6 text-center shadow-xl space-y-6">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            
            <div>
              <h2 className="text-lg font-bold text-emerald-400">Vistoria Concluída!</h2>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                As informações foram salvas com sucesso no sistema.
              </p>
            </div>
            
            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={handleSendWhatsAppConfirmation}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                id="btn-send-whatsapp-confirm"
              >
                <Send className="w-5 h-5" />
                <span>Compartilhar Relatório + Fotos</span>
              </button>
              
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-left">
                <p className="text-[10px] text-gray-400 leading-relaxed flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Dica:</strong> Ao clicar acima, use a opção <strong>WhatsApp</strong>. O sistema irá gerar um PDF completo da vistoria (incluindo as fotos) e tentará anexá-lo à mensagem automaticamente.
                  </span>
                </p>
              </div>
              <button
                onClick={onExit}
                className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-xl flex items-center justify-center transition-all cursor-pointer mt-2"
              >
                Voltar para Gestão
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-[#111111] border border-emerald-500/20 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">
                    Tipo de Vistoria Solicitada
                  </span>
                  <h3 className="text-sm font-bold text-emerald-400 mt-0.5">
                    {vistoriaType}
                  </h3>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-300 font-bold px-2.5 py-1 rounded-full border border-emerald-500/20 uppercase tracking-wider shrink-0">
                Seleção do Gestor
              </span>
            </div>
            
            <div className="bg-[#111111] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2 flex items-center gap-2">
                <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
                Checklist de Inspeção
              </h3>
              <div className="space-y-3">
                {Object.entries(checklist).map(([key, state]: [string, {isOk: boolean, photoUrl: string | null}]) => (
                  <div key={key} className="bg-black/40 rounded-xl border border-white/5 overflow-hidden">
                    <div 
                      onClick={() => handleToggleChecklist(key)}
                      className={`flex items-center justify-between p-3 transition-all cursor-pointer select-none ${
                        state.isOk ? 'bg-emerald-500/5 text-white' : 'bg-red-500/5 text-gray-300'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold">{key}</span>
                      </div>
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                        state.isOk ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                      }`}>
                        {state.isOk ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      </div>
                    </div>
                    <div className="p-3 border-t border-white/5 flex flex-col gap-2">
                      {!state.photoUrl ? (
                        <button
                          type="button"
                          onClick={() => {
                            setTargetPhotoItem(key);
                            cameraInputRef.current?.click();
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 text-emerald-400 border border-white/10 rounded-lg text-[10px] font-bold uppercase transition-colors cursor-pointer"
                        >
                          <Camera className="w-4 h-4" /> Bater Foto: {key}
                        </button>
                      ) : (
                        <div className="relative group rounded-lg overflow-hidden border border-emerald-500/20 w-full h-32">
                          <img src={state.photoUrl} alt={key} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => {
                                setTargetPhotoItem(key);
                                cameraInputRef.current?.click();
                              }}
                              className="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
                            >
                              <Camera className="w-3 h-3" /> Refazer Foto
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#111111] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Camera className="w-4.5 h-4.5 text-emerald-400" />
                  Fotos Extras (Opcional)
                </h3>
                <span className="text-[10px] text-gray-500">Tire ou envie fotos</span>
              </div>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={cameraInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                  type="button"
                  onClick={() => { setTargetPhotoItem(null); cameraInputRef.current?.click(); }}
                  className="w-full flex items-center justify-center gap-2 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-center cursor-pointer text-gray-300 text-xs font-bold uppercase tracking-wider"
                >
                  <Camera className="w-5 h-5 text-gray-400" />
                  Adicionar Foto Extra
              </button>
              {photos.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {photos.map((photo, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-white/10 aspect-video bg-black/50">
                      <img
                        src={photo}
                        alt={`Preview ${idx}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePhoto(idx);
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-600/95 hover:bg-red-500 text-white rounded-md transition-colors cursor-pointer"
                        title="Remover Foto"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="bg-[#111111] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">
                Observações Adicionais
              </h3>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Descreva pendências, riscos, nível exato de combustível ou outras avarias identificadas..."
                className="w-full text-xs bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-hidden focus:border-emerald-500/50 h-28 resize-none font-sans"
              />
            </div>
            
            {!allPhotosTaken && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                <span className="text-xs font-bold text-red-400">
                  ⚠️ Tire a foto de todos os itens do checklist para liberar o envio.
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={isGeneratingPdf || !allPhotosTaken}
              className={`w-full py-3.5 ${!allPhotosTaken ? 'opacity-50 grayscale' : isGeneratingPdf ? 'bg-emerald-600/50' : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700'} text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/10 cursor-pointer`}
            >
              {isGeneratingPdf ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Gerando PDF e Salvando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Concluir e Enviar Vistoria</span>
                </>
              )}
            </button>
          </form>
        )}
      </main>
      <footer className="bg-[#0d0d0d] border-t border-white/5 py-6 text-center text-[11px] text-gray-500 shrink-0">
        <p>© 2026 Gestão de Frota • Plataforma de Vistoria de Veículos Alugados.</p>
      </footer>
    </div>
  );
}
