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
  preventiveMaintIntervalKm?: number;
  preventiveMaintDate?: string;
  documents?: VehicleDocument[];
  caucaoValor?: number;
  caucaoData?: string;
  caucaoObservacoes?: string;
  nextVistoriaDate?: string;
  themeColor?: string; // Cor temática para o carro
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
  fineRate?: number;
  dailyInterestRate?: number;
  dueDay?: string;
  promisePayments?: PromisePayment[];
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
  notificationDate?: string; // Data de recebimento da notificação
  reminderEnabled?: boolean; // Lembrete ativo para cobrar multa
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

export const MAINTENANCE_CATEGORIES = [
  'Revisão Periódica / Concessionária',
  'Manutenção Preventiva',
  'Manutenção Corretiva (Defeito)',
  'Motor & Injeção Eletrônica',
  'Freios, Suspensão & Direção',
  'Transmissão, Embreagem & Câmbio',
  'Pneus, Rodas & Geometria',
  'Elétrica, Bateria & Iluminação',
  'Ar Condicionado & Arrefecimento',
  'Funilaria, Pintura & Estética',
  'Vidros, Palhetas & Acessórios',
  'Batida, Acidente & B.O.'
] as const;

export const MAINTENANCE_SCOPES = [
  'Troca de Óleo, Filtros e Lubrificantes',
  'Sistema de Freios (Pastilhas, Discos e Fluido)',
  'Suspensão e Direção (Amortecedores, Buchas e Pivôs)',
  'Pneus (Troca, Rodízio, Alinhamento e Balanceamento)',
  'Sistema Elétrico (Bateria, Alternador e Iluminação)',
  'Injeção Eletrônica, Velas, Cabos e Bobinas',
  'Correia Dentada, Tensores e Correias Auxiliares',
  'Embreagem, Câmbio e Troca de Fluido da Transmissão',
  'Sistema de Arrefecimento (Radiador, Aditivo e Bomba d\'Água)',
  'Ar Condicionado (Higienização, Filtro de Cabine e Gás)',
  'Funilaria, Martelinho de Ouro e Pintura',
  'Troca de Palhetas, Vidros e Retrovisores',
  'Escapamento, Catalisador e Sensores',
  'Higienização Interna, Polimento e Detalhamento'
] as const;

export const CATEGORY_TO_SCOPES_MAP: Record<string, string[]> = {
  'Revisão Periódica / Concessionária': [
    'Troca de Óleo, Filtros e Lubrificantes',
    'Correia Dentada, Tensores e Correias Auxiliares',
    'Sistema de Freios (Pastilhas, Discos e Fluido)',
    'Sistema de Arrefecimento (Radiador, Aditivo e Bomba d\'Água)'
  ],
  'Manutenção Preventiva': [
    'Troca de Óleo, Filtros e Lubrificantes',
    'Correia Dentada, Tensores e Correias Auxiliares',
    'Sistema de Arrefecimento (Radiador, Aditivo e Bomba d\'Água)',
    'Ar Condicionado (Higienização, Filtro de Cabine e Gás)',
    'Pneus (Troca, Rodízio, Alinhamento e Balanceamento)'
  ],
  'Manutenção Corretiva (Defeito)': MAINTENANCE_SCOPES as unknown as string[],
  'Motor & Injeção Eletrônica': [
    'Injeção Eletrônica, Velas, Cabos e Bobinas',
    'Correia Dentada, Tensores e Correias Auxiliares',
    'Troca de Óleo, Filtros e Lubrificantes',
    'Escapamento, Catalisador e Sensores'
  ],
  'Freios, Suspensão & Direção': [
    'Sistema de Freios (Pastilhas, Discos e Fluido)',
    'Suspensão e Direção (Amortecedores, Buchas e Pivôs)'
  ],
  'Transmissão, Embreagem & Câmbio': [
    'Embreagem, Câmbio e Troca de Fluido da Transmissão'
  ],
  'Pneus, Rodas & Geometria': [
    'Pneus (Troca, Rodízio, Alinhamento e Balanceamento)'
  ],
  'Elétrica, Bateria & Iluminação': [
    'Sistema Elétrico (Bateria, Alternador e Iluminação)',
    'Injeção Eletrônica, Velas, Cabos e Bobinas'
  ],
  'Ar Condicionado & Arrefecimento': [
    'Sistema de Arrefecimento (Radiador, Aditivo e Bomba d\'Água)',
    'Ar Condicionado (Higienização, Filtro de Cabine e Gás)'
  ],
  'Funilaria, Pintura & Estética': [
    'Funilaria, Martelinho de Ouro e Pintura',
    'Higienização Interna, Polimento e Detalhamento'
  ],
  'Vidros, Palhetas & Acessórios': [
    'Troca de Palhetas, Vidros e Retrovisores'
  ],
  'Batida, Acidente & B.O.': [
    'Funilaria, Martelinho de Ouro e Pintura',
    'Troca de Palhetas, Vidros e Retrovisores',
    'Sistema Elétrico (Bateria, Alternador e Iluminação)'
  ]
};

export function getScopesForCategory(category: string): string[] {
  return CATEGORY_TO_SCOPES_MAP[category] || MAINTENANCE_SCOPES as unknown as string[];
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  date: string;
  type: 'Preventiva' | 'Corretiva' | 'Revisão' | 'Pneus' | 'Batida/Acidente' | 'Palhetas' | 'Pastilhas' | 'Outro';
  category?: string;
  scope?: string;
  description: string;
  cost: number;
  currentKm?: number;
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
  category: 'IPVA' | 'Seguro' | 'Licenciamento' | 'Multa' | 'Lavagem' | 'Estacionamento' | 'Financiamento' | 'Rastreador' | 'Outros';
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
  type?: 'entrega' | 'periódica' | 'devolução';
  checklist: Record<string, boolean>;
  photos: string[];
  notes?: string;
  km?: number;
  status?: 'pending' | 'approved' | 'requested';
  approvedAt?: string;
  pdfDataUrl?: string;
  fuelLevel?: number; // 0 to 100
  reqId?: string; // Token único de utilização única por vistoria
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

export interface PromisePayment {
  id: string;
  date: string;
  amount: number;
  isPaid: boolean;
}


