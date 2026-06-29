import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiService from '../api';
import { useTranslation } from '../hooks/useTranslation';
import { Mail, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

function VerifyEmail() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showResendForm, setShowResendForm] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        setLoading(true);
        
        // Call the backend endpoint to verify the email
        const apiUrl = import.meta.env.VITE_API_URL || 'https://resilinked-api.onrender.com/api';
        const response = await fetch(`${apiUrl}/auth/verify-email/${token}`);
        
        const data = await response.json();
        
        if (response.ok) {
          setSuccess(true);
          // Redirect to registration success page with verified flag after 2 seconds
          setTimeout(() => {
            navigate('/registration-success?verified=true');
          }, 2000);
        } else {
          setError(data.alert || 'Email verification failed. This link may be invalid or expired.');
        }
      } catch (err) {
        // Error already handled - don't log verification details
        setError('Network error. Please try again later or contact support.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      verifyEmail();
    } else {
      setError('Invalid verification link. No token provided.');
      setLoading(false);
    }
  }, [token, navigate]);

  const handleResendVerification = async (e) => {
    e.preventDefault();
    
    if (!resendEmail) {
      setResendError('Please enter your email address');
      return;
    }
    
    try {
      setResendLoading(true);
      setResendError('');
      setResendSuccess(false);
      
      const apiUrl = import.meta.env.VITE_API_URL || 'https://resilinked-api.onrender.com/api';
      const response = await fetch(`${apiUrl}/auth/verify/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: resendEmail })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResendSuccess(true);
        setResendError('');
        setTimeout(() => {
          setShowResendForm(false);
          setResendEmail('');
          setResendSuccess(false);
        }, 3000);
      } else {
        setResendError(data.alert || 'Failed to resend verification email. Please try again.');
      }
    } catch (err) {
      setResendError('Network error. Please check your connection and try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="email-verification-container">
      <div className="verification-card">
        {/* Logo */}
        <div className="logo-container">
          <span className="logo-text">RL</span>
        </div>

        {loading ? (
          <div className="verification-loading">
            <div className="verification-spinner"></div>
            <h2>{t('verifyEmail.verifying')}</h2>
            <p>{t('verifyEmail.pleaseWait')}</p>
          </div>
        ) : success ? (
          <div className="verification-success">
            <div className="verification-icon-success">
              <CheckCircle size={48} strokeWidth={2.5} />
            </div>
            <h2>{t('verifyEmail.successTitle')}</h2>
            <p>{t('verifyEmail.successMessage')}</p>
            <div className="redirect-animation">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          </div>
        ) : (
          <div className="verification-error">
            <div className="verification-icon-error">
              <XCircle size={48} strokeWidth={2.5} />
            </div>
            <h2>{t('verifyEmail.errorTitle')}</h2>
            <p className="error-message">{error}</p>
            
            {!showResendForm && !resendSuccess && (
              <div className="resend-prompt">
                <Mail className="mail-icon" size={20} />
                <p className="resend-text">
                  {t('verifyEmail.didntReceive')}{' '}
                  <span 
                    className="resend-link"
                    onClick={() => setShowResendForm(true)}
                  >
                    {t('verifyEmail.clickToResend')}
                  </span>
                </p>
              </div>
            )}

            {showResendForm && !resendSuccess && (
              <div className="resend-form-container">
                <form onSubmit={handleResendVerification} className="resend-form">
                  <div className="resend-header">
                    <RefreshCw size={24} className="resend-icon" />
                    <h3>{t('verifyEmail.resendTitle')}</h3>
                  </div>
                  <p className="resend-instructions">{t('verifyEmail.resendInstructions')}</p>
                  
                  {resendError && (
                    <div className="resend-error-alert">
                      <XCircle size={18} />
                      <span>{resendError}</span>
                    </div>
                  )}
                  
                  <div className="resend-input-group">
                    <input
                      type="email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder={t('verifyEmail.emailPlaceholder')}
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
                        {resendLoading ? t('verifyEmail.sending') : t('verifyEmail.resendButton')}
                      </button>
                      <button
                        type="button"
                        className="resend-cancel-button"
                        onClick={() => {
                          setShowResendForm(false);
                          setResendEmail('');
                          setResendError('');
                        }}
                        disabled={resendLoading}
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {resendSuccess && (
              <div className="resend-success-message">
                <CheckCircle className="resend-success-icon" size={24} />
                <div className="resend-success-text">
                  <h4>{t('verifyEmail.emailSentTitle')}</h4>
                  <p>{t('verifyEmail.emailSentMessage')}</p>
                </div>
              </div>
            )}
            
            <div className="verification-actions">
              <Link to="/register" className="verification-link">
                {t('verifyEmail.registerNew')}
              </Link>
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .email-verification-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem 1rem;
        }
        
        .verification-card {
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          padding: 3.5rem 2.5rem;
          width: 100%;
          max-width: 550px;
          text-align: center;
        }

        .logo-container {
          width: 70px;
          height: 70px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 2rem;
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
        }

        .logo-text {
          font-size: 32px;
          font-weight: 800;
          color: white;
          letter-spacing: -1px;
        }
        
        .verification-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
        }

        .verification-loading h2 {
          color: #1f2937;
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .verification-loading p {
          color: #6b7280;
          margin: 0;
          font-size: 0.9375rem;
        }
        
        .verification-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .verification-success, 
        .verification-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
        }
        
        .verification-icon-success,
        .verification-icon-error {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .verification-icon-success {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          animation: scaleIn 0.5s ease-out;
          box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
        }
        
        .verification-icon-error {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          animation: shake 0.5s ease-out;
          box-shadow: 0 10px 30px rgba(239, 68, 68, 0.3);
        }

        @keyframes scaleIn {
          0% { transform: scale(0); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        
        .verification-success h2,
        .verification-error h2 {
          color: #1f2937;
          margin: 0;
          font-size: 1.75rem;
          font-weight: 700;
        }
          font-weight: 700;
        }
        
        .verification-success p,
        .verification-error p {
          color: #6b7280;
          margin: 0;
          line-height: 1.6;
          font-size: 0.9375rem;
        }

        .error-message {
          color: #dc2626;
          font-weight: 500;
        }

        .redirect-animation {
          display: flex;
          gap: 10px;
          margin-top: 1.25rem;
        }

        .dot {
          width: 12px;
          height: 12px;
          background: #667eea;
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }

        .dot:nth-child(1) {
          animation-delay: -0.32s;
        }

        .dot:nth-child(2) {
          animation-delay: -0.16s;
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
        
        .verification-actions {
          margin-top: 1.875rem;
          display: flex;
          gap: 0.9375rem;
          justify-content: center;
        }

        .verification-link {
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
          font-size: 0.9375rem;
        }

        .verification-link:hover {
          color: #764ba2;
          text-decoration: underline;
        }

        .resend-prompt {
          margin-top: 1.5625rem;
          padding: 1.25rem;
          background: linear-gradient(135deg, #f9fafb, #f3f4f6);
          border-radius: 12px;
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border: 1px solid #e5e7eb;
        }

        .mail-icon {
          color: #667eea;
          flex-shrink: 0;
        }

        .resend-text {
          color: #4b5563;
          font-size: 0.875rem;
          margin: 0;
          text-align: left;
        }

        .resend-link {
          color: #667eea;
          cursor: pointer;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.3s ease;
          border-bottom: 1px solid #667eea;
        }

        .resend-link:hover {
          color: #764ba2;
          border-bottom-color: #764ba2;
        }

        .resend-form-container {
          margin-top: 1.5625rem;
          width: 100%;
          background: linear-gradient(135deg, #f9fafb, #f3f4f6);
          padding: 1.5625rem;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        }

        .resend-form {
          display: flex;
          flex-direction: column;
          gap: 1.125rem;
        }

        .resend-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          justify-content: center;
        }

        .resend-icon {
          color: #667eea;
        }

        .resend-header h3 {
          margin: 0;
          color: #1f2937;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .resend-instructions {
          font-size: 0.875rem;
          color: #4b5563;
          margin: 0;
          text-align: center;
        }

        .resend-input-group {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .resend-email-input {
          padding: 0.875rem 1rem;
          border: 2px solid #d1d5db;
          border-radius: 10px;
          font-size: 0.9375rem;
          width: 100%;
          box-sizing: border-box;
          transition: all 0.3s ease;
          background: white;
        }

        .resend-email-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .resend-email-input:disabled {
          background: #f3f4f6;
          cursor: not-allowed;
        }

        .resend-button-group {
          display: flex;
          gap: 0.625rem;
        }

        .resend-submit-button {
          flex: 1;
          padding: 0.875rem 1.5rem;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 0.9375rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .resend-submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        .resend-submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .resend-cancel-button {
          padding: 0.875rem 1.5rem;
          background: white;
          color: #667eea;
          border: 2px solid #667eea;
          border-radius: 10px;
          font-size: 0.9375rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .resend-cancel-button:hover:not(:disabled) {
          background: #f9fafb;
          transform: translateY(-1px);
        }

        .resend-cancel-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .resend-error-alert {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          background: #fee2e2;
          color: #dc2626;
          padding: 0.875rem 1rem;
          border-radius: 10px;
          font-size: 0.875rem;
          text-align: left;
          border: 1px solid #fecaca;
        }

        .resend-success-message {
          margin-top: 1.5625rem;
          padding: 1.25rem;
          background: linear-gradient(135deg, #d1fae5, #a7f3d0);
          border: 2px solid #6ee7b7;
          border-radius: 12px;
          display: flex;
          align-items: flex-start;
          gap: 0.9375rem;
        }

        .resend-success-icon {
          color: #059669;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .resend-success-text h4 {
          margin: 0 0 0.5rem 0;
          color: #065f46;
          font-size: 1rem;
          font-weight: 700;
        }

        .resend-success-text p {
          margin: 0;
          color: #047857;
          text-align: left;
          font-size: 0.875rem;
        }

        @media (max-width: 600px) {
          .verification-card {
            padding: 2.5rem 1.5rem;
          }

          .verification-card h2 {
            font-size: 1.5rem;
          }

          .resend-button-group {
            flex-direction: column;
          }

          .resend-form-container {
            padding: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
}

export default VerifyEmail;
