import { prisma } from '../config/db.config';
import { ActivityLog, Prisma } from '@prisma/client';

export type ActivityLogWithUser = ActivityLog & {
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export class ActivityLogRepository {
  /**
   * Create a new activity log record.
   * @param data Activity log creation fields
   */
  async create(data: Prisma.ActivityLogUncheckedCreateInput): Promise<ActivityLogWithUser> {
    return prisma.activityLog.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }) as Promise<ActivityLogWithUser>;
  }

  /**
   * Retrieve filtered and paginated activity logs, sorted newest first.
   */
  async findMany(
    where: Prisma.ActivityLogWhereInput,
    skip: number,
    take: number
  ): Promise<ActivityLogWithUser[]> {
    return prisma.activityLog.findMany({
      where,
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }) as Promise<ActivityLogWithUser[]>;
  }

  /**
   * Count the total number of activity logs matching the criteria.
   */
  async count(where: Prisma.ActivityLogWhereInput): Promise<number> {
    return prisma.activityLog.count({
      where,
    });
  }
}

// Export a singleton instance of the repository
export const activityLogRepository = new ActivityLogRepository();
