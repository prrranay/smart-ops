import { z } from 'zod';

export const createCommentSchema = z.object({
  params: z.object({
    taskId: z.string().uuid({ message: 'Task ID must be a valid UUID' }),
  }),
  body: z.object({
    content: z
      .string({
        required_error: 'Comment content is required',
      })
      .trim()
      .min(1, { message: 'Comment content cannot be empty' })
      .max(1000, { message: 'Comment content cannot exceed 1000 characters' }),
  }),
});

export const listCommentsSchema = z.object({
  params: z.object({
    taskId: z.string().uuid({ message: 'Task ID must be a valid UUID' }),
  }),
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
  }),
});
