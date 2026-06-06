import { Request, Response } from 'express';
import { commentService } from './comments.service';
import { asyncHandler } from '../../utils/async-handler';

export class CommentController {
  /**
   * Controller to add a new comment to a task.
   * Path: POST /tasks/:taskId/comments
   */
  addComment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { taskId } = req.params;
    const { content } = req.body;
    
    // User context is guaranteed by the authenticate middleware
    const userId = req.user!.id;

    const comment = await commentService.addComment(taskId, userId, content);

    res.status(201).json({
      status: 'success',
      data: comment,
    });
  });

  /**
   * Controller to list comments on a task with pagination.
   * Path: GET /tasks/:taskId/comments
   */
  listComments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { taskId } = req.params;
    
    // Zod transforms query strings to numbers in validation
    const page = (req.query.page as unknown) as number;
    const limit = (req.query.limit as unknown) as number;

    const result = await commentService.listComments(taskId, page, limit);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  });
}

// Export a singleton instance of the controller
export const commentController = new CommentController();
