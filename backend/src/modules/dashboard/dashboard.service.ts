import { prisma } from '../../config/db.config';
import { DashboardSummaryDto, UserWorkloadDto } from './dashboard.dto';

export class DashboardService {
  /**
   * Retrieves summary count metrics for tasks in the system.
   * Optimizes performance using Prisma's groupBy aggregation.
   */
  async getSummary(): Promise<DashboardSummaryDto> {
    // Single database query returning counts grouped by task status
    const statusCounts = await prisma.task.groupBy({
      by: ['status'],
      _count: {
        _all: true,
      },
    });

    // Sum overall count of tasks across all statuses
    const totalTasks = statusCounts.reduce((acc, curr) => acc + curr._count._all, 0);

    const countsMap = {
      TODO: 0,
      IN_PROGRESS: 0,
      REVIEW: 0,
      DONE: 0,
    };

    for (const item of statusCounts) {
      countsMap[item.status] = item._count._all;
    }

    return {
      totalTasks,
      completedTasks: countsMap.DONE,
      pendingTasks: countsMap.TODO,
      inProgressTasks: countsMap.IN_PROGRESS,
      reviewTasks: countsMap.REVIEW,
    };
  }

  /**
   * Calculates workload scores and levels for all active users.
   * Help managers avoid overloading team members.
   */
  async getWorkload(): Promise<UserWorkloadDto[]> {
    // Fetch users along with their active, non-completed tasks (TODO, IN_PROGRESS, REVIEW).
    // Selects only the 'priority' field to reduce database payload overhead.
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        assignedTasks: {
          where: {
            status: {
              not: 'DONE',
            },
          },
          select: {
            priority: true,
          },
        },
      },
    });

    /**
     * Algorithm Explanation:
     * 1. Iterates through each user's assigned active tasks.
     * 2. Accumulates workload points based on task priority weights:
     *    - HIGH Priority = 3 Points
     *    - MEDIUM Priority = 2 Points
     *    - LOW Priority = 1 Point
     * 3. Determines workload level based on cumulative score brackets:
     *    - [0 - 10] points  => LOW workload level
     *    - [11 - 20] points => MEDIUM workload level
     *    - [21+] points     => HIGH workload level (greater than 20 points)
     */
    return users.map((user) => {
      let score = 0;
      for (const task of user.assignedTasks) {
        if (task.priority === 'HIGH') {
          score += 3;
        } else if (task.priority === 'MEDIUM') {
          score += 2;
        } else if (task.priority === 'LOW') {
          score += 1;
        }
      }

      let workloadLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      if (score > 20) {
        workloadLevel = 'HIGH';
      } else if (score >= 11) {
        workloadLevel = 'MEDIUM';
      }

      const openTasks = user.assignedTasks.length;
      const highPriorityTasks = user.assignedTasks.filter(t => t.priority === 'HIGH').length;

      return {
        userId: user.id,
        userName: user.name,
        score,
        workloadLevel,
        openTasks,
        highPriorityTasks,
      };
    });
  }
}

// Export a singleton instance of the service
export const dashboardService = new DashboardService();
