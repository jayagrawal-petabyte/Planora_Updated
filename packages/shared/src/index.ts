import { z } from 'zod';

// Roles
export const RoleEnum = z.enum(['USER', 'ADMIN']);
export type Role = z.infer<typeof RoleEnum>;

// Auth
export const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required")
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// User
export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
}

// Project
export const projectStatusEnum = z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']);
export type ProjectStatus = z.infer<typeof projectStatusEnum>;

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  startDate?: Date | string;
  endDate?: Date | string;
  createdAt: Date | string;
}

// Task
export const taskStatusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']);
export const taskPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH']);
export type TaskStatus = z.infer<typeof taskStatusEnum>;
export type TaskPriority = z.infer<typeof taskPriorityEnum>;

export interface Task {
  id: string;
  name: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  dueDate?: Date | string;
  createdAt: Date | string;
}

// View Mode
export type TaskViewMode = 'list' | 'board';

// Activity Feed
export const activityEntityTypeEnum = z.enum(['PROJECT', 'TASK']);
export type ActivityEntityType = z.infer<typeof activityEntityTypeEnum>;

export const changedValueSchema = z.object({
  old: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
  new: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional()
});
export type ChangedValue = z.infer<typeof changedValueSchema>;

export const activityItemSchema = z.object({
  id: z.string(),
  actorId: z.string(),
  actorName: z.string(),
  action: z.string(),
  entityType: activityEntityTypeEnum,
  entityId: z.string(),
  entityTitle: z.string(),
  projectId: z.string().optional(),
  timestamp: z.string(),
  summary: z.string(),
  changedFields: z.record(z.string(), changedValueSchema).optional()
});
export type ActivityItem = z.infer<typeof activityItemSchema>;

export const activityPaginationSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number()
});
export type ActivityPagination = z.infer<typeof activityPaginationSchema>;

export const activityResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    activities: z.array(activityItemSchema),
    pagination: activityPaginationSchema
  })
});
export type ActivityResponse = z.infer<typeof activityResponseSchema>;

export const activityQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional()
});
export type ActivityQuery = z.infer<typeof activityQuerySchema>;

