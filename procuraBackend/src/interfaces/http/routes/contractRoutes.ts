import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../../../shared/middleware/auth';

// Import dinámico para evitar problemas de resolución
const { ContractUseCases } = require('../../../application/contractUseCases');
const { ContractRepository } = require('../../../infrastructure/repositories/contractRepository');

const router = Router();
const prisma = new PrismaClient();
const repository = new ContractRepository(prisma);
const useCases = new ContractUseCases(repository);

// GET /api/contracts - Obtener todos los contratos
const getAll = async (req: Request, res: Response) => {
  try {
    const { status, supplierId, workOrderId } = req.query;
    const filters: any = {};
    
    if (status) filters.status = status;
    if (supplierId) filters.supplierId = supplierId;
    if (workOrderId) filters.workOrderId = workOrderId;

    const contracts = await useCases.getAll(Object.keys(filters).length > 0 ? filters : undefined);
    res.json(contracts);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
};

// GET /api/contracts/:id - Obtener un contrato por ID
const getById = async (req: Request, res: Response) => {
  try {
    const contract = await useCases.getById(req.params.id);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    res.json(contract);
  } catch (error) {
    console.error('Error fetching contract:', error);
    res.status(500).json({ error: 'Failed to fetch contract' });
  }
};

// POST /api/contracts - Crear un nuevo contrato
const create = async (req: Request, res: Response) => {
  try {
    const contract = await useCases.create(req.body);
    res.status(201).json(contract);
  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({ error: 'Failed to create contract' });
  }
};

// PUT /api/contracts/:id - Actualizar un contrato
const update = async (req: Request, res: Response) => {
  try {
    const contract = await useCases.update(req.params.id, req.body);
    res.json(contract);
  } catch (error) {
    console.error('Error updating contract:', error);
    res.status(500).json({ error: 'Failed to update contract' });
  }
};

// DELETE /api/contracts/:id - Eliminar un contrato
const deleteContract = async (req: Request, res: Response) => {
  try {
    await useCases.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting contract:', error);
    res.status(500).json({ error: 'Failed to delete contract' });
  }
};

// PATCH /api/contracts/:id/status - Actualizar estado
const updateStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const contract = await useCases.update(req.params.id, { status });
    res.json(contract);
  } catch (error) {
    console.error('Error updating contract status:', error);
    res.status(500).json({ error: 'Failed to update contract status' });
  }
};

router.get('/', authenticate, getAll);
router.get('/:id', authenticate, getById);
router.post('/', authenticate, authorize('ADMIN', 'PURCHASE_MANAGER', 'PURCHASE_AGENT'), create);
router.put('/:id', authenticate, authorize('ADMIN', 'PURCHASE_MANAGER', 'PURCHASE_AGENT'), update);
router.delete('/:id', authenticate, authorize('ADMIN', 'PURCHASE_MANAGER'), deleteContract);
router.patch('/:id/status', authenticate, authorize('ADMIN', 'PURCHASE_MANAGER'), updateStatus);

export default {
  getAll,
  getById,
  create,
  update,
  delete: deleteContract,
  updateStatus
};
