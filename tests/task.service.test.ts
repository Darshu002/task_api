import { TaskService } from '../src/tasks/task.service';
import { TaskStatus } from '../src/types';
import { Task } from '../src/tasks/task.entity';

const mockRepo = {
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  softDelete: jest.fn(),
};

const mockTask: Task = {
  id: 1,
  title: 'Test Task',
  description: 'Description',
  status: TaskStatus.PENDING,
  completed_at: null,
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
};

let service: TaskService;

beforeEach(() => {
  jest.clearAllMocks();
  service = new TaskService(mockRepo as any);
});

describe('TaskService.findAll', () => {
  it('should return paginated results', async () => {
    mockRepo.findAndCount.mockResolvedValueOnce([[mockTask], 1]);

    const result = await service.findAll({ page: 1, limit: 10 });

    expect(result.data).toHaveLength(1);
    expect(result.meta).toEqual({ total: 1, page: 1, limit: 10, totalPages: 1 });
    expect(mockRepo.findAndCount).toHaveBeenCalledWith({
      skip: 0,
      take: 10,
      order: { created_at: 'DESC' },
    });
  });

  it('should use defaults when no pagination params given', async () => {
    mockRepo.findAndCount.mockResolvedValueOnce([[], 0]);

    const result = await service.findAll({});

    expect(result.meta.page).toBe(1);
    expect(result.meta.limit).toBe(10);
  });

  it('should cap limit at 100', async () => {
    mockRepo.findAndCount.mockResolvedValueOnce([[], 0]);

    await service.findAll({ limit: 9999 });

    expect(mockRepo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 })
    );
  });
});

describe('TaskService.findOne', () => {
  it('should return a task when found', async () => {
    mockRepo.findOne.mockResolvedValueOnce(mockTask);

    const task = await service.findOne(1);
    expect(task.id).toBe(1);
    expect(task.title).toBe('Test Task');
  });

  it('should throw 404 error when task not found', async () => {
    mockRepo.findOne.mockResolvedValueOnce(null);

    await expect(service.findOne(999)).rejects.toMatchObject({
      message: expect.stringContaining('not found'),
      status: 404,
    });
  });
});

describe('TaskService.create', () => {
  it('should create task with pending status by default', async () => {
    const task = { ...mockTask, status: TaskStatus.PENDING };
    mockRepo.create.mockReturnValueOnce(task);
    mockRepo.save.mockResolvedValueOnce(task);

    const result = await service.create({ title: 'New Task' });
    expect(result.status).toBe(TaskStatus.PENDING);
  });

  it('should auto-set completed_at when creating with completed status', async () => {
    const completedTask = { ...mockTask, status: TaskStatus.COMPLETED, completed_at: null };
    mockRepo.create.mockReturnValueOnce(completedTask);
    mockRepo.save.mockResolvedValueOnce(completedTask);

    await service.create({ title: 'Done', status: TaskStatus.COMPLETED });

    const savedTask = mockRepo.save.mock.calls[0][0];
    expect(savedTask.completed_at).toBeInstanceOf(Date);
  });

  it('should not override explicitly provided completed_at', async () => {
    const specificDate = new Date('2024-06-01');
    const task = { ...mockTask, status: TaskStatus.COMPLETED, completed_at: specificDate };
    mockRepo.create.mockReturnValueOnce(task);
    mockRepo.save.mockResolvedValueOnce(task);

    await service.create({
      title: 'Done',
      status: TaskStatus.COMPLETED,
      completed_at: '2024-06-01',
    });

    expect(mockRepo.save).toHaveBeenCalled();
  });
});

describe('TaskService.update', () => {
  it('should update task fields', async () => {
    mockRepo.findOne.mockResolvedValueOnce({ ...mockTask });
    mockRepo.save.mockImplementationOnce((t: Task) => Promise.resolve(t));

    const result = await service.update(1, { title: 'Updated' });
    expect(result.title).toBe('Updated');
  });

  it('should clear completed_at when status changes from completed', async () => {
    const completedTask = { ...mockTask, status: TaskStatus.COMPLETED, completed_at: new Date() };
    mockRepo.findOne.mockResolvedValueOnce(completedTask);
    mockRepo.save.mockImplementationOnce((t: Task) => Promise.resolve(t));

    const result = await service.update(1, { status: TaskStatus.PENDING });
    expect(result.completed_at).toBeNull();
  });

  it('should throw 404 when updating non-existent task', async () => {
    mockRepo.findOne.mockResolvedValueOnce(null);

    await expect(service.update(999, { title: 'X' })).rejects.toMatchObject({
      status: 404,
    });
  });
});

describe('TaskService.softDelete', () => {
  it('should soft delete existing task', async () => {
    mockRepo.findOne.mockResolvedValueOnce(mockTask);
    mockRepo.softDelete.mockResolvedValueOnce({ affected: 1 });

    await expect(service.softDelete(1)).resolves.toBeUndefined();
    expect(mockRepo.softDelete).toHaveBeenCalledWith(1);
  });

  it('should throw 404 when deleting non-existent task', async () => {
    mockRepo.findOne.mockResolvedValueOnce(null);

    await expect(service.softDelete(999)).rejects.toMatchObject({
      status: 404,
    });
    expect(mockRepo.softDelete).not.toHaveBeenCalled();
  });
});
