import { Request, Response, NextFunction } from 'express';

/**
 * Global error handling middleware.
 * Catches all errors passed via next(err) and returns a consistent JSON response.
 */
export function errorMiddleware(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status: number = err.status || err.statusCode || 500;
  const message: string = err.message || 'Internal Server Error';

  console.error(`[Error] ${status} - ${message}`, err.stack ? `\n${err.stack}` : '');

  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
