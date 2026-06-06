import { Request, Response } from 'express';
import { authService, AuthService } from './auth.service';
import { asyncHandler } from '../../utils/async-handler';
import { StatusCodes } from 'http-status-codes';

export class AuthController {
  private readonly service: AuthService;

  constructor(service = authService) {
    this.service = service;
  }

  /**
   * Helper to set access token cookie
   */
  private setAccessTokenCookie(res: Response, token: string): void {
    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day (matches 1d expiry)
    });
  }

  /**
   * Helper to clear access token cookie
   */
  private clearAccessTokenCookie(res: Response): void {
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }

  /**
   * Helper to set refresh token cookie
   */
  private setRefreshTokenCookie(res: Response, token: string): void {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  /**
   * Helper to clear refresh token cookie
   */
  private clearRefreshTokenCookie(res: Response): void {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }

  /**
   * Registers a new user account.
   */
  signup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, email, password, role } = req.body;
    
    const result = await this.service.signup({
      name,
      email,
      password,
      role,
    });

    const { accessToken, refreshToken, user } = result;
    this.setAccessTokenCookie(res, accessToken);
    this.setRefreshTokenCookie(res, refreshToken);

    res.status(StatusCodes.CREATED).json({
      status: 'success',
      data: { user },
    });
  });

  /**
   * Creates a new team member. Restricts cookie modification.
   */
  createMember = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, email, password, role } = req.body;
    
    const result = await this.service.signup({
      name,
      email,
      password,
      role: role || 'USER',
    });

    res.status(StatusCodes.CREATED).json({
      status: 'success',
      data: { user: result.user },
    });
  });

  /**
   * Log in an existing user and returns JWT.
   */
  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    const result = await this.service.login({
      email,
      password,
    });

    const { accessToken, refreshToken, user } = result;
    this.setAccessTokenCookie(res, accessToken);
    this.setRefreshTokenCookie(res, refreshToken);

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: { user },
    });
  });

  /**
   * Refreshes the access token using the refresh token stored in the HTTP-only cookie.
   */
  refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const token = req.cookies.refreshToken;
    const result = await this.service.refresh(token);

    const { accessToken, refreshToken, user } = result;
    this.setAccessTokenCookie(res, accessToken);
    this.setRefreshTokenCookie(res, refreshToken);

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: { user },
    });
  });

  /**
   * Logs out the user by clearing both auth cookies.
   */
  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.clearAccessTokenCookie(res);
    this.clearRefreshTokenCookie(res);
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  });

  /**
   * Retrieves profile details of the currently authenticated user.
   */
  me = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // req.user is guaranteed to be present by authentication middleware
    const userId = req.user!.id;
    
    const user = await this.service.getCurrentUser(userId);

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: { user },
    });
  });
}

// Export singleton instance of AuthController
export const authController = new AuthController();
