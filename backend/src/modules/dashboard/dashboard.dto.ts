export interface DashboardSummaryDto {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  reviewTasks: number;
}

export interface UserWorkloadDto {
  userId: string;
  userName: string;
  score: number;
  workloadLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  openTasks: number;
  highPriorityTasks: number;
}
