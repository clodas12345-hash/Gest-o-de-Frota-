import { useState } from 'react';
import { Vehicle, MaintenanceLog, ExpenseLog } from '../types';
import { DollarSign, ChevronDown, ChevronUp, BarChart3, PieChart } from 'lucide-react';

interface VisualChartsProps {
  vehicles: Vehicle[];
  fuelLogs?: any[]; // Keep in props interface so we don't break App.tsx signature
  maintenanceLogs: MaintenanceLog[];
  expenseLogs: ExpenseLog[];
  selectedMonth?: number;
  selectedYear?: number;
  defaultExpanded?: boolean;
}

export function VisualCharts({
  vehicles,
  maintenanceLogs,
  expenseLogs,
  selectedMonth,
  selectedYear,
  defaultExpanded = false,
}: VisualChartsProps) {
  const [isComparisonExpanded, setIsComparisonExpanded] = useState(defaultExpanded);
  const [isDistributionExpanded, setIsDistributionExpanded] = useState(defaultExpanded);

  const currentMonth = selectedMonth !== undefined ? selectedMonth : 7; // 7 (0-indexed, August)
  const currentYear = selectedYear !== undefined ? selectedYear : 2026;

  const isCurrentMonth = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr + 'T12:00:00');
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  };

  // Calculate totals per vehicle for current month
  const getVehicleStats = (vId: string) => {
    const vehicle = vehicles.find((v) => v.id === vId);
    if (!vehicle) return { rental: 0, maintenance: 0, other: 0, total: 0 };

    const rental = (vehicle.financiamento || 0) + 
                   (vehicle.seguro || 0) + 
                   (vehicle.ipva || 0) + 
                   (vehicle.manutencaoPreventiva || 0);

    const maintenance = maintenanceLogs
      .filter((log) => log.vehicleId === vId && isCurrentMonth(log.date))
      .reduce((sum, log) => sum + log.cost, 0);

    const other = (vehicle.custoExtra || 0) + expenseLogs
      .filter((log) => log.vehicleId === vId && isCurrentMonth(log.date))
      .reduce((sum, log) => sum + log.cost, 0);

    return {
      rental,
      maintenance,
      other,
      total: rental + maintenance + other,
    };
  };

  const car1Stats = getVehicleStats(vehicles[0]?.id || '');
  const car2Stats = getVehicleStats(vehicles[1]?.id || '');

  // Category aggregations for budget breakdown
  const totalRental = car1Stats.rental + car2Stats.rental;
  const totalMaint = car1Stats.maintenance + car2Stats.maintenance;
  const totalOther = car1Stats.other + car2Stats.other;
  const grandTotal = totalRental + totalMaint + totalOther;

  // Percentage calculations
  const rentalPct = grandTotal > 0 ? (totalRental / grandTotal) * 100 : 0;
  const maintPct = grandTotal > 0 ? (totalMaint / grandTotal) * 100 : 0;
  const otherPct = grandTotal > 0 ? (totalOther / grandTotal) * 100 : 0;

  // Formatting currency helper
  const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Compute maximum value for scaling the vertical bars in SVG
  const maxVal = Math.max(
    car1Stats.rental, car1Stats.maintenance, car1Stats.other,
    car2Stats.rental, car2Stats.maintenance, car2Stats.other,
    500 // minimum scale limit
  ) * 1.15; // 15% padding at top

  // Scale height function (assuming SVG height is 160)
  const getBarHeight = (value: number) => {
    return (value / maxVal) * 150;
  };

  return (
    <div id="visual-charts-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Comparativo de Despesas Individuais (SVG Column Chart) */}
        <div id="chart-comparison" className="bg-[#111111] border border-white/5 rounded-2xl p-5 shadow-lg lg:col-span-2 space-y-4">
          <button
            type="button"
            onClick={() => setIsComparisonExpanded(!isComparisonExpanded)}
            className="w-full flex justify-between items-center text-left focus:outline-hidden cursor-pointer group"
          >
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 group-hover:text-blue-400 transition-colors">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                Comparativo Mensal por Carro (R$)
              </h3>
              <p className="text-xs text-gray-400">Divisão de custos entre os carros alugados.</p>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-lg border border-blue-500/15 transition-all">
              <span>{isComparisonExpanded ? 'Recolher' : 'Ver'}</span>
              {isComparisonExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </button>

          {isComparisonExpanded && (
            <div className="flex flex-col sm:flex-row items-stretch gap-6 pt-2 border-t border-white/5">
              {/* SVG Canvas for Side-by-Side Chart */}
              <div className="flex-1 min-h-[200px] flex items-end border-b border-l border-white/10 pb-2 pl-2 relative">
                
                {/* Guidelines */}
                <div className="absolute left-0 right-0 border-t border-white/5" style={{ bottom: '25%' }} />
                <div className="absolute left-0 right-0 border-t border-white/5" style={{ bottom: '50%' }} />
                <div className="absolute left-0 right-0 border-t border-white/5" style={{ bottom: '75%' }} />
                
                {/* Columns Area */}
                <div className="w-full grid grid-cols-3 gap-4 z-10">
                  
                  {/* Rental comparison */}
                  <div className="flex flex-col items-center justify-end h-40 space-y-1">
                    <div className="w-full flex justify-center gap-1">
                      <div 
                        className="w-5 bg-blue-500 rounded-t-md transition-all duration-500 hover:brightness-125 relative group shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                        style={{ height: `${getBarHeight(car1Stats.rental)}px` }}
                      >
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/95 text-white text-[9px] px-1.5 py-0.5 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 shadow-md font-mono">
                          {formatBRL(car1Stats.rental)}
                        </span>
                      </div>
                      <div 
                        className="w-5 bg-purple-500 rounded-t-md transition-all duration-500 hover:brightness-125 relative group shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                        style={{ height: `${getBarHeight(car2Stats.rental)}px` }}
                      >
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/95 text-white text-[9px] px-1.5 py-0.5 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 shadow-md font-mono">
                          {formatBRL(car2Stats.rental)}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 font-semibold truncate">Custos Fixos</span>
                  </div>

                  {/* Maintenance comparison */}
                  <div className="flex flex-col items-center justify-end h-40 space-y-1">
                    <div className="w-full flex justify-center gap-1">
                      <div 
                        className="w-5 bg-blue-500 rounded-t-md transition-all duration-500 hover:brightness-125 relative group shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                        style={{ height: `${getBarHeight(car1Stats.maintenance)}px` }}
                      >
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/95 text-white text-[9px] px-1.5 py-0.5 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 shadow-md font-mono">
                          {formatBRL(car1Stats.maintenance)}
                        </span>
                      </div>
                      <div 
                        className="w-5 bg-purple-500 rounded-t-md transition-all duration-500 hover:brightness-125 relative group shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                        style={{ height: `${getBarHeight(car2Stats.maintenance)}px` }}
                      >
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/95 text-white text-[9px] px-1.5 py-0.5 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 shadow-md font-mono">
                          {formatBRL(car2Stats.maintenance)}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 font-semibold truncate">Manutenção</span>
                  </div>

                  {/* Other comparison */}
                  <div className="flex flex-col items-center justify-end h-40 space-y-1">
                    <div className="w-full flex justify-center gap-1">
                      <div 
                        className="w-5 bg-blue-500 rounded-t-md transition-all duration-500 hover:brightness-125 relative group shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                        style={{ height: `${getBarHeight(car1Stats.other)}px` }}
                      >
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/95 text-white text-[9px] px-1.5 py-0.5 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 shadow-md font-mono">
                          {formatBRL(car1Stats.other)}
                        </span>
                      </div>
                      <div 
                        className="w-5 bg-purple-500 rounded-t-md transition-all duration-500 hover:brightness-125 relative group shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                        style={{ height: `${getBarHeight(car2Stats.other)}px` }}
                      >
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/95 text-white text-[9px] px-1.5 py-0.5 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 shadow-md font-mono">
                          {formatBRL(car2Stats.other)}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 font-semibold truncate">Outros/Eventuais</span>
                  </div>

                </div>
              </div>

              {/* Legend and totals list */}
              <div className="sm:w-52 flex flex-col justify-center space-y-3 shrink-0">
                {vehicles[0] ? (
                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('focus-vehicle', { detail: { vehicleId: vehicles[0].id } }));
                    }}
                    className="p-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-xl space-y-1.5 hover:border-white/10 transition-all text-left w-full focus:outline-hidden cursor-pointer"
                    title="Clique para ir direto para este carro"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-sm shadow-[0_0_5px_rgba(59,130,246,0.5)]" />
                      <span className="text-xs font-bold text-gray-200 truncate">{vehicles[0].brand} {vehicles[0].model}</span>
                    </div>
                    <p className="text-[11px] font-mono text-gray-400 pl-5">Total: <strong className="text-white">{formatBRL(car1Stats.total)}</strong></p>
                  </button>
                ) : (
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1.5 text-left w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-sm shadow-[0_0_5px_rgba(59,130,246,0.5)]" />
                      <span className="text-xs font-bold text-gray-200 truncate">Carro 1</span>
                    </div>
                    <p className="text-[11px] font-mono text-gray-400 pl-5">Total: <strong className="text-white">{formatBRL(car1Stats.total)}</strong></p>
                  </div>
                )}

                {vehicles[1] ? (
                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('focus-vehicle', { detail: { vehicleId: vehicles[1].id } }));
                    }}
                    className="p-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-xl space-y-1.5 hover:border-white/10 transition-all text-left w-full focus:outline-hidden cursor-pointer"
                    title="Clique para ir direto para este carro"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-sm shadow-[0_0_5px_rgba(168,85,247,0.5)]" />
                      <span className="text-xs font-bold text-gray-200 truncate">{vehicles[1].brand} {vehicles[1].model}</span>
                    </div>
                    <p className="text-[11px] font-mono text-gray-400 pl-5">Total: <strong className="text-white">{formatBRL(car2Stats.total)}</strong></p>
                  </button>
                ) : (
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1.5 text-left w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-sm shadow-[0_0_5px_rgba(168,85,247,0.5)]" />
                      <span className="text-xs font-bold text-gray-200 truncate">Carro 2</span>
                    </div>
                    <p className="text-[11px] font-mono text-gray-400 pl-5">Total: <strong className="text-white">{formatBRL(car2Stats.total)}</strong></p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Chart 2: Distribuição de Despesas da Frota (Horizontal Segment Breakdown) */}
        <div id="chart-distribution" className="bg-[#111111] border border-white/5 rounded-2xl p-5 shadow-lg space-y-4 flex flex-col justify-between">
          <button
            type="button"
            onClick={() => setIsDistributionExpanded(!isDistributionExpanded)}
            className="w-full flex justify-between items-center text-left focus:outline-hidden cursor-pointer group"
          >
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 group-hover:text-purple-400 transition-colors">
                <PieChart className="w-4 h-4 text-purple-400" />
                Distribuição do Orçamento
              </h3>
              <p className="text-xs text-gray-400">Destinação total dos recursos investidos.</p>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 px-2.5 py-1 rounded-lg border border-purple-500/15 transition-all shrink-0 ml-2">
              <span>{isDistributionExpanded ? 'Recolher' : 'Ver'}</span>
              {isDistributionExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </button>

          {isDistributionExpanded && (
            <div className="space-y-4 pt-2 border-t border-white/5">
              {/* Dynamic Linear Bar Breakdown */}
              <div className="space-y-3 py-2">
                <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden flex border border-white/5">
                  {rentalPct > 0 && (
                    <div 
                      className="h-full bg-blue-600 transition-all hover:brightness-110" 
                      style={{ width: `${rentalPct}%` }}
                      title={`Custos Fixos: ${rentalPct.toFixed(1)}%`}
                    />
                  )}
                  {maintPct > 0 && (
                    <div 
                      className="h-full bg-emerald-500 transition-all hover:brightness-110" 
                      style={{ width: `${maintPct}%` }}
                      title={`Manutenção: ${maintPct.toFixed(1)}%`}
                    />
                  )}
                  {otherPct > 0 && (
                    <div 
                      className="h-full bg-purple-500 transition-all hover:brightness-110" 
                      style={{ width: `${otherPct}%` }}
                      title={`Outros: ${otherPct.toFixed(1)}%`}
                    />
                  )}
                </div>

                {/* Breakdown percentage legend with prices */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
                      <span className="text-gray-300 font-medium">Custos Fixos</span>
                    </div>
                    <span className="font-mono font-bold text-white">{rentalPct.toFixed(0)}% <span className="text-gray-500 font-normal">({formatBRL(totalRental)})</span></span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                      <span className="text-gray-300 font-medium">Manutenção</span>
                    </div>
                    <span className="font-mono font-bold text-white">{maintPct.toFixed(0)}% <span className="text-gray-500 font-normal">({formatBRL(totalMaint)})</span></span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-purple-500 rounded-full" />
                      <span className="text-gray-300 font-medium">Outros/Eventuais</span>
                    </div>
                    <span className="font-mono font-bold text-white">{otherPct.toFixed(0)}% <span className="text-gray-500 font-normal">({formatBRL(totalOther)})</span></span>
                  </div>
                </div>
              </div>

              {/* Small KPI Box */}
              <div className="pt-3 border-t border-white/5 flex justify-between items-center bg-white/[0.02] p-2.5 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <DollarSign className="w-3.5 h-3.5 text-gray-500" />
                  <span>Investimento Total</span>
                </div>
                <span className="text-xs font-extrabold text-white font-mono">{formatBRL(grandTotal)}</span>
              </div>
            </div>
          )}

        </div>
      </div>
  );
}
