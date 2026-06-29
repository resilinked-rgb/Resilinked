import { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import './TermsOfServiceModal.css';

function TermsOfServiceModal({ isOpen, onClose }) {
  const { t } = useLanguage();

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="tos-modal-overlay" onClick={onClose}>
      <div className="tos-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="tos-modal-header">
          <h2>{t('terms.title')}</h2>
        </div>
        
        <div className="tos-modal-body">
          <div className="tos-last-updated">
            <strong>{t('terms.lastUpdated')}</strong>
          </div>

          <section className="tos-section">
            <h3>{t('terms.section1Title')}</h3>
            <p>{t('terms.section1Para')}</p>
          </section>

          <section className="tos-section">
            <h3>{t('terms.section2AltTitle')}</h3>
            <p>{t('terms.section2AltPara')}</p>
            <ul>
              <li>{t('terms.section2Alt_1')}</li>
              <li>{t('terms.section2Alt_2')}</li>
              <li>{t('terms.section2Alt_3')}</li>
              <li>{t('terms.section2Alt_4')}</li>
              <li>{t('terms.section2Alt_5')}</li>
            </ul>
          </section>

          <section className="tos-section">
            <h3>{t('terms.section3Title')}</h3>
            <p>{t('terms.section3AltIntro')}</p>
            <ul>
              <li>{t('terms.section3Alt_1')}</li>
              <li>{t('terms.section3Alt_2')}</li>
              <li>{t('terms.section3Alt_3')}</li>
              <li>{t('terms.section3Alt_4')}</li>
              <li>{t('terms.section3Alt_5')}</li>
              <li>{t('terms.section3Alt_6')}</li>
            </ul>
          </section>

          <section className="tos-section">
            <h3>{t('terms.section4AltTitle')}</h3>
            <p><strong>{t('terms.important')}</strong> {t('terms.section4AltImportant')}</p>
            <ul>
              <li><strong>{t('terms.doNot')}</strong> {t('terms.section4Alt_1')}</li>
              <li><strong>{t('terms.doNot')}</strong> {t('terms.section4Alt_2')}</li>
              <li><strong>{t('terms.doNot')}</strong> {t('terms.section4Alt_3')}</li>
              <li><strong>{t('terms.doNot')}</strong> {t('terms.section4Alt_4')}</li>
              <li><strong>{t('terms.doNot')}</strong> {t('terms.section4Alt_5')}</li>
            </ul>
          </section>

          <section className="tos-section tos-highlight">
            <h3>{t('terms.section5AltTitle')}</h3>
            <p><strong>{t('terms.section5AltIntro')}</strong></p>
            <ul>
              <li>
                {t('terms.section5Alt_1')}
                <ul>
                  <li>{t('terms.section5Alt_1_1')}</li>
                  <li>{t('terms.section5Alt_1_2')}</li>
                  <li>{t('terms.section5Alt_1_3')}</li>
                  <li>{t('terms.section5Alt_1_4')}</li>
                  <li>{t('terms.section5Alt_1_5')}</li>
                  <li>{t('terms.section5Alt_1_6')}</li>
                  <li>{t('terms.section5Alt_1_7')}</li>
                  <li>{t('terms.section5Alt_1_8')}</li>
                </ul>
              </li>
              <li>{t('terms.section5Alt_2')}</li>
              <li>{t('terms.section5Alt_3')}</li>
            </ul>
          </section>

          <section className="tos-section">
            <h3>{t('terms.section6AltTitle')}</h3>
            <p>{t('terms.section6AltIntro')}</p>
            <ul>
              <li>{t('terms.section6Alt_1')}</li>
              <li>{t('terms.section6Alt_2')}</li>
              <li>{t('terms.section6Alt_3')}</li>
              <li>{t('terms.section6Alt_4')}</li>
              <li>{t('terms.section6Alt_5')}</li>
              <li>{t('terms.section6Alt_6')}</li>
            </ul>
          </section>

          <section className="tos-section">
            <h3>{t('terms.section7AltTitle')}</h3>
            <p>{t('terms.section7AltPara')}</p>
          </section>

          <section className="tos-section">
            <h3>{t('terms.section8Title')}</h3>
            <p>{t('terms.section8AltPara')}</p>
          </section>

          <section className="tos-section">
            <h3>{t('terms.section9AltTitle')}</h3>
            <p>{t('terms.section9AltPara')}</p>
          </section>

          <section className="tos-section">
            <h3>{t('terms.section10AltTitle')}</h3>
            <p>{t('terms.section10AltPara')}</p>
          </section>

          <section className="tos-section">
            <h3>{t('terms.section11AltTitle')}</h3>
            <p>{t('terms.stronglyRecommend')}</p>
            <ul>
              <li>{t('terms.section11Alt_1')}</li>
              <li>{t('terms.section11Alt_2')}</li>
              <li>{t('terms.section11Alt_3')}</li>
              <li>{t('terms.section11Alt_4')}</li>
              <li>{t('terms.section11Alt_5')}</li>
              <li>{t('terms.section11Alt_6')}</li>
            </ul>
          </section>

          <section className="tos-section">
            <h3>{t('terms.section12AltTitle')}</h3>
            <p>{t('terms.section12AltPara')}</p>
          </section>

          <section className="tos-section">
            <h3>{t('terms.section13AltTitle')}</h3>
            <p>{t('terms.section13AltPara')}</p>
          </section>

          <section className="tos-section">
            <h3>{t('terms.section14AltTitle')}</h3>
            <p>{t('terms.section14AltPara')}</p>
          </section>

          <section className="tos-section">
            <h3>{t('terms.section15AltTitle')}</h3>
            <p>{t('terms.section15AltPara')}</p>
          </section>

          <div className="tos-acknowledgment">
            <p><strong>{t('terms.modalAcknowledgment')}</strong></p>
          </div>
        </div>

        <div className="tos-modal-footer">
          <button className="tos-close-button" onClick={onClose}>
            {t('terms.closeButton')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TermsOfServiceModal;
