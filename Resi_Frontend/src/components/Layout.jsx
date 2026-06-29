import React from 'react';
import { Link } from 'react-router-dom';
import Navigation from './Navigation';

function Layout({ children }) {
  return (
    <div className="layout-container">
      {/* Modern Header with Navigation */}
      <header className="main-header">
        <div className="header-content">
          {/* Modern Logo Section */}
          <Link to="/" className="logo-section">
            <div className="logo-container">
              <img 
                src="/logo.png" 
                alt="ResiLinked" 
                className="logo-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div className="logo-text">
                <h1 className="brand-name">ResiLinked</h1>
                <span className="brand-tagline">Connecting Communities</span>
              </div>
            </div>
          </Link>

          {/* Navigation */}
          <Navigation />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        <div className="content-wrapper">
          {children}
        </div>
      </main>

      {/* Modern Footer */}
      <footer className="main-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">ResiLinked</h3>
            <p className="footer-description">
              Connecting communities through meaningful employment opportunities.
            </p>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-subtitle">Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/search-jobs">Find Jobs</Link></li>
              <li><Link to="/help">Help Center</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms-of-service">Terms of Service</Link></li>
              <li><Link to="/register">Join Us</Link></li>
            </ul>
          </div>
          
          <div className="footer-section footer-contact-section">
            <h4 className="footer-subtitle">Contact</h4>
            <p className="footer-contact">
              📧 ResiLinked@gmail.com<br />
              📞 +6390 06681 8015
            </p>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© 2024 ResiLinked. All rights reserved.</p>
        </div>
      </footer>

      <style>{`
        .layout-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, var(--primary-50) 0%, var(--gray-50) 100%);
        }

        .main-header {
          background: linear-gradient(135deg, var(--primary-600) 0%, var(--primary-800) 100%);
          color: white;
          padding: 0;
          box-shadow: 0 8px 32px rgba(147, 51, 234, 0.15);
          position: sticky;
          top: 0;
          z-index: 1000;
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 var(--spacing-3);
          height: 72px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
          gap: var(--spacing-2);
        }

        .logo-section {
          text-decoration: none;
          color: inherit;
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }

        .logo-section:hover {
          transform: scale(1.05);
          filter: brightness(1.1);
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: var(--spacing-2);
        }

        .logo-image {
          height: 48px;
          width: 48px;
          border-radius: var(--radius-xl);
          box-shadow: 0 4px 16px rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.95);
          object-fit: contain;
          padding: var(--spacing-1);
          border: 2px solid rgba(255, 255, 255, 0.3);
        }

        .logo-text {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .brand-name {
          margin: 0;
          font-size: var(--font-size-xl);
          font-weight: 800;
          background: linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          white-space: nowrap;
        }

        .brand-tagline {
          font-size: 0.65rem;
          opacity: 0.9;
          font-weight: 400;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.8);
          white-space: nowrap;
        }

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: transparent;
        }

        .content-wrapper {
          width: 100%;
          padding: 0;
          box-sizing: border-box;
          min-height: calc(100vh - var(--header-height) - 200px);
        }

        .main-footer {
          background: linear-gradient(180deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%);
          color: var(--gray-200);
          margin-top: auto;
          border-top: 2px solid rgba(147, 51, 234, 0.3);
          box-shadow: 0 -4px 20px rgba(147, 51, 234, 0.15);
          position: relative;
        }

        .main-footer::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(147, 51, 234, 0.6) 50%, 
            transparent 100%);
        }

        .footer-content {
          padding: 1rem var(--spacing-6);
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr;
          gap: 1.5rem 2.5rem;
          max-width: 1400px;
          margin: 0 auto;
          align-items: center;
        }

        .footer-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          align-items: flex-start;
        }

        /* Right-align contact block on desktop for neat horizontal layout */
        .footer-contact-section {
          align-items: flex-end;
          text-align: right;
        }

        .footer-title {
          color: white;
          font-size: 1rem;
          font-weight: 800;
          margin: 0;
          background: linear-gradient(135deg, #a78bfa 0%, #c4b5fd 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
        }

        .footer-subtitle {
          color: white;
          font-size: 0.875rem;
          font-weight: 700;
          margin: 0 0 0.25rem 0;
          letter-spacing: 0.02em;
        }

        .footer-description {
          color: rgba(255, 255, 255, 0.75);
          line-height: 1.4;
          margin: 0;
          font-size: 0.75rem;
          max-width: 260px;
        }

        .footer-contact {
          color: rgba(255, 255, 255, 0.75);
          line-height: 1.5;
          margin: 0;
          font-size: 0.75rem;
        }

        .footer-contact a {
          color: rgba(255, 255, 255, 0.75);
          text-decoration: none;
          transition: color 0.2s;
        }

        .footer-contact a:hover {
          color: var(--primary-300);
        }

        .footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem 2rem;
          align-items: start;
        }

        .footer-links li {
          position: relative;
          padding-left: 0;
        }

        .footer-links a {
          color: rgba(255, 255, 255, 0.75);
          text-decoration: none;
          font-size: 0.75rem;
          transition: all 0.3s ease;
          padding: 0.25rem 0;
          display: inline-block;
          position: relative;
          font-weight: 500;
        }

        .footer-links a::before {
          content: '→';
          position: absolute;
          left: -20px;
          opacity: 0;
          transition: all 0.3s ease;
          color: var(--primary-300);
        }

        .footer-links a:hover {
          color: white;
          transform: translateX(8px);
        }

        .footer-links a:hover::before {
          opacity: 1;
          left: -16px;
        }

        .footer-bottom {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.625rem var(--spacing-3);
          text-align: center;
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
        }

        .footer-bottom p {
          margin: 0;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.6875rem;
          font-weight: 500;
          letter-spacing: 0.02em;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .main-header {
            padding: 0;
          }

          .header-content {
            padding: var(--spacing-2) var(--spacing-3);
            gap: var(--spacing-2);
            height: 60px;
          }
          
          .logo-container {
            gap: var(--spacing-1);
          }

          .logo-image {
            height: 36px;
            width: 36px;
          }

          .brand-name {
            font-size: var(--font-size-base);
          }
          
          .brand-tagline {
            font-size: 0.55rem;
          }

          .footer-content {
            grid-template-columns: 1fr;
            gap: var(--spacing-3);
            padding: var(--spacing-3) var(--spacing-4) var(--spacing-2);
            align-items: start;
          }

          /* Reset contact alignment on stacked layout */
          .footer-contact-section {
            align-items: flex-start;
            text-align: left;
          }
        }

        @media (max-width: 480px) {
          .header-content {
            padding: var(--spacing-2) var(--spacing-2);
            height: 56px;
          }
          
          .logo-image {
            height: 32px;
            width: 32px;
          }
          
          .brand-name {
            font-size: 0.9rem;
          }
          
          .brand-tagline {
            font-size: 0.5rem;
            letter-spacing: 0.05em;
          }

          .footer-content {
            padding: var(--spacing-2) var(--spacing-2) var(--spacing-2);
          }
        }
      `}</style>
    </div>
  );
}

export default Layout;
