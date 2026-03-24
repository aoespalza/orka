// Domain Entity: Profile
import { Permission } from './permissionEntity';

export interface Profile {
  id: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  permissions?: ProfilePermission[];
  users?: ProfileUser[];
}

export interface ProfileUser {
  id: string;
  username: string;
  email?: string | null;
  name?: string | null;
  role: string;
}

export interface ProfilePermission {
  profileId: string;
  permissionId: string;
  grantedAt: Date;
  permission?: Permission;
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

// Perfiles por defecto del sistema
export const DEFAULT_PROFILES: CreateProfileDTO[] = [
  {
    name: 'Administrador',
    description: 'Acceso completo al sistema',
    isDefault: false,
    permissionIds: [], // Se llenará con todos los permisos
  },
  {
    name: 'Gerente de Compras',
    description: 'Gestión de compras y proveedores',
    isDefault: false,
    permissionIds: [],
  },
  {
    name: 'Agente de Compras',
    description: 'Ejecución de operaciones de compra',
    isDefault: false,
    permissionIds: [],
  },
  {
    name: 'Solicitante',
    description: 'Solo puede ver y crear solicitudes',
    isDefault: true,
    permissionIds: [],
  },
];
