import { Router } from 'express';
import { commentController } from './comments.controller';
import { validate } from '../../middleware/validation.middleware';
import { createCommentSchema, listCommentsSchema } from './comments.schema';
import { authenticate } from '../../middleware/auth.middleware';

const commentsRouter = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     CommentAuthor:
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
 *     Comment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee
 *         taskId:
 *           type: string
 *           format: uuid
 *           example: 11111111-2222-3333-4444-555555555555
 *         userId:
 *           type: string
 *           format: uuid
 *           example: 550e8400-e29b-41d4-a716-446655440000
 *         content:
 *           type: string
 *           example: This task is blocking my work on the login page.
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2026-06-04T18:00:00.000Z
 *         author:
 *           $ref: '#/components/schemas/CommentAuthor'
 *     PaginatedComments:
 *       type: object
 *       properties:
 *         comments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Comment'
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
 * /api/v1/tasks/{taskId}/comments:
 *   post:
 *     summary: Add a comment to a task
 *     tags:
 *       - Task Collaboration
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
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
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: I have started working on this item.
 *     responses:
 *       201:
 *         description: Comment successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Validation failed (e.g. empty content or invalid UUID format)
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: Task not found
 */
commentsRouter.post(
  '/:taskId/comments',
  authenticate,
  validate(createCommentSchema),
  commentController.addComment
);

/**
 * @openapi
 * /api/v1/tasks/{taskId}/comments:
 *   get:
 *     summary: Retrieve a list of comments for a task
 *     tags:
 *       - Task Collaboration
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique UUID of the task.
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
 *     responses:
 *       200:
 *         description: A paginated list of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/PaginatedComments'
 *       400:
 *         description: Validation failed (e.g. invalid query parameters or invalid UUID format)
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: Task not found
 */
commentsRouter.get(
  '/:taskId/comments',
  authenticate,
  validate(listCommentsSchema),
  commentController.listComments
);

export default commentsRouter;
