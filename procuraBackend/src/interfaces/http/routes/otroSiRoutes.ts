import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ContractOtroSiRepository } from '../../../infrastructure/repositories/otroSiRepository';
import { authenticate, authorize } from '../../../shared/middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const otroSiRepo = new ContractOtroSiRepository(prisma);

export const otroSiController = {
  // GET /otroSi/contract/:contractId - Listar todos los otroSi de un contrato
  getByContractId: async (req: Request, res: Response) => {
    try {
      const { contractId } = req.params;
      const otroSis = await otroSiRepo.findByContractId(contractId);
      res.json(otroSis);
    } catch (error: any) {
      console.error('Error fetching otroSis:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // GET /otroSi/:id - Obtener un otroSi por ID
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const otroSi = await otroSiRepo.findById(id);
      if (!otroSi) {
        return res.status(404).json({ error: 'OtroSi no encontrado' });
      }
      res.json(otroSi);
    } catch (error: any) {
      console.error('Error fetching otroSi:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // POST /otroSi - Crear nuevo otroSi
  create: async (req: Request, res: Response) => {
    try {
      const { contractId, numero, endDate, value } = req.body;
      
      if (!contractId || !numero) {
        return res.status(400).json({ error: 'contractId y numero son requeridos' });
      }

      // Validar que no exista otroSi con el mismo número
      const existing = await prisma.contractOtroSi.findUnique({
        where: { contractId_numero: { contractId, numero } }
      });
      
      if (existing) {
        return res.status(400).json({ error: `Ya existe otroSí #${numero} para este contrato` });
      }

      const otroSi = await otroSiRepo.create({ contractId, numero, endDate, value });
      res.status(201).json(otroSi);
    } catch (error: any) {
      console.error('Error creating otroSi:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // PUT /otroSi/:id - Actualizar otroSi
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { numero, endDate, value } = req.body;

      const otroSi = await otroSiRepo.update(id, { numero, endDate, value });
      res.json(otroSi);
    } catch (error: any) {
      console.error('Error updating otroSi:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // DELETE /otroSi/:id - Eliminar otroSi
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await otroSiRepo.delete(id);
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting otroSi:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

// Rutas
router.get('/contract/:contractId', authenticate, otroSiController.getByContractId);
router.get('/:id', authenticate, otroSiController.getById);
router.post('/', authenticate, authorize('ADMIN', 'PURCHASE_MANAGER', 'PURCHASE_AGENT'), otroSiController.create);
router.put('/:id', authenticate, authorize('ADMIN', 'PURCHASE_MANAGER', 'PURCHASE_AGENT'), otroSiController.update);
router.delete('/:id', authenticate, authorize('ADMIN', 'PURCHASE_MANAGER'), otroSiController.delete);

export default router;