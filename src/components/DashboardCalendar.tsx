import React, { useState } from 'react';
import { Vehicle, MaintenanceLog, Vistoria } from '../types';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Wrench, 
  ClipboardCheck, 
  DollarSign, 
  ChevronDown, 
  ChevronUp,
  Clock,
  Car
} from 'lucide-react';

interface DashboardCalendarProps {
  vehicles: Vehicle[];
  maintenanceLogs: MaintenanceLog[];
  vistorias: Vistoria[];
  selectedMonth: number; // 0-indexed (6 = July)
  selectedYear: number;
  onMonthChange: (year: number, month: number) => void;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function DashboardCalendar({
  vehicles,
  maintenanceLogs,
  vistorias,
  selectedMonth,
  selectedYear,
  onMonthChange
}: DashboardCalendarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState<{
    dateStr: string;
    dayNum: number;
    events: Array<{
      type: 'vistoria_scheduled' | 'revision' | 'payment' | 'vistoria_done' | 'maint_done';
      title: string;
      vehiclePlate: string;
      vehicleModel: string;
      id: string;
      status?: string;
    }>;
  } | null>(null);

  const today = new Date();
  const todayDateStr = today.toISOString().split('T')[0];

  // Calculate calendar grid
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayWeekday = new Date(selectedYear, selectedMonth, 1).getDay();

  // Helper to format YYYY-MM-DD
  const formatDateStr = (day: number) => {
    const m = String(selectedMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${selectedYear}-${m}-${d}`;
  };

  // Build event map for quick lookup: { '2026-07-22': [event1, event2] }
  const getEventsForDate = (dateStr: string) => {
    const events: Array<{
      type: 'vistoria_scheduled' | 'revision' | 'payment' | 'vistoria_done' | 'maint_done';
      title: string;
      vehiclePlate: string;
      vehicleModel: string;
      id: string;
      status?: string;
    }> = [];

    vehicles.forEach((vehicle) => {
      // Scheduled Vistoria
      if (vehicle.nextVistoriaDate === dateStr) {
        events.push({
          type: 'vistoria_scheduled',
          title: 'Vistoria Agendada',
          vehiclePlate: vehicle.plate,
          vehicleModel: `${vehicle.brand} ${vehicle.model}`,
          id: `v-sched-${vehicle.id}`
        });
      }

      // Scheduled Revision
      if (vehicle.preventiveMaintDate === dateStr) {
        events.push({
          type: 'revision',
          title: 'Revisão Preventiva',
          vehiclePlate: vehicle.plate,
          vehicleModel: `${vehicle.brand} ${vehicle.model}`,
          id: `rev-${vehicle.id}`
        });
      }

      // Weekly Payments
      (vehicle.weeklyPayments || []).forEach((pay) => {
        if (pay.date === dateStr) {
          events.push({
            type: 'payment',
            title: `Pagamento (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pay.amount)})`,
            vehiclePlate: vehicle.plate,
            vehicleModel: `${vehicle.brand} ${vehicle.model}`,
            id: pay.id
          });
        }
      });
    });

    // Completed Vistorias
    vistorias.forEach((vist) => {
      if (vist.date === dateStr) {
        const veh = vehicles.find((v) => v.id === vist.vehicleId);
        events.push({
          type: 'vistoria_done',
          title: `Vistoria: ${vist.type}`,
          vehiclePlate: veh?.plate || '',
          vehicleModel: veh ? `${veh.brand} ${veh.model}` : 'Veículo',
          id: vist.id
        });
      }
    });

    // Maintenance logs
    maintenanceLogs.forEach((maint) => {
      if (maint.date === dateStr) {
        const veh = vehicles.find((v) => v.id === maint.vehicleId);
        events.push({
          type: 'maint_done',
          title: `Manutenção: ${maint.type}`,
          vehiclePlate: veh?.plate || '',
          vehicleModel: veh ? `${veh.brand} ${veh.model}` : 'Veículo',
          id: maint.id
        });
      }
    });

    return events;
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      onMonthChange(selectedYear - 1, 11);
    } else {
      onMonthChange(selectedYear, selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      onMonthChange(selectedYear + 1, 0);
    } else {
      onMonthChange(selectedYear, selectedMonth + 1);
    }
  };

  return (
    <div className="w-full bg-[#111111] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Calendar Header / Toggle */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer group select-none hover:opacity-90 transition-opacity"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 group-hover:text-blue-400 transition-colors">
              <span>Calendário de Atividades e Agendamentos</span>
            </h3>
            <p className="text-xs text-gray-400">
              Acompanhe vistorias, manutenções e vencimentos do mês
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end" onClick={(e) => e.stopPropagation()}>
          {/* Month Navigator */}
          <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-white font-mono px-2 min-w-[110px] text-center">
              {MONTH_NAMES[selectedMonth]} {selectedYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-xl border border-blue-500/20 transition-all cursor-pointer"
          >
            <span>{isExpanded ? 'Ocultar' : 'Exibir Calendário'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Grid */}
      {isExpanded && (
        <div className="space-y-4 pt-2 border-t border-white/5">
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400 bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
            <span className="font-semibold text-white">Legenda:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.6)]" />
              <span>Vistoria Agendada</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
              <span>Revisão Preventiva</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
              <span>Pagamento</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
              <span>Realizados</span>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((wd, i) => (
              <div 
                key={wd} 
                className={`text-[11px] font-bold py-1 uppercase tracking-wider ${
                  i === 0 || i === 6 ? 'text-gray-500' : 'text-gray-400'
                }`}
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {/* Empty slots for previous month */}
            {Array.from({ length: firstDayWeekday }).map((_, i) => (
              <div 
                key={`empty-${i}`} 
                className="min-h-[44px] sm:min-h-[52px] bg-white/[0.01] rounded-xl border border-white/[0.02] opacity-20"
              />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = formatDateStr(dayNum);
              const events = getEventsForDate(dateStr);
              const isToday = dateStr === todayDateStr;

              const hasVistoria = events.some((e) => e.type === 'vistoria_scheduled');
              const hasRevision = events.some((e) => e.type === 'revision');
              const hasPayment = events.some((e) => e.type === 'payment');
              const hasDone = events.some((e) => e.type === 'vistoria_done' || e.type === 'maint_done');

              return (
                <button
                  key={`day-${dayNum}`}
                  type="button"
                  onClick={() => {
                    if (events.length > 0) {
                      setSelectedDayEvents({ dateStr, dayNum, events });
                    } else {
                      setSelectedDayEvents(null);
                    }
                  }}
                  className={`min-h-[48px] sm:min-h-[56px] p-1.5 rounded-xl border flex flex-col justify-between text-left transition-all relative cursor-pointer group ${
                    isToday
                      ? 'bg-blue-600/20 border-blue-500/50 text-white shadow-[0_0_15px_rgba(59,130,246,0.25)]'
                      : events.length > 0
                      ? 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08] hover:border-white/20'
                      : 'bg-white/[0.01] border-white/[0.03] hover:bg-white/[0.03] text-gray-400'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span 
                      className={`text-xs font-mono font-bold ${
                        isToday 
                          ? 'bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]' 
                          : 'text-gray-300'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {isToday && (
                      <span className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter">
                        HOJE
                      </span>
                    )}
                  </div>

                  {/* Event indicators */}
                  <div className="flex flex-wrap items-center gap-1 mt-1">
                    {hasVistoria && (
                      <span 
                        className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" 
                        title="Vistoria Agendada"
                      />
                    )}
                    {hasRevision && (
                      <span 
                        className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" 
                        title="Revisão Agendada"
                      />
                    )}
                    {hasPayment && (
                      <span 
                        className="w-2 h-2 rounded-full bg-emerald-500" 
                        title="Pagamento"
                      />
                    )}
                    {hasDone && (
                      <span 
                        className="w-2 h-2 rounded-full bg-blue-500" 
                        title="Atividade Concluída"
                      />
                    )}
                  </div>

                  {/* Text preview on larger screens */}
                  {events.length > 0 && (
                    <div className="hidden sm:block text-[9px] font-semibold truncate text-gray-300 w-full mt-0.5">
                      {events.length} {events.length === 1 ? 'evento' : 'eventos'}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Details Modal / Panel for clicked day */}
          {selectedDayEvents && (
            <div className="p-4 bg-white/[0.03] border border-blue-500/30 rounded-xl space-y-3 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>
                    Eventos em {selectedDayEvents.dayNum} de {MONTH_NAMES[selectedMonth]} {selectedYear}
                  </span>
                </h4>
                <button
                  type="button"
                  onClick={() => setSelectedDayEvents(null)}
                  className="text-xs text-gray-400 hover:text-white px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Fechar
                </button>
              </div>

              <div className="space-y-2">
                {selectedDayEvents.events.map((evt) => (
                  <div 
                    key={evt.id} 
                    className="p-2.5 bg-[#0a0a0a] border border-white/5 rounded-lg flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {evt.type === 'vistoria_scheduled' && <ClipboardCheck className="w-4 h-4 text-purple-400 shrink-0" />}
                      {evt.type === 'revision' && <Wrench className="w-4 h-4 text-amber-400 shrink-0" />}
                      {evt.type === 'payment' && <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />}
                      {(evt.type === 'vistoria_done' || evt.type === 'maint_done') && <Car className="w-4 h-4 text-blue-400 shrink-0" />}

                      <div className="min-w-0">
                        <p className="font-bold text-white truncate">{evt.title}</p>
                        <p className="text-[11px] text-gray-400 truncate">
                          {evt.vehicleModel} <span className="text-gray-500">({evt.vehiclePlate})</span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const veh = vehicles.find((v) => v.plate === evt.vehiclePlate);
                        if (veh) {
                          window.dispatchEvent(new CustomEvent('focus-vehicle', { detail: { vehicleId: veh.id } }));
                        }
                      }}
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-bold bg-blue-500/10 hover:bg-blue-500/20 px-2 py-1 rounded-md border border-blue-500/20 shrink-0 cursor-pointer"
                    >
                      Ver Veículo
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
