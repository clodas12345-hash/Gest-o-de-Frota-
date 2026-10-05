import React, { useState } from 'react';
import { Vehicle, Fine } from '../types';
import { 
  X, 
  AlertOctagon, 
  Plus, 
  Trash2, 
  DollarSign, 
  Send, 
  FileText, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Camera, 
  ExternalLink,
  Calendar,
  AlertTriangle
} from 'lucide-react';

interface FinesManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle;
  onUpdateVehicle: (updatedVehicle: Vehicle) => void;
}

export const FinesManagementModal: React.FC<FinesManagementModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  onUpdateVehicle
}) => {
  const [fines, setFines] = useState<Fine[]>(() => vehicle.fines || []);
  const [showAddForm, setShowAddForm] = useState(false);

  // New fine form states
  const [autoInfracao, setAutoInfracao] = useState('');
  const [orgaoEmissor, setOrgaoEmissor] = useState('DETRAN');
  const [dataHora, setDataHora] = useState(new Date().toISOString().split('T')[0]);
  const [local, setLocal] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState<number | ''>('');
  const [pontos, setPontos] = useState<number>(4);
  const [gravidade, setGravidade] = useState<'Leve' | 'Média' | 'Grave' | 'Gravíssima'>('Média');
  const [driverName, setDriverName] = useState(vehicle.driver || '');
  const [driverPhone, setDriverPhone] = useState(vehicle.driverPhone || '');
  const [notificationUrl, setNotificationUrl] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [notificationDate, setNotificationDate] = useState(new Date().toISOString().split('T')[0]);
  const [reminderEnabled, setReminderEnabled] = useState(true);

  if (!isOpen) return null;

  const totalFinesValue = fines.reduce((acc, f) => acc + (f.valor || 0), 0);
  const pendingFinesValue = fines
    .filter(f => f.status === 'Pendente' || f.status === 'Repassada ao Motorista')
    .reduce((acc, f) => acc + (f.valor || 0), 0);
  const totalPoints = fines.reduce((acc, f) => acc + (f.pontos || 0), 0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setNotificationUrl(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveFine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao || !valor) {
      alert('Preencha a descrição e o valor da multa.');
      return;
    }

    const newFine: Fine = {
      id: Date.now().toString(),
      vehicleId: vehicle.id,
      autoInfracao: autoInfracao.trim() || undefined,
      orgaoEmissor: orgaoEmissor.trim() || 'DETRAN',
      dataHora,
      local: local.trim() || undefined,
      descricao: descricao.trim(),
      valor: Number(valor),
      pontos,
      gravidade,
      status: 'Pendente',
      driverName: driverName.trim() || vehicle.driver || 'Não atribuído',
      driverPhone: driverPhone.trim() || vehicle.driverPhone || '',
      notificationUrl: notificationUrl || undefined,
      dueDate: dueDate || undefined,
      notificationDate: notificationDate || undefined,
      reminderEnabled: reminderEnabled
    };

    const updated = [newFine, ...fines];
    setFines(updated);
    onUpdateVehicle({
      ...vehicle,
      fines: updated
    });

    // Reset Form
    setAutoInfracao('');
    setDescricao('');
    setValor('');
    setLocal('');
    setNotificationUrl(null);
    setDueDate('');
    setNotificationDate(new Date().toISOString().split('T')[0]);
    setReminderEnabled(true);
    setShowAddForm(false);
  };

  const handleUpdateFineStatus = (fineId: string, newStatus: Fine['status']) => {
    const updated = fines.map(f => f.id === fineId ? { ...f, status: newStatus } : f);
    setFines(updated);
    onUpdateVehicle({
      ...vehicle,
      fines: updated
    });
  };

  const handleDeleteFine = (fineId: string) => {
    if (confirm('Deseja realmente remover este registro de multa?')) {
      const updated = fines.filter(f => f.id !== fineId);
      setFines(updated);
      onUpdateVehicle({
        ...vehicle,
        fines: updated
      });
    }
  };

  const handleSendWhatsAppFineCharge = (fine: Fine) => {
    const phone = (fine.driverPhone || vehicle.driverPhone || '').replace(/\D/g, '');
    if (!phone) {
      alert('Telefone do motorista não encontrado.');
      return;
    }

    const cleanPhone = phone.startsWith('55') ? phone : '55' + phone;
    const msg = `🚨 *NOTIFICAÇÃO DE INFRAÇÃO DE TRÂNSITO* 🚨

Olá, *${fine.driverName || 'Motorista'}*!

Identificamos o registro de uma infração de trânsito vinculada ao veículo *${vehicle.brand} ${vehicle.model}* (Placa: *${vehicle.plate}*):

📋 *Auto de Infração:* ${fine.autoInfracao || 'Não informado'}
🏛️ *Órgão Emissor:* ${fine.orgaoEmissor || 'DETRAN'}
📅 *Data:* ${fine.dataHora}
📍 *Local:* ${fine.local || 'Não informado'}
⚠️ *Infração:* ${fine.descricao} (${fine.gravidade || 'Média'} - ${fine.pontos || 4} pontos)
💵 *Valor a Pagar:* R$ ${(fine.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
${fine.dueDate ? `🗓️ *Vencimento do boleto:* ${fine.dueDate}` : ''}

Por favor, providencie o pagamento ou o envio do comprovante para regularização.
Dúvidas, estamos à disposição! 👍`;

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');

    // Mark as repassada
    if (fine.status === 'Pendente') {
      handleUpdateFineStatus(fine.id, 'Repassada ao Motorista');
    }
  };

  const getReminderStatus = (fine: Fine) => {
    if (!fine.notificationDate) return null;
    const notif = new Date(fine.notificationDate + 'T12:00:00');
    const deadline = new Date(notif);
    deadline.setDate(deadline.getDate() + 15);
    
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const isPaga = fine.status === 'Paga pelo Locatário' || fine.status === 'Paga pela Locadora';
    
    return {
      diffDays,
      deadlineStr: deadline.toLocaleDateString('pt-BR'),
      isPaga,
      isOverdue: diffDays < 0,
    };
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[110] p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#121214] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-[#18181b]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Central de Multas & Infrações
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {vehicle.plate}
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                {vehicle.brand} {vehicle.model} • Gestão de notificações, repasse e cobrança automática
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(true)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-rose-900/30"
            >
              <Plus className="w-4 h-4" />
              <span>Lançar Multa</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-black/40 border-b border-white/10">
          <div className="p-3 bg-[#16161a] rounded-xl border border-white/5">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Total de Multas</span>
            <span className="text-lg font-mono font-bold text-white">{fines.length} infrações</span>
          </div>
          <div className="p-3 bg-[#16161a] rounded-xl border border-rose-500/20">
            <span className="text-[10px] uppercase font-bold text-rose-400 block">Valor Pendente de Cobrança</span>
            <span className="text-lg font-mono font-bold text-rose-400">
              R$ {pendingFinesValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="p-3 bg-[#16161a] rounded-xl border border-amber-500/20">
            <span className="text-[10px] uppercase font-bold text-amber-400 block">Pontos Totais Registrados</span>
            <span className="text-lg font-mono font-bold text-amber-400">{totalPoints} Pontos</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
          
          {/* Add Fine Form */}
          {showAddForm && (
            <form onSubmit={handleSaveFine} className="p-4 bg-black/60 border border-rose-500/30 rounded-2xl space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  Cadastrar Nova Notificação de Infração
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Cancelar
                </button>
              </div>

              {/* Cláusula 10ª Legal Notice */}
              <div className="bg-rose-950/20 border border-rose-500/20 rounded-xl p-3 text-[11px] text-gray-300 leading-relaxed space-y-1">
                <span className="font-bold text-rose-400 block">📜 Cláusula 10ª do Contrato de Locação (Trânsito):</span>
                <p>
                  O locatário tem o prazo de até <strong>15 dias corridos</strong> a contar da notificação para efetuar o pagamento. A responsabilidade pelas infrações de trânsito continua sendo estritamente do locatário, mesmo após a devolução da caução.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Auto de Infração</label>
                  <input
                    type="text"
                    value={autoInfracao}
                    onChange={(e) => setAutoInfracao(e.target.value)}
                    placeholder="Ex: R123456789"
                    className="w-full text-xs bg-black border border-white/10 rounded-xl p-2.5 text-white font-mono focus:outline-hidden focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Órgão Emissor</label>
                  <select
                    value={orgaoEmissor}
                    onChange={(e) => setOrgaoEmissor(e.target.value)}
                    className="w-full text-xs bg-black border border-white/10 rounded-xl p-2.5 text-white font-medium focus:outline-hidden focus:border-rose-500 cursor-pointer"
                  >
                    <option value="DETRAN">DETRAN</option>
                    <option value="PRF">PRF (Polícia Rodoviária)</option>
                    <option value="DSV / CET">DSV / CET (Municipal)</option>
                    <option value="DER">DER (Estadual)</option>
                    <option value="DNIT">DNIT</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Data / Hora *</label>
                  <input
                    type="date"
                    value={dataHora}
                    onChange={(e) => setDataHora(e.target.value)}
                    className="w-full text-xs bg-black border border-white/10 rounded-xl p-2.5 text-white font-medium focus:outline-hidden focus:border-rose-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Descrição / Enquadramento *</label>
                  <input
                    type="text"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Ex: Transitar em velocidade superior à máxima em até 20%"
                    className="w-full text-xs bg-black border border-white/10 rounded-xl p-2.5 text-white font-medium focus:outline-hidden focus:border-rose-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Local da Infração</label>
                  <input
                    type="text"
                    value={local}
                    onChange={(e) => setLocal(e.target.value)}
                    placeholder="Ex: Av. Brasil, km 15 - Sentido Centro"
                    className="w-full text-xs bg-black border border-white/10 rounded-xl p-2.5 text-white font-medium focus:outline-hidden focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Valor da Multa (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={valor}
                    onChange={(e) => setValor(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="130.16"
                    className="w-full text-xs bg-black border border-white/10 rounded-xl p-2.5 text-white font-mono font-bold focus:outline-hidden focus:border-rose-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Gravidade</label>
                  <select
                    value={gravidade}
                    onChange={(e) => {
                      const g = e.target.value as any;
                      setGravidade(g);
                      if (g === 'Leve') setPontos(3);
                      else if (g === 'Média') setPontos(4);
                      else if (g === 'Grave') setPontos(5);
                      else if (g === 'Gravíssima') setPontos(7);
                    }}
                    className="w-full text-xs bg-black border border-white/10 rounded-xl p-2.5 text-white font-medium focus:outline-hidden focus:border-rose-500 cursor-pointer"
                  >
                    <option value="Leve">Leve (3 pts)</option>
                    <option value="Média">Média (4 pts)</option>
                    <option value="Grave">Grave (5 pts)</option>
                    <option value="Gravíssima">Gravíssima (7 pts)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Vencimento do Boleto</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full text-xs bg-black border border-white/10 rounded-xl p-2.5 text-white font-medium focus:outline-hidden focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Motorista Responsável</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full text-xs bg-black border border-white/10 rounded-xl p-2.5 text-white font-medium focus:outline-hidden focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Cláusula 10ª & Lembrete Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl">
                <div>
                  <label className="text-[10px] font-bold text-rose-300 uppercase block mb-1">
                    Data de Recebimento da Notificação *
                  </label>
                  <input
                    type="date"
                    value={notificationDate}
                    onChange={(e) => setNotificationDate(e.target.value)}
                    className="w-full text-xs bg-black border border-rose-500/20 rounded-xl p-2.5 text-white font-medium focus:outline-hidden focus:border-rose-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-rose-300 uppercase block mb-1">
                    Prazo Cláusula 10ª (15 dias corridos)
                  </label>
                  <div className="w-full text-xs bg-black/40 border border-white/5 rounded-xl p-2.5 text-rose-300 font-mono font-bold flex items-center h-[38px]">
                    {(() => {
                      if (!notificationDate) return 'Selecione a data';
                      const date = new Date(notificationDate + 'T12:00:00');
                      date.setDate(date.getDate() + 15);
                      const d = String(date.getDate()).padStart(2, '0');
                      const m = String(date.getMonth() + 1).padStart(2, '0');
                      const y = date.getFullYear();
                      return `${d}/${m}/${y}`;
                    })()}
                  </div>
                </div>
                <div className="flex items-center pt-5 pl-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-300">
                    <input
                      type="checkbox"
                      checked={reminderEnabled}
                      onChange={(e) => setReminderEnabled(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500 bg-black cursor-pointer"
                    />
                    <span>Ativar Lembrete de Cobrança (Painel)</span>
                  </label>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Anexo da Notificação (Foto ou PDF)</label>
                <div className="flex items-center gap-3">
                  <label className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-gray-300 flex items-center gap-2 cursor-pointer transition-colors">
                    <Camera className="w-4 h-4 text-rose-400" />
                    <span>{notificationUrl ? 'Alterar Notificação Anexada' : 'Anexar Notificação / Auto'}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {notificationUrl && (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Arquivo Anexado
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-rose-900/30"
                >
                  <Plus className="w-4 h-4" /> Salvar Multa
                </button>
              </div>
            </form>
          )}

          {/* Fines List */}
          {fines.length === 0 ? (
            <div className="p-8 text-center space-y-3 bg-[#16161a] rounded-2xl border border-white/5">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">Nenhuma Multa Registrada</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Este veículo não possui notificações ou infrações pendentes. Para lançar uma nova multa recebida, clique no botão "Lançar Multa".
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {fines.map((fine) => (
                <div 
                  key={fine.id}
                  className="p-4 bg-[#16161a] border border-white/10 rounded-2xl space-y-3 hover:border-white/20 transition-all shadow-lg"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {fine.orgaoEmissor || 'DETRAN'}
                      </span>
                      {fine.autoInfracao && (
                        <span className="text-xs font-mono font-bold text-gray-300">
                          Auto: {fine.autoInfracao}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-500">
                        • {fine.dataHora}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={fine.status}
                        onChange={(e) => handleUpdateFineStatus(fine.id, e.target.value as any)}
                        className={`text-[10px] font-bold rounded-lg px-2.5 py-1 border focus:outline-hidden cursor-pointer ${
                          fine.status === 'Paga pelo Locatário' || fine.status === 'Paga pela Locadora'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : fine.status === 'Repassada ao Motorista'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        <option value="Pendente">Pendente</option>
                        <option value="Repassada ao Motorista">Repassada ao Motorista</option>
                        <option value="Paga pelo Locatário">Paga pelo Locatário</option>
                        <option value="Paga pela Locadora">Paga pela Locadora</option>
                      </select>

                      <button
                        onClick={() => handleDeleteFine(fine.id)}
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Excluir multa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                    <div className="sm:col-span-8 space-y-1">
                      <p className="font-bold text-white">{fine.descricao}</p>
                      {fine.local && <p className="text-[10px] text-gray-400">📍 {fine.local}</p>}
                      <p className="text-[10px] text-gray-400">
                        Motorista Responsável: <strong className="text-gray-200">{fine.driverName || vehicle.driver || 'Não informado'}</strong>
                        {fine.dueDate && ` • Vencimento: ${fine.dueDate}`}
                      </p>
                    </div>

                    <div className="sm:col-span-4 flex flex-col sm:items-end justify-center space-y-1">
                      <span className="text-base font-mono font-bold text-rose-400">
                        R$ {(fine.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] font-bold text-amber-400">
                        {fine.gravidade || 'Média'} ({fine.pontos || 4} pts na CNH)
                      </span>
                    </div>
                  </div>

                  {/* Cláusula 10ª Status / Lembrete */}
                  {(() => {
                    const status = getReminderStatus(fine);
                    if (!status) return null;
                    const { diffDays, deadlineStr, isPaga, isOverdue } = status;
                    if (isPaga) {
                      return (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl text-[10px] text-emerald-400 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Cláusula 10ª resolvida! Boleto quitado.</span>
                        </div>
                      );
                    }
                    if (isOverdue) {
                      return (
                        <div className="bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl text-[10px] text-rose-400 font-bold flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-bounce" />
                          <span>🚨 Cláusula 10ª: Prazo de cobrança de 15 dias EXCEDIDO! (Venceu em: {deadlineStr})</span>
                        </div>
                      );
                    }
                    return (
                      <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl text-[10px] text-amber-300 font-semibold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                        <span>⏱️ Cláusula 10ª: Restam <strong className="text-amber-300 underline font-extrabold">{diffDays} dias</strong> para cobrar o locatário (Prazo Limite: {deadlineStr})</span>
                      </div>
                    );
                  })()}

                  {/* Actions & Attachment */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
                    {fine.notificationUrl ? (
                      <button
                        onClick={() => {
                          const w = window.open();
                          w?.document.write(`<img src="${fine.notificationUrl}" style="max-width:100%"/>`);
                        }}
                        className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" /> Ver Notificação Anexada
                      </button>
                    ) : (
                      <span className="text-[10px] text-gray-500 italic">Sem notificação anexada</span>
                    )}

                    <button
                      onClick={() => handleSendWhatsAppFineCharge(fine)}
                      className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Cobrar via WhatsApp</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
