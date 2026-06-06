import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validation.middleware';
import { signupSchema, loginSchema } from './auth.schema';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { UserRole } from '../../types/role.enum';

const authRouter = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     User:
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
 *         role:
 *           type: string
 *           enum: [USER, ADMIN, MANAGER]
 *           example: USER
 *         isActive:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2026-06-04T18:00:00.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2026-06-04T18:00:00.000Z
 *     AuthResponse:
 *       type: object
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/User'
 *         accessToken:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */

/**
 * @openapi
 * /api/v1/auth/members:
 *   post:
 *     summary: Create a new team member
 *     description: Restricted to ADMIN and MANAGER roles.
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *                 description: Full name of the user.
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *                 description: A unique email address.
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecureP@ss123
 *                 description: Must be at least 8 characters.
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN, MANAGER]
 *                 example: USER
 *                 description: User role (defaults to USER).
 *     responses:
 *       201:
 *         description: Member created successfully
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation failed or request payload is invalid
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - insufficient permissions
 *       409:
 *         description: Conflict - email is already in use
 */
authRouter.post(
  '/members',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.MANAGER]),
  validate(signupSchema),
  authController.createMember
);

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     summary: Authenticate user credentials and return a token
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecureP@ss123
 *     responses:
 *       200:
 *         description: Authentication successful, token issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Invalid credentials
 */
authRouter.post('/login', validate(loginSchema), authController.login);

/**
 * @openapi
 * /api/v1/auth/me:
 *   get:
 *     summary: Retrieve profile details for the authenticated session
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile details retrieved successfully
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - missing or expired JWT token
 */
authRouter.get('/me', authenticate, authController.me);

/**
 * @openapi
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh the access token using the refresh token cookie
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Token refreshed successfully
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Invalid or missing refresh token
 */
authRouter.post('/refresh', authController.refresh);

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     summary: Log out the user and clear the refresh token cookie
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Logged out successfully
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
 *                   example: Logged out successfully
 */
authRouter.post('/logout', authController.logout);

export default authRouter;
