import { Router, Request, Response, NextFunction } from 'express';
import { authService, LoginDto } from './auth.service';

const router = Router();
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body as LoginDto;

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
