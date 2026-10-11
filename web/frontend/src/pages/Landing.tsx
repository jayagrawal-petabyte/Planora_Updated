import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

export const Landing = () => {
  const [showContact, setShowContact] = useState(false);

  return (
    <div className="landing-container">
      {/* Contact Us Modal */}
      {showContact && (
        <div className="modal-overlay" onClick={() => setShowContact(false)}>
          <div className="modal-content contact-modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowContact(false)}>×</button>
            <h3>Contact Us</h3>
            <div className="contact-info">
              <p><strong>Planora Connect</strong></p>
              <a href="#" className="contact-link">
                hello@planora.app
              </a>
            </div>
          </div>
        </div>
      )}

      <nav className="landing-nav">
        <div className="nav-left">
          <Link to="/register" className="menu-btn get-started-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
            Get Started
          </Link>
          <div className="logo-section">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            <div className="logo-text">
              <span className="logo-title">PLANORA</span>
              <span className="logo-subtitle">Project Management</span>
            </div>
          </div>
        </div>
        <div className="nav-right">
          <button onClick={() => setShowContact(true)} className="contact-btn">Contact Us</button>
          <Link to="/login" className="login-btn">Log in</Link>
        </div>
      </nav>

      <main className="landing-main">
        <div className="hero-header-section">
          <p className="welcome-text">Welcome to</p>
          <h1 className="hero-title">PLANORA</h1>
        </div>

        <div className="hero-graphic">
          <div className="graphic-item item-intern">
            <span className="graphic-label" style={{background: '#ffe8cc', color: '#d35400'}}>Lead</span>
            <div className="avatar-bg-circle bg-circle-orange"></div>
            <div className="avatar-circle"></div>
            <div className="avatar-body"></div>
          </div>
          
          <div className="graphic-item item-project">
            <span className="graphic-label" style={{background: '#e0e7ff', color: '#3730a3'}}>Project</span>
            <div className="avatar-bg-circle bg-circle-green"></div>
            <div className="desk">
               <div className="screen">
                 <div className="note-line" style={{width: '30%', background: '#d1fae5'}}></div>
                 <div className="note-line" style={{width: '60%', background: '#d1fae5'}}></div>
                 <div className="note-line" style={{width: '40%', background: '#ffe8cc'}}></div>
                 <div className="note-line" style={{width: '70%', background: '#ffe8cc'}}></div>
                 <div className="note-line" style={{width: '25%', background: '#e0e7ff'}}></div>
                 <div className="note-line" style={{width: '50%', background: '#e0e7ff'}}></div>
               </div>
            </div>
            <div className="avatar-circle center-circle" style={{position: 'relative', zIndex: 10}}></div>
            <div className="avatar-body center-body" style={{position: 'relative', zIndex: 10}}></div>
          </div>
          
          <div className="graphic-item item-task">
            <span className="graphic-label" style={{background: '#d1fae5', color: '#065f46'}}>Task</span>
            <div className="avatar-bg-circle bg-circle-blue"></div>
            <div className="avatar-circle"></div>
            <div className="avatar-body"></div>
          </div>
        </div>
      </main>
    </div>
  );
};
