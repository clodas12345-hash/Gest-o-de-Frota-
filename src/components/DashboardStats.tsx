import { Vehicle, FuelLog, MaintenanceLog, TripLog, ExpenseLog } from '../types';
import { DollarSign, Fuel, Wrench, Landmark, Coins, Wallet, TrendingUp, TrendingDown } from 'lucide-react';

interface DashboardStatsProps {
  vehicles: Vehicle[];
  fuelLogs: FuelLog[];
  maintenanceLogs: MaintenanceLog[];
  tripLogs: TripLog[];
  expenseLogs: ExpenseLog[];
  selectedMonth?: number;
  selectedYear?: number;
}

export function DashboardStats({
  vehicles,
  fuelLogs,
  maintenanceLogs,
  tripLogs,
  expenseLogs,
  selectedMonth,
  selectedYear,
}: DashboardStatsProps) {
  // Compute selected month/year (defaults to August 2026)
  const currentMonth = selectedMonth !== undefined ? selectedMonth : 7; // 7 (0-indexed, August)
  const currentYear = selectedYear !== undefined ? selectedYear : 2026; // 2026

  // Helper to check if a date string belongs to current month and year
  const isCurrentMonth = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr + 'T12:00:00');
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  };

  // 1. Total Valor Recebido (Revenue)
  const totalValorRecebido = vehicles.reduce((sum, v) => {
    const totalWeeklyInCurrentMonth = (v.weeklyPayments || [])
      .filter((wp) => isCurrentMonth(wp.date))
      .reduce((s, wp) => s + wp.amount, 0);
    const hasWeeklyPayments = (v.weeklyPayments || [])
      .some((wp) => isCurrentMonth(wp.date));
    const effectiveValorRecebido = hasWeeklyPayments
      ? totalWeeklyInCurrentMonth
      : (v.valorRecebido || 0);
    return sum + effectiveValorRecebido;
  }, 0);

  // 2. Total Despesas Fixas (Financiamento, Seguro, IPVA, Manutenção Preventiva, Custo Extra)
  const totalFinanciamento = vehicles.reduce((sum, v) => sum + (v.financiamento || 0), 0);
  const totalSeguro = vehicles.reduce((sum, v) => sum + (v.seguro || 0), 0);
  const totalIpva = vehicles.reduce((sum, v) => sum + (v.ipva || 0), 0);
  const totalManutencaoPreventiva = vehicles.reduce((sum, v) => sum + (v.manutencaoPreventiva || 0), 0);
  const totalCustoExtra = vehicles.reduce((sum, v) => sum + (v.custoExtra || 0), 0);

  const totalDespesasFixas = totalFinanciamento + totalSeguro + totalIpva + totalManutencaoPreventiva + totalCustoExtra;

  // 3. Despesas Adicionais/Variáveis do Mês (maintenance logs, expense logs)
  const currentMonthMaintenance = maintenanceLogs
    .filter((log) => isCurrentMonth(log.date))
    .reduce((sum, log) => sum + log.cost, 0);

  const currentMonthExpenses = expenseLogs
    .filter((log) => isCurrentMonth(log.date))
    .reduce((sum, log) => sum + log.cost, 0);

  const totalDespesasAdicionais = currentMonthMaintenance + currentMonthExpenses;

  // 4. Saldo Final / Quanto Sobra
  const sobraTotal = totalValorRecebido - totalDespesasFixas - totalDespesasAdicionais;

  // Formatter for currency
  const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div id="dashboard-stats" className="grid grid-cols-2 gap-4 max-w-3xl mx-auto">
      
      {/* Card 1: Valor Recebido Total (RECEITA) */}
      <div id="stat-card-received" className="bg-[#111111] border border-emerald-500/10 rounded-2xl p-4 shadow-lg text-white hover:border-emerald-500/20 transition-all shadow-[0_0_20px_rgba(16,185,129,0.02)] flex flex-col justify-between min-h-[145px]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Receita</span>
          <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-xl md:text-2xl font-black font-mono text-emerald-400">{formatBRL(totalValorRecebido)}</span>
          
          {/* Per-vehicle split */}
          <div className="mt-2.5 pt-2 border-t border-emerald-500/10 space-y-1">
            {vehicles.map((v) => {
              const totalWeeklyInCurrentMonth = (v.weeklyPayments || [])
                .filter((wp) => isCurrentMonth(wp.date))
                .reduce((s, wp) => s + wp.amount, 0);
              const hasWeeklyPayments = (v.weeklyPayments || [])
                .some((wp) => isCurrentMonth(wp.date));
              const effectiveValorRecebido = hasWeeklyPayments
                ? totalWeeklyInCurrentMonth
                : (v.valorRecebido || 0);

              return (
                <div 
                  key={v.id} 
                  className="flex justify-between items-center text-[10px] text-gray-400 hover:bg-white/5 p-0.5 rounded cursor-pointer transition-colors"
                  onClick={() => window.dispatchEvent(new CustomEvent('focus-vehicle', { detail: { vehicleId: v.id } }))}
                  title={`Clique para focar no ${v.brand} ${v.model} (${v.plate})`}
                >
                  <span className="truncate max-w-[110px] font-medium text-gray-300">
                    {v.brand} {v.model.split(' ')[0]} ({v.plate})
                  </span>
                  <span className="font-mono font-semibold text-emerald-400/90">{formatBRL(effectiveValorRecebido)}</span>
                </div>
              );
            })}
          </div>

          <span className="text-[10px] text-gray-500 mt-2 border-t border-white/[0.02] pt-1">
            Total de <strong className="text-gray-300 font-semibold">{vehicles.length}</strong> carros ativos
          </span>
        </div>
      </div>

      {/* Card 2: Despesas Fixas Totais */}
      <div id="stat-card-fixed" className="bg-[#111111] border border-rose-500/10 rounded-2xl p-4 shadow-lg text-gray-200 hover:border-rose-500/20 transition-all shadow-[0_0_20px_rgba(244,63,94,0.02)] flex flex-col justify-between min-h-[145px]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Despesas Fixas</span>
          <div className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20">
            <TrendingDown className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-xl md:text-2xl font-black font-mono text-rose-400">{formatBRL(totalDespesasFixas)}</span>
          
          {/* Per-vehicle split */}
          <div className="mt-2.5 pt-2 border-t border-rose-500/10 space-y-1">
            {vehicles.map((v) => {
              const vFinanciamento = v.financiamento || 0;
              const vSeguro = v.seguro || 0;
              const vIpva = v.ipva || 0;
              const vManutencaoPreventiva = v.manutencaoPreventiva || 0;
              const vCustoExtra = v.custoExtra || 0;
              const vDespesasFixas = vFinanciamento + vSeguro + vIpva + vManutencaoPreventiva + vCustoExtra;

              return (
                <div 
                  key={v.id} 
                  className="flex justify-between items-center text-[10px] text-gray-400 hover:bg-white/5 p-0.5 rounded cursor-pointer transition-colors"
                  onClick={() => window.dispatchEvent(new CustomEvent('focus-vehicle', { detail: { vehicleId: v.id } }))}
                  title={`Clique para focar no ${v.brand} ${v.model} (${v.plate})`}
                >
                  <span className="truncate max-w-[110px] font-medium text-gray-300">
                    {v.brand} {v.model.split(' ')[0]} ({v.plate})
                  </span>
                  <span className="font-mono font-semibold text-rose-400/90">{formatBRL(vDespesasFixas)}</span>
                </div>
              );
            })}
          </div>

          <span className="text-[10px] text-gray-500 mt-2 border-t border-white/[0.02] pt-1">
            Financiamento, Seguro, IPVA, Prev.
          </span>
        </div>
      </div>

      {/* Card 3: Despesas Adicionais (VARIAVEIS) */}
      <div id="stat-card-variable" className="bg-[#111111] border border-amber-500/10 rounded-2xl p-4 shadow-lg text-gray-200 hover:border-amber-500/20 transition-all flex flex-col justify-between min-h-[145px]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Variáveis</span>
          <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
            <Wrench className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-xl md:text-2xl font-black font-mono text-amber-500">{formatBRL(totalDespesasAdicionais)}</span>
          
          {/* Per-vehicle split */}
          <div className="mt-2.5 pt-2 border-t border-amber-500/10 space-y-1">
            {vehicles.map((v) => {
              const vMaintenance = maintenanceLogs
                .filter((log) => log.vehicleId === v.id && isCurrentMonth(log.date))
                .reduce((s, log) => s + log.cost, 0);
              const vExpenses = expenseLogs
                .filter((log) => log.vehicleId === v.id && isCurrentMonth(log.date))
                .reduce((s, log) => s + log.cost, 0);
              const vDespesasAdicionais = vMaintenance + vExpenses;

              return (
                <div 
                  key={v.id} 
                  className="flex justify-between items-center text-[10px] text-gray-400 hover:bg-white/5 p-0.5 rounded cursor-pointer transition-colors"
                  onClick={() => window.dispatchEvent(new CustomEvent('focus-vehicle', { detail: { vehicleId: v.id } }))}
                  title={`Clique para focar no ${v.brand} ${v.model} (${v.plate})`}
                >
                  <span className="truncate max-w-[110px] font-medium text-gray-300">
                    {v.brand} {v.model.split(' ')[0]} ({v.plate})
                  </span>
                  <span className="font-mono font-semibold text-amber-500/90">{formatBRL(vDespesasAdicionais)}</span>
                </div>
              );
            })}
          </div>

          <span className="text-[10px] text-gray-500 mt-2 border-t border-white/[0.02] pt-1">
            Manutenções e Despesas Eventuais
          </span>
        </div>
      </div>

      {/* Card 4: Saldo Sobra Líquida (Quanto Sobra) */}
      <div id="stat-card-sobra" className={`bg-[#111111] border rounded-2xl p-4 shadow-lg text-white hover:shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all flex flex-col justify-between min-h-[145px] ${sobraTotal >= 0 ? 'border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.05)]' : 'border-rose-500/25 shadow-[0_0_20px_rgba(244,63,94,0.05)]'}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Quanto Sobra</span>
          <div className={`p-1.5 rounded-lg border ${sobraTotal >= 0 ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
            <Wallet className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex flex-col">
          <span className={`text-xl md:text-2xl font-black font-mono ${sobraTotal >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>{formatBRL(sobraTotal)}</span>
          
          {/* Per-vehicle split */}
          <div className={`mt-2.5 pt-2 border-t space-y-1 ${sobraTotal >= 0 ? 'border-blue-500/10' : 'border-rose-500/10'}`}>
            {vehicles.map((v) => {
              const totalWeeklyInCurrentMonth = (v.weeklyPayments || [])
                .filter((wp) => isCurrentMonth(wp.date))
                .reduce((s, wp) => s + wp.amount, 0);
              const hasWeeklyPayments = (v.weeklyPayments || [])
                .some((wp) => isCurrentMonth(wp.date));
              const vReceita = hasWeeklyPayments
                ? totalWeeklyInCurrentMonth
                : (v.valorRecebido || 0);

              const vFinanciamento = v.financiamento || 0;
              const vSeguro = v.seguro || 0;
              const vIpva = v.ipva || 0;
              const vManutencaoPreventiva = v.manutencaoPreventiva || 0;
              const vCustoExtra = v.custoExtra || 0;
              const vDespesasFixas = vFinanciamento + vSeguro + vIpva + vManutencaoPreventiva + vCustoExtra;

              const vMaintenance = maintenanceLogs
                .filter((log) => log.vehicleId === v.id && isCurrentMonth(log.date))
                .reduce((s, log) => s + log.cost, 0);
              const vExpenses = expenseLogs
                .filter((log) => log.vehicleId === v.id && isCurrentMonth(log.date))
                .reduce((s, log) => s + log.cost, 0);
              const vDespesasAdicionais = vMaintenance + vExpenses;

              const vSobra = vReceita - vDespesasFixas - vDespesasAdicionais;

              return (
                <div 
                  key={v.id} 
                  className="flex justify-between items-center text-[10px] text-gray-400 hover:bg-white/5 p-0.5 rounded cursor-pointer transition-colors"
                  onClick={() => window.dispatchEvent(new CustomEvent('focus-vehicle', { detail: { vehicleId: v.id } }))}
                  title={`Clique para focar no ${v.brand} ${v.model} (${v.plate})`}
                >
                  <span className="truncate max-w-[110px] font-medium text-gray-300">
                    {v.brand} {v.model.split(' ')[0]} ({v.plate})
                  </span>
                  <span className={`font-mono font-semibold ${vSobra >= 0 ? 'text-blue-400/90' : 'text-rose-400/90'}`}>{formatBRL(vSobra)}</span>
                </div>
              );
            })}
          </div>

          <span className="text-[10px] text-gray-500 mt-2 border-t border-white/[0.02] pt-1">
            Resultado Líquido do Mês
          </span>
        </div>
      </div>

    </div>
  );
}
