import React, { useState } from 'react';
import { Vehicle, FuelLog, MaintenanceLog, TripLog, ExpenseLog, Vistoria } from '../types';
import { BarChart3, History, X, PieChart } from 'lucide-react';
import { VisualCharts } from './VisualCharts';
import { HistoryLogs } from './HistoryLogs';

interface ReportsAndHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  fuelLogs: FuelLog[];
  maintenanceLogs: MaintenanceLog[];
  tripLogs: TripLog[];
  expenseLogs: ExpenseLog[];
  vistorias: Vistoria[];
  selectedMonth?: number;
  selectedYear?: number;
  onDeleteFuel: (id: string) => void;
  onDeleteMaintenance: (id: string) => void;
  onDeleteTrip: (id: string) => void;
  onDeleteExpense: (id: string) => void;
  onDeleteVistoria: (id: string) => void;
  onUpdateFuel: (log: FuelLog) => void;
  onUpdateMaintenance: (log: MaintenanceLog) => void;
  onUpdateTrip: (log: TripLog) => void;
  onUpdateExpense: (log: ExpenseLog) => void;
  onUpdateVistoria: (log: Vistoria) => void;
  onClearAllVistorias: () => void;
}

export function ReportsAndHistoryModal({
  isOpen,
  onClose,
  vehicles,
  fuelLogs,
  maintenanceLogs,
  tripLogs,
  expenseLogs,
  vistorias,
  selectedMonth,
  selectedYear,
  onDeleteFuel,
  onDeleteMaintenance,
  onDeleteTrip,
  onDeleteExpense,
  onDeleteVistoria,
  onUpdateFuel,
  onUpdateMaintenance,
  onUpdateTrip,
  onUpdateExpense,
  onUpdateVistoria,
  onClearAllVistorias,
}: ReportsAndHistoryModalProps) {
  const [activeTab, setActiveTab] = useState<'charts' | 'history'>('charts');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="absolute inset-0" 
        onClick={onClose} 
      />

      <div className="relative w-full max-w-6xl max-h-[92vh] bg-[#121212] border border-white/15 rounded-2xl shadow-2xl z-[2001] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#18181b] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Painel de Dados, Gráficos & Histórico Geral</h2>
              <p className="text-xs text-gray-400">Visualização consolidada de comparativos, orçamentos e lançamentos da frota.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="Fechar painel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher Bar */}
        <div className="px-5 py-3 bg-[#161619] border-b border-white/10 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('charts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'charts'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 border border-blue-400/30'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Gráficos & Orçamento</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 border border-blue-400/30'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Histórico Geral de Lançamentos</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6 scrollbar-thin scrollbar-thumb-white/20">
          {activeTab === 'charts' ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              <VisualCharts
                vehicles={vehicles}
                fuelLogs={fuelLogs}
                maintenanceLogs={maintenanceLogs}
                expenseLogs={expenseLogs}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                defaultExpanded={true}
              />
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-200">
              <HistoryLogs
                vehicles={vehicles}
                fuelLogs={fuelLogs}
                maintenanceLogs={maintenanceLogs}
                tripLogs={tripLogs}
                expenseLogs={expenseLogs}
                vistorias={vistorias}
                onDeleteFuel={onDeleteFuel}
                onDeleteMaintenance={onDeleteMaintenance}
                onDeleteTrip={onDeleteTrip}
                onDeleteExpense={onDeleteExpense}
                onDeleteVistoria={onDeleteVistoria}
                onUpdateFuel={onUpdateFuel}
                onUpdateMaintenance={onUpdateMaintenance}
                onUpdateTrip={onUpdateTrip}
                onUpdateExpense={onUpdateExpense}
                onUpdateVistoria={onUpdateVistoria}
                onClearAllVistorias={onClearAllVistorias}
                defaultExpanded={true}
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[#18181b] border-t border-white/10 flex items-center justify-between shrink-0">
          <span className="text-xs text-gray-400 font-mono">Total de veículos na frota: {vehicles.length}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition-all cursor-pointer border border-white/10"
          >
            Fechar Painel
          </button>
        </div>
      </div>
    </div>
  );
}
