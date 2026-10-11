import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import './Dashboard.css';

interface DashboardStats {
  totalProjects: number;
  projectsInProgress: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
}

export const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard');
        if (res.data.success) {
          setStats(res.data.data.stats);
        }
      } catch (err: any) {
        setError('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="layout">
      <Sidebar />

      <main className="main-content">
        <header>
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.fullName}!</p>
        </header>

        {loading && <p>Loading statistics...</p>}
        {error && <p className="error-message">{error}</p>}

        {!loading && !error && stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Projects</h3>
              <p className="stat-value">{stats.totalProjects}</p>
            </div>
            <div className="stat-card">
              <h3>Projects In Progress</h3>
              <p className="stat-value">{stats.projectsInProgress}</p>
            </div>
            <div className="stat-card">
              <h3>Total Tasks</h3>
              <p className="stat-value">{stats.totalTasks}</p>
            </div>
            <div className="stat-card">
              <h3>Completed Tasks</h3>
              <p className="stat-value">{stats.completedTasks}</p>
            </div>
            <div className="stat-card">
              <h3>Pending Tasks</h3>
              <p className="stat-value">{stats.pendingTasks}</p>
            </div>
            
            <div className="stat-card" style={{ gridColumn: '1 / -1', height: '350px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>Task Statistics</h3>
              <div style={{ flex: 1, minHeight: 0 }}>
                {stats.totalTasks > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Completed', value: stats.completedTasks },
                          { name: 'Pending', value: stats.pendingTasks },
                          { name: 'In Progress', value: Math.max(0, stats.totalTasks - stats.completedTasks - stats.pendingTasks) }
                        ].filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {[
                          { name: 'Completed', value: stats.completedTasks },
                          { name: 'Pending', value: stats.pendingTasks },
                          { name: 'In Progress', value: Math.max(0, stats.totalTasks - stats.completedTasks - stats.pendingTasks) }
                        ].filter(d => d.value > 0).map((entry, index) => {
                          const colors = { 'Completed': '#10b981', 'Pending': '#f59e0b', 'In Progress': '#3b82f6' };
                          return <Cell key={`cell-${index}`} fill={colors[entry.name as keyof typeof colors]} />;
                        })}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p style={{ textAlign: 'center', color: '#999', marginTop: '2rem' }}>No tasks to display.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
