import bcrypt from 'bcryptjs';
export interface User {
  id: number;
  username: string;
  passwordHash: string;
}
const USERS_RAW = [
  { id: 1, username: 'user1', password: 'password1' },
  { id: 2, username: 'user2', password: 'password2' },
  { id: 3, username: 'admin', password: 'adminpass' },
];

export const USERS: User[] = USERS_RAW.map((u) => ({
  id: u.id,
  username: u.username,
  passwordHash: bcrypt.hashSync(u.password, 10),
}));

export function findUserByUsername(username: string): User | undefined {
  return USERS.find((u) => u.username.toLowerCase() === username.toLowerCase());
}
