import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent
} from '@dnd-kit/core';
import { Calendar, AlertCircle, Edit, Trash2 } from 'lucide-react';
import type { Task, TaskStatus } from '@planora/shared';

interface KanbanBoardProps {
  tasks: Task[];
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => Promise<boolean>;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
}

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'PENDING', label: 'Pending', color: '#f59e0b' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: '#3b82f6' },
  { id: 'COMPLETED', label: 'Completed', color: '#10b981' }
];

const isTaskOverdue = (task: Task): boolean => {
  if (task.status === 'COMPLETED' || !task.dueDate) return false;
  const due = new Date(task.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime();
};

interface DraggableTaskCardProps {
  task: Task;
  isUpdating: boolean;
  onStatusChange: (newStatus: TaskStatus) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const DraggableTaskCard: React.FC<DraggableTaskCardProps> = ({
  task,
  isUpdating,
  onStatusChange,
  onEdit,
  onDelete
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    disabled: isUpdating
  });

  const overdue = isTaskOverdue(task);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`kanban-card ${isDragging ? 'is-dragging' : ''} ${overdue ? 'is-overdue' : ''} ${isUpdating ? 'is-updating' : ''}`}
      style={{ opacity: isDragging ? 0.3 : 1 }}
    >
      <div className="kanban-card-header">
        <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
          {task.priority}
        </span>
        {overdue && (
          <span className="overdue-tag">
            <AlertCircle size={13} /> Overdue
          </span>
        )}
      </div>

      <h4 className="kanban-card-title">{task.name}</h4>
      {task.description ? (
        <p className="kanban-card-desc">{task.description}</p>
      ) : null}

      {task.dueDate && (
        <div className={`kanban-card-date ${overdue ? 'text-danger' : ''}`}>
          <Calendar size={13} />
          <span>{new Date(task.dueDate).toLocaleDateString()}</span>
        </div>
      )}

      <div className="kanban-card-footer" onPointerDown={(e) => e.stopPropagation()}>
        <div className="move-to-control">
          <label htmlFor={`move-${task.id}`} className="sr-only">Move to status</label>
          <select
            id={`move-${task.id}`}
            value={task.status}
            disabled={isUpdating}
            onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
            className="kanban-move-select"
          >
            {COLUMNS.map((col) => (
              <option key={col.id} value={col.id}>
                Move: {col.label}
              </option>
            ))}
          </select>
        </div>

        <div className="kanban-card-actions">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="icon-btn"
              title="Edit Task"
              disabled={isUpdating}
            >
              <Edit size={14} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="icon-btn delete-icon-btn"
              title="Delete Task"
              disabled={isUpdating}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface DroppableColumnProps {
  column: { id: TaskStatus; label: string; color: string };
  tasks: Task[];
  updatingTaskIds: Set<string>;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({
  column,
  tasks,
  updatingTaskIds,
  onStatusChange,
  onEditTask,
  onDeleteTask
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id
  });

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column ${isOver ? 'column-is-over' : ''}`}
      data-status={column.id}
    >
      <div className="kanban-column-header">
        <div className="kanban-column-title-wrap">
          <span className="kanban-column-indicator" style={{ backgroundColor: column.color }} />
          <h3>{column.label}</h3>
        </div>
        <span className="kanban-column-count">{tasks.length}</span>
      </div>

      <div className="kanban-column-cards">
        {tasks.map((task) => (
          <DraggableTaskCard
            key={task.id}
            task={task}
            isUpdating={updatingTaskIds.has(task.id)}
            onStatusChange={(newStatus) => onStatusChange(task.id, newStatus)}
            onEdit={onEditTask ? () => onEditTask(task) : undefined}
            onDelete={onDeleteTask ? () => onDeleteTask(task.id) : undefined}
          />
        ))}

        {tasks.length === 0 && (
          <div className="kanban-empty-column">
            <span>No tasks in {column.label.toLowerCase()}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks: externalTasks,
  onUpdateTaskStatus,
  onEditTask,
  onDeleteTask
}) => {
  const [localTasks, setLocalTasks] = useState<Task[]>(externalTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [updatingTaskIds, setUpdatingTaskIds] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setLocalTasks(externalTasks);
  }, [externalTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5
      }
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = localTasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleStatusTransition = async (taskId: string, targetStatus: TaskStatus) => {
    const originalTask = localTasks.find((t) => t.id === taskId);
    if (!originalTask || originalTask.status === targetStatus) return;

    const previousStatus = originalTask.status;

    // 1. Optimistic Update
    setLocalTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t))
    );
    setUpdatingTaskIds((prev) => new Set(prev).add(taskId));
    setErrorMessage(null);

    // 2. Call API
    try {
      const success = await onUpdateTaskStatus(taskId, targetStatus);
      if (!success) {
        throw new Error('Update failed');
      }
    } catch (err) {
      // 3. Rollback on failure
      setLocalTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: previousStatus } : t))
      );
      setErrorMessage(`Failed to move "${originalTask.name}". Changes were rolled back.`);
    } finally {
      setUpdatingTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Check if dropped directly on a column or over another card in that column
    let targetStatus: TaskStatus | null = null;
    if (COLUMNS.some((c) => c.id === overId)) {
      targetStatus = overId as TaskStatus;
    } else {
      const overTask = localTasks.find((t) => t.id === overId);
      if (overTask) {
        targetStatus = overTask.status;
      }
    }

    if (targetStatus) {
      handleStatusTransition(taskId, targetStatus);
    }
  };

  return (
    <div className="kanban-container">
      {errorMessage && (
        <div className="kanban-error-banner">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="kanban-error-dismiss"
          >
            ×
          </button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board-grid">
          {COLUMNS.map((col) => {
            const columnTasks = localTasks.filter((t) => t.status === col.id);
            return (
              <DroppableColumn
                key={col.id}
                column={col}
                tasks={columnTasks}
                updatingTaskIds={updatingTaskIds}
                onStatusChange={handleStatusTransition}
                onEditTask={onEditTask}
                onDeleteTask={onDeleteTask}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className={`kanban-card is-dragging-overlay ${isTaskOverdue(activeTask) ? 'is-overdue' : ''}`}>
              <div className="kanban-card-header">
                <span className={`priority-badge priority-${activeTask.priority.toLowerCase()}`}>
                  {activeTask.priority}
                </span>
                {isTaskOverdue(activeTask) && (
                  <span className="overdue-tag">
                    <AlertCircle size={13} /> Overdue
                  </span>
                )}
              </div>
              <h4 className="kanban-card-title">{activeTask.name}</h4>
              {activeTask.description ? (
                <p className="kanban-card-desc">{activeTask.description}</p>
              ) : null}
              {activeTask.dueDate && (
                <div className="kanban-card-date">
                  <Calendar size={13} />
                  <span>{new Date(activeTask.dueDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
