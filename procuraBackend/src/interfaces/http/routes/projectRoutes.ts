import { Request, Response } from 'express';
import { ProjectUseCases } from '../../../application/projectUseCases';
import { ProjectRepository } from '../../../infrastructure/repositories/projectRepository';

const repository = new ProjectRepository();
const useCases = new ProjectUseCases(repository);

export class ProjectController {
  async getAll(req: Request, res: Response) {
    try {
      const { status } = req.query;
      let projects;
      
      if (status) {
        projects = await useCases.getByStatus(status as string);
      } else {
        projects = await useCases.getAll();
      }
      
      res.json({
        data: projects,
        total: projects.length,
        page: 1,
        limit: 10,
        totalPages: Math.ceil(projects.length / 10)
      });
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ error: 'Error al obtener proyectos' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const project = await useCases.getById(req.params.id);
      res.json(project);
    } catch (error: any) {
      console.error('Error fetching project:', error);
      res.status(404).json({ error: error.message || 'Proyecto no encontrado' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const code = await useCases.generateCode();
      const project = await useCases.create({ ...req.body, code });
      res.status(201).json(project);
    } catch (error: any) {
      console.error('Error creating project:', error);
      res.status(400).json({ error: error.message || 'Error al crear proyecto' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const project = await useCases.update(req.params.id, req.body);
      res.json(project);
    } catch (error: any) {
      console.error('Error updating project:', error);
      res.status(404).json({ error: error.message || 'Proyecto no encontrado' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await useCases.delete(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting project:', error);
      res.status(404).json({ error: error.message || 'Proyecto no encontrado' });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const { status } = req.body;
      const project = await useCases.updateStatus(req.params.id, status);
      res.json(project);
    } catch (error: any) {
      console.error('Error updating project status:', error);
      res.status(404).json({ error: error.message || 'Proyecto no encontrado' });
    }
  }
}

export default new ProjectController();
