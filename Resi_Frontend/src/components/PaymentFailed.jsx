import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiService from '../api';
import './PaymentFailed.css';

const PaymentFailed = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const jobId = searchParams.get('jobId');

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        if (jobId) {
          const response = await apiService.getJobPayment(jobId);
          if (response.payments && response.payments.length > 0) {
            // Get the most recent payment for this job
            setPaymentDetails(response.payments[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching payment details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [jobId]);

  const handleRetryPayment = () => {
    navigate('/employer-dashboard');
  };

  const handleContactSupport = () => {
    navigate('/support');
  };

  if (loading) {
    return (
      <div className="payment-result-container">
        <div className="payment-result-card loading">
          <div className="spinner"></div>
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-result-container">
      <div className="payment-result-card failed">
        <div className="icon failed-icon">❌</div>
        <h2>Payment Failed</h2>
        <p className="failed-message">
          We couldn't process your payment. This could be due to:
        </p>

        <div className="failure-reasons">
          <ul>
            <li>Insufficient funds in your account</li>
            <li>Payment was cancelled</li>
            <li>Network connection issue</li>
            <li>Payment timeout</li>
          </ul>
        </div>

        {paymentDetails && (
          <div className="payment-info">
            <h3>Payment Attempt Details</h3>
            <div className="info-row">
              <span className="label">Payment ID:</span>
              <span className="value">{paymentDetails._id}</span>
            </div>
            <div className="info-row">
              <span className="label">Amount:</span>
              <span className="value">₱{paymentDetails.amount?.toLocaleString()}</span>
            </div>
            <div className="info-row">
              <span className="label">Payment Method:</span>
              <span className="value">{paymentDetails.paymentMethod?.toUpperCase()}</span>
            </div>
            <div className="info-row">
              <span className="label">Status:</span>
              <span className={`value status ${paymentDetails.status}`}>
                {paymentDetails.status?.toUpperCase()}
              </span>
            </div>
          </div>
        )}

        <div className="next-steps">
          <h3>What You Can Do:</h3>
          <ul>
            <li>Check your account balance and try again</li>
            <li>Try a different payment method</li>
            <li>Contact your bank if the issue persists</li>
            <li>Reach out to our support team for assistance</li>
          </ul>
        </div>

        <div className="action-buttons">
          <button onClick={handleRetryPayment} className="btn-primary">
            Try Again
          </button>
          <button onClick={handleContactSupport} className="btn-secondary">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;
