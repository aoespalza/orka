import { Request, Response } from 'express';
import { profileUseCases } from '../../../application/auth/profileUseCases';
import { CreateProfileDTO, UpdateProfileDTO } from '../../../domain/user';
import { AuthRequest, authorize } from '../../../shared/middleware/auth';

export class ProfileController {
  async getAll(req: Request, res: Response) {
    try {
      const profiles = await profileUseCases.getAllProfiles();
      res.json(profiles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const profile = await profileUseCases.getProfileById(req.params.id);
      if (!profile) {
        return res.status(404).json({ error: 'Perfil no encontrado' });
      }
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const data = req.body as CreateProfileDTO;
      const profile = await profileUseCases.createProfile(data);
      res.status(201).json(profile);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const data = req.body as UpdateProfileDTO;
      const profile = await profileUseCases.updateProfile(req.params.id, data);
      res.json(profile);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      await profileUseCases.deleteProfile(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async assignPermissions(req: AuthRequest, res: Response) {
    try {
      const { permissionIds } = req.body;
      const profile = await profileUseCases.assignPermissions(req.params.id, permissionIds);
      res.json(profile);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async removePermissions(req: AuthRequest, res: Response) {
    try {
      const { permissionIds } = req.body;
      const profile = await profileUseCases.removePermissions(req.params.id, permissionIds);
      res.json(profile);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async seed(req: AuthRequest, res: Response) {
    try {
      const profiles = await profileUseCases.seedProfiles();
      res.json({ message: 'Perfiles inicializados correctamente', count: profiles.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const profileController = new ProfileController();
