import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import styles from './About.module.css'

function About() {
  const { t } = useLanguage()
  
  return (
    <div className={styles.aboutContainer}>
      <div className={styles.aboutContent}>
        {/* Header Section */}
        <section className={styles.header}>
          <h1>{t('about.title')}</h1>
          <p className={styles.tagline}>{t('about.tagline')}</p>
        </section>

        {/* Mission Section */}
        <section className={styles.section}>
          <h2>{t('about.ourMission')}</h2>
          <p>
            {t('about.missionText')}
          </p>
        </section>

        {/* What We Do Section */}
        <section className={styles.section}>
          <h2>{t('about.whatWeDo')}</h2>
          <div className={styles.features}>
            <div className={styles.feature}>
              <div className={styles.icon}>💼</div>
              <h3>{t('about.jobMatching')}</h3>
              <p>{t('about.jobMatchingText')}</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.icon}>🔍</div>
              <h3>{t('about.easySearch')}</h3>
              <p>{t('about.easySearchText')}</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.icon}>💬</div>
              <h3>{t('about.directCommunication')}</h3>
              <p>{t('about.directCommunicationText')}</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.icon}>⭐</div>
              <h3>{t('about.ratingsReviews')}</h3>
              <p>{t('about.ratingsReviewsText')}</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.icon}>🎯</div>
              <h3>{t('about.goalSetting')}</h3>
              <p>{t('about.goalSettingText')}</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.icon}>🔒</div>
              <h3>{t('about.securePlatform')}</h3>
              <p>{t('about.securePlatformText')}</p>
            </div>
          </div>
        </section>

        {/* Who We Serve Section */}
        <section className={styles.section}>
          <h2>{t('about.whoWeServe')}</h2>
          <div className={styles.serve}>
            <div className={styles.serveCard}>
              <h3>👷 {t('about.workers')}</h3>
              <p>{t('about.workersText')}</p>
            </div>
            <div className={styles.serveCard}>
              <h3>🏢 {t('about.employers')}</h3>
              <p>{t('about.employersText')}</p>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className={styles.section}>
          <h2>{t('about.ourValues')}</h2>
          <ul className={styles.values}>
            <li><strong>{t('about.transparency')}:</strong> {t('about.transparencyText')}</li>
            <li><strong>{t('about.quality')}:</strong> {t('about.qualityText')}</li>
            <li><strong>{t('about.trust')}:</strong> {t('about.trustText')}</li>
            <li><strong>{t('about.innovation')}:</strong> {t('about.innovationText')}</li>
            <li><strong>{t('about.support')}:</strong> {t('about.supportText')}</li>
          </ul>
        </section>

        {/* Contact Section */}
        <section className={styles.section}>
          <h2>{t('about.getInTouch')}</h2>
          <p>{t('about.getInTouchText')}</p>
          <div className={styles.contact}>
            <div className={styles.contactItem}>
              <strong>{t('about.email')}:</strong> support@resi.com
            </div>
            <div className={styles.contactItem}>
              <strong>{t('about.phone')}:</strong> +1 (555) 123-4567
            </div>
            <div className={styles.contactItem}>
              <strong>{t('about.location')}:</strong> 123 Main Street, Suite 100, City, State 12345
            </div>
            <div className={styles.contactItem}>
              <strong>{t('about.businessHours')}:</strong> {t('about.businessHoursText')}
            </div>
          </div>
          <div className={styles.ctaButtons}>
            <Link to="/help" className={styles.ctaButton}>{t('about.visitHelpCenter')}</Link>
            <Link to="/register" className={styles.ctaButton}>{t('about.getStarted')}</Link>
          </div>
        </section>
      </div>
    </div>
  )
}

export default About
