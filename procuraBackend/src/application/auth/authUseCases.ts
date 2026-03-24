import { userRepository } from '../../infrastructure/repositories/userRepository';
import { profileRepository } from '../../infrastructure/repositories/profileRepository';
import { User, CreateUserDTO, UpdateUserDTO, AuthPayload } from '../../domain/user';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'procura-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export class AuthUseCases {
  async login(username: string, password: string): Promise<{ user: User; token: string }> {
    const user = await userRepository.verifyPassword(username, password);
    if (!user) {
      throw new Error('Credenciales inválidas');
    }
    
    if (!user.isActive) {
      throw new Error('Usuario inactivo');
    }

    const payload: AuthPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    return { user, token };
  }

  async getAllUsers(): Promise<User[]> {
    return userRepository.findAll();
  }

  async getUserById(id: string): Promise<User | null> {
    return userRepository.findById(id);
  }

  async createUser(data: CreateUserDTO & { profileId?: string }): Promise<User> {
    const existing = await userRepository.findByUsername(data.username);
    if (existing) {
      throw new Error('Ya existe un usuario con este nombre de usuario');
    }
    
    if (data.email) {
      const existingEmail = await userRepository.findByEmail(data.email);
      if (existingEmail) {
        throw new Error('Ya existe un usuario con este correo electrónico');
      }
    }
    
    return userRepository.create(data);
  }

  async updateUser(id: string, data: UpdateUserDTO & { profileId?: string }): Promise<User> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    return userRepository.update(id, data);
  }

  async deleteUser(id: string): Promise<void> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    await userRepository.delete(id);
  }

  async verifyToken(token: string): Promise<AuthPayload> {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
      return payload;
    } catch {
      throw new Error('Token inválido');
    }
  }
}

export const authUseCases = new AuthUseCases();
