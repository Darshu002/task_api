import bcrypt from 'bcryptjs';
export interface User {
  id: number;
  username: string;
  passwordHash: string;
}
const rawUsers = [
  { id: 1, username: 'user1', password: 'password1' },
  { id: 2, username: 'user2', password: 'password2' },
  { id: 3, username: 'admin', password: 'adminpass' },
];

const users: User[] = rawUsers.map((u) => ({
  id: u.id,
  username: u.username,
  passwordHash: bcrypt.hashSync(u.password, 10),
}));

export function findUserByUsername(username: string): User | undefined {
  const key = username.toLowerCase();
  return users.find((u) => u.username.toLowerCase() === key);
}
