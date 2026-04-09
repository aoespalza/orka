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

// Contratos activos por proyecto
router.get('/contracts-by-project', authenticate, async (req, res) => {
  try {
    // Obtener todos los contratos activos con sus relaciones
    const contracts = await prisma.contract.findMany({
      where: { status: 'ACTIVE' },
      include: {
        supplier: true,
        project: true,
        workOrder: {
          include: {
            project: true
          }
        }
      }
    });

    // Obtener todos los proyectos activos
    const projects = await prisma.project.findMany({
      where: { status: 'ACTIVE' }
    });

    // Crear mapa de proyectos con sus contratos
    const projectMap = new Map();

    // Inicializar con todos los proyectos activos
    projects.forEach(project => {
      projectMap.set(project.id, {
        projectId: project.id,
        projectName: project.name,
        contractCount: 0,
        totalValue: 0,
        contracts: [] as any[]
      });
    });

    // Agregar contratos a sus proyectos (relación directa o por workOrder)
    contracts.forEach(contract => {
      // Priorizar relación directa con proyecto
      const project = contract.project || contract.workOrder?.project;
      const projectId = project?.id || 'sin-proyecto';
      const projectName = project?.name || 'Sin Proyecto';

      if (!projectMap.has(projectId)) {
        projectMap.set(projectId, {
          projectId,
          projectName,
          contractCount: 0,
          totalValue: 0,
          contracts: [] as any[]
        });
      }

      const entry = projectMap.get(projectId);
      entry.contractCount += 1;
      entry.totalValue += contract.finalValue || contract.value || 0;
      entry.contracts.push({
        code: contract.code,
        supplierName: contract.supplier?.name || '-',
        value: contract.finalValue || contract.value || 0
      });
    });

    // Convertir a array y ordenar por número de contratos (desc)
    const result = Array.from(projectMap.values())
      .filter((p: any) => p.contractCount > 0)
      .sort((a: any, b: any) => b.contractCount - a.contractCount);

    res.json(result);
  } catch (error) {
    console.error('Contracts by project error:', error);
    res.status(500).json({ error: 'Error al obtener contratos por proyecto' });
  }
});

// Órdenes de trabajo activas por proyecto
router.get('/workorders-by-project', authenticate, async (req, res) => {
  try {
    // Obtener todas las órdenes de trabajo activas con sus relaciones
    const workOrders = await prisma.workOrder.findMany({
      where: { status: { in: ['APPROVED', 'IN_PROGRESS'] } },
      include: {
        supplier: true,
        project: true
      }
    });

    // Obtener todos los proyectos activos
    const projects = await prisma.project.findMany({
      where: { status: 'ACTIVE' }
    });

    // Crear mapa de proyectos con sus órdenes de trabajo
    const projectMap = new Map();

    // Inicializar con todos los proyectos activos
    projects.forEach(project => {
      projectMap.set(project.id, {
        projectId: project.id,
        projectName: project.name,
        workOrderCount: 0,
        totalValue: 0,
        workOrders: [] as any[]
      });
    });

    // Agregar órdenes de trabajo a sus proyectos
    workOrders.forEach(wo => {
      const project = wo.project;
      const projectId = project?.id || 'sin-proyecto';
      const projectName = project?.name || 'Sin Proyecto';

      if (!projectMap.has(projectId)) {
        projectMap.set(projectId, {
          projectId,
          projectName,
          workOrderCount: 0,
          totalValue: 0,
          workOrders: [] as any[]
        });
      }

      const entry = projectMap.get(projectId);
      entry.workOrderCount += 1;
      entry.totalValue += wo.totalValue || 0;
      entry.workOrders.push({
        code: wo.code,
        title: wo.title,
        supplierName: wo.supplier?.name || '-',
        value: wo.totalValue || 0,
        status: wo.status
      });
    });

    // Convertir a array y ordenar por número de órdenes (desc)
    const result = Array.from(projectMap.values())
      .filter((p: any) => p.workOrderCount > 0)
      .sort((a: any, b: any) => b.workOrderCount - a.workOrderCount);

    res.json(result);
  } catch (error) {
    console.error('WorkOrders by project error:', error);
    res.status(500).json({ error: 'Error al obtener órdenes de trabajo por proyecto' });
  }
});

export default router;
