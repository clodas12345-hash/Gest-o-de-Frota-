import React, { useState } from 'react';
import { Vehicle, ExpenseLog, WeeklyPayment, Vistoria, VehicleDocument } from '../types';
import { generateVistoriaPDF } from '../utils/pdfGenerator';
import { 
  Calendar, 
  User, 
  Gauge, 
  Fuel, 
  Edit3, 
  ChevronDown, 
  ChevronUp, 
  DollarSign, 
  TrendingUp, 
  Wallet,
  TrendingDown,
  Trash2,
  Check,
  X,
  Wrench,
  FileText,
  UploadCloud,
  Download,
  Eye,
  Paperclip,
  MessageCircle,
  Send,
  Share2,
  ClipboardCheck,
  Camera,
  CheckSquare,
  Square,
  Clock,
  Plus,
  ShieldCheck,
  MessageSquare,
  XCircle,
  CheckCircle2,
  Bell,
  Building2,
  Lock,
  Archive,
  Layers
} from 'lucide-react';

interface InlineEditProps {
  value: number;
  label: string;
  onSave: (val: number) => void;
  isCurrency?: boolean;
}

const InlineEdit = ({ value, label, onSave, isCurrency = true }: InlineEditProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState<string>(value.toString());

  if (isEditing) {
    return (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <input
          type="number"
          step="any"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          className="w-20 px-1 py-0.5 bg-neutral-800 border border-neutral-700 text-white rounded font-mono text-xs text-right focus:outline-hidden focus:border-blue-500"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setIsEditing(false);
              onSave(Number(tempValue) || 0);
            } else if (e.key === 'Escape') {
              setIsEditing(false);
              setTempValue(value.toString());
            }
          }}
        />
        <button
          onClick={() => {
            setIsEditing(false);
            onSave(Number(tempValue) || 0);
          }}
          className="p-0.5 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30 transition-colors"
        >
          <Check className="w-3 h-3" />
        </button>
        <button
          onClick={() => {
            setIsEditing(false);
            setTempValue(value.toString());
          }}
          className="p-0.5 bg-rose-500/20 text-rose-400 rounded hover:bg-rose-500/30 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        setTempValue(value.toString());
        setIsEditing(true);
      }}
      className="cursor-pointer hover:underline hover:text-white transition-colors border-b border-dashed border-white/20 font-mono text-right font-bold"
      title={label}
    >
      {isCurrency 
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
        : `${new Intl.NumberFormat('pt-BR').format(value)} KM`
      }
    </span>
  );
};

interface InlineTextEditProps {
  value: string;
  label: string;
  onSave: (val: string) => void;
  placeholder?: string;
}

const InlineTextEdit = ({ value, label, onSave, placeholder }: InlineTextEditProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState<string>(value);

  if (isEditing) {
    return (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <input
          type="text"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value ? e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) : '')}
          placeholder={placeholder}
          className="w-32 px-2 py-0.5 bg-neutral-800 border border-neutral-700 text-white rounded font-sans text-xs focus:outline-hidden focus:border-blue-500"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setIsEditing(false);
              onSave(tempValue || '');
            } else if (e.key === 'Escape') {
              setIsEditing(false);
              setTempValue(value);
            }
          }}
          onBlur={() => {
            setIsEditing(false);
            onSave(tempValue || '');
          }}
        />
      </div>
    );
  }

  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        setTempValue(value);
        setIsEditing(true);
      }}
      className="cursor-pointer hover:underline hover:text-white transition-colors border-b border-dashed border-white/20 text-gray-300 font-medium"
      title={`Editar nome`}
    >
      {value || placeholder || 'Outros custos'}
    </span>
  );
};

interface InlineDateEditProps {
  value: string;
  onSave: (val: string) => void;
}

const InlineDateEdit = ({ value, onSave }: InlineDateEditProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState<string>(value || '');

  if (isEditing) {
    return (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <input
          type="date"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          className="px-1 py-0.5 bg-neutral-800 border border-neutral-700 text-white rounded font-mono text-xs focus:outline-hidden focus:border-blue-500 scheme-dark"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setIsEditing(false);
              onSave(tempValue);
            } else if (e.key === 'Escape') {
              setIsEditing(false);
              setTempValue(value || '');
            }
          }}
          onBlur={() => {
            setIsEditing(false);
            onSave(tempValue);
          }}
        />
      </div>
    );
  }

  const displayDate = value ? new Date(value + 'T12:00:00').toLocaleDateString('pt-BR') : 'Sem término (Livre)';

  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        setTempValue(value || '');
        setIsEditing(true);
      }}
      className="cursor-pointer hover:underline hover:text-white transition-colors border-b border-dashed border-white/20 font-mono text-right font-bold text-xs text-white"
      title="Alterar data"
    >
      {displayDate}
    </span>
  );
};

const getNextWeekDate = (baseDateStr?: string): string => {
  if (!baseDateStr) return '';
  const parts = baseDateStr.split('-');
  if (parts.length === 3) {
    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const day = Number(parts[2]);
    const d = new Date(year, month, day);
    d.setDate(d.getDate() + 7);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }
  return baseDateStr;
};

