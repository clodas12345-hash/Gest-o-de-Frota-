import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bell, 
  BellRing, 
  BellOff, 
  Check, 
  Sparkles, 
  Volume2, 
  ShieldCheck, 
  Search, 
  SlidersHorizontal, 
  CheckCircle2, 
  AlertTriangle,
  Play
} from 'lucide-react';
import { 
  NOTIFICATION_OPTIONS, 
  NotificationEventKey, 
  NotificationOptionDefinition,
  getNotificationPreferences, 
  setNotificationPreferences, 
  DEFAULT_NOTIFICATION_PREFERENCES,
  sendAppNotification,
  requestNotificationPermission,
  checkNotificationPermission
} from '../utils/notifications';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPreferencesChange?: (prefs: Record<NotificationEventKey, boolean>) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onPreferencesChange
}) => {
  const [preferences, setPreferences] = useState<Record<NotificationEventKey, boolean>>(() => getNotificationPreferences());
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [testedKey, setTestedKey] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(true);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPreferences(getNotificationPreferences());
      checkNotificationPermission().then(granted => {
        setHasPermission(granted);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = [
    'Todas',
    'Manutenção e Pneus',
    'Vistorias',
    'Financeiro e Pagamentos',
    'Contratos e CNH',
    'Operação e Sistema'
  ];

  const handleToggle = (key: NotificationEventKey) => {
    const updated = {
      ...preferences,
      [key]: !preferences[key]
    };
    setPreferences(updated);
    setNotificationPreferences(updated);
    onPreferencesChange?.(updated);

    setSavedFeedback(`Preferência atualizada: ${updated[key] ? 'Ativada' : 'Desativada'}`);
    setTimeout(() => setSavedFeedback(null), 2000);
  };

  const handleToggleAll = (enable: boolean) => {
    const updated = { ...DEFAULT_NOTIFICATION_PREFERENCES };
    (Object.keys(updated) as NotificationEventKey[]).forEach(k => {
      updated[k] = enable;
    });
    setPreferences(updated);
    setNotificationPreferences(updated);
    onPreferencesChange?.(updated);

    setSavedFeedback(enable ? `Todas as ${totalCount} notificações foram ativadas!` : 'Todas as notificações foram desativadas.');
    setTimeout(() => setSavedFeedback(null), 2500);
  };

  const handleTestNotification = async (option: NotificationOptionDefinition) => {
    setTestedKey(option.key);
    try {
      await sendAppNotification(option.sampleTitle, {
        body: option.sampleBody,
        eventKey: option.key,
        force: true
      });
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setTestedKey(null), 1500);
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setHasPermission(granted);
    if (granted) {
      sendAppNotification('🔔 Permissão Concedida!', {
        body: 'O Centro de Notificações está ativo no seu aparelho.',
        force: true
      });
    }
  };

  // Filtering
  const filteredOptions = NOTIFICATION_OPTIONS.filter(opt => {
    const matchCategory = selectedCategory === 'Todas' || opt.category === selectedCategory;
    const matchSearch = searchQuery.trim() === '' || 
      opt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opt.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const enabledCount = Object.values(preferences).filter(Boolean).length;
  const totalCount = NOTIFICATION_OPTIONS.length;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[120] p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#121214] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-[#18181b] gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Centro de Notificações</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {enabledCount} de {totalCount} ativas
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Ative ou desative individualmente os {totalCount} tipos de avisos e notificações da sua frota
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!hasPermission && (
              <button
                onClick={handleRequestPermission}
                className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Permitir no Aparelho
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Controls & Filters Bar */}
        <div className="p-4 bg-black/40 border-b border-white/10 space-y-3">
          
          {/* Top Row: Search & Quick Toggle All */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar tipo de notificação (ex: manutenção, pix, vistoria, seguro, contrato)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-[#1a1a1f] border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-hidden focus:border-emerald-500/50"
              />
            </div>

            {/* Enable/Disable All Buttons */}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                onClick={() => handleToggleAll(true)}
                className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Ativar Todas ({totalCount})</span>
              </button>
              <button
                onClick={() => handleToggleAll(false)}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <BellOff className="w-3.5 h-3.5" />
                <span>Desativar Todas</span>
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer border ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/40'
                    : 'bg-[#18181d] text-gray-400 hover:text-white border-white/5 hover:bg-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Feedback Banner */}
        {savedFeedback && (
          <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-xs text-emerald-300 font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{savedFeedback}</span>
          </div>
        )}

        {/* Notification Cards List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar">
          {filteredOptions.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-xs">
              Nenhuma notificação encontrada com o termo "{searchQuery}".
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const isEnabled = preferences[opt.key] ?? true;

              return (
                <div
                  key={opt.key}
                  className={`p-4 rounded-2xl border transition-all shadow-md ${
                    isEnabled
                      ? 'bg-[#16161c] border-emerald-500/20 hover:border-emerald-500/35'
                      : 'bg-[#121215] border-white/5 opacity-65 hover:opacity-90'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    
                    {/* Left: Info & Sample */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      
                      {/* Tag & Number */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-black text-gray-400 bg-black/40 px-2 py-0.5 rounded-md border border-white/5">
                          #{String(opt.number).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] font-bold text-gray-300 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                          {opt.category}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{opt.title}</span>
                      </h4>

                      {/* Description */}
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {opt.description}
                      </p>

                      {/* Sample Preview Box */}
                      <div className="mt-2 p-2.5 bg-black/40 rounded-xl border border-white/5 text-[11px] space-y-0.5 max-w-xl">
                        <span className="text-[9px] uppercase font-bold text-gray-500 block">Exemplo do Alerta:</span>
                        <p className="font-bold text-gray-200">{opt.sampleTitle}</p>
                        <p className="text-gray-400 text-[10px] leading-tight">{opt.sampleBody}</p>
                      </div>
                    </div>

                    {/* Right: Toggle Switch & Test Button */}
                    <div className="flex flex-col items-end gap-3 shrink-0 pt-1">
                      
                      {/* iOS Style Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => handleToggle(opt.key)}
                        className={`w-13 h-7 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                          isEnabled ? 'bg-emerald-500' : 'bg-zinc-800'
                        }`}
                        title={isEnabled ? 'Clique para desativar' : 'Clique para ativar'}
                      >
                        <div
                          className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 flex items-center justify-center ${
                            isEnabled ? 'translate-x-6 text-emerald-600' : 'translate-x-0 text-zinc-500'
                          }`}
                        >
                          {isEnabled ? <Check className="w-3 h-3 stroke-[3]" /> : <X className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>

                      {/* Test Trigger Button */}
                      <button
                        type="button"
                        onClick={() => handleTestNotification(opt)}
                        disabled={testedKey === opt.key}
                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg border border-white/10 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                        title="Disparar este alerta agora no aparelho para teste"
                      >
                        <Play className="w-2.5 h-2.5 text-emerald-400 fill-emerald-400" />
                        <span>{testedKey === opt.key ? 'Disparado!' : 'Testar'}</span>
                      </button>

                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#16161a] flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-gray-400">
            💾 As preferências são salvas automaticamente no seu navegador/aplicativo.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-900/30"
          >
            Pronto / Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
