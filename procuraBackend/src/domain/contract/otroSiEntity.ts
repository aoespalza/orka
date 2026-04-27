export interface ContractOtroSi {
  id: string;
  contractId: string;
  contract?: any;
  numero: number;
  endDate?: string | null;
  value: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContractOtroSiDTO {
  contractId: string;
  numero: number;
  endDate?: string;
  value?: number;
}

export interface UpdateContractOtroSiDTO {
  numero?: number;
  endDate?: string;
  value?: number;
}