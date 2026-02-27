import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByUsername } from './auth.users';
import { JwtPayload } from '../types';
type HttpError = Error & { status?: number };
export interface LoginDto {
  username: string;
  password: string;
}
export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'fallback_secret_dev_only';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1h';
  }

  async login(dto: LoginDto): Promise<{ access_token: string }> {
    const { username, password } = dto;

    const user = findUserByUsername(username);
    if (!user) {
      const error: HttpError = new Error('Invalid username or password');
      error.status = 401;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      const error: HttpError = new Error('Invalid username or password');
      error.status = 401;
      throw error;
    }

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
    };

    const access_token = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
    });

    return { access_token };
  }

  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as JwtPayload;
    } catch {
      const error: HttpError = new Error('Invalid or expired token');
      error.status = 401;
      throw error;
    }
  }
}

export const authService = new AuthService();
