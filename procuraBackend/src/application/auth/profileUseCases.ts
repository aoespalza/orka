import { profileRepository } from '../../infrastructure/repositories/profileRepository';
import { userRepository } from '../../infrastructure/repositories/userRepository';
import { Profile, CreateProfileDTO, UpdateProfileDTO } from '../../domain/user';

export class ProfileUseCases {
  async getAllProfiles(): Promise<Profile[]> {
    return profileRepository.findAll();
  }

  async getProfileById(id: string): Promise<Profile | null> {
    return profileRepository.findById(id);
  }

  async getProfileByName(name: string): Promise<Profile | null> {
    return profileRepository.findByName(name);
  }

  async getDefaultProfile(): Promise<Profile | null> {
    return profileRepository.findDefault();
  }

  async createProfile(data: CreateProfileDTO): Promise<Profile> {
    const existing = await profileRepository.findByName(data.name);
    if (existing) {
      throw new Error('Ya existe un perfil con este nombre');
    }
    
    // Si es el primer perfil, hacerlo por defecto
    const profiles = await profileRepository.findAll();
    if (profiles.length === 0) {
      data.isDefault = true;
    }
    
    // Si este perfil será el default, quitar el default de otros
    if (data.isDefault) {
      await this.clearDefaultProfiles();
    }
    
    return profileRepository.create(data);
  }

  async updateProfile(id: string, data: UpdateProfileDTO): Promise<Profile> {
    const profile = await profileRepository.findById(id);
    if (!profile) {
      throw new Error('Perfil no encontrado');
    }
    
    // Si este perfil será el default, quitar el default de otros
    if (data.isDefault) {
      await this.clearDefaultProfiles();
    }
    
    return profileRepository.update(id, data);
  }

  async deleteProfile(id: string): Promise<void> {
    const profile = await profileRepository.findById(id);
    if (!profile) {
      throw new Error('Perfil no encontrado');
    }
    
    // No permitir eliminar el último perfil
    const profiles = await profileRepository.findAll();
    if (profiles.length <= 1) {
      throw new Error('No se puede eliminar el último perfil');
    }
    
    // Si es el perfil por defecto, asignar otro por defecto
    if (profile.isDefault) {
      const otherProfile = profiles.find(p => p.id !== id);
      if (otherProfile) {
        await profileRepository.update(otherProfile.id, { isDefault: true });
      }
    }
    
    // Eliminar usuarios asociados
    if (profile.users && profile.users.length > 0) {
      // Obtener el perfil por defecto o crear uno temporal
      const defaultProfile = await profileRepository.findDefault();
      if (defaultProfile) {
        for (const user of profile.users) {
          await userRepository.update(user.id, { profileId: defaultProfile.id });
        }
      }
    }
    
    await profileRepository.delete(id);
  }

  async assignPermissions(profileId: string, permissionIds: string[]): Promise<Profile> {
    const profile = await profileRepository.findById(profileId);
    if (!profile) {
      throw new Error('Perfil no encontrado');
    }
    return profileRepository.addPermissions(profileId, permissionIds);
  }

  async removePermissions(profileId: string, permissionIds: string[]): Promise<Profile> {
    const profile = await profileRepository.findById(profileId);
    if (!profile) {
      throw new Error('Perfil no encontrado');
    }
    return profileRepository.removePermissions(profileId, permissionIds);
  }

  async seedProfiles(): Promise<Profile[]> {
    return profileRepository.seedDefaults();
  }

  private async clearDefaultProfiles(): Promise<void> {
    const profiles = await profileRepository.findAll();
    for (const profile of profiles) {
      if (profile.isDefault) {
        await profileRepository.update(profile.id, { isDefault: false });
      }
    }
  }
}

export const profileUseCases = new ProfileUseCases();
