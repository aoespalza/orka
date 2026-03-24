import { supplierRepository } from '../../infrastructure/repositories/supplierRepository';
import { Supplier, CreateSupplierDTO, UpdateSupplierDTO } from '../../domain/supplier';

export class SupplierUseCases {
  async getAllSuppliers(): Promise<Supplier[]> {
    return supplierRepository.findAll();
  }

  async getSupplierById(id: string): Promise<Supplier | null> {
    return supplierRepository.findById(id);
  }

  async getSuppliersByStatus(status: string): Promise<Supplier[]> {
    return supplierRepository.findByStatus(status);
  }

  async getLastSupplier(): Promise<Supplier | null> {
    return supplierRepository.findLast();
  }

  async createSupplier(data: CreateSupplierDTO): Promise<Supplier> {
    // Check for duplicate code if provided
    if (data.code) {
      const existing = await supplierRepository.findByCode(data.code);
      if (existing) {
        throw new Error('Ya existe un proveedor con este código');
      }
    }
    return supplierRepository.create(data);
  }

  async updateSupplier(id: string, data: UpdateSupplierDTO): Promise<Supplier> {
    const supplier = await supplierRepository.findById(id);
    if (!supplier) {
      throw new Error('Proveedor no encontrado');
    }
    return supplierRepository.update(id, data);
  }

  async deleteSupplier(id: string): Promise<void> {
    const supplier = await supplierRepository.findById(id);
    if (!supplier) {
      throw new Error('Proveedor no encontrado');
    }
    await supplierRepository.delete(id);
  }

  async updateSupplierStatus(id: string, status: string): Promise<Supplier> {
    const supplier = await supplierRepository.findById(id);
    if (!supplier) {
      throw new Error('Proveedor no encontrado');
    }
    return supplierRepository.updateStatus(id, status);
  }
}

export const supplierUseCases = new SupplierUseCases();
