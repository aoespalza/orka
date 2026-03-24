import { PrismaClient, WorkOrder, WorkOrderItem } from '@prisma/client';
import { 
  CreateWorkOrderDTO, 
  UpdateWorkOrderDTO,
  WorkOrderItem as WorkOrderItemEntity
} from '../../domain/workOrder/workOrderEntity';

export class WorkOrderRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(): Promise<WorkOrder[]> {
    return this.prisma.workOrder.findMany({
      include: { supplier: true, items: true, project: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findById(id: string): Promise<WorkOrder | null> {
    return this.prisma.workOrder.findUnique({
      where: { id },
      include: { supplier: true, items: true, project: true }
    });
  }

  async getLastWorkOrder(): Promise<WorkOrder | null> {
    return this.prisma.workOrder.findFirst({
      orderBy: { code: 'desc' }
    });
  }

  async getLastWorkOrderByProject(projectId: string | null): Promise<WorkOrder | null> {
    return this.prisma.workOrder.findFirst({
      where: { projectId },
      orderBy: { code: 'desc' }
    });
  }

  async generateCode(projectId: string | null): Promise<string> {
    if (projectId) {
      // Obtener el proyecto para usar su código
      const project = await this.prisma.project.findUnique({ where: { id: projectId } });
      if (project) {
        // Buscar la última orden de trabajo de este proyecto
        const last = await this.getLastWorkOrderByProject(projectId);
        const projectCode = project.code || 'PROY';
        if (last) {
          // Extraer el número secuencial del código existente
          const parts = last.code.split('-');
          const lastSeq = parseInt(parts[parts.length - 1]);
          const nextSeq = lastSeq + 1;
          return `${projectCode}-${nextSeq.toString().padStart(4, '0')}`;
        }
        return `${projectCode}-0001`;
      }
    }
    
    // Si no tiene proyecto, usar código global OT-
    const last = await this.getLastWorkOrder();
    const nextNumber = last ? parseInt(last.code.replace('OT-', '')) + 1 : 1;
    return `OT-${nextNumber.toString().padStart(4, '0')}`;
  }

  async create(data: CreateWorkOrderDTO): Promise<WorkOrder> {
    const code = await this.generateCode(data.projectId || null);
    
    // Calcular subtotal, AIU, IVA y total
    let subtotal = 0;
    let iva = 0;
    
    if (data.items && data.items.length > 0) {
      data.items.forEach((item: any) => {
        const itemSubtotal = item.quantity * item.unitPrice;
        
        // Calcular AIU por ítem (normativa colombiana construcción civil)
        let aiuTotal = 0;
        if (item.applyAiu) {
          const aiuPercentage = (item.aiuAdministration || 0) + (item.aiuImprevistos || 0) + (item.aiuUtilidad || 0);
          aiuTotal = itemSubtotal * (aiuPercentage / 100);
        }
        
        // El subtotal incluye el AIU
        subtotal += itemSubtotal + aiuTotal;
        
        // IVA se calcula sobre el costo directo (sin AIU)
        if (item.iva) {
          iva += itemSubtotal * 0.19;
        }
      });
    }
    
    const totalValue = subtotal + iva;

    return this.prisma.workOrder.create({
      data: {
        code,
        createdById: data.createdById,
        supplierId: data.supplierId,
        title: data.title,
        description: data.description,
        projectId: data.projectId || null,
        startDate: data.startDate,
        endDate: data.endDate,
        executionDays: data.executionDays,
        subtotal,
        iva,
        totalValue,
        paymentType: data.paymentType || 'FIJO',
        paymentTerms: data.paymentTerms,
        status: data.status || 'DRAFT',
        observations: data.observations,
        items: data.items ? {
          create: data.items.map((item: any) => {
            const itemSubtotal = item.quantity * item.unitPrice;
            
            // Calcular AIU por ítem
            let aiuTotal = 0;
            if (item.applyAiu) {
              const aiuPercentage = (item.aiuAdministration || 0) + (item.aiuImprevistos || 0) + (item.aiuUtilidad || 0);
              aiuTotal = itemSubtotal * (aiuPercentage / 100);
            }
            
            return {
              materialId: item.materialId || null,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              iva: item.iva || false,
              totalPrice: itemSubtotal + aiuTotal,
              observations: item.observations,
              // Campos AIU
              applyAiu: item.applyAiu || false,
              aiuAdministration: item.aiuAdministration || 0,
              aiuImprevistos: item.aiuImprevistos || 0,
              aiuUtilidad: item.aiuUtilidad || 0,
              aiuTotal: aiuTotal
            };
          })
        } : undefined
      },
      include: { supplier: true, items: true, project: true }
    });
  }

  async update(id: string, data: UpdateWorkOrderDTO): Promise<WorkOrder> {
    // Calcular subtotal, AIU, IVA y total si hay items
    let subtotal = 0;
    let iva = 0;
    let totalValue = 0;
    
    if (data.items) {
      data.items.forEach((item: any) => {
        const itemSubtotal = item.quantity * item.unitPrice;
        
        // Calcular AIU por ítem (normativa colombiana construcción civil)
        let aiuTotal = 0;
        if (item.applyAiu) {
          const aiuPercentage = (item.aiuAdministration || 0) + (item.aiuImprevistos || 0) + (item.aiuUtilidad || 0);
          aiuTotal = itemSubtotal * (aiuPercentage / 100);
        }
        
        subtotal += itemSubtotal + aiuTotal;
        
        // IVA se calcula sobre el costo directo (sin AIU)
        if (item.iva) {
          iva += itemSubtotal * 0.19;
        }
      });
      totalValue = subtotal + iva;
    }

    // Si hay items, eliminar los existentes y crear nuevos
    if (data.items) {
      await this.prisma.workOrderItem.deleteMany({ where: { workOrderId: id } });
    }

    return this.prisma.workOrder.update({
      where: { id },
      data: {
        ...(data.supplierId && { supplierId: data.supplierId }),
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.projectId !== undefined && { projectId: data.projectId || null }),
        ...(data.startDate !== undefined && { startDate: data.startDate }),
        ...(data.endDate !== undefined && { endDate: data.endDate }),
        ...(data.executionDays !== undefined && { executionDays: data.executionDays }),
        ...(subtotal !== undefined && { subtotal }),
        ...(iva !== undefined && { iva }),
        ...(totalValue !== undefined && { totalValue }),
        ...(data.paymentType && { paymentType: data.paymentType }),
        ...(data.paymentTerms !== undefined && { paymentTerms: data.paymentTerms }),
        ...(data.status && { status: data.status }),
        ...(data.observations !== undefined && { observations: data.observations }),
        ...(data.items && {
          items: {
            create: data.items.map((item: any) => {
              const itemSubtotal = item.quantity * item.unitPrice;
              
              // Calcular AIU por ítem
              let aiuTotal = 0;
              if (item.applyAiu) {
                const aiuPercentage = (item.aiuAdministration || 0) + (item.aiuImprevistos || 0) + (item.aiuUtilidad || 0);
                aiuTotal = itemSubtotal * (aiuPercentage / 100);
              }
              
              return {
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                unitPrice: item.unitPrice,
                iva: item.iva || false,
                totalPrice: itemSubtotal + aiuTotal,
                observations: item.observations,
                // Campos AIU
                applyAiu: item.applyAiu || false,
                aiuAdministration: item.aiuAdministration || 0,
                aiuImprevistos: item.aiuImprevistos || 0,
                aiuUtilidad: item.aiuUtilidad || 0,
                aiuTotal: aiuTotal
              };
            })
          }
        })
      },
      include: { supplier: true, items: true, project: true }
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.workOrder.delete({ where: { id } });
  }

  async updateStatus(id: string, status: string): Promise<WorkOrder> {
    return this.prisma.workOrder.update({
      where: { id },
      data: { status: status as any },
      include: { supplier: true, items: true, project: true }
    });
  }
}
