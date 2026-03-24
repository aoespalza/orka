import prisma from '../prisma/client';
import { User, CreateUserDTO, UpdateUserDTO } from '../../domain/user';
import bcrypt from 'bcryptjs';

export class UserRepository {
  async findAll(): Promise<User[]> {
    const users = await prisma.user.findMany({
      orderBy: { username: 'asc' },
      include: {
        profile: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    return users as User[];
  }

  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    return user as User | null;
  }

  async findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { username },
    }) as Promise<User | null>;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: { email },
    });
    return user as User | null;
  }

  async create(data: CreateUserDTO & { profileId?: string }): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    // Si no tiene perfil, asignar el perfil por defecto
    let profileId = data.profileId;
    if (!profileId) {
      const { profileRepository } = await import('./profileRepository');
      const defaultProfile = await profileRepository.findDefault();
      if (defaultProfile) {
        profileId = defaultProfile.id;
      }
    }
    
    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        profileId,
      },
      include: {
        profile: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    return user as User;
  }

  async update(id: string, data: UpdateUserDTO & { profileId?: string }): Promise<User> {
    const updateData: any = { ...data };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        profile: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    return user as User;
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  async verifyPassword(username: string, password: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { username },
    });
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;
    
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }
}

export const userRepository = new UserRepository();
