import { ProjectRepository, CreateProjectDTO, UpdateProjectDTO, Project } from '../infrastructure/repositories/projectRepository';

export class ProjectUseCases {
  private repository: ProjectRepository;

  constructor(repository: ProjectRepository) {
    this.repository = repository;
  }

  async getAll() {
    return this.repository.findAll();
  }

  async getById(id: string) {
    const project = await this.repository.findById(id);
    if (!project) {
      throw new Error('Proyecto no encontrado');
    }
    return project;
  }

  async getByStatus(status: string) {
    return this.repository.findByStatus(status);
  }

  async create(data: CreateProjectDTO) {
    // Validar código único
    const existing = await this.repository.findByCode(data.code);
    if (existing) {
      throw new Error('Ya existe un proyecto con este código');
    }

    return this.repository.create(data);
  }

  async update(id: string, data: UpdateProjectDTO) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Proyecto no encontrado');
    }

    return this.repository.update(id, data);
  }

  async delete(id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Proyecto no encontrado');
    }

    return this.repository.delete(id);
  }

  async updateStatus(id: string, status: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Proyecto no encontrado');
    }

    return this.repository.updateStatus(id, status);
  }

  async generateCode(): Promise<string> {
    const last = await this.repository.findLast();
    const year = new Date().getFullYear();
    
    if (!last) {
      return `PRY-${year}-0001`;
    }

    const lastCode = last.code;
    const lastNumber = parseInt(lastCode.split('-')[2] || '0');
    const newNumber = lastNumber + 1;
    
    return `PRY-${year}-${newNumber.toString().padStart(4, '0')}`;
  }
}