import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import { userRepository, UserRepository } from '../../repositories/user.repository';
import { env } from '../../config/env.config';
import { UserResponseDto, AuthResponseDto } from './auth.dto';
import { ConflictError, UnauthorizedError, NotFoundError } from '../../utils/app-error';

export class AuthService {
  private readonly userRepo: UserRepository;

  constructor(userRepo = userRepository) {
    this.userRepo = userRepo;
  }

  /**
   * Registers a new user in the system.
   */
  async signup(data: {
    email: string;
    name: string;
    password: string;
    role?: 'USER' | 'ADMIN' | 'MANAGER';
  }): Promise<AuthResponseDto> {
    // 1. Check if user already exists
    const existingUser = await this.userRepo.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('A user with this email address already exists');
    }

    // 2. Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    // 3. Create user in database
    const newUser = await this.userRepo.create({
      email: data.email,
      name: data.name,
      password: hashedPassword,
      role: data.role || 'USER',
    });

    // 4. Generate access and refresh tokens
    const accessToken = this.generateToken(newUser);
    const refreshToken = this.generateRefreshToken(newUser);

    return {
      user: this.mapToUserDto(newUser),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Authenticates an existing user.
   */
  async login(data: { email: string; password: string }): Promise<AuthResponseDto> {
    // 1. Fetch user by email
    const user = await this.userRepo.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // 2. Validate password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // 3. Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedError('Your account has been deactivated. Please contact support.');
    }

    // 4. Generate access and refresh tokens
    const accessToken = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      user: this.mapToUserDto(user),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refreshes the access token using a valid refresh token.
   */
  async refresh(token: string): Promise<AuthResponseDto> {
    if (!token) {
      throw new UnauthorizedError('Refresh token is required');
    }

    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as { id: string };
      
      const user = await this.userRepo.findById(decoded.id);
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      if (!user.isActive) {
        throw new UnauthorizedError('Your account has been deactivated. Please contact support.');
      }

      const accessToken = this.generateToken(user);
      const refreshToken = this.generateRefreshToken(user);

      return {
        user: this.mapToUserDto(user),
        accessToken,
        refreshToken,
      };
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  /**
   * Fetches user details by ID.
   */
  async getCurrentUser(id: string): Promise<UserResponseDto> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.mapToUserDto(user);
  }

  /**
   * Helper to sign JWT access token.
   */
  private generateToken(user: User): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      env.JWT_SECRET,
      {
        expiresIn: env.JWT_EXPIRES_IN as any,
      }
    );
  }

  /**
   * Helper to sign JWT refresh token.
   */
  private generateRefreshToken(user: User): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      env.JWT_REFRESH_SECRET,
      {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
      }
    );
  }

  /**
   * Helper to map DB entity to DTO representation.
   */
  private mapToUserDto(user: User): UserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}

// Export singleton instance of AuthService
export const authService = new AuthService();
