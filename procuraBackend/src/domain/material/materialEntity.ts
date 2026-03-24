// Domain Entity: Material
export type MaterialCategory = 
  | 'CONSTRUCTION_MATERIALS'
  | 'ELECTRICAL'
  | 'PLUMBING'
  | 'HARDWARE'
  | 'PAINT'
  | 'SAFETY_EQUIPMENT'
  | 'TOOLS'
  | 'MACHINERY'
  | 'OTHER';

export type UnitOfMeasure = 
  | 'UNITS'
  | 'KG'
  | 'TON'
  | 'METER'
  | 'LITER'
  | 'BOX'
  | 'BAG'
  | 'PALLET';

export interface Material {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  category: MaterialCategory;
  unitOfMeasure: UnitOfMeasure;
  defaultUnitPrice?: number | null;
  minStock?: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMaterialDTO {
  code: string;
  name: string;
  description?: string;
  category: MaterialCategory;
  unitOfMeasure: UnitOfMeasure;
  defaultUnitPrice?: number;
  minStock?: number;
}

export interface UpdateMaterialDTO {
  name?: string;
  description?: string;
  category?: MaterialCategory;
  unitOfMeasure?: UnitOfMeasure;
  defaultUnitPrice?: number;
  minStock?: number;
  isActive?: boolean;
}
