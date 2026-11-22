import React, { useState, useEffect } from 'react';
import { Vehicle, Fine, getFineAdminFee, getFineTotal } from '../types';
import { CurrencyInput } from './CurrencyInput';
import { 
  X, 
  AlertOctagon, 
  Plus, 
  Trash2, 
  Send, 
  FileText, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Camera, 
  Calendar,
  AlertTriangle,
  Percent
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
  const [dataHora, setDataHora] = useState(new Date().toISOString().split('T')[0]);
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState<number | ''>('');
  const [pontos, setPontos] = useState<number>(4);
  const [gravidade, setGravidade] = useState<'Leve' | 'Média' | 'Grave' | 'Gravíssima'>('Média');
  const [driverName, setDriverName] = useState(vehicle.driver || '');
  const [driverPhone, setDriverPhone] = useState(vehicle.driverPhone || '');
  const [notificationUrl, setNotificationUrl] = useState<string | null>(null);
  const [notificationDate, setNotificationDate] = useState(new Date().toISOString().split('T')[0]);
  const [reminderEnabled, setReminderEnabled] = useState(true);

  // Contract administrative fines / fees (Cláusula 9ª § 3º & multas contratuais)
  const [applyAdminFee, setApplyAdminFee] = useState(false);
  const [adminFeePct, setAdminFeePct] = useState<number>(20);
  const [extraAdminFineAmount, setExtraAdminFineAmount] = useState<number | ''>('');
  const [extraAdminFineReason, setExtraAdminFineReason] = useState('');

  useEffect(() => {
    setFines(vehicle.fines || []);
    setDriverName(vehicle.driver || '');
    setDriverPhone(vehicle.driverPhone || '');
  }, [vehicle.fines, vehicle.driver, vehicle.driverPhone, isOpen]);

  if (!isOpen) return null;

  const nominalValor = Number(valor || 0);
  const calculatedAdminFee = applyAdminFee
    ? Number(((nominalValor * (adminFeePct || 0)) / 100).toFixed(2))
    : 0;
  const extraAdminNum = Number(extraAdminFineAmount || 0);
  const formTotalFine = Number((nominalValor + calculatedAdminFee + extraAdminNum).toFixed(2));

  const pendingFinesValue = fines
    .filter(f => f.status === 'Pendente' || f.status === 'Repassada ao Motorista')
    .reduce((acc, f) => acc + getFineTotal(f), 0);
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
    if (!descricao || !valor || Number(valor) <= 0) {
      alert('Preencha a descrição e o valor da multa.');
      return;
    }

    const newFine: Fine = {
      id: Date.now().toString(),
      vehicleId: vehicle.id,
      dataHora,
      descricao: descricao.trim(),
      valor: Number(valor),
      pontos,
      gravidade,
      status: 'Pendente',
      driverName: driverName.trim() || vehicle.driver || 'Não atribuído',
      driverPhone: driverPhone.trim() || vehicle.driverPhone || '',
      notificationUrl: notificationUrl || undefined,
      notificationDate: notificationDate || undefined,
      reminderEnabled,
      applyAdminFee,
      adminFeePct: applyAdminFee ? adminFeePct : 20,
      adminFeeAmount: applyAdminFee ? calculatedAdminFee : 0,
      extraAdminFineAmount: extraAdminNum > 0 ? extraAdminNum : undefined,
      extraAdminFineReason: extraAdminFineReason.trim() || undefined,
    };

    const updated = [newFine, ...fines];
    setFines(updated);
    onUpdateVehicle({
      ...vehicle,
      fines: updated
    });

    // Reset Form
    setDescricao('');
    setValor('');
    setNotificationUrl(null);
    setNotificationDate(new Date().toISOString().split('T')[0]);
    setReminderEnabled(true);
    setApplyAdminFee(false);
    setAdminFeePct(20);
    setExtraAdminFineAmount('');
    setExtraAdminFineReason('');
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

  const handleToggleAdminFee = (fineId: string) => {
    const updated = fines.map((f) => {
      if (f.id !== fineId) return f;
      const nextApply = !f.applyAdminFee;
      const pct = typeof f.adminFeePct === 'number' ? f.adminFeePct : 20;
      const nextAmount = nextApply ? Number((((f.valor || 0) * pct) / 100).toFixed(2)) : 0;
      return {
        ...f,
        applyAdminFee: nextApply,
        adminFeePct: pct,
        adminFeeAmount: nextAmount,
      };
    });
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

    const adminFee = getFineAdminFee(fine);
    const extraAdmin = fine.extraAdminFineAmount || 0;
    const totalDue = getFineTotal(fine);

    const breakdownLines = [
      `💵 *Valor Nominal da Infração:* R$ ${(fine.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    ];
    if (adminFee > 0) {
      breakdownLines.push(
        `📑 *Taxa Adm. Contrato (${fine.adminFeePct ?? 20}% - Cláusula 9ª § 3º):* R$ ${adminFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      );
    }
    if (extraAdmin > 0) {
      breakdownLines.push(
        `⚖️ *Multa Adm. Contratual${fine.extraAdminFineReason ? ` (${fine.extraAdminFineReason})` : ''}:* R$ ${extraAdmin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      );
    }
    breakdownLines.push(
      `💰 *TOTAL A PAGAR:* R$ ${totalDue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    );

    const cleanPhone = phone.startsWith('55') ? phone : '55' + phone;
    const msg = `🚨 *NOTIFICAÇÃO DE INFRAÇÃO DE TRÂNSITO* 🚨

Olá, *${fine.driverName || 'Motorista'}*!

Identificamos o registro de uma infração de trânsito vinculada ao veículo *${vehicle.brand} ${vehicle.model}* (Placa: *${vehicle.plate}*):

📅 *Data:* ${fine.dataHora}
⚠️ *Infração:* ${fine.descricao} (${fine.gravidade || 'Média'} - ${fine.pontos || 4} pontos)
${breakdownLines.join('\n')}

📜 *Aviso Contratual (Cláusula 9ª):*
• Prazo de pagamento de até *15 dias corridos* a contar da notificação (mesmo após devolução ou devolução da caução).
• Caso o pagamento não seja efetuado no prazo e exija pagamento/gestão pela locadora, incide *Taxa Administrativa de 20%* sobre o valor da multa (Cláusula 9ª § 3º), além de cobrança na semanal com encargos e bloqueio previstos na Cláusula 6ª.

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
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[110] p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#121214] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        
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
                {vehicle.brand} {vehicle.model} • Gestão de notificações, taxas administrativas e cobrança
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
            <span className="text-[10px] uppercase font-bold text-rose-400 block">Valor Pendente (c/ Taxas Adm.)</span>
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
        <div className="p-4 sm:p-6 space-y-4">

          {/* Avisos Gerais do Contrato (Cláusula 9ª & Multas Adm) */}
          <div className="bg-amber-950/20 border border-amber-500/25 rounded-2xl p-3.5 text-[11px] text-gray-300 leading-relaxed space-y-2">
            <div className="flex items-center justify-between gap-2 border-b border-amber-500/15 pb-1.5">
              <span className="font-bold text-amber-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                Avisos & Regras de Multas Administrativas do Contrato (Cláusula 9ª)
              </span>
              <span className="text-[10px] font-mono font-bold text-rose-300 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
                Taxa Adm. 20% (§ 3º)
              </span>
            </div>
            <ul className="space-y-1 text-[10px] sm:text-[11px] text-gray-300">
              <li>
                • <strong className="text-white">Responsabilidade & Pós-Devolução (Cláusula 9ª / § 2º):</strong> O locatário responde integralmente pelas infrações cometidas na vigência do contrato (prazo de <strong className="text-amber-300">15 dias corridos</strong> da notificação), mesmo notificadas após a devolução do carro ou da caução.
              </li>
              <li>
                • <strong className="text-white">Cobrança Semanal & Bloqueio (Cláusula 9ª § 1º):</strong> Após 15 dias da notificação, a multa passa a compor o aluguel semanal com incidência de mora, multa e bloqueio remoto previstos na <strong className="text-white">Cláusula 6ª</strong>.
              </li>
              <li>
                • <strong className="text-rose-300">Taxa Administrativa de Gestão (Cláusula 9ª § 3º):</strong> Se o locatário não quitar no prazo e a locadora pagar/gerir a multa diretamente, incide <strong className="text-rose-300">Taxa Administrativa de 20%</strong> sobre o valor nominal da infração, reembolsável na próxima semanal ou no acerto da caução.
              </li>
            </ul>
          </div>
          
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
                  className="text-xs text-gray-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <div className="sm:col-span-2">
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Valor Nominal da Multa (R$) *</label>
                  <CurrencyInput
                    value={valor === '' ? 0 : valor}
                    onChange={(num) => setValor(num > 0 ? num : '')}
                    placeholder="0,00"
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
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Motorista Responsável</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full text-xs bg-black border border-white/10 rounded-xl p-2.5 text-white font-medium focus:outline-hidden focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Campos de Multa Administrativa do Contrato (Cláusula 9ª § 3º) */}
              <div className="bg-amber-500/5 border border-amber-500/20 p-3.5 rounded-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-amber-400" />
                    Multas & Taxas Administrativas do Contrato (Cláusula 9ª § 3º)
                  </span>
                  <span className="text-xs font-mono font-bold text-white bg-black/50 border border-white/10 px-2.5 py-1 rounded-lg">
                    Total a Cobrar: <strong className="text-rose-400">R$ {formTotalFine.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-6">
                    <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-black/50 border border-white/10 cursor-pointer hover:border-amber-500/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={applyAdminFee}
                        onChange={(e) => setApplyAdminFee(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-gray-400 text-amber-500 bg-black cursor-pointer"
                      />
                      <div className="text-[11px] leading-tight">
                        <span className="font-bold text-white block">
                          Aplicar Taxa Administrativa ({adminFeePct}%)
                        </span>
                        <span className="text-[10px] text-gray-400">
                          Cláusula 9ª § 3º — Pagamento direto / gestão pela locadora (+ R$ {calculatedAdminFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                        </span>
                      </div>
                    </label>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-amber-300 uppercase block mb-1">% Taxa Adm.</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={adminFeePct}
                      onChange={(e) => setAdminFeePct(Math.max(0, Number(e.target.value)))}
                      disabled={!applyAdminFee}
                      className="w-full text-xs bg-black border border-white/10 rounded-xl p-2.5 text-amber-300 font-mono font-bold disabled:opacity-40"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="text-[10px] font-bold text-amber-300 uppercase block mb-1">Multa Adm. Contratual (R$)</label>
                    <CurrencyInput
                      value={extraAdminFineAmount === '' ? 0 : extraAdminFineAmount}
                      onChange={(num) => setExtraAdminFineAmount(num > 0 ? num : '')}
                      placeholder="0,00"
                      className="w-full text-xs bg-black border border-white/10 rounded-xl p-2.5 text-white font-mono font-bold focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                    Motivo / Cláusula da Multa Administrativa (opcional)
                  </label>
                  <input
                    type="text"
                    value={extraAdminFineReason}
                    onChange={(e) => setExtraAdminFineReason(e.target.value)}
                    placeholder="Ex: Não indicação de condutor infrator (NIC) / Atraso no pagamento Cláusula 9ª"
                    className="w-full text-xs bg-black border border-white/10 rounded-xl p-2.5 text-white font-medium focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Cláusula 9ª & Lembrete Row */}
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
                    Prazo Cláusula 9ª (15 dias corridos)
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
              {fines.map((fine) => {
                const adminFee = getFineAdminFee(fine);
                const extraAdmin = fine.extraAdminFineAmount || 0;
                const fineTotal = getFineTotal(fine);

                return (
                <div 
                  key={fine.id}
                  className="p-4 bg-[#16161a] border border-white/10 rounded-2xl space-y-3 hover:border-white/20 transition-all shadow-lg"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-gray-300 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-rose-400" />
                        <span>{fine.dataHora}</span>
                      </span>
                      {fine.applyAdminFee && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          Taxa Adm {fine.adminFeePct ?? 20}% (Cláusula 9ª § 3º)
                        </span>
                      )}
                      {extraAdmin > 0 && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                          Multa Adm Contratual
                        </span>
                      )}
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
                      <p className="text-[10px] text-gray-400">
                        Motorista Responsável: <strong className="text-gray-200">{fine.driverName || vehicle.driver || 'Não informado'}</strong>
                      </p>
                      {(adminFee > 0 || extraAdmin > 0) && (
                        <p className="text-[10px] font-mono text-amber-300/90">
                          Nominal: R$ {(fine.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          {adminFee > 0 ? ` + Taxa Adm (${fine.adminFeePct ?? 20}%): R$ ${adminFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}
                          {extraAdmin > 0 ? ` + Multa Adm: R$ ${extraAdmin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}${fine.extraAdminFineReason ? ` (${fine.extraAdminFineReason})` : ''}` : ''}
                        </p>
                      )}
                    </div>

                    <div className="sm:col-span-4 flex flex-col sm:items-end justify-center space-y-1">
                      <span className="text-base font-mono font-bold text-rose-400">
                        R$ {fineTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] font-bold text-amber-400">
                        {fine.gravidade || 'Média'} ({fine.pontos || 4} pts na CNH)
                      </span>
                    </div>
                  </div>

                  {/* Cláusula 9ª Status / Lembrete */}
                  {(() => {
                    const status = getReminderStatus(fine);
                    if (!status) return null;
                    const { diffDays, deadlineStr, isPaga, isOverdue } = status;
                    if (isPaga) {
                      return (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl text-[10px] text-emerald-400 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Cláusula 9ª resolvida! Multa quitada.</span>
                        </div>
                      );
                    }
                    if (isOverdue) {
                      return (
                        <div className="bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl text-[10px] text-rose-400 font-bold flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-bounce" />
                            <span>🚨 Cláusula 9ª: Prazo de 15 dias EXCEDIDO! (Venceu em: {deadlineStr}) — Sujeito à Taxa Adm. 20% (§ 3º) e bloqueio (Cláusula 6ª).</span>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl text-[10px] text-amber-300 font-semibold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                        <span>⏱️ Cláusula 9ª: Restam <strong className="text-amber-300 underline font-extrabold">{diffDays} dias</strong> para o pagamento (Prazo Limite: {deadlineStr} • Após prazo incide Taxa Adm. 20%)</span>
                      </div>
                    );
                  })()}

                  {/* Actions & Attachment */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
                    <div className="flex flex-wrap items-center gap-2">
                      {fine.notificationUrl ? (
                        <button
                          type="button"
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

                      {fine.status !== 'Paga pelo Locatário' && fine.status !== 'Paga pela Locadora' && (
                        <button
                          type="button"
                          onClick={() => handleToggleAdminFee(fine.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                            fine.applyAdminFee
                              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                              : 'bg-white/5 border-white/10 text-gray-300 hover:bg-amber-500/15 hover:border-amber-500/30 hover:text-amber-300'
                          }`}
                        >
                          {fine.applyAdminFee
                            ? `✓ Taxa Adm ${fine.adminFeePct ?? 20}% Aplicada`
                            : '+ Aplicar Taxa Adm 20% (Cláusula 9ª § 3º)'}
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSendWhatsAppFineCharge(fine)}
                      className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Cobrar via WhatsApp</span>
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

