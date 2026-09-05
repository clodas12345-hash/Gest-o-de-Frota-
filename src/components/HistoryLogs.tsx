import { useState } from 'react';
import { Vehicle, MaintenanceLog, ExpenseLog, Vistoria, FuelLog, TripLog } from '../types';
import { Search, Wrench, Landmark, Trash2, Calendar, User, Gauge, Edit2, Check, X, ChevronDown, ChevronUp, History, ClipboardCheck, Droplets, MapPin } from 'lucide-react';

interface HistoryLogsProps {
  vehicles: Vehicle[];
  fuelLogs?: FuelLog[];
  maintenanceLogs: MaintenanceLog[];
  tripLogs?: TripLog[];
  expenseLogs: ExpenseLog[];
  vistorias?: Vistoria[];
  
  onDeleteFuel?: (id: string) => void;
  onDeleteMaintenance: (id: string) => void;
  onDeleteTrip?: (id: string) => void;
  onDeleteExpense: (id: string) => void;
  onDeleteVistoria?: (id: string) => void;

  onUpdateFuel?: (updatedLog: FuelLog) => void;
  onUpdateMaintenance?: (updatedLog: MaintenanceLog) => void;
  onUpdateTrip?: (updatedLog: TripLog) => void;
  onUpdateExpense?: (updatedLog: ExpenseLog) => void;
  onUpdateVistoria?: (updatedLog: Vistoria) => void;

  onClearAllVistorias?: () => void;
  defaultExpanded?: boolean;
}

type LogCategory = 'maintenance' | 'expense' | 'vistoria' | 'fuel' | 'trip';

