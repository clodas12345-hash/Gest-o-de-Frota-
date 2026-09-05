import React, { useState, useEffect, useRef } from 'react';
import { Vehicle, FuelLog, MaintenanceLog, TripLog, ExpenseLog, AgendaContact } from '../types';
import { X, Save, AlertCircle, Users, BookOpen, Sparkles, Mic, MicOff, Calculator, Plus, Trash2 } from 'lucide-react';
import { generateNextContractNumber } from '../utils/contractHelper';

const getNextWeekDate = (baseDateStr?: string): string => {
  if (!baseDateStr) return '';
  const parts = baseDateStr.split('-');
  if (parts.length === 3) {
    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const day = Number(parts[2]);
    const d = new Date(year, month, day);
    d.setDate(d.getDate() + 7);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }
  return baseDateStr;
};

const formatDateBR = (dateStr?: string): string => {
  if (!dateStr) return 'N/I';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

interface LogFormsProps {
  isOpen: boolean;
  onClose: () => void;
  formType: 'vehicle' | 'fuel' | 'maintenance' | 'trip' | 'expense' | null;
  vehicles: Vehicle[];
  selectedVehicleId?: string;
  vehicleToEdit?: Vehicle | null;
  contacts?: AgendaContact[];
  prefilledData?: any;
  
  onSaveVehicle: (vehicle: Vehicle) => void;
  onSaveFuel: (log: Omit<FuelLog, 'id'>) => void;
  onSaveMaintenance: (log: Omit<MaintenanceLog, 'id'>) => void;
  onSaveTrip: (log: Omit<TripLog, 'id'>) => void;
  onSaveExpense: (log: Omit<ExpenseLog, 'id'>) => void;
}

const VEHICLE_DRAFT_KEY = 'fleet_add_vehicle_draft';

export function LogForms({
  isOpen,
  onClose,
  formType,
  vehicles,
  selectedVehicleId = '',
  vehicleToEdit = null,
  contacts = [],
  prefilledData = null,
  onSaveVehicle,
  onSaveFuel,
  onSaveMaintenance,
  onSaveTrip,
  onSaveExpense,
}: LogFormsProps) {
  if (!isOpen || !formType) return null;

  // Selected vehicle id state
  const [vehicleId, setVehicleId] = useState(selectedVehicleId || (vehicles[0]?.id || ''));
  const [error, setError] = useState('');

  // 1. Vehicle Form State
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [plate, setPlate] = useState('');
  const [color, setColor] = useState('');
  const [yearFab, setYearFab] = useState<number | ''>('');
  const [yearModel, setYearModel] = useState<number | ''>('');
  const [rentalCompany, setRentalCompany] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [initialKm, setInitialKm] = useState<number | undefined>(undefined);
  const [contractNumber, setContractNumber] = useState('');
  const [valorRecebido, setValorRecebido] = useState(0);
  const [valorSemanal, setValorSemanal] = useState(0);
  const [financiamento, setFinanciamento] = useState(0);
  const [seguro, setSeguro] = useState(0);
  const [ipva, setIpva] = useState(0);
  const [showIpvaParcelado, setShowIpvaParcelado] = useState(false);
  const [ipvaTotal, setIpvaTotal] = useState<number>(0);
  const [ipvaParcelas, setIpvaParcelas] = useState<number>(10);
  const [manutencaoPreventiva, setManutencaoPreventiva] = useState(0);
  const [currentKm, setCurrentKm] = useState(0);
  const [fuelLevel, setFuelLevel] = useState(8);
  const [driver, setDriver] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [caucaoValor, setCaucaoValor] = useState(0);
  const [caucaoData, setCaucaoData] = useState('');
  const [caucaoObservacoes, setCaucaoObservacoes] = useState('');
  const [nextVistoriaDate, setNextVistoriaDate] = useState('');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [custoExtra, setCustoExtra] = useState(0);
  const [custoExtraLabel, setCustoExtraLabel] = useState('Outras Despesas');
  const [expenseParcelado, setExpenseParcelado] = useState(false);
  const [expenseTotalVal, setExpenseTotalVal] = useState<number>(0);
  const [expenseNumParcelas, setExpenseNumParcelas] = useState<number>(10);

  // 2. Fuel Form State
  const [fuelDate, setFuelDate] = useState('2026-08-01');
  const [fuelKm, setFuelKm] = useState(0);
  const [fuelLiters, setFuelLiters] = useState(0);
  const [fuelPricePerLiter, setFuelPricePerLiter] = useState(0);
  const [fuelTotalCost, setFuelTotalCost] = useState(0);
  const [fuelType, setFuelType] = useState<FuelLog['fuelType']>('Gasolina');
  const [fuelStation, setFuelStation] = useState('');

  // 3. Maintenance Form State
  const [maintDate, setMaintDate] = useState('2026-08-01');
  const [maintType, setMaintType] = useState<MaintenanceLog['type']>('Revisão');
  const [maintDescription, setMaintDescription] = useState('');
  const [maintCost, setMaintCost] = useState(0);
  const [maintShop, setMaintShop] = useState('');
  const [maintNextKm, setMaintNextKm] = useState<number | undefined>(undefined);

  // 4. Trip Form State
  const [tripDate, setTripDate] = useState('2026-08-01');
  const [tripDriver, setTripDriver] = useState('');
  const [tripStartKm, setTripStartKm] = useState(0);
  const [tripEndKm, setTripEndKm] = useState(0);
  const [tripPurpose, setTripPurpose] = useState('');

  // 5. Expense Form State
  const [expDate, setExpDate] = useState('2026-08-01');
  const [expCategory, setExpCategory] = useState<ExpenseLog['category']>('Lavagem');
  const [expDescription, setExpDescription] = useState('');
  const [expCost, setExpCost] = useState(0);

  // 6. AI Fill State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // 7. Speech Recognition State
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'pt-BR';
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setAiPrompt((prev) => (prev ? prev + ' ' + transcript : transcript));
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
    
    return () => {
       if (recognitionRef.current) {
          recognitionRef.current.abort();
       }
    };
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsRecording(true);
        } catch (e) {
          console.error(e);
        }
      } else {
        alert('Reconhecimento de voz não suportado neste navegador.');
      }
    }
  };

  // Helper to clear vehicle draft
  const handleClearDraft = () => {
    localStorage.removeItem(VEHICLE_DRAFT_KEY);
    setBrand('');
    setModel('');
    setPlate('');
    setColor('');
    setYearFab('');
    setYearModel('');
    setRentalCompany('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setInitialKm(0);
    setContractNumber('');
    setValorRecebido(0);
    setValorSemanal(1000);
    setFinanciamento(1200);
    setSeguro(250);
    setIpva(150);
    setManutencaoPreventiva(200);
    setCurrentKm(0);
    setFuelLevel(8);
    setDriver('');
    setDriverPhone('');
    setCaucaoValor(1500);
    setCaucaoData(new Date().toISOString().split('T')[0]);
    setCaucaoObservacoes('');
    setNextVistoriaDate('');
  };

  const handleAiFill = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/fill-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, formType })
      });
      
      const resData = await response.json();
      
      if (!response.ok) {
        throw new Error(resData.error || 'Erro ao processar dados com IA');
      }
      
      const extracted = resData.data;
      
      if (formType === 'vehicle') {
        if (extracted.brand) setBrand(extracted.brand);
        if (extracted.model) setModel(extracted.model);
        if (extracted.plate) setPlate(extracted.plate);
        if (extracted.color) setColor(extracted.color);
        if (extracted.rentalCompany) setRentalCompany(extracted.rentalCompany);
        if (extracted.startDate) setStartDate(extracted.startDate);
        if (extracted.endDate) setEndDate(extracted.endDate);
        if (extracted.initialKm !== undefined) setInitialKm(extracted.initialKm);
        if (extracted.contractNumber) setContractNumber(extracted.contractNumber);
        if (extracted.valorRecebido !== undefined) setValorRecebido(extracted.valorRecebido);
        if (extracted.valorSemanal !== undefined) setValorSemanal(extracted.valorSemanal);
        if (extracted.financiamento !== undefined) setFinanciamento(extracted.financiamento);
        if (extracted.seguro !== undefined) setSeguro(extracted.seguro);
        if (extracted.ipva !== undefined) setIpva(extracted.ipva);
        if (extracted.manutencaoPreventiva !== undefined) setManutencaoPreventiva(extracted.manutencaoPreventiva);
        if (extracted.currentKm !== undefined) setCurrentKm(extracted.currentKm);
        if (extracted.fuelLevel !== undefined) setFuelLevel(extracted.fuelLevel);
        if (extracted.driver) setDriver(extracted.driver);
        if (extracted.driverPhone) setDriverPhone(extracted.driverPhone);
        if (extracted.caucaoValor !== undefined) setCaucaoValor(extracted.caucaoValor);
        if (extracted.caucaoData) setCaucaoData(extracted.caucaoData);
        if (extracted.caucaoObservacoes) setCaucaoObservacoes(extracted.caucaoObservacoes);
        if (extracted.nextVistoriaDate) setNextVistoriaDate(extracted.nextVistoriaDate);
      } else if (formType === 'fuel') {
        if (extracted.fuelDate) setFuelDate(extracted.fuelDate);
        if (extracted.fuelKm !== undefined) setFuelKm(extracted.fuelKm);
        if (extracted.fuelLiters !== undefined) setFuelLiters(extracted.fuelLiters);
        if (extracted.fuelPricePerLiter !== undefined) setFuelPricePerLiter(extracted.fuelPricePerLiter);
        if (extracted.fuelTotalCost !== undefined) setFuelTotalCost(extracted.fuelTotalCost);
        else if (extracted.fuelLiters && extracted.fuelPricePerLiter) {
          setFuelTotalCost(Number((extracted.fuelLiters * extracted.fuelPricePerLiter).toFixed(2)));
        }
        if (extracted.fuelType) setFuelType(extracted.fuelType.charAt(0).toUpperCase() + extracted.fuelType.slice(1).toLowerCase());
        if (extracted.fuelStation) setFuelStation(extracted.fuelStation);
      } else if (formType === 'maintenance') {
        if (extracted.maintDate) setMaintDate(extracted.maintDate);
        if (extracted.maintType) setMaintType(extracted.maintType.charAt(0).toUpperCase() + extracted.maintType.slice(1).toLowerCase());
        if (extracted.maintDescription) setMaintDescription(extracted.maintDescription);
        if (extracted.maintCost !== undefined) setMaintCost(extracted.maintCost);
        if (extracted.maintShop) setMaintShop(extracted.maintShop);
        if (extracted.maintNextKm !== undefined) setMaintNextKm(extracted.maintNextKm);
      } else if (formType === 'trip') {
        if (extracted.tripDate) setTripDate(extracted.tripDate);
        if (extracted.tripDriver) setTripDriver(extracted.tripDriver);
        if (extracted.tripStartKm !== undefined) setTripStartKm(extracted.tripStartKm);
        if (extracted.tripEndKm !== undefined) setTripEndKm(extracted.tripEndKm);
        if (extracted.tripPurpose) setTripPurpose(extracted.tripPurpose);
      } else if (formType === 'expense') {
        if (extracted.expDate) setExpDate(extracted.expDate);
        if (extracted.expCategory) setExpCategory(extracted.expCategory.charAt(0).toUpperCase() + extracted.expCategory.slice(1).toLowerCase());
        if (extracted.expDescription) setExpDescription(extracted.expDescription);
        if (extracted.expCost !== undefined) setExpCost(extracted.expCost);
      }
      setAiPrompt('');
    } catch (err: any) {
      setError(err.message || 'Erro de conexão com IA');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Prepopulate state when form opens or active vehicle changes
  useEffect(() => {
    setError('');
    
    if (prefilledData && isOpen) {
      const extracted = prefilledData;
      if (formType === 'vehicle') {
        if (extracted.brand) setBrand(extracted.brand);
        if (extracted.model) setModel(extracted.model);
        if (extracted.plate) setPlate(extracted.plate);
        if (extracted.color) setColor(extracted.color);
        if (extracted.rentalCompany) setRentalCompany(extracted.rentalCompany);
        if (extracted.startDate) setStartDate(extracted.startDate);
        if (extracted.endDate) setEndDate(extracted.endDate);
        if (extracted.initialKm !== undefined) setInitialKm(extracted.initialKm);
        if (extracted.contractNumber) setContractNumber(extracted.contractNumber);
        if (extracted.valorRecebido !== undefined) setValorRecebido(extracted.valorRecebido);
        if (extracted.valorSemanal !== undefined) setValorSemanal(extracted.valorSemanal);
        if (extracted.financiamento !== undefined) setFinanciamento(extracted.financiamento);
        if (extracted.seguro !== undefined) setSeguro(extracted.seguro);
        if (extracted.ipva !== undefined) setIpva(extracted.ipva);
        if (extracted.manutencaoPreventiva !== undefined) setManutencaoPreventiva(extracted.manutencaoPreventiva);
        if (extracted.currentKm !== undefined) setCurrentKm(extracted.currentKm);
        if (extracted.fuelLevel !== undefined) setFuelLevel(extracted.fuelLevel);
        if (extracted.driver) setDriver(extracted.driver);
        if (extracted.driverPhone) setDriverPhone(extracted.driverPhone);
        if (extracted.caucaoValor !== undefined) setCaucaoValor(extracted.caucaoValor);
        if (extracted.caucaoData) setCaucaoData(extracted.caucaoData);
        if (extracted.caucaoObservacoes) setCaucaoObservacoes(extracted.caucaoObservacoes);
        if (extracted.nextVistoriaDate) setNextVistoriaDate(extracted.nextVistoriaDate);
      } else if (formType === 'fuel') {
        if (extracted.fuelDate) setFuelDate(extracted.fuelDate);
        if (extracted.fuelKm !== undefined) setFuelKm(extracted.fuelKm);
        if (extracted.fuelLiters !== undefined) setFuelLiters(extracted.fuelLiters);
        if (extracted.fuelPricePerLiter !== undefined) setFuelPricePerLiter(extracted.fuelPricePerLiter);
        if (extracted.fuelTotalCost !== undefined) setFuelTotalCost(extracted.fuelTotalCost);
        else if (extracted.fuelLiters && extracted.fuelPricePerLiter) {
          setFuelTotalCost(Number((extracted.fuelLiters * extracted.fuelPricePerLiter).toFixed(2)));
        }
        if (extracted.fuelType) setFuelType(extracted.fuelType.charAt(0).toUpperCase() + extracted.fuelType.slice(1).toLowerCase());
        if (extracted.fuelStation) setFuelStation(extracted.fuelStation);
      } else if (formType === 'maintenance') {
        if (extracted.maintDate) setMaintDate(extracted.maintDate);
        if (extracted.maintType) setMaintType(extracted.maintType.charAt(0).toUpperCase() + extracted.maintType.slice(1).toLowerCase());
        if (extracted.maintDescription) setMaintDescription(extracted.maintDescription);
        if (extracted.maintCost !== undefined) setMaintCost(extracted.maintCost);
        if (extracted.maintShop) setMaintShop(extracted.maintShop);
        if (extracted.maintNextKm !== undefined) setMaintNextKm(extracted.maintNextKm);
      } else if (formType === 'trip') {
        if (extracted.tripDate) setTripDate(extracted.tripDate);
        if (extracted.tripDriver) setTripDriver(extracted.tripDriver);
        if (extracted.tripStartKm !== undefined) setTripStartKm(extracted.tripStartKm);
        if (extracted.tripEndKm !== undefined) setTripEndKm(extracted.tripEndKm);
        if (extracted.tripPurpose) setTripPurpose(extracted.tripPurpose);
      } else if (formType === 'expense') {
        if (extracted.expDate) setExpDate(extracted.expDate);
        if (extracted.expCategory) setExpCategory(extracted.expCategory.charAt(0).toUpperCase() + extracted.expCategory.slice(1).toLowerCase());
        if (extracted.expDescription) setExpDescription(extracted.expDescription);
        if (extracted.expCost !== undefined) setExpCost(extracted.expCost);
      }
    }

    // Set active vehicle
    if (selectedVehicleId) {
      setVehicleId(selectedVehicleId);
    } else if (vehicles.length > 0 && !vehicleId) {
      setVehicleId(vehicles[0].id);
    }

    const currentSelectedCar = vehicles.find(v => v.id === (selectedVehicleId || vehicleId));

    if (formType === 'vehicle') {
      if (vehicleToEdit) {
        setBrand(vehicleToEdit.brand);
        setModel(vehicleToEdit.model);
        setPlate(vehicleToEdit.plate);
        setColor(vehicleToEdit.color);
        setYearFab(vehicleToEdit.yearFab !== undefined ? vehicleToEdit.yearFab : (vehicleToEdit.year || ''));
        setYearModel(vehicleToEdit.yearModel !== undefined ? vehicleToEdit.yearModel : (vehicleToEdit.year || ''));
        setRentalCompany(vehicleToEdit.rentalCompany);
        setStartDate(vehicleToEdit.startDate);
        setEndDate(vehicleToEdit.endDate);
        setInitialKm(vehicleToEdit.initialKm);
        setContractNumber(vehicleToEdit.contractNumber || '');
        setValorRecebido(vehicleToEdit.valorRecebido || 0);
        setValorSemanal(vehicleToEdit.valorSemanal || 0);
        setFinanciamento(vehicleToEdit.financiamento || 0);
        setSeguro(vehicleToEdit.seguro || 0);
        setIpva(vehicleToEdit.ipva || 0);
        setManutencaoPreventiva(vehicleToEdit.manutencaoPreventiva || 0);
        setCurrentKm(vehicleToEdit.currentKm);
        setFuelLevel(vehicleToEdit.fuelLevel);
        setDriver(vehicleToEdit.driver);
        setDriverPhone(vehicleToEdit.driverPhone || '');
        setCaucaoValor(vehicleToEdit.caucaoValor || 0);
        setCaucaoData(vehicleToEdit.caucaoData || '2026-08-01');
        setCaucaoObservacoes(vehicleToEdit.caucaoObservacoes || '');
        setNextVistoriaDate(vehicleToEdit.nextVistoriaDate || '');
        setCustoExtra(vehicleToEdit.custoExtra || 0);
        setCustoExtraLabel(vehicleToEdit.custoExtraLabel || 'Outras Despesas');
        if (vehicleToEdit.custoExtra && vehicleToEdit.custoExtra > 0) {
          setShowAddExpense(true);
        }
      } else {
        // Adding new vehicle: check if draft exists in localStorage
        const savedDraft = localStorage.getItem(VEHICLE_DRAFT_KEY);
        if (savedDraft) {
          try {
            const draft = JSON.parse(savedDraft);
            setBrand(draft.brand ?? '');
            setModel(draft.model ?? '');
            setPlate(draft.plate ?? '');
            setColor(draft.color ?? '');
            setYearFab(draft.yearFab ?? '');
            setYearModel(draft.yearModel ?? '');
            setRentalCompany(draft.rentalCompany ?? '');
            setStartDate(draft.startDate ?? new Date().toISOString().split('T')[0]);
            setEndDate(draft.endDate ?? '');
            setInitialKm(draft.initialKm !== undefined ? draft.initialKm : 0);
            setContractNumber(draft.contractNumber ?? '');
            setValorRecebido(draft.valorRecebido ?? 0);
            setValorSemanal(draft.valorSemanal ?? 1000);
            setFinanciamento(draft.financiamento ?? 1200);
            setSeguro(draft.seguro ?? 250);
            setIpva(draft.ipva ?? 150);
            setManutencaoPreventiva(draft.manutencaoPreventiva ?? 200);
            setCurrentKm(draft.currentKm ?? 0);
            setFuelLevel(draft.fuelLevel ?? 8);
            setDriver(draft.driver ?? '');
            setDriverPhone(draft.driverPhone ?? '');
            setCaucaoValor(draft.caucaoValor ?? 1500);
            setCaucaoData(draft.caucaoData ?? new Date().toISOString().split('T')[0]);
            setCaucaoObservacoes(draft.caucaoObservacoes ?? '');
            setNextVistoriaDate(draft.nextVistoriaDate ?? '');
          } catch (e) {
            console.error('Error loading vehicle draft:', e);
          }
        } else {
          setBrand('');
          setModel('');
          setPlate('');
          setColor('');
          setYearFab('');
          setYearModel('');
          setRentalCompany('');
          setStartDate(new Date().toISOString().split('T')[0]);
          setEndDate('');
          setInitialKm(0);
          setContractNumber('');
          setValorRecebido(0);
          setValorSemanal(1000);
          setFinanciamento(1200);
          setSeguro(250);
          setIpva(150);
          setManutencaoPreventiva(200);
          setCurrentKm(0);
          setFuelLevel(8);
          setDriver('');
          setDriverPhone('');
          setCaucaoValor(1500);
          setCaucaoData(new Date().toISOString().split('T')[0]);
          setCaucaoObservacoes('');
          setNextVistoriaDate('');
        }
      }
    } else if (formType === 'fuel' && currentSelectedCar) {
      setFuelKm(currentSelectedCar.currentKm);
      setFuelLiters(35);
      setFuelPricePerLiter(5.85);
      setFuelTotalCost(204.75);
      setFuelType('Gasolina');
      setFuelStation('');
      setFuelDate('2026-08-01');
    } else if (formType === 'maintenance' && currentSelectedCar) {
      setMaintDate('2026-08-01');
      setMaintType('Revisão');
      setMaintDescription('');
      setMaintCost(0);
      setMaintShop('');
      setMaintNextKm(currentSelectedCar.currentKm + 10000);
    } else if (formType === 'trip' && currentSelectedCar) {
      setTripDate('2026-08-01');
      setTripDriver(currentSelectedCar.driver || '');
      setTripStartKm(currentSelectedCar.currentKm);
      setTripEndKm(currentSelectedCar.currentKm + 50);
      setTripPurpose('');
    } else if (formType === 'expense') {
      setExpDate('2026-08-01');
      setExpCategory('Lavagem');
      setExpDescription('');
      setExpCost(0);
    }
  }, [formType, vehicleToEdit, selectedVehicleId, vehicleId]);

  // Auto-save vehicle draft to localStorage whenever user types
  useEffect(() => {
    if (formType === 'vehicle' && !vehicleToEdit && isOpen) {
      const draftData = {
        brand,
        model,
        plate,
        color,
        yearFab,
        yearModel,
        rentalCompany,
        startDate,
        endDate,
        initialKm,
        contractNumber,
        valorRecebido,
        valorSemanal,
        financiamento,
        seguro,
        ipva,
        manutencaoPreventiva,
        currentKm,
        fuelLevel,
        driver,
        driverPhone,
        caucaoValor,
        caucaoData,
        caucaoObservacoes,
        nextVistoriaDate
      };
      localStorage.setItem(VEHICLE_DRAFT_KEY, JSON.stringify(draftData));
    }
  }, [
    isOpen, formType, vehicleToEdit, brand, model, plate, color, yearFab, yearModel, rentalCompany,
    startDate, endDate, initialKm, contractNumber, valorRecebido, valorSemanal,
    financiamento, seguro, ipva, manutencaoPreventiva, currentKm, fuelLevel,
    driver, driverPhone, caucaoValor, caucaoData, caucaoObservacoes, nextVistoriaDate
  ]);

  // Handle vehicle select change & auto-populate corresponding km
  const handleVehicleChange = (vId: string) => {
    setVehicleId(vId);
    const selectedCar = vehicles.find(v => v.id === vId);
    if (selectedCar) {
      if (formType === 'fuel') {
        setFuelKm(selectedCar.currentKm);
      } else if (formType === 'trip') {
        setTripStartKm(selectedCar.currentKm);
        setTripEndKm(selectedCar.currentKm + 50);
        setTripDriver(selectedCar.driver || '');
      } else if (formType === 'maintenance') {
        setMaintNextKm(selectedCar.currentKm + 10000);
      }
    }
  };

  // Live total fuel cost calculations
  const updateFuelTotal = (litersVal: number, priceVal: number) => {
    setFuelLiters(litersVal);
    setFuelPricePerLiter(priceVal);
    setFuelTotalCost(Number((litersVal * priceVal).toFixed(2)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const activeVehicle = vehicles.find(v => v.id === vehicleId);

    if (formType === 'vehicle') {
      if (!brand || !model || !plate) {
        setError('Preencha os campos obrigatórios (Marca, Modelo e Placa)');
        return;
      }
      const parsedYearFab = yearFab !== '' ? Number(yearFab) : undefined;
      const parsedYearModel = yearModel !== '' ? Number(yearModel) : undefined;
      const computedYear = parsedYearModel || parsedYearFab || 2026;

      onSaveVehicle({
        id: vehicleToEdit ? vehicleToEdit.id : `car-${Date.now()}`,
        brand,
        model,
        plate: plate.toUpperCase(),
        year: computedYear,
        yearFab: parsedYearFab,
        yearModel: parsedYearModel,
        color: color || 'Branco',
        rentalCompany: rentalCompany || 'Indefinido',
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate || '',
        initialKm: initialKm !== undefined ? Number(initialKm) : undefined,
        contractNumber: contractNumber || generateNextContractNumber(plate, vehicles, `${brand} ${model}`),
        valorRecebido: Number(valorRecebido) || 0,
        valorSemanal: Number(valorSemanal) || 0,
        financiamento: Number(financiamento) || 0,
        seguro: Number(seguro) || 0,
        ipva: Number(ipva) || 0,
        manutencaoPreventiva: Number(manutencaoPreventiva) || 0,
        currentKm: Number(currentKm) || 0,
        fuelLevel: Number(fuelLevel) || 100,
        driver,
        driverPhone,
        caucaoValor: Number(caucaoValor) || 0,
        caucaoData: caucaoData || '2026-08-01',
        caucaoObservacoes: caucaoObservacoes || '',
        weeklyPayments: vehicleToEdit ? vehicleToEdit.weeklyPayments : [],
        custoExtra: Number(custoExtra) || 0,
        custoExtraLabel: custoExtraLabel || 'Outras Despesas',
        preventiveMaintCurrentKm: vehicleToEdit ? vehicleToEdit.preventiveMaintCurrentKm : Number(currentKm) || 0,
        preventiveMaintNextKm: vehicleToEdit ? vehicleToEdit.preventiveMaintNextKm : (Number(currentKm) || 0) + 10000,
        preventiveMaintDate: vehicleToEdit ? vehicleToEdit.preventiveMaintDate : '2026-08-01',
        nextVistoriaDate: nextVistoriaDate || undefined
      });
      if (!vehicleToEdit) {
        localStorage.removeItem(VEHICLE_DRAFT_KEY);
      }
      onClose();
    }

    else if (formType === 'fuel') {
      if (fuelKm <= 0 || fuelLiters <= 0 || fuelPricePerLiter <= 0) {
        setError('Por favor, informe valores válidos para Quilometragem, Litros e Preço.');
        return;
      }
      if (activeVehicle && fuelKm < activeVehicle.currentKm) {
        setError(`A quilometragem informada (${fuelKm} km) não pode ser menor que o odômetro atual do carro (${activeVehicle.currentKm} km).`);
        return;
      }
      onSaveFuel({
        vehicleId,
        date: fuelDate,
        km: Number(fuelKm),
        liters: Number(fuelLiters),
        pricePerLiter: Number(fuelPricePerLiter),
        totalCost: Number(fuelTotalCost),
        fuelType,
        stationName: fuelStation
      });
      onClose();
    }

    else if (formType === 'maintenance') {
      if (!maintDescription || maintCost < 0) {
        setError('Informe uma descrição válida e o custo correspondente.');
        return;
      }
      onSaveMaintenance({
        vehicleId,
        date: maintDate,
        type: maintType,
        description: maintDescription,
        cost: Number(maintCost),
        shopName: maintShop,
        nextKm: maintNextKm ? Number(maintNextKm) : undefined
      });
      onClose();
    }

    else if (formType === 'trip') {
      if (tripEndKm <= tripStartKm) {
        setError(`A quilometragem final (${tripEndKm} km) deve ser maior que a quilometragem inicial (${tripStartKm} km).`);
        return;
      }
      if (!tripDriver || !tripPurpose) {
        setError('Informe o condutor responsável e a justificativa/destino da viagem.');
        return;
      }
      onSaveTrip({
        vehicleId,
        date: tripDate,
        driverName: tripDriver,
        startKm: Number(tripStartKm),
        endKm: Number(tripEndKm),
        purpose: tripPurpose
      });
      onClose();
    }

    else if (formType === 'expense') {
      if (!expDescription || expCost <= 0) {
        setError('Informe uma descrição da despesa e o valor cobrado.');
        return;
      }
      onSaveExpense({
        vehicleId,
        date: expDate,
        category: expCategory,
        description: expDescription,
        cost: Number(expCost)
      });
      onClose();
    }
  };

  return (
    <div id="modal-container" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div 
        id="modal-content"
        className="bg-[#111111] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#161616]">
          <h2 className="text-sm md:text-base font-bold text-white font-sans" id="modal-title">
            {formType === 'vehicle' && (vehicleToEdit ? 'Editar Detalhes do Carro' : 'Adicionar Novo Carro')}
            {formType === 'fuel' && 'Registrar Abastecimento'}
            {formType === 'maintenance' && 'Registrar Manutenção ou Conserto'}
            {formType === 'trip' && 'Registrar Viagem / Uso de KM'}
            {formType === 'expense' && 'Registrar Outra Despesa'}
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors"
            id="modal-btn-close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4" id="log-form-element">
          {/* AI Auto-fill Section */}
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-3 flex flex-col gap-2">
            <label className="text-[10px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Preenchimento Mágico com IA
            </label>
            <div className="flex items-center gap-1.5 sm:gap-2 w-full min-w-0">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder={formType === 'vehicle' ? "Ex: Adiciona o Ônix placa BRA2E19..." : "Ex: Abasteci 40 litros..."}
                className="flex-1 min-w-0 text-xs bg-black/40 border border-white/10 rounded-lg px-2.5 sm:px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                disabled={isAiLoading}
              />
              <button
                type="button"
                onClick={toggleRecording}
                disabled={isAiLoading}
                className={`p-2 rounded-lg transition-colors flex items-center justify-center shrink-0 border ${
                  isRecording 
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 hover:bg-rose-500/30' 
                    : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
                title="Ditar texto"
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={handleAiFill}
                disabled={isAiLoading || !aiPrompt.trim()}
                className="px-2.5 sm:px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50 shrink-0 cursor-pointer"
              >
                {isAiLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Preencher'
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl flex items-start gap-2.5 text-xs font-semibold border border-rose-500/20">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Vehicle Select for log entries */}
          {formType !== 'vehicle' && vehicles.length > 0 && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Selecione o Veículo</label>
              <select
                value={vehicleId}
                onChange={(e) => handleVehicleChange(e.target.value)}
                className="w-full text-xs bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-blue-500/50 focus:bg-[#1a1a1a] font-semibold"
                id="form-select-vehicle"
              >
                {vehicles.map(v => (
                  <option key={v.id} value={v.id} className="bg-[#111111] text-white">
                    {v.brand} {v.model} ({v.plate})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ----------------- VEHICLE FORM ----------------- */}
          {formType === 'vehicle' && (
            <div className="space-y-4 text-white text-xs">
              {!vehicleToEdit && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Save className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>
                      <strong>Rascunho Automático:</strong> Os dados preenchidos são salvos em tempo real. Se você sair da tela ou mudar de aba, nada será perdido.
                    </span>
                  </div>
                  {(brand || model || plate || color || driver || contractNumber) && (
                    <button
                      type="button"
                      onClick={handleClearDraft}
                      className="px-2 py-1 text-[10px] font-bold bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded-lg border border-blue-500/30 transition-colors shrink-0 cursor-pointer uppercase tracking-wider"
                      title="Limpar formulário e começar do zero"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-400">Marca *</label>
                  <input 
                    type="text" 
                    value={brand} 
                    onChange={e => setBrand(e.target.value ? e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) : '')}
                    placeholder="Ex: Chevrolet"
                    className="w-full text-xs bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-hidden focus:border-blue-500/50 focus:bg-[#1a1a1a]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-400">Modelo *</label>
                  <input 
                    type="text" 
                    value={model} 
                    onChange={e => setModel(e.target.value ? e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) : '')}
                    placeholder="Ex: Onix Hatch LT"
                    className="w-full text-xs bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-hidden focus:border-blue-500/50 focus:bg-[#1a1a1a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-400">Placa *</label>
                  <input 
                    type="text" 
                    value={plate} 
                    onChange={e => setPlate(e.target.value)}
                    placeholder="BRA2E19"
                    className="w-full text-xs bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-white uppercase placeholder-gray-500 focus:outline-hidden focus:border-blue-500/50 focus:bg-[#1a1a1a] font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-400">Ano Fabricação</label>
                  <input 
                    type="number" 
                    value={yearFab} 
                    onChange={e => setYearFab(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Ex: 2023"
                    className="w-full text-xs bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-hidden focus:border-blue-500/50 focus:bg-[#1a1a1a] font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-400">Ano Modelo</label>
                  <input 
                    type="number" 
                    value={yearModel} 
                    onChange={e => setYearModel(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Ex: 2024"
                    className="w-full text-xs bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-hidden focus:border-blue-500/50 focus:bg-[#1a1a1a] font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-400">Cor e Acabamento</label>
                  <input 
                    type="text" 
                    value={color} 
                    onChange={e => setColor(e.target.value ? e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) : '')}
                    placeholder="Ex: Prata Metálico"
                    className="w-full text-xs bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-hidden focus:border-blue-500/50 focus:bg-[#1a1a1a]"
                  />
                </div>
              </div>

              {/* Dados do Contrato */}
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 space-y-2">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">Dados do Contrato</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-400">N° Contrato</label>
                    <input 
                      type="text" 
                      value={contractNumber} 
                      onChange={e => setContractNumber(e.target.value)}
                      placeholder="Ex: CT-GKD-ABC2323-08-2026-01"
                      className="w-full text-xs bg-white/[0.03] border border-white/10 rounded-lg px-2.5 py-1.5 text-white placeholder-gray-500 focus:outline-hidden font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-400">KM Início (Entrada)</label>
                    <input 
                      type="number" 
                      value={initialKm !== undefined ? initialKm : ''} 
                      onChange={e => setInitialKm(e.target.value !== '' ? Number(e.target.value) : undefined)}
                      placeholder="Ex: 12000"
                      className="w-full text-xs bg-white/[0.03] border border-white/10 rounded-lg px-2.5 py-1.5 text-white placeholder-gray-500 focus:outline-hidden font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-400">Data Início</label>
                    <input 
                      type="date" 
                      value={startDate} 
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full text-xs bg-white/[0.03] border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-hidden font-mono scheme-dark"
                    />
                    {startDate && (
                      <span className="text-[9px] text-emerald-400 font-mono block">
                        1º Venc.: <strong>{formatDateBR(getNextWeekDate(startDate))}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-emerald-400 flex items-center justify-between">
                    <span>Valor Semanal (R$)</span>
                  </label>
                  <input 
                    type="number" 
                    value={valorSemanal || ''} 
                    onChange={e => setValorSemanal(Number(e.target.value))}
                    placeholder="Ex: 800"
                    className="w-full text-xs bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500 focus:bg-[#1a1a1a] font-mono"
                  />
                  <span className="text-[9px] text-gray-500 block">Cobrança semanal (não conta na receita inicial de contrato).</span>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-400">Valor Recebido Inicial (R$)</label>
                  <input 
                    type="number" 
                    value={valorRecebido} 
                    onChange={e => setValorRecebido(Number(e.target.value))}
                    placeholder="0"
                    className="w-full text-xs bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-blue-500/50 focus:bg-[#1a1a1a] font-mono"
                  />
                  <span className="text-[9px] text-gray-500 block">No início de contrato inicia em R$ 0,00 até o lançamento de pagamentos.</span>
                </div>
              </div>

              {/* Despesas do Veículo / Botão + Novo */}
              <div className="bg-white/[0.02] border border-white/10 p-3 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Despesas do Veículo</span>
                    {custoExtra > 0 && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded-md border border-amber-500/30 flex items-center gap-1.5">
                        <span>{custoExtraLabel}: R$ {custoExtra.toFixed(2)}/mês</span>
                        <button
                          type="button"
                          onClick={() => {
                            setCustoExtra(0);
                            setCustoExtraLabel('Outras Despesas');
                            setShowAddExpense(false);
                          }}
                          className="text-amber-400 hover:text-rose-400 cursor-pointer p-0.5 rounded transition-colors"
                          title="Deletar despesa"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddExpense(!showAddExpense)}
                    className="text-xs text-amber-400 hover:text-amber-300 font-bold px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Novo</span>
                  </button>
                </div>

                {showAddExpense && (
                  <div className="p-3 bg-neutral-900 border border-amber-500/30 rounded-xl space-y-3 animate-in slide-in-from-top-1 duration-150">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-xs font-semibold text-white">Adicionar / Editar Nova Despesa</span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddExpense(false);
                        }}
                        className="text-gray-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-300 font-semibold block">Nome / Descrição da Despesa</label>
                        <input
                          type="text"
                          placeholder="Ex: IPVA, Seguro, Rastreamento, Manutenção..."
                          value={custoExtraLabel}
                          onChange={(e) => setCustoExtraLabel(e.target.value)}
                          className="w-full text-xs bg-black/60 border border-white/15 rounded-lg px-2.5 py-1.5 text-white focus:border-amber-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-300 font-semibold block">Valor Mensal (R$)</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={custoExtra || ''}
                          onChange={(e) => setCustoExtra(Number(e.target.value))}
                          className="w-full text-xs bg-black/60 border border-white/15 rounded-lg px-2.5 py-1.5 text-white font-mono focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* Opção de Calculadora de Parcelado */}
                    <div className="pt-2 border-t border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setExpenseParcelado(!expenseParcelado)}
                          className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-2 py-1 rounded-lg cursor-pointer transition-all"
                        >
                          <Calculator className="w-3.5 h-3.5 text-amber-400" />
                          <span>{expenseParcelado ? 'Fechar Calculadora de Parcelado' : 'Calcular Valor Parcelado? (Ex: IPVA em 10x)'}</span>
                        </button>
                      </div>

                      {expenseParcelado && (
                        <div className="p-2.5 bg-black/80 border border-amber-500/20 rounded-lg space-y-2 text-xs">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-gray-300 font-semibold block mb-1">Valor Total (R$)</label>
                              <input
                                type="number"
                                placeholder="Ex: 1800"
                                value={expenseTotalVal || ''}
                                onChange={(e) => setExpenseTotalVal(Number(e.target.value))}
                                className="w-full text-xs bg-neutral-900 border border-white/15 rounded-lg px-2.5 py-1.5 text-white font-mono focus:border-amber-500"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-gray-300 font-semibold block mb-1">Nº de Parcelas</label>
                              <select
                                value={expenseNumParcelas}
                                onChange={(e) => setExpenseNumParcelas(Number(e.target.value))}
                                className="w-full text-xs bg-neutral-900 border border-white/15 rounded-lg px-2.5 py-1.5 text-white font-mono focus:border-amber-500"
                              >
                                {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24, 36, 48, 60].map((n) => (
                                  <option key={n} value={n}>{n}x parcelas mensais</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {expenseTotalVal > 0 && (
                            <div className="flex items-center justify-between p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg mt-1">
                              <span className="text-[11px] text-amber-200">
                                💡 <strong>{expenseNumParcelas}x</strong> de <strong>R$ {(expenseTotalVal / expenseNumParcelas).toFixed(2).replace('.', ',')}</strong> / mês
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const valorMensal = Math.round((expenseTotalVal / expenseNumParcelas) * 100) / 100;
                                  setCustoExtra(valorMensal);
                                  setExpenseParcelado(false);
                                }}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-md text-[10px] cursor-pointer transition-all shadow-sm"
                              >
                                Aplicar R$ {(expenseTotalVal / expenseNumParcelas).toFixed(2).replace('.', ',')} / mês
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Botões Salvar e Deletar Despesa */}
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                      {custoExtra > 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setCustoExtra(0);
                            setCustoExtraLabel('Outras Despesas');
                            setShowAddExpense(false);
                          }}
                          className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Excluir Despesa</span>
                        </button>
                      ) : <div />}
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddExpense(false);
                        }}
                        className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Salvar Despesa</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

               {contacts && contacts.length > 0 && (
                <div className="bg-blue-950/20 border border-blue-500/10 p-3 rounded-xl space-y-1.5 mb-2">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-blue-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Preencher dados da Agenda
                  </label>
                  <select
                    onChange={(e) => {
                      const selected = contacts.find(c => c.id === e.target.value);
                      if (selected) {
                        setDriver(selected.name);
                        setDriverPhone(selected.phone);
                      }
                    }}
                    className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-blue-500/50 cursor-pointer"
                    defaultValue=""
                  >
                    <option value="" disabled>-- Selecione um contato salvo para auto-preencher --</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.region})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Locatário Responsável</label>
                <input 
                  type="text" 
                  value={driver} 
                  onChange={e => setDriver(e.target.value ? e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) : '')}
                  placeholder="Ex: Carlos Souza"
                  className="w-full text-xs bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-hidden focus:border-blue-500/50 focus:bg-[#1a1a1a]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Telefone do Locatário (WhatsApp - Ex: 5511999991234)</label>
                <input 
                  type="text" 
                  value={driverPhone} 
                  onChange={e => setDriverPhone(e.target.value)}
                  placeholder="Ex: 5511999991234"
                  className="w-full text-xs bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-hidden focus:border-blue-500/50 focus:bg-[#1a1a1a] font-mono"
                />
              </div>

              {/* Caução fields */}
              <div className="bg-emerald-950/10 border border-emerald-500/10 p-3 rounded-xl space-y-3">
                <h4 className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Caução de Garantia</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-400 text-[11px] flex justify-between items-center">
                      <span>Valor do Caução (R$)</span>
                      <span className="text-[9px] text-emerald-400/80 font-normal">(Garantia - Não soma na receita)</span>
                    </label>
                    <input 
                      type="number" 
                      value={caucaoValor || ''} 
                      onChange={e => setCaucaoValor(Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full text-xs bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500/50 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-400 text-[11px]">Data do Caução</label>
                    <input 
                      type="date" 
                      value={caucaoData} 
                      onChange={e => setCaucaoData(e.target.value)}
                      className="w-full text-xs bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500/50 font-mono scheme-dark"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-400 text-[11px]">Observações do Caução</label>
                  <textarea 
                    value={caucaoObservacoes} 
                    onChange={e => setCaucaoObservacoes(e.target.value)}
                    placeholder="Ex: Caução recebido via PIX, retido sob contrato..."
                    className="w-full text-xs bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500/50 h-20 resize-none font-sans"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Data Limite para Próxima Vistoria (Prazo Final)</label>
                <input 
                  type="date" 
                  value={nextVistoriaDate} 
                  onChange={e => setNextVistoriaDate(e.target.value)}
                  className="w-full text-xs bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-blue-500/50 focus:bg-[#1a1a1a] font-mono scheme-dark"
                />
              </div>
            </div>
          )}

          {/* ----------------- FUEL FORM ----------------- */}
          {formType === 'fuel' && (
            <div className="space-y-4 text-white text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-400">Data do Abastecimento</label>
                  <input 
                    type="date" 
                    value={fuelDate} 
                    onChange={e => setFuelDate(e.target.value)}
                    className="w-full text-xs bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-blue-500/50 focus:bg-[#1a1a1a] scheme-dark"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-400">Quilometragem (Odometer)</label>
                  <input 
                    type="number" 
                    value={fuelKm || ''} 
                    onChange={e => setFuelKm(Number(e.target.value))}
                    className="w-full text-xs bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-blue-500/50 focus:bg-[#1a1a1a] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-400">Litros Abastecidos</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={fuelLiters || ''} 
                    onChange={e => updateFuelTotal(Number(e.target.value), fuelPricePerLiter)}
                    className="w-full text-xs bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-blue-500/50 focus:bg-[#1a1a1a] font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-400">Preço p/ Litro (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={fuelPricePerLiter || ''} 
                    onChange={e => updateFuelTotal(fuelLiters, Number(e.target.value))}
                    className="w-full text-xs bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-blue-500/50 focus:bg-[#1a1a1a] font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-400">Custo Total</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={fuelTotalCost || ''} 
                    onChange={e => setFuelTotalCost(Number(e.target.value))}
                    className="w-full text-xs bg-white/[0.01] border border-white/5 rounded-xl px-3 py-2 text-gray-400 font-mono font-bold"
                    disabled
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-400">Tipo de Combustível</label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value as FuelLog['fuelType'])}
                    className="w-full text-xs bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-blue-500/50 focus:bg-[#1a1a1a]"
                  >
                    <option value="Gasolina" className="bg-[#111111] text-white">Gasolina</option>
                    <option value="Etanol" className="bg-[#111111] text-white">Etanol</option>
                    <option value="Diesel" className="bg-[#111111] text-white">Diesel</option>
                    <option value="Flex" className="bg-[#111111] text-white">Flex</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-400">Nome do Posto (Opcional)</label>
                  <input 
                    type="text" 
                    value={fuelStation} 
                    onChange={e => setFuelStation(e.target.value ? e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) : '')}
                    placeholder="Ex: Posto BR Shell"
                    className="w-full text-xs bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-hidden focus:border-blue-500/50 focus:bg-[#1a1a1a]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ----------------- MAINTENANCE FORM ----------------- */}
          {formType === 'maintenance' && (
            <div className="space-y-4 text-white text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-400">Data do Serviço</label>
                  <input 
                    type="date" 
                    value={maintDate} 
                    onChange={e => setMaintDate(e.target.value)}
                    className="w-full text-xs bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-blue-500/50 focus:bg-[#1a1a1a] scheme-dark"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-400">Categoria</label>
                  <select
                    value={maintType}
                    onChange={e => setMaintType(e.target.value as MaintenanceLog['type'])}
                    className="w-full text-xs bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-blue-500/50 focus:bg-[#1a1a1a]"
                  >
                    <option value="Revisão" className="bg-[#111111] text-white font-sans">Revisão Periódica</option>
                    <option value="Preventiva" className="bg-[#111111] text-white font-sans">Manutenção Preventiva</option>
                    <option value="Corretiva" className="bg-[#111111] text-white font-sans">Manutenção Corretiva (Defeito)</option>
                    <option value="Pneus" className="bg-[#111111] text-white font-sans">Pneus / Rodízio / Alinhamento</option>
                    <option value="Outro" className="bg-[#111111] text-white font-sans">Outros Serviços</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-400">Custo Total (R$)</label>
                  <input 
                    type="number" 
                    value={maintCost || ''} 
                    onChange={e => setMaintCost(Number(e.target.value))}
                    className="w-full text-xs bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-blue-500/50 focus:bg-[#1a1a1a] font-mono font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-400">Oficina / Estabelecimento</label>
                  <input 
                    type="text" 
                    value={maintShop} 
                    onChange={e => setMaintShop(e.target.value ? e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) : '')}
                    placeholder="Ex: Concessionária Fiat"
                    className="w-full text-xs bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-hidden focus:border-blue-500/50 focus:bg-[#1a1a1a]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Descrição Detalhada *</label>
                <textarea 
                  value={maintDescription} 
                  onChange={e => setMaintDescription(e.target.value ? e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) : '')}
                  placeholder="Descreva as peças trocadas e reparos efetuados..."
                  className="w-full text-xs bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-hidden focus:border-blue-500/50 focus:bg-[#1a1a1a] h-20 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Próxima Manutenção KM (Opcional)</label>
                <input 
                  type="number" 
                  value={maintNextKm || ''} 
                  onChange={e => setMaintNextKm(Number(e.target.value))}
                  placeholder="Ex: 25000"
                  className="w-full text-xs bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-hidden focus:border-blue-500/50 focus:bg-[#1a1a1a] font-mono"
                />
              </div>
            </div>
          )}

          {/* ----------------- TRIP FORM ----------------- */}
          {formType === 'trip' && (
            <div className="space-y-4 text-white text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-400">Data da Viagem</label>
                  <input 
                    type="date" 
                    value={tripDate} 
                    onChange={e => setTripDate(e.target.value)}
                    className="w-full text-xs bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-blue-500/50 focus:bg-[#1a1a1a] scheme-dark"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-400">Locatário / Motorista Responsável *</label>
                  <input 
                    type="text" 
                    value={tripDriver} 
                    onChange={e => setTripDriver(e.target.value ? e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) : '')}
                    placeholder="Ex: Mariana Lima"
                    className="w-full text-xs bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-hidden focus:border-blue-500/50 focus:bg-[#1a1a1a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-400">KM de Partida (Inicial)</label>
                  <input 
                    type="number" 
                    value={tripStartKm} 
                    disabled
                    className="w-full text-xs bg-white/[0.01] border border-white/5 rounded-xl px-3 py-2 text-gray-400 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-400">KM de Chegada (Final) *</label>
                  <input 
                    type="number" 
                    value={tripEndKm || ''} 
                    onChange={e => setTripEndKm(Number(e.target.value))}
                    className="w-full text-xs bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-blue-500/50 focus:bg-[#1a1a1a] font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Distância Total Estimada</label>
                <div className="text-lg font-bold text-blue-400 font-mono">
                  {(tripEndKm - tripStartKm) > 0 ? (tripEndKm - tripStartKm) : 0} <span className="text-xs text-gray-500 font-sans">km</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Finalidade / Destino *</label>
                <input 
                  type="text" 
                  value={tripPurpose} 
                  onChange={e => setTripPurpose(e.target.value ? e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) : '')}
                  placeholder="Ex: Reunião com clientes comerciais em SP"
                  className="w-full text-xs bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-hidden focus:border-blue-500/50 focus:bg-[#1a1a1a]"
                />
              </div>
            </div>
          )}

          {/* ----------------- EXPENSE FORM ----------------- */}
          {formType === 'expense' && (
            <div className="space-y-4 text-white text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-400">Data do Gasto</label>
                  <input 
                    type="date" 
                    value={expDate} 
                    onChange={e => setExpDate(e.target.value)}
                    className="w-full text-xs bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-blue-500/50 focus:bg-[#1a1a1a] scheme-dark"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-400">Categoria da Despesa</label>
                  <select
                    value={expCategory}
                    onChange={e => setExpCategory(e.target.value as ExpenseLog['category'])}
                    className="w-full text-xs bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-blue-500/50 focus:bg-[#1a1a1a]"
                  >
                    <option value="Lavagem" className="bg-[#111111] text-white">Lavagem / Limpeza</option>
                    <option value="Multa" className="bg-[#111111] text-white">Multa de Trânsito</option>
                    <option value="Estacionamento" className="bg-[#111111] text-white">Estacionamento / Pedágio</option>
                    <option value="Seguro" className="bg-[#111111] text-white">Seguro Adicional / Franquia</option>
                    <option value="Outros" className="bg-[#111111] text-white">Outras Taxas</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Valor Pago (R$) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={expCost || ''} 
                  onChange={e => setExpCost(Number(e.target.value))}
                  className="w-full text-xs bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-blue-500/50 focus:bg-[#1a1a1a] font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-400">Detalhes / Justificativa *</label>
                <input 
                  type="text" 
                  value={expDescription} 
                  onChange={e => setExpDescription(e.target.value ? e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) : '')}
                  placeholder="Ex: Lavagem completa com higienização de ar"
                  className="w-full text-xs bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-hidden focus:border-blue-500/50 focus:bg-[#1a1a1a]"
                />
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 bg-[#161616] flex flex-col sm:flex-row items-center justify-between gap-3">
          {error ? (
            <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl flex items-center gap-2 text-xs font-semibold border border-rose-500/20 w-full sm:w-auto">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : <div />}
          
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 rounded-xl transition-colors border border-white/5 cursor-pointer"
              id="form-btn-cancel"
            >
              Cancelar
            </button>
            <button 
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
              id="form-btn-save"
            >
              <Save className="w-4 h-4" />
              <span>
                {formType === 'vehicle'
                  ? (vehicleToEdit ? 'Salvar Alterações' : 'Salvar Veículo')
                  : 'Salvar Registro'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
