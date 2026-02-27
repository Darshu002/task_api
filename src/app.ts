import 'reflect-metadata';
import express, { Application, Request, Response } from 'express';
import taskRouter from './tasks/task.router';
import authRouter from './auth/auth.router';
import { errorMiddleware } from './middleware/error.middleware';


export function createApp(): Application {
  const app = express();

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check (no auth required)
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ success: true, message: 'Task API is running', timestamp: new Date() });
  });

  // Routes
  app.use('/auth', authRouter);
  app.use('/tasks', taskRouter);

  // 404 handler for unknown routes
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ success: false, error: 'Route not found' });
  });

  // Global error handler (must be last)
  app.use(errorMiddleware);

  return app;
}