export function HistoryLogs({
  vehicles,
  fuelLogs = [],
  maintenanceLogs,
  tripLogs = [],
  expenseLogs,
  vistorias = [],
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
  defaultExpanded = false,
}: HistoryLogsProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [activeCategory, setActiveCategory] = useState<LogCategory>('maintenance');
  const [filterVehicleId, setFilterVehicleId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Inline editing states for expenses
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editCost, setEditCost] = useState(0);
  const [editCategory, setEditCategory] = useState<ExpenseLog['category']>('Outros');
  const [editDate, setEditDate] = useState('');

  // Inline editing states for maintenance
  const [editingMaintId, setEditingMaintId] = useState<string | null>(null);
  const [editMaintDate, setEditMaintDate] = useState('');
  const [editMaintType, setEditMaintType] = useState<MaintenanceLog['type']>('Outro');
  const [editMaintDesc, setEditMaintDesc] = useState('');
  const [editMaintShop, setEditMaintShop] = useState('');
  const [editMaintNextKm, setEditMaintNextKm] = useState(0);
  const [editMaintCost, setEditMaintCost] = useState(0);

  // Inline editing states for fuel
  const [editingFuelId, setEditingFuelId] = useState<string | null>(null);
  const [editFuelDate, setEditFuelDate] = useState('');
  const [editFuelKm, setEditFuelKm] = useState(0);
  const [editFuelLiters, setEditFuelLiters] = useState(0);
  const [editFuelPrice, setEditFuelPrice] = useState(0);
  const [editFuelTotal, setEditFuelTotal] = useState(0);
  const [editFuelType, setEditFuelType] = useState<FuelLog['fuelType']>('Gasolina');
  const [editFuelStation, setEditFuelStation] = useState('');

  // Inline editing states for trip
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [editTripDate, setEditTripDate] = useState('');
  const [editTripStartKm, setEditTripStartKm] = useState(0);
  const [editTripEndKm, setEditTripEndKm] = useState(0);
  const [editTripDriver, setEditTripDriver] = useState('');
  const [editTripPurpose, setEditTripPurpose] = useState('');

  // Inline editing states for vistoria
  const [editingVistoriaId, setEditingVistoriaId] = useState<string | null>(null);
  const [editVistoriaDate, setEditVistoriaDate] = useState('');
  const [editVistoriaType, setEditVistoriaType] = useState('');
  const [editVistoriaNotes, setEditVistoriaNotes] = useState('');

  // Start editing handlers
  const handleStartEditExpense = (log: ExpenseLog) => {
    setEditingExpenseId(log.id);
    setEditDesc(log.description);
    setEditCost(log.cost);
    setEditCategory(log.category);
    setEditDate(log.date);
  };

  const handleStartEditMaint = (log: MaintenanceLog) => {
    setEditingMaintId(log.id);
    setEditMaintDate(log.date);
    setEditMaintType(log.type);
    setEditMaintDesc(log.description);
    setEditMaintShop(log.shopName || '');
    setEditMaintNextKm(log.nextKm || 0);
    setEditMaintCost(log.cost);
  };

  const handleStartEditFuel = (log: FuelLog) => {
    setEditingFuelId(log.id);
    setEditFuelDate(log.date);
    setEditFuelKm(log.km);
    setEditFuelLiters(log.liters);
    setEditFuelPrice(log.pricePerLiter);
    setEditFuelTotal(log.totalCost);
    setEditFuelType(log.fuelType);
    setEditFuelStation(log.station || '');
  };

  const handleStartEditTrip = (log: TripLog) => {
    setEditingTripId(log.id);
    setEditTripDate(log.date);
    setEditTripStartKm(log.startKm);
    setEditTripEndKm(log.endKm);
    setEditTripDriver(log.driver);
    setEditTripPurpose(log.purpose);
  };

  const handleStartEditVistoria = (log: Vistoria) => {
    setEditingVistoriaId(log.id);
    setEditVistoriaDate(log.date);
    setEditVistoriaType(log.type || '');
    setEditVistoriaNotes(log.notes || '');
  };

  // Save editing handlers
  const handleSaveExpenseEdit = (log: ExpenseLog) => {
    if (!editDesc.trim() || editCost <= 0) {
      alert('Por favor, preencha a descrição e o valor.');
      return;
    }
    if (onUpdateExpense) {
      onUpdateExpense({
        ...log,
        description: editDesc.trim(),
        cost: editCost,
        category: editCategory,
        date: editDate,
      });
    }
    setEditingExpenseId(null);
  };

  const handleSaveMaintEdit = (log: MaintenanceLog) => {
    if (!editMaintDesc.trim() || editMaintCost < 0) {
      alert('Por favor, preencha a descrição e um custo válido.');
      return;
    }
    if (onUpdateMaintenance) {
      onUpdateMaintenance({
        ...log,
        date: editMaintDate,
        type: editMaintType,
        description: editMaintDesc.trim(),
        shopName: editMaintShop.trim() || undefined,
        nextKm: editMaintNextKm > 0 ? editMaintNextKm : undefined,
        cost: editMaintCost,
      });
    }
    setEditingMaintId(null);
  };

  const handleSaveFuelEdit = (log: FuelLog) => {
    if (onUpdateFuel) {
      onUpdateFuel({
        ...log,
        date: editFuelDate,
        km: editFuelKm,
        liters: editFuelLiters,
        pricePerLiter: editFuelPrice,
        totalCost: editFuelTotal,
        fuelType: editFuelType,
        station: editFuelStation.trim() || undefined,
      });
    }
    setEditingFuelId(null);
  };

  const handleSaveTripEdit = (log: TripLog) => {
    if (onUpdateTrip) {
      onUpdateTrip({
        ...log,
        date: editTripDate,
        startKm: editTripStartKm,
        endKm: editTripEndKm,
        driver: editTripDriver.trim(),
        purpose: editTripPurpose.trim(),
      });
    }
    setEditingTripId(null);
  };

  const handleSaveVistoriaEdit = (log: Vistoria) => {
    if (onUpdateVistoria) {
      onUpdateVistoria({
        ...log,
        date: editVistoriaDate,
        type: editVistoriaType.trim() || undefined,
        notes: editVistoriaNotes.trim(),
      });
    }
    setEditingVistoriaId(null);
  };

  // Helpers
  const getVehicleName = (vId: string) => {
    const v = vehicles.find((car) => car.id === vId);
    return v ? `${v.brand} ${v.model} (${v.plate})` : 'Carro Desconhecido';
  };

  const getVehiclePlate = (vId: string) => {
    const v = vehicles.find((car) => car.id === vId);
    return v ? v.plate : '---';
  };

  const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  // Filter logs based on search and vehicle selection
  const filterByCarAndSearch = <T extends { vehicleId: string; date: string; [key: string]: any }>(
    logsList: T[],
    searchFields: (item: T) => boolean
  ) => {
    return logsList
      .filter((item) => filterVehicleId === 'all' || item.vehicleId === filterVehicleId)
      .filter((item) => {
        if (!searchQuery) return true;
        return searchFields(item);
      })
      .sort((a, b) => b.date.localeCompare(a.date)); // Latest first
  };

  const filteredMaint = filterByCarAndSearch(maintenanceLogs, (item) =>
    item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.shopName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getVehicleName(item.vehicleId).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredExpenses = filterByCarAndSearch(expenseLogs, (item) =>
    item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getVehicleName(item.vehicleId).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVistorias = filterByCarAndSearch(vistorias, (item) =>
    (item.notes || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    getVehicleName(item.vehicleId).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFuel = filterByCarAndSearch(fuelLogs, (item) =>
    (item.station || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.fuelType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getVehicleName(item.vehicleId).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const parseInstallmentInfo = (description: string) => {
    if (!description) return null;
    const match = description.match(/\(\s*(\d+)\s*[\/]\s*(\d+)\s*\)/) || description.match(/\b(\d+)\s*[\/]\s*(\d+)\b/);
    if (match) {
      const pagas = parseInt(match[1], 10);
      const total = parseInt(match[2], 10);
      if (!isNaN(pagas) && !isNaN(total) && total >= pagas && total > 0) {
        const faltam = total - pagas;
        return { pagas, total, faltam };
      }
    }
    return null;
  };

  const filteredTrips = filterByCarAndSearch(tripLogs, (item) =>
    item.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.driver.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getVehicleName(item.vehicleId).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="history-section" className="bg-[#111111] border border-white/5 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex justify-between items-center text-left focus:outline-hidden cursor-pointer group"
        >
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2 group-hover:text-blue-400 transition-colors">
              <History className="w-5 h-5 text-blue-400" />
              <span>Histórico Geral de Lançamentos</span>
            </h2>
            <p className="text-xs text-gray-400">Visualize, filtre e gerencie todos os registros de manutenções e despesas.</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-xl border border-blue-500/20 transition-all shrink-0 ml-2">
            <span>{isExpanded ? 'Recolher' : 'Ver'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-6 pt-2 border-t border-white/5">
          {/* Global Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-2 justify-end">
            {/* Vehicle Select */}
            <select
              value={filterVehicleId}
              onChange={(e) => setFilterVehicleId(e.target.value)}
              className="text-xs font-semibold bg-white/[0.03] border border-white/10 text-gray-200 px-3 py-2 rounded-xl focus:outline-hidden focus:border-blue-500/50 focus:bg-[#1a1a1a]"
              id="filter-select-vehicle"
            >
              <option value="all" className="bg-[#111111] text-gray-200">Filtro: Todos os Carros</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id} className="bg-[#111111] text-gray-200">
                  {v.brand} {v.model} ({v.plate})
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar registros..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs border border-white/10 rounded-xl pl-9 pr-4 py-2 w-full sm:w-56 bg-white/[0.03] focus:outline-hidden focus:bg-[#1a1a1a] focus:border-blue-500/50 text-white font-medium placeholder-gray-500"
                id="filter-search-input"
              />
            </div>
          </div>

      {/* Categories Toggle Row */}
      <div className="flex gap-2 border-b border-white/5 pb-2 overflow-x-auto shrink-0 scrollbar-none">
        <button
          onClick={() => setActiveCategory('maintenance')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeCategory === 'maintenance'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
          id="tab-history-maintenance"
        >
          <Wrench className="w-4 h-4" />
          Manutenções ({filteredMaint.length})
        </button>

        <button
          onClick={() => setActiveCategory('fuel')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeCategory === 'fuel'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
          id="tab-history-fuel"
        >
          <Droplets className="w-4 h-4" />
          Abastecimentos ({filteredFuel.length})
        </button>

        <button
          onClick={() => setActiveCategory('trip')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeCategory === 'trip'
              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
          id="tab-history-trip"
        >
          <MapPin className="w-4 h-4" />
          Viagens ({filteredTrips.length})
        </button>

        <button
          onClick={() => setActiveCategory('expense')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeCategory === 'expense'
              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
          id="tab-history-expense"
        >
          <Landmark className="w-4 h-4" />
          Outras Despesas ({filteredExpenses.length})
        </button>

        <button
          onClick={() => setActiveCategory('vistoria')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeCategory === 'vistoria'
              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
          id="tab-history-vistoria"
        >
          <ClipboardCheck className="w-4 h-4" />
          Vistorias ({filteredVistorias.length})
        </button>
      </div>

      {/* Lists Display Area */}
      <div id="history-logs-display" className="overflow-x-auto">
        {/* Tab: Maintenance */}
        {activeCategory === 'maintenance' && (
          <div className="min-w-[600px] text-gray-300">
            {filteredMaint.length === 0 ? (
              <p className="text-center text-gray-500 text-xs py-8">Nenhuma manutenção encontrada.</p>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3">Data</th>
                    <th className="py-3">Veículo</th>
                    <th className="py-3">Tipo</th>
                    <th className="py-3">Descrição / Oficina</th>
                    <th className="py-3">Próxima Manutenção</th>
                    <th className="py-3 text-right">Custo</th>
                    <th className="py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {filteredMaint.map((log) => {
                    const isEditing = editingMaintId === log.id;
                    return (
                    <tr key={log.id} className={`transition-colors ${isEditing ? 'bg-blue-500/5' : 'hover:bg-white/[0.01]'}`}>
                      <td className="py-3.5 font-medium text-gray-400 font-mono">
                        {isEditing ? (
                          <input
                            type="date"
                            value={editMaintDate}
                            onChange={(e) => setEditMaintDate(e.target.value)}
                            className="bg-neutral-900 border border-white/10 text-white rounded px-2 py-1 text-xs focus:outline-hidden font-mono"
                          />
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-600" />
                            {formatDate(log.date)}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5">
                        <button
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('focus-vehicle', { detail: { vehicleId: log.vehicleId } }));
                          }}
                          className="font-bold text-blue-400 hover:text-blue-300 hover:underline cursor-pointer text-left focus:outline-hidden"
                          title="Clique para ir direto para este carro"
                        >
                          {getVehiclePlate(log.vehicleId)}
                        </button>
                      </td>
                      <td className="py-3.5">
                        {isEditing ? (
                          <select
                            value={editMaintType}
                            onChange={(e) => setEditMaintType(e.target.value as any)}
                            className="bg-neutral-900 border border-white/10 text-white rounded px-2 py-1 text-xs focus:outline-hidden font-medium"
                          >
                            <option value="Revisão">Revisão</option>
                            <option value="Preventiva">Preventiva</option>
                            <option value="Corretiva">Corretiva</option>
                            <option value="Pneus">Pneus</option>
                            <option value="Outro">Outro</option>
                          </select>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 font-semibold rounded-md text-[10px]">
                            {log.type}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 max-w-xs">
                        {isEditing ? (
                          <div className="flex flex-col gap-1">
                            <input
                              type="text"
                              value={editMaintDesc}
                              onChange={(e) => setEditMaintDesc(e.target.value)}
                              placeholder="Descrição"
                              className="bg-neutral-900 border border-white/10 text-white rounded px-2 py-1 text-xs focus:outline-hidden w-full max-w-[200px]"
                            />
                            <input
                              type="text"
                              value={editMaintShop}
                              onChange={(e) => setEditMaintShop(e.target.value)}
                              placeholder="Oficina"
                              className="bg-neutral-900 border border-white/10 text-white rounded px-2 py-1 text-xs focus:outline-hidden w-full max-w-[200px]"
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="font-semibold text-white line-clamp-1">{log.description}</span>
                            <span className="text-[10px] text-gray-500">{log.shopName || 'Oficina não especificada'}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={editMaintNextKm || ''}
                              onChange={(e) => setEditMaintNextKm(Number(e.target.value))}
                              placeholder="Km"
                              className="bg-neutral-900 border border-white/10 text-white rounded px-2 py-1 text-xs focus:outline-hidden w-20 text-right font-mono"
                            />
                            <span className="text-gray-500 text-[10px]">km</span>
                          </div>
                        ) : log.nextKm ? (
                          <span className="font-mono font-medium text-blue-400 flex items-center gap-1">
                            <Gauge className="w-3.5 h-3.5" />
                            {log.nextKm.toLocaleString('pt-BR')} km
                          </span>
                        ) : (
                          <span className="text-gray-500">---</span>
                        )}
                      </td>
                      <td className="py-3.5 text-right font-bold font-mono text-white">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-gray-500 text-[10px]">R$</span>
                            <input
                              type="number"
                              value={editMaintCost || ''}
                              onChange={(e) => setEditMaintCost(Number(e.target.value))}
                              className="bg-neutral-900 border border-white/10 text-white rounded px-1.5 py-1 text-xs focus:outline-hidden w-16 text-right font-mono"
                            />
                          </div>
                        ) : (
                          formatBRL(log.cost)
                        )}
                      </td>
                      <td className="py-3.5 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleSaveMaintEdit(log)}
                              className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
                              title="Salvar manutenção"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingMaintId(null)}
                              className="p-1 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                              title="Cancelar edição"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleStartEditMaint(log)}
                              className="p-1 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                              title="Editar manutenção"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteMaintenance(log.id)}
                              className="p-1 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title="Excluir manutenção"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab: Fuel */}
        {activeCategory === 'fuel' && (
          <div className="min-w-[600px] text-gray-300">
            {filteredFuel.length === 0 ? (
              <p className="text-center text-gray-500 text-xs py-8">Nenhum abastecimento registrado.</p>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3">Data</th>
                    <th className="py-3">Veículo</th>
                    <th className="py-3">Combustível</th>
                    <th className="py-3">Posto</th>
                    <th className="py-3 text-right">Lts / Preço</th>
                    <th className="py-3 text-right">Custo Total</th>
                    <th className="py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {filteredFuel.map((log) => {
                    const isEditing = editingFuelId === log.id;
                    return (
                    <tr key={log.id} className={`transition-colors ${isEditing ? 'bg-blue-500/5' : 'hover:bg-white/[0.01]'}`}>
                      <td className="py-3.5 font-medium text-gray-400 font-mono">
                        {isEditing ? (
                          <input
                            type="date"
                            value={editFuelDate}
                            onChange={(e) => setEditFuelDate(e.target.value)}
                            className="bg-neutral-900 border border-white/10 text-white rounded px-2 py-1 text-xs focus:outline-hidden font-mono"
                          />
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-600" />
                            {formatDate(log.date)}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5">
                        <button
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('focus-vehicle', { detail: { vehicleId: log.vehicleId } }));
                          }}
                          className="font-bold text-blue-400 hover:text-blue-300 hover:underline cursor-pointer text-left focus:outline-hidden"
                          title="Clique para ir direto para este carro"
                        >
                          {getVehiclePlate(log.vehicleId)}
                        </button>
                      </td>
                      <td className="py-3.5">
                        {isEditing ? (
                          <select
                            value={editFuelType}
                            onChange={(e) => setEditFuelType(e.target.value as any)}
                            className="bg-neutral-900 border border-white/10 text-white rounded px-2 py-1 text-xs focus:outline-hidden font-medium"
                          >
                            <option value="Gasolina">Gasolina</option>
                            <option value="Etanol">Etanol</option>
                            <option value="Diesel">Diesel</option>
                            <option value="Flex">Flex</option>
                          </select>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/15 font-semibold rounded-md text-[10px]">
                            {log.fuelType}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-gray-300">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editFuelStation}
                            onChange={(e) => setEditFuelStation(e.target.value)}
                            placeholder="Posto"
                            className="bg-neutral-900 border border-white/10 text-white rounded px-2 py-1 text-xs focus:outline-hidden w-full max-w-[150px]"
                          />
                        ) : (
                          log.station || 'Não informado'
                        )}
                      </td>
                      <td className="py-3.5 text-right font-mono text-gray-400">
                        {isEditing ? (
                          <div className="flex flex-col items-end gap-1">
                            <input
                              type="number"
                              value={editFuelLiters || ''}
                              onChange={(e) => setEditFuelLiters(Number(e.target.value))}
                              placeholder="Lts"
                              className="bg-neutral-900 border border-white/10 text-white rounded px-1.5 py-1 text-xs focus:outline-hidden w-16 text-right font-mono"
                            />
                            <input
                              type="number"
                              value={editFuelPrice || ''}
                              onChange={(e) => setEditFuelPrice(Number(e.target.value))}
                              placeholder="R$/L"
                              className="bg-neutral-900 border border-white/10 text-white rounded px-1.5 py-1 text-xs focus:outline-hidden w-16 text-right font-mono"
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span>{log.liters} L</span>
                            <span className="text-[10px] text-gray-500">R$ {log.pricePerLiter}/L</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 text-right font-bold font-mono text-white">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-gray-500 text-[10px]">R$</span>
                            <input
                              type="number"
                              value={editFuelTotal || ''}
                              onChange={(e) => setEditFuelTotal(Number(e.target.value))}
                              className="bg-neutral-900 border border-white/10 text-white rounded px-1.5 py-1 text-xs focus:outline-hidden w-16 text-right font-mono"
                            />
                          </div>
                        ) : (
                          formatBRL(log.totalCost)
                        )}
                      </td>
                      <td className="py-3.5 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleSaveFuelEdit(log)}
                              className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
                              title="Salvar abastecimento"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingFuelId(null)}
                              className="p-1 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                              title="Cancelar edição"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleStartEditFuel(log)}
                              className="p-1 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                              title="Editar abastecimento"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteFuel && onDeleteFuel(log.id)}
                              className="p-1 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title="Excluir abastecimento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab: Trips */}
        {activeCategory === 'trip' && (
          <div className="min-w-[600px] text-gray-300">
            {filteredTrips.length === 0 ? (
              <p className="text-center text-gray-500 text-xs py-8">Nenhuma viagem registrada.</p>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3">Data</th>
                    <th className="py-3">Veículo</th>
                    <th className="py-3">Motorista</th>
                    <th className="py-3">Destino / Motivo</th>
                    <th className="py-3 text-right">Km Início</th>
                    <th className="py-3 text-right">Km Fim</th>
                    <th className="py-3 text-right">Distância</th>
                    <th className="py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {filteredTrips.map((log) => {
                    const isEditing = editingTripId === log.id;
                    return (
                    <tr key={log.id} className={`transition-colors ${isEditing ? 'bg-blue-500/5' : 'hover:bg-white/[0.01]'}`}>
                      <td className="py-3.5 font-medium text-gray-400 font-mono">
                        {isEditing ? (
                          <input
                            type="date"
                            value={editTripDate}
                            onChange={(e) => setEditTripDate(e.target.value)}
                            className="bg-neutral-900 border border-white/10 text-white rounded px-2 py-1 text-xs focus:outline-hidden font-mono"
                          />
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-600" />
                            {formatDate(log.date)}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5">
                        <button
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('focus-vehicle', { detail: { vehicleId: log.vehicleId } }));
                          }}
                          className="font-bold text-blue-400 hover:text-blue-300 hover:underline cursor-pointer text-left focus:outline-hidden"
                          title="Clique para ir direto para este carro"
                        >
                          {getVehiclePlate(log.vehicleId)}
                        </button>
                      </td>
                      <td className="py-3.5">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editTripDriver}
                            onChange={(e) => setEditTripDriver(e.target.value)}
                            className="bg-neutral-900 border border-white/10 text-white rounded px-2 py-1 text-xs focus:outline-hidden w-full max-w-[150px]"
                          />
                        ) : (
                          log.driver || 'Não informado'
                        )}
                      </td>
                      <td className="py-3.5 text-gray-300 max-w-xs">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editTripPurpose}
                            onChange={(e) => setEditTripPurpose(e.target.value)}
                            className="bg-neutral-900 border border-white/10 text-white rounded px-2 py-1 text-xs focus:outline-hidden w-full max-w-[150px]"
                          />
                        ) : (
                          log.purpose
                        )}
                      </td>
                      <td className="py-3.5 text-right font-mono text-gray-400">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editTripStartKm || ''}
                            onChange={(e) => setEditTripStartKm(Number(e.target.value))}
                            className="bg-neutral-900 border border-white/10 text-white rounded px-1.5 py-1 text-xs focus:outline-hidden w-16 text-right font-mono"
                          />
                        ) : (
                          log.startKm.toLocaleString('pt-BR')
                        )}
                      </td>
                      <td className="py-3.5 text-right font-mono text-gray-400">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editTripEndKm || ''}
                            onChange={(e) => setEditTripEndKm(Number(e.target.value))}
                          className="bg-neutral-900 border border-white/10 text-white rounded px-1.5 py-1 text-xs focus:outline-hidden w-16 text-right font-mono"
                          />
                        ) : (
                          log.endKm.toLocaleString('pt-BR')
                        )}
                      </td>
                      <td className="py-3.5 text-right font-mono font-bold text-white">
                        {isEditing ? (
                          <span className="text-blue-400">{(editTripEndKm - editTripStartKm).toLocaleString('pt-BR')} km</span>
                        ) : (
                          <span className="text-blue-400">{(log.endKm - log.startKm).toLocaleString('pt-BR')} km</span>
                        )}
                      </td>
                      <td className="py-3.5 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleSaveTripEdit(log)}
                              className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
                              title="Salvar viagem"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingTripId(null)}
                              className="p-1 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                              title="Cancelar edição"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleStartEditTrip(log)}
                              className="p-1 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                              title="Editar viagem"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteTrip && onDeleteTrip(log.id)}
                              className="p-1 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title="Excluir viagem"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab: Other Expenses */}
        {activeCategory === 'expense' && (
          <div className="min-w-[600px] text-gray-300">
            {filteredExpenses.length === 0 ? (
              <p className="text-center text-gray-500 text-xs py-8">Nenhuma outra despesa registrada.</p>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3">Data</th>
                    <th className="py-3">Veículo</th>
                    <th className="py-3">Categoria</th>
                    <th className="py-3">Descrição detalhada</th>
                    <th className="py-3 text-right">Valor Total</th>
                    <th className="py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {filteredExpenses.map((log) => {
                    const isEditing = editingExpenseId === log.id;
                    return (
                      <tr key={log.id} className={`transition-colors ${isEditing ? 'bg-blue-500/5' : 'hover:bg-white/[0.01]'}`}>
                        {/* Date field */}
                        <td className="py-2.5 font-medium text-gray-400 font-mono">
                          {isEditing ? (
                            <input
                              type="date"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              className="bg-neutral-900 border border-white/10 text-white rounded px-2 py-1 text-xs focus:outline-hidden font-mono"
                            />
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-gray-600" />
                              {formatDate(log.date)}
                            </span>
                          )}
                        </td>

                        {/* Vehicle Plate */}
                        <td className="py-2.5">
                          <button
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('focus-vehicle', { detail: { vehicleId: log.vehicleId } }));
                            }}
                            className="font-bold text-blue-400 hover:text-blue-300 hover:underline cursor-pointer text-left focus:outline-hidden"
                            title="Clique para ir direto para este carro"
                          >
                            {getVehiclePlate(log.vehicleId)}
                          </button>
                        </td>

                        {/* Category */}
                        <td className="py-2.5">
                          {isEditing ? (
                            <select
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value as any)}
                              className="bg-neutral-900 border border-white/10 text-white rounded px-2 py-1 text-xs focus:outline-hidden font-medium"
                            >
                              <option value="Seguro">Seguro</option>
                              <option value="Multa">Multa</option>
                              <option value="Lavagem">Lavagem</option>
                              <option value="Estacionamento">Estacionamento</option>
                              <option value="Outros">Outros</option>
                            </select>
                          ) : (
                            <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/15 font-semibold rounded-md text-[10px]">
                              {log.category}
                            </span>
                          )}
                        </td>

                        {/* Description */}
                        <td className="py-2.5 text-gray-300 font-semibold">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editDesc}
                              onChange={(e) => setEditDesc(e.target.value ? e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) : '')}
                              className="bg-neutral-900 border border-white/10 text-white rounded px-2 py-1 text-xs focus:outline-hidden w-full max-w-[200px]"
                            />
                          ) : (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span>{log.description}</span>
                              {(() => {
                                const inst = parseInstallmentInfo(log.description);
                                if (inst) {
                                  return (
                                    <span className="text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold shrink-0">
                                      Pagas: {inst.pagas} | Faltam: {inst.faltam}
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          )}
                        </td>

                        {/* Cost / Value */}
                        <td className="py-2.5 text-right font-bold font-mono text-white">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-gray-500 text-[10px]">R$</span>
                              <input
                                type="number"
                                value={editCost || ''}
                                onChange={(e) => setEditCost(Number(e.target.value))}
                                className="bg-neutral-900 border border-white/10 text-white rounded px-1.5 py-1 text-xs focus:outline-hidden w-16 text-right font-mono"
                              />
                            </div>
                          ) : (
                            formatBRL(log.cost)
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleSaveExpenseEdit(log)}
                                className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                title="Salvar despesa"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingExpenseId(null)}
                                className="p-1 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                title="Cancelar edição"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleStartEditExpense(log)}
                                className="p-1 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                title="Editar despesa"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteExpense(log.id)}
                                className="p-1 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                title="Excluir despesa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab: Vistorias */}
        {activeCategory === 'vistoria' && (
          <div className="min-w-[600px] text-gray-300 space-y-3">
            {onClearAllVistorias && filteredVistorias.length > 0 && (
              <div className="flex justify-between items-center bg-purple-950/20 border border-purple-500/20 p-2.5 rounded-xl">
                <span className="text-xs font-semibold text-purple-200 flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-purple-400" />
                  Total de vistorias registradas: <strong>{filteredVistorias.length}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (onClearAllVistorias) {
                      onClearAllVistorias();
                    }
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  title="Excluir todas as vistorias registradas"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Todas as Vistorias</span>
                </button>
              </div>
            )}

            {filteredVistorias.length === 0 ? (
              <p className="text-center text-gray-500 text-xs py-8">Nenhuma vistoria encontrada.</p>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3">Data</th>
                    <th className="py-3">Veículo</th>
                    <th className="py-3">Tipo</th>
                    <th className="py-3">Checklist / Status</th>
                    <th className="py-3">Observações</th>
                    <th className="py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {filteredVistorias.map((log) => {
                    const isEditing = editingVistoriaId === log.id;
                    const totalItems = Object.keys(log.checklist || {}).length;
                    const approvedCount = Object.values(log.checklist || {}).filter(Boolean).length;
                    const isFullApproved = totalItems > 0 && approvedCount === totalItems;

                    return (
                      <tr key={log.id} className={`transition-colors ${isEditing ? 'bg-blue-500/5' : 'hover:bg-white/[0.01]'}`}>
                        <td className="py-3.5 font-medium text-gray-400 font-mono">
                          {isEditing ? (
                            <input
                              type="date"
                              value={editVistoriaDate}
                              onChange={(e) => setEditVistoriaDate(e.target.value)}
                              className="bg-neutral-900 border border-white/10 text-white rounded px-2 py-1 text-xs focus:outline-hidden font-mono"
                            />
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-purple-400" />
                              {formatDate(log.date)}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5">
                          <button
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('focus-vehicle', { detail: { vehicleId: log.vehicleId } }));
                            }}
                            className="font-bold text-blue-400 hover:text-blue-300 hover:underline cursor-pointer text-left focus:outline-hidden"
                            title="Clique para ir direto para este carro"
                          >
                            {getVehiclePlate(log.vehicleId)}
                          </button>
                        </td>
                        <td className="py-3.5">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editVistoriaType}
                              onChange={(e) => setEditVistoriaType(e.target.value)}
                              className="bg-neutral-900 border border-white/10 text-white rounded px-2 py-1 text-xs focus:outline-hidden w-full max-w-[120px]"
                            />
                          ) : (
                            <span className="px-2 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/15 font-semibold rounded-md text-[10px]">
                              {log.type || 'Semanal'}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            isFullApproved
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {isFullApproved ? 'Aprovado (100%)' : `${approvedCount}/${totalItems} itens aprovados`}
                          </span>
                        </td>
                        <td className="py-3.5 max-w-xs text-gray-300">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editVistoriaNotes}
                              onChange={(e) => setEditVistoriaNotes(e.target.value)}
                              className="bg-neutral-900 border border-white/10 text-white rounded px-2 py-1 text-xs focus:outline-hidden w-full max-w-[200px]"
                            />
                          ) : (
                            <p className="line-clamp-1 italic text-[11px]">
                              {log.notes || 'Sem observações'}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleSaveVistoriaEdit(log)}
                                className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                title="Salvar vistoria"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingVistoriaId(null)}
                                className="p-1 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                title="Cancelar edição"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleStartEditVistoria(log)}
                                className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Editar Vistoria"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {onDeleteVistoria && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteVistoria(log.id)}
                                  className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                  title="Excluir Vistoria"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
      </div>
      )}
    </div>
  );
}
