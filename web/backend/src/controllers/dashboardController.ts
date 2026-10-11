import { Request, Response, NextFunction } from 'express';
import { PrismaClient, ProjectStatus, TaskStatus } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;

    // Use Prisma's aggregation features to get counts efficiently
    const [
      totalProjects,
      projectsInProgress,
      totalTasks,
      completedTasks,
      pendingTasks
    ] = await Promise.all([
      prisma.project.count({ where: { userId } }),
      prisma.project.count({ where: { userId, status: ProjectStatus.IN_PROGRESS } }),
      prisma.task.count({ where: { userId } }),
      prisma.task.count({ where: { userId, status: TaskStatus.COMPLETED } }),
      prisma.task.count({ where: { userId, status: TaskStatus.PENDING } })
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalProjects,
          projectsInProgress,
          totalTasks,
          completedTasks,
          pendingTasks
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
