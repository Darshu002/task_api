import { Repository } from 'typeorm';
import { Task } from './task.entity';
import { CreateTaskDto, UpdateTaskDto } from './task.dto';
import { TaskStatus, PaginationQuery, PaginatedResponse } from '../types';

/**
 * TaskService handles all business logic for Task CRUD operations.
 * Uses TypeORM repository pattern for database interactions.
 */
export class TaskService {
  constructor(private readonly taskRepository: Repository<Task>) {}

  /**
   * Retrieve all non-deleted tasks with pagination
   */
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

  /**
   * Retrieve a single task by ID (excludes soft-deleted)
   * @throws Error with status 404 if not found
   */
  async findOne(id: number): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id } });

    if (!task) {
      const error = new Error(`Task with ID ${id} not found`);
      (error as any).status = 404;
      throw error;
    }

    return task;
  }

  /**
   * Create a new task
   * - Status defaults to 'pending' if not provided
   * - Sets completed_at if status is 'completed'
   */
  async create(dto: CreateTaskDto): Promise<Task> {
    const task = this.taskRepository.create({
      title: dto.title,
      description: dto.description,
      status: dto.status ?? TaskStatus.PENDING,
      completed_at: dto.completed_at ? new Date(dto.completed_at) : null,
    });

    // Auto-set completed_at when status is completed
    if (task.status === TaskStatus.COMPLETED && !task.completed_at) {
      task.completed_at = new Date();
    }

    return this.taskRepository.save(task);
  }

  /**
   * Partially update an existing task
   * @throws Error with status 404 if not found
   */
  async update(id: number, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);

    // Apply updates
    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.status !== undefined) task.status = dto.status;

    // Handle completed_at
    if (dto.completed_at !== undefined) {
      task.completed_at = dto.completed_at ? new Date(dto.completed_at) : null;
    } else if (dto.status === TaskStatus.COMPLETED && !task.completed_at) {
      // Auto-set completed_at when marking as completed
      task.completed_at = new Date();
    } else if (dto.status && dto.status !== TaskStatus.COMPLETED) {
      // Clear completed_at if status changed away from completed
      task.completed_at = null;
    }

    return this.taskRepository.save(task);
  }

  /**
   * Soft delete a task by setting deleted_at timestamp
   * @throws Error with status 404 if not found
   */
  async softDelete(id: number): Promise<void> {
    // Verify it exists first
    await this.findOne(id);

    // TypeORM softDelete sets deleted_at automatically
    await this.taskRepository.softDelete(id);
  }
}
