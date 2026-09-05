import React, { useState } from 'react';
import { FinalizedContract } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { 
  FolderArchive, 
  X, 
  Download, 
  FileText, 
  Trash2, 
  Search, 
  Car, 
  User, 
  Calendar, 
  Eye,
  CheckCircle2
} from 'lucide-react';

interface FinalizedContractsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contracts: FinalizedContract[];
  onDeleteContract: (id: string) => void;
  onMarkContractAsViewed?: (id: string) => void;
  onMarkAllAsViewed?: () => void;
}

export function FinalizedContractsModal({
  isOpen,
  onClose,
  contracts,
  onDeleteContract,
  onMarkContractAsViewed,
  onMarkAllAsViewed
}: FinalizedContractsModalProps) {
  const [search, setSearch] = useState('');
  const [selectedPdfPreview, setSelectedPdfPreview] = useState<FinalizedContract | null>(null);
  const [contractToDelete, setContractToDelete] = useState<FinalizedContract | null>(null);

  React.useEffect(() => {
    if (isOpen && onMarkAllAsViewed) {
      onMarkAllAsViewed();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredContracts = contracts.filter((c) => {
    const term = search.toLowerCase();
    return (
      c.brand.toLowerCase().includes(term) ||
      c.model.toLowerCase().includes(term) ||
      c.plate.toLowerCase().includes(term) ||
      c.driver.toLowerCase().includes(term)
    );
  });

  const handleDownloadPdf = (contract: FinalizedContract) => {
    const link = document.createElement('a');
    link.href = contract.pdfDataUrl;
    link.download = contract.pdfFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#111111] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Pasta: Contratos Finalizados</span>
                <span className="text-xs font-mono font-normal text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  {contracts.length} {contracts.length === 1 ? 'arquivo' : 'arquivos'}
                </span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Relatórios em PDF salvos automaticamente ao encerrar ou excluir veículos da frota.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            title="Fechar pasta"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-white/5 bg-white/[0.01] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por carro, placa ou motorista..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white placeholder-gray-500 focus:outline-hidden focus:border-amber-500/50"
            />
          </div>

          <p className="text-xs text-gray-400 font-mono text-right w-full sm:w-auto">
            Todos os dados e relatórios permanecem arquivados em PDF.
          </p>
        </div>

        {/* Main Content List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {filteredContracts.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-500">
                <FolderArchive className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-300">Nenhum contrato finalizado nesta pasta</p>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Quando você confirmar a exclusão de um veículo, todos os seus dados e relatórios serão gerados em PDF e salvos nesta pasta 'Contratos Finalizados'.
              </p>
            </div>
          ) : (
            filteredContracts.map((contract) => (
              <div 
                key={contract.id}
                className="p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 hover:border-amber-500/30 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-amber-400 shrink-0" />
                    <h3 className="text-sm font-bold text-white truncate">
                      {contract.brand} {contract.model}
                    </h3>
                    <span className="text-xs font-mono font-bold bg-white/10 px-2 py-0.5 rounded text-gray-200">
                      {contract.plate}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-gray-500" />
                      Motorista: <strong className="text-gray-200">{contract.driver || 'Não informado'}</strong>
                    </span>

                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-500" />
                      Encerrado em: <strong className="text-gray-200 font-mono">{contract.terminationDate}</strong>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-gray-400 font-mono">
                    <span className="px-2 py-0.5 bg-white/5 rounded border border-white/5">
                      📄 PDF: <span className="text-amber-400 font-bold">{contract.pdfFileName}</span>
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPdfPreview(contract);
                      if (onMarkContractAsViewed) {
                        onMarkContractAsViewed(contract.id);
                      }
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 transition-all cursor-pointer"
                    title="Visualizar PDF"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>Visualizar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(contract)}
                    className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-500/20 transition-all cursor-pointer"
                    title="Baixar PDF no dispositivo"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContractToDelete(contract)}
                    className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    title="Excluir arquivo do contrato"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmDeleteModal
          isOpen={!!contractToDelete}
          title="Excluir Contrato Finalizado?"
          description={`Deseja excluir permanentemente o contrato arquivado de ${contractToDelete?.brand} ${contractToDelete?.model} (${contractToDelete?.plate})?`}
          warningNote="Esta ação removerá este relatório do arquivo."
          confirmButtonText="Sim, Excluir Registro"
          onConfirm={() => {
            if (contractToDelete) {
              onDeleteContract(contractToDelete.id);
              setContractToDelete(null);
            }
          }}
          onCancel={() => setContractToDelete(null)}
        />

        {/* PDF Viewer Sub-modal / Preview */}
        {selectedPdfPreview && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="bg-[#111111] border border-white/10 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">
                    {selectedPdfPreview.pdfFileName}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadPdf(selectedPdfPreview)}
                    className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar</span>
                  </button>
                  <button
                    onClick={() => setSelectedPdfPreview(null)}
                    className="p-1.5 text-gray-400 hover:text-white bg-white/5 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-white">
                <iframe 
                  src={selectedPdfPreview.pdfDataUrl} 
                  className="w-full h-full border-none"
                  title="PDF Preview"
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
