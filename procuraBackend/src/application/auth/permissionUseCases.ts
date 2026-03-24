import { permissionRepository } from '../../infrastructure/repositories/permissionRepository';
import { Permission, CreatePermissionDTO, UpdatePermissionDTO } from '../../domain/user';

export class PermissionUseCases {
  async getAllPermissions(): Promise<Permission[]> {
    return permissionRepository.findAll();
  }

  async getPermissionById(id: string): Promise<Permission | null> {
    return permissionRepository.findById(id);
  }

  async getPermissionsByCategory(category: string): Promise<Permission[]> {
    return permissionRepository.findByCategory(category);
  }

  async createPermission(data: CreatePermissionDTO): Promise<Permission> {
    const existing = await permissionRepository.findByCode(data.code);
    if (existing) {
      throw new Error('Ya existe un permiso con este código');
    }
    return permissionRepository.create(data);
  }

  async updatePermission(id: string, data: UpdatePermissionDTO): Promise<Permission> {
    const permission = await permissionRepository.findById(id);
    if (!permission) {
      throw new Error('Permiso no encontrado');
    }
    return permissionRepository.update(id, data);
  }

  async deletePermission(id: string): Promise<void> {
    const permission = await permissionRepository.findById(id);
    if (!permission) {
      throw new Error('Permiso no encontrado');
    }
    await permissionRepository.delete(id);
  }

  async seedPermissions(): Promise<Permission[]> {
    return permissionRepository.seedDefaults();
  }
}

export const permissionUseCases = new PermissionUseCases();
