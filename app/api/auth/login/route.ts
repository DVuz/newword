import { NextRequest, NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';

// Hardcoded users database
interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
}

const USERS: User[] = [
  {
    id: '1',
    email: 'admin@gmail.com',
    password: 'admin26',
    name: 'Admin',
    role: 'admin'
  },
  {
    id: '2',
    email: 'tranhongtham2604@gmail.com',
    password: 'anhdungsieudeptrai',
    name: 'Trần Hồng Thâm',
    role: 'user'
  },
  {
    id: '3',
    email: 'vuthuthuy@gmail.com',
    password: '02062002',
    name: 'Vũ Thu Thúy',
    role: 'user'
  },
  {
    id: '4',
    email: 'thang@gmail.com',
    password: '02062002',
    name: 'Thắng',
    role: 'user'
  }
];

// JWT secret key (in production, this should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-newword-app-2024';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  data?: {
    token: string;
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<LoginResponse>> {
  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    console.log('🔐 Login attempt for:', email);

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email và mật khẩu là bắt buộc'
        },
        { status: 400 }
      );
    }

    // Normalize email (lowercase)
    const normalizedEmail = email.toLowerCase().trim();

    // Find user in hardcoded database
    const user = USERS.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      console.log('❌ User not found:', normalizedEmail);
      return NextResponse.json(
        {
          success: false,
          error: 'Email hoặc mật khẩu không đúng'
        },
        { status: 401 }
      );
    }

    // Check password (in production, passwords should be hashed)
    if (user.password !== password) {
      console.log('❌ Wrong password for:', normalizedEmail);
      return NextResponse.json(
        {
          success: false,
          error: 'Email hoặc mật khẩu không đúng'
        },
        { status: 401 }
      );
    }

    // Create JWT token with user info
    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    };

    const token = sign(tokenPayload, JWT_SECRET);

    console.log('✅ Login successful for:', user.email);

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Login API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: `Lỗi server: ${errorMessage}`
      },
      { status: 500 }
    );
  }
}

// GET handler to verify token (optional)
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authorization = request.headers.get('authorization');

    if (!authorization) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    const token = authorization.replace('Bearer ', '');

    try {
      const decoded = sign(token, JWT_SECRET);
      return NextResponse.json({
        success: true,
        data: decoded,
      });
    } catch (tokenError) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

  } catch (error) {
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

// Export types
export type { LoginRequest, LoginResponse, User };
