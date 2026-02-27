import bcrypt from 'bcryptjs';

/**
 * In-memory user store for authentication demo.
 *
 * Sample credentials:
 *   user1 / password1
 *   user2 / password2
 *   admin / adminpass
 *
 * Passwords are stored as bcrypt hashes (cost factor 10).
 */
export interface User {
  id: number;
  username: string;
  passwordHash: string;
}

// Pre-hashed passwords (generated with bcrypt, cost 10)
// These are computed at module load to avoid startup delay
const USERS_RAW = [
  { id: 1, username: 'user1', password: 'password1' },
  { id: 2, username: 'user2', password: 'password2' },
  { id: 3, username: 'admin', password: 'adminpass' },
];

/**
 * Synchronously create hashed user records.
 * In production, users would come from a database with stored hashes.
 */
export const USERS: User[] = USERS_RAW.map((u) => ({
  id: u.id,
  username: u.username,
  passwordHash: bcrypt.hashSync(u.password, 10),
}));

/**
 * Find a user by username (case-insensitive)
 */
export function findUserByUsername(username: string): User | undefined {
  return USERS.find((u) => u.username.toLowerCase() === username.toLowerCase());
}
