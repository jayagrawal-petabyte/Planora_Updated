import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Prisma, ProjectStatus } from '@prisma/client';
import { createProjectSchema, updateProjectSchema } from '../validators/projectValidator';
import { logAudit, formatAuditSummary } from '../services/auditService';
import { activityQuerySchema } from '@planora/shared';

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

    await logAudit('CREATE_PROJECT', 'PROJECT', project.id, userId, {
      projectId: project.id,
      entityTitle: project.name,
      name: project.name,
      status: project.status
    });

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

    const changedFields: Record<string, { old?: unknown; new?: unknown }> = {};
    if (validatedData.name !== undefined && validatedData.name !== project.name) {
      changedFields.name = { old: project.name, new: validatedData.name };
    }
    if (validatedData.status !== undefined && validatedData.status !== project.status) {
      changedFields.status = { old: project.status, new: validatedData.status };
    }
    if (validatedData.description !== undefined && validatedData.description !== project.description) {
      changedFields.description = { old: project.description, new: validatedData.description };
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: validatedData
    });

    await logAudit('UPDATE_PROJECT', 'PROJECT', projectId, userId, {
      projectId,
      entityTitle: updatedProject.name || project.name,
      changedFields,
      previousValues: {
        name: project.name,
        status: project.status
      },
      newValues: validatedData
    });

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

    await logAudit('DELETE_PROJECT', 'PROJECT', projectId, userId, {
      projectId,
      entityTitle: project.name,
      deletedAt: new Date().toISOString()
    });

    res.json({ success: true, data: { message: "Project deleted successfully" } });
  } catch (error) {
    next(error);
  }
};

export const getProjectActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const projectId = req.params.id as string;

    // Validate query parameters
    const { page, limit } = activityQuerySchema.parse(req.query);
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Verify that the project exists and belongs to the user
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          select: { id: true }
        }
      }
    });

    if (!project || project.userId !== userId) {
      return res.status(404).json({ success: false, error: { message: "Project not found" } });
    }

    const taskIds = project.tasks.map(t => t.id);

    // Filter by project id and requesting user id
    const whereClause: Prisma.AuditLogWhereInput = {
      userId,
      OR: [
        { entity: 'PROJECT', entityId: projectId },
        { entity: 'TASK', details: { path: ['projectId'], equals: projectId } },
        ...(taskIds.length > 0 ? [{ entity: 'TASK', entityId: { in: taskIds } }] : [])
      ]
    };

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where: whereClause }),
      prisma.auditLog.findMany({
        where: whereClause,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        }
      })
    ]);

    const activities = logs.map(log => {
      const details = (log.details && typeof log.details === 'object' ? log.details : {}) as Record<string, unknown>;
      const entityTitle = (typeof details.entityTitle === 'string' && details.entityTitle)
        || (typeof details.name === 'string' && details.name)
        || (typeof details.taskName === 'string' && details.taskName)
        || (log.entity === 'PROJECT' ? project.name : '');

      const changedFields = details.changedFields && typeof details.changedFields === 'object'
        ? (details.changedFields as Record<string, { old?: unknown; new?: unknown }>)
        : undefined;

      const actProjectId = (typeof details.projectId === 'string' && details.projectId)
        || (log.entity === 'PROJECT' ? log.entityId : projectId);

      return {
        id: log.id,
        actorId: log.userId,
        actorName: log.user?.fullName || 'User',
        action: log.action,
        entityType: log.entity as 'PROJECT' | 'TASK',
        entityId: log.entityId,
        entityTitle,
        projectId: actProjectId,
        timestamp: log.createdAt.toISOString(),
        summary: formatAuditSummary(log, userId),
        changedFields
      };
    });

    res.json({
      success: true,
      data: {
        activities,
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

