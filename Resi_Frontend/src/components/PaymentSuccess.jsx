import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiService from '../api';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState('loading');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [error, setError] = useState(null);

  const jobId = searchParams.get('jobId');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        if (!jobId) {
          console.error('❌ No job ID provided in URL');
          setError('No job ID provided');
          setPaymentStatus('error');
          return;
        }

        console.log('🔍 Starting payment verification for job:', jobId);

        // FIRST: Call the completion endpoint to check PayMongo and complete if ready
        try {
          console.log('📞 Calling completion endpoint...');
          const completionResponse = await apiService.completePaymentByJobId(jobId);
          console.log('✅ Completion response:', completionResponse);
          
          if (completionResponse.success) {
            if (completionResponse.payment.status === 'succeeded') {
              console.log('✅ Payment completed successfully!');
              setPaymentDetails(completionResponse.payment);
              setPaymentStatus('success');
              setError(null);
              return; // Exit early - payment is done!
            } else {
              console.log('⏳ Payment still processing:', completionResponse.payment.status);
            }
          }
        } catch (completionError) {
          console.error('⚠️ Completion endpoint error:', completionError);
          console.error('Error details:', completionError.response?.data || completionError.message);
          // Continue to polling fallback
        }

        // FALLBACK: Get payment details and poll
        console.log('📊 Fetching payment details...');
        const response = await apiService.getJobPayment(jobId);
        console.log('Payment response:', response);
        
        if (response.payments && response.payments.length > 0) {
          // Get the most recent payment for this job
          const latestPayment = response.payments[0];
          console.log('💳 Latest payment:', latestPayment);
          setPaymentDetails(latestPayment);
          
          // Check if payment is actually completed
          if (latestPayment.status === 'paid' || latestPayment.status === 'succeeded') {
            console.log('✅ Payment already completed!');
            setPaymentStatus('success');
          } else if (latestPayment.status === 'pending' || latestPayment.status === 'processing') {
            // Payment is still pending - show waiting message and poll
            console.log('⏳ Payment pending/processing - starting poll...');
            setPaymentStatus('loading');
            setError('Payment is being processed. Please wait...');
            
            // Poll by calling completion endpoint every 5 seconds
            const pollInterval = setInterval(async () => {
              try {
                console.log('🔄 Polling payment status...');
                
                // Try completion endpoint first
                const completionResponse = await apiService.completePaymentByJobId(jobId);
                console.log('Poll completion response:', completionResponse);
                
                if (completionResponse.success && completionResponse.payment.status === 'succeeded') {
                  console.log('✅ Payment completed via polling!');
                  setPaymentDetails(completionResponse.payment);
                  setPaymentStatus('success');
                  setError(null);
                  clearInterval(pollInterval);
                  return;
                }
                
                // Fallback to getJobPayment
                const pollResponse = await apiService.getJobPayment(jobId);
                if (pollResponse.payments && pollResponse.payments.length > 0) {
                  const payment = pollResponse.payments[0];
                  console.log('Poll status:', payment.status);
                  
                  if (payment.status === 'paid' || payment.status === 'succeeded') {
                    console.log('✅ Payment succeeded!');
                    setPaymentDetails(payment);
                    setPaymentStatus('success');
                    setError(null);
                    clearInterval(pollInterval);
                  } else if (payment.status === 'failed') {
                    console.error('❌ Payment failed!');
                    setError('Payment failed');
                    setPaymentStatus('error');
                    clearInterval(pollInterval);
                  }
                }
              } catch (pollErr) {
                console.error('❌ Poll error:', pollErr);
              }
            }, 5000);

            // Stop polling after 2 minutes
            setTimeout(() => {
              clearInterval(pollInterval);
              if (paymentStatus === 'loading') {
                console.error('⏰ Payment verification timed out');
                setError('Payment verification timed out. Please check your payment history or contact support.');
                setPaymentStatus('error');
              }
            }, 120000);
          } else if (latestPayment.status === 'failed') {
            console.error('❌ Payment failed:', latestPayment);
            setError('Payment failed: ' + (latestPayment.errorMessage || 'Unknown error'));
            setPaymentStatus('error');
          } else {
            console.error('⚠️ Unknown payment status:', latestPayment.status);
            setError('Unknown payment status: ' + latestPayment.status);
            setPaymentStatus('error');
          }
        } else {
          console.error('❌ No payments found for job:', jobId);
          setError('Payment not found');
          setPaymentStatus('error');
        }
      } catch (err) {
        console.error('❌ Error verifying payment:', err);
        console.error('Error stack:', err.stack);
        console.error('Error response:', err.response?.data);
        setError(err.response?.data?.message || err.message || 'Failed to verify payment');
        setPaymentStatus('error');
      }
    };

    verifyPayment();
  }, [jobId]);

  const handleGoToDashboard = () => {
    navigate('/employer-dashboard');
  };

  if (paymentStatus === 'loading') {
    return (
      <div className="payment-result-container">
        <div className="payment-result-card loading">
          <div className="spinner"></div>
          <h2>Verifying Payment...</h2>
          <p>Please wait while we confirm your payment</p>
          {error && <p className="pending-message">⏳ {error}</p>}
        </div>
      </div>
    );
  }

  if (paymentStatus === 'error') {
    return (
      <div className="payment-result-container">
        <div className="payment-result-card error">
          <div className="icon error-icon">❌</div>
          <h2>Payment Verification Failed</h2>
          <p className="error-message">{error}</p>
          <button onClick={handleGoToDashboard} className="btn-primary">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-result-container">
      <div className="payment-result-card success">
        <div className="icon success-icon">✅</div>
        <h2>Payment Successful!</h2>
        <p className="success-message">Your payment has been processed successfully</p>

        {paymentDetails && (
          <div className="payment-info">
            <h3>Payment Details</h3>
            <div className="info-row">
              <span className="label">Payment ID:</span>
              <span className="value">{paymentDetails._id}</span>
            </div>
            <div className="info-row">
              <span className="label">Amount Paid:</span>
              <span className="value amount">₱{paymentDetails.amount?.toLocaleString()}</span>
            </div>
            <div className="info-row">
              <span className="label">Job Price:</span>
              <span className="value">₱{paymentDetails.workerAmount?.toLocaleString()}</span>
            </div>
            <div className="info-row">
              <span className="label">Platform Fee:</span>
              <span className="value">₱{paymentDetails.platformFee?.toLocaleString()}</span>
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
          <h3>What's Next?</h3>
          <ul>
            <li>✓ The worker will receive the full job price (₱{paymentDetails?.workerAmount?.toLocaleString()})</li>
            <li>✓ The job has been marked as completed</li>
            <li>✓ A receipt has been sent to your email</li>
            <li>✓ You can now rate and review the worker</li>
          </ul>
        </div>

        <button onClick={handleGoToDashboard} className="btn-primary">
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
