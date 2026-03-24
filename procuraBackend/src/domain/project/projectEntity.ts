export interface Project {
  id: string;
  code: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  region?: string;
  clientName?: string;
  clientRut?: string;
  startDate?: Date;
  endDate?: Date;
  deadline?: Date;
  status: string;
  budget?: number;
  actualCost?: number;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectDTO {
  code: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  region?: string;
  clientName?: string;
  clientRut?: string;
  startDate?: Date;
  endDate?: Date;
  deadline?: Date;
  status?: string;
  budget?: number;
  actualCost?: number;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
}

export interface UpdateProjectDTO {
  name?: string;
  description?: string;
  address?: string;
  city?: string;
  region?: string;
  clientName?: string;
  clientRut?: string;
  startDate?: Date;
  endDate?: Date;
  deadline?: Date;
  status?: string;
  budget?: number;
  actualCost?: number;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
}
