import { WorkOrderRepository } from '../infrastructure/repositories/workOrderRepository';
import { 
  WorkOrder, 
  CreateWorkOrderDTO, 
  UpdateWorkOrderDTO 
} from '../domain/workOrder/workOrderEntity';

export class WorkOrderUseCases {
  constructor(private repository: WorkOrderRepository) {}

  async getAll(): Promise<WorkOrder[]> {
    return this.repository.findAll();
  }

  async getById(id: string): Promise<WorkOrder | null> {
    return this.repository.findById(id);
  }

  async create(data: CreateWorkOrderDTO): Promise<WorkOrder> {
    return this.repository.create(data);
  }

  async update(id: string, data: UpdateWorkOrderDTO): Promise<WorkOrder> {
    return this.repository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  async updateStatus(id: string, status: string): Promise<WorkOrder> {
    return this.repository.updateStatus(id, status);
  }
}
