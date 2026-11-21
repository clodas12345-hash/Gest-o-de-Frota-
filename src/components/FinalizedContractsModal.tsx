import React, { useState } from 'react';
import { FinalizedContract, LateContractDebit, Vehicle, Vistoria } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { PdfViewer } from './PdfViewer';
import { generateVistoriaPDF } from '../utils/pdfGenerator';
import { printImage } from '../utils/printHelper';
import CurrencyInput from './CurrencyInput';
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
  CheckCircle2,
  Printer,
  ClipboardCheck,
  HardDriveDownload,
  Clock,
  Plus,
  Paperclip,
  MessageCircle,
  AlertOctagon,
  ShieldCheck
} from 'lucide-react';

interface FinalizedContractsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contracts: FinalizedContract[];
  vehicles?: Vehicle[];
  vistorias?: Vistoria[];
  onDeleteContract: (id: string) => void;
  onDeleteVehicleDocument?: (vehicleId: string, docId: string) => void;
  onMarkContractAsViewed?: (id: string) => void;
  onMarkAllAsViewed?: () => void;
  onDownloadBackup?: () => void;
  onAddLateDebit?: (contractId: string, debit: LateContractDebit) => void;
  onRemoveLateDebit?: (contractId: string, debitId: string) => void;
  onCompleteQuitation?: (contractId: string) => Promise<void>;
}

