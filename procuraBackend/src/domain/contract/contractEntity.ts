export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'COMPLETED' | 'CANCELLED';
export type FicStatus = 'SI' | 'NO' | 'FIRMA';

export interface Contract {
  id: string;
  code: string;
  workOrderId?: string | null;
  workOrder?: any;
  supplierId: string;
  supplier?: any;
  hasPolicy: boolean;
  startDate?: string | null;
  endDate?: string | null;
  value: number;
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
  createdAt: string;
  updatedAt: string;
}

export interface CreateContractDTO {
  workOrderId?: string;
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
}

export interface UpdateContractDTO {
  workOrderId?: string;
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
}

export interface ContractFilters {
  status?: ContractStatus;
  supplierId?: string;
  workOrderId?: string;
}
