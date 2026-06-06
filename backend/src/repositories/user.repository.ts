import { prisma } from '../config/db.config';
import { User, Prisma } from '@prisma/client';

export class UserRepository {

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    // create user record
    return prisma.user.create({
      data,
    });
  }
}

export const userRepository = new UserRepository();
