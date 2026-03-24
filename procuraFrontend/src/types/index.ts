// ============================================
// ENUMS
// ============================================

export type UserRole = 'ADMIN' | 'PURCHASE_MANAGER' | 'PURCHASE_AGENT' | 'REQUESTER';

export type SupplierStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export type QuotationRequestStatus = 'DRAFT' | 'SENT' | 'RECEIVED' | 'COMPARING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type QuotationStatus = 'PENDING' | 'RECEIVED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export type PurchaseOrderStatus = 'DRAFT' | 'SENT' | 'CONFIRMED' | 'IN_PROGRESS' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';

export type PurchaseOrderItemStatus = 'PENDING' | 'PARTIALLY_RECEIVED' | 'RECEIVED';

export type MaterialCategory = 
  | 'CONSTRUCTION_MATERIALS' 
  | 'ELECTRICAL' 
  | 'PLUMBING' 
  | 'HARDWARE' 
  | 'PAINT' 
  | 'SAFETY_EQUIPMENT' 
  | 'TOOLS' 
  | 'MACHINERY' 
  | 'TECHNOLOGY'
  | 'OTHER';

export type UnitOfMeasure = 'UNITS' | 'KG' | 'TON' | 'METER' | 'LITER' | 'BOX' | 'BAG' | 'PALLET';

// ============================================
// USER
// ============================================

export interface User {
  id: string;
  username: string;
  email: string | null;
  role: UserRole;
  name: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  profileId?: string | null;
  profile?: ProfileSummary | null;
}

export interface ProfileSummary {
  id: string;
  name: string;
}

export interface CreateUserDTO {
  username: string;
  password: string;
  email?: string;
  role?: UserRole;
  name?: string;
  profileId?: string;
}

