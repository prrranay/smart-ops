import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.config';

export class NotificationRepository {
  /**
   * Creates a single notification record.
   */
  async create(data: Prisma.NotificationUncheckedCreateInput) {
    return prisma.notification.create({ data });
  }

  /**
   * Creates multiple notification records (bulk insert).
   */
  async createMany(dataList: Prisma.NotificationUncheckedCreateInput[]) {
    return prisma.notification.createMany({
      data: dataList,
    });
  }

  /**
   * Retrieves a single notification by its ID.
   */
  async findById(id: string) {
    return prisma.notification.findUnique({
      where: { id },
    });
  }

  /**
   * Retrieves paginated list of notifications for a specific user, with optional isRead filtering.
   */
  async findAndCountAll(
    userId: string,
    isRead: boolean | undefined,
    skip: number,
    limit: number
  ) {
    const where: Prisma.NotificationWhereInput = {
      userId,
    };

    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    const [notifications, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return { notifications, totalCount };
  }

  /**
   * Updates read status of a single notification.
   */
  async updateReadStatus(id: string, isRead: boolean) {
    return prisma.notification.update({
      where: { id },
      data: { isRead },
    });
  }

  /**
   * Marks all notifications of a user as read.
   */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }
}

// Export singleton instance
export const notificationRepository = new NotificationRepository();
