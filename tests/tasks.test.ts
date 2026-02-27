import request from 'supertest';
import { createApp } from '../src/app';
import { AppDataSource } from '../src/database/data-source';
import { Task } from '../src/tasks/task.entity';
import { TaskStatus } from '../src/types';
import { Application } from 'express';

const mockTask: Task = {
  id: 1,
  title: 'Test Task',
  description: 'A test description',
  status: TaskStatus.PENDING,
  completed_at: null,
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01'),
  deleted_at: null,
};

const mockRepo = {
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  softDelete: jest.fn(),
};

jest.mock('../src/database/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(() => mockRepo),
    isInitialized: true,
  },
}));

let app: Application;
let authToken: string;

beforeAll(async () => {
  app = createApp();

  const loginRes = await request(app)
    .post('/auth/login')
    .send({ username: 'admin', password: 'adminpass' });

  authToken = loginRes.body.data.access_token;
});

beforeEach(() => {
  jest.clearAllMocks();
});

const authReq = (method: 'get' | 'post' | 'patch' | 'delete', url: string) =>
  request(app)[method](url).set('Authorization', `Bearer ${authToken}`);

describe('GET /tasks', () => {
  it('should return paginated tasks', async () => {
    mockRepo.findAndCount.mockResolvedValueOnce([[mockTask], 1]);

    const res = await authReq('get', '/tasks');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.data).toHaveLength(1);
    expect(res.body.data.meta).toMatchObject({
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });

  it('should respect pagination query params', async () => {
    mockRepo.findAndCount.mockResolvedValueOnce([[], 0]);

    const res = await authReq('get', '/tasks?page=2&limit=5');

    expect(res.status).toBe(200);
    expect(mockRepo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 5, take: 5 })
    );
  });

  it('should return empty array when no tasks exist', async () => {
    mockRepo.findAndCount.mockResolvedValueOnce([[], 0]);

    const res = await authReq('get', '/tasks');
    expect(res.status).toBe(200);
    expect(res.body.data.data).toHaveLength(0);
    expect(res.body.data.meta.total).toBe(0);
  });
});

describe('GET /tasks/:id', () => {
  it('should return a task by ID', async () => {
    mockRepo.findOne.mockResolvedValueOnce(mockTask);

    const res = await authReq('get', '/tasks/1');

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(1);
    expect(res.body.data.title).toBe('Test Task');
  });

  it('should return 404 when task not found', async () => {
    mockRepo.findOne.mockResolvedValueOnce(null);

    const res = await authReq('get', '/tasks/999');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for non-numeric ID', async () => {
    const res = await authReq('get', '/tasks/abc');
    expect(res.status).toBe(400);
  });
});

describe('POST /tasks', () => {
  it('should create a new task with title only', async () => {
    const newTask = { ...mockTask, id: 2, title: 'New Task' };
    mockRepo.create.mockReturnValueOnce(newTask);
    mockRepo.save.mockResolvedValueOnce(newTask);

    const res = await authReq('post', '/tasks').send({ title: 'New Task' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('New Task');
  });

  it('should default status to pending', async () => {
    const pendingTask = { ...mockTask, status: TaskStatus.PENDING };
    mockRepo.create.mockReturnValueOnce(pendingTask);
    mockRepo.save.mockResolvedValueOnce(pendingTask);

    const res = await authReq('post', '/tasks').send({ title: 'A task' });

    expect(res.status).toBe(201);
  });

  it('should return 400 when title is missing', async () => {
    const res = await authReq('post', '/tasks').send({ description: 'no title' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when title is empty string', async () => {
    const res = await authReq('post', '/tasks').send({ title: '' });
    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid status enum', async () => {
    const res = await authReq('post', '/tasks').send({
      title: 'A task',
      status: 'invalid-status',
    });
    expect(res.status).toBe(400);
  });

  it('should create task with all valid fields', async () => {
    const fullTask = {
      ...mockTask,
      description: 'Full desc',
      status: TaskStatus.IN_PROGRESS,
    };
    mockRepo.create.mockReturnValueOnce(fullTask);
    mockRepo.save.mockResolvedValueOnce(fullTask);

    const res = await authReq('post', '/tasks').send({
      title: 'Full Task',
      description: 'Full desc',
      status: 'in-progress',
    });

    expect(res.status).toBe(201);
  });
});

describe('PATCH /tasks/:id', () => {
  it('should update a task partially', async () => {
    const updated = { ...mockTask, title: 'Updated Title' };
    mockRepo.findOne.mockResolvedValueOnce(mockTask);
    mockRepo.save.mockResolvedValueOnce(updated);

    const res = await authReq('patch', '/tasks/1').send({ title: 'Updated Title' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated Title');
  });

  it('should return 404 for non-existent task', async () => {
    mockRepo.findOne.mockResolvedValueOnce(null);

    const res = await authReq('patch', '/tasks/999').send({ title: 'X' });
    expect(res.status).toBe(404);
  });

  it('should return 400 for invalid status', async () => {
    const res = await authReq('patch', '/tasks/1').send({ status: 'invalid' });
    expect(res.status).toBe(400);
  });

  it('should return 400 for non-numeric ID', async () => {
    const res = await authReq('patch', '/tasks/abc').send({ title: 'X' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /tasks/:id (soft delete)', () => {
  it('should soft delete a task', async () => {
    mockRepo.findOne.mockResolvedValueOnce(mockTask);
    mockRepo.softDelete.mockResolvedValueOnce({ affected: 1 });

    const res = await authReq('delete', '/tasks/1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockRepo.softDelete).toHaveBeenCalledWith(1);
  });

  it('should return 404 when task not found', async () => {
    mockRepo.findOne.mockResolvedValueOnce(null);

    const res = await authReq('delete', '/tasks/999');
    expect(res.status).toBe(404);
    expect(mockRepo.softDelete).not.toHaveBeenCalled();
  });

  it('should return 400 for non-numeric ID', async () => {
    const res = await authReq('delete', '/tasks/abc');
    expect(res.status).toBe(400);
  });
});
