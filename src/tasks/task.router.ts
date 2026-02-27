import { Router, Request, Response, NextFunction } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { TaskService } from './task.service';
import { CreateTaskDto, UpdateTaskDto } from './task.dto';
import { ApiResponse, PaginationQuery } from '../types';
import { authMiddleware } from '../middleware/auth.middleware';
import { AppDataSource } from '../database/data-source';
import { Task } from './task.entity';

const router = Router();

// All task routes require authentication
router.use(authMiddleware);

/**
 * Helper: validate DTO and return errors array (empty = valid)
 */
async function validateDto(dtoInstance: object): Promise<string[]> {
  const errors = await validate(dtoInstance, {
    whitelist: true,
    forbidNonWhitelisted: false,
  });
  return errors.flatMap((e) => Object.values(e.constraints || {}));
}

/**
 * GET /tasks
 * Retrieve all tasks with pagination
 * Query params: page (default 1), limit (default 10)
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const service = new TaskService(AppDataSource.getRepository(Task));
    const query: PaginationQuery = {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 10,
    };

    const result = await service.findAll(query);
    const response: ApiResponse<typeof result> = { success: true, data: result };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /tasks/:id
 * Retrieve a specific task by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'Invalid task ID' });
      return;
    }

    const service = new TaskService(AppDataSource.getRepository(Task));
    const task = await service.findOne(id);
    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /tasks
 * Create a new task
 * Body: { title (required), description?, status?, completed_at? }
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = plainToInstance(CreateTaskDto, req.body);
    const errors = await validateDto(dto);

    if (errors.length > 0) {
      res.status(400).json({ success: false, error: 'Validation failed', data: errors });
      return;
    }

    const service = new TaskService(AppDataSource.getRepository(Task));
    const task = await service.create(dto);
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /tasks/:id
 * Partially update a task
 * Body: { title?, description?, status?, completed_at? }
 */
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'Invalid task ID' });
      return;
    }

    const dto = plainToInstance(UpdateTaskDto, req.body);
    const errors = await validateDto(dto);

    if (errors.length > 0) {
      res.status(400).json({ success: false, error: 'Validation failed', data: errors });
      return;
    }

    const service = new TaskService(AppDataSource.getRepository(Task));
    const task = await service.update(id, dto);
    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /tasks/:id
 * Soft delete a task (sets deleted_at, data is preserved in DB)
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'Invalid task ID' });
      return;
    }

    const service = new TaskService(AppDataSource.getRepository(Task));
    await service.softDelete(id);
    res.json({ success: true, message: `Task ${id} has been soft deleted` });
  } catch (err) {
    next(err);
  }
});

export default router;
