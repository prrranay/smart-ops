import { NotificationType } from '@prisma/client';

export interface NotificationResponseDto {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: any;
  createdAt: Date;
}

export interface NotificationListResponseDto {
  notifications: NotificationResponseDto[];
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}