const formatDateBR = (dateStr?: string): string => {
  if (!dateStr) return 'N/I';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const DEFAULT_SHARE_TEMPLATE = `📋 *LAUDO DE VISTORIA*
🚗 *Veículo:* {veiculo}
🏷️ *Placa:* {placa}
👤 *Locatário:* {locatario}
📅 *Data da Vistoria:* {data}

*CHECKLIST DE INSPEÇÃO:*
{checklist}

⚠️ *Observações:* {observacoes}

---
📸 *RETORNO COM FOTOS:*
Para nos enviar fotos das pendências ou de retorno, responda diretamente a esta mensagem anexando as fotos no WhatsApp ou utilize o link abaixo para enviá-las de forma estruturada:
🔗 {link_retorno}`;

const DEFAULT_REQUEST_TEMPLATE = `🔔 *SOLICITAÇÃO DE VISTORIA DO VEÍCULO*

Olá, *{locatario}*!

Por favor, realize a vistoria (*{tipo}*) do veículo *{veiculo}* (Placa: *{placa}*).
📌 *Lembrete:* Vistoria semanal obrigatória (toda Sexta-Feira).
{prazo}
*Itens a serem inspecionados:*
- Pneus e estepe
- Faróis e lanternas
- Estofados e bancos
- Pintura e lataria
- Documentos no veículo (CRLV)
- Nível de combustível
- Limpeza interna e externa
- Triângulo e macaco
- Painel sem luzes de alerta
- Chaves e controles

📸 *RETORNO COM FOTOS:*
Por favor, responda a esta mensagem enviando fotos do painel (odômetro), nível de combustível e das 4 laterais do carro, ou clique no link abaixo para preencher a vistoria e enviar as fotos:
🔗 {link_retorno}`;

const DEFAULT_PAYMENT_TEMPLATES = {
  lembrete: `Olá, *{driver}*! Tudo bem? 😊\n\nPassando para lembrar do pagamento semanal referente ao veículo *{brand} {model}* ({plate}).\n\n💵 *Valor:* R$ {valor}\n📅 *Vencimento:* {data_vencimento}\n\nQualquer dúvida ou caso precise da chave Pix, estou à disposição! Abraços.`,
  hoje: `Olá, *{driver}*! Tudo bem?\n\nLembrete: *Hoje* é o dia do pagamento semanal referente ao veículo *{brand} {model}* ({plate}).\n\n💵 *Valor:* R$ {valor}\n🗓️ *Vencimento:* Hoje ({data_vencimento})\n\nPor favor, envie o comprovante assim que realizar a transferência. Agradeço a parceria! 👍`,
  atrasado: `Olá, *{driver}*.\n\nIdentificamos que o pagamento semanal referente ao veículo *{brand} {model}* ({plate}) com vencimento em *{data_vencimento}* consta em **atraso**.\n\n⚠️ *Valor em aberto:* R$ {valor}\n\nPedimos a gentileza de regularizar o pagamento ou entrar em contato conosco o quanto antes para evitarmos pendências.\n\nFicamos no aguardo do comprovante. Obrigado!`
};

const formatPaymentTemplateText = (
  template: string,
  driverName: string,
  brand: string,
  model: string,
  plate: string,
  amount: number,
  dueDateStr: string
) => {
  const formattedAmount = amount ? amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00';
  let formattedDate = 'Hoje';
  if (dueDateStr) {
    const parts = dueDateStr.split('-');
    if (parts.length === 3) {
      formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }

  return template
    .replace(/\{driver\}/g, driverName || 'Locatário')
    .replace(/\{brand\}/g, brand || 'Veículo')
    .replace(/\{model\}/g, model || '')
    .replace(/\{plate\}/g, plate || '')
    .replace(/\{valor\}/g, formattedAmount)
    .replace(/\{data_vencimento\}/g, formattedDate);
};

interface VehicleCardProps {
  vehicle: Vehicle;
  vehicleExpenses: ExpenseLog[];
  onEdit: (vehicle: Vehicle) => void;
  onUpdateVehicle: (updatedVehicle: Vehicle) => void;
  onAddExpense: (description: string, date: string, cost: number) => void;
  onDeleteExpense: (expenseId: string) => void;
  onDeleteVehicle: (id: string) => void;
  selectedMonth?: number;
  selectedYear?: number;
  vistorias?: Vistoria[];
  checklistConfig?: string[];
  onUpdateChecklistConfig?: (config: string[]) => void;
  onSaveVistoria?: (vistoria: Vistoria) => void;
  onDeleteVistoria?: (id: string) => void;
  onDeleteAllVistorias?: (vehicleId: string) => void;
  onOpenAgenda?: (defaultName?: string, defaultPhone?: string) => void;
  onOpenRentalContract?: (vehicle: Vehicle) => void;
  onFinalizeContract?: (vehicle: Vehicle) => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  vehicleExpenses,
  onEdit,
  onUpdateVehicle,
  onAddExpense,
  onDeleteExpense,
  onDeleteVehicle,
  selectedMonth,
  selectedYear,
  vistorias = [],
  checklistConfig = [],
  onUpdateChecklistConfig,
  onSaveVistoria,
  onDeleteVistoria,
  onDeleteAllVistorias,
  onOpenAgenda,
  onOpenRentalContract,
  onFinalizeContract,
}) => {
  const [isExpanded, setIsExpanded] = useState(false); // Default to collapsed/closed as requested by user
  const [isCaucaoExpanded, setIsCaucaoExpanded] = useState(true); // Visible by default
  const [isContractExpanded, setIsContractExpanded] = useState(false); // Hidden by default
  const [isAgendaExpanded, setIsAgendaExpanded] = useState(false); // Hidden by default when expanding vehicle
  const [isVistoriaExpanded, setIsVistoriaExpanded] = useState(false); // Hidden by default when expanding vehicle
  const [isDocExpanded, setIsDocExpanded] = useState(false); // Hidden by default when expanding vehicle
  
  // Custom event listener to expand and focus vehicle when clicked anywhere
  React.useEffect(() => {
    const handleFocus = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.vehicleId === vehicle.id) {
        setIsExpanded(true);
        setTimeout(() => {
          const el = document.getElementById(`vehicle-card-container-${vehicle.id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-2', 'ring-blue-500', 'shadow-[0_0_20px_rgba(59,130,246,0.3)]');
            setTimeout(() => {
              el.classList.remove('ring-2', 'ring-blue-500', 'shadow-[0_0_20px_rgba(59,130,246,0.3)]');
            }, 2500);
          }
        }, 150);
      }
    };
    window.addEventListener('focus-vehicle', handleFocus);
    return () => window.removeEventListener('focus-vehicle', handleFocus);
  }, [vehicle.id]);
  
  // Weekly payment form state
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPaymentDate, setNewPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newPaymentAmount, setNewPaymentAmount] = useState<number>(0);

  // Payment WhatsApp Reminder State
  const [showPaymentWhatsApp, setShowPaymentWhatsApp] = useState(false);
  const [paymentWhatsAppType, setPaymentWhatsAppType] = useState<'lembrete' | 'hoje' | 'atrasado'>('lembrete');
  const [paymentWhatsAppPhone, setPaymentWhatsAppPhone] = useState(() => vehicle.driverPhone || '');
  const [paymentWhatsAppAmount, setPaymentWhatsAppAmount] = useState<number>(() => vehicle.valorSemanal || vehicle.valorRecebido || 0);
  const [paymentWhatsAppDueDate, setPaymentWhatsAppDueDate] = useState<string>(() => {
    return vehicle.startDate ? getNextWeekDate(vehicle.startDate) : new Date().toISOString().split('T')[0];
  });
  const [customPaymentMsgText, setCustomPaymentMsgText] = useState('');
  const [paymentTemplateSavedStatus, setPaymentTemplateSavedStatus] = useState<string | null>(null);

  // Maintenance WhatsApp Reminder State & Templates
  const [showMaintenanceWhatsApp, setShowMaintenanceWhatsApp] = useState(false);
  const [maintenanceWhatsAppType, setMaintenanceWhatsAppType] = useState<'proxima' | 'vencida' | 'agendada'>('proxima');
  const [maintenanceWhatsAppPhone, setMaintenanceWhatsAppPhone] = useState(() => vehicle.driverPhone || '');
  const [customMaintenanceMsgText, setCustomMaintenanceMsgText] = useState('');
  const [maintenanceTemplateSavedStatus, setMaintenanceTemplateSavedStatus] = useState<string | null>(null);

  const DEFAULT_MAINTENANCE_TEMPLATES = {
    proxima: `🚗 *LEMBRETE DE REVISÃO PREVENTIVA*\n\nOlá, *{driver}*! Tudo bem?\n\nPassando para lembrar que o veículo *{brand} {model}* (Placa: *{plate}*) está se aproximando da quilometragem recomendada para revisão preventiva.\n\n📊 *KM Atual:* {current_km} KM\n⚙️ *Próxima Revisão:* {next_km} KM\n\nPor favor, agende sua manutenção para garantirmos a segurança e a revisão em dia. Qualquer dúvida estamos à disposição!`,
    vencida: `🚨 *ALERTA: MANUTENÇÃO PREVENTIVA VENCIDA*\n\nOlá, *{driver}*.\n\nIdentificamos que o veículo *{brand} {model}* (Placa: *{plate}*) **ultrapassou** a quilometragem recomendada para revisão preventiva!\n\n📊 *KM Atual:* {current_km} KM\n⚠️ *KM Limite:* {next_km} KM\n\nPedimos a gentileza de entrar em contato conosco urgentemente para regularizarmos a manutenção do veículo.\n\nAgradecemos a atenção!`,
    agendada: `🔧 *AGENDAMENTO DE MANUTENÇÃO PREVENTIVA*\n\nOlá, *{driver}*! Tudo bem?\n\nLembramos que o veículo *{brand} {model}* (Placa: *{plate}*) possui manutenção preventiva agendada para a data *{maint_date}*.\n\nContamos com sua pontualidade para a realização dos serviços. Abraços!`
  };

  const formatMaintenanceTemplateText = (
    template: string,
    driverName: string,
    brand: string,
    model: string,
    plate: string,
    curKm: number,
    nextKm: number,
    maintDate: string
  ) => {
    let formattedDate = 'A definir';
    if (maintDate) {
      const parts = maintDate.split('-');
      if (parts.length === 3) {
        formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    return template
      .replace(/\{driver\}/g, driverName || 'Locatário')
      .replace(/\{brand\}/g, brand || 'Veículo')
      .replace(/\{model\}/g, model || '')
      .replace(/\{plate\}/g, plate || '')
      .replace(/\{current_km\}/g, curKm ? curKm.toLocaleString('pt-BR') : '0')
      .replace(/\{next_km\}/g, nextKm ? nextKm.toLocaleString('pt-BR') : '0')
      .replace(/\{maint_date\}/g, formattedDate);
  };

  React.useEffect(() => {
    if (vehicle.driverPhone) setPaymentWhatsAppPhone(vehicle.driverPhone);
    if (vehicle.valorSemanal) {
      setPaymentWhatsAppAmount(vehicle.valorSemanal);
    } else if (vehicle.valorRecebido) {
      setPaymentWhatsAppAmount(vehicle.valorRecebido);
    }
    if (vehicle.startDate) {
      const nextDue = getNextWeekDate(vehicle.startDate);
      setPaymentWhatsAppDueDate(nextDue);
      setNewPaymentDate(nextDue);
    }
  }, [vehicle.driverPhone, vehicle.valorSemanal, vehicle.valorRecebido, vehicle.startDate]);

  // Expense form state
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseType, setExpenseType] = useState<'eventual' | 'fixa'>('eventual');
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseDate, setNewExpenseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newExpenseAmount, setNewExpenseAmount] = useState<number>(0);
  const [isExpenseParcelado, setIsExpenseParcelado] = useState<boolean>(false);
  const [expenseInstallments, setExpenseInstallments] = useState<number>(2);
  const [expenseInstallmentMode, setExpenseInstallmentMode] = useState<'total' | 'parcela'>('total');

  // Parcelas modal state for fixed expenses
  const [parcelasModalData, setParcelasModalData] = useState<{
    isOpen: boolean;
    key: 'financiamento' | 'seguro' | 'ipva' | 'manutencao' | 'custoExtra';
    title: string;
    pagas: number;
    totais: number;
  } | null>(null);

  const openParcelasModal = (
    key: 'financiamento' | 'seguro' | 'ipva' | 'manutencao' | 'custoExtra',
    title: string,
    pagasDefault: number,
    totaisDefault: number
  ) => {
    setParcelasModalData({
      isOpen: true,
      key,
      title,
      pagas: pagasDefault || 0,
      totais: totaisDefault || 12,
    });
  };

  const handleSaveParcelasModal = () => {
    if (!parcelasModalData) return;
    const { key, pagas, totais } = parcelasModalData;
    if (totais < 0 || pagas < 0) {
      alert('Por favor, informe números válidos.');
      return;
    }
    onUpdateVehicle({
      ...vehicle,
      [`${key}ParcelasPagas`]: Number(pagas) || 0,
      [`${key}ParcelasTotais`]: Number(totais) || 0,
    });
    setParcelasModalData(null);
  };

  const handleRemoveParcelasModal = () => {
    if (!parcelasModalData) return;
    const { key } = parcelasModalData;
    onUpdateVehicle({
      ...vehicle,
      [`${key}ParcelasPagas`]: undefined,
      [`${key}ParcelasTotais`]: undefined,
    });
    setParcelasModalData(null);
  };

  // Document manager state
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocCategory, setNewDocCategory] = useState('Contrato');
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [newDocDataUrl, setNewDocDataUrl] = useState('');
  const [newDocSize, setNewDocSize] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [docCategoryFilter, setDocCategoryFilter] = useState('Todos');

  // Vistorias state
  const [showAddVistoria, setShowAddVistoria] = useState(false);
  const [showScheduleVistoria, setShowScheduleVistoria] = useState(false);
  const [scheduleDateInput, setScheduleDateInput] = useState<string>(() => vehicle.nextVistoriaDate || new Date().toISOString().split('T')[0]);
  const [scheduleFeedback, setScheduleFeedback] = useState<string | null>(null);
  const [expandedVistoriaId, setExpandedVistoriaId] = useState<string | null>(null);
  const [newVistoriaType, setNewVistoriaType] = useState<'Entrega de Veículo' | 'Periódica' | 'Devolução de Veículo'>('Periódica');
  const [newVistoriaDate, setNewVistoriaDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const [newVistoriaChecklist, setNewVistoriaChecklist] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (checklistConfig && checklistConfig.length > 0) {
      checklistConfig.forEach(item => {
        initial[item] = true;
      });
    } else {
      initial['Checklist Padrão'] = true;
    }
    return initial;
  });

  const [newVistoriaPhotos, setNewVistoriaPhotos] = useState<string[]>([]);
  const [newVistoriaNotes, setNewVistoriaNotes] = useState('');
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);

  // Live timer ticker for countdowns
  const [now, setNow] = useState<Date>(new Date());
  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // WhatsApp share states
  const [sharingDoc, setSharingDoc] = useState<any | null>(null);
  const [whatsappPhone, setWhatsappPhone] = useState<string>('');
  const [customMsgText, setCustomMsgText] = useState<string>('');
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  // WhatsApp share Vistoria states
  const [sharingVistoria, setSharingVistoria] = useState<Vistoria | null>(null);
  const [isRequestingNewVistoria, setIsRequestingNewVistoria] = useState<boolean>(false);
  const [requestVistoriaType, setRequestVistoriaType] = useState<'Entrega de Veículo' | 'Periódica' | 'Devolução de Veículo'>('Periódica');
  const [whatsappVistoriaPhone, setWhatsappVistoriaPhone] = useState<string>('');
  const [customVistoriaMsgText, setCustomVistoriaMsgText] = useState<string>('');
  const [vistoriaReturnLink, setVistoriaReturnLink] = useState<string>(() => {
    const saved = localStorage.getItem('fleet_vistoria_return_link');
    if (saved && !saved.includes('jotform.com') && !saved.includes('sua-vistoria')) return saved;
    // Default to this application's domain with the vistoria_retorno mode parameter
    const base = window.location.origin + window.location.pathname;
    const defaultUrl = `${base}?mode=vistoria_retorno`;
    localStorage.setItem('fleet_vistoria_return_link', defaultUrl);
    return defaultUrl;
  });

  const [templateSavedStatus, setTemplateSavedStatus] = useState<string | null>(null);

  const formatTemplateText = (templateText: string, isShare: boolean, v: Vistoria | null, reqType?: string) => {
    let text = templateText;
    const typeToUse = reqType || requestVistoriaType || 'Periódica';
    
    const veiculoStr = `${vehicle.brand} ${vehicle.model}`;
    const plateStr = vehicle.plate;
    const driverStr = vehicle.driver || (isShare ? 'Não definido' : 'Locatário');
    
    const separator = vistoriaReturnLink.includes('?') ? '&' : '?';
    const returnUrlWithPlaca = `${vistoriaReturnLink}${separator}placa=${encodeURIComponent(vehicle.plate)}&brand=${encodeURIComponent(vehicle.brand)}&model=${encodeURIComponent(vehicle.model)}&driver=${encodeURIComponent(vehicle.driver || '')}&type=${encodeURIComponent(typeToUse)}&deadline=${encodeURIComponent(vehicle.nextVistoriaDate || '')}`;

    text = text.replace(/{veiculo}/g, veiculoStr);
    text = text.replace(/{placa}/g, plateStr);
    text = text.replace(/{locatario}/g, driverStr);
    text = text.replace(/{tipo}/g, typeToUse);
    text = text.replace(/{link_retorno}/g, returnUrlWithPlaca);
    
    if (isShare && v) {
      const checklistText = Object.entries({
        pneusEstepe: 'Pneus e estepe',
        faroisLanternas: 'Faróis e lanternas',
        estofadosBancos: 'Estofados e bancos',
        pinturaLataria: 'Pintura e lataria',
        documentosVeiculo: 'Documentos no veículo (CRLV)',
        nivelBateria: 'Nível de combustível',
        limpeza: 'Limpeza interna e externa',
        trianguloMacaco: 'Triângulo e macaco',
        painelLuzes: 'Painel sem luzes de alerta',
        chavesControles: 'Chaves e controles',
      })
      .filter(([key]) => Boolean(v.checklist[key as keyof typeof v.checklist]))
      .map(([_, label]) => `✅ ${label}`)
      .join('\n') || 'Nenhum item marcado';
      
      const formattedDate = new Date(v.date + 'T12:00:00').toLocaleDateString('pt-BR');
      const notesText = v.notes || 'Nenhuma';
      
      text = text.replace(/{checklist}/g, checklistText);
      text = text.replace(/{data}/g, formattedDate);
      text = text.replace(/{observacoes}/g, notesText);
    }
    
    if (!isShare) {
      const deadlineStr = vehicle.nextVistoriaDate 
        ? `📅 *Realizar até a data:* ${new Date(vehicle.nextVistoriaDate + 'T12:00:00').toLocaleDateString('pt-BR')}`
        : '';
      text = text.replace(/{prazo}/g, deadlineStr ? `\n⚠️ *Atenção:* ${deadlineStr}\n` : '');
    }
    
    return text;
  };

  const saveTemplateFromText = (text: string, isShare: boolean, v: Vistoria | null) => {
    let template = text;
    
    const escapeRegExp = (string: string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    const veiculoStr = `${vehicle.brand} ${vehicle.model}`;
    const plateStr = vehicle.plate;
    const driverStr = vehicle.driver || (isShare ? 'Não definido' : 'Locatário');
    
    const separator = vistoriaReturnLink.includes('?') ? '&' : '?';
    const returnUrlWithPlaca = `${vistoriaReturnLink}${separator}placa=${encodeURIComponent(vehicle.plate)}&brand=${encodeURIComponent(vehicle.brand)}&model=${encodeURIComponent(vehicle.model)}&driver=${encodeURIComponent(vehicle.driver || '')}&type=${encodeURIComponent(requestVistoriaType)}&deadline=${encodeURIComponent(vehicle.nextVistoriaDate || '')}`;

    // Replace return URL first
    template = template.replace(new RegExp(escapeRegExp(returnUrlWithPlaca), 'g'), '{link_retorno}');
    
    // Replace veiculo
    template = template.replace(new RegExp(escapeRegExp(veiculoStr), 'g'), '{veiculo}');
    
    // Replace plate
    template = template.replace(new RegExp(escapeRegExp(plateStr), 'g'), '{placa}');
    
    // Replace driver
    template = template.replace(new RegExp(escapeRegExp(driverStr), 'g'), '{locatario}');

    // Replace tipo
    template = template.replace(new RegExp(escapeRegExp(requestVistoriaType), 'g'), '{tipo}');
    
    if (isShare && v) {
      const formattedDate = new Date(v.date + 'T12:00:00').toLocaleDateString('pt-BR');
      const notesText = v.notes || 'Nenhuma';
      
      template = template.replace(new RegExp(escapeRegExp(formattedDate), 'g'), '{data}');
      template = template.replace(new RegExp(escapeRegExp(notesText), 'g'), '{observacoes}');
      
      // Replace checklist
      const checklistText = Object.entries({
        pneusEstepe: 'Pneus e estepe',
        faroisLanternas: 'Faróis e lanternas',
        estofadosBancos: 'Estofados e bancos',
        pinturaLataria: 'Pintura e lataria',
        documentosVeiculo: 'Documentos no veículo (CRLV)',
        nivelBateria: 'Nível de combustível',
        limpeza: 'Limpeza interna e externa',
        trianguloMacaco: 'Triângulo e macaco',
        painelLuzes: 'Painel sem luzes de alerta',
        chavesControles: 'Chaves e controles',
      }).map(([key, label]) => {
        const isOk = v.checklist[key as keyof typeof v.checklist];
        return `${isOk ? '✅' : '❌'} ${label}`;
      }).join('\n');
      
      template = template.replace(new RegExp(escapeRegExp(checklistText), 'g'), '{checklist}');
    }
    
    if (!isShare) {
      const deadlineStr = vehicle.nextVistoriaDate 
        ? `📅 *Realizar até a data:* ${new Date(vehicle.nextVistoriaDate + 'T12:00:00').toLocaleDateString('pt-BR')}`
        : '';
      if (deadlineStr) {
        template = template.replace(new RegExp(escapeRegExp(`\n⚠️ *Atenção:* ${deadlineStr}\n`), 'g'), '{prazo}');
        template = template.replace(new RegExp(escapeRegExp(deadlineStr), 'g'), '{prazo}');
      }
    }
    
    const key = isShare ? 'fleet_vistoria_share_template' : 'fleet_vistoria_request_template';
    localStorage.setItem(key, template);
    
    setTemplateSavedStatus('Modelo salvo como padrão!');
    setTimeout(() => setTemplateSavedStatus(null), 3000);
  };

  // Formatter for Currency
  const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Helper to parse installment info from description like "(1/12)" or "1/12"
  const parseInstallmentInfo = (description: string) => {
    if (!description) return null;
    const match = description.match(/\(\s*(\d+)\s*[\/]\s*(\d+)\s*\)/) || description.match(/\b(\d+)\s*[\/]\s*(\d+)\b/);
    if (match) {
      const pagas = parseInt(match[1], 10);
      const total = parseInt(match[2], 10);
      if (!isNaN(pagas) && !isNaN(total) && total >= pagas && total > 0) {
        const faltam = total - pagas;
        return { pagas, total, faltam };
      }
    }
    return null;
  };

  // Helper to check if a date string belongs to current month and year
  const currentMonth = selectedMonth !== undefined ? selectedMonth : 7; // 7 (0-indexed, August)
  const currentYear = selectedYear !== undefined ? selectedYear : 2026; // 2026

  const isCurrentMonth = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr + 'T12:00:00');
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  };

  // Sum up weekly payments for the current month
  const totalWeeklyReceivedInCurrentMonth = (vehicle.weeklyPayments || [])
    .filter((wp) => isCurrentMonth(wp.date))
    .reduce((sum, wp) => sum + wp.amount, 0);

  // Financial fields
  // If there are weekly payments in the current month, they automatically sum up to become the "Valor Recebido".
  // Otherwise, it falls back to the manually edited/saved vehicle.valorRecebido.
  const hasWeeklyPaymentsInCurrentMonth = (vehicle.weeklyPayments || [])
    .some((wp) => isCurrentMonth(wp.date));

  const valorRecebido = hasWeeklyPaymentsInCurrentMonth 
    ? totalWeeklyReceivedInCurrentMonth 
    : (vehicle.valorRecebido || 0);

  const financiamento = vehicle.financiamento || 0;
  const seguro = vehicle.seguro || 0;
  const ipva = vehicle.ipva || 0;
  const manutencaoPreventiva = vehicle.manutencaoPreventiva || 0;
  const custoExtra = vehicle.custoExtra || 0;
  const custoExtraLabel = vehicle.custoExtraLabel || 'Outros Custos';

  const totalDespesasFixas = financiamento + seguro + ipva + manutencaoPreventiva;
  
  // Eventual expenses total (sum of expense logs in current month)
  const totalDespesasEventuais = vehicleExpenses
    .filter((e) => isCurrentMonth(e.date))
    .reduce((sum, e) => sum + e.cost, 0);

  // Revision countdown logic (when 3 days or less remaining)
  const getRevisionCountdown = () => {
    if (!vehicle.preventiveMaintDate) return null;
    const target = new Date(vehicle.preventiveMaintDate + 'T00:00:00');
    const diffMs = target.getTime() - now.getTime();
    const totalSeconds = Math.floor(diffMs / 1000);

    const todayAtMidnight = new Date(now);
    todayAtMidnight.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((target.getTime() - todayAtMidnight.getTime()) / (1000 * 60 * 60 * 24));

    if (totalSeconds < 0) {
      const absSec = Math.abs(totalSeconds);
      const daysOverdue = Math.floor(absSec / (3600 * 24));
      return {
        days: diffDays,
        isOverdue: true,
        isWithin3Days: true,
        text: daysOverdue === 0 ? 'VENCE HOJE' : `VENCIDA HÁ ${daysOverdue}d`
      };
    }

    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => String(n).padStart(2, '0');

    return {
      days: diffDays,
      isOverdue: false,
      isWithin3Days: diffDays <= 3,
      text: days > 0 
        ? `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`
        : `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`
    };
  };

  const revCountdown = getRevisionCountdown();

  const vehicleVistorias = vistorias.filter((v) => v.vehicleId === vehicle.id);
  const hasCompletedVistoria = vehicleVistorias.length > 0 || (vehicle.documents || []).some((d) => d.category === 'Vistoria');

  // Derived documents filtered list
  const filteredDocs = (vehicle.documents || []).filter((doc) => {
    if (docCategoryFilter === 'Todos') return true;
    if (docCategoryFilter === 'Outros') {
      return doc.category === 'Outros' || !['Contrato', 'CRLV', 'Vistoria', 'Comprovante'].includes(doc.category);
    }
    return doc.category === docCategoryFilter;
  });

  // Total received from weekly payments for the current month
  const totalWeeklyReceived = (vehicle.weeklyPayments || [])
    .filter((wp) => isCurrentMonth(wp.date))
    .reduce((sum, wp) => sum + wp.amount, 0);

  // Total despesas (Fixas + Custo Extra + Eventuais)
  const totalDespesas = totalDespesasFixas + custoExtra + totalDespesasEventuais;

  // Calculation of surplus:
  // "depois abate o valor recebido pra saber quanto sobra"
  const sobra = valorRecebido - totalDespesas;

  // Handle inline updates
  const handleUpdateField = (field: keyof Vehicle, val: any) => {
    onUpdateVehicle({
      ...vehicle,
      [field]: val,
    });
  };

  // Weekly payment operations
  const handleAddPayment = () => {
    if (!newPaymentDate || newPaymentAmount <= 0) return;
    const newPayment: WeeklyPayment = {
      id: `wp-${Date.now()}`,
      date: newPaymentDate,
      amount: newPaymentAmount,
    };
    const currentPayments = vehicle.weeklyPayments || [];
    onUpdateVehicle({
      ...vehicle,
      weeklyPayments: [...currentPayments, newPayment],
    });
    setNewPaymentAmount(0);
    setShowAddPayment(false);
  };

  const handleDeletePayment = (id: string) => {
    const currentPayments = vehicle.weeklyPayments || [];
    onUpdateVehicle({
      ...vehicle,
      weeklyPayments: currentPayments.filter((p) => p.id !== id),
    });
  };

  const handleEditPayment = (paymentId: string, newAmount: number) => {
    const currentPayments = vehicle.weeklyPayments || [];
    onUpdateVehicle({
      ...vehicle,
      weeklyPayments: currentPayments.map((p) => p.id === paymentId ? { ...p, amount: newAmount } : p),
    });
  };

  // Local expense operations
  const handleAddExpense = () => {
    if (!newExpenseDesc.trim() || newExpenseAmount <= 0) {
      alert('Por favor, informe a descrição e o valor da despesa.');
      return;
    }
    const dateToUse = newExpenseDate || new Date().toISOString().split('T')[0];

    if (isExpenseParcelado && expenseInstallments > 1) {
      const totalParc = Math.min(Math.max(Number(expenseInstallments) || 2, 2), 60);
      const costPerParcela = expenseInstallmentMode === 'total'
        ? Math.round((newExpenseAmount / totalParc) * 100) / 100
        : newExpenseAmount;

      const dateParts = dateToUse.split('-');
      const baseYear = parseInt(dateParts[0], 10) || new Date().getFullYear();
      const baseMonth = (parseInt(dateParts[1], 10) || 1) - 1; // 0-indexed
      const baseDay = parseInt(dateParts[2], 10) || 1;

      for (let i = 0; i < totalParc; i++) {
        const d = new Date(baseYear, baseMonth + i, baseDay);
        const yStr = d.getFullYear();
        const mStr = String(d.getMonth() + 1).padStart(2, '0');
        const dStr = String(d.getDate()).padStart(2, '0');
        const parcDate = `${yStr}-${mStr}-${dStr}`;

        const descWithParcela = `${newExpenseDesc.trim()} (${i + 1}/${totalParc})`;
        onAddExpense(descWithParcela, parcDate, costPerParcela);
      }
    } else {
      onAddExpense(newExpenseDesc.trim(), dateToUse, newExpenseAmount);
    }

    setNewExpenseDesc('');
    setNewExpenseAmount(0);
    setIsExpenseParcelado(false);
    setExpenseInstallments(2);
    setShowAddExpense(false);
  };

  const handleSaveExpense = () => {
    if (expenseType === 'fixa') {
      if (!newExpenseDesc.trim() || newExpenseAmount <= 0) {
        alert('Por favor, informe a descrição e o valor da despesa fixa.');
        return;
      }
      let monthlyVal = newExpenseAmount;
      if (isExpenseParcelado && expenseInstallments > 1) {
        monthlyVal = expenseInstallmentMode === 'total'
          ? Math.round((newExpenseAmount / expenseInstallments) * 100) / 100
          : newExpenseAmount;
      }
      onUpdateVehicle({
        ...vehicle,
        custoExtra: monthlyVal,
        custoExtraLabel: newExpenseDesc.trim(),
      });
      setNewExpenseDesc('');
      setNewExpenseAmount(0);
      setIsExpenseParcelado(false);
      setShowAddExpense(false);
    } else {
      handleAddExpense();
    }
  };

  // Document Operations
  const handleAddDocSubmit = () => {
    if (!newDocName.trim()) {
      alert('Por favor, informe o nome do documento.');
      return;
    }

    let finalDataUrl = newDocDataUrl;
    let finalSize = newDocSize;
    const finalCat = newDocCategory === 'Outros' && customCategoryName.trim() ? customCategoryName.trim() : newDocCategory;

    // Generate simulated document data URL if no real file was uploaded
    if (!finalDataUrl) {
      const mockText = `Simulado: Documento de ${finalCat}\nVeículo: ${vehicle.brand} ${vehicle.model} (${vehicle.plate})\nNome do Arquivo: ${newDocName}\nData de Emissão: 19/07/2026\nGerado automaticamente pelo Painel de Gestão de Frota.`;
      const blob = new Blob([mockText], { type: 'text/plain' });
      finalDataUrl = URL.createObjectURL(blob);
      finalSize = '12 KB';
    }

    const newDoc = {
      id: `doc-${Date.now()}`,
      name: newDocName.endsWith('.pdf') || newDocName.endsWith('.png') || newDocName.endsWith('.jpg') || newDocName.endsWith('.txt') 
        ? newDocName 
        : `${newDocName}.pdf`,
      category: finalCat,
      uploadDate: new Date().toISOString().split('T')[0],
      fileSize: finalSize || '15 KB',
      fileType: newDocName.toLowerCase().includes('.png') || newDocName.toLowerCase().includes('.jpg') ? 'image' : 'pdf',
      contentUrl: finalDataUrl
    };

    const currentDocs = vehicle.documents || [];
    onUpdateVehicle({
      ...vehicle,
      documents: [...currentDocs, newDoc]
    });

    // Reset state
    setNewDocName('');
    setNewDocCategory('Contrato');
    setCustomCategoryName('');
    setNewDocDataUrl('');
    setNewDocSize('');
    setShowAddDoc(false);
  };

  const handleDeleteDoc = (docId: string) => {
    const docToDelete = (vehicle.documents || []).find((d) => d.id === docId);
    if (docToDelete && docToDelete.category === 'Contrato') {
      alert('Contratos de locação são documentos protegidos e só podem ser removidos ao excluir o veículo do sistema.');
      return;
    }
    const currentDocs = vehicle.documents || [];
    onUpdateVehicle({
      ...vehicle,
      documents: currentDocs.filter((d) => d.id !== docId)
    });
  };

  const handleDownloadDoc = (doc: any) => {
    const link = document.createElement('a');
    if (doc.contentUrl) {
      link.href = doc.contentUrl;
    } else {
      // Fallback for preloaded mock data
      const mockText = `Documento: ${doc.name}\nCategoria: ${doc.category}\nVeículo: ${vehicle.brand} ${vehicle.model} (${vehicle.plate})\nData: ${doc.uploadDate}\nGerado automaticamente para demonstração.`;
      const blob = new Blob([mockText], { type: 'text/plain' });
      link.href = URL.createObjectURL(blob);
    }
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleInitiateShare = (doc: any) => {
    setSharingDoc(doc);
    let rawPhone = vehicle.driverPhone || '';
    if (rawPhone.startsWith('55')) {
      rawPhone = rawPhone.substring(2);
    }
    setWhatsappPhone(rawPhone);
    setCustomMsgText(
      `📄 *DOCUMENTO DA FROTA:* ${doc.name} (${doc.category})\n🚗 *Veículo:* ${vehicle.brand} ${vehicle.model} (Placa: *${vehicle.plate}*)\n👤 *Locatário:* ${vehicle.driver || 'Não informado'}\n\n📌 *INSTRUÇÃO DE ENVIO:* O arquivo *${doc.name}* foi baixado no seu dispositivo. Anexe este arquivo à conversa do WhatsApp para o destinatário!`
    );
  };

  const handleNativeShareDoc = async () => {
    if (!sharingDoc) return;
    try {
      let fileToShare: File | null = null;
      if (sharingDoc.contentUrl && sharingDoc.contentUrl.startsWith('data:')) {
        const res = await fetch(sharingDoc.contentUrl);
        const blob = await res.blob();
        fileToShare = new File([blob], sharingDoc.name, { type: blob.type || 'application/pdf' });
      } else {
        const mockText = `Documento: ${sharingDoc.name}\nCategoria: ${sharingDoc.category}\nVeículo: ${vehicle.brand} ${vehicle.model} (${vehicle.plate})`;
        const blob = new Blob([mockText], { type: 'text/plain' });
        fileToShare = new File([blob], sharingDoc.name, { type: 'text/plain' });
      }

      if (navigator.canShare && navigator.canShare({ files: [fileToShare] })) {
        await navigator.share({
          title: sharingDoc.name,
          text: customMsgText,
          files: [fileToShare]
        });
        setSharingDoc(null);
        return;
      }
    } catch (err) {
      console.log('Native share fallback:', err);
    }
    handleSendWhatsAppSubmit();
  };

  const handleSendWhatsAppSubmit = () => {
    if (!sharingDoc) return;
    
    let cleanPhone = whatsappPhone.replace(/\D/g, '');
    if (cleanPhone.length > 0 && !cleanPhone.startsWith('55')) {
      cleanPhone = '55' + cleanPhone;
    }
    
    const waUrl = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(customMsgText)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(customMsgText)}`;
      
    handleDownloadDoc(sharingDoc);
    

    const newTab = window.open(waUrl, '_blank', 'noopener,noreferrer');
    if (!newTab) {
      const link = document.createElement('a');
      link.href = waUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    setSharingDoc(null);
  };

  const handleInitiateShareVistoria = (v: Vistoria) => {
    setSharingVistoria(v);
    setIsRequestingNewVistoria(false);
    let rawPhone = vehicle.driverPhone || '';
    if (rawPhone.startsWith('55')) {
      rawPhone = rawPhone.substring(2);
    }
    setWhatsappVistoriaPhone(rawPhone);
    
    const savedTemplate = localStorage.getItem('fleet_vistoria_share_template') || DEFAULT_SHARE_TEMPLATE;
    const formatted = formatTemplateText(savedTemplate, true, v);
    setCustomVistoriaMsgText(formatted);
  };

  const handleInitiateRequestVistoria = () => {
    setShowPaymentWhatsApp(false);
    setShowAddPayment(false);
    setShowMaintenanceWhatsApp(false);
    setShowScheduleVistoria(false);
    setShowAddVistoria(false);
    setSharingVistoria(null);
    const nextState = !isRequestingNewVistoria;
    setIsRequestingNewVistoria(nextState);
    if (nextState) {
      let rawPhone = vehicle.driverPhone || '';
      if (rawPhone.startsWith('55')) {
        rawPhone = rawPhone.substring(2);
      }
      setWhatsappVistoriaPhone(rawPhone);

      const savedTemplate = localStorage.getItem('fleet_vistoria_request_template') || DEFAULT_REQUEST_TEMPLATE;
      const formatted = formatTemplateText(savedTemplate, false, null, requestVistoriaType);
      setCustomVistoriaMsgText(formatted);
    }
  };

  const handleSendVistoriaWhatsAppSubmit = () => {
    let cleanPhone = whatsappVistoriaPhone.replace(/\D/g, '');
    if (cleanPhone.length > 0 && !cleanPhone.startsWith('55')) {
      cleanPhone = '55' + cleanPhone;
    }
    
    // Auto-save customized template
    saveTemplateFromText(customVistoriaMsgText, !!sharingVistoria, sharingVistoria);

    const waUrl = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(customVistoriaMsgText)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(customVistoriaMsgText)}`;
      

    // Save customized return link for future use
    localStorage.setItem('fleet_vistoria_return_link', vistoriaReturnLink);

    const newTab = window.open(waUrl, '_blank', 'noopener,noreferrer');
    if (!newTab) {
      const link = document.createElement('a');
      link.href = waUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    setSharingVistoria(null);
    setIsRequestingNewVistoria(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const processSelectedFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
      const sizeStr = Number(sizeInMb) < 0.1 
        ? `${(file.size / 1024).toFixed(0)} KB` 
        : `${sizeInMb} MB`;
      
      setNewDocName(file.name);
      setNewDocDataUrl(dataUrl);
      setNewDocSize(sizeStr);
    };
    reader.readAsDataURL(file);
  };

  const processVistoriaPhoto = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setNewVistoriaPhotos(prev => [...prev, dataUrl]);
    };
    reader.readAsDataURL(file);
  };

  const handleVistoriaFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(processVistoriaPhoto);
  };

  const handleVistoriaDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPhoto(false);
    const files = Array.from(e.dataTransfer.files || []);
    files.forEach(processVistoriaPhoto);
  };

  const handleVistoriaDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPhoto(true);
  };

  const handleVistoriaDragLeave = () => {
    setIsDraggingPhoto(false);
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
      processSelectedFile(file);
    }
  };

  // Expense operations
  const handleAddExpenseSubmit = () => {
    handleAddExpense();
  };

  // Vistoria operations
  const handleAddVistoriaSubmit = () => {
    if (!onSaveVistoria) return;
    const newVistoria: Vistoria = {
      id: `vistoria-${Date.now()}`,
      vehicleId: vehicle.id,
      date: newVistoriaDate,
      type: newVistoriaType,
      checklist: { ...newVistoriaChecklist },
      photos: [...newVistoriaPhotos],
      notes: newVistoriaNotes,
    };
    onSaveVistoria(newVistoria);

    // Reset form
    setShowAddVistoria(false);
    setNewVistoriaPhotos([]);
    setNewVistoriaNotes('');
    setNewVistoriaChecklist({
      pneusEstepe: true,
      faroisLanternas: true,
      estofadosBancos: true,
      pinturaLataria: true,
      documentosVeiculo: true,
      nivelBateria: true,
      limpeza: true,
      trianguloMacaco: true,
      painelLuzes: true,
      chavesControles: true,
    });
  };

  // Determine colors based on fuel levels
  const getFuelColorClass = (level: number) => {
    if (level < 20) return 'bg-rose-500';
    if (level < 50) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  // Maintenance warning calculation
  const maintCurrentKm = vehicle.preventiveMaintCurrentKm || vehicle.currentKm || 0;
  const maintNextKm = vehicle.preventiveMaintNextKm || 0;
  const isMaintClose = maintNextKm > 0 && (maintNextKm - maintCurrentKm <= 1000);
  const isMaintOverdue = maintNextKm > 0 && (maintCurrentKm >= maintNextKm);

  // Vistoria deadline warning calculation
  const getVistoriaDaysStatus = () => {
    if (!vehicle.nextVistoriaDate) return null;
    
    // Today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const deadline = new Date(vehicle.nextVistoriaDate + 'T00:00:00');
    deadline.setHours(0, 0, 0, 0);
    
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      days: diffDays,
      isOverdue: diffDays <= 0,
      formattedDate: deadline.toLocaleDateString('pt-BR')
    };
  };

  const vistoriaStatus = getVistoriaDaysStatus();

  const handleNavToAgenda = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(true);
    setIsAgendaExpanded(true);
    setTimeout(() => {
      const el = document.getElementById(`agenda-section-${vehicle.id}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleNavToVistorias = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(true);
    setIsVistoriaExpanded(true);
    setTimeout(() => {
      const el = document.getElementById(`vistorias-section-${vehicle.id}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  return (
    <div 
      id={`vehicle-card-container-${vehicle.id}`} 
      className="bg-[#111111] border border-white/5 rounded-2xl shadow-xl hover:border-white/10 hover:shadow-[0_4px_30px_rgba(0,0,0,0.4)] transition-all overflow-hidden flex flex-col h-full"
    >
      {/* Header Panel - Brand, Model, Plate and Collapse Status */}
      <div 
        className="p-5 border-b border-white/5 bg-white/[0.01] cursor-pointer select-none hover:bg-white/[0.03] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
        id={`vehicle-card-header-${vehicle.id}`}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 min-w-0">
          <div className="flex-1 min-w-0 w-full sm:w-auto">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold px-2 py-0.5 bg-white/10 text-white rounded-md tracking-wider font-mono border border-white/5">
                {vehicle.plate}
              </span>
              <span className="text-xs text-gray-400 font-medium">{vehicle.color}</span>
              {hasCompletedVistoria && (
                <button
                  type="button"
                  onClick={handleNavToVistorias}
                  className="flex items-center gap-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-2 py-0.5 rounded-md border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.25)] cursor-pointer transition-all"
                  title="Clique para ir direto às Vistorias do veículo"
                >
                  <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-400" />
                  <span>Vistoria realizada</span>
                </button>
              )}
              {isMaintOverdue && (
                <button
                  type="button"
                  onClick={handleNavToAgenda}
                  className="flex items-center gap-1 text-[10px] font-bold bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 px-2 py-0.5 rounded-md border border-rose-500/20 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.4)] cursor-pointer transition-all"
                  title={`Atenção: Manutenção Vencida! Passou do limite por ${maintCurrentKm - maintNextKm} KM. Clique para ir à Agenda.`}
                >
                  <Wrench className="w-3 h-3 shrink-0" />
                  <span>MANUTENÇÃO VENCIDA</span>
                </button>
              )}
              {!isMaintOverdue && isMaintClose && (
                <button
                  type="button"
                  onClick={handleNavToAgenda}
                  className="flex items-center gap-1 text-[10px] font-bold bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 px-2 py-0.5 rounded-md border border-amber-500/20 animate-pulse drop-shadow-[0_0_8px_rgba(245,158,11,0.4)] cursor-pointer transition-all"
                  title={`Clique para ir à Agenda de Manutenção.`}
                >
                  <Wrench className="w-3 h-3 shrink-0" />
                  <span>
                    REVISÃO PRÓXIMA {revCountdown?.days !== undefined ? `(${revCountdown.days > 0 ? `${revCountdown.days}d faltantes` : 'Hoje'})` : `(${maintNextKm - maintCurrentKm} KM)`}
                  </span>
                </button>
              )}
              {revCountdown && revCountdown.isWithin3Days && (
                <button
                  type="button"
                  onClick={handleNavToAgenda}
                  className="flex items-center gap-1 text-[10px] font-bold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 px-2 py-0.5 rounded-md border border-amber-500/30 animate-pulse font-mono drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] cursor-pointer transition-all"
                  title="Clique para ir direto para a Revisão"
                >
                  <Clock className="w-3 h-3 shrink-0 text-amber-300" />
                  <span>
                    REVISÃO: {revCountdown.text} {revCountdown.days > 0 ? `(${revCountdown.days}d faltantes)` : ''}
                  </span>
                </button>
              )}
            </div>
            <h3 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
              {vehicle.brand} <span className="font-medium text-gray-300">{vehicle.model}</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5 flex-wrap">
              <User className="w-3.5 h-3.5 text-gray-500" />
              Locatário: <strong className="text-gray-200 font-semibold">{vehicle.driver || 'Não definido'}</strong>
              {vehicle.driverPhone && (
                <span className="text-[10px] text-gray-500 font-mono ml-1">({vehicle.driverPhone})</span>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isExpanded) setIsExpanded(true);
                  setShowPaymentWhatsApp(true);
                  setShowAddPayment(false);
                  const type = paymentWhatsAppType;
                  const rawTpl = localStorage.getItem(`fleet_payment_msg_${type}`) || DEFAULT_PAYMENT_TEMPLATES[type];
                  const text = formatPaymentTemplateText(
                    rawTpl,
                    vehicle.driver || '',
                    vehicle.brand || '',
                    vehicle.model || '',
                    vehicle.plate || '',
                    paymentWhatsAppAmount || vehicle.valorRecebido || 0,
                    paymentWhatsAppDueDate
                  );
                  setCustomPaymentMsgText(text);
                }}
                className="ml-1 text-[10px] text-emerald-400 hover:text-white bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-2 py-0.5 rounded font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="Enviar cobrança ou lembrete de pagamento via WhatsApp"
              >
                <MessageCircle className="w-3 h-3 text-emerald-400" />
                <span>Lembrete Pagamento</span>
              </button>
            </p>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap self-end sm:self-auto shrink-0" onClick={(e) => e.stopPropagation()}>
            {/* Finalizar Contrato button */}
            {onFinalizeContract && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onFinalizeContract(vehicle);
                }}
                className="px-2.5 py-1.5 text-xs font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-amber-500/10"
                title="Finalizar contrato de locação (salva o histórico e mantém o veículo salvo no sistema)"
                id={`btn-finalize-contract-${vehicle.id}`}
              >
                <Archive className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Finalizar Contrato</span>
              </button>
            )}

            {/* Edit button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(vehicle);
              }}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
              title="Editar informações do veículo"
              id={`btn-edit-${vehicle.id}`}
            >
              <Edit3 className="w-4 h-4" />
            </button>

            {/* Delete button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteVehicle(vehicle.id);
              }}
              className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
              title="Excluir veículo"
              id={`btn-delete-vehicle-${vehicle.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
            
            {/* Collapse toggle button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
              title={isExpanded ? "Recolher detalhes" : "Detalhes"}
              id={`btn-toggle-expand-${vehicle.id}`}
            >
              {isExpanded ? <ChevronUp className="w-5 h-5 text-blue-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
          </div>
        </div>

        {/* Collapsed state mini financial status summary */}
        {!isExpanded && (
          <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-xs">
            <div className="text-gray-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Recebido: <strong className="text-white font-mono">{formatBRL(valorRecebido)}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400">Sobra:</span>
              <span className={`font-mono font-bold px-2 py-0.5 rounded-md ${sobra >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {formatBRL(sobra)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Expanded Details Panel */}
      {isExpanded && (
        <div className="flex-1 flex flex-col justify-between" id={`vehicle-card-details-${vehicle.id}`}>
          <div className="p-5 space-y-6 flex-1">
            
            {/* Financial Breakdown Section (with Click-To-Edit) */}
            <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5 space-y-4">
              <div className="flex justify-between items-center text-xs pb-2 border-b border-white/5">
                <span className="font-bold text-gray-300 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Demonstrativo Mensal
                </span>
                <span className="text-[10px] text-gray-500">Valores deste mês</span>
              </div>

              {/* Entradas / Receitas */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-emerald-400/90 uppercase tracking-wider block">
                  Entradas (+)
                </span>
                {/* Valor Semanal Fixado */}
                <div className="flex justify-between items-center text-xs bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
                  <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Valor Semanal Fixado:
                  </span>
                  <div className="text-emerald-400 font-mono text-xs font-bold">
                    <InlineEdit
                      value={vehicle.valorSemanal || 0}
                      label="Valor Semanal"
                      onSave={(val) => handleUpdateField('valorSemanal', val)}
                    />
                  </div>
                </div>

                {/* Valor Recebido */}
                <div className="flex justify-between items-center text-xs p-1 px-2">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Valor Recebido (+)
                    {hasWeeklyPaymentsInCurrentMonth && (
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-sm font-medium border border-emerald-500/10" title="Calculado automaticamente a partir dos pagamentos semanais deste mês">
                        Auto (Semanas)
                      </span>
                    )}
                  </span>
                  <div className="text-emerald-400 font-mono text-sm font-black">
                    {hasWeeklyPaymentsInCurrentMonth ? (
                      <span title="Calculado a partir de pagamentos semanais deste mês" className="cursor-help">{formatBRL(valorRecebido)}</span>
                    ) : (
                      <InlineEdit
                        value={valorRecebido}
                        label="Valor Recebido"
                        onSave={(val) => handleUpdateField('valorRecebido', val)}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Saídas / Despesas */}
              <div className="space-y-3 pt-3 border-t border-white/5">
                <span className="text-[10px] font-bold text-rose-400/90 uppercase tracking-wider block">
                  Despesas Fixas (-)
                </span>

                {/* Lista de Despesas Fixas */}
                <div className="pl-2 space-y-2 border-l-2 border-white/10 text-xs">
                  {/* Financiamento */}
                  <div className="py-0.5 text-gray-400 hover:text-white transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <span className="shrink-0 font-medium text-gray-300">Financiamento (-)</span>
                      <div className="flex items-center gap-1.5 font-mono shrink-0">
                        <InlineEdit
                          value={financiamento}
                          label="Financiamento"
                          onSave={(val) => handleUpdateField('financiamento', val)}
                        />
                        {financiamento > 0 && (
                          <button
                            onClick={() => handleUpdateField('financiamento', 0)}
                            className="text-gray-500 hover:text-rose-400 transition-colors p-0.5 rounded cursor-pointer"
                            title="Zerar Financiamento"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    {vehicle.financiamentoParcelasTotais && vehicle.financiamentoParcelasTotais > 0 ? (
                      <div className="mt-1">
                        <button
                          type="button"
                          onClick={() => openParcelasModal('financiamento', 'Financiamento', vehicle.financiamentoParcelasPagas || 0, vehicle.financiamentoParcelasTotais || 12)}
                          className="text-[9px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded-md font-bold hover:bg-amber-500/20 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                          title="Clique para alterar parcelas do financiamento"
                        >
                          <span>Pagas: {vehicle.financiamentoParcelasPagas || 0}</span>
                          <span className="text-amber-500/40">|</span>
                          <span>Faltam: {Math.max(0, vehicle.financiamentoParcelasTotais - (vehicle.financiamentoParcelasPagas || 0))}</span>
                        </button>
                      </div>
                    ) : (
                      financiamento > 0 && (
                        <div className="mt-1">
                          <button
                            type="button"
                            onClick={() => openParcelasModal('financiamento', 'Financiamento', 0, 12)}
                            className="text-[9px] font-mono text-gray-500 hover:text-amber-300 transition-colors px-1.5 py-0.5 bg-white/5 hover:bg-white/10 rounded-md border border-white/10 flex items-center gap-1 cursor-pointer shrink-0"
                            title="Definir quantas parcelas foram pagas e quantas faltam"
                          >
                            <Layers className="w-2.5 h-2.5" /> + Parcelas
                          </button>
                        </div>
                      )
                    )}
                  </div>

                  {/* Seguro */}
                  <div className="py-0.5 text-gray-400 hover:text-white transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <span className="shrink-0 font-medium text-gray-300">Seguro (-)</span>
                      <div className="flex items-center gap-1.5 font-mono shrink-0">
                        <InlineEdit
                          value={seguro}
                          label="Seguro"
                          onSave={(val) => handleUpdateField('seguro', val)}
                        />
                        {seguro > 0 && (
                          <button
                            onClick={() => handleUpdateField('seguro', 0)}
                            className="text-gray-500 hover:text-rose-400 transition-colors p-0.5 rounded cursor-pointer"
                            title="Zerar Seguro"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    {vehicle.seguroParcelasTotais && vehicle.seguroParcelasTotais > 0 ? (
                      <div className="mt-1">
                        <button
                          type="button"
                          onClick={() => openParcelasModal('seguro', 'Seguro', vehicle.seguroParcelasPagas || 0, vehicle.seguroParcelasTotais || 12)}
                          className="text-[9px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded-md font-bold hover:bg-amber-500/20 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                          title="Clique para alterar parcelas do seguro"
                        >
                          <span>Pagas: {vehicle.seguroParcelasPagas || 0}</span>
                          <span className="text-amber-500/40">|</span>
                          <span>Faltam: {Math.max(0, vehicle.seguroParcelasTotais - (vehicle.seguroParcelasPagas || 0))}</span>
                        </button>
                      </div>
                    ) : (
                      seguro > 0 && (
                        <div className="mt-1">
                          <button
                            type="button"
                            onClick={() => openParcelasModal('seguro', 'Seguro', 0, 12)}
                            className="text-[9px] font-mono text-gray-500 hover:text-amber-300 transition-colors px-1.5 py-0.5 bg-white/5 hover:bg-white/10 rounded-md border border-white/10 flex items-center gap-1 cursor-pointer shrink-0"
                            title="Definir quantas parcelas foram pagas e quantas faltam"
                          >
                            <Layers className="w-2.5 h-2.5" /> + Parcelas
                          </button>
                        </div>
                      )
                    )}
                  </div>

                  {/* IPVA */}
                  <div className="py-0.5 text-gray-400 hover:text-white transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <span className="shrink-0 font-medium text-gray-300">IPVA (-)</span>
                      <div className="flex items-center gap-1.5 font-mono shrink-0">
                        <InlineEdit
                          value={ipva}
                          label="IPVA"
                          onSave={(val) => handleUpdateField('ipva', val)}
                        />
                        {ipva > 0 && (
                          <button
                            onClick={() => handleUpdateField('ipva', 0)}
                            className="text-gray-500 hover:text-rose-400 transition-colors p-0.5 rounded cursor-pointer"
                            title="Zerar IPVA"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    {vehicle.ipvaParcelasTotais && vehicle.ipvaParcelasTotais > 0 ? (
                      <div className="mt-1">
                        <button
                          type="button"
                          onClick={() => openParcelasModal('ipva', 'IPVA', vehicle.ipvaParcelasPagas || 0, vehicle.ipvaParcelasTotais || 10)}
                          className="text-[9px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded-md font-bold hover:bg-amber-500/20 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                          title="Clique para alterar parcelas do IPVA"
                        >
                          <span>Pagas: {vehicle.ipvaParcelasPagas || 0}</span>
                          <span className="text-amber-500/40">|</span>
                          <span>Faltam: {Math.max(0, vehicle.ipvaParcelasTotais - (vehicle.ipvaParcelasPagas || 0))}</span>
                        </button>
                      </div>
                    ) : (
                      ipva > 0 && (
                        <div className="mt-1">
                          <button
                            type="button"
                            onClick={() => openParcelasModal('ipva', 'IPVA', 0, 10)}
                            className="text-[9px] font-mono text-gray-500 hover:text-amber-300 transition-colors px-1.5 py-0.5 bg-white/5 hover:bg-white/10 rounded-md border border-white/10 flex items-center gap-1 cursor-pointer shrink-0"
                            title="Definir quantas parcelas foram pagas e quantas faltam"
                          >
                            <Layers className="w-2.5 h-2.5" /> + Parcelas
                          </button>
                        </div>
                      )
                    )}
                  </div>

                  {/* Manutenção Preventiva */}
                  <div className="py-0.5 text-gray-400 hover:text-white transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <span className="shrink-0 font-medium text-gray-300">Manut. Preventiva (-)</span>
                      <div className="flex items-center gap-1.5 font-mono shrink-0">
                        <InlineEdit
                          value={manutencaoPreventiva}
                          label="Manutenção Preventiva"
                          onSave={(val) => handleUpdateField('manutencaoPreventiva', val)}
                        />
                        {manutencaoPreventiva > 0 && (
                          <button
                            onClick={() => handleUpdateField('manutencaoPreventiva', 0)}
                            className="text-gray-500 hover:text-rose-400 transition-colors p-0.5 rounded cursor-pointer"
                            title="Zerar Manutenção Preventiva"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    {vehicle.manutencaoParcelasTotais && vehicle.manutencaoParcelasTotais > 0 ? (
                      <div className="mt-1">
                        <button
                          type="button"
                          onClick={() => openParcelasModal('manutencao', 'Manutenção Preventiva', vehicle.manutencaoParcelasPagas || 0, vehicle.manutencaoParcelasTotais || 12)}
                          className="text-[9px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded-md font-bold hover:bg-amber-500/20 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                          title="Clique para alterar parcelas da Manutenção Preventiva"
                        >
                          <span>Pagas: {vehicle.manutencaoParcelasPagas || 0}</span>
                          <span className="text-amber-500/40">|</span>
                          <span>Faltam: {Math.max(0, vehicle.manutencaoParcelasTotais - (vehicle.manutencaoParcelasPagas || 0))}</span>
                        </button>
                      </div>
                    ) : (
                      manutencaoPreventiva > 0 && (
                        <div className="mt-1">
                          <button
                            type="button"
                            onClick={() => openParcelasModal('manutencao', 'Manutenção Preventiva', 0, 12)}
                            className="text-[9px] font-mono text-gray-500 hover:text-amber-300 transition-colors px-1.5 py-0.5 bg-white/5 hover:bg-white/10 rounded-md border border-white/10 flex items-center gap-1 cursor-pointer shrink-0"
                            title="Definir quantas parcelas foram pagas e quantas faltam"
                          >
                            <Layers className="w-2.5 h-2.5" /> + Parcelas
                          </button>
                        </div>
                      )
                    )}
                  </div>

                  {/* Outras Despesas Fixas (custoExtra) */}
                  {custoExtra > 0 && (
                    <div className="py-0.5 text-gray-400 hover:text-white transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate max-w-[140px] font-medium text-gray-300">{custoExtraLabel} (-)</span>
                        <div className="flex items-center gap-1.5 font-mono shrink-0">
                          <InlineEdit
                            value={custoExtra}
                            label={custoExtraLabel}
                            onSave={(val) => handleUpdateField('custoExtra', val)}
                          />
                          <button
                            onClick={() => handleUpdateField('custoExtra', 0)}
                            className="text-gray-500 hover:text-rose-400 transition-colors p-0.5 rounded cursor-pointer"
                            title="Zerar Custo Extra"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      {(() => {
                        const parsed = parseInstallmentInfo(custoExtraLabel);
                        const pagas = vehicle.custoExtraParcelasPagas ?? parsed?.pagas ?? 0;
                        const totais = vehicle.custoExtraParcelasTotais ?? parsed?.total ?? 0;
                        
                        if (totais > 0) {
                          return (
                            <div className="mt-1">
                              <button
                                type="button"
                                onClick={() => openParcelasModal('custoExtra', custoExtraLabel, pagas, totais)}
                                className="text-[9px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded-md font-bold hover:bg-amber-500/20 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                                title="Clique para alterar parcelas"
                              >
                                <span>Pagas: {pagas}</span>
                                <span className="text-amber-500/40">|</span>
                                <span>Faltam: {Math.max(0, totais - pagas)}</span>
                              </button>
                            </div>
                          );
                        }
                        return (
                          <div className="mt-1">
                            <button
                              type="button"
                              onClick={() => openParcelasModal('custoExtra', custoExtraLabel, 0, 12)}
                              className="text-[9px] font-mono text-gray-500 hover:text-amber-300 transition-colors px-1.5 py-0.5 bg-white/5 hover:bg-white/10 rounded-md border border-white/10 flex items-center gap-1 cursor-pointer shrink-0"
                              title="Definir quantas parcelas foram pagas e quantas faltam"
                            >
                              <Layers className="w-2.5 h-2.5" /> + Parcelas
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Despesas Eventuais do Veículo */}
                <div className="pt-2 border-t border-white/5 space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <span>Despesas Eventuais ({vehicleExpenses.filter((exp) => isCurrentMonth(exp.date)).length})</span>
                  </div>

                  {vehicleExpenses.filter((exp) => isCurrentMonth(exp.date)).length > 0 ? (
                    <div className="space-y-1 max-h-28 overflow-y-auto pr-0.5">
                      {vehicleExpenses.filter((exp) => isCurrentMonth(exp.date)).map((expense) => {
                        const inst = parseInstallmentInfo(expense.description);
                        return (
                          <div key={expense.id} className="flex justify-between items-center text-xs bg-white/[0.02] p-1.5 px-2 rounded-md group hover:bg-white/[0.04]">
                            <div className="flex flex-col min-w-0 pr-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-gray-300 font-medium truncate" title={expense.description}>{expense.description}</span>
                                {inst && (
                                  <span className="text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold shrink-0">
                                    Pagas: {inst.pagas} | Faltam: {inst.faltam}
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] text-gray-500 font-mono">
                                {new Date(expense.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 font-mono">
                              <span className="text-rose-400 font-semibold text-xs">-{formatBRL(expense.cost)}</span>
                              <button
                                onClick={() => onDeleteExpense(expense.id)}
                                className="text-gray-500 hover:text-rose-400 transition-colors p-0.5 rounded cursor-pointer"
                                title="Excluir despesa"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-500 italic py-1">Nenhuma despesa eventual registrada neste mês.</p>
                  )}
                </div>

                {/* Total Despesas + Botão + Novo */}
                <div className="flex justify-between items-center text-xs pt-2 border-t border-white/5">
                  <span className="text-gray-300 flex items-center gap-1.5 font-bold">
                    <TrendingDown className="w-3.5 h-3.5 text-rose-400" /> Total Despesas (-)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-rose-400 font-mono text-sm">{formatBRL(totalDespesas)}</span>
                    <button
                      type="button"
                      onClick={() => setShowAddExpense(!showAddExpense)}
                      className="text-xs text-amber-400 hover:text-amber-300 font-bold px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{showAddExpense ? 'Fechar' : 'Novo'}</span>
                    </button>
                  </div>
                </div>

                {/* Form de Nova Despesa (Fixa ou Eventual com Data Inicial e Parcelamento em até 60x) */}
                {showAddExpense && (
                  <div className="p-3 bg-neutral-900 rounded-xl border border-amber-500/30 space-y-2.5 text-[11px] animate-in slide-in-from-top-1 duration-100 shadow-xl my-2">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                      <span className="text-xs font-bold text-amber-300">Nova Despesa</span>
                      <span className="text-[9px] text-gray-400">Escolha Fixa ou Eventual</span>
                    </div>

                    {/* Seletor Tipo: Eventual vs Fixa */}
                    <div className="flex bg-black/60 p-1 rounded-lg border border-white/10 gap-1">
                      <button
                        type="button"
                        onClick={() => setExpenseType('eventual')}
                        className={`flex-1 py-1.5 px-2.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          expenseType === 'eventual'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span>Despesa Eventual</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpenseType('fixa')}
                        className={`flex-1 py-1.5 px-2.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          expenseType === 'fixa'
                            ? 'bg-amber-600 text-white shadow-md'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span>Despesa Fixa</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
                          {expenseType === 'fixa' ? 'Nome da Despesa Fixa' : 'Descrição'}
                        </label>
                        <input
                          type="text"
                          placeholder={expenseType === 'fixa' ? 'Ex: Seguro, IPVA, Rastreamento...' : 'Ex: Pneus, Funilaria, Conserto...'}
                          value={newExpenseDesc}
                          onChange={(e) => setNewExpenseDesc(e.target.value ? e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) : '')}
                          className="w-full text-xs bg-black border border-white/15 rounded-lg px-2.5 py-1.5 text-white focus:outline-hidden focus:border-amber-500"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
                          {expenseType === 'fixa' ? 'Valor Mensal (R$)' : 'Valor (R$)'}
                        </label>
                        <input
                          type="number"
                          placeholder="0,00"
                          value={newExpenseAmount || ''}
                          onChange={(e) => setNewExpenseAmount(Number(e.target.value))}
                          className="w-full text-xs bg-black border border-white/15 rounded-lg px-2.5 py-1.5 text-white focus:outline-hidden font-mono focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* Opção de Parcelamento em até 60x */}
                    <div className="p-2 bg-white/[0.03] border border-white/10 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-300">
                          <input
                            type="checkbox"
                            checked={isExpenseParcelado}
                            onChange={(e) => setIsExpenseParcelado(e.target.checked)}
                            className="w-4 h-4 rounded border-white/20 bg-black text-amber-500 focus:ring-amber-500 cursor-pointer"
                          />
                          <span>Parcelar em até 60x?</span>
                        </label>
                        {isExpenseParcelado && (
                          <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            {expenseInstallments}x parcelas
                          </span>
                        )}
                      </div>

                      {isExpenseParcelado && (
                        <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-white/10 animate-in fade-in duration-150">
                          <div>
                            <label className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">
                              Nº de Parcelas
                            </label>
                            <select
                              value={expenseInstallments}
                              onChange={(e) => setExpenseInstallments(Number(e.target.value))}
                              className="w-full text-xs bg-black border border-white/15 rounded-lg px-2 py-1 text-white focus:outline-hidden font-mono"
                            >
                              {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24, 36, 48, 60].map((n) => (
                                <option key={n} value={n}>{n}x parcelas</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">
                              Cálculo do Valor
                            </label>
                            <select
                              value={expenseInstallmentMode}
                              onChange={(e) => setExpenseInstallmentMode(e.target.value as 'total' | 'parcela')}
                              className="w-full text-xs bg-black border border-white/15 rounded-lg px-2 py-1 text-white focus:outline-hidden"
                            >
                              <option value="total">Valor Total</option>
                              <option value="parcela">Valor por Parcela</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {isExpenseParcelado && newExpenseAmount > 0 && (
                        <div className="text-[10px] text-amber-300 font-medium bg-amber-500/10 p-1.5 rounded border border-amber-500/20">
                          💡 {expenseInstallments} parcelas de <strong>R$ {
                            (expenseInstallmentMode === 'total' 
                              ? (newExpenseAmount / expenseInstallments) 
                              : newExpenseAmount
                            ).toFixed(2).replace('.', ',')
                          }</strong> (1 por mês)
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Data Inicial</label>
                        <input
                          type="date"
                          value={newExpenseDate}
                          onChange={(e) => setNewExpenseDate(e.target.value)}
                          className="w-full text-xs bg-black border border-white/15 rounded-lg px-2 py-1.5 text-white focus:outline-hidden font-mono"
                        />
                      </div>
                      <div className="flex items-end justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddExpense(false);
                            setNewExpenseDesc('');
                            setNewExpenseAmount(0);
                            setIsExpenseParcelado(false);
                          }}
                          className="px-2 py-1 text-xs text-gray-400 hover:text-white cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveExpense}
                          className={`px-3 py-1.5 text-white font-bold rounded-lg transition-colors text-xs shadow-md cursor-pointer ${
                            expenseType === 'fixa'
                              ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
                              : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
                          }`}
                        >
                          {expenseType === 'fixa'
                            ? 'Salvar Despesa Fixa'
                            : isExpenseParcelado
                            ? `Lançar ${expenseInstallments}x`
                            : 'Adicionar Eventual'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Resultado Líquido (Quanto Sobra) */}
              <div className={`p-3.5 rounded-xl flex justify-between items-center mt-3 ${sobra >= 0 ? 'bg-emerald-500/10 border border-emerald-500/20 shadow-xs' : 'bg-rose-500/10 border border-rose-500/20 shadow-xs'}`}>
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-blue-400" /> Quanto Sobra
                </span>
                <span className={`text-base font-black font-mono ${sobra >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatBRL(sobra)}
                </span>
              </div>
            </div>

            {/* Caução de Garantia Section (Escondido por padrão, expande ao clicar) */}
            <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5 space-y-3 relative mb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs pb-2 border-b border-white/5 gap-2">
                <button 
                  type="button"
                  onClick={() => setIsCaucaoExpanded(!isCaucaoExpanded)}
                  className="flex justify-between items-center w-full text-left font-bold text-gray-300 gap-2 uppercase tracking-wider text-[10px] hover:text-white transition-colors cursor-pointer py-0.5"
                  title="Clique para alternar a Caução"
                >
                  <span className="flex flex-wrap items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 
                    <span>Caução de Garantia</span>
                    <span className="text-[9px] text-gray-400 font-normal lowercase">(Informativo - Não somar)</span>
                    {vehicle.caucaoValor ? (
                      <span className="font-mono text-emerald-400 text-xs font-black normal-case">
                        ({formatBRL(vehicle.caucaoValor)})
                      </span>
                    ) : (
                      <span className="text-gray-500 text-[10px] normal-case font-normal">
                        (Não cadastrado)
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-blue-400 font-semibold bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-md border border-blue-500/15 shrink-0">
                    {isCaucaoExpanded ? 'Recolher' : 'Caução'}
                    {isCaucaoExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </span>
                </button>
              </div>

              {isCaucaoExpanded && (
                <div className="space-y-3 pt-1 animate-in slide-in-from-top-1 duration-150">
                  {/* Banner Explicativo Caução */}
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 text-[11px] text-emerald-300 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong>Garantia Caução:</strong> O valor do caução é mantido exclusivamente como garantia e <strong>nunca é somado</strong> à receita ou aos pagamentos semanais.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Valor do Caução */}
                    <div className="bg-white/[0.01] p-3 rounded-xl border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors">
                      <span className="text-[10px] text-gray-400 font-semibold mb-1">Valor do Caução</span>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500"><DollarSign className="w-3.5 h-3.5 text-emerald-500" /></span>
                        <InlineEdit
                          value={vehicle.caucaoValor || 0}
                          label="Valor do Caução"
                          onSave={(val) => {
                            onUpdateVehicle({
                              ...vehicle,
                              caucaoValor: val
                            });
                          }}
                        />
                      </div>
                    </div>

                    {/* Data do Caução */}
                    <div className="bg-white/[0.01] p-3 rounded-xl border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors">
                      <span className="text-[10px] text-gray-400 font-semibold mb-1">Data de Depósito</span>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500"><Calendar className="w-3.5 h-3.5 text-emerald-500" /></span>
                        <InlineDateEdit
                          value={vehicle.caucaoData || '2026-07-19'}
                          onSave={(val) => {
                            onUpdateVehicle({
                              ...vehicle,
                              caucaoData: val
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Observações com Balão */}
                  <div className="bg-white/[0.01] p-3 rounded-xl border border-white/5 space-y-1.5 hover:border-white/10 transition-all">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Observações do Caução
                      </span>
                    </div>
                    
                    {/* Visual "balloon"/bubble for notes */}
                    <div className="relative mt-1">
                      <div className="bg-emerald-500/5 text-emerald-100 rounded-xl p-3 border border-emerald-500/10 text-xs leading-relaxed italic relative before:content-[''] before:absolute before:top-[-6px] before:left-4 before:w-3 before:h-3 before:bg-[#15231c] before:border-t before:border-l before:border-emerald-500/10 before:rotate-45">
                        <textarea
                          value={vehicle.caucaoObservacoes || ''}
                          onChange={(e) => {
                            onUpdateVehicle({
                              ...vehicle,
                              caucaoObservacoes: e.target.value
                            });
                          }}
                          placeholder="Sem observações registradas. Digite aqui para adicionar notas sobre o caução..."
                          className="w-full bg-transparent focus:outline-hidden text-emerald-200 placeholder-emerald-700/60 resize-none h-16 text-xs scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Dados do Contrato Section (Escondido por padrão, expande ao clicar) */}
            <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5 space-y-3 relative mb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs pb-2 border-b border-white/5 gap-2">
                <button 
                  type="button"
                  onClick={() => setIsContractExpanded(!isContractExpanded)}
                  className="flex justify-between items-center w-full text-left font-bold text-gray-300 gap-2 uppercase tracking-wider text-[10px] hover:text-white transition-colors cursor-pointer py-0.5"
                  title="Clique para alternar os dados do contrato"
                >
                  <span className="flex flex-wrap items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" /> 
                    <span>Dados do Contrato</span>
                    {vehicle.startDate || vehicle.initialKm || vehicle.contractNumber ? (
                      <span className="font-mono text-blue-400 text-[10px] font-medium normal-case">
                        ({vehicle.contractNumber ? `N° ${vehicle.contractNumber} | ` : ''}Início: {vehicle.startDate ? new Date(vehicle.startDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'N/I'} | KM Início: {vehicle.initialKm ? `${vehicle.initialKm.toLocaleString('pt-BR')} km` : 'N/I'})
                      </span>
                    ) : (
                      <span className="text-gray-500 text-[10px] normal-case font-normal">
                        (Não cadastrado)
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-blue-400 font-semibold bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-md border border-blue-500/15 shrink-0">
                    {isContractExpanded ? 'Recolher' : 'Contrato'}
                    {isContractExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </span>
                </button>
              </div>

              {isContractExpanded && (
                <div className="space-y-3 pt-1 animate-in slide-in-from-top-1 duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Data de Início */}
                    <div className="bg-white/[0.01] p-3 rounded-xl border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors">
                      <span className="text-[10px] text-gray-400 font-semibold mb-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-400" /> Data de Início
                      </span>
                      <div className="flex items-center justify-between mt-1">
                        <InlineDateEdit
                          value={vehicle.startDate}
                          onSave={(val) => handleUpdateField('startDate', val)}
                        />
                      </div>
                      {vehicle.startDate && (
                        <div className="mt-2 pt-1.5 border-t border-white/5 text-[10px] text-emerald-400 font-mono font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>1º Venc. Semanal: <strong>{formatDateBR(getNextWeekDate(vehicle.startDate))}</strong></span>
                        </div>
                      )}
                    </div>

                    {/* KM de Início (Entrada) */}
                    <div className="bg-white/[0.01] p-3 rounded-xl border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors">
                      <span className="text-[10px] text-gray-400 font-semibold mb-1 flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5 text-emerald-400" /> KM de Início (Entrada)
                      </span>
                      <div className="flex items-center justify-between mt-1">
                        <InlineEdit
                          value={vehicle.initialKm || 0}
                          label="KM Início"
                          isCurrency={false}
                          onSave={(val) => handleUpdateField('initialKm', val)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Número do Contrato */}
                    <div className="bg-white/[0.01] p-3 rounded-xl border border-white/5 space-y-1 hover:border-white/10 transition-all">
                      <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-amber-400" /> N° do Contrato / Código
                      </span>
                      <div className="pt-1">
                        <InlineTextEdit
                          value={vehicle.contractNumber || ''}
                          label="Número do Contrato"
                          placeholder="Ex: CT-GKD-ABC2323-08-2026-01"
                          onSave={(val) => handleUpdateField('contractNumber', val)}
                        />
                      </div>
                    </div>

                    {/* Locadora / Empresa Responsável */}
                    <div className="bg-white/[0.01] p-3 rounded-xl border border-white/5 space-y-1 hover:border-white/10 transition-all">
                      <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-indigo-400" /> Locadora / Empresa
                      </span>
                      <div className="pt-1">
                        <InlineTextEdit
                          value={vehicle.rentalCompany || ''}
                          label="Empresa Locadora"
                          placeholder="Ex: Localiza, Movida, Frota Própria"
                          onSave={(val) => handleUpdateField('rentalCompany', val)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenRentalContract?.(vehicle)}
                      className="w-full py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-emerald-500/30 transition-all cursor-pointer shadow-md shadow-emerald-500/10"
                    >
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span>Gerar / Alterar Contrato (PDF)</span>
                    </button>

                    {onFinalizeContract && (
                      <button
                        type="button"
                        onClick={() => onFinalizeContract(vehicle)}
                        className="w-full py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-amber-500/30 transition-all cursor-pointer shadow-md shadow-amber-500/10"
                      >
                        <Archive className="w-4 h-4 text-amber-400" />
                        <span>Finalizar Contrato Atual</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Weekly Payments Section (deixar + novo pra ir criando pagamentos) */}
            <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5 space-y-3 mb-4">
              <div className="flex justify-between items-center text-xs pb-1.5 border-b border-white/5 flex-wrap gap-2">
                <span className="font-bold text-gray-300 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" /> Pagamentos Semanais
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const nextState = !showPaymentWhatsApp;
                      setShowPaymentWhatsApp(nextState);
                      setShowAddPayment(false);
                      setShowMaintenanceWhatsApp(false);
                      setShowScheduleVistoria(false);
                      setShowAddVistoria(false);
                      setIsRequestingNewVistoria(false);
                      setSharingVistoria(null);
                      if (nextState) {
                        const type = paymentWhatsAppType;
                        const rawTpl = localStorage.getItem(`fleet_payment_msg_${type}`) || DEFAULT_PAYMENT_TEMPLATES[type];
                        const text = formatPaymentTemplateText(
                          rawTpl,
                          vehicle.driver || '',
                          vehicle.brand || '',
                          vehicle.model || '',
                          vehicle.plate || '',
                          paymentWhatsAppAmount || vehicle.valorRecebido || 0,
                          paymentWhatsAppDueDate
                        );
                        setCustomPaymentMsgText(text);
                      }
                    }}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-md transition-all cursor-pointer"
                    title="Enviar cobrança ou lembrete de pagamento semanal via WhatsApp"
                    id={`btn-whatsapp-payment-${vehicle.id}`}
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Lembrete WhatsApp</span>
                  </button>
                  <button
                    onClick={() => {
                      const nextState = !showAddPayment;
                      setShowAddPayment(nextState);
                      setShowPaymentWhatsApp(false);
                      setShowMaintenanceWhatsApp(false);
                      setShowScheduleVistoria(false);
                      setShowAddVistoria(false);
                      setIsRequestingNewVistoria(false);
                      setSharingVistoria(null);
                      if (nextState) {
                        setNewPaymentDate(new Date().toISOString().split('T')[0]);
                        if (vehicle.valorSemanal) {
                          setNewPaymentAmount(vehicle.valorSemanal);
                        }
                      }
                    }}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/10 rounded-md border border-blue-500/10 hover:border-blue-500/20 cursor-pointer"
                  >
                    {showAddPayment ? 'Fechar' : 'Novo'}
                  </button>
                </div>
              </div>
            </div>

            {/* WhatsApp Payment Reminder Panel */}
              {showPaymentWhatsApp && (
                <div className="p-3 bg-[#0d1f17] rounded-xl border border-emerald-500/30 space-y-3 animate-in slide-in-from-top-1 duration-150 shadow-lg text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                        Lembrete / Cobrança por WhatsApp
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPaymentWhatsApp(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Type Selector Tabs */}
                  <div>
                    <label className="text-[10px] text-emerald-300 block mb-1 font-bold uppercase tracking-wider">
                      Selecione o Tipo de Mensagem *
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentWhatsAppType('lembrete');
                          const rawTpl = localStorage.getItem('fleet_payment_msg_lembrete') || DEFAULT_PAYMENT_TEMPLATES.lembrete;
                          const text = formatPaymentTemplateText(
                            rawTpl,
                            vehicle.driver || '',
                            vehicle.brand || '',
                            vehicle.model || '',
                            vehicle.plate || '',
                            paymentWhatsAppAmount || vehicle.valorRecebido || 0,
                            paymentWhatsAppDueDate
                          );
                          setCustomPaymentMsgText(text);
                        }}
                        className={`py-1.5 px-2 rounded-lg border text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                          paymentWhatsAppType === 'lembrete'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-xs'
                            : 'bg-black/40 text-gray-400 border-white/10 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <span>📅 Lembrete Prévio</span>
                        <span className="text-[8px] opacity-70 font-normal">Aviso de Vencimento</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPaymentWhatsAppType('hoje');
                          const rawTpl = localStorage.getItem('fleet_payment_msg_hoje') || DEFAULT_PAYMENT_TEMPLATES.hoje;
                          const text = formatPaymentTemplateText(
                            rawTpl,
                            vehicle.driver || '',
                            vehicle.brand || '',
                            vehicle.model || '',
                            vehicle.plate || '',
                            paymentWhatsAppAmount || vehicle.valorRecebido || 0,
                            paymentWhatsAppDueDate
                          );
                          setCustomPaymentMsgText(text);
                        }}
                        className={`py-1.5 px-2 rounded-lg border text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                          paymentWhatsAppType === 'hoje'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                            : 'bg-black/40 text-gray-400 border-white/10 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <span>🔔 Dia do Pagamento</span>
                        <span className="text-[8px] opacity-70 font-normal">Vence Hoje</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPaymentWhatsAppType('atrasado');
                          const rawTpl = localStorage.getItem('fleet_payment_msg_atrasado') || DEFAULT_PAYMENT_TEMPLATES.atrasado;
                          const text = formatPaymentTemplateText(
                            rawTpl,
                            vehicle.driver || '',
                            vehicle.brand || '',
                            vehicle.model || '',
                            vehicle.plate || '',
                            paymentWhatsAppAmount || vehicle.valorRecebido || 0,
                            paymentWhatsAppDueDate
                          );
                          setCustomPaymentMsgText(text);
                        }}
                        className={`py-1.5 px-2 rounded-lg border text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                          paymentWhatsAppType === 'atrasado'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-xs'
                            : 'bg-black/40 text-gray-400 border-white/10 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <span>⚠️ Pagamento Atrasado</span>
                        <span className="text-[8px] opacity-70 font-normal">Cobrança de Atraso</span>
                      </button>
                    </div>
                  </div>

                  {/* Input details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[9px] text-gray-300 block mb-0.5 font-semibold uppercase tracking-wider">
                        Telefone (WhatsApp) *
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-2 font-mono text-[10px] text-gray-500 select-none font-semibold">
                          +55
                        </span>
                        <input
                          type="text"
                          placeholder="11999991234"
                          value={paymentWhatsAppPhone}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, '');
                            if (val.startsWith('55') && val.length > 2) {
                              val = val.substring(2);
                            }
                            setPaymentWhatsAppPhone(val);
                          }}
                          className="w-full text-xs bg-black border border-white/15 rounded-lg pl-9 pr-2 py-1.5 text-white focus:outline-hidden focus:border-emerald-500 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] text-gray-300 block mb-0.5 font-semibold uppercase tracking-wider">
                        Valor Semanal (R$)
                      </label>
                      <input
                        type="number"
                        value={paymentWhatsAppAmount || ''}
                        onChange={(e) => {
                          const newAmt = Number(e.target.value);
                          setPaymentWhatsAppAmount(newAmt);
                          const rawTpl = localStorage.getItem(`fleet_payment_msg_${paymentWhatsAppType}`) || DEFAULT_PAYMENT_TEMPLATES[paymentWhatsAppType];
                          const text = formatPaymentTemplateText(
                            rawTpl,
                            vehicle.driver || '',
                            vehicle.brand || '',
                            vehicle.model || '',
                            vehicle.plate || '',
                            newAmt,
                            paymentWhatsAppDueDate
                          );
                          setCustomPaymentMsgText(text);
                        }}
                        placeholder="0,00"
                        className="w-full text-xs bg-black border border-white/15 rounded-lg px-2.5 py-1.5 text-white focus:outline-hidden focus:border-emerald-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-gray-300 block mb-0.5 font-semibold uppercase tracking-wider">
                        Data de Vencimento
                      </label>
                      <input
                        type="date"
                        value={paymentWhatsAppDueDate}
                        onChange={(e) => {
                          const newDate = e.target.value;
                          setPaymentWhatsAppDueDate(newDate);
                          const rawTpl = localStorage.getItem(`fleet_payment_msg_${paymentWhatsAppType}`) || DEFAULT_PAYMENT_TEMPLATES[paymentWhatsAppType];
                          const text = formatPaymentTemplateText(
                            rawTpl,
                            vehicle.driver || '',
                            vehicle.brand || '',
                            vehicle.model || '',
                            vehicle.plate || '',
                            paymentWhatsAppAmount || vehicle.valorRecebido || 0,
                            newDate
                          );
                          setCustomPaymentMsgText(text);
                        }}
                        className="w-full text-xs bg-black border border-white/15 rounded-lg px-2 py-1.5 text-white focus:outline-hidden focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Textarea */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[9px] text-gray-300 font-semibold uppercase tracking-wider">
                        Texto da Mensagem
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.setItem(`fleet_payment_msg_${paymentWhatsAppType}`, customPaymentMsgText);
                          setPaymentTemplateSavedStatus('✅ Modelo salvo como padrão para este tipo!');
                          setTimeout(() => setPaymentTemplateSavedStatus(null), 2000);
                        }}
                        className="text-[9px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold transition-all cursor-pointer"
                        title="Salva as alterações feita nesta mensagem como novo padrão para este tipo de lembrete"
                      >
                        💾 Salvar como Padrão
                      </button>
                    </div>
                    <textarea
                      value={customPaymentMsgText}
                      onChange={(e) => setCustomPaymentMsgText(e.target.value)}
                      className="w-full text-xs bg-black border border-white/15 rounded-lg p-2.5 text-white focus:outline-hidden focus:border-emerald-500 h-28 resize-none font-mono text-[11px] leading-relaxed"
                    />
                    {paymentTemplateSavedStatus && (
                      <div className="mt-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md text-center animate-pulse">
                        {paymentTemplateSavedStatus}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-2 border-t border-emerald-500/15">
                    <span className="text-[9px] text-gray-400 italic">
                      O texto será copiado e o WhatsApp será aberto
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowPaymentWhatsApp(false)}
                        className="px-2.5 py-1.5 text-gray-400 hover:text-white text-[10px]"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          let cleanPhone = paymentWhatsAppPhone.replace(/\D/g, '');
                          if (!cleanPhone) {
                            alert('Por favor, informe o número de telefone do locatário.');
                            return;
                          }
                          if (!cleanPhone.startsWith('55')) {
                            cleanPhone = '55' + cleanPhone;
                          }


                          const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(customPaymentMsgText)}`;
                          window.open(url, '_blank');
                        }}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 shadow-md shadow-emerald-500/15 transition-all cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Enviar p/ WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showAddPayment && (
                <div className="p-3 bg-neutral-900 rounded-lg border border-white/10 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-gray-400 block mb-0.5">Data</label>
                      <input
                        type="date"
                        value={newPaymentDate}
                        onChange={(e) => setNewPaymentDate(e.target.value)}
                        className="w-full text-xs bg-black border border-white/10 rounded-md px-2 py-1 text-white focus:outline-hidden font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-400 block mb-0.5">Valor (R$)</label>
                      <input
                        type="number"
                        value={newPaymentAmount || ''}
                        onChange={(e) => setNewPaymentAmount(Number(e.target.value))}
                        placeholder="0,00"
                        className="w-full text-xs bg-black border border-white/10 rounded-md px-2 py-1 text-white focus:outline-hidden font-mono"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-1.5 text-[10px] pt-1">
                    <button
                      onClick={() => {
                        setShowAddPayment(false);
                        setNewPaymentAmount(0);
                      }}
                      className="px-2 py-1 text-gray-400 hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAddPayment}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {(!vehicle.weeklyPayments || vehicle.weeklyPayments.filter((wp) => isCurrentMonth(wp.date)).length === 0) ? (
                  <p className="text-[10px] text-gray-500 italic text-center py-2">Nenhum pagamento registrado neste mês.</p>
                ) : (
                  vehicle.weeklyPayments
                    .filter((wp) => isCurrentMonth(wp.date))
                    .slice()
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((p) => (
                      <div key={p.id} className="flex justify-between items-center text-[11px] py-1 border-b border-white/[0.02]">
                        <span className="text-gray-400 font-mono">{new Date(p.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                        <div className="flex items-center gap-2">
                          <InlineEdit
                            value={p.amount}
                            label="Pagamento Semanal"
                            onSave={(val) => handleEditPayment(p.id, val)}
                          />
                          <button
                            onClick={() => handleDeletePayment(p.id)}
                            className="text-gray-500 hover:text-rose-400 transition-colors p-0.5 rounded"
                            title="Excluir pagamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>

              {totalWeeklyReceived > 0 && (
                <div className="flex justify-between items-center text-[10px] text-gray-400 pt-1 border-t border-white/5">
                  <span>Total Recebido Semanalmente:</span>
                  <span className="font-mono text-emerald-400 font-bold">{formatBRL(totalWeeklyReceived)}</span>
                </div>
              )}
            </div>

            {/* Eventual Expenses Section */}
            <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5 space-y-3 mb-4">
              <div className="flex justify-between items-center text-xs pb-1.5 border-b border-white/5">
                <span className="font-bold text-gray-300 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                  <TrendingDown className="w-3.5 h-3.5 text-rose-400" /> Despesas do Carro (Eventuais)
                </span>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {vehicleExpenses.filter((exp) => isCurrentMonth(exp.date)).length === 0 ? (
                  <p className="text-[10px] text-gray-500 italic text-center py-2">Nenhuma despesa eventual registrada neste mês.</p>
                ) : (
                  vehicleExpenses
                    .filter((exp) => isCurrentMonth(exp.date))
                    .slice()
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((exp) => {
                      const inst = parseInstallmentInfo(exp.description);
                      return (
                        <div key={exp.id} className="flex justify-between items-center text-[11px] py-1 border-b border-white/[0.02]">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-gray-300 font-medium">{exp.description}</span>
                              {inst && (
                                <span className="text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold shrink-0">
                                  Pagas: {inst.pagas} | Faltam: {inst.faltam}
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] text-gray-500 font-mono">{new Date(exp.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="font-mono text-rose-400 font-semibold">{formatBRL(exp.cost)}</span>
                            <button
                              onClick={() => onDeleteExpense(exp.id)}
                              className="text-gray-500 hover:text-rose-400 transition-colors p-0.5 rounded cursor-pointer"
                              title="Excluir despesa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            {/* Agenda de Manutenção Preventiva (Escondido por padrão, expande ao clicar) */}
            <div id={`agenda-section-${vehicle.id}`} className="bg-white/[0.02] p-4 rounded-xl border border-white/5 space-y-3 mb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs pb-2 border-b border-white/5 gap-2">
                <button
                  type="button"
                  onClick={() => setIsAgendaExpanded(!isAgendaExpanded)}
                  className="flex justify-between items-center w-full text-left font-bold text-gray-300 gap-2 uppercase tracking-wider text-[10px] hover:text-white transition-colors cursor-pointer py-0.5"
                  title="Clique para alternar a Agenda de Manutenção"
                >
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 
                    <span>Agenda de Manutenção Preventiva</span>
                    {vehicle.preventiveMaintCurrentKm ? (
                      <span className="text-gray-400 text-[10px] normal-case font-mono">
                        (KM: {vehicle.preventiveMaintCurrentKm.toLocaleString('pt-BR')})
                      </span>
                    ) : null}
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] text-blue-400 font-semibold bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-md border border-blue-500/15 shrink-0">
                    {revCountdown && revCountdown.isWithin3Days && !isAgendaExpanded && (
                      <span className="text-[9px] text-amber-300 bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono font-bold animate-pulse">
                        ⏱️ REVISÃO EM: {revCountdown.text}
                      </span>
                    )}
                    <span>{isAgendaExpanded ? 'Recolher' : 'Agenda'}</span>
                    {isAgendaExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </span>
                </button>
                {(vehicle.preventiveMaintNextKm || vehicle.preventiveMaintDate || vehicle.preventiveMaintCurrentKm) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateVehicle({
                        ...vehicle,
                        preventiveMaintCurrentKm: undefined,
                        preventiveMaintNextKm: undefined,
                        preventiveMaintDate: undefined,
                      });
                    }}
                    className="sm:ml-2 px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold rounded-lg border border-rose-500/20 text-[10px] flex items-center gap-1 transition-all shrink-0 cursor-pointer self-end sm:self-center"
                    title="Excluir Agenda de Manutenção Preventiva"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                )}
              </div>

              {isAgendaExpanded && (
                <div className="space-y-3 pt-1 animate-in slide-in-from-top-1 duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* KM Atual */}
                    <div className="bg-white/[0.01] p-3 rounded-xl border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors">
                      <span className="text-[10px] text-gray-400 font-semibold mb-1">KM Atual</span>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500"><Gauge className="w-3.5 h-3.5" /></span>
                        <InlineEdit
                          value={vehicle.preventiveMaintCurrentKm || 0}
                          label="KM Atual"
                          onSave={(val) => handleUpdateField('preventiveMaintCurrentKm', val)}
                          isCurrency={false}
                        />
                      </div>
                    </div>

                    {/* Próximo KM */}
                    <div className="bg-white/[0.01] p-3 rounded-xl border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors">
                      <span className="text-[10px] text-gray-400 font-semibold mb-1">Próximo KM p/ Manut.</span>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500"><Wrench className="w-3.5 h-3.5" /></span>
                        <InlineEdit
                          value={vehicle.preventiveMaintNextKm || 0}
                          label="Próximo KM"
                          onSave={(val) => handleUpdateField('preventiveMaintNextKm', val)}
                          isCurrency={false}
                        />
                      </div>
                    </div>

                    {/* Data de Serviço / Revisão */}
                    <div className={`p-3 rounded-xl border flex flex-col justify-between transition-colors ${
                      revCountdown && revCountdown.isWithin3Days
                        ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                        : 'bg-white/[0.01] border-white/5 hover:border-white/10'
                    }`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-gray-400 font-semibold">Data do Serviço</span>
                        {revCountdown && revCountdown.isWithin3Days && (
                          <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono animate-pulse">
                            ⏱️ {revCountdown.text}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-gray-500"><Calendar className="w-3.5 h-3.5" /></span>
                        <InlineDateEdit
                          value={vehicle.preventiveMaintDate || '2026-07-19'}
                          onSave={(val) => {
                            onUpdateVehicle({
                              ...vehicle,
                              preventiveMaintDate: val,
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notification Schedule Bar */}
                  <div className="pt-1 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-xl">
                    <span className="text-gray-300 flex items-center gap-1.5 font-medium">
                      <Bell className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      Notificação por KM: <strong className="text-white font-mono">{vehicle.preventiveMaintNextKm ? `${vehicle.preventiveMaintNextKm.toLocaleString('pt-BR')} KM` : 'Não definido'}</strong>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const nextState = !showMaintenanceWhatsApp;
                          setShowMaintenanceWhatsApp(nextState);
                          setShowPaymentWhatsApp(false);
                          setShowAddPayment(false);
                          setShowScheduleVistoria(false);
                          setShowAddVistoria(false);
                          setIsRequestingNewVistoria(false);
                          setSharingVistoria(null);
                          if (nextState) {
                            const rawTpl = localStorage.getItem(`fleet_maint_msg_${maintenanceWhatsAppType}`) || DEFAULT_MAINTENANCE_TEMPLATES[maintenanceWhatsAppType];
                            const text = formatMaintenanceTemplateText(
                              rawTpl,
                              vehicle.driver || '',
                              vehicle.brand || '',
                              vehicle.model || '',
                              vehicle.plate || '',
                              vehicle.preventiveMaintCurrentKm || vehicle.currentKm || 0,
                              vehicle.preventiveMaintNextKm || 0,
                              vehicle.preventiveMaintDate || ''
                            );
                            setCustomMaintenanceMsgText(text);
                            if (vehicle.driverPhone) setMaintenanceWhatsAppPhone(vehicle.driverPhone);
                          }
                        }}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all cursor-pointer shadow-xs flex items-center gap-1"
                        title="Enviar lembrete de manutenção preventiva via WhatsApp com mensagens prontas"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Enviar WhatsApp</span>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (typeof window !== 'undefined' && 'Notification' in window) {
                            let perm = Notification.permission;
                            if (perm === 'default') {
                              perm = await Notification.requestPermission();
                            }
                            if (perm === 'granted') {
                              const curKm = vehicle.preventiveMaintCurrentKm || vehicle.currentKm || 0;
                              const nextKm = vehicle.preventiveMaintNextKm || 0;
                              const diff = nextKm - curKm;
                              let msg = `Quilometragem Atual: ${curKm.toLocaleString('pt-BR')} KM. Próxima Manutenção: ${nextKm.toLocaleString('pt-BR')} KM.`;
                              if (nextKm > 0 && curKm >= nextKm) {
                                msg = `🚨 ALERTA: MANUTENÇÃO VENCIDA! Veículo com ${curKm.toLocaleString('pt-BR')} KM (ultrapassou ${nextKm.toLocaleString('pt-BR')} KM).`;
                              } else if (nextKm > 0 && diff <= 500) {
                                msg = `⚠️ ATENÇÃO: Revisão próxima! Faltam apenas ${diff.toLocaleString('pt-BR')} KM.`;
                              }
                              new Notification(`🚗 Lembrete de Manutenção: ${vehicle.brand} ${vehicle.model} (${vehicle.plate})`, {
                                body: msg,
                              });
                              alert(`Notificação do navegador agendada/disparada com sucesso para ${vehicle.brand} (${vehicle.plate})!`);
                            } else {
                              alert('As notificações foram bloqueadas no seu navegador. Por favor, habilite as permissões de notificação no navegador para receber avisos.');
                            }
                          } else {
                            alert('Seu navegador não suporta notificações nativas.');
                          }
                        }}
                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all cursor-pointer shadow-xs flex items-center gap-1"
                        title="Disparar/Agendar notificação de manutenção preventiva do navegador"
                      >
                        <Bell className="w-3 h-3" />
                        <span>Agendar Lembrete</span>
                      </button>
                    </div>
                  </div>

                  {/* Maintenance WhatsApp Reminder Panel */}
                  {showMaintenanceWhatsApp && (
                    <div className="mt-2.5 p-3 bg-[#0d1f17] rounded-xl border border-emerald-500/30 space-y-3 animate-in slide-in-from-top-1 duration-150 shadow-lg text-xs">
                      <div className="flex justify-between items-center pb-2 border-b border-emerald-500/20">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                            Lembrete de Manutenção por WhatsApp
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowMaintenanceWhatsApp(false)}
                          className="text-gray-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Type Selector Tabs */}
                      <div>
                        <label className="text-[10px] text-emerald-300 block mb-1 font-bold uppercase tracking-wider">
                          Modelos Prontos de Manutenção *
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setMaintenanceWhatsAppType('proxima');
                              const rawTpl = localStorage.getItem('fleet_maint_msg_proxima') || DEFAULT_MAINTENANCE_TEMPLATES.proxima;
                              const text = formatMaintenanceTemplateText(
                                rawTpl,
                                vehicle.driver || '',
                                vehicle.brand || '',
                                vehicle.model || '',
                                vehicle.plate || '',
                                vehicle.preventiveMaintCurrentKm || vehicle.currentKm || 0,
                                vehicle.preventiveMaintNextKm || 0,
                                vehicle.preventiveMaintDate || ''
                              );
                              setCustomMaintenanceMsgText(text);
                            }}
                            className={`py-1.5 px-2 rounded-lg border text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                              maintenanceWhatsAppType === 'proxima'
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-xs'
                                : 'bg-black/40 text-gray-400 border-white/10 hover:border-white/20 hover:text-white'
                            }`}
                          >
                            <span>🚗 Revisão Próxima</span>
                            <span className="text-[8px] opacity-70 font-normal">Aviso de KM</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setMaintenanceWhatsAppType('vencida');
                              const rawTpl = localStorage.getItem('fleet_maint_msg_vencida') || DEFAULT_MAINTENANCE_TEMPLATES.vencida;
                              const text = formatMaintenanceTemplateText(
                                rawTpl,
                                vehicle.driver || '',
                                vehicle.brand || '',
                                vehicle.model || '',
                                vehicle.plate || '',
                                vehicle.preventiveMaintCurrentKm || vehicle.currentKm || 0,
                                vehicle.preventiveMaintNextKm || 0,
                                vehicle.preventiveMaintDate || ''
                              );
                              setCustomMaintenanceMsgText(text);
                            }}
                            className={`py-1.5 px-2 rounded-lg border text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                              maintenanceWhatsAppType === 'vencida'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-xs'
                                : 'bg-black/40 text-gray-400 border-white/10 hover:border-white/20 hover:text-white'
                            }`}
                          >
                            <span>🚨 Manutenção Vencida</span>
                            <span className="text-[8px] opacity-70 font-normal">Alerta Urgente</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setMaintenanceWhatsAppType('agendada');
                              const rawTpl = localStorage.getItem('fleet_maint_msg_agendada') || DEFAULT_MAINTENANCE_TEMPLATES.agendada;
                              const text = formatMaintenanceTemplateText(
                                rawTpl,
                                vehicle.driver || '',
                                vehicle.brand || '',
                                vehicle.model || '',
                                vehicle.plate || '',
                                vehicle.preventiveMaintCurrentKm || vehicle.currentKm || 0,
                                vehicle.preventiveMaintNextKm || 0,
                                vehicle.preventiveMaintDate || ''
                              );
                              setCustomMaintenanceMsgText(text);
                            }}
                            className={`py-1.5 px-2 rounded-lg border text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                              maintenanceWhatsAppType === 'agendada'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                                : 'bg-black/40 text-gray-400 border-white/10 hover:border-white/20 hover:text-white'
                            }`}
                          >
                            <span>📅 Agendamento</span>
                            <span className="text-[8px] opacity-70 font-normal">Data Marcada</span>
                          </button>
                        </div>
                      </div>

                      {/* Input Phone */}
                      <div>
                        <label className="text-[9px] text-gray-300 block mb-0.5 font-semibold uppercase tracking-wider">
                          Telefone do Locatário (WhatsApp) *
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-2 font-mono text-[10px] text-gray-500 select-none font-semibold">
                            +55
                          </span>
                          <input
                            type="text"
                            placeholder="11999991234"
                            value={maintenanceWhatsAppPhone}
                            onChange={(e) => {
                              let val = e.target.value.replace(/\D/g, '');
                              if (val.startsWith('55') && val.length > 2) {
                                val = val.substring(2);
                              }
                              setMaintenanceWhatsAppPhone(val);
                            }}
                            className="w-full text-xs bg-black border border-white/15 rounded-lg pl-9 pr-2 py-1.5 text-white focus:outline-hidden focus:border-emerald-500 font-mono"
                          />
                        </div>
                      </div>

                      {/* Textarea */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[9px] text-gray-300 font-semibold uppercase tracking-wider">
                            Texto da Mensagem Pronta
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              localStorage.setItem(`fleet_maint_msg_${maintenanceWhatsAppType}`, customMaintenanceMsgText);
                              setMaintenanceTemplateSavedStatus('✅ Modelo salvo como padrão para este tipo!');
                              setTimeout(() => setMaintenanceTemplateSavedStatus(null), 2000);
                            }}
                            className="text-[9px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold transition-all cursor-pointer"
                          >
                            💾 Salvar como Padrão
                          </button>
                        </div>
                        <textarea
                          value={customMaintenanceMsgText}
                          onChange={(e) => setCustomMaintenanceMsgText(e.target.value)}
                          className="w-full text-xs bg-black border border-white/15 rounded-lg p-2.5 text-white focus:outline-hidden focus:border-emerald-500 h-28 resize-none font-mono text-[11px] leading-relaxed"
                        />
                        {maintenanceTemplateSavedStatus && (
                          <div className="mt-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md text-center animate-pulse">
                            {maintenanceTemplateSavedStatus}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex justify-between items-center pt-2 border-t border-emerald-500/15">
                        <span className="text-[9px] text-gray-400 italic">
                          O WhatsApp será aberto com a mensagem pronta
                        </span>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setShowMaintenanceWhatsApp(false)}
                            className="px-2.5 py-1.5 text-gray-400 hover:text-white text-[10px]"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              let cleanPhone = maintenanceWhatsAppPhone.replace(/\D/g, '');
                              if (!cleanPhone) {
                                alert('Por favor, informe o número de telefone do locatário.');
                                return;
                              }
                              if (!cleanPhone.startsWith('55')) {
                                cleanPhone = '55' + cleanPhone;
                              }


                              const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(customMaintenanceMsgText)}`;
                              window.open(url, '_blank');
                            }}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 shadow-md shadow-emerald-500/15 transition-all cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Enviar p/ WhatsApp</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Vistorias (Laudos de Inspeção) */}
            <div id={`vistorias-section-${vehicle.id}`} className="bg-white/[0.02] p-4 rounded-xl border border-white/5 space-y-3 mb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs pb-1.5 border-b border-white/5 gap-2">
                <button
                  type="button"
                  onClick={() => setIsVistoriaExpanded(!isVistoriaExpanded)}
                  className="flex items-center justify-between text-xs text-left cursor-pointer group w-full sm:w-auto"
                  title="Clique para alternar as Vistorias"
                >
                  <span className="font-bold text-gray-300 flex items-center gap-1.5 uppercase tracking-wider text-[10px] group-hover:text-white transition-colors">
                    <ClipboardCheck className="w-3.5 h-3.5 text-purple-400" /> Vistorias (Checklist)
                    {vehicleVistorias.length > 0 && (
                      <span className="text-gray-400 text-[10px] normal-case font-mono">
                        ({vehicleVistorias.length})
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] text-purple-400 font-semibold bg-purple-500/10 hover:bg-purple-500/20 px-2 py-0.5 rounded-md border border-purple-500/15 ml-3">
                    <span>{isVistoriaExpanded ? 'Recolher' : 'Vistorias'}</span>
                    {isVistoriaExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-1.5 w-full sm:w-auto shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isVistoriaExpanded) setIsVistoriaExpanded(true);
                      const nextState = !showScheduleVistoria;
                      setShowScheduleVistoria(nextState);
                      setShowAddVistoria(false);
                      setShowPaymentWhatsApp(false);
                      setShowAddPayment(false);
                      setShowMaintenanceWhatsApp(false);
                      setIsRequestingNewVistoria(false);
                      setSharingVistoria(null);
                      setScheduleDateInput(vehicle.nextVistoriaDate || new Date().toISOString().split('T')[0]);
                    }}
                    className={`text-[11px] font-bold flex items-center justify-center gap-1 px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                      vehicle.nextVistoriaDate
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30'
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20'
                    }`}
                    id={`btn-schedule-vistoria-${vehicle.id}`}
                    title="Agendar data para a realização da vistoria"
                  >
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    <span>{showScheduleVistoria ? 'Fechar' : (vehicle.nextVistoriaDate ? 'Agendada' : 'Agendar')}</span>
                  </button>
                  <button
                    onClick={() => {
                      if (!isVistoriaExpanded) setIsVistoriaExpanded(true);
                      handleInitiateRequestVistoria();
                    }}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center justify-center gap-1 px-2.5 py-1 bg-emerald-500/10 rounded-md border border-emerald-500/10 hover:border-emerald-500/20 transition-all"
                    id={`btn-request-vistoria-${vehicle.id}`}
                    title="Solicitar vistoria via WhatsApp com link de retorno"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Solicitar</span>
                  </button>
                  <button
                    onClick={() => {
                      if (!isVistoriaExpanded) setIsVistoriaExpanded(true);
                      const nextState = !showAddVistoria;
                      setShowAddVistoria(nextState);
                      setShowScheduleVistoria(false);
                      setShowPaymentWhatsApp(false);
                      setShowAddPayment(false);
                      setShowMaintenanceWhatsApp(false);
                      setIsRequestingNewVistoria(false);
                      setSharingVistoria(null);
                    }}
                    className="text-[11px] text-purple-400 hover:text-purple-300 font-bold flex items-center justify-center gap-1 px-2.5 py-1 bg-purple-500/10 rounded-md border border-purple-500/10 hover:border-purple-500/20 transition-all col-span-2"
                    id={`btn-new-vistoria-${vehicle.id}`}
                  >
                    <span>{showAddVistoria ? 'Fechar' : '+ Nova Vistoria'}</span>
                  </button>
                </div>
              </div>

              {isVistoriaExpanded && (
                <div className="space-y-3 pt-1 animate-in slide-in-from-top-1 duration-150">

              {/* Lembrete / Painel de Agendamento de Vistoria */}
              {showScheduleVistoria && (
                <div className="p-3 bg-neutral-900/90 rounded-xl border border-blue-500/30 space-y-3 animate-in slide-in-from-top-1 duration-150 shadow-lg">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Agendar Vistoria do Veículo
                      </span>
                    </div>
                    {vehicle.nextVistoriaDate && (
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                        Data Atual: {new Date(vehicle.nextVistoriaDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                    <div>
                      <label className="text-[10px] text-gray-300 block mb-1 font-semibold uppercase tracking-wider">
                        Data Agendada para a Vistoria *
                      </label>
                      <input
                        type="date"
                        value={scheduleDateInput}
                        onChange={(e) => setScheduleDateInput(e.target.value)}
                        className="w-full text-xs bg-black border border-white/15 rounded-lg px-3 py-2 text-white focus:outline-hidden focus:border-blue-500 font-mono"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!scheduleDateInput) return;
                          onUpdateVehicle({
                            ...vehicle,
                            nextVistoriaDate: scheduleDateInput,
                          });
                          setScheduleFeedback('✅ Vistoria agendada com sucesso!');
                          setTimeout(() => {
                            setScheduleFeedback(null);
                            setShowScheduleVistoria(false);
                          }, 1800);
                        }}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Confirmar Agendamento</span>
                      </button>

                      {vehicle.nextVistoriaDate && (
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateVehicle({
                              ...vehicle,
                              nextVistoriaDate: undefined,
                            });
                            setScheduleFeedback('Agendamento removido.');
                            setTimeout(() => {
                              setScheduleFeedback(null);
                              setShowScheduleVistoria(false);
                            }, 1200);
                          }}
                          className="px-3 py-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/20 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1"
                          title="Remover data agendada"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Desagendar</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {scheduleFeedback && (
                    <p className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg text-center animate-pulse">
                      {scheduleFeedback}
                    </p>
                  )}
                </div>
              )}

              {/* Status de Agendamento da Vistoria */}
              {vehicle.nextVistoriaDate && !showScheduleVistoria && (
                <div className="bg-blue-950/30 border border-blue-500/25 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="text-blue-200 text-[11px] leading-tight">
                      <strong>📅 Vistoria Agendada:</strong> {new Date(vehicle.nextVistoriaDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowScheduleVistoria(true)}
                      className="text-[10px] text-blue-300 hover:text-white bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 px-2 py-0.5 rounded font-bold transition-all cursor-pointer"
                    >
                      Alterar Data
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateVehicle({
                          ...vehicle,
                          nextVistoriaDate: undefined,
                        });
                      }}
                      className="text-[10px] text-rose-400 hover:text-white bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/25 px-2 py-0.5 rounded font-bold transition-all cursor-pointer"
                      title="Desagendar vistoria"
                    >
                      Desagendar
                    </button>
                  </div>
                </div>
              )}

              {/* Lembrete de Vistoria de Sexta-Feira */}
              <div className="bg-purple-950/20 border border-purple-500/20 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-purple-200 text-[11px] leading-tight">
                    <strong>📅 Lembrete Semanal:</strong> Enviar vistoria em todos os carros <strong>toda Sexta-Feira</strong>.
                  </span>
                </div>
              </div>

              {showAddVistoria && (
                <div className="p-3 bg-neutral-900 rounded-lg border border-white/10 space-y-3 animate-in slide-in-from-top-1 duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-gray-400 block mb-1 font-semibold uppercase tracking-wider">Tipo de Vistoria *</label>
                      <select
                        value={newVistoriaType}
                        onChange={(e) => setNewVistoriaType(e.target.value as any)}
                        className="w-full text-xs bg-black border border-white/10 rounded-md px-2.5 py-1.5 text-white focus:outline-hidden focus:border-purple-500/50 cursor-pointer font-medium"
                      >
                        <option value="Entrega de Veículo">Entrega de Carro</option>
                        <option value="Periódica">Periódica</option>
                        <option value="Devolução de Veículo">Devolução de Carro</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-400 block mb-1 font-semibold uppercase tracking-wider">Data da Vistoria</label>
                      <input
                        type="date"
                        value={newVistoriaDate}
                        onChange={(e) => setNewVistoriaDate(e.target.value)}
                        className="w-full text-xs bg-black border border-white/10 rounded-md px-2.5 py-1.5 text-white focus:outline-hidden focus:border-purple-500/50 font-mono"
                      />
                    </div>
                  </div>

                  {/* Checklist Items */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-gray-400 block font-semibold uppercase tracking-wider">Itens de Inspeção</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries({
                        pneusEstepe: 'Pneus e estepe',
                        faroisLanternas: 'Faróis e lanternas',
                        estofadosBancos: 'Estofados e bancos',
                        pinturaLataria: 'Pintura e lataria',
                        documentosVeiculo: 'Documentos no veículo (CRLV)',
                        nivelBateria: 'Nível de combustível',
                        limpeza: 'Limpeza interna e externa',
                        trianguloMacaco: 'Triângulo e macaco',
                        painelLuzes: 'Painel sem luzes de alerta',
                        chavesControles: 'Chaves e controles',
                      }).map(([key, label]) => {
                        const isChecked = newVistoriaChecklist[key as keyof typeof newVistoriaChecklist];
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setNewVistoriaChecklist(prev => ({ ...prev, [key]: !isChecked }))}
                            className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                              isChecked 
                                ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10' 
                                : 'bg-rose-500/5 text-rose-400 border-rose-500/10'
                            }`}
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 shrink-0 text-emerald-400 animate-in zoom-in-50 duration-100" />
                            ) : (
                              <Square className="w-4 h-4 shrink-0 text-rose-400" />
                            )}
                            <span className="text-[11px] font-medium leading-none">{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>



                  {/* Vistoria Photos Upload */}
                  <div>
                    <label className="text-[9px] text-gray-400 block mb-1 font-semibold uppercase tracking-wider">Fotos da Vistoria</label>
                    <div className="mb-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-md">
                      <p className="text-[10px] font-bold text-blue-400 mb-1">📸 ATENÇÃO - FOTOS IMPORTANTES:</p>
                      <ul className="text-[10px] text-blue-200/80 space-y-0.5 ml-4 list-disc">
                        <li>Foto do <strong>painel com quilometragem</strong>.</li>
                        <li>Foto da <strong>lataria</strong> (frente, traseira e laterais).</li>
                      </ul>
                    </div>
                    <div 
                      className={`relative border border-dashed rounded-lg p-4 text-center transition-all ${
                        isDraggingPhoto ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                      }`}
                      onDragOver={handleVistoriaDragOver}
                      onDragLeave={handleVistoriaDragLeave}
                      onDrop={handleVistoriaDrop}
                    >
                      <input 
                        type="file" 
                        accept="image/*"
                        multiple
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleVistoriaFileSelect}
                        title="Escolha as fotos ou arraste-as aqui"
                      />
                      <Camera className="w-5 h-5 mx-auto text-gray-500 mb-2" />
                      <p className="text-xs text-gray-400">Arraste fotos ou clique para enviar</p>
                      <p className="text-[10px] text-gray-600 mt-1">Imagens anexadas serão incluídas no laudo PDF</p>
                    </div>
                    {newVistoriaPhotos.length > 0 && (
                      <div className="mt-2 flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                        {newVistoriaPhotos.map((photo, pIdx) => (
                          <div key={pIdx} className="relative shrink-0 group">
                            <img src={photo} alt="Upload preview" className="w-14 h-14 object-cover rounded-md border border-white/10" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setNewVistoriaPhotos(prev => prev.filter((_, i) => i !== pIdx));
                              }}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-rose-500/30 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-[9px] text-gray-400 block mb-1 font-semibold uppercase tracking-wider">Observações / Pendências</label>
                    <textarea
                      placeholder="Ex: Riscos leves no para-choque traseiro, banco traseiro com pequena mancha..."
                      value={newVistoriaNotes}
                      onChange={(e) => setNewVistoriaNotes(e.target.value)}
                      className="w-full text-xs bg-black border border-white/10 rounded-md px-2.5 py-1.5 text-white focus:outline-hidden focus:border-purple-500/50 h-16 resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-1.5 text-[10px] pt-1 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddVistoria(false);
                        setNewVistoriaPhotos([]);
                        setNewVistoriaNotes('');
                        setNewVistoriaChecklist({
                          pneusEstepe: true,
                          faroisLanternas: true,
                          estofadosBancos: true,
                          pinturaLataria: true,
                          documentosVeiculo: true,
                          nivelBateria: true,
                          limpeza: true,
                          trianguloMacaco: true,
                          painelLuzes: true,
                          chavesControles: true,
                        });
                      }}
                      className="px-2.5 py-1.5 text-gray-400 hover:text-white transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleAddVistoriaSubmit}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-md font-bold transition-colors shadow-md shadow-purple-500/10"
                    >
                      Salvar Vistoria
                    </button>
                  </div>
                </div>
              )}

              {/* Vistorias List */}
              {vistorias && vistorias.length > 0 && (
                <div className="flex items-center justify-between pb-1.5 border-b border-white/5 mb-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ClipboardCheck className="w-3.5 h-3.5 text-purple-400" />
                    <span>Histórico ({vistorias.length} vistorias)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (onDeleteAllVistorias) {
                        onDeleteAllVistorias(vehicle.id);
                      } else if (onDeleteVistoria) {
                        vistorias.forEach((v) => onDeleteVistoria(v.id));
                      }
                    }}
                    className="text-[10px] text-rose-400 hover:text-white font-bold flex items-center gap-1 px-2.5 py-1 bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/30 rounded-md transition-all cursor-pointer shadow-sm"
                    title="Excluir todas as vistorias deste veículo"
                  >
                    <Trash2 className="w-3 h-3 text-rose-400" />
                    <span>Excluir Todas</span>
                  </button>
                </div>
              )}

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {(!vistorias || vistorias.length === 0) ? (
                  <div className="text-center py-6 border border-dashed border-white/5 rounded-lg bg-black/10">
                    <ClipboardCheck className="w-5 h-5 mx-auto text-gray-600 mb-1" />
                    <p className="text-[10px] text-gray-500 italic">Nenhuma vistoria registrada para este veículo.</p>
                  </div>
                ) : (
                  [...vistorias]
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((v) => {
                      const totalItems = Object.keys(v.checklist).length;
                      const approvedCount = Object.values(v.checklist).filter(Boolean).length;
                      const isFullApproved = approvedCount === totalItems;
                      const isExpanded = expandedVistoriaId === v.id;

                      return (
                        <div key={v.id} className="border border-white/5 rounded-lg bg-white/[0.01] hover:bg-white/[0.02] p-2 text-xs transition-all">
                          <div 
                            className="flex justify-between items-start gap-2 cursor-pointer select-none"
                            onClick={() => setExpandedVistoriaId(isExpanded ? null : v.id)}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono text-gray-300 font-semibold">
                                  {new Date(v.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                </span>
                                {v.type && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                    {v.type}
                                  </span>
                                )}
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm ${
                                  isFullApproved 
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' 
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/10'
                                }`}>
                                  {isFullApproved ? 'Aprovado' : `${approvedCount}/${totalItems} Itens`}
                                </span>
                                {v.photos && v.photos.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedVistoriaId(isExpanded ? null : v.id);
                                    }}
                                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-blue-500/15 text-blue-300 border border-blue-500/20 flex items-center gap-1 hover:bg-blue-500/25 transition-colors cursor-pointer"
                                    title="Clique para ver as fotos da vistoria"
                                  >
                                    <Camera className="w-2.5 h-2.5 text-blue-400" />
                                    <span>{v.photos.length} foto(s)</span>
                                  </button>
                                )}
                              </div>
                              {v.notes && (
                                <p className="text-gray-400 text-[10px] mt-1 line-clamp-1 italic">{v.notes}</p>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => setExpandedVistoriaId(isExpanded ? null : v.id)}
                                className="px-2 py-0.5 bg-white/5 hover:bg-white/10 rounded border border-white/5 text-gray-400 hover:text-white transition-all text-[10px] cursor-pointer"
                              >
                                {isExpanded ? 'Recolher' : 'Detalhes'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleInitiateShareVistoria(v)}
                                className="px-2 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 rounded border border-emerald-500/10 hover:border-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-all text-[10px] flex items-center gap-1 cursor-pointer"
                                title="Enviar Laudo por WhatsApp"
                              >
                                <MessageCircle className="w-3 h-3 text-emerald-400" />
                                <span>Enviar</span>
                              </button>
                              {onDeleteVistoria && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteVistoria(v.id);
                                  }}
                                  className="px-2 py-0.5 text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/30 border border-rose-500/20 rounded text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                  title="Excluir Vistoria"
                                >
                                  <Trash2 className="w-3 h-3 text-rose-400" />
                                  <span>Excluir</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Expanded Inspection Checklist Details */}
                          {isExpanded && (
                            <div className="mt-2.5 pt-2.5 border-t border-white/5 space-y-2.5 animate-in slide-in-from-top-1 duration-150">
                              <div>
                                <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Checklist Detalhado</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                  {Object.entries({
                                    pneusEstepe: 'Pneus e estepe',
                                    faroisLanternas: 'Faróis e lanternas',
                                    estofadosBancos: 'Estofados e bancos',
                                    pinturaLataria: 'Pintura e lataria',
                                    documentosVeiculo: 'Documentos no veículo (CRLV)',
                                    nivelBateria: 'Nível de combustível',
                                    limpeza: 'Limpeza interna e externa',
                                    trianguloMacaco: 'Triângulo e macaco',
                                    painelLuzes: 'Painel sem luzes de alerta',
                                    chavesControles: 'Chaves e controles',
                                  }).map(([itemKey, itemLabel]) => {
                                    const isOk = v.checklist[itemKey as keyof typeof v.checklist];
                                    return (
                                      <div key={itemKey} className="flex items-center gap-1.5 text-[10px]">
                                        {isOk ? (
                                          <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                                        ) : (
                                          <X className="w-3 h-3 text-rose-400 shrink-0" />
                                        )}
                                        <span className={isOk ? 'text-gray-300' : 'text-gray-500 line-through'}>{itemLabel}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {v.photos && v.photos.length > 0 ? (
                                <div>
                                  <h4 className="text-[9px] font-bold text-blue-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <Camera className="w-3 h-3 text-blue-400" />
                                    Fotos Registradas ({v.photos.length}) - Clique para ampliar
                                  </h4>
                                  <div className="flex gap-2 flex-wrap">
                                    {v.photos.map((ph, pIdx) => (
                                      <div 
                                        key={pIdx} 
                                        className="w-16 h-16 rounded-md overflow-hidden border border-white/10 cursor-pointer hover:border-blue-400 hover:scale-105 transition-all relative group"
                                        onClick={() => {
                                          setPreviewDoc({
                                            id: `vistoria-photo-${pIdx}-${v.id}`,
                                            name: `Foto de Vistoria (${v.type || 'Geral'}) - ${new Date(v.date + 'T12:00:00').toLocaleDateString('pt-BR')}`,
                                            category: 'Vistoria',
                                            uploadDate: v.date,
                                            contentUrl: ph,
                                            fileType: 'image'
                                          });
                                        }}
                                      >
                                        <img src={ph} alt="foto vistoria" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                          <Camera className="w-4 h-4 text-white" />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="p-2 bg-black/20 rounded border border-white/5 flex items-center gap-2 text-[10px] text-gray-400">
                                  <Camera className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                  <span>Nenhuma foto foi anexada durante o registro desta vistoria.</span>
                                </div>
                              )}

                              {v.notes && (
                                <div className="p-2 bg-black/40 rounded border border-white/5">
                                  <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Observações</h4>
                                  <p className="text-[10px] text-gray-300 whitespace-pre-wrap">{v.notes}</p>
                                </div>
                              )}

                              {onDeleteVistoria && (
                                <div className="pt-2 border-t border-white/5 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteVistoria(v.id);
                                    }}
                                    className="px-3 py-1 bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                    <span>Excluir esta Vistoria</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                )}
              </div>

              {(sharingVistoria || isRequestingNewVistoria) && (
                <div className="p-3 bg-emerald-950/20 rounded-lg border border-emerald-500/20 space-y-3 mt-3 animate-in fade-in duration-150 text-xs">
                  <div className="flex justify-between items-center pb-1.5 border-b border-emerald-500/10">
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5" /> 
                      {isRequestingNewVistoria ? 'Solicitar Vistoria' : 'Enviar Laudo de Vistoria'}
                    </span>
                    <button
                      onClick={() => {
                        setSharingVistoria(null);
                        setIsRequestingNewVistoria(false);
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-2.5 text-xs text-white">
                    {isRequestingNewVistoria && (
                      <div className="bg-emerald-900/30 border border-emerald-500/30 p-2.5 rounded-lg space-y-1">
                        <label className="text-[10px] text-emerald-300 block font-bold uppercase tracking-wider">
                          1. Selecione o Tipo de Vistoria *
                        </label>
                        <select
                          value={requestVistoriaType}
                          onChange={(e) => {
                            const newType = e.target.value as 'Entrega de Veículo' | 'Periódica' | 'Devolução de Veículo';
                            setRequestVistoriaType(newType);
                            const savedTemplate = localStorage.getItem('fleet_vistoria_request_template') || DEFAULT_REQUEST_TEMPLATE;
                            const formatted = formatTemplateText(savedTemplate, false, null, newType);
                            setCustomVistoriaMsgText(formatted);
                          }}
                          className="w-full text-xs bg-black border border-emerald-500/40 rounded-md px-2.5 py-1.5 text-white focus:outline-hidden focus:border-emerald-400 font-semibold cursor-pointer"
                          id={`select-request-vistoria-type-${vehicle.id}`}
                        >
                          <option value="Entrega de Veículo">Entrega do Carro</option>
                          <option value="Periódica">Periódica (Rotina)</option>
                          <option value="Devolução de Veículo">Devolução do Carro</option>
                        </select>
                        <p className="text-[9px] text-emerald-400/80 italic">
                          O tipo escolhido será preenchido na mensagem e incorporado no link enviado ao locatário.
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-gray-400 block mb-1 font-semibold uppercase tracking-wider">Telefone do Locatário</label>
                        <div className="relative flex items-center">
                          <span className="absolute left-2.5 font-mono text-xs text-gray-500 select-none font-semibold">
                            +55
                          </span>
                          <input
                            type="text"
                            placeholder="Ex: 11999991234"
                            value={whatsappVistoriaPhone}
                            onChange={(e) => {
                              let val = e.target.value.replace(/\D/g, '');
                              if (val.startsWith('55') && val.length > 2) {
                                val = val.substring(2);
                              }
                              setWhatsappVistoriaPhone(val);
                            }}
                            className="w-full text-xs bg-black border border-white/10 rounded-md pl-10 pr-2.5 py-1.5 text-white focus:outline-hidden focus:border-emerald-500/50 font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-400 block mb-1 font-semibold uppercase tracking-wider">Link para Retorno de Fotos</label>
                        <input
                          type="text"
                          placeholder="Ex: https://form.jotform.com/sua-vistoria"
                          value={vistoriaReturnLink}
                          onChange={(e) => setVistoriaReturnLink(e.target.value)}
                          className="w-full text-xs bg-black border border-white/10 rounded-md px-2.5 py-1.5 text-white focus:outline-hidden focus:border-emerald-500/50 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Mensagem pré-preenchida</label>
                        <button
                          type="button"
                          onClick={() => saveTemplateFromText(customVistoriaMsgText, !!sharingVistoria, sharingVistoria)}
                          className="text-[9px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold transition-all"
                          title="Salva as alterações feitas nesta mensagem para ser o novo padrão nos próximos envios"
                        >
                          💾 Salvar como Padrão
                        </button>
                      </div>
                      <textarea
                        value={customVistoriaMsgText}
                        onChange={(e) => setCustomVistoriaMsgText(e.target.value)}
                        className="w-full text-xs bg-black border border-white/10 rounded-md px-2.5 py-1.5 text-white focus:outline-hidden focus:border-emerald-500/50 h-32 resize-none font-mono text-[10px]"
                      />
                      {templateSavedStatus && (
                        <div className="mt-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md text-center animate-pulse">
                          {templateSavedStatus}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-emerald-500/10">
                    <span className="text-[9px] text-gray-400 italic">O texto será copiado para sua área de transferência</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          setSharingVistoria(null);
                          setIsRequestingNewVistoria(false);
                        }}
                        className="px-2.5 py-1.5 text-gray-400 hover:text-white text-[10px]"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSendVistoriaWhatsAppSubmit}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-bold text-[10px] flex items-center gap-1.5 shadow-md shadow-emerald-500/10 transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        Enviar p/ WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              )}
                </div>
              )}
            </div>

            {/* Documentos do Veículo */}
            <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5 space-y-3 mb-4">
              <div className="flex justify-between items-center text-xs pb-1.5 border-b border-white/5 gap-2">
                <button
                  type="button"
                  onClick={() => setIsDocExpanded(!isDocExpanded)}
                  className="flex-1 flex items-center justify-between text-xs text-left cursor-pointer group"
                  title="Clique para alternar os Documentos"
                >
                  <span className="font-bold text-gray-300 flex items-center gap-1.5 uppercase tracking-wider text-[10px] group-hover:text-white transition-colors">
                    <Paperclip className="w-3.5 h-3.5 text-blue-400" /> Documentos do Veículo
                    {(vehicle.documents || []).length > 0 && (
                      <span className="text-gray-400 text-[10px] normal-case font-mono">
                        ({(vehicle.documents || []).length})
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] text-blue-400 font-semibold bg-blue-500/10 hover:bg-blue-500/20 px-2 py-0.5 rounded-md border border-blue-500/15 mr-2">
                    <span>{isDocExpanded ? 'Recolher' : 'Documentos'}</span>
                    {isDocExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </span>
                </button>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onOpenRentalContract?.(vehicle)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-md border border-emerald-500/20 transition-all cursor-pointer"
                    title="Gerar contrato de locação e anexar em PDF"
                  >
                    <FileText className="w-3 h-3" />
                    <span>Gerar Contrato</span>
                  </button>

                  <button
                    onClick={() => {
                      if (!isDocExpanded) setIsDocExpanded(true);
                      setShowAddDoc(!showAddDoc);
                    }}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/10 rounded-md border border-blue-500/10 hover:border-blue-500/20 transition-all"
                  >
                    {showAddDoc ? 'Fechar' : '+ Anexo'}
                  </button>
                </div>
              </div>

              {isDocExpanded && (
                <div className="space-y-3 pt-1 animate-in slide-in-from-top-1 duration-150">

              {showAddDoc && (
                <div className="p-3 bg-neutral-900 rounded-lg border border-white/10 space-y-3">
                  {/* File Upload zone with Drag and Drop */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById(`file-input-${vehicle.id}`)?.click()}
                    className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
                      isDragging 
                        ? 'border-blue-500 bg-blue-500/10' 
                        : 'border-white/10 hover:border-white/20 bg-black/40 hover:bg-black/60'
                    }`}
                  >
                    <input
                      type="file"
                      id={`file-input-${vehicle.id}`}
                      onChange={handleFileSelect}
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
                    />
                    <UploadCloud className="w-7 h-7 mx-auto text-gray-400 mb-2 transition-transform" />
                    <p className="text-xs text-gray-300 font-semibold">Arraste e solte o arquivo aqui</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Ou clique para navegar nos seus arquivos</p>
                  </div>

                  {newDocName && (
                    <div className="p-2 bg-white/[0.02] border border-white/5 rounded-md flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                        <span className="text-gray-300 truncate font-mono">{newDocName}</span>
                      </div>
                      <span className="text-[9px] text-gray-500 font-mono font-semibold shrink-0 ml-2">{newDocSize || '---'}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div>
                      <label className="text-[9px] text-gray-400 block mb-1 font-semibold uppercase tracking-wider">Nome do Documento</label>
                      <input
                        type="text"
                        placeholder="Ex: Contrato de Locação 2026"
                        value={newDocName}
                        onChange={(e) => setNewDocName(e.target.value ? e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) : '')}
                        className="w-full text-xs bg-black border border-white/10 rounded-md px-2.5 py-1.5 text-white focus:outline-hidden focus:border-blue-500/50 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-gray-400 block mb-1 font-semibold uppercase tracking-wider">Categoria</label>
                      <select
                        value={newDocCategory}
                        onChange={(e) => setNewDocCategory(e.target.value)}
                        className="w-full text-xs bg-black border border-white/10 rounded-md px-2 py-1.5 text-white focus:outline-hidden focus:border-blue-500/50 transition-colors"
                      >
                        <option value="Contrato">Contrato</option>
                        <option value="CRLV">CRLV</option>
                        <option value="Vistoria">Vistoria</option>
                        <option value="Comprovante">Comprovante</option>
                        <option value="Outros">Outros (Personalizado)</option>
                      </select>
                    </div>

                    {newDocCategory === 'Outros' && (
                      <div className="animate-in fade-in duration-100">
                        <label className="text-[9px] text-gray-400 block mb-1 font-semibold uppercase tracking-wider">Nome da Categoria Customizada *</label>
                        <input
                          type="text"
                          placeholder="Ex: Nota Fiscal, Laudo Técnico..."
                          value={customCategoryName}
                          onChange={(e) => setCustomCategoryName(e.target.value)}
                          className="w-full text-xs bg-black border border-white/10 rounded-md px-2.5 py-1.5 text-white focus:outline-hidden focus:border-blue-500/50 transition-colors"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-1.5 text-[10px] pt-1 border-t border-white/5">
                    <button
                      onClick={() => {
                        setShowAddDoc(false);
                        setNewDocName('');
                        setNewDocCategory('Contrato');
                        setNewDocDataUrl('');
                        setNewDocSize('');
                      }}
                      className="px-2.5 py-1.5 text-gray-400 hover:text-white transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAddDocSubmit}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-bold transition-colors shadow-md shadow-blue-500/10"
                    >
                      Salvar Documento
                    </button>
                  </div>
                </div>
              )}

              {sharingDoc && (
                <div className="p-3 bg-emerald-950/20 rounded-lg border border-emerald-500/20 space-y-3 animate-in fade-in duration-150">
                  <div className="flex justify-between items-center pb-1.5 border-b border-emerald-500/10">
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5" /> Enviar via WhatsApp
                    </span>
                    <button
                      onClick={() => {
                        setSharingDoc(null);
                        setWhatsappPhone('');
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <div className="space-y-2.5 text-xs text-white">
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold mb-1 uppercase tracking-wider">Documento Selecionado</p>
                      <div className="p-2 bg-black/40 border border-white/5 rounded-md flex items-center gap-2 font-mono text-[11px]">
                        <FileText className="w-4 h-4 text-emerald-400" />
                        <span className="truncate">{sharingDoc.name}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-gray-400 block mb-1 font-semibold uppercase tracking-wider">Telefone do Locatário</label>
                        <div className="relative flex items-center">
                          <span className="absolute left-2.5 font-mono text-xs text-gray-500 select-none font-semibold">
                            +55
                          </span>
                          <input
                            type="text"
                            placeholder="Ex: 11999991234"
                            value={whatsappPhone}
                            onChange={(e) => {
                              let val = e.target.value.replace(/\D/g, '');
                              if (val.startsWith('55') && val.length > 2) {
                                val = val.substring(2);
                              }
                              setWhatsappPhone(val);
                            }}
                            className="w-full text-xs bg-black border border-white/10 rounded-md pl-10 pr-2.5 py-1.5 text-white focus:outline-hidden focus:border-emerald-500/50 font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-400 block mb-1 font-semibold uppercase tracking-wider">Locatário Responsável</label>
                        <div className="p-2 bg-white/[0.02] border border-white/5 rounded-md text-gray-300 font-semibold py-1.5">
                          {vehicle.driver || 'Não definido'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] text-gray-400 block mb-1 font-semibold uppercase tracking-wider">Mensagem pré-preenchida</label>
                      <textarea
                        value={customMsgText}
                        onChange={(e) => setCustomMsgText(e.target.value)}
                        className="w-full text-xs bg-black border border-white/10 rounded-md px-2.5 py-1.5 text-white focus:outline-hidden focus:border-emerald-500/50 h-20 resize-none font-mono text-[10px]"
                      />
                    </div>

                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-[10px] text-emerald-300 leading-relaxed space-y-1.5">
                      <p className="font-bold flex items-center gap-1 text-emerald-400 text-[11px]">
                        <Paperclip className="w-3.5 h-3.5 shrink-0" />
                        Como anexar o documento no WhatsApp:
                      </p>
                      <p className="text-gray-300">
                        1. O WhatsApp não permite anexar arquivos automaticamente por link.<br />
                        2. Ao clicar em <strong>Enviar p/ WhatsApp</strong>, a mensagem é copiada e o arquivo é baixado.<br />
                        3. No WhatsApp, basta colar a mensagem e anexar o arquivo que acabou de ser baixado.<br />
                        4. 💡 <strong>Dica:</strong> Use o botão <strong>Compartilhar Arquivo</strong> para enviar o arquivo e o texto juntos (funciona melhor em celulares).
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-2 border-t border-emerald-500/10">
                    <button
                      onClick={() => {
                        setSharingDoc(null);
                        setWhatsappPhone('');
                      }}
                      className="px-2.5 py-1.5 text-gray-400 hover:text-white text-[10px] font-semibold"
                    >
                      Cancelar
                    </button>
                    <div className="flex gap-1.5 w-full sm:w-auto justify-end">
                      <button
                        onClick={handleNativeShareDoc}
                        className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-md font-bold text-[10px] flex items-center gap-1.5 border border-white/10 transition-colors"
                        title="Abrir menu do dispositivo para compartilhar o arquivo físico e mensagem"
                      >
                        <Share2 className="w-3 h-3 text-blue-400" />
                        <span>Compartilhar Arquivo</span>
                      </button>
                      <button
                        onClick={handleSendWhatsAppSubmit}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-bold text-[10px] flex items-center gap-1.5 shadow-md shadow-emerald-500/10 transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        <span>Enviar p/ WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Filtros de Categoria */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 text-[10px] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {['Todos', 'Contrato', 'CRLV', 'Vistoria', 'Comprovante', 'Outros'].map((cat) => {
                  const count = cat === 'Todos' 
                    ? (vehicle.documents || []).length 
                    : cat === 'Outros'
                    ? (vehicle.documents || []).filter(d => d.category === 'Outros' || !['Contrato', 'CRLV', 'Vistoria', 'Comprovante'].includes(d.category)).length
                    : (vehicle.documents || []).filter(d => d.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setDocCategoryFilter(cat)}
                      className={`px-2 py-1 rounded-md border shrink-0 transition-all font-semibold ${
                        docCategoryFilter === cat
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.15)]'
                          : 'bg-white/[0.01] text-gray-400 border-white/5 hover:border-white/10 hover:text-gray-200'
                      }`}
                    >
                      {cat} <span className="opacity-65">({count})</span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {(!vehicle.documents || vehicle.documents.length === 0) ? (
                  <div className="text-center py-6 border border-dashed border-white/5 rounded-lg bg-black/10">
                    <FileText className="w-5 h-5 mx-auto text-gray-600 mb-1" />
                    <p className="text-[10px] text-gray-500 italic">Nenhum documento anexado a este veículo.</p>
                  </div>
                ) : filteredDocs.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-white/5 rounded-lg bg-black/10">
                    <FileText className="w-5 h-5 mx-auto text-gray-600 mb-1" />
                    <p className="text-[10px] text-gray-500 italic">Nenhum documento na categoria "{docCategoryFilter}".</p>
                  </div>
                ) : (
                  filteredDocs.map((doc) => (
                    <div 
                      key={doc.id} 
                      className="flex justify-between items-center text-[11px] p-2 bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-white/10 rounded-lg transition-all"
                    >
                      <div className="flex items-center gap-2 overflow-hidden flex-1">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="p-1 bg-blue-500/5 hover:bg-blue-500/10 text-blue-400 rounded border border-blue-500/10 shrink-0 transition-colors"
                          title="Visualizar Anexo"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <div className="flex flex-col overflow-hidden text-left">
                          <span 
                            onClick={() => setPreviewDoc(doc)}
                            className="text-gray-200 font-medium truncate font-mono cursor-pointer hover:text-blue-400 hover:underline transition-colors" 
                            title="Clique para visualizar o anexo"
                          >
                            {doc.name}
                          </span>
                          <div className="flex items-center gap-1.5 text-[9px] text-gray-500 mt-0.5">
                            <span className="bg-white/5 px-1 rounded-sm text-[8px] font-semibold text-gray-400 border border-white/5 uppercase">
                              {doc.category}
                            </span>
                            <span>•</span>
                            <span>{doc.fileSize || '---'}</span>
                            <span>•</span>
                            <span>{doc.uploadDate}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="text-gray-400 hover:text-blue-400 bg-white/5 hover:bg-blue-500/10 border border-white/5 transition-colors p-1 rounded-md"
                          title="Visualizar Anexo"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleDownloadDoc(doc)}
                          className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-colors p-1 rounded-md"
                          title="Baixar Documento"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleInitiateShare(doc)}
                          className="text-gray-400 hover:text-emerald-400 bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/10 transition-colors p-1 rounded-md"
                          title="Enviar p/ WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                        </button>
                        {doc.category === 'Contrato' ? (
                          <span
                            className="text-gray-500 bg-white/5 border border-white/5 p-1 rounded-md cursor-not-allowed"
                            title="Contrato de locação protegido. Exclusão permitida apenas ao remover o veículo."
                          >
                            <Lock className="w-3.5 h-3.5 text-amber-400/80" />
                          </span>
                        ) : (
                          <button
                            onClick={() => handleDeleteDoc(doc.id)}
                            className="text-gray-400 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/10 transition-colors p-1 rounded-md"
                            title="Excluir Documento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )}


      {/* Document Preview Modal */}
      {previewDoc && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-xs flex items-center justify-center z-50 p-4" 
          onClick={() => setPreviewDoc(null)}
        >
          <div 
            className="bg-[#0f0f0f] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#141414]">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-md">{previewDoc.name}</h2>
                  <p className="text-[10px] text-gray-400">{previewDoc.category} • Adicionado em {previewDoc.uploadDate}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Preview Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-black/40 flex items-center justify-center min-h-[300px]">
              {previewDoc.contentUrl ? (
                previewDoc.contentUrl.startsWith('data:image/') || previewDoc.fileType === 'image' || previewDoc.name.toLowerCase().endsWith('.png') || previewDoc.name.toLowerCase().endsWith('.jpg') || previewDoc.name.toLowerCase().endsWith('.jpeg') ? (
                  <img 
                    src={previewDoc.contentUrl} 
                    alt={previewDoc.name} 
                    referrerPolicy="no-referrer"
                    className="max-w-full max-h-[55vh] object-contain rounded-lg border border-white/5 shadow-lg"
                  />
                ) : previewDoc.contentUrl.startsWith('data:text/') || previewDoc.name.toLowerCase().endsWith('.txt') ? (
                  <pre className="text-xs text-gray-300 font-mono p-4 bg-zinc-900 border border-white/5 rounded-xl w-full whitespace-pre-wrap select-all max-h-[50vh] overflow-y-auto">
                    {(() => {
                      try {
                        if (previewDoc.contentUrl.includes('base64,')) {
                          const base64 = previewDoc.contentUrl.split('base64,')[1];
                          return decodeURIComponent(escape(window.atob(base64)));
                        }
                        return 'Texto do documento disponível.';
                      } catch (err) {
                        try {
                          return window.atob(previewDoc.contentUrl.split('base64,')[1]);
                        } catch (e) {
                          return 'Conteúdo legível.';
                        }
                      }
                    })()}
                  </pre>
                ) : (
                  <div className="text-center space-y-4">
                    <FileText className="w-16 h-16 mx-auto text-blue-500 animate-pulse" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white">Visualização Pronta</p>
                      <p className="text-xs text-gray-400">Este é um documento do tipo {previewDoc.category || 'PDF/Arquivo'}.</p>
                    </div>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleDownloadDoc(previewDoc)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-4 h-4" /> Baixar Documento
                      </button>
                      <a
                        href={previewDoc.contentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Share2 className="w-4 h-4" /> Abrir em Nova Guia
                      </a>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center space-y-3">
                  <FileText className="w-12 h-12 mx-auto text-gray-600" />
                  <p className="text-gray-400 text-xs font-semibold">Anexo de demonstração sem URL de visualização física.</p>
                  <button
                    onClick={() => handleDownloadDoc(previewDoc)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold"
                  >
                    Gerar e Baixar Documento
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-[#111111] border-t border-white/5 flex justify-between items-center text-xs px-4">
              <span className="text-[10px] text-gray-500 font-mono">{previewDoc.fileSize || '---'}</span>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-gray-400 hover:text-white font-semibold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Ajustar Parcelas (Pagas / Faltam) */}
      {parcelasModalData?.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-neutral-900 border border-amber-500/30 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-amber-300">Parcelas - {parcelasModalData.title}</h3>
              </div>
              <button
                onClick={() => setParcelasModalData(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-gray-400">
                Informe quantas parcelas foram pagas até o momento e qual o total de parcelas.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider block mb-1">
                    Parcelas Pagas
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={parcelasModalData.pagas}
                    onChange={(e) => setParcelasModalData({ ...parcelasModalData, pagas: Number(e.target.value) })}
                    className="w-full text-xs bg-black border border-white/20 rounded-lg px-3 py-2 text-white font-mono focus:outline-hidden focus:border-amber-500"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider block mb-1">
                    Total de Parcelas
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={parcelasModalData.totais}
                    onChange={(e) => setParcelasModalData({ ...parcelasModalData, totais: Number(e.target.value) })}
                    className="w-full text-xs bg-black border border-white/20 rounded-lg px-3 py-2 text-white font-mono focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              {parcelasModalData.totais > 0 && (
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex justify-between items-center text-xs text-amber-300 font-mono">
                  <span>Resumo:</span>
                  <div className="font-bold flex items-center gap-2">
                    <span className="text-emerald-400">Pagas: {parcelasModalData.pagas}</span>
                    <span className="text-white/20">|</span>
                    <span className="text-rose-400">Faltam: {Math.max(0, parcelasModalData.totais - parcelasModalData.pagas)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={handleRemoveParcelasModal}
                className="text-xs text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
              >
                Remover Parcelas
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setParcelasModalData(null)}
                  className="px-3 py-1.5 text-xs text-gray-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveParcelasModal}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg shadow-md cursor-pointer transition-all"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
