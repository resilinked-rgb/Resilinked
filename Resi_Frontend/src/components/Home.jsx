import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import apiService from '../api'
import { getProfilePictureUrl } from '../utils/imageHelper'

function Home() {
  const { t } = useLanguage()
  const [popularJobs, setPopularJobs] = useState([])
  const [topRatedUsers, setTopRatedUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [cardsToShow, setCardsToShow] = useState(3)
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const carouselRef = useRef(null)

  // Handle responsive cards display
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setCardsToShow(1)
      } else if (window.innerWidth <= 1024) {
        setCardsToShow(2)
      } else {
        setCardsToShow(3)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [jobsResponse, usersResponse] = await Promise.all([
        apiService.getPopularJobs().catch(() => ({ jobs: [] })),
        apiService.getTopRated().catch((err) => {
          console.error('Error loading top rated:', err);
          return [];
        })
      ])
      
      console.log('Popular jobs response:', jobsResponse);
      console.log('Top rated users response:', usersResponse);
      
      setPopularJobs(jobsResponse.jobs || [])
      // The backend returns { workers: [...] }
      const topRated = usersResponse.workers || usersResponse.users || usersResponse.data || [];
      console.log('Setting top rated users:', topRated);
      setTopRatedUsers(topRated)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const nextSlide = () => {
    if (topRatedUsers.length <= cardsToShow) return
    setCurrentSlide(prev => (prev + 1) % topRatedUsers.length)
  }

  const prevSlide = () => {
    if (topRatedUsers.length <= cardsToShow) return
    setCurrentSlide(prev => (prev - 1 + topRatedUsers.length) % topRatedUsers.length)
  }

  // Get the visible cards based on current slide with wrapping
  const getVisibleCards = () => {
    if (topRatedUsers.length === 0) return []
    if (topRatedUsers.length <= cardsToShow) return topRatedUsers
    
    const cards = []
    for (let i = 0; i < cardsToShow; i++) {
      const index = (currentSlide + i) % topRatedUsers.length
      cards.push({ ...topRatedUsers[index], displayIndex: i })
    }
    return cards
  }

  const handleSearchJobs = () => {
    navigate('/search-jobs')
  }

  const handlePostJob = () => {
    if (!isAuthenticated) {
      navigate('/login')
    } else if (user?.userType === 'employer' || user?.userType === 'both' || user?.userType === 'admin') {
      navigate('/post-job')
    } else {
      alert(t('home.employerOnly'))
      navigate('/profile')
    }
  }

  return (
    <div className="home-container fade-in">
      <section className="hero">
        <div className="hero-content">
          <h2>{t('home.welcome')}</h2>
          <p>{t('home.tagline')}</p>
          <div className="button-row">
            <button onClick={handleSearchJobs} className="btn">
              🔍 {t('home.searchJobs')}
            </button>
            {isAuthenticated ? (
              <button onClick={handlePostJob} className="btn">
                ➕ {t('home.postJob')}
              </button>
            ) : (
              <Link to="/login" className="btn">
                👤 {t('home.loginToPost')}
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="how-section">
        <div className="how-section-container">
          <h2>{t('home.howItWorks')}</h2>
          <div className="how-steps">
            <div>
              <span>1</span>
              {t('home.step1')}
            </div>
            <div>
              <span>2</span>
              {t('home.step2')}
            </div>
            <div>
              <span>3</span>
              {t('home.step3')}
            </div>
            <div>
              <span>4</span>
              {t('home.step4')}
            </div>
          </div>
        </div>
      </section>

      <section className="jobs-section jobs-section-white">
        <div className="jobs-section-container jobs-section-container-white">
          <h2 className="jobs-section-title-white">{t('home.popularJobs')}</h2>
          <div className="jobs-list">
            {loading ? (
              <div className="no-data">📊 {t('common.loading')} {t('home.popularJobs').toLowerCase()}...</div>
            ) : popularJobs.length > 0 ? (
              popularJobs.map((job, index) => (
                <button
                  key={index}
                  className="job-card job-card-btn"
                  type="button"
                  tabIndex={0}
                  aria-label={`View jobs for ${job.title || job.jobCategory}`}
                  onClick={() => navigate(`/search-jobs?title=${encodeURIComponent(job.title || job.jobCategory)}`)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      navigate(`/search-jobs?title=${encodeURIComponent(job.title || job.jobCategory)}`)
                    }
                  }}
                >
                  <div className="job-title">
                    {job.title || job.jobCategory}
                  </div>
                </button>
              ))
            ) : (
                <div className="no-data">
                📋 {t('home.noJobsAvailable')}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="testimonials-section">
        <div className="testimonials-section-container">
          <h2>⭐ {t('landing.topRatedWorkers')}</h2>
          <p className="section-subtitle">{t('landing.topRatedDescription')}</p>
          
          {loading ? (
            <div className="no-data">📝 {t('common.loading')} {t('landing.topRatedWorkers').toLowerCase()}...</div>
          ) : topRatedUsers.length === 0 ? (
            <div className="no-data">💬 {t('landing.noWorkersAvailable')}</div>
          ) : (
            <div className="carousel-container">
              {topRatedUsers.length > cardsToShow && (
                <button 
                  className="carousel-button prev" 
                  onClick={prevSlide}
                  aria-label="Previous"
                >
                  ❮
                </button>
              )}
              
              <div className="carousel-wrapper" ref={carouselRef}>
                <div className="carousel-track">
                  {getVisibleCards().map((user, index) => (
                    <Link
                      key={`${user._id}-${index}`}
                      to={`/profile/${user._id}`}
                      className="worker-card"
                    >
                      <div className="worker-avatar">
                        {getProfilePictureUrl(user) ? (
                          <img src={getProfilePictureUrl(user)} alt={`${user.firstName} ${user.lastName}`} />
                        ) : (
                          <div className="avatar-placeholder">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </div>
                        )}
                        <div className="rating-badge">
                          ⭐ {(user.averageRating || 0).toFixed(1)}
                        </div>
                      </div>
                      <div className="worker-info">
                        <h3>{user.firstName} {user.lastName}</h3>
                        <p className="worker-location">📍 {user.barangay || t('landing.locationNotSpecified')}</p>
                        <p className="worker-skills">
                          {user.skills && user.skills.length > 0 
                            ? user.skills.slice(0, 3).join(', ')
                            : t('landing.noSkillsListed')}
                        </p>
                        <div className="worker-stats">
                          <span className="stat">
                            <span className="stat-icon">💼</span>
                            {user.completedJobs || 0} {t('landing.jobsCompleted')}
                          </span>
                          <span className="stat">
                            <span className="stat-icon">⭐</span>
                            {user.totalRatings || user.ratingCount || 0} {t('landing.reviews')}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
              
              {topRatedUsers.length > cardsToShow && (
                <button 
                  className="carousel-button next" 
                  onClick={nextSlide}
                  aria-label="Next"
                >
                  ❯
                </button>
              )}
            </div>
          )}
        </div>
      </section>

  <style>{`
        .home-container {
          width: 100%;
          margin: 0;
          padding: 0;
        }
        
        /* Modern Hero Section */
        .hero {
          position: relative;
          background: linear-gradient(135deg, var(--primary-600) 0%, var(--secondary-600) 100%);
          color: white;
          padding: var(--spacing-20) 0;
          text-align: center;
          overflow: hidden;
          min-height: 60vh;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
        }
        
        .hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('/Informal.jpg') center/cover no-repeat;
          opacity: 0.15;
          z-index: 0;
        }
        
        .hero-content {
          position: relative;
          z-index: 1;
          max-width: 800px;
          margin: 0 auto;
          padding: 0 var(--spacing-8);
        }
        
        .hero h2 {
          font-size: var(--font-size-5xl);
          font-weight: 800;
          margin-bottom: var(--spacing-6);
          line-height: 1.1;
          background: linear-gradient(135deg, #ffffff, #e0f2fe);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: none;
        }
        
        .hero p {
          font-size: var(--font-size-xl);
          margin-bottom: var(--spacing-8);
          opacity: 1;
          font-weight: 500;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          color: #ffffff;
          background: rgba(0, 0, 0, 0.1);
          padding: var(--spacing-3) var(--spacing-6);
          border-radius: var(--radius-lg);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .button-row {
          display: flex;
          gap: var(--spacing-4);
          justify-content: center;
          flex-wrap: wrap;
          margin-top: var(--spacing-8);
        }
        
        .btn, .hero button {
          background: linear-gradient(135deg, #a78bfa, #7c3aed);
          color: #fff;
          border: none;
          padding: var(--spacing-4) var(--spacing-8);
          border-radius: var(--radius-lg);
          font-size: var(--font-size-lg);
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-2);
          transition: all var(--transition-normal);
          box-shadow: var(--shadow-md);
          min-width: 180px;
          justify-content: center;
          margin: 0;
        }
        
        .btn:hover, .hero button:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
          background: linear-gradient(135deg, #7c3aed, #a78bfa);
          color: #fff;
        }
        
        /* Modern How Section */
        .how-section {
          background: var(--gray-50);
          padding: var(--spacing-20) 0;
          text-align: center;
          width: 100%;
        }
        
        .how-section-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 0 var(--spacing-8);
        }
        
        .how-section h2 {
          font-size: var(--font-size-4xl);
          font-weight: 700;
          color: var(--gray-800);
          margin-bottom: var(--spacing-16);
          text-align: center;
        }
        
        .how-steps {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          gap: var(--spacing-4);
          flex-wrap: nowrap;
          overflow-x: auto;
        }
        
        .how-steps div {
          background: white;
          border-radius: var(--radius-2xl);
          padding: var(--spacing-6);
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--gray-100);
          transition: all var(--transition-normal);
          position: relative;
          overflow: hidden;
          flex: 1;
          min-width: 200px;
        }
        
        .how-steps div::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(135deg, var(--primary-500), var(--secondary-500));
        }
        
        .how-steps div:hover {
          box-shadow: var(--shadow-2xl);
        }
        
        .how-steps span {
          display: block;
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, var(--primary-500), var(--secondary-500));
          color: white;
          border-radius: var(--radius-full);
          font-size: var(--font-size-2xl);
          font-weight: 700;
          margin: 0 auto var(--spacing-4);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-md);
        }
        
        .how-steps div {
          color: var(--gray-700);
          font-size: var(--font-size-lg);
          font-weight: 500;
          line-height: 1.6;
        }
        
        /* Modern Jobs Section */
        .jobs-section {
          background: #fff;
          padding: var(--spacing-20) 0;
          text-align: center;
          width: 100%;
        }
        
        .jobs-section-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 var(--spacing-8);
        }
        
        .jobs-section h2 {
          font-size: var(--font-size-4xl);
          font-weight: 700;
          color: var(--gray-800);
          margin-bottom: var(--spacing-16);
        }
        
        .jobs-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: var(--spacing-6);
          margin: 0 auto var(--spacing-8);
        }
        
        .jobs-section-white {
          background: #fff;
        }
        .jobs-section-container-white {
          background: #fff;
          border-radius: var(--radius-2xl);
          box-shadow: 0 2px 12px rgba(80, 0, 120, 0.04);
          padding: var(--spacing-12) var(--spacing-8);
        }
        .jobs-section-title-white {
          background: #fff;
          color: #5b21b6;
          font-weight: 700;
          padding-bottom: var(--spacing-4);
        }
        .job-card {
          background: #fff;
          border-radius: var(--radius-2xl);
          padding: var(--spacing-6);
          text-align: center;
          box-shadow: var(--shadow-md);
          border: 2px solid #ede9fe;
          transition: all var(--transition-normal);
          cursor: pointer;
          position: relative;
          overflow: hidden;
          outline: none;
          color: #5b21b6;
          font-size: var(--font-size-lg);
          font-weight: 600;
        }
        .job-card-btn {
          border: none;
          background: #fff;
          width: 100%;
          display: block;
          color: #5b21b6;
          font-weight: 600;
        }
        .job-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #a78bfa 0%, #818cf8 100%);
          transform: scaleX(0);
          transition: transform var(--transition-normal);
          border-top-left-radius: var(--radius-2xl);
          border-top-right-radius: var(--radius-2xl);
        }
        .job-card:hover, .job-card-btn:hover {
          /* Only the top effect changes, background stays white */
          box-shadow: var(--shadow-xl);
          background: #fff;
          border-color: #a78bfa;
          color: #ffffffff;
        }
        .job-card:hover::before, .job-card-btn:hover::before {
          transform: scaleX(1);
        }
        .job-card-btn:focus {
          outline: 2px solid #a78bfa;
          outline-offset: 2px;
          box-shadow: 0 0 0 3px #ddd6fe;
        }
        
        /* Modern Testimonials Section */
        .testimonials-section {
          background: var(--gray-50);
          padding: var(--spacing-20) 0;
          text-align: center;
          width: 100%;
        }
        
        .testimonials-section-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 var(--spacing-8);
        }
        
        .testimonials-section h2 {
          font-size: var(--font-size-4xl);
          font-weight: 700;
          background: linear-gradient(135deg, var(--primary-700) 0%, var(--primary-500) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: var(--spacing-3);
        }
        
        .section-subtitle {
          color: var(--gray-600);
          font-size: var(--font-size-lg);
          margin-bottom: var(--spacing-8);
        }

        /* Carousel Styles */
        .carousel-container {
          position: relative;
          max-width: 100%;
          padding: var(--spacing-4) 0;
        }

        .carousel-wrapper {
          overflow: hidden;
          position: relative;
          width: 100%;
        }

        .carousel-track {
          display: flex;
          justify-content: center;
          align-items: center; 
          gap: var(--spacing-6);
          width: 100%;
        }

        .worker-card {
          flex: 0 0 calc((100% - (2 * var(--spacing-6))) / 3);
          max-width: calc((100% - (2 * var(--spacing-6))) / 3);
          min-width: 0;
          background: white;
          border-radius: var(--radius-xl);
          padding: var(--spacing-6);
          box-shadow: 0 4px 20px rgba(147, 51, 234, 0.1);
          border: 2px solid transparent;
          transition: all var(--transition-normal);
          text-decoration: none;
          color: inherit;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .worker-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 40px rgba(147, 51, 234, 0.2);
          border-color: var(--primary-400);
        }

        .worker-avatar {
          position: relative;
          margin-bottom: var(--spacing-4);
        }

        .worker-avatar img,
        .avatar-placeholder {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid var(--primary-200);
        }

        .avatar-placeholder {
          background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-size-3xl);
          font-weight: 700;
        }

        .rating-badge {
          position: absolute;
          bottom: -5px;
          right: -5px;
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
          color: white;
          padding: var(--spacing-2) var(--spacing-3);
          border-radius: var(--radius-full);
          font-size: var(--font-size-sm);
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(255, 165, 0, 0.4);
        }

        .worker-info {
          width: 100%;
        }

        .worker-info h3 {
          font-size: var(--font-size-xl);
          color: var(--gray-900);
          margin-bottom: var(--spacing-2);
          font-weight: 700;
        }

        .worker-location {
          color: var(--gray-600);
          font-size: var(--font-size-sm);
          margin-bottom: var(--spacing-3);
        }

        .worker-skills {
          color: var(--primary-700);
          font-size: var(--font-size-sm);
          margin-bottom: var(--spacing-4);
          padding: var(--spacing-2) var(--spacing-3);
          background: rgba(168, 85, 247, 0.1);
          border-radius: var(--radius-lg);
          font-weight: 500;
        }

        .worker-stats {
          display: flex;
          gap: var(--spacing-4);
          justify-content: center;
          padding-top: var(--spacing-3);
          border-top: 1px solid var(--gray-200);
        }

        .stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-1);
          font-size: var(--font-size-xs);
          color: var(--gray-600);
        }

        .stat-icon {
          font-size: var(--font-size-base);
        }

        .carousel-button {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: white;
          border: 2px solid var(--primary-400);
          color: var(--primary-700);
          width: 48px;
          height: 48px;
          border-radius: 50%;
          cursor: pointer;
          font-size: var(--font-size-2xl);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(147, 51, 234, 0.2);
          transition: all var(--transition-normal);
          z-index: 10;
        }

        .carousel-button:hover:not(:disabled) {
          background: var(--primary-600);
          color: white;
          transform: translateY(-50%) scale(1.1);
        }

        .carousel-button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .carousel-button.prev {
          left: 0;
        }

        .carousel-button.next {
          right: 0;
        }

        .carousel-dots {
          display: flex;
          gap: var(--spacing-2);
          justify-content: center;
          margin-top: var(--spacing-6);
        }

        .dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--gray-300);
          border: none;
          cursor: pointer;
          transition: all var(--transition-normal);
        }

        .dot.active {
          background: var(--primary-600);
          width: 32px;
          border-radius: var(--radius-full);
        }

        .dot:hover {
          background: var(--primary-400);
        }
        
        .testimonials-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: var(--spacing-8);
        }
        
        .testimonial-card {
          background: white;
          border-radius: var(--radius-2xl);
          padding: var(--spacing-8);
          text-align: left;
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--gray-100);
          transition: all var(--transition-normal);
          border-left: 4px solid var(--primary-500);
        }
        
        .testimonial-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-xl);
        }

        .testimonial-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-4);
          margin-bottom: var(--spacing-4);
        }

        .testimonial-avatar-large {
          width: 60px;
          height: 60px;
          border-radius: var(--radius-full);
          background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: white;
          font-size: 1.5rem;
          flex-shrink: 0;
          overflow: hidden;
        }

        .testimonial-avatar-large img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .testimonial-info {
          flex: 1;
        }

        .testimonial-name {
          font-weight: 600;
          color: var(--gray-800);
          font-size: var(--font-size-lg);
          margin-bottom: var(--spacing-1);
        }

        .testimonial-rating {
          display: flex;
          align-items: center;
          gap: var(--spacing-2);
        }
        
        .testimonial-stars {
          display: flex;
          gap: 2px;
        }

        .testimonial-stars .star {
          color: #cbd5e0;
          font-size: 1rem;
        }

        .testimonial-stars .star.filled {
          color: #f59e0b;
        }

        .rating-score {
          font-size: var(--font-size-sm);
          color: var(--gray-600);
        }

        .testimonial-skills {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-2);
          margin: var(--spacing-4) 0;
        }

        .skill-badge {
          background: linear-gradient(135deg, var(--primary-50), var(--primary-100));
          color: var(--primary-700);
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-full);
          font-size: var(--font-size-sm);
          font-weight: 500;
        }

        .no-skills {
          color: var(--gray-400);
          font-size: var(--font-size-sm);
          font-style: italic;
        }

        .testimonial-location {
          color: var(--gray-600);
          font-size: var(--font-size-sm);
          margin-top: var(--spacing-2);
        }
        
        .no-data {
          grid-column: 1 / -1;
          padding: var(--spacing-16);
          color: var(--gray-500);
          font-style: italic;
          text-align: center;
          background: var(--gray-100);
          border-radius: var(--radius-xl);
          border: 2px dashed var(--gray-300);
        }

        /* Carousel Responsive Design */
        @media (max-width: 1024px) {
          .worker-card {
            flex: 0 0 calc((100% - var(--spacing-6)) / 2);
            max-width: calc((100% - var(--spacing-6)) / 2);
          }
        }

        @media (max-width: 768px) {
          .worker-card {
            flex: 0 0 100%;
            max-width: 100%;
          }

          .carousel-wrapper {
            margin: 0 var(--spacing-6);
          }

          .carousel-button {
            width: 40px;
            height: 40px;
            font-size: 1.2rem;
          }

          .worker-avatar img,
          .avatar-placeholder {
            width: 100px;
            height: 100px;
          }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .hero {
            padding: var(--spacing-16) 0;
            min-height: 50vh;
          }
          
          .hero-content {
            padding: 0 var(--spacing-4);
          }
          
          .how-section-container,
          .jobs-section-container,
          .testimonials-section-container {
            padding: 0 var(--spacing-4);
          }
          
          .hero h2 {
            font-size: var(--font-size-3xl);
          }
          
          .hero p {
            font-size: var(--font-size-lg);
          }
          
          .button-row {
            flex-direction: column;
            align-items: center;
          }
          
          .btn, .hero button {
            width: 100%;
            max-width: 300px;
          }
          
          .how-section,
          .jobs-section,
          .testimonials-section {
            padding: var(--spacing-12) 0;
          }
          
          .how-section h2,
          .jobs-section h2,
          .testimonials-section h2 {
            font-size: var(--font-size-2xl);
            margin-bottom: var(--spacing-8);
          }
          
          .how-steps {
            grid-template-columns: 1fr;
          }
          
          .jobs-list {
            grid-template-columns: 1fr;
          }
          
          .testimonials-list {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .how-steps {
            overflow-x: auto;
            padding-bottom: var(--spacing-4);
            scroll-snap-type: x mandatory;
            scroll-behavior: smooth;
          }
          
          .how-steps div {
            scroll-snap-align: start;
            min-width: 80%;
          }
        }
        
        @media (max-width: 480px) {
          .hero {
            padding: var(--spacing-12) 0;
          }
          
          .hero-content {
            padding: 0 var(--spacing-2);
          }
          
          .how-section-container,
          .jobs-section-container,
          .testimonials-section-container {
            padding: 0 var(--spacing-2);
          }
          
          .hero h2 {
            font-size: var(--font-size-2xl);
          }
          
          .hero p {
            font-size: var(--font-size-base);
          }
          
          .how-section,
          .jobs-section,
          .testimonials-section {
            padding: var(--spacing-8) 0;
          }
        }
      `}</style>
    </div>
  )
}

export default Home
