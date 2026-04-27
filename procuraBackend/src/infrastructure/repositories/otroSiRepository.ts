import { PrismaClient, ContractOtroSi } from '@prisma/client';
import { CreateContractOtroSiDTO, UpdateContractOtroSiDTO } from '../../domain/contract/otroSiEntity';

export class ContractOtroSiRepository {
  constructor(private prisma: PrismaClient) {}

  async findByContractId(contractId: string): Promise<ContractOtroSi[]> {
    return this.prisma.contractOtroSi.findMany({
      where: { contractId },
      orderBy: { numero: 'asc' }
    }) as any;
  }

  async findById(id: string): Promise<ContractOtroSi | null> {
    return this.prisma.contractOtroSi.findUnique({
      where: { id }
    }) as any;
  }

  async create(data: CreateContractOtroSiDTO): Promise<ContractOtroSi> {
    return this.prisma.contractOtroSi.create({
      data: {
        contractId: data.contractId,
        numero: data.numero,
        endDate: data.endDate ? new Date(data.endDate) : null,
        value: data.value || 0
      }
    }) as any;
  }

  async update(id: string, data: UpdateContractOtroSiDTO): Promise<ContractOtroSi> {
    return this.prisma.contractOtroSi.update({
      where: { id },
      data: {
        ...(data.numero !== undefined && { numero: data.numero }),
        ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
        ...(data.value !== undefined && { value: data.value })
      }
    }) as any;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.contractOtroSi.delete({
      where: { id }
    });
  }

  async deleteByContractId(contractId: string): Promise<void> {
    await this.prisma.contractOtroSi.deleteMany({
      where: { contractId }
    });
  }

  async getTotalValue(contractId: string): Promise<number> {
    const otroSis = await this.prisma.contractOtroSi.findMany({
      where: { contractId },
      select: { value: true }
    });
    return otroSis.reduce((sum, os) => sum + (os.value || 0), 0);
  }
}