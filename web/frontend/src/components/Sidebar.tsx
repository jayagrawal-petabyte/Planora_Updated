
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, Folder, CheckSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path)) ? 'active' : '';
  };

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <h3 style={{ fontFamily: 'Playfair Display, serif', letterSpacing: '1px' }}>PLANORA</h3>
      </div>
      <ul className="nav-links">
        <li>
          <Link to="/dashboard" className={isActive('/dashboard')}>
            <LayoutGrid size={20} />
            <span>Dashboard</span>
          </Link>
        </li>
        <li>
          <Link to="/projects" className={isActive('/projects')}>
            <Folder size={20} />
            <span>Projects</span>
          </Link>
        </li>
        <li>
          <Link to="/tasks" className={isActive('/tasks')}>
            <CheckSquare size={20} />
            <span>Tasks</span>
          </Link>
        </li>
      </ul>
      <div className="sidebar-footer">
        <p>{user?.fullName}</p>
        <button onClick={logout} className="btn-secondary">Logout</button>
      </div>
    </nav>
  );
};
