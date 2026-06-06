import { Request, Response } from 'express';
import { activityLogService } from './activities.service';
import { asyncHandler } from '../../utils/async-handler';

export class ActivityLogController {
  /**
   * List activities timeline.
   * Path: GET /activities
   */
  listActivities = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const currentUserId = req.user!.id;
    const currentUserRole = req.user!.role;

    // Zod transforms query strings to numbers in validation middleware
    const page = (req.query.page as unknown) as number;
    const limit = (req.query.limit as unknown) as number;
    const userId = req.query.userId as string | undefined;
    const action = req.query.action as string | undefined;
    const entityType = req.query.entityType as string | undefined;

    const result = await activityLogService.listActivities(
      { userId, action, entityType },
      page,
      limit,
      currentUserId,
      currentUserRole
    );

    res.status(200).json({
      status: 'success',
      data: result,
    });
  });
}

// Export a singleton instance of the controller
export const activityLogController = new ActivityLogController();
