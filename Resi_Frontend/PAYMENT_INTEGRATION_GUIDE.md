# Integrating PaymentModal into EmployerDashboard

## Quick Integration Guide

### Step 1: Import PaymentModal

Add this import at the top of `EmployerDashboard.jsx`:

```javascript
import PaymentModal from './PaymentModal';
```

### Step 2: Add State for Payment Modal

Add this state near your other useState declarations:

```javascript
const [showPaymentModal, setShowPaymentModal] = useState(false);
const [jobToComplete, setJobToComplete] = useState(null);
```

### Step 3: Replace Old Complete Job Logic

Find your current "Complete Job" or "Mark Complete" button and replace it with:

```jsx
<button 
  className="btn complete-btn"
  onClick={() => {
    setJobToComplete(job);
    setShowPaymentModal(true);
  }}
  disabled={!job.acceptedApplicant}
>
  Complete & Pay
</button>
```

### Step 4: Add PaymentModal Component

Add this near the end of your component, before the closing return statement:

```jsx
{/* Payment Modal */}
{showPaymentModal && jobToComplete && (
  <PaymentModal
    job={jobToComplete}
    onClose={() => {
      setShowPaymentModal(false);
      setJobToComplete(null);
    }}
    onSuccess={async () => {
      // Refresh jobs list
      await loadMyJobs();
      
      // Refresh dashboard stats
      await loadDashboardStats();
      
      // Show success message
      success('Job completed and payment processed!');
      
      // Close modal
      setShowPaymentModal(false);
      setJobToComplete(null);
    }}
  />
)}
```

### Step 5: Update Complete Job Modal (if using existing modal)

If you have an existing modal for job completion with rating, you can:

**Option A: Replace it entirely with PaymentModal**
```javascript
// Remove old completeJobModal code
// Use PaymentModal instead (as shown above)
```

**Option B: Keep both - Show rating after payment**
```javascript
// Keep existing rating modal
// Show PaymentModal first
// After payment success, show rating modal
{showPaymentModal && jobToComplete && (
  <PaymentModal
    job={jobToComplete}
    onClose={() => {
      setShowPaymentModal(false);
      setJobToComplete(null);
    }}
    onSuccess={async () => {
      // Payment successful, now show rating modal
      setShowPaymentModal(false);
      setShowRatingModal(true);
      // jobToComplete remains set for rating
    }}
  />
)}

{showRatingModal && jobToComplete && (
  <RatingModal
    job={jobToComplete}
    worker={jobToComplete.acceptedApplicant}
    onClose={() => {
      setShowRatingModal(false);
      setJobToComplete(null);
    }}
    onSubmit={async (rating, comment) => {
      // Submit rating
      await submitRating(jobToComplete._id, rating, comment);
      
      // Refresh
      await loadMyJobs();
      
      // Close
      setShowRatingModal(false);
      setJobToComplete(null);
    }}
  />
)}
```

### Step 6: Remove Old Complete Job Function (if exists)

If you have an old `completeJob` function that directly marks jobs complete, you can either:
- Remove it entirely (PaymentModal handles everything)
- Keep it as a fallback for manual verification

```javascript
// Old function - can be removed or kept as fallback
const completeJobManually = async (jobId, verificationImage) => {
  // This is now handled by PaymentModal with paymentMethod: 'manual'
};
```

## Full Example Integration

Here's a complete example of the changes:

```jsx
import React, { useState, useEffect } from 'react';
import apiService from '../api';
import PaymentModal from './PaymentModal';  // ← ADD THIS
import { useAlert } from '../context/AlertContext';

const EmployerDashboard = () => {
  // ... existing state ...
  const [myJobs, setMyJobs] = useState([]);
  
  // ADD THIS STATE
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [jobToComplete, setJobToComplete] = useState(null);
  
  const { success, showError } = useAlert();

  // ... existing functions ...

  return (
    <div className="employer-dashboard">
      {/* ... existing content ... */}
      
      {/* Jobs List */}
      <div className="jobs-list">
        {myJobs.map(job => (
          <div key={job._id} className="job-card">
            <h3>{job.title}</h3>
            <p>Price: ₱{job.price?.toLocaleString()}</p>
            
            {/* UPDATE THIS BUTTON */}
            {job.acceptedApplicant && !job.completed && (
              <button 
                className="btn complete-btn"
                onClick={() => {
                  setJobToComplete(job);
                  setShowPaymentModal(true);
                }}
              >
                Complete & Pay
              </button>
            )}
            
            {job.completed && (
              <span className="badge completed">Completed</span>
            )}
          </div>
        ))}
      </div>

      {/* ADD THIS AT THE END */}
      {showPaymentModal && jobToComplete && (
        <PaymentModal
          job={jobToComplete}
          onClose={() => {
            setShowPaymentModal(false);
            setJobToComplete(null);
          }}
          onSuccess={async () => {
            await loadMyJobs();
            await loadDashboardStats();
            success('Job completed and payment processed!');
            setShowPaymentModal(false);
            setJobToComplete(null);
          }}
        />
      )}
    </div>
  );
};

export default EmployerDashboard;
```

## Styling Notes

The PaymentModal comes with its own CSS file (`PaymentModal.css`), so you don't need to add any additional styles. However, you may want to update your "Complete" button style:

```css
.complete-btn {
  background: #10b981;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.complete-btn:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-1px);
}

.complete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

## Testing Checklist

After integration, test these scenarios:

1. ✅ Click "Complete & Pay" button
2. ✅ Payment modal opens with correct job details
3. ✅ All payment methods are selectable
4. ✅ GCash payment redirects to checkout
5. ✅ Manual payment requires receipt image
6. ✅ Cancel button closes modal
7. ✅ Successful payment marks job complete
8. ✅ Both employer and worker receive notifications
9. ✅ Worker's goal is updated with payment
10. ✅ Jobs list refreshes after completion

## Troubleshooting

### Modal doesn't open
- Check if `showPaymentModal` and `jobToComplete` are both set
- Verify PaymentModal is imported correctly
- Check browser console for errors

### Payment fails silently
- Check PayMongo API keys in `.env`
- Verify webhook is configured
- Check backend logs for errors
- Ensure `axios` is installed

### Old completion method still showing
- Remove old complete button
- Clear component cache (restart dev server)
- Check for duplicate buttons

## Need Help?

Refer to:
- `PAYMONGO_SETUP.md` - Full PayMongo setup guide
- `PAYMONGO_INTEGRATION_SUMMARY.md` - Feature overview
- PayMongo Documentation: https://developers.paymongo.com/
