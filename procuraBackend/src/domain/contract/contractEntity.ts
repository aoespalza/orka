export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'COMPLETED' | 'CANCELLED';
export type FicStatus = 'SI' | 'NO' | 'FIRMA';

export interface ContractItem {
  id: string;
  contractId: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  iva: boolean;
  totalPrice: number;
  observations?: string | null;
  // AIU - Administración, Imprevistos, Utilidad
  applyAiu: boolean;
  aiuAdministration: number;
  aiuImprevistos: number;
  aiuUtilidad: number;
  aiuTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: string;
  code: string;
  workOrderId?: string | null;
  workOrder?: any;
  supplierId: string;
  supplier?: any;
  // Relación directa con Proyecto
  projectId?: string | null;
  project?: any;
  hasPolicy: boolean;
  startDate?: string | null;
  endDate?: string | null;
  value: number;
  subtotal: number;
  iva: number;
  fic: FicStatus;
  actaStartDate?: string | null;
  actaEndDate?: string | null;
  otroSiNumber?: number | null;
  otroSiEndDate?: string | null;
  otroSiValue: number;
  finalValue: number;
  advancePayment: number;
  status: ContractStatus;
  observations?: string | null;
  items?: ContractItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateContractItemDTO {
  materialId?: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  iva?: boolean;
  observations?: string;
  // AIU
  applyAiu?: boolean;
  aiuAdministration?: number;
  aiuImprevistos?: number;
  aiuUtilidad?: number;
}

export interface CreateContractDTO {
  workOrderId?: string;
  projectId?: string;
  supplierId: string;
  startDate?: string;
  endDate?: string;
  value?: number;
  fic?: FicStatus;
  actaStartDate?: string;
  actaEndDate?: string;
  otroSiNumber?: number;
  otroSiEndDate?: string;
  otroSiValue?: number;
  advancePayment?: number;
  status?: ContractStatus;
  observations?: string;
  // Checklist documentos
  docContratoFirmado?: 'SI' | 'NO';
  docRequierePoliza?: 'SI' | 'NO' | 'N/A';
  // Items
  items?: CreateContractItemDTO[];
}

export interface UpdateContractDTO {
  workOrderId?: string;
  projectId?: string;
  supplierId?: string;
  startDate?: string;
  endDate?: string;
  value?: number;
  fic?: FicStatus;
  actaStartDate?: string;
  actaEndDate?: string;
  otroSiNumber?: number;
  otroSiEndDate?: string;
  otroSiValue?: number;
  advancePayment?: number;
  status?: ContractStatus;
  observations?: string;
  // Checklist documentos
  docContratoFirmado?: 'SI' | 'NO';
  docRequierePoliza?: 'SI' | 'NO' | 'N/A';
  // Items
  items?: CreateContractItemDTO[];
}

export interface ContractFilters {
  status?: ContractStatus;
  supplierId?: string;
  workOrderId?: string;
  projectId?: string;
}
