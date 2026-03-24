import prisma from '../prisma/client';
import { Profile, CreateProfileDTO, UpdateProfileDTO, ProfilePermission } from '../../domain/user';

export class ProfileRepository {
  async findAll(): Promise<Profile[]> {
    const profiles = await prisma.profile.findMany({
      orderBy: { name: 'asc' },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
    return profiles as Profile[];
  }

  async findById(id: string): Promise<Profile | null> {
    const profile = await prisma.profile.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
    return profile as Profile | null;
  }

  async findByName(name: string): Promise<Profile | null> {
    const profile = await prisma.profile.findUnique({
      where: { name },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
    return profile as Profile | null;
  }

  async findDefault(): Promise<Profile | null> {
    const profile = await prisma.profile.findFirst({
      where: { isDefault: true },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
    return profile as Profile | null;
  }

  async create(data: CreateProfileDTO): Promise<Profile> {
    const { permissionIds, ...profileData } = data;
    
    const profile = await prisma.profile.create({
      data: {
        ...profileData,
        permissions: permissionIds ? {
          create: permissionIds.map(permissionId => ({
            permissionId,
          })),
        } : undefined,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
    return profile as Profile;
  }

  async update(id: string, data: UpdateProfileDTO): Promise<Profile> {
    const { permissionIds, ...profileData } = data;
    
    // Si se proporcionan permissionIds, actualizar la relación
    if (permissionIds) {
      await prisma.profilePermission.deleteMany({
        where: { profileId: id },
      });
      
      await prisma.profilePermission.createMany({
        data: permissionIds.map(permissionId => ({
          profileId: id,
          permissionId,
        })),
      });
    }

    const profile = await prisma.profile.update({
      where: { id },
      data: profileData,
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
    return profile as Profile;
  }

  async delete(id: string): Promise<void> {
    await prisma.profile.delete({
      where: { id },
    });
  }

  async addPermissions(profileId: string, permissionIds: string[]): Promise<Profile> {
    await prisma.profilePermission.createMany({
      data: permissionIds.map(permissionId => ({
        profileId,
        permissionId,
      })),
      skipDuplicates: true,
    });

    return this.findById(profileId) as Promise<Profile>;
  }

  async removePermissions(profileId: string, permissionIds: string[]): Promise<Profile> {
    await prisma.profilePermission.deleteMany({
      where: {
        profileId,
        permissionId: { in: permissionIds },
      },
    });

    return this.findById(profileId) as Promise<Profile>;
  }

  async seedDefaults(): Promise<Profile[]> {
    // Primero asegurar que existan los permisos
    const { permissionRepository } = await import('./permissionRepository');
    await permissionRepository.seedDefaults();

    const permissions = await permissionRepository.findAll();
    const allPermissionIds = permissions.map(p => p.id);

    // Permisos para Administrador (todos)
    const adminPermissionIds = allPermissionIds;

    // Permisos para Gerente de Compras (sin users_delete, settings_edit)
    const managerPermissionIds = allPermissionIds.filter(code => 
      !['users_delete', 'settings_edit'].includes(code)
    );

    // Permisos para Agente de Compras (operaciones, sin settings ni users)
    const agentPermissionIds = allPermissionIds.filter(code => 
      !code.startsWith('settings_') && !code.startsWith('users_') && code !== 'reports_export'
    );

    // Permisos para Solicitante (solo vista)
    const requesterPermissionIds = allPermissionIds.filter(code => 
      code.endsWith('_view') && !code.startsWith('settings_') && !code.startsWith('users_')
    );

    const defaultProfiles = [
      {
        name: 'Administrador',
        description: 'Acceso completo al sistema',
        isDefault: false,
        permissionIds: adminPermissionIds,
      },
      {
        name: 'Gerente de Compras',
        description: 'Gestión de compras y proveedores',
        isDefault: false,
        permissionIds: managerPermissionIds,
      },
      {
        name: 'Agente de Compras',
        description: 'Ejecución de operaciones de compra',
        isDefault: false,
        permissionIds: agentPermissionIds,
      },
      {
        name: 'Solicitante',
        description: 'Solo puede ver y crear solicitudes',
        isDefault: true,
        permissionIds: requesterPermissionIds,
      },
    ];

    const created: Profile[] = [];
    for (const profileData of defaultProfiles) {
      const existing = await this.findByName(profileData.name);
      if (!existing) {
        const profile = await this.create(profileData);
        created.push(profile);
      }
    }

    return created;
  }
}

export const profileRepository = new ProfileRepository();
