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
  extraExpenses?: {
    id: string;
    label: string;
    value: number;
    parcelasPagas?: number;
    parcelasTotais?: number;
    startDate?: string; // YYYY-MM
  }[];
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
  pendingReceipts?: PendingReceipt[];
  // New fields for Suggestions 1, 2, 6
  driverCnhExpiration?: string;
  driverCnhPhotoUrl?: string;
  driverAddressProofUrl?: string;
  insuranceExpirationDate?: string;
  seguroVencimento?: string;
  tires?: TireState[];
  fines?: Fine[];
  // Official FIPE fields
  fipeCode?: string;
  fipeValue?: number;
  fipeRefMonth?: string;
  fipeLastUpdate?: string; // Format: YYYY-MM
  fipeHistory?: { month: string; value: number }[];
}

export interface TireState {
  id: string;
  position: 'Frontal Esquerdo' | 'Frontal Direito' | 'Traseiro Esquerdo' | 'Traseiro Direito' | 'Estepe';
  brand: string;
  model?: string;
  installedKm: number;
  expectedLifeKm: number; // e.g. 40000
  installedDate?: string;
  dot?: string;
  status: 'Good' | 'Warning' | 'Replace';
  twiMm?: number;
}

export interface Fine {
  id: string;
  vehicleId: string;
  autoInfracao?: string;
  orgaoEmissor?: string;
  dataHora: string;
  local?: string;
  descricao: string;
  valor: number;
  pontos?: number;
  gravidade?: 'Leve' | 'Média' | 'Grave' | 'Gravíssima';
  status: 'Pendente' | 'Repassada ao Motorista' | 'Paga pelo Locatário' | 'Paga pela Locadora';
  driverName?: string;
  driverPhone?: string;
  notificationUrl?: string;
  dueDate?: string;
  addedToWeeklyInvoice?: boolean;
  notes?: string;
}

export interface SinistroLog {
  id: string;
  vehicleId: string;
  date: string;
  description: string;
  repairCost: number;
  photos: string[];
  boUrl?: string;
  location?: string;
}

export interface PendingReceipt {
  id: string;
  date: string;
  amount?: number;
  photoUrl: string;
  notes?: string;
  driverName?: string;
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
  type: 'Preventiva' | 'Corretiva' | 'Revisão' | 'Pneus' | 'Batida/Acidente' | 'Palhetas' | 'Pastilhas' | 'Outro';
  description: string;
  cost: number;
  shopName?: string;
  shopPhone?: string;
  nextKm?: number;
  boNumber?: string;
  partsReplaced?: string;
  parcelasPagas?: number;
  parcelasTotais?: number;
  // Related to sinistro if applicable
  sinistroId?: string;
  // Uploaded invoice / receipt
  receiptUrl?: string;
  invoiceFileName?: string;
}

export interface ExpenseLog {
  id: string;
  vehicleId: string;
  date: string;
  category: 'Seguro' | 'Multa' | 'Lavagem' | 'Estacionamento' | 'Outros';
  description: string;
  cost: number;
  receiptUrl?: string;
  invoiceFileName?: string;
}

export interface AgendaContact {
  id: string;
  name: string;
  phone: string;
  region: string;
  cpfCnpj?: string;
  rg?: string;
  cnh?: string;
  cnhExpiration?: string;
  cnhPhotoUrl?: string;
  addressProofUrl?: string;
  email?: string;
  address?: string;
  notes?: string;
  activeVehiclePlate?: string;
}

export interface Vistoria {
  id: string;
  vehicleId: string;
  vehiclePlate?: string;
  date: string;
  type?: 'Entrega de Veículo' | 'Periódica' | 'Devolução de Veículo';
  checklist: Record<string, boolean>;
  photos: string[];
  notes?: string;
  km?: number;
  status?: 'pending' | 'approved';
  approvedAt?: string;
  pdfDataUrl?: string;
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


