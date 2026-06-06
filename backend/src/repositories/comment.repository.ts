import { prisma } from '../config/db.config';
import { Comment, Prisma } from '@prisma/client';

export type CommentWithAuthor = Comment & {
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export class CommentRepository {
  /**
   * Create a new comment on a task.
   * Includes the author's public profile fields.
   */
  async create(data: Prisma.CommentUncheckedCreateInput): Promise<CommentWithAuthor> {
    return prisma.comment.create({
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
    }) as Promise<CommentWithAuthor>;
  }

  /**
   * Find paginated comments for a specific task.
   * Sorted chronologically (ascending).
   */
  async findManyByTaskId(
    taskId: string,
    skip: number,
    take: number
  ): Promise<CommentWithAuthor[]> {
    return prisma.comment.findMany({
      where: { taskId },
      skip,
      take,
      orderBy: {
        createdAt: 'asc',
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
    }) as Promise<CommentWithAuthor[]>;
  }

  /**
   * Count the total number of comments associated with a task.
   */
  async countByTaskId(taskId: string): Promise<number> {
    return prisma.comment.count({
      where: { taskId },
    });
  }
}

// Export a singleton instance of the repository
export const commentRepository = new CommentRepository();
