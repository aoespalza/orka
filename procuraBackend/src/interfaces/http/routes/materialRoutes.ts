import { Request, Response } from 'express';
import { materialUseCases } from '../../../application/material/materialUseCases';
import { CreateMaterialDTO, UpdateMaterialDTO } from '../../../domain/material';

export class MaterialController {
  async getAll(req: Request, res: Response) {
    try {
      const { category, active, page = '1', limit = '10', search = '' } = req.query;
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      
      let materials;
      if (category) {
        materials = await materialUseCases.getMaterialsByCategory(category as string);
      } else if (active === 'true') {
        materials = await materialUseCases.getActiveMaterials();
      } else {
        materials = await materialUseCases.getAllMaterials();
      }

      // Filter by search if provided
      if (search) {
        const searchLower = (search as string).toLowerCase();
        materials = materials.filter((m: any) => 
          m.name?.toLowerCase().includes(searchLower) || 
          m.code?.toLowerCase().includes(searchLower)
        );
      }

      const total = materials.length;
      const totalPages = Math.ceil(total / limitNum);
      const startIndex = (pageNum - 1) * limitNum;
      const paginatedData = materials.slice(startIndex, startIndex + limitNum);

      res.json({
        data: paginatedData,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const material = await materialUseCases.getMaterialById(req.params.id);
      if (!material) {
        return res.status(404).json({ error: 'Material no encontrado' });
      }
      res.json(material);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      console.log('=== CREATE MATERIAL ===');
      console.log('Body:', JSON.stringify(req.body, null, 2));
      const data = req.body as CreateMaterialDTO;
      const material = await materialUseCases.createMaterial(data);
      res.status(201).json(material);
    } catch (error: any) {
      console.error('Error creating material:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const data = req.body as UpdateMaterialDTO;
      const material = await materialUseCases.updateMaterial(req.params.id, data);
      res.json(material);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await materialUseCases.deleteMaterial(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const materialController = new MaterialController();
