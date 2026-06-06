import { z } from 'zod';

export const listNotificationsSchema = z.object({
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
    isRead: z
      .string()
      .optional()
      .transform((val) => {
        if (val === 'true') return true;
        if (val === 'false') return false;
        return undefined;
      }),
  }),
});

export const markReadSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Notification ID must be a valid UUID' }),
  }),
});
