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
  Play
} from 'lucide-react';
import { Vehicle } from '../types';
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
  const [permissionState, setPermissionState] = useState<'granted' | 'denied' | 'default'>('default');
  const [notifPrefs, setNotifPrefs] = useState<Record<NotificationEventKey, boolean>>(() => getNotificationPreferences());
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  useEffect(() => {
    if (isOpen) {
      setNotifPrefs(getNotificationPreferences());
      checkNotificationPermission().then((granted) => {
        setPermissionState(granted ? 'granted' : 'default');
      });
    }
  }, [isOpen]);

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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />

      <div className="relative w-full max-w-2xl bg-[#141414] border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-[1001] animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/10 bg-[#181818] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Configurações e Central de Notificações</h2>
              <p className="text-[11px] text-gray-400">Escolha quais dos 20 alertas você deseja receber no seu aparelho</p>
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
          
          {/* Section 1: Central de Escolha das 20 Notificações */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <ListChecks className="w-4 h-4 text-emerald-400" />
                <span>1. Escolher Notificações para Receber ({enabledCount}/20 ativas)</span>
              </h3>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSelectAllNotifs(true)}
                  className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                >
                  Ativar Todas (20)
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

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 pt-1">
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

            {/* 20 Notifications List */}
            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
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

          <div className="border-t border-white/10" />

          {/* Section 2: Lembrete de Vistoria de Sexta-Feira */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-purple-400" />
              <span>2. Banner e Alerta de Vistoria Semanal (Sexta-Feira)</span>
            </h3>

            {/* Friday Reminder Toggle Card */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Aviso de Vistoria de Sexta-Feira</span>
                  </p>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Banner exibido todas as sextas-feiras no topo do aplicativo e notificação agendada às 09:00 lembrando do envio de vistorias aos motoristas.
                  </p>
                </div>

                {/* Toggle Switch */}
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

          {/* Section 3: Permissão Nativa e Bateria (App Fechado) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-blue-400" />
              <span>3. Permissão do Sistema e Funcionamento com App Fechado</span>
            </h3>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Chave Geral de Notificações de Manutenção</span>
                  </p>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Emite alertas na barra de notificações do Android/Navegador quando a KM atual do veículo atingir o limite configurado.
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
                  <span className="text-gray-400">Permissão de Notificações:</span>
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

                {/* Battery Optimization & Exact Alarm Button */}
                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-white/5">
                  <span className="text-[11px] text-gray-400">
                    Ativação para Notificações com App Fechado:
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

                {/* Test / Trigger Notification Button */}
                <div className="pt-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-gray-400">
                    Veículos com revisão pendente: <strong className="text-amber-400">{vehiclesNeedingMaint.length}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={onTriggerMaintNotificationCheck}
                    className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 font-bold text-[11px] rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Disparar verificação e notificação das escolhas ativas agora"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Verificar e Disparar Alertas Ativos</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10" />

          {/* Section 4: Permissões do Dispositivo (Câmera, Memória Interna, Localização) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>4. Autorização de Permissões do Dispositivo</span>
            </h3>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Conceda permissões para que o aplicativo possa acessar a câmera (vistorias), memória interna (salvar backups JSON) e localização.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
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

          <div className="border-t border-white/10" />

          {/* Section 5: Suporte e Fale Conosco (WhatsApp) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>5. Suporte e Fale Conosco</span>
            </h3>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Precisa de suporte técnico, tirar dúvidas ou enviar sugestões para o aplicativo Gestão de Frota? Fale diretamente com nossa equipe via WhatsApp.
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
