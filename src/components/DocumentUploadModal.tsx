import React, { useState } from 'react';
import { Vehicle } from '../types';
import { X, UploadCloud, FileText, Save, HelpCircle, Trash2, Layers, CheckCircle2 } from 'lucide-react';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  onUploadDocument: (vehicleId: string, doc: { name: string; category: string; contentUrl: string; fileSize: string; fileType: string }) => void;
}

interface QueuedFile {
  id: string;
  name: string;
  category: string;
  contentUrl: string;
  fileSize: string;
  fileType: string;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  onUploadDocument,
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [docName, setDocName] = useState('');
  const [docCategory, setDocCategory] = useState('Contrato');
  const [customCategory, setCustomCategory] = useState('');
  const [fileDataUrl, setFileDataUrl] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  React.useEffect(() => {
    if (isOpen && !selectedVehicleId && vehicles.length > 0) {
      setSelectedVehicleId(vehicles[0].id);
    }
  }, [isOpen, vehicles, selectedVehicleId]);

  if (!isOpen) return null;

  const processSingleFile = (file: File): Promise<QueuedFile> => {
    return new Promise((resolve) => {
      const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
      const sizeStr = Number(sizeInMb) < 0.1 
        ? `${(file.size / 1024).toFixed(0)} KB` 
        : `${sizeInMb} MB`;
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');

      if (isImage) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let w = img.width;
            let h = img.height;
            const maxD = 900;
            if (w > maxD || h > maxD) {
              if (w > h) { h = Math.round((h * maxD) / w); w = maxD; }
              else { w = Math.round((w * maxD) / h); h = maxD; }
            }
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, w, h);
              resolve({
                id: `queued-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                name: file.name,
                category: docCategory === 'Outros' && customCategory.trim() ? customCategory.trim() : docCategory,
                contentUrl: canvas.toDataURL('image/jpeg', 0.7),
                fileSize: sizeStr,
                fileType: 'image'
              });
            } else {
              resolve({
                id: `queued-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                name: file.name,
                category: docCategory === 'Outros' && customCategory.trim() ? customCategory.trim() : docCategory,
                contentUrl: ev.target?.result as string,
                fileSize: sizeStr,
                fileType: 'image'
              });
            }
          };
          img.onerror = () => {
            resolve({
              id: `queued-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              name: file.name,
              category: docCategory === 'Outros' && customCategory.trim() ? customCategory.trim() : docCategory,
              contentUrl: ev.target?.result as string,
              fileSize: sizeStr,
              fileType: 'image'
            });
          };
          img.src = ev.target?.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = (ev) => {
          resolve({
            id: `queued-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            category: docCategory === 'Outros' && customCategory.trim() ? customCategory.trim() : docCategory,
            contentUrl: ev.target?.result as string,
            fileSize: sizeStr,
            fileType: isPdf ? 'pdf' : 'other'
          });
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      const processed = await Promise.all(files.map(processSingleFile));
      if (processed.length === 1 && queuedFiles.length === 0) {
        if (!docName.trim()) setDocName(processed[0].name);
        setFileDataUrl(processed[0].contentUrl);
        setFileSize(processed[0].fileSize);
      }
      setQueuedFiles((prev) => [...prev, ...processed]);
    } catch (err) {
      console.error('Erro ao ler arquivos:', err);
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      const processed = await Promise.all(files.map(processSingleFile));
      if (processed.length === 1 && queuedFiles.length === 0) {
        if (!docName.trim()) setDocName(processed[0].name);
        setFileDataUrl(processed[0].contentUrl);
        setFileSize(processed[0].fileSize);
      }
      setQueuedFiles((prev) => [...prev, ...processed]);
    } catch (err) {
      console.error('Erro ao processar arquivos arrastados:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId) {
      alert('Por favor, selecione o veículo.');
      return;
    }

    const finalCategory = docCategory === 'Outros' && customCategory.trim() ? customCategory.trim() : docCategory;

    if (queuedFiles.length > 0) {
      queuedFiles.forEach((qFile, index) => {
        const finalFileName = queuedFiles.length === 1 && docName.trim() ? docName.trim() : qFile.name;
        onUploadDocument(selectedVehicleId, {
          name: finalFileName,
          category: finalCategory,
          contentUrl: qFile.contentUrl,
          fileSize: qFile.fileSize || '15 KB',
          fileType: qFile.fileType,
        });
      });
    } else {
      if (!docName.trim()) {
        alert('Por favor, informe o nome do documento.');
        return;
      }

      let finalDataUrl = fileDataUrl;
      let finalSize = fileSize;

      if (!finalDataUrl) {
        const veh = vehicles.find(v => v.id === selectedVehicleId);
        const mockText = `Documento de ${docCategory}\nVeículo: ${veh?.brand} ${veh?.model} (${veh?.plate})\nNome do Arquivo: ${docName}\nData de Emissão: ${new Date().toLocaleDateString('pt-BR')}`;
        const blob = new Blob([mockText], { type: 'text/plain' });
        finalDataUrl = URL.createObjectURL(blob);
        finalSize = '12 KB';
      }

      onUploadDocument(selectedVehicleId, {
        name: docName.endsWith('.pdf') || docName.endsWith('.png') || docName.endsWith('.jpg') || docName.endsWith('.txt') 
          ? docName 
          : `${docName}.pdf`,
        category: finalCategory,
        contentUrl: finalDataUrl,
        fileSize: finalSize || '15 KB',
        fileType: docName.toLowerCase().includes('.png') || docName.toLowerCase().includes('.jpg') ? 'image' : 'pdf',
      });
    }

    // Reset states
    setDocName('');
    setDocCategory('Contrato');
    setCustomCategory('');
    setFileDataUrl('');
    setFileSize('');
    setQueuedFiles([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#141414]">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Carregar Documentos</h2>
              <p className="text-[10px] text-gray-400">Envie contratos, CRLV, seguros ou multas de veículos (Permite Vários)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs overflow-y-auto">
          
          {/* Vehicle Selector */}
          <div className="space-y-1">
            <label className="text-gray-400 font-semibold uppercase tracking-wider text-[9px]">Selecione o Veículo *</label>
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-blue-500/50 cursor-pointer"
              required
            >
              <option value="" disabled>-- Selecione o veículo correspondente --</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.brand} {v.model} - {v.plate} ({v.driver || 'Sem locatário'})</option>
              ))}
            </select>
          </div>

          {/* Drag & Drop zone */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-gray-400 font-semibold uppercase tracking-wider text-[9px]">
                Arquivos dos Documentos (Selecione 1 ou Vários)
              </label>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  alert('✅ Permissão de acesso aos Arquivos concedida! O seletor de arquivos foi liberado.');
                  document.getElementById('global-file-input')?.click();
                }}
                className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <span>🔑 Acessar Arquivos</span>
              </button>
            </div>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('global-file-input')?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                isDragging 
                  ? 'border-blue-500 bg-blue-500/10' 
                  : 'border-white/10 hover:border-white/20 bg-[#141414] hover:bg-white/[0.01]'
              }`}
            >
              <input
                type="file"
                id="global-file-input"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt,image/*,application/pdf"
              />
              <UploadCloud className="w-8 h-8 mx-auto text-blue-400 mb-2 transition-transform" />
              <p className="text-xs text-gray-200 font-bold">
                {isProcessing ? 'Processando arquivos...' : 'Arraste ou toque para selecionar 1 ou mais arquivos'}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">PDFs, fotos (JPG, PNG) ou documentos</p>
            </div>
          </div>

          {/* Queued files list */}
          {queuedFiles.length > 0 && (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              <div className="flex items-center justify-between text-[10px] text-gray-400 font-semibold uppercase">
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  {queuedFiles.length} documento(s) selecionado(s)
                </span>
                <button
                  type="button"
                  onClick={() => setQueuedFiles([])}
                  className="text-rose-400 hover:text-rose-300 transition-colors"
                >
                  Limpar todos
                </button>
              </div>
              {queuedFiles.map((qFile, idx) => (
                <div
                  key={qFile.id}
                  className="p-2 bg-white/[0.03] border border-white/10 rounded-xl flex items-center justify-between text-[11px]"
                >
                  <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                    <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="text-gray-300 truncate font-mono">{qFile.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[9px] text-gray-400 font-mono">{qFile.fileSize}</span>
                    <button
                      type="button"
                      onClick={() => setQueuedFiles((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-rose-400 hover:text-rose-300 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Doc Title & Category */}
          <div className="grid grid-cols-2 gap-3">
            {queuedFiles.length <= 1 && (
              <div className="space-y-1">
                <label className="text-gray-400 font-semibold uppercase tracking-wider text-[9px]">Nome do Documento *</label>
                <input
                  type="text"
                  placeholder="Ex: CRLV 2026, Contrato"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-blue-500/50"
                  required={queuedFiles.length === 0}
                />
              </div>
            )}

            <div className={`space-y-1 ${queuedFiles.length > 1 ? 'col-span-2' : ''}`}>
              <label className="text-gray-400 font-semibold uppercase tracking-wider text-[9px]">
                {queuedFiles.length > 1 ? 'Categoria para os documentos *' : 'Categoria *'}
              </label>
              <select
                value={docCategory}
                onChange={(e) => setDocCategory(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-blue-500/50 cursor-pointer"
              >
                <option value="Contrato">Contrato</option>
                <option value="CRLV">CRLV</option>
                <option value="Vistoria">Vistoria</option>
                <option value="Comprovante">Comprovante</option>
                <option value="CNH / Motorista">CNH / Motorista</option>
                <option value="Outros">Outros (Personalizado)</option>
              </select>
            </div>
          </div>

          {docCategory === 'Outros' && (
            <div className="space-y-1 animate-in fade-in duration-150">
              <label className="text-gray-400 font-semibold uppercase tracking-wider text-[9px]">Nome da Categoria Personalizada *</label>
              <input
                type="text"
                placeholder="Ex: Licenciamento, Nota Fiscal, Manutenção"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-blue-500/50"
                required
              />
            </div>
          )}

          {/* Note about fallback simulator */}
          {queuedFiles.length === 0 && !fileDataUrl && docName && (
            <div className="p-2 bg-blue-950/20 border border-blue-500/10 rounded-xl flex items-start gap-1.5 text-[10px] text-blue-400">
              <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Nenhum arquivo real foi detectado, o sistema criará um documento de demonstração preenchido.</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-blue-500/10 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{queuedFiles.length > 1 ? `Salvar ${queuedFiles.length} Documentos` : 'Salvar Documento'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
