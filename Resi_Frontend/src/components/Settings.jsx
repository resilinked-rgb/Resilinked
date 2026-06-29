  // DEBUG: Show userId, userData, and token for troubleshooting
  const debugUserData = localStorage.getItem('userData');
  const debugToken = localStorage.getItem('token');
import { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { AlertContext } from '../context/AlertContext'
import { useLanguage } from '../context/LanguageContext'
import apiService from '../api'

function Settings() {
  const { language, changeLanguage, t } = useLanguage()
  const [settings, setSettings] = useState({
    notificationPreferences: {
      job: true,
      message: true
    },
    languagePreference: 'english'
  })
  
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [showCancelEmailConfirm, setShowCancelEmailConfirm] = useState(false)
  const [showSendVerificationConfirm, setShowSendVerificationConfirm] = useState(false)
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [supportData, setSupportData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    priority: 'medium'
  })

  const [newEmailInput, setNewEmailInput] = useState('')
  const [requestingEmailChange, setRequestingEmailChange] = useState(false)
  const [pendingEmailChange, setPendingEmailChange] = useState(null)
  
  const { user, isLoggedIn } = useContext(AuthContext)
  const { success, error: showError } = useContext(AlertContext)

  useEffect(() => {
    if (!isLoggedIn) {
      showError('Please log in to access settings')
      return
    }
    loadSettings()
  }, [isLoggedIn, showError])

  // Pre-populate support form with user data when available
  useEffect(() => {
    if (user && showSupportModal && !supportData.name && !supportData.email) {
      setSupportData(prev => ({
        ...prev,
        name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : '',
        email: user.email || ''
      }))
    }
  }, [user, showSupportModal])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const userData = JSON.parse(localStorage.getItem('userData') || '{}')
      const response = await apiService.getProfile(userData.userId)
      let user = response.user || {};
      setSettings({
        notificationPreferences: {
          job: user.notificationPreferences?.job ?? true,
          message: user.notificationPreferences?.message ?? true
        },
        languagePreference: user.languagePreference || 'english'
      })
    } catch (error) {
      // On any error, just use default/blank settings
      setSettings({
        notificationPreferences: { job: false, message: false },
        languagePreference: ''
      });
      console.error('Error loading settings:', error)
      showError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationChange = (type, value) => {
    setSettings(prev => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [type]: value
      }
    }))
  }

  const handleLanguageChange = (language) => {
    setSettings(prev => ({
      ...prev,
      languagePreference: language
    }))
  }

  const validatePassword = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password)
    }
    
    return {
      requirements,
      isValid: Object.values(requirements).every(req => req)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('New passwords do not match')
      return
    }
    
    const validation = validatePassword(passwordData.newPassword)
    if (!validation.isValid) {
      showError('Password does not meet requirements')
      return
    }
    
    // Show confirmation dialog
    const confirmed = window.confirm(
      '🔐 Confirm Password Change\n\n' +
      'You are about to change your password.\n\n' +
      '⚠️ After changing your password:\n' +
      '• You will need to use the new password to log in\n' +
      '• All other active sessions will remain logged in\n' +
      '• Make sure you remember your new password\n\n' +
      'Continue with password change?'
    )
    
    if (!confirmed) {
      return
    }
    
    try {
      const response = await apiService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      
      if (response.success) {
        success('Password changed successfully! Please use your new password next time you log in.')
        setShowPasswordModal(false)
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        showError(response.message || 'Failed to change password')
      }
    } catch (error) {
      // Error already handled - don't log passwords
      showError(error.message || 'Failed to change password')
    }
  }

  const handleSupportSubmit = async (e) => {
    e.preventDefault()
    
    try {
      // Use form data first, fallback to user context
      const ticketName = supportData.name.trim() || 
        (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}`.trim() : '') ||
        user?.email?.split('@')[0] || 
        'User'
      
      const ticketEmail = supportData.email.trim() || user?.email || ''

      // Validate required fields
      if (!ticketName || !ticketEmail || !supportData.subject || !supportData.message) {
        showError('Please fill in all required fields')
        return
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(ticketEmail)) {
        showError('Please enter a valid email address')
        return
      }

      // Submit support ticket to backend with priority
      const ticketData = {
        name: ticketName,
        email: ticketEmail,
        subject: supportData.subject.trim(),
        message: supportData.message.trim(),
        priority: supportData.priority || 'medium'
      }

      console.log('Submitting support ticket:', ticketData)
      await apiService.createSupportTicket(ticketData)
      
      success('Support ticket submitted successfully. We will get back to you soon.')
      setShowSupportModal(false)
      setSupportData({
        name: '',
        email: '',
        subject: '',
        message: '',
        priority: 'medium'
      })
    } catch (error) {
      console.error('Support submission error:', error)
      showError(error.message || 'Failed to submit support ticket')
    }
  }

  const checkPendingEmailChange = async () => {
    try {
      const response = await apiService.getPendingEmailChange()
      if (response.hasPending && response.emailChange) {
        setPendingEmailChange(response.emailChange)
      } else {
        setPendingEmailChange(null)
      }
    } catch (error) {
      // Silently fail - not critical
      console.error('Error checking pending email change:', error)
      setPendingEmailChange(null)
    }
  }

  const handleRequestEmailChange = () => {
    if (!newEmailInput.trim()) {
      showError('Please enter a new email address')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmailInput)) {
      showError('Please enter a valid email address')
      return
    }

    // Show custom confirmation modal
    setShowSendVerificationConfirm(true)
  }

  const confirmSendVerification = async () => {
    setShowSendVerificationConfirm(false)

    try {
      setRequestingEmailChange(true)
      const response = await apiService.requestEmailChange(newEmailInput)
      
      if (response.success) {
        success('Verification email sent! Check your current email to confirm the change.')
        setPendingEmailChange(response.emailChange)
        setNewEmailInput('')
        setShowEmailModal(false)
      }
    } catch (error) {
      showError(error.message || 'Failed to request email change')
    } finally {
      setRequestingEmailChange(false)
    }
  }

  const handleCancelEmailChange = () => {
    // Show custom confirmation modal
    setShowCancelEmailConfirm(true)
  }

  const confirmCancelEmailChange = async () => {
    setShowCancelEmailConfirm(false)

    try {
      await apiService.cancelEmailChange()
      setPendingEmailChange(null)
      success('Email change request cancelled successfully')
    } catch (error) {
      showError(error.message || 'Failed to cancel email change')
    }
  }

  useEffect(() => {
    if (user) {
      checkPendingEmailChange()
    }
  }, [user])



  if (loading) {
    return (
      <div style={{ 
        position: 'fixed', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)',
        zIndex: 10001,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{ width: 48, height: 48, border: '4px solid #f0f0f0', borderTop: '4px solid #9333ea', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <div style={{ color: '#666', fontSize: '1rem' }}>Loading settings...</div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  // No 'User not found' UI: always show settings

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>{t('settings.title')}</h1>
        <Link to="/landing" className="back-btn">{t('common.back')} to Dashboard</Link>
      </div>

      <div className="settings-content">
        {/* Notification Preferences */}
        <div className="settings-section">
          <h2>{t('settings.notifications')}</h2>
          <div className="setting-item">
            <label className="switch-label">
              <input
                type="checkbox"
                checked={settings.notificationPreferences.job}
                onChange={(e) => handleNotificationChange('job', e.target.checked)}
              />
              <span className="switch"></span>
              {t('settings.jobNotifications')}
            </label>
            <p className="setting-description">{t('settings.receiveJobMatches')}</p>
          </div>
          
          <div className="setting-item">
            <label className="switch-label">
              <input
                type="checkbox"
                checked={settings.notificationPreferences.message}
                onChange={(e) => handleNotificationChange('message', e.target.checked)}
              />
              <span className="switch"></span>
              {t('settings.messageNotifications')}
            </label>
            <p className="setting-description">{t('settings.receiveMessages')}</p>
          </div>
        </div>

        {/* Language Preferences */}
        <div className="settings-section">
          <h2>{t('settings.language')}</h2>
          <p className="setting-description" style={{ marginBottom: '1rem' }}>
            {t('settings.selectLanguage')}
          </p>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="language"
                value="en"
                checked={language === 'en'}
                onChange={(e) => {
                  changeLanguage(e.target.value);
                  success(t('settings.languageUpdated'));
                }}
              />
              <span className="radio-text">{t('settings.english')}</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="language"
                value="tl"
                checked={language === 'tl'}
                onChange={(e) => {
                  changeLanguage(e.target.value);
                  success(t('settings.languageUpdated'));
                }}
              />
              <span className="radio-text">{t('settings.tagalog')}</span>
            </label>
          </div>
        </div>

        {/* Account Security */}
        <div className="settings-section">
          <h2>{t('settings.account')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button 
              className="action-btn primary"
              onClick={() => setShowEmailModal(true)}
            >
              📧 {t('settings.changeEmail')}
            </button>
            <button 
              className="action-btn primary"
              onClick={() => setShowPasswordModal(true)}
            >
              🔑 {t('settings.changePassword')}
            </button>
          </div>
        </div>

        {/* Support */}
        <div className="settings-section">
          <h2>{t('settings.support')}</h2>
          <button 
            className="action-btn secondary"
            onClick={() => setShowSupportModal(true)}
          >
            💬 {t('settings.contactSupport')}
          </button>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Password</h3>
            </div>
            
            <form onSubmit={handlePasswordSubmit} className="modal-form">
              <div className="form-group">
                <label>Current Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev,
                      currentPassword: e.target.value
                    }))}
                    required
                  />
                  <div 
                    className="password-toggle-icon" 
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    title={showCurrentPassword ? "Hide password" : "Show password"}
                  >
                    {showCurrentPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev,
                      newPassword: e.target.value
                    }))}
                    required
                    minLength="8"
                  />
                  <div 
                    className="password-toggle-icon" 
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    title={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    )}
                  </div>
                </div>
              </div>
              {passwordData.newPassword && (
                <div className="password-requirements">
                  <h4>Password Requirements:</h4>
                  <ul>
                    {Object.entries(validatePassword(passwordData.newPassword).requirements).map(([key, met]) => (
                      <li key={key} className={met ? 'met' : 'unmet'}>
                        {key === 'length' && 'At least 8 characters'}
                        {key === 'uppercase' && 'One uppercase letter'}
                        {key === 'lowercase' && 'One lowercase letter'}
                        {key === 'number' && 'One number'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="form-group">
                <label>Confirm New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev,
                      confirmPassword: e.target.value
                    }))}
                    required
                    minLength="8"
                  />
                  <div 
                    className="password-toggle-icon" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Support Modal */}
      {showSupportModal && (
        <div className="modal-overlay" onClick={() => setShowSupportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Contact Support</h3>
            </div>
            
            <form onSubmit={handleSupportSubmit} className="modal-form">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={supportData.name}
                  onChange={(e) => setSupportData(prev => ({
                    ...prev,
                    name: e.target.value
                  }))}
                  placeholder={user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : "Your full name"}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={supportData.email}
                  onChange={(e) => setSupportData(prev => ({
                    ...prev,
                    email: e.target.value
                  }))}
                  placeholder={user?.email || "your.email@example.com"}
                  required
                />
              </div>

              <div className="form-group">
                <label>Subject *</label>
                <input
                  type="text"
                  value={supportData.subject}
                  onChange={(e) => setSupportData(prev => ({
                    ...prev,
                    subject: e.target.value
                  }))}
                  required
                  placeholder="Brief description of your issue"
                />
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select
                  value={supportData.priority}
                  onChange={(e) => setSupportData(prev => ({
                    ...prev,
                    priority: e.target.value
                  }))}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="form-group">
                <label>Message</label>
                <textarea
                  value={supportData.message}
                  onChange={(e) => setSupportData(prev => ({
                    ...prev,
                    message: e.target.value
                  }))}
                  required
                  rows="5"
                  placeholder="Please describe your issue in detail..."
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowSupportModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Change Modal */}
      {showEmailModal && (
        <div className="modal-overlay" onClick={() => setShowEmailModal(false)}>
          <div className="modal-content email-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔐 Change Email Address</h3>
            </div>
            
            <div className="modal-form" style={{ padding: '1.5rem' }}>
              {pendingEmailChange ? (
                <div className="pending-change-notice">
                  <h4>⏳ Email Change Pending</h4>
                  <p>
                    <strong>Current Email:</strong> {pendingEmailChange.currentEmail}
                  </p>
                  <p>
                    <strong>New Email:</strong> {pendingEmailChange.newEmail}
                  </p>
                  <p style={{ fontSize: '0.9rem', color: '#666' }}>
                    Check your email ({pendingEmailChange.currentEmail}) for the verification link.
                    Expires: {new Date(pendingEmailChange.expiresAt).toLocaleString()}
                  </p>
                  <button 
                    onClick={handleCancelEmailChange}
                    className="cancel-request-btn"
                  >
                    Cancel Request
                  </button>
                </div>
              ) : (
                <>
                  <div className="security-info-box">
                    <p className="security-title">
                      🔒 Important Security Information
                    </p>
                    <ul>
                      <li><strong>The verification link will be sent to your CURRENT email address: {user?.email}</strong></li>
                      <li>This is a security measure to prevent unauthorized email changes</li>
                      <li>You must click the verification link to complete the email change</li>
                      <li>The verification link expires in 1 hour</li>
                    </ul>
                  </div>
                  
                  <div className="current-email-box">
                    <p>
                      <strong>Current Email:</strong> <span className="email-highlight">{user?.email}</span>
                    </p>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="newEmail">New Email Address</label>
                    <input
                      type="email"
                      id="newEmail"
                      value={newEmailInput}
                      onChange={(e) => setNewEmailInput(e.target.value)}
                      placeholder="Enter your new email address"
                      required
                    />
                    <small style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.5rem', display: 'block' }}>
                      Enter the email address you want to change to
                    </small>
                  </div>
                  
                  <div className="modal-actions">
                    <button 
                      type="button" 
                      className="cancel-btn"
                      onClick={() => setShowEmailModal(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleRequestEmailChange}
                      className="submit-btn"
                      disabled={requestingEmailChange}
                    >
                      {requestingEmailChange ? 'Sending...' : 'Send Verification Email'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Email Change Confirmation Modal */}
      {showCancelEmailConfirm && (
        <div className="modal-overlay" onClick={() => setShowCancelEmailConfirm(false)}>
          <div className="modal-content cancel-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ Cancel Email Change Request</h3>
            </div>
            
            <div className="cancel-confirm-content">
              <p className="confirm-message">Are you sure you want to cancel this email change request?</p>
              
              <div className="email-info-box">
                <div className="info-item">
                  <span className="info-label">Current email will remain:</span>
                  <span className="info-value">{user?.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">New email will not be applied:</span>
                  <span className="info-value">{pendingEmailChange?.newEmail}</span>
                </div>
              </div>

              <p className="warning-text">⚠️ This action cannot be undone.</p>

              <div className="modal-actions">
                <button 
                  className="cancel-btn"
                  onClick={() => setShowCancelEmailConfirm(false)}
                >
                  Keep Request
                </button>
                <button 
                  className="confirm-cancel-btn"
                  onClick={confirmCancelEmailChange}
                >
                  Yes, Cancel Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Verification Email Confirmation Modal */}
      {showSendVerificationConfirm && (
        <div className="modal-overlay" onClick={() => setShowSendVerificationConfirm(false)}>
          <div className="modal-content send-verify-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📧 Send Verification Email</h3>
            </div>
            
            <div className="send-verify-content">
              <p className="confirm-message">Are you sure you want to send a verification email?</p>
              
              <div className="email-info-box">
                <div className="info-item">
                  <span className="info-label">Current Email:</span>
                  <span className="info-value">{user?.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">New Email:</span>
                  <span className="info-value">{newEmailInput}</span>
                </div>
              </div>

              <div className="info-notice">
                <p>✉️ A verification link will be sent to your <strong>current email address</strong>.</p>
                <p>⏰ The verification link will expire in 1 hour.</p>
              </div>

              <div className="modal-actions">
                <button 
                  className="cancel-btn"
                  onClick={() => setShowSendVerificationConfirm(false)}
                >
                  Cancel
                </button>
                <button 
                  className="confirm-send-btn"
                  onClick={confirmSendVerification}
                  disabled={requestingEmailChange}
                >
                  {requestingEmailChange ? 'Sending...' : '📧 Send Verification'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

  <style>{`
        .settings-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 5rem 2rem 2rem 2rem;
        }

        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
        }

        .settings-header h1 {
          margin: 0;
          color: #2b6cb0;
          font-size: 2rem;
        }

        .back-btn {
          color: #666;
          text-decoration: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          transition: background-color 0.2s;
        }

        .back-btn:hover {
          background-color: #f7fafc;
        }

        .settings-content {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .settings-section {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
        }

        .settings-section h2 {
          margin: 0 0 1rem 0;
          color: #2d3748;
          font-size: 1.25rem;
        }

        .setting-item {
          margin-bottom: 1rem;
        }

        .switch-label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          font-weight: 500;
        }

        .switch {
          position: relative;
          width: 54px;
          height: 30px;
          background: #ccc;
          border-radius: 15px;
          transition: background 0.2s;
          cursor: pointer;
          flex-shrink: 0;
        }

        .switch::before {
          content: '';
          position: absolute;
          top: 3px;
          left: 3px;
          width: 24px;
          height: 24px;
          background: white;
          border-radius: 50%;
          transition: transform 0.2s;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .switch-label input[type="checkbox"] {
          display: none;
        }

        .switch-label input[type="checkbox"]:checked + .switch {
          background: #2b6cb0;
        }

        .switch-label input[type="checkbox"]:checked + .switch::before {
          transform: translateX(24px);
        }

        .switch-label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          font-weight: 500;
          min-height: 44px;
          -webkit-tap-highlight-color: transparent;
        }

        .switch-label:active .switch {
          transform: scale(0.95);
        }

        .setting-description {
          margin: 0.5rem 0 0 0;
          color: #666;
          font-size: 0.9rem;
        }

        .radio-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .radio-label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 6px;
          transition: background 0.2s;
          min-height: 44px;
          -webkit-tap-highlight-color: transparent;
        }

        .radio-label:hover {
          background: #f7fafc;
        }

        .radio-label:active {
          background: #edf2f7;
          transform: scale(0.98);
        }

        .radio-label input[type="radio"] {
          width: 20px;
          height: 20px;
          cursor: pointer;
          flex-shrink: 0;
        }

        .action-btn {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 0.5rem !important;
          padding: 0.75rem 1.25rem !important;
          border: none !important;
          border-radius: 8px !important;
          font-size: 0.95rem !important;
          font-weight: 500 !important;
          cursor: pointer !important;
          transition: all 0.2s !important;
          min-height: 42px !important;
          height: 42px !important;
          line-height: 1 !important;
          box-shadow: none !important;
          background: #2b6cb0 !important;
          -webkit-tap-highlight-color: transparent;
        }

        .action-btn:active {
          transform: scale(0.98) !important;
        }
        
        .action-btn .icon {
          font-size: 1.15rem;
          line-height: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          vertical-align: middle;
        }

        .action-btn.primary {
          background: #2b6cb0 !important;
          color: white !important;
        }

        .action-btn.primary:hover {
          background: #2c5282 !important;
          box-shadow: 0 2px 8px rgba(43, 108, 176, 0.3) !important;
          transform: translateY(-1px) !important;
        }

        .action-btn.secondary {
          background: #e2e8f0 !important;
          color: #2d3748 !important;
        }

        .action-btn.secondary:hover {
          background: #cbd5e0 !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
          transform: translateY(-1px) !important;
        }

        .settings-actions {
          text-align: center;
        }

        .save-btn {
          background: #38a169 !important;
          color: white !important;
          border: none !important;
          padding: 0.75rem 1.5rem !important;
          border-radius: 8px !important;
          font-size: 0.95rem !important;
          font-weight: 500 !important;
          cursor: pointer !important;
          transition: all 0.2s !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 0.5rem !important;
          margin: 0 auto !important;
          min-height: 42px !important;
          height: 42px !important;
          min-width: 120px !important;
          line-height: 1 !important;
          box-shadow: none !important;
          -webkit-tap-highlight-color: transparent;
        }

        .save-btn:hover:not(:disabled) {
          background: #2f855a;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(56, 161, 105, 0.3);
        }

        .save-btn:active:not(:disabled) {
          transform: translateY(0) scale(0.98);
        }

        .save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 0;
          width: 90%;
          max-width: 500px;
          max-height: 85vh;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        @media (max-width: 768px) {
          .modal-content {
            width: 95%;
            max-height: 90vh;
            border-radius: 16px;
          }
        }

        @media (max-width: 480px) {
          .modal-content {
            width: 98%;
            max-width: none;
            border-radius: 12px;
            margin: 1rem;
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-header h3 {
          margin: 0;
          color: #2b6cb0;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
          padding: 0.5rem;
          min-width: 44px;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.2s;
          -webkit-tap-highlight-color: transparent;
        }

        .close-btn:hover {
          background: #f7fafc;
          color: #2d3748;
        }

        .close-btn:active {
          background: #edf2f7;
          transform: scale(0.95);
        }

        .modal-form {
          padding: 1.5rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #333;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #2b6cb0;
        }

        .password-input-wrapper {
          position: relative;
          width: 100%;
        }

        .password-input-wrapper input {
          width: 100%;
          padding-right: 3rem;
        }

        .password-toggle-icon {
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          padding: 2px;
          color: #64748b;
          transition: color 0.2s ease, transform 0.1s ease;
          user-select: none;
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          z-index: 2;
          border-radius: 50%;
        }
        
        .password-toggle-icon:hover {
          color: #9333ea;
          background: rgba(147, 51, 234, 0.05);
        }
        
        .password-toggle-icon:active {
          transform: translateY(-50%) scale(0.95);
        }

        .password-toggle-btn {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.25rem;
          color: #666;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }

        .password-toggle-btn:hover {
          color: #2b6cb0;
        }

        .password-requirements {
          margin-top: 0.5rem;
          padding: 1rem;
          background: #f7fafc;
          border-radius: 8px;
        }

        .password-requirements h4 {
          margin: 0 0 0.5rem 0;
          font-size: 0.9rem;
          color: #2d3748;
        }

        .password-requirements ul {
          margin: 0;
          padding-left: 1rem;
          font-size: 0.8rem;
        }

        .password-requirements li.met {
          color: #38a169;
        }

        .password-requirements li.unmet {
          color: #e53e3e;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        .cancel-btn {
          background: #e2e8f0 !important;
          color: #2d3748 !important;
          border: none !important;
          padding: 0.65rem 1.25rem !important;
          border-radius: 8px !important;
          cursor: pointer !important;
          font-size: 0.95rem !important;
          height: 38px !important;
          line-height: 1 !important;
          box-shadow: none !important;
        }

        .submit-btn {
          background: #2b6cb0 !important;
          color: white !important;
          border: none !important;
          padding: 0.65rem 1.25rem !important;
          border-radius: 8px !important;
          cursor: pointer !important;
          font-size: 0.95rem !important;
          height: 38px !important;
          line-height: 1 !important;
          box-shadow: none !important;
        }

        .loading-state {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 3rem !important;
          color: #666 !important;
          text-align: center !important;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #f0f0f0;
          border-top: 4px solid #9333ea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Email Modal Styles */
        .email-modal {
          max-width: 600px;
        }

        .security-info-box {
          background: #fef3c7;
          border: 2px solid #f59e0b;
          border-radius: 12px;
          padding: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .security-title {
          color: #92400e;
          margin-bottom: 0.75rem;
          font-weight: 700;
          font-size: 1rem;
          margin-top: 0;
        }

        .security-info-box ul {
          color: #78350f;
          font-size: 0.95rem;
          margin-bottom: 0;
          line-height: 1.6;
          padding-left: 1.25rem;
        }

        .security-info-box li {
          margin-bottom: 0.5rem;
        }

        .current-email-box {
          background: #f8fafc;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          border: 1px solid #e2e8f0;
        }

        .current-email-box p {
          margin: 0;
          color: #475569;
        }

        .email-highlight {
          color: #9333ea;
          font-weight: 600;
        }

        .pending-change-notice {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .pending-change-notice h4 {
          color: #92400e;
          margin-top: 0;
          margin-bottom: 0.75rem;
        }

        .pending-change-notice p {
          color: #78350f;
          margin-bottom: 0.5rem;
        }

        .cancel-request-btn {
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }

        .cancel-request-btn:hover {
          background: #dc2626;
        }

        /* Cancel Email Confirmation Modal Styles */
        .cancel-confirm-modal {
          max-width: 500px;
        }

        .cancel-confirm-content {
          padding: 1.5rem;
        }

        .confirm-message {
          font-size: 1.05rem;
          color: #1e293b;
          margin-bottom: 1.5rem;
          font-weight: 500;
        }

        .email-info-box {
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          padding: 1.25rem;
          margin-bottom: 1.25rem;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-bottom: 1rem;
        }

        .info-item:last-child {
          margin-bottom: 0;
        }

        .info-label {
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 500;
        }

        .info-value {
          font-size: 1rem;
          color: #1e293b;
          font-weight: 600;
        }

        .warning-text {
          color: #dc2626;
          font-size: 0.95rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .cancel-btn {
          padding: 0.75rem 1.5rem;
          border: 2px solid #e2e8f0;
          background: white;
          color: #475569;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cancel-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e0;
        }

        .confirm-cancel-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          background: #ef4444;
          color: white;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .confirm-cancel-btn:hover {
          background: #dc2626;
        }

        /* Send Verification Confirmation Modal Styles */
        .send-verify-modal {
          max-width: 520px;
        }

        .send-verify-content {
          padding: 1.5rem;
        }

        .info-notice {
          background: #eff6ff;
          border: 2px solid #3b82f6;
          border-radius: 10px;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }

        .info-notice p {
          margin: 0 0 0.5rem 0;
          color: #1e40af;
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .info-notice p:last-child {
          margin-bottom: 0;
        }

        .confirm-send-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          background: #2b6cb0;
          color: white;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .confirm-send-btn:hover:not(:disabled) {
          background: #2c5282;
        }

        .confirm-send-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .settings-container {
            padding: 1rem;
          }

          .settings-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .settings-header h1 {
            font-size: 1.75rem;
          }

          .back-btn {
            padding: 0.75rem 1.25rem;
            min-height: 44px;
            font-size: 1rem;
          }

          .settings-section {
            padding: 1.25rem;
          }

          .action-btn {
            width: 100%;
            justify-content: center;
          }

          .password-input-container input {
            padding: 0.875rem 4rem 0.875rem 1rem;
            font-size: 16px; /* Prevents zoom on iOS */
          }

          .modal-form .form-group input,
          .modal-form .form-group textarea,
          .modal-form .form-group select {
            font-size: 16px; /* Prevents zoom on iOS */
            padding: 0.875rem 1rem;
          }

          .modal-actions {
            gap: 0.75rem;
          }

          .modal-actions button {
            flex: 1;
            min-height: 48px;
          }
        }

        @media (max-width: 480px) {
          .settings-container {
            padding: 0.75rem;
          }

          .settings-header h1 {
            font-size: 1.5rem;
          }

          .settings-section {
            padding: 1rem;
          }

          .settings-section h2 {
            font-size: 1.125rem;
          }

          .action-btn,
          .save-btn {
            padding: 0.75rem 1.25rem;
            font-size: 0.9375rem;
          }

          .form-group input,
          .form-group textarea,
          .form-group select {
            padding: 0.75rem;
            font-size: 16px;
          }

          .modal-header {
            padding: 1.25rem 1rem;
          }

          .modal-form {
            padding: 1.25rem 1rem;
          }

          .modal-actions {
            flex-direction: column;
          }

          .modal-actions button {
            width: 100%;
          }
        }

        @media (max-width: 360px) {
          .settings-container {
            padding: 0.5rem;
          }

          .settings-header h1 {
            font-size: 1.375rem;
          }

          .settings-section {
            padding: 0.875rem;
          }

          .form-group input {
            padding: 0.7rem 0.75rem;
          }

          .switch {
            width: 50px;
            height: 28px;
          }

          .switch::before {
            width: 22px;
            height: 22px;
          }

          .switch-label input[type="checkbox"]:checked + .switch::before {
            transform: translateX(22px);
          }
        }
      `}</style>
    </div>
  )
}

export default Settings
