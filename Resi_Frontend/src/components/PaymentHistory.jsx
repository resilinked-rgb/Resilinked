import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../api';
import './PaymentHistory.css';

const PaymentHistory = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'sent', 'received'
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, [filter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getMyPayments(filter);
      setPayments(response.payments || []);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { class: 'status-pending', icon: '⏳', text: 'Pending' },
      paid: { class: 'status-paid', icon: '✅', text: 'Paid' },
      processing: { class: 'status-processing', icon: '🔄', text: 'Processing' },
      failed: { class: 'status-failed', icon: '❌', text: 'Failed' },
      refunded: { class: 'status-refunded', icon: '↩️', text: 'Refunded' }
    };
    const statusInfo = statusMap[status] || statusMap.pending;
    return (
      <span className={`status-badge ${statusInfo.class}`}>
        <span className="status-icon">{statusInfo.icon}</span>
        {statusInfo.text}
      </span>
    );
  };

  const getPaymentMethodBadge = (method) => {
    const methodMap = {
      gcash: { icon: '💳', name: 'GCash' },
      paymaya: { icon: '💰', name: 'PayMaya' },
      grab_pay: { icon: '🚗', name: 'GrabPay' },
      card: { icon: '💳', name: 'Card' },
      manual: { icon: '📄', name: 'Manual Verification' }
    };
    const methodInfo = methodMap[method] || { icon: '💳', name: method };
    return (
      <span className="payment-method-badge">
        <span className="method-icon">{methodInfo.icon}</span>
        {methodInfo.name}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="payment-history-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading payment history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-history-container">
      <div className="payment-history-header">
        <h1>💰 Payment History</h1>
        <p className="subtitle">Track all your payments and transactions</p>
      </div>

      <div className="filter-tabs">
        <button 
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Payments
        </button>
        <button 
          className={`filter-tab ${filter === 'sent' ? 'active' : ''}`}
          onClick={() => setFilter('sent')}
        >
          Sent (Employer)
        </button>
        <button 
          className={`filter-tab ${filter === 'received' ? 'active' : ''}`}
          onClick={() => setFilter('received')}
        >
          Received (Worker)
        </button>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {payments.length === 0 ? (
        <div className="no-payments">
          <div className="no-payments-icon">💸</div>
          <h3>No Payments Found</h3>
          <p>You don't have any payment transactions yet.</p>
        </div>
      ) : (
        <div className="payments-list">
          {payments.map((payment) => (
            <div key={payment._id} className="payment-card">
              <div className="payment-card-header">
                <div className="payment-info-left">
                  <h3 className="payment-title">
                    {payment.jobId?.title || 'Job Deleted'}
                  </h3>
                  <div className="payment-meta">
                    <span className="payment-date">
                      📅 {new Date(payment.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
                <div className="payment-info-right">
                  {getStatusBadge(payment.status)}
                </div>
              </div>

              <div className="payment-card-body">
                <div className="payment-participants">
                  <div className="participant">
                    <span className="participant-label">Employer:</span>
                    <span className="participant-name">
                      {payment.employerId?.firstName} {payment.employerId?.lastName}
                    </span>
                  </div>
                  <span className="arrow">→</span>
                  <div className="participant">
                    <span className="participant-label">Worker:</span>
                    <span className="participant-name">
                      {payment.workerId?.firstName} {payment.workerId?.lastName}
                    </span>
                  </div>
                </div>

                <div className="payment-breakdown">
                  <div className="breakdown-item">
                    <span className="breakdown-label">Job Price:</span>
                    <span className="breakdown-value">₱{payment.workerAmount?.toLocaleString()}</span>
                  </div>
                  <div className="breakdown-item fee">
                    <span className="breakdown-label">Platform Fee:</span>
                    <span className="breakdown-value">₱{payment.platformFee?.toLocaleString()}</span>
                  </div>
                  <div className="breakdown-item total">
                    <span className="breakdown-label">Total Paid:</span>
                    <span className="breakdown-value">₱{payment.amount?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="payment-method-section">
                  {getPaymentMethodBadge(payment.paymentMethod)}
                </div>

                {payment.description && (
                  <div className="payment-description">
                    <p>{payment.description}</p>
                  </div>
                )}

                {payment.receiptImage && (
                  <div className="receipt-section">
                    <h4>Receipt Image:</h4>
                    <a 
                      href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${payment.receiptImage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="receipt-link"
                    >
                      <img 
                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${payment.receiptImage}`}
                        alt="Payment receipt"
                        className="receipt-thumbnail"
                        onError={(e) => {
                          console.error('Receipt image failed to load:', payment.receiptImage);
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <span className="receipt-error" style={{ display: 'none' }}>
                        ⚠️ Receipt image not available
                      </span>
                    </a>
                  </div>
                )}

                {payment.paymongoSourceId && (
                  <div className="payment-ids">
                    <small>
                      <strong>PayMongo ID:</strong> {payment.paymongoSourceId}
                    </small>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
