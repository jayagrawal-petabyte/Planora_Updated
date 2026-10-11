import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);

    try {
      const res = await api.post('/auth/register', { fullName, email, password });
      if (res.data.success) {
        login(res.data.data.token, res.data.data.refreshToken, res.data.data.user);
        navigate('/');
      }
    } catch (err: any) {
      if (err.response?.data?.error?.details) {
        setError(err.response.data.error.details[0].message);
      } else {
        setError(err.response?.data?.error?.message || 'Registration failed');
      }
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
          <div className="auth-subtitle">Create an Account</div>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name <span className="required-star">*</span></label>
              <input 
                type="text" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                required 
              />
            </div>
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
                  minLength={6}
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
            <div className="form-group">
              <label>Confirm Password <span className="required-star">*</span></label>
              <div className="password-input-wrapper">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                  minLength={6}
                />
                <button 
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <span className="password-mismatch">Passwords do not match</span>
              )}
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '1.5rem', width: '100%', borderRadius: '25px', padding: '0.8rem' }}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
          
          <div className="auth-divider">
             <span>or</span>
          </div>
          
          <p className="auth-links">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
