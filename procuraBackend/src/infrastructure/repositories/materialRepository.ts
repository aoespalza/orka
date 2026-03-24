import prisma from '../prisma/client';
import { Material, CreateMaterialDTO, UpdateMaterialDTO } from '../../domain/material';
import { MaterialCategory, UnitOfMeasure } from '@prisma/client';

export class MaterialRepository {
  async findAll(): Promise<Material[]> {
    return prisma.material.findMany({
      orderBy: { name: 'asc' },
    }) as Promise<Material[]>;
  }

  async findById(id: string): Promise<Material | null> {
    return prisma.material.findUnique({
      where: { id },
    }) as Promise<Material | null>;
  }

  async findByCode(code: string): Promise<Material | null> {
    return prisma.material.findUnique({
      where: { code },
    }) as Promise<Material | null>;
  }

  async findByCategory(category: string): Promise<Material[]> {
    return prisma.material.findMany({
      where: { category: category as any },
      orderBy: { name: 'asc' },
    }) as Promise<Material[]>;
  }

  async findActive(): Promise<Material[]> {
    return prisma.material.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }) as Promise<Material[]>;
  }

  async create(data: CreateMaterialDTO): Promise<Material> {
    return prisma.material.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        category: data.category as MaterialCategory,
        unitOfMeasure: data.unitOfMeasure as UnitOfMeasure,
        defaultUnitPrice: data.defaultUnitPrice,
        minStock: data.minStock,
        isActive: true,
      },
    }) as Promise<Material>;
  }

  async update(id: string, data: UpdateMaterialDTO): Promise<Material> {
    return prisma.material.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.category !== undefined && { category: data.category as MaterialCategory }),
        ...(data.unitOfMeasure !== undefined && { unitOfMeasure: data.unitOfMeasure as UnitOfMeasure }),
        ...(data.defaultUnitPrice !== undefined && { defaultUnitPrice: data.defaultUnitPrice }),
        ...(data.minStock !== undefined && { minStock: data.minStock }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    }) as Promise<Material>;
  }

  async delete(id: string): Promise<void> {
    await prisma.material.delete({
      where: { id },
    });
  }

  async generateCode(): Promise<string> {
    const count = await prisma.material.count();
    const year = new Date().getFullYear();
    return `MAT-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}

export const materialRepository = new MaterialRepository();
