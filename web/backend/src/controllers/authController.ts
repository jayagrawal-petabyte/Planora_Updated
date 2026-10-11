import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { registerSchema, loginSchema } from '@planora/shared';

const prisma = new PrismaClient();

const generateToken = (userId: string, role: string) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET as string, {
    expiresIn: '15m',
  });
};

const generateRefreshToken = (userId: string, role: string) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET as string, {
    expiresIn: '7d',
  });
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });
    
    if (existingUser) {
      return res.status(400).json({ success: false, error: { message: "Email already in use" } });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(validatedData.password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        fullName: validatedData.fullName,
        email: validatedData.email,
        passwordHash
      }
    });

    const token = generateToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id, user.role);

    // Save refresh token to db
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt
      }
    });

    res.status(201).json({
      success: true,
      data: {
        token,
        refreshToken,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (!user) {
      return res.status(401).json({ success: false, error: { message: "Invalid email or password" } });
    }

    const isMatch = await bcrypt.compare(validatedData.password, user.passwordHash);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, error: { message: "Invalid email or password" } });
    }

    const token = generateToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id, user.role);

    // Save refresh token to db
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt
      }
    });

    res.json({
      success: true,
      data: {
        token,
        refreshToken,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // req.user will be populated by authMiddleware
    const userId = (req as any).user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, email: true, role: true, createdAt: true, updatedAt: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: { message: "User not found" } });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  // Logout is primarily handled on the client by destroying the token.
  // We just return a success response.
  res.json({
    success: true,
    data: { message: "Logged out successfully" }
  });
};

export const savePushToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { pushToken } = req.body;

    if (!pushToken || typeof pushToken !== 'string') {
      return res.status(400).json({ success: false, error: { message: "Invalid push token" } });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { pushToken }
    });

    res.json({ success: true, data: { message: "Push token saved successfully" } });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ success: false, error: { message: "Refresh token is required" } });
    }

    // Verify token exists in db and hasn't expired
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    });

    if (!storedToken) {
      return res.status(401).json({ success: false, error: { message: "Invalid refresh token" } });
    }

    if (new Date() > storedToken.expiresAt) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      return res.status(401).json({ success: false, error: { message: "Refresh token expired" } });
    }

    // Verify JWT signature
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET as string);
    } catch (err) {
      return res.status(401).json({ success: false, error: { message: "Invalid refresh token signature" } });
    }

    if (decoded.id !== storedToken.userId) {
      return res.status(401).json({ success: false, error: { message: "Invalid refresh token" } });
    }

    // Generate new access token
    const newAccessToken = generateToken(storedToken.userId, storedToken.user.role);

    res.json({
      success: true,
      data: { token: newAccessToken }
    });
  } catch (error) {
    next(error);
  }
};
