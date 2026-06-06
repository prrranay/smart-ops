export interface UserSummaryDto {
  id: string;
  name: string;
  email: string;
}

export interface ActivityLogResponseDto {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: any;
  createdAt: Date;
  user: UserSummaryDto;
}

export interface PaginatedActivitiesDto {
  activities: ActivityLogResponseDto[];
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}
