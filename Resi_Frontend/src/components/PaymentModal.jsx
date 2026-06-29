import { useState } from 'react';
import apiService from '../api';
import './PaymentModal.css';

/**
 * Payment Modal Component for Job Completion
 * Supports PayMongo (GCash, PayMaya, GrabPay, Card) and Manual payment
 */
const PaymentModal = ({ job, onClose, onSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('gcash');
  const [receiptImage, setReceiptImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calculate platform fee (10% by default)
  const PLATFORM_FEE_PERCENTAGE = 10;
  const jobPrice = job.price || 0;
  const platformFee = Math.round((jobPrice * PLATFORM_FEE_PERCENTAGE) / 100);
  const totalAmount = jobPrice + platformFee;

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptImage(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!receiptImage) return null;
    
    const formData = new FormData();
    formData.append('image', receiptImage);
    
    try {
      const response = await apiService.uploadImage(formData);
      return response.imageUrl;
    } catch (err) {
      console.error('Image upload failed:', err);
      return null;
    }
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Upload receipt image if provided (for manual or as backup)
      let receiptUrl = null;
      if (receiptImage) {
        receiptUrl = await uploadImage();
      }

      // Validate manual payment requires receipt
      if (paymentMethod === 'manual' && !receiptUrl) {
        setError('Please upload a payment verification image');
        setLoading(false);
        return;
      }

      // Initiate payment
      const response = await apiService.initiatePayment(
        job._id,
        paymentMethod,
        receiptUrl
      );

      // Handle different payment methods
      if (paymentMethod === 'manual') {
        // Manual payment completes immediately
        onSuccess?.();
        onClose();
        alert('Job marked as complete! Payment verified.');
        return;
      }

      // For e-wallet payments, redirect to checkout
      if (response.checkoutUrl) {
        console.log('🔗 Redirecting to PayMongo checkout:', response.checkoutUrl);
        console.log('✅ You should now see PayMongo\'s page to scan QR code or login');
        
        // Redirect to PayMongo's checkout page
        window.location.href = response.checkoutUrl;
        return;
      } else {
        console.error('❌ No checkout URL received from backend');
        console.log('Response:', response);
      }

      // For card payments, show card input form
      if (response.clientKey) {
        // TODO: Implement PayMongo Elements for card input
        // See: https://developers.paymongo.com/docs/accepting-cards
        alert('Card payment UI coming soon! Please use e-wallet or manual payment.');
        return;
      }

    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="payment-modal-header">
          <h2>Complete Job & Pay</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        <div className="payment-modal-body">
          {/* Job Details */}
          <div className="job-summary">
            <h3>{job.title}</h3>
            <div className="payment-breakdown">
              <div className="breakdown-row">
                <span className="label">Job Price:</span>
                <span className="value">₱{jobPrice.toLocaleString()}</span>
              </div>
              <div className="breakdown-row fee">
                <span className="label">Platform Fee ({PLATFORM_FEE_PERCENTAGE}%):</span>
                <span className="value">₱{platformFee.toLocaleString()}</span>
              </div>
              <div className="breakdown-row total">
                <span className="label">Total Amount:</span>
                <span className="value">₱{totalAmount.toLocaleString()}</span>
              </div>
              <div className="worker-receives">
                <small>Worker receives: ₱{jobPrice.toLocaleString()} (full job price)</small>
              </div>
            </div>
            <p className="worker">
              Worker: {job.assignedTo?.firstName || job.acceptedApplicant?.firstName} {job.assignedTo?.lastName || job.acceptedApplicant?.lastName}
            </p>
          </div>

          {/* Payment Method Selection */}
          <div className="payment-method-section">
            <h4>Select Payment Method</h4>
            
            <div className="payment-methods">
              {/* E-Wallet Options */}
              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="gcash"
                  checked={paymentMethod === 'gcash'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <div className="option-content">
                  <img src="/Gcash.webp" alt="GCash" />
                  <span>GCash</span>
                </div>
              </label>

              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="paymaya"
                  checked={paymentMethod === 'paymaya'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <div className="option-content">
                  <img src="Paymaya.png" alt="PayMaya" />
                  <span>PayMaya</span>
                </div>
              </label>

              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="grab_pay"
                  checked={paymentMethod === 'grab_pay'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <div className="option-content">
                  <img src="grabpay.webp" alt="GrabPay" />
                  <span>GrabPay</span>
                </div>
              </label>

              {/* Card Payment */}
              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <div className="option-content">
                  <span>💳</span>
                  <span>Credit/Debit Card</span>
                </div>
              </label>

              {/* Manual Payment */}
              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="manual"
                  checked={paymentMethod === 'manual'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <div className="option-content">
                  <span>📄</span>
                  <span>Manual Verification</span>
                </div>
              </label>
            </div>
          </div>

          {/* Receipt Upload (Required for manual, optional for others) */}
          {paymentMethod === 'manual' && (
            <div className="receipt-section">
              <h4>Upload Payment Verification</h4>
              <p className="helper-text">
                Upload a screenshot or photo of your payment confirmation
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                required
              />
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Receipt preview" />
                </div>
              )}
            </div>
          )}

          {paymentMethod !== 'manual' && (
            <div className="receipt-section optional">
              <label>
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (!e.target.checked) {
                      setReceiptImage(null);
                      setImagePreview(null);
                    }
                  }}
                />
                Attach receipt/verification (optional)
              </label>
              {receiptImage !== null && (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              )}
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Receipt preview" />
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Payment Info */}
          <div className="payment-info">
            {paymentMethod === 'manual' ? (
              <p>
                ℹ️ You'll upload verification of payment. The worker will be notified immediately.
              </p>
            ) : (
              <p>
                ℹ️ You'll be redirected to complete payment securely through PayMongo.
                The job will be marked complete once payment is confirmed.
              </p>
            )}
          </div>
        </div>

        <div className="payment-modal-footer">
          <button
            className="btn-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn-pay"
            onClick={handlePayment}
            disabled={loading}
          >
            {loading ? 'Processing...' : `Pay ₱${totalAmount.toLocaleString()}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
