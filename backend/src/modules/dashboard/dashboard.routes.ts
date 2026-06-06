import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/auth.middleware';
import { UserRole } from '../../types/role.enum';

const dashboardRouter = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     DashboardSummary:
 *       type: object
 *       properties:
 *         totalTasks:
 *           type: integer
 *           example: 100
 *         completedTasks:
 *           type: integer
 *           example: 40
 *         pendingTasks:
 *           type: integer
 *           example: 30
 *         inProgressTasks:
 *           type: integer
 *           example: 20
 *         reviewTasks:
 *           type: integer
 *           example: 10
 *     UserWorkload:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           format: uuid
 *           example: 892a50a8-2d22-4aed-8ce4-8370b5ef6896
 *         userName:
 *           type: string
 *           example: Base User
 *         score:
 *           type: integer
 *           example: 15
 *         workloadLevel:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH]
 *           example: MEDIUM
 */

/**
 * @openapi
 * /api/v1/dashboard/summary:
 *   get:
 *     summary: Retrieve aggregate counts of tasks by status
 *     description: Restricted to ADMIN and MANAGER roles only.
 *     tags:
 *       - Dashboard Analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/DashboardSummary'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient roles)
 */
dashboardRouter.get(
  '/summary',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.MANAGER]),
  dashboardController.getSummary
);

/**
 * @openapi
 * /api/v1/dashboard/workload:
 *   get:
 *     summary: Retrieve workload points score and level classification for all active employees
 *     description: |
 *       Restricted to ADMIN and MANAGER roles only.
 *       Calculates points: HIGH Priority = 3, MEDIUM Priority = 2, LOW Priority = 1.
 *       Converts to level: 0-10 = LOW, 11-20 = MEDIUM, 20+ = HIGH.
 *     tags:
 *       - Dashboard Analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Workload lists retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserWorkload'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient roles)
 */
dashboardRouter.get(
  '/workload',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.MANAGER]),
  dashboardController.getWorkload
);

export default dashboardRouter;
