import { NotificationType, Task, Comment, User, UserRole } from '@prisma/client';
import { notificationRepository } from '../../repositories/notification.repository';
import { prisma } from '../../config/db.config';
import { NotFoundError, ForbiddenError } from '../../utils/app-error';
import { NotificationListResponseDto, NotificationResponseDto } from './notifications.dto';

export class NotificationService {
  /**
   * Lists notifications for a given user with optional filtering by read status.
   */
  async listNotifications(
    userId: string,
    isRead: boolean | undefined,
    page: number,
    limit: number
  ): Promise<NotificationListResponseDto> {
    const skip = (page - 1) * limit;

    const { notifications, totalCount } = await notificationRepository.findAndCountAll(
      userId,
      isRead,
      skip,
      limit
    );

    const totalPages = Math.ceil(totalCount / limit);

    return {
      notifications: notifications.map((n) => this.mapToResponseDto(n)),
      page,
      limit,
      totalCount,
      totalPages,
    };
  }

  /**
   * Marks a single notification as read, validating ownership.
   */
  async markAsRead(id: string, userId: string): Promise<NotificationResponseDto> {
    const notification = await notificationRepository.findById(id);

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenError('You do not have permission to modify this notification');
    }

    const updated = await notificationRepository.updateReadStatus(id, true);
    return this.mapToResponseDto(updated);
  }

  /**
   * Marks all notifications of a user as read.
   */
  async markAllAsRead(userId: string): Promise<void> {
    await notificationRepository.markAllAsRead(userId);
  }

  /**
   * Low-level helper to create a database notification.
   */
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    metadata?: any
  ): Promise<NotificationResponseDto> {
    const notification = await notificationRepository.create({
      userId,
      type,
      title,
      message,
      metadata: metadata || null,
    });
    return this.mapToResponseDto(notification);
  }

  /**
   * Trigger: Task Assigned. Notify the assigned user.
   */
  async triggerTaskAssigned(task: Task, assignedToUserId: string): Promise<void> {
    await this.createNotification(
      assignedToUserId,
      NotificationType.TASK_ASSIGNED,
      'New Task Assigned',
      `You have been assigned a new task: "${task.title}".`,
      { taskId: task.id }
    );
  }

  /**
   * Trigger: Task Status Changed. Notify the task creator.
   */
  async triggerTaskStatusChanged(
    task: Task,
    oldStatus: string,
    newStatus: string
  ): Promise<void> {
    await this.createNotification(
      task.createdBy,
      NotificationType.TASK_STATUS_CHANGED,
      'Task Status Changed',
      `The task "${task.title}" status has changed from ${oldStatus} to ${newStatus}.`,
      { taskId: task.id, oldStatus, newStatus }
    );
  }

  /**
   * Trigger: Comment Added. Notify task creator and task assignee.
   */
  async triggerCommentAdded(comment: Comment, task: Task, authorName: string): Promise<void> {
    const targetUserIds = new Set<string>();

    // Notify task creator (if they did not author the comment)
    if (task.createdBy !== comment.userId) {
      targetUserIds.add(task.createdBy);
    }

    // Notify task assignee (if they did not author the comment)
    if (task.assignedTo && task.assignedTo !== comment.userId) {
      targetUserIds.add(task.assignedTo);
    }

    // Bulk creation using repository
    const dataList = Array.from(targetUserIds).map((userId) => ({
      userId,
      type: NotificationType.TASK_COMMENT_ADDED,
      title: 'New Comment Added',
      message: `${authorName} added a comment on task "${task.title}": "${comment.content.substring(0, 50)}..."`,
      metadata: { taskId: task.id, commentId: comment.id },
    }));

    if (dataList.length > 0) {
      await notificationRepository.createMany(dataList);
    }
  }

  /**
   * Trigger: Workload High. Notify all managers and admins.
   */
  async triggerWorkloadHigh(employeeUser: User, score: number): Promise<void> {
    // Retrieve all active Admins and Managers
    const managers = await prisma.user.findMany({
      where: {
        role: {
          in: [UserRole.ADMIN, UserRole.MANAGER],
        },
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    const dataList = managers.map((manager) => ({
      userId: manager.id,
      type: NotificationType.WORKLOAD_HIGH,
      title: 'High Workload Alert',
      message: `Employee "${employeeUser.name}" has reached a HIGH workload score of ${score} points.`,
      metadata: { employeeUserId: employeeUser.id, score },
    }));

    if (dataList.length > 0) {
      await notificationRepository.createMany(dataList);
    }
  }

  /**
   * Trigger: Due Soon scheduled placeholder definition.
   */
  async checkDueSoonPlaceholder(): Promise<void> {
    // Simulation / future job design notes:
    // In production, a repeating worker (e.g. BullMQ / node-cron repeating hourly)
    // would run this query:
    // const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    // const dueSoonTasks = await prisma.task.findMany({ where: { dueDate: { lte: tomorrow }, status: { not: 'DONE' } } });
    // And dispatch TASK_DUE_SOON notifications to assignees.
    console.log('[NotificationService Cron Simulation] Evaluating task deadlines due soon...');
  }

  private mapToResponseDto(notification: any): NotificationResponseDto {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      metadata: notification.metadata,
      createdAt: notification.createdAt,
    };
  }
}

export const notificationService = new NotificationService();