export function FinalizedContractsModal({
  isOpen,
  onClose,
  contracts,
  vehicles = [],
  vistorias = [],
  onDeleteContract,
  onDeleteVehicleDocument,
  onMarkContractAsViewed,
  onMarkAllAsViewed,
  onDownloadBackup,
  onAddLateDebit,
  onRemoveLateDebit,
  onCompleteQuitation
}: FinalizedContractsModalProps) {
  const [search, setSearch] = useState('');
  const [activeArchiveTab, setActiveArchiveTab] = useState<'all' | 'prefinalized' | 'vistorias' | 'documentos' | 'contratos'>('all');
  const [selectedPdfPreview, setSelectedPdfPreview] = useState<{ name: string; pdfDataUrl: string; subtitle?: string } | null>(null);
  const [contractToDelete, setContractToDelete] = useState<FinalizedContract | null>(null);
  const [docToDelete, setDocToDelete] = useState<{ id: string; name: string; category: string; vehicleId: string; vehicleBrand: string; vehicleModel: string; vehiclePlate: string } | null>(null);
  const [contractDeleteBlockModal, setContractDeleteBlockModal] = useState<{
    type: 'generated' | 'signed';
    docName: string;
  } | null>(null);

  // State for 30-day late debits & completion
  const [expandedDebitContractId, setExpandedDebitContractId] = useState<string | null>(null);
  const [completingContractId, setCompletingContractId] = useState<string | null>(null);
  const [debitCategory, setDebitCategory] = useState<LateContractDebit['category']>('Multa');
  const [debitDate, setDebitDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [debitDesc, setDebitDesc] = useState('');
  const [debitBaseAmount, setDebitBaseAmount] = useState<number>(0);
  const [applyAdminFee, setApplyAdminFee] = useState<boolean>(true);
  const [adminFeePct, setAdminFeePct] = useState<number>(20);
  const [debitNotes, setDebitNotes] = useState('');
  const [debitAttachmentUrl, setDebitAttachmentUrl] = useState<string>('');
  const [debitAttachmentName, setDebitAttachmentName] = useState<string>('');
  const [debitAttachmentType, setDebitAttachmentType] = useState<'image' | 'pdf' | undefined>(undefined);

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
      vehicleId: veh.id,
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

  const preFinalizedContracts = filteredContracts.filter((c) => c.status === 'pre_finalized');
  const completedContracts = filteredContracts.filter((c) => c.status !== 'pre_finalized');

  const formatBRL = (val: number) =>
    `R$ ${Math.abs(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getContract30DayStatus = (contract: FinalizedContract) => {
    const returnIso = contract.returnDate || contract.settlement?.returnDate || new Date().toISOString().split('T')[0];
    const dueIso =
      contract.dueDate30Days ||
      (() => {
        const d = new Date(`${returnIso}T12:00:00`);
        d.setDate(d.getDate() + 30);
        return d.toISOString().split('T')[0];
      })();
    const todayStr = new Date().toISOString().split('T')[0];
    const dueMs = new Date(`${dueIso}T12:00:00`).getTime();
    const todayMs = new Date(`${todayStr}T12:00:00`).getTime();
    const daysRemaining = Math.ceil((dueMs - todayMs) / (1000 * 60 * 60 * 24));
    const returnBR = new Date(`${returnIso}T12:00:00`).toLocaleDateString('pt-BR');
    const dueBR = new Date(`${dueIso}T12:00:00`).toLocaleDateString('pt-BR');
    return { returnIso, dueIso, returnBR, dueBR, daysRemaining };
  };

  const resetDebitForm = () => {
    setDebitCategory('Multa');
    setDebitDate(new Date().toISOString().split('T')[0]);
    setDebitDesc('');
    setDebitBaseAmount(0);
    setApplyAdminFee(true);
    setAdminFeePct(20);
    setDebitNotes('');
    setDebitAttachmentUrl('');
    setDebitAttachmentName('');
    setDebitAttachmentType(undefined);
  };

  const handleDebitAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) return;
      setDebitAttachmentUrl(result);
      setDebitAttachmentName(file.name);
      setDebitAttachmentType(file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitLateDebit = (contractId: string) => {
    if (!onAddLateDebit || !debitDesc.trim() || debitBaseAmount <= 0) return;
    const calcAdminFee = debitCategory === 'Multa' && applyAdminFee ? Number(((debitBaseAmount * adminFeePct) / 100).toFixed(2)) : 0;
    const totalAmount = Number((debitBaseAmount + calcAdminFee).toFixed(2));
    onAddLateDebit(contractId, {
      id: `late-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: debitDate || new Date().toISOString().split('T')[0],
      category: debitCategory,
      description: debitDesc.trim(),
      amount: totalAmount,
      adminFeePct: debitCategory === 'Multa' && applyAdminFee ? adminFeePct : undefined,
      adminFeeAmount: calcAdminFee > 0 ? calcAdminFee : undefined,
      notes: debitNotes.trim() || undefined,
      attachmentUrl: debitAttachmentUrl || undefined,
      attachmentName: debitAttachmentName || undefined,
      attachmentType: debitAttachmentType
    });
    resetDebitForm();
  };

  const handleSendPreFinalizedWhatsApp = (contract: FinalizedContract) => {
    let cleanPhone = (contract.driverPhone || '').replace(/\D/g, '');
    if (cleanPhone && !cleanPhone.startsWith('55')) cleanPhone = '55' + cleanPhone;
    const { returnBR, dueBR, daysRemaining } = getContract30DayStatus(contract);
    const s = contract.settlement;
    const lateList = contract.lateDebits || [];
    const lateLines = lateList.length > 0
      ? `\n📌 *Lançamentos nos 30 dias (${lateList.length}):*\n${lateList.map(d => `• [${d.category}] ${d.description}: -${formatBRL(d.amount)}`).join('\n')}\n`
      : '\n📌 *Lançamentos nos 30 dias:* Nenhum até o momento.\n';

    const saldoVal = s ? s.saldoFinal : 0;
    const statusTxt = saldoVal >= 0
      ? `✅ *SALDO PREVISTO A DEVOLVER:* ${formatBRL(saldoVal)}`
      : `⚠️ *SALDO DEVEDOR ATUAL:* ${formatBRL(saldoVal)}`;

    const msg = `📋 *ACOMPANHAMENTO DE ENCERRAMENTO E CAUÇÃO (30 DIAS)*\n\n🚗 *Veículo:* ${contract.brand} ${contract.model} (${contract.plate})\n👤 *Locatário:* ${contract.driver}\n📅 *Devolução:* ${returnBR} | *Prazo 30d:* ${dueBR} (${daysRemaining <= 0 ? 'Concluído' : `faltam ${daysRemaining} dia(s)`})\n${s ? `\n💰 *Caução Depositada:* +${formatBRL(s.caucaoOriginal)}\n➖ *Aluguéis em Aberto:* -${formatBRL(s.descontoAluguelPendente)}\n➖ *Avarias:* -${formatBRL(s.descontoAvarias)}\n➖ *Lavagem/Combustível:* -${formatBRL((s.descontoLavagem || 0) + s.descontoCombustivel)}\n➖ *Multas:* -${formatBRL(s.descontoMultas)}\n➖ *Pedágios:* -${formatBRL(s.descontoPedagios || 0)}\n` : ''}${lateLines}\n${statusTxt}`;

    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#111111] border-0 sm:border sm:border-white/10 rounded-none sm:rounded-2xl w-full max-w-5xl h-[100dvh] sm:h-auto sm:max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header (slim single row on mobile) */}
        <div className="px-3.5 py-2.5 sm:px-5 sm:py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent gap-2 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)] shrink-0">
              <FolderArchive className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                  Arquivo Geral: Vistorias, Documentos & Contratos
                </h2>
                <span className="text-[10px] sm:text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 shrink-0">
                  {totalArchivedCount}
                </span>
              </div>
              <p className="hidden sm:block text-xs text-gray-400 mt-0.5">
                Central unificada para salvar, imprimir e fazer backup de todos os contratos, vistorias aprovadas e documentos da frota.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {onDownloadBackup && (
              <button
                type="button"
                onClick={onDownloadBackup}
                className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                title="Fazer backup completo em arquivo .json"
              >
                <HardDriveDownload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Backup Geral</span>
                <span className="sm:hidden">Backup</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="Fechar pasta de arquivo"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Main Content List (includes tabs/search on mobile so scrolling maximizes viewing space) */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Tab Selector & Search Row */}
          <div className="px-3 py-2.5 sm:px-5 sm:py-3 border-b border-white/5 bg-white/[0.01] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 sm:gap-3">
            {/* Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 md:pb-0 scrollbar-hide">
              {[
                { id: 'all', label: `Todos (${totalArchivedCount})` },
                { id: 'prefinalized', label: `Aguardando 30 Dias (${preFinalizedContracts.length})` },
                { id: 'vistorias', label: `Vistorias Aprovadas (${approvedVistorias.length})` },
                { id: 'documentos', label: `Documentos & Contratos Ativos (${allVehicleDocs.length})` },
                { id: 'contratos', label: `Quitados / Encerrados (${completedContracts.length})` },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveArchiveTab(tab.id as any)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeArchiveTab === tab.id
                      ? tab.id === 'prefinalized'
                        ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                        : 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : tab.id === 'prefinalized' && preFinalizedContracts.length > 0
                      ? 'bg-blue-500/15 text-blue-300 hover:bg-blue-500/25 border border-blue-500/30'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full md:w-64 shrink-0">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar por placa, carro, tipo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs bg-white/[0.04] border border-white/10 rounded-xl pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 text-white placeholder-gray-500 focus:outline-hidden focus:border-amber-500/50"
              />
            </div>
          </div>

          <div className="p-3 sm:p-5 space-y-5">

          {/* Section 0: Pré-Finalizados (Aguardando Prazo de 30 Dias para Quitação) */}
          {(activeArchiveTab === 'all' || activeArchiveTab === 'prefinalized') && (preFinalizedContracts.length > 0 || activeArchiveTab === 'prefinalized') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-blue-500/20 pb-2">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>Pré-Finalizados — Aguardando 30 Dias ({preFinalizedContracts.length})</span>
                </h3>
                <span className="hidden sm:inline text-[11px] text-gray-400">
                  Lance multas ou avarias que chegarem e gere o Termo de Quitação após 30 dias
                </span>
              </div>

              {preFinalizedContracts.length === 0 ? (
                <div className="py-6 text-center border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
                  <Clock className="w-7 h-7 mx-auto text-gray-600 mb-2" />
                  <p className="text-xs text-gray-400 font-semibold">Nenhum contrato pré-finalizado aguardando prazo de 30 dias.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {preFinalizedContracts.map((contract) => {
                    const { returnBR, dueBR, daysRemaining } = getContract30DayStatus(contract);
                    const isReady = daysRemaining <= 0;
                    const s = contract.settlement;
                    const lateDebits = contract.lateDebits || [];
                    const lateTotal = lateDebits.reduce((sum, d) => sum + (d.amount || 0), 0);
                    const isExpanded = expandedDebitContractId === contract.id;
                    const isCompleting = completingContractId === contract.id;

                    return (
                      <div
                        key={contract.id}
                        className={`p-4 rounded-2xl border transition-all space-y-3 ${
                          isReady
                            ? 'bg-emerald-950/15 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                            : 'bg-blue-950/10 border-blue-500/30'
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                                  isReady
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : 'bg-blue-500/20 text-blue-300 border-blue-500/35'
                                }`}
                              >
                                <Clock className="w-3 h-3" />
                                {isReady
                                  ? '30 DIAS CONCLUÍDOS — PRONTO P/ QUITAÇÃO!'
                                  : `AGUARDANDO 30 DIAS (FALTAM ${daysRemaining}D)`}
                              </span>
                              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                                <Car className="w-4 h-4 text-blue-400 shrink-0" />
                                <span>{contract.brand} {contract.model}</span>
                              </h4>
                              <span className="text-xs font-mono font-bold bg-white/10 px-2 py-0.5 rounded text-gray-200">
                                {contract.plate}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-300">
                              <span className="flex items-center gap-1">
                                <User className="w-3.5 h-3.5 text-gray-500" />
                                Motorista: <strong className="text-white">{contract.driver || 'Não informado'}</strong>
                              </span>
                              <span>📅 Devolução: <strong className="font-mono text-gray-100">{returnBR}</strong></span>
                              <span>⏳ Previsão 30d: <strong className={`font-mono ${isReady ? 'text-emerald-300' : 'text-amber-300'}`}>{dueBR}</strong></span>
                            </div>

                            {s && (
                              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono">
                                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300">
                                  Caução: <strong className="text-emerald-300">{formatBRL(s.caucaoOriginal)}</strong>
                                </span>
                                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300">
                                  Novos Lançamentos 30d: <strong className="text-rose-300">{lateDebits.length} (-{formatBRL(lateTotal)})</strong>
                                </span>
                                <span
                                  className={`px-2.5 py-0.5 rounded font-bold border ${
                                    s.saldoFinal >= 0
                                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                      : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                  }`}
                                >
                                  {s.saldoFinal >= 0 ? 'Saldo a Devolver:' : 'Saldo Devedor:'} {formatBRL(s.saldoFinal)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            {(contract.preFinalizePdfDataUrl || contract.pdfDataUrl) && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPdfPreview({
                                      name: contract.preFinalizePdfFileName || contract.pdfFileName,
                                      pdfDataUrl: contract.preFinalizePdfDataUrl || contract.pdfDataUrl,
                                      subtitle: `1ª Etapa: Termo de Encerramento • ${contract.brand} ${contract.model} (${contract.plate})`
                                    });
                                    onMarkContractAsViewed?.(contract.id);
                                  }}
                                  className="flex items-center gap-1.5 text-xs font-bold text-gray-200 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-xl border border-white/10 transition-all cursor-pointer"
                                  title="Visualizar Termo de Encerramento (1º PDF com prévia)"
                                >
                                  <Printer className="w-3.5 h-3.5 text-blue-400" />
                                  <span>Termo Encerramento</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDownloadPdf(
                                      contract.preFinalizePdfFileName || contract.pdfFileName,
                                      contract.preFinalizePdfDataUrl || contract.pdfDataUrl
                                    )
                                  }
                                  className="flex items-center gap-1 text-xs font-bold text-blue-300 hover:text-blue-200 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1.5 rounded-xl border border-blue-500/25 transition-all cursor-pointer"
                                  title="Baixar Termo de Encerramento (1º PDF)"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>1º PDF</span>
                                </button>
                              </>
                            )}

                            {onAddLateDebit && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (isExpanded) {
                                    setExpandedDebitContractId(null);
                                  } else {
                                    resetDebitForm();
                                    setExpandedDebitContractId(contract.id);
                                  }
                                }}
                                className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                                  isExpanded
                                    ? 'bg-rose-500 text-white border-rose-400'
                                    : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/30'
                                }`}
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Lançar Multa / Avaria ({lateDebits.length})</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleSendPreFinalizedWhatsApp(contract)}
                              className="flex items-center gap-1 text-xs font-bold text-emerald-300 hover:text-white bg-emerald-600/20 hover:bg-emerald-600 px-2.5 py-1.5 rounded-xl border border-emerald-500/30 transition-all cursor-pointer"
                              title="Enviar resumo atualizado no WhatsApp do motorista"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </button>

                            {onCompleteQuitation && (
                              <button
                                type="button"
                                disabled={isCompleting}
                                onClick={async () => {
                                  setCompletingContractId(contract.id);
                                  try {
                                    await onCompleteQuitation(contract.id);
                                  } finally {
                                    setCompletingContractId(null);
                                  }
                                }}
                                className="flex items-center gap-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 px-3 py-1.5 rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                                title="Gerar Termo de Encerramento e Quitação de Débitos (2º PDF Definitivo)"
                              >
                                <ShieldCheck className="w-4 h-4" />
                                <span>{isCompleting ? 'Gerando Quitação...' : 'Gerar Termo de Quitação'}</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setContractToDelete(contract)}
                              className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Excluir registro"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Inline Late Debits Manager (Multas / Avarias / Pedágios nos 30 dias) */}
                        {isExpanded && (
                          <div className="pt-3 border-t border-white/10 space-y-3 animate-in fade-in duration-150">
                            <div className="p-3 bg-black/50 border border-white/10 rounded-xl space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                                  <AlertOctagon className="w-3.5 h-3.5" />
                                  <span>Adicionar Multa, Avaria ou Débito Recebido nos 30 Dias</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setExpandedDebitContractId(null)}
                                  className="text-[11px] text-gray-400 hover:text-white cursor-pointer"
                                >
                                  Fechar painel
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                <div>
                                  <label className="text-[10px] text-gray-400 block mb-1">Categoria</label>
                                  <select
                                    value={debitCategory}
                                    onChange={(e) => setDebitCategory(e.target.value as LateContractDebit['category'])}
                                    className="w-full text-xs bg-[#141414] border border-white/15 rounded-lg px-2.5 py-1.5 text-white"
                                  >
                                    <option value="Multa">Multa de Trânsito</option>
                                    <option value="Avaria">Avaria / Orçamento</option>
                                    <option value="Pedágio">Pedágio / Tag</option>
                                    <option value="Lavagem">Lavagem</option>
                                    <option value="Combustível">Combustível</option>
                                    <option value="Outros">Outros</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="text-[10px] text-gray-400 block mb-1">Data Ocorrência / Notif.</label>
                                  <input
                                    type="date"
                                    value={debitDate}
                                    onChange={(e) => setDebitDate(e.target.value)}
                                    className="w-full text-xs bg-[#141414] border border-white/15 rounded-lg px-2.5 py-1.5 text-white font-mono"
                                  />
                                </div>

                                <div>
                                  <label className="text-[10px] text-gray-400 block mb-1">Valor Base (R$)</label>
                                  <CurrencyInput
                                    value={debitBaseAmount}
                                    onChange={setDebitBaseAmount}
                                    placeholder="0,00"
                                    className="w-full text-xs bg-[#141414] border border-rose-500/30 rounded-lg px-2.5 py-1.5 text-rose-300 font-mono font-bold"
                                  />
                                </div>

                                <div>
                                  <label className="text-[10px] text-gray-400 block mb-1">Comprovante (Foto/PDF)</label>
                                  <label className="w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold bg-white/5 hover:bg-white/10 border border-white/15 rounded-lg px-2.5 py-1.5 text-gray-300 cursor-pointer truncate">
                                    <Paperclip className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                    <span className="truncate">{debitAttachmentName || 'Anexar arquivo'}</span>
                                    <input
                                      type="file"
                                      accept="image/*,application/pdf"
                                      onChange={handleDebitAttachmentChange}
                                      className="hidden"
                                    />
                                  </label>
                                </div>

                                <div className="sm:col-span-2">
                                  <label className="text-[10px] text-gray-400 block mb-1">Descrição (Infração, Auto ou Orçamento)</label>
                                  <input
                                    type="text"
                                    value={debitDesc}
                                    onChange={(e) => setDebitDesc(e.target.value)}
                                    placeholder="Ex: Multa Av. Brasil excesso velocidade / Orçamento para-choque..."
                                    className="w-full text-xs bg-[#141414] border border-white/15 rounded-lg px-2.5 py-1.5 text-white"
                                  />
                                </div>

                                <div className="sm:col-span-2">
                                  <label className="text-[10px] text-gray-400 block mb-1">Observação (Opcional)</label>
                                  <input
                                    type="text"
                                    value={debitNotes}
                                    onChange={(e) => setDebitNotes(e.target.value)}
                                    placeholder="Nº Auto de Infração, oficina, etc."
                                    className="w-full text-xs bg-[#141414] border border-white/15 rounded-lg px-2.5 py-1.5 text-white"
                                  />
                                </div>
                              </div>

                              {debitCategory === 'Multa' && (
                                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-gray-300">
                                  <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={applyAdminFee}
                                      onChange={(e) => setApplyAdminFee(e.target.checked)}
                                      className="rounded border-white/20 bg-black text-amber-500"
                                    />
                                    <span>Aplicar Taxa Administrativa sobre Multa:</span>
                                  </label>
                                  {applyAdminFee && (
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={adminFeePct}
                                        onChange={(e) => setAdminFeePct(Math.max(0, Number(e.target.value)))}
                                        className="w-14 bg-[#141414] border border-amber-500/40 rounded px-2 py-0.5 text-amber-300 font-mono text-right"
                                      />
                                      <span>%</span>
                                      {debitBaseAmount > 0 && (
                                        <span className="text-amber-300 font-mono font-bold">
                                          (Total c/ taxa: {formatBRL(debitBaseAmount * (1 + adminFeePct / 100))})
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="flex justify-end pt-1">
                                <button
                                  type="button"
                                  disabled={!debitDesc.trim() || debitBaseAmount <= 0}
                                  onClick={() => handleSubmitLateDebit(contract.id)}
                                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Adicionar Lançamento e Recalcular Caução</span>
                                </button>
                              </div>
                            </div>

                            {lateDebits.length > 0 && (
                              <div className="space-y-1.5">
                                <span className="text-[10px] font-bold uppercase text-gray-400">
                                  Débitos já lançados neste período de 30 dias ({lateDebits.length}):
                                </span>
                                {lateDebits.map((d) => (
                                  <div
                                    key={d.id}
                                    className="px-3 py-2 bg-white/[0.03] border border-white/10 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs"
                                  >
                                    <div className="space-y-0.5 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                          {d.category}
                                        </span>
                                        <span className="font-mono text-[11px] text-gray-400">
                                          {new Date(`${d.date}T12:00:00`).toLocaleDateString('pt-BR')}
                                        </span>
                                        <span className="font-bold text-white">{d.description}</span>
                                        <span className="font-mono font-bold text-rose-300">-{formatBRL(d.amount)}</span>
                                      </div>
                                      {(d.adminFeeAmount || d.notes) && (
                                        <p className="text-[10px] text-gray-400">
                                          {d.adminFeeAmount ? `Taxa Adm (${d.adminFeePct}%): ${formatBRL(d.adminFeeAmount)}` : ''}
                                          {d.adminFeeAmount && d.notes ? ' • ' : ''}
                                          {d.notes || ''}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {d.attachmentUrl && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setSelectedPdfPreview({
                                              name: d.attachmentName || `${d.category}_${d.date}`,
                                              pdfDataUrl: d.attachmentUrl!,
                                              subtitle: `${d.category} • ${d.description}`
                                            })
                                          }
                                          className="px-2 py-1 text-[10px] font-bold text-blue-300 bg-blue-500/15 hover:bg-blue-500/25 rounded-lg border border-blue-500/30 cursor-pointer"
                                        >
                                          Ver Anexo
                                        </button>
                                      )}
                                      {onRemoveLateDebit && (
                                        <button
                                          type="button"
                                          onClick={() => onRemoveLateDebit(contract.id, d.id)}
                                          className="p-1 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                                          title="Remover lançamento"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          
          {/* Section 1: Approved Vistorias */}
          {(activeArchiveTab === 'all' || activeArchiveTab === 'vistorias') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ClipboardCheck className="w-4 h-4" />
                  <span>Laudos de Vistoria Aprovados ({approvedVistorias.length})</span>
                </h3>
                <span className="hidden sm:inline text-[11px] text-gray-500">Prontos para imprimir, salvar e anexar</span>
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
                  <span>Documentos, Contratos & CRLVs ({allVehicleDocs.length})</span>
                </h3>
                <span className="hidden sm:inline text-[11px] text-gray-500">Arquivos anexados diretamente aos veículos</span>
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
                        {onDeleteVehicleDocument && (
                          <button
                            type="button"
                            onClick={() => {
                              if (doc.category === 'Contrato') {
                                const vehicleContractsCount = allVehicleDocs.filter(
                                  d => d.vehicleId === doc.vehicleId && d.category === 'Contrato'
                                ).length;
                                if (vehicleContractsCount <= 1) {
                                  const isGeneratedOnly = doc.id.startsWith('doc-contract-') || doc.fileSize === 'PDF Oficial';
                                  setContractDeleteBlockModal({
                                    type: isGeneratedOnly ? 'generated' : 'signed',
                                    docName: doc.name,
                                  });
                                  return;
                                }
                              }
                              setDocToDelete({
                                id: doc.id,
                                name: doc.name,
                                category: doc.category,
                                vehicleId: doc.vehicleId,
                                vehicleBrand: doc.vehicleBrand,
                                vehicleModel: doc.vehicleModel,
                                vehiclePlate: doc.vehiclePlate
                              });
                            }}
                            className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            title={doc.category === 'Contrato' ? 'Excluir contrato' : 'Excluir documento'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section 3: Finalized / Quitated Contracts */}
          {(activeArchiveTab === 'all' || activeArchiveTab === 'contratos') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FolderArchive className="w-4 h-4" />
                  <span>Contratos Encerrados & Quitados ({completedContracts.length})</span>
                </h3>
                <span className="hidden sm:inline text-[11px] text-gray-500">Termos de Encerramento e Quitação de Débitos concluídos</span>
              </div>

              {completedContracts.length === 0 ? (
                <div className="py-6 text-center border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
                  <FolderArchive className="w-7 h-7 mx-auto text-gray-600 mb-2" />
                  <p className="text-xs text-gray-400 font-semibold">Nenhum contrato quitado/encerrado definitivamente nesta pasta.</p>
                </div>
              ) : (
                completedContracts.map((contract) => (
                  <div 
                    key={contract.id}
                    className="p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 hover:border-amber-500/30 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          QUITADO
                        </span>
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
                          Quitado em: <strong className="text-gray-200 font-mono">{contract.terminationDate}</strong>
                        </span>

                        {contract.settlement && (
                          <span className={`font-mono font-bold ${contract.settlement.saldoFinal >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                            • {contract.settlement.saldoFinal >= 0 ? 'Caução Devolvida:' : 'Saldo Devedor:'} {formatBRL(contract.settlement.saldoFinal)}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-gray-400 font-mono">
                        <span className="px-2 py-0.5 bg-white/5 rounded border border-white/5">
                          📄 Quitação PDF: <span className="text-amber-400 font-bold">{contract.pdfFileName}</span>
                        </span>
                        {contract.preFinalizePdfFileName && (
                          <span className="px-2 py-0.5 bg-blue-500/10 rounded border border-blue-500/20 text-blue-300">
                            📋 1ª Etapa: {contract.preFinalizePdfFileName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5">
                      {contract.preFinalizePdfDataUrl && contract.preFinalizePdfFileName && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPdfPreview({
                              name: contract.preFinalizePdfFileName!,
                              pdfDataUrl: contract.preFinalizePdfDataUrl!,
                              subtitle: `1ª Etapa: Termo de Encerramento • ${contract.brand} ${contract.model} (${contract.plate})`
                            });
                          }}
                          className="flex items-center gap-1 text-xs font-bold text-blue-300 hover:text-white bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1.5 rounded-xl border border-blue-500/25 transition-all cursor-pointer"
                          title="Visualizar Termo de Encerramento (1º PDF)"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>1º Termo</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPdfPreview({
                            name: contract.pdfFileName,
                            pdfDataUrl: contract.pdfDataUrl,
                            subtitle: `${contract.brand} ${contract.model} (${contract.plate}) • Quitado em ${contract.terminationDate}`
                          });
                          if (onMarkContractAsViewed) {
                            onMarkContractAsViewed(contract.id);
                          }
                        }}
                        className="flex items-center gap-1.5 text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 transition-all cursor-pointer"
                        title="Visualizar e Imprimir Termo de Quitação (PDF)"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-400" />
                        <span>Ver / Imprimir</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(contract.pdfFileName, contract.pdfDataUrl)}
                        className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-500/20 transition-all cursor-pointer"
                        title="Baixar Termo de Quitação em PDF no dispositivo"
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
        </div>

        {/* Modal Footer (compact single bar) */}
        <div className="px-3.5 py-2.5 sm:px-5 sm:py-3 border-t border-white/10 bg-[#141414] flex items-center justify-between gap-2 shrink-0">
          <span className="hidden sm:inline text-xs text-gray-400 font-mono">
            {totalArchivedCount} item(ns) arquivado(s)
          </span>
          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            {onDownloadBackup && (
              <button
                type="button"
                onClick={onDownloadBackup}
                className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 rounded-xl text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <HardDriveDownload className="w-3.5 h-3.5" />
                <span>Backup (.JSON)</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-[11px] sm:text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ml-auto sm:ml-0"
              title="Fechar pasta"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Fechar Pasta</span>
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal for Finalized Contract */}
        <ConfirmDeleteModal
          isOpen={!!contractToDelete}
          title="Excluir Contrato Finalizado? (1/2)"
          description={`Deseja excluir permanentemente o contrato arquivado de ${contractToDelete?.brand} ${contractToDelete?.model} (${contractToDelete?.plate})?`}
          warningNote="Esta ação removerá este relatório do arquivo."
          requireDoubleConfirmation={true}
          secondTitle="Confirmação Final (2/2)"
          secondDescription={`Tem certeza absoluta que deseja apagar permanentemente o contrato finalizado de ${contractToDelete?.brand} ${contractToDelete?.model} (${contractToDelete?.plate})?`}
          secondConfirmButtonText="Sim, Excluir Definitivamente"
          onConfirm={() => {
            if (contractToDelete) {
              onDeleteContract(contractToDelete.id);
              setContractToDelete(null);
            }
          }}
          onCancel={() => setContractToDelete(null)}
        />

        {/* Delete Confirmation Modal for Vehicle Document */}
        <ConfirmDeleteModal
          isOpen={!!docToDelete}
          title="Excluir Documento? (1/2)"
          description={`Deseja excluir o documento "${docToDelete?.name}" (${docToDelete?.category}) do veículo ${docToDelete?.vehicleBrand} ${docToDelete?.vehicleModel} (${docToDelete?.vehiclePlate})?`}
          warningNote="Na próxima etapa será solicitada uma segunda confirmação antes de apagar o arquivo."
          requireDoubleConfirmation={true}
          secondTitle="Confirmação Final de Exclusão (2/2)"
          secondDescription={`Tem certeza absoluta que deseja apagar permanentemente o documento "${docToDelete?.name}"? Esta ação não pode ser desfeita.`}
          secondConfirmButtonText="Sim, Excluir Definitivamente"
          onConfirm={() => {
            if (docToDelete && onDeleteVehicleDocument) {
              onDeleteVehicleDocument(docToDelete.vehicleId, docToDelete.id);
              setDocToDelete(null);
            }
          }}
          onCancel={() => setDocToDelete(null)}
        />

        {/* Pop-up Modal for Contract Deletion Restriction */}
        {contractDeleteBlockModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-[#141414] border border-white/15 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl border ${contractDeleteBlockModal.type === 'generated' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-rose-500/15 text-rose-400 border-rose-500/30'}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {contractDeleteBlockModal.type === 'generated'
                        ? 'Envie o Contrato Assinado Primeiro'
                        : 'Exclusão Não Permitida'}
                    </h3>
                    <p className="text-[11px] text-gray-400 truncate max-w-[240px]">
                      {contractDeleteBlockModal.docName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setContractDeleteBlockModal(null)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-gray-300 leading-relaxed space-y-2">
                {contractDeleteBlockModal.type === 'generated' ? (
                  <p>
                    Este contrato foi apenas gerado pelo sistema. Para excluí-lo, por favor <strong>faça primeiro o upload do documento assinado</strong> no veículo. Assim que o contrato assinado for anexado, você poderá excluir este contrato gerado.
                  </p>
                ) : (
                  <p>
                    Este documento já foi assinado e enviado por upload. <strong>O veículo não pode ficar sem documento de contrato vinculado.</strong>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setContractDeleteBlockModal(null)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Entendi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PDF Viewer Sub-modal / Preview with Print & Save */}
        {selectedPdfPreview && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-md">
            <div className="bg-[#111111] border-0 sm:border sm:border-white/10 rounded-none sm:rounded-2xl w-full max-w-4xl h-[100dvh] sm:h-[90vh] flex flex-col shadow-2xl overflow-hidden">
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
                  {selectedPdfPreview.pdfDataUrl.startsWith('data:image/') && (
                    <button
                      onClick={() => printImage(selectedPdfPreview.pdfDataUrl, selectedPdfPreview.name)}
                      className="flex items-center gap-1.5 text-xs font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-xl border border-blue-500/20 cursor-pointer"
                      title="Abrir opções de impressão nativa do celular / impressora"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Imprimir</span>
                    </button>
                  )}
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
