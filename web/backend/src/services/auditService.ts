import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const logAudit = async (
  action: string,
  entity: string,
  entityId: string,
  userId: string,
  details?: Record<string, unknown> | null
) => {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        userId,
        details: (details || {}) as any
      }
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
};

function formatStatus(status: unknown): string {
  if (typeof status !== 'string') return String(status || 'Unknown');
  switch (status) {
    case 'PENDING':
      return 'Pending';
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'COMPLETED':
      return 'Completed';
    default:
      return status;
  }
}

export const formatAuditSummary = (
  log: {
    action: string;
    entity: string;
    userId: string;
    details?: unknown;
    user?: { fullName: string; email: string } | null;
  },
  requestingUserId: string
): string => {
  const isSelf = log.userId === requestingUserId;
  const actor = isSelf ? 'You' : (log.user?.fullName || 'A team member');
  const details = (log.details && typeof log.details === 'object' ? log.details : {}) as Record<string, unknown>;
  const title = (typeof details.entityTitle === 'string' && details.entityTitle)
    || (typeof details.name === 'string' && details.name)
    || (typeof details.taskName === 'string' && details.taskName)
    || '';
  const quotedTitle = title ? ` "${title}"` : '';

  const changedFields = details.changedFields && typeof details.changedFields === 'object'
    ? (details.changedFields as Record<string, { old?: unknown; new?: unknown }>)
    : undefined;

  switch (log.action) {
    case 'CREATE_PROJECT':
      return `${actor} created project${quotedTitle}`;
    case 'UPDATE_PROJECT': {
      if (changedFields?.status?.new) {
        const oldStatus = changedFields.status.old ? formatStatus(changedFields.status.old) : null;
        const newStatus = formatStatus(changedFields.status.new);
        return `${actor} updated project status${oldStatus ? ` from ${oldStatus}` : ''} to ${newStatus}`;
      }
      return `${actor} updated project${quotedTitle}`;
    }
    case 'DELETE_PROJECT':
      return `${actor} deleted project${quotedTitle}`;
    case 'CREATE_TASK':
      return `${actor} created task${quotedTitle}`;
    case 'UPDATE_TASK': {
      if (changedFields?.status?.new) {
        const oldStatus = changedFields.status.old ? formatStatus(changedFields.status.old) : null;
        const newStatus = formatStatus(changedFields.status.new);
        return `${actor} moved${quotedTitle} from ${oldStatus || 'previous status'} to ${newStatus}`;
      }
      if (changedFields?.priority?.new) {
        const oldPriority = changedFields.priority.old || 'previous';
        const newPriority = changedFields.priority.new;
        return `${actor} changed priority of${quotedTitle} from ${oldPriority} to ${newPriority}`;
      }
      if (changedFields?.name?.new) {
        return `${actor} renamed task to "${changedFields.name.new}"`;
      }
      return `${actor} updated task${quotedTitle}`;
    }
    case 'DELETE_TASK':
      return `${actor} deleted task${quotedTitle}`;
    default:
      return `${actor} updated ${log.entity.toLowerCase()}${quotedTitle}`;
  }
};