export interface UpdateUserDTO {
  email?: string;
  role?: UserRole;
  name?: string;
  isActive?: boolean;
  password?: string;
  profileId?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// ============================================
// PERMISSIONS
// ============================================

export interface Permission {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePermissionDTO {
  code: string;
  name: string;
  description?: string;
  category: string;
}

export interface UpdatePermissionDTO {
  name?: string;
  description?: string;
  category?: string;
  isActive?: boolean;
}

// ============================================
// PROFILES
// ============================================

export interface ProfilePermission {
  profileId: string;
  permissionId: string;
  grantedAt: string;
  permission?: Permission;
}

export interface Profile {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  permissions?: ProfilePermission[];
}

export interface CreateProfileDTO {
  name: string;
  description?: string;
  isDefault?: boolean;
  permissionIds?: string[];
}

export interface UpdateProfileDTO {
  name?: string;
  description?: string;
  isDefault?: boolean;
  isActive?: boolean;
  permissionIds?: string[];
}

// ============================================
// SUPPLIER
// ============================================

export interface Supplier {
  id: string;
  code: string;
  name: string;
  rut: string | null;
  nit: string | null;
  rutFile: string | null;
  address: string | null;
  city: string | null;
  country: string;
  phone: string | null;
  email: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  bankAccount: string | null;
  bankName: string | null;
  paymentTerms: string | null;
  notes: string | null;
  categories: string[];
  status: SupplierStatus;
  rating: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierDTO {
  code: string;
  name: string;
  rut?: string;
  nit?: string;
  rutFile?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  bankAccount?: string;
  bankName?: string;
  paymentTerms?: string;
  notes?: string;
  categories?: string[];
  status?: SupplierStatus;
  rating?: number;
}

export interface UpdateSupplierDTO extends Partial<CreateSupplierDTO> {}

// ============================================
// MATERIAL
// ============================================

export interface Material {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: MaterialCategory;
  unitOfMeasure: UnitOfMeasure;
  defaultUnitPrice: number | null;
  minStock: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaterialDTO {
  code: string;
  name: string;
  description?: string;
  category: MaterialCategory;
  unitOfMeasure: UnitOfMeasure;
  defaultUnitPrice?: number;
  minStock?: number;
  isActive?: boolean;
}

export interface UpdateMaterialDTO extends Partial<CreateMaterialDTO> {}

// ============================================
// QUOTATION REQUEST (RFQ)
// ============================================

export interface QuotationRequest {
  id: string;
  code: string;
  title: string;
  description: string | null;
  projectName: string | null;
  priority: string | null;
  requiredDate: string | null;
  deliveryAddress: string | null;
  status: QuotationRequestStatus;
  createdById: string;
  createdBy?: User;
  selectedQuotationId: string | null;
  items: QuotationRequestItem[];
  quotations?: Quotation[];
  createdAt: string;
  updatedAt: string;
}

export interface QuotationRequestItem {
  id: string;
  quotationRequestId: string;
  materialId: string | null;
  description: string;
  quantity: number;
  unitOfMeasure: UnitOfMeasure;
  observations: string | null;
  material?: Material;
  quotationItems?: QuotationItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuotationRequestDTO {
  title: string;
  description?: string;
  projectName?: string;
  priority?: string;
  requiredDate?: string;
  deliveryAddress?: string;
  items: {
    materialId?: string;
    description: string;
    quantity: number;
    unitOfMeasure: UnitOfMeasure;
    observations?: string;
  }[];
}

export interface UpdateQuotationRequestDTO extends Partial<CreateQuotationRequestDTO> {
  status?: QuotationRequestStatus;
}

// ============================================
// QUOTATION
// ============================================

export interface Quotation {
  id: string;
  code: string;
  quotationRequestId: string;
  supplierId: string;
  quotationDate: string;
  validUntil: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: QuotationStatus;
  notes: string | null;
  paymentTerms: string | null;
  deliveryTime: string | null;
  receivedById: string | null;
  receivedBy?: User;
  quotationRequest?: QuotationRequest;
  supplier?: Supplier;
  items: QuotationItem[];
  createdAt: string;
  updatedAt: string;
}

export interface QuotationItem {
  id: string;
  quotationId: string;
  quotationRequestItemId: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  total: number;
  deliveryTime: string | null;
  availability: string | null;
  brand: string | null;
  observations: string | null;
  quotationRequestItem?: QuotationRequestItem;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuotationDTO {
  quotationRequestId: string;
  supplierId: string;
  validUntil?: string;
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  notes?: string;
  paymentTerms?: string;
  deliveryTime?: string;
  sendEmail?: boolean;
  items: {
    quotationRequestItemId: string;
    unitPrice: number;
    quantity: number;
    discount?: number;
    total: number;
    deliveryTime?: string;
    availability?: string;
    brand?: string;
    observations?: string;
  }[];
}

// ============================================
// PURCHASE ORDER
// ============================================

export interface PurchaseOrder {
  id: string;
  code: string;
  supplierId: string;
  projectName: string | null;
  description: string | null;
  deliveryAddress: string | null;
  requiredDate: string | null;
  orderDate: string;
  confirmationDate: string | null;
  expectedDelivery: string | null;
  receivedDate: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: PurchaseOrderStatus;
  paymentTerms: string | null;
  deliveryTerms: string | null;
  createdById: string;
  createdBy?: User;
  approvedById: string | null;
  approvedBy?: User;
  supplier?: Supplier;
  items: PurchaseOrderItem[];
  statusHistory?: PurchaseOrderStatusHistory[];
  receipts?: PurchaseReceipt[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  materialId: string | null;
  description: string;
  quantity: number;
  unitOfMeasure: UnitOfMeasure;
  unitPrice: number;
  discount: number;
  total: number;
  quantityReceived: number;
  status: PurchaseOrderItemStatus;
  quotationItemId: string | null;
  material?: Material;
  receipts?: PurchaseReceiptItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderStatusHistory {
  id: string;
  purchaseOrderId: string;
  status: PurchaseOrderStatus;
  changedById: string;
  changedAt: string;
  notes: string | null;
}

export interface CreatePurchaseOrderDTO {
  supplierId: string;
  projectName?: string;
  description?: string;
  deliveryAddress?: string;
  requiredDate?: string;
  expectedDelivery?: string;
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  paymentTerms?: string;
  deliveryTerms?: string;
  items: {
    materialId?: string;
    description: string;
    quantity: number;
    unitOfMeasure: UnitOfMeasure;
    unitPrice: number;
    discount?: number;
    total: number;
    quotationItemId?: string;
  }[];
}

export interface UpdatePurchaseOrderDTO extends Partial<CreatePurchaseOrderDTO> {
  status?: PurchaseOrderStatus;
  approvedById?: string;
}

// ============================================
// PURCHASE RECEIPT
// ============================================

export interface PurchaseReceipt {
  id: string;
  purchaseOrderId: string;
  receiptDate: string;
  receivedBy: string | null;
  observations: string | null;
  purchaseOrder?: PurchaseOrder;
  items: PurchaseReceiptItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseReceiptItem {
  id: string;
  receiptId: string;
  purchaseOrderItemId: string;
  quantityReceived: number;
  purchaseOrderItem?: PurchaseOrderItem;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseReceiptDTO {
  purchaseOrderId: string;
  receiptDate?: string;
  receivedBy?: string;
  observations?: string;
  items: {
    purchaseOrderItemId: string;
    quantityReceived: number;
  }[];
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// DASHBOARD STATS
// ============================================

export interface DashboardStats {
  totalMaterials: number;
  totalSuppliers: number;
  activeSuppliers: number;
  totalWorkOrders: number;
  activeWorkOrders: number;
  totalProjects: number;
  activeProjects: number;
  totalContracts: number;
  activeContracts: number;
}

// ============================================
// WORK ORDERS - Órdenes de Trabajo
// ============================================

export type WorkOrderStatus = 'DRAFT' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'SUSPENDED' | 'CANCELLED';
export type PaymentType = 'FIJO' | 'ANTICIPO' | 'POR_AVANCE' | 'MIXTO';

export interface WorkOrderItem {
  id: string;
  workOrderId: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  iva?: boolean;
  totalPrice: number;
  observations?: string;
  // AIU - Administración, Imprevistos, Utilidad (normativa colombiana construcción civil)
  applyAiu?: boolean;
  aiuAdministration?: number;
  aiuImprevistos?: number;
  aiuUtilidad?: number;
  aiuTotal?: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrder {
  id: string;
  code: string;
  supplierId: string;
  supplierName?: string;
  title: string;
  description?: string;
  projectId?: string;
  projectName?: string;
  startDate?: string;
  endDate?: string;
  executionDays?: number;
  subtotal?: number;
  iva?: number;
  totalValue: number;
  paymentType: PaymentType;
  paymentTerms?: string;
  status: WorkOrderStatus;
  observations?: string;
  items?: WorkOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkOrderDTO {
  supplierId: string;
  title: string;
  description?: string;
  projectId?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  executionDays?: number;
  totalValue?: number;
  paymentType?: PaymentType;
  paymentTerms?: string;
  status?: WorkOrderStatus;
  observations?: string;
  items?: CreateWorkOrderItemDTO[];
}

export interface CreateWorkOrderItemDTO {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  iva?: boolean;
  totalPrice?: number;
  observations?: string;
  // AIU - Administración, Imprevistos, Utilidad (normativa colombiana construcción civil)
  applyAiu?: boolean;
  aiuAdministration?: number;
  aiuImprevistos?: number;
  aiuUtilidad?: number;
}

// ============================================
// CONTRATOS
// ============================================

export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'COMPLETED' | 'CANCELLED';
export type FicStatus = 'SI' | 'NO' | 'FIRMA';

export interface Contract {
  id: string;
  code: string;
  workOrderId?: string | null;
  workOrder?: any;
  supplierId: string;
  supplier?: any;
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
  // Checklist de documentos
  docContratoFirmado?: 'SI' | 'NO';
  docRequierePoliza?: 'SI' | 'NO' | 'N/A';
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
  // Checklist de documentos
  docContratoFirmado?: 'SI' | 'NO';
  docRequierePoliza?: 'SI' | 'NO' | 'N/A';
}
