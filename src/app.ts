import 'reflect-metadata';
import express, { Application, Request, Response } from 'express';
import taskRouter from './tasks/task.router';
import authRouter from './auth/auth.router';
import { errorMiddleware } from './middleware/error.middleware';


export function createApp(): Application {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ success: true, message: 'Task API is running', timestamp: new Date() });
  });

  app.use('/auth', authRouter);
  app.use('/tasks', taskRouter);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ success: false, error: 'Route not found' });
  });

  app.use(errorMiddleware);

  return app;
}
