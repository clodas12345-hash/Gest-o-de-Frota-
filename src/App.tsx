import React, { useState, useEffect, useRef } from 'react';
import { Vehicle, FuelLog, MaintenanceLog, TripLog, ExpenseLog, AgendaContact, Vistoria, VehicleDocument, FinalizedContract } from './types';
import { 
  INITIAL_VEHICLES, 
  INITIAL_FUEL_LOGS, 
  INITIAL_MAINTENANCE_LOGS, 
  INITIAL_TRIP_LOGS, 
  INITIAL_EXPENSE_LOGS,
  INITIAL_VISTORIAS
} from './mockData';
import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

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
import { HelpModal } from './components/HelpModal';
import { DashboardCalendar } from './components/DashboardCalendar';
import { FinalizedContractsModal } from './components/FinalizedContractsModal';
import { HeaderActionsMenu } from './components/HeaderActionsMenu';
import { SettingsModal } from './components/SettingsModal';
import { ChecklistConfigModal } from './components/ChecklistConfigModal';
import { RentalContractModal } from './components/RentalContractModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { ConfirmFinalizeContractModal } from './components/ConfirmFinalizeContractModal';
import { AboutAppModal } from './components/AboutAppModal';
import { LogoViewerModal } from './components/LogoViewerModal';
import { GlobalVoiceAssistant } from './components/GlobalVoiceAssistant';
import { generateVehiclePDF, generateVistoriaPDF } from './utils/pdfGenerator';
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
  ZoomIn
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

  const [tripLogs, setTripLogs] = useState<TripLog[]>(() => {
    const saved = localStorage.getItem('fleet_trip_logs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return INITIAL_TRIP_LOGS;
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

  // Preventive Maintenance Browser Notifications State
  const [maintNotificationsEnabled, setMaintNotificationsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('fleet_maint_notif_enabled') === 'true';
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isChecklistConfigOpen, setIsChecklistConfigOpen] = useState<boolean>(false);
  const [isRentalContractOpen, setIsRentalContractOpen] = useState<boolean>(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState<boolean>(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
  const [isLogoViewerOpen, setIsLogoViewerOpen] = useState<boolean>(false);
  const [selectedContractVehicle, setSelectedContractVehicle] = useState<Vehicle | null>(null);
  const [vehiclePendingFinalize, setVehiclePendingFinalize] = useState<Vehicle | null>(null);

  const [checklistConfig, setChecklistConfig] = useState<string[]>(() => {
    const saved = localStorage.getItem('fleet_checklist_config');
    if (saved) return JSON.parse(saved);
    return [
      'Estepe',
      'Chaves de roda',
      'Frente do carro',
      'Fundo do carro',
      'Lateral direita',
      'Lateral esquerda',
      'Estofados frente',
      'Estofados trás',
      'Nível de combustivel'
    ];
  });

  const handleToggleMaintNotifications = (enabled: boolean) => {
    setMaintNotificationsEnabled(enabled);
    localStorage.setItem('fleet_maint_notif_enabled', enabled ? 'true' : 'false');
  };

  React.useEffect(() => {
    localStorage.setItem('fleet_checklist_config', JSON.stringify(checklistConfig));
  }, [checklistConfig]);

  const triggerMaintNotificationCheck = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        const needyVehicles = vehicles.filter((v) => {
          const cur = v.preventiveMaintCurrentKm || v.currentKm || 0;
          const next = v.preventiveMaintNextKm || 0;
          return next > 0 && cur >= (next - 500);
        });

        if (needyVehicles.length === 0) {
          new Notification('🚗 Frota em Dia com Manutenção', {
            body: 'Nenhum veículo atingiu o limite de quilometragem para revisão preventiva no momento.',
          });
        } else {
          needyVehicles.forEach((v) => {
            const cur = v.preventiveMaintCurrentKm || v.currentKm || 0;
            const next = v.preventiveMaintNextKm || 0;
            const isOverdue = cur >= next;
            new Notification(
              isOverdue
                ? `🚨 ALERTA: MANUTENÇÃO VENCIDA - ${v.brand} (${v.plate})`
                : `⚠️ ATENÇÃO: Revisão Próxima - ${v.brand} (${v.plate})`,
              {
                body: isOverdue
                  ? `O veículo atingiu ${cur.toLocaleString('pt-BR')} KM (limite era ${next.toLocaleString('pt-BR')} KM). Providencie a revisão!`
                  : `Atual: ${cur.toLocaleString('pt-BR')} KM. Próxima revisão: ${next.toLocaleString('pt-BR')} KM (faltam ${ (next - cur).toLocaleString('pt-BR') } KM).`,
              }
            );
          });
        }
      } else {
        alert('As notificações do navegador não estão com permissão concedida. Clique em "Permitir Notificações" nas configurações.');
      }
    } else {
      alert('Seu navegador não suporta notificações nativas.');
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

  const handleGlobalDataExtracted = (type: 'vehicle' | 'fuel' | 'maintenance' | 'trip' | 'expense', data: any) => {
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

  const saveToCloud = (field: string, data: any) => {
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
      }, 600);
    } catch (err) {
      console.warn('Error preparing saveToCloud:', err);
    }
  };

  // Load initial data from Firestore and setup real-time listener for instant cloud saving & sync
  useEffect(() => {
    const docRef = doc(db, 'fleetData', 'main');
    
    getDoc(docRef).then((snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.vehicles && Array.isArray(d.vehicles)) {
          setVehicles(ensureFuturePaymentsForVehicles(d.vehicles));
        }
        if (d.contacts && Array.isArray(d.contacts)) setContacts(d.contacts);
        if (d.fuelLogs && Array.isArray(d.fuelLogs)) setFuelLogs(d.fuelLogs);
        if (d.maintenanceLogs && Array.isArray(d.maintenanceLogs)) setMaintenanceLogs(d.maintenanceLogs);
        if (d.tripLogs && Array.isArray(d.tripLogs)) setTripLogs(d.tripLogs);
        if (d.expenseLogs && Array.isArray(d.expenseLogs)) setExpenseLogs(d.expenseLogs);
        if (d.vistorias && Array.isArray(d.vistorias)) setVistorias(d.vistorias);
        if (d.finalizedContracts && Array.isArray(d.finalizedContracts)) setFinalizedContracts(d.finalizedContracts);
      } else {
        const initialPayload = sanitizeForCloud({
          vehicles: cleanVehiclesForCloud(vehicles),
          contacts,
          fuelLogs,
          maintenanceLogs,
          tripLogs,
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
      isCloudLoadedRef.current = true;
    });

    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists() && isCloudLoadedRef.current) {
        const d = snap.data();
        isRemoteUpdateRef.current = true;
        if (d.vehicles && Array.isArray(d.vehicles)) {
          setVehicles(ensureFuturePaymentsForVehicles(d.vehicles));
        }
        if (d.contacts && Array.isArray(d.contacts)) setContacts(d.contacts);
        if (d.fuelLogs && Array.isArray(d.fuelLogs)) setFuelLogs(d.fuelLogs);
        if (d.maintenanceLogs && Array.isArray(d.maintenanceLogs)) setMaintenanceLogs(d.maintenanceLogs);
        if (d.tripLogs && Array.isArray(d.tripLogs)) setTripLogs(d.tripLogs);
        if (d.expenseLogs && Array.isArray(d.expenseLogs)) setExpenseLogs(d.expenseLogs);
        if (d.vistorias && Array.isArray(d.vistorias)) setVistorias(d.vistorias);
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
    if (params.get('mode') === 'vistoria_retorno' || params.has('vistoria')) {
      setIsVistoriaMode(true);
      setVistoriaPlateParam(params.get('placa') || params.get('vistoria') || '');
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
      localStorage.setItem('fleet_trip_logs', JSON.stringify(tripLogs));
    } catch (e) { console.warn('Storage quota exceeded', e); }

    saveToCloud('tripLogs', tripLogs);
  }, [tripLogs]);

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
  const [activeFormType, setActiveFormType] = useState< 'vehicle' | 'fuel' | 'maintenance' | 'trip' | 'expense' | null>(null);
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
  const handleOpenForm = (type: 'vehicle' | 'fuel' | 'maintenance' | 'trip' | 'expense', vId: string = '') => {
    setActiveFormType(type);
    setSelectedVehicleId(vId || (vehicles[0]?.id || ''));
    setVehicleToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEditVehicle = (vehicle: Vehicle) => {
    setActiveFormType('vehicle');
    setVehicleToEdit(vehicle);
    setSelectedVehicleId(vehicle.id);
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

  const handleUpdateVehicle = (vehicle: Vehicle) => {
    setVehicles((prev) => prev.map((v) => (v.id === vehicle.id ? vehicle : v)));
  };

  const handleUploadDocument = (
    vehicleId: string,
    doc: { name: string; category: string; contentUrl: string; fileSize: string; fileType: string }
  ) => {
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
  };

  // Actions: Save Trip Log + UPDATE VEHICLE ODOMETER & REDUCE FUEL BASED ON KM DRIVEN
  const handleSaveTrip = (log: Omit<TripLog, 'id'>) => {
    const newId = `trip-${Date.now()}`;
    const newLog: TripLog = { ...log, id: newId };
    setTripLogs((prev) => [newLog, ...prev]);

    // Calculate approximate fuel consumed (1 oitavo for every 40 km driven, minimum 1 if distance > 0)
    const distance = log.endKm - log.startKm;
    const fuelBurnEighths = distance > 0 ? Math.max(1, Math.round(distance / 40)) : 0;

    // Update vehicle properties
    setVehicles((prevVehicles) =>
      prevVehicles.map((v) => {
        if (v.id === log.vehicleId) {
          const finalFuel = Math.max(0, v.fuelLevel - fuelBurnEighths);
          return {
            ...v,
            currentKm: Math.max(v.currentKm, log.endKm),
            fuelLevel: finalFuel,
          };
        }
        return v;
      })
    );
  };

  // Actions: Save Expense Log
  const handleSaveExpense = (log: Omit<ExpenseLog, 'id'>) => {
    const newId = `exp-${Date.now()}`;
    const newLog: ExpenseLog = { ...log, id: newId };
    setExpenseLogs((prev) => [newLog, ...prev]);
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

  const handleUpdateTrip = (updatedLog: TripLog) => {
    setTripLogs((prev) => prev.map((log) => (log.id === updatedLog.id ? updatedLog : log)));
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

  const handleDeleteTrip = (id: string) => {
    setTripLogs((prev) => prev.filter((log) => log.id !== id));
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
      setTripLogs((prev) => prev.filter((log) => log.vehicleId !== id));
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
        documents: [finalDoc, ...(targetVehicle.documents || [])]
      };

      setVehicles((prev) => prev.map((v) => (v.id === id ? updatedVehicle : v)));

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
    setVistorias((prev) => {
      const exists = prev.some((v) => v.id === vistoria.id);
      if (exists) {
        return prev.map((v) => (v.id === vistoria.id ? vistoria : v));
      }
      return [vistoria, ...prev];
    });

    // We will find the vehicle to generate the PDF
    const targetVehicle = vehicles.find(v => v.id === vistoria.vehicleId);
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

          return {
            ...v,
            nextVistoriaDate: undefined, // Clear next vistoria date
            documents: updatedDocs
          };
        }
        return v;
      })
    );
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
      localStorage.removeItem('fleet_trip_logs');
      setFuelLogs([]);
      setTripLogs([]);
      saveToCloud('fuelLogs', []);
      saveToCloud('tripLogs', []);
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
    setTripLogs([]);
    setExpenseLogs([]);
    setVistorias([]);
    setFinalizedContracts([]);
    setContacts([]);
    
    const docRef = doc(db, 'fleetData', 'main');
    setDoc(docRef, {
      vehicles: [],
      contacts: [],
      fuelLogs: [],
      maintenanceLogs: [],
      tripLogs: [],
      expenseLogs: [],
      vistorias: [],
      finalizedContracts: [],
      updatedAt: new Date().toISOString()
    }).catch(err => console.warn('Error resetting cloud data:', err));

    setIsResetConfirmOpen(false);

    setDeleteToastMsg('Dados zerados com sucesso! O aplicativo e o banco de dados estão limpos.');
    setTimeout(() => setDeleteToastMsg(null), 4000);
  };

  // Backup data functions
  const handleDownloadBackup = async () => {
    const backupData = {
      vehicles,
      fuelLogs,
      maintenanceLogs,
      tripLogs,
      expenseLogs,
      vistorias,
      contacts,
      finalizedContracts,
      checklistConfig,
      exportDate: new Date().toISOString()
    };
    
    const jsonString = JSON.stringify(backupData, null, 2);
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const fileName = `backup_controle_frota_${day}_${month}_${year}.json`;

    if (Capacitor.isNativePlatform()) {
      try {
        const result = await Filesystem.writeFile({
          path: fileName,
          data: jsonString,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });
        
        await Share.share({
          title: 'Backup Gestão de Frota',
          text: 'Arquivo de backup do sistema Gestão de Frota',
          url: result.uri,
          dialogTitle: 'Salvar ou Compartilhar Backup'
        });

        setDeleteToastMsg('Backup gerado e salvo na memória interna com sucesso!');
        setTimeout(() => setDeleteToastMsg(null), 4000);
        return;
      } catch (err) {
        console.error('Erro ao salvar backup nativo:', err);
      }
    }

    // Fallback for Web / Blob download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.download = fileName;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);

    setDeleteToastMsg('Backup gerado e baixado com sucesso!');
    setTimeout(() => setDeleteToastMsg(null), 4000);
  };

  const handleUploadBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = event.target.files?.[0];
    if (!file) return;

    fileReader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed.vehicles || parsed.fuelLogs || parsed.vistorias || parsed.maintenanceLogs) {
          if (parsed.vehicles) setVehicles(parsed.vehicles);
          if (parsed.fuelLogs) setFuelLogs(parsed.fuelLogs);
          if (parsed.maintenanceLogs) setMaintenanceLogs(parsed.maintenanceLogs);
          if (parsed.tripLogs) setTripLogs(parsed.tripLogs || []);
          if (parsed.expenseLogs) setExpenseLogs(parsed.expenseLogs || []);
          if (parsed.vistorias) setVistorias(parsed.vistorias || []);
          if (parsed.contacts) setContacts(parsed.contacts || []);
          if (parsed.finalizedContracts) setFinalizedContracts(parsed.finalizedContracts || []);
          if (parsed.checklistConfig) setChecklistConfig(parsed.checklistConfig);

          setDeleteToastMsg('Backup restaurado com sucesso! Todos os dados foram recuperados.');
          setTimeout(() => setDeleteToastMsg(null), 4000);
        } else {
          alert('Arquivo de backup inválido.');
        }
      } catch (err) {
        alert('Erro ao processar o arquivo de backup.');
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

    return (
      <DriverVistoriaForm
        vehicle={targetVehicle}
        plateRequested={vistoriaPlateParam}
        checklistConfig={checklistConfig}
        onSaveVistoria={(newVistoria, pdfDataUrl, pdfFileName) => {
          setVistorias(prev => [newVistoria, ...prev]);
          
          const docName = pdfFileName || `Vistoria (${newVistoria.type}) - ${new Date(newVistoria.date + 'T12:00:00').toLocaleDateString('pt-BR')}.pdf`;
          
          const attachDoc = (url?: string, size?: string, type?: string) => {
            const vistoriaDoc = {
              id: `doc-vist-${Date.now()}`,
              name: docName,
              category: 'Vistoria',
              uploadDate: newVistoria.date,
              fileSize: size || 'Documento PDF',
              fileType: type || 'pdf',
              contentUrl: url
            };
            setVehicles(prev => {
              const found = prev.some(v => v.id === targetVehicle.id || v.plate.toUpperCase() === targetVehicle.plate.toUpperCase());
              if (!found) {
                return [{ ...targetVehicle, documents: [vistoriaDoc, ...(targetVehicle.documents || [])] }, ...prev];
              }
              return prev.map(v => {
                if (v.id === targetVehicle.id || v.plate.toUpperCase() === targetVehicle.plate.toUpperCase()) {
                  return {
                    ...v,
                    documents: [vistoriaDoc, ...(v.documents || [])]
                  };
                }
                return v;
              });
            });
          };

          if (pdfDataUrl) {
            attachDoc(pdfDataUrl, 'Documento PDF', 'pdf');
          } else {
            generateVistoriaPDF(targetVehicle, newVistoria).then(({ pdfDataUrl: generatedUrl, fileName }) => {
              attachDoc(generatedUrl, 'Documento PDF', 'pdf');
            }).catch(err => {
              console.error("Erro ao gerar PDF da Vistoria", err);
              attachDoc(newVistoria.photos.length > 0 ? newVistoria.photos[0] : undefined, newVistoria.photos.length > 0 ? `${newVistoria.photos.length} foto(s)` : 'Checklist', newVistoria.photos.length > 0 ? 'image' : 'pdf');
            });
          }
        }}
        onExit={() => {
          setIsVistoriaMode(false);
          // Clean up the URL query params so they don't lock the browser back button or refresh in public mode
          window.history.replaceState({}, document.title, window.location.pathname);
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
                alt="GKD Mobility" 
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
              title="Clique para ver sobre o aplicativo GKD Mobility"
            >
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                <span className="group-hover:text-blue-300 transition-colors">GKD Mobility</span>
                <span className="text-[10px] font-normal text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">Gestão de Frota</span>
              </h1>
              <p className="text-[10px] text-gray-400">Controle para seus {vehicles.length} carros alugados</p>
            </button>
          </div>

          {/* Action Header Buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => setIsReportsModalOpen(true)}
              className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer"
              title="Abrir painel consolidado de gráficos e histórico"
            >
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">Gráficos & Histórico</span>
              <span className="sm:hidden">Painel</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAgendaOpen(true)}
              className="px-3 py-2 bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all shadow-md shadow-teal-500/10 cursor-pointer"
              title="Abrir Agenda Telefônica e de Contatos/Locatários"
            >
              <BookOpen className="w-4 h-4 text-teal-400" />
              <span className="hidden sm:inline">Agenda de Contatos</span>
              <span className="sm:hidden">Agenda</span>
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
              onOpenDocumentUpload={() => setIsUploadDocOpen(true)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenChecklistConfig={() => setIsChecklistConfigOpen(true)}
              onDownloadBackup={handleDownloadBackup}
              onUploadBackup={handleUploadBackup}
              onResetData={handleResetData}
            />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8" id="app-main-content">
        
        {/* Dashboard Calendar */}
        <DashboardCalendar 
          vehicles={vehicles}
          maintenanceLogs={maintenanceLogs}
          vistorias={vistorias}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={(yr, mo) => {
            setSelectedYear(yr);
            setSelectedMonth(mo);
          }}
        />

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
          vehicles={vehicles}
          fuelLogs={fuelLogs}
          maintenanceLogs={maintenanceLogs}
          tripLogs={tripLogs}
          expenseLogs={expenseLogs}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
        />

        {/* 2. Vehicles Grid Heading and Cards */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
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
              {vehicles.map((car) => (
                <VehicleCard
                  key={car.id}
                  vehicle={car}
                  vehicleExpenses={expenseLogs.filter((log) => log.vehicleId === car.id)}
                  vistorias={vistorias.filter((v) => v.vehicleId === car.id)}
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
                />
              ))}
            </div>
          )}
        </div>

        {/* Reports & History Modal Trigger Card */}
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 text-center shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Painel Consolidado de Gráficos & Histórico Geral</h3>
              <p className="text-xs text-gray-400">Visualize comparativos de despesas, distribuição de orçamento e todo o histórico de lançamentos em um único modal.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsReportsModalOpen(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-blue-600/20 cursor-pointer shrink-0 flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Abrir Painel em Modal</span>
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
        onSaveTrip={handleSaveTrip}
        onSaveExpense={handleSaveExpense}
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
        vehicles={vehicles}
        onSaveContact={handleSaveContact}
        onSaveMultipleContacts={handleSaveMultipleContacts}
        onDeleteContact={handleDeleteContact}
        preFill={agendaPreFill}
      />

      {/* Global Document Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadDocOpen}
        onClose={() => setIsUploadDocOpen(false)}
        vehicles={vehicles}
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
        onDeleteContract={handleDeleteFinalizedContract}
        onMarkContractAsViewed={handleMarkContractAsViewed}
        onMarkAllAsViewed={handleMarkAllContractsAsViewed}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        disableFridayReminder={disableFridayReminder}
        onToggleFridayReminder={handleToggleFridayReminder}
        maintNotificationsEnabled={maintNotificationsEnabled}
        onToggleMaintNotifications={handleToggleMaintNotifications}
        vehicles={vehicles}
        onTriggerMaintNotificationCheck={triggerMaintNotificationCheck}
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
        vehicles={vehicles}
        onUpdateVehicle={handleUpdateVehicle}
        checklistConfig={checklistConfig}
        onSaveVistoria={handleSaveVistoria}
        contacts={contacts}
        onSaveContact={handleSaveContact}
      />

      <ReportsAndHistoryModal
        isOpen={isReportsModalOpen}
        onClose={() => setIsReportsModalOpen(false)}
        vehicles={vehicles}
        fuelLogs={fuelLogs}
        maintenanceLogs={maintenanceLogs}
        tripLogs={tripLogs}
        expenseLogs={expenseLogs}
        vistorias={vistorias}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onDeleteFuel={handleDeleteFuel}
        onDeleteMaintenance={handleDeleteMaintenance}
        onDeleteTrip={handleDeleteTrip}
        onDeleteExpense={handleDeleteExpense}
        onDeleteVistoria={handleDeleteVistoria}
        onUpdateFuel={handleUpdateFuel}
        onUpdateMaintenance={handleUpdateMaintenance}
        onUpdateTrip={handleUpdateTrip}
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
