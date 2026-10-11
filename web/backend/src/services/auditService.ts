import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const logAudit = async (action: string, entity: string, entityId: string, userId: string, details?: any) => {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        userId,
        details: details || {}
      }
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
};
