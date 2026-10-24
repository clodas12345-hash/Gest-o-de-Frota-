import React, { useState, useEffect } from 'react';
import { Vehicle, MaintenanceLog, ExpenseLog, Vistoria, FuelLog, MAINTENANCE_CATEGORIES, MAINTENANCE_SCOPES, getScopesForCategory } from '../types';
import { Search, Wrench, Landmark, Trash2, Calendar, User, Gauge, Edit2, Check, X, ChevronDown, ChevronUp, History, ClipboardCheck, Droplets, MapPin, Coins, Car } from 'lucide-react';
import CurrencyInput from './CurrencyInput';

interface HistoryLogsProps {
  vehicles: Vehicle[];
  fuelLogs?: FuelLog[];
  maintenanceLogs: MaintenanceLog[];
  expenseLogs: ExpenseLog[];
  vistorias?: Vistoria[];
  
  onDeleteFuel?: (id: string) => void;
  onDeleteMaintenance: (id: string) => void;
  onDeleteExpense: (id: string) => void;
  onDeleteVistoria?: (id: string) => void;

  onUpdateFuel?: (updatedLog: FuelLog) => void;
  onUpdateMaintenance?: (updatedLog: MaintenanceLog) => void;
  onUpdateExpense?: (updatedLog: ExpenseLog) => void;
  onUpdateVistoria?: (updatedLog: Vistoria) => void;

  onClearAllVistorias?: () => void;
  defaultExpanded?: boolean;
}

type LogCategory = 'all_costs' | 'maintenance' | 'expense' | 'vistoria' | 'fuel';

