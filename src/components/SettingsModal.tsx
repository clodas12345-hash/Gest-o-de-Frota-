import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Bell, 
  BellOff, 
  ShieldAlert, 
  Gauge, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle,
  Volume2
} from 'lucide-react';
import { Vehicle } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  disableFridayReminder: boolean;
  onToggleFridayReminder: (disabled: boolean) => void;
  maintNotificationsEnabled: boolean;
  onToggleMaintNotifications: (enabled: boolean) => void;
  vehicles: Vehicle[];
  onTriggerMaintNotificationCheck: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  disableFridayReminder,
  onToggleFridayReminder,
  maintNotificationsEnabled,
  onToggleMaintNotifications,
  vehicles,
  onTriggerMaintNotificationCheck
}: SettingsModalProps) {
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        setPermissionState(res);
        if (res === 'granted') {
          onToggleMaintNotifications(true);
          new Notification('🔔 Notificações Ativadas!', {
            body: 'Você receberá alertas do navegador quando a quilometragem do veículo atingir o limite de manutenção preventiva.',
          });
        }
      } catch (err) {
        console.error('Erro ao solicitar permissão de notificação:', err);
      }
    } else {
      alert('Seu navegador não suporta a API de Notificações nativas.');
    }
  };

  const vehiclesNeedingMaint = vehicles.filter((v) => {
    const current = v.preventiveMaintCurrentKm || v.currentKm || 0;
    const next = v.preventiveMaintNextKm || 0;
    return next > 0 && current >= (next - 500);
  });

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />

      <div className="relative w-full max-w-lg bg-[#141414] border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-[1001] animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/10 bg-[#181818] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Configurações de Lembretes</h2>
              <p className="text-[11px] text-gray-400">Preferências, avisos de vistoria e notificações</p>
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

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-white/10">
          
          {/* Section 1: Lembrete de Vistoria de Sexta-Feira */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-purple-400" />
              <span>1. Lembrete de Vistoria Semanal (Sexta-Feira)</span>
            </h3>

            {/* Friday Reminder Toggle Card */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Aviso de Vistoria de Sexta-Feira</span>
                  </p>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Banner exibido todas as sextas-feiras no topo do aplicativo lembrando do envio de vistorias aos motoristas.
                  </p>
                </div>

                {/* Toggle Switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={!disableFridayReminder}
                  onClick={() => onToggleFridayReminder(!disableFridayReminder)}
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

              {/* Status Badge */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">Status do Lembrete:</span>
                {!disableFridayReminder ? (
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Bell className="w-3 h-3 text-emerald-400" /> Ativado (Aviso exibe na sexta)
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <BellOff className="w-3 h-3 text-rose-400" /> Desativado Permanentemente
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-white/10" />

          {/* Section 2: Notificação do Navegador para Manutenção Preventiva por KM */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-blue-400" />
              <span>2. Agendamento de Notificação por Quilometragem</span>
            </h3>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Alertas do Navegador (Manutenção Preventiva)</span>
                  </p>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Emite alertas visuais do sistema operacional/navegador quando a KM atual do veículo se aproximar ou atingir o limite de revisão configurado.
                  </p>
                </div>

                {/* Toggle Switch */}
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

              {/* Permission & Action Button */}
              <div className="pt-2 border-t border-white/5 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-400">Permissão do Navegador:</span>
                  {permissionState === 'granted' ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Concedida
                    </span>
                  ) : permissionState === 'denied' ? (
                    <span className="text-rose-400 font-bold flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                      <AlertTriangle className="w-3 h-3" /> Bloqueada no Navegador
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

                {/* Test / Trigger Notification Button */}
                <div className="pt-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-gray-400">
                    Veículos com revisão pendente: <strong className="text-amber-400">{vehiclesNeedingMaint.length}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={onTriggerMaintNotificationCheck}
                    className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 font-bold text-[11px] rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Disparar verificação e notificação teste agora"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Disparar Notificação Agora</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

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
    </div>
  );
}
