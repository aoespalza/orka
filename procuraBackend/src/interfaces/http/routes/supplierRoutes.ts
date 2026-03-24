import { Request, Response } from 'express';
import { supplierUseCases } from '../../../application/supplier/supplierUseCases';
import { CreateSupplierDTO, UpdateSupplierDTO } from '../../../domain/supplier';

export class SupplierController {
  async getAll(req: Request, res: Response) {
    try {
      const { status, page = '1', limit = '10', search = '' } = req.query;
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      
      let suppliers;
      if (status) {
        suppliers = await supplierUseCases.getSuppliersByStatus(status as string);
      } else {
        suppliers = await supplierUseCases.getAllSuppliers();
      }

      // Filter by search if provided
      if (search) {
        const searchLower = (search as string).toLowerCase();
        suppliers = suppliers.filter((s: any) => 
          s.name?.toLowerCase().includes(searchLower) || 
          s.code?.toLowerCase().includes(searchLower)
        );
      }

      const total = suppliers.length;
      const totalPages = Math.ceil(total / limitNum);
      const startIndex = (pageNum - 1) * limitNum;
      const paginatedData = suppliers.slice(startIndex, startIndex + limitNum);

      res.json({
        data: paginatedData,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const supplier = await supplierUseCases.getSupplierById(req.params.id);
      if (!supplier) {
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }
      res.json(supplier);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = req.body as CreateSupplierDTO;
      
      // Generate automatic code if not provided
      if (!data.code) {
        const lastSupplier = await supplierUseCases.getLastSupplier();
        const nextNumber = lastSupplier ? parseInt(lastSupplier.code.replace('PROV-', '')) + 1 : 1;
        data.code = `PROV-${String(nextNumber).padStart(4, '0')}`;
      }
      
      const supplier = await supplierUseCases.createSupplier(data);
      res.status(201).json(supplier);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const data = req.body as UpdateSupplierDTO;
      const supplier = await supplierUseCases.updateSupplier(req.params.id, data);
      res.json(supplier);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await supplierUseCases.deleteSupplier(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const { status } = req.body;
      const supplier = await supplierUseCases.updateSupplierStatus(req.params.id, status);
      res.json(supplier);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const supplierController = new SupplierController();
