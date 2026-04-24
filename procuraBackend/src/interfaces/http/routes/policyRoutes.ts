import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../../../shared/middleware/auth';

// Import dinámico para evitar problemas de resolución
const { PolicyUseCases } = require('../../../application/policyUseCases');
const { PolicyRepository } = require('../../../infrastructure/repositories/policyRepository');

const router = Router();
const prisma = new PrismaClient();
const repository = new PolicyRepository(prisma);
const useCases = new PolicyUseCases(repository);

// GET /api/policies - Obtener todas las pólizas
const getAll = async (req: Request, res: Response) => {
  try {
    const policies = await useCases.getAll();
    res.json(policies);
  } catch (error) {
    console.error('Error fetching policies:', error);
    res.status(500).json({ error: 'Failed to fetch policies' });
  }
};

// GET /api/policies/contract/:contractId - Obtener pólizas de un contrato
const getByContractId = async (req: Request, res: Response) => {
  try {
    const policies = await useCases.getByContractId(req.params.contractId);
    res.json(policies);
  } catch (error) {
    console.error('Error fetching policies by contract:', error);
    res.status(500).json({ error: 'Failed to fetch policies' });
  }
};

// GET /api/policies/:id - Obtener una póliza por ID
const getById = async (req: Request, res: Response) => {
  try {
    const policy = await useCases.getById(req.params.id);
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }
    res.json(policy);
  } catch (error) {
    console.error('Error fetching policy:', error);
    res.status(500).json({ error: 'Failed to fetch policy' });
  }
};

// POST /api/policies - Crear una nueva póliza
const create = async (req: Request, res: Response) => {
  try {
    const policy = await useCases.create(req.body);
    res.status(201).json(policy);
  } catch (error) {
    console.error('Error creating policy:', error);
    res.status(500).json({ error: 'Failed to create policy' });
  }
};

// PUT /api/policies/:id - Actualizar una póliza
const update = async (req: Request, res: Response) => {
  try {
    const policy = await useCases.update(req.params.id, req.body);
    res.json(policy);
  } catch (error) {
    console.error('Error updating policy:', error);
    res.status(500).json({ error: 'Failed to update policy' });
  }
};

// DELETE /api/policies/:id - Eliminar una póliza
const deletePolicy = async (req: Request, res: Response) => {
  try {
    await useCases.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting policy:', error);
    res.status(500).json({ error: 'Failed to delete policy' });
  }
};

router.get('/', authenticate, getAll);
router.get('/contract/:contractId', authenticate, getByContractId);
router.get('/:id', authenticate, getById);
router.post('/', authenticate, authorize('ADMIN', 'PURCHASE_MANAGER', 'PURCHASE_AGENT'), create);
router.put('/:id', authenticate, authorize('ADMIN', 'PURCHASE_MANAGER', 'PURCHASE_AGENT'), update);
router.delete('/:id', authenticate, authorize('ADMIN', 'PURCHASE_MANAGER'), deletePolicy);

export default {
  getAll,
  getByContractId,
  getById,
  create,
  update,
  delete: deletePolicy
};