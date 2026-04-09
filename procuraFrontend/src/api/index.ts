import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type { 
  LoginRequest, 
  LoginResponse, 
  User,
  CreateUserDTO,
  UpdateUserDTO,
  Permission,
  CreatePermissionDTO,
  UpdatePermissionDTO,
  Profile,
  CreateProfileDTO,
  UpdateProfileDTO,
  Supplier, 
  CreateSupplierDTO, 
  UpdateSupplierDTO,
  Material,
  CreateMaterialDTO,
  UpdateMaterialDTO,
  DashboardStats,
  WorkOrder,
  CreateWorkOrderDTO,
  PaginatedResponse,
  Contract,
  CreateContractDTO
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // Interceptor para agregar token
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Interceptor para manejar errores
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.token = null;
          localStorage.removeItem('procura_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string | null) {
    this.token = token;
  }

  // ============================================
  // AUTH & USERS
  // ============================================

  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>('/auth/login', data);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>('/auth/me');
    return response.data;
  }

  // Users CRUD
  async getUsers(): Promise<User[]> {
    const response = await this.client.get<User[]>('/users');
    return response.data;
  }

  async getUser(id: string): Promise<User> {
    const response = await this.client.get<User>(`/users/${id}`);
    return response.data;
  }

  async createUser(data: CreateUserDTO): Promise<User> {
    const response = await this.client.post<User>('/users', data);
    return response.data;
  }

  async updateUser(id: string, data: UpdateUserDTO): Promise<User> {
    const response = await this.client.put<User>(`/users/${id}`, data);
    return response.data;
  }

  async deleteUser(id: string): Promise<void> {
    await this.client.delete(`/users/${id}`);
  }

  // Profiles
  async getProfiles(): Promise<Profile[]> {
    const response = await this.client.get<Profile[]>('/profiles');
    return response.data;
  }

  async getProfile(id: string): Promise<Profile> {
    const response = await this.client.get<Profile>(`/profiles/${id}`);
    return response.data;
  }

  async createProfile(data: CreateProfileDTO): Promise<Profile> {
    const response = await this.client.post<Profile>('/profiles', data);
    return response.data;
  }

  async updateProfile(id: string, data: UpdateProfileDTO): Promise<Profile> {
    const response = await this.client.put<Profile>(`/profiles/${id}`, data);
    return response.data;
  }

  async deleteProfile(id: string): Promise<void> {
    await this.client.delete(`/profiles/${id}`);
  }

  async assignProfilePermissions(profileId: string, permissionIds: string[]): Promise<Profile> {
    const response = await this.client.post<Profile>(`/profiles/${profileId}/permissions`, { permissionIds });
    return response.data;
  }

  async removeProfilePermissions(profileId: string, permissionIds: string[]): Promise<Profile> {
    const response = await this.client.delete<Profile>(`/profiles/${profileId}/permissions`, { data: { permissionIds } });
    return response.data;
  }

  // Permissions
  async getPermissions(): Promise<Permission[]> {
    const response = await this.client.get<Permission[]>('/permissions');
    return response.data;
  }

  async getPermission(id: string): Promise<Permission> {
    const response = await this.client.get<Permission>(`/permissions/${id}`);
    return response.data;
  }

  async createPermission(data: CreatePermissionDTO): Promise<Permission> {
    const response = await this.client.post<Permission>('/permissions', data);
    return response.data;
  }

  async updatePermission(id: string, data: UpdatePermissionDTO): Promise<Permission> {
    const response = await this.client.put<Permission>(`/permissions/${id}`, data);
    return response.data;
  }

  async deletePermission(id: string): Promise<void> {
    await this.client.delete(`/permissions/${id}`);
  }

  // ============================================
  // SUPPLIERS
  // ============================================

  async getSuppliers(params?: { page?: number; limit?: number; search?: string; status?: string }): Promise<any> {
    const response = await this.client.get<any>('/suppliers', { params });
    return response.data;
  }

  async getSupplier(id: string): Promise<Supplier> {
    const response = await this.client.get<Supplier>(`/suppliers/${id}`);
    return response.data;
  }

  async createSupplier(data: CreateSupplierDTO): Promise<Supplier> {
    const response = await this.client.post<Supplier>('/suppliers', data);
    return response.data;
  }

  async updateSupplier(id: string, data: UpdateSupplierDTO): Promise<Supplier> {
    const response = await this.client.put<Supplier>(`/suppliers/${id}`, data);
    return response.data;
  }

  async deleteSupplier(id: string): Promise<void> {
    await this.client.delete(`/suppliers/${id}`);
  }

  // ============================================
  // UPLOAD
  // ============================================

  async uploadRutFile(file: File): Promise<{ filename: string; path: string }> {
    const formData = new FormData();
    formData.append('rutFile', file);
    const response = await this.client.post<{ filename: string; path: string }>('/upload/upload-rut', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  // ============================================
  // MATERIALS
  // ============================================

  async getMaterials(params?: { page?: number; limit?: number; search?: string; category?: string }): Promise<PaginatedResponse<Material>> {
    const response = await this.client.get<PaginatedResponse<Material>>('/materials', { params });
    return response.data;
  }

  async getMaterial(id: string): Promise<Material> {
    const response = await this.client.get<Material>(`/materials/${id}`);
    return response.data;
  }

  async createMaterial(data: CreateMaterialDTO): Promise<Material> {
    const response = await this.client.post<Material>('/materials', data);
    return response.data;
  }

  async updateMaterial(id: string, data: UpdateMaterialDTO): Promise<Material> {
    const response = await this.client.put<Material>(`/materials/${id}`, data);
    return response.data;
  }

  async deleteMaterial(id: string): Promise<void> {
    await this.client.delete(`/materials/${id}`);
  }

  // ============================================
  // DASHBOARD
  // ============================================

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await this.client.get<DashboardStats>('/dashboard/stats');
    return response.data;
  }

  async getContractsByProject(): Promise<any[]> {
    const response = await this.client.get<any[]>('/dashboard/contracts-by-project');
    return response.data;
  }

  async getWorkOrdersByProject(): Promise<any[]> {
    const response = await this.client.get<any[]>('/dashboard/workorders-by-project');
    return response.data;
  }

  // ============================================
  // SETTINGS
  // ============================================

  async getSettings(): Promise<any[]> {
    const response = await this.client.get<any[]>('/settings');
    return response.data;
  }

  async getSettingsByCategory(category: string): Promise<any> {
    const response = await this.client.get<any>(`/settings/category/${category}`);
    return Array.isArray(response.data) ? response.data : (response.data?.data || []);
  }

  async updateSetting(key: string, value: string, category?: string): Promise<any> {
    const response = await this.client.put<any>(`/settings/${key}`, { value, category });
    return response.data;
  }

  async initializeSettings(): Promise<any> {
    const response = await this.client.post<any>('/settings/initialize');
    return response.data;
  }

  async getEmailSettings(): Promise<any> {
    const response = await this.client.get<any>('/settings/email');
    return response.data;
  }

  async getValidationSettings(): Promise<any> {
    const response = await this.client.get<any>('/settings/validation');
    return response.data;
  }

  async getCompanySettings(): Promise<any> {
    const response = await this.client.get<any>('/settings/company');
    return response.data;
  }

  async testEmailConnection(): Promise<any> {
    const response = await this.client.post<any>('/settings/test-email');
    return response.data;
  }

  async saveEmailSettings(data: { host: string; port: number; secure: boolean; user: string; password?: string; from?: string }): Promise<{ success: boolean; message: string }> {
    const response = await this.client.put('/settings/email', data);
    return response.data;
  }

  async testEmail(to: string): Promise<{ success: boolean; message: string; messageId?: string }> {
    const response = await this.client.post('/settings/test-email', { to });
    return response.data;
  }

  async saveCompanySettings(data: { name?: string; rut?: string; address?: string; phone?: string; email?: string }): Promise<{ success: boolean; message: string }> {
    const response = await this.client.put('/settings/company', data);
    return response.data;
  }

  // ============================================
  // PROJECTS
  // ============================================

  async getProjects(params?: { status?: string }): Promise<any> {
    const response = await this.client.get<any>('/projects', { params });
    return response.data;
  }

  async getProject(id: string): Promise<any> {
    const response = await this.client.get<any>(`/projects/${id}`);
    return response.data;
  }

  async createProject(data: any): Promise<any> {
    const response = await this.client.post<any>('/projects', data);
    return response.data;
  }

  async updateProject(id: string, data: any): Promise<any> {
    const response = await this.client.put<any>(`/projects/${id}`, data);
    return response.data;
  }

  async deleteProject(id: string): Promise<void> {
    await this.client.delete(`/projects/${id}`);
  }

  async updateProjectStatus(id: string, data: { status: string }): Promise<any> {
    const response = await this.client.patch<any>(`/projects/${id}/status`, data);
    return response.data;
  }

  // ============================================
  // WORK ORDERS - Órdenes de Trabajo
  // ============================================

  async getWorkOrders(): Promise<WorkOrder[]> {
    const response = await this.client.get<WorkOrder[]>('/work-orders');
    return response.data;
  }

  async getWorkOrder(id: string): Promise<WorkOrder> {
    const response = await this.client.get<WorkOrder>(`/work-orders/${id}`);
    return response.data;
  }

  async createWorkOrder(data: CreateWorkOrderDTO): Promise<WorkOrder> {
    const response = await this.client.post<WorkOrder>('/work-orders', data);
    return response.data;
  }

  async updateWorkOrder(id: string, data: Partial<CreateWorkOrderDTO>): Promise<WorkOrder> {
    const response = await this.client.put<WorkOrder>(`/work-orders/${id}`, data);
    return response.data;
  }

  async deleteWorkOrder(id: string): Promise<void> {
    await this.client.delete(`/work-orders/${id}`);
  }

  async updateWorkOrderStatus(id: string, status: string): Promise<WorkOrder> {
    const response = await this.client.patch<WorkOrder>(`/work-orders/${id}/status`, { status });
    return response.data;
  }

  // ============================================
  // CONTRACTS - Contratos
  // ============================================

  async getContracts(filters?: { status?: string; supplierId?: string; workOrderId?: string }): Promise<Contract[]> {
    const params = filters ? new URLSearchParams(filters as any).toString() : '';
    const url = params ? `/contracts?${params}` : '/contracts';
    const response = await this.client.get<Contract[]>(url);
    return response.data;
  }

  async getContract(id: string): Promise<Contract> {
    const response = await this.client.get<Contract>(`/contracts/${id}`);
    return response.data;
  }

  async createContract(data: CreateContractDTO): Promise<Contract> {
    const response = await this.client.post<Contract>('/contracts', data);
    return response.data;
  }

  async updateContract(id: string, data: Partial<CreateContractDTO>): Promise<Contract> {
    const response = await this.client.put<Contract>(`/contracts/${id}`, data);
    return response.data;
  }

  async deleteContract(id: string): Promise<void> {
    await this.client.delete(`/contracts/${id}`);
  }

  async updateContractStatus(id: string, status: string): Promise<Contract> {
    const response = await this.client.patch<Contract>(`/contracts/${id}/status`, { status });
    return response.data;
  }

  // ============================================
  // NOTIFICATIONS - Notificaciones
  // ============================================

  async getNotificationPreview(days: number = 7): Promise<any> {
    const response = await this.client.get<any>(`/notifications/preview?days=${days}`);
    return response.data;
  }

  async sendExpiryReminders(): Promise<any> {
    const response = await this.client.post<any>('/notifications/send-expiry-reminders');
    return response.data;
  }

  async getNotificationStatus(): Promise<any> {
    const response = await this.client.get<any>('/notifications/status');
    return response.data;
  }

}

export const api = new ApiClient();
export default api;
