import { materialRepository } from '../../infrastructure/repositories/materialRepository';
import { Material, CreateMaterialDTO, UpdateMaterialDTO } from '../../domain/material';

export class MaterialUseCases {
  async getAllMaterials(): Promise<Material[]> {
    return materialRepository.findAll();
  }

  async getMaterialById(id: string): Promise<Material | null> {
    return materialRepository.findById(id);
  }

  async getMaterialsByCategory(category: string): Promise<Material[]> {
    return materialRepository.findByCategory(category);
  }

  async getActiveMaterials(): Promise<Material[]> {
    return materialRepository.findActive();
  }

  async createMaterial(data: CreateMaterialDTO): Promise<Material> {
    // Generar código automático si no se proporciona
    if (!data.code) {
      data.code = await materialRepository.generateCode();
    } else {
      const existing = await materialRepository.findByCode(data.code);
      if (existing) {
        throw new Error('Ya existe un material con este código');
      }
    }
    return materialRepository.create(data);
  }

  async updateMaterial(id: string, data: UpdateMaterialDTO): Promise<Material> {
    const material = await materialRepository.findById(id);
    if (!material) {
      throw new Error('Material no encontrado');
    }
    return materialRepository.update(id, data);
  }

  async deleteMaterial(id: string): Promise<void> {
    const material = await materialRepository.findById(id);
    if (!material) {
      throw new Error('Material no encontrado');
    }
    await materialRepository.delete(id);
  }
}

export const materialUseCases = new MaterialUseCases();
