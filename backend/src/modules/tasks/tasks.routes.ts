import { Router } from 'express';
import { taskController } from './tasks.controller';
import { validate } from '../../middleware/validation.middleware';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { UserRole } from '../../types/role.enum';
import {
  createTaskSchema,
  updateTaskSchema,
  assignTaskSchema,
  changeStatusSchema,
  getTaskSchema,
  listTasksSchema,
} from './tasks.schema';

const tasksRouter = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     UserSummary:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: 550e8400-e29b-41d4-a716-446655440000
 *         name:
 *           type: string
 *           example: John Doe
 *         email:
 *           type: string
 *           format: email
 *           example: john.doe@example.com
 *     Task:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: d0e74f10-18e4-4c8d-8a1a-c5c96bb43d67
 *         title:
 *           type: string
 *           example: Setup database indices
 *         description:
 *           type: string
 *           example: Add composite indices on tasks table for sorting performance.
 *         status:
 *           type: string
 *           enum: [TODO, IN_PROGRESS, REVIEW, DONE]
 *           example: TODO
 *         priority:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH]
 *           example: MEDIUM
 *         dueDate:
 *           type: string
 *           format: date-time
 *           example: 2026-06-15T18:00:00.000Z
 *           nullable: true
 *         createdBy:
 *           type: string
 *           format: uuid
 *           example: 550e8400-e29b-41d4-a716-446655440000
 *         assignedTo:
 *           type: string
 *           format: uuid
 *           example: 7aa352a6-13c3-4de6-af56-463462a67aab
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2026-06-04T18:00:00.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2026-06-04T18:00:00.000Z
 *         creator:
 *           $ref: '#/components/schemas/UserSummary'
 *         assignee:
 *           $ref: '#/components/schemas/UserSummary'
 *           nullable: true
 *     PaginatedTasks:
 *       type: object
 *       properties:
 *         tasks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Task'
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
 * /api/v1/tasks:
 *   post:
 *     summary: Create a new task (ADMIN or MANAGER only)
 *     tags:
 *       - Task Management
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: Setup database indices
 *               description:
 *                 type: string
 *                 example: Add composite indices on tasks table for sorting performance.
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *                 example: MEDIUM
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-06-15T18:00:00.000Z
 *               assignedTo:
 *                 type: string
 *                 format: uuid
 *                 example: 7aa352a6-13c3-4de6-af56-463462a67aab
 *     responses:
 *       201:
 *         description: Task successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Validation failed (e.g. invalid fields, incorrect priority enum)
 *       401:
 *         description: Unauthorized - missing/invalid token
 *       403:
 *         description: Forbidden - only ADMIN and MANAGER roles can create tasks
 *       404:
 *         description: Assigned user not found
 */
tasksRouter.post(
  '/',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.MANAGER]),
  validate(createTaskSchema),
  taskController.createTask
);

/**
 * @openapi
 * /api/v1/tasks:
 *   get:
 *     summary: Retrieve a paginated and filtered list of tasks
 *     tags:
 *       - Task Management
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [TODO, IN_PROGRESS, REVIEW, DONE]
 *         description: Filter tasks by status.
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH]
 *         description: Filter tasks by priority.
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter tasks by assigned user UUID (ADMIN/MANAGER only).
 *     responses:
 *       200:
 *         description: A paginated list of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/PaginatedTasks'
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 */
tasksRouter.get(
  '/',
  authenticate,
  validate(listTasksSchema),
  taskController.listTasks
);

/**
 * @openapi
 * /api/v1/tasks/{id}:
 *   get:
 *     summary: Retrieve a task by its ID
 *     tags:
 *       - Task Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique UUID of the task.
 *     responses:
 *       200:
 *         description: Task details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - USER role cannot view tasks not assigned to them
 *       404:
 *         description: Task not found
 */
tasksRouter.get(
  '/:id',
  authenticate,
  validate(getTaskSchema),
  taskController.getTaskById
);

/**
 * @openapi
 * /api/v1/tasks/{id}:
 *   patch:
 *     summary: Update general fields of a task (ADMIN or MANAGER only)
 *     tags:
 *       - Task Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique UUID of the task.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Setup database indexes
 *               description:
 *                 type: string
 *                 example: Updated task description
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *                 example: HIGH
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-06-20T18:00:00.000Z
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Validation failed or strict object check failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only ADMIN and MANAGER roles can update tasks
 *       404:
 *         description: Task not found
 */
tasksRouter.patch(
  '/:id',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.MANAGER]),
  validate(updateTaskSchema),
  taskController.updateTask
);

/**
 * @openapi
 * /api/v1/tasks/{id}/assign:
 *   post:
 *     summary: Assign or unassign a user to/from a task (ADMIN or MANAGER only)
 *     tags:
 *       - Task Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique UUID of the task.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assignedTo
 *             properties:
 *               assignedTo:
 *                 type: string
 *                 format: uuid
 *                 example: 7aa352a6-13c3-4de6-af56-463462a67aab
 *                 nullable: true
 *                 description: User UUID to assign, or null to unassign.
 *     responses:
 *       200:
 *         description: Task assignment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only ADMIN and MANAGER roles can assign tasks
 *       404:
 *         description: Task or User not found
 */
tasksRouter.post(
  '/:id/assign',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.MANAGER]),
  validate(assignTaskSchema),
  taskController.assignTask
);

/**
 * @openapi
 * /api/v1/tasks/{id}/status:
 *   patch:
 *     summary: Update the status of a task
 *     description: Admins and Managers can update status of any task. Regular Users can only update status of tasks assigned to them.
 *     tags:
 *       - Task Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique UUID of the task.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, REVIEW, DONE]
 *                 example: IN_PROGRESS
 *     responses:
 *       200:
 *         description: Task status changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - USER role cannot update status of tasks not assigned to them
 *       404:
 *         description: Task not found
 */
tasksRouter.patch(
  '/:id/status',
  authenticate,
  validate(changeStatusSchema),
  taskController.changeStatus
);

export default tasksRouter;
