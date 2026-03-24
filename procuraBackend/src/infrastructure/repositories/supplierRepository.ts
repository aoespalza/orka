import prisma from '../prisma/client';
import { Supplier, CreateSupplierDTO, UpdateSupplierDTO } from '../../domain/supplier';

export class SupplierRepository {
  async findAll(): Promise<Supplier[]> {
    return prisma.supplier.findMany({
      orderBy: { name: 'asc' },
    }) as Promise<Supplier[]>;
  }

  async findLast(): Promise<Supplier | null> {
    const last = await prisma.supplier.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    return last as Supplier | null;
  }

  async findById(id: string): Promise<Supplier | null> {
    return prisma.supplier.findUnique({
      where: { id },
    }) as Promise<Supplier | null>;
  }

  async findByCode(code: string): Promise<Supplier | null> {
    return prisma.supplier.findUnique({
      where: { code },
    }) as Promise<Supplier | null>;
  }

  async findByStatus(status: string): Promise<Supplier[]> {
    return prisma.supplier.findMany({
      where: { status: status as any },
      orderBy: { name: 'asc' },
    }) as Promise<Supplier[]>;
  }

  async create(data: CreateSupplierDTO): Promise<Supplier> {
    return prisma.supplier.create({
      data: {
        ...data,
        categories: data.categories || [],
      },
    }) as Promise<Supplier>;
  }

  async update(id: string, data: UpdateSupplierDTO): Promise<Supplier> {
    return prisma.supplier.update({
      where: { id },
      data,
    }) as Promise<Supplier>;
  }

  async delete(id: string): Promise<void> {
    await prisma.supplier.delete({
      where: { id },
    });
  }

  async updateStatus(id: string, status: string): Promise<Supplier> {
    return prisma.supplier.update({
      where: { id },
      data: { status: status as any },
    }) as Promise<Supplier>;
  }
}

export const supplierRepository = new SupplierRepository();
