import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  X,
  Plus,
  FolderArchive,
  HelpCircle,
  BookOpen,
  Paperclip,
  Download,
  Upload,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Car,
  Settings,
  FileText,
  MessageCircle,
  Wrench,
  Fuel,
  BellRing,
  Bell,
  Gauge,
  FileDown,
  User,
  Edit3,
  Receipt,
  Calculator,
  ClipboardCheck
} from 'lucide-react';

interface HeaderActionsMenuProps {
  onAddVehicle: () => void;
  onOpenRegisterDriver?: () => void;
  onOpenContractEditor?: () => void;
  onOpenRentalContract?: () => void;
  onOpenFinalizedContracts: () => void;
  finalizedContractsCount: number;
  unviewedContractsCount?: number;
  onOpenHelp: () => void;
  onOpenAgenda: () => void;
  onOpenLogForm: (type: 'fuel' | 'maintenance' | 'expense') => void;
  onOpenMaintenanceHistory?: () => void;
  onOpenDocumentUpload: () => void;
  onOpenSettings?: () => void;
  onOpenSettingsSubModal?: (sub: 'whatsapp' | 'reminders') => void;
  pendingRemindersCount?: number;
  onOpenNotificationCenter?: () => void;
  onOpenChecklistConfig?: () => void;
  onOpenInterestCalculator?: () => void;
  onOpenBatchOdometer?: () => void;
  onDownloadExecutivePdf?: () => void;
  onDownloadBackup: () => void;
  onUploadBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetData: () => void;
}

type MenuGroupKey = 'manutencao' | 'contrato' | 'frota' | 'configuracoes';

