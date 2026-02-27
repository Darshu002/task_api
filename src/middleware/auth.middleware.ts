import { Request, Response, NextFunction } from 'express';
import { authService } from '../auth/auth.service';

/**
 * authMiddleware - protects routes by requiring a valid Bearer JWT.
 *
 * Expects: Authorization: Bearer <token>
 * On success: attaches decoded payload to req.user
 * On failure: returns 401 Unauthorized
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Authorization header missing or malformed. Expected: Bearer <token>',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = authService.verifyToken(token);
    req.user = payload;
    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      error: err.message || 'Unauthorized',
    });
  }
}
