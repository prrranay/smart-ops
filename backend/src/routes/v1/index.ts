import { Router } from 'express';
import authRouter from '../../modules/auth/auth.routes';
import commentsRouter from '../../modules/comments/comments.routes';
import tasksRouter from '../../modules/tasks/tasks.routes';
import activitiesRouter from '../../modules/activities/activities.routes';
import dashboardRouter from '../../modules/dashboard/dashboard.routes';
import notificationsRouter from '../../modules/notifications/notifications.routes';

const v1Router = Router();

// Mount authentication module routes
v1Router.use('/auth', authRouter);

// Mount task collaboration module routes
v1Router.use('/tasks', tasksRouter);
v1Router.use('/tasks', commentsRouter);

// Mount activity logging timeline routes
v1Router.use('/activities', activitiesRouter);

// Mount dashboard analytics routes
v1Router.use('/dashboard', dashboardRouter);

// Mount system notification routes
v1Router.use('/notifications', notificationsRouter);

/**
 * GET /api/v1/health
 * Public health check endpoint for monitoring system status.
 */
v1Router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'System is healthy',
    timestamp: new Date().toISOString(),
  });
});

export default v1Router;
