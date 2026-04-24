import { PrismaClient, Policy, PolicyType } from '@prisma/client';
import { 
  CreatePolicyDTO, 
  UpdatePolicyDTO 
} from '../../domain/contract/policyEntity';

export class PolicyRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(): Promise<Policy[]> {
    return this.prisma.policy.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async findById(id: string): Promise<Policy | null> {
    return this.prisma.policy.findUnique({
      where: { id }
    });
  }

  async findByContractId(contractId: string): Promise<Policy[]> {
    return this.prisma.policy.findMany({
      where: { contractId },
      orderBy: { type: 'asc' }
    });
  }

  async findByContractAndType(contractId: string, type: PolicyType): Promise<Policy | null> {
    return this.prisma.policy.findUnique({
      where: { 
        contractId_type: { contractId, type }
      }
    });
  }

  async create(data: CreatePolicyDTO): Promise<Policy> {
    return this.prisma.policy.create({
      data: {
        contractId: data.contractId,
        type: data.type,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        insuredValue: data.insuredValue || 0,
      }
    });
  }

  async update(id: string, data: UpdatePolicyDTO): Promise<Policy> {
    return this.prisma.policy.update({
      where: { id },
      data: {
        ...(data.type && { type: data.type }),
        ...(data.startDate !== undefined && { startDate: data.startDate ? new Date(data.startDate) : null }),
        ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
        ...(data.insuredValue !== undefined && { insuredValue: data.insuredValue }),
      }
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.policy.delete({
      where: { id }
    });
  }

  async deleteByContractId(contractId: string): Promise<void> {
    await this.prisma.policy.deleteMany({
      where: { contractId }
    });
  }
}