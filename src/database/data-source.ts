import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { Task } from '../tasks/task.entity';

dotenv.config();


export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: '111',
  database: process.env.DB_NAME || 'task_api',
  synchronize: process.env.NODE_ENV !== 'production', 
  logging: process.env.NODE_ENV === 'development',
  entities: [Task],
  migrations: [],
  subscribers: [],
});
