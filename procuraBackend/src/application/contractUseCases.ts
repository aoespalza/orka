import { ContractRepository } from '../infrastructure/repositories/contractRepository';
import { 
  CreateContractDTO, 
  UpdateContractDTO,
  ContractFilters 
} from '../domain/contract/contractEntity';

export class ContractUseCases {
  constructor(private repository: ContractRepository) {}

  async getAll(filters?: ContractFilters): Promise<any[]> {
    return this.repository.findAll(filters);
  }

  async getById(id: string): Promise<any | null> {
    return this.repository.findById(id);
  }

  async create(data: CreateContractDTO): Promise<any> {
    return this.repository.create(data);
  }

  async update(id: string, data: UpdateContractDTO): Promise<any> {
    return this.repository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
