import prisma from '../prisma/client';
import { Project, CreateProjectDTO, UpdateProjectDTO } from '../../domain/project/projectEntity';

export { Project, CreateProjectDTO, UpdateProjectDTO };

export class ProjectRepository {
  async findAll(): Promise<Project[]> {
    return prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
    }) as Promise<Project[]>;
  }

  async findById(id: string): Promise<Project | null> {
    return prisma.project.findUnique({
      where: { id },
    }) as Promise<Project | null>;
  }

  async findByCode(code: string): Promise<Project | null> {
    return prisma.project.findUnique({
      where: { code },
    }) as Promise<Project | null>;
  }

  async findByStatus(status: string): Promise<Project[]> {
    return prisma.project.findMany({
      where: { status: status as any },
      orderBy: { name: 'asc' },
    }) as Promise<Project[]>;
  }

  async create(data: CreateProjectDTO): Promise<Project> {
    return prisma.project.create({
      data: {
        ...data,
        status: (data.status as any) || 'PLANNING',
      },
    }) as Promise<Project>;
  }

  async update(id: string, data: UpdateProjectDTO): Promise<Project> {
    const updateData: any = { ...data };
    
    // Remove immutable fields that should not be updated
    delete updateData.code;
    delete updateData.createdAt;
    
    if (data.status) {
      updateData.status = data.status as any;
    }
    
    return prisma.project.update({
      where: { id },
      data: updateData,
    }) as Promise<Project>;
  }

  async delete(id: string): Promise<void> {
    await prisma.project.delete({
      where: { id },
    });
  }

  async updateStatus(id: string, status: string): Promise<Project> {
    return prisma.project.update({
      where: { id },
      data: { status: status as any },
    }) as Promise<Project>;
  }

  async findLast(): Promise<Project | null> {
    const last = await prisma.project.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    return last as Project | null;
  }

  async findLastCe(): Promise<Project | null> {
    const all = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
    });
    // Buscar el último con código CE-
    const lastCe = all.find(p => p.code.startsWith('CE-'));
    if (!lastCe) return null;
    
    // Convertir nulls a undefined para cumplir el tipo
    return {
      ...lastCe,
      description: lastCe.description || undefined,
      address: lastCe.address || undefined,
      city: lastCe.city || undefined,
      region: lastCe.region || undefined,
      clientName: lastCe.clientName || undefined,
      clientRut: lastCe.clientRut || undefined,
      startDate: lastCe.startDate || undefined,
      endDate: lastCe.endDate || undefined,
      deadline: lastCe.deadline || undefined,
      budget: lastCe.budget || undefined,
      actualCost: lastCe.actualCost || undefined,
      contactName: lastCe.contactName || undefined,
      contactPhone: lastCe.contactPhone || undefined,
      contactEmail: lastCe.contactEmail || undefined,
      notes: lastCe.notes || undefined,
    } as Project;
  }
}
