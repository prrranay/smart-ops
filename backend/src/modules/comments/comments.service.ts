import { commentRepository, CommentWithAuthor } from '../../repositories/comment.repository';
import { taskRepository } from '../../repositories/task.repository';
import { NotFoundError } from '../../utils/app-error';
import { CommentResponseDto, PaginatedCommentsDto } from './comments.dto';
import { activityService } from '../activities/activities.service';
import { notificationService } from '../notifications/notifications.service';

export class CommentService {
  /**
   * Helper method to map internal db comment with author to CommentResponseDto.
   */
  private mapToResponseDto(comment: CommentWithAuthor): CommentResponseDto {
    return {
      id: comment.id,
      taskId: comment.taskId,
      userId: comment.userId,
      content: comment.content,
      createdAt: comment.createdAt,
      author: {
        id: comment.user.id,
        name: comment.user.name,
        email: comment.user.email,
      },
    };
  }

  /**
   * Add a comment to a task.
   * Checks that the task exists before creating.
   */
  async addComment(
    taskId: string,
    userId: string,
    content: string
  ): Promise<CommentResponseDto> {
    const task = await taskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    const newComment = await commentRepository.create({
      taskId,
      userId,
      content,
    });

    // Log activity
    await activityService.logActivity(userId, 'COMMENT_ADDED', 'COMMENT', newComment.id, {
      taskId,
      commentId: newComment.id,
    });

    // Trigger system notification
    await notificationService.triggerCommentAdded(newComment, task, newComment.user.name);

    return this.mapToResponseDto(newComment);
  }

  /**
   * List task comments with pagination.
   * Checks that the task exists.
   */
  async listComments(
    taskId: string,
    page: number,
    limit: number
  ): Promise<PaginatedCommentsDto> {
    const task = await taskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    const skip = (page - 1) * limit;
    const take = limit;

    const [comments, totalCount] = await Promise.all([
      commentRepository.findManyByTaskId(taskId, skip, take),
      commentRepository.countByTaskId(taskId),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      comments: comments.map((comment) => this.mapToResponseDto(comment)),
      page,
      limit,
      totalCount,
      totalPages,
    };
  }
}

// Export a singleton instance of the service
export const commentService = new CommentService();
