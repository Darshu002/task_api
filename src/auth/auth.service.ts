import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByUsername } from './auth.users';
import { JwtPayload } from '../types';

/**
 * Login DTO — validated before reaching this service
 */
export interface LoginDto {
  username: string;
  password: string;
}

/**
 * AuthService handles login and token generation.
 */
export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'fallback_secret_dev_only';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1h';
  }

  /**
   * Validate credentials and return a signed JWT.
   * @throws Error with status 401 on invalid credentials
   */
  async login(dto: LoginDto): Promise<{ access_token: string }> {
    const { username, password } = dto;

    const user = findUserByUsername(username);
    if (!user) {
      this.throwUnauthorized();
    }

    const isMatch = await bcrypt.compare(password, user!.passwordHash);
    if (!isMatch) {
      this.throwUnauthorized();
    }

    const payload: JwtPayload = {
      sub: user!.id,
      username: user!.username,
    };

    const access_token = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn as any,
    });

    return { access_token };
  }

  /**
   * Verify a JWT token and return the decoded payload.
   * @throws Error with status 401 on invalid/expired token
   */
  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as JwtPayload;
    } catch {
      const error = new Error('Invalid or expired token');
      (error as any).status = 401;
      throw error;
    }
  }

  private throwUnauthorized(): never {
    const error = new Error('Invalid username or password');
    (error as any).status = 401;
    throw error;
  }
}

// Singleton instance
export const authService = new AuthService();
