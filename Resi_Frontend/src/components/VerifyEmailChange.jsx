import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../api';
import { useAlert } from '../context/AlertContext';

function VerifyEmailChange() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useAlert();
  const [verifying, setVerifying] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState('');

  useEffect(() => {
    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      setVerifying(true);
      const response = await apiService.verifyEmailChange(token);
      
      setVerificationStatus('success');
      success(response.alert || 'Your email has been successfully changed!');
      
      // Update local storage with new user data
      if (response.user) {
        const currentUserData = JSON.parse(localStorage.getItem('userData') || '{}');
        const updatedUserData = { ...currentUserData, email: response.user.email };
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
      }
      
      setTimeout(() => {
        navigate('/employee-dashboard');
      }, 3000);
    } catch (error) {
      console.error('Email verification error:', error);
      setVerificationStatus('error');
      showError(error.message || 'Failed to verify email change');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="email-verification-container">
      <div className="verification-card">
        {verifying ? (
          <div className="verification-loading">
            <div className="logo-container">
              <img src="/resi.png" alt="ResiLinked" className="logo-image" />
            </div>
            <h2 className="main-title">Verifying Email Change...</h2>
            <div className="verification-spinner"></div>
            <p>Please wait while we verify your email change request.</p>
          </div>
        ) : verificationStatus === 'success' ? (
          <div className="verification-success">
            <div className="logo-container">
              <img src="/resi.png" alt="ResiLinked" className="logo-image" />
            </div>
            <div className="verification-icon-success">✓</div>
            <h2>Email Changed Successfully!</h2>
            <p>Your email address has been successfully updated.</p>
            <div className="redirect-animation">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
            <p className="redirect-text">Redirecting you to your dashboard...</p>
          </div>
        ) : (
          <div className="verification-error">
            <div className="verification-icon-error">✗</div>
            <h2>Verification Failed</h2>
            <p>The verification link is invalid or has expired.</p>
            <button 
              className="verification-button"
              onClick={() => navigate('/employee-dashboard')}
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .email-verification-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #9333ea 0%, #7c3aed 25%, #6b21a8 75%, #581c87 100%);
          padding: 2rem 1rem;
        }
        
        .verification-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          box-shadow: 
            0 32px 64px rgba(147, 51, 234, 0.2),
            0 0 0 1px rgba(255, 255, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          padding: 60px 40px;
          width: 100%;
          max-width: 900px;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .logo-container {
          width: 100px;
          height: 100px;
          margin: 0 auto 20px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(147, 51, 234, 0.15);
        }

        .logo-image {
          width: 70px;
          height: 70px;
          object-fit: contain;
        }

        .main-title, .success-main-title {
          font-size: 42px;
          font-weight: 800;
          margin-bottom: 40px;
          background: linear-gradient(135deg, #9333ea, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-align: center;
        }

        /* Progress Bar Styles */
        .progress-bar-container {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin: 50px 0;
          position: relative;
          padding: 0 20px;
        }

        .progress-line-bg {
          position: absolute;
          top: 30px;
          left: 15%;
          right: 15%;
          height: 4px;
          background: rgba(147, 51, 234, 0.1);
          border-radius: 2px;
          z-index: 0;
        }

        .progress-line-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: linear-gradient(90deg, #9333ea, #7c3aed);
          border-radius: 2px;
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .progress-step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          position: relative;
          z-index: 1;
        }

        .progress-circle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          transition: all 0.3s ease;
          border: 4px solid white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .progress-circle.completed {
          background: linear-gradient(135deg, #9333ea, #7c3aed);
          border-color: #9333ea;
        }

        .progress-circle.current {
          background: white;
          border-color: #9333ea;
        }

        .progress-circle.pending {
          background: #f1f5f9;
          border-color: #e2e8f0;
        }

        .progress-icon {
          width: 28px;
          height: 28px;
          color: white;
        }

        .progress-circle.current .progress-icon {
          color: #9333ea;
        }

        .progress-circle.pending .progress-icon {
          color: #94a3b8;
        }

        .progress-labels {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          max-width: 120px;
        }

        .progress-label {
          font-size: 16px;
          font-weight: 700;
          color: #64748b;
          text-align: center;
          transition: color 0.3s ease;
        }

        .progress-label.active {
          color: #1e293b;
        }

        .progress-description {
          font-size: 13px;
          color: #94a3b8;
          text-align: center;
          transition: color 0.3s ease;
        }

        .progress-description.active {
          color: #64748b;
        }

        .message-box {
          background: linear-gradient(135deg, rgba(147, 51, 234, 0.08), rgba(124, 58, 237, 0.08));
          border: 2px solid rgba(147, 51, 234, 0.2);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 30px;
        }

        .message-text {
          font-size: 16px;
          color: #7c3aed;
          font-weight: 600;
          margin: 0;
        }

        @keyframes pulse-animation {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 4px 12px rgba(147, 51, 234, 0.2);
          }
          50% {
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(147, 51, 234, 0.4);
          }
        }

        .pulse-animation {
          animation: pulse-animation 2s ease-in-out infinite;
        }
        
        .verification-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .verification-loading p {
          color: #64748b;
          font-size: 1.125rem;
          margin-top: 20px;
        }
        
        .verification-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(147, 51, 234, 0.1);
          border-top: 4px solid #7c3aed;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1.5rem;
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
        }
        
        .verification-icon-error {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          margin-bottom: 1.5rem;
          font-weight: bold;
          background-color: #fef2f2;
          color: #dc2626;
          border: 2px solid #ef4444;
        }
        
        .verification-error h2 {
          margin-bottom: 1rem;
          font-size: 1.875rem;
          font-weight: 700;
          color: #1e293b;
        }
        
        .verification-error p {
          margin-bottom: 1.5rem;
          color: #64748b;
          line-height: 1.6;
          font-size: 1.125rem;
        }
        
        .redirect-animation {
          display: flex;
          gap: 8px;
          justify-content: center;
          margin-top: 1rem;
        }

        .dot {
          width: 12px;
          height: 12px;
          background: linear-gradient(135deg, #9333ea, #7c3aed);
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
        
        .redirect-text {
          margin-top: 1rem;
          font-size: 0.95rem;
          color: #94a3b8;
        }
        
        .verification-button {
          margin-top: 1rem;
          display: inline-block;
          background: linear-gradient(135deg, #9333ea, #7c3aed);
          color: white;
          border: none;
          padding: 0.875rem 2rem;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          text-decoration: none;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25);
          width: 100%;
          max-width: 250px;
        }
        
        .verification-button:hover {
          background: linear-gradient(135deg, #8b31da, #6c2edd);
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(124, 58, 237, 0.3);
        }
        
        @media (max-width: 768px) {
          .verification-card {
            padding: 40px 30px;
          }

          .logo-container {
            width: 80px;
            height: 80px;
          }

          .main-title, .success-main-title {
            font-size: 32px;
            margin-bottom: 30px;
          }

          .progress-bar-container {
            margin: 40px 0;
          }

          .progress-circle {
            width: 50px;
            height: 50px;
          }

          .progress-icon {
            width: 24px;
            height: 24px;
          }

          .progress-label {
            font-size: 14px;
          }

          .progress-description {
            font-size: 11px;
          }
        }

        @media (max-width: 640px) {
          .verification-card {
            padding: 30px 20px;
          }

          .logo-container {
            width: 70px;
            height: 70px;
          }

          .main-title, .success-main-title {
            font-size: 24px;
            margin-bottom: 25px;
          }

          .progress-bar-container {
            margin: 30px 0;
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

          .progress-label {
            font-size: 12px;
          }

          .progress-description {
            font-size: 10px;
          }

          .message-box {
            padding: 16px;
            margin-bottom: 20px;
          }

          .message-text {
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
}

export default VerifyEmailChange;
