import { Request, Response } from 'express';
import { WorkOrderUseCases } from '../../../application/workOrderUseCases';
import { WorkOrderRepository } from '../../../infrastructure/repositories/workOrderRepository';
import prisma from '../../../infrastructure/prisma/client';

const repository = new WorkOrderRepository(prisma);
const useCases = new WorkOrderUseCases(repository);

export class WorkOrderController {
  async getAll(req: Request, res: Response) {
    try {
      const workOrders = await useCases.getAll();
      const formatted = workOrders.map((wo: any) => ({
        ...wo,
        supplierName: wo.supplier?.name,
        projectName: wo.project?.name
      }));
      res.json(formatted);
    } catch (error) {
      console.error('Error fetching work orders:', error);
      res.status(500).json({ error: 'Error al obtener órdenes de trabajo' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const workOrder = await useCases.getById(req.params.id);
      if (!workOrder) {
        return res.status(404).json({ error: 'Orden de trabajo no encontrada' });
      }
      res.json({
        ...workOrder,
        supplierName: (workOrder as any).supplier?.name,
        projectName: (workOrder as any).project?.name
      });
    } catch (error) {
      console.error('Error fetching work order:', error);
      res.status(500).json({ error: 'Error al obtener orden de trabajo' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      // Get userId from JWT token
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }
      
      const workOrderData = {
        ...req.body,
        createdById: userId
      };
      
      const workOrder = await useCases.create(workOrderData);
      res.status(201).json({
        ...workOrder,
        supplierName: (workOrder as any).supplier?.name,
        projectName: (workOrder as any).project?.name
      });
    } catch (error) {
      console.error('Error creating work order:', error);
      res.status(500).json({ error: 'Error al crear orden de trabajo' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const workOrder = await useCases.update(req.params.id, req.body);
      res.json({
        ...workOrder,
        supplierName: (workOrder as any).supplier?.name,
        projectName: (workOrder as any).project?.name
      });
    } catch (error) {
      console.error('Error updating work order:', error);
      res.status(500).json({ error: 'Error al actualizar orden de trabajo' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await useCases.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting work order:', error);
      res.status(500).json({ error: 'Error al eliminar orden de trabajo' });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const { status } = req.body;
      const workOrder = await useCases.updateStatus(req.params.id, status);
      res.json({
        ...workOrder,
        supplierName: (workOrder as any).supplier?.name
      });
    } catch (error) {
      console.error('Error updating work order status:', error);
      res.status(500).json({ error: 'Error al actualizar estado' });
    }
  }
}

export default new WorkOrderController();
