import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

import { Sidebar } from '../components/Sidebar';
import { Modal } from '../components/Modal';
import DatePicker from 'react-datepicker';
import { Calendar } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';
import './Dashboard.css';

import type { Task, Project } from '@planora/shared';

export const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Pagination & Sorting
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Create task modal state
  const [showCreate, setShowCreate] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [priority, setPriority] = useState('MEDIUM');
  const [dueDate, setDueDate] = useState<Date | null>(null);

  // Edit task state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskName, setEditTaskName] = useState('');
  const [editTaskDesc, setEditTaskDesc] = useState('');
  const [editTaskStatus, setEditTaskStatus] = useState('');
  const [editTaskPriority, setEditTaskPriority] = useState('');

  useEffect(() => {
    fetchTasksAndProjects();
  }, [search, statusFilter, priorityFilter, page, sortBy, sortOrder]);

  const fetchTasksAndProjects = async () => {
    setLoading(true);
    try {
      let tasksUrl = `/tasks?page=${page}&limit=10&sortBy=${sortBy}&sortOrder=${sortOrder}`;
      if (search) tasksUrl += `&search=${encodeURIComponent(search)}`;
      if (statusFilter) tasksUrl += `&status=${encodeURIComponent(statusFilter)}`;
      if (priorityFilter) tasksUrl += `&priority=${encodeURIComponent(priorityFilter)}`;

      const [tasksRes, projectsRes] = await Promise.all([
        api.get(tasksUrl),
        api.get('/projects?limit=100') // Get all projects for dropdown
      ]);
      
      if (tasksRes.data.success) {
        setTasks(tasksRes.data.data.tasks);
        setTotalPages(tasksRes.data.data.pagination?.totalPages || 1);
      }
      if (projectsRes.data.success) {
        setProjects(projectsRes.data.data.projects);
        if (projectsRes.data.data.projects.length > 0 && !projectId) {
          setProjectId(projectsRes.data.data.projects[0].id);
        }
      }
    } catch (err: any) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      alert("Please select a project first. If you don't have any projects, create one.");
      return;
    }
    
    try {
      const payload: any = { name, description, status, priority, projectId };
      if (dueDate) {
        payload.dueDate = new Date(dueDate).toISOString();
      }
      
      const res = await api.post('/tasks', payload);
      
      if (res.data.success) {
        setTasks([res.data.data.task, ...tasks]);
        setShowCreate(false);
        setName('');
        setDescription('');
        setDueDate(null);
        setStatus('PENDING');
        setPriority('MEDIUM');
      }
    } catch (err) {
      alert('Failed to create task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err) {
      alert('Failed to delete task');
    }
  };

  const startEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTaskName(task.name);
    setEditTaskDesc(task.description || '');
    setEditTaskStatus(task.status);
    setEditTaskPriority(task.priority);
  };

  const handleEditTaskSubmit = async (e: React.FormEvent, taskId: string) => {
    e.preventDefault();
    try {
      const res = await api.put(`/tasks/${taskId}`, {
        name: editTaskName,
        description: editTaskDesc,
        status: editTaskStatus,
        priority: editTaskPriority
      });
      if (res.data.success) {
        setTasks(tasks.map(t => t.id === taskId ? res.data.data.task : t));
        setEditingTaskId(null);
      }
    } catch (err) {
      alert('Failed to update task');
    }
  };

  return (
    <div className="layout">
      <Sidebar />

      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>Tasks</h1>
          <button onClick={() => setShowCreate(true)} className="btn-primary" style={{ width: 'auto', marginTop: 0 }}>
            + New Task
          </button>
        </header>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Search tasks..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', flex: 1, minWidth: '200px' }}
          />
          <select 
            value={statusFilter} 
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <select 
            value={priorityFilter} 
            onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
          <select 
            value={sortBy} 
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="createdAt">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="status">Sort by Status</option>
            <option value="priority">Sort by Priority</option>
          </select>
          <select 
            value={sortOrder} 
            onChange={(e) => { setSortOrder(e.target.value); setPage(1); }}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Task">
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Project <span className="required-star">*</span></label>
              <select value={projectId} onChange={e => setProjectId(e.target.value)} required>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Task Name <span className="required-star">*</span></label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}>
                <option value="PENDING">PENDING</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <div className="date-picker-wrapper">
                <DatePicker 
                  selected={dueDate} 
                  onChange={(date: Date | null) => setDueDate(date)} 
                  dateFormat="dd-MM-yyyy"
                  placeholderText="dd-mm-yyyy"
                />
                <Calendar className="date-picker-icon" size={18} />
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem', borderRadius: '8px' }}>Create</button>
          </form>
        </Modal>

        {loading && <p>Loading tasks...</p>}
        {error && <p className="error-message">{error}</p>}

        {!loading && !error && (
          <div className="stats-grid">
            {tasks.length === 0 ? (
              <p>No tasks found.</p>
            ) : (
              tasks.map(task => (
                <div key={task.id} className="stat-card">
                  {editingTaskId === task.id ? (
                    <form onSubmit={(e) => handleEditTaskSubmit(e, task.id)}>
                      <input type="text" value={editTaskName} onChange={e => setEditTaskName(e.target.value)} required style={{width: '100%', marginBottom: '0.5rem', padding: '0.5rem'}} />
                      <input type="text" value={editTaskDesc} onChange={e => setEditTaskDesc(e.target.value)} style={{width: '100%', marginBottom: '0.5rem', padding: '0.5rem'}} />
                      <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                        <select value={editTaskStatus} onChange={e => setEditTaskStatus(e.target.value)} style={{flex: 1, padding: '0.5rem'}}>
                          <option value="PENDING">Pending</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                        <select value={editTaskPriority} onChange={e => setEditTaskPriority(e.target.value)} style={{flex: 1, padding: '0.5rem'}}>
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="submit" className="btn-primary" style={{ marginTop: 0, flex: 1, padding: '0.5rem' }}>Save</button>
                        <button type="button" onClick={() => setEditingTaskId(null)} className="btn-secondary" style={{ marginTop: 0, flex: 1, padding: '0.5rem' }}>Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <h3>{task.name}</h3>
                      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#999' }}>Created: {new Date(task.createdAt).toLocaleDateString()}</p>
                      <p>{task.description || 'No description'}</p>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <span className="status-badge">{task.status.replace('_', ' ')}</span>
                        <span className="status-badge" style={{ background: task.priority === 'HIGH' ? 'var(--danger)' : task.priority === 'MEDIUM' ? 'var(--warning)' : 'var(--primary)' }}>{task.priority}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
                        <button onClick={() => startEditTask(task)} className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}>Edit</button>
                        <button onClick={() => handleDeleteTask(task.id)} className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>Delete</button>
                        <Link to={`/projects/${task.projectId}`} style={{ fontSize: '0.85rem', marginLeft: 'auto' }}>View Project</Link>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {!loading && !error && tasks.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))} 
              disabled={page === 1}
              className="btn-secondary"
            >
              Previous
            </button>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              Page {page} of {totalPages}
            </span>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
              disabled={page === totalPages || totalPages === 0}
              className="btn-secondary"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
