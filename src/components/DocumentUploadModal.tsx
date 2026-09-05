import React, { useState } from 'react';
import { Vehicle } from '../types';
import { X, UploadCloud, FileText, Save, HelpCircle } from 'lucide-react';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  onUploadDocument: (vehicleId: string, doc: { name: string; category: string; contentUrl: string; fileSize: string; fileType: string }) => void;
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

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
      const sizeStr = Number(sizeInMb) < 0.1 
        ? `${(file.size / 1024).toFixed(0)} KB` 
        : `${sizeInMb} MB`;
      
      setDocName(file.name);
      setFileDataUrl(dataUrl);
      setFileSize(sizeStr);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId) {
      alert('Por favor, selecione o veículo.');
      return;
    }
    if (!docName.trim()) {
      alert('Por favor, informe o nome do documento.');
      return;
    }

    let finalDataUrl = fileDataUrl;
    let finalSize = fileSize;

    // Fallback simulation if no real file was dragged or browsed
    if (!finalDataUrl) {
      const veh = vehicles.find(v => v.id === selectedVehicleId);
      const mockText = `Simulado: Documento de ${docCategory}\nVeículo: ${veh?.brand} ${veh?.model} (${veh?.plate})\nNome do Arquivo: ${docName}\nData de Emissão: 19/07/2026\nGerado automaticamente pelo Painel de Gestão de Frota.`;
      const blob = new Blob([mockText], { type: 'text/plain' });
      finalDataUrl = URL.createObjectURL(blob);
      finalSize = '12 KB';
    }

    const finalCategory = docCategory === 'Outros' && customCategory.trim() ? customCategory.trim() : docCategory;

    onUploadDocument(selectedVehicleId, {
      name: docName.endsWith('.pdf') || docName.endsWith('.png') || docName.endsWith('.jpg') || docName.endsWith('.txt') 
        ? docName 
        : `${docName}.pdf`,
      category: finalCategory,
      contentUrl: finalDataUrl,
      fileSize: finalSize || '15 KB',
      fileType: docName.toLowerCase().includes('.png') || docName.toLowerCase().includes('.jpg') ? 'image' : 'pdf',
    });

    // Reset states
    setSelectedVehicleId('');
    setDocName('');
    setDocCategory('Contrato');
    setCustomCategory('');
    setFileDataUrl('');
    setFileSize('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#141414]">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Carregar Documento</h2>
              <p className="text-[10px] text-gray-400">Envie contratos, CRLV, seguros ou multas de veículos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
          
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
          <div className="space-y-1">
            <label className="text-gray-400 font-semibold uppercase tracking-wider text-[9px]">Arquivo do Documento</label>
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
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
              />
              <UploadCloud className="w-8 h-8 mx-auto text-gray-400 mb-2 transition-transform" />
              <p className="text-xs text-gray-200 font-bold">Arraste e solte o arquivo aqui</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Ou selecione para navegar nos seus arquivos</p>
            </div>
          </div>

          {/* Uploaded File Info */}
          {docName && (
            <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-gray-300 truncate font-mono">{docName}</span>
              </div>
              <span className="text-[9px] text-gray-500 font-mono font-semibold shrink-0 ml-2">{fileSize || '---'}</span>
            </div>
          )}

          {/* Doc Title & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-gray-400 font-semibold uppercase tracking-wider text-[9px]">Nome do Documento *</label>
              <input
                type="text"
                placeholder="Ex: CRLV 2026, Contrato"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-blue-500/50"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-gray-400 font-semibold uppercase tracking-wider text-[9px]">Categoria *</label>
              <select
                value={docCategory}
                onChange={(e) => setDocCategory(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-blue-500/50 cursor-pointer"
              >
                <option value="Contrato">Contrato</option>
                <option value="CRLV">CRLV</option>
                <option value="Vistoria">Vistoria</option>
                <option value="Comprovante">Comprovante</option>
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
          {!fileDataUrl && docName && (
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
              className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-blue-500/10"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Documento</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