export function HistoryLogs({
  vehicles,
  fuelLogs = [],
  maintenanceLogs,
  expenseLogs,
  vistorias = [],
  onDeleteFuel,
  onDeleteMaintenance,
  onDeleteExpense,
  onDeleteVistoria,
  onUpdateFuel,
  onUpdateMaintenance,
  onUpdateExpense,
  onUpdateVistoria,
  onClearAllVistorias,
  defaultExpanded = false,
}: HistoryLogsProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [activeCategory, setActiveCategory] = useState<LogCategory>('all_costs');
  const [filterVehicleId, setFilterVehicleId] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterMaintCategory, setFilterMaintCategory] = useState<string>('all');
  const [filterMaintScope, setFilterMaintScope] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  React.useEffect(() => {
    const handleOpenHistory = () => {
      setIsExpanded(true);
      setActiveCategory('maintenance');
    };
    window.addEventListener('open-maintenance-history', handleOpenHistory);
    return () => window.removeEventListener('open-maintenance-history', handleOpenHistory);
  }, []);

  // Inline editing states for expenses
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editExpenseVehicleId, setEditExpenseVehicleId] = useState<string>('');
  const [editDesc, setEditDesc] = useState('');
  const [editCost, setEditCost] = useState(0);
  const [editCategory, setEditCategory] = useState<ExpenseLog['category']>('Outros');
  const [editDate, setEditDate] = useState('');

  // Inline editing states for maintenance
  const [editingMaintId, setEditingMaintId] = useState<string | null>(null);
  const [editMaintVehicleId, setEditMaintVehicleId] = useState<string>('');
  const [editMaintDate, setEditMaintDate] = useState('');
  const [editMaintType, setEditMaintType] = useState<MaintenanceLog['type']>('Outro');
  const [editMaintCategory, setEditMaintCategory] = useState<string>('');
  const [editMaintScope, setEditMaintScope] = useState<string>('');

  useEffect(() => {
    if (editingMaintId) {
      const scopes = getScopesForCategory(editMaintCategory);
      if (!scopes.includes(editMaintScope)) {
        setEditMaintScope(scopes[0] || '');
      }
    }
  }, [editMaintCategory]);
  const [editMaintDesc, setEditMaintDesc] = useState('');
  const [editMaintShop, setEditMaintShop] = useState('');
  const [editMaintCurrentKm, setEditMaintCurrentKm] = useState<number | undefined>(undefined);
  const [editMaintNextKm, setEditMaintNextKm] = useState(0);
  const [editMaintCost, setEditMaintCost] = useState(0);
  const [editMaintBoNumber, setEditMaintBoNumber] = useState('');
  const [editMaintPartsReplaced, setEditMaintPartsReplaced] = useState('');
  const [editMaintParcelasPagas, setEditMaintParcelasPagas] = useState<number | undefined>(undefined);
  const [editMaintParcelasTotais, setEditMaintParcelasTotais] = useState<number | undefined>(undefined);

  // Inline editing states for fuel
  const [editingFuelId, setEditingFuelId] = useState<string | null>(null);
  const [editFuelDate, setEditFuelDate] = useState('');
  const [editFuelKm, setEditFuelKm] = useState(0);
  const [editFuelLiters, setEditFuelLiters] = useState(0);
  const [editFuelPrice, setEditFuelPrice] = useState(0);
  const [editFuelTotal, setEditFuelTotal] = useState(0);
  const [editFuelType, setEditFuelType] = useState<FuelLog['fuelType']>('Gasolina');
  const [editFuelStation, setEditFuelStation] = useState('');

  // Inline editing states for vistoria
  const [editingVistoriaId, setEditingVistoriaId] = useState<string | null>(null);
  const [editVistoriaDate, setEditVistoriaDate] = useState('');
  const [editVistoriaType, setEditVistoriaType] = useState('');
  const [editVistoriaNotes, setEditVistoriaNotes] = useState('');

  // Start editing handlers
  const handleStartEditExpense = (log: ExpenseLog) => {
    setEditingExpenseId(log.id);
    setEditExpenseVehicleId(log.vehicleId);
    setEditDesc(log.description);
    setEditCost(log.cost);
    setEditCategory(log.category);
    setEditDate(log.date);
  };

  const handleStartEditMaint = (log: MaintenanceLog) => {
    setEditingMaintId(log.id);
    setEditMaintVehicleId(log.vehicleId);
    setEditMaintDate(log.date);
    setEditMaintType(log.type);
    setEditMaintCategory(log.category || MAINTENANCE_CATEGORIES[0]);
    setEditMaintScope(log.scope || MAINTENANCE_SCOPES[0]);
    setEditMaintDesc(log.description);
    setEditMaintShop(log.shopName || '');
    setEditMaintCurrentKm(log.currentKm);
    setEditMaintNextKm(log.nextKm || 0);
    setEditMaintCost(log.cost);
    setEditMaintBoNumber(log.boNumber || '');
    setEditMaintPartsReplaced(log.partsReplaced || '');
    setEditMaintParcelasPagas(log.parcelasPagas);
    setEditMaintParcelasTotais(log.parcelasTotais);
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
        vehicleId: editExpenseVehicleId || log.vehicleId,
        description: editDesc.trim(),
        cost: editCost,
        category: editCategory,
        date: editDate,
      });
    }
    setEditingExpenseId(null);
  };

  const handleSaveMaintEdit = (log: MaintenanceLog) => {
    if (onUpdateMaintenance) {
      onUpdateMaintenance({
        ...log,
        vehicleId: editMaintVehicleId || log.vehicleId,
        date: editMaintDate,
        type: editMaintType,
        category: editMaintCategory || undefined,
        scope: editMaintScope || undefined,
        description: editMaintDesc.trim(),
        shopName: editMaintShop.trim() || undefined,
        currentKm: editMaintCurrentKm,
        nextKm: editMaintNextKm > 0 ? editMaintNextKm : undefined,
        cost: editMaintCost,
        boNumber: editMaintBoNumber.trim() || undefined,
        partsReplaced: editMaintPartsReplaced.trim() || undefined,
        parcelasPagas: editMaintParcelasPagas,
        parcelasTotais: editMaintParcelasTotais
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

  const handleSaveVistoriaEdit = (log: Vistoria) => {
    if (onUpdateVistoria) {
      onUpdateVistoria({
        ...log,
        date: editVistoriaDate,
        type: (['entrega', 'periódica', 'devolução'].includes(editVistoriaType.trim().toLowerCase()) ? editVistoriaType.trim().toLowerCase() : undefined) as any,
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

  // Month helpers
  const MONTH_NAMES_PT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const formatMonthYear = (monthKey: string) => {
    if (!monthKey || monthKey === 'Sem data') return 'Sem data';
    const [yearStr, monthStr] = monthKey.split('-');
    const monthIdx = parseInt(monthStr, 10) - 1;
    const monthName = MONTH_NAMES_PT[monthIdx] || monthStr;
    return `${monthName} de ${yearStr}`;
  };

  const groupLogsByMonth = <T extends { date: string }>(logs: T[]): [string, T[]][] => {
    const groups: { [key: string]: T[] } = {};
    logs.forEach((log) => {
      const key = log.date && log.date.length >= 7 ? log.date.substring(0, 7) : 'Sem data';
      if (!groups[key]) groups[key] = [];
      groups[key].push(log);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  };

  // Filter logs based on search, vehicle, and month selection
  const filterByCarAndSearch = <T extends { vehicleId: string; date: string; [key: string]: any }>(
    logsList: T[],
    searchFields: (item: T) => boolean
  ) => {
    return logsList
      .filter((item) => filterVehicleId === 'all' || item.vehicleId === filterVehicleId)
      .filter((item) => filterMonth === 'all' || (item.date && item.date.startsWith(filterMonth)))
      .filter((item) => {
        if (!searchQuery) return true;
        return searchFields(item);
      })
      .sort((a, b) => b.date.localeCompare(a.date)); // Latest first
  };

  const availableMonths = React.useMemo(() => {
    const currentList =
      activeCategory === 'all_costs'
        ? [...maintenanceLogs, ...expenseLogs]
        : activeCategory === 'maintenance'
        ? maintenanceLogs
        : activeCategory === 'expense'
        ? expenseLogs
        : activeCategory === 'vistoria'
        ? vistorias
        : fuelLogs;
    const set = new Set<string>();
    currentList.forEach((item) => {
      if (item.date && item.date.length >= 7) {
        set.add(item.date.substring(0, 7));
      }
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [activeCategory, maintenanceLogs, expenseLogs, vistorias, fuelLogs]);

  const filteredMaint = filterByCarAndSearch(maintenanceLogs, (item) =>
    (item.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.shopName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (item.type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.scope || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    getVehicleName(item.vehicleId).toLowerCase().includes(searchQuery.toLowerCase())
  ).filter((item) => {
    if (filterMaintCategory !== 'all' && item.category !== filterMaintCategory) return false;
    if (filterMaintScope !== 'all' && item.scope !== filterMaintScope) return false;
    return true;
  });

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

  type UnifiedCostItem =
    | { kind: 'maintenance'; data: MaintenanceLog; id: string; date: string; vehicleId: string; cost: number; description: string; category?: string }
    | { kind: 'expense'; data: ExpenseLog; id: string; date: string; vehicleId: string; cost: number; description: string; category: string };

  const unifiedCosts = React.useMemo<UnifiedCostItem[]>(() => {
    const list: UnifiedCostItem[] = [];
    filteredMaint.forEach((m) => {
      list.push({
        kind: 'maintenance',
        data: m,
        id: m.id,
        date: m.date,
        vehicleId: m.vehicleId,
        cost: m.cost,
        description: m.description,
        category: m.category || m.type,
      });
    });
    filteredExpenses.forEach((e) => {
      list.push({
        kind: 'expense',
        data: e,
        id: e.id,
        date: e.date,
        vehicleId: e.vehicleId,
        cost: e.cost,
        description: e.description,
        category: e.category,
      });
    });
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredMaint, filteredExpenses]);

  const groupedMaint = React.useMemo(() => groupLogsByMonth(filteredMaint), [filteredMaint]);
  const groupLogsByVehicle = <T extends { vehicleId: string }>(logs: T[]): [string, T[]][] => {
    const groups: { [vehicleId: string]: T[] } = {};
    logs.forEach((log) => {
      const vId = log.vehicleId || 'unknown';
      if (!groups[vId]) groups[vId] = [];
      groups[vId].push(log);
    });
    return Object.entries(groups).sort(([aId], [bId]) => {
      const nameA = getVehicleName(aId);
      const nameB = getVehicleName(bId);
      return nameA.localeCompare(nameB);
    });
  };
  const groupedMaintByVehicle = React.useMemo(() => groupLogsByVehicle(filteredMaint), [filteredMaint]);
  const groupedExpenses = React.useMemo(() => groupLogsByMonth(filteredExpenses), [filteredExpenses]);
  const groupedVistorias = React.useMemo(() => groupLogsByMonth(filteredVistorias), [filteredVistorias]);
  const groupedUnifiedCosts = React.useMemo(() => groupLogsByMonth(unifiedCosts), [unifiedCosts]);

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

  const renderMaintEditForm = (log: MaintenanceLog) => (
    <div className="space-y-4">
      {/* Top Header & Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl shrink-0">
            <Wrench className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white flex items-center gap-2 flex-wrap">
              <span>Editar Manutenção</span>
              <span className="text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                {getVehiclePlate(editMaintVehicleId || log.vehicleId)}
              </span>
            </p>
            <p className="text-[10px] text-gray-400">Preencha os campos e salve as alterações.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setEditingMaintId(null)}
            className="flex-1 sm:flex-initial px-3 py-1.5 text-xs text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 border border-white/10"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancelar</span>
          </button>
          <button
            type="button"
            onClick={() => handleSaveMaintEdit(log)}
            className="flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-blue-500/20"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Salvar Alterações</span>
          </button>
        </div>
      </div>

      {/* Grid of Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
        {/* Veículo Selector */}
        <div className="space-y-1 sm:col-span-2">
          <label className="text-[11px] font-semibold text-gray-400 flex items-center justify-between">
            <span>Veículo / Carro</span>
            <span className="text-[10px] text-blue-400 font-medium">Trocar carro</span>
          </label>
          <select
            value={editMaintVehicleId}
            onChange={(e) => setEditMaintVehicleId(e.target.value)}
            className="w-full h-9 bg-black/60 border border-blue-500/40 text-blue-200 font-medium rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-blue-400"
          >
            {vehicles.map((v) => (
              <option key={v.id} value={v.id} className="bg-[#111111] text-white">
                {v.brand} {v.model} ({v.plate})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-gray-400">Data do Serviço</label>
          <input
            type="date"
            value={editMaintDate}
            onChange={(e) => setEditMaintDate(e.target.value)}
            className="w-full h-9 bg-black/60 border border-white/15 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-blue-500 scheme-dark font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-gray-400">Tipo de Manutenção</label>
          <select
            value={editMaintType}
            onChange={(e) => setEditMaintType(e.target.value as any)}
            className="w-full h-9 bg-black/60 border border-white/15 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-blue-500 font-medium"
          >
            <option value="Revisão">Revisão</option>
            <option value="Preventiva">Preventiva</option>
            <option value="Corretiva">Corretiva</option>
            <option value="Batida/Acidente">Batida/Acidente</option>
            <option value="Pneus">Pneus</option>
            <option value="Palhetas">Palhetas</option>
            <option value="Pastilhas">Pastilhas</option>
            <option value="Outro">Outro</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-gray-400">Categoria</label>
          <select
            value={editMaintCategory}
            onChange={(e) => setEditMaintCategory(e.target.value)}
            className="w-full h-9 bg-black/60 border border-blue-500/40 text-blue-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-blue-400 font-medium"
          >
            {MAINTENANCE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat} className="bg-[#111111] text-white">
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-gray-400">Escopo</label>
          <select
            value={editMaintScope}
            onChange={(e) => setEditMaintScope(e.target.value)}
            className="w-full h-9 bg-black/60 border border-purple-500/40 text-purple-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-purple-400 font-medium"
          >
            {getScopesForCategory(editMaintCategory).map((sc) => (
              <option key={sc} value={sc} className="bg-[#111111] text-white">
                {sc}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-gray-400">KM no Serviço</label>
          <input
            type="number"
            value={editMaintCurrentKm ?? ''}
            onChange={(e) => setEditMaintCurrentKm(e.target.value === '' ? undefined : Number(e.target.value))}
            placeholder="Ex: 45000"
            className="w-full h-9 bg-black/60 border border-cyan-500/40 text-cyan-300 font-mono font-bold rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-cyan-400"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-gray-400">Próxima Revisão (KM)</label>
          <input
            type="number"
            value={editMaintNextKm || ''}
            onChange={(e) => setEditMaintNextKm(Number(e.target.value))}
            placeholder="Ex: 55000"
            className="w-full h-9 bg-black/60 border border-white/15 text-white font-mono rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-gray-400">Custo Total (R$)</label>
          <CurrencyInput
            value={editMaintCost}
            onChange={setEditMaintCost}
            placeholder="0,00"
            className="w-full h-9 bg-black/60 border border-white/15 text-emerald-400 font-mono font-bold rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-gray-400">Oficina / Estabelecimento</label>
          <input
            type="text"
            value={editMaintShop}
            onChange={(e) => setEditMaintShop(e.target.value)}
            placeholder="Ex: Concessionária Fiat"
            className="w-full h-9 bg-black/60 border border-white/15 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-gray-400">Nº do B.O. (Opcional)</label>
          <input
            type="text"
            value={editMaintBoNumber}
            onChange={(e) => setEditMaintBoNumber(e.target.value)}
            placeholder="Ex: BO 12345/2026"
            className="w-full h-9 bg-black/60 border border-white/15 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-gray-400">Peças Trocadas</label>
          <input
            type="text"
            value={editMaintPartsReplaced}
            onChange={(e) => setEditMaintPartsReplaced(e.target.value)}
            placeholder="Ex: Óleo, Filtros, Pastilhas..."
            className="w-full h-9 bg-black/60 border border-white/15 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-gray-400">Parcelas Pagas</label>
          <input
            type="number"
            value={editMaintParcelasPagas ?? ''}
            onChange={(e) => setEditMaintParcelasPagas(e.target.value === '' ? undefined : Number(e.target.value))}
            placeholder="Ex: 1"
            className="w-full h-9 bg-black/60 border border-white/15 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-amber-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-gray-400">Total de Parcelas</label>
          <input
            type="number"
            value={editMaintParcelasTotais ?? ''}
            onChange={(e) => setEditMaintParcelasTotais(e.target.value === '' ? undefined : Number(e.target.value))}
            placeholder="Ex: 10"
            className="w-full h-9 bg-black/60 border border-white/15 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-amber-500"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-gray-400">Descrição Detalhada do Serviço</label>
        <input
          type="text"
          value={editMaintDesc}
          onChange={(e) => setEditMaintDesc(e.target.value)}
          placeholder="Descreva o serviço realizado..."
          className="w-full h-9 bg-black/60 border border-white/15 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-blue-500"
        />
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-3 border-t border-white/10">
        <button
          type="button"
          onClick={() => setEditingMaintId(null)}
          className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-white/10"
        >
          <X className="w-3.5 h-3.5" />
          <span>Cancelar</span>
        </button>
        <button
          type="button"
          onClick={() => handleSaveMaintEdit(log)}
          className="w-full sm:w-auto px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/25"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Salvar Alterações</span>
        </button>
      </div>
    </div>
  );

  const renderExpenseEditForm = (log: ExpenseLog) => (
    <div className="p-4 bg-[#121620] border-2 border-purple-500/50 rounded-2xl shadow-xl space-y-3">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <span className="text-xs font-bold text-white">Editar Despesa ({getVehiclePlate(editExpenseVehicleId || log.vehicleId)})</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setEditingExpenseId(null)}
            className="px-2.5 py-1 text-xs text-gray-300 hover:text-white bg-white/5 rounded-lg border border-white/10 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => handleSaveExpenseEdit(log)}
            className="px-3 py-1 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-md shadow-purple-500/20 cursor-pointer"
          >
            Salvar
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
        <div className="space-y-1 sm:col-span-2">
          <label className="text-[11px] font-semibold text-gray-400 flex items-center justify-between">
            <span>Veículo / Carro</span>
            <span className="text-[10px] text-purple-400 font-medium">Trocar carro</span>
          </label>
          <select
            value={editExpenseVehicleId}
            onChange={(e) => setEditExpenseVehicleId(e.target.value)}
            className="w-full h-9 bg-black/60 border border-purple-500/40 text-purple-200 font-medium rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-purple-400"
          >
            {vehicles.map((v) => (
              <option key={v.id} value={v.id} className="bg-[#111111] text-white">
                {v.brand} {v.model} ({v.plate})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-gray-400">Data</label>
          <input
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            className="w-full h-9 bg-black/60 border border-white/15 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-purple-500 scheme-dark font-mono"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-gray-400">Categoria</label>
          <select
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value as any)}
            className="w-full h-9 bg-black/60 border border-white/15 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-purple-500"
          >
            <option value="IPVA">IPVA</option>
            <option value="Seguro">Seguro</option>
            <option value="Licenciamento">Licenciamento</option>
            <option value="Multa">Multa</option>
            <option value="Lavagem">Lavagem</option>
            <option value="Estacionamento">Estacionamento</option>
            <option value="Financiamento">Financiamento</option>
            <option value="Rastreador">Rastreador</option>
            <option value="Outros">Outros</option>
          </select>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-[11px] font-semibold text-gray-400">Descrição</label>
          <input
            type="text"
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            className="w-full h-9 bg-black/60 border border-white/15 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-purple-500"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-[11px] font-semibold text-gray-400">Valor Total (R$)</label>
          <CurrencyInput
            value={editCost}
            onChange={setEditCost}
            className="w-full h-9 bg-black/60 border border-white/15 text-emerald-400 font-mono font-bold rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-emerald-500"
          />
        </div>
      </div>
    </div>
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
        <div className="space-y-6 pt-2 border-t border-white/5 max-w-full overflow-hidden">
          {/* Global Filter Bar */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${activeCategory === 'maintenance' ? 'lg:grid-cols-3 xl:grid-cols-5' : 'sm:grid-cols-3'} gap-2.5 w-full max-w-full min-w-0`}>
            {/* Vehicle Select */}
            <select
              value={filterVehicleId}
              onChange={(e) => setFilterVehicleId(e.target.value)}
              className="w-full h-10 max-w-full text-xs font-semibold bg-white/[0.03] border border-white/10 text-gray-200 px-3 rounded-xl focus:outline-hidden focus:border-blue-500/50 focus:bg-[#1a1a1a] truncate min-w-0"
              id="filter-select-vehicle"
            >
              <option value="all" className="bg-[#111111] text-gray-200">Filtro: Todos os Carros</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id} className="bg-[#111111] text-gray-200">
                  {v.brand} {v.model} ({v.plate})
                </option>
              ))}
            </select>

            {/* Month Select Filter */}
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full h-10 max-w-full text-xs font-semibold bg-white/[0.03] border border-white/10 text-gray-200 px-3 rounded-xl focus:outline-hidden focus:border-blue-500/50 focus:bg-[#1a1a1a] truncate min-w-0"
              id="filter-select-month"
            >
              <option value="all" className="bg-[#111111] text-gray-200">Filtro: Todos os Meses</option>
              {availableMonths.map((mKey) => (
                <option key={mKey} value={mKey} className="bg-[#111111] text-gray-200">
                  {formatMonthYear(mKey)}
                </option>
              ))}
            </select>

            {/* Maintenance Category Select Filter */}
            {activeCategory === 'maintenance' && (
              <select
                value={filterMaintCategory}
                onChange={(e) => setFilterMaintCategory(e.target.value)}
                className="w-full h-10 max-w-full text-xs font-semibold bg-blue-500/10 border border-blue-500/30 text-blue-300 px-3 rounded-xl focus:outline-hidden focus:border-blue-500 focus:bg-[#1a1a1a] truncate min-w-0"
                id="filter-select-category"
              >
                <option value="all" className="bg-[#111111] text-gray-200">Categoria: Todas ({MAINTENANCE_CATEGORIES.length})</option>
                {MAINTENANCE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#111111] text-white">
                    {cat}
                  </option>
                ))}
              </select>
            )}

            {/* Maintenance Scope Select Filter */}
            {activeCategory === 'maintenance' && (
              <select
                value={filterMaintScope}
                onChange={(e) => setFilterMaintScope(e.target.value)}
                className="w-full h-10 max-w-full text-xs font-semibold bg-purple-500/10 border border-purple-500/30 text-purple-300 px-3 rounded-xl focus:outline-hidden focus:border-purple-500 focus:bg-[#1a1a1a] truncate min-w-0"
                id="filter-select-scope"
              >
                <option value="all" className="bg-[#111111] text-gray-200">Escopo: Todos ({MAINTENANCE_SCOPES.length})</option>
                {MAINTENANCE_SCOPES.map((sc) => (
                  <option key={sc} value={sc} className="bg-[#111111] text-white">
                    {sc}
                  </option>
                ))}
              </select>
            )}

            {/* Search Input */}
            <div className="relative w-full min-w-0 flex items-center">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar registros..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 text-xs border border-white/10 rounded-xl pl-9 pr-4 w-full bg-white/[0.03] focus:outline-hidden focus:bg-[#1a1a1a] focus:border-blue-500/50 text-white font-medium placeholder-gray-500 truncate"
                id="filter-search-input"
              />
            </div>
          </div>

      {/* Categories Toggle Row */}
      <div className="flex gap-2 border-b border-white/5 pb-2 overflow-x-auto shrink-0 scrollbar-none">
        <button
          onClick={() => setActiveCategory('all_costs')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeCategory === 'all_costs'
              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10'
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
          id="tab-history-all-costs"
        >
          <Coins className="w-4 h-4" />
          Todas (Despesas & Manutenções) ({unifiedCosts.length})
        </button>

        <button
          onClick={() => setActiveCategory('maintenance')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeCategory === 'maintenance'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
          id="tab-history-maintenance"
        >
          <Wrench className="w-4 h-4" />
          Apenas Manutenções ({filteredMaint.length})
        </button>

        <button
          onClick={() => setActiveCategory('expense')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeCategory === 'expense'
              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
          id="tab-history-expense"
        >
          <Landmark className="w-4 h-4" />
          Apenas Outras Despesas ({filteredExpenses.length})
        </button>

        <button
          onClick={() => setActiveCategory('vistoria')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
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
      <div id="history-logs-display">
        {/* Tab: All Costs (Expenses + Maintenance Combined) */}
        {activeCategory === 'all_costs' && (
          <div>
            {unifiedCosts.length === 0 ? (
              <p className="text-center text-gray-500 text-xs py-8">Nenhum custo (despesa ou manutenção) registrado.</p>
            ) : (
              <>
                {/* Mobile View: Cards */}
                <div className="md:hidden space-y-4">
                  {groupedUnifiedCosts.map(([monthKey, monthItems]) => {
                    const monthTotal = monthItems.reduce((acc, it) => acc + (it.cost || 0), 0);
                    const maintCount = monthItems.filter((i) => i.kind === 'maintenance').length;
                    const expenseCount = monthItems.filter((i) => i.kind === 'expense').length;

                    return (
                      <div key={monthKey} className="space-y-2.5">
                        {/* Month Header Banner */}
                        <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/25 rounded-xl px-3.5 py-2.5 sticky top-2 z-10 backdrop-blur-md shadow-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span className="text-xs font-bold text-white uppercase tracking-wider truncate">
                              {formatMonthYear(monthKey)}
                            </span>
                            <span className="text-[10px] font-semibold text-blue-300 bg-blue-500/20 px-1.5 py-0.5 rounded shrink-0">
                              {monthItems.length} {monthItems.length === 1 ? 'item' : 'itens'} ({maintCount} man., {expenseCount} desp.)
                            </span>
                          </div>
                          <span className="text-xs font-bold font-mono text-emerald-400 shrink-0 ml-2">
                            {formatBRL(monthTotal)}
                          </span>
                        </div>

                        {/* Cards for this month */}
                        <div className="space-y-2.5">
                          {monthItems.map((item) => {
                            if (item.kind === 'maintenance') {
                              const log = item.data;
                              const isEditing = editingMaintId === log.id;
                              if (isEditing) {
                                return (
                                  <div key={log.id} className="p-4 bg-[#121620] border-2 border-blue-500/50 rounded-2xl shadow-xl">
                                    {renderMaintEditForm(log)}
                                  </div>
                                );
                              }

                              return (
                                <div key={log.id} className="p-3.5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-2xl space-y-2.5 transition-all">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => {
                                          window.dispatchEvent(new CustomEvent('focus-vehicle', { detail: { vehicleId: log.vehicleId } }));
                                        }}
                                        className="font-bold text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20 hover:text-blue-300 cursor-pointer"
                                        title="Clique para ir direto para este carro"
                                      >
                                        {getVehiclePlate(log.vehicleId)}
                                      </button>
                                      <span className="flex items-center gap-1 text-[11px] text-gray-400 font-mono">
                                        <Calendar className="w-3 h-3 text-gray-500" />
                                        {formatDate(log.date)}
                                      </span>
                                    </div>
                                    <span className="font-bold font-mono text-sm text-emerald-400">
                                      {formatBRL(log.cost)}
                                    </span>
                                  </div>

                                  <div>
                                    <p className="text-xs font-semibold text-white line-clamp-2">{log.description || 'Sem descrição'}</p>
                                    <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                                      <MapPin className="w-3 h-3 text-gray-500 shrink-0" />
                                      <span className="truncate">{log.shopName || 'Oficina não especificada'}</span>
                                    </p>
                                  </div>

                                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                                    <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold rounded-md text-[10px] flex items-center gap-1">
                                      <Wrench className="w-3 h-3" /> Manutenção: {log.type}
                                    </span>
                                    {log.category && (
                                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-semibold rounded-md">
                                        {log.category}
                                      </span>
                                    )}
                                    {log.scope && (
                                      <span className="px-2 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-semibold rounded-md">
                                        {log.scope}
                                      </span>
                                    )}
                                    {log.currentKm && (
                                      <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-mono font-bold rounded-md flex items-center gap-1">
                                        <Gauge className="w-3 h-3 text-cyan-400" />
                                        {log.currentKm.toLocaleString('pt-BR')} km
                                      </span>
                                    )}
                                    {log.parcelasTotais && log.parcelasTotais > 1 && (
                                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold rounded-md">
                                        Parc: {log.parcelasPagas || 1}/{log.parcelasTotais}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                                    <button
                                      onClick={() => handleStartEditMaint(log)}
                                      className="flex items-center gap-1 px-2.5 py-1 text-xs text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-colors cursor-pointer"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                      <span>Editar</span>
                                    </button>
                                    <button
                                      onClick={() => onDeleteMaintenance(log.id)}
                                      className="flex items-center gap-1 px-2.5 py-1 text-xs text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Excluir</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            } else {
                              const log = item.data;
                              const isEditing = editingExpenseId === log.id;
                              if (isEditing) {
                                return (
                                  <div key={log.id}>
                                    {renderExpenseEditForm(log)}
                                  </div>
                                );
                              }

                              return (
                                <div key={log.id} className="p-3.5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-2xl space-y-2.5 transition-all">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => {
                                          window.dispatchEvent(new CustomEvent('focus-vehicle', { detail: { vehicleId: log.vehicleId } }));
                                        }}
                                        className="font-bold text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20 hover:text-purple-300 cursor-pointer"
                                      >
                                        {getVehiclePlate(log.vehicleId)}
                                      </button>
                                      <span className="flex items-center gap-1 text-[11px] text-gray-400 font-mono">
                                        <Calendar className="w-3 h-3 text-gray-500" />
                                        {formatDate(log.date)}
                                      </span>
                                    </div>
                                    <span className="font-bold font-mono text-sm text-emerald-400">
                                      {formatBRL(log.cost)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[10px] font-bold rounded-md flex items-center gap-1">
                                      <Landmark className="w-3 h-3" /> Despesa: {log.category}
                                    </span>
                                    <span className="text-xs text-white line-clamp-1">{log.description}</span>
                                  </div>
                                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                                    <button
                                      onClick={() => handleStartEditExpense(log)}
                                      className="flex items-center gap-1 px-2.5 py-1 text-xs text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-colors cursor-pointer"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                      <span>Editar</span>
                                    </button>
                                    <button
                                      onClick={() => onDeleteExpense(log.id)}
                                      className="flex items-center gap-1 px-2.5 py-1 text-xs text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Excluir</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            }
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden md:block overflow-x-auto text-gray-300">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                        <th className="py-3">Data</th>
                        <th className="py-3">Veículo</th>
                        <th className="py-3">Origem</th>
                        <th className="py-3">Categoria / Tipo</th>
                        <th className="py-3">Descrição detalhada</th>
                        <th className="py-3 text-right">Valor Total</th>
                        <th className="py-3 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      {groupedUnifiedCosts.map(([monthKey, monthItems]) => {
                        const monthTotal = monthItems.reduce((acc, it) => acc + (it.cost || 0), 0);
                        const maintCount = monthItems.filter((i) => i.kind === 'maintenance').length;
                        const expenseCount = monthItems.filter((i) => i.kind === 'expense').length;

                        return (
                          <React.Fragment key={monthKey}>
                            <tr className="bg-blue-950/30 border-y border-blue-500/25">
                              <td colSpan={7} className="py-2.5 px-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                                    <span className="font-bold text-xs text-white uppercase tracking-wider">
                                      {formatMonthYear(monthKey)}
                                    </span>
                                    <span className="text-[10px] font-semibold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full">
                                      {monthItems.length} lançamentos ({maintCount} manutenções, {expenseCount} despesas)
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-right">
                                    <span className="text-[11px] text-gray-400">Total no mês:</span>
                                    <span className="font-bold font-mono text-xs text-emerald-400">
                                      {formatBRL(monthTotal)}
                                    </span>
                                  </div>
                                </div>
                              </td>
                            </tr>
                            {monthItems.map((item) => {
                              if (item.kind === 'maintenance') {
                                const log = item.data;
                                const isEditing = editingMaintId === log.id;
                                if (isEditing) {
                                  return (
                                    <tr key={log.id} className="bg-[#121620] border-2 border-blue-500/40">
                                      <td colSpan={7} className="p-4 sm:p-5">
                                        {renderMaintEditForm(log)}
                                      </td>
                                    </tr>
                                  );
                                }

                                return (
                                  <tr key={log.id} className="transition-colors hover:bg-white/[0.01]">
                                    <td className="py-3 font-medium text-gray-400 font-mono">
                                      <span className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-gray-600" />
                                        {formatDate(log.date)}
                                      </span>
                                    </td>
                                    <td className="py-3">
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
                                    <td className="py-3">
                                      <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold rounded-md text-[10px] inline-flex items-center gap-1">
                                        <Wrench className="w-3 h-3" /> Manutenção
                                      </span>
                                    </td>
                                    <td className="py-3">
                                      <div className="flex flex-wrap gap-1">
                                        <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] rounded">
                                          {log.category || log.type}
                                        </span>
                                        {log.scope && (
                                          <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] rounded">
                                            {log.scope}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-3 max-w-xs">
                                      <div className="flex flex-col gap-0.5">
                                        <span className="font-semibold text-white line-clamp-1">{log.description}</span>
                                        <span className="text-[10px] text-gray-400">{log.shopName || 'Oficina não especificada'}</span>
                                      </div>
                                    </td>
                                    <td className="py-3 text-right font-bold font-mono text-emerald-400">
                                      {formatBRL(log.cost)}
                                    </td>
                                    <td className="py-3 text-center">
                                      <div className="flex items-center justify-center gap-1">
                                        <button
                                          onClick={() => handleStartEditMaint(log)}
                                          className="p-1 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
                                          title="Editar manutenção"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => onDeleteMaintenance(log.id)}
                                          className="p-1 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                          title="Excluir manutenção"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              } else {
                                const log = item.data;
                                const isEditing = editingExpenseId === log.id;
                                if (isEditing) {
                                  return (
                                    <tr key={log.id} className="bg-[#121620] border-2 border-purple-500/40">
                                      <td colSpan={7} className="p-4 sm:p-5">
                                        {renderExpenseEditForm(log)}
                                      </td>
                                    </tr>
                                  );
                                }

                                return (
                                  <tr key={log.id} className="transition-colors hover:bg-white/[0.01]">
                                    <td className="py-3 font-medium text-gray-400 font-mono">
                                      <span className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-gray-600" />
                                        {formatDate(log.date)}
                                      </span>
                                    </td>
                                    <td className="py-3">
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
                                    <td className="py-3">
                                      <span className="px-2 py-0.5 bg-purple-500/15 text-purple-300 border border-purple-500/30 font-semibold rounded-md text-[10px] inline-flex items-center gap-1">
                                        <Landmark className="w-3 h-3" /> Despesa
                                      </span>
                                    </td>
                                    <td className="py-3">
                                      <span className="px-2 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/15 font-semibold rounded-md text-[10px]">
                                        {log.category}
                                      </span>
                                    </td>
                                    <td className="py-3 text-gray-300 font-semibold">
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
                                    </td>
                                    <td className="py-3 text-right font-bold font-mono text-emerald-400">
                                      {formatBRL(log.cost)}
                                    </td>
                                    <td className="py-3 text-center">
                                      <div className="flex items-center justify-center gap-1">
                                        <button
                                          onClick={() => handleStartEditExpense(log)}
                                          className="p-1 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
                                          title="Editar despesa"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => onDeleteExpense(log.id)}
                                          className="p-1 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                          title="Excluir despesa"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              }
                            })}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab: Maintenance */}
        {activeCategory === 'maintenance' && (
          <div>
            {filteredMaint.length === 0 ? (
              <p className="text-center text-gray-500 text-xs py-8">Nenhuma manutenção encontrada.</p>
            ) : (
              <>
                {/* Mobile View: Responsive Cards (No overflow, fits phone screens) */}
                <div className="md:hidden space-y-4">
                  {groupedMaintByVehicle.map(([vehicleId, vehicleItems]) => {
                    const vehicleTotal = vehicleItems.reduce((acc, it) => acc + (it.cost || 0), 0);
                    return (
                      <div key={vehicleId} className="space-y-2.5">
                        {/* Vehicle Header Banner */}
                        <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/25 rounded-xl px-3.5 py-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <Car className="w-4 h-4 text-blue-400 shrink-0" />
                            <span className="text-xs font-bold text-white uppercase tracking-wider truncate">
                              {getVehicleName(vehicleId)}
                            </span>
                            <span className="text-[10px] font-semibold text-blue-300 bg-blue-500/20 px-1.5 py-0.5 rounded shrink-0">
                              {vehicleItems.length} {vehicleItems.length === 1 ? 'item' : 'itens'}
                            </span>
                          </div>
                          <span className="text-xs font-bold font-mono text-emerald-400 shrink-0 ml-2">
                            {formatBRL(vehicleTotal)}
                          </span>
                        </div>

                        {/* Cards for this vehicle */}
                        <div className="space-y-2.5">
                          {vehicleItems.map((log) => {
                    const isEditing = editingMaintId === log.id;
                    if (isEditing) {
                      return (
                        <div key={log.id} className="p-4 bg-[#121620] border-2 border-blue-500/50 rounded-2xl shadow-xl">
                          {renderMaintEditForm(log)}
                        </div>
                      );
                    }

                    return (
                      <div key={log.id} className="p-3.5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-2xl space-y-2.5 transition-all">
                        {/* Header: Plate, Date, Cost */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                window.dispatchEvent(new CustomEvent('focus-vehicle', { detail: { vehicleId: log.vehicleId } }));
                              }}
                              className="font-bold text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20 hover:text-blue-300 cursor-pointer"
                              title="Clique para ir direto para este carro"
                            >
                              {getVehiclePlate(log.vehicleId)}
                            </button>
                            <span className="flex items-center gap-1 text-[11px] text-gray-400 font-mono">
                              <Calendar className="w-3 h-3 text-gray-500" />
                              {formatDate(log.date)}
                            </span>
                          </div>
                          <span className="font-bold font-mono text-sm text-emerald-400">
                            {formatBRL(log.cost)}
                          </span>
                        </div>

                        {/* Description & Workshop */}
                        <div>
                          <p className="text-xs font-semibold text-white line-clamp-2">{log.description || 'Sem descrição'}</p>
                          <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-gray-500 shrink-0" />
                            <span className="truncate">{log.shopName || 'Oficina não especificada'}</span>
                          </p>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold rounded-md text-[10px]">
                            {log.type}
                          </span>
                          {log.category && (
                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-semibold rounded-md">
                              {log.category}
                            </span>
                          )}
                          {log.scope && (
                            <span className="px-2 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-semibold rounded-md">
                              {log.scope}
                            </span>
                          )}
                          {log.currentKm && (
                            <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-mono font-bold rounded-md flex items-center gap-1">
                              <Gauge className="w-3 h-3 text-cyan-400" />
                              {log.currentKm.toLocaleString('pt-BR')} km
                            </span>
                          )}
                          {log.nextKm ? (
                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-mono rounded-md">
                              Próx: {log.nextKm.toLocaleString('pt-BR')} km
                            </span>
                          ) : null}
                          {log.boNumber && (
                            <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-mono rounded-md">
                              B.O.: {log.boNumber}
                            </span>
                          )}
                          {log.partsReplaced && (
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] rounded-md">
                              Peças: {log.partsReplaced}
                            </span>
                          )}
                          {log.parcelasTotais && log.parcelasTotais > 1 && (
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold rounded-md">
                              Parc: {log.parcelasPagas || 1}/{log.parcelasTotais}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                          <button
                            onClick={() => handleStartEditMaint(log)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => onDeleteMaintenance(log.id)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Excluir</span>
                          </button>
                        </div>
                      </div>
                    );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden md:block overflow-x-auto text-gray-300">
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
                      {groupedMaintByVehicle.map(([vehicleId, vehicleItems]) => {
                        const vehicleTotal = vehicleItems.reduce((acc, it) => acc + (it.cost || 0), 0);
                        return (
                          <React.Fragment key={vehicleId}>
                            <tr className="bg-blue-950/35 border-y border-blue-500/25">
                              <td colSpan={7} className="py-3 px-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2.5">
                                    <Car className="w-4 h-4 text-blue-400" />
                                    <span className="font-bold text-xs text-white uppercase tracking-wider">
                                      {getVehicleName(vehicleId)}
                                    </span>
                                    <span className="text-[10px] font-semibold text-blue-300 bg-blue-500/20 px-2.5 py-0.5 rounded-full">
                                      {vehicleItems.length} {vehicleItems.length === 1 ? 'manutenção' : 'manutenções'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-right">
                                    <span className="text-[11px] text-gray-400">Total do veículo:</span>
                                    <span className="font-bold font-mono text-xs text-emerald-400">
                                      {formatBRL(vehicleTotal)}
                                    </span>
                                  </div>
                                </div>
                              </td>
                            </tr>
                            {vehicleItems.map((log) => {
                              const isEditing = editingMaintId === log.id;
                        if (isEditing) {
                          return (
                            <tr key={log.id} className="bg-[#121620] border-2 border-blue-500/40">
                              <td colSpan={7} className="p-4 sm:p-5">
                                {renderMaintEditForm(log)}
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={log.id} className="transition-colors hover:bg-white/[0.01]">
                            <td className="py-3.5 font-medium text-gray-400 font-mono">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-gray-600" />
                                {formatDate(log.date)}
                              </span>
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
                              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 font-semibold rounded-md text-[10px]">
                                {log.type}
                              </span>
                            </td>
                            <td className="py-3.5 max-w-xs">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-semibold text-white line-clamp-1">{log.description}</span>
                                <span className="text-[10px] text-gray-400">{log.shopName || 'Oficina não especificada'}</span>
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {log.category && (
                                    <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[9px] font-semibold rounded">
                                      {log.category}
                                    </span>
                                  )}
                                  {log.scope && (
                                    <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[9px] font-semibold rounded">
                                      {log.scope}
                                    </span>
                                  )}
                                  {log.currentKm && (
                                    <span className="px-1.5 py-0.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[9px] font-mono font-bold rounded flex items-center gap-1">
                                      <Gauge className="w-2.5 h-2.5 text-cyan-400" />
                                      {log.currentKm.toLocaleString('pt-BR')} km
                                    </span>
                                  )}
                                  {log.boNumber && (
                                    <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-mono rounded">
                                      B.O.: {log.boNumber}
                                    </span>
                                  )}
                                  {log.partsReplaced && (
                                    <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] rounded">
                                      Peças: {log.partsReplaced}
                                    </span>
                                  )}
                                  {log.parcelasTotais && log.parcelasTotais > 1 && (
                                    <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold rounded">
                                      Parc: {log.parcelasPagas || 1}/{log.parcelasTotais}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5">
                              {log.nextKm ? (
                                <span className="font-mono font-medium text-blue-400 flex items-center gap-1">
                                  <Gauge className="w-3.5 h-3.5" />
                                  {log.nextKm.toLocaleString('pt-BR')} km
                                </span>
                              ) : (
                                <span className="text-gray-500">---</span>
                              )}
                            </td>
                            <td className="py-3.5 text-right font-bold font-mono text-white">
                              {formatBRL(log.cost)}
                            </td>
                            <td className="py-3.5 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleStartEditMaint(log)}
                                  className="p-1 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
                                  title="Editar manutenção"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => onDeleteMaintenance(log.id)}
                                  className="p-1 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                  title="Excluir manutenção"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
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
                            <CurrencyInput
                              value={editFuelPrice}
                              onChange={setEditFuelPrice}
                              placeholder="0,00"
                              className="bg-neutral-900 border border-white/10 text-white rounded px-1.5 py-1 text-xs focus:outline-hidden w-20 text-right font-mono"
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
                            <CurrencyInput
                              value={editFuelTotal}
                              onChange={setEditFuelTotal}
                              placeholder="0,00"
                              className="bg-neutral-900 border border-white/10 text-white rounded px-1.5 py-1 text-xs focus:outline-hidden w-20 text-right font-mono"
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

        {/* Tab: Other Expenses */}
        {activeCategory === 'expense' && (
          <div>
            {filteredExpenses.length === 0 ? (
              <p className="text-center text-gray-500 text-xs py-8">Nenhuma outra despesa registrada.</p>
            ) : (
              <>
                {/* Mobile View: Cards */}
                <div className="md:hidden space-y-4">
                  {groupedExpenses.map(([monthKey, monthItems]) => {
                    const monthTotal = monthItems.reduce((acc, it) => acc + (it.cost || 0), 0);
                    return (
                      <div key={monthKey} className="space-y-2.5">
                        {/* Month Header Banner */}
                        <div className="flex items-center justify-between bg-purple-500/10 border border-purple-500/25 rounded-xl px-3.5 py-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span className="text-xs font-bold text-white uppercase tracking-wider truncate">
                              {formatMonthYear(monthKey)}
                            </span>
                            <span className="text-[10px] font-semibold text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded shrink-0">
                              {monthItems.length} {monthItems.length === 1 ? 'item' : 'itens'}
                            </span>
                          </div>
                          <span className="text-xs font-bold font-mono text-emerald-400 shrink-0 ml-2">
                            {formatBRL(monthTotal)}
                          </span>
                        </div>

                        {/* Cards for this month */}
                        <div className="space-y-2.5">
                          {monthItems.map((log) => {
                    const isEditing = editingExpenseId === log.id;
                    if (isEditing) {
                      return (
                        <div key={log.id} className="p-4 bg-[#121620] border-2 border-purple-500/50 rounded-2xl shadow-xl space-y-3">
                          <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <span className="text-xs font-bold text-white">Editar Despesa ({getVehiclePlate(editExpenseVehicleId || log.vehicleId)})</span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingExpenseId(null)}
                                className="px-2.5 py-1 text-xs text-gray-300 hover:text-white bg-white/5 rounded-lg border border-white/10"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveExpenseEdit(log)}
                                className="px-3 py-1 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-md shadow-purple-500/20"
                              >
                                Salvar
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                            <div className="space-y-1 sm:col-span-2">
                              <label className="text-[11px] font-semibold text-gray-400 flex items-center justify-between">
                                <span>Veículo / Carro</span>
                                <span className="text-[10px] text-purple-400 font-medium">Trocar carro</span>
                              </label>
                              <select
                                value={editExpenseVehicleId}
                                onChange={(e) => setEditExpenseVehicleId(e.target.value)}
                                className="w-full h-9 bg-black/60 border border-purple-500/40 text-purple-200 font-medium rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-purple-400"
                              >
                                {vehicles.map((v) => (
                                  <option key={v.id} value={v.id} className="bg-[#111111] text-white">
                                    {v.brand} {v.model} ({v.plate})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] font-semibold text-gray-400">Data</label>
                              <input
                                type="date"
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                                className="w-full h-9 bg-black/60 border border-white/15 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-purple-500 scheme-dark font-mono"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] font-semibold text-gray-400">Categoria</label>
                              <select
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value as any)}
                                className="w-full h-9 bg-black/60 border border-white/15 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-purple-500"
                              >
                                <option value="IPVA">IPVA</option>
                                <option value="Seguro">Seguro</option>
                                <option value="Licenciamento">Licenciamento</option>
                                <option value="Multa">Multa</option>
                                <option value="Lavagem">Lavagem</option>
                                <option value="Estacionamento">Estacionamento</option>
                                <option value="Financiamento">Financiamento</option>
                                <option value="Rastreador">Rastreador</option>
                                <option value="Outros">Outros</option>
                              </select>
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                              <label className="text-[11px] font-semibold text-gray-400">Descrição</label>
                              <input
                                type="text"
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                className="w-full h-9 bg-black/60 border border-white/15 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-purple-500"
                              />
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                              <label className="text-[11px] font-semibold text-gray-400">Valor Total (R$)</label>
                              <CurrencyInput
                                value={editCost}
                                onChange={setEditCost}
                                className="w-full h-9 bg-black/60 border border-white/15 text-emerald-400 font-mono font-bold rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-emerald-500"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={log.id} className="p-3.5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-2xl space-y-2.5 transition-all">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                window.dispatchEvent(new CustomEvent('focus-vehicle', { detail: { vehicleId: log.vehicleId } }));
                              }}
                              className="font-bold text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20 hover:text-purple-300 cursor-pointer"
                            >
                              {getVehiclePlate(log.vehicleId)}
                            </button>
                            <span className="flex items-center gap-1 text-[11px] text-gray-400 font-mono">
                              <Calendar className="w-3 h-3 text-gray-500" />
                              {formatDate(log.date)}
                            </span>
                          </div>
                          <span className="font-bold font-mono text-sm text-emerald-400">
                            {formatBRL(log.cost)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-semibold rounded-md">
                            {log.category}
                          </span>
                          <span className="text-xs text-white line-clamp-1">{log.description}</span>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                          <button
                            onClick={() => handleStartEditExpense(log)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => onDeleteExpense(log.id)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Excluir</span>
                          </button>
                        </div>
                      </div>
                    );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden md:block overflow-x-auto text-gray-300">
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
                  {groupedExpenses.map(([monthKey, monthItems]) => {
                    const monthTotal = monthItems.reduce((acc, it) => acc + (it.cost || 0), 0);
                    return (
                      <React.Fragment key={monthKey}>
                        <tr className="bg-purple-950/30 border-y border-purple-500/25">
                          <td colSpan={6} className="py-2.5 px-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                                <span className="font-bold text-xs text-white uppercase tracking-wider">
                                  {formatMonthYear(monthKey)}
                                </span>
                                <span className="text-[10px] font-semibold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">
                                  {monthItems.length} {monthItems.length === 1 ? 'lançamento' : 'lançamentos'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-right">
                                <span className="text-[11px] text-gray-400">Total no mês:</span>
                                <span className="font-bold font-mono text-xs text-emerald-400">
                                  {formatBRL(monthTotal)}
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                        {monthItems.map((log) => {
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
                          {isEditing ? (
                            <select
                              value={editExpenseVehicleId}
                              onChange={(e) => setEditExpenseVehicleId(e.target.value)}
                              className="bg-neutral-900 border border-purple-500/30 text-purple-200 rounded px-2 py-1 text-xs focus:outline-hidden font-medium max-w-[130px]"
                            >
                              {vehicles.map((v) => (
                                <option key={v.id} value={v.id} className="bg-[#111111] text-white">
                                  {v.plate}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <button
                              onClick={() => {
                                window.dispatchEvent(new CustomEvent('focus-vehicle', { detail: { vehicleId: log.vehicleId } }));
                              }}
                              className="font-bold text-blue-400 hover:text-blue-300 hover:underline cursor-pointer text-left focus:outline-hidden"
                              title="Clique para ir direto para este carro"
                            >
                              {getVehiclePlate(log.vehicleId)}
                            </button>
                          )}
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
                              <CurrencyInput
                                value={editCost}
                                onChange={setEditCost}
                                placeholder="0,00"
                                className="bg-neutral-900 border border-white/10 text-white rounded px-1.5 py-1 text-xs focus:outline-hidden w-20 text-right font-mono"
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
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    )}

        {/* Tab: Vistorias */}
        {activeCategory === 'vistoria' && (
          <div className="space-y-3">
            {onClearAllVistorias && filteredVistorias.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-purple-950/20 border border-purple-500/20 p-2.5 rounded-xl">
                <span className="text-xs font-semibold text-purple-200 flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-purple-400 shrink-0" />
                  Total de vistorias registradas: <strong>{filteredVistorias.length}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (onClearAllVistorias) {
                      onClearAllVistorias();
                    }
                  }}
                  className="w-full sm:w-auto justify-center px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
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
              <>
                {/* Mobile View: Cards */}
                <div className="md:hidden space-y-4">
                  {groupedVistorias.map(([monthKey, monthItems]) => (
                    <div key={monthKey} className="space-y-2.5">
                      <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/25 rounded-xl px-3.5 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="text-xs font-bold text-white uppercase tracking-wider truncate">
                            {formatMonthYear(monthKey)}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-500/20 px-1.5 py-0.5 rounded">
                          {monthItems.length} {monthItems.length === 1 ? 'vistoria' : 'vistorias'}
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {monthItems.map((log) => {
                    const totalItems = Object.keys(log.checklist || {}).length;
                    const approvedCount = Object.values(log.checklist || {}).filter(Boolean).length;
                    const isFullApproved = totalItems > 0 && approvedCount === totalItems;

                    return (
                      <div key={log.id} className="p-3.5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-2xl space-y-2.5 transition-all">
                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('focus-vehicle', { detail: { vehicleId: log.vehicleId } }));
                            }}
                            className="font-bold text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20 hover:text-indigo-300 cursor-pointer"
                          >
                            {getVehiclePlate(log.vehicleId)}
                          </button>
                          <span className="flex items-center gap-1 text-[11px] text-gray-400 font-mono">
                            <Calendar className="w-3 h-3 text-purple-400" />
                            {formatDate(log.date)}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-semibold rounded-md">
                            {log.type || 'Semanal'}
                          </span>
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            log.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : isFullApproved
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {log.status === 'approved' ? '✅ Aprovada' : isFullApproved ? 'Aprovado (100%)' : `${approvedCount}/${totalItems} itens`}
                          </span>
                        </div>
                        {log.notes && (
                          <p className="text-xs text-gray-300 line-clamp-2">{log.notes}</p>
                        )}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                          {onDeleteVistoria && (
                            <button
                              type="button"
                              onClick={() => onDeleteVistoria(log.id)}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Excluir</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden md:block overflow-x-auto text-gray-300">
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
                  {groupedVistorias.map(([monthKey, monthItems]) => (
                    <React.Fragment key={monthKey}>
                      <tr className="bg-indigo-950/30 border-y border-indigo-500/25">
                        <td colSpan={6} className="py-2.5 px-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                              <span className="font-bold text-xs text-white uppercase tracking-wider">
                                {formatMonthYear(monthKey)}
                              </span>
                            </div>
                            <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full">
                              {monthItems.length} {monthItems.length === 1 ? 'vistoria' : 'vistorias'}
                            </span>
                          </div>
                        </td>
                      </tr>
                      {monthItems.map((log) => {
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
                            log.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : isFullApproved
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {log.status === 'approved' ? '✅ Aprovada & Arquivada' : isFullApproved ? 'Aprovado (100%)' : `${approvedCount}/${totalItems} itens`}
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
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    )}
      </div>
      </div>
      )}
    </div>
  );
}
