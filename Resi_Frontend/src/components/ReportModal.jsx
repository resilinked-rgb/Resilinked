import React, { useState } from 'react';
import './ReportModal.css';
import { useTranslation } from '../hooks/useTranslation';

const ReportModal = ({ isOpen, onClose, onSubmit, reportType, targetName }) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      alert(t('errors.requiredField'));
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(reason);
      setReason('');
      onClose();
    } catch (error) {
      console.error('Failed to submit report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setReason('');
      onClose();
    }
  };

  return (
    <div className="report-modal-overlay" onClick={handleClose}>
      <div className="report-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="report-modal-header">
          <h2>{t('profile.report')} {reportType}</h2>
        </div>
        
        <div className="report-modal-body">
          <p className="report-target-info">
            {t('common.view')}: <strong>{targetName}</strong>
          </p>
          
          <div className="report-disclaimer">
            <div className="disclaimer-icon">⚠️</div>
            <div className="disclaimer-content">
              <h4>{t('reportModal.disclaimerTitle')}</h4>
              <p>
                {t('reportModal.disclaimerText')}
              </p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="reason">
                {t('reportModal.reasonLabel')} <span className="required">*</span>
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('reportModal.reasonPlaceholder')}
                rows="5"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="report-modal-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="btn-report"
                disabled={isSubmitting || !reason.trim()}
              >
                {isSubmitting ? t('common.loading') : t('common.submit')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
