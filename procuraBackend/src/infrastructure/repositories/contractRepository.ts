import { PrismaClient, Contract } from '@prisma/client';
import { 
  CreateContractDTO, 
  UpdateContractDTO,
  ContractFilters
} from '../../domain/contract/contractEntity';

export class ContractRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(filters?: ContractFilters): Promise<Contract[]> {
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

    return this.prisma.contract.findMany({
      where,
      include: { 
        workOrder: true, 
        supplier: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findById(id: string): Promise<Contract | null> {
    return this.prisma.contract.findUnique({
      where: { id },
      include: { workOrder: true, supplier: true }
    });
  }

  async getLastContract(): Promise<Contract | null> {
    return this.prisma.contract.findFirst({
      orderBy: { code: 'desc' }
    });
  }

  async generateCode(): Promise<string> {
    const last = await this.getLastContract();
    const nextNumber = last ? parseInt(last.code.replace('CTR-', '')) + 1 : 1;
    return `CTR-${nextNumber.toString().padStart(4, '0')}`;
  }

  async create(data: CreateContractDTO): Promise<Contract> {
    const code = await this.generateCode();
    
    // Calcular valor final (valor inicial + otro sí)
    const value = data.value || 0;
    const otroSiValue = data.otroSiValue || 0;
    const finalValue = value + otroSiValue;

    return this.prisma.contract.create({
      data: {
        code,
        workOrderId: data.workOrderId || null,
        supplierId: data.supplierId,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        value,
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
        observations: data.observations || null
      },
      include: { workOrder: true, supplier: true }
    });
  }

  async update(id: string, data: UpdateContractDTO): Promise<Contract> {
    // Calcular valor final si hay cambios en value u otroSiValue
    let finalValue = 0;
    if (data.value !== undefined || data.otroSiValue !== undefined) {
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
        ...(finalValue > 0 && { finalValue }),
        ...(data.advancePayment !== undefined && { advancePayment: data.advancePayment }),
        ...(data.status && { status: data.status }),
        ...(data.observations !== undefined && { observations: data.observations })
      },
      include: { workOrder: true, supplier: true }
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.contract.delete({ where: { id } });
  }
}
