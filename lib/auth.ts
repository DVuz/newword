import { NextRequest } from 'next/server';
import { verify } from 'jsonwebtoken';

// JWT secret key (should match the one in login route)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-newword-app-2024';

interface AuthenticatedUser {
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
}

interface DecodedToken {
  id: string;
  email: string;
  name: string;
  role: string;
  iat: number;
  exp: number;
}

interface UserInfo {
  userId: string;
  userEmail: string;
  userName: string;
  addedAt: Date;
}

class AuthMiddleware {
  static async authenticateRequest(request: NextRequest): Promise<AuthenticatedUser> {
    try {
      // Get authorization header
      const authorization = request.headers.get('authorization');

      if (!authorization) {
        throw new Error('Không tìm thấy token xác thực');
      }

      // Extract token from "Bearer TOKEN" format
      const token = authorization.replace('Bearer ', '');

      if (!token) {
        throw new Error('Token không hợp lệ');
      }

      // Verify and decode token
      const decoded = verify(token, JWT_SECRET) as DecodedToken;

      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp < currentTime) {
        throw new Error('Token đã hết hạn');
      }

      console.log('✅ User authenticated:', decoded.name);

      // Return user info
      return {
        userId: decoded.id,
        userEmail: decoded.email,
        userName: decoded.name,
        userRole: decoded.role,
      };
    } catch (error: any) {
      console.error('❌ Authentication failed:', error.message);
      throw new Error(`Xác thực thất bại: ${error.message}`);
    }
  }

  // Optional: Get user info without throwing error (for optional auth)
  static async getOptionalUser(request: NextRequest): Promise<AuthenticatedUser | null> {
    try {
      return await this.authenticateRequest(request);
    } catch (error) {
      return null;
    }
  }

  // Create UserInfo for database
  static createUserInfo(authenticatedUser: AuthenticatedUser): UserInfo {
    return {
      userId: authenticatedUser.userId,
      userEmail: authenticatedUser.userEmail,
      userName: authenticatedUser.userName,
      addedAt: new Date(),
    };
  }
}

export { AuthMiddleware };
export type { AuthenticatedUser, UserInfo };
