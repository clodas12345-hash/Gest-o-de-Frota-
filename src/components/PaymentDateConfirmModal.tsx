import React, { useEffect, useState } from 'react';
import { Calendar, Check, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface PaymentDateConfirmModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  amount?: number;
  initialDate?: string;
  onConfirm: (selectedDate: string) => void;
  onClose: () => void;
}

const getLocalTodayIso = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const PaymentDateConfirmModal: React.FC<PaymentDateConfirmModalProps> = ({
  isOpen,
  title,
  subtitle,
  amount,
  initialDate,
  onConfirm,
  onClose,
}) => {
  const todayIso = getLocalTodayIso();
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || todayIso);
  const [viewYear, setViewYear] = useState<number>(() => {
    const base = initialDate || todayIso;
    return Number(base.split('-')[0]) || new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState<number>(() => {
    const base = initialDate || todayIso;
    return (Number(base.split('-')[1]) - 1) >= 0 ? Number(base.split('-')[1]) - 1 : new Date().getMonth();
  });

  useEffect(() => {
    if (isOpen) {
      const target = initialDate || getLocalTodayIso();
      setSelectedDate(target);
      const parts = target.split('-');
      if (parts.length === 3) {
        setViewYear(Number(parts[0]));
        setViewMonth(Number(parts[1]) - 1);
      }
    }
  }, [isOpen, initialDate]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleDateInputChange = (val: string) => {
    setSelectedDate(val);
    const parts = val.split('-');
    if (parts.length === 3) {
      const y = Number(parts[0]);
      const m = Number(parts[1]) - 1;
      if (!isNaN(y) && !isNaN(m) && m >= 0 && m <= 11) {
        setViewYear(y);
        setViewMonth(m);
      }
    }
  };

  const formattedSelectedBR = (() => {
    const parts = (selectedDate || '').split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return selectedDate;
  })();

  const calendarCells: Array<{ day: number | null; iso: string | null }> = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push({ day: null, iso: null });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarCells.push({ day, iso });
  }

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="w-full max-w-sm bg-[#141414] border border-white/15 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3.5 bg-[#1a1a1a] border-b border-white/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">{title}</h3>
              {subtitle && (
                <p className="text-[11px] text-gray-400 truncate">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3.5">
          {amount !== undefined && amount > 0 && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-xs text-emerald-200 font-medium">Valor do Pagamento</span>
              <span className="text-sm font-mono font-bold text-emerald-400">
                R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {/* Direct Date Input + Today Button */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-300">
                Dia em que foi pago
              </label>
              <button
                type="button"
                onClick={() => handleDateInputChange(getLocalTodayIso())}
                className="text-[10px] font-bold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
              >
                Hoje
              </button>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateInputChange(e.target.value)}
              className="w-full px-3 py-2 bg-black border border-white/15 rounded-xl text-xs text-white font-mono focus:outline-hidden focus:border-emerald-500 scheme-dark"
            />
          </div>

          {/* Interactive Calendar Grid */}
          <div className="bg-black/60 border border-white/10 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white transition-colors cursor-pointer"
                title="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-white tracking-wide">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white transition-colors cursor-pointer"
                title="Próximo mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEK_DAYS.map((wd) => (
                <div key={wd} className="text-center text-[10px] font-semibold text-gray-500 py-1">
                  {wd}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((cell, idx) => {
                if (!cell.day || !cell.iso) {
                  return <div key={`empty-${idx}`} className="h-8" />;
                }
                const isSelected = cell.iso === selectedDate;
                const isToday = cell.iso === todayIso;
                return (
                  <button
                    key={cell.iso}
                    type="button"
                    onClick={() => setSelectedDate(cell.iso!)}
                    className={`h-8 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center justify-center ${
                      isSelected
                        ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/30'
                        : isToday
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 font-bold hover:bg-amber-500/25'
                          : 'text-gray-200 hover:bg-white/10'
                    }`}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-[#1a1a1a] border-t border-white/10 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!selectedDate}
            onClick={() => {
              if (selectedDate) onConfirm(selectedDate);
            }}
            className="flex-1 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Confirmar ({formattedSelectedBR})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
