import { Request, Response } from 'express';
import { taskService } from './tasks.service';
import { asyncHandler } from '../../utils/async-handler';
import { TaskStatus, TaskPriority } from '@prisma/client';

export class TaskController {
  /**
   * Create a new task.
   * Path: POST /tasks
   */
  createTask = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Current user context is injected by the authenticate middleware
    const creatorId = req.user!.id;

    const task = await taskService.createTask(req.body, creatorId);

    res.status(201).json({
      status: 'success',
      data: task,
    });
  });

  /**
   * Retrieve a task by ID.
   * Path: GET /tasks/:id
   */
  getTaskById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const currentUserId = req.user!.id;
    const currentUserRole = req.user!.role;

    const task = await taskService.getTaskById(id, currentUserId, currentUserRole);

    res.status(200).json({
      status: 'success',
      data: task,
    });
  });

  /**
   * Update general fields of a task.
   * Path: PATCH /tasks/:id
   */
  updateTask = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const updaterId = req.user!.id;

    const task = await taskService.updateTask(id, req.body, updaterId);

    res.status(200).json({
      status: 'success',
      data: task,
    });
  });

  /**
   * Assign or unassign a user to/from a task.
   * Path: POST /tasks/:id/assign
   */
  assignTask = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { assignedTo } = req.body;
    const updaterId = req.user!.id;

    const task = await taskService.assignTask(id, assignedTo, updaterId);

    res.status(200).json({
      status: 'success',
      data: task,
    });
  });

  /**
   * Change status of a task.
   * Path: PATCH /tasks/:id/status
   */
  changeStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body;
    const currentUserId = req.user!.id;
    const currentUserRole = req.user!.role;

    const task = await taskService.changeStatus(id, status, currentUserId, currentUserRole);

    res.status(200).json({
      status: 'success',
      data: task,
    });
  });

  /**
   * List tasks with pagination and filters.
   * Path: GET /tasks
   */
  listTasks = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const currentUserId = req.user!.id;
    const currentUserRole = req.user!.role;

    // Zod transforms query strings to numbers/types in validation
    const page = (req.query.page as unknown) as number;
    const limit = (req.query.limit as unknown) as number;
    const status = req.query.status as TaskStatus | undefined;
    const priority = req.query.priority as TaskPriority | undefined;
    const assignedTo = req.query.assignedTo as string | undefined;

    const result = await taskService.listTasks(
      { status, priority, assignedTo },
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
export const taskController = new TaskController();
