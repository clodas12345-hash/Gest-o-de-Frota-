import React, { useState, useEffect } from 'react';
import { X, Calculator, Percent, Calendar, DollarSign, Send, MessageCircle, Save, Check, RefreshCw } from 'lucide-react';
import { Vehicle } from '../types';
import CurrencyInput from './CurrencyInput';
import { getPublicWebBaseUrl } from './VehicleCard';

interface InterestCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles?: Vehicle[];
  selectedVehicle?: Vehicle | null;
}

export const InterestCalculatorModal: React.FC<InterestCalculatorModalProps> = ({
  isOpen,
  onClose,
  vehicles = [],
  selectedVehicle = null,
}) => {
  const [currentVehicleId, setCurrentVehicleId] = useState<string>('');
  const [calcMode, setCalcMode] = useState<'overdue' | 'early_return'>('overdue');

  // Input fields for overdue calculation
  const [driverName, setDriverName] = useState<string>('');
  const [driverPhone, setDriverPhone] = useState<string>('');
  const [vehicleLabel, setVehicleLabel] = useState<string>('');
  const [vehiclePlate, setPlate] = useState<string>('');
  
  const [originalAmount, setOriginalAmount] = useState<number>(500);
  const [dueDate, setDueDate] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [daysOverdue, setDaysOverdue] = useState<number>(0);
  const [isCustomDays, setIsCustomDays] = useState<boolean>(false);
  
  // Early return state (30 days contract minimum rule)
  const [earlyStartDate, setEarlyStartDate] = useState<string>('');
  const [earlyReturnDate, setEarlyReturnDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [earlyWeeklyRate, setEarlyWeeklyRate] = useState<number>(700);
  const [earlyFineRate, setEarlyFineRate] = useState<number>(() => {
    const saved = localStorage.getItem('fleet_early_return_fine_rate_default');
    return saved ? Number(saved) : 20; // 20% multa por rescisão antecipada
  });
  const [earlyTotalPaid, setEarlyTotalPaid] = useState<number>(0);

  // Rates (%)
  const [fineRate, setFineRate] = useState<number>(() => {
    const saved = localStorage.getItem('fleet_fine_rate_default');
    return saved ? Number(saved) : 2.0; // 2% multa padrão
  });
  const [dailyInterestRate, setDailyInterestRate] = useState<number>(() => {
    const saved = localStorage.getItem('fleet_daily_interest_rate_default');
    return saved ? Number(saved) : 0.33; // 0.33% ao dia (~10% ao mês)
  });
  
  const [savedSettingsToast, setSavedSettingsToast] = useState<string | null>(null);

  // Initialize values on open or vehicle selection
  useEffect(() => {
    if (isOpen) {
      const activeVeh = selectedVehicle || (vehicles.find(v => v.id === currentVehicleId) || vehicles[0]);
      if (activeVeh) {
        setCurrentVehicleId(activeVeh.id);
        setDriverName(activeVeh.driver || 'Locatário');
        let rawPhone = activeVeh.driverPhone || '';
        if (rawPhone.startsWith('55')) rawPhone = rawPhone.substring(2);
        setDriverPhone(rawPhone);
        setVehicleLabel(`${activeVeh.brand} ${activeVeh.model}`);
        setPlate(activeVeh.plate);
        setOriginalAmount(activeVeh.valorSemanal || activeVeh.valorRecebido || 500);
        
        // Early return defaults
        setEarlyStartDate(activeVeh.startDate || new Date().toISOString().split('T')[0]);
        setEarlyReturnDate(new Date().toISOString().split('T')[0]);
        setEarlyWeeklyRate(activeVeh.valorSemanal || activeVeh.valorRecebido || 700);
        const totalPaid = (activeVeh.weeklyPayments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
        setEarlyTotalPaid(totalPaid);

        // Calculate default due date
        const today = new Date();
        const past = new Date(today);
        past.setDate(past.getDate() - 5);
        const defaultDue = past.toISOString().split('T')[0];
        setDueDate(defaultDue);
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setIsCustomDays(false);
      } else {
        setDriverName('');
        setDriverPhone('');
        setVehicleLabel('');
        setPlate('');
        setOriginalAmount(500);
        setDueDate(new Date().toISOString().split('T')[0]);
        setPaymentDate(new Date().toISOString().split('T')[0]);
      }
    }
  }, [isOpen, selectedVehicle]);

  // Recalculate days overdue when dueDate or paymentDate changes (if not custom)
  useEffect(() => {
    if (!isCustomDays && dueDate && paymentDate) {
      const due = new Date(dueDate + 'T12:00:00');
      const pay = new Date(paymentDate + 'T12:00:00');
      const diffTime = pay.getTime() - due.getTime();
      const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
      setDaysOverdue(diffDays);
    }
  }, [dueDate, paymentDate, isCustomDays]);

  const handleVehicleChange = (vId: string) => {
    setCurrentVehicleId(vId);
    const v = vehicles.find(item => item.id === vId);
    if (v) {
      setDriverName(v.driver || 'Locatário');
      let rawPhone = v.driverPhone || '';
      if (rawPhone.startsWith('55')) rawPhone = rawPhone.substring(2);
      setDriverPhone(rawPhone);
      setVehicleLabel(`${v.brand} ${v.model}`);
      setPlate(v.plate);
      setOriginalAmount(v.valorSemanal || v.valorRecebido || 500);
      setEarlyStartDate(v.startDate || new Date().toISOString().split('T')[0]);
      setEarlyWeeklyRate(v.valorSemanal || v.valorRecebido || 700);
      const totalPaid = (v.weeklyPayments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
      setEarlyTotalPaid(totalPaid);
    }
  };

  if (!isOpen) return null;

  // Calculations for Overdue Mode
  const fineAmount = (originalAmount * (fineRate || 0)) / 100;
  const interestAmount = (originalAmount * (dailyInterestRate || 0) * (daysOverdue || 0)) / 100;
  const totalAmount = originalAmount + fineAmount + interestAmount;

  // Early Return Calculations (30 days minimum contract rule)
  const getEarlyReturnCalc = () => {
    let daysUsed = 1;
    if (earlyStartDate && earlyReturnDate) {
      const s = new Date(earlyStartDate + 'T12:00:00');
      const r = new Date(earlyReturnDate + 'T12:00:00');
      daysUsed = Math.max(1, Math.floor((r.getTime() - s.getTime()) / (1000 * 60 * 60 * 24))) + 1;
    }
    const minimumDays = 30;
    const missingDays = Math.max(0, minimumDays - daysUsed);
    const dailyRate = (earlyWeeklyRate || 0) / 7;

    const base30DaysAmount = minimumDays * dailyRate; // Always sums 30 days minimum
    const missingDaysBaseAmount = missingDays * dailyRate;
    const fineOnMissingDays = missingDaysBaseAmount * ((earlyFineRate || 0) / 100);

    const totalTerminationAmount = base30DaysAmount + fineOnMissingDays;
    const finalBalanceDue = totalTerminationAmount - (earlyTotalPaid || 0);

    return {
      daysUsed,
      minimumDays,
      missingDays,
      dailyRate,
      base30DaysAmount,
      missingDaysBaseAmount,
      fineOnMissingDays,
      totalTerminationAmount,
      finalBalanceDue,
    };
  };

  const formatBRL = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatDateBR = (dateStr?: string): string => {
    if (!dateStr) return 'N/I';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const handleSaveDefaultRates = () => {
    localStorage.setItem('fleet_fine_rate_default', String(fineRate));
    localStorage.setItem('fleet_daily_interest_rate_default', String(dailyInterestRate));
    setSavedSettingsToast('Taxas de juros salvas!');
    setTimeout(() => setSavedSettingsToast(null), 2500);
  };

  const generateWhatsAppMessage = () => {
    let cleanPhone = driverPhone.replace(/\D/g, '');
    if (cleanPhone.length > 0 && !cleanPhone.startsWith('55')) {
      cleanPhone = '55' + cleanPhone;
    }

    const returnBase = getPublicWebBaseUrl();
    const returnUrl = `${returnBase}?placa=${encodeURIComponent(vehiclePlate)}&brand=${encodeURIComponent(vehicleLabel)}&driver=${encodeURIComponent(driverName)}`;

    const text = `🚨 *AVISO DE ATRASO E COBRANÇA COM JUROS* 🚨\n\nOlá, *${driverName || 'Locatário'}*!\nConstatamos pendência no pagamento do aluguel referente ao veículo *${vehicleLabel}* (Placa: *${vehiclePlate}*).\n\n💵 *Valor Original:* ${formatBRL(originalAmount)}\n📅 *Data de Vencimento:* ${formatDateBR(dueDate)}\n⏱️ *Dias em Atraso:* ${daysOverdue} dia(s)\n\n➕ *Multa por Atraso (${fineRate}%):* ${formatBRL(fineAmount)}\n➕ *Juros de Mora (${dailyInterestRate}%/dia):* ${formatBRL(interestAmount)}\n\n💰 *VALOR TOTAL ATUALIZADO:* *${formatBRL(totalAmount)}*\n\nPor favor, efetue o pagamento do valor atualizado e envie o comprovante clicando no link abaixo:\n🔗 ${returnUrl}\n\nFicamos no aguardo da quitação. Obrigado!`;

    return { text, cleanPhone };
  };

  const generateEarlyReturnWhatsApp = () => {
    let cleanPhone = driverPhone.replace(/\D/g, '');
    if (cleanPhone.length > 0 && !cleanPhone.startsWith('55')) {
      cleanPhone = '55' + cleanPhone;
    }
    const calc = getEarlyReturnCalc();

    const text = `📋 *DEMONSTRATIVO DE RESCISÃO E TEMPO MÍNIMO (30 DIAS)*\n\nOlá, *${driverName || 'Locatário'}*!\nSegue o demonstrativo para devolução e encerramento do veículo *${vehicleLabel}* (${vehiclePlate}).\n\n🗓️ *Início do Contrato:* ${formatDateBR(earlyStartDate)}\n🏁 *Data da Devolução:* ${formatDateBR(earlyReturnDate)}\n⏱️ *Dias Utilizados:* ${calc.daysUsed} dia(s)\n⚠️ *Tempo Mínimo Obrigatório:* 30 dias (${calc.missingDays} dias faltantes)\n\n💵 *Valor Base do Contrato (30 Dias Mínimos):* ${formatBRL(calc.base30DaysAmount)}\n➕ *Multa por Rescisão Antecipada (${earlyFineRate}% sobre ${calc.missingDays} dias faltantes):* ${formatBRL(calc.fineOnMissingDays)}\n💰 *VALOR TOTAL DA RESCISÃO:* *${formatBRL(calc.totalTerminationAmount)}*\n\n➖ *Total Já Pago Até o Momento:* ${formatBRL(earlyTotalPaid || 0)}\n${calc.finalBalanceDue >= 0 ? `🚨 *SALDO FINAL DEVEDOR:* *${formatBRL(calc.finalBalanceDue)}*` : `✅ *SALDO A DEVOLVER/RESTITUIR:* *${formatBRL(Math.abs(calc.finalBalanceDue))}*`}\n\nFicamos à disposição para a quitação e devolução das chaves. Obrigado!`;

    return { text, cleanPhone };
  };

  const handleSendWhatsApp = () => {
    const { text, cleanPhone } = generateWhatsAppMessage();
    const waUrl = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-[#121212] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden z-[2501] flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-amber-500/20 bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-transparent flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shadow-inner">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Calculadora de Cobrança e Rescisão
              </h2>
              <p className="text-[11px] text-amber-300/80">
                Atrasos de aluguel e cálculo de devolução antecipada (mínimo 30 dias + multa)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 bg-black/60 border-b border-amber-500/20 p-1.5 gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setCalcMode('overdue')}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              calcMode === 'overdue'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Cobrança por Atraso</span>
          </button>

          <button
            type="button"
            onClick={() => setCalcMode('early_return')}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              calcMode === 'early_return'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Devolução Antecipada (Mín. 30 Dias)</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-white/10 text-xs">
          
          {/* Vehicle Selector (if vehicles exist) */}
          {vehicles.length > 0 && (
            <div className="bg-white/[0.02] border border-white/10 p-3 rounded-xl space-y-2">
              <label className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                1. Selecionar Veículo / Locatário
              </label>
              <select
                value={currentVehicleId}
                onChange={(e) => handleVehicleChange(e.target.value)}
                className="w-full text-xs bg-black border border-white/15 rounded-lg px-2.5 py-2 text-white font-medium focus:border-amber-400 cursor-pointer"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.brand} {v.model} ({v.plate}) - {v.driver || 'Sem locatário'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* MODE 1: COBRANÇA POR ATRASO */}
          {calcMode === 'overdue' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Valor Original */}
                <div className="bg-white/[0.02] border border-white/10 p-3 rounded-xl space-y-1.5">
                  <label className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider">
                    Valor Original do Aluguel (R$)
                  </label>
                  <CurrencyInput
                    value={originalAmount}
                    onChange={setOriginalAmount}
                    placeholder="0,00"
                    className="w-full text-xs bg-black border border-emerald-500/30 rounded-lg px-2.5 py-1.5 text-emerald-300 font-mono font-bold"
                  />
                  <p className="text-[9px] text-gray-400">Valor padrão contratado pelo locatário</p>
                </div>

                {/* Nome do Locatário */}
                <div className="bg-white/[0.02] border border-white/10 p-3 rounded-xl space-y-1.5">
                  <label className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider">
                    Locatário & Telefone WhatsApp
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      placeholder="Nome do Locatário"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      className="w-full text-xs bg-black border border-white/15 rounded-lg px-2 py-1.5 text-white"
                    />
                    <input
                      type="text"
                      placeholder="DDD + Celular (Ex: 11999991234)"
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-xs bg-black border border-white/15 rounded-lg px-2 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>

                {/* Data de Vencimento e Dias em Atraso */}
                <div className="bg-white/[0.02] border border-white/10 p-3 rounded-xl space-y-2 col-span-1 sm:col-span-2">
                  <div className="flex justify-between items-center pb-1 border-b border-white/5">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                      2. Apuração dos Dias em Atraso
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCustomDays(!isCustomDays)}
                      className="text-[9px] text-blue-400 hover:underline font-semibold"
                    >
                      {isCustomDays ? '🔄 Usar Cálculo por Data' : '✏️ Informar Dias Manualmente'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">Data de Vencimento</label>
                      <input
                        type="date"
                        value={dueDate}
                        disabled={isCustomDays}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full text-xs bg-black border border-white/15 rounded-lg px-2.5 py-1.5 text-white font-mono disabled:opacity-50 scheme-dark"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">Data Atual de Quitação</label>
                      <input
                        type="date"
                        value={paymentDate}
                        disabled={isCustomDays}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full text-xs bg-black border border-white/15 rounded-lg px-2.5 py-1.5 text-white font-mono disabled:opacity-50 scheme-dark"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1 font-bold text-amber-300">
                        Dias em Atraso
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={daysOverdue}
                        onChange={(e) => {
                          setIsCustomDays(true);
                          setDaysOverdue(Math.max(0, Number(e.target.value)));
                        }}
                        className="w-full text-xs bg-black border border-amber-500/40 rounded-lg px-2.5 py-1.5 text-amber-300 font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Quick Preset Days */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[9px] text-gray-500 font-semibold">Atalhos rápidos:</span>
                    {[3, 7, 15, 30].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          setIsCustomDays(true);
                          setDaysOverdue(d);
                        }}
                        className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer ${
                          daysOverdue === d
                            ? 'bg-amber-400 text-slate-900'
                            : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
                        }`}
                      >
                        +{d} dias
                      </button>
                    ))}
                  </div>
                </div>

                {/* Configuração de Taxas */}
                <div className="bg-white/[0.02] border border-white/10 p-3 rounded-xl space-y-2 col-span-1 sm:col-span-2">
                  <div className="flex justify-between items-center pb-1 border-b border-white/5">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <Percent className="w-3 h-3 text-amber-400" /> Taxas Aplicadas (Multa + Juros Diários)
                    </span>
                    <button
                      type="button"
                      onClick={handleSaveDefaultRates}
                      className="text-[9px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Save className="w-2.5 h-2.5" />
                      <span>Salvar como Padrão</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1 font-semibold">
                        Multa Fixa por Atraso (%)
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={fineRate}
                          onChange={(e) => setFineRate(Number(e.target.value))}
                          className="w-full text-xs bg-black border border-white/15 rounded-lg px-2.5 py-1.5 text-white font-mono pr-7"
                        />
                        <span className="absolute right-2.5 text-gray-400 text-xs font-bold">%</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1 font-semibold">
                        Juros de Mora Diários (% ao dia)
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={dailyInterestRate}
                          onChange={(e) => setDailyInterestRate(Number(e.target.value))}
                          className="w-full text-xs bg-black border border-white/15 rounded-lg px-2.5 py-1.5 text-white font-mono pr-7"
                        />
                        <span className="absolute right-2.5 text-gray-400 text-xs font-bold">%</span>
                      </div>
                    </div>
                  </div>

                  {savedSettingsToast && (
                    <div className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded text-center animate-pulse">
                      {savedSettingsToast}
                    </div>
                  )}
                </div>

              </div>

              {/* Result Card Breakdown */}
              <div className="bg-gradient-to-br from-amber-950/40 via-black to-neutral-900 border border-amber-500/30 p-4 rounded-xl space-y-3 shadow-lg">
                <h3 className="text-[10px] font-bold text-amber-400 uppercase tracking-wider border-b border-amber-500/20 pb-1.5 flex justify-between items-center">
                  <span>Resumo do Valor Atualizado</span>
                  <span className="font-mono text-amber-300 text-xs">{daysOverdue} dia(s) em atraso</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                    <span className="text-[9px] text-gray-400 block font-semibold">Valor Original</span>
                    <span className="text-xs font-bold font-mono text-white">{formatBRL(originalAmount)}</span>
                  </div>

                  <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                    <span className="text-[9px] text-gray-400 block font-semibold">Multa ({fineRate}%)</span>
                    <span className="text-xs font-bold font-mono text-amber-400">+{formatBRL(fineAmount)}</span>
                  </div>

                  <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                    <span className="text-[9px] text-gray-400 block font-semibold">Juros ({dailyInterestRate}%/dia)</span>
                    <span className="text-xs font-bold font-mono text-amber-400">+{formatBRL(interestAmount)}</span>
                  </div>

                  <div className="bg-emerald-500/15 p-2 rounded-lg border border-emerald-500/30 col-span-2 sm:col-span-1">
                    <span className="text-[9px] text-emerald-300 block font-extrabold uppercase">Total Atualizado</span>
                    <span className="text-sm font-black font-mono text-emerald-300">{formatBRL(totalAmount)}</span>
                  </div>
                </div>

                {/* WhatsApp Direct Button */}
                <div className="pt-1 flex flex-col sm:flex-row justify-between items-center gap-2">
                  <p className="text-[9px] text-gray-400 italic">
                    O envio preenche a discriminação completa da dívida no WhatsApp do locatário.
                  </p>
                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 cursor-pointer shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar Cobrança com Juros p/ WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: DEVOLUÇÃO ANTECIPADA & TEMPO MÍNIMO (30 DIAS) */}
          {calcMode === 'early_return' && (() => {
            const calc = getEarlyReturnCalc();
            return (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="bg-amber-950/30 border border-amber-500/30 p-3 rounded-xl space-y-1">
                  <p className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-400" /> Regra do Contrato Mínimo de 30 Dias
                  </p>
                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    Soma sempre os 30 dias mínimos de contrato. Se a pessoa devolver o carro antes dos 30 dias, calcula também o percentual de multa sobre os dias faltantes.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white/[0.02] border border-white/10 p-3 rounded-xl space-y-1.5">
                    <label className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider">
                      Valor Semanal do Aluguel (R$)
                    </label>
                    <CurrencyInput
                      value={earlyWeeklyRate}
                      onChange={setEarlyWeeklyRate}
                      placeholder="0,00"
                      className="w-full text-xs bg-black border border-emerald-500/30 rounded-lg px-2.5 py-1.5 text-emerald-300 font-mono font-bold"
                    />
                    <p className="text-[9px] text-gray-400 font-mono">
                      Diária equivalente: R$ {(earlyWeeklyRate / 7).toFixed(2).replace('.', ',')} / dia
                    </p>
                  </div>

                  <div className="bg-white/[0.02] border border-white/10 p-3 rounded-xl space-y-1.5">
                    <label className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider">
                      Multa por Rescisão Antecipada (%)
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={earlyFineRate}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value));
                          setEarlyFineRate(val);
                          localStorage.setItem('fleet_early_return_fine_rate_default', String(val));
                        }}
                        className="w-full text-xs bg-black border border-white/15 rounded-lg px-2.5 py-1.5 text-white font-mono pr-7"
                      />
                      <span className="absolute right-2.5 text-gray-400 text-xs font-bold">%</span>
                    </div>
                    <p className="text-[9px] text-gray-400">Aplicada sobre o valor dos dias faltantes</p>
                  </div>

                  <div className="bg-white/[0.02] border border-white/10 p-3 rounded-xl space-y-1.5">
                    <label className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider">
                      Data do Início do Contrato
                    </label>
                    <input
                      type="date"
                      value={earlyStartDate}
                      onChange={(e) => setEarlyStartDate(e.target.value)}
                      className="w-full text-xs bg-black border border-white/15 rounded-lg px-2.5 py-1.5 text-white font-mono scheme-dark"
                    />
                  </div>

                  <div className="bg-white/[0.02] border border-white/10 p-3 rounded-xl space-y-1.5">
                    <label className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider">
                      Data da Devolução
                    </label>
                    <input
                      type="date"
                      value={earlyReturnDate}
                      onChange={(e) => setEarlyReturnDate(e.target.value)}
                      className="w-full text-xs bg-black border border-white/15 rounded-lg px-2.5 py-1.5 text-white font-mono scheme-dark"
                    />
                  </div>

                  <div className="bg-white/[0.02] border border-white/10 p-3 rounded-xl space-y-1.5 col-span-1 sm:col-span-2">
                    <label className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider">
                      Total Já Pago Pelo Locatário Até Hoje (R$)
                    </label>
                    <CurrencyInput
                      value={earlyTotalPaid}
                      onChange={setEarlyTotalPaid}
                      placeholder="0,00"
                      className="w-full text-xs bg-black border border-white/15 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>

                {/* Early Return Breakdown Card */}
                <div className="bg-gradient-to-br from-amber-950/40 via-black to-neutral-900 border border-amber-500/30 p-4 rounded-xl space-y-3 shadow-lg">
                  <h3 className="text-[10px] font-bold text-amber-400 uppercase tracking-wider border-b border-amber-500/20 pb-1.5 flex justify-between items-center">
                    <span>Resumo da Rescisão Antecipada</span>
                    <span className="font-mono text-amber-300 text-xs">
                      {calc.daysUsed}d rodados | {calc.missingDays}d faltantes
                    </span>
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                      <span className="text-[9px] text-gray-400 block font-semibold">Mínimo 30 Dias</span>
                      <span className="text-xs font-bold font-mono text-white">{formatBRL(calc.base30DaysAmount)}</span>
                    </div>

                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                      <span className="text-[9px] text-gray-400 block font-semibold">Multa ({earlyFineRate}%)</span>
                      <span className="text-xs font-bold font-mono text-amber-400">+{formatBRL(calc.fineOnMissingDays)}</span>
                    </div>

                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                      <span className="text-[9px] text-gray-400 block font-semibold">Já Pago</span>
                      <span className="text-xs font-bold font-mono text-blue-300">-{formatBRL(earlyTotalPaid)}</span>
                    </div>

                    <div className="bg-emerald-500/15 p-2 rounded-lg border border-emerald-500/30 col-span-2 sm:col-span-1">
                      <span className="text-[9px] text-emerald-300 block font-extrabold uppercase">
                        {calc.finalBalanceDue >= 0 ? 'Saldo A Cobrar' : 'Saldo A Restituir'}
                      </span>
                      <span className="text-sm font-black font-mono text-emerald-300">{formatBRL(Math.abs(calc.finalBalanceDue))}</span>
                    </div>
                  </div>

                  <div className="pt-1 flex flex-col sm:flex-row justify-between items-center gap-2">
                    <p className="text-[9px] text-gray-400 italic">
                      Envia o demonstrativo completo de devolução e quebra de contrato direto no WhatsApp do locatário.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const { text, cleanPhone } = generateEarlyReturnWhatsApp();
                        const waUrl = cleanPhone
                          ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`
                          : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
                        window.open(waUrl, '_blank', 'noopener,noreferrer');
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 cursor-pointer shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar Rescisão p/ WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-[#161616] flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer border border-white/10"
          >
            Fechar Calculadora
          </button>
        </div>

      </div>
    </div>
  );
};
