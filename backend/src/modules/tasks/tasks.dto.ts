import { TaskStatus, TaskPriority } from '@prisma/client';

export interface UserSummaryDto {
  id: string;
  name: string;
  email: string;
}

export interface TaskResponseDto {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  createdBy: string;
  assignedTo: string | null;
  createdAt: Date;
  updatedAt: Date;
  creator: UserSummaryDto;
  assignee: UserSummaryDto | null;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: Date;
  assignedTo?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: Date;
}

export interface AssignTaskDto {
  assignedTo: string | null;
}

export interface ChangeStatusDto {
  status: TaskStatus;
}

export interface PaginatedTasksDto {
  tasks: TaskResponseDto[];
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}
