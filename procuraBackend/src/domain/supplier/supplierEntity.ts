// Domain Entity: Supplier
export type SupplierStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export interface Supplier {
  id: string;
  code: string;
  name: string;
  rut?: string | null;
  nit?: string | null;
  rutFile?: string | null;
  address?: string | null;
  city?: string | null;
  country: string;
  phone?: string | null;
  email?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  bankAccount?: string | null;
  bankName?: string | null;
  paymentTerms?: string | null;
  notes?: string | null;
  categories: string[];
  status: SupplierStatus;
  rating?: number | null;
  createdAt: Date;
  updatedAt: Date;
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
}

export interface UpdateSupplierDTO {
  name?: string;
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
