import { Request, Response } from 'express';
import { notificationService } from './notifications.service';
import { asyncHandler } from '../../utils/async-handler';

export class NotificationController {
  /**
   * Retrieves paginated list of notifications for the authenticated user.
   * Path: GET /notifications
   */
  listNotifications = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    // Query values are pre-typed/validated by Zod middleware
    const page = (req.query.page as unknown) as number;
    const limit = (req.query.limit as unknown) as number;
    const isRead = req.query.isRead as boolean | undefined;

    const data = await notificationService.listNotifications(userId, isRead, page, limit);

    res.status(200).json({
      status: 'success',
      data,
    });
  });

  /**
   * Marks a specific notification as read.
   * Path: PATCH /notifications/:id/read
   */
  markAsRead = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { id } = req.params;

    const updated = await notificationService.markAsRead(id, userId);

    res.status(200).json({
      status: 'success',
      data: updated,
    });
  });

  /**
   * Marks all notifications of the current user as read.
   * Path: PATCH /notifications/read-all
   */
  markAllAsRead = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;

    await notificationService.markAllAsRead(userId);

    res.status(200).json({
      status: 'success',
      message: 'All notifications successfully marked as read',
    });
  });
}

export const notificationController = new NotificationController();
