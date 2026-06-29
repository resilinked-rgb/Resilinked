import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import styles from './Privacy.module.css'

function Privacy() {
  const { t } = useLanguage()

  return (
    <div className={styles.privacyContainer}>
      <div className={styles.privacyContent}>
        {/* Header Section */}
        <section className={styles.header}>
          <h1>{t('privacy.title')}</h1>
          <p className={styles.lastUpdated}>{t('privacy.lastUpdated')}</p>
        </section>

        {/* Introduction */}
        <section className={styles.section}>
          <h2>{t('privacy.section1Title')}</h2>
          <p>{t('privacy.section1Para1')}</p>
          <p>{t('privacy.section1Para2')}</p>
        </section>

        {/* Information We Collect */}
        <section className={styles.section}>
          <h2>{t('privacy.section2Title')}</h2>
          
          <h3>{t('privacy.section2_1Title')}</h3>
          <p>{t('privacy.section2_1Intro')}</p>
          <ul>
            <li><strong>{t('privacy.section2_1_1')}</strong> {t('privacy.section2_1_1Detail')}</li>
            <li><strong>{t('privacy.section2_1_2')}</strong> {t('privacy.section2_1_2Detail')}</li>
            <li><strong>{t('privacy.section2_1_3')}</strong> {t('privacy.section2_1_3Detail')}</li>
            <li><strong>{t('privacy.section2_1_4')}</strong> {t('privacy.section2_1_4Detail')}</li>
          </ul>

          <h3>{t('privacy.section2_2Title')}</h3>
          <ul>
            <li><strong>{t('privacy.section2_2_1')}</strong> {t('privacy.section2_2_1Detail')}</li>
            <li><strong>{t('privacy.section2_2_2')}</strong> {t('privacy.section2_2_2Detail')}</li>
            <li><strong>{t('privacy.section2_2_3')}</strong> {t('privacy.section2_2_3Detail')}</li>
          </ul>

          <h3>{t('privacy.section2_3Title')}</h3>
          <ul>
            <li>{t('privacy.section2_3_1')}</li>
            <li>{t('privacy.section2_3_2')}</li>
            <li>{t('privacy.section2_3_3')}</li>
          </ul>
        </section>

        {/* How We Use Your Information */}
        <section className={styles.section}>
          <h2>{t('privacy.section3Title')}</h2>
          <p>{t('privacy.section3Intro')}</p>
          <ul>
            <li><strong>{t('privacy.section3_1')}</strong> {t('privacy.section3_1Detail')}</li>
            <li><strong>{t('privacy.section3_2')}</strong> {t('privacy.section3_2Detail')}</li>
            <li><strong>{t('privacy.section3_3')}</strong> {t('privacy.section3_3Detail')}</li>
            <li><strong>{t('privacy.section3_4')}</strong> {t('privacy.section3_4Detail')}</li>
            <li><strong>{t('privacy.section3_5')}</strong> {t('privacy.section3_5Detail')}</li>
            <li><strong>{t('privacy.section3_6')}</strong> {t('privacy.section3_6Detail')}</li>
            <li><strong>{t('privacy.section3_7')}</strong> {t('privacy.section3_7Detail')}</li>
          </ul>
        </section>

        {/* Information Sharing */}
        <section className={styles.section}>
          <h2>{t('privacy.section4Title')}</h2>
          <p>{t('privacy.section4Intro')}</p>
          
          <h3>{t('privacy.section4_1Title')}</h3>
          <p>{t('privacy.section4_1Para')}</p>

          <h3>{t('privacy.section4_2Title')}</h3>
          <p>{t('privacy.section4_2Para')}</p>
          <ul>
            <li>{t('privacy.section4_2_1')}</li>
            <li>{t('privacy.section4_2_2')}</li>
            <li>{t('privacy.section4_2_3')}</li>
            <li>{t('privacy.section4_2_4')}</li>
            <li>{t('privacy.section4_2_5')}</li>
          </ul>

          <h3>{t('privacy.section4_3Title')}</h3>
          <p>{t('privacy.section4_3Para')}</p>

          <h3>{t('privacy.section4_4Title')}</h3>
          <p>{t('privacy.section4_4Para')}</p>
        </section>

        {/* Data Security */}
        <section className={styles.section}>
          <h2>{t('privacy.section5Title')}</h2>
          <p>{t('privacy.section5Intro')}</p>
          <ul>
            <li><strong>{t('privacy.section5_1')}</strong> {t('privacy.section5_1Detail')}</li>
            <li><strong>{t('privacy.section5_2')}</strong> {t('privacy.section5_2Detail')}</li>
            <li><strong>{t('privacy.section5_3')}</strong> {t('privacy.section5_3Detail')}</li>
            <li><strong>{t('privacy.section5_4')}</strong> {t('privacy.section5_4Detail')}</li>
            <li><strong>{t('privacy.section5_5')}</strong> {t('privacy.section5_5Detail')}</li>
          </ul>
          <p className={styles.warning}>{t('privacy.section5Warning')}</p>
        </section>

        {/* Your Privacy Rights */}
        <section className={styles.section}>
          <h2>{t('privacy.section6Title')}</h2>
          <p>{t('privacy.section6Intro')}</p>
          <ul>
            <li><strong>{t('privacy.section6_1')}</strong> {t('privacy.section6_1Detail')}</li>
            <li><strong>{t('privacy.section6_2')}</strong> {t('privacy.section6_2Detail')}</li>
            <li><strong>{t('privacy.section6_3')}</strong> {t('privacy.section6_3Detail')}</li>
            <li><strong>{t('privacy.section6_4')}</strong> {t('privacy.section6_4Detail')}</li>
            <li><strong>{t('privacy.section6_5')}</strong> {t('privacy.section6_5Detail')}</li>
            <li><strong>{t('privacy.section6_6')}</strong> {t('privacy.section6_6Detail')}</li>
          </ul>
          <p>
            {t('privacy.section6Contact')} <strong>{t('privacy.section6ContactEmail')}</strong> {t('privacy.section6ContactOr')}
          </p>
        </section>

        {/* Cookies and Tracking */}
        <section className={styles.section}>
          <h2>{t('privacy.section7Title')}</h2>
          <p>{t('privacy.section7Intro')}</p>
          <ul>
            <li><strong>{t('privacy.section7_1')}</strong> {t('privacy.section7_1Detail')}</li>
            <li><strong>{t('privacy.section7_2')}</strong> {t('privacy.section7_2Detail')}</li>
            <li><strong>{t('privacy.section7_3')}</strong> {t('privacy.section7_3Detail')}</li>
          </ul>
          <p>{t('privacy.section7Note')}</p>
        </section>

        {/* Data Retention */}
        <section className={styles.section}>
          <h2>{t('privacy.section8Title')}</h2>
          <p>{t('privacy.section8Intro')}</p>
          <ul>
            <li>{t('privacy.section8_1')}</li>
            <li>{t('privacy.section8_2')}</li>
            <li>{t('privacy.section8_3')}</li>
            <li>{t('privacy.section8_4')}</li>
          </ul>
        </section>

        {/* Children's Privacy */}
        <section className={styles.section}>
          <h2>{t('privacy.section9Title')}</h2>
          <p>
            {t('privacy.section9Para')} <strong>{t('privacy.section6ContactEmail')}</strong>.
          </p>
        </section>

        {/* International Users */}
        <section className={styles.section}>
          <h2>{t('privacy.section10Title')}</h2>
          <p>{t('privacy.section10Para')}</p>
        </section>

        {/* Third-Party Links */}
        <section className={styles.section}>
          <h2>{t('privacy.section11Title')}</h2>
          <p>{t('privacy.section11Para')}</p>
        </section>

        {/* Changes to This Policy */}
        <section className={styles.section}>
          <h2>{t('privacy.section12Title')}</h2>
          <p>{t('privacy.section12Intro')}</p>
          <ul>
            <li>{t('privacy.section12_1')}</li>
            <li>{t('privacy.section12_2')}</li>
            <li>{t('privacy.section12_3')}</li>
          </ul>
          <p>{t('privacy.section12Note')}</p>
        </section>

        {/* Contact Us */}
        <section className={styles.section}>
          <h2>{t('privacy.section13Title')}</h2>
          <p>{t('privacy.section13Intro')}</p>
          <div className={styles.contact}>
            <div className={styles.contactItem}>
              <strong>{t('privacy.contactEmail')}</strong> privacy@resi.com
            </div>
            <div className={styles.contactItem}>
              <strong>{t('privacy.contactSupport')}</strong> support@resi.com
            </div>
            <div className={styles.contactItem}>
              <strong>{t('privacy.contactPhone')}</strong> +1 (555) 123-4567
            </div>
            <div className={styles.contactItem}>
              <strong>{t('privacy.contactAddress')}</strong> 123 Main Street, Suite 100, City, State 12345
            </div>
          </div>
          <div className={styles.ctaButtons}>
            <Link to="/help" className={styles.ctaButton}>{t('privacy.ctaHelpCenter')}</Link>
            <Link to="/settings" className={styles.ctaButton}>{t('privacy.ctaSettings')}</Link>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Privacy
