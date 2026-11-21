import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Bell, 
  BellOff, 
  Gauge, 
  CheckCircle2, 
  AlertTriangle,
  Volume2,
  ShieldCheck,
  Camera,
  HardDrive,
  MapPin,
  MessageCircle,
  ListChecks,
  Check,
  Play,
  Calendar,
  PieChart,
  History,
  BarChart3,
  FileText,
  Edit2,
  Mail,
  Plus,
  Trash2,
  RotateCcw,
  Save,
  Clock,
  Sparkles,
  Wrench,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Vehicle, FuelLog, MaintenanceLog, ExpenseLog, Vistoria, CustomReminder } from '../types';
import { DashboardCalendar } from './DashboardCalendar';
import { VisualCharts } from './VisualCharts';
import { HistoryLogs } from './HistoryLogs';
import { 
  requestNotificationPermission, 
  sendAppNotification, 
  checkNotificationPermission, 
  requestIgnoreBatteryOptimization,
  NOTIFICATION_OPTIONS,
  NotificationEventKey,
  getNotificationPreferences,
  setNotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES
} from '../utils/notifications';
import {
  WhatsAppTemplateKey,
  WHATSAPP_TEMPLATE_VARIABLES,
  getAllWhatsAppTemplates,
  saveAllWhatsAppTemplates,
  resetWhatsAppTemplate,
  formatWhatsAppTemplateText
} from '../utils/whatsappTemplates';
import {
  ContractClause,
  getSavedContractClauses,
  saveContractClauses,
  resetContractClauses,
  getFullContractTextTemplate,
  saveFullContractTextTemplate,
  resetFullContractTextTemplate,
  parseFullTextToClauses,
  rebuildFullTextWithClauses
} from '../utils/contractClauses';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  disableFridayReminder: boolean;
  onToggleFridayReminder: (disabled: boolean) => void;
  maintNotificationsEnabled: boolean;
  onToggleMaintNotifications: (enabled: boolean) => void;
  vehicles: Vehicle[];
  onTriggerMaintNotificationCheck: () => void;

  // Integrated features for Configurações, Calendário & Painel Consolidado
  fuelLogs?: FuelLog[];
  maintenanceLogs?: MaintenanceLog[];
  expenseLogs?: ExpenseLog[];
  vistorias?: Vistoria[];
  selectedMonth?: number;
  selectedYear?: number;
  onMonthChange?: (year: number, month: number) => void;
  onDeleteFuel?: (id: string) => void;
  onDeleteMaintenance?: (id: string) => void;
  onDeleteExpense?: (id: string) => void;
  onDeleteVistoria?: (id: string) => void;
  onUpdateFuel?: (log: FuelLog) => void;
  onUpdateMaintenance?: (log: MaintenanceLog) => void;
  onUpdateExpense?: (log: ExpenseLog) => void;
  onUpdateVistoria?: (log: Vistoria) => void;
  onClearAllVistorias?: () => void;
  onOpenBatchOdometer?: () => void;
  onSwitchMaintToExpense?: (log: MaintenanceLog, originalLog?: MaintenanceLog) => void;
  onSwitchExpenseToMaint?: (log: ExpenseLog, originalLog?: ExpenseLog) => void;
  onShowDeleteConfirm?: (title: string, description: string, onConfirm: () => void) => void;
  initialTab?: 'settings' | 'calendar' | 'charts' | 'history' | 'contract';
  initialSubModal?: 'whatsapp' | 'reminders' | null;
  onContractUpdated?: () => void;
  onOpenContractEditor?: () => void;
  customReminders?: CustomReminder[];
  onAddReminder?: (reminder: Omit<CustomReminder, 'id' | 'createdAt' | 'completed'>) => Promise<void> | void;
  onToggleReminder?: (id: string) => void;
  onDeleteReminder?: (id: string) => void;
  onUpdateReminder?: (reminder: CustomReminder) => Promise<void> | void;
}

