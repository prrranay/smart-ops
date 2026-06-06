import { prisma } from '../config/db.config';
import { Task, Prisma } from '@prisma/client';

export type TaskWithCreatorAndAssignee = Task & {
  creator: {
    id: string;
    name: string;
    email: string;
  };
  assignee: {
    id: string;
    name: string;
    email: string;
  } | null;
};

const userSelect = {
  id: true,
  name: true,
  email: true,
};

export class TaskRepository {

  async findById(id: string): Promise<TaskWithCreatorAndAssignee | null> {
    return prisma.task.findUnique({
      where: { id },
      include: {
        creator: { select: userSelect },
        assignee: { select: userSelect },
      },
    }) as Promise<TaskWithCreatorAndAssignee | null>;
  }

  async create(data: Prisma.TaskUncheckedCreateInput): Promise<TaskWithCreatorAndAssignee> {
    return prisma.task.create({
      data,
      include: {
        creator: { select: userSelect },
        assignee: { select: userSelect },
      },
    }) as Promise<TaskWithCreatorAndAssignee>;
  }

  async update(
    id: string,
    data: Prisma.TaskUncheckedUpdateInput
  ): Promise<TaskWithCreatorAndAssignee> {
      return prisma.task.update({
        where: { id },
        data,
        include: {
          creator: { select: userSelect },
          assignee: { select: userSelect },
        },
      }) as Promise<TaskWithCreatorAndAssignee>;
  }

  async findMany(
    where: Prisma.TaskWhereInput,
    skip: number,
    take: number
  ): Promise<TaskWithCreatorAndAssignee[]> {
    return prisma.task.findMany({
      where,
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        creator: { select: userSelect },
        assignee: { select: userSelect },
      },
    }) as Promise<TaskWithCreatorAndAssignee[]>;
  }

  async count(where: Prisma.TaskWhereInput): Promise<number> {
    return prisma.task.count({
      where,
    });
  }
}

export const taskRepository = new TaskRepository();
