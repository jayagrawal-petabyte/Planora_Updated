import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Sidebar } from '../components/Sidebar';
import { Modal } from '../components/Modal';
import DatePicker from 'react-datepicker';
import { Calendar } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';
import './Dashboard.css'; // Reusing layout styles

import type { Project } from '@planora/shared';

export const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination & Sorting
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Create project form state
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('NOT_STARTED');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Edit project state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editStartDate, setEditStartDate] = useState<Date | null>(null);
  const [editEndDate, setEditEndDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchProjects();
  }, [search, statusFilter, page, sortBy, sortOrder]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      let url = `/projects?page=${page}&limit=10&sortBy=${sortBy}&sortOrder=${sortOrder}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (statusFilter) url += `&status=${encodeURIComponent(statusFilter)}`;

      const res = await api.get(url);
      if (res.data.success) {
        setProjects(res.data.data.projects);
        setTotalPages(res.data.data.pagination.totalPages || 1);
      }
    } catch (err: any) {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (startDate && endDate && startDate > endDate) {
      alert('End date cannot be before start date');
      return;
    }
    try {
      const payload: any = { name, description, status };
      if (startDate) payload.startDate = new Date(startDate).toISOString();
      if (endDate) payload.endDate = new Date(endDate).toISOString();

      const res = await api.post('/projects', payload);
      if (res.data.success) {
        setProjects([res.data.data.project, ...projects]);
        setShowCreate(false);
        setName('');
        setDescription('');
        setStatus('NOT_STARTED');
        setStartDate(null);
        setEndDate(null);
      }
    } catch (err) {
      alert('Failed to create project');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects(projects.filter(p => p.id !== id));
    } catch (err) {
      alert('Failed to delete project');
    }
  };

  const startEdit = (project: Project) => {
    setEditingId(project.id);
    setEditName(project.name);
    setEditDescription(project.description || '');
    setEditStatus(project.status);
    setEditStartDate(project.startDate ? new Date(project.startDate) : null);
    setEditEndDate(project.endDate ? new Date(project.endDate) : null);
  };

  const handleEditSubmit = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (editStartDate && editEndDate && editStartDate > editEndDate) {
      alert('End date cannot be before start date');
      return;
    }
    try {
      const payload: any = { name: editName, description: editDescription, status: editStatus };
      if (editStartDate) payload.startDate = new Date(editStartDate).toISOString();
      if (editEndDate) payload.endDate = new Date(editEndDate).toISOString();
      const res = await api.put(`/projects/${id}`, payload);
      if (res.data.success) {
        setProjects(projects.map(p => p.id === id ? res.data.data.project : p));
        setEditingId(null);
      }
    } catch (err) {
      alert('Failed to update project');
    }
  };

  return (
    <div className="layout">
      <Sidebar />

      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>Projects</h1>
          <button onClick={() => setShowCreate(true)} className="btn-primary" style={{ width: 'auto', marginTop: 0 }}>
            + New Project
          </button>
        </header>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', marginBottom: '1.5rem' }}>
          <input 
            type="text" 
            placeholder="Search projects..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', flex: 1 }}
          />
          <select 
            value={statusFilter} 
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="">All Statuses</option>
            <option value="PLANNING">Planning</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="ON_HOLD">On Hold</option>
          </select>
          <select 
            value={sortBy} 
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="createdAt">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="status">Sort by Status</option>
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

        <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Project">
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Project Name <span className="required-star">*</span></label>
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
                <option value="NOT_STARTED">NOT STARTED</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>
            <div className="form-group">
              <label>Start Date</label>
              <div className="date-picker-wrapper">
                <DatePicker 
                  selected={startDate} 
                  onChange={(date: Date | null) => setStartDate(date)} 
                  dateFormat="dd-MM-yyyy"
                  placeholderText="dd-mm-yyyy"
                />
                <Calendar className="date-picker-icon" size={18} />
              </div>
            </div>
            <div className="form-group">
              <label>End Date</label>
              <div className="date-picker-wrapper">
                <DatePicker 
                  selected={endDate} 
                  onChange={(date: Date | null) => setEndDate(date)} 
                  dateFormat="dd-MM-yyyy"
                  placeholderText="dd-mm-yyyy"
                />
                <Calendar className="date-picker-icon" size={18} />
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem', borderRadius: '8px' }}>Create</button>
          </form>
        </Modal>

        {loading && <p>Loading projects...</p>}
        {error && <p className="error-message">{error}</p>}

        {!loading && !error && (
          <div className="stats-grid">
            {projects.length === 0 ? (
              <p>No projects found.</p>
            ) : (
              projects.map(project => (
                <div key={project.id} className="stat-card">
                  {editingId === project.id ? (
                    <form onSubmit={(e) => handleEditSubmit(e, project.id)}>
                      <input type="text" value={editName} onChange={e => setEditName(e.target.value)} required style={{width: '100%', marginBottom: '0.5rem', padding: '0.5rem'}} />
                      <input type="text" value={editDescription} onChange={e => setEditDescription(e.target.value)} style={{width: '100%', marginBottom: '0.5rem', padding: '0.5rem'}} />
                      <select value={editStatus} onChange={e => setEditStatus(e.target.value)} style={{width: '100%', marginBottom: '0.5rem', padding: '0.5rem'}}>
                        <option value="NOT_STARTED">Not Started</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div className="date-picker-wrapper" style={{ flex: 1 }}>
                          <DatePicker 
                            selected={editStartDate} 
                            onChange={(date: Date | null) => setEditStartDate(date)} 
                            dateFormat="dd-MM-yyyy"
                            placeholderText="Start Date"
                          />
                          <Calendar className="date-picker-icon" size={18} />
                        </div>
                        <div className="date-picker-wrapper" style={{ flex: 1 }}>
                          <DatePicker 
                            selected={editEndDate} 
                            onChange={(date: Date | null) => setEditEndDate(date)} 
                            dateFormat="dd-MM-yyyy"
                            placeholderText="End Date"
                          />
                          <Calendar className="date-picker-icon" size={18} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="submit" className="btn-primary" style={{ marginTop: 0, flex: 1, padding: '0.5rem' }}>Save</button>
                        <button type="button" onClick={() => setEditingId(null)} className="btn-secondary" style={{ marginTop: 0, flex: 1, padding: '0.5rem' }}>Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <h3><Link to={`/projects/${project.id}`}>{project.name}</Link></h3>
                      <p>{project.description}</p>
                      <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
                        Created: {new Date(project.createdAt).toLocaleDateString()}
                        {project.startDate && ` | Start: ${new Date(project.startDate).toLocaleDateString()}`}
                        {project.endDate && ` | End: ${new Date(project.endDate).toLocaleDateString()}`}
                      </p>
                      <span className="status-badge">
                        {project.status.replace('_', ' ')}
                      </span>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <button onClick={() => startEdit(project)} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Edit</button>
                        <button onClick={() => handleDelete(project.id)} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>Delete</button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {!loading && !error && projects.length > 0 && (
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
