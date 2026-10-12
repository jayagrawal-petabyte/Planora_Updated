import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// Mock notification service
jest.mock('../src/services/notificationService', () => ({
  startCronJobs: jest.fn()
}));

// Mock Prisma
const mockFindUniqueProject = jest.fn();
const mockCountAuditLog = jest.fn();
const mockFindManyAuditLog = jest.fn();

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      project: {
        findUnique: mockFindUniqueProject
      },
      auditLog: {
        count: mockCountAuditLog,
        findMany: mockFindManyAuditLog
      }
    })),
    ProjectStatus: {
      NOT_STARTED: 'NOT_STARTED',
      IN_PROGRESS: 'IN_PROGRESS',
      COMPLETED: 'COMPLETED'
    },
    TaskStatus: {
      PENDING: 'PENDING',
      IN_PROGRESS: 'IN_PROGRESS',
      COMPLETED: 'COMPLETED'
    },
    Priority: {
      LOW: 'LOW',
      MEDIUM: 'MEDIUM',
      HIGH: 'HIGH'
    }
  };
});

import app from '../src/index';

const testUserId = 'user-test-123';
const token = jwt.sign(
  { id: testUserId, role: 'USER' },
  process.env.JWT_SECRET || 'super-secret-key-change-me-in-production'
);

describe('GET /api/projects/:id/activity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 404 if project does not belong to requesting user (non-owner)', async () => {
    mockFindUniqueProject.mockResolvedValueOnce({
      id: 'proj-999',
      name: 'Secret Project',
      userId: 'different-user',
      tasks: []
    } as never);

    const res = await request(app)
      .get('/api/projects/proj-999/activity')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe('Project not found');
  });

  it('should return 404 if project does not exist', async () => {
    mockFindUniqueProject.mockResolvedValueOnce(null as never);

    const res = await request(app)
      .get('/api/projects/non-existent/activity')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should handle pagination (page and limit)', async () => {
    mockFindUniqueProject.mockResolvedValueOnce({
      id: 'proj-1',
      name: 'Main Project',
      userId: testUserId,
      tasks: [{ id: 'task-1' }]
    } as never);

    mockCountAuditLog.mockResolvedValueOnce(15 as never);
    mockFindManyAuditLog.mockResolvedValueOnce([
      {
        id: 'log-1',
        action: 'UPDATE_TASK',
        entity: 'TASK',
        entityId: 'task-1',
        userId: testUserId,
        details: {
          projectId: 'proj-1',
          entityTitle: 'Task 1',
          changedFields: {
            status: { old: 'PENDING', new: 'IN_PROGRESS' }
          }
        },
        createdAt: new Date('2026-10-10T10:00:00Z'),
        user: { id: testUserId, fullName: 'Test User', email: 'test@example.com' }
      }
    ] as never);

    const res = await request(app)
      .get('/api/projects/proj-1/activity?page=2&limit=5')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.pagination).toEqual({
      total: 15,
      page: 2,
      limit: 5,
      totalPages: 3
    });
    expect(res.body.data.activities).toHaveLength(1);
    expect(res.body.data.activities[0].summary).toBe('You moved "Task 1" from Pending to In Progress');

    expect(mockFindManyAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 5,
        take: 5
      })
    );
  });

  it('should still display deleted task history with snapshot data', async () => {
    mockFindUniqueProject.mockResolvedValueOnce({
      id: 'proj-1',
      name: 'Main Project',
      userId: testUserId,
      tasks: [] // Task was deleted, so tasks array does not contain it anymore
    } as never);

    mockCountAuditLog.mockResolvedValueOnce(1 as never);
    mockFindManyAuditLog.mockResolvedValueOnce([
      {
        id: 'log-del',
        action: 'DELETE_TASK',
        entity: 'TASK',
        entityId: 'deleted-task-99',
        userId: testUserId,
        details: {
          projectId: 'proj-1',
          entityTitle: 'Old Deleted Task',
          deletedAt: '2026-10-10T12:00:00Z',
          taskSnapshot: {
            id: 'deleted-task-99',
            name: 'Old Deleted Task'
          }
        },
        createdAt: new Date('2026-10-10T12:00:00Z'),
        user: { id: testUserId, fullName: 'Test User', email: 'test@example.com' }
      }
    ] as never);

    const res = await request(app)
      .get('/api/projects/proj-1/activity')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.activities).toHaveLength(1);
    const activity = res.body.data.activities[0];
    expect(activity.entityTitle).toBe('Old Deleted Task');
    expect(activity.entityId).toBe('deleted-task-99');
    expect(activity.summary).toBe('You deleted task "Old Deleted Task"');
  });
});
