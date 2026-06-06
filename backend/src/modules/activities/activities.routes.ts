import { Router } from 'express';
import { activityLogController } from './activities.controller';
import { validate } from '../../middleware/validation.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { listActivitiesSchema } from './activities.schema';

const activitiesRouter = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     ActivityLog:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: c2a8cf24-9dd2-4972-9766-fe16e1078e33
 *         userId:
 *           type: string
 *           format: uuid
 *           example: 550e8400-e29b-41d4-a716-446655440000
 *         action:
 *           type: string
 *           example: TASK_CREATED
 *         entityType:
 *           type: string
 *           example: TASK
 *         entityId:
 *           type: string
 *           format: uuid
 *           example: d0e74f10-18e4-4c8d-8a1a-c5c96bb43d67
 *           nullable: true
 *         metadata:
 *           type: object
 *           example: { "title": "Setup database indices" }
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2026-06-04T18:00:00.000Z
 *         user:
 *           $ref: '#/components/schemas/UserSummary'
 *     PaginatedActivities:
 *       type: object
 *       properties:
 *         activities:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ActivityLog'
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 10
 *         totalCount:
 *           type: integer
 *           example: 1
 *         totalPages:
 *           type: integer
 *           example: 1
 */

/**
 * @openapi
 * /api/v1/activities:
 *   get:
 *     summary: Retrieve a paginated and filtered timeline of activities
 *     description: |
 *       Admins and Managers can view all logs and filter by any userId.
 *       Regular Users can only view activities that they performed (automatically forced).
 *     tags:
 *       - Activity Audit Trail
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number to fetch.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of items to return per page.
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter logs by user UUID (ADMIN/MANAGER only).
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter logs by specific action type (e.g. TASK_CREATED).
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *         description: Filter logs by entity type (e.g. TASK or COMMENT).
 *     responses:
 *       200:
 *         description: A paginated timeline of activities
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/PaginatedActivities'
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 */
activitiesRouter.get(
  '/',
  authenticate,
  validate(listActivitiesSchema),
  activityLogController.listActivities
);

export default activitiesRouter;
