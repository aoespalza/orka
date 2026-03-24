export interface WorkOrder {
  id: string;
  code: string;
  supplierId: string;
  supplierName?: string;
  title: string;
  description?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  
  // Fechas y plazos
  startDate?: Date | null;
  endDate?: Date | null;
  executionDays?: number | null;
  
  // Valor total
  totalValue: number;
  
  // Forma de pago
  paymentType: PaymentType;
  paymentTerms?: string | null;
  
  // Estado
  status: WorkOrderStatus;
  observations?: string | null;
  
  // Items
  items?: WorkOrderItem[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkOrderItem {
  id: string;
  workOrderId: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  observations?: string | null;
  // AIU - Administración, Imprevistos, Utilidad (normativa colombiana construcción civil)
  applyAiu?: boolean;
  aiuAdministration?: number;
  aiuImprevistos?: number;
  aiuUtilidad?: number;
  aiuTotal?: number;
  createdAt: Date;
  updatedAt: Date;
}

export type WorkOrderStatus = 'DRAFT' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'SUSPENDED' | 'CANCELLED';
export type PaymentType = 'FIJO' | 'ANTICIPO' | 'POR_AVANCE' | 'MIXTO';

export interface CreateWorkOrderDTO {
  createdById: string;
  supplierId: string;
  title: string;
  description?: string;
  projectId?: string;
  startDate?: Date;
  endDate?: Date;
  executionDays?: number;
  totalValue?: number;
  paymentType?: PaymentType;
  paymentTerms?: string;
  status?: WorkOrderStatus;
  observations?: string;
  items?: CreateWorkOrderItemDTO[];
  iva?: boolean;
}

export interface UpdateWorkOrderDTO {
  supplierId?: string;
  title?: string;
  description?: string;
  projectId?: string;
  startDate?: Date;
  endDate?: Date;
  executionDays?: number;
  totalValue?: number;
  paymentType?: PaymentType;
  paymentTerms?: string;
  status?: WorkOrderStatus;
  observations?: string;
  items?: CreateWorkOrderItemDTO[];
}

export interface CreateWorkOrderItemDTO {
  materialId?: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  iva?: boolean;
  observations?: string;
  // AIU - Administración, Imprevistos, Utilidad (normativa colombiana construcción civil)
  applyAiu?: boolean;
  aiuAdministration?: number;
  aiuImprevistos?: number;
  aiuUtilidad?: number;
}
