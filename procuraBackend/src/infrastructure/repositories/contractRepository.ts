import { PrismaClient, Contract, ContractItem } from '@prisma/client';
import { 
  CreateContractDTO, 
  UpdateContractDTO,
  ContractFilters,
  ContractItem as ContractItemEntity
} from '../../domain/contract/contractEntity';

export class ContractRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(filters?: ContractFilters): Promise<any[]> {
    const where: any = {};
    
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.supplierId) {
      where.supplierId = filters.supplierId;
    }
    if (filters?.workOrderId) {
      where.workOrderId = filters.workOrderId;
    }
    if (filters?.projectId) {
      where.projectId = filters.projectId;
    }

    const contracts = await this.prisma.contract.findMany({
      where,
      include: { 
        workOrder: true, 
        supplier: true,
        project: true,
        items: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calcular días hasta vencimiento y agregar como campo calculado
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const contractsWithDays = contracts.map(contract => {
      let daysUntilExpiration: number | null = null;
      
      const contractEndDate = (contract as any).endDate;
      if (contractEndDate) {
        const endDate = new Date(contractEndDate);
        endDate.setHours(0, 0, 0, 0);
        const diffTime = endDate.getTime() - today.getTime();
        daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      return {
        ...contract,
        daysUntilExpiration
      };
    });

    // Ordenar del más crítico al más lejano (menor días primero)
    // Los null (sin fecha) van al final
    contractsWithDays.sort((a, b) => {
      if (a.daysUntilExpiration === null && b.daysUntilExpiration === null) return 0;
      if (a.daysUntilExpiration === null) return 1;
      if (b.daysUntilExpiration === null) return -1;
      return a.daysUntilExpiration - b.daysUntilExpiration;
    });

    return contractsWithDays;
  }

  async findById(id: string): Promise<Contract | null> {
    return this.prisma.contract.findUnique({
      where: { id },
      include: { workOrder: true, supplier: true, project: true, items: true }
    });
  }

  async getLastContract(): Promise<Contract | null> {
    return this.prisma.contract.findFirst({
      orderBy: { code: 'desc' }
    });
  }

  async generateCode(projectId: string | null): Promise<string> {
    let projectCode = '000'; // Default si no tiene proyecto
    
    if (projectId) {
      const project = await this.prisma.project.findUnique({ where: { id: projectId } });
      if (project && project.code.startsWith('CE-')) {
        // Extraer los 3 dígitos del proyecto: CE-201 -> 201
        projectCode = project.code.replace('CE-', '');
      }
    }
    
    // Buscar el último contrato de este proyecto
    const prefix = `CE-${projectCode}-144-`;
    const last = await this.prisma.contract.findFirst({
      where: { code: { startsWith: prefix } },
      orderBy: { code: 'desc' }
    });
    
    // Extraer número secuencial
    let nextSeq = 1;
    if (last) {
      const parts = last.code.split('-');
      nextSeq = parseInt(parts[parts.length - 1]) + 1;
    }
    
    return `${prefix}${nextSeq.toString().padStart(3, '0')}`;
  }

  async create(data: CreateContractDTO): Promise<Contract> {
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
    
    // Calcular valor final (valor inicial + otro sí + IVA)
    const value = data.value || 0;
    const otroSiValue = data.otroSiValue || 0;
    const finalValue = subtotal + iva;

    return this.prisma.contract.create({
      data: {
        code,
        workOrderId: data.workOrderId || null,
        projectId: data.projectId || null,
        supplierId: data.supplierId,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        value,
        subtotal,
        iva,
        // Checklist documentos
        docContratoFirmado: data.docContratoFirmado || 'NO',
        docRequierePoliza: data.docRequierePoliza || 'N/A',
        fic: data.fic || 'NO',
        actaStartDate: data.actaStartDate ? new Date(data.actaStartDate) : null,
        actaEndDate: data.actaEndDate ? new Date(data.actaEndDate) : null,
        otroSiNumber: data.otroSiNumber || null,
        otroSiEndDate: data.otroSiEndDate ? new Date(data.otroSiEndDate) : null,
        otroSiValue,
        finalValue,
        advancePayment: data.advancePayment || 0,
        status: data.status || 'DRAFT',
        observations: data.observations || null,
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
      include: { workOrder: true, supplier: true, project: true, items: true }
    });
  }

  async update(id: string, data: UpdateContractDTO): Promise<Contract> {
    // Calcular subtotal, AIU, IVA y total si hay items
    let subtotal = 0;
    let iva = 0;
    let finalValue = 0;
    
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
      finalValue = subtotal + iva;
    }

    // Si hay items, eliminar los existentes y crear nuevos
    if (data.items) {
      await this.prisma.contractItem.deleteMany({ where: { contractId: id } });
    }

    // Calcular valor final si no hay items
    if (!data.items) {
      const current = await this.findById(id);
      const value = data.value ?? current?.value ?? 0;
      const otroSiValue = data.otroSiValue ?? current?.otroSiValue ?? 0;
      finalValue = value + otroSiValue;
    }

    // Si hay otroSiEndDate, actualizar endDate del contrato
    let newEndDate = data.endDate;
    if (data.otroSiEndDate) {
      newEndDate = data.otroSiEndDate;
    }

    return this.prisma.contract.update({
      where: { id },
      data: {
        ...(data.workOrderId !== undefined && { workOrderId: data.workOrderId || null }),
        ...(data.projectId !== undefined && { projectId: data.projectId || null }),
        ...(data.supplierId && { supplierId: data.supplierId }),
        ...(data.startDate !== undefined && { startDate: data.startDate ? new Date(data.startDate) : null }),
        ...(newEndDate !== undefined && { endDate: newEndDate ? new Date(newEndDate) : null }),
        ...(data.value !== undefined && { value: data.value }),
        ...(data.docContratoFirmado && { docContratoFirmado: data.docContratoFirmado }),
        ...(data.docRequierePoliza && { docRequierePoliza: data.docRequierePoliza }),
        ...(data.fic && { fic: data.fic }),
        ...(data.actaStartDate !== undefined && { actaStartDate: data.actaStartDate ? new Date(data.actaStartDate) : null }),
        ...(data.actaEndDate !== undefined && { actaEndDate: data.actaEndDate ? new Date(data.actaEndDate) : null }),
        ...(data.otroSiNumber !== undefined && { otroSiNumber: data.otroSiNumber }),
        ...(data.otroSiEndDate !== undefined && { otroSiEndDate: data.otroSiEndDate ? new Date(data.otroSiEndDate) : null }),
        ...(data.otroSiValue !== undefined && { otroSiValue: data.otroSiValue }),
        ...(subtotal > 0 && { subtotal }),
        ...(iva > 0 && { iva }),
        ...(finalValue > 0 && { finalValue }),
        ...(data.advancePayment !== undefined && { advancePayment: data.advancePayment }),
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
      include: { workOrder: true, supplier: true, items: true }
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.contract.delete({ where: { id } });
  }
}