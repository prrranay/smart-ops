import { Router } from 'express';
import { notificationController } from './notifications.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { listNotificationsSchema, markReadSchema } from './notifications.schema';

const notificationsRouter = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: a40f288d-71b3-469b-8e2b-fceb205342a3
 *         userId:
 *           type: string
 *           format: uuid
 *           example: 892a50a8-2d22-4aed-8ce4-8370b5ef6896
 *         type:
 *           type: string
 *           enum: [TASK_ASSIGNED, TASK_STATUS_CHANGED, TASK_COMMENT_ADDED, TASK_DUE_SOON, WORKLOAD_HIGH]
 *           example: TASK_ASSIGNED
 *         title:
 *           type: string
 *           example: New Task Assigned
 *         message:
 *           type: string
 *           example: You have been assigned a new task "Review Project Architecture"
 *         isRead:
 *           type: boolean
 *           example: false
 *         metadata:
 *           type: object
 *           nullable: true
 *           example: { "taskId": "550e8400-e29b-41d4-a716-446655440000" }
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2026-06-04T18:00:00.000Z
 */

/**
 * @openapi
 * /api/v1/notifications:
 *   get:
 *     summary: Retrieve paginated notifications list for the authenticated user
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page index number.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of notifications to return.
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *         description: Optional read status filter (true or false).
 *     responses:
 *       200:
 *         description: Notifications list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     notifications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     totalCount:
 *                       type: integer
 *                       example: 25
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *       401:
 *         description: Unauthorized
 */
notificationsRouter.get(
  '/',
  authenticate,
  validate(listNotificationsSchema),
  notificationController.listNotifications
);

/**
 * @openapi
 * /api/v1/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications of the authenticated user as read
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications successfully marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: All notifications successfully marked as read
 *       401:
 *         description: Unauthorized
 */
notificationsRouter.patch(
  '/read-all',
  authenticate,
  notificationController.markAllAsRead
);

/**
 * @openapi
 * /api/v1/notifications/{id}/read:
 *   patch:
 *     summary: Mark a single notification as read
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the notification.
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (notification owned by another user)
 *       404:
 *         description: Notification not found
 */
notificationsRouter.patch(
  '/:id/read',
  authenticate,
  validate(markReadSchema),
  notificationController.markAsRead
);

export default notificationsRouter;
