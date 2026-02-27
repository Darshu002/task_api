import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import { AppDataSource } from './database/data-source';

const PORT = parseInt(process.env.PORT || '3000', 10);

async function bootstrap(): Promise<void> {
  try {
    // Initialize database connection
    console.log('Connecting to database...');
    await AppDataSource.initialize();
    console.log(' Database connected successfully');

    // Start Express server
    const app = createApp();
    app.listen(PORT, () => {
      console.log(`running on http://localhost:${PORT}`); 
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
