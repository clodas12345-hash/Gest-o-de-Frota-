import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Vehicle, FuelLog, MaintenanceLog, ExpenseLog, AgendaContact, Vistoria, VehicleDocument, FinalizedContract, SinistroLog } from './types';
import { 
  INITIAL_VEHICLES, 
  INITIAL_FUEL_LOGS, 
  INITIAL_MAINTENANCE_LOGS, 
  INITIAL_EXPENSE_LOGS,
  INITIAL_VISTORIAS
} from './mockData';
import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { Capacitor, registerPlugin } from '@capacitor/core';
const Filesystem = registerPlugin<any>('Filesystem');
const Share = registerPlugin<any>('Share');
const Directory = { Cache: 'CACHE', Documents: 'DOCUMENTS', Data: 'DATA' };
const Encoding = { UTF8: 'utf8' };

// Component Imports
import { DashboardStats } from './components/DashboardStats';
import { VehicleCard } from './components/VehicleCard';
import { LogForms } from './components/LogForms';
import { HistoryLogs } from './components/HistoryLogs';
import { VisualCharts } from './components/VisualCharts';
import { ReportsAndHistoryModal } from './components/ReportsAndHistoryModal';
import { AgendaModal } from './components/AgendaModal';
import { DocumentUploadModal } from './components/DocumentUploadModal';
import { DriverVistoriaForm } from './components/DriverVistoriaForm';
import { DriverPortalView } from './components/DriverPortalView';
import { HelpModal } from './components/HelpModal';
import { DashboardCalendar } from './components/DashboardCalendar';
import { FinalizedContractsModal } from './components/FinalizedContractsModal';
import { HeaderActionsMenu } from './components/HeaderActionsMenu';
import { syncVehicleFipe } from './utils/fipeService';
import { SettingsModal } from './components/SettingsModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { ChecklistConfigModal } from './components/ChecklistConfigModal';
import { RentalContractModal } from './components/RentalContractModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { ConfirmFinalizeContractModal } from './components/ConfirmFinalizeContractModal';
import { AboutAppModal } from './components/AboutAppModal';
import { LogoViewerModal } from './components/LogoViewerModal';
import { GlobalVoiceAssistant } from './components/GlobalVoiceAssistant';
import { BatchOdometerModal } from './components/BatchOdometerModal';
import { InterestCalculatorModal } from './components/InterestCalculatorModal';
import { generateVehiclePDF, generateVistoriaPDF, generateExecutiveMonthlyPDF } from './utils/pdfGenerator';
import { sendAppNotification, requestNotificationPermission } from './utils/notifications';
import logoImg from './assets/logo.png';

// Icons
import { 
  Car, 
  Plus, 
  Download, 
  Upload, 
  RefreshCw, 
  TrendingUp, 
  Info,
  Layers,
  Sparkles,
  Users,
  BookOpen,
  Paperclip,
  HelpCircle,
  Calendar,
  ClipboardCheck,
  Send,
  CheckCircle2,
  FolderArchive,
  BarChart3,
  MessageCircle,
  ZoomIn,
  Wrench,
  Fuel,
  Coins,
  Map,
  BellRing,
  Gauge,
  FileDown
} from 'lucide-react';

function ensureFuturePaymentsForVehicles(vehicles: Vehicle[]): Vehicle[] {
  return vehicles.map(vehicle => {
    let payments = [...(vehicle.weeklyPayments || [])];
    
    // July is Month 6, August is Month 7, September is Month 8 (0-indexed)
    const julyPayments = payments.filter(p => {
      const d = new Date(p.date + 'T12:00:00');
      return d.getMonth() === 6 && d.getFullYear() === 2026;
    });
    
    const augustPayments = payments.filter(p => {
      const d = new Date(p.date + 'T12:00:00');
      return d.getMonth() === 7 && d.getFullYear() === 2026;
    });
    
    // Copy July payments to August (shift by +28 days)
    if (julyPayments.length > 0 && augustPayments.length === 0) {
      const clonedAugust = julyPayments.map((p, index) => {
        const originalDate = new Date(p.date + 'T12:00:00');
        const targetDate = new Date(originalDate.getTime() + 28 * 24 * 60 * 60 * 1000);
        const dateStr = targetDate.toISOString().split('T')[0];
        return {
          id: `cloned-aug-${index}-${Date.now()}`,
          date: dateStr,
          amount: p.amount
        };
      });
      payments = [...payments, ...clonedAugust];
    }
    
    // Re-evaluate August payments
    const updatedAugustPayments = payments.filter(p => {
      const d = new Date(p.date + 'T12:00:00');
      return d.getMonth() === 7 && d.getFullYear() === 2026;
    });
    
    const septemberPayments = payments.filter(p => {
      const d = new Date(p.date + 'T12:00:00');
      return d.getMonth() === 8 && d.getFullYear() === 2026;
    });
    
    // Copy August payments to September (shift by +35 days to align Sundays properly)
    if (updatedAugustPayments.length > 0 && septemberPayments.length === 0) {
      const clonedSeptember = updatedAugustPayments.map((p, index) => {
        const originalDate = new Date(p.date + 'T12:00:00');
        const targetDate = new Date(originalDate.getTime() + 35 * 24 * 60 * 60 * 1000);
        const dateStr = targetDate.toISOString().split('T')[0];
        return {
          id: `cloned-sept-${index}-${Date.now()}`,
          date: dateStr,
          amount: p.amount
        };
      });
      payments = [...payments, ...clonedSeptember];
    }
    
    return {
      ...vehicle,
      weeklyPayments: payments
    };
  });
}

function sanitizeForCloud<T>(data: T): T {
  if (data === undefined) return null as any;
  try {
    return JSON.parse(JSON.stringify(data));
  } catch (err) {
    console.warn('Error sanitizing data for cloud:', err);
    return data;
  }
}

function cleanVehiclesForCloud(vehiclesList: Vehicle[]): Vehicle[] {
  if (!Array.isArray(vehiclesList)) return [];
  return vehiclesList.map(v => {
    const rawDocs = v.documents || [];
    const cleanDocs = rawDocs.map(d => {
      // Truncate excessively large base64 data URLs to prevent Firestore 1MB rejection
      if (d.contentUrl && d.contentUrl.length > 250000) {
        return {
          ...d,
          contentUrl: '' // keep metadata like name, uploadDate, fileSize, fileType
        };
      }
      return d;
    });
    return {
      ...v,
      documents: cleanDocs
    };
  });
}

