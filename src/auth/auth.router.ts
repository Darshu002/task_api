import { Router, Request, Response, NextFunction } from 'express';
import { authService, LoginDto } from './auth.service';

const router = Router();

/**
 * POST /auth/login
 * Accepts { username, password }, returns JWT access_token on success.
 *
 * Example request body:
 *   { "username": "user1", "password": "password1" }
 *
 * Example response:
 *   { "success": true, "data": { "access_token": "eyJ..." } }
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body as LoginDto;

    // Basic validation
    if (!username || typeof username !== 'string') {
      res.status(400).json({ success: false, error: 'username is required' });
      return;
    }
    if (!password || typeof password !== 'string') {
      res.status(400).json({ success: false, error: 'password is required' });
      return;
    }

    const result = await authService.login({ username, password });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
