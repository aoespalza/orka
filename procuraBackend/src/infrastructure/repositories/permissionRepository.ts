import prisma from '../prisma/client';
import { Permission, CreatePermissionDTO, UpdatePermissionDTO } from '../../domain/user';

export class PermissionRepository {
  async findAll(): Promise<Permission[]> {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ category: 'asc' }, { code: 'asc' }],
    });
    return permissions as Permission[];
  }

  async findById(id: string): Promise<Permission | null> {
    const permission = await prisma.permission.findUnique({
      where: { id },
    });
    return permission as Permission | null;
  }

  async findByCode(code: string): Promise<Permission | null> {
    const permission = await prisma.permission.findUnique({
      where: { code },
    });
    return permission as Permission | null;
  }

  async findByCategory(category: string): Promise<Permission[]> {
    const permissions = await prisma.permission.findMany({
      where: { category },
      orderBy: { code: 'asc' },
    });
    return permissions as Permission[];
  }

  async findByIds(ids: string[]): Promise<Permission[]> {
    const permissions = await prisma.permission.findMany({
      where: { id: { in: ids } },
      orderBy: { code: 'asc' },
    });
    return permissions as Permission[];
  }

  async create(data: CreatePermissionDTO): Promise<Permission> {
    const permission = await prisma.permission.create({
      data,
    });
    return permission as Permission;
  }

  async update(id: string, data: UpdatePermissionDTO): Promise<Permission> {
    const permission = await prisma.permission.update({
      where: { id },
      data,
    });
    return permission as Permission;
  }

  async delete(id: string): Promise<void> {
    await prisma.permission.delete({
      where: { id },
    });
  }

  async createMany(permissions: CreatePermissionDTO[]): Promise<Permission[]> {
    const created = await prisma.permission.createManyAndReturn({
      data: permissions,
    });
    return created as Permission[];
  }

  async seedDefaults(): Promise<Permission[]> {
    const { DEFAULT_PERMISSIONS } = await import('../../domain/user');
    
    const existing = await prisma.permission.findMany();
    if (existing.length > 0) {
      return existing as Permission[];
    }

    const created = await prisma.permission.createManyAndReturn({
      data: DEFAULT_PERMISSIONS,
      skipDuplicates: true,
    });
    
    return created as Permission[];
  }
}

export const permissionRepository = new PermissionRepository();
