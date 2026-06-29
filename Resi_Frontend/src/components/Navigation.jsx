import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import NotificationDropdown from './NotificationDropdown';
import { getProfilePictureUrl } from '../utils/imageHelper';
import { useTranslation } from '../hooks/useTranslation';
import { useLanguage } from '../context/LanguageContext';

function Navigation() {
  const { user, logout, hasAccessTo, isAuthenticated, loading } = useContext(AuthContext);
  const { unreadCount } = useContext(NotificationContext);
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const menuRef = useRef(null);
  const userMenuRef = useRef(null);
  const langMenuRef = useRef(null);
  
  // Set to false to disable debug logging
  const DEBUG = false;
  
  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = (event) => {
      console.log('🔄 Navigation: Profile updated', event.detail);
      setCurrentUser(event.detail);
    };
    
    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, []);
  
  // Sync with user context
  useEffect(() => {
    if (user) {
      setCurrentUser(user);
    }
  }, [user]);
  
  // Debug logging only if DEBUG is true
  if (DEBUG) {
    console.log('🧭 Navigation render:', { 
      isAuthenticated, 
      user: !!user, 
      userType: user?.userType,
      loading,
      currentPath: location.pathname
    });
  }

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const isActivePage = (path) => {
    return location.pathname === path;
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
        setLangMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getDashboardLink = () => {
    if (user?.userType === 'admin') return '/admin-dashboard'
    if (user?.userType === 'employer') return '/employer-dashboard'
    return '/employee-dashboard'
  };

  const NavLink = ({ to, children, className = '' }) => (
    <Link 
      to={to}
      className={`nav-link ${isActivePage(to) ? 'active' : ''} ${className}`}
      onClick={() => setIsMenuOpen(false)}
    >
      {children}
    </Link>
  );

  return (
    <>
      <nav className="main-navigation">
        {isAuthenticated ? (
          <>
            {/* Desktop Navigation */}
            <div className="nav-desktop">
              <div className="nav-links">
                <NavLink to="/search-jobs">
                  <span className="nav-icon">🔍</span>
                  {t('nav.findJobs')}
                </NavLink>
                
                <NavLink to="/chat">
                  <span className="nav-icon">💬</span>
                  {t('nav.messages')}
                </NavLink>
                
                {(user?.userType === 'employee' || user?.userType === 'both') && (
                  <NavLink to="/employee-dashboard">
                    <span className="nav-icon">👤</span>
                    <span style={{ fontWeight: 'bold', color: '#fff', letterSpacing: '0.5px' }}>{t('nav.dashboard')} ({t('register.employee')})</span>
                  </NavLink>
                )}

                {(user?.userType === 'employer' || user?.userType === 'both') && (
                  <>
                    <NavLink to="/employer-dashboard">
                      <span className="nav-icon">💼</span>
                      <span style={{ fontWeight: 'bold', color: '#fff', letterSpacing: '0.5px' }}>{t('nav.dashboard')} ({t('register.employer')})</span>
                    </NavLink>
                    <NavLink to="/post-job">
                      <span className="nav-icon">➕</span>
                      {t('nav.postJob')}
                    </NavLink>
                  </>
                )}

                {user?.userType === 'admin' && (
                  <NavLink to="/admin-dashboard">
                    <span className="nav-icon">⚙️</span>
                    {t('nav.admin')}
                  </NavLink>
                )}
              </div>

              {/* Notifications */}
              <div className="notification-container">
                <NotificationDropdown />
              </div>
              
              {/* User Menu */}
              <div className="user-menu" ref={userMenuRef}>
                <button 
                  className="user-menu-trigger"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className="user-avatar">
                    {getProfilePictureUrl(currentUser) ? (
                      <img 
                        src={getProfilePictureUrl(currentUser)} 
                        alt="Profile" 
                        className="avatar-img"
                        key={currentUser?.profilePicture} // Force re-render on profile change
                      />
                    ) : (
                      currentUser?.firstName?.[0] || 'U'
                    )}
                  </div>
                  <span className="user-name">{currentUser?.firstName || 'User'}</span>
                  <span className={`dropdown-arrow ${userMenuOpen ? 'open' : ''}`}>▼</span>
                </button>

                {userMenuOpen && (
                  <div className="user-dropdown">
                    <div className="user-info">
                      <div className="user-details">
                        <span className="user-full-name">
                          {user?.firstName} {user?.lastName}
                        </span>
                        <span className="user-role">{user?.userType}</span>
                      </div>
                    </div>
                    
                    <div className="dropdown-divider"></div>
                    
                    <Link to="/profile" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                      <span className="dropdown-icon">👤</span>
                      {t('nav.profile')}
                    </Link>
                    
                    <Link to="/settings" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                      <span className="dropdown-icon">⚙️</span>
                      {t('nav.settings')}
                    </Link>
                    
                    <div className="dropdown-divider"></div>
                    
                    <button onClick={handleLogout} className="dropdown-item logout-item">
                      <span className="dropdown-icon">🚪</span>
                      {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="mobile-menu-button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Menu"
            >
              <div className={`hamburger ${isMenuOpen ? 'open' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </button>
          </>
        ) : (
          /* Guest Navigation */
          <div className="nav-desktop">
            <NavLink to="/search-jobs">
              <span className="nav-icon">🔍</span>
              {t('nav.findJobs')}
            </NavLink>
            
            {/* Language Selector Dropdown for non-logged-in users */}
            <div className="language-dropdown" ref={langMenuRef}>
              <button
                className="lang-dropdown-trigger"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
              >
                <span className="lang-icon">🌐</span>
                <span className="lang-text">{language === 'en' ? 'English' : 'Tagalog'}</span>
                <span className={`dropdown-arrow ${langMenuOpen ? 'open' : ''}`}>▼</span>
              </button>

              {langMenuOpen && (
                <div className="lang-dropdown-menu">
                  <button
                    className={`lang-option ${language === 'en' ? 'active' : ''}`}
                    onClick={() => {
                      changeLanguage('en');
                      setLangMenuOpen(false);
                    }}
                  >
                    <span className="lang-flag">🇺🇸</span>
                    <span>English</span>
                    {language === 'en' && <span className="checkmark">✓</span>}
                  </button>
                  <button
                    className={`lang-option ${language === 'tl' ? 'active' : ''}`}
                    onClick={() => {
                      changeLanguage('tl');
                      setLangMenuOpen(false);
                    }}
                  >
                    <span className="lang-flag">🇵🇭</span>
                    <span>Tagalog</span>
                    {language === 'tl' && <span className="checkmark">✓</span>}
                  </button>
                </div>
              )}
            </div>
            
            <div className="guest-auth-buttons">
              <NavLink to="/login" className="btn-outline">
                {t('nav.login')}
              </NavLink>
              <NavLink to="/register" className="btn-primary">
                {t('landing.getStarted')}
              </NavLink>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && isAuthenticated && (
        <div className="mobile-overlay" onClick={() => setIsMenuOpen(false)}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            {/* Mobile User Header */}
            <div className="mobile-header">
              <div className="mobile-user-info">
                <div className="mobile-avatar">
                  {getProfilePictureUrl(currentUser) ? (
                    <img 
                      src={getProfilePictureUrl(currentUser)} 
                      alt="Profile" 
                      className="avatar-img"
                    />
                  ) : (
                    currentUser?.firstName?.[0] || 'U'
                  )}
                </div>
                <div className="mobile-user-details">
                  <div className="mobile-user-name">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="mobile-user-role">{user?.userType}</div>
                </div>
              </div>
              <button 
                className="mobile-close"
                onClick={() => setIsMenuOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* Mobile Navigation Links */}
            <div className="mobile-links">
              <NavLink to="/search-jobs" className="mobile-link">
                <span className="mobile-icon">🔍</span>
                <span>{t('nav.findJobs')}</span>
              </NavLink>
              
              <NavLink to="/chat" className="mobile-link">
                <span className="mobile-icon">💬</span>
                <span>{t('nav.messages')}</span>
              </NavLink>

              {(user?.userType === 'employee' || user?.userType === 'both') && (
                <NavLink to="/employee-dashboard" className="mobile-link">
                  <span className="mobile-icon">👤</span>
                  <span>{t('nav.dashboard')} ({t('register.employee')})</span>
                </NavLink>
              )}

              {(user?.userType === 'employer' || user?.userType === 'both') && (
                <>
                  <NavLink to="/employer-dashboard" className="mobile-link">
                    <span className="mobile-icon">💼</span>
                    <span>{t('nav.dashboard')} ({t('register.employer')})</span>
                  </NavLink>
                  <NavLink to="/post-job" className="mobile-link">
                    <span className="mobile-icon">➕</span>
                    <span>{t('nav.postJob')}</span>
                  </NavLink>
                </>
              )}

              {user?.userType === 'admin' && (
                <NavLink to="/admin-dashboard" className="mobile-link">
                  <span className="mobile-icon">⚙️</span>
                  <span>{t('nav.admin')}</span>
                </NavLink>
              )}

              <NavLink to="/profile" className="mobile-link">
                <span className="mobile-icon">👤</span>
                <span>{t('nav.profile')}</span>
              </NavLink>

              <NavLink to="/settings" className="mobile-link">
                <span className="mobile-icon">⚙️</span>
                <span>{t('nav.settings')}</span>
              </NavLink>

              <button onClick={handleLogout} className="mobile-link mobile-logout">
                <span className="mobile-icon">🚪</span>
                <span>{t('nav.logout')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .main-navigation {
          display: flex;
          align-items: center;
          gap: var(--spacing-2);
          margin-left: auto;
        }

        .nav-desktop {
          display: flex;
          align-items: center;
          gap: var(--spacing-3);
          margin-left: auto;
          justify-content: flex-end;
        }
        
        .nav-desktop > * {
          flex-shrink: 0;
          flex-grow: 0;
        }

        .guest-auth-buttons {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          margin-left: 0.5rem;
        }
        
        .guest-auth-buttons .nav-link {
          align-self: center;
          margin: 0 !important;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: nowrap;
        }

        .nav-link {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          color: white;
          text-decoration: none;
          padding: 0.5rem 0.625rem;
          border-radius: var(--radius-xl);
          font-weight: 500;
          font-size: 0.75rem;
          transition: all var(--transition-fast);
          white-space: nowrap;
          position: relative;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          flex-shrink: 0;
          width: auto;
        }

        .nav-link:hover {
          background: rgba(255, 255, 255, 0.2);
          text-decoration: none;
          box-shadow: 0 4px 16px rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.25);
        }

        .nav-link.active {
          background: rgba(255, 255, 255, 0.25);
          box-shadow: 0 4px 16px rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .nav-link.btn-outline {
          background: transparent !important;
          border: 2px solid rgba(255, 255, 255, 0.5) !important;
          height: 40px !important;
          min-height: 40px !important;
          max-height: 40px !important;
          padding: 0 1.25rem !important;
          font-size: 0.875rem !important;
          font-weight: 600 !important;
          width: auto !important;
          min-width: 100px !important;
          flex: none !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          box-shadow: none !important;
          letter-spacing: 0.3px !important;
          line-height: 1 !important;
        }

        .nav-link.btn-outline:hover {
          background: rgba(255, 255, 255, 0.2) !important;
          border-color: rgba(255, 255, 255, 0.8) !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2) !important;
        }

        .nav-link.btn-primary {
          background: linear-gradient(135deg, var(--success-500) 0%, var(--success-600) 100%) !important;
          border: 2px solid rgba(255, 255, 255, 0.3) !important;
          height: 40px !important;
          min-height: 40px !important;
          max-height: 40px !important;
          padding: 0 1.25rem !important;
          font-size: 0.875rem !important;
          font-weight: 600 !important;
          width: auto !important;
          min-width: 100px !important;
          flex: none !important;
          text-align: center !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3) !important;
          letter-spacing: 0.3px !important;
          line-height: 1 !important;
        }

        .nav-link.btn-primary:hover {
          background: linear-gradient(135deg, var(--success-600) 0%, var(--success-700) 100%) !important;
          box-shadow: 0 4px 16px rgba(34, 197, 94, 0.5) !important;
          transform: translateY(-1px);
          border-color: rgba(255, 255, 255, 0.4) !important;
        }

        .nav-icon {
          font-size: 0.875rem;
        }

        /* Language Dropdown */
        .language-dropdown {
          position: relative;
        }

        .lang-dropdown-trigger {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: white;
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-xl);
          cursor: pointer;
          transition: all var(--transition-fast);
          backdrop-filter: blur(20px);
          font-size: 0.75rem;
          font-weight: 500;
        }

        .lang-dropdown-trigger:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.25);
          box-shadow: 0 4px 16px rgba(255, 255, 255, 0.1);
        }

        .lang-icon {
          font-size: 1rem;
        }

        .lang-text {
          white-space: nowrap;
        }

        .lang-dropdown-menu {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          background: white;
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl);
          border: 1px solid var(--gray-200);
          min-width: 160px;
          overflow: hidden;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }

        .lang-option {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          color: var(--gray-700);
          font-size: 0.875rem;
          transition: all var(--transition-fast);
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
          position: relative;
        }

        .lang-option:hover {
          background: var(--gray-100);
          color: var(--gray-900);
        }

        .lang-option.active {
          background: rgba(147, 51, 234, 0.1);
          color: var(--primary-600);
          font-weight: 600;
        }

        .lang-flag {
          font-size: 1.25rem;
        }

        .checkmark {
          margin-left: auto;
          color: var(--primary-600);
          font-weight: bold;
        }

        /* User Menu */
        .user-menu {
          position: relative;
        }

        .user-menu-trigger {
          display: flex !important;
          align-items: center !important;
          gap: 10px !important;
          background: rgba(255, 255, 255, 0.1) !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          color: white !important;
          padding: 8px 12px !important;
          border-radius: var(--radius-xl) !important;
          cursor: pointer !important;
          transition: background 0.2s, border-color 0.2s, box-shadow 0.2s !important;
          backdrop-filter: blur(20px) !important;
          min-width: 180px !important;
          max-width: 180px !important;
          width: 180px !important;
          height: 52px !important;
          min-height: 52px !important;
          max-height: 52px !important;
          box-sizing: border-box !important;
        }

        .user-menu-trigger:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.25);
          box-shadow: 0 4px 16px rgba(255, 255, 255, 0.1);
        }

        .user-avatar {
          width: 36px !important;
          height: 36px !important;
          min-width: 36px !important;
          min-height: 36px !important;
          max-width: 36px !important;
          max-height: 36px !important;
          flex-shrink: 0 !important;
          border-radius: 50% !important;
          background: linear-gradient(135deg, var(--primary-400) 0%, var(--primary-600) 100%) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-weight: 600 !important;
          font-size: var(--font-size-sm) !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
          border: 2px solid rgba(255, 255, 255, 0.3) !important;
          overflow: hidden !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        
        .user-avatar .avatar-img {
          width: 36px !important;
          height: 36px !important;
          min-width: 36px !important;
          min-height: 36px !important;
          max-width: 36px !important;
          max-height: 36px !important;
          object-fit: cover !important;
          display: block !important;
          border-radius: 50% !important;
        }

        .user-name {
          font-weight: 500 !important;
          font-size: 14px !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          width: 85px !important;
          min-width: 85px !important;
          max-width: 85px !important;
          flex-shrink: 0 !important;
        }

        .dropdown-arrow {
          font-size: 10px !important;
          flex-shrink: 0 !important;
          width: 16px !important;
          min-width: 16px !important;
          text-align: center !important;
          transition: transform 0.2s !important;
        }

        .dropdown-arrow.open {
          transform: rotate(180deg);
        }

        .user-dropdown {
          position: absolute;
          top: calc(100% + var(--spacing-2));
          right: 0;
          background: white;
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl);
          border: 1px solid var(--gray-200);
          min-width: 220px;
          overflow: hidden;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .user-info {
          padding: var(--spacing-4);
          background: var(--gray-50);
        }

        .user-details {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-1);
        }

        .user-full-name {
          font-weight: 600;
          color: var(--gray-800);
          font-size: var(--font-size-sm);
        }

        .user-role {
          font-size: var(--font-size-xs);
          color: var(--gray-500);
          text-transform: capitalize;
        }

        .dropdown-divider {
          height: 1px;
          background: var(--gray-200);
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-3);
          padding: var(--spacing-3) var(--spacing-4);
          color: var(--gray-700);
          text-decoration: none;
          font-size: var(--font-size-sm);
          transition: all var(--transition-fast);
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
        }

        .dropdown-item:hover {
          background: var(--gray-100);
          color: var(--gray-900);
          text-decoration: none;
        }

        .logout-item {
          color: var(--error-600);
        }

        .logout-item:hover {
          background: var(--error-50);
          color: var(--error-700);
        }

        .dropdown-icon {
          font-size: var(--font-size-base);
        }

        /* Mobile Navigation */
        .mobile-menu-button {
          display: none;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          cursor: pointer;
          padding right: 6px;
          transition: all 0.3s ease;
          -webkit-tap-highlight-color: transparent;
          margin-left: auto;
          flex-shrink: 0;
          width: auto;
          height: auto;
        }

        .mobile-menu-button:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: scale(1.05);
        }

        .mobile-menu-button:active {
          transform: scale(0.95);
        }

        .hamburger {
          width: 18px;
          height: 14px;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .hamburger span {
          display: block;
          width: 100%;
          height: 2px;
          background: white;
          border-radius: 1px;
          transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .hamburger.open span:nth-child(1) {
          transform: rotate(45deg) translateY(6px);
        }

        .hamburger.open span:nth-child(2) {
          opacity: 0;
          transform: translateX(-10px);
        }

        .hamburger.open span:nth-child(3) {
          transform: rotate(-45deg) translateY(-6px);
        }

        .mobile-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          z-index: 9998;
          animation: fadeIn 0.25s ease;
        }

        @keyframes fadeIn {
          from { 
            opacity: 0; 
          }
          to { 
            opacity: 1; 
          }
        }

        .mobile-menu {
          position: fixed;
          top: 0;
          right: 0;
          width: 320px;
          max-width: 85vw;
          height: 100vh;
          background: linear-gradient(180deg, 
            #9333ea 0%, 
            #7e22ce 50%,
            #6b21a8 100%);
          box-shadow: -8px 0 32px rgba(0, 0, 0, 0.4);
          animation: slideIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          z-index: 9999;
          display: flex;
          flex-direction: column;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .mobile-header {
          padding: 1.75rem 1.25rem;
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.15) 0%, 
            rgba(255, 255, 255, 0.05) 100%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.15);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }

        .mobile-user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
        }

        .mobile-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.25) 0%, 
            rgba(255, 255, 255, 0.15) 100%);
          border: 2px solid rgba(255, 255, 255, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: white;
          font-size: 1.125rem;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .mobile-avatar .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .mobile-user-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          flex: 1;
          min-width: 0;
        }

        .mobile-user-name {
          color: white;
          font-weight: 700;
          font-size: 1rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .mobile-user-role {
          color: rgba(255, 255, 255, 0.85);
          font-size: 0.8125rem;
          text-transform: capitalize;
          font-weight: 500;
          letter-spacing: 0.5px;
        }

        .mobile-close {
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: white;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1.375rem;
          transition: all 0.3s ease;
          flex-shrink: 0;
          font-weight: 300;
        }

        .mobile-close:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: rotate(90deg) scale(1.1);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .mobile-close:active {
          transform: rotate(90deg) scale(0.95);
        }

        .mobile-links {
          padding: 1.25rem 0;
          flex: 1;
          overflow-y: auto;
        }

        .mobile-link {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.5rem;
          color: white;
          text-decoration: none;
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.9375rem;
          font-weight: 500;
          border-left: 3px solid transparent;
          position: relative;
          white-space: normal;
          word-break: break-word;
        }

        .mobile-link > span:last-child {
          flex: 1;
          line-height: 1.4;
        }

        .mobile-link::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 0;
          background: rgba(255, 255, 255, 0.1);
          transition: width 0.3s ease;
        }

        .mobile-link:hover::before,
        .mobile-link.active::before {
          width: 100%;
        }

        .mobile-link:hover,
        .mobile-link.active {
          background: rgba(255, 255, 255, 0.1);
          border-left-color: white;
          padding-left: 1.75rem;
        }

        .mobile-link:active {
          background: rgba(255, 255, 255, 0.15);
        }

        .mobile-icon {
          font-size: 1.375rem;
          width: 28px;
          text-align: center;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
          flex-shrink: 0;
        }

        .mobile-logout {
          margin-top: auto;
          border-top: 1px solid rgba(255, 255, 255, 0.15);
          padding-top: 1rem;
          margin-bottom: 1rem;
          color: rgba(255, 255, 255, 0.95);
        }

        .mobile-logout:hover {
          background: rgba(239, 68, 68, 0.25);
          border-left-color: #fca5a5;
        }

        .mobile-logout .mobile-icon {
          filter: drop-shadow(0 2px 4px rgba(239, 68, 68, 0.3));
        }

        /* Notification Styles */
        .notification-container {
          position: relative;
          display: flex;
          align-items: center;
        }
        
        /* Responsive Design */
        @media (max-width: 1024px) {
          .nav-links {
            gap: 0.25rem;
          }

          .nav-link {
            padding: 0.5rem 0.5rem;
            font-size: 0.7rem;
            gap: 0.2rem;
          }

          .user-name {
            display: none;
          }
          
          .nav-icon {
            font-size: 0.8rem;
          }

          .lang-text {
            display: none;
          }

          .lang-dropdown-trigger {
            padding: 0.5rem;
          }
        }
        
        @media (max-width: 900px) {
          .nav-desktop {
            display: none;
          }

          .mobile-menu-button {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .main-navigation {
            justify-content: flex-end;
          }
        }

        @media (max-width: 768px) {
          .nav-desktop {
            display: none;
          }

          .mobile-menu-button {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .main-navigation {
            justify-content: flex-end;
          }
        }

        @media (max-width: 480px) {
          .mobile-menu {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}

export default Navigation;
