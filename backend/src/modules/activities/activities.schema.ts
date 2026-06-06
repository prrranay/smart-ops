import { z } from 'zod';

export const listActivitiesSchema = z.object({
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
    userId: z
      .string()
      .uuid({ message: 'User ID filter must be a valid UUID' })
      .optional(),
    action: z
      .string()
      .trim()
      .min(1, { message: 'Action filter cannot be empty' })
      .optional(),
    entityType: z
      .string()
      .trim()
      .min(1, { message: 'Entity Type filter cannot be empty' })
      .optional(),
  }),
});
