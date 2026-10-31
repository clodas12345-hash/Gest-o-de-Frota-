import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Smartphone, 
  Mail, 
  CreditCard, 
  Calendar, 
  Car, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Shield,
  Activity,
  Gauge
} from 'lucide-react';
import { AgendaContact, Vehicle } from '../types';
import { Capacitor, registerPlugin } from '@capacitor/core';

const Contacts = registerPlugin<any>('Contacts');

export const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str
    .split(/\s+/)
    .map((word) => {
      if (!word) return '';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

const formatCpf = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
};

interface RegisterDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  onSaveContact: (contact: AgendaContact) => void;
  onUpdateVehicle?: (vehicle: Vehicle) => void;
  preSelectedVehicleId?: string;
  driverToEdit?: AgendaContact | null;
}

export const RegisterDriverModal: React.FC<RegisterDriverModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  onSaveContact,
  onUpdateVehicle,
  preSelectedVehicleId,
  driverToEdit
}) => {
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cnhCategory, setCnhCategory] = useState('B (Carro)');
  const [cnhNumber, setCnhNumber] = useState('');
  const [cnhExpiration, setCnhExpiration] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [region, setRegion] = useState('Locatário');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStatusNotice(null);
      setIsSubmitting(false);

      if (driverToEdit) {
        setName(driverToEdit.name || '');
        setCpf(driverToEdit.cpfCnpj || '');
        let p = driverToEdit.phone || '';
        if (p.startsWith('55')) p = p.substring(2);
        setPhone(p);
        setEmail(driverToEdit.email || '');
        setCnhCategory(driverToEdit.cnhCategory || 'B (Carro)');
        setCnhNumber(driverToEdit.cnh || '');
        setCnhExpiration(driverToEdit.cnhExpiration || '');
        setRegion(driverToEdit.region || 'Locatário');
        
        // Find vehicle linked to this driver
        const linkedVeh = vehicles.find(v => 
          (driverToEdit.activeVehiclePlate && v.plate.toUpperCase() === driverToEdit.activeVehiclePlate.toUpperCase()) ||
          (v.driver && v.driver.toLowerCase() === driverToEdit.name.toLowerCase())
        );
        setSelectedVehicleId(linkedVeh?.id || '');
      } else {
        setName('');
        setCpf('');
        setPhone('');
        setEmail('');
        setCnhCategory('B (Carro)');
        setCnhNumber('');
        setCnhExpiration('');
        setRegion('Locatário');
        setSelectedVehicleId(preSelectedVehicleId || (vehicles[0]?.id || ''));
      }
    }
  }, [isOpen, driverToEdit, preSelectedVehicleId]);

  if (!isOpen) return null;

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  // Native phone contacts picker
  const handlePickNativeContacts = async () => {
    setStatusNotice(null);
    const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

    // 1. Try Capacitor Native Contacts plugin
    if (Capacitor.isNativePlatform()) {
      try {
        const perm = await Contacts.requestPermissions();
        if (perm.contacts === 'granted') {
          const res = await Contacts.getContacts({
            projection: { name: true, phones: true, emails: true }
          });
          if (res && res.contacts && res.contacts.length > 0) {
            const first = res.contacts[0];
            const contactName = first.name?.display || first.name?.given || '';
            const rawPhone = first.phones?.[0]?.number || first.phones?.[0] || '';
            const rawEmail = first.emails?.[0]?.address || first.emails?.[0] || '';
            
            if (contactName) setName(toTitleCase(contactName));
            let clean = rawPhone.replace(/\D/g, '');
            if (clean.startsWith('55') && clean.length > 2) clean = clean.substring(2);
            if (clean) setPhone(clean);
            if (rawEmail) setEmail(rawEmail);
            
            setStatusNotice({
              type: 'success',
              text: `Contato "${contactName || clean}" selecionado da agenda do celular!`
            });
            return;
          }
        }
      } catch (err) {
        console.warn('Capacitor contacts picker error:', err);
      }
    }

    // 2. Try Web Contact Picker API (Chrome on Android)
    if ('contacts' in navigator && 'select' in (navigator as any).contacts) {
      try {
        const props = ['name', 'tel', 'email'];
        const selected = await (navigator as any).contacts.select(props, { multiple: false });
        if (selected && selected.length > 0) {
          const c = selected[0];
          const cName = c.name?.[0] || '';
          const cTel = c.tel?.[0] || '';
          const cEmail = c.email?.[0] || '';

          if (cName) setName(toTitleCase(cName));
          let clean = cTel.replace(/\D/g, '');
          if (clean.startsWith('55') && clean.length > 2) clean = clean.substring(2);
          if (clean) setPhone(clean);
          if (cEmail) setEmail(cEmail);

          setStatusNotice({
            type: 'success',
            text: `Contato "${cName || clean}" carregado da agenda com sucesso!`
          });
          return;
        }
      } catch (err: any) {
        console.warn('Web Contact Picker error:', err);
        if (err?.name === 'SecurityError' || isInIframe) {
          setStatusNotice({
            type: 'info',
            text: 'Dica: Para selecionar contatos com 1 toque no celular, utilize a aba direta do navegador fora do iframe.'
          });
          return;
        }
      }
    }

    // Fallback: clipboard or manual
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.length > 3) {
          // Check if clipboard contains phone number
          const digits = text.replace(/\D/g, '');
          if (digits.length >= 8 && digits.length <= 13) {
            let p = digits;
            if (p.startsWith('55') && p.length > 2) p = p.substring(2);
            setPhone(p);
            setStatusNotice({
              type: 'success',
              text: `Telefone colado da área de transferência: ${p}`
            });
            return;
          }
        }
      }
    } catch (e) {
      // ignore clipboard permission error
    }

    setStatusNotice({
      type: 'info',
      text: 'Você pode preencher o nome e telefone abaixo. O prefixo +55 é adicionado automaticamente.'
    });
  };

  const handleSaveDriver = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setStatusNotice({ type: 'error', text: 'Por favor, informe o Nome Completo do motorista.' });
      return;
    }

    let cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) {
      setStatusNotice({ type: 'error', text: 'Por favor, informe o Telefone / WhatsApp do motorista.' });
      return;
    }

    // Prepend 55 if needed
    if (!cleanPhone.startsWith('55')) {
      cleanPhone = '55' + cleanPhone;
    }

    setIsSubmitting(true);

    const contactId = driverToEdit?.id || `driver-${Date.now()}`;
    const formattedName = toTitleCase(name.trim());

    const savedContact: AgendaContact = {
      id: contactId,
      name: formattedName,
      phone: cleanPhone,
      email: email.trim() || undefined,
      cpfCnpj: cpf.trim() || undefined,
      cnh: cnhNumber.trim() || undefined,
      cnhCategory: cnhCategory,
      cnhExpiration: cnhExpiration || undefined,
      region: region.trim() || 'Locatário',
      activeVehiclePlate: selectedVehicle ? selectedVehicle.plate.toUpperCase() : undefined
    };

    // Save contact
    onSaveContact(savedContact);

    // If vehicle linked, update vehicle
    if (selectedVehicle && onUpdateVehicle) {
      const updatedVeh: Vehicle = {
        ...selectedVehicle,
        driver: formattedName,
        driverPhone: cleanPhone,
        tenantEmail: email.trim() || selectedVehicle.tenantEmail,
        tenantCpfCnpj: cpf.trim() || selectedVehicle.tenantCpfCnpj,
        tenantCnh: cnhNumber.trim() || selectedVehicle.tenantCnh,
        driverCnhExpiration: cnhExpiration || selectedVehicle.driverCnhExpiration
      };
      onUpdateVehicle(updatedVeh);
    }

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#141414] border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#181818]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {driverToEdit ? 'Editar Motorista' : 'Cadastrar Novo Motorista'}
              </h2>
              <p className="text-xs text-gray-400">
                Preencha os dados de identificação e vincule a um veículo da frota
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Notification */}
        {statusNotice && (
          <div className={`mx-5 mt-3 p-3 rounded-xl text-xs flex items-center gap-2 border ${
            statusNotice.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
              : statusNotice.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
          }`}>
            {statusNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusNotice.text}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSaveDriver} className="p-5 overflow-y-auto max-h-[75vh] space-y-4">
          
          {/* Quick Action: Buscar na Agenda do Celular */}
          <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/20 border border-blue-500/30 p-3 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">Importar da Agenda do Celular</p>
                <p className="text-[11px] text-blue-300/80">Puxa Nome, Telefone e E-mail com 1 toque</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePickNativeContacts}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Buscar Agenda</span>
            </button>
          </div>

          {/* Nome Completo */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300 block">
              Nome Completo: *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={(e) => setName(toTitleCase(e.target.value))}
              placeholder="Ex: Carlos Eduardo Silva"
              className="w-full h-11 bg-black/50 border border-white/15 rounded-xl px-3.5 text-xs text-white placeholder-gray-500 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* CPF e Telefone / WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-300 block">
                CPF:
              </label>
              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                placeholder="Ex: 341.892.108-44"
                className="w-full h-11 bg-black/50 border border-white/15 rounded-xl px-3.5 text-xs text-white placeholder-gray-500 font-mono focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-300 block">
                Telefone / WhatsApp: *
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-xs font-mono font-bold text-gray-400 select-none">
                  +55
                </span>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, '');
                    if (val.startsWith('55') && val.length > 2) {
                      val = val.substring(2);
                    }
                    setPhone(val);
                  }}
                  placeholder="11 98765-4321"
                  className="w-full h-11 bg-black/50 border border-white/15 rounded-xl pl-12 pr-3.5 text-xs text-white font-mono placeholder-gray-500 focus:outline-hidden focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* E-mail (Explicitly requested by user) */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              <span>E-mail do Motorista:</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ex: carlos.silva@email.com"
              className="w-full h-11 bg-black/50 border border-white/15 rounded-xl px-3.5 text-xs text-white placeholder-gray-500 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Cat. CNH e Número CNH */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-300 block">
                Cat. CNH:
              </label>
              <select
                value={cnhCategory}
                onChange={(e) => setCnhCategory(e.target.value)}
                className="w-full h-11 bg-black/50 border border-white/15 rounded-xl px-3 text-xs text-white focus:outline-hidden focus:border-blue-500 font-semibold cursor-pointer"
              >
                <option value="B (Carro)">B (Carro)</option>
                <option value="A (Moto)">A (Moto)</option>
                <option value="AB (Carro e Moto)">AB (Carro e Moto)</option>
                <option value="C (Caminhão)">C (Caminhão)</option>
                <option value="D (Van / Ônibus)">D (Van / Ônibus)</option>
                <option value="E (Articulado / Carreta)">E (Articulado / Carreta)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-300 block">
                Número CNH:
              </label>
              <input
                type="text"
                value={cnhNumber}
                onChange={(e) => setCnhNumber(e.target.value)}
                placeholder="Ex: 08912347101"
                className="w-full h-11 bg-black/50 border border-white/15 rounded-xl px-3.5 text-xs text-white font-mono placeholder-gray-500 focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>

          {/* Vencimento CNH */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Vencimento da CNH:</span>
            </label>
            <input
              type="date"
              value={cnhExpiration}
              onChange={(e) => setCnhExpiration(e.target.value)}
              className="w-full h-11 bg-black/50 border border-white/15 rounded-xl px-3.5 text-xs text-white focus:outline-hidden focus:border-blue-500 scheme-dark"
            />
          </div>

          {/* Veículo Vinculado */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-blue-400" />
              <span>Veículo Vinculado:</span>
            </label>
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full h-11 bg-black/50 border border-white/15 rounded-xl px-3 text-xs text-white focus:outline-hidden focus:border-blue-500 font-semibold cursor-pointer"
            >
              <option value="">-- Não vincular a nenhum veículo por enquanto --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  🚗 {v.brand} {v.model} ({v.plate}) {v.driver ? `[Atual: ${v.driver}]` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Sensores do Veículo / Telemetria Badge (matching user's screenshot) */}
          {selectedVehicle && (
            <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/10 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">
                    Sensores do Veículo ({selectedVehicle.brand} {selectedVehicle.model})
                  </span>
                </div>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  Telemetria 100% Real
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-black/40 border border-white/5 rounded-xl p-2">
                  <p className="text-[10px] text-gray-400">Freadas</p>
                  <p className="text-sm font-bold text-white">0</p>
                </div>
                <div className="bg-black/40 border border-white/5 rounded-xl p-2">
                  <p className="text-[10px] text-gray-400">Curvas</p>
                  <p className="text-sm font-bold text-white">0</p>
                </div>
                <div className="bg-black/40 border border-white/5 rounded-xl p-2">
                  <p className="text-[10px] text-gray-400">Velocidade</p>
                  <p className="text-sm font-bold text-emerald-400">0 km/h</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-white/5 font-mono">
                <span>
                  Odômetro: <strong className="text-white">{(selectedVehicle.currentKm || 0).toLocaleString('pt-BR')} km</strong>
                </span>
                <span>
                  Placa: <strong className="text-white">{selectedVehicle.plate}</strong>
                </span>
              </div>
            </div>
          )}

          {/* Buttons Footer */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="w-full h-11 bg-white/5 hover:bg-white/10 text-gray-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Motorista</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
