import { Request, Response, NextFunction } from 'express';
import { PrismaClient, ProjectStatus } from '@prisma/client';
import { createProjectSchema, updateProjectSchema } from '../validators/projectValidator';
import { logAudit } from '../services/auditService';

const prisma = new PrismaClient();

export const getProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { search, status, page, limit, sortBy, sortOrder } = req.query;

    const whereClause: any = {
      userId,
    };

    if (search && typeof search === 'string') {
      whereClause.name = { contains: search, mode: 'insensitive' };
    }

    if (status && typeof status === 'string' && Object.values(ProjectStatus).includes(status as ProjectStatus)) {
      whereClause.status = status as ProjectStatus;
    }

    // Pagination
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const allowedSortFields = ['name', 'createdAt', 'status'];
    const sortField = sortBy && typeof sortBy === 'string' && allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDir = sortOrder === 'asc' ? 'asc' : 'desc';

    const [total, projects] = await Promise.all([
      prisma.project.count({ where: whereClause }),
      prisma.project.findMany({
        where: whereClause,
        skip,
        take: limitNum,
        orderBy: { [sortField]: sortDir }
      })
    ]);

    res.json({ 
      success: true, 
      data: { 
        projects,
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

export const getProjectById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const projectId = req.params.id as string;

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project || project.userId !== userId) {
      return res.status(404).json({ success: false, error: { message: "Project not found" } });
    }

    res.json({ success: true, data: { project } });
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const validatedData = createProjectSchema.parse(req.body);

    const project = await prisma.project.create({
      data: {
        ...validatedData,
        userId
      }
    });

    await logAudit('CREATE_PROJECT', 'PROJECT', project.id, userId, project);

    res.status(201).json({ success: true, data: { project } });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const projectId = req.params.id as string;
    const validatedData = updateProjectSchema.parse(req.body);

    // Verify ownership
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.userId !== userId) {
      return res.status(404).json({ success: false, error: { message: "Project not found" } });
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: validatedData
    });

    await logAudit('UPDATE_PROJECT', 'PROJECT', projectId, userId, validatedData);

    res.json({ success: true, data: { project: updatedProject } });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const projectId = req.params.id as string;

    // Verify ownership
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.userId !== userId) {
      return res.status(404).json({ success: false, error: { message: "Project not found" } });
    }

    await prisma.project.delete({
      where: { id: projectId }
    });

    await logAudit('DELETE_PROJECT', 'PROJECT', projectId, userId, { deletedAt: new Date() });

    res.json({ success: true, data: { message: "Project deleted successfully" } });
  } catch (error) {
    next(error);
  }
};
