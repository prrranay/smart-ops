import { Request, Response } from 'express';
import { dashboardService } from './dashboard.service';
import { asyncHandler } from '../../utils/async-handler';

export class DashboardController {
  /**
   * Retrieves summary analytics.
   * Path: GET /dashboard/summary
   */
  getSummary = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const summary = await dashboardService.getSummary();

    res.status(200).json({
      status: 'success',
      data: summary,
    });
  });

  /**
   * Retrieves workload scores for all active users.
   * Path: GET /dashboard/workload
   */
  getWorkload = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const workloadList = await dashboardService.getWorkload();

    res.status(200).json({
      status: 'success',
      data: workloadList,
    });
  });
}

// Export a singleton instance of the controller
export const dashboardController = new DashboardController();
