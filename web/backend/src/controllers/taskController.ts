import { Request, Response, NextFunction } from 'express';
import { PrismaClient, TaskStatus, Priority } from '@prisma/client';
import { createTaskSchema, updateTaskSchema } from '../validators/taskValidator';
import { logAudit } from '../services/auditService';

const prisma = new PrismaClient();

export const getTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { search, status, priority, projectId, page, limit, sortBy, sortOrder } = req.query;

    const whereClause: any = {
      userId,
    };

    if (projectId && typeof projectId === 'string') {
      whereClause.projectId = projectId;
    }

    if (search && typeof search === 'string') {
      whereClause.name = { contains: search, mode: 'insensitive' };
    }

    if (status && typeof status === 'string' && Object.values(TaskStatus).includes(status as TaskStatus)) {
      whereClause.status = status as TaskStatus;
    }

    if (priority && typeof priority === 'string' && Object.values(Priority).includes(priority as Priority)) {
      whereClause.priority = priority as Priority;
    }

    // Pagination
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const allowedSortFields = ['name', 'createdAt', 'status', 'priority', 'dueDate'];
    const sortField = sortBy && typeof sortBy === 'string' && allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDir = sortOrder === 'asc' ? 'asc' : 'desc';

    const [total, tasks] = await Promise.all([
      prisma.task.count({ where: whereClause }),
      prisma.task.findMany({
        where: whereClause,
        skip,
        take: limitNum,
        orderBy: { [sortField]: sortDir }
      })
    ]);

    res.json({ 
      success: true, 
      data: { 
        tasks,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      } 
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const taskId = req.params.id as string;

    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task || task.userId !== userId) {
      return res.status(404).json({ success: false, error: { message: "Task not found" } });
    }

    res.json({ success: true, data: { task } });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const validatedData = createTaskSchema.parse(req.body);

    // Verify that the project belongs to the user
    const project = await prisma.project.findUnique({ where: { id: validatedData.projectId } });
    if (!project || project.userId !== userId) {
      return res.status(404).json({ success: false, error: { message: "Project not found or unauthorized" } });
    }

    // The backend determines the userId, strictly enforcing isolation.
    const task = await prisma.task.create({
      data: {
        ...validatedData,
        userId
      }
    });

    await logAudit('CREATE_TASK', 'TASK', task.id, userId, task);

    res.status(201).json({ success: true, data: { task } });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const taskId = req.params.id as string;
    const validatedData = updateTaskSchema.parse(req.body);

    // Verify ownership
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.userId !== userId) {
      return res.status(404).json({ success: false, error: { message: "Task not found" } });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: validatedData
    });

    await logAudit('UPDATE_TASK', 'TASK', taskId, userId, validatedData);

    res.json({ success: true, data: { task: updatedTask } });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const taskId = req.params.id as string;

    // Verify ownership
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.userId !== userId) {
      return res.status(404).json({ success: false, error: { message: "Task not found" } });
    }

    await prisma.task.delete({
      where: { id: taskId }
    });

    await logAudit('DELETE_TASK', 'TASK', taskId, userId, { deletedAt: new Date() });

    res.json({ success: true, data: { message: "Task deleted successfully" } });
  } catch (error) {
    next(error);
  }
};
