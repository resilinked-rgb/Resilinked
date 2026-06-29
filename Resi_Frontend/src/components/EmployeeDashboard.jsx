import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { AlertContext } from '../context/AlertContext';
import apiService from '../api';
import ReportModal from './ReportModal';
import { useTranslation } from '../hooks/useTranslation';

function EmployeeDashboard() {
  const [stats, setStats] = useState({
    applicationsCount: 0,
    offersCount: 0,
    viewsCount: 0,
    rating: 0
  });
  const [myApplications, setMyApplications] = useState([]);
  const [applicationHistory, setApplicationHistory] = useState([]);
  const [jobMatches, setJobMatches] = useState([]);
  const [jobInvitations, setJobInvitations] = useState([]);
  const [loading, setLoading] = useState({
    stats: false,
    applications: false,
    matches: false,
    invitations: false
  });
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'
  const [showJobModal, setShowJobModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showEmployerModal, setShowEmployerModal] = useState(false);
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [employerJobs, setEmployerJobs] = useState([]);
  const [loadingEmployer, setLoadingEmployer] = useState(false);
  const [reportModal, setReportModal] = useState({ isOpen: false, jobId: null, jobTitle: '' });
  const { user, isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const { error: showError, success } = useContext(AlertContext);
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    
    const loadEmployeeData = async () => {
      const token = localStorage.getItem('token');
      const userId = user?.userId;
      
      if (!token || !userId) {
        showError('Session expired. Please login again.');
        navigate('/login');
        return;
      }

      // Load dashboard stats
      try {
        setLoading(prev => ({ ...prev, stats: true }));
        if (apiService.getEmployeeDashboardStats) {
          const statsResponse = await apiService.getEmployeeDashboardStats(userId);
          setStats({
            applicationsCount: statsResponse.applications || 0,
            offersCount: statsResponse.jobOffers || 0,
            viewsCount: statsResponse.profileViews || 0,
            rating: statsResponse.averageRating || 0
          });
        } else {
          const response = await apiService.getProfile('me');
          if (response.user) {
            setStats({
              applicationsCount: response.user.applicationCount || 0,
              offersCount: response.user.offersCount || 0,
              viewsCount: response.user.profileViews || 0,
              rating: 0
            });
            try {
              const ratingsResponse = await apiService.getUserRatings(response.user?._id);
              if (ratingsResponse.averageRating) {
                setStats(prev => ({
                  ...prev,
                  rating: ratingsResponse.averageRating
                }));
              }
            } catch (ratingError) {
              console.error('Error loading ratings:', ratingError);
            }
          }
        }
      } catch (error) {
        console.error('Error loading employee stats:', error);
        showError('Failed to load dashboard statistics');
      } finally {
        setLoading(prev => ({ ...prev, stats: false }));
      }

      // Load job applications
      try {
        setLoading(prev => ({ ...prev, applications: true }));
        const response = await apiService.getMyApplications();
        
        // Check for the new format with active applications and history
        if (response && response.activeApplications) {
          console.log('Received applications data:', response);
          setMyApplications(response.activeApplications || []);
          setApplicationHistory(response.applicationHistory || []);
        } else {
          // Backward compatibility for old response format
          console.log('Received old format applications data');
          setMyApplications(Array.isArray(response) ? response : []);
        }
      } catch (error) {
        console.error('Error loading applications:', error);
        showError('Failed to load your job applications');
      } finally {
        setLoading(prev => ({ ...prev, applications: false }));
      }

      // Load job matches
      try {
        setLoading(prev => ({ ...prev, matches: true }));
        const response = await apiService.getMyMatches();
        
        console.log('Job matches response:', response);
        
        // Handle various response formats
        if (response && response.jobs) {
          // New format returns { jobs: [...] }
          setJobMatches(Array.isArray(response.jobs) ? response.jobs : []);
          
          // Show message if user has no skills
          if (response.noSkills) {
            showError('Add skills to your profile to see job matches', 'info');
          }
        } else {
          // Backward compatibility for old API
          setJobMatches(Array.isArray(response) ? response : []);
        }
      } catch (error) {
        console.error('Error loading job matches:', error);
        showError('Failed to load job matches');
      } finally {
        setLoading(prev => ({ ...prev, matches: false }));
      }

      // Load job invitations
      try {
        setLoading(prev => ({ ...prev, invitations: true }));
        const response = await apiService.getMyInvitations();
        console.log('📨 Job invitations API response:', response);
        console.log('📨 Invitations data:', response?.data);
        console.log('📨 Number of invitations:', response?.data?.length || 0);
        setJobInvitations(response?.data || []);
      } catch (error) {
        console.error('❌ Error loading job invitations:', error);
        showError('Could not load job invitations');
      } finally {
        setLoading(prev => ({ ...prev, invitations: false }));
      }
    };

    loadEmployeeData();
  }, [authLoading, isAuthenticated, user, navigate, showError]);

  const openJobDetailsModal = (job) => {
    setSelectedJob(job);
    setShowJobModal(true);
  };

  const closeJobDetailsModal = () => {
    setShowJobModal(false);
    setSelectedJob(null);
  };

  const openReportModal = (job, e) => {
    if (e) e.stopPropagation();
    setReportModal({
      isOpen: true,
      jobId: job._id,
      jobTitle: job.title
    });
  };

  const closeReportModal = () => {
    setReportModal({ isOpen: false, jobId: null, jobTitle: '' });
  };

  const handleReportSubmit = async (reason) => {
    try {
      console.log('📋 Report modal state:', reportModal);
      
      if (!reportModal.jobId) {
        console.error('❌ No jobId in reportModal');
        showError('Job ID is missing. Please try again.');
        return;
      }
      
      const reportData = {
        reportedJobId: reportModal.jobId,
        reason
      };
      console.log('📤 Submitting report with data:', reportData);
      
      const result = await apiService.reportJob(reportData);
      console.log('✅ Report submission result:', result);
      
      success('Report submitted successfully');
      closeReportModal();
    } catch (error) {
      console.error('❌ Error submitting report:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      
      // Check if it's a duplicate report error
      if (error.message && error.message.includes('already have a pending report')) {
        showError('You have already reported this job.');
      } else {
        showError(error.message || 'Failed to submit report');
      }
      throw error;
    }
  };

  const handleApplyToJob = async (jobId) => {
    // Find the job to check application status
    const job = jobMatches.find(j => j._id === jobId);
    
    if (job) {
      // Check if user can apply
      if (!canApplyToJob(job)) {
        if (wasRejected(job)) {
          showError('Your application to this job was rejected. You cannot reapply.');
        } else {
          showError('You have already applied to this job.');
        }
        return;
      }
    }

    try {
      await apiService.applyToJob(jobId);
      showError('Application submitted successfully!', 'success');
      
      // Refresh applications
      const appResponse = await apiService.getMyApplications();
      if (appResponse && appResponse.activeApplications) {
        setMyApplications(appResponse.activeApplications || []);
        setApplicationHistory(appResponse.applicationHistory || []);
      } else {
        // Backward compatibility
        setMyApplications(Array.isArray(appResponse) ? appResponse : []);
      }
      
      // Refresh job matches to update the UI
      const matchesResponse = await apiService.getMyMatches();
      setJobMatches(matchesResponse?.data || []);
      
      // Close modal if open
      if (showJobModal) {
        closeJobDetailsModal();
      }
    } catch (error) {
      showError(error.message || 'Failed to apply for job');
    }
  };

  const handleAcceptInvitation = async (jobId) => {
    try {
      await apiService.acceptInvitation(jobId);
      success('Invitation accepted! You have applied to the job.');
      
      // Refresh invitations and applications
      const invitationsResponse = await apiService.getMyInvitations();
      setJobInvitations(invitationsResponse?.data || []);
      
      const appResponse = await apiService.getMyApplications();
      if (appResponse && appResponse.activeApplications) {
        setMyApplications(appResponse.activeApplications || []);
        setApplicationHistory(appResponse.applicationHistory || []);
      }
    } catch (error) {
      showError(error.message || 'Failed to accept invitation');
    }
  };

  const handleDeclineInvitation = async (jobId) => {
    try {
      await apiService.declineInvitation(jobId);
      success('Invitation declined');
      
      // Refresh invitations
      const invitationsResponse = await apiService.getMyInvitations();
      setJobInvitations(invitationsResponse?.data || []);
    } catch (error) {
      showError(error.message || 'Failed to decline invitation');
    }
  };

  const viewEmployerProfile = async (employerId) => {
    try {
      setLoadingEmployer(true);
      setShowEmployerModal(true);
      
      // Fetch employer details
      const employerResponse = await apiService.getUserById(employerId);
      setSelectedEmployer(employerResponse.user);
      
      // Fetch employer's completed jobs
      const jobsResponse = await apiService.getCompletedJobsByEmployer(employerId);
      setEmployerJobs(jobsResponse.jobs || []);
    } catch (error) {
      console.error('Error loading employer profile:', error);
      showError(error.message || 'Failed to load employer profile');
      setShowEmployerModal(false);
    } finally {
      setLoadingEmployer(false);
    }
  };

  const handleCancelApplication = async (jobId) => {
    try {
      // Enhanced logging to debug the user ID and job ID being used
      console.log('Attempting to cancel application for job:', jobId);
      console.log('Current user ID:', user?.userId);
      
      // Get the job to verify the user has an application before attempting to cancel
      const job = myApplications.find(j => j._id === jobId);
      if (!job) {
        console.error('Job not found in myApplications list:', jobId);
        showError('Error: Job not found in your applications');
        return;
      }
      
      // Log application data for debugging
      console.log('Job applicants:', job.applicants);
      
      const userApplication = job.applicants.find(a => 
        a.user && (
          (typeof a.user === 'string' && a.user === user?.userId) || 
          (typeof a.user === 'object' && a.user.toString && a.user.toString() === user?.userId)
        )
      );
      
      console.log('Found user application:', userApplication);
      
      if (!userApplication) {
        showError('No application record found for this job. Try refreshing the page.');
        return;
      }
      
      const response = await apiService.cancelApplication(jobId);
      showError('Application cancelled successfully!', 'success');
      
      // Refresh applications
      const appResponse = await apiService.getMyApplications();
      if (appResponse && appResponse.activeApplications) {
        setMyApplications(appResponse.activeApplications || []);
        setApplicationHistory(appResponse.applicationHistory || []);
      } else {
        // Backward compatibility
        setMyApplications(Array.isArray(appResponse) ? appResponse : []);
      }
    } catch (error) {
      console.error('Cancel application error:', error);
      
      // Provide more specific error messages based on the error
      if (error.message === 'No application found') {
        showError('Application not found. It may have already been cancelled or processed.');
        
        // Refresh applications to make sure UI is up to date
        try {
          const appResponse = await apiService.getMyApplications();
          if (appResponse && appResponse.activeApplications) {
            setMyApplications(appResponse.activeApplications || []);
            setApplicationHistory(appResponse.applicationHistory || []);
          } else {
            // Backward compatibility
            setMyApplications(Array.isArray(appResponse) ? appResponse : []);
          }
        } catch (refreshError) {
          console.error('Failed to refresh applications after error:', refreshError);
        }
      } else {
        showError(error.message || 'Failed to cancel application');
      }
    }
  };

  const getApplicationStatus = (application) => {
    if (!application) return 'Not Applied';
    if (application.status === 'accepted') return 'Accepted';
    if (application.status === 'rejected') return 'Rejected';
    return 'Pending';
  };
  
  // Helper function to find user's application in a job
  const findUserApplication = (job) => {
    if (!job || !job.applicants || !user) return null;
    
    return job.applicants.find(a => 
      a.user && (
        (typeof a.user === 'string' && a.user === user.userId) || 
        (typeof a.user === 'object' && a.user.toString && a.user.toString() === user.userId)
      )
    );
  };

  // Helper function to check if user can apply to a job
  const canApplyToJob = (job) => {
    if (!job || !job.isOpen) return false;
    
    const userApplication = findUserApplication(job);
    
    // If no application exists, user can apply
    if (!userApplication) return true;
    
    // If user has been rejected or already applied, cannot reapply
    return false;
  };

  // Helper function to check if user was rejected
  const wasRejected = (job) => {
    const userApplication = findUserApplication(job);
    return userApplication && userApplication.status === 'rejected';
  };

  if (loading.stats || loading.applications || loading.matches) {
    return (
      <>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>{t('employeeDashboard.loadingDashboard')}</p>
        </div>
        <style>{`
          .loading-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            gap: 1rem;
          }

          .spinner {
            width: 48px;
            height: 48px;
            border: 4px solid #e2e8f0;
            border-top: 4px solid #6366f1;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .loading-state p {
            font-size: 1rem;
            color: #4a5568;
            margin: 0;
          }
        `}</style>
      </>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>{t('nav.dashboard')} - {t('register.employee')}</h1>
        <p>{t('landing.welcomeBack')}, {user?.firstName}!</p>
        <Link to="/landing" className="back-btn">{t('settings.backToDashboard')}</Link>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📄</div>
          <div className="stat-content">
            <h3>{stats.applicationsCount}</h3>
            <p>{t('jobs.applications')}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💼</div>
          <div className="stat-content">
            <h3>{stats.offersCount}</h3>
            <p>{t('jobs.jobTitle')}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👁️</div>
          <div className="stat-content">
            <h3>{stats.viewsCount}</h3>
            <p>{t('profile.portfolio')} {t('common.view')}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>{stats.rating.toFixed(1)}</h3>
            <p>{t('profile.ratings')}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <Link to="/search-jobs" className="action-btn primary">
          🔍
          {t('nav.findJobs')}
        </Link>
        <Link to="/profile" className="action-btn secondary">
         👤
          {t('profile.editProfile')}
        </Link>
      </div>

      {/* Job Invitations Section */}
      <section className="dashboard-section invitations-section">
        <div className="section-header">
          <h2>📨 {t('nav.notifications')} ({jobInvitations.length})</h2>
        </div>
        {jobInvitations.length > 0 ? (
          <div className="invitations-grid">
            {jobInvitations.map((invitation) => (
              <div key={invitation._id} className="invitation-card">
                <div className="invitation-header">
                  <h3>{invitation.relatedJob?.title}</h3>
                  <div className="invitation-price">
                    ₱{invitation.relatedJob?.price?.toLocaleString()}
                  </div>
                </div>
                <p className="invitation-message">{invitation.message}</p>
                <div className="invitation-meta">
                  <div className="meta-item">
                    <span className="icon">📍</span>
                    {invitation.relatedJob?.barangay}
                  </div>
                  <div className="meta-item">
                    <span className="icon">📅</span>
                    {new Date(invitation.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="invitation-actions">
                  <button
                    onClick={() => handleAcceptInvitation(invitation.relatedJob._id)}
                    className="btn success"
                  >
                    ✓ {t('common.accept')} & {t('common.apply')}
                  </button>
                  <button
                    onClick={() => handleDeclineInvitation(invitation.relatedJob._id)}
                    className="btn secondary"
                  >
                    ✕ {t('jobs.rejectApplication')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-invitations">
            <p>{t('employeeDashboard.noInvitations')}</p>
            <small>{t('employeeDashboard.checkBackLater')}</small>
          </div>
        )}
      </section>

      {/* Tab Content */}
      <div className="tab-content">
        {/* My Applications Section */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2>{t('jobs.myApplications')}</h2>
            <div className="tab-navigation">
              <button 
                className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
                onClick={() => setActiveTab('active')}
              >
                {t('common.active')} {t('jobs.applications')}
              </button>
              <button 
                className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                {t('profile.workHistory')}
              </button>
            </div>
          </div>

          {activeTab === 'active' && (
            <div className="applications-grid">
              {myApplications.length > 0 ? (
                myApplications.map(job => (
                  <div key={job._id} className="job-card">
                    <div className="job-header">
                      <h3>{job.title}</h3>
                      <div className="job-price">₱{job.price?.toLocaleString()}</div>
                    </div>
                    <div className="job-meta">
                      <div className="meta-item">
                        <span className="icon">📍</span>
                        {job.barangay}
                      </div>
                      <div className="meta-item">
                        <span className="icon">📅</span>
                        {new Date(job.datePosted).toLocaleDateString()}
                      </div>
                      <div className="meta-item">
                        <span className="status pending">{t('jobs.pending')}</span>
                      </div>
                    </div>
                    <div className="job-actions">
                      <button 
                        onClick={() => handleCancelApplication(job._id)}
                        className="btn danger"
                        data-job-id={job._id}
                      >
                        {t('common.cancel')} {t('jobs.apply')}
                      </button>
                      {job.postedBy && (
                        <Link
                          to={`/profile/${job.postedBy._id || job.postedBy}`}
                          className="btn secondary"
                        >
                          {t('common.view')} {t('register.employer')}
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-data">
                  <p>{t('jobs.noApplications')}</p>
                  <Link to="/search-jobs" className="btn primary">{t('landing.exploreJobs')}</Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="applications-grid">
              {applicationHistory.length > 0 ? (
                applicationHistory.map(job => (
                  <div key={job._id} className="job-card">
                    <div className="job-header">
                      <h3>{job.title}</h3>
                      <div className="job-price">₱{job.price?.toLocaleString()}</div>
                    </div>
                    <div className="job-meta">
                      <div className="meta-item">
                        <span className="icon">📍</span>
                        {job.barangay}
                      </div>
                      <div className="meta-item">
                        <span className="icon">📅</span>
                        {new Date(job.datePosted).toLocaleDateString()}
                      </div>
                      <div className="meta-item">
                        <span className={`status ${job.applicationInfo?.status.toLowerCase() || 'unknown'}`}>
                          {job.applicationInfo?.status === 'accepted' ? t('jobs.accepted') : 
                           job.applicationInfo?.status === 'rejected' ? t('jobs.rejected') : t('jobs.closeJob')}
                        </span>
                      </div>
                    </div>
                    <div className="job-actions">
                      {job.applicationInfo?.assignedToMe && (
                        <span className="assigned-badge">✓ {t('jobs.accepted')}</span>
                      )}
                      {job.postedBy && (
                        <Link
                          to={`/profile/${job.postedBy._id || job.postedBy}`}
                          className="btn secondary"
                        >
                          {t('common.view')} {t('register.employer')}
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-data">
                  <p>{t('profile.workHistory')}</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Job Matches Section */}
        <section className="dashboard-section">
          <h2>{t('employeeDashboard.recommendedJobs')}</h2>
          <div className="jobs-grid">
            {jobMatches.length > 0 ? (
              jobMatches.map(job => (
                <div key={job._id} className="job-card">
                  <div className="job-header">
                    <h3>{job.title}</h3>
                    <div className="job-price">₱{job.price?.toLocaleString()}</div>
                  </div>
                  
                  {/* Match Score Indicator */}
                  {job.matchScore && (
                    <div className="match-score-container">
                      <div className="match-score">
                        <span className="match-label">{t('employeeDashboard.match')}</span>
                        <span className="match-percentage">
                          {Math.min(100, Math.round(job.matchScore / 10 * 20))}%
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="job-meta">
                    <div className="meta-item">
                      <span className="icon">📍</span>
                      {job.barangay}
                      {job.barangay === user?.barangay && (
                        <span className="location-match">{t('common.select')} Area</span>
                      )}
                    </div>
                    <div className="meta-item">
                      <span className="icon">📅</span>
                      {new Date(job.datePosted).toLocaleDateString()}
                    </div>
                    <div className="meta-item">
                      <span className="icon">👥</span>
                      {t('searchJobs.postedBy')}: {job.postedBy ? 
                        `${job.postedBy.firstName} ${job.postedBy.lastName}` : 
                        t('searchJobs.anonymous')}
                    </div>
                    
                    {/* Required Skills Section */}
                    {job.skillsRequired && job.skillsRequired.length > 0 && (
                      <div className="skills-container">
                        <div className="skills-label">{t('jobs.requiredSkills')} ({job.skillsRequired.length}):</div>
                        <div className="skills-list">
                          {job.skillsRequired.map((skill, index) => {
                            const isMatching = job.matchingSkills && job.matchingSkills.includes(skill);
                            return (
                              <span 
                                key={index} 
                                className={`skill-tag ${isMatching ? 'matching' : 'non-matching'}`}
                              >
                                {skill}{isMatching && ' ✓'}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {job.description && (
                      <div className="job-description">
                        <p>{job.description.length > 100 
                          ? `${job.description.substring(0, 100)}...` 
                          : job.description}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="job-actions">
                    {wasRejected(job) ? (
                      <span className="rejected-badge">❌ {t('jobs.rejected')}</span>
                    ) : canApplyToJob(job) ? (
                      <button 
                        onClick={() => handleApplyToJob(job._id)}
                        className="btn primary"
                      >
                        {t('common.applyNow')}
                      </button>
                    ) : (
                      myApplications.some(app => app._id === job._id) && (
                        <span className="applied-badge">{t('common.applied')}</span>
                      )
                    )}
                    <button 
                      onClick={() => openJobDetailsModal(job)} 
                      className="btn secondary"
                    >
                      {t('common.viewDetails')}
                    </button>
                    <button 
                      onClick={(e) => openReportModal(job, e)} 
                      className="btn danger"
                      title={t('profile.report')}
                    >
                      🚩 {t('profile.report')}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data">
                <p>{t('searchJobs.noJobsFound')}</p>
                <Link to="/profile" className="btn secondary">{t('profile.editProfile')}</Link>
                <Link to="/search-jobs" className="btn primary">{t('landing.exploreJobs')}</Link>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Job Details Modal */}
      {showJobModal && selectedJob && (
        <div className="modal-overlay" onClick={closeJobDetailsModal}>
          <div className="modal-content job-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedJob.title}</h2>
            </div>
            
            <div className="modal-body">
              <div className="job-detail-price">
                <span className="price-label">{t('jobs.price')}:</span>
                <span className="price-value">₱{selectedJob.price?.toLocaleString()}</span>
              </div>

              {selectedJob.matchScore && (
                <div className="job-detail-match">
                  <span className="match-label">{t('employeeDashboard.matchScore')}:</span>
                  <span className="match-percentage-large">
                    {Math.min(100, Math.round(selectedJob.matchScore / 10 * 20))}%
                  </span>
                </div>
              )}

              <div className="job-detail-section">
                <h3>{t('searchJobs.description')}</h3>
                <p>{selectedJob.description || t('searchJobs.noJobsFound')}</p>
              </div>

              <div className="job-detail-section">
                <h3>{t('searchJobs.location')}</h3>
                <p>📍 {selectedJob.barangay}</p>
                {selectedJob.barangay === user?.barangay && (
                  <span className="location-match-badge">{t('searchJobs.location')}!</span>
                )}
              </div>

              <div className="job-detail-section">
                <h3>{t('searchJobs.postedBy')}</h3>
                {selectedJob.postedBy ? (
                  <>
                    <Link 
                      to={`/profile/${selectedJob.postedBy._id}`}
                      className="employer-profile-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="employer-name">👤 {selectedJob.postedBy.firstName} {selectedJob.postedBy.lastName}</p>
                    </Link>
                    {selectedJob.postedBy.email && (
                      <p className="employer-email">✉️ {selectedJob.postedBy.email}</p>
                    )}
                    <p className="date-posted">📅 {t('searchJobs.postedOn')} {new Date(selectedJob.datePosted).toLocaleDateString()}</p>
                    <Link 
                      to="/chat" 
                      state={{ 
                        recipientId: selectedJob.postedBy._id,
                        recipientEmail: selectedJob.postedBy.email,
                        recipientName: `${selectedJob.postedBy.firstName} ${selectedJob.postedBy.lastName}`,
                        subject: `Regarding: ${selectedJob.title}`
                      }}
                      className="btn-message-employer"
                    >
                      💬 {t('profile.message')} {t('register.employer')}
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="employer-name">👤 {t('searchJobs.anonymous')}</p>
                    <p className="date-posted">📅 {t('searchJobs.postedOn')} {new Date(selectedJob.datePosted).toLocaleDateString()}</p>
                    <p className="employer-unavailable">{t('searchJobs.employerNotFound')}</p>
                  </>
                )}
              </div>

              {selectedJob.matchingSkills && selectedJob.matchingSkills.length > 0 && (
                <div className="job-detail-section">
                  <h3>✓ Matching {t('profile.skills')} ({selectedJob.matchingSkills.length})</h3>
                  <div className="skills-list">
                    {selectedJob.matchingSkills.map((skill, index) => (
                      <span key={index} className="skill-tag matching">{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedJob.skillsRequired && selectedJob.skillsRequired.length > 0 && (
                <div className="job-detail-section">
                  <h3>{t('jobs.requiredSkills')} ({selectedJob.skillsRequired.length})</h3>
                  <div className="skills-list">
                    {selectedJob.skillsRequired.map((skill, index) => {
                      const isMatching = selectedJob.matchingSkills && selectedJob.matchingSkills.includes(skill);
                      return (
                        <span 
                          key={index} 
                          className={`skill-tag ${isMatching ? 'matching' : 'non-matching'}`}
                        >
                          {skill}{isMatching && ' ✓'}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <div className="modal-footer-left">
                <button 
                  onClick={(e) => openReportModal(selectedJob, e)} 
                  className="btn danger"
                  title={t('profile.report')}
                >
                  🚩 {t('profile.report')}
                </button>
              </div>
              <div className="modal-footer-right">
                <button 
                  onClick={closeJobDetailsModal}
                  className="btn secondary"
                >
                  {t('common.close')}
                </button>
                {wasRejected(selectedJob) ? (
                  <span className="rejected-badge-large">❌ {t('jobs.rejected')}</span>
                ) : canApplyToJob(selectedJob) ? (
                  <button 
                    onClick={() => handleApplyToJob(selectedJob._id)}
                    className="btn primary btn-large"
                  >
                    {t('common.applyNow')}
                  </button>
                ) : (
                  myApplications.some(app => app._id === selectedJob._id) && (
                    <span className="applied-badge-large">{t('common.applied')}</span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={closeReportModal}
        onSubmit={handleReportSubmit}
        reportType="Job"
        targetName={reportModal.jobTitle}
      />

      {/* Employer Profile Modal */}
      {showEmployerModal && selectedEmployer && (
        <div className="modal-overlay" onClick={() => setShowEmployerModal(false)}>
          <div className="modal-content employer-profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('register.employer')} {t('nav.profile')}</h2>
            </div>
            
            <div className="modal-body">
              {loadingEmployer ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>{t('common.loading')}</p>
                </div>
              ) : (
                <>
                  {/* Employer Info */}
                  <div className="employer-info-section">
                    <div className="employer-header">
                      <div className="employer-avatar">
                        {selectedEmployer.profilePicture ? (
                          <img src={selectedEmployer.profilePicture} alt={selectedEmployer.firstName} />
                        ) : (
                          <div className="avatar-placeholder">
                            {selectedEmployer.firstName?.[0]}{selectedEmployer.lastName?.[0]}
                          </div>
                        )}
                      </div>
                      <div className="employer-details">
                        <h3>{selectedEmployer.firstName} {selectedEmployer.lastName}</h3>
                        <p className="employer-location">📍 {selectedEmployer.barangay || t('common.noResults')}</p>
                        {selectedEmployer.averageRating > 0 && (
                          <p className="employer-rating">⭐ {selectedEmployer.averageRating.toFixed(1)} {t('profile.rating')}</p>
                        )}
                      </div>
                    </div>
                    
                    {selectedEmployer.bio && (
                      <div className="employer-bio">
                        <h4>{t('profile.about')}</h4>
                        <p>{selectedEmployer.bio}</p>
                      </div>
                    )}
                  </div>

                  {/* Completed Jobs */}
                  <div className="employer-jobs-section">
                    <h4>{t('jobs.completedJobs')} ({employerJobs.length})</h4>
                    {employerJobs.length > 0 ? (
                      <div className="completed-jobs-list">
                        {employerJobs.map(job => (
                          <div key={job._id} className="completed-job-card">
                            <div className="job-header-small">
                              <h5>{job.title}</h5>
                              <span className="job-price-small">₱{job.price?.toLocaleString()}</span>
                            </div>
                            
                            <div className="job-meta-small">
                              <span>📍 {job.barangay}</span>
                              <span>📅 {new Date(job.datePosted).toLocaleDateString()}</span>
                            </div>

                            {job.assignedWorker && (
                              <div className="worker-info-small">
                                <p><strong>{t('register.employee')}:</strong> {job.assignedWorker.firstName} {job.assignedWorker.lastName}</p>
                                {job.rating && (
                                  <div className="job-rating">
                                    <span>⭐ {job.rating.rating}/5</span>
                                    {job.rating.comment && (
                                      <p className="rating-comment">"{job.rating.comment}"</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {job.description && (
                              <p className="job-description-small">{job.description.substring(0, 100)}...</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-jobs-message">{t('jobs.noJobsPosted')}</p>
                    )}
                  </div>

                  {/* Contact Section */}
                  <div className="employer-contact-section">
                    <Link 
                      to="/chat" 
                      state={{ 
                        recipientId: selectedEmployer._id,
                        recipientEmail: selectedEmployer.email,
                        recipientName: `${selectedEmployer.firstName} ${selectedEmployer.lastName}`,
                        subject: `Job Inquiry`
                      }}
                      className="btn primary"
                      onClick={() => setShowEmployerModal(false)}
                    >
                      💬 {t('profile.message')} {t('register.employer')}
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .dashboard-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .dashboard-header {
          margin-bottom: 2rem;
        }

        .dashboard-header h1 {
          margin: 0;
          color: #2b6cb0;
          font-size: 2rem;
        }

        .dashboard-header p {
          margin: 0.5rem 0;
          color: #666;
          font-size: 1.1rem;
        }

        .back-btn {
          color: #666;
          text-decoration: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          transition: background-color 0.2s;
          display: inline-block;
          margin-top: 0.5rem;
        }

        .back-btn:hover {
          background-color: #f7fafc;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stat-icon {
          font-size: 2rem;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e6f3ff;
          border-radius: 50%;
        }

        .stat-content h3 {
          margin: 0;
          font-size: 2rem;
          color: #2b6cb0;
        }

        .stat-content p {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
        }

        .quick-actions {
          display: flex;
          gap: 1rem;
          margin-bottom: 2.5rem;
          flex-wrap: wrap;
        }
        
        /* BUTTON BASE - Professional Design */
        .action-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.875rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          line-height: 1.2;
          letter-spacing: 0.01em;
          
          flex: 0 0 auto;
          width: auto;
          max-width: 100%;
          
          /* Professional touch */
          border: 2px solid transparent;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
          position: relative;
          overflow: hidden;
        }
        
        /* Height and spacing */
        .action-btn {
          height: 42px;
          min-height: 42px;
        }
        
        /* Icon styling */
        .action-btn .icon {
          font-size: 1.1rem;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease;
        }
        
        /* PRIMARY BUTTON - Elegant Blue */
        .action-btn.primary {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border: 2px solid #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
        }
        
        .action-btn.primary:hover {
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          border-color: #2563eb;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.35);
        }
        
        .action-btn.primary:hover .icon {
          transform: translateX(2px);
        }
        
        /* Add subtle shine effect */
        .action-btn.primary::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.7s ease;
        }
        
        .action-btn.primary:hover::after {
          left: 100%;
        }
        
        /* SECONDARY BUTTON - Clean Gray */
        .action-btn.secondary {
          background: white;
          color: #374151;
          border: 2px solid #d1d5db;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
        }
        
        .action-btn.secondary:hover {
          background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
          border-color: #9ca3af;
          color: #1f2937;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .action-btn.secondary:hover .icon {
          transform: scale(1.1);
        }
        
        /* Active/Focus states */
        .action-btn:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }
        
        .action-btn.secondary:focus {
          box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.15);
        }
        
        /* Disabled state */
        .action-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
        }
        
        /* Active click effect */
        .action-btn:active {
          transform: translateY(0);
          transition: transform 0.1s ease;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .quick-actions {
            gap: 0.75rem;
          }
          
          .action-btn {
            padding: 0.5rem 1rem;
            font-size: 0.8125rem;
            height: 38px;
            min-height: 38px;
          }
          
          .action-btn .icon {
            font-size: 1rem;
            width: 18px;
            height: 18px;
          }
        }
        
        @media (max-width: 480px) {
          .quick-actions {
            gap: 0.5rem;
          }
          
          .action-btn {
            flex: 1 0 calc(50% - 0.5rem);
            min-width: calc(50% - 0.5rem);
            justify-content: center;
          }
        }

        .dashboard-section {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          padding: 2rem;
          margin-bottom: 2rem;
        }

        .dashboard-section .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .dashboard-section h2 {
          color: #2b6cb0;
          margin: 0;
        }
        
        .tab-navigation {
          display: flex;
          gap: 0.5rem;
        }
        
        .tab-button {
          background: #e2e8f0;
          color: #2d3748;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .tab-button.active {
          background: #2b6cb0;
          color: white;
        }
        
        .assigned-badge {
          display: inline-block;
          background: #48bb78;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .applications-grid,
        .jobs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2rem;
          margin-top: 1.5rem;
        }

        .job-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 1rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          position: relative;
          overflow: hidden;
        }

        .job-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s ease;
        }

        .job-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
          border-color: #cbd5e1;
        }

        .job-card:hover::before {
          transform: scaleX(1);
        }

        .job-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }

        .job-header h3 {
          margin: 0;
          color: #1e293b;
          font-size: 0.95rem;
          font-weight: 600;
          flex: 1;
          line-height: 1.3;
          letter-spacing: -0.01em;
        }

        .job-price {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 0.3rem 0.6rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.85rem;
          box-shadow: 0 1px 4px rgba(16, 185, 129, 0.15);
          white-space: nowrap;
          flex-shrink: 0;
        }

        .job-meta {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          margin: 0;
          padding: 0.6rem;
          background: #f8fafc;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          color: #475569;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .meta-item .icon {
          font-size: 0.9rem;
          flex-shrink: 0;
        }

        .skills-container, .matching-skills-container {
          margin: 0.5rem 0 0.25rem 0;
        }
        
        .skills-label, .matching-skills-label {
          font-weight: 600;
          font-size: 0.75rem;
          margin-bottom: 0.4rem;
          color: #334155;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }
        
        .matching-skills-label {
          color: #059669;
        }
        
        .skills-list, .matching-skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .skill-tag {
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          color: #475569;
          padding: 0.25rem 0.5rem;
          border-radius: 10px;
          font-size: 0.7rem;
          font-weight: 600;
          white-space: nowrap;
          border: 1px solid #cbd5e1;
          transition: all 0.2s ease;
        }

        .skill-tag:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }
        
        .skill-tag.matching {
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          color: #065f46;
          border: 1.5px solid #6ee7b7;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
        }
        
        .skill-tag.non-matching {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          color: #94a3b8;
          border: 1.5px solid #e2e8f0;
        }
        
        .match-score-container {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 0.25rem;
        }
        
        .match-score {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          border-radius: 10px;
          padding: 0.25rem 0.6rem;
          border: 1px solid #93c5fd;
          box-shadow: 0 1px 3px rgba(59, 130, 246, 0.1);
        }
        
        .match-label {
          color: #1e40af;
          font-size: 0.7rem;
          font-weight: 600;
        }
        
        .match-percentage {
          color: #1e40af;
          font-size: 0.75rem;
          font-weight: 700;
        }
        
        .location-match {
          background: linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%);
          color: #0f766e;
          border-radius: 15px;
          padding: 0.25rem 0.625rem;
          margin-left: 0.5rem;
          font-size: 0.75rem;
          font-weight: 700;
          border: 1.5px solid #5eead4;
          box-shadow: 0 1px 4px rgba(20, 184, 166, 0.2);
        }
        
        .job-description {
          margin: 1rem 0;
          color: #64748b;
          font-size: 0.9375rem;
          line-height: 1.7;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 10px;
          border-left: 3px solid #3b82f6;
        }

        .job-description p {
          margin: 0;
        }
        
        .applied-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          color: #92400e;
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          font-size: 0.9375rem;
          font-weight: 700;
          border: 1.5px solid #fbbf24;
          box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);
          text-align: center;
        }

        .applied-badge::before {
          content: '✓';
          font-size: 1.1rem;
        }

        .applied-badge-large {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          color: #92400e;
          padding: 1rem 1.75rem;
          border-radius: 16px;
          font-size: 1.125rem;
          font-weight: 700;
          border: 2px solid #fbbf24;
          box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
        }

        .applied-badge-large::before {
          content: '✓';
          font-size: 1.3rem;
        }

        .rejected-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);
          color: #991b1b;
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          font-size: 0.9375rem;
          font-weight: 700;
          border: 1.5px solid #f87171;
          box-shadow: 0 2px 8px rgba(248, 113, 113, 0.3);
          text-align: center;
        }

        .rejected-badge-large {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);
          color: #991b1b;
          padding: 1rem 1.75rem;
          border-radius: 16px;
          font-size: 1.125rem;
          font-weight: 700;
          border: 2px solid #f87171;
          box-shadow: 0 4px 12px rgba(248, 113, 113, 0.4);
        }

        /* Invitations Section */
        .invitations-section {
          margin-bottom: 2rem;
        }

        .invitations-grid {
          display: grid;
          gap: 1rem;
        }

        .no-invitations {
          text-align: center;
          padding: 3rem 2rem;
          background: #f8fafc;
          border-radius: 8px;
          color: #64748b;
        }

        .no-invitations p {
          margin: 0 0 0.5rem 0;
          font-size: 1.1rem;
          font-weight: 500;
        }

        .no-invitations small {
          font-size: 0.9rem;
          color: #94a3b8;
        }

        .invitation-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 1.5rem;
          color: white;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .invitation-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }

        .invitation-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
          gap: 1rem;
        }

        .invitation-header h3 {
          margin: 0;
          font-size: 1.3rem;
          font-weight: 600;
          flex: 1;
        }

        .invitation-price {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(10px);
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-weight: bold;
          font-size: 1rem;
          white-space: nowrap;
        }

        .invitation-message {
          margin: 0.75rem 0;
          font-size: 0.95rem;
          line-height: 1.5;
          opacity: 0.95;
        }

        .invitation-meta {
          display: flex;
          gap: 1.5rem;
          margin: 1rem 0;
          flex-wrap: wrap;
        }

        .invitation-meta .meta-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.9rem;
        }

        .invitation-meta .icon {
          font-size: 1rem;
        }

        .invitation-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1.25rem;
          flex-wrap: wrap;
        }

        .invitation-actions .btn {
          flex: 1;
          min-width: 120px;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .invitation-actions .btn.success {
          background: white;
          color: #38a169;
        }

        .invitation-actions .btn.success:hover {
          background: #f0fff4;
          transform: scale(1.03);
        }

        .invitation-actions .btn.secondary {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.5);
        }

        .invitation-actions .btn.secondary:hover {
          background: rgba(255, 255, 255, 0.3);
          border-color: white;
        }

        /* Job Details Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 700px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            transform: translateY(50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 2px solid #e2e8f0;
        }

        .modal-header h2 {
          margin: 0;
          color: #2b6cb0;
          font-size: 1.5rem;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 2rem;
          color: #666;
          cursor: pointer;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: #f3f4f6;
          color: #111;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .job-detail-price {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .price-label {
          color: rgba(255, 255, 255, 0.9);
          font-size: 1rem;
        }

        .price-value {
          color: white;
          font-size: 1.75rem;
          font-weight: 700;
        }

        .job-detail-match {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: #e6fffa;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .match-percentage-large {
          font-size: 2rem;
          font-weight: 700;
          color: #00695c;
        }

        .job-detail-section {
          margin-bottom: 1.5rem;
        }

        .job-detail-section h3 {
          color: #2d3748;
          font-size: 1.1rem;
          margin-bottom: 0.75rem;
          border-left: 4px solid #2b6cb0;
          padding-left: 0.75rem;
        }

        .job-detail-section p {
          color: #4a5568;
          line-height: 1.6;
          margin: 0.5rem 0;
        }

        .date-posted {
          color: #718096;
          font-size: 0.9rem;
        }

        .employer-profile-link {
          text-decoration: none;
          display: inline-block;
          transition: transform 0.2s;
        }

        .employer-profile-link:hover {
          transform: translateX(4px);
        }

        .employer-profile-link .employer-name {
          color: #9333ea;
          font-weight: 600;
          margin: 0;
          cursor: pointer;
        }

        .employer-profile-link:hover .employer-name {
          color: #7c3aed;
          text-decoration: underline;
        }

        .employer-email {
          color: #2b6cb0;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .employer-unavailable {
          color: #e53e3e;
          font-size: 0.9rem;
          font-style: italic;
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: #fff5f5;
          border-left: 3px solid #e53e3e;
          border-radius: 4px;
        }

        .btn-message-employer {
          display: inline-block;
          margin-top: 0.75rem;
          padding: 0.5rem 1rem;
          background: #9333ea;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .btn-message-employer:hover {
          background: #7c3aed;
        }

        .location-match-badge {
          display: inline-block;
          background: #bee3f8;
          color: #2c5282;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 500;
          margin-top: 0.5rem;
        }

        .modal-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-top: 2px solid #e2e8f0;
        }

        .modal-footer-left {
          display: flex;
          gap: 0.5rem;
        }

        .modal-footer-right {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .btn-large {
          padding: 0.875rem 2rem;
          font-size: 1.1rem;
        }

        .status {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.8125rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }

        .status.pending {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          color: #92400e;
          border: 1.5px solid #fbbf24;
        }

        .status.accepted {
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          color: #065f46;
          border: 1.5px solid #6ee7b7;
        }

        .status.rejected {
          background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);
          color: #991b1b;
          border: 1.5px solid #f87171;
        }

        .job-actions {
          margin-top: 1.25rem;
          display: flex;
          gap: 0.875rem;
          flex-wrap: wrap;
          align-items: center;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 12px;
          font-size: 0.9375rem;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          text-align: center;
          font-weight: 600;
          flex: 0 1 auto;
          white-space: nowrap;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
          position: relative;
          overflow: hidden;
        }

        .btn::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }

        .btn:hover::before {
          width: 300px;
          height: 300px;
        }

        .btn.primary {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
        }

        .btn.primary:hover {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
        }

        .btn.secondary {
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          color: #334155;
          border: 1.5px solid #cbd5e1;
        }

        .btn.secondary:hover {
          background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .btn.danger {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: none;
        }

        .btn.danger:hover {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          gap: 1rem;
        }
        
        .loading-state p {
          font-size: 1rem;
          color: #4a5568;
          margin: 0;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #e2e8f0;
          border-top: 4px solid #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .spinner.large {
          width: 48px;
          height: 48px;
          border: 4px solid #e2e8f0;
          border-top: 4px solid #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .modal-body .loading-state {
          height: 200px;
        }

        .no-data {
          text-align: center;
          padding: 2rem;
          color: #666;
        }

        .no-data p {
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .dashboard-container {
            padding: 1rem;
          }

          .stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          }

          .quick-actions {
            flex-direction: column;
          }

          .applications-grid,
          .jobs-grid {
            grid-template-columns: 1fr;
          }

          .job-card {
            padding: 1.25rem;
          }

          .job-actions {
            flex-direction: column;
            gap: 0.5rem;
          }

          .btn {
            width: 100%;
            text-align: center;
          }

          .skill-tag {
            font-size: 0.7rem;
            padding: 0.25rem 0.5rem;
          }

          .applied-badge {
            width: 100%;
            text-align: center;
          }
        }

        /* Employer Profile Modal Styles */
        .employer-profile-modal {
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .employer-info-section {
          margin-bottom: 2rem;
        }

        .employer-header {
          display: flex;
          gap: 1.5rem;
          align-items: start;
          margin-bottom: 1.5rem;
        }

        .employer-avatar {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .employer-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 2.5rem;
          font-weight: bold;
        }

        .employer-details h3 {
          margin: 0 0 0.5rem 0;
          color: #2d3748;
          font-size: 1.5rem;
        }

        .employer-location,
        .employer-rating {
          margin: 0.25rem 0;
          color: #4a5568;
          font-size: 1rem;
        }

        .employer-bio {
          background: #f7fafc;
          padding: 1rem;
          border-radius: 8px;
          margin-top: 1rem;
        }

        .employer-bio h4 {
          margin: 0 0 0.5rem 0;
          color: #2d3748;
        }

        .employer-bio p {
          margin: 0;
          color: #4a5568;
          line-height: 1.6;
        }

        .employer-jobs-section {
          margin-bottom: 2rem;
        }

        .employer-jobs-section h4 {
          margin: 0 0 1rem 0;
          color: #2d3748;
          font-size: 1.25rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #e2e8f0;
        }

        .completed-jobs-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-height: 400px;
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .completed-job-card {
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 1rem;
        }

        .job-header-small {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 0.5rem;
        }

        .job-header-small h5 {
          margin: 0;
          color: #2d3748;
          font-size: 1.1rem;
        }

        .job-price-small {
          color: #2b6cb0;
          font-weight: bold;
          font-size: 1rem;
        }

        .job-meta-small {
          display: flex;
          gap: 1rem;
          margin-bottom: 0.75rem;
          color: #718096;
          font-size: 0.875rem;
        }

        .worker-info-small {
          background: white;
          padding: 0.75rem;
          border-radius: 6px;
          margin-top: 0.75rem;
        }

        .worker-info-small p {
          margin: 0 0 0.5rem 0;
          color: #4a5568;
        }

        .job-rating {
          margin-top: 0.5rem;
        }

        .job-rating span {
          color: #d97706;
          font-weight: 600;
        }

        .rating-comment {
          margin: 0.5rem 0 0 0;
          color: #4a5568;
          font-style: italic;
          font-size: 0.875rem;
        }

        .job-description-small {
          margin: 0.75rem 0 0 0;
          color: #4a5568;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .no-jobs-message {
          text-align: center;
          color: #718096;
          padding: 2rem;
          font-style: italic;
        }

        .employer-contact-section {
          padding-top: 1rem;
          border-top: 2px solid #e2e8f0;
        }

        .employer-contact-section .btn {
          width: 100%;
        }

        /* Search Input Styles */
        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .search-input {
          width: 100%;
          padding: 0.875rem 1rem;
          font-size: 1rem;
          border: 2px solid #cbd5e0;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .search-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        @media (max-width: 768px) {
          .employer-header {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          .employer-avatar {
            width: 80px;
            height: 80px;
          }

          .completed-jobs-list {
            max-height: 300px;
          }
        }
      `}</style>
    </div>
  );
}

export default EmployeeDashboard;
