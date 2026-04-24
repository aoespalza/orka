export type PolicyType = 
  | 'CUMPLIMIENTO' 
  | 'CALIDAD_SUMINISTROS' 
  | 'ESTABILIDAD_OBRA' 
  | 'SALARIOS_PRESTACIONES' 
  | 'RESPONSABILIDAD_CIVIL' 
  | 'BUEN_MANEJO_ANTICIPO';

export interface Policy {
  id: string;
  contractId: string;
  contract?: any;
  type: PolicyType;
  startDate?: string | null;
  endDate?: string | null;
  insuredValue: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePolicyDTO {
  contractId: string;
  type: PolicyType;
  startDate?: string;
  endDate?: string;
  insuredValue?: number;
}

export interface UpdatePolicyDTO {
  type?: PolicyType;
  startDate?: string;
  endDate?: string;
  insuredValue?: number;
}

export const POLICY_TYPE_LABELS: Record<PolicyType, string> = {
  CUMPLIMIENTO: 'Cumplimiento',
  CALIDAD_SUMINISTROS: 'Calidad de Suministros',
  ESTABILIDAD_OBRA: 'Estabilidad de Obra/Calidad de Servicio',
  SALARIOS_PRESTACIONES: 'Salarios y Prestaciones',
  RESPONSABILIDAD_CIVIL: 'Responsabilidad Civil',
  BUEN_MANEJO_ANTICIPO: 'Buen Manejo del Anticipo',
};