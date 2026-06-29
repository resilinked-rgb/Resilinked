import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CheckCircle, Mail, Shield, LogIn } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'

const RegistrationSuccess = () => {
  const { t } = useTranslation()
  const [currentProgress, setCurrentProgress] = useState(1) // Start at step 1 for animation
  const [isAnimating, setIsAnimating] = useState(true)
  const [showResendForm, setShowResendForm] = useState(false)
  const [resendEmail, setResendEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState('')
  const location = useLocation()

  // Animate progress bar on mount
  useEffect(() => {
    // Animate to step 3 on initial load
    const timer1 = setTimeout(() => setCurrentProgress(2), 300)
    const timer2 = setTimeout(() => setCurrentProgress(3), 800)
    const timer3 = setTimeout(() => setIsAnimating(false), 1300)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [])

  // Check if user came from email verification
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const verified = params.get('verified')
    
    if (verified === 'true' && !isAnimating) {
      // Animate to Ready to Login after verification
      setTimeout(() => setCurrentProgress(4), 500)
    }
  }, [location, isAnimating])

  const progressSteps = [
    { 
      id: 1, 
      label: t('registrationSuccess.signUp'), 
      icon: CheckCircle, 
      description: t('registrationSuccess.accountCreated')
    },
    { 
      id: 2, 
      label: t('registrationSuccess.emailSent'), 
      icon: CheckCircle, 
      description: t('registrationSuccess.verificationEmailSent')
    },
    { 
      id: 3, 
      label: t('registrationSuccess.emailVerification'), 
      icon: Mail, 
      description: t('registrationSuccess.checkYourInbox')
    },
    { 
      id: 4, 
      label: t('registrationSuccess.readyToLogin'), 
      icon: LogIn, 
      description: t('registrationSuccess.almostThere')
    }
  ]

  const getStepStatus = (stepId) => {
    if (stepId < currentProgress) return 'completed'
    if (stepId === currentProgress) return 'current'
    return 'pending'
  }

  const getProgressPercentage = () => {
    return ((currentProgress - 1) / 3) * 100 // 3 gaps between 4 steps
  }

  const handleResendVerification = async (e) => {
    e.preventDefault()
    
    if (!resendEmail) {
      setResendError('Please enter your email address')
      return
    }
    
    try {
      setResendLoading(true)
      setResendError('')
      setResendSuccess(false)
      
      const apiUrl = import.meta.env.VITE_API_URL || 'https://resilinked-api.onrender.com/api'
      const response = await fetch(`${apiUrl}/auth/verify/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: resendEmail })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setResendSuccess(true)
        setResendError('')
        setTimeout(() => {
          setShowResendForm(false)
          setResendEmail('')
          setResendSuccess(false)
        }, 3000)
      } else {
        setResendError(data.alert || 'Failed to resend verification email. Please try again.')
      }
    } catch (err) {
      setResendError('Network error. Please check your connection and try again.')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="registration-success-container">
      <div className="success-card">
        {/* Logo */}
        <div className="logo-container">
          <span className="logo-text">RL</span>
        </div>

        <h1 className="success-title">
          {t('registrationSuccess.title')}
        </h1>

        <div className="email-badge">
          <Mail className="badge-icon" size={20} />
          <span>{currentProgress === 4 ? t('registrationSuccess.accountVerified') : t('registrationSuccess.checkEmail')}</span>
        </div>

        {/* Horizontal Progress Bar */}
        <div className="progress-bar-container">
          {/* Animated Connecting Line */}
          <div className="progress-line-bg">
            <div 
              className="progress-line-fill"
              style={{
                width: `${getProgressPercentage()}%`
              }}
            />
          </div>

          {progressSteps.map((step, index) => {
            const StepIcon = step.icon
            const status = getStepStatus(step.id)
            const isCompleted = status === 'completed'
            const isCurrent = status === 'current'
            
            return (
              <div 
                key={step.id}
                className="progress-step-item"
              >
                {/* Icon Circle */}
                <div 
                  className={`progress-circle ${status} ${isCurrent ? 'pulse-animation' : ''}`}
                >
                  {StepIcon && <StepIcon 
                    className="progress-icon"
                    color="white"
                    strokeWidth={2.5}
                  />}
                </div>

                {/* Label */}
                <div className="progress-labels">
                  <div className={`progress-label ${isCompleted || isCurrent ? 'active' : ''}`}>
                    {step.label}
                  </div>
                  <div className={`progress-description ${isCompleted || isCurrent ? 'active' : ''}`}>
                    {step.description}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Message */}
        <div className="message-box">
          <p className="message-text">
            {currentProgress === 4 
              ? t('registrationSuccess.verifiedMessage')
              : t('registrationSuccess.emailSentMessage')}
          </p>
          
          {/* Resend Email Toggle - Inside message box */}
          {currentProgress < 4 && !showResendForm && (
            <p className="resend-toggle-text">
              {t('registrationSuccess.didntReceive')}{' '}
              <span 
                className="resend-toggle-link"
                onClick={() => setShowResendForm(true)}
              >
                {t('registrationSuccess.clickToResend')}
              </span>
            </p>
          )}
        </div>

        {/* Resend Email Section */}
        {showResendForm && currentProgress < 4 && (
          <div className="resend-form-container">
            {!resendSuccess ? (
              <form onSubmit={handleResendVerification} className="resend-form">
                <p className="resend-instructions">{t('registrationSuccess.enterEmailToResend')}</p>
                
                {resendError && <div className="resend-error-alert">{resendError}</div>}
                
                <div className="resend-input-group">
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder={t('registrationSuccess.emailPlaceholder')}
                    className="resend-email-input"
                    disabled={resendLoading}
                    required
                  />
                  <div className="resend-button-group">
                    <button
                      type="submit"
                      className="resend-submit-button"
                      disabled={resendLoading || !resendEmail}
                    >
                      {resendLoading ? t('registrationSuccess.sending') : t('registrationSuccess.resendButton')}
                    </button>
                    <button
                      type="button"
                      className="resend-cancel-button"
                      onClick={() => {
                        setShowResendForm(false)
                        setResendEmail('')
                        setResendError('')
                      }}
                      disabled={resendLoading}
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="resend-success-alert">
                <CheckCircle className="success-check-icon" size={24} />
                <p>{t('registrationSuccess.emailSentSuccess')}</p>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <Link 
          to="/login"
          className="login-button"
        >
          {currentProgress === 4 ? t('registrationSuccess.goToLogin') : t('registrationSuccess.goToLogin')}
        </Link>
      </div>

      <style>{`
        .registration-success-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .success-card {
          max-width: 900px;
          width: 100%;
          background: rgba(255, 255, 255, 0.98);
          border-radius: 24px;
          padding: 60px 40px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          text-align: center;
        }

        .logo-container {
          width: 120px;
          height: 120px;
          margin: 0 auto 30px;
          background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 30px rgba(147, 51, 234, 0.4);
        }

        .logo-text {
          font-size: 48px;
          color: white;
          font-weight: bold;
        }

        .success-title {
          font-size: 42px;
          font-weight: bold;
          color: #1a202c;
          margin-bottom: 10px;
          margin-top: 0;
        }

        .email-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
          color: white;
          padding: 8px 20px;
          border-radius: 20px;
          fontSize: 16px;
          font-weight: 600;
          margin-bottom: 40px;
        }

        .badge-icon {
          width: 20px;
          height: 20px;
        }

        .progress-bar-container {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          position: relative;
          margin: 60px 0;
          padding: 0 20px;
        }

        .progress-line-bg {
          position: absolute;
          top: 30px;
          left: 15%;
          right: 15%;
          height: 4px;
          background: #e5e7eb;
          z-index: 0;
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-line-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: linear-gradient(90deg, #9333ea 0%, #7c3aed 100%);
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 2px;
        }

        .progress-step-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 1;
          transition: all 0.5s ease;
        }

        .progress-circle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 4px solid white;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .progress-circle.completed,
        .progress-circle.current {
          background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
          box-shadow: 0 8px 20px rgba(147, 51, 234, 0.4);
        }

        .progress-circle.pending {
          background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }

        .progress-circle.current {
          transform: scale(1.1);
        }

        .progress-icon {
          width: 28px;
          height: 28px;
          transition: all 0.3s ease;
        }

        .progress-labels {
          margin-top: 15px;
          text-align: center;
          transition: all 0.3s ease;
        }

        .progress-label {
          font-size: 16px;
          font-weight: 700;
          color: #9ca3af;
          margin-bottom: 4px;
          transition: color 0.3s ease;
        }

        .progress-label.active {
          color: #1a202c;
        }

        .progress-description {
          font-size: 13px;
          color: #d1d5db;
          font-weight: 500;
          transition: color 0.3s ease;
        }

        .progress-description.active {
          color: #6b7280;
        }

        .message-box {
          background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
          border: 2px solid #9333ea;
          border-radius: 16px;
          padding: 24px;
          margin-top: 40px;
          margin-bottom: 30px;
          transition: all 0.3s ease;
        }

        .message-text {
          font-size: 16px;
          color: #581c87;
          line-height: 1.6;
          margin: 0 0 12px 0;
        }

        .resend-toggle-text {
          font-size: 14px;
          color: #6b7280;
          margin: 12px 0 0 0;
          line-height: 1.5;
        }

        .resend-toggle-link {
          color: #7c3aed;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
          transition: color 0.2s ease;
          display: inline;
        }

        .resend-toggle-link:hover {
          color: #6b21a8;
        }

        .login-button {
          display: inline-block;
          background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
          color: white;
          padding: 16px 48px;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 600;
          text-decoration: none;
          box-shadow: 0 8px 20px rgba(147, 51, 234, 0.4);
          transition: all 0.3s ease;
        }

        .login-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(147, 51, 234, 0.5);
        }

        .resend-form-container {
          width: 100%;
          max-width: 500px;
          margin: 20px auto 30px;
          padding: 24px;
          background: rgba(147, 51, 234, 0.05);
          border-radius: 16px;
          border: 2px solid rgba(147, 51, 234, 0.15);
        }

        .resend-form {
          text-align: left;
        }

        .resend-instructions {
          margin-bottom: 16px;
          color: #4b5563;
          font-size: 14px;
          font-weight: 500;
          text-align: center;
        }

        .resend-error-alert {
          padding: 12px 16px;
          background-color: #fef2f2;
          border-left: 4px solid #ef4444;
          color: #b91c1c;
          margin-bottom: 16px;
          border-radius: 8px;
          font-size: 14px;
          text-align: left;
        }

        .resend-input-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .resend-email-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background: #ffffff;
          font-size: 15px;
          transition: all 0.2s;
        }

        .resend-email-input:focus {
          outline: none;
          border-color: #7c3aed;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
        }

        .resend-email-input:disabled {
          background: #f3f4f6;
          cursor: not-allowed;
        }

        .resend-button-group {
          display: flex;
          gap: 12px;
        }

        .resend-submit-button {
          flex: 1;
          background: linear-gradient(135deg, #9333ea, #7c3aed);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25);
        }

        .resend-submit-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #8b31da, #6c2edd);
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(124, 58, 237, 0.3);
        }

        .resend-submit-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
          opacity: 0.6;
        }

        .resend-cancel-button {
          flex: 0 0 auto;
          background: #f3f4f6;
          color: #6b7280;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .resend-cancel-button:hover:not(:disabled) {
          background: #e5e7eb;
          color: #4b5563;
        }

        .resend-cancel-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .resend-success-alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #ecfdf5;
          border-radius: 12px;
          border: 2px solid #10b981;
        }

        .success-check-icon {
          color: #059669;
          min-width: 24px;
        }

        .resend-success-alert p {
          margin: 0;
          color: #065f46;
          font-size: 14px;
          font-weight: 500;
          text-align: left;
        }

        .pulse-animation {
          animation: pulse-animation 2s ease-in-out infinite;
        }

        @keyframes pulse-animation {
          0%, 100% {
            transform: scale(1.1);
            box-shadow: 0 8px 20px rgba(147, 51, 234, 0.4);
          }
          50% {
            transform: scale(1.15);
            box-shadow: 0 12px 30px rgba(147, 51, 234, 0.6);
          }
        }

        @keyframes iconBounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        /* Tablet Responsive */
        @media (max-width: 768px) {
          .success-card {
            padding: 40px 30px;
          }

          .logo-container {
            width: 100px;
            height: 100px;
            margin-bottom: 20px;
          }

          .logo-text {
            font-size: 40px;
          }

          .success-title {
            font-size: 32px;
          }

          .email-badge {
            font-size: 14px;
            padding: 6px 16px;
            margin-bottom: 30px;
          }

          .progress-bar-container {
            margin: 40px 0;
            padding: 0 10px;
          }

          .progress-circle {
            width: 50px;
            height: 50px;
            border: 3px solid white;
          }

          .progress-icon {
            width: 24px;
            height: 24px;
          }

          .progress-line-bg {
            top: 25px;
            left: 12%;
            right: 12%;
          }

          .progress-label {
            font-size: 14px;
          }

          .progress-description {
            font-size: 11px;
          }

          .message-box {
            padding: 20px;
            margin-top: 30px;
            margin-bottom: 25px;
          }

          .message-text {
            font-size: 14px;
          }

          .login-button {
            padding: 14px 40px;
            font-size: 16px;
          }

          .resend-form-container {
            padding: 20px;
          }
        }

        /* Mobile Responsive */
        @media (max-width: 480px) {
          .registration-success-container {
            padding: 15px;
          }

          .success-card {
            padding: 30px 20px;
            border-radius: 20px;
          }

          .logo-container {
            width: 80px;
            height: 80px;
            border-radius: 20px;
            margin-bottom: 15px;
          }

          .logo-text {
            font-size: 32px;
          }

          .success-title {
            font-size: 24px;
            margin-bottom: 8px;
          }

          .email-badge {
            font-size: 13px;
            padding: 6px 14px;
            margin-bottom: 25px;
          }

          .badge-icon {
            width: 16px;
            height: 16px;
          }

          .progress-bar-container {
            margin: 30px 0;
            padding: 0 5px;
            flex-wrap: wrap;
            gap: 20px;
          }

          .progress-step-item {
            flex: 0 0 calc(50% - 10px);
            min-width: 120px;
          }

          .progress-line-bg {
            display: none;
          }

          .progress-circle {
            width: 45px;
            height: 45px;
          }

          .progress-icon {
            width: 20px;
            height: 20px;
          }

          .progress-labels {
            margin-top: 10px;
          }

          .progress-label {
            font-size: 12px;
            margin-bottom: 2px;
          }

          .progress-description {
            font-size: 10px;
          }

          .message-box {
            padding: 16px;
            margin-top: 20px;
            margin-bottom: 20px;
            border-radius: 12px;
          }

          .message-text {
            font-size: 13px;
            line-height: 1.5;
          }

          .login-button {
            padding: 12px 32px;
            font-size: 15px;
            width: 100%;
            max-width: 280px;
          }

          .resend-form-container {
            padding: 16px;
            margin: 15px auto 25px;
          }

          .resend-button-group {
            flex-direction: column;
          }

          .resend-submit-button,
          .resend-cancel-button {
            width: 100%;
            font-size: 14px;
          }
        }

        /* Small Mobile */
        @media (max-width: 360px) {
          .success-card {
            padding: 25px 15px;
          }

          .success-title {
            font-size: 20px;
          }

          .progress-step-item {
            flex: 0 0 100%;
          }

          .progress-label {
            font-size: 11px;
          }

          .progress-description {
            font-size: 9px;
          }
        }
      `}</style>
    </div>
  )
}

export default RegistrationSuccess
