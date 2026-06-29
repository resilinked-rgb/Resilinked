import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

function TermsOfService() {
  const { t } = useLanguage()
  const navigate = useNavigate()

  const handleGoBack = () => {
    // Go back to previous page, or home if no history
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="tos-page">
      <div className="tos-container">
        <div className="tos-header">
          <h1>{t('terms.title')}</h1>
          <p className="effective-date">{t('terms.effectiveDate')}</p>
        </div>

        <div className="tos-content">
          <section>
            <h2>{t('terms.section1Title')}</h2>
            <p>{t('terms.section1Para')}</p>
          </section>

          <section>
            <h2>{t('terms.section2Title')}</h2>
            <p>{t('terms.section2Para')}</p>
          </section>

          <section>
            <h2>{t('terms.section3Title')}</h2>
            <h3>{t('terms.section3_1Title')}</h3>
            <p>{t('terms.section3_1Intro')}</p>
            <ul>
              <li>{t('terms.section3_1_1')}</li>
              <li>{t('terms.section3_1_2')}</li>
              <li>{t('terms.section3_1_3')}</li>
              <li>{t('terms.section3_1_4')}</li>
            </ul>

            <h3>{t('terms.section3_2Title')}</h3>
            <p>{t('terms.section3_2Intro')}</p>
            <ul>
              <li>{t('terms.section3_2_1')}</li>
              <li>{t('terms.section3_2_2')}</li>
              <li>{t('terms.section3_2_3')}</li>
              <li>{t('terms.section3_2_4')}</li>
              <li>{t('terms.section3_2_5')}</li>
            </ul>
          </section>

          <section>
            <h2>{t('terms.section4Title')}</h2>
            <p className="important-notice">
              <strong>{t('terms.section4Important')}</strong>
            </p>
            <ul>
              <li>{t('terms.section4_1')}</li>
              <li>{t('terms.section4_2')}</li>
              <li>{t('terms.section4_3')}</li>
              <li>{t('terms.section4_4')}</li>
              <li>{t('terms.section4_5')}</li>
              <li>{t('terms.section4_6')}</li>
              <li>{t('terms.section4_7')}</li>
            </ul>
            <p>{t('terms.section4Note')}</p>
          </section>

          <section>
            <h2>{t('terms.section5Title')}</h2>
            <h3>{t('terms.section5_1Title')}</h3>
            <p>{t('terms.section5_1Para')}</p>

            <h3>{t('terms.section5_2Title')}</h3>
            <p>{t('terms.section5_2Intro')}</p>
            <ul>
              <li>{t('terms.section5_2_1')}</li>
              <li>{t('terms.section5_2_2')}</li>
              <li>{t('terms.section5_2_3')}</li>
              <li>{t('terms.section5_2_4')}</li>
              <li>{t('terms.section5_2_5')}</li>
            </ul>
          </section>

          <section>
            <h2>{t('terms.section6Title')}</h2>
            <p>{t('terms.section6Para')}</p>
            <ul>
              <li>{t('terms.section6_1')}</li>
              <li>{t('terms.section6_2')}</li>
              <li>{t('terms.section6_3')}</li>
              <li>{t('terms.section6_4')}</li>
            </ul>
            <p>{t('terms.section6Note')}</p>
          </section>

          <section>
            <h2>{t('terms.section7Title')}</h2>
            <p>{t('terms.section7Para')}</p>
            <ul>
              <li>{t('terms.section7_1')}</li>
              <li>{t('terms.section7_2')}</li>
              <li>{t('terms.section7_3')}</li>
              <li>{t('terms.section7_4')}</li>
            </ul>
          </section>

          <section>
            <h2>{t('terms.section8Title')}</h2>
            <p>{t('terms.section8Para')}</p>
            <ul>
              <li>{t('terms.section8_1')}</li>
              <li>{t('terms.section8_2')}</li>
              <li>{t('terms.section8_3')}</li>
            </ul>
          </section>

          <section>
            <h2>{t('terms.section9Title')}</h2>
            <p>{t('terms.section9Para')}</p>
            <ul>
              <li>{t('terms.section9_1')}</li>
              <li>{t('terms.section9_2')}</li>
              <li>{t('terms.section9_3')}</li>
              <li>{t('terms.section9_4')}</li>
            </ul>
            <p>{t('terms.section9Note')}</p>
          </section>

          <section>
            <h2>{t('terms.section10Title')}</h2>
            <p>{t('terms.section10Para')}</p>
            <ul>
              <li>{t('terms.section10_1')}</li>
              <li>{t('terms.section10_2')}</li>
              <li>{t('terms.section10_3')}</li>
            </ul>
          </section>

          <section>
            <h2>{t('terms.section11Title')}</h2>
            <p>{t('terms.section11Para')}</p>
            <ul>
              <li>{t('terms.section11_1')}</li>
              <li>{t('terms.section11_2')}</li>
              <li>{t('terms.section11_3')}</li>
              <li>{t('terms.section11_4')}</li>
            </ul>
          </section>

          <section>
            <h2>{t('terms.section12Title')}</h2>
            <p>{t('terms.section12Para')}</p>
          </section>

          <section>
            <h2>{t('terms.section13Title')}</h2>
            <p>{t('terms.section13Para')}</p>
          </section>

          <section>
            <h2>{t('terms.section14Title')}</h2>
            <p>{t('terms.section14Para')}</p>
            <p className="contact-info">
              <strong>{t('terms.section14Email')}</strong> resilinked@gmail.com<br />
              <strong>{t('terms.section14Platform')}</strong> {t('terms.section14PlatformText')}
            </p>
          </section>
        </div>

        <div className="tos-footer">
          <button onClick={handleGoBack} className="back-btn">
             {t('common.goBack') || 'Go Back'}
          </button>
        </div>
      </div>

      <style>{`
        .tos-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #9333ea 0%, #7c3aed 25%, #6b21a8 75%, #581c87 100%);
          padding: 2rem 1rem;
        }

        .tos-container {
          max-width: 900px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          box-shadow: 0 32px 64px rgba(147, 51, 234, 0.3);
          padding: 3rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .tos-header {
          text-align: center;
          margin-bottom: 3rem;
          padding-bottom: 2rem;
          border-bottom: 2px solid rgba(147, 51, 234, 0.2);
        }

        .tos-header h1 {
          font-size: 2.5rem;
          color: #7c3aed;
          margin-bottom: 0.5rem;
          font-weight: 800;
        }

        .effective-date {
          color: #64748b;
          font-size: 0.95rem;
          font-style: italic;
        }

        .tos-content {
          line-height: 1.8;
          color: #334155;
        }

        .tos-content section {
          margin-bottom: 2.5rem;
        }

        .tos-content h2 {
          font-size: 1.5rem;
          color: #7c3aed;
          margin-bottom: 1rem;
          font-weight: 700;
          border-left: 4px solid #9333ea;
          padding-left: 1rem;
        }

        .tos-content h3 {
          font-size: 1.2rem;
          color: #581c87;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          font-weight: 600;
        }

        .tos-content p {
          margin-bottom: 1rem;
          font-size: 1rem;
        }

        .tos-content ul {
          margin: 1rem 0 1rem 2rem;
          list-style-type: disc;
        }

        .tos-content li {
          margin-bottom: 0.5rem;
          padding-left: 0.5rem;
        }

        .important-notice {
          background: rgba(220, 38, 38, 0.1);
          border: 2px solid rgba(220, 38, 38, 0.3);
          border-radius: 12px;
          padding: 1.5rem;
          margin: 1.5rem 0;
          font-weight: 600;
          color: #dc2626;
        }

        .important-notice strong {
          color: #991b1b;
          font-size: 1.1rem;
        }

        .contact-info {
          background: rgba(147, 51, 234, 0.05);
          border-left: 4px solid #9333ea;
          padding: 1.5rem;
          border-radius: 8px;
          margin-top: 1rem;
        }

        .acknowledgment-text {
          background: rgba(147, 51, 234, 0.08);
          border: 2px solid rgba(147, 51, 234, 0.3);
          border-radius: 12px;
          padding: 1.5rem;
          margin-top: 1.5rem;
          font-weight: 500;
        }

        .acknowledgment-text strong {
          color: #7c3aed;
        }

        .tos-footer {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 2px solid rgba(147, 51, 234, 0.2);
        }

        .back-btn,
        .home-btn {
          padding: 0.875rem 1.75rem;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .back-btn {
          background: linear-gradient(135deg, #9333ea, #7c3aed);
          color: white;
          box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);
        }

        .back-btn:hover {
          background: linear-gradient(135deg, #7c3aed, #6b21a8);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(147, 51, 234, 0.4);
        }

        .home-btn {
          background: white;
          color: #7c3aed;
          border: 2px solid #9333ea;
        }

        .home-btn:hover {
          background: rgba(147, 51, 234, 0.1);
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .tos-container {
            padding: 2rem 1.5rem;
          }

          .tos-header h1 {
            font-size: 2rem;
          }

          .tos-content h2 {
            font-size: 1.3rem;
          }

          .tos-footer {
            flex-direction: column;
          }

          .back-btn,
          .home-btn {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </div>
  )
}

export default TermsOfService
