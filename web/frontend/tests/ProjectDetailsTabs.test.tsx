import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProjectDetails } from '../src/pages/ProjectDetails';
import api from '../src/services/api';

// Mock api
jest.mock('../src/services/api');
const mockedApi = api as jest.Mocked<typeof api>;

// Mock AuthContext
jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', fullName: 'Test User', role: 'ADMIN' },
    logout: jest.fn(),
    loading: false
  })
}));

describe('ProjectDetails Tabs & Activity History Visibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Tasks and Activity History tabs and allows toggling between them', async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes('/projects/proj-123/activity')) {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              activities: [
                {
                  id: 'act-1',
                  action: 'CREATE_TASK',
                  entityType: 'TASK',
                  entityId: 't-1',
                  entityTitle: 'New Task',
                  summary: 'You created task New Task',
                  timestamp: new Date().toISOString()
                }
              ],
              pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
            }
          }
        });
      }
      if (url.includes('/projects/proj-123')) {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              project: {
                id: 'proj-123',
                name: 'Alpha Project',
                description: 'Test Project Description',
                status: 'IN_PROGRESS',
                createdAt: new Date().toISOString()
              }
            }
          }
        });
      }
      if (url.includes('/tasks')) {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              tasks: [],
              pagination: { total: 0, totalPages: 1, currentPage: 1 }
            }
          }
        });
      }
      return Promise.reject(new Error('Unknown url: ' + url));
    });

    render(
      <MemoryRouter initialEntries={['/projects/proj-123']}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectDetails />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for project to load
    await waitFor(() => {
      expect(screen.getByText('Alpha Project')).toBeInTheDocument();
    });

    // Check both tabs are visible and rendered
    const tasksTab = screen.getByTestId('project-tab-tasks');
    const activityTab = screen.getByTestId('project-tab-activity');

    expect(tasksTab).toBeInTheDocument();
    expect(tasksTab).toHaveTextContent('Tasks');
    expect(tasksTab).toHaveAttribute('aria-selected', 'true');

    expect(activityTab).toBeInTheDocument();
    expect(activityTab).toHaveTextContent('Activity History');
    expect(activityTab).toHaveAttribute('aria-selected', 'false');

    // Click Activity History tab
    fireEvent.click(activityTab);

    expect(activityTab).toHaveAttribute('aria-selected', 'true');
    expect(tasksTab).toHaveAttribute('aria-selected', 'false');

    // Verify activity feed content appears
    await waitFor(() => {
      expect(screen.getByText('You created task New Task')).toBeInTheDocument();
    });

    // Switch back to Tasks tab
    fireEvent.click(tasksTab);
    expect(tasksTab).toHaveAttribute('aria-selected', 'true');
    expect(activityTab).toHaveAttribute('aria-selected', 'false');
  });
});
