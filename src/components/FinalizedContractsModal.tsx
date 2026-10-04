import React, { useState } from 'react';
import { FinalizedContract, Vehicle, Vistoria } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { PdfViewer } from './PdfViewer';
import { generateVistoriaPDF } from '../utils/pdfGenerator';
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
  CheckCircle2,
  Printer,
  ClipboardCheck,
  HardDriveDownload,
  BellRing,
  Layers
} from 'lucide-react';

interface FinalizedContractsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contracts: FinalizedContract[];
  vehicles?: Vehicle[];
  vistorias?: Vistoria[];
  onDeleteContract: (id: string) => void;
  onMarkContractAsViewed?: (id: string) => void;
  onMarkAllAsViewed?: () => void;
  onDownloadBackup?: () => void;
}

export function FinalizedContractsModal({
  isOpen,
  onClose,
  contracts,
  vehicles = [],
  vistorias = [],
  onDeleteContract,
  onMarkContractAsViewed,
  onMarkAllAsViewed,
  onDownloadBackup
}: FinalizedContractsModalProps) {
  const [search, setSearch] = useState('');
  const [activeArchiveTab, setActiveArchiveTab] = useState<'all' | 'vistorias' | 'documentos' | 'contratos'>('all');
  const [selectedPdfPreview, setSelectedPdfPreview] = useState<{ name: string; pdfDataUrl: string; subtitle?: string } | null>(null);
  const [contractToDelete, setContractToDelete] = useState<FinalizedContract | null>(null);

  React.useEffect(() => {
    if (isOpen && onMarkAllAsViewed) {
      onMarkAllAsViewed();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const term = search.toLowerCase();

  const approvedVistorias = vistorias
    .filter(v => v.status === 'approved')
    .filter(v => {
      if (!term) return true;
      const veh = vehicles.find(car => car.id === v.vehicleId || (v.vehiclePlate && car.plate.replace(/[^A-Z0-9]/gi, '').toUpperCase() === v.vehiclePlate.replace(/[^A-Z0-9]/gi, '').toUpperCase()));
      return (
        (veh?.brand.toLowerCase().includes(term) || false) ||
        (veh?.model.toLowerCase().includes(term) || false) ||
        (veh?.plate.toLowerCase().includes(term) || false) ||
        (v.vehiclePlate?.toLowerCase().includes(term) || false) ||
        (v.type?.toLowerCase().includes(term) || false) ||
        (v.notes?.toLowerCase().includes(term) || false)
      );
    });

  const allVehicleDocs = vehicles.flatMap(veh =>
    (veh.documents || []).map(doc => ({
      ...doc,
      vehicleBrand: veh.brand,
      vehicleModel: veh.model,
      vehiclePlate: veh.plate,
      driver: veh.driver
    }))
  ).filter(doc => {
    if (!term) return true;
    return (
      doc.name.toLowerCase().includes(term) ||
      doc.category.toLowerCase().includes(term) ||
      doc.vehicleBrand.toLowerCase().includes(term) ||
      doc.vehicleModel.toLowerCase().includes(term) ||
      doc.vehiclePlate.toLowerCase().includes(term) ||
      (doc.driver && doc.driver.toLowerCase().includes(term))
    );
  });

  const filteredContracts = contracts.filter((c) => {
    if (!term) return true;
    return (
      c.brand.toLowerCase().includes(term) ||
      c.model.toLowerCase().includes(term) ||
      c.plate.toLowerCase().includes(term) ||
      c.driver.toLowerCase().includes(term)
    );
  });

  const handleDownloadPdf = (name: string, dataUrl: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = name.endsWith('.pdf') || name.endsWith('.png') || name.endsWith('.jpg') ? name : `${name}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenVistoriaPreview = async (v: Vistoria) => {
    const veh: Vehicle = vehicles.find(car => car.id === v.vehicleId || (v.vehiclePlate && car.plate.replace(/[^A-Z0-9]/gi, '').toUpperCase() === v.vehiclePlate.replace(/[^A-Z0-9]/gi, '').toUpperCase())) || {
      id: v.vehicleId,
      brand: 'Veículo',
      model: '',
      plate: v.vehiclePlate || '---',
      year: new Date().getFullYear(),
      color: '',
      rentalCompany: '',
      startDate: '',
      endDate: '',
      valorRecebido: 0,
      financiamento: 0,
      seguro: 0,
      ipva: 0,
      manutencaoPreventiva: 0,
      currentKm: v.km || 0,
      fuelLevel: 8,
      driver: '',
      driverPhone: '',
      contractNumber: '',
      weeklyPayments: []
    };

    try {
      const { fileName, pdfDataUrl } = await generateVistoriaPDF(veh, v);
      setSelectedPdfPreview({
        name: fileName,
        pdfDataUrl: v.pdfDataUrl || pdfDataUrl,
        subtitle: `${veh.brand} ${veh.model} (${veh.plate}) • Laudo Aprovado em ${v.approvedAt || new Date(v.date + 'T12:00:00').toLocaleDateString('pt-BR')}`
      });
    } catch (err) {
      console.error('Erro ao gerar preview de vistoria:', err);
    }
  };

  const handleDownloadVistoriaDirect = async (v: Vistoria) => {
    const veh: Vehicle = vehicles.find(car => car.id === v.vehicleId || (v.vehiclePlate && car.plate.replace(/[^A-Z0-9]/gi, '').toUpperCase() === v.vehiclePlate.replace(/[^A-Z0-9]/gi, '').toUpperCase())) || {
      id: v.vehicleId,
      brand: 'Veículo',
      model: '',
      plate: v.vehiclePlate || '---',
      year: new Date().getFullYear(),
      color: '',
      rentalCompany: '',
      startDate: '',
      endDate: '',
      valorRecebido: 0,
      financiamento: 0,
      seguro: 0,
      ipva: 0,
      manutencaoPreventiva: 0,
      currentKm: v.km || 0,
      fuelLevel: 8,
      driver: '',
      driverPhone: '',
      contractNumber: '',
      weeklyPayments: []
    };

    try {
      const { doc, fileName } = await generateVistoriaPDF(veh, v);
      doc.save(fileName);
    } catch (err) {
      console.error('Erro ao salvar vistoria em PDF:', err);
    }
  };

  const totalArchivedCount = approvedVistorias.length + allVehicleDocs.length + contracts.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#111111] border border-white/10 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)] shrink-0">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Arquivo Geral: Vistorias Aprovadas, Documentos & Contratos
                </h2>
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  {totalArchivedCount} itens salvos
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Central unificada para salvar, imprimir e fazer backup de todos os contratos, vistorias aprovadas e documentos da frota.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onDownloadBackup && (
              <button
                type="button"
                onClick={onDownloadBackup}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                title="Fazer backup completo em arquivo .json"
              >
                <HardDriveDownload className="w-4 h-4" />
                <span>Backup Geral</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="Fechar pasta de arquivo"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector & Search Row */}
        <div className="p-3 sm:p-4 border-b border-white/5 bg-white/[0.01] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
            {[
              { id: 'all', label: `Todos (${totalArchivedCount})` },
              { id: 'vistorias', label: `Vistorias Aprovadas (${approvedVistorias.length})` },
              { id: 'documentos', label: `Documentos & Contratos Ativos (${allVehicleDocs.length})` },
              { id: 'contratos', label: `Contratos Encerrados (${filteredContracts.length})` },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveArchiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeArchiveTab === tab.id
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filtrar por placa, carro, tipo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white placeholder-gray-500 focus:outline-hidden focus:border-amber-500/50"
            />
          </div>
        </div>

        {/* Main Content List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Section 1: Approved Vistorias */}
          {(activeArchiveTab === 'all' || activeArchiveTab === 'vistorias') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ClipboardCheck className="w-4 h-4" />
                  <span>Laudos de Vistoria Aprovados ({approvedVistorias.length})</span>
                </h3>
                <span className="text-[11px] text-gray-500">Prontos para imprimir, salvar e anexar</span>
              </div>

              {approvedVistorias.length === 0 ? (
                <div className="py-6 text-center border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
                  <ClipboardCheck className="w-7 h-7 mx-auto text-gray-600 mb-2" />
                  <p className="text-xs text-gray-400 font-semibold">Nenhuma vistoria aprovada nesta categoria.</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Ao receber ou abrir uma vistoria no card do carro, clique no botão verde "Aprovar" para arquivá-la aqui.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {approvedVistorias.map(v => {
                    const veh = vehicles.find(car => car.id === v.vehicleId || (v.vehiclePlate && car.plate.replace(/[^A-Z0-9]/gi, '').toUpperCase() === v.vehiclePlate.replace(/[^A-Z0-9]/gi, '').toUpperCase()));
                    const brandModel = veh ? `${veh.brand} ${veh.model}` : 'Veículo';
                    const plate = veh?.plate || v.vehiclePlate || '---';
                    return (
                      <div
                        key={v.id}
                        className="p-3.5 bg-white/[0.02] hover:bg-emerald-950/15 border border-emerald-500/25 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              APROVADA
                            </span>
                            <span className="text-xs font-bold text-white font-mono">{brandModel}</span>
                            <span className="text-xs font-mono font-bold bg-white/10 px-2 py-0.5 rounded text-gray-200">
                              {plate}
                            </span>
                            {v.type && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/25 font-semibold">
                                {v.type}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                            <span>📅 Data: <strong className="text-gray-200">{new Date(v.date + 'T12:00:00').toLocaleDateString('pt-BR')}</strong></span>
                            {v.approvedAt && <span>• Aprovada em: <span className="text-emerald-300 font-mono text-[11px]">{v.approvedAt}</span></span>}
                            <span>• 📸 {v.photos?.length || 0} foto(s)</span>
                            {v.km && <span>• ⏱️ {v.km.toLocaleString('pt-BR')} KM</span>}
                          </div>

                          {v.notes && (
                            <p className="text-[11px] text-gray-400 italic line-clamp-1 mt-0.5">Obs: {v.notes}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleOpenVistoriaPreview(v)}
                            className="flex items-center gap-1.5 text-xs font-bold text-blue-300 hover:text-white bg-blue-600/15 hover:bg-blue-600 px-3 py-1.5 rounded-xl border border-blue-500/30 transition-all cursor-pointer"
                            title="Visualizar e Imprimir Laudo de Vistoria"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Imprimir / Ver</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadVistoriaDirect(v)}
                            className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-white bg-emerald-500/15 hover:bg-emerald-600 px-3 py-1.5 rounded-xl border border-emerald-500/30 transition-all cursor-pointer"
                            title="Salvar PDF do laudo no celular/computador"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Salvar PDF</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Section 2: Active Vehicle Documents & Contracts */}
          {(activeArchiveTab === 'all' || activeArchiveTab === 'documentos') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  <span>Documentos, Contratos de Locação & CRLVs da Frota ({allVehicleDocs.length})</span>
                </h3>
                <span className="text-[11px] text-gray-500">Arquivos anexados diretamente aos veículos</span>
              </div>

              {allVehicleDocs.length === 0 ? (
                <div className="py-6 text-center border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
                  <FileText className="w-7 h-7 mx-auto text-gray-600 mb-2" />
                  <p className="text-xs text-gray-400 font-semibold">Nenhum documento salvo nesta categoria.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allVehicleDocs.map((doc) => (
                    <div
                      key={`${doc.vehiclePlate}-${doc.id}`}
                      className="p-3 bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/25 uppercase">
                            {doc.category}
                          </span>
                          <span className="text-xs font-bold text-white truncate">{doc.name}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                          <span className="text-amber-300 font-mono font-semibold">{doc.vehicleBrand} {doc.vehicleModel} ({doc.vehiclePlate})</span>
                          {doc.driver && <span>• Locatário: {doc.driver}</span>}
                          <span>• Data: {doc.uploadDate}</span>
                          <span>• {doc.fileSize || '---'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {doc.contentUrl && (
                          <>
                            <button
                              type="button"
                              onClick={() => setSelectedPdfPreview({
                                name: doc.name,
                                pdfDataUrl: doc.contentUrl!,
                                subtitle: `${doc.vehicleBrand} ${doc.vehicleModel} (${doc.vehiclePlate}) • ${doc.category}`
                              })}
                              className="flex items-center gap-1.5 text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 transition-all cursor-pointer"
                              title="Visualizar e Imprimir"
                            >
                              <Printer className="w-3.5 h-3.5 text-blue-400" />
                              <span>Ver / Imprimir</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadPdf(doc.name, doc.contentUrl!)}
                              className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/20 transition-all cursor-pointer"
                              title="Baixar arquivo"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Salvar</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section 3: Finalized Contracts */}
          {(activeArchiveTab === 'all' || activeArchiveTab === 'contratos') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FolderArchive className="w-4 h-4" />
                  <span>Contratos Encerrados ({filteredContracts.length})</span>
                </h3>
                <span className="text-[11px] text-gray-500">Histórico de locações concluídas</span>
              </div>

              {filteredContracts.length === 0 ? (
                <div className="py-6 text-center border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
                  <FolderArchive className="w-7 h-7 mx-auto text-gray-600 mb-2" />
                  <p className="text-xs text-gray-400 font-semibold">Nenhum contrato encerrado nesta pasta.</p>
                </div>
              ) : (
                filteredContracts.map((contract) => (
                  <div 
                    key={contract.id}
                    className="p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 hover:border-amber-500/30 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
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
                          setSelectedPdfPreview({
                            name: contract.pdfFileName,
                            pdfDataUrl: contract.pdfDataUrl,
                            subtitle: `${contract.brand} ${contract.model} (${contract.plate}) • Encerrado em ${contract.terminationDate}`
                          });
                          if (onMarkContractAsViewed) {
                            onMarkContractAsViewed(contract.id);
                          }
                        }}
                        className="flex items-center gap-1.5 text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 transition-all cursor-pointer"
                        title="Visualizar e Imprimir PDF"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-400" />
                        <span>Ver / Imprimir</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(contract.pdfFileName, contract.pdfDataUrl)}
                        className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-500/20 transition-all cursor-pointer"
                        title="Baixar PDF no dispositivo"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Salvar PDF</span>
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
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-[#141414] flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs text-gray-400 font-mono">
            {totalArchivedCount} item(ns) arquivado(s)
          </span>
          <div className="flex items-center gap-2">
            {onDownloadBackup && (
              <button
                type="button"
                onClick={onDownloadBackup}
                className="px-3.5 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <HardDriveDownload className="w-3.5 h-3.5" />
                <span>Salvar Backup Completo (.JSON)</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              title="Fechar pasta"
            >
              <X className="w-4 h-4" />
              <span>Fechar Pasta</span>
            </button>
          </div>
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

        {/* PDF Viewer Sub-modal / Preview with Print & Save */}
        {selectedPdfPreview && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md">
            <div className="bg-[#111111] border border-white/10 rounded-2xl w-full max-w-4xl h-[88vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-3.5 border-b border-white/10 flex justify-between items-center bg-white/[0.02] flex-wrap gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-5 h-5 text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-md">
                      {selectedPdfPreview.name}
                    </h3>
                    {selectedPdfPreview.subtitle && (
                      <p className="text-[10px] text-gray-400">{selectedPdfPreview.subtitle}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadPdf(selectedPdfPreview.name, selectedPdfPreview.pdfDataUrl)}
                    className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/20 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Salvar</span>
                  </button>
                  <button
                    onClick={() => setSelectedPdfPreview(null)}
                    className="p-1.5 text-gray-400 hover:text-white bg-white/5 rounded-lg cursor-pointer"
                    title="Fechar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                {selectedPdfPreview.pdfDataUrl.startsWith('data:image/') ? (
                  <div className="w-full h-full flex items-center justify-center bg-black/80 p-4">
                    <img src={selectedPdfPreview.pdfDataUrl} alt={selectedPdfPreview.name} className="max-h-full object-contain rounded-lg shadow-xl" />
                  </div>
                ) : (
                  <PdfViewer 
                    pdfDataUrl={selectedPdfPreview.pdfDataUrl} 
                    fileName={selectedPdfPreview.name}
                  />
                )}
              </div>

              {/* Sub-modal Footer with Fechar */}
              <div className="p-3 bg-[#141414] border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] text-gray-500 font-mono">
                  {selectedPdfPreview.name}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedPdfPreview(null)}
                  className="px-4 py-1.5 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
                >
                  <X className="w-4 h-4" />
                  <span>Fechar Visualização</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
