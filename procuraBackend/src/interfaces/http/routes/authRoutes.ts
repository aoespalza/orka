import { Request, Response } from 'express';
import { authUseCases } from '../../../application/auth/authUseCases';
import { profileUseCases } from '../../../application/auth/profileUseCases';
import { CreateUserDTO, UpdateUserDTO } from '../../../domain/user';
import { AuthRequest, authenticate, authorize } from '../../../shared/middleware/auth';

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;
      const result = await authUseCases.login(username, password);
      res.json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  // Endpoint público para crear primer usuario admin (solo si no hay usuarios)
  async seedAdmin(req: Request, res: Response) {
    try {
      const users = await authUseCases.getAllUsers();
      if (users.length > 0) {
        return res.status(400).json({ error: 'Ya existen usuarios en el sistema' });
      }
      const data = req.body as CreateUserDTO & { profileId?: string };
      const user = await authUseCases.createUser({ ...data, role: 'ADMIN' });
      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await authUseCases.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getUserById(req: Request, res: Response) {
    try {
      const user = await authUseCases.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createUser(req: AuthRequest, res: Response) {
    try {
      const data = req.body as CreateUserDTO & { profileId?: string };
      const user = await authUseCases.createUser(data);
      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateUser(req: AuthRequest, res: Response) {
    try {
      const data = req.body as UpdateUserDTO & { profileId?: string };
      const user = await authUseCases.updateUser(req.params.id, data);
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteUser(req: AuthRequest, res: Response) {
    try {
      await authUseCases.deleteUser(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getProfile(req: AuthRequest, res: Response) {
    try {
      const user = await authUseCases.getUserById(req.user!.userId);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAllProfiles(req: AuthRequest, res: Response) {
    try {
      const profiles = await profileUseCases.getAllProfiles();
      res.json(profiles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const authController = new AuthController();
