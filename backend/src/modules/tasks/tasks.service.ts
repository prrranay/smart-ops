import { taskRepository, TaskWithCreatorAndAssignee } from '../../repositories/task.repository';
import { userRepository } from '../../repositories/user.repository';
import { NotFoundError, ForbiddenError } from '../../utils/app-error';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { activityService } from '../activities/activities.service';
import { notificationService } from '../notifications/notifications.service';
import { prisma } from '../../config/db.config';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskResponseDto,
  PaginatedTasksDto,
} from './tasks.dto';

export class TaskService {
  /**
   * Helper method to map internal database representation of a task to TaskResponseDto.
   */
  private mapToResponseDto(task: TaskWithCreatorAndAssignee): TaskResponseDto {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      createdBy: task.createdBy,
      assignedTo: task.assignedTo,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      creator: {
        id: task.creator.id,
        name: task.creator.name,
        email: task.creator.email,
      },
      assignee: task.assignee
        ? {
            id: task.assignee.id,
            name: task.assignee.name,
            email: task.assignee.email,
          }
        : null,
    };
  }

  /**
   * Helper method to evaluate and notify if an employee's active workload has become HIGH (score > 20).
   */
  private async checkAndAlertWorkload(userId: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user || !user.isActive) return;

    // Fetch user's active, non-completed tasks
    const activeTasks = await prisma.task.findMany({
      where: {
        assignedTo: userId,
        status: { not: 'DONE' },
      },
      select: { priority: true },
    });

    let score = 0;
    for (const t of activeTasks) {
      if (t.priority === 'HIGH') score += 3;
      else if (t.priority === 'MEDIUM') score += 2;
      else if (t.priority === 'LOW') score += 1;
    }

    if (score > 20) {
      await notificationService.triggerWorkloadHigh(user, score);
    }
  }

  /**
   * Create a new task. Restricted to ADMIN/MANAGER roles via middleware.
   */
  async createTask(data: CreateTaskDto, creatorId: string): Promise<TaskResponseDto> {
    // If assignee is specified, verify that the user exists in the database
    if (data.assignedTo) {
      const assigneeUser = await userRepository.findById(data.assignedTo);
      if (!assigneeUser) {
        throw new NotFoundError('Assigned user not found');
      }
    }

    const task = await taskRepository.create({
      title: data.title,
      description: data.description,
      priority: data.priority,
      dueDate: data.dueDate,
      createdBy: creatorId,
      assignedTo: data.assignedTo,
    });

    // Log activity
    await activityService.logActivity(creatorId, 'TASK_CREATED', 'TASK', task.id, {
      title: task.title,
    });

    // Trigger system notifications
    if (data.assignedTo) {
      await notificationService.triggerTaskAssigned(task, data.assignedTo);
      await this.checkAndAlertWorkload(data.assignedTo);
    }

    return this.mapToResponseDto(task);
  }

  /**
   * Retrieve a task by ID.
   * - ADMIN and MANAGER can view any task.
   * - USER can only view tasks assigned to them.
   */
  async getTaskById(
    id: string,
    currentUserId: string,
    currentUserRole: string
  ): Promise<TaskResponseDto> {
    const task = await taskRepository.findById(id);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Role-based visibility check
    if (currentUserRole === 'USER' && task.assignedTo !== currentUserId) {
      throw new ForbiddenError('You do not have permission to view this task');
    }

    return this.mapToResponseDto(task);
  }

  /**
   * Update task general fields (title, description, priority, dueDate).
   * Restricted to ADMIN/MANAGER roles via middleware.
   */
  async updateTask(id: string, data: UpdateTaskDto, updaterId: string): Promise<TaskResponseDto> {
    const task = await taskRepository.findById(id);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    const updatedTask = await taskRepository.update(id, {
      title: data.title,
      description: data.description,
      priority: data.priority,
      dueDate: data.dueDate,
    });

    // Log activity
    await activityService.logActivity(updaterId, 'TASK_UPDATED', 'TASK', updatedTask.id, {
      title: updatedTask.title,
      previous: {
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate,
      },
    });

    return this.mapToResponseDto(updatedTask);
  }

  /**
   * Assign or unassign a task.
   * Restricted to ADMIN/MANAGER roles via middleware.
   */
  async assignTask(
    id: string,
    assignedTo: string | null,
    updaterId: string
  ): Promise<TaskResponseDto> {
    const task = await taskRepository.findById(id);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // If assignedTo is specified, verify that the user exists in the database
    if (assignedTo) {
      const assigneeUser = await userRepository.findById(assignedTo);
      if (!assigneeUser) {
        throw new NotFoundError('Assigned user not found');
      }
    }

    const updatedTask = await taskRepository.update(id, {
      assignedTo,
    });

    // Log activity
    await activityService.logActivity(updaterId, 'TASK_ASSIGNED', 'TASK', updatedTask.id, {
      assignedTo,
      previousAssignedTo: task.assignedTo,
    });

    // Trigger system notifications
    if (assignedTo && assignedTo !== task.assignedTo) {
      await notificationService.triggerTaskAssigned(updatedTask, assignedTo);
      await this.checkAndAlertWorkload(assignedTo);
    }

    return this.mapToResponseDto(updatedTask);
  }

  /**
   * Change status of a task.
   * - ADMIN and MANAGER can change status of any task.
   * - USER can only change status of tasks assigned to them.
   */
  async changeStatus(
    id: string,
    status: TaskStatus,
    currentUserId: string,
    currentUserRole: string
  ): Promise<TaskResponseDto> {
    const task = await taskRepository.findById(id);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Check permissions
    if (currentUserRole === 'USER' && task.assignedTo !== currentUserId) {
      throw new ForbiddenError('You do not have permission to update this task status');
    }

    const updatedTask = await taskRepository.update(id, {
      status,
    });

    // Log activity
    await activityService.logActivity(currentUserId, 'TASK_STATUS_CHANGED', 'TASK', updatedTask.id, {
      status,
      previousStatus: task.status,
    });

    // Trigger system notifications
    if (status !== task.status) {
      await notificationService.triggerTaskStatusChanged(updatedTask, task.status, status);
      if (updatedTask.assignedTo) {
        await this.checkAndAlertWorkload(updatedTask.assignedTo);
      }
    }

    return this.mapToResponseDto(updatedTask);
  }

  /**
   * List tasks with filtering and pagination.
   * - ADMIN/MANAGER see all tasks by default, can filter by status, priority, assignee.
   * - USER only sees their assigned tasks, can filter by status, priority.
   */
  async listTasks(
    filters: {
      status?: TaskStatus;
      priority?: TaskPriority;
      assignedTo?: string;
    },
    page: number,
    limit: number,
    currentUserId: string,
    currentUserRole: string
  ): Promise<PaginatedTasksDto> {
    const where: any = {};

    // Apply query filters
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.priority) {
      where.priority = filters.priority;
    }

    // Role-based filtering
    if (currentUserRole === 'USER') {
      // Regular user can only see their assigned tasks
      where.assignedTo = currentUserId;
    } else {
      // Admin/Manager can filter by assignedTo
      if (filters.assignedTo) {
        where.assignedTo = filters.assignedTo;
      }
    }

    const skip = (page - 1) * limit;
    const take = limit;

    const [tasks, totalCount] = await Promise.all([
      taskRepository.findMany(where, skip, take),
      taskRepository.count(where),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      tasks: tasks.map((t) => this.mapToResponseDto(t)),
      page,
      limit,
      totalCount,
      totalPages,
    };
  }
}

// Export a singleton instance of the service
export const taskService = new TaskService();