export function SettingsModal({
  isOpen,
  onClose,
  disableFridayReminder,
  onToggleFridayReminder,
  maintNotificationsEnabled,
  onToggleMaintNotifications,
  vehicles,
  onTriggerMaintNotificationCheck,
  fuelLogs = [],
  maintenanceLogs = [],
  expenseLogs = [],
  vistorias = [],
  selectedMonth,
  selectedYear,
  onMonthChange,
  onDeleteFuel,
  onDeleteMaintenance,
  onDeleteExpense,
  onDeleteVistoria,
  onUpdateFuel,
  onUpdateMaintenance,
  onUpdateExpense,
  onUpdateVistoria,
  onClearAllVistorias,
  onOpenBatchOdometer,
  onSwitchMaintToExpense,
  onSwitchExpenseToMaint,
  onShowDeleteConfirm,
  initialTab = 'settings',
  initialSubModal = null,
  onContractUpdated,
  onOpenContractEditor,
  customReminders = [],
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
  onUpdateReminder
}: SettingsModalProps) {
  const [permissionState, setPermissionState] = useState<'granted' | 'denied' | 'default'>('default');
  const [notifPrefs, setNotifPrefs] = useState<Record<NotificationEventKey, boolean>>(() => getNotificationPreferences());
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [mainTab, setMainTab] = useState<'settings' | 'calendar' | 'charts' | 'history' | 'contract'>(initialTab as any);

  // WhatsApp Message Templates Sub-Modal State
  const [isWhatsAppTemplatesOpen, setIsWhatsAppTemplatesOpen] = useState(false);
  const [waTemplates, setWaTemplates] = useState<Record<WhatsAppTemplateKey, string>>(() => getAllWhatsAppTemplates());
  const [waCoreTab, setWaCoreTab] = useState<'pagamento' | 'atraso' | 'renovacao'>('pagamento');
  const [waSubKey, setWaSubKey] = useState<WhatsAppTemplateKey>('lembrete');
  const [waSavedFeedback, setWaSavedFeedback] = useState<string | null>(null);
  const waTextareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  // Custom Reminders ("Algo a fazer") Sub-Modal State
  const [isRemindersModalOpen, setIsRemindersModalOpen] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderNotes, setReminderNotes] = useState('');
  const [reminderDate, setReminderDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [reminderPushEnabled, setReminderPushEnabled] = useState(true);
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
  const [reminderFeedback, setReminderFeedback] = useState<string | null>(null);

  // Organized Collapsible Category Groups in Settings Tab
  type SettingsGroupKey = 'manutencao' | 'contrato' | 'notificacoes' | 'whatsapp' | 'sistema';
  const [openSettingsGroups, setOpenSettingsGroups] = useState<Record<SettingsGroupKey, boolean>>({
    manutencao: false,
    contrato: false,
    notificacoes: false,
    whatsapp: false,
    sistema: false
  });
  const toggleSettingsGroup = (key: SettingsGroupKey) => {
    setOpenSettingsGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Default contract / landlord settings
  const [landlordName, setLandlordName] = useState(() => localStorage.getItem('fleet_landlord_name') || 'Cláudio Oliveira da Silva');
  const [landlordCpfCnpj, setLandlordCpfCnpj] = useState(() => localStorage.getItem('fleet_landlord_cpf') || '065.426.576-30');
  const [landlordRg, setLandlordRg] = useState(() => localStorage.getItem('fleet_landlord_rg') || '39.508.321-7');
  const [landlordPhone, setLandlordPhone] = useState(() => localStorage.getItem('fleet_landlord_phone') || '(11) 95329-2570');
  const [landlordAddress, setLandlordAddress] = useState(() => localStorage.getItem('fleet_landlord_address') || 'Rua Manuel Leiroz, 230, apto 1306 - Cangaíba, São Paulo/SP, CEP: 03735-180');
  const [pixKey, setPixKey] = useState(() => localStorage.getItem('fleet_landlord_pix') || '11953292570');
  const [fineRate, setFineRate] = useState<number>(() => {
    const saved = localStorage.getItem('fleet_fine_rate_default');
    return saved ? Number(saved) : 10.0;
  });
  const [interestRate, setInterestRate] = useState<number>(() => {
    const saved = localStorage.getItem('fleet_daily_interest_rate_default');
    return saved ? Number(saved) : 1.0;
  });
  const [earlyFineRate, setEarlyFineRate] = useState<number>(() => {
    const saved = localStorage.getItem('fleet_early_return_fine_rate_default');
    return saved ? Number(saved) : 20.0;
  });

  const handleUpdateLandlordField = (key: string, value: string) => {
    localStorage.setItem(key, value);
    if (key === 'fleet_landlord_name') setLandlordName(value);
    if (key === 'fleet_landlord_cpf') setLandlordCpfCnpj(value);
    if (key === 'fleet_landlord_rg') setLandlordRg(value);
    if (key === 'fleet_landlord_phone') setLandlordPhone(value);
    if (key === 'fleet_landlord_address') setLandlordAddress(value);
    if (key === 'fleet_landlord_pix') setPixKey(value);
  };

  const handleUpdateRateField = (key: string, value: number) => {
    localStorage.setItem(key, String(value));
    if (key === 'fleet_fine_rate_default') setFineRate(value);
    if (key === 'fleet_daily_interest_rate_default') setInterestRate(value);
    if (key === 'fleet_early_return_fine_rate_default') setEarlyFineRate(value);
    window.dispatchEvent(new CustomEvent('settings-updated'));
  };

  useEffect(() => {
    if (isOpen) {
      if (initialTab === 'contract' && onOpenContractEditor) {
        onClose();
        onOpenContractEditor();
        return;
      }
      setMainTab(initialTab);
      setNotifPrefs(getNotificationPreferences());
      checkNotificationPermission().then((granted) => {
        setPermissionState(granted ? 'granted' : 'default');
      });
      setLandlordName(localStorage.getItem('fleet_landlord_name') || 'Cláudio Oliveira da Silva');
      setLandlordCpfCnpj(localStorage.getItem('fleet_landlord_cpf') || '065.426.576-30');
      setLandlordRg(localStorage.getItem('fleet_landlord_rg') || '39.508.321-7');
      setLandlordAddress(localStorage.getItem('fleet_landlord_address') || 'Rua Manuel Leiroz, 230, apto 1306 - Cangaíba, São Paulo/SP, CEP: 03735-180');
      setLandlordPhone(localStorage.getItem('fleet_landlord_phone') || '(11) 95329-2570');
      setPixKey(localStorage.getItem('fleet_landlord_pix') || '11953292570');
      
      const savedFine = localStorage.getItem('fleet_fine_rate_default');
      setFineRate(savedFine ? Number(savedFine) : 10.0);
      const savedInterest = localStorage.getItem('fleet_daily_interest_rate_default');
      setInterestRate(savedInterest ? Number(savedInterest) : 1.0);
      const savedEarlyFine = localStorage.getItem('fleet_early_return_fine_rate_default');
      setEarlyFineRate(savedEarlyFine ? Number(savedEarlyFine) : 20.0);
      
      const savedClauses = getSavedContractClauses();
      const customFull = getFullContractTextTemplate();
      setContractClauses(
        customFull && customFull.trim().length > 0
          ? parseFullTextToClauses(customFull, savedClauses)
          : savedClauses
      );
      setWaTemplates(getAllWhatsAppTemplates());
      if (initialSubModal === 'whatsapp') {
        setIsWhatsAppTemplatesOpen(true);
        setIsRemindersModalOpen(false);
      } else if (initialSubModal === 'reminders') {
        setIsRemindersModalOpen(true);
        setIsWhatsAppTemplatesOpen(false);
      } else {
        setIsWhatsAppTemplatesOpen(false);
        setIsRemindersModalOpen(false);
      }
    }
  }, [isOpen, initialTab, initialSubModal]);

  const [contractClauses, setContractClauses] = useState<ContractClause[]>([]);
  const [editingClauseId, setEditingClauseId] = useState<string | null>(null);
  const [editingClauseText, setEditingClauseText] = useState('');

  const handleStartEditClause = (clause: ContractClause) => {
    setEditingClauseId(clause.id);
    setEditingClauseText(clause.text);
  };

  const handleSaveClause = () => {
    if (!editingClauseId) return;
    const updated = contractClauses.map(c => 
      c.id === editingClauseId ? { ...c, text: editingClauseText } : c
    );
    setContractClauses(updated);
    saveContractClauses(updated);
    const customFull = getFullContractTextTemplate();
    if (customFull && customFull.trim().length > 0) {
      saveFullContractTextTemplate(rebuildFullTextWithClauses(updated, customFull));
    }
    if (onContractUpdated) onContractUpdated();
    setEditingClauseId(null);
    setEditingClauseText('');
  };

  const handleResetClauses = () => {
    if (window.confirm('Deseja realmente resetar todas as cláusulas para o padrão original do sistema? Suas alterações serão perdidas.')) {
      const defaults = resetContractClauses();
      resetFullContractTextTemplate();
      setContractClauses(defaults);
      if (onContractUpdated) onContractUpdated();
    }
  };

  if (!isOpen) return null;

  const handleToggleEventPref = (key: NotificationEventKey) => {
    const nextValue = !notifPrefs[key];
    const updated = {
      ...notifPrefs,
      [key]: nextValue
    };
    setNotifPrefs(updated);
    setNotificationPreferences(updated);

    if (key === 'vistoria_friday') {
      onToggleFridayReminder(!nextValue);
    }
  };

  const handleSelectAllNotifs = (enable: boolean) => {
    const updated = { ...DEFAULT_NOTIFICATION_PREFERENCES };
    (Object.keys(updated) as NotificationEventKey[]).forEach((k) => {
      updated[k] = enable;
    });
    setNotifPrefs(updated);
    setNotificationPreferences(updated);
    onToggleMaintNotifications(enable);
    onToggleFridayReminder(!enable);
  };

  const handleRequestPermission = async () => {
    try {
      const granted = await requestNotificationPermission();
      if (granted) {
        setPermissionState('granted');
        onToggleMaintNotifications(true);
        await sendAppNotification('🔔 Notificações Ativadas!', {
          body: 'Você receberá alertas do aplicativo conforme suas escolhas personalizadas na central de notificações.',
          force: true
        });
      } else {
        const check = await checkNotificationPermission();
        setPermissionState(check ? 'granted' : 'denied');
      }
    } catch (err) {
      console.error('Erro ao solicitar permissão de notificação:', err);
    }
  };

  const vehiclesNeedingMaint = vehicles.filter((v) => {
    const current = v.preventiveMaintCurrentKm || v.currentKm || 0;
    const next = v.preventiveMaintNextKm || 0;
    return next > 0 && current >= (next - 500);
  });

  const categories = ['Todas', 'Manutenção e Pneus', 'Vistorias', 'Financeiro e Pagamentos', 'Contratos e CNH', 'Operação e Sistema'];
  const filteredOptions = selectedCategory === 'Todas'
    ? NOTIFICATION_OPTIONS
    : NOTIFICATION_OPTIONS.filter(opt => opt.category === selectedCategory);

  const enabledCount = Object.values(notifPrefs).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />

      <div className={`relative w-full ${mainTab === 'settings' ? 'max-w-3xl' : 'max-w-6xl'} bg-[#141414] border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-[1001] animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh] transition-all`}>
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/10 bg-[#181818] flex items-center justify-between shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/20">
              {mainTab === 'settings' && <Settings className="w-5 h-5 text-blue-400" />}
              {mainTab === 'calendar' && <Calendar className="w-5 h-5 text-purple-400" />}
              {mainTab === 'charts' && <PieChart className="w-5 h-5 text-emerald-400" />}
              {mainTab === 'history' && <History className="w-5 h-5 text-amber-400" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Configurações, Calendário & Painel Consolidado</h2>
              <p className="text-[11px] text-gray-400">Preferências do sistema, agenda de atividades, comparativos orçamentários e tabelas completas de lançamentos.</p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="px-5 py-2.5 bg-[#18181c] border-b border-white/10 flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 shrink-0">
          <button
            type="button"
            onClick={() => setMainTab('settings')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 ${
              mainTab === 'settings'
                ? 'bg-blue-600 text-white border-blue-400/50 shadow-md shadow-blue-500/20'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border-white/5'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configurações & Alertas</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab('calendar')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 ${
              mainTab === 'calendar'
                ? 'bg-purple-600 text-white border-purple-400/50 shadow-md shadow-purple-500/20'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border-white/5'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendário de Atividades</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab('charts')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 ${
              mainTab === 'charts'
                ? 'bg-emerald-600 text-white border-emerald-400/50 shadow-md shadow-emerald-500/20'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border-white/5'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Gráficos & Orçamento</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab('history')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 ${
              mainTab === 'history'
                ? 'bg-amber-600 text-white border-amber-400/50 shadow-md shadow-amber-500/20'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border-white/5'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Histórico Geral & Tabelas</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onOpenContractEditor) {
                onClose();
                onOpenContractEditor();
              } else {
                setMainTab('contract' as any);
              }
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 ${
              (mainTab as any) === 'contract'
                ? 'bg-rose-600 text-white border-rose-400/50 shadow-md shadow-rose-500/20'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Editor de Contrato</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-5 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-white/10">
          
          {/* TAB 1: CONFIGURAÇÕES & NOTIFICAÇÕES */}
          {mainTab === 'settings' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* Atalhos Rápidos: Mensagens do WhatsApp e Lembretes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setWaTemplates(getAllWhatsAppTemplates());
                    setIsWhatsAppTemplatesOpen(true);
                  }}
                  className="p-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-left transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  id="btn-open-whatsapp-templates-modal"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                        Mensagens do WhatsApp
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">
                        Templates p/ Pagamento, Atraso e Renovação
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                    Configurar
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsRemindersModalOpen(true)}
                  className="p-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-left transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  id="btn-open-custom-reminders-modal"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                        <span>Lembretes e Tarefas</span>
                        {customReminders.filter((r) => !r.completed).length > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[9px] font-black">
                            {customReminders.filter((r) => !r.completed).length}
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">
                        Adicionar algo a fazer c/ Push e Tela Inicial
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                    Abrir
                  </span>
                </button>
              </div>

              {/* Barra de Ação Rápida para Expandir/Recolher Grupos */}
              <div className="flex items-center justify-between px-1 pt-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Categorias de Configuração
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenSettingsGroups({
                        manutencao: true,
                        contrato: true,
                        notificacoes: true,
                        whatsapp: true,
                        sistema: true
                      })
                    }
                    className="text-[10px] font-bold text-blue-400 hover:text-blue-300 cursor-pointer"
                  >
                    Expandir tudo
                  </button>
                  <span className="text-gray-600 text-[10px]">•</span>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenSettingsGroups({
                        manutencao: false,
                        contrato: false,
                        notificacoes: false,
                        whatsapp: false,
                        sistema: false
                      })
                    }
                    className="text-[10px] font-bold text-gray-400 hover:text-white cursor-pointer"
                  >
                    Recolher tudo
                  </button>
                </div>
              </div>

              {/* GRUPO 1: MANUTENÇÃO & ODÔMETRO */}
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.03] overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSettingsGroup('manutencao')}
                  className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-amber-500/[0.07] transition-colors cursor-pointer"
                  id="settings-group-manutencao"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/25 shrink-0">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white flex items-center gap-2">
                        <span>Manutenção & Odômetro</span>
                        {vehiclesNeedingMaint.length > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black">
                            {vehiclesNeedingMaint.length} revisão
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">
                        Alertas de KM, revisões pendentes, disparo de checagem e lote de KM
                      </p>
                    </div>
                  </div>
                  {openSettingsGroups.manutencao ? (
                    <ChevronDown className="w-4 h-4 text-amber-300 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                </button>

                {openSettingsGroups.manutencao && (
                  <div className="p-4 pt-3 border-t border-amber-500/15 space-y-3 bg-black/20">
                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-white">
                            Chave Geral de Notificações de Manutenção
                          </p>
                          <p className="text-[11px] text-gray-400 leading-relaxed">
                            Emite alertas na barra de notificações quando a KM atual do veículo atingir o limite configurado.
                          </p>
                        </div>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={maintNotificationsEnabled}
                          onClick={() => {
                            if (!maintNotificationsEnabled && permissionState !== 'granted') {
                              handleRequestPermission();
                            } else {
                              onToggleMaintNotifications(!maintNotificationsEnabled);
                            }
                          }}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            maintNotificationsEnabled && permissionState === 'granted' ? 'bg-emerald-500' : 'bg-gray-700'
                          }`}
                          id="toggle-maint-notifications"
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              maintNotificationsEnabled && permissionState === 'granted' ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] text-gray-400">
                          Veículos com revisão pendente:{' '}
                          <strong className="text-amber-400">{vehiclesNeedingMaint.length}</strong>
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          {onOpenBatchOdometer && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onOpenBatchOdometer();
                              }}
                              className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 font-bold text-[11px] rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Gauge className="w-3.5 h-3.5" />
                              <span>Modo Odômetro (Lote)</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={onTriggerMaintNotificationCheck}
                            className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 font-bold text-[11px] rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Disparar verificação e notificação das escolhas ativas agora"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                            <span>Verificar Alertas Ativos</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* GRUPO 2: CONTRATOS, LOCADOR & TAXAS PADRÃO */}
              <div className="rounded-2xl border border-blue-500/25 bg-blue-500/[0.03] overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSettingsGroup('contrato')}
                  className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-blue-500/[0.07] transition-colors cursor-pointer"
                  id="settings-group-contrato"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-blue-500/15 text-blue-300 border border-blue-500/25 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white">Contratos, Locador & Taxas</p>
                      <p className="text-[10px] text-gray-400 truncate">
                        Editor de cláusulas, dados do locador, chave PIX, juros e multas
                      </p>
                    </div>
                  </div>
                  {openSettingsGroups.contrato ? (
                    <ChevronDown className="w-4 h-4 text-blue-300 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                </button>

                {openSettingsGroups.contrato && (
                  <div className="p-4 pt-3 border-t border-blue-500/15 space-y-4 bg-black/20">
                    <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25">
                      <div>
                        <p className="text-xs font-bold text-white">Editor de Cláusulas e Modelo de Contrato</p>
                        <p className="text-[10px] text-gray-400">Edite qualquer cláusula jurídica ou o texto completo do contrato.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenContractEditor) {
                            onClose();
                            onOpenContractEditor();
                          } else {
                            setMainTab('contract');
                          }
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Abrir Editor de Contrato</span>
                      </button>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-4">
                      <p className="text-[11px] text-gray-400 leading-relaxed">
                        Personalize os dados do Locador exibidos nos contratos gerados e as taxas padrão para juros de mora e multas.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                            Nome Completo do Locador
                          </label>
                          <input
                            type="text"
                            value={landlordName}
                            onChange={(e) => handleUpdateLandlordField('fleet_landlord_name', e.target.value)}
                            placeholder="Ex: CLAUDIO OLIVEIRA DA SILVA"
                            className="w-full bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-blue-500/50 text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                            CPF do Locador
                          </label>
                          <input
                            type="text"
                            value={landlordCpfCnpj}
                            onChange={(e) => handleUpdateLandlordField('fleet_landlord_cpf', e.target.value)}
                            placeholder="Ex: 065.426.576-30"
                            className="w-full bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden focus:border-blue-500/50 text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                            RG do Locador
                          </label>
                          <input
                            type="text"
                            value={landlordRg}
                            onChange={(e) => handleUpdateLandlordField('fleet_landlord_rg', e.target.value)}
                            placeholder="Ex: 39.508.321-7"
                            className="w-full bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden focus:border-blue-500/50 text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                            Telefone / WhatsApp do Locador
                          </label>
                          <input
                            type="text"
                            value={landlordPhone}
                            onChange={(e) => handleUpdateLandlordField('fleet_landlord_phone', e.target.value)}
                            placeholder="Ex: (11) 95329-2570"
                            className="w-full bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden focus:border-blue-500/50 text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                            Chave PIX para Recebimento
                          </label>
                          <input
                            type="text"
                            value={pixKey}
                            onChange={(e) => handleUpdateLandlordField('fleet_landlord_pix', e.target.value)}
                            placeholder="Ex: 11953292570"
                            className="w-full bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden focus:border-blue-500/50 text-xs"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                            Endereço do Locador
                          </label>
                          <input
                            type="text"
                            value={landlordAddress}
                            onChange={(e) => handleUpdateLandlordField('fleet_landlord_address', e.target.value)}
                            placeholder="Ex: Rua Manuel Leiroz, 230, apto 1306 - Cangaíba, São Paulo/SP"
                            className="w-full bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-blue-500/50 text-xs"
                          />
                        </div>

                        <div className="border-t border-white/5 sm:col-span-2 my-1" />

                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                            Multa de Atraso Padrão (%)
                          </label>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            value={fineRate}
                            onChange={(e) => handleUpdateRateField('fleet_fine_rate_default', Number(e.target.value))}
                            className="w-full bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden focus:border-blue-500/50 text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                            Juros Diário Padrão (% / dia)
                          </label>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            value={interestRate}
                            onChange={(e) => handleUpdateRateField('fleet_daily_interest_rate_default', Number(e.target.value))}
                            className="w-full bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden focus:border-blue-500/50 text-xs"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                            Multa Rescisória s/ Dias Faltantes (%)
                          </label>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            value={earlyFineRate}
                            onChange={(e) => handleUpdateRateField('fleet_early_return_fine_rate_default', Number(e.target.value))}
                            className="w-full bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden focus:border-blue-500/50 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* GRUPO 3: NOTIFICAÇÕES & VISTORIA SEMANAL */}
              <div className="rounded-2xl border border-purple-500/25 bg-purple-500/[0.03] overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSettingsGroup('notificacoes')}
                  className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-purple-500/[0.07] transition-colors cursor-pointer"
                  id="settings-group-notificacoes"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/25 shrink-0">
                      <ListChecks className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white flex items-center gap-2">
                        <span>Notificações & Vistoria Semanal</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold">
                          {enabledCount}/{NOTIFICATION_OPTIONS.length} ativas
                        </span>
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">
                        Escolher alertas do app, testar envio push e vistoria de sexta-feira
                      </p>
                    </div>
                  </div>
                  {openSettingsGroups.notificacoes ? (
                    <ChevronDown className="w-4 h-4 text-purple-300 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                </button>

                {openSettingsGroups.notificacoes && (
                  <div className="p-4 pt-3 border-t border-purple-500/15 space-y-4 bg-black/20">
                    {/* Lembrete de Vistoria Semanal */}
                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-white">
                            Lembretes Programados de Vistoria (Qua / Qui / Sex)
                          </p>
                          <p className="text-[11px] text-gray-400 leading-relaxed">
                            Notificações push na <strong>Quarta</strong> (10h e 16h), <strong>Quinta</strong> (11h e 20h) e <strong>Sexta-feira</strong> (10h, 13h e 17h) lembrando de solicitar vistorias.
                          </p>
                        </div>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={!disableFridayReminder}
                          onClick={() => {
                            const nextDisabled = !disableFridayReminder;
                            onToggleFridayReminder(nextDisabled);
                            const updated = { ...notifPrefs, vistoria_friday: !nextDisabled };
                            setNotifPrefs(updated);
                            setNotificationPreferences(updated);
                          }}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            !disableFridayReminder ? 'bg-emerald-500' : 'bg-gray-700'
                          }`}
                          id="toggle-friday-reminder"
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              !disableFridayReminder ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[11px] text-gray-400">Status:</span>
                        {!disableFridayReminder ? (
                          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Bell className="w-3 h-3 text-emerald-400" /> Ativado
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <BellOff className="w-3 h-3 text-rose-400" /> Desativado
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Central de Escolha das Notificações */}
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                          <ListChecks className="w-4 h-4 text-emerald-400" />
                          <span>Escolher Notificações ({enabledCount}/{NOTIFICATION_OPTIONS.length})</span>
                        </h3>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSelectAllNotifs(true)}
                            className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                          >
                            Ativar Todas ({NOTIFICATION_OPTIONS.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectAllNotifs(false)}
                            className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                          >
                            Desativar Todas
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                              selectedCategory === cat
                                ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                                : 'bg-white/5 text-gray-400 hover:text-white border-white/10'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                        {filteredOptions.map((item) => {
                          const isEnabled = notifPrefs[item.key] !== false;
                          return (
                            <div
                              key={item.key}
                              className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                                isEnabled
                                  ? 'bg-emerald-500/[0.06] border-emerald-500/25'
                                  : 'bg-white/[0.02] border-white/10 opacity-70'
                              }`}
                            >
                              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                <button
                                  type="button"
                                  onClick={() => handleToggleEventPref(item.key)}
                                  className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-all shrink-0 cursor-pointer ${
                                    isEnabled
                                      ? 'bg-emerald-500 border-emerald-400 text-black font-bold'
                                      : 'bg-black/40 border-white/20 text-transparent'
                                  }`}
                                  title={isEnabled ? 'Desmarcar esta notificação' : 'Marcar esta notificação'}
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </button>

                                <div className="space-y-0.5 min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-white/10 text-gray-300">
                                      #{String(item.number).padStart(2, '0')}
                                    </span>
                                    <span className="text-xs font-bold text-white">
                                      {item.title}
                                    </span>
                                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">
                                      {item.category}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-gray-400 leading-snug">
                                    {item.description}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const granted = await requestNotificationPermission();
                                    if (granted) {
                                      setPermissionState('granted');
                                      await sendAppNotification(item.sampleTitle, {
                                        body: item.sampleBody,
                                        force: true
                                      });
                                    }
                                  }}
                                  className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/35 border border-blue-500/30 text-blue-300 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                  title="Testar o envio desta notificação agora na barra do celular"
                                >
                                  <Play className="w-2.5 h-2.5 fill-current" />
                                  <span>Testar</span>
                                </button>

                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={isEnabled}
                                  onClick={() => handleToggleEventPref(item.key)}
                                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    isEnabled ? 'bg-emerald-500' : 'bg-gray-700'
                                  }`}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                      isEnabled ? 'translate-x-4' : 'translate-x-0'
                                    }`}
                                  />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* GRUPO 4: MENSAGENS DO WHATSAPP & SUPORTE */}
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.03] overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSettingsGroup('whatsapp')}
                  className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-emerald-500/[0.07] transition-colors cursor-pointer"
                  id="settings-group-whatsapp"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 shrink-0">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white">Comunicação & Suporte WhatsApp</p>
                      <p className="text-[10px] text-gray-400 truncate">
                        Templates de cobrança/renovação e canal de atendimento técnico
                      </p>
                    </div>
                  </div>
                  {openSettingsGroups.whatsapp ? (
                    <ChevronDown className="w-4 h-4 text-emerald-300 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                </button>

                {openSettingsGroups.whatsapp && (
                  <div className="p-4 pt-3 border-t border-emerald-500/15 space-y-3 bg-black/20">
                    <button
                      type="button"
                      onClick={() => {
                        setWaTemplates(getAllWhatsAppTemplates());
                        setIsWhatsAppTemplatesOpen(true);
                      }}
                      className="w-full px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Configurar Templates de Mensagens do WhatsApp</span>
                    </button>

                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2.5">
                      <p className="text-[11px] text-gray-400 leading-relaxed">
                        Precisa de suporte técnico, tirar dúvidas ou enviar sugestões para o aplicativo Gestão de Frota?
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const phone = '5511953292570';
                          const text = 'Olá! Gostaria de suporte / enviar uma sugestão para o aplicativo Gestão de Frota: ';
                          const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
                          window.open(url, '_blank');
                        }}
                        className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
                      >
                        <MessageCircle className="w-4 h-4 text-white shrink-0" />
                        <span>Abrir Suporte no WhatsApp</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* GRUPO 5: SISTEMA, BATERIA & PERMISSÕES DO DISPOSITIVO */}
              <div className="rounded-2xl border border-sky-500/25 bg-sky-500/[0.03] overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSettingsGroup('sistema')}
                  className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-sky-500/[0.07] transition-colors cursor-pointer"
                  id="settings-group-sistema"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-sky-500/15 text-sky-300 border border-sky-500/25 shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white">Sistema, Bateria & Permissões</p>
                      <p className="text-[10px] text-gray-400 truncate">
                        Permissão de push, segundo plano (bateria), câmera, memória e GPS
                      </p>
                    </div>
                  </div>
                  {openSettingsGroups.sistema ? (
                    <ChevronDown className="w-4 h-4 text-sky-300 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                </button>

                {openSettingsGroups.sistema && (
                  <div className="p-4 pt-3 border-t border-sky-500/15 space-y-3 bg-black/20">
                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-3">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-400">Permissão de Notificações Push:</span>
                        {permissionState === 'granted' ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Concedida
                          </span>
                        ) : permissionState === 'denied' ? (
                          <span className="text-rose-400 font-bold flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                            <AlertTriangle className="w-3 h-3" /> Bloqueada
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleRequestPermission}
                            className="text-blue-400 hover:text-blue-300 font-bold bg-blue-600/20 hover:bg-blue-600/30 px-2.5 py-1 rounded-md border border-blue-500/30 transition-all cursor-pointer"
                          >
                            Permitir Notificações
                          </button>
                        )}
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-white/5">
                        <span className="text-[11px] text-gray-400">
                          Funcionamento com App Fechado:
                        </span>
                        <button
                          type="button"
                          onClick={async () => {
                            await requestIgnoreBatteryOptimization();
                            alert('⚡ Configuração de bateria/alarmes acionada. Garanta que o aplicativo esteja marcado como "Sem restrições / Ignorar otimização" para disparar com o app fechado.');
                          }}
                          className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-bold text-[11px] rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                          title="Permitir execução em segundo plano sem suspensão de bateria"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Ignorar Otimização de Bateria</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-3">
                      <p className="text-[11px] text-gray-400 leading-relaxed">
                        Conceda permissões para que o aplicativo acesse câmera (vistorias), memória interna (backups) e localização.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                              navigator.mediaDevices.getUserMedia({ video: true })
                                .then((stream) => {
                                  stream.getTracks().forEach(t => t.stop());
                                  alert('✅ Permissão de Câmera concedida com sucesso!');
                                })
                                .catch(() => alert('⚠️ Permissão de Câmera negada ou indisponível nas configurações do aparelho.'));
                            } else {
                              alert('Câmera suportada via formulários de vistoria do app.');
                            }
                          }}
                          className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <Camera className="w-4 h-4 text-blue-400 shrink-0" />
                          <span>Câmera</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            alert('✅ Permissões de Memória Interna e Arquivos ativadas com sucesso! O aplicativo está autorizado a gerar e exportar backups.');
                          }}
                          className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Memória</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (navigator.geolocation) {
                              navigator.geolocation.getCurrentPosition(
                                () => alert('✅ Permissão de Localização concedida com sucesso!'),
                                () => alert('⚠️ Permissão de Localização negada ou indisponível.')
                              );
                            } else {
                              alert('Geolocalização não suportada neste ambiente.');
                            }
                          }}
                          className="px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <MapPin className="w-4 h-4 text-purple-400 shrink-0" />
                          <span>Localização</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: EDIÇÃO DE CLÁUSULAS DO CONTRATO */}
          {(mainTab as any) === 'contract' && (
            <div className="space-y-6 animate-in fade-in duration-150 pb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-600/20 text-rose-400 rounded-xl border border-rose-500/20">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Editor de Cláusulas do Contrato</h3>
                    <p className="text-[11px] text-gray-400">Personalize os termos jurídicos e condições de locação para novos contratos.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleResetClauses}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer"
                >
                  Resetar para Padrão
                </button>
              </div>

              <div className="bg-amber-950/20 border border-amber-500/20 p-3 rounded-xl">
                <p className="text-[10px] text-amber-300 leading-relaxed flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    <strong>Dica de Variáveis:</strong> Você pode usar variáveis como <strong>{"{MARCA_MODELO}"}</strong>, <strong>{"{PLACA}"}</strong>, <strong>{"{VALOR_SEMANAL}"}</strong>, etc. O sistema substituirá automaticamente pelos dados reais do carro e do motorista no momento da geração do PDF.
                  </span>
                </p>
              </div>

              <div className="space-y-4">
                {contractClauses.map((clause) => (
                  <div 
                    key={clause.id} 
                    className={`p-4 rounded-2xl border transition-all ${
                      editingClauseId === clause.id 
                        ? 'bg-rose-500/[0.08] border-rose-500/40 shadow-xl' 
                        : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold bg-white/10 px-2 py-0.5 rounded text-gray-400">
                          {clause.clauseLabel}
                        </span>
                        <h4 className="text-xs font-bold text-white uppercase tracking-tight">{clause.title}</h4>
                      </div>
                      
                      {editingClauseId !== clause.id ? (
                        <button
                          type="button"
                          onClick={() => handleStartEditClause(clause)}
                          className="p-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-all border border-blue-500/30"
                          title="Editar esta cláusula"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => { setEditingClauseId(null); setEditingClauseText(''); }}
                            className="px-2.5 py-1 text-[10px] font-bold text-gray-400 hover:text-white"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveClause}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/10"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Salvar Alteração
                          </button>
                        </div>
                      )}
                    </div>

                    {editingClauseId === clause.id ? (
                      <textarea
                        value={editingClauseText}
                        onChange={(e) => setEditingClauseText(e.target.value)}
                        className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-3 text-xs text-white focus:outline-hidden focus:border-rose-500/50 min-h-[120px] leading-relaxed font-sans resize-y"
                        placeholder="Escreva o texto da cláusula..."
                      />
                    ) : (
                      <p className="text-[11px] text-gray-400 leading-relaxed italic bg-black/20 p-3 rounded-lg border border-white/5">
                        "{clause.text}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: CALENDÁRIO DE ATIVIDADES */}
          {mainTab === 'calendar' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <DashboardCalendar
                vehicles={vehicles}
                maintenanceLogs={maintenanceLogs}
                vistorias={vistorias}
                selectedMonth={selectedMonth ?? new Date().getMonth()}
                selectedYear={selectedYear ?? new Date().getFullYear()}
                onMonthChange={onMonthChange || (() => {})}
                onOpenBatchOdometer={onOpenBatchOdometer}
              />
            </div>
          )}

          {/* TAB 3: GRÁFICOS & BALANÇO */}
          {mainTab === 'charts' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <VisualCharts
                vehicles={vehicles}
                maintenanceLogs={maintenanceLogs}
                expenseLogs={expenseLogs}
                fuelLogs={fuelLogs}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                defaultExpanded={true}
              />
            </div>
          )}

          {/* TAB 4: HISTÓRICO GERAL & TABELAS */}
          {mainTab === 'history' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <HistoryLogs
                vehicles={vehicles}
                fuelLogs={fuelLogs}
                maintenanceLogs={maintenanceLogs}
                expenseLogs={expenseLogs}
                vistorias={vistorias}
                onDeleteFuel={onDeleteFuel}
                onDeleteMaintenance={onDeleteMaintenance || (() => {})}
                onDeleteExpense={onDeleteExpense || (() => {})}
                onDeleteVistoria={onDeleteVistoria}
                onUpdateFuel={onUpdateFuel}
                onUpdateMaintenance={onUpdateMaintenance}
                onUpdateExpense={onUpdateExpense}
                onUpdateVistoria={onUpdateVistoria}
                onClearAllVistorias={onClearAllVistorias}
                onSwitchMaintToExpense={onSwitchMaintToExpense}
                onSwitchExpenseToMaint={onSwitchExpenseToMaint}
                onShowDeleteConfirm={onShowDeleteConfirm}
                defaultExpanded={true}
              />
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-white/10 bg-[#181818] flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all cursor-pointer shadow-md shadow-blue-500/20"
          >
            Salvar e Fechar
          </button>
        </div>

      </div>

      {/* Sub-Modal: Configurações de Mensagens do WhatsApp */}
      {isWhatsAppTemplatesOpen && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setIsWhatsAppTemplatesOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-[#141416] border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden z-[1051] flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-white/10 bg-[#18181c] flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Configurar Mensagens do WhatsApp</h3>
                  <p className="text-[11px] text-gray-400">
                    Personalize os textos automáticos para avisos de pagamento, atraso e renovação.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWhatsAppTemplatesOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {/* Primary Category Tabs */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setWaCoreTab('pagamento');
                    setWaSubKey('lembrete');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    waCoreTab === 'pagamento'
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/20'
                      : 'bg-white/5 text-gray-400 hover:text-white border-white/10'
                  }`}
                >
                  💰 Aviso de Pagamento
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWaCoreTab('atraso');
                    setWaSubKey('atrasado');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    waCoreTab === 'atraso'
                      ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/20'
                      : 'bg-white/5 text-gray-400 hover:text-white border-white/10'
                  }`}
                >
                  ⚠️ Atraso
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWaCoreTab('renovacao');
                    setWaSubKey('renovacao');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    waCoreTab === 'renovacao'
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/20'
                      : 'bg-white/5 text-gray-400 hover:text-white border-white/10'
                  }`}
                >
                  🔄 Renovação
                </button>
              </div>

              {/* Sub-type selector for Pagamento & Atraso */}
              {waCoreTab === 'pagamento' && (
                <div className="flex items-center gap-2 bg-black/30 p-1.5 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setWaSubKey('lembrete')}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      waSubKey === 'lembrete' ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    📅 Lembrete Prévio
                  </button>
                  <button
                    type="button"
                    onClick={() => setWaSubKey('hoje')}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      waSubKey === 'hoje' ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    🔔 Dia do Vencimento (Hoje)
                  </button>
                </div>
              )}

              {waCoreTab === 'atraso' && (
                <div className="flex items-center gap-2 bg-black/30 p-1.5 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setWaSubKey('atrasado')}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      waSubKey === 'atrasado' ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    ⚠️ Atraso Simples
                  </button>
                  <button
                    type="button"
                    onClick={() => setWaSubKey('atrasado_com_juros')}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      waSubKey === 'atrasado_com_juros' ? 'bg-rose-700/40 text-rose-200 border border-rose-500/40' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    📈 Atraso com Juros/Multa
                  </button>
                </div>
              )}

              {/* Clickable Automatic Variables */}
              <div className="space-y-1.5 bg-white/[0.03] p-3 rounded-xl border border-white/10">
                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Variáveis Automáticas (clique para inserir no texto)</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {WHATSAPP_TEMPLATE_VARIABLES.map((v) => (
                    <button
                      key={v.token}
                      type="button"
                      onClick={() => {
                        const textarea = waTextareaRef.current;
                        const currentText = waTemplates[waSubKey] || '';
                        if (textarea) {
                          const start = textarea.selectionStart ?? currentText.length;
                          const end = textarea.selectionEnd ?? currentText.length;
                          const updatedText = currentText.slice(0, start) + v.token + currentText.slice(end);
                          setWaTemplates((prev) => ({ ...prev, [waSubKey]: updatedText }));
                          setTimeout(() => {
                            textarea.focus();
                            textarea.setSelectionRange(start + v.token.length, start + v.token.length);
                          }, 0);
                        } else {
                          setWaTemplates((prev) => ({ ...prev, [waSubKey]: `${currentText}${v.token}` }));
                        }
                      }}
                      className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold transition-all cursor-pointer"
                      title={`Inserir ${v.label} (${v.example})`}
                    >
                      {v.token}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Editor Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">
                    Texto do Template
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const def = resetWhatsAppTemplate(waSubKey);
                      setWaTemplates((prev) => ({ ...prev, [waSubKey]: def }));
                      setWaSavedFeedback('Template restaurado para o padrão!');
                      setTimeout(() => setWaSavedFeedback(null), 2500);
                    }}
                    className="text-[10px] font-bold text-gray-400 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restaurar Padrão</span>
                  </button>
                </div>
                <textarea
                  ref={waTextareaRef}
                  value={waTemplates[waSubKey] || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setWaTemplates((prev) => ({ ...prev, [waSubKey]: val }));
                  }}
                  rows={6}
                  className="w-full bg-black/70 border border-white/15 rounded-xl p-3 text-xs text-white font-mono leading-relaxed focus:outline-hidden focus:border-emerald-500 resize-y"
                  placeholder="Escreva a mensagem personalizada usando {motorista}, {veiculo}, {valor}..."
                />
              </div>

              {/* Live Preview */}
              <div className="space-y-1.5 bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3">
                <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">
                  Pré-visualização da Mensagem
                </span>
                <pre className="text-[11px] text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">
                  {formatWhatsAppTemplateText(
                    waTemplates[waSubKey] || '',
                    vehicles[0]?.driver || 'João Silva',
                    vehicles[0]?.brand || 'Fiat',
                    vehicles[0]?.model || 'Mobi Like',
                    vehicles[0]?.plate || 'ABC-1D23',
                    vehicles[0]?.valorSemanal || vehicles[0]?.valorRecebido || 650,
                    new Date().toISOString().split('T')[0],
                    undefined,
                    vehicles[0]?.id,
                    65,
                    3
                  )}
                </pre>
              </div>

              {waSavedFeedback && (
                <div className="px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center">
                  {waSavedFeedback}
                </div>
              )}
            </div>

            <div className="px-5 py-3.5 border-t border-white/10 bg-[#18181c] flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsWhatsAppTemplatesOpen(false)}
                className="px-3.5 py-2 text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 cursor-pointer"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  saveAllWhatsAppTemplates(waTemplates);
                  setWaSavedFeedback('✅ Templates salvos com sucesso no dispositivo!');
                  setTimeout(() => setWaSavedFeedback(null), 2500);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Templates</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Modal: Lembretes e Tarefas a Fazer (Push + Tela Inicial) */}
      {isRemindersModalOpen && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setIsRemindersModalOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-[#141416] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden z-[1051] flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-white/10 bg-[#18181c] flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/15 text-amber-400 rounded-xl border border-amber-500/30">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Lembretes e Tarefas a Fazer</h3>
                  <p className="text-[11px] text-gray-400">
                    Adicione o que precisa fazer para receber push e ver em destaque na tela inicial.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRemindersModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {/* Form to add/edit reminder */}
              <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 space-y-3">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  <span>{editingReminderId ? 'Editar Lembrete' : 'Novo Lembrete / Algo a Fazer'}</span>
                </h4>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider block">
                    O que você precisa lembrar? *
                  </label>
                  <input
                    type="text"
                    value={reminderTitle}
                    onChange={(e) => setReminderTitle(e.target.value)}
                    placeholder="Ex: Pagar IPVA Onix, Cobrar multa do motorista, Trocar óleo..."
                    className="w-full bg-black/70 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider block">
                    Detalhes / Observação (opcional)
                  </label>
                  <input
                    type="text"
                    value={reminderNotes}
                    onChange={(e) => setReminderNotes(e.target.value)}
                    placeholder="Ex: Ligar antes das 14h ou verificar boleto"
                    className="w-full bg-black/70 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider block">
                      Data do Lembrete *
                    </label>
                    <input
                      type="date"
                      value={reminderDate}
                      onChange={(e) => setReminderDate(e.target.value)}
                      className="w-full bg-black/70 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider block">
                      Horário do Push
                    </label>
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="w-full bg-black/70 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <label className="flex items-center gap-2 text-xs text-gray-200 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={reminderPushEnabled}
                      onChange={(e) => setReminderPushEnabled(e.target.checked)}
                      className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                    />
                    <span>Enviar notificação e Push no celular/navegador</span>
                  </label>

                  <div className="flex items-center gap-2">
                    {editingReminderId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingReminderId(null);
                          setReminderTitle('');
                          setReminderNotes('');
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-white bg-white/5 rounded-xl cursor-pointer"
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        const cleanTitle = reminderTitle.trim();
                        if (!cleanTitle) {
                          setReminderFeedback('⚠️ Digite o título do que deseja lembrar.');
                          return;
                        }
                        if (reminderPushEnabled) {
                          const granted = await requestNotificationPermission();
                          if (granted) setPermissionState('granted');
                        }
                        if (editingReminderId && onUpdateReminder) {
                          const existing = customReminders.find((r) => r.id === editingReminderId);
                          if (existing) {
                            await onUpdateReminder({
                              ...existing,
                              title: cleanTitle,
                              notes: reminderNotes.trim() || undefined,
                              dueDate: reminderDate || new Date().toISOString().split('T')[0],
                              dueTime: reminderTime || '09:00',
                              pushEnabled: reminderPushEnabled,
                              notifiedAt: undefined,
                            });
                          }
                          setEditingReminderId(null);
                          setReminderFeedback('✅ Lembrete atualizado!');
                        } else if (onAddReminder) {
                          await onAddReminder({
                            title: cleanTitle,
                            notes: reminderNotes.trim() || undefined,
                            dueDate: reminderDate || new Date().toISOString().split('T')[0],
                            dueTime: reminderTime || '09:00',
                            pushEnabled: reminderPushEnabled,
                          });
                          setReminderFeedback('✅ Lembrete adicionado na tela inicial e agendado!');
                        }
                        setReminderTitle('');
                        setReminderNotes('');
                        setTimeout(() => setReminderFeedback(null), 3000);
                      }}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{editingReminderId ? 'Salvar Lembrete' : 'Adicionar Lembrete'}</span>
                    </button>
                  </div>
                </div>

                {reminderFeedback && (
                  <div className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                    {reminderFeedback}
                  </div>
                )}
              </div>

              {/* Reminders List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Seus Lembretes ({customReminders.length})</span>
                  <span className="text-[10px] text-amber-300 font-normal">
                    Pendentes aparecem na Tela Inicial
                  </span>
                </h4>

                {customReminders.length === 0 ? (
                  <div className="p-6 text-center rounded-xl bg-white/[0.02] border border-white/10 text-xs text-gray-400">
                    Nenhum lembrete cadastrado ainda. Adicione acima para não esquecer de nenhuma tarefa!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {[...customReminders]
                      .sort((a, b) => {
                        if (a.completed !== b.completed) return a.completed ? 1 : -1;
                        return `${a.dueDate}T${a.dueTime || '09:00'}`.localeCompare(`${b.dueDate}T${b.dueTime || '09:00'}`);
                      })
                      .map((rem) => {
                        const dateBR = rem.dueDate ? new Date(`${rem.dueDate}T12:00:00`).toLocaleDateString('pt-BR') : '';
                        return (
                          <div
                            key={rem.id}
                            className={`p-3 rounded-xl border flex items-start justify-between gap-3 transition-all ${
                              rem.completed
                                ? 'bg-white/[0.02] border-white/10 opacity-60'
                                : 'bg-amber-500/[0.07] border-amber-500/25'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => onToggleReminder?.(rem.id)}
                                className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border shrink-0 cursor-pointer ${
                                  rem.completed
                                    ? 'bg-emerald-500 border-emerald-400 text-black'
                                    : 'bg-black/40 border-amber-400/50 text-transparent hover:border-amber-300'
                                }`}
                                title={rem.completed ? 'Reabrir lembrete' : 'Marcar como concluído'}
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </button>
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <p className={`text-xs font-bold ${rem.completed ? 'line-through text-gray-400' : 'text-white'}`}>
                                  {rem.title}
                                </p>
                                {rem.notes && (
                                  <p className="text-[11px] text-gray-400 leading-snug">{rem.notes}</p>
                                )}
                                <div className="flex items-center gap-2 flex-wrap pt-0.5 text-[10px]">
                                  <span className="font-mono text-amber-300 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {dateBR} {rem.dueTime ? `às ${rem.dueTime}` : ''}
                                  </span>
                                  {rem.pushEnabled && (
                                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 font-semibold">
                                      🔔 Push Ativo
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={async () => {
                                  const granted = await requestNotificationPermission();
                                  if (granted) setPermissionState('granted');
                                  await sendAppNotification(`📌 Lembrete: ${rem.title}`, {
                                    body: rem.notes || `Programado para ${dateBR} ${rem.dueTime || ''}`,
                                    force: true
                                  });
                                }}
                                className="p-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/30 text-blue-300 border border-blue-500/25 cursor-pointer"
                                title="Testar Push deste lembrete agora"
                              >
                                <Play className="w-3 h-3 fill-current" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingReminderId(rem.id);
                                  setReminderTitle(rem.title);
                                  setReminderNotes(rem.notes || '');
                                  setReminderDate(rem.dueDate);
                                  setReminderTime(rem.dueTime || '09:00');
                                  setReminderPushEnabled(rem.pushEnabled);
                                }}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-300 border border-white/10 cursor-pointer"
                                title="Editar"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteReminder?.(rem.id)}
                                className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/25 cursor-pointer"
                                title="Excluir lembrete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-white/10 bg-[#18181c] flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsRemindersModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