export function HeaderActionsMenu({
  onAddVehicle,
  onOpenRegisterDriver,
  onOpenContractEditor,
  onOpenRentalContract,
  onOpenFinalizedContracts,
  finalizedContractsCount,
  unviewedContractsCount = 0,
  onOpenHelp,
  onOpenAgenda,
  onOpenLogForm,
  onOpenMaintenanceHistory,
  onOpenDocumentUpload,
  onOpenSettings,
  onOpenSettingsSubModal,
  pendingRemindersCount = 0,
  onOpenNotificationCenter,
  onOpenChecklistConfig,
  onOpenInterestCalculator,
  onOpenBatchOdometer,
  onDownloadExecutivePdf,
  onDownloadBackup,
  onUploadBackup,
  onResetData
}: HeaderActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<MenuGroupKey, boolean>>({
    manutencao: false,
    contrato: false,
    frota: false,
    configuracoes: true
  });
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleGroup = (key: MenuGroupKey) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.documentElement.classList.add('modal-open');
      document.body.classList.add('modal-open');
    } else {
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  const handleAction = (actionFn: () => void) => {
    actionFn();
    setIsOpen(false);
  };

  const totalAlertsBadge = unviewedContractsCount + pendingRemindersCount;

  return (
    <div className="relative" ref={menuRef}>
      {/* Main Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer border shadow-lg ${
          isOpen
            ? 'bg-blue-600 border-blue-400 text-white shadow-blue-500/20'
            : 'bg-white/10 hover:bg-white/15 text-white border-white/10 hover:border-white/20'
        }`}
        id="btn-main-actions-menu"
      >
        <Menu className="w-4 h-4 text-blue-400 shrink-0" />
        <span className="hidden sm:inline">Menu de Opções</span>
        <span className="sm:hidden">Menu</span>
        {totalAlertsBadge > 0 && (
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Expanded Dropdown Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-start justify-end p-2 sm:p-6 pt-16 sm:pt-20 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 overscroll-contain">
          {/* Backdrop click to close */}
          <div
            className="absolute inset-0 touch-none"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Content Card */}
          <div className="relative w-full sm:w-96 max-w-[calc(100vw-1rem)] max-h-[85vh] overflow-y-auto overscroll-contain touch-pan-y bg-[#141414] border border-white/20 rounded-2xl shadow-2xl z-[1000] p-3 space-y-2.5 animate-in zoom-in-95 duration-150 scrollbar-thin scrollbar-thumb-white/20">
            <div className="px-2 py-2 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#141414] z-10">
              <div className="flex items-center gap-2">
                <Menu className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Menu Organizado
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Fechar menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* GRUPO 1: MANUTENÇÃO */}
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.04] overflow-hidden">
              <button
                type="button"
                onClick={() => toggleGroup('manutencao')}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-amber-500/10 transition-colors cursor-pointer"
                id="menu-group-manutencao"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 bg-amber-500/20 text-amber-300 rounded-lg border border-amber-500/30 shrink-0">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Manutenção & Operação</span>
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">
                      Manutenção, Histórico, Despesas, Combustível e KM
                    </p>
                  </div>
                </div>
                {openGroups.manutencao ? (
                  <ChevronDown className="w-4 h-4 text-amber-300 shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                )}
              </button>

              {openGroups.manutencao && (
                <div className="p-2 pt-0 space-y-1.5 border-t border-amber-500/15 bg-black/25">
                  <button
                    type="button"
                    onClick={() => handleAction(() => onOpenLogForm('maintenance'))}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-left transition-all cursor-pointer border border-amber-500/20"
                  >
                    <div className="p-1.5 bg-amber-600 text-white rounded-lg shrink-0">
                      <Wrench className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Nova Manutenção</p>
                      <p className="text-[10px] text-gray-400">Peças, oficinas e reparos</p>
                    </div>
                  </button>

                  {onOpenMaintenanceHistory && (
                    <button
                      type="button"
                      onClick={() => handleAction(onOpenMaintenanceHistory)}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-left transition-all cursor-pointer border border-orange-500/20"
                    >
                      <div className="p-1.5 bg-orange-600 text-white rounded-lg shrink-0">
                        <Wrench className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Histórico de Manutenções</p>
                        <p className="text-[10px] text-gray-400">Todos os registros por carro</p>
                      </div>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleAction(() => onOpenLogForm('expense'))}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-left transition-all cursor-pointer border border-rose-500/20"
                  >
                    <div className="p-1.5 bg-rose-600 text-white rounded-lg shrink-0">
                      <Receipt className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Nova Despesa</p>
                      <p className="text-[10px] text-gray-400">IPVA, seguro, multa ou taxas</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction(() => onOpenLogForm('fuel'))}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-left transition-all cursor-pointer border border-emerald-500/20"
                  >
                    <div className="p-1.5 bg-emerald-600 text-white rounded-lg shrink-0">
                      <Fuel className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Novo Abastecimento</p>
                      <p className="text-[10px] text-gray-400">Registrar combustível e consumo</p>
                    </div>
                  </button>

                  {onOpenBatchOdometer && (
                    <button
                      type="button"
                      onClick={() => handleAction(onOpenBatchOdometer)}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-left transition-all cursor-pointer border border-cyan-500/20"
                    >
                      <div className="p-1.5 bg-cyan-500 text-slate-950 rounded-lg shrink-0">
                        <Gauge className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Modo Odômetro (KM em Lote)</p>
                        <p className="text-[10px] text-gray-400">Atualizar KM de todos os carros</p>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* GRUPO 2: CONTRATO */}
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.04] overflow-hidden">
              <button
                type="button"
                onClick={() => toggleGroup('contrato')}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-emerald-500/10 transition-colors cursor-pointer"
                id="menu-group-contrato"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-lg border border-emerald-500/30 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Contratos & Motoristas</span>
                      {unviewedContractsCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black">
                          {unviewedContractsCount}
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">
                      Gerar, Editar Cláusulas, Finalizados, Docs e Motorista
                    </p>
                  </div>
                </div>
                {openGroups.contrato ? (
                  <ChevronDown className="w-4 h-4 text-emerald-300 shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                )}
              </button>

              {openGroups.contrato && (
                <div className="p-2 pt-0 space-y-1.5 border-t border-emerald-500/15 bg-black/25">
                  {onOpenRentalContract && (
                    <button
                      type="button"
                      onClick={() => handleAction(onOpenRentalContract)}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-left transition-all cursor-pointer border border-emerald-500/20"
                    >
                      <div className="p-1.5 bg-emerald-600 text-white rounded-lg shrink-0">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Gerar Contrato de Locação</p>
                        <p className="text-[10px] text-gray-400">Dados do locatário e PDF oficial</p>
                      </div>
                    </button>
                  )}

                  {onOpenContractEditor && (
                    <button
                      type="button"
                      onClick={() => handleAction(onOpenContractEditor)}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-left transition-all cursor-pointer border border-purple-500/20"
                    >
                      <div className="p-1.5 bg-purple-600 text-white rounded-lg shrink-0">
                        <Edit3 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Editor de Contrato</p>
                        <p className="text-[10px] text-gray-400">Editar cláusulas e termos</p>
                      </div>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleAction(onOpenFinalizedContracts)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-left transition-all cursor-pointer border border-amber-500/20"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-amber-500 text-slate-950 rounded-lg shrink-0">
                        <FolderArchive className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Contratos Finalizados</p>
                        <p className="text-[10px] text-gray-400">Pasta com PDFs e quitação</p>
                      </div>
                    </div>
                    {finalizedContractsCount > 0 && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          unviewedContractsCount > 0
                            ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                            : 'bg-amber-500/30 text-amber-200 border-amber-500/40'
                        }`}
                      >
                        {finalizedContractsCount}
                      </span>
                    )}
                  </button>

                  {onOpenRegisterDriver && (
                    <button
                      type="button"
                      onClick={() => handleAction(onOpenRegisterDriver)}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-left transition-all cursor-pointer border border-indigo-500/20"
                    >
                      <div className="p-1.5 bg-indigo-600 text-white rounded-lg shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Cadastrar Motorista</p>
                        <p className="text-[10px] text-gray-400">Vincular locatário e agenda</p>
                      </div>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleAction(onOpenDocumentUpload)}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-left transition-all cursor-pointer border border-blue-500/20"
                  >
                    <div className="p-1.5 bg-blue-600 text-white rounded-lg shrink-0">
                      <Paperclip className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Carregar Documento</p>
                      <p className="text-[10px] text-gray-400">Contratos, fotos e arquivos</p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* GRUPO 3: VEÍCULOS & FINANCEIRO */}
            <div className="rounded-xl border border-blue-500/25 bg-blue-500/[0.04] overflow-hidden">
              <button
                type="button"
                onClick={() => toggleGroup('frota')}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-blue-500/10 transition-colors cursor-pointer"
                id="menu-group-frota"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30 shrink-0">
                    <Car className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white">Veículos & Financeiro</p>
                    <p className="text-[10px] text-gray-400 truncate">
                      Novo Carro, Agenda, Calculadora de Juros e PDF
                    </p>
                  </div>
                </div>
                {openGroups.frota ? (
                  <ChevronDown className="w-4 h-4 text-blue-300 shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                )}
              </button>

              {openGroups.frota && (
                <div className="p-2 pt-0 space-y-1.5 border-t border-blue-500/15 bg-black/25">
                  <button
                    type="button"
                    onClick={() => handleAction(onAddVehicle)}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-left transition-all cursor-pointer border border-blue-500/20"
                  >
                    <div className="p-1.5 bg-blue-600 text-white rounded-lg shrink-0">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Adicionar Veículo</p>
                      <p className="text-[10px] text-gray-400">Cadastrar novo carro na frota</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction(onOpenAgenda)}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-left transition-all cursor-pointer border border-teal-500/20"
                  >
                    <div className="p-1.5 bg-teal-600 text-white rounded-lg shrink-0">
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Agenda Telefônica & Locatários</p>
                      <p className="text-[10px] text-gray-400">Contatos, telefones e regiões</p>
                    </div>
                  </button>

                  {onOpenInterestCalculator && (
                    <button
                      type="button"
                      onClick={() => handleAction(onOpenInterestCalculator)}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-left transition-all cursor-pointer border border-violet-500/20"
                    >
                      <div className="p-1.5 bg-violet-600 text-white rounded-lg shrink-0">
                        <Calculator className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Calculadora de Juros e Multas</p>
                        <p className="text-[10px] text-gray-400">Simular atrasos e recibo</p>
                      </div>
                    </button>
                  )}

                  {onDownloadExecutivePdf && (
                    <button
                      type="button"
                      onClick={() => handleAction(onDownloadExecutivePdf)}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-left transition-all cursor-pointer border border-emerald-500/20"
                    >
                      <div className="p-1.5 bg-emerald-500 text-slate-950 rounded-lg shrink-0">
                        <FileDown className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Relatório Mensal PDF (Contador)</p>
                        <p className="text-[10px] text-gray-400">Resumo executivo em 1 página</p>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* GRUPO 4: CONFIGURAÇÕES, WHATSAPP & LEMBRETES */}
            <div className="rounded-xl border border-sky-500/30 bg-sky-500/[0.05] overflow-hidden">
              <button
                type="button"
                onClick={() => toggleGroup('configuracoes')}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-sky-500/10 transition-colors cursor-pointer"
                id="menu-group-configuracoes"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 bg-sky-500/20 text-sky-300 rounded-lg border border-sky-500/30 shrink-0">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Configurações & Alertas</span>
                      {pendingRemindersCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black">
                          {pendingRemindersCount}
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">
                      WhatsApp, Lembretes, Notificações, Checklist e Locador
                    </p>
                  </div>
                </div>
                {openGroups.configuracoes ? (
                  <ChevronDown className="w-4 h-4 text-sky-300 shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                )}
              </button>

              {openGroups.configuracoes && (
                <div className="p-2 pt-0 space-y-1.5 border-t border-sky-500/15 bg-black/25">
                  {onOpenSettingsSubModal && (
                    <button
                      type="button"
                      onClick={() => handleAction(() => onOpenSettingsSubModal('whatsapp'))}
                      className="w-full flex items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-left transition-all cursor-pointer border border-emerald-500/35"
                      id="menu-btn-whatsapp-templates"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 bg-emerald-600 text-white rounded-lg shrink-0">
                          <MessageCircle className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white">Mensagens do WhatsApp</p>
                          <p className="text-[10px] text-emerald-200/80 truncate">
                            Templates: Pagamento, Atraso e Renovação
                          </p>
                        </div>
                      </div>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 shrink-0">
                        Novo
                      </span>
                    </button>
                  )}

                  {onOpenSettingsSubModal && (
                    <button
                      type="button"
                      onClick={() => handleAction(() => onOpenSettingsSubModal('reminders'))}
                      className="w-full flex items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-left transition-all cursor-pointer border border-amber-500/35"
                      id="menu-btn-custom-reminders"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 bg-amber-500 text-slate-950 rounded-lg shrink-0">
                          <Bell className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white">Lembretes e Tarefas</p>
                          <p className="text-[10px] text-amber-200/80 truncate">
                            Algo a fazer c/ Push e Tela Inicial
                          </p>
                        </div>
                      </div>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 shrink-0">
                        {pendingRemindersCount > 0 ? pendingRemindersCount : 'Novo'}
                      </span>
                    </button>
                  )}

                  {onOpenNotificationCenter && (
                    <button
                      type="button"
                      onClick={() => handleAction(onOpenNotificationCenter)}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 text-left transition-all cursor-pointer border border-emerald-500/20"
                    >
                      <div className="p-1.5 bg-emerald-600 text-white rounded-lg shrink-0">
                        <BellRing className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Centro de Notificações</p>
                        <p className="text-[10px] text-gray-400">Ativar/desativar alertas automáticos</p>
                      </div>
                    </button>
                  )}

                  {onOpenChecklistConfig && (
                    <button
                      type="button"
                      onClick={() => handleAction(onOpenChecklistConfig)}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-left transition-all cursor-pointer border border-purple-500/20"
                    >
                      <div className="p-1.5 bg-purple-600 text-white rounded-lg shrink-0">
                        <ClipboardCheck className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Configurar Checklist de Vistoria</p>
                        <p className="text-[10px] text-gray-400">Itens obrigatórios e fotos</p>
                      </div>
                    </button>
                  )}

                  {onOpenSettings && (
                    <button
                      type="button"
                      onClick={() => handleAction(onOpenSettings)}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-left transition-all cursor-pointer border border-sky-500/25"
                    >
                      <div className="p-1.5 bg-sky-600 text-white rounded-lg shrink-0">
                        <Settings className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Configurações Gerais & Locador</p>
                        <p className="text-[10px] text-gray-400">PIX, taxas, permissões e suporte</p>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="my-1 border-t border-white/10" />

            {/* Backup, Ajuda & Reset */}
            <div className="pt-1 px-0.5 flex items-center justify-between gap-1.5">
              <button
                type="button"
                onClick={() => handleAction(onDownloadBackup)}
                className="flex-1 flex items-center justify-center gap-1 py-2 text-[11px] font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors cursor-pointer"
                title="Baixar Backup JSON"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Backup</span>
              </button>

              <label
                className="flex-1 flex items-center justify-center gap-1 py-2 text-[11px] font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors cursor-pointer"
                title="Restaurar Backup JSON"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Restaurar</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    onUploadBackup(e);
                    setIsOpen(false);
                  }}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => handleAction(onOpenHelp)}
                className="p-2 text-gray-300 hover:text-blue-300 bg-white/5 hover:bg-blue-500/10 rounded-xl border border-white/10 transition-colors cursor-pointer"
                title="Manual e Ajuda"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => handleAction(onResetData)}
                className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-white/10 transition-colors cursor-pointer"
                title="Zerar todos os dados do sistema (Gerar APK limpo)"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

