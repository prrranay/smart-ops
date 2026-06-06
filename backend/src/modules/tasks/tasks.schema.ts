import { z } from 'zod';
import { TaskStatus, TaskPriority } from '@prisma/client';

export const createTaskSchema = z.object({
  body: z.object({
    title: z
      .string({ required_error: 'Task title is required' })
      .trim()
      .min(3, { message: 'Task title must be at least 3 characters long' })
      .max(100, { message: 'Task title cannot exceed 100 characters' }),
    description: z
      .string()
      .trim()
      .max(1000, { message: 'Task description cannot exceed 1000 characters' })
      .optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    dueDate: z
      .string()
      .datetime({ message: 'Due date must be a valid ISO-8601 date string' })
      .transform((val) => new Date(val))
      .optional(),
    assignedTo: z
      .string()
      .uuid({ message: 'Assigned user ID must be a valid UUID' })
      .optional(),
  }),
});

export const updateTaskSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Task ID must be a valid UUID' }),
  }),
  body: z
    .object({
      title: z
        .string()
        .trim()
        .min(3, { message: 'Task title must be at least 3 characters long' })
        .max(100, { message: 'Task title cannot exceed 100 characters' })
        .optional(),
      description: z
        .string()
        .trim()
        .max(1000, { message: 'Task description cannot exceed 1000 characters' })
        .optional(),
      priority: z.nativeEnum(TaskPriority).optional(),
      dueDate: z
        .string()
        .datetime({ message: 'Due date must be a valid ISO-8601 date string' })
        .transform((val) => new Date(val))
        .optional(),
    })
    .strict(),
});

export const assignTaskSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Task ID must be a valid UUID' }),
  }),
  body: z.object({
    assignedTo: z
      .string()
      .uuid({ message: 'Assigned user ID must be a valid UUID' })
      .nullable(),
  }),
});

export const changeStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Task ID must be a valid UUID' }),
  }),
  body: z.object({
    status: z.nativeEnum(TaskStatus, {
      errorMap: () => ({ message: 'Status must be one of TODO, IN_PROGRESS, REVIEW, DONE' }),
    }),
  }),
});

export const getTaskSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Task ID must be a valid UUID' }),
  }),
});

export const listTasksSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => {
        const parsed = parseInt(val || '1', 10);
        return isNaN(parsed) || parsed < 1 ? 1 : parsed;
      }),
    limit: z
      .string()
      .optional()
      .transform((val) => {
        const parsed = parseInt(val || '10', 10);
        return isNaN(parsed) || parsed < 1 ? 10 : parsed;
      }),
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    assignedTo: z
      .string()
      .uuid({ message: 'Assigned user ID filter must be a valid UUID' })
      .optional(),
  }),
});
