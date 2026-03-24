// Domain Entity: User
export type UserRole = 'ADMIN' | 'PURCHASE_MANAGER' | 'PURCHASE_AGENT' | 'REQUESTER';

export interface User {
  id: string;
  username: string;
  password?: string;
  email?: string | null;
  role: UserRole;
  name?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDTO {
  username: string;
  password: string;
  email?: string;
  role?: UserRole;
  name?: string;
}

export interface UpdateUserDTO {
  email?: string;
  role?: UserRole;
  name?: string;
  isActive?: boolean;
  password?: string;
}

export interface LoginDTO {
  username: string;
  password: string;
}

export interface AuthPayload {
  userId: string;
  username: string;
  role: UserRole;
}