export default function App() {
  // State for vehicles, initialized clean with zero values and resilient recovery
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem('fleet_vehicles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return ensureFuturePaymentsForVehicles(parsed);
      } catch (e) {
        console.error('Error parsing fleet_vehicles', e);
      }
    }
    const backup = localStorage.getItem('fleet_vehicles_last_known');
    if (backup) {
      try {
        const parsedBackup = JSON.parse(backup);
        if (Array.isArray(parsedBackup) && parsedBackup.length > 0) return ensureFuturePaymentsForVehicles(parsedBackup);
      } catch (e) {}
    }
    return ensureFuturePaymentsForVehicles(INITIAL_VEHICLES);
  });

  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(() => {
    const saved = localStorage.getItem('fleet_fuel_logs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return INITIAL_FUEL_LOGS;
  });

  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>(() => {
    const saved = localStorage.getItem('fleet_maint_logs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return INITIAL_MAINTENANCE_LOGS;
  });

  const [expenseLogs, setExpenseLogs] = useState<ExpenseLog[]>(() => {
    const saved = localStorage.getItem('fleet_expense_logs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return INITIAL_EXPENSE_LOGS;
  });

  const [vistorias, setVistorias] = useState<Vistoria[]>(() => {
    const saved = localStorage.getItem('fleet_vistorias');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return INITIAL_VISTORIAS;
  });

  const [sinistroLogs, setSinistroLogs] = useState<SinistroLog[]>(() => {
    const saved = localStorage.getItem('fleet_sinistro_logs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  
  // Friday Vistoria check, toggle and completion state
  const isTodayFriday = new Date().getDay() === 5;
  const todayDateStr = new Date().toISOString().split('T')[0];
  const [fridayReminderDoneDate, setFridayReminderDoneDate] = useState<string>(() => {
    return localStorage.getItem('fleet_friday_reminder_done_date') || '';
  });
  const [disableFridayReminder, setDisableFridayReminder] = useState<boolean>(() => {
    return localStorage.getItem('fleet_disable_friday_reminder') === 'true';
  });

  const handleToggleFridayReminder = (disabled: boolean) => {
    setDisableFridayReminder(disabled);
    localStorage.setItem('fleet_disable_friday_reminder', disabled ? 'true' : 'false');
  };

  const handleCompleteFridayReminder = () => {
    setFridayReminderDoneDate(todayDateStr);
    localStorage.setItem('fleet_friday_reminder_done_date', todayDateStr);
  };

  // Helper to determine if a vehicle is currently rented
  const isVehicleRented = (v: Vehicle): boolean => {
    const driver = (v.driver || '').trim();
    const hasDriver = driver !== '' && driver.toLowerCase() !== 'não definido' && driver.toLowerCase() !== 'não informado';
    const hasContract = Boolean(v.contractNumber && v.contractNumber.trim());
    const hasStartDate = Boolean(v.startDate && v.startDate.trim());
    const hasWeekly = Boolean((v.valorSemanal && v.valorSemanal > 0) || (v.weeklyPayments && v.weeklyPayments.length > 0));
    return hasDriver || hasContract || hasStartDate || hasWeekly;
  };

  // Carros alugados devem ficar no topo da página
  const sortedVehicles = useMemo(() => {
    return [...vehicles].sort((a, b) => {
      const aRented = isVehicleRented(a) ? 1 : 0;
      const bRented = isVehicleRented(b) ? 1 : 0;
      if (aRented !== bRented) {
        return bRented - aRented; // Rented first (1 before 0)
      }
      return 0;
    });
  }, [vehicles]);

  // Preventive Maintenance Browser Notifications State
  const [maintNotificationsEnabled, setMaintNotificationsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('fleet_maint_notif_enabled') === 'true';
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState<boolean>(false);
  const [isChecklistConfigOpen, setIsChecklistConfigOpen] = useState<boolean>(false);
  const [isRentalContractOpen, setIsRentalContractOpen] = useState<boolean>(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState<boolean>(false);
  const [isBatchOdometerOpen, setIsBatchOdometerOpen] = useState<boolean>(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
  const [isLogoViewerOpen, setIsLogoViewerOpen] = useState<boolean>(false);
  const [selectedContractVehicle, setSelectedContractVehicle] = useState<Vehicle | null>(null);
  const [vehiclePendingFinalize, setVehiclePendingFinalize] = useState<Vehicle | null>(null);
  const [isInterestCalcOpen, setIsInterestCalcOpen] = useState<boolean>(false);
  const [interestCalcVehicle, setInterestCalcVehicle] = useState<Vehicle | null>(null);

  const [checklistConfig, setChecklistConfig] = useState<string[]>(() => {
    const defaultList = [
      'Estepe',
      'Chaves de roda',
      'Frente do carro',
      'Fundo do carro',
      'Lateral direita',
      'Lateral esquerda',
      'Estofados frente',
      'Estofados trás',
      'Nível de combustivel',
      'Câmera do carro (Tirar foto)',
      'Cartão de memória (Tirar foto)',
      'Rastreador está funcionando?'
    ];
    const saved = localStorage.getItem('fleet_checklist_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const newRequired = [
            'Câmera do carro (Tirar foto)',
            'Cartão de memória (Tirar foto)',
            'Rastreador está funcionando?'
          ];
          const hasAnyCamera = parsed.some(item => item.toLowerCase().includes('câmera') || item.toLowerCase().includes('camera'));
          const hasAnySd = parsed.some(item => item.toLowerCase().includes('cartão') || item.toLowerCase().includes('cartao') || item.toLowerCase().includes('memória') || item.toLowerCase().includes('memoria'));
          const hasAnyTracker = parsed.some(item => item.toLowerCase().includes('rastreador'));

          const toAdd: string[] = [];
          if (!hasAnyCamera) toAdd.push('Câmera do carro (Tirar foto)');
          if (!hasAnySd) toAdd.push('Cartão de memória (Tirar foto)');
          if (!hasAnyTracker) toAdd.push('Rastreador está funcionando?');

          if (toAdd.length > 0) {
            const merged = [...parsed, ...toAdd];
            localStorage.setItem('fleet_checklist_config', JSON.stringify(merged));
            return merged;
          }
          return parsed;
        }
      } catch (e) {}
    }
    return defaultList;
  });

  const handleToggleMaintNotifications = (enabled: boolean) => {
    setMaintNotificationsEnabled(enabled);
    localStorage.setItem('fleet_maint_notif_enabled', enabled ? 'true' : 'false');
  };

  React.useEffect(() => {
    requestNotificationPermission().then((granted) => {
      if (!granted) return;

      const todayDateStr = new Date().toISOString().split('T')[0];

      // 1. Check Friday Vistoria Reminder (#6)
      const isFriday = new Date().getDay() === 5;
      const lastFridayCheck = localStorage.getItem('fleet_last_friday_check');

      if (isFriday && !disableFridayReminder && lastFridayCheck !== todayDateStr) {
        localStorage.setItem('fleet_last_friday_check', todayDateStr);
        sendAppNotification('📋 Lembrete de Vistoria Semanal', {
          body: 'Hoje é sexta-feira! Lembre-se de solicitar as fotos e vistorias semanais aos motoristas da frota.',
          eventKey: 'vistoria_friday',
        });
      }

      // 2. Check Daily Scheduled & Alert Conditions on Startup
      const lastMaintCheck = localStorage.getItem('fleet_last_maint_check');
      if (lastMaintCheck !== todayDateStr) {
        localStorage.setItem('fleet_last_maint_check', todayDateStr);

        vehicles.forEach((v) => {
          const cur = v.preventiveMaintCurrentKm || v.currentKm || 0;
          const next = v.preventiveMaintNextKm || 0;

          // #1 Overdue Maintenance
          if (next > 0 && cur >= next) {
            sendAppNotification(`🚨 MANUTENÇÃO VENCIDA: ${v.brand} (${v.plate})`, {
              body: `O veículo atingiu ${cur.toLocaleString('pt-BR')} KM (limite era ${next.toLocaleString('pt-BR')} KM). Providencie a revisão!`,
              eventKey: 'maint_overdue',
            });
          } else if (next > 0 && cur >= next - 500) {
            // #2 Near Maintenance
            sendAppNotification(`⚠️ Revisão Próxima: ${v.brand} (${v.plate})`, {
              body: `Faltam ${(next - cur).toLocaleString('pt-BR')} KM para a revisão preventiva (${next.toLocaleString('pt-BR')} KM).`,
              eventKey: 'maint_near',
            });
          }

          // #3 Scheduled Maintenance Date
          if (v.preventiveMaintDate === todayDateStr) {
            sendAppNotification(`🔧 Revisão Programada para Hoje: ${v.brand} (${v.plate})`, {
              body: `A manutenção preventiva do veículo ${v.brand} ${v.model} está agendada para hoje.`,
              eventKey: 'maint_scheduled_date',
            });
          }

          // #7 Scheduled Vistoria Date
          if (v.nextVistoriaDate === todayDateStr) {
            sendAppNotification(`📅 Vistoria Agendada para Hoje: ${v.brand} (${v.plate})`, {
              body: `Lembrete: Há uma vistoria programada hoje para o motorista ${v.driver || 'responsável'}.`,
              eventKey: 'vistoria_scheduled_date',
            });
          }

          // #14 Contract Expiring (within 7 days or expired)
          if (v.endDate) {
            const endMs = new Date(v.endDate + 'T12:00:00').getTime();
            const nowMs = new Date(todayDateStr + 'T12:00:00').getTime();
            const diffDays = Math.round((endMs - nowMs) / (1000 * 60 * 60 * 24));
            if (diffDays <= 7 && diffDays >= -3) {
              sendAppNotification(`⏳ Contrato Vencendo: ${v.brand} (${v.plate})`, {
                body: diffDays < 0
                  ? `O contrato do motorista ${v.driver || ''} venceu há ${Math.abs(diffDays)} dia(s).`
                  : diffDays === 0
                  ? `O contrato do motorista ${v.driver || ''} vence hoje!`
                  : `O contrato do motorista ${v.driver || ''} vence em ${diffDays} dia(s).`,
                eventKey: 'contract_expiring',
              });
            }
          }

          // #16 CNH Expiring (within 30 days or expired)
          if (v.driverCnhExpiration) {
            const cnhMs = new Date(v.driverCnhExpiration + 'T12:00:00').getTime();
            const nowMs = new Date(todayDateStr + 'T12:00:00').getTime();
            const diffDays = Math.round((cnhMs - nowMs) / (1000 * 60 * 60 * 24));
            if (diffDays <= 30) {
              sendAppNotification(`🪪 Alerta de CNH: ${v.driver || v.plate}`, {
                body: diffDays < 0
                  ? `A CNH do motorista do veículo ${v.brand} (${v.plate}) está vencida!`
                  : `A CNH do motorista do veículo ${v.brand} (${v.plate}) vence em ${diffDays} dia(s).`,
                eventKey: 'cnh_expiring',
              });
            }
          }

          // #10 Lembrete de Pagamento de Aluguel - Exatamente 1 DIA ANTES do Vencimento
          const tomorrowDate = new Date();
          tomorrowDate.setDate(tomorrowDate.getDate() + 1);
          const tomorrowDateStr = tomorrowDate.toISOString().split('T')[0];

          // Verifica se há pagamento agendado para amanhã (1 dia antes)
          const paymentTomorrow = (v.weeklyPayments || []).find((p) => p.date === tomorrowDateStr);
          const isRented = Boolean(v.driver && v.driver.trim() && v.driver.toLowerCase() !== 'não informado' && v.driver.toLowerCase() !== 'não definido');

          if (paymentTomorrow || (isRented && v.startDate && (() => {
            const startMs = new Date(v.startDate + 'T12:00:00').getTime();
            const tomorrowMs = new Date(tomorrowDateStr + 'T12:00:00').getTime();
            if (tomorrowMs < startMs) return false;
            const diffDays = Math.round((tomorrowMs - startMs) / (1000 * 60 * 60 * 24));
            return diffDays % 7 === 0;
          })())) {
            const val = paymentTomorrow?.amount || v.valorSemanal || 0;
            const valStr = val > 0 ? ` de R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '';
            sendAppNotification(`💰 Lembrete de Pagamento Amanhã: ${v.brand} (${v.plate})`, {
              body: `Amanhã (${tomorrowDate.toLocaleDateString('pt-BR')}) é a data do pagamento semanal${valStr} do motorista ${v.driver || 'responsável'}.`,
              eventKey: 'payment_reminder',
            });
          }

          // Insurance Expiring (within 15 days or expired)
          const insDate = v.insuranceExpirationDate || v.seguroVencimento;
          if (insDate) {
            const insMs = new Date(insDate + 'T12:00:00').getTime();
            const nowMs = new Date(todayDateStr + 'T12:00:00').getTime();
            const diffDays = Math.round((insMs - nowMs) / (1000 * 60 * 60 * 24));
            if (diffDays <= 15) {
              sendAppNotification(`🛡️ Alerta de Seguro: ${v.brand} (${v.plate})`, {
                body: diffDays < 0
                  ? `O seguro do veículo ${v.brand} (${v.plate}) venceu há ${Math.abs(diffDays)} dia(s)! Providencie a renovação.`
                  : diffDays === 0
                  ? `O seguro do veículo ${v.brand} (${v.plate}) vence HOJE! Providencie a renovação da apólice.`
                  : `O seguro do veículo ${v.brand} (${v.plate}) vence em ${diffDays} dia(s). Lembre-se de renovar a apólice.`,
                eventKey: 'insurance_expiring',
              });
            }
          }
        });
      }
    });
  }, [vehicles.length, disableFridayReminder]);

  // 3. Background Monthly Automatic FIPE Sync
  useEffect(() => {
    if (vehicles.length === 0) return;
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastFipeSync = localStorage.getItem('fleet_last_fipe_sync');

    if (lastFipeSync !== currentMonthKey) {
      localStorage.setItem('fleet_last_fipe_sync', currentMonthKey);
      (async () => {
        let updatedCount = 0;
        const updatedVehicles = await Promise.all(
          vehicles.map(async (v) => {
            try {
              const { updatedVehicle, updated } = await syncVehicleFipe(v);
              if (updated) updatedCount++;
              return updatedVehicle;
            } catch (e) {
              return v;
            }
          })
        );
        if (updatedCount > 0) {
          setVehicles(updatedVehicles);
          sendAppNotification(`🚘 Tabela FIPE Atualizada (${currentMonthKey})`, {
            body: `Os valores de mercado da Tabela FIPE do Governo foram atualizados para ${updatedCount} veículo(s) da frota.`,
            eventKey: 'fipe_monthly_sync'
          });
        }
      })();
    }
  }, [vehicles.length]);

  React.useEffect(() => {
    localStorage.setItem('fleet_checklist_config', JSON.stringify(checklistConfig));
  }, [checklistConfig]);

  const triggerMaintNotificationCheck = async () => {
    const needyVehicles = vehicles.filter((v) => {
      const cur = v.preventiveMaintCurrentKm || v.currentKm || 0;
      const next = v.preventiveMaintNextKm || 0;
      return next > 0 && cur >= (next - 500);
    });

    if (needyVehicles.length === 0) {
      await sendAppNotification('🚗 Frota em Dia com Manutenção', {
        body: 'Nenhum veículo atingiu o limite de quilometragem para revisão preventiva no momento.',
        force: true,
      });
    } else {
      for (const v of needyVehicles) {
        const cur = v.preventiveMaintCurrentKm || v.currentKm || 0;
        const next = v.preventiveMaintNextKm || 0;
        const isOverdue = cur >= next;
        await sendAppNotification(
          isOverdue
            ? `🚨 ALERTA: MANUTENÇÃO VENCIDA - ${v.brand} (${v.plate})`
            : `⚠️ ATENÇÃO: Revisão Próxima - ${v.brand} (${v.plate})`,
          {
            body: isOverdue
              ? `O veículo atingiu ${cur.toLocaleString('pt-BR')} KM (limite era ${next.toLocaleString('pt-BR')} KM). Providencie a revisão!`
              : `Atual: ${cur.toLocaleString('pt-BR')} KM. Próxima revisão: ${next.toLocaleString('pt-BR')} KM (faltam ${ (next - cur).toLocaleString('pt-BR') } KM).`,
            eventKey: isOverdue ? 'maint_overdue' : 'maint_near',
          }
        );
      }
    }
  };

  // Agenda State
  const [contacts, setContacts] = useState<AgendaContact[]>(() => {
    const saved = localStorage.getItem('fleet_contacts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  // Finalized Contracts Folder State
  const [finalizedContracts, setFinalizedContracts] = useState<FinalizedContract[]>(() => {
    const saved = localStorage.getItem('fleet_finalized_contracts');
    return saved ? JSON.parse(saved) : [];
  });

  const [isAgendaOpen, setIsAgendaOpen] = useState(false);
  const [isFinalizedContractsOpen, setIsFinalizedContractsOpen] = useState(false);
  const [agendaPreFill, setAgendaPreFill] = useState<{ name: string; phone: string } | null>(null);
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Deletion & Reset Confirmation Modals
  const [vehiclePendingDelete, setVehiclePendingDelete] = useState<Vehicle | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);
  const [deleteToastMsg, setDeleteToastMsg] = useState<string | null>(null);

  // Global AI State
  const [globalPrefilledData, setGlobalPrefilledData] = useState<any>(null);

  const handleGlobalDataExtracted = (type: 'vehicle' | 'fuel' | 'maintenance' | 'expense', data: any) => {
    setGlobalPrefilledData(data);
    setActiveFormType(type);
    setIsFormOpen(true);
  };

  // Public Driver Vistoria mode states
  const [isVistoriaMode, setIsVistoriaMode] = useState<boolean>(false);
  const [vistoriaPlateParam, setVistoriaPlateParam] = useState<string>('');

  const isCloudLoadedRef = useRef(false);
  const isRemoteUpdateRef = useRef(false);
  const pendingCloudSyncRef = useRef<Record<string, any>>({});
  const cloudSyncTimerRef = useRef<NodeJS.Timeout | null>(null);

  const knownVistoriaIdsRef = useRef<Set<string>>(new Set());
  const knownReceiptIdsRef = useRef<Set<string>>(new Set());

  const saveToCloud = (field: string, data: any) => {
    if (!Capacitor.isNativePlatform()) return; // Disconnected from cloud in preview environment
    if (!isCloudLoadedRef.current || isRemoteUpdateRef.current) return;
    
    try {
      // Clean data if field is vehicles to prevent Firestore 1MB document limit rejection
      const cleanData = (field === 'vehicles' && Array.isArray(data))
        ? cleanVehiclesForCloud(data)
        : data;

      pendingCloudSyncRef.current[field] = sanitizeForCloud(cleanData);

      if (cloudSyncTimerRef.current) clearTimeout(cloudSyncTimerRef.current);
      cloudSyncTimerRef.current = setTimeout(async () => {
        try {
          const payload = sanitizeForCloud({
            ...pendingCloudSyncRef.current,
            updatedAt: new Date().toISOString()
          });
          pendingCloudSyncRef.current = {};
          await setDoc(doc(db, 'fleetData', 'main'), payload, { merge: true });
        } catch (err) {
          console.warn('Error syncing fleetData to cloud:', err);
        }
      }, 400);
    } catch (err) {
      console.warn('Error preparing saveToCloud:', err);
    }
  };

  // Load initial data from Firestore and setup real-time listener for Android APK only
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      isCloudLoadedRef.current = true;
      return; // Disconnected from cloud in preview (uses localStorage only)
    }
    const docRef = doc(db, 'fleetData', 'main');
    
    getDoc(docRef).then((snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.vehicles && Array.isArray(d.vehicles)) {
          const loadedVehicles = ensureFuturePaymentsForVehicles(d.vehicles);
          loadedVehicles.forEach((veh: Vehicle) => {
            (veh.pendingReceipts || []).forEach((r) => knownReceiptIdsRef.current.add(r.id));
          });
          setVehicles(loadedVehicles);
        }
        if (d.contacts && Array.isArray(d.contacts)) setContacts(d.contacts);
        if (d.fuelLogs && Array.isArray(d.fuelLogs)) setFuelLogs(d.fuelLogs);
        if (d.maintenanceLogs && Array.isArray(d.maintenanceLogs)) setMaintenanceLogs(d.maintenanceLogs);
        if (d.expenseLogs && Array.isArray(d.expenseLogs)) setExpenseLogs(d.expenseLogs);
        if (d.vistorias && Array.isArray(d.vistorias)) {
          d.vistorias.forEach((vist: Vistoria) => knownVistoriaIdsRef.current.add(vist.id));
          setVistorias(d.vistorias);
        }
        if (d.finalizedContracts && Array.isArray(d.finalizedContracts)) setFinalizedContracts(d.finalizedContracts);
      } else {
        vistorias.forEach((vist) => knownVistoriaIdsRef.current.add(vist.id));
        vehicles.forEach((veh) => (veh.pendingReceipts || []).forEach((r) => knownReceiptIdsRef.current.add(r.id)));
        const initialPayload = sanitizeForCloud({
          vehicles: cleanVehiclesForCloud(vehicles),
          contacts,
          fuelLogs,
          maintenanceLogs,
          expenseLogs,
          vistorias,
          finalizedContracts,
          updatedAt: new Date().toISOString()
        });
        setDoc(docRef, initialPayload, { merge: true }).catch(err => console.warn('Error initializing fleetData in cloud:', err));
      }
      isCloudLoadedRef.current = true;
    }).catch(err => {
      console.warn('Error fetching fleetData from cloud:', err);
      vistorias.forEach((vist) => knownVistoriaIdsRef.current.add(vist.id));
      vehicles.forEach((veh) => (veh.pendingReceipts || []).forEach((r) => knownReceiptIdsRef.current.add(r.id)));
      isCloudLoadedRef.current = true;
    });

    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists() && isCloudLoadedRef.current) {
        const d = snap.data();
        isRemoteUpdateRef.current = true;

        const incomingVehicles: Vehicle[] = (d.vehicles && Array.isArray(d.vehicles))
          ? ensureFuturePaymentsForVehicles(d.vehicles)
          : [];

        // Check for newly arrived vistorias from driver links
        if (d.vistorias && Array.isArray(d.vistorias)) {
          const incomingVistorias: Vistoria[] = d.vistorias;
          incomingVistorias.forEach((vist) => {
            if (!knownVistoriaIdsRef.current.has(vist.id)) {
              knownVistoriaIdsRef.current.add(vist.id);
              const cleanPlate = (vist.vehiclePlate || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
              const matchedVeh = incomingVehicles.find(
                (v) =>
                  v.id === vist.vehicleId ||
                  (cleanPlate && v.plate.replace(/[^A-Z0-9]/gi, '').toUpperCase() === cleanPlate)
              );
              const vehTitle = matchedVeh
                ? `${matchedVeh.brand} ${matchedVeh.model} (${matchedVeh.plate})`
                : (vist.vehiclePlate || 'Veículo');
              const photosCount = vist.photos?.length || 0;

              sendAppNotification(`📋 Nova Vistoria Recebida: ${vehTitle}`, {
                body: `O motorista enviou a vistoria (${vist.type || 'Periódica'}) com ${photosCount} foto(s)${vist.km ? ` e odômetro em ${vist.km.toLocaleString('pt-BR')} KM` : ''}.`,
                eventKey: 'vistoria_completed',
              });
            }
          });
          setVistorias(incomingVistorias);
        }

        // Check for newly arrived payment receipts from driver links
        if (incomingVehicles.length > 0) {
          incomingVehicles.forEach((veh) => {
            (veh.pendingReceipts || []).forEach((rec) => {
              if (!knownReceiptIdsRef.current.has(rec.id)) {
                knownReceiptIdsRef.current.add(rec.id);
                sendAppNotification(`🧾 Novo Comprovante Recebido: ${veh.brand} (${veh.plate})`, {
                  body: `O motorista ${rec.driverName || veh.driver || ''} enviou um comprovante de R$ ${(rec.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para aprovação.`,
                  eventKey: 'receipt_received',
                });
              }
            });
          });
          setVehicles(incomingVehicles);
        }

        if (d.contacts && Array.isArray(d.contacts)) setContacts(d.contacts);
        if (d.fuelLogs && Array.isArray(d.fuelLogs)) setFuelLogs(d.fuelLogs);
        if (d.maintenanceLogs && Array.isArray(d.maintenanceLogs)) setMaintenanceLogs(d.maintenanceLogs);
        if (d.expenseLogs && Array.isArray(d.expenseLogs)) setExpenseLogs(d.expenseLogs);
        if (d.finalizedContracts && Array.isArray(d.finalizedContracts)) setFinalizedContracts(d.finalizedContracts);
        setTimeout(() => {
          isRemoteUpdateRef.current = false;
        }, 150);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname;
    if (
      params.get('mode') === 'vistoria_retorno' ||
      params.get('mode') === 'vistoria' ||
      params.has('vistoria') ||
      params.has('placa') ||
      params.has('car') ||
      params.has('veiculo') ||
      path.includes('/upload-receipt') ||
      path.includes('/vistoria')
    ) {
      setIsVistoriaMode(true);
      setVistoriaPlateParam(
        params.get('placa') ||
        params.get('vistoria') ||
        params.get('car') ||
        params.get('veiculo') ||
        params.get('v') ||
        ''
      );
    }
  }, []);

  // Save states to localStorage and Cloud (Firestore) with debounce for zero lag
  useEffect(() => {
    try {
      localStorage.setItem('fleet_vehicles', JSON.stringify(vehicles));
      if (vehicles.length > 0) {
        localStorage.setItem('fleet_vehicles_last_known', JSON.stringify(vehicles.map(v => ({
          ...v,
          documents: (v.documents || []).map(d => ({ ...d, contentUrl: '' }))
        }))));
      }
    } catch (e) {
      console.warn('Storage quota exceeded, storing lean vehicles in localStorage', e);
      try {
        const leanVehicles = vehicles.map(v => ({
          ...v,
          documents: (v.documents || []).map(d => ({
            ...d,
            contentUrl: (d.contentUrl && d.contentUrl.length > 100000) ? '' : d.contentUrl
          }))
        }));
        localStorage.setItem('fleet_vehicles', JSON.stringify(leanVehicles));
      } catch (err2) {
        console.error('Critical storage quota failure', err2);
      }
    }

    saveToCloud('vehicles', vehicles);
  }, [vehicles]);

  useEffect(() => {
    try {
      localStorage.setItem('fleet_contacts', JSON.stringify(contacts));
    } catch (e) { console.warn('Storage quota exceeded', e); }

    saveToCloud('contacts', contacts);
  }, [contacts]);

  useEffect(() => {
    try {
      localStorage.setItem('fleet_fuel_logs', JSON.stringify(fuelLogs));
    } catch (e) { console.warn('Storage quota exceeded', e); }

    saveToCloud('fuelLogs', fuelLogs);
  }, [fuelLogs]);

  useEffect(() => {
    try {
      localStorage.setItem('fleet_maint_logs', JSON.stringify(maintenanceLogs));
    } catch (e) { console.warn('Storage quota exceeded', e); }

    saveToCloud('maintenanceLogs', maintenanceLogs);
  }, [maintenanceLogs]);

  useEffect(() => {
    try {
      localStorage.setItem('fleet_expense_logs', JSON.stringify(expenseLogs));
    } catch (e) { console.warn('Storage quota exceeded', e); }

    saveToCloud('expenseLogs', expenseLogs);
  }, [expenseLogs]);

  useEffect(() => {
    try {
      localStorage.setItem('fleet_vistorias', JSON.stringify(vistorias));
    } catch (e) { console.warn('Storage quota exceeded', e); }

    saveToCloud('vistorias', vistorias);
  }, [vistorias]);

  useEffect(() => {
    try {
      localStorage.setItem('fleet_sinistro_logs', JSON.stringify(sinistroLogs));
    } catch (e) { console.warn('Storage quota exceeded', e); }

    saveToCloud('sinistroLogs', sinistroLogs);
  }, [sinistroLogs]);

  useEffect(() => {
    try {
      localStorage.setItem('fleet_finalized_contracts', JSON.stringify(finalizedContracts));
    } catch (e) { console.warn('Storage quota exceeded', e); }

    saveToCloud('finalizedContracts', finalizedContracts);
  }, [finalizedContracts]);

  const handleDeleteFinalizedContract = (id: string) => {
    setFinalizedContracts((prev) => prev.filter((c) => c.id !== id));
  };

  const handleMarkContractAsViewed = (id: string) => {
    setFinalizedContracts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, viewed: true } : c))
    );
  };

  const handleMarkAllContractsAsViewed = () => {
    setFinalizedContracts((prev) =>
      prev.map((c) => ({ ...c, viewed: true }))
    );
  };

  // Modal / Form Management
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeFormType, setActiveFormType] = useState< 'vehicle' | 'fuel' | 'maintenance' | 'expense' | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | null>(null);

  // Prevent background page scrolling when any modal is open
  useEffect(() => {
    const isAnyModalOpen =
      isFormOpen ||
      isAgendaOpen ||
      isFinalizedContractsOpen ||
      isUploadDocOpen ||
      isHelpOpen ||
      isSettingsOpen ||
      isChecklistConfigOpen ||
      isRentalContractOpen ||
      isReportsModalOpen ||
      Boolean(vehiclePendingDelete) ||
      isResetConfirmOpen ||
      Boolean(vehiclePendingFinalize);

    if (isAnyModalOpen) {
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
  }, [
    isFormOpen,
    isAgendaOpen,
    isFinalizedContractsOpen,
    isUploadDocOpen,
    isHelpOpen,
    isSettingsOpen,
    isChecklistConfigOpen,
    isRentalContractOpen,
    isReportsModalOpen,
    vehiclePendingDelete,
    isResetConfirmOpen,
    vehiclePendingFinalize,
  ]);

  // Trigger Form Handlers
  const handleOpenForm = (type: 'vehicle' | 'fuel' | 'maintenance' | 'expense' | 'sinistro', vId: string = '') => {
    setActiveFormType(type as any);
    setSelectedVehicleId(vId || (vehicles[0]?.id || ''));
    setVehicleToEdit(null);
    setGlobalPrefilledData(null);
    setIsFormOpen(true);
  };

  const handleOpenEditVehicle = (vehicle: Vehicle) => {
    setActiveFormType('vehicle');
    setVehicleToEdit(vehicle);
    setSelectedVehicleId(vehicle.id);
    setGlobalPrefilledData(null);
    setIsFormOpen(true);
  };

  // Actions: Save / Edit Vehicle
  const handleSaveVehicle = (vehicle: Vehicle) => {
    setVehicles((prev) => {
      const exists = prev.some((v) => v.id === vehicle.id);
      let nextVehicles;
      if (exists) {
        nextVehicles = prev.map((v) => (v.id === vehicle.id ? vehicle : v));
      } else {
        nextVehicles = [...prev, vehicle];
      }
      return nextVehicles;
    });
    setSelectedVehicleId(vehicle.id);
  };

  // Helper to switch month view automatically to log date
  const autoSwitchMonthToDate = (dateStr: string) => {
    if (!dateStr) return;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const today = new Date();
      if (!isNaN(y) && !isNaN(m) && m >= 0 && m <= 11) {
        // Only auto-switch if the log date is for current month or if current month is active
        if (y === today.getFullYear() && m === today.getMonth()) {
          setSelectedYear(y);
          setSelectedMonth(m);
        }
      }
    }
  };

  const handleUpdateVehicle = (vehicle: Vehicle) => {
    const prevVehicle = vehicles.find((v) => v.id === vehicle.id);
    if (prevVehicle) {
      // #10 Receipt Received
      if ((vehicle.pendingReceipts?.length || 0) > (prevVehicle.pendingReceipts?.length || 0)) {
        sendAppNotification(`🧾 Novo Comprovante Pendente: ${vehicle.brand} (${vehicle.plate})`, {
          body: `Um comprovante de pagamento de ${vehicle.driver || 'motorista'} foi anexado e aguarda aprovação.`,
          eventKey: 'receipt_received',
        });
      }
      // #12 Caucao Updated
      if (vehicle.caucaoValor !== prevVehicle.caucaoValor || vehicle.caucaoObservacoes !== prevVehicle.caucaoObservacoes) {
        sendAppNotification(`🛡️ Caução Atualizada: ${vehicle.brand} (${vehicle.plate})`, {
          body: `Valor de caução atualizado para R$ ${(vehicle.caucaoValor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
          eventKey: 'caucao_updated',
        });
      }
      // #5 Tire Wear Alert
      const hasBadTireNow = (vehicle.tires || []).some((t) => t.status === 'Warning' || t.status === 'Replace');
      const hadBadTireBefore = (prevVehicle.tires || []).some((t) => t.status === 'Warning' || t.status === 'Replace');
      if (hasBadTireNow && !hadBadTireBefore) {
        sendAppNotification(`🛞 Alerta de Pneus: ${vehicle.brand} (${vehicle.plate})`, {
          body: `Há pneu(s) com status de atenção ou troca necessária neste veículo.`,
          eventKey: 'tire_wear_alert',
        });
      }
      // #18 Low Fuel Alert
      if (vehicle.fuelLevel <= 1 && prevVehicle.fuelLevel > 1) {
        sendAppNotification(`⛽ Combustível na Reserva: ${vehicle.brand} (${vehicle.plate})`, {
          body: `O veículo foi registrado com nível baixo de combustível (${vehicle.fuelLevel}/8 do tanque).`,
          eventKey: 'fuel_low_alert',
        });
      }
    }
    setVehicles((prev) => prev.map((v) => (v.id === vehicle.id ? vehicle : v)));
  };

  const handleUploadDocument = (
    vehicleId: string,
    doc: { name: string; category: string; contentUrl: string; fileSize: string; fileType: string }
  ) => {
    const targetV = vehicles.find((v) => v.id === vehicleId);
    if (targetV) {
      sendAppNotification(`📎 Novo Documento Anexado: ${targetV.brand} (${targetV.plate})`, {
        body: `Documento "${doc.name}" (${doc.category}) salvo na pasta do veículo.`,
        eventKey: 'document_uploaded',
      });
    }
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id === vehicleId) {
          const currentDocs = v.documents || [];
          const newDoc = {
            id: `doc-${Date.now()}`,
            name: doc.name,
            category: doc.category,
            uploadDate: new Date().toISOString().split('T')[0],
            fileSize: doc.fileSize,
            fileType: doc.fileType,
            contentUrl: doc.contentUrl,
          };
          return {
            ...v,
            documents: [...currentDocs, newDoc],
          };
        }
        return v;
      })
    );
  };

  // Actions: Save Fuel Log + UPDATE VEHICLE ODOMETER & FUEL LEVEL (Set to 8/8 on fuel)
  const handleSaveFuel = (log: Omit<FuelLog, 'id'>) => {
    const newId = `fuel-${Date.now()}`;
    const newLog: FuelLog = { ...log, id: newId };
    
    setFuelLogs((prev) => [newLog, ...prev]);
    if (log.date) autoSwitchMonthToDate(log.date);

    // Automate: Update odometer of the vehicle & fuel level
    setVehicles((prevVehicles) =>
      prevVehicles.map((v) => {
        if (v.id === log.vehicleId) {
          return {
            ...v,
            currentKm: Math.max(v.currentKm, log.km),
            fuelLevel: 8, // Tank filled! (8/8 oitavos)
          };
        }
        return v;
      })
    );
  };

  // Actions: Save Maintenance Log
  const handleSaveMaintenance = (log: Omit<MaintenanceLog, 'id'>) => {
    const newId = `maint-${Date.now()}`;
    const newLog: MaintenanceLog = { ...log, id: newId };
    setMaintenanceLogs((prev) => [newLog, ...prev]);
    if (log.date) autoSwitchMonthToDate(log.date);

    const targetV = vehicles.find((v) => v.id === log.vehicleId);
    sendAppNotification(`🛠️ Manutenção Registrada: ${targetV ? `${targetV.brand} (${targetV.plate})` : log.type}`, {
      body: `${log.type}: ${log.description} — R$ ${(log.cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
      eventKey: 'maint_logged',
    });
  };

  // Actions: Save Expense Log
  const handleSaveExpense = (log: Omit<ExpenseLog, 'id'>) => {
    const newId = `exp-${Date.now()}`;
    const newLog: ExpenseLog = { ...log, id: newId };
    setExpenseLogs((prev) => [newLog, ...prev]);
    if (log.date) autoSwitchMonthToDate(log.date);
  };

  const handleUpdateExpense = (updatedLog: ExpenseLog) => {
    setExpenseLogs((prev) =>
      prev.map((log) => (log.id === updatedLog.id ? updatedLog : log))
    );
  };

  const handleUpdateFuel = (updatedLog: FuelLog) => {
    setFuelLogs((prev) => prev.map((log) => (log.id === updatedLog.id ? updatedLog : log)));
  };

  const handleUpdateMaintenance = (updatedLog: MaintenanceLog) => {
    setMaintenanceLogs((prev) => prev.map((log) => (log.id === updatedLog.id ? updatedLog : log)));
  };

  const handleUpdateVistoria = (updatedLog: Vistoria) => {
    setVistorias((prev) => prev.map((log) => (log.id === updatedLog.id ? updatedLog : log)));
  };

  // Deletion Actions
  const handleDeleteFuel = (id: string) => {
    setFuelLogs((prev) => prev.filter((log) => log.id !== id));
  };

  const handleDeleteMaintenance = (id: string) => {
    setMaintenanceLogs((prev) => prev.filter((log) => log.id !== id));
  };

  const handleDeleteExpense = (id: string) => {
    setExpenseLogs((prev) => prev.filter((log) => log.id !== id));
  };

  const handleDeleteVehicle = (id: string) => {
    const v = vehicles.find((item) => item.id === id);
    if (v) {
      setVehiclePendingDelete(v);
    }
  };

  const handleConfirmDeleteVehicle = async () => {
    if (!vehiclePendingDelete) return;
    const vehicleToDelete = vehiclePendingDelete;
    const id = vehicleToDelete.id;

    try {
      // 1. Generate PDF with vistorias and photos
      const { doc, fileName, pdfDataUrl } = await generateVehiclePDF(
        vehicleToDelete,
        maintenanceLogs,
        expenseLogs,
        vistorias,
        fuelLogs
      );

      // 2. Download PDF file
      try {
        doc.save(fileName);
      } catch (saveErr) {
        console.warn('Could not auto-trigger browser download, PDF saved to contracts folder:', saveErr);
      }

      // 3. Save to Contratos Finalizados folder
      const payments = vehicleToDelete.weeklyPayments || [];
      const totalPaid = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

      const newContract: FinalizedContract = {
        id: `contract-final-${Date.now()}`,
        vehicleId: vehicleToDelete.id,
        brand: vehicleToDelete.brand,
        model: vehicleToDelete.model,
        plate: vehicleToDelete.plate,
        driver: vehicleToDelete.driver,
        driverPhone: vehicleToDelete.driverPhone,
        terminationDate: new Date().toLocaleDateString('pt-BR'),
        pdfFileName: fileName,
        pdfDataUrl,
        totalPaid,
        documentsCount: vehicleToDelete.documents?.length || 0,
        maintenanceCount: maintenanceLogs.filter((m) => m.vehicleId === id).length,
        viewed: false
      };

      setFinalizedContracts((prev) => [newContract, ...prev]);

      // 4. Remove vehicle and its logs
      setVehicles((prev) => prev.filter((v) => v.id !== id));
      setFuelLogs((prev) => prev.filter((log) => log.vehicleId !== id));
      setMaintenanceLogs((prev) => prev.filter((log) => log.vehicleId !== id));
      setExpenseLogs((prev) => prev.filter((log) => log.vehicleId !== id));
      setVistorias((prev) => prev.filter((log) => log.vehicleId !== id));

      setDeleteToastMsg(`Veículo ${vehicleToDelete.brand} ${vehicleToDelete.model} (${vehicleToDelete.plate}) foi excluído com sucesso! Relatório arquivado na pasta 'Contratos Finalizados'.`);
      setTimeout(() => setDeleteToastMsg(null), 6000);
    } catch (err) {
      console.error('Erro ao gerar PDF e excluir veículo:', err);
      setVehicles((prev) => prev.filter((v) => v.id !== id));
      setDeleteToastMsg(`Veículo ${vehicleToDelete.brand} (${vehicleToDelete.plate}) excluído com sucesso.`);
      setTimeout(() => setDeleteToastMsg(null), 5000);
    } finally {
      setVehiclePendingDelete(null);
    }
  };

  const handleConfirmFinalizeContract = async () => {
    if (!vehiclePendingFinalize) return;
    const targetVehicle = vehiclePendingFinalize;
    const id = targetVehicle.id;

    try {
      // 1. Generate PDF with vehicle history, contract & maintenance details
      const { doc, fileName, pdfDataUrl } = await generateVehiclePDF(
        targetVehicle,
        maintenanceLogs,
        expenseLogs,
        vistorias,
        fuelLogs
      );

      // Try auto download
      try {
        doc.save(fileName);
      } catch (saveErr) {
        console.warn('Could not auto-trigger browser download:', saveErr);
      }

      // 2. Save to Contratos Finalizados folder
      const payments = targetVehicle.weeklyPayments || [];
      const totalPaid = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

      const newContract: FinalizedContract = {
        id: `contract-final-${Date.now()}`,
        vehicleId: id,
        brand: targetVehicle.brand,
        model: targetVehicle.model,
        plate: targetVehicle.plate,
        driver: targetVehicle.driver || 'Não informado',
        driverPhone: targetVehicle.driverPhone,
        terminationDate: new Date().toLocaleDateString('pt-BR'),
        pdfFileName: fileName,
        pdfDataUrl,
        totalPaid,
        documentsCount: targetVehicle.documents?.length || 0,
        maintenanceCount: maintenanceLogs.filter((m) => m.vehicleId === id).length,
        viewed: false
      };

      setFinalizedContracts((prev) => [newContract, ...prev]);

      // 3. Attach finalized contract PDF to vehicle documents
      const finalDoc: VehicleDocument = {
        id: `doc-final-${Date.now()}`,
        name: `Contrato Finalizado - ${targetVehicle.driver || 'Motorista'} (${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}).pdf`,
        category: 'Contrato',
        uploadDate: new Date().toISOString().split('T')[0],
        fileSize: 'PDF Arquivado',
        fileType: 'pdf',
        contentUrl: pdfDataUrl
      };

      // Preserve Locatário in contacts list
      if (targetVehicle.driver && targetVehicle.driver.trim()) {
        setContacts((prev) => {
          const cleanP = (targetVehicle.driverPhone || '').replace(/\D/g, '');
          const existing = prev.find(
            (c) =>
              c.name.toLowerCase().trim() === targetVehicle.driver.toLowerCase().trim() ||
              (cleanP && c.phone.includes(cleanP))
          );
          if (existing) {
            return prev.map((c) => (c.id === existing.id ? { ...c, activeVehiclePlate: undefined } : c));
          }
          return [
            {
              id: `cnt-${Date.now()}`,
              name: targetVehicle.driver,
              phone: targetVehicle.driverPhone || '',
              region: 'Locatário',
              cnhExpiration: targetVehicle.driverCnhExpiration,
              cnhPhotoUrl: targetVehicle.driverCnhPhotoUrl,
              addressProofUrl: targetVehicle.driverAddressProofUrl
            },
            ...prev
          ];
        });
      }

      // 4. Update vehicle: PRESERVE vehicle & maintenance info, RESET active driver/contract info
      const updatedVehicle: Vehicle = {
        ...targetVehicle,
        driver: '',
        driverPhone: '',
        contractNumber: '',
        startDate: '',
        endDate: '',
        weeklyPayments: [],
        valorRecebido: 0,
        caucaoValor: 0,
        caucaoData: '',
        caucaoObservacoes: '',
        tenantCpfCnpj: '',
        tenantRg: '',
        tenantCnh: '',
        tenantEmail: '',
        tenantAddress: '',
        driverCnhExpiration: '',
        driverCnhPhotoUrl: '',
        driverAddressProofUrl: '',
        documents: [finalDoc, ...(targetVehicle.documents || [])]
      };

      setVehicles((prev) => prev.map((v) => (v.id === id ? updatedVehicle : v)));

      sendAppNotification(`📁 Contrato Finalizado: ${targetVehicle.brand} (${targetVehicle.plate})`, {
        body: `Contrato de ${targetVehicle.driver || 'motorista'} arquivado em Contratos Finalizados com sucesso.`,
        eventKey: 'contract_finalized',
      });

      setDeleteToastMsg(`Contrato do veículo ${targetVehicle.brand} ${targetVehicle.model} (${targetVehicle.plate}) finalizado com sucesso! Relatório arquivado em 'Contratos Finalizados' e dados de manutenção mantidos no sistema.`);
      setTimeout(() => setDeleteToastMsg(null), 6000);
    } catch (err) {
      console.error('Erro ao finalizar contrato:', err);
      setDeleteToastMsg('Erro ao finalizar contrato. Tente novamente.');
      setTimeout(() => setDeleteToastMsg(null), 4000);
    } finally {
      setVehiclePendingFinalize(null);
    }
  };

  const handleSaveVistoria = async (vistoria: Vistoria, pdfDataUrl?: string, pdfFileName?: string) => {
    knownVistoriaIdsRef.current.add(vistoria.id);
    const targetVehicle = vehicles.find(v => v.id === vistoria.vehicleId);
    const enrichedVistoria: Vistoria = {
      ...vistoria,
      vehiclePlate: vistoria.vehiclePlate || targetVehicle?.plate
    };

    setVistorias((prev) => {
      const exists = prev.some((v) => v.id === enrichedVistoria.id);
      if (exists) {
        return prev.map((v) => (v.id === enrichedVistoria.id ? enrichedVistoria : v));
      }
      return [enrichedVistoria, ...prev];
    });

    if (!targetVehicle) return;

    const typeLabel = vistoria.type ? ` (${vistoria.type})` : '';
    const formattedDate = new Date((vistoria.date || new Date().toISOString().split('T')[0]) + 'T12:00:00').toLocaleDateString('pt-BR');
    let finalDocName = pdfFileName || `Vistoria${typeLabel} - ${formattedDate}.pdf`;
    let finalDataUrl = pdfDataUrl;

    if (!finalDataUrl) {
      try {
        const generated = await generateVistoriaPDF(targetVehicle, vistoria);
        finalDataUrl = generated.pdfDataUrl;
        finalDocName = generated.fileName;
      } catch (err) {
        console.error("Erro ao gerar PDF da Vistoria", err);
      }
    }

    sendAppNotification(`📋 Vistoria Registrada: ${targetVehicle.brand} (${targetVehicle.plate})`, {
      body: `Vistoria de ${vistoria.type || 'Rotina'} concluída com sucesso e anexada aos documentos do veículo.`,
      eventKey: 'vistoria_completed',
    });

    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id === vistoria.vehicleId) {
          const vistoriaDoc: VehicleDocument = {
            id: `doc-vist-${vistoria.id}-${Date.now()}`,
            name: finalDocName,
            category: 'Vistoria',
            uploadDate: vistoria.date || new Date().toISOString().split('T')[0],
            fileSize: finalDataUrl ? 'Documento PDF' : (vistoria.photos && vistoria.photos.length > 0 ? `${vistoria.photos.length} foto(s)` : 'Checklist Ok'),
            fileType: finalDataUrl ? 'pdf' : (vistoria.photos && vistoria.photos.length > 0 ? 'image' : 'pdf'),
            contentUrl: finalDataUrl || (vistoria.photos && vistoria.photos.length > 0 ? vistoria.photos[0] : undefined)
          };

          const existingDocs = v.documents || [];
          // Instead of updating by id which might have changed, just prepend
          const updatedDocs = [vistoriaDoc, ...existingDocs];

          const kmUpdate = (vistoria.km && vistoria.km > 0) ? {
            currentKm: vistoria.km,
            preventiveMaintCurrentKm: vistoria.km
          } : {};

          return {
            ...v,
            ...kmUpdate,
            nextVistoriaDate: undefined, // Clear next vistoria date
            documents: updatedDocs
          };
        }
        return v;
      })
    );
  };

  const handleApproveVistoria = async (vistoria: Vistoria) => {
    const approvalDate = new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const targetVehicle = vehicles.find(v => v.id === vistoria.vehicleId || (vistoria.vehiclePlate && v.plate.replace(/[^A-Z0-9]/gi, '').toUpperCase() === vistoria.vehiclePlate.replace(/[^A-Z0-9]/gi, '').toUpperCase()));
    
    const approvedVistoria: Vistoria = {
      ...vistoria,
      status: 'approved',
      approvedAt: approvalDate,
      vehiclePlate: vistoria.vehiclePlate || targetVehicle?.plate
    };

    let approvedPdfUrl = vistoria.pdfDataUrl;
    let approvedPdfName = `Vistoria Aprovada (${approvedVistoria.type || 'Geral'}) - ${new Date(approvedVistoria.date + 'T12:00:00').toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;

    if (targetVehicle) {
      try {
        const { fileName, pdfDataUrl } = await generateVistoriaPDF(targetVehicle, approvedVistoria);
        approvedPdfUrl = pdfDataUrl;
        approvedPdfName = fileName;
        approvedVistoria.pdfDataUrl = pdfDataUrl;
      } catch (err) {
        console.error('Erro ao gerar PDF de aprovação da vistoria:', err);
      }
    }

    // Update in vistorias state
    setVistorias(prev => {
      const nextVistorias = prev.map(v => v.id === vistoria.id ? approvedVistoria : v);
      if (Capacitor.isNativePlatform()) {
        setDoc(doc(db, 'fleetData', 'main'), sanitizeForCloud({
          vistorias: nextVistorias,
          updatedAt: new Date().toISOString()
        }), { merge: true }).catch(err => console.warn('Direct approved vistoria cloud sync error:', err));
      }
      return nextVistorias;
    });

    if (targetVehicle) {
      const vistoriaDoc: VehicleDocument = {
        id: `doc-vist-approved-${vistoria.id}`,
        name: approvedPdfName,
        category: 'Vistoria',
        uploadDate: vistoria.date || new Date().toISOString().split('T')[0],
        fileSize: 'Laudo Aprovado PDF',
        fileType: 'pdf',
        contentUrl: approvedPdfUrl
      };

      setVehicles(prev => {
        const nextVehicles = prev.map(v => {
          if (v.id === targetVehicle.id) {
            const cleanDocs = (v.documents || []).filter(d => !d.id.includes(vistoria.id));
            return {
              ...v,
              documents: [vistoriaDoc, ...cleanDocs]
            };
          }
          return v;
        });

        if (Capacitor.isNativePlatform()) {
          setDoc(doc(db, 'fleetData', 'main'), sanitizeForCloud({
            vehicles: cleanVehiclesForCloud(nextVehicles),
            updatedAt: new Date().toISOString()
          }), { merge: true }).catch(err => console.warn('Direct vehicle vistoria approval cloud sync error:', err));
        }

        return nextVehicles;
      });

      sendAppNotification(`✅ Vistoria Aprovada & Arquivada: ${targetVehicle.brand} (${targetVehicle.plate})`, {
        body: `Laudo de vistoria (${approvedVistoria.type || 'Geral'}) aprovado e arquivado com sucesso junto a todos os documentos e contratos.`,
        eventKey: 'vistoria_approved',
      });
    }

    setDeleteToastMsg(`Vistoria aprovada com sucesso! Arquivada na pasta de Documentos, Contratos e Vistorias.`);
    setTimeout(() => setDeleteToastMsg(null), 5000);
  };

  const handleDeleteVistoria = (id: string) => {
    setVistorias((prev) => prev.filter((v) => v.id !== id));
    setVehicles((prev) =>
      prev.map((v) => ({
        ...v,
        documents: (v.documents || []).filter((d) => d.id !== `doc-vist-${id}` && d.id !== id)
      }))
    );
    setDeleteToastMsg('Vistoria excluída com sucesso.');
    setTimeout(() => setDeleteToastMsg(null), 3000);
  };

  const handleDeleteAllVistoriasForVehicle = (vehicleId: string) => {
    setVistorias((prev) => prev.filter((v) => v.vehicleId !== vehicleId));
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === vehicleId
          ? {
              ...v,
              nextVistoriaDate: undefined,
              documents: (v.documents || []).filter((d) => !d.id.startsWith('doc-vist-'))
            }
          : v
      )
    );
    setDeleteToastMsg('Todas as vistorias deste veículo foram excluídas com sucesso.');
    setTimeout(() => setDeleteToastMsg(null), 3000);
  };

  const handleClearAllVistorias = () => {
    setVistorias([]);
    setVehicles((prev) =>
      prev.map((v) => ({
        ...v,
        nextVistoriaDate: undefined,
        documents: (v.documents || []).filter((d) => !d.id.startsWith('doc-vist-'))
      }))
    );
    setDeleteToastMsg('Todas as vistorias da frota foram excluídas com sucesso.');
    setTimeout(() => setDeleteToastMsg(null), 3000);
  };

  // Agenda Handlers
  const handleSaveContact = (contact: AgendaContact) => {
    setContacts((prev) => {
      const exists = prev.some((c) => c.id === contact.id);
      if (exists) {
        return prev.map((c) => (c.id === contact.id ? contact : c));
      }
      return [...prev, contact];
    });
  };

  const handleSaveMultipleContacts = (newContacts: AgendaContact[]) => {
    setContacts((prev) => {
      const existingPhones = new Set(prev.map((c) => c.phone.replace(/\D/g, '')));
      const uniqueNew: AgendaContact[] = [];
      newContacts.forEach((c) => {
        const cleanP = c.phone.replace(/\D/g, '');
        if (!existingPhones.has(cleanP)) {
          existingPhones.add(cleanP);
          uniqueNew.push(c);
        }
      });
      return [...prev, ...uniqueNew];
    });
  };

  const handleDeleteContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  // Reset to default dataset
  const handleResetData = () => {
    setIsResetConfirmOpen(true);
  };

  const handleResetSelectedData = (options: {
    veiculos?: boolean;
    vistorias?: boolean;
    manutencoes?: boolean;
    abastecimentos?: boolean;
    contratosFinalizados?: boolean;
    agenda?: boolean;
    configuracoes?: boolean;
  }) => {
    const isAll = options.veiculos && options.vistorias && options.manutencoes && options.abastecimentos && options.contratosFinalizados && options.agenda && options.configuracoes;

    if (options.veiculos) {
      localStorage.removeItem('fleet_vehicles');
      localStorage.removeItem('fleet_vehicles_last_known');
      localStorage.removeItem('fleet_vehicle_draft');
      setVehicles([]);
      saveToCloud('vehicles', []);
    }

    if (options.vistorias) {
      localStorage.removeItem('fleet_vistorias');
      setVistorias([]);
      saveToCloud('vistorias', []);
    }

    if (options.manutencoes) {
      localStorage.removeItem('fleet_maint_logs');
      localStorage.removeItem('fleet_expense_logs');
      setMaintenanceLogs([]);
      setExpenseLogs([]);
      saveToCloud('maintenanceLogs', []);
      saveToCloud('expenseLogs', []);
    }

    if (options.abastecimentos) {
      localStorage.removeItem('fleet_fuel_logs');
      setFuelLogs([]);
      saveToCloud('fuelLogs', []);
    }

    if (options.contratosFinalizados) {
      localStorage.removeItem('fleet_finalized_contracts');
      setFinalizedContracts([]);
      saveToCloud('finalizedContracts', []);
    }

    if (options.agenda) {
      localStorage.removeItem('fleet_contacts');
      setContacts([]);
      saveToCloud('contacts', []);
    }

    if (options.configuracoes) {
      localStorage.removeItem('fleet_checklist_config');
      localStorage.removeItem('fleet_disable_friday_reminder');
      localStorage.removeItem('fleet_friday_reminder_done_date');
      localStorage.removeItem('fleet_maint_notif_enabled');
      localStorage.removeItem('fleet_vistoria_return_link');
      localStorage.removeItem('fleet_vistoria_share_template');
      localStorage.removeItem('fleet_vistoria_request_template');
      setChecklistConfig([
        'Estepe',
        'Chaves de roda',
        'Frente do carro',
        'Fundo do carro',
        'Lateral direita',
        'Lateral esquerda',
        'Estofados frente',
        'Estofados trás',
        'Nível de combustivel'
      ]);
    }

    const deletedMsg = isAll 
      ? 'Reinicialização de fábrica concluída! Todos os dados do sistema foram excluídos.'
      : 'As categorias de dados selecionadas foram excluídas com sucesso.';

    setDeleteToastMsg(deletedMsg);
    setTimeout(() => setDeleteToastMsg(null), 4000);
  };

  const handleConfirmResetData = () => {
    localStorage.removeItem('fleet_vehicles');
    localStorage.removeItem('fleet_vehicles_last_known');
    localStorage.removeItem('fleet_vehicle_draft');
    localStorage.removeItem('fleet_fuel_logs');
    localStorage.removeItem('fleet_maint_logs');
    localStorage.removeItem('fleet_trip_logs');
    localStorage.removeItem('fleet_expense_logs');
    localStorage.removeItem('fleet_vistorias');
    localStorage.removeItem('fleet_finalized_contracts');
    localStorage.removeItem('fleet_contacts');
    
    setVehicles([]);
    setFuelLogs([]);
    setMaintenanceLogs([]);
    setExpenseLogs([]);
    setVistorias([]);
    setFinalizedContracts([]);
    setContacts([]);
    
    if (Capacitor.isNativePlatform()) {
      const docRef = doc(db, 'fleetData', 'main');
      setDoc(docRef, {
        vehicles: [],
        contacts: [],
        fuelLogs: [],
        maintenanceLogs: [],
        expenseLogs: [],
        vistorias: [],
        finalizedContracts: [],
        updatedAt: new Date().toISOString()
      }).catch(err => console.warn('Error resetting cloud data:', err));
    }

    setIsResetConfirmOpen(false);

    setDeleteToastMsg('Dados zerados com sucesso! O aplicativo e o banco de dados estão limpos.');
    setTimeout(() => setDeleteToastMsg(null), 4000);
  };

  // Backup data functions - Backup COMPLETO de todo o sistema, arquivos, fotos, contratos, configurações e dados editáveis
  const handleDownloadBackup = async () => {
    // 1. Coleta todas as configurações, templates e dados salvos no localStorage
    const localSettings: Record<string, string> = {};
    if (typeof window !== 'undefined' && window.localStorage) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('fleet_') || key.startsWith('custom_') || key.startsWith('app_'))) {
          const val = localStorage.getItem(key);
          if (val !== null) {
            localSettings[key] = val;
          }
        }
      }
    }

    // 2. Monta o pacote de backup com 100% do estado da aplicação e anexos
    const backupData = {
      version: '2.0-full',
      appName: 'Gestão de Frota',
      exportDate: new Date().toISOString(),
      summary: {
        totalVehicles: vehicles.length,
        totalVistorias: vistorias.length,
        totalMaintenanceLogs: maintenanceLogs.length,
        totalExpenseLogs: expenseLogs.length,
        totalFuelLogs: fuelLogs.length,
        totalContacts: contacts.length,
        totalFinalizedContracts: finalizedContracts.length,
        totalDocumentsAttached: vehicles.reduce((sum, v) => sum + (v.documents?.length || 0), 0)
      },
      vehicles,
      fuelLogs,
      maintenanceLogs,
      expenseLogs,
      vistorias,
      contacts,
      finalizedContracts,
      checklistConfig,
      settings: {
        disableFridayReminder,
        fridayReminderDoneDate,
        maintNotificationsEnabled,
      },
      customTemplates: {
        paymentReminder: localStorage.getItem('fleet_payment_msg_lembrete') || null,
        paymentToday: localStorage.getItem('fleet_payment_msg_hoje') || null,
        paymentOverdue: localStorage.getItem('fleet_payment_msg_atrasado') || null,
        vistoriaShare: localStorage.getItem('fleet_vistoria_share_template') || null,
        vistoriaRequest: localStorage.getItem('fleet_vistoria_request_template') || null,
        vistoriaReturnLink: localStorage.getItem('fleet_vistoria_return_link') || null,
      },
      localSettings
    };
    
    const jsonString = JSON.stringify(backupData, null, 2);
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const fileName = `backup_completo_gestao_frota_${day}_${month}_${year}.json`;

    if (Capacitor.isNativePlatform()) {
      try {
        const result = await Filesystem.writeFile({
          path: fileName,
          data: jsonString,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });
        
        await Share.share({
          title: 'Backup Completo Gestão de Frota',
          text: 'Arquivo completo de backup com todos os veículos, fotos, documentos e configurações.',
          url: result.uri,
          dialogTitle: 'Salvar ou Compartilhar Backup'
        });

        setDeleteToastMsg(`Backup completo gerado (${backupData.summary.totalVehicles} carros, ${backupData.summary.totalDocumentsAttached} docs/arquivos) e salvo na memória interna!`);
        setTimeout(() => setDeleteToastMsg(null), 5000);
        return;
      } catch (err) {
        console.error('Erro ao salvar backup nativo:', err);
      }
    }

    // Fallback para Web / Navegador
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.download = fileName;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);

    sendAppNotification('💾 Backup Completo da Frota Concluído', {
      body: `Backup com ${backupData.summary.totalVehicles} carros e ${backupData.summary.totalDocumentsAttached} documentos salvo com sucesso.`,
      eventKey: 'backup_completed',
    });

    setDeleteToastMsg(`Backup completo baixado com sucesso! (${backupData.summary.totalVehicles} carros, ${backupData.summary.totalVistorias} vistorias, ${backupData.summary.totalDocumentsAttached} documentos anexos e configurações).`);
    setTimeout(() => setDeleteToastMsg(null), 5000);
  };

  const handleUploadBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = event.target.files?.[0];
    if (!file) return;

    fileReader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed.vehicles || parsed.fuelLogs || parsed.vistorias || parsed.maintenanceLogs || parsed.contacts || parsed.finalizedContracts) {
          // 1. Restauração das entidades principais
          const restoredVehicles = parsed.vehicles && Array.isArray(parsed.vehicles) ? parsed.vehicles : [];
          const restoredFuelLogs = parsed.fuelLogs && Array.isArray(parsed.fuelLogs) ? parsed.fuelLogs : [];
          const restoredMaintLogs = parsed.maintenanceLogs && Array.isArray(parsed.maintenanceLogs) ? parsed.maintenanceLogs : [];
          const restoredExpenseLogs = parsed.expenseLogs && Array.isArray(parsed.expenseLogs) ? parsed.expenseLogs : [];
          const restoredVistorias = parsed.vistorias && Array.isArray(parsed.vistorias) ? parsed.vistorias : [];
          const restoredContacts = parsed.contacts && Array.isArray(parsed.contacts) ? parsed.contacts : [];
          const restoredFinalizedContracts = parsed.finalizedContracts && Array.isArray(parsed.finalizedContracts) ? parsed.finalizedContracts : [];
          const restoredChecklistConfig = parsed.checklistConfig && Array.isArray(parsed.checklistConfig) ? parsed.checklistConfig : null;

          if (restoredVehicles.length > 0 || parsed.vehicles) {
            setVehicles(restoredVehicles);
            try { localStorage.setItem('fleet_vehicles', JSON.stringify(restoredVehicles)); } catch (err) {}
          }
          if (restoredFuelLogs.length > 0 || parsed.fuelLogs) {
            setFuelLogs(restoredFuelLogs);
            try { localStorage.setItem('fleet_fuel_logs', JSON.stringify(restoredFuelLogs)); } catch (err) {}
          }
          if (restoredMaintLogs.length > 0 || parsed.maintenanceLogs) {
            setMaintenanceLogs(restoredMaintLogs);
            try { localStorage.setItem('fleet_maint_logs', JSON.stringify(restoredMaintLogs)); } catch (err) {}
          }
          if (restoredExpenseLogs.length > 0 || parsed.expenseLogs) {
            setExpenseLogs(restoredExpenseLogs);
            try { localStorage.setItem('fleet_expense_logs', JSON.stringify(restoredExpenseLogs)); } catch (err) {}
          }
          if (restoredVistorias.length > 0 || parsed.vistorias) {
            setVistorias(restoredVistorias);
            try { localStorage.setItem('fleet_vistorias', JSON.stringify(restoredVistorias)); } catch (err) {}
          }
          if (restoredContacts.length > 0 || parsed.contacts) {
            setContacts(restoredContacts);
            try { localStorage.setItem('fleet_contacts', JSON.stringify(restoredContacts)); } catch (err) {}
          }
          if (restoredFinalizedContracts.length > 0 || parsed.finalizedContracts) {
            setFinalizedContracts(restoredFinalizedContracts);
            try { localStorage.setItem('fleet_finalized_contracts', JSON.stringify(restoredFinalizedContracts)); } catch (err) {}
          }
          if (restoredChecklistConfig) {
            setChecklistConfig(restoredChecklistConfig);
            try { localStorage.setItem('fleet_checklist_config', JSON.stringify(restoredChecklistConfig)); } catch (err) {}
          }

          // 2. Restauração de configurações gerais do sistema
          if (parsed.settings) {
            if (typeof parsed.settings.disableFridayReminder === 'boolean') {
              setDisableFridayReminder(parsed.settings.disableFridayReminder);
              try { localStorage.setItem('fleet_disable_friday_reminder', JSON.stringify(parsed.settings.disableFridayReminder)); } catch (err) {}
            }
            if (parsed.settings.fridayReminderDoneDate) {
              setFridayReminderDoneDate(parsed.settings.fridayReminderDoneDate);
              try { localStorage.setItem('fleet_friday_reminder_done_date', parsed.settings.fridayReminderDoneDate); } catch (err) {}
            }
            if (typeof parsed.settings.maintNotificationsEnabled === 'boolean') {
              setMaintNotificationsEnabled(parsed.settings.maintNotificationsEnabled);
              try { localStorage.setItem('fleet_maint_notif_enabled', JSON.stringify(parsed.settings.maintNotificationsEnabled)); } catch (err) {}
            }
          }

          // 3. Restauração de templates customizados do WhatsApp
          if (parsed.customTemplates) {
            if (parsed.customTemplates.paymentReminder) localStorage.setItem('fleet_payment_msg_lembrete', parsed.customTemplates.paymentReminder);
            if (parsed.customTemplates.paymentToday) localStorage.setItem('fleet_payment_msg_hoje', parsed.customTemplates.paymentToday);
            if (parsed.customTemplates.paymentOverdue) localStorage.setItem('fleet_payment_msg_atrasado', parsed.customTemplates.paymentOverdue);
            if (parsed.customTemplates.vistoriaShare) localStorage.setItem('fleet_vistoria_share_template', parsed.customTemplates.vistoriaShare);
            if (parsed.customTemplates.vistoriaRequest) localStorage.setItem('fleet_vistoria_request_template', parsed.customTemplates.vistoriaRequest);
            if (parsed.customTemplates.vistoriaReturnLink) localStorage.setItem('fleet_vistoria_return_link', parsed.customTemplates.vistoriaReturnLink);
          }

          // 4. Restauração de todas as chaves customizadas de localStorage salvas no backup
          if (parsed.localSettings && typeof parsed.localSettings === 'object') {
            Object.entries(parsed.localSettings).forEach(([k, v]) => {
              if (typeof v === 'string') {
                try { localStorage.setItem(k, v); } catch (err) {}
              }
            });
          }

          // 5. Sincronização imediata com Firestore Cloud
          if (Capacitor.isNativePlatform()) {
            const docRef = doc(db, 'fleetData', 'main');
            setDoc(docRef, {
              vehicles: restoredVehicles,
              contacts: restoredContacts,
              fuelLogs: restoredFuelLogs,
              maintenanceLogs: restoredMaintLogs,
              expenseLogs: restoredExpenseLogs,
              vistorias: restoredVistorias,
              finalizedContracts: restoredFinalizedContracts,
              updatedAt: new Date().toISOString()
            }, { merge: true }).catch(err => console.warn('Error syncing restored backup to cloud:', err));
          }

          const totalDocs = restoredVehicles.reduce((acc: number, v: any) => acc + (v.documents?.length || 0), 0);
          setDeleteToastMsg(`Backup COMPLETO restaurado com sucesso! ${restoredVehicles.length} veículos, ${totalDocs} documentos anexados, ${restoredVistorias.length} vistorias, ${restoredMaintLogs.length} manutenções, agenda e configurações recuperadas.`);
          setTimeout(() => setDeleteToastMsg(null), 6000);
        } else {
          alert('Arquivo de backup inválido ou não reconhecido.');
        }
      } catch (err) {
        console.error('Erro ao ler arquivo de backup:', err);
        alert('Erro ao processar o arquivo de backup. Verifique se o arquivo JSON está correto.');
      }
    };
    fileReader.readAsText(file);
    event.target.value = '';
  };

  if (isVistoriaMode) {
    let targetVehicle = vehicles.find(
      v => v.plate.replace(/[^A-Z0-9]/gi, '').toUpperCase() === vistoriaPlateParam.replace(/[^A-Z0-9]/gi, '').toUpperCase()
    );

    const params = new URLSearchParams(window.location.search);
    const deadlineFromParam = params.get('deadline') || '';

    if (targetVehicle && deadlineFromParam && !targetVehicle.nextVistoriaDate) {
      targetVehicle = { ...targetVehicle, nextVistoriaDate: deadlineFromParam };
    }

    // If not found (e.g. driver opened the link on their own phone where localStorage is empty),
    // parse details from query params to create a temporary vehicle object.
    if (!targetVehicle && vistoriaPlateParam) {
      const brand = params.get('brand') || 'Veículo';
      const model = params.get('model') || '';
      const driver = params.get('driver') || '';
      targetVehicle = {
        id: `temp-${Date.now()}`,
        brand,
        model,
        plate: vistoriaPlateParam.toUpperCase(),
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
        currentKm: 0,
        fuelLevel: 8,
        driver,
        weeklyPayments: [],
        nextVistoriaDate: deadlineFromParam || undefined
      };
    }

    if (params.get('mode') === 'portal_motorista') {
      return (
        <DriverPortalView
          vehicle={targetVehicle}
          vistorias={vistorias}
          onExit={() => {
            window.location.href = window.location.pathname;
          }}
          onOpenVistoriaForm={() => {
            window.location.search = `?mode=vistoria_retorno&placa=${encodeURIComponent(targetVehicle.plate)}`;
          }}
          onOpenReceiptUpload={() => {
            window.location.search = `?mode=pagamento&placa=${encodeURIComponent(targetVehicle.plate)}`;
          }}
        />
      );
    }

    const isPaymentMode = params.get('mode') === 'pagamento';

    return (
      <DriverVistoriaForm
        vehicle={targetVehicle}
        plateRequested={vistoriaPlateParam}
        checklistConfig={checklistConfig}
        isPaymentMode={isPaymentMode}
        onSavePaymentReceipt={(receipt) => {
          knownReceiptIdsRef.current.add(receipt.id);
          sendAppNotification(`🧾 Novo Comprovante Recebido: ${targetVehicle.brand} (${targetVehicle.plate})`, {
            body: `Comprovante de pagamento de R$ ${(receipt.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} enviado com sucesso.`,
            eventKey: 'receipt_received',
          });
          setVehicles(prev => {
            const targetPlateSanitized = targetVehicle.plate.replace(/[^A-Z0-9]/gi, '').toUpperCase();
            const found = prev.some(v => v.id === targetVehicle.id || v.plate.replace(/[^A-Z0-9]/gi, '').toUpperCase() === targetPlateSanitized);
            const nextVehicles = !found
              ? [{ ...targetVehicle, pendingReceipts: [receipt, ...(targetVehicle.pendingReceipts || [])] }, ...prev]
              : prev.map(v => {
                  if (v.id === targetVehicle.id || v.plate.replace(/[^A-Z0-9]/gi, '').toUpperCase() === targetPlateSanitized) {
                    return {
                      ...v,
                      pendingReceipts: [receipt, ...(v.pendingReceipts || [])]
                    };
                  }
                  return v;
                });

            // Immediately push receipt to Firestore so the manager app receives it right away
            if (Capacitor.isNativePlatform()) {
              setDoc(doc(db, 'fleetData', 'main'), sanitizeForCloud({
                vehicles: cleanVehiclesForCloud(nextVehicles),
                updatedAt: new Date().toISOString()
              }), { merge: true }).catch(err => console.warn('Direct receipt cloud sync error:', err));
            }

            return nextVehicles;
          });
        }}
        onSaveVistoria={(newVistoria, pdfDataUrl, pdfFileName) => {
          knownVistoriaIdsRef.current.add(newVistoria.id);
          const targetPlateSanitized = targetVehicle.plate.replace(/[^A-Z0-9]/gi, '').toUpperCase();
          const matchedRealVehicle = vehicles.find(
            v => v.id === targetVehicle.id || v.plate.replace(/[^A-Z0-9]/gi, '').toUpperCase() === targetPlateSanitized
          );
          const finalVistoria: Vistoria = {
            ...newVistoria,
            vehicleId: matchedRealVehicle ? matchedRealVehicle.id : newVistoria.vehicleId,
            vehiclePlate: targetVehicle.plate
          };

          sendAppNotification(`📋 Vistoria Concluída: ${targetVehicle.brand} (${targetVehicle.plate})`, {
            body: `Vistoria (${finalVistoria.type || 'Periódica'}) registrada com ${finalVistoria.photos?.length || 0} foto(s).`,
            eventKey: 'vistoria_completed',
          });

          setVistorias(prev => {
            const nextVistorias = [finalVistoria, ...prev];
            if (Capacitor.isNativePlatform()) {
              setDoc(doc(db, 'fleetData', 'main'), sanitizeForCloud({
                vistorias: nextVistorias,
                updatedAt: new Date().toISOString()
              }), { merge: true }).catch(err => console.warn('Direct vistoria cloud sync error:', err));
            }
            return nextVistorias;
          });
          
          const docName = pdfFileName || `Vistoria (${finalVistoria.type}) - ${new Date(finalVistoria.date + 'T12:00:00').toLocaleDateString('pt-BR')}.pdf`;
          
          const attachDoc = (url?: string, size?: string, type?: string) => {
            const vistoriaDoc = {
              id: `doc-vist-${Date.now()}`,
              name: docName,
              category: 'Vistoria',
              uploadDate: finalVistoria.date,
              fileSize: size || 'Documento PDF',
              fileType: type || 'pdf',
              contentUrl: url
            };
            const kmUpdate = (finalVistoria.km && finalVistoria.km > 0) ? {
              currentKm: finalVistoria.km,
              preventiveMaintCurrentKm: finalVistoria.km
            } : {};

            setVehicles(prev => {
              const found = prev.some(v => v.id === targetVehicle.id || v.plate.replace(/[^A-Z0-9]/gi, '').toUpperCase() === targetPlateSanitized);
              const nextVehicles = !found
                ? [{ ...targetVehicle, ...kmUpdate, documents: [vistoriaDoc, ...(targetVehicle.documents || [])] }, ...prev]
                : prev.map(v => {
                    if (v.id === targetVehicle.id || v.plate.replace(/[^A-Z0-9]/gi, '').toUpperCase() === targetPlateSanitized) {
                      return {
                        ...v,
                        ...kmUpdate,
                        nextVistoriaDate: undefined,
                        documents: [vistoriaDoc, ...(v.documents || []).filter(d => d.id !== vistoriaDoc.id)]
                      };
                    }
                    return v;
                  });

              if (Capacitor.isNativePlatform()) {
                setDoc(doc(db, 'fleetData', 'main'), sanitizeForCloud({
                  vehicles: cleanVehiclesForCloud(nextVehicles),
                  updatedAt: new Date().toISOString()
                }), { merge: true }).catch(err => console.warn('Direct vehicle vistoria cloud sync error:', err));
              }

              return nextVehicles;
            });
          };

          if (pdfDataUrl) {
            attachDoc(pdfDataUrl, 'Documento PDF', 'pdf');
          } else {
            generateVistoriaPDF(targetVehicle, finalVistoria).then(({ pdfDataUrl: generatedUrl }) => {
              attachDoc(generatedUrl, 'Documento PDF', 'pdf');
            }).catch(err => {
              console.error("Erro ao gerar PDF da Vistoria", err);
              attachDoc(finalVistoria.photos.length > 0 ? finalVistoria.photos[0] : undefined, finalVistoria.photos.length > 0 ? `${finalVistoria.photos.length} foto(s)` : 'Checklist', finalVistoria.photos.length > 0 ? 'image' : 'pdf');
            });
          }
        }}
        onExit={() => {
          // Public mode does not give access to the management app
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans w-full max-w-full overflow-x-hidden" id="app-root-container">
      
      {/* Header Panel */}
      <header className="bg-[#0d0d0d] text-white border-b border-white/10 shrink-0" id="app-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 min-h-16 flex flex-wrap lg:flex-nowrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsLogoViewerOpen(true)}
              className="relative group cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-xl p-0.5 transition-all shrink-0"
              title="Clique para ver o logotipo em tamanho grande"
            >
              <img 
                src={logoImg} 
                alt="Gestão de Frota" 
                className="w-12 h-12 object-contain rounded-xl bg-white p-0.5 border border-white/20 shadow-lg shadow-blue-500/10 group-hover:border-blue-400 group-hover:scale-105 transition-all" 
                referrerPolicy="no-referrer" 
              />
              <div className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <ZoomIn className="w-4 h-4 text-white drop-shadow-md" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsAboutModalOpen(true)}
              className="text-left group cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-lg py-1 px-1.5 -ml-1 transition-all"
              title="Clique para ver sobre o aplicativo Gestão de Frota"
            >
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                <span className="group-hover:text-blue-300 transition-colors">Gestão de Frota</span>
              </h1>
              <p className="text-[10px] text-gray-400">Controle para seus {vehicles.length} carros alugados</p>
            </button>
          </div>

          {/* Action Header Buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => setIsReportsModalOpen(true)}
              className="px-3 py-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer"
              title="Abrir painel consolidado de gráficos e histórico"
            >
              <BarChart3 className="w-4 h-4 text-zinc-400" />
              <span className="hidden sm:inline">Gráficos & Histórico</span>
              <span className="sm:hidden">Painel</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAgendaOpen(true)}
              className="px-3 py-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer"
              title="Abrir Agenda Telefônica e de Contatos/Locatários"
            >
              <BookOpen className="w-4 h-4 text-zinc-400" />
              <span className="hidden sm:inline">Agenda de Contatos</span>
              <span className="sm:hidden">Agenda</span>
            </button>

            <button
              type="button"
              onClick={() => setIsNotificationCenterOpen(true)}
              className="px-3 py-2 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer shadow-sm shadow-emerald-500/10"
              title="Abrir Centro de Notificações (Ativar/Desativar os 20 tipos de alertas)"
            >
              <BellRing className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Notificações</span>
            </button>

            <HeaderActionsMenu
              onAddVehicle={() => handleOpenForm('vehicle')}
              onOpenRentalContract={() => {
                setSelectedContractVehicle(null);
                setIsRentalContractOpen(true);
              }}
              onOpenFinalizedContracts={() => setIsFinalizedContractsOpen(true)}
              finalizedContractsCount={finalizedContracts.length}
              unviewedContractsCount={finalizedContracts.filter((c) => !c.viewed).length}
              onOpenHelp={() => setIsHelpOpen(true)}
              onOpenAgenda={() => setIsAgendaOpen(true)}
              onOpenLogForm={(type) => handleOpenForm(type)}
              onOpenDocumentUpload={() => setIsUploadDocOpen(true)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenNotificationCenter={() => setIsNotificationCenterOpen(true)}
              onOpenChecklistConfig={() => setIsChecklistConfigOpen(true)}
              onOpenInterestCalculator={() => {
                setInterestCalcVehicle(null);
                setIsInterestCalcOpen(true);
              }}
              onOpenBatchOdometer={() => setIsBatchOdometerOpen(true)}
              onDownloadExecutivePdf={async () => {
                try {
                  const { doc, fileName } = await generateExecutiveMonthlyPDF(
                    sortedVehicles,
                    maintenanceLogs,
                    expenseLogs,
                    selectedMonth,
                    selectedYear
                  );
                  doc.save(fileName);
                } catch (err) {
                  console.error('Erro ao gerar relatório executivo:', err);
                }
              }}
              onDownloadBackup={handleDownloadBackup}
              onUploadBackup={handleUploadBackup}
              onResetData={handleResetData}
            />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8" id="app-main-content">
        
        {/* Friday Vistoria Reminder Banner - Only shows on Fridays when enabled and not completed */}
        {isTodayFriday && !disableFridayReminder && fridayReminderDoneDate !== todayDateStr && (
          <div className="p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all shadow-xl bg-gradient-to-r from-purple-950/60 via-indigo-950/60 to-purple-900/60 border-purple-500/40 shadow-purple-900/20" id="friday-vistoria-banner">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl shrink-0 bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span>📅 Lembrete de Vistoria Semanal (Toda Sexta-Feira)</span>
                  </h3>
                  <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-black animate-pulse">
                    🚨 HOJE É SEXTA-FEIRA!
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-1">
                  Sexta-feira é o dia oficial de solicitar e receber as vistorias de todos os carros da frota. Envie os links aos motoristas e conclua este aviso quando finalizar!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-center flex-wrap">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('vehicles-grid');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-purple-600/20 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Solicitar Vistorias dos Carros</span>
              </button>
              <button
                type="button"
                onClick={handleCompleteFridayReminder}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1 shadow-md shadow-emerald-600/20 cursor-pointer"
                title="Concluir e ocultar este aviso de sexta-feira"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Marcar como Enviado / Concluir</span>
              </button>
            </div>
          </div>
        )}

        {/* 1. Global KPIs Row */}
        <DashboardStats 
          vehicles={sortedVehicles}
          fuelLogs={fuelLogs}
          maintenanceLogs={maintenanceLogs}
          expenseLogs={expenseLogs}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
        />

        {/* 2. Vehicles Grid Heading and Cards */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-500" />
                Seus Carros Alugados
              </h2>
              <p className="text-xs text-gray-400">Detalhamento de despesas, pagamentos semanais e nível de tanque entregue.</p>
            </div>
          </div>

          {vehicles.length === 0 ? (
            <div className="bg-[#111111] border border-white/10 rounded-2xl p-8 text-center text-gray-400 flex flex-col items-center justify-center space-y-3">
              <Car className="w-10 h-10 text-gray-600" />
              <p className="text-sm font-semibold text-white">Nenhum veículo cadastrado na sua frota.</p>
              <button
                onClick={() => handleOpenForm('vehicle')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Cadastrar Primeiro Carro
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" id="vehicles-grid">
              {sortedVehicles.map((car) => (
                <VehicleCard
                  key={car.id}
                  vehicle={car}
                  vehicleExpenses={expenseLogs.filter((log) => log.vehicleId === car.id)}
                  maintenanceLogs={maintenanceLogs.filter((log) => log.vehicleId === car.id)}
                  vistorias={vistorias.filter((v) => {
                    if (v.vehicleId === car.id) return true;
                    if (v.vehiclePlate) {
                      return v.vehiclePlate.replace(/[^A-Z0-9]/gi, '').toUpperCase() === car.plate.replace(/[^A-Z0-9]/gi, '').toUpperCase();
                    }
                    return false;
                  })}
                  checklistConfig={checklistConfig}
                  onUpdateChecklistConfig={setChecklistConfig}
                  onEdit={handleOpenEditVehicle}
                  onUpdateVehicle={handleUpdateVehicle}
                  onAddExpense={(desc, date, cost) => {
                    const newLog: ExpenseLog = {
                      id: `exp-${Date.now()}`,
                      vehicleId: car.id,
                      date,
                      category: 'Outros',
                      description: desc,
                      cost,
                    };
                    setExpenseLogs((prev) => [newLog, ...prev]);
                  }}
                  onDeleteExpense={(id) => {
                    setExpenseLogs((prev) => prev.filter((log) => log.id !== id));
                  }}
                  onDeleteVehicle={handleDeleteVehicle}
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                  onSaveVistoria={handleSaveVistoria}
                  onApproveVistoria={handleApproveVistoria}
                  onDeleteVistoria={handleDeleteVistoria}
                  onDeleteAllVistorias={handleDeleteAllVistoriasForVehicle}
                  onOpenRentalContract={(v) => {
                    setSelectedContractVehicle(v);
                    setIsRentalContractOpen(true);
                  }}
                  onFinalizeContract={(v) => setVehiclePendingFinalize(v)}
                  onOpenAgenda={(name, phone) => {
                    if (name) {
                      setAgendaPreFill({ name, phone: phone || '' });
                    } else {
                      setAgendaPreFill(null);
                    }
                    setIsAgendaOpen(true);
                  }}
                  sinistroLogs={sinistroLogs.filter((s) => s.vehicleId === car.id)}
                  onAddSinistro={(sinistro) => {
                    setSinistroLogs((prev) => [sinistro, ...prev]);
                    sendAppNotification(`🚨 Sinistro Registrado: ${car.brand} (${car.plate})`, {
                      body: `${sinistro.description} — Custo estimado: R$ ${(sinistro.repairCost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
                      eventKey: 'sinistro_logged',
                    });
                  }}
                  onDeleteSinistro={(id) => setSinistroLogs((prev) => prev.filter((s) => s.id !== id))}
                  onOpenLogForm={handleOpenForm}
                  onOpenInterestCalculator={(v) => {
                    setInterestCalcVehicle(v);
                    setIsInterestCalcOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quick Launch Actions (Abaixo dos Carros - Lado a Lado) */}
        <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto w-full">
          <button
            type="button"
            onClick={() => handleOpenForm('maintenance')}
            className="flex items-center justify-center gap-2 p-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-2xl transition-all cursor-pointer shadow-lg shadow-amber-500/5 group"
          >
            <Wrench className="w-4 h-4 group-hover:rotate-12 transition-transform shrink-0" />
            <span className="text-xs font-bold uppercase tracking-tight truncate">Manutenção</span>
          </button>
          
          <button
            type="button"
            onClick={() => handleOpenForm('expense')}
            className="flex items-center justify-center gap-2 p-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-2xl transition-all cursor-pointer shadow-lg shadow-blue-500/5 group"
          >
            <Coins className="w-4 h-4 group-hover:translate-y-[-2px] transition-transform shrink-0" />
            <span className="text-xs font-bold uppercase tracking-tight truncate">Despesa</span>
          </button>
        </div>
        
      </main>

      {/* Footer Branding */}
      <footer className="bg-[#0d0d0d] border-t border-white/5 py-6 text-center text-xs text-gray-500 shrink-0" id="app-footer">
        <p>© 2026 Gestão de Frota. Desenvolvido para administração de carros alugados.</p>
      </footer>

      {/* Interactive Log Entry Dialog Modal Form */}
      <LogForms 
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setActiveFormType(null); setGlobalPrefilledData(null); }}
        formType={activeFormType}
        vehicles={vehicles}
        selectedVehicleId={selectedVehicleId}
        vehicleToEdit={vehicleToEdit}
        contacts={contacts}
        prefilledData={globalPrefilledData}
        onSaveVehicle={handleSaveVehicle}
        onSaveFuel={handleSaveFuel}
        onSaveMaintenance={handleSaveMaintenance}
        onSaveExpense={handleSaveExpense}
        onSaveSinistro={(s) => setSinistroLogs(prev => [s, ...prev])}
        onSaveContact={handleSaveContact}
      />

      {/* Agenda Modal */}
      <AgendaModal
        isOpen={isAgendaOpen}
        onClose={() => {
          setIsAgendaOpen(false);
          setAgendaPreFill(null);
        }}
        contacts={contacts}
        vehicles={sortedVehicles}
        onSaveContact={handleSaveContact}
        onSaveMultipleContacts={handleSaveMultipleContacts}
        onDeleteContact={handleDeleteContact}
        preFill={agendaPreFill}
      />

      {/* Global Document Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadDocOpen}
        onClose={() => setIsUploadDocOpen(false)}
        vehicles={sortedVehicles}
        onUploadDocument={handleUploadDocument}
      />

      {/* Central de Ajuda Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onExportBackup={handleDownloadBackup}
        onImportBackup={handleUploadBackup}
        onResetSelectedData={handleResetSelectedData}
      />

      {/* Contratos Finalizados Modal */}
      <FinalizedContractsModal
        isOpen={isFinalizedContractsOpen}
        onClose={() => setIsFinalizedContractsOpen(false)}
        contracts={finalizedContracts}
        vehicles={sortedVehicles}
        vistorias={vistorias}
        onDeleteContract={handleDeleteFinalizedContract}
        onMarkContractAsViewed={handleMarkContractAsViewed}
        onMarkAllAsViewed={handleMarkAllContractsAsViewed}
        onDownloadBackup={handleDownloadBackup}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        disableFridayReminder={disableFridayReminder}
        onToggleFridayReminder={handleToggleFridayReminder}
        maintNotificationsEnabled={maintNotificationsEnabled}
        onToggleMaintNotifications={handleToggleMaintNotifications}
        vehicles={sortedVehicles}
        onTriggerMaintNotificationCheck={triggerMaintNotificationCheck}
        fuelLogs={fuelLogs}
        maintenanceLogs={maintenanceLogs}
        expenseLogs={expenseLogs}
        vistorias={vistorias}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={(yr, mo) => {
          setSelectedYear(yr);
          setSelectedMonth(mo);
        }}
        onDeleteFuel={handleDeleteFuel}
        onDeleteMaintenance={handleDeleteMaintenance}
        onDeleteExpense={handleDeleteExpense}
        onDeleteVistoria={handleDeleteVistoria}
        onUpdateFuel={handleUpdateFuel}
        onUpdateMaintenance={handleUpdateMaintenance}
        onUpdateExpense={handleUpdateExpense}
        onUpdateVistoria={handleUpdateVistoria}
        onClearAllVistorias={handleClearAllVistorias}
        onOpenBatchOdometer={() => setIsBatchOdometerOpen(true)}
      />

      {/* Centro de Notificações Modal */}
      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
      />

      <ChecklistConfigModal
        isOpen={isChecklistConfigOpen}
        onClose={() => setIsChecklistConfigOpen(false)}
        config={checklistConfig}
        onSave={(newConfig) => {
          setChecklistConfig(newConfig);
          setIsChecklistConfigOpen(false);
        }}
      />

      <RentalContractModal
        isOpen={isRentalContractOpen}
        onClose={() => setIsRentalContractOpen(false)}
        vehicle={selectedContractVehicle}
        vehicles={sortedVehicles}
        onUpdateVehicle={handleUpdateVehicle}
        checklistConfig={checklistConfig}
        onSaveVistoria={handleSaveVistoria}
        contacts={contacts}
        onSaveContact={handleSaveContact}
      />

      <ReportsAndHistoryModal
        isOpen={isReportsModalOpen}
        onClose={() => setIsReportsModalOpen(false)}
        vehicles={sortedVehicles}
        fuelLogs={fuelLogs}
        maintenanceLogs={maintenanceLogs}
        expenseLogs={expenseLogs}
        vistorias={vistorias}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onDeleteFuel={handleDeleteFuel}
        onDeleteMaintenance={handleDeleteMaintenance}
        onDeleteExpense={handleDeleteExpense}
        onDeleteVistoria={handleDeleteVistoria}
        onUpdateFuel={handleUpdateFuel}
        onUpdateMaintenance={handleUpdateMaintenance}
        onUpdateExpense={handleUpdateExpense}
        onUpdateVistoria={handleUpdateVistoria}
        onClearAllVistorias={handleClearAllVistorias}
      />

      {/* Confirmation Modal: Finalize Contract (Vehicle Preserved) */}
      <ConfirmFinalizeContractModal
        isOpen={!!vehiclePendingFinalize}
        vehicle={vehiclePendingFinalize}
        onConfirm={handleConfirmFinalizeContract}
        onCancel={() => setVehiclePendingFinalize(null)}
      />

      {/* Batch Odometer Modal (#9) */}
      <BatchOdometerModal
        isOpen={isBatchOdometerOpen}
        onClose={() => setIsBatchOdometerOpen(false)}
        vehicles={sortedVehicles}
        onBatchUpdateVehicles={(updatedList) => {
          setVehicles(updatedList);
        }}
      />

      {/* Interest & Fine Calculator Modal */}
      <InterestCalculatorModal
        isOpen={isInterestCalcOpen}
        onClose={() => setIsInterestCalcOpen(false)}
        vehicles={sortedVehicles}
        selectedVehicle={interestCalcVehicle}
      />

      {/* Confirmation Modal: Vehicle Deletion */}
      <ConfirmDeleteModal
        isOpen={!!vehiclePendingDelete}
        title="Excluir Veículo da Frota?"
        description={`Tem certeza que deseja excluir o veículo ${vehiclePendingDelete?.brand} ${vehiclePendingDelete?.model} (${vehiclePendingDelete?.plate})?`}
        warningNote="Todos os dados, manutenções e despesas serão consolidados e salvos automaticamente em PDF na pasta 'Contratos Finalizados'."
        confirmButtonText="Sim, Excluir e Baixar PDF"
        onConfirm={handleConfirmDeleteVehicle}
        onCancel={() => setVehiclePendingDelete(null)}
      />

      {/* Confirmation Modal: Dataset Reset */}
      <ConfirmDeleteModal
        isOpen={isResetConfirmOpen}
        title="Zerar Dados do Aplicativo?"
        description="Esta ação limpará todos os veículos, manutenções, despesas, contatos e vistorias para que o aplicativo/APK fique 100% limpo e sem dados."
        warningNote="Recomendamos fazer o download do backup antes de zerar se desejar guardar uma cópia."
        confirmButtonText="Sim, Zerar Todos os Dados"
        onConfirm={handleConfirmResetData}
        onCancel={() => setIsResetConfirmOpen(false)}
      />

      {/* Action Toast Banner */}
      {deleteToastMsg && (
        <div className="fixed bottom-6 right-6 z-[3000] max-w-md bg-zinc-900 border border-emerald-500/40 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-200">
          <p className="text-xs font-semibold leading-relaxed text-emerald-300">
            {deleteToastMsg}
          </p>
          <button
            onClick={() => setDeleteToastMsg(null)}
            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
          >
            ✕
          </button>
        </div>
      )}

      {/* About GKD Mobility App Modal */}
      <AboutAppModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        onOpenLogoViewer={() => setIsLogoViewerOpen(true)}
        totalVehicles={vehicles.length}
      />

      {/* Large Fullscreen Logo Viewer Modal */}
      <LogoViewerModal
        isOpen={isLogoViewerOpen}
        onClose={() => setIsLogoViewerOpen(false)}
      />

      {/* Global Voice Assistant Floating Button */}
      <GlobalVoiceAssistant onDataExtracted={handleGlobalDataExtracted} />
    </div>
  );
}
