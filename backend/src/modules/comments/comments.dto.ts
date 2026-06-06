export interface CommentAuthorDto {
  id: string;
  name: string;
  email: string;
}

export interface CommentResponseDto {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: Date;
  author: CommentAuthorDto;
}

export interface PaginatedCommentsDto {
  comments: CommentResponseDto[];
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}
