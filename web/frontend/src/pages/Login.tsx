import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        login(res.data.data.token, res.data.data.refreshToken, res.data.data.user);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container split-layout">
      <div className="auth-left">
        <div className="css-art-container">
          <div className="art-circle-bg"></div>
          <div className="art-dot-orange left"></div>
          <div className="art-card back-card">
            <div className="art-line short"></div>
            <div className="art-line long"></div>
            <div className="art-dot-orange right"></div>
          </div>
          <div className="art-card front-card">
            <div className="art-line medium"></div>
            <div className="art-line short"></div>
          </div>
        </div>
        <div className="auth-left-text">
          <h3>Empower your teamwork</h3>
          <p>Seamlessly organize projects, track tasks, and collaborate with your entire team in one unified platform.</p>
        </div>
      </div>
      
      <div className="auth-right">
        <div className="auth-box">
          <div className="auth-logo">PLANORA</div>
          <div className="auth-subtitle">Welcome to Planora</div>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email <span className="required-star">*</span></label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Password <span className="required-star">*</span></label>
              <div className="password-input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
                <button 
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '1.5rem', width: '100%', borderRadius: '25px', padding: '0.8rem' }}>
              {loading ? 'Logging in...' : 'Sign in'}
            </button>
          </form>
          
          <div className="auth-divider">
             <span>or</span>
          </div>
          
          <p className="auth-links">
            New to Planora? <Link to="/register">Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
