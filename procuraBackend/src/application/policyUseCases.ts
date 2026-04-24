import { PolicyRepository } from '../infrastructure/repositories/policyRepository';
import { 
  CreatePolicyDTO, 
  UpdatePolicyDTO,
  PolicyType
} from '../domain/contract/policyEntity';

export class PolicyUseCases {
  constructor(private repository: PolicyRepository) {}

  async getAll(): Promise<any[]> {
    return this.repository.findAll();
  }

  async getById(id: string): Promise<any | null> {
    return this.repository.findById(id);
  }

  async getByContractId(contractId: string): Promise<any[]> {
    return this.repository.findByContractId(contractId);
  }

  async create(data: CreatePolicyDTO): Promise<any> {
    // Verificar si ya existe una póliza de este tipo para el contrato
    const existing = await this.repository.findByContractAndType(data.contractId, data.type);
    if (existing) {
      // Actualizar en lugar de crear
      return this.repository.update(existing.id, {
        type: data.type,
        startDate: data.startDate,
        endDate: data.endDate,
        insuredValue: data.insuredValue,
      });
    }
    return this.repository.create(data);
  }

  async update(id: string, data: UpdatePolicyDTO): Promise<any> {
    return this.repository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  async deleteByContractId(contractId: string): Promise<void> {
    return this.repository.deleteByContractId(contractId);
  }
}