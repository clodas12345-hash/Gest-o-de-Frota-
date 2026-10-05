import { Vehicle, FuelLog, MaintenanceLog, ExpenseLog } from '../types';
import { DollarSign, Fuel, Wrench, Landmark, Coins, Wallet, TrendingUp, TrendingDown } from 'lucide-react';

interface DashboardStatsProps {
  vehicles: Vehicle[];
  fuelLogs: FuelLog[];
  maintenanceLogs: MaintenanceLog[];
  expenseLogs: ExpenseLog[];
  selectedMonth?: number;
  selectedYear?: number;
}

export function DashboardStats({
  vehicles,
  fuelLogs,
  maintenanceLogs,
  expenseLogs,
  selectedMonth,
  selectedYear,
}: DashboardStatsProps) {
  // Compute selected month/year (defaults to current month and year)
  const currentMonth = selectedMonth !== undefined ? selectedMonth : new Date().getMonth();
  const currentYear = selectedYear !== undefined ? selectedYear : new Date().getFullYear();

  // Helper to check if a date string belongs to current month and year
  const isCurrentMonth = (dateStr: string) => {
    if (!dateStr) return false;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      return m === currentMonth && y === currentYear;
    }
    return false;
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
  const totalFinanciamento = vehicles.reduce((sum, v) => {
    if (v.financiamentoParcelasTotais && v.financiamentoParcelasTotais > 0) {
      if ((v.financiamentoParcelasPagas || 0) >= v.financiamentoParcelasTotais) return sum;
    }
    return sum + (v.financiamento || 0);
  }, 0);

  const totalSeguro = vehicles.reduce((sum, v) => {
    if (v.seguroParcelasTotais && v.seguroParcelasTotais > 0) {
      if ((v.seguroParcelasPagas || 0) >= v.seguroParcelasTotais) return sum;
    }
    return sum + (v.seguro || 0);
  }, 0);

  const totalIpva = vehicles.reduce((sum, v) => {
    if (v.ipvaParcelasTotais && v.ipvaParcelasTotais > 0) {
      if ((v.ipvaParcelasPagas || 0) >= v.ipvaParcelasTotais) return sum;
    }
    return sum + (v.ipva || 0);
  }, 0);

  const totalManutencaoPreventiva = vehicles.reduce((sum, v) => {
    if (v.manutencaoParcelasTotais && v.manutencaoParcelasTotais > 0) {
      if ((v.manutencaoParcelasPagas || 0) >= v.manutencaoParcelasTotais) return sum;
    }
    return sum + (v.manutencaoPreventiva || 0);
  }, 0);
  
  const totalCustoExtra = vehicles.reduce((sum, v) => {
    if (!v.extraExpenses || v.extraExpenses.length === 0) {
      return sum + (v.custoExtra || 0);
    }
    
    const activeExtraExpenses = v.extraExpenses.reduce((eSum, exp) => {
      // If no total installments set, it's a permanent fixed expense
      if (!exp.parcelasTotais || exp.parcelasTotais <= 0) return eSum + (exp.value || 0);
      
      // If no start date, we can't compute current installment relative to month, 
      // so we assume it's always active if parcelasPagas < parcelasTotais (simplified)
      if (!exp.startDate) {
         return (exp.parcelasPagas || 0) < exp.parcelasTotais ? eSum + (exp.value || 0) : eSum;
      }
      
      // Compute installment number for current selected month/year
      const [startYear, startMonth] = exp.startDate.split('-').map(Number);
      const monthsDiff = (currentYear - startYear) * 12 + (currentMonth - (startMonth - 1));
      const parcelaBase = exp.parcelasPagas || 1;
      const currentParcela = parcelaBase + monthsDiff;
      
      // Only add to sum if currentParcela is between 1 and parcelasTotais
      if (currentParcela >= 1 && currentParcela <= exp.parcelasTotais) {
        return eSum + (exp.value || 0);
      }
      return eSum;
    }, 0);
    
    return sum + activeExtraExpenses;
  }, 0);

  const totalDespesasFixas = totalFinanciamento + totalSeguro + totalIpva + totalManutencaoPreventiva + totalCustoExtra;

  // 3. Despesas Adicionais/Variáveis do Mês (maintenance logs, expense logs)
  const currentMonthMaintenance = maintenanceLogs
    .reduce((sum, log) => {
      if (log.parcelasTotais && log.parcelasTotais > 1) {
        // Compute if it's active in the current month
        const [logYear, logMonth] = log.date.split('-').map(Number);
        const monthsDiff = (currentYear - logYear) * 12 + (currentMonth - (logMonth - 1));
        const parcelaBase = log.parcelasPagas || 1;
        const currentParcela = parcelaBase + monthsDiff;
        
        if (currentParcela >= 1 && currentParcela <= log.parcelasTotais) {
          return sum + (log.cost / log.parcelasTotais);
        }
        return sum;
      }
      
      // Regular single payment maintenance
      return isCurrentMonth(log.date) ? sum + log.cost : sum;
    }, 0);

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
    <div id="dashboard-stats" className="grid grid-cols-2 gap-2.5 sm:gap-4 max-w-3xl mx-auto">
      
      {/* Card 1: Valor Recebido Total (RECEITA) */}
      <div id="stat-card-received" className="bg-[#111111] border border-white/10 rounded-2xl p-3 sm:p-4 shadow-md text-white hover:border-white/20 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400">Receita</span>
          <div className="p-1 sm:p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 shrink-0">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-sm sm:text-lg md:text-xl font-bold font-mono text-emerald-400 tracking-tight whitespace-nowrap">{formatBRL(totalValorRecebido)}</span>
          
          {/* Per-vehicle split */}
          <div className="mt-2 pt-1.5 border-t border-white/5 space-y-1">
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
                  className="flex justify-between items-center text-[9px] sm:text-[10px] text-gray-400 hover:bg-white/5 p-0.5 rounded cursor-pointer transition-colors"
                  onClick={() => window.dispatchEvent(new CustomEvent('focus-vehicle', { detail: { vehicleId: v.id } }))}
                  title={`Clique para focar no ${v.brand} ${v.model} (${v.plate})`}
                >
                  <span className="truncate max-w-[65px] sm:max-w-[110px] font-medium text-gray-300">
                    {v.brand} {v.model.split(' ')[0]}
                  </span>
                  <span className="font-mono font-medium text-emerald-400/90 shrink-0 pl-1">{formatBRL(effectiveValorRecebido)}</span>
                </div>
              );
            })}
          </div>

          <span className="text-[9px] sm:text-[10px] text-gray-500 mt-2 border-t border-white/5 pt-1 truncate">
            Total de <strong className="text-gray-300 font-semibold">{vehicles.length}</strong> carros
          </span>
        </div>
      </div>

      {/* Card 2: Despesas Fixas Totais */}
      <div id="stat-card-fixed" className="bg-[#111111] border border-white/10 rounded-2xl p-3 sm:p-4 shadow-md text-gray-200 hover:border-white/20 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400">Despesas Fixas</span>
          <div className="p-1 sm:p-1.5 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20 shrink-0">
            <TrendingDown className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-sm sm:text-lg md:text-xl font-bold font-mono text-rose-400 tracking-tight whitespace-nowrap">{formatBRL(totalDespesasFixas)}</span>
          
          {/* Per-vehicle split */}
          <div className="mt-2 pt-1.5 border-t border-white/5 space-y-1">
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
                  className="flex justify-between items-center text-[9px] sm:text-[10px] text-gray-400 hover:bg-white/5 p-0.5 rounded cursor-pointer transition-colors"
                  onClick={() => window.dispatchEvent(new CustomEvent('focus-vehicle', { detail: { vehicleId: v.id } }))}
                  title={`Clique para focar no ${v.brand} ${v.model} (${v.plate})`}
                >
                  <span className="truncate max-w-[65px] sm:max-w-[110px] font-medium text-gray-300">
                    {v.brand} {v.model.split(' ')[0]}
                  </span>
                  <span className="font-mono font-medium text-rose-400/90 shrink-0 pl-1">{formatBRL(vDespesasFixas)}</span>
                </div>
              );
            })}
          </div>

          <span className="text-[9px] sm:text-[10px] text-gray-500 mt-2 border-t border-white/5 pt-1 truncate">
            Financ., Seguro, IPVA, Prev.
          </span>
        </div>
      </div>

      {/* Card 3: Despesas Adicionais (VARIAVEIS) */}
      <div id="stat-card-variable" className="bg-[#111111] border border-white/10 rounded-2xl p-3 sm:p-4 shadow-md text-gray-200 hover:border-white/20 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400">Variáveis</span>
          <div className="p-1 sm:p-1.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20 shrink-0">
            <Wrench className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-sm sm:text-lg md:text-xl font-bold font-mono text-amber-300 tracking-tight whitespace-nowrap">{formatBRL(totalDespesasAdicionais)}</span>
          
          {/* Per-vehicle split */}
          <div className="mt-2 pt-1.5 border-t border-white/5 space-y-1">
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
                  className="flex justify-between items-center text-[9px] sm:text-[10px] text-gray-400 hover:bg-white/5 p-0.5 rounded cursor-pointer transition-colors"
                  onClick={() => window.dispatchEvent(new CustomEvent('focus-vehicle', { detail: { vehicleId: v.id } }))}
                  title={`Clique para focar no ${v.brand} ${v.model} (${v.plate})`}
                >
                  <span className="truncate max-w-[65px] sm:max-w-[110px] font-medium text-gray-300">
                    {v.brand} {v.model.split(' ')[0]}
                  </span>
                  <span className="font-mono font-medium text-amber-300/90 shrink-0 pl-1">{formatBRL(vDespesasAdicionais)}</span>
                </div>
              );
            })}
          </div>

          <span className="text-[9px] sm:text-[10px] text-gray-500 mt-2 border-t border-white/5 pt-1 truncate">
            Manutenções e Despesas
          </span>
        </div>
      </div>

      {/* Card 4: Saldo Sobra Líquida (Quanto Sobra) */}
      <div id="stat-card-sobra" className="bg-[#111111] border border-white/10 rounded-2xl p-3 sm:p-4 shadow-md text-white hover:border-white/20 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-gray-300">Quanto Sobra</span>
          <div className={`p-1 sm:p-1.5 rounded-lg border shrink-0 ${sobraTotal >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
            <Wallet className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex flex-col">
          <span className={`text-sm sm:text-lg md:text-xl font-bold font-mono tracking-tight whitespace-nowrap ${sobraTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatBRL(sobraTotal)}</span>
          
          {/* Per-vehicle split */}
          <div className="mt-2 pt-1.5 border-t border-white/5 space-y-1">
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
                  className="flex justify-between items-center text-[9px] sm:text-[10px] text-gray-400 hover:bg-white/5 p-0.5 rounded cursor-pointer transition-colors"
                  onClick={() => window.dispatchEvent(new CustomEvent('focus-vehicle', { detail: { vehicleId: v.id } }))}
                  title={`Clique para focar no ${v.brand} ${v.model} (${v.plate})`}
                >
                  <span className="truncate max-w-[65px] sm:max-w-[110px] font-medium text-gray-300">
                    {v.brand} {v.model.split(' ')[0]}
                  </span>
                  <span className={`font-mono font-medium shrink-0 pl-1 ${vSobra >= 0 ? 'text-emerald-400/90' : 'text-rose-400/90'}`}>{formatBRL(vSobra)}</span>
                </div>
              );
            })}
          </div>

          <span className="text-[9px] sm:text-[10px] text-gray-500 mt-2 border-t border-white/5 pt-1 truncate">
            Resultado Líquido do Mês
          </span>
        </div>
      </div>

    </div>
  );
}
