import React, { useState, useEffect } from 'react';
import { AgendaContact, Vehicle } from '../types';
import { X, Plus, Trash2, Search, MapPin, Phone, User, Save, Edit2, MessageCircle, Send, Car } from 'lucide-react';

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

interface AgendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: AgendaContact[];
  vehicles: Vehicle[];
  onSaveContact: (contact: AgendaContact) => void;
  onDeleteContact: (id: string) => void;
  preFill?: { name: string; phone: string } | null;
}

export const AgendaModal: React.FC<AgendaModalProps> = ({
  isOpen,
  onClose,
  contacts,
  vehicles,
  onSaveContact,
  onDeleteContact,
  preFill,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (preFill) {
        setIsAdding(true);
        setEditingId(null);
        setName(toTitleCase(preFill.name || ''));
        let p = preFill.phone || '';
        if (p.startsWith('55')) {
          p = p.substring(2);
        }
        setPhone(p);
        setRegion('Locatário');
      } else {
        setIsAdding(false);
        setEditingId(null);
        setName('');
        setPhone('');
        setRegion('');
      }
    }
  }, [isOpen, preFill]);

  // Quick WhatsApp Message States
  const [activeMessageContactId, setActiveMessageContactId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('disponivel');

  const templates = [
    { id: 'disponivel', label: 'Entrega de Veículo 🔑' },
    { id: 'locacao', label: 'Disponível p/ Locação 🚗' },
    { id: 'pagamento', label: 'Lembrete de Pagamento 💰' },
    { id: 'revisao', label: 'Aviso de Revisão 🔧' },
    { id: 'boasvindas', label: 'Boas-vindas 👋' }
  ];

  const getVehicleText = (veh: Vehicle | undefined, templateKey: string) => {
    if (!veh) return 'veículo contratado';
    if (templateKey === 'disponivel' || templateKey === 'locacao') {
      return `${veh.brand} ${veh.model}`;
    }
    return `${veh.brand} ${veh.model} (Placa: ${veh.plate})`;
  };

  const getMessageText = (templateKey: string, contactName: string, vehicleText: string) => {
    const firstName = contactName.trim().split(' ')[0] || '';
    switch (templateKey) {
      case 'disponivel':
        return `Olá *${firstName}*! Gostaríamos de informar que o seu veículo *${vehicleText}* já está disponível e pronto para retirada. Podemos combinar o horário da entrega?`;
      case 'locacao':
        return `Olá *${firstName}*! Temos o veículo *${vehicleText}* disponível para locação imediata. Caso tenha interesse, entre em contato para reservar o quanto antes!`;
      case 'pagamento':
        return `Olá *${firstName}*! Passando para lembrar que o pagamento semanal do veículo *${vehicleText}* está próximo do vencimento. Agradecemos se puder enviar o comprovante assim que realizar o Pix. Obrigado!`;
      case 'revisao':
        return `Olá *${firstName}*! Está na hora de realizar a revisão preventiva periódica do veículo *${vehicleText}*. Por favor, nos informe o melhor horário para agendar o check-up nesta semana.`;
      case 'boasvindas':
        return `Olá *${firstName}*! Seja muito bem-vindo(a)! O seu veículo *${vehicleText}* está pronto e revisado. Desejamos uma excelente experiência. Qualquer dúvida ou suporte, conte conosco!`;
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setName('');
    setPhone('');
    setRegion('');
    setActiveMessageContactId(null);
  };

  const handleStartEdit = (contact: AgendaContact) => {
    setIsAdding(true);
    setEditingId(contact.id);
    setName(contact.name);
    let rawPhone = contact.phone;
    if (rawPhone.startsWith('55')) {
      rawPhone = rawPhone.substring(2);
    }
    setPhone(rawPhone);
    setRegion(contact.region);
    setActiveMessageContactId(null);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !region.trim()) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    // Clean phone number
    let cleanPhone = phone.replace(/\D/g, '');
    // Ensure we prepend '55' (Brazil code) if not already present
    if (cleanPhone.length > 0 && !cleanPhone.startsWith('55')) {
      cleanPhone = '55' + cleanPhone;
    }

    onSaveContact({
      id: editingId || `contact-${Date.now()}`,
      name: toTitleCase(name.trim()),
      phone: cleanPhone,
      region: toTitleCase(region.trim()),
    });

    setIsAdding(false);
    setEditingId(null);
    setName('');
    setPhone('');
    setRegion('');
  };

  // Prepares the template message when contact or vehicle changes
  const handleInitiateMessage = (contact: AgendaContact) => {
    if (activeMessageContactId === contact.id) {
      // Toggle off
      setActiveMessageContactId(null);
      setSelectedVehicleId('');
      setCustomMessage('');
      return;
    }

    setActiveMessageContactId(contact.id);
    setIsAdding(false); // Close add form if open
    
    // Choose the first vehicle by default if available
    const defaultVehicleId = vehicles.length > 0 ? vehicles[0].id : '';
    setSelectedVehicleId(defaultVehicleId);
    setSelectedTemplate('disponivel');

    const veh = vehicles.find(v => v.id === defaultVehicleId);
    const vehicleText = getVehicleText(veh, 'disponivel');

    const defaultMsg = getMessageText('disponivel', contact.name, vehicleText);
    setCustomMessage(defaultMsg);
  };

  // Re-generate message template when selected vehicle changes
  const handleVehicleChange = (vehicleId: string, contact: AgendaContact, templateKey: string = selectedTemplate) => {
    setSelectedVehicleId(vehicleId);
    const veh = vehicles.find(v => v.id === vehicleId);
    const vehicleText = getVehicleText(veh, templateKey);
    
    const newMsg = getMessageText(templateKey, contact.name, vehicleText);
    setCustomMessage(newMsg);
  };

  // Re-generate message template when selected template changes
  const handleTemplateChange = (templateKey: string, contact: AgendaContact) => {
    setSelectedTemplate(templateKey);
    const veh = vehicles.find(v => v.id === selectedVehicleId);
    const vehicleText = getVehicleText(veh, templateKey);
    
    const newMsg = getMessageText(templateKey, contact.name, vehicleText);
    setCustomMessage(newMsg);
  };

  const handleSendMessage = (contact: AgendaContact) => {
    const cleanPhone = contact.phone.replace(/\D/g, '');
    const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(customMessage)}`;
    
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

    // Close message panel
    setActiveMessageContactId(null);
    setSelectedVehicleId('');
    setCustomMessage('');
  };

  const filteredContacts = contacts
    .filter((contact) => {
      const s = searchTerm.toLowerCase();
      return (
        contact.name.toLowerCase().includes(s) ||
        contact.region.toLowerCase().includes(s) ||
        contact.phone.includes(s)
      );
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] shadow-2xl animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#141414]">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Agenda de Locatários</h2>
              <p className="text-[10px] text-gray-400">Salve contatos rápidos e envie avisos de veículos disponíveis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form to Add/Edit Contact */}
        {isAdding && (
          <form onSubmit={handleSubmit} className="p-4 bg-[#141414] border-b border-white/10 space-y-3 animate-in slide-in-from-top duration-150">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              {editingId ? 'Editar Contato' : 'Adicionar Novo Contato'}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-gray-400 font-semibold flex items-center gap-1">
                  <User className="w-3 h-3" /> Nome Completo *
                </label>
                <input
                  type="text"
                  placeholder="Nome do locatário"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={(e) => setName(toTitleCase(e.target.value))}
                  className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500/50"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 font-semibold flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Telefone (WhatsApp) *
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 font-mono text-xs text-gray-500 select-none font-semibold">
                    +55
                  </span>
                  <input
                    type="text"
                    placeholder="Ex: 11999991234"
                    value={phone}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '');
                      // Strip 55 if they type or paste it at the beginning
                      if (val.startsWith('55') && val.length > 2) {
                        val = val.substring(2);
                      }
                      setPhone(val);
                    }}
                    className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl pl-11 pr-3 py-2 text-white font-mono focus:outline-hidden focus:border-emerald-500/50 text-xs"
                    required
                  />
                </div>
                <p className="text-[9px] text-gray-500 mt-0.5">Digite apenas o DDD e o Número (o +55 é automático)</p>
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 font-semibold flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Região/Cidade *
                </label>
                <input
                  type="text"
                  placeholder="Ex: São Paulo - SP"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  onBlur={(e) => setRegion(toTitleCase(e.target.value))}
                  className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500/50"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar</span>
              </button>
            </div>
          </form>
        )}

        {/* Search bar and List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {!isAdding && (
            <div className="flex justify-between items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nome, região ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#141414] border border-white/5 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500/50 placeholder-gray-500"
                />
              </div>
              <button
                onClick={handleStartAdd}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Adicionar</span>
              </button>
            </div>
          )}

          {filteredContacts.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-xs">
              Nenhum contato cadastrado ou correspondente à busca.
            </div>
          ) : (
            <div className="space-y-2 max-h-[380px] overflow-y-auto">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex flex-col hover:bg-white/[0.03] transition-colors gap-3"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="space-y-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{toTitleCase(contact.name)}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-gray-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-400 animate-pulse" />
                          {contact.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-400" />
                          {toTitleCase(contact.region)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-1.5 shrink-0">
                      {/* WhatsApp Quick Message Link Button */}
                      <button
                        onClick={() => handleInitiateMessage(contact)}
                        className={`p-1.5 border rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold ${
                          activeMessageContactId === contact.id
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-[#141414] hover:bg-emerald-600/10 text-emerald-400 hover:text-emerald-300 border-white/5 hover:border-emerald-500/20'
                        }`}
                        title="Notificar Veículo Disponível"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Avisar Carro</span>
                      </button>
                      
                      <button
                        onClick={() => handleStartEdit(contact)}
                        className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-colors"
                        title="Editar Contato"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      
                      <button
                        onClick={() => onDeleteContact(contact.id)}
                        className="p-1.5 text-gray-500 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 border border-white/5 rounded-lg transition-colors"
                        title="Excluir Contato"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Pre-made Message Editor Section */}
                  {activeMessageContactId === contact.id && (
                    <div className="bg-emerald-950/20 border border-emerald-500/15 rounded-xl p-3 space-y-3 mt-1 text-xs animate-in slide-in-from-top-2 duration-150">
                      <div className="flex justify-between items-center text-[10px] font-bold text-emerald-400 uppercase tracking-wider border-b border-emerald-500/10 pb-1.5">
                        <span className="flex items-center gap-1.5"><Car className="w-3.5 h-3.5" /> Envio Rápido: Mensagens Prontas</span>
                        <span>Previsão de Envio</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Select Template Message */}
                        <div className="space-y-1">
                          <label className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider block">Modelo de Mensagem</label>
                          <select
                            value={selectedTemplate}
                            onChange={(e) => handleTemplateChange(e.target.value, contact)}
                            className="w-full bg-[#111] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-emerald-500/50 cursor-pointer font-medium text-xs"
                          >
                            {templates.map(t => (
                              <option key={t.id} value={t.id}>{t.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Select Vehicle to inject into the template */}
                        {vehicles.length > 0 && (
                          <div className="space-y-1">
                            <label className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider block">Veículo do Cliente</label>
                            <select
                              value={selectedVehicleId}
                              onChange={(e) => handleVehicleChange(e.target.value, contact)}
                              className="w-full bg-[#111] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-emerald-500/50 cursor-pointer font-mono"
                            >
                              {vehicles.map(v => (
                                <option key={v.id} value={v.id}>{v.brand} {v.model} - Placa {v.plate}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Message Editing Box */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider block font-bold">Mensagem Final (Pode editar livremente)</label>
                        <textarea
                          value={customMessage}
                          onChange={(e) => setCustomMessage(e.target.value ? e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) : '')}
                          placeholder="Escreva sua mensagem aqui..."
                          className="w-full text-xs bg-black border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-hidden focus:border-emerald-500/50 h-24 resize-none leading-relaxed font-sans"
                        />
                      </div>

                      <div className="flex justify-end gap-1.5 pt-1">
                        <button
                          onClick={() => {
                            setActiveMessageContactId(null);
                            setSelectedVehicleId('');
                            setCustomMessage('');
                          }}
                          className="px-2.5 py-1.5 text-gray-400 hover:text-white"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleSendMessage(contact)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-500/10"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Enviar WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#111111] border-t border-white/5 text-[10px] text-gray-500 flex justify-between items-center px-4">
          <span>{filteredContacts.length} contatos na agenda</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white font-semibold"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
