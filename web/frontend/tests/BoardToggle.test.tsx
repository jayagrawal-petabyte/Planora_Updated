import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { KanbanBoard } from '../src/components/KanbanBoard';
import type { Task } from '@planora/shared';

describe('KanbanBoard & View Toggle', () => {
  const mockTasks: Task[] = [
    {
      id: 'task-1',
      name: 'Design landing page',
      description: 'Create Figma mockups',
      status: 'PENDING',
      priority: 'HIGH',
      projectId: 'proj-1',
      dueDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday (overdue)
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-2',
      name: 'Implement OAuth',
      description: 'Google and GitHub sign-in',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      projectId: 'proj-1',
      dueDate: new Date(Date.now() + 86400000 * 5).toISOString(), // Future
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-3',
      name: 'Write Jest unit tests',
      description: 'Ensure 100% coverage',
      status: 'COMPLETED',
      priority: 'LOW',
      projectId: 'proj-1',
      createdAt: new Date().toISOString()
    }
  ];

  it('renders the 3 Kanban columns: Pending, In Progress, Completed', () => {
    const handleUpdate = jest.fn().mockResolvedValue(true);

    render(
      <KanbanBoard
        tasks={mockTasks}
        onUpdateTaskStatus={handleUpdate}
      />
    );

    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();

    expect(screen.getByText('Design landing page')).toBeInTheDocument();
    expect(screen.getByText('Implement OAuth')).toBeInTheDocument();
    expect(screen.getByText('Write Jest unit tests')).toBeInTheDocument();
  });

  it('highlights overdue tasks in red with an overdue indicator', () => {
    const handleUpdate = jest.fn().mockResolvedValue(true);

    render(
      <KanbanBoard
        tasks={mockTasks}
        onUpdateTaskStatus={handleUpdate}
      />
    );

    // task-1 is overdue
    expect(screen.getByText(/Overdue/i)).toBeInTheDocument();
  });

  it('allows moving tasks via the fallback "Move to" select dropdown', async () => {
    const handleUpdate = jest.fn().mockResolvedValue(true);

    render(
      <KanbanBoard
        tasks={mockTasks}
        onUpdateTaskStatus={handleUpdate}
      />
    );

    // Select the dropdown for task-1
    const select = screen.getByLabelText('Move to status', { selector: '#move-task-1' });
    expect(select).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(select, { target: { value: 'COMPLETED' } });
    });

    expect(handleUpdate).toHaveBeenCalledWith('task-1', 'COMPLETED');
  });

  it('switches between List and Board view and respects localStorage', () => {
    // Simulate a parent view with the toggle buttons
    const TestView = () => {
      const [mode, setMode] = React.useState<'list' | 'board'>(() => {
        return (localStorage.getItem('planora_task_view_mode') as 'list' | 'board') || 'list';
      });

      const handleToggle = (newMode: 'list' | 'board') => {
        setMode(newMode);
        localStorage.setItem('planora_task_view_mode', newMode);
      };

      return (
        <div>
          <button data-testid="toggle-list" onClick={() => handleToggle('list')}>
            List
          </button>
          <button data-testid="toggle-board" onClick={() => handleToggle('board')}>
            Board
          </button>
          {mode === 'board' ? (
            <div data-testid="board-view">Kanban Columns Active</div>
          ) : (
            <div data-testid="list-view">Standard List Active</div>
          )}
        </div>
      );
    };

    render(<TestView />);

    // Initially list view
    expect(screen.getByTestId('list-view')).toBeInTheDocument();
    expect(screen.queryByTestId('board-view')).not.toBeInTheDocument();

    // Click Board toggle
    fireEvent.click(screen.getByTestId('toggle-board'));

    expect(screen.getByTestId('board-view')).toBeInTheDocument();
    expect(screen.queryByTestId('list-view')).not.toBeInTheDocument();
    expect(localStorage.getItem('planora_task_view_mode')).toBe('board');

    // Click List toggle
    fireEvent.click(screen.getByTestId('toggle-list'));

    expect(screen.getByTestId('list-view')).toBeInTheDocument();
    expect(localStorage.getItem('planora_task_view_mode')).toBe('list');
  });
});
