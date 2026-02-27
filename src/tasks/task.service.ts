import { Repository } from 'typeorm';
import { Task } from './task.entity';
import { CreateTaskDto, UpdateTaskDto } from './task.dto';
import { TaskStatus, PaginationQuery, PaginatedResponse } from '../types';
type HttpError = Error & { status?: number };
export class TaskService {
  constructor(private readonly taskRepository: Repository<Task>) {}

  async findAll(query: PaginationQuery): Promise<PaginatedResponse<Task>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const [data, total] = await this.taskRepository.findAndCount({
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id } });

    if (!task) {
      const error: HttpError = new Error(`Task with ID ${id} not found`);
      error.status = 404;
      throw error;
    }

    return task;
  }

  async create(dto: CreateTaskDto): Promise<Task> {
    const task = this.taskRepository.create({
      title: dto.title,
      description: dto.description,
      status: dto.status ?? TaskStatus.PENDING,
      completed_at: dto.completed_at ? new Date(dto.completed_at) : null,
    });

    if (task.status === TaskStatus.COMPLETED && !task.completed_at) {
      task.completed_at = new Date();
    }

    return this.taskRepository.save(task);
  }

  async update(id: number, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);

    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.status !== undefined) task.status = dto.status;

    if (dto.completed_at !== undefined) {
      task.completed_at = dto.completed_at ? new Date(dto.completed_at) : null;
    } else if (dto.status === TaskStatus.COMPLETED && !task.completed_at) {
      task.completed_at = new Date();
    } else if (dto.status && dto.status !== TaskStatus.COMPLETED) {
      task.completed_at = null;
    }

    return this.taskRepository.save(task);
  }

  async softDelete(id: number): Promise<void> {
    await this.findOne(id);

    await this.taskRepository.softDelete(id);
  }
}
