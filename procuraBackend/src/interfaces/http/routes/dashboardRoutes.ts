import { Router } from 'express';
import { authenticate } from '../../../shared/middleware/auth';
import prisma from '../../../infrastructure/prisma/client';

const router = Router();

router.get('/stats', authenticate, async (req, res) => {
  try {
    const [
      totalSuppliers,
      activeSuppliers,
      totalMaterials,
      totalWorkOrders,
      activeWorkOrders,
      totalProjects,
      activeProjects,
      totalContracts,
      activeContracts,
    ] = await Promise.all([
      prisma.supplier.count(),
      prisma.supplier.count({ where: { status: 'ACTIVE' } }),
      prisma.material.count(),
      prisma.workOrder.count(),
      prisma.workOrder.count({ where: { status: { in: ['APPROVED', 'IN_PROGRESS'] } } }),
      prisma.project.count(),
      prisma.project.count({ where: { status: 'ACTIVE' } }),
      prisma.contract.count(),
      prisma.contract.count({ where: { status: 'ACTIVE' } }),
    ]);

    res.json({
      totalMaterials,
      totalSuppliers,
      activeSuppliers,
      totalWorkOrders,
      activeWorkOrders,
      totalProjects,
      activeProjects,
      totalContracts,
      activeContracts,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

export default router;
