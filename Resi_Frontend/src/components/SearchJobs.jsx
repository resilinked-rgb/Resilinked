import { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { AlertContext } from '../context/AlertContext'
import { useTranslation } from '../hooks/useTranslation'
import ReportModal from './ReportModal'

// Use environment variable for API base URL
const API_BASE = import.meta.env.VITE_API_URL || 'https://resi-backend-ihyu.vercel.app/api'

function SearchJobs() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState({
    keyword: '',
    skill: '',
    barangay: '',
    minPrice: '',
    maxPrice: ''
  })
  
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [expandedJobs, setExpandedJobs] = useState({})
  const [reportModal, setReportModal] = useState({ isOpen: false, jobId: null, jobTitle: '' })
  const [cancelModal, setCancelModal] = useState({ isOpen: false, jobId: null, jobTitle: '' })
  
  const { user, isLoggedIn } = useContext(AuthContext)
  const { success, error: showError } = useContext(AlertContext)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setSearchQuery(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await searchJobs(searchQuery)
  }

  const clearFilters = () => {
    setSearchQuery({
      keyword: '',
      skill: '',
      barangay: '',
      minPrice: '',
      maxPrice: ''
    })
    searchJobs({})
  }

  const searchJobs = async (query) => {
    setLoading(true)
    setHasSearched(true)
    
    console.log('🔍 Frontend Search Query:', query);
    
    try {
      // Build query parameters
      const params = new URLSearchParams()
      if (query.keyword) params.append('keyword', query.keyword)
      if (query.skill) params.append('skill', query.skill)
      if (query.barangay) params.append('barangay', query.barangay)
      if (query.minPrice) params.append('minPrice', query.minPrice)
      if (query.maxPrice) params.append('maxPrice', query.maxPrice)

      const url = `${API_BASE}/jobs/search?${params}`;
      console.log('📡 Request URL:', url);

      const response = await fetch(url)
      const data = await response.json()
      
      console.log('📊 Response:', data);
      
      if (data.success && data.data) {
        // Filter out completed and closed jobs on the frontend as additional safety
        const openJobs = data.data.filter(job => 
          job.isOpen !== false && 
          job.completed !== true && 
          job.isDeleted !== true &&
          job.postedBy !== null  // Filter out jobs where employer doesn't exist
        );
        setJobs(openJobs)
      } else {
        setJobs([])
        if (data.message) {
          showError(data.message)
        }
      }
    } catch (err) {
      console.error('Search error:', err)
      let errorMessage = t('searchJobs.searchError')
      
      if (err.message.includes('network') || err.message.includes('fetch')) {
        errorMessage = t('searchJobs.networkError')
      } else if (err.message.includes('timeout')) {
        errorMessage = t('searchJobs.timeoutError')
      }
      
      showError(errorMessage)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  const toggleJobExpansion = (jobId) => {
    setExpandedJobs(prev => ({
      ...prev,
      [jobId]: !prev[jobId]
    }))
  }

  const applyToJob = async (jobId, e) => {
    // Prevent the click from toggling the job expansion
    e.stopPropagation()
    
    if (!isLoggedIn) {
      showError(t('searchJobs.pleaseLogin'))
      return
    }

    // Find the job to check if it's still open
    const job = jobs.find(j => j._id === jobId)
    if (job && (job.isOpen === false || job.completed === true)) {
      showError(t('searchJobs.jobClosed'))
      // Refresh the search to remove this job
      await searchJobs(searchQuery)
      return
    }

    const token = localStorage.getItem('token')
    
    try {
      const response = await fetch(`${API_BASE}/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      
      if (response.ok) {
        success(data.alert || t('searchJobs.appliedSuccess'))
        // Refresh the search results to update applicant count
        await searchJobs(searchQuery)
      } else {
        showError(data.alert || data.message || t('searchJobs.applyFailed'))
      }
    } catch (err) {
      console.error('Apply error:', err)
      let errorMessage = t('searchJobs.genericError')
      
      if (err.message.includes('already applied')) {
        errorMessage = t('searchJobs.alreadyAppliedError')
      } else if (err.message.includes('network') || err.message.includes('fetch')) {
        errorMessage = t('searchJobs.networkError')
      } else if (err.message.includes('unauthorized')) {
        errorMessage = t('searchJobs.unauthorizedError')
      }
      
      showError(errorMessage)
    }
  }

  const cancelApplication = async (jobId, e) => {
    // Prevent the click from toggling the job expansion
    e.stopPropagation()
    
    if (!isLoggedIn) {
      showError(t('searchJobs.pleaseLogin'))
      return
    }

    // Find the job to get its title
    const job = jobs.find(j => j._id === jobId)
    
    // Open confirmation modal
    setCancelModal({
      isOpen: true,
      jobId: jobId,
      jobTitle: job?.title || 'this job'
    })
  }

  const handleCancelConfirm = async () => {
    const { jobId } = cancelModal
    
    // Close the modal first
    setCancelModal({ isOpen: false, jobId: null, jobTitle: '' })

    const token = localStorage.getItem('token')
    
    try {
      const response = await fetch(`${API_BASE}/jobs/${jobId}/cancel-application`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      
      if (response.ok) {
        success(data.alert || t('searchJobs.cancelSuccess'))
        // Refresh the search results to update the button
        await searchJobs(searchQuery)
      } else {
        showError(data.alert || data.message || t('searchJobs.cancelFailed'))
      }
    } catch (err) {
      console.error('Cancel error:', err)
      let errorMessage = t('searchJobs.genericError')
      
      if (err.message.includes('network') || err.message.includes('fetch')) {
        errorMessage = t('searchJobs.networkError')
      } else if (err.message.includes('unauthorized')) {
        errorMessage = t('searchJobs.unauthorizedError')
      }
      
      showError(errorMessage)
    }
  }

  const closeCancelModal = () => {
    setCancelModal({ isOpen: false, jobId: null, jobTitle: '' })
  }

  const openReportModal = (job, e) => {
    e.stopPropagation() // Prevent job card expansion
    setReportModal({
      isOpen: true,
      jobId: job._id,
      jobTitle: job.title
    })
  }

  const closeReportModal = () => {
    setReportModal({ isOpen: false, jobId: null, jobTitle: '' })
  }

  const handleReportSubmit = async (reason) => {
    try {
      const apiService = await import('../api').then(module => module.default)
      await apiService.reportJob({
        reportedJobId: reportModal.jobId,
        reason
      })
      success(t('success.reportSubmitted'))
      closeReportModal()
    } catch (error) {
      console.error('Error submitting report:', error)
      showError(error.message || t('errors.reportFailed'))
      throw error
    }
  }

  // Load initial job listings on component mount
  useEffect(() => {
    // Only run initial search once on mount
    const performInitialSearch = async () => {
      await searchJobs({})
    }
    performInitialSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="search-jobs-container">
      <div className="search-jobs-header">
        <h1>{t('searchJobs.title')}</h1>
        <Link to="/employee-dashboard" className="back-btn">{t('searchJobs.backToDashboard')}</Link>
      </div>

      {/* Search Form */}
      <div className="search-form-card">
        <form onSubmit={handleSubmit} className="search-form">
          {/* Keyword Search Bar */}
          <div className="form-group full-width">
            <label htmlFor="keyword">{t('searchJobs.searchByTitle')}</label>
            <input
              type="text"
              id="keyword"
              name="keyword"
              value={searchQuery.keyword}
              onChange={handleInputChange}
              placeholder={t('searchJobs.searchPlaceholder')}
              className="search-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="skill">{t('searchJobs.skill')}</label>
              <select
                id="skill"
                name="skill"
                value={searchQuery.skill}
                onChange={handleInputChange}
                style={{ minHeight: '48px', fontSize: '1rem' }}
              >
                <option value="">{t('searchJobs.selectSkill')}</option>
                {['Plumbing','Carpentry','Cleaning','Electrical','Painting','Gardening','Cooking','Driving','Babysitting','Tutoring','IT Support','Customer Service'].map(skill => (
                  <option key={skill} value={skill}>{skill}</option>
                ))}
                <option value="Other">Other</option>
              </select>
              {searchQuery.skill === 'Other' && (
                <input
                  type="text"
                  id="otherSkill"
                  name="otherSkill"
                  value={searchQuery.otherSkill || ''}
                  onChange={handleInputChange}
                  placeholder={t('searchJobs.addCustomSkill')}
                  style={{ marginTop: '0.5em' }}
                  required
                />
              )}
            </div>

            <div className="form-group">
              <label htmlFor="barangay">{t('searchJobs.locationBarangay')}</label>
              <input
                type="text"
                id="barangay"
                name="barangay"
                value={searchQuery.barangay}
                onChange={handleInputChange}
                placeholder={t('searchJobs.locationPlaceholder')}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="minPrice">{t('searchJobs.minPrice')}</label>
              <input
                type="number"
                id="minPrice"
                name="minPrice"
                value={searchQuery.minPrice}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="maxPrice">{t('searchJobs.maxPrice')}</label>
              <input
                type="number"
                id="maxPrice"
                name="maxPrice"
                value={searchQuery.maxPrice}
                onChange={handleInputChange}
                placeholder="10000"
                min="0"
              />
            </div>
          </div>

          <div className="button-group">
            <button type="submit" className="search-btn" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner"></div>
                  {t('searchJobs.searching')}
                </>
              ) : (
                t('searchJobs.searchButton')
              )}
            </button>
            <button 
              type="button" 
              className="clear-btn" 
              onClick={clearFilters}
              disabled={loading}
            >
              {t('searchJobs.clearFilters')}
            </button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      <div className="results-section">
        {loading && (
          <div className="loading-state">
            <div className="spinner large"></div>
            <p>{t('searchJobs.searchingJobs')}</p>
          </div>
        )}

        {!loading && hasSearched && jobs.length === 0 && (
          <div className="no-results">
            <h3>{t('searchJobs.noJobsTitle')}</h3>
            <p>{t('searchJobs.noJobsMessage')}</p>
          </div>
        )}

        {!loading && jobs.length > 0 && (
          <div className="results-header">
            <h2>{t('searchJobs.foundJobs')} {jobs.length} {jobs.length !== 1 ? t('searchJobs.jobs') : t('searchJobs.job')}</h2>
          </div>
        )}

        <div className="jobs-grid">
          {jobs.map((job) => {
            // Check if current user has already applied to this job
            const currentUserId = user?.userId || user?.id;
            const hasApplied = currentUserId && job.applicants && job.applicants.some(a => {
              if (!a.user) return false;
              const applicantId = a.user._id || a.user;
              return applicantId.toString() === currentUserId.toString();
            });

            return (
            <div 
              key={job._id} 
              className={`job-card ${expandedJobs[job._id] ? 'expanded' : ''}`}
              onClick={() => toggleJobExpansion(job._id)}
            >
              <div className="job-header">
                <h3>{job.title}</h3>
                <div className="job-price">₱{job.price?.toLocaleString()}</div>
              </div>

              <div className="job-preview">
                <div className="job-preview-detail">
                  <span className="preview-icon">📍</span> {job.barangay}
                </div>
                
                {job.skillsRequired && job.skillsRequired.length > 0 && (
                  <div className="job-preview-detail">
                    <span className="preview-icon">🛠️</span> {job.skillsRequired.slice(0, 2).join(', ')}
                    {job.skillsRequired.length > 2 && ` +${job.skillsRequired.length - 2} ${t('searchJobs.more')}`}
                  </div>
                )}
                
                <div className="job-preview-detail">
                  <span className="preview-icon">👥</span> {job.applicants ? job.applicants.length : 0} {t('searchJobs.applicants')}
                </div>
              </div>
              
              <div className="expansion-indicator">
                {expandedJobs[job._id] ? '▲' : '▼'} 
                <span className="indicator-text">{expandedJobs[job._id] ? t('searchJobs.showLess') : t('searchJobs.showMore')}</span>
              </div>

              {expandedJobs[job._id] && (
                <div className="job-content">
                  <hr className="content-divider" />
                  <p className="job-description">
                    <strong>{t('searchJobs.description')}:</strong> {job.description || t('searchJobs.noDescription')}
                  </p>

                  <div className="job-details">
                    <div className="job-detail">
                      <strong>{t('searchJobs.location')}:</strong> {job.barangay}
                    </div>
                    
                    {job.skillsRequired && job.skillsRequired.length > 0 && (
                      <div className="job-detail">
                        <strong>{t('searchJobs.skillsRequired')}:</strong>
                        <div className="skills-list">
                          {job.skillsRequired.map((skill, index) => (
                            <span key={index} className="skill-badge">{skill}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="job-detail">
                      <strong>{t('searchJobs.postedBy')}:</strong> {
                        job.postedBy 
                          ? `${job.postedBy.firstName} ${job.postedBy.lastName}` 
                          : t('searchJobs.anonymous')
                      }
                    </div>

                    {job.postedBy?.email && (
                      <div className="job-detail employer-contact">
                        <strong>{t('searchJobs.contact')}</strong> {job.postedBy.email}
                      </div>
                    )}

                    <div className="job-detail">
                      <strong>{t('searchJobs.applicantsCount')}:</strong> {job.applicants ? job.applicants.length : 0}
                    </div>
                    
                    <div className="job-actions">
                      {!hasApplied ? (
                        <button 
                          className="apply-btn"
                          onClick={(e) => applyToJob(job._id, e)}
                          disabled={!isLoggedIn}
                          title={
                            !isLoggedIn
                              ? t('searchJobs.tooltipLoginApply')
                              : t('searchJobs.tooltipApply')
                          }
                        >
                          {!isLoggedIn
                            ? t('searchJobs.loginToApply')
                            : t('searchJobs.applyNow')}
                        </button>
                      ) : (
                        <button 
                          className="cancel-application-btn"
                          onClick={(e) => cancelApplication(job._id, e)}
                          title={t('searchJobs.tooltipCancelApplication')}
                        >
                          {t('searchJobs.cancelApplication')}
                        </button>
                      )}
                      {isLoggedIn && job.postedBy?.email && (
                        <Link
                          to="/chat"
                          state={{
                            recipientId: job.postedBy._id,
                            recipientEmail: job.postedBy.email,
                            recipientName: `${job.postedBy.firstName} ${job.postedBy.lastName}`,
                            subject: `${t('searchJobs.regarding')}: ${job.title}`
                          }}
                          className="message-btn"
                          onClick={(e) => e.stopPropagation()}
                          title={t('searchJobs.tooltipMessage')}
                        >
                          {t('searchJobs.message')}
                        </Link>
                      )}
                      {isLoggedIn && (
                        <button 
                          className="report-btn"
                          onClick={(e) => openReportModal(job, e)}
                          title={t('searchJobs.tooltipReport')}
                        >
                          {t('searchJobs.report')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            );
          })}
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={closeReportModal}
        onSubmit={handleReportSubmit}
        reportType="Job"
        targetName={reportModal.jobTitle}
      />

      {/* Cancel Application Confirmation Modal */}
      {cancelModal.isOpen && (
        <div className="modal-overlay" onClick={closeCancelModal}>
          <div className="modal-content cancel-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('searchJobs.cancelApplicationTitle')}</h2>
            </div>
            <div className="modal-body">
              <p>{t('searchJobs.confirmCancelMessage')}</p>
              <p className="job-title-highlight">"{cancelModal.jobTitle}"</p>
            </div>
            <div className="modal-footer">
              <button onClick={closeCancelModal} className="btn secondary">
                {t('common.cancel')}
              </button>
              <button onClick={handleCancelConfirm} className="btn danger">
                {t('searchJobs.confirmCancelButton')}
              </button>
            </div>
          </div>
        </div>
      )}

  <style>{`
        .search-jobs-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .search-jobs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .search-jobs-header h1 {
          margin: 0;
          color: #2b6cb0;
          font-size: 2rem;
        }

        .back-btn {
          color: #666;
          text-decoration: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          transition: background-color 0.2s;
        }

        .back-btn:hover {
          background-color: #f7fafc;
        }

        .search-form-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          padding: 2rem;
          margin-bottom: 2rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .search-input {
          padding: 0.875rem 1rem;
          font-size: 1.05rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .search-input:focus {
          outline: none;
          border-color: #2b6cb0;
          box-shadow: 0 0 0 3px rgba(43, 108, 176, 0.1);
        }

        label {
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #2d3748;
        }

        input {
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        input:focus {
          outline: none;
          border-color: #2b6cb0;
          box-shadow: 0 0 0 3px rgba(43, 108, 176, 0.1);
        }

        .button-group {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .search-btn {
          flex: 1;
          background: #9333ea;
          color: white;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .search-btn:hover:not(:disabled) {
          background: #7c3aed;
        }

        .search-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .clear-btn {
          flex: 1;
          background: white;
          color: #9333ea;
          border: 2px solid #9333ea;
          padding: 0.75rem 2rem;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 600;
        }

        .clear-btn:hover:not(:disabled) {
          background: #9333ea;
          color: white;
        }

        .clear-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading-state {
          text-align: center;
          padding: 3rem;
          color: #666;
        }

        .no-results {
          text-align: center;
          padding: 3rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .no-results h3 {
          color: #2d3748;
          margin-bottom: 0.5rem;
        }

        .results-header {
          margin-bottom: 1.5rem;
        }

        .results-header h2 {
          color: #2d3748;
          margin: 0;
        }

        .jobs-grid {
          display: grid;
          gap: 1.5rem;
        }

        .job-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
          transition: all 0.2s ease;
          cursor: pointer;
          position: relative;
        }

        .job-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
        }
        
        .job-card.expanded {
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
        }
        
        .job-preview {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin: 0.75rem 0;
        }
        
        .job-preview-detail {
          display: flex;
          align-items: center;
          color: #4a5568;
          font-size: 0.9rem;
          background: #f7fafc;
          padding: 0.35rem 0.75rem;
          border-radius: 20px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .preview-icon {
          margin-right: 0.35rem;
        }
        
        .expansion-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #718096;
          font-size: 0.85rem;
          margin-top: 0.5rem;
        }
        
        .indicator-text {
          margin-left: 0.25rem;
          font-size: 0.8rem;
        }
        
        .content-divider {
          border: 0;
          height: 1px;
          background-color: #e2e8f0;
          margin: 1rem 0;
        }

        .job-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .job-header h3 {
          margin: 0;
          color: #2b6cb0;
          font-size: 1.25rem;
          flex: 1;
        }

        .job-price {
          background: #38a169;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-weight: bold;
          font-size: 1.1rem;
        }

        .job-description {
          color: #4a5568;
          margin-bottom: 1rem;
          line-height: 1.5;
        }

        .job-details {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .job-detail {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .job-detail strong {
          color: #2d3748;
        }

        .employer-contact {
          color: #2b6cb0;
          font-weight: 500;
        }

        .employer-contact strong {
          color: #2b6cb0;
        }

        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.25rem;
        }

        .skill-badge {
          background: #edf2f7;
          color: #2d3748;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.875rem;
        }

        .job-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .apply-btn,
        .message-btn {
          background: #38a169;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
          position: relative;
          z-index: 5;
          text-decoration: none;
          display: inline-block;
        }

        .message-btn {
          background: #9333ea;
        }

        .message-btn:hover {
          background: #7c3aed;
        }

        .apply-btn:hover:not(:disabled) {
          background: #2f855a;
        }

        .apply-btn:disabled {
          background: #a0aec0;
          cursor: not-allowed;
        }

        .cancel-application-btn {
          background: #f59e0b;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          z-index: 5;
        }

        .cancel-application-btn:hover {
          background: #d97706;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }

        .report-btn {
          background: #dc2626;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          z-index: 5;
        }

        .report-btn:hover {
          background: #b91c1c;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        }

        .job-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .spinner.large {
          width: 32px;
          height: 32px;
          border-width: 4px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Cancel Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease-in;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .cancel-modal .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .cancel-modal .modal-header h2 {
          margin: 0;
          color: #2d3748;
          font-size: 1.5rem;
        }

        .cancel-modal .modal-body {
          padding: 1.5rem;
        }

        .cancel-modal .modal-body p {
          margin: 0 0 1rem 0;
          color: #4a5568;
          font-size: 1rem;
          line-height: 1.6;
        }

        .job-title-highlight {
          font-weight: 600;
          color: #2b6cb0;
          font-size: 1.1rem;
          padding: 0.75rem;
          background: #ebf8ff;
          border-radius: 8px;
          border-left: 4px solid #2b6cb0;
        }

        .cancel-modal .modal-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid #e2e8f0;
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn.secondary {
          background: #e2e8f0;
          color: #2d3748;
        }

        .btn.secondary:hover {
          background: #cbd5e0;
        }

        .btn.danger {
          background: #dc2626;
          color: white;
        }

        .btn.danger:hover {
          background: #b91c1c;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        }

        @media (max-width: 768px) {
          .search-jobs-container {
            padding: 1rem;
          }

          .search-jobs-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .job-header {
            flex-direction: column;
            gap: 1rem;
          }

          .job-price {
            align-self: flex-start;
          }
        }
      `}</style>
    </div>
  )
}

export default SearchJobs
