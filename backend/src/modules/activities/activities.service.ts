import {
  activityLogRepository,
  ActivityLogWithUser,
} from '../../repositories/activity-log.repository';
import { PaginatedActivitiesDto, ActivityLogResponseDto } from './activities.dto';

export class ActivityLogService {
  /**
   * Helper to map database model to ActivityLogResponseDto.
   */
  private mapToResponseDto(log: ActivityLogWithUser): ActivityLogResponseDto {
    return {
      id: log.id,
      userId: log.userId,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      metadata: log.metadata,
      createdAt: log.createdAt,
      user: {
        id: log.user.id,
        name: log.user.name,
        email: log.user.email,
      },
    };
  }

  /**
   * Add a new entry to the activity audit trail.
   */
  async logActivity(
    userId: string,
    action: string,
    entityType: string,
    entityId?: string | null,
    metadata?: any
  ): Promise<ActivityLogResponseDto> {
    const log = await activityLogRepository.create({
      userId,
      action,
      entityType,
      entityId: entityId || null,
      metadata: metadata || null,
    });

    return this.mapToResponseDto(log);
  }

  /**
   * Query the timeline of activities.
   * - ADMIN and MANAGER can see all activities and filter by any userId.
   * - USER can only see their own activities.
   */
  async listActivities(
    filters: {
      userId?: string;
      action?: string;
      entityType?: string;
    },
    page: number,
    limit: number,
    currentUserId: string,
    currentUserRole: string
  ): Promise<PaginatedActivitiesDto> {
    const where: any = {};

    // Enforce role visibility constraints
    if (currentUserRole === 'USER') {
      where.userId = currentUserId;
    } else {
      if (filters.userId) {
        where.userId = filters.userId;
      }
    }

    // Apply optional queries filters
    if (filters.action) {
      where.action = filters.action;
    }
    if (filters.entityType) {
      where.entityType = filters.entityType;
    }

    const skip = (page - 1) * limit;
    const take = limit;

    const [logs, totalCount] = await Promise.all([
      activityLogRepository.findMany(where, skip, take),
      activityLogRepository.count(where),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      activities: logs.map((log) => this.mapToResponseDto(log)),
      page,
      limit,
      totalCount,
      totalPages,
    };
  }
}

// Export a singleton instance of the service
export const activityLogService = new ActivityLogService();
export const activityService = activityLogService; // alias for ease of use
