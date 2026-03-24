import { Request, Response } from 'express';
import { permissionUseCases } from '../../../application/auth/permissionUseCases';
import { CreatePermissionDTO, UpdatePermissionDTO } from '../../../domain/user';
import { AuthRequest, authorize } from '../../../shared/middleware/auth';

export class PermissionController {
  async getAll(req: Request, res: Response) {
    try {
      const permissions = await permissionUseCases.getAllPermissions();
      res.json(permissions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const permission = await permissionUseCases.getPermissionById(req.params.id);
      if (!permission) {
        return res.status(404).json({ error: 'Permiso no encontrado' });
      }
      res.json(permission);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getByCategory(req: Request, res: Response) {
    try {
      const { category } = req.params;
      const permissions = await permissionUseCases.getPermissionsByCategory(category);
      res.json(permissions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const data = req.body as CreatePermissionDTO;
      const permission = await permissionUseCases.createPermission(data);
      res.status(201).json(permission);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const data = req.body as UpdatePermissionDTO;
      const permission = await permissionUseCases.updatePermission(req.params.id, data);
      res.json(permission);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      await permissionUseCases.deletePermission(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async seed(req: AuthRequest, res: Response) {
    try {
      const permissions = await permissionUseCases.seedPermissions();
      res.json({ message: 'Permisos inicializados correctamente', count: permissions.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const permissionController = new PermissionController();
