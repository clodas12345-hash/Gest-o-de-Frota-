import React, { useState, useMemo } from 'react';
import { Vehicle, MaintenanceLog, ExpenseLog, FuelLog, Fine } from '../types';
import { 
  X, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  Calendar, 
  Download, 
  Printer, 
  Percent, 
  ArrowUpRight, 
  ArrowDownRight, 
  Car,
  Wrench,
  Shield,
  FileText
} from 'lucide-react';
import jsPDF from 'jspdf';

interface VehicleProfitabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle;
  maintenanceLogs?: MaintenanceLog[];
  expenseLogs?: ExpenseLog[];
  fuelLogs?: FuelLog[];
  selectedMonth?: number;
  selectedYear?: number;
}

export const VehicleProfitabilityModal: React.FC<VehicleProfitabilityModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  maintenanceLogs = [],
  expenseLogs = [],
  fuelLogs = [],
  selectedMonth,
  selectedYear
}) => {
  const [viewMode, setViewMode] = useState<'month' | 'total'>('month');
  const [currentMonth, setCurrentMonth] = useState<number>(selectedMonth !== undefined ? selectedMonth : new Date().getMonth());
  const [currentYear, setCurrentYear] = useState<number>(selectedYear !== undefined ? selectedYear : new Date().getFullYear());

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Filter logs by vehicle and period
  const vehicleMaintenances = useMemo(() => {
    return maintenanceLogs.filter(m => {
      if (m.vehicleId !== vehicle.id) return false;
      if (viewMode === 'total') return true;
      if (!m.date) return false;
      const d = new Date(m.date + 'T00:00:00');
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [maintenanceLogs, vehicle.id, viewMode, currentMonth, currentYear]);

  const vehicleExpenses = useMemo(() => {
    return expenseLogs.filter(e => {
      if (e.vehicleId !== vehicle.id) return false;
      if (viewMode === 'total') return true;
      if (!e.date) return false;
      const d = new Date(e.date + 'T00:00:00');
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [expenseLogs, vehicle.id, viewMode, currentMonth, currentYear]);

  // Revenues: Weekly payments or monthly rental
  const revenueTotal = useMemo(() => {
    if (viewMode === 'month') {
      // Filter weekly payments of this month
      if (vehicle.weeklyPayments && vehicle.weeklyPayments.length > 0) {
        const sum = vehicle.weeklyPayments.reduce((acc, p) => {
          if (!p.date) return acc;
          const d = new Date(p.date + 'T00:00:00');
          if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            return acc + (p.amount || 0);
          }
          return acc;
        }, 0);
        return sum > 0 ? sum : (vehicle.valorRecebido || 0);
      }
      return vehicle.valorRecebido || 0;
    } else {
      // Historical Total
      const paymentsSum = (vehicle.weeklyPayments || []).reduce((acc, p) => acc + (p.amount || 0), 0);
      return paymentsSum > 0 ? paymentsSum : (vehicle.valorRecebido || 0);
    }
  }, [vehicle, viewMode, currentMonth, currentYear]);

  // Fixed Monthly Expenses
  const fixedFinanciamento = vehicle.financiamento || 0;
  const fixedSeguro = vehicle.seguro || 0;
  const fixedIpva = vehicle.ipva || 0;
  const fixedExtra = vehicle.custoExtra || 0;

  // Variable Expenses
  const maintenanceCost = vehicleMaintenances.reduce((acc, m) => acc + (m.cost || 0), 0);
  const otherExpensesCost = vehicleExpenses.reduce((acc, e) => acc + (e.cost || 0), 0);

  // Total Expenses
  const totalExpenses = (viewMode === 'month')
    ? (fixedFinanciamento + fixedSeguro + fixedIpva + fixedExtra + maintenanceCost + otherExpensesCost)
    : (maintenanceCost + otherExpensesCost + fixedFinanciamento + fixedSeguro + fixedIpva + fixedExtra);

  // Net Profit & Margin
  const netProfit = revenueTotal - totalExpenses;
  const marginPercent = revenueTotal > 0 ? (netProfit / revenueTotal) * 100 : 0;

  if (!isOpen) return null;

  const handleExportDRE_PDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 32, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('DEMONSTRATIVO DE RESULTADO (DRE) DO VEÍCULO', 14, 15);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 190, 205);
    doc.text(
      `Veículo: ${vehicle.brand} ${vehicle.model} (${vehicle.plate}) | Motorista: ${vehicle.driver || 'Não informado'} | Período: ${viewMode === 'month' ? `${months[currentMonth]}/${currentYear}` : 'Histórico Total'}`,
      14,
      24
    );

    let y = 42;

    // Summary Cards Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y, 182, 30, 2, 2, 'F');

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('RECEITA TOTAL', 22, y + 8);
    doc.text('CUSTOS & DESPESAS', 82, y + 8);
    doc.text('LUCRO LÍQUIDO REAL', 142, y + 8);

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text(`R$ ${revenueTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 22, y + 17);

    doc.setTextColor(225, 29, 72);
    doc.text(`R$ ${totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 82, y + 17);

    if (netProfit >= 0) {
      doc.setTextColor(16, 185, 129);
    } else {
      doc.setTextColor(225, 29, 72);
    }
    doc.text(`R$ ${netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 142, y + 17);

    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Margem Líquida: ${marginPercent.toFixed(1)}%`, 142, y + 24);

    y += 40;

    // Line Items Breakdown Table
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('DETALHAMENTO DE RECEITAS E DESPESAS', 14, y);
    y += 6;

    // Table Header
    doc.setFillColor(226, 232, 240);
    doc.rect(14, y, 182, 7, 'F');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text('DESCRIÇÃO DO LANÇAMENTO', 18, y + 5);
    doc.text('CATEGORIA', 120, y + 5);
    doc.text('VALOR (R$)', 165, y + 5);
    y += 8;

    const items = [
      { desc: 'Receita com Locação / Semanalidades', cat: 'Receita', val: revenueTotal, isIncome: true },
      { desc: 'Financiamento / Parcela do Carro', cat: 'Fixo', val: fixedFinanciamento, isIncome: false },
      { desc: 'Seguro Veicular', cat: 'Fixo', val: fixedSeguro, isIncome: false },
      { desc: 'IPVA / Licenciamento', cat: 'Fixo', val: fixedIpva, isIncome: false },
      ...(fixedExtra > 0 ? [{ desc: vehicle.custoExtraLabel || 'Rastreador / Custos Extras', cat: 'Fixo', val: fixedExtra, isIncome: false }] : []),
      { desc: `Manutenções e Oficinas (${vehicleMaintenances.length} registros)`, cat: 'Variável', val: maintenanceCost, isIncome: false },
      ...(otherExpensesCost > 0 ? [{ desc: `Outras Despesas (${vehicleExpenses.length} registros)`, cat: 'Variável', val: otherExpensesCost, isIncome: false }] : []),
    ];

    items.forEach((item, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y - 2, 182, 6, 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text(item.desc, 18, y + 2.5);
      doc.text(item.cat, 120, y + 2.5);

      if (item.isIncome) {
        doc.setTextColor(16, 185, 129);
        doc.text(`+ R$ ${item.val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 165, y + 2.5);
      } else {
        doc.setTextColor(225, 29, 72);
        doc.text(`- R$ ${item.val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 165, y + 2.5);
      }

      y += 6;
    });

    // Total Line
    y += 4;
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('LUCRO LÍQUIDO FINAL', 18, y + 5.5);
    if (netProfit >= 0) {
      doc.setTextColor(16, 185, 129);
      doc.text(`+ R$ ${netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 165, y + 5.5);
    } else {
      doc.setTextColor(225, 29, 72);
      doc.text(`- R$ ${Math.abs(netProfit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 165, y + 5.5);
    }

    doc.save(`dre_${vehicle.plate}_${viewMode === 'month' ? `${months[currentMonth]}_${currentYear}` : 'total'}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[110] p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#121214] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-[#18181b]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                DRE & Rentabilidade do Veículo
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {vehicle.plate}
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                {vehicle.brand} {vehicle.model} • Cálculo de Lucro Líquido Real, Margem e Custos Operacionais
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportDRE_PDF}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-900/30"
              title="Baixar Demonstrativo DRE em PDF"
            >
              <Download className="w-4 h-4" />
              <span>Baixar DRE (PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-black/40 border-b border-white/10">
          <div className="flex items-center gap-2 bg-[#1e1e24] p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'month' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              Visão Mensal
            </button>
            <button
              onClick={() => setViewMode('total')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'total' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              Histórico Geral
            </button>
          </div>

          {viewMode === 'month' && (
            <div className="flex items-center gap-2">
              <select
                value={currentMonth}
                onChange={(e) => setCurrentMonth(Number(e.target.value))}
                className="bg-[#1e1e24] border border-white/10 text-white text-xs rounded-xl p-2 font-medium focus:outline-hidden focus:border-emerald-500 cursor-pointer"
              >
                {months.map((m, idx) => (
                  <option key={idx} value={idx}>{m}</option>
                ))}
              </select>
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(Number(e.target.value))}
                className="bg-[#1e1e24] border border-white/10 text-white text-xs rounded-xl p-2 font-medium focus:outline-hidden focus:border-emerald-500 cursor-pointer"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Revenue */}
            <div className="bg-[#16161a] border border-emerald-500/20 rounded-2xl p-4 relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Receitas Brutas</span>
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
              <p className="text-xl font-mono font-bold text-emerald-400 mt-2">
                R$ {revenueTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                {vehicle.weeklyPayments?.length || 0} parcelas registradas
              </p>
            </div>

            {/* Total Expenses */}
            <div className="bg-[#16161a] border border-rose-500/20 rounded-2xl p-4 relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Custos e Despesas</span>
                <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
                  <ArrowDownRight className="w-4 h-4" />
                </span>
              </div>
              <p className="text-xl font-mono font-bold text-rose-400 mt-2">
                R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                Fixos (Financ, Seguro, IPVA) + Variáveis (Oficina)
              </p>
            </div>

            {/* Net Profit */}
            <div className={`border rounded-2xl p-4 relative overflow-hidden shadow-lg ${
              netProfit >= 0 ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-rose-500/5 border-rose-500/30'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Lucro Líquido Real</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  netProfit >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {marginPercent.toFixed(1)}% Margem
                </span>
              </div>
              <p className={`text-xl font-mono font-bold mt-2 ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                R$ {netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                {netProfit >= 0 ? 'Veículo gerando superávit' : 'Veículo em déficit no período'}
              </p>
            </div>
          </div>

          {/* Detailed Financial Breakdown */}
          <div className="bg-[#16161a] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              Detalhamento de Entradas e Saídas
            </h3>

            <div className="divide-y divide-white/5">
              {/* Entradas */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <div>
                    <p className="text-xs font-bold text-white">Aluguéis Recebidos (Semanalidades)</p>
                    <p className="text-[10px] text-gray-400">Locatário: {vehicle.driver || 'Não atribuído'}</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  + R$ {revenueTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Custos Fixos */}
              {fixedFinanciamento > 0 && (
                <div className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <div>
                      <p className="text-xs font-medium text-gray-200">Financiamento do Veículo</p>
                      <p className="text-[10px] text-gray-500">Parcela mensal fixa</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-medium text-rose-400">
                    - R$ {fixedFinanciamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {fixedSeguro > 0 && (
                <div className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <div>
                      <p className="text-xs font-medium text-gray-200">Seguro e Proteção Veicular</p>
                      <p className="text-[10px] text-gray-500">Parcela mensal fixa</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-medium text-rose-400">
                    - R$ {fixedSeguro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {fixedIpva > 0 && (
                <div className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <div>
                      <p className="text-xs font-medium text-gray-200">IPVA e Licenciamento</p>
                      <p className="text-[10px] text-gray-500">Custo anual fracionado</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-medium text-rose-400">
                    - R$ {fixedIpva.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {fixedExtra > 0 && (
                <div className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <div>
                      <p className="text-xs font-medium text-gray-200">{vehicle.custoExtraLabel || 'Rastreador / Custos Extras'}</p>
                      <p className="text-[10px] text-gray-500">Custo mensal adicional</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-medium text-rose-400">
                    - R$ {fixedExtra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {/* Manutenção */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div>
                    <p className="text-xs font-medium text-gray-200">Manutenções e Peças</p>
                    <p className="text-[10px] text-gray-500">{vehicleMaintenances.length} lançamentos no período</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-medium text-rose-400">
                  - R$ {maintenanceCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Outras Despesas */}
              {otherExpensesCost > 0 && (
                <div className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                    <div>
                      <p className="text-xs font-medium text-gray-200">Outras Despesas Avulsas</p>
                      <p className="text-[10px] text-gray-500">{vehicleExpenses.length} lançamentos no período</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-medium text-rose-400">
                    - R$ {otherExpensesCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
