export interface WeeklyPayment {
  id: string;
  date: string;
  amount: number;
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  plate: string;
  year: number;
  yearFab?: number;
  yearModel?: number;
  color: string;
  rentalCompany: string;
  startDate: string;
  endDate?: string;
  initialKm?: number;
  contractNumber?: string;
  valorRecebido: number;
  valorSemanal?: number;
  financiamento: number;
  seguro: number;
  ipva: number;
  manutencaoPreventiva: number;
  currentKm: number;
  fuelLevel: number; // Percentage (e.g. 75 for 75%)
  driver: string;
  driverPhone?: string;
  weeklyPayments?: WeeklyPayment[];
  custoExtra?: number;
  custoExtraLabel?: string;
  financiamentoParcelasPagas?: number;
  financiamentoParcelasTotais?: number;
  seguroParcelasPagas?: number;
  seguroParcelasTotais?: number;
  ipvaParcelasPagas?: number;
  ipvaParcelasTotais?: number;
  manutencaoParcelasPagas?: number;
  manutencaoParcelasTotais?: number;
  custoExtraParcelasPagas?: number;
  custoExtraParcelasTotais?: number;
  preventiveMaintCurrentKm?: number;
  preventiveMaintNextKm?: number;
  preventiveMaintDate?: string;
  documents?: VehicleDocument[];
  caucaoValor?: number;
  caucaoData?: string;
  caucaoObservacoes?: string;
  nextVistoriaDate?: string;
  tenantCpfCnpj?: string;
  tenantRg?: string;
  tenantCnh?: string;
  tenantEmail?: string;
  tenantAddress?: string;
}

export interface VehicleDocument {
  id: string;
  name: string;
  category: string;
  uploadDate: string;
  fileSize?: string;
  fileType?: string;
  contentUrl?: string;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  date: string;
  km: number;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  fuelType: 'Gasolina' | 'Etanol' | 'Diesel' | 'Flex';
  stationName?: string;
  station?: string;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  date: string;
  type: 'Preventiva' | 'Corretiva' | 'Revisão' | 'Pneus' | 'Outro';
  description: string;
  cost: number;
  shopName?: string;
  nextKm?: number;
}

export interface TripLog {
  id: string;
  vehicleId: string;
  date: string;
  driverName: string;
  driver?: string;
  startKm: number;
  endKm: number;
  purpose: string;
}

export interface ExpenseLog {
  id: string;
  vehicleId: string;
  date: string;
  category: 'Seguro' | 'Multa' | 'Lavagem' | 'Estacionamento' | 'Outros';
  description: string;
  cost: number;
}

export interface AgendaContact {
  id: string;
  name: string;
  phone: string;
  region: string;
}

export interface Vistoria {
  id: string;
  vehicleId: string;
  date: string;
  type?: 'Entrega de Veículo' | 'Periódica' | 'Devolução de Veículo';
  checklist: Record<string, boolean>;
  photos: string[];
  notes?: string;
}

export interface FinalizedContract {
  id: string;
  vehicleId: string;
  brand: string;
  model: string;
  plate: string;
  driver: string;
  driverPhone?: string;
  terminationDate: string;
  pdfFileName: string;
  pdfDataUrl: string;
  totalPaid: number;
  documentsCount: number;
  maintenanceCount: number;
  viewed?: boolean;
}


