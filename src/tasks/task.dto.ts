import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { TaskStatus } from '../types';
export class CreateTaskDto {
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(255, { message: 'Title must not exceed 255 characters' })
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus, {
    message: `Status must be one of: ${Object.values(TaskStatus).join(', ')}`,
  })
  status?: TaskStatus;

  @IsOptional()
  @IsDateString({}, { message: 'completed_at must be a valid ISO date string' })
  completed_at?: string;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Title cannot be empty if provided' })
  @MaxLength(255, { message: 'Title must not exceed 255 characters' })
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus, {
    message: `Status must be one of: ${Object.values(TaskStatus).join(', ')}`,
  })
  status?: TaskStatus;

  @IsOptional()
  @IsDateString({}, { message: 'completed_at must be a valid ISO date string' })
  completed_at?: string | null;
}
