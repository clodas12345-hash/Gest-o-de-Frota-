import React, { useState, useEffect, useMemo } from 'react';
import { Archive, CheckCircle2, X, ShieldCheck, Calculator, MessageCircle, FileText, AlertOctagon } from 'lucide-react';
import { Vehicle, SinistroLog, ExpenseLog, MaintenanceLog, getFineTotal, isWeeklyPaymentPaid } from '../types';
import CurrencyInput from './CurrencyInput';

export interface CaucaoSettlementData {
  caucaoOriginal: number;
  descontoAluguelPendente: number;
  descontoAvarias: number;
  descontoLavagem: number;
  descontoCombustivel: number;
  descontoMultas: number;
  descontoPedagios: number;
  observacoesAcerto: string;
  saldoFinal: number;
}

interface ConfirmFinalizeContractModalProps {
  isOpen: boolean;
  vehicle: Vehicle | null;
  sinistroLogs?: SinistroLog[];
  expenseLogs?: ExpenseLog[];
  maintenanceLogs?: MaintenanceLog[];
  isLoading?: boolean;
  onConfirm: (settlement?: CaucaoSettlementData) => void;
  onCancel: () => void;
}

export function ConfirmFinalizeContractModal({
  isOpen,
  vehicle,
  sinistroLogs = [],
  expenseLogs = [],
  maintenanceLogs = [],
  isLoading = false,
  onConfirm,
  onCancel
}: ConfirmFinalizeContractModalProps) {
  const [caucaoOriginal, setCaucaoOriginal] = useState<number>(0);
  const [descontoAluguelPendente, setDescontoAluguelPendente] = useState<number>(0);
  const [descontoAvarias, setDescontoAvarias] = useState<number>(0);
  const [descontoLavagem, setDescontoLavagem] = useState<number>(0);
  const [descontoCombustivel, setDescontoCombustivel] = useState<number>(0);
  const [descontoMultas, setDescontoMultas] = useState<number>(0);
  const [descontoPedagios, setDescontoPedagios] = useState<number>(0);
  const [observacoesAcerto, setObservacoesAcerto] = useState<string>('');
  const [earlyFineRatePct, setEarlyFineRatePct] = useState<number>(20);
  const [daysUsed, setDaysUsed] = useState<number>(0);
  const [missingDays, setMissingDays] = useState<number>(0);
  const [earlyFineAmount, setEarlyFineAmount] = useState<number>(0);
  const [tankCapacity, setTankCapacity] = useState<number | ''>(0);
  const [returnFuelLevel, setReturnFuelLevel] = useState<number>(8);
  const [fuelPrice, setFuelPrice] = useState<number>(7.00);
  const [returnDate, setReturnDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const detectedDebits = useMemo(() => {
    if (!vehicle) {
      return {
        pendingFines: [],
        fineExpenses: [],
        tollExpenses: [],
        periodSinistros: [],
        periodCrashMaint: [],
        finesTotal: 0,
        tollsTotal: 0,
        damagesTotal: 0,
      };
    }

    const contractStart = vehicle.startDate || '';
    const todayIso = new Date().toISOString().split('T')[0];
    const effectiveEnd = returnDate || todayIso;

    const pendingFines = (vehicle.fines || []).filter(
      (f) => f.status !== 'Paga pelo Locatário' && f.status !== 'Paga pela Locadora'
    );
    const pendingFinesTotal = pendingFines.reduce((sum, f) => sum + getFineTotal(f), 0);

    const fineExpenses = expenseLogs.filter((exp) => {
      if (exp.vehicleId !== vehicle.id || (exp.cost || 0) <= 0) return false;
      if (contractStart && exp.date < contractStart) return false;
      if (effectiveEnd && exp.date > effectiveEnd) return false;
      const isFineExpense =
        exp.category === 'Multa' || /\bmulta\b/i.test(exp.description || '');
      if (!isFineExpense) return false;
      // Avoid double counting if already registered with same date and value in vehicle.fines
      const duplicatesVehicleFine = pendingFines.some(
        (f) => f.dataHora === exp.date && Math.abs((f.valor || 0) - (exp.cost || 0)) < 0.01
      );
      return !duplicatesVehicleFine;
    });
    const fineExpensesTotal = fineExpenses.reduce((sum, e) => sum + (e.cost || 0), 0);

    const tollExpenses = expenseLogs.filter((exp) => {
      if (exp.vehicleId !== vehicle.id || (exp.cost || 0) <= 0) return false;
      if (contractStart && exp.date < contractStart) return false;
      if (effectiveEnd && exp.date > effectiveEnd) return false;
      return (
        exp.category === 'Pedágio' ||
        exp.category === 'Estacionamento' ||
        /ped[aá]gio|sem\s*parar|veloe|conectcar|\btag\b/i.test(exp.description || '')
      );
    });
    const tollsTotal = tollExpenses.reduce((sum, e) => sum + (e.cost || 0), 0);

    const periodSinistros = sinistroLogs.filter((s) => {
      if (s.vehicleId !== vehicle.id || (s.repairCost || 0) <= 0) return false;
      if (contractStart && s.date < contractStart) return false;
      if (effectiveEnd && s.date > effectiveEnd) return false;
      return true;
    });
    const periodSinistrosTotal = periodSinistros.reduce((sum, s) => sum + (s.repairCost || 0), 0);

    const periodCrashMaint = maintenanceLogs.filter((m) => {
      if (m.vehicleId !== vehicle.id || (m.cost || 0) <= 0) return false;
      if (m.type !== 'Batida/Acidente' && !m.category?.includes('Batida')) return false;
      if (contractStart && m.date < contractStart) return false;
      if (effectiveEnd && m.date > effectiveEnd) return false;
      return true;
    });
    const periodCrashMaintTotal = periodCrashMaint.reduce((sum, m) => sum + (m.cost || 0), 0);

    return {
      pendingFines,
      fineExpenses,
      tollExpenses,
      periodSinistros,
      periodCrashMaint,
      finesTotal: Number((pendingFinesTotal + fineExpensesTotal).toFixed(2)),
      tollsTotal: Number(tollsTotal.toFixed(2)),
      damagesTotal: Number((periodSinistrosTotal + periodCrashMaintTotal).toFixed(2)),
    };
  }, [vehicle, sinistroLogs, expenseLogs, maintenanceLogs, returnDate]);

  // Reset fields when opening modal for a vehicle, pulling all open debits automatically
  useEffect(() => {
    if (isOpen && vehicle) {
      const paidPromises = (vehicle.promisePayments || [])
        .filter(p => p.isPaid)
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      setCaucaoOriginal((vehicle.caucaoValor || 0) + paidPromises);
      setDescontoAvarias(detectedDebits.damagesTotal);
      setDescontoLavagem(0);
      setDescontoCombustivel(0);
      setDescontoMultas(detectedDebits.finesTotal);
      setDescontoPedagios(detectedDebits.tollsTotal);
      setObservacoesAcerto('');
      setTankCapacity(0);
      setReturnFuelLevel(8);
      setFuelPrice(7.00);
      setEarlyFineRatePct(20);
      setReturnDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, vehicle?.id]);

  // Recalculate pending rent and days when returnDate, earlyFineRatePct or vehicle changes
  useEffect(() => {
    if (isOpen && vehicle) {
      let calculatedPending = 0;
      let used = 0;
      let faltantes = 0;
      let fineAmt = 0;

      if (vehicle.startDate) {
        const start = new Date(vehicle.startDate + 'T12:00:00');
        const returnDt = new Date((returnDate || new Date().toISOString().split('T')[0]) + 'T12:00:00');
        used = Math.max(1, Math.floor((returnDt.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))) + 1;
        const weeklyRate = vehicle.valorSemanal || vehicle.valorRecebido || 0;
        const dailyRate = weeklyRate > 0 ? weeklyRate / 7 : 0;

        // Minimum contract duration = 30 days
        if (used < 30) {
          faltantes = 30 - used;
          const valorDiasFaltantes = faltantes * dailyRate;
          fineAmt = valorDiasFaltantes * (earlyFineRatePct / 100);
          const valor30Dias = 30 * dailyRate;
          const expectedTotal = valor30Dias + fineAmt;
          const totalPaid = (vehicle.weeklyPayments || []).filter(isWeeklyPaymentPaid).reduce((sum, p) => sum + (p.amount || 0), 0);
          calculatedPending = Math.max(0, expectedTotal - totalPaid);
        } else {
          faltantes = 0;
          fineAmt = 0;
          const expectedTotal = used * dailyRate;
          const totalPaid = (vehicle.weeklyPayments || []).filter(isWeeklyPaymentPaid).reduce((sum, p) => sum + (p.amount || 0), 0);
          calculatedPending = Math.max(0, expectedTotal - totalPaid);
        }
      }

      setDescontoAluguelPendente(calculatedPending);
      setDaysUsed(used);
      setMissingDays(faltantes);
      setEarlyFineAmount(fineAmt);
    }
  }, [isOpen, vehicle, earlyFineRatePct, returnDate]);

  if (!isOpen || !vehicle) return null;

  const weeklyRate = vehicle ? (vehicle.valorSemanal || vehicle.valorRecebido || 0) : 0;
  const dailyRate = weeklyRate > 0 ? weeklyRate / 7 : 0;
  const paidWeeklyList = vehicle ? (vehicle.weeklyPayments || []).filter(isWeeklyPaymentPaid) : [];
  const totalPaid = paidWeeklyList.reduce((sum, p) => sum + (p.amount || 0), 0);
  const paidWeeksCount = paidWeeklyList.filter(p => (p.amount || 0) > 0).length;
  const expectedTotal = missingDays > 0 ? (30 * dailyRate + earlyFineAmount) : (daysUsed * dailyRate);
  const calculatedPendingRent = Math.max(0, expectedTotal - totalPaid);

  const totalDescontos =
    (descontoAluguelPendente || 0) +
    (descontoAvarias || 0) +
    (descontoLavagem || 0) +
    (descontoCombustivel || 0) +
    (descontoMultas || 0) +
    (descontoPedagios || 0);

  const saldoFinal = (caucaoOriginal || 0) - totalDescontos;

  const formatBRL = (val: number) =>
    `R$ ${Math.abs(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleSendSettlementWhatsApp = () => {
    let cleanPhone = (vehicle.driverPhone || '').replace(/\D/g, '');
    if (cleanPhone && !cleanPhone.startsWith('55')) {
      cleanPhone = '55' + cleanPhone;
    }

    const statusLine =
      saldoFinal >= 0
        ? `✅ *SALDO A DEVOLVER AO LOCATÁRIO:* ${formatBRL(saldoFinal)}`
        : `⚠️ *SALDO DEVEDOR A PAGAR PELO LOCATÁRIO:* ${formatBRL(saldoFinal)}`;

    const finesSummary = detectedDebits.pendingFines.length > 0
      ? ` (${detectedDebits.pendingFines.length} multa(s): ${detectedDebits.pendingFines.map(f => `${f.descricao} ${formatBRL(getFineTotal(f))}`).join(', ')})`
      : '';

    const text = `📋 *DEMONSTRATIVO DE FECHAMENTO E ACERTO DE CAUÇÃO*\n\n🚗 *Veículo:* ${vehicle.brand} ${vehicle.model} (${vehicle.plate})\n👤 *Locatário:* ${vehicle.driver || 'Não informado'}\n📅 *Período:* ${vehicle.startDate ? new Date(vehicle.startDate + 'T12:00:00').toLocaleDateString('pt-BR') : ''} até ${new Date(returnDate + 'T12:00:00').toLocaleDateString('pt-BR')} (${daysUsed} dias rodados)\n📊 *Diária Proporcional:* ${formatBRL(dailyRate)}/dia (Semanal ${formatBRL(weeklyRate)})\n\n💵 *Total Devido do Período:* ${formatBRL(expectedTotal)}\n➖ *Total Já Pago:* ${formatBRL(totalPaid)} (${paidWeeksCount} semanais pagas)\n🟰 *Aluguéis em Aberto:* ${formatBRL(descontoAluguelPendente)}\n\n--- *ACERTO DA CAUÇÃO* ---\n💰 *Caução Depositada:* +${formatBRL(caucaoOriginal)}\n➖ *Aluguéis em Aberto:* -${formatBRL(descontoAluguelPendente)}\n➖ *Avarias / Oficina:* -${formatBRL(descontoAvarias)}\n➖ *Lavagem / Higienização:* -${formatBRL(descontoLavagem)}\n➖ *Diferença Combustível:* -${formatBRL(descontoCombustivel)}\n➖ *Multas (Trânsito/Adm):* -${formatBRL(descontoMultas)}${finesSummary}\n➖ *Pedágios / Tag:* -${formatBRL(descontoPedagios)}\n${observacoesAcerto ? `📝 *Obs:* ${observacoesAcerto}\n` : ''}\n${statusLine}`;

    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onCancel} 
      />

      <div className="relative w-full max-w-lg bg-[#141414] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden z-[2001] animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-amber-500/20 bg-amber-950/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Finalizar Contrato + Acerto de Caução</h2>
              <p className="text-[11px] text-amber-300/80">Checklist financeiro de devolução e arquivamento</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-white/10">
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-white">
                {vehicle.brand} {vehicle.model} - <span className="font-mono text-amber-300">{vehicle.plate}</span>
              </p>
              <p className="text-[11px] text-gray-400">
                Motorista: <strong className="text-gray-200">{vehicle.driver || 'Não cadastrado'}</strong>
              </p>
            </div>
            
            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              <div>
                <label className="text-[9px] text-gray-400 block mb-0.5">📅 Data Real da Devolução</label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="bg-[#141414] border border-amber-500/40 rounded-lg px-2 py-1 text-xs text-amber-300 font-mono font-bold"
                />
              </div>
              <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Caução: {formatBRL(caucaoOriginal)}
              </span>
            </div>
          </div>

          {/* Calculadora de Acerto de Caução (#8) */}
          <div className="p-3.5 bg-black/50 border border-white/10 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Calculator className="w-3.5 h-3.5" />
                Calculadora de Devolução & Acerto de Caução
              </span>
            </div>

            {/* Demonstrativo Detalhado de Aluguéis e Dias */}
            {vehicle.startDate && (
              <div className="p-3 bg-blue-950/20 border border-blue-500/30 rounded-xl space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] font-bold text-blue-300">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Memória de Cálculo dos Aluguéis (Diária Proporcional)</span>
                  </span>
                  <span className="font-mono text-[10px] text-blue-200">
                    Semanal: {formatBRL(weeklyRate)} ÷ 7 = <strong className="text-white">{formatBRL(dailyRate)}/dia</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                  <div className="bg-black/50 p-2 rounded-lg border border-white/5 space-y-0.5">
                    <span className="text-gray-400 block text-[9px]">Período Rodado</span>
                    <strong className="text-white block font-mono text-xs">{daysUsed} dia(s)</strong>
                    <span className="text-gray-400 block text-[8px] truncate">
                      {new Date(vehicle.startDate + 'T12:00:00').toLocaleDateString('pt-BR')} a {new Date(returnDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <div className="bg-black/50 p-2 rounded-lg border border-white/5 space-y-0.5">
                    <span className="text-gray-400 block text-[9px]">Total Devido do Período</span>
                    <strong className="text-amber-300 block font-mono text-xs">{formatBRL(expectedTotal)}</strong>
                    <span className="text-gray-400 block text-[8px]">
                      {missingDays > 0 ? `(30d mín. + multa ${earlyFineRatePct}%)` : `(${daysUsed}d × ${formatBRL(dailyRate)})`}
                    </span>
                  </div>

                  <div className="bg-black/50 p-2 rounded-lg border border-white/5 space-y-0.5">
                    <span className="text-gray-400 block text-[9px]">Total Já Pago</span>
                    <strong className="text-emerald-400 block font-mono text-xs">{formatBRL(totalPaid)}</strong>
                    <span className="text-gray-400 block text-[8px]">
                      {paidWeeksCount} semanal(is) paga(s)
                    </span>
                  </div>

                  <div className="bg-black/50 p-2 rounded-lg border border-white/5 space-y-0.5">
                    <span className="text-gray-400 block text-[9px]">Aluguel em Aberto</span>
                    <strong className="text-rose-300 block font-mono text-xs">{formatBRL(calculatedPendingRent)}</strong>
                    <span className="text-gray-400 block text-[8px]">
                      {calculatedPendingRent > 0 ? 'Cobrado no acerto' : '100% quitado'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1 font-semibold">
                  Caução Depositada (R$)
                </label>
                <CurrencyInput
                  value={caucaoOriginal}
                  onChange={setCaucaoOriginal}
                  placeholder="0,00"
                  className="w-full text-xs bg-[#141414] border border-emerald-500/30 rounded-lg px-2.5 py-1.5 text-emerald-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-1 font-semibold flex items-center justify-between">
                  <span>(-) Aluguéis / Dias em Aberto</span>
                  {vehicle.startDate && (
                    <span className="text-[9px] text-amber-300 font-mono">
                      ({daysUsed} dias rodados{missingDays > 0 ? ` + ${missingDays}d faltantes` : ''})
                    </span>
                  )}
                </label>
                <CurrencyInput
                  value={descontoAluguelPendente}
                  onChange={setDescontoAluguelPendente}
                  placeholder="0,00"
                  className="w-full text-xs bg-[#141414] border border-white/15 rounded-lg px-2.5 py-1.5 text-white font-mono"
                />
                {vehicle.startDate && (
                  <p className="text-[9px] text-gray-400 mt-1 italic leading-tight">
                    Calculado: Início {new Date(vehicle.startDate + 'T12:00:00').toLocaleDateString('pt-BR')} (mínimo 30 dias{missingDays > 0 ? ` + ${earlyFineRatePct}% multa` : ''}).
                  </p>
                )}
              </div>

              {missingDays > 0 ? (
                <div className="col-span-2 bg-amber-950/40 border border-amber-500/30 p-3 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                    <span>⚠️ Devolução Antes de 30 Dias (Tempo Mínimo)</span>
                    <span className="font-mono text-[10px]">{daysUsed}d rodados / {missingDays}d faltantes</span>
                  </div>
                  <p className="text-[10px] text-gray-300 leading-relaxed">
                    O contrato exige tempo mínimo de 30 dias. É cobrado o período base de 30 dias mais a multa percentual de {earlyFineRatePct}% sobre os {missingDays} dias não cumpridos.
                  </p>
                  <div className="flex items-center justify-between pt-1.5 border-t border-amber-500/20">
                    <label className="text-[10px] font-semibold text-gray-300">Multa sobre dias faltantes (% padrão 20%, editável):</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        max="100"
                        value={earlyFineRatePct}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value));
                          setEarlyFineRatePct(val);
                        }}
                        className="w-16 px-2 py-0.5 bg-black border border-amber-500/40 rounded text-amber-300 font-mono font-bold text-xs text-right"
                      />
                      <span className="text-amber-300 font-bold text-xs">%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="col-span-2 bg-white/[0.03] border border-white/10 p-2.5 rounded-xl flex items-center justify-between">
                  <div className="text-[10px] text-gray-300">
                    <span className="font-semibold text-white">Multa por Rescisão Antecipada:</span>
                    <span className="ml-1 text-[9px] text-gray-400">(Padrão fixo em 20%, editável para este contrato)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      max="100"
                      value={earlyFineRatePct}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value));
                        setEarlyFineRatePct(val);
                      }}
                      className="w-14 px-2 py-0.5 bg-black border border-white/20 rounded text-amber-300 font-mono font-bold text-xs text-right"
                    />
                    <span className="text-amber-300 font-bold text-xs">%</span>
                  </div>
                </div>
              )}

              <div className="col-span-2 sm:col-span-1">
                <label className="text-[10px] text-gray-400 block mb-1 font-semibold">
                  (-) Avarias / Reparos Vistoria
                </label>
                <CurrencyInput
                  value={descontoAvarias}
                  onChange={setDescontoAvarias}
                  placeholder="0,00"
                  className="w-full text-xs bg-[#141414] border border-white/15 rounded-lg px-2.5 py-1.5 text-white font-mono"
                />
                {(detectedDebits.periodSinistros.length > 0 || detectedDebits.periodCrashMaint.length > 0) && (
                  <p className="text-[9px] text-amber-300 mt-1 leading-tight">
                    Puxado: {detectedDebits.periodSinistros.length + detectedDebits.periodCrashMaint.length} ocorrência(s) no contrato ({formatBRL(detectedDebits.damagesTotal)})
                  </p>
                )}
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="text-[10px] text-gray-400 block mb-1 font-semibold flex items-center justify-between gap-1">
                  <span>(-) Lavagem / Higienização (se necessário)</span>
                </label>
                <CurrencyInput
                  value={descontoLavagem}
                  onChange={setDescontoLavagem}
                  placeholder="0,00"
                  className="w-full text-xs bg-[#141414] border border-white/15 rounded-lg px-2.5 py-1.5 text-white font-mono"
                />
                <div className="flex items-center justify-between gap-1 mt-1">
                  <button
                    type="button"
                    onClick={() => setDescontoLavagem(descontoLavagem === 150 ? 0 : 150)}
                    className={`text-[9px] font-bold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                      descontoLavagem === 150
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-white/5 text-gray-300 border-white/10 hover:border-amber-500/30 hover:text-amber-300'
                    }`}
                  >
                    {descontoLavagem === 150 ? '✓ R$ 150,00 (Cláusula 16ª)' : 'Aplicar R$ 150,00 (Cláusula 16ª)'}
                  </button>
                </div>
              </div>

              <div className="col-span-2 space-y-2 p-3 bg-black/40 border border-white/10 rounded-xl">
                {(() => {
                  const capNum = typeof tankCapacity === 'number' ? tankCapacity : (Number(tankCapacity) || 0);
                  const missingLiters = ((8 - returnFuelLevel) / 8) * capNum;
                  const calculatedCost = missingLiters * (fuelPrice || 0);

                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] text-gray-300 block font-semibold flex items-center gap-1.5">
                          <span>⛽ (-) Diferença de Combustível</span>
                        </label>
                        <span className="text-[10px] text-amber-300 font-mono">
                          Faltante: {missingLiters.toFixed(1)}L ({formatBRL(calculatedCost)})
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[9px] text-gray-400 block mb-0.5">Capac. Tanque (L)</label>
                          <input
                            type="number"
                            min="0"
                            max="200"
                            step="1"
                            value={tankCapacity}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') {
                                setTankCapacity('');
                              } else {
                                const num = Number(val);
                                setTankCapacity(isNaN(num) ? '' : Math.max(0, num));
                              }
                            }}
                            placeholder="0"
                            className="w-full bg-[#141414] border border-white/15 rounded-lg px-2 py-1 text-xs text-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] text-gray-400 block mb-0.5">Nível na Devolução</label>
                          <select
                            value={returnFuelLevel}
                            onChange={(e) => setReturnFuelLevel(Number(e.target.value))}
                            className="w-full bg-[#141414] border border-white/15 rounded-lg px-2 py-1 text-xs text-white font-mono cursor-pointer"
                          >
                            <option value={8}>8/8 (Cheio - 0% faltante)</option>
                            <option value={7}>7/8 (87.5% - 7/8)</option>
                            <option value={6}>6/8 (75% - 3/4)</option>
                            <option value={5}>5/8 (62.5% - 5/8)</option>
                            <option value={4}>4/8 (50% - Meio tanque)</option>
                            <option value={3}>3/8 (37.5% - 3/8)</option>
                            <option value={2}>2/8 (25% - 1/4)</option>
                            <option value={1}>1/8 (12.5% cheio)</option>
                            <option value={0}>0/8 (Vazio - 100% faltante)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[9px] text-gray-400 block mb-0.5">Preço por Litro (R$ - padrão 7,00)</label>
                          <CurrencyInput
                            value={fuelPrice}
                            onChange={setFuelPrice}
                            placeholder="7,00"
                            className="w-full bg-[#141414] border border-white/15 rounded-lg px-2 py-1 text-xs text-white font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <CurrencyInput
                            value={descontoCombustivel}
                            onChange={setDescontoCombustivel}
                            placeholder="0,00"
                            className="w-32 text-xs bg-[#141414] border border-emerald-500/30 rounded-lg px-2.5 py-1.5 text-emerald-300 font-mono font-bold"
                          />
                          <span className="text-[10px] text-gray-400">Valor cobrado (R$)</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setDescontoCombustivel(Number(calculatedCost.toFixed(2)));
                          }}
                          className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                        >
                          Aplicar Estimativa
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="text-[10px] text-gray-400 block mb-1 font-semibold flex items-center justify-between">
                  <span>(-) Multas (Trânsito + Adm.)</span>
                  {detectedDebits.finesTotal > 0 && (
                    <span className="text-[9px] text-rose-300 font-bold flex items-center gap-0.5">
                      <AlertOctagon className="w-2.5 h-2.5" />
                      {detectedDebits.pendingFines.length + detectedDebits.fineExpenses.length} em aberto
                    </span>
                  )}
                </label>
                <CurrencyInput
                  value={descontoMultas}
                  onChange={setDescontoMultas}
                  placeholder="0,00"
                  className={`w-full text-xs bg-[#141414] rounded-lg px-2.5 py-1.5 font-mono ${
                    detectedDebits.finesTotal > 0
                      ? 'border border-rose-500/40 text-rose-300 font-bold'
                      : 'border border-white/15 text-white'
                  }`}
                />
                {(detectedDebits.pendingFines.length > 0 || detectedDebits.fineExpenses.length > 0) && (
                  <div className="mt-1 space-y-0.5 text-[9px] text-rose-300/90 leading-tight">
                    {detectedDebits.pendingFines.map((f) => (
                      <p key={f.id} className="truncate">
                        • {f.descricao} ({formatBRL(getFineTotal(f))}{f.applyAdminFee ? ` c/ Taxa ${f.adminFeePct ?? 20}%` : ''})
                      </p>
                    ))}
                    {detectedDebits.fineExpenses.map((e) => (
                      <p key={e.id} className="truncate">
                        • {e.description || e.category} ({formatBRL(e.cost)})
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="text-[10px] text-gray-400 block mb-1 font-semibold flex items-center justify-between">
                  <span>(-) Pedágios / Tag</span>
                  {detectedDebits.tollsTotal > 0 && (
                    <span className="text-[9px] text-amber-300 font-bold">
                      {detectedDebits.tollExpenses.length} lançamento(s)
                    </span>
                  )}
                </label>
                <CurrencyInput
                  value={descontoPedagios}
                  onChange={setDescontoPedagios}
                  placeholder="0,00"
                  className={`w-full text-xs bg-[#141414] rounded-lg px-2.5 py-1.5 font-mono ${
                    detectedDebits.tollsTotal > 0
                      ? 'border border-amber-500/40 text-amber-300 font-bold'
                      : 'border border-white/15 text-white'
                  }`}
                />
                {detectedDebits.tollExpenses.length > 0 && (
                  <div className="mt-1 space-y-0.5 text-[9px] text-amber-300/90 leading-tight">
                    {detectedDebits.tollExpenses.map((e) => (
                      <p key={e.id} className="truncate">
                        • {e.description || e.category} ({formatBRL(e.cost)})
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="col-span-2">
                <label className="text-[10px] text-gray-400 block mb-1 font-semibold">
                  Observação do Acerto
                </label>
                <input
                  type="text"
                  value={observacoesAcerto}
                  onChange={(e) => setObservacoesAcerto(e.target.value)}
                  placeholder="Ex: Desconto para-choque, lavagem ou pedágios Sem Parar..."
                  className="w-full text-xs bg-[#141414] border border-white/15 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>
            </div>

            {/* Resultado Automático */}
            <div
              className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 ${
                saldoFinal >= 0
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold block opacity-80">
                  {saldoFinal >= 0 ? 'Saldo a Devolver ao Motorista:' : 'Saldo Devedor a Cobrar do Motorista:'}
                </span>
                <span className="text-base font-extrabold font-mono">
                  {formatBRL(saldoFinal)}
                </span>
                <p className="text-[10px] opacity-80 font-mono">
                  Caução (+{formatBRL(caucaoOriginal)}) - Total Descontos (-{formatBRL(totalDescontos)})
                </p>
              </div>

              <button
                type="button"
                onClick={handleSendSettlementWhatsApp}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="Enviar resumo do acerto de caução para o WhatsApp do motorista"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Enviar Acerto no WhatsApp</span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-300 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>O que é mantido no sistema:</span>
            </p>
            <p className="text-gray-300 text-[10px] leading-relaxed">
              O veículo continua salvo na frota para novas locações, mantendo KM atual, manutenção preventiva e dossiê arquivado em <strong className="text-amber-300">'Contratos Finalizados'</strong>.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-white/10 bg-[#181818] flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer border border-white/10"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() =>
              onConfirm({
                caucaoOriginal,
                descontoAluguelPendente,
                descontoAvarias,
                descontoLavagem,
                descontoCombustivel,
                descontoMultas,
                descontoPedagios,
                observacoesAcerto,
                saldoFinal
              })
            }
            disabled={isLoading}
            className="px-4 py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all cursor-pointer shadow-md shadow-amber-400/20 flex items-center gap-1.5 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isLoading ? 'Finalizando...' : 'Confirmar e Finalizar Contrato'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
