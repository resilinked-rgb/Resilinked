import { useState, useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { AlertContext } from '../context/AlertContext'
import { useTranslation } from '../hooks/useTranslation'
import apiService from '../api'
import ReportModal from './ReportModal'
import PaymentModal from './PaymentModal'
import { getProfilePictureUrl } from '../utils/imageHelper'

function EmployerDashboard() {
  const { t } = useTranslation()
  
  // Helper function for price formatting
  const formatPrice = (price) => {
    if (price === undefined || price === null) return '₱0';
    if (typeof price === 'number') return '₱' + price.toLocaleString();
    return '₱' + price;
  };

  const [loading, setLoading] = useState(true)
  const [currentTab, setCurrentTab] = useState('my-jobs')
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplications: 0,
    completedJobs: 0,
    averageRating: 0
  })
  const [myJobs, setMyJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [workers, setWorkers] = useState([])
  const [tabLoading, setTabLoading] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [currentEditJob, setCurrentEditJob] = useState(null)
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    price: '',
    barangay: '',
    skillsRequired: []
  })
  // State for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [jobToDelete, setJobToDelete] = useState(null)
  // New state for worker profile modal
  const [showWorkerModal, setShowWorkerModal] = useState(false)
  const [currentWorker, setCurrentWorker] = useState(null)
  // New state for invitation modal
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedJobForInvite, setSelectedJobForInvite] = useState(null)
  // New state for payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [jobToComplete, setJobToComplete] = useState(null)

  const { user, hasAccessTo } = useContext(AuthContext)
  const { success, error: showError } = useContext(AlertContext)
  const navigate = useNavigate()

  useEffect(() => {
    if (!hasAccessTo('employer')) {
      showError('Employer access required')
      navigate('/landing')
      return
    }
    
    loadDashboardData()
  }, [hasAccessTo, navigate, showError])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      await loadDashboardStats()
      await loadTabContent(currentTab)
    } catch (error) {
      console.error('Dashboard initialization error:', error)
      showError('Failed to load dashboard. Please try refreshing.')
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardStats = async () => {
    try {
      // Load jobs and applications in parallel using apiService
      const [jobs, receivedApplications] = await Promise.all([
        apiService.getMyJobs(),
        apiService.getMyApplicationsReceived()
      ]);

      const activeJobs = jobs.filter(job => job.isOpen !== false).length;
      const totalApplications = receivedApplications.reduce((sum, job) => 
        sum + (job.applicants ? job.applicants.length : 0), 0
      );
      const completedJobs = jobs.filter(job => job.completed).length;

      setStats({
        activeJobs,
        totalApplications,
        completedJobs,
        averageRating: 4.2 // Placeholder - would load from ratings API
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      showError('Failed to load dashboard statistics');
    }
  }

  const loadTabContent = async (tabId) => {
    setTabLoading(true)
    try {
      switch (tabId) {
        case 'my-jobs':
          await loadMyJobs()
          break
        case 'applications':
          await loadApplications()
          break
        case 'workers':
          await loadWorkers()
          break
        default:
          break
      }
    } catch (error) {
      console.error(`Error loading ${tabId} content:`, error)
      showError(`Failed to load ${tabId} data`)
    } finally {
      setTabLoading(false)
    }
  }

  const loadMyJobs = async () => {
    try {
      console.log('Loading my jobs from API');
      // Use apiService to get jobs from backend
      const jobs = await apiService.getMyJobs();
      
      if (Array.isArray(jobs)) {
        console.log(`Loaded ${jobs.length} jobs`);
        setMyJobs(jobs);
      } else {
        console.error('Unexpected response format:', jobs);
        setMyJobs([]);
        showError('Received invalid data from server');
      }
    } catch (error) {
      console.error('Error loading my jobs:', error);
      showError('Error loading your jobs: ' + (error.message || 'Unknown error'));
      setMyJobs([]); // Set to empty array on error to avoid undefined issues
    }
  }

  const loadApplications = async () => {
    try {
      // Use apiService instead of direct fetch
      const apps = await apiService.getMyApplicationsReceived();
      console.log('📋 Loaded applications:', apps);
      if (apps.length > 0 && apps[0].applicants?.length > 0) {
        console.log('👤 Sample applicant structure:', apps[0].applicants[0]);
      }
      setApplications(apps);
    } catch (error) {
      console.error('Error loading applications:', error);
      showError('Error loading applications');
    }
  }

  const loadWorkers = async () => {
    try {
      // Use apiService instead of direct fetch
      const data = await apiService.getWorkers();
      if (data && data.users) {
        const workersData = data.users;
        console.log("Loading ratings for", workersData.length, "workers...");
        
        // Get ratings for each worker
        const workersWithRatings = await Promise.all(
          workersData.map(async (worker) => {
            try {
              const ratingsResponse = await apiService.getUserRatings(worker._id);
              const avgRating = ratingsResponse.averageRating || 
                               (ratingsResponse.ratings && ratingsResponse.ratings.length > 0 
                                ? ratingsResponse.ratings.reduce((sum, r) => sum + r.rating, 0) / ratingsResponse.ratings.length
                                : null);
              
              return {
                ...worker,
                avgRating: avgRating,
                ratingCount: ratingsResponse.ratings ? ratingsResponse.ratings.length : 0
              };
            } catch (err) {
              console.log(`Could not fetch ratings for worker ${worker._id}:`, err);
              return worker;
            }
          })
        );
        
        setWorkers(workersWithRatings);
      } else {
        setWorkers([]);
      }
    } catch (error) {
      console.error('Error loading workers:', error);
      setWorkers([]); // Graceful fallback
    }
  }
  
  // State for worker ratings
  const [workerRatings, setWorkerRatings] = useState([]);
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState('profile');
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [reportModal, setReportModal] = useState({ isOpen: false, userId: null, userName: '' });
  
  // View worker profile function
  const viewWorkerProfile = async (worker) => {
    try {
      setLoading(true);
      setWorkerRatings([]);
      setActiveProfileTab('profile');
      
      // Get detailed worker profile and ratings in parallel
      const [profile, ratingsResponse] = await Promise.all([
        apiService.getProfile(worker._id),
        apiService.getUserRatings(worker._id).catch(err => {
          console.error('Error loading ratings:', err);
          return { ratings: [] };
        })
      ]);
      
      setCurrentWorker(profile.user || worker);
      setWorkerRatings(ratingsResponse.ratings || []);
      setShowWorkerModal(true);
    } catch (error) {
      console.error('Error loading worker profile:', error);
      showError('Could not load worker profile');
    } finally {
      setLoading(false);
    }
  }
  
  // Contact worker function - opens contact modal
  const contactWorker = (worker) => {
    setCurrentWorker(worker);
    setContactMessage('');
    setShowContactModal(true);
  }
  
  // Send message function
  const sendMessage = async () => {
    if (!contactMessage.trim()) {
      showError(t('common.enterMessage'));
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientId: currentWorker._id,
          subject: 'Job Inquiry',
          content: contactMessage
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        success(t('employerDashboard.messageSent'));
        setShowContactModal(false);
        setContactMessage('');
      } else {
        showError(data.message || data.alert || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      showError('Failed to send message. Please try again.');
    }
  }
  
  // Report user functions
  const openReportModal = (worker) => {
    setReportModal({
      isOpen: true,
      userId: worker._id,
      userName: `${worker.firstName} ${worker.lastName}`
    });
  }

  const closeReportModal = () => {
    setReportModal({ isOpen: false, userId: null, userName: '' });
  }

  const handleReportSubmit = async (reason) => {
    try {
      await apiService.reportUser({
        reportedUserId: reportModal.userId,
        reason
      });
      success('Report submitted successfully');
      closeReportModal();
    } catch (error) {
      console.error('Error submitting report:', error);
      showError(error.message || 'Failed to submit report');
      throw error;
    }
  }
  
  // Function to open invite modal with the selected worker
  const openInviteModal = (worker) => {
    setCurrentWorker(worker);
    setShowInviteModal(true);
  }
  
  // Function to send job invitation
  const sendJobInvitation = async (jobId) => {
    if (!currentWorker || !currentWorker._id || !jobId) {
      showError('Missing information to send invitation');
      return;
    }
    
    // Find the selected job
    const selectedJob = myJobs.find(job => job._id === jobId);
    
    // Check if job is active/open before sending invitation
    if (selectedJob && selectedJob.isOpen === false) {
      showError('You can only invite workers to active jobs');
      return;
    }
    
    try {
      console.log('Sending job invitation with params:', {
        jobId,
        workerId: currentWorker._id,
        workerName: `${currentWorker.firstName} ${currentWorker.lastName}`
      });
      
      setLoading(true);
      // Use the new API method for invitations
      await apiService.inviteWorker(jobId, currentWorker._id);
      
      success(t('employerDashboard.inviteSuccess'));
      setShowInviteModal(false);
    } catch (error) {
      console.error('Error sending invitation:', error);
      // Show more specific error message
      if (error.message.includes('not found')) {
        showError(t('employerDashboard.inviteFailed'));
      } else if (error.message.includes('not authorized')) {
        showError(t('employerDashboard.inviteFailed'));
      } else {
        showError(t('employerDashboard.inviteFailed'));
      }
    } finally {
      setLoading(false);
    }
  }

  const handleTabChange = async (tabId) => {
    setCurrentTab(tabId)
    await loadTabContent(tabId)
  }

  const editJob = (job) => {
    // Ensure we have a valid job object
    if (!job || !job._id) {
      showError('Invalid job selection');
      return;
    }
    
    // Check if job is already completed
    if (job.completed) {
      showError('Completed jobs cannot be edited');
      return;
    }
    
    console.log('Opening edit modal for job:', job);
    
    setCurrentEditJob(job);
    setEditFormData({
      title: job.title || '',
      description: job.description || '',
      price: job.price || '',
      barangay: job.barangay || '',
      skillsRequired: Array.isArray(job.skillsRequired) ? [...job.skillsRequired] : []
    });
    setShowEditModal(true);
  }

  const openCompleteModal = (job) => {
    setJobToComplete(job);
    setShowPaymentModal(true);
  };

  // Handle successful payment completion
  const handlePaymentSuccess = async () => {
    success(t('employerDashboard.paymentSuccess'));
    setShowPaymentModal(false);
    setJobToComplete(null);
    
    // Refresh the jobs list and dashboard stats
    await loadMyJobs();
    await loadDashboardStats();
  };

  // Open delete confirmation modal
  const openDeleteModal = (job) => {
    setJobToDelete(job);
    setShowDeleteModal(true);
  };

  // Handle job deletion
  const deleteJob = async () => {
    if (!jobToDelete) return;
    
    try {
      setLoading(true);
      console.log('Deleting job with ID:', jobToDelete._id);
      
      // Use apiService to connect with backend
      const result = await apiService.deleteJob(jobToDelete._id);
      
      console.log('Delete job response:', result);
      
      // Remove job from local state immediately
      setMyJobs(prevJobs => prevJobs.filter(job => job._id !== jobToDelete._id));
      
      success(result.alert || t('employerDashboard.deleteSuccess'));
      
      // Refresh the dashboard stats
      await loadDashboardStats();
      
      // Close the modal
      setShowDeleteModal(false);
      setJobToDelete(null);
    } catch (error) {
      console.error('Error deleting job:', error);
      showError(error.message || t('employerDashboard.deleteFailed'));
    } finally {
      setLoading(false);
    }
  }
  
  const handleApplication = async (applicationId, action, jobId, userId) => {
    try {
      console.log(`handleApplication called with:`, {
        applicationId,
        action,
        jobId,
        userId
      })
      
      if (!userId) {
        console.error('Missing userId parameter in handleApplication');
        showError(`Failed to ${action} application: Missing user ID`);
        return;
      }

      let result;
      
      if (action === 'accept') {
        // Use apiService instead of direct fetch
        result = await apiService.assignWorker(jobId, userId);
      } else if (action === 'reject') {
        // Use apiService instead of direct fetch
        result = await apiService.rejectApplication(jobId, userId);
      }
      
      console.log(`Response for ${action}:`, result);
      
      success(action === 'accept' ? t('employerDashboard.acceptSuccess') : t('employerDashboard.rejectSuccess'));
      loadApplications();
      // Also reload the jobs to reflect changes
      loadMyJobs();
      loadDashboardStats();
    } catch (error) {
      console.error(`Error ${action}ing application:`, error);
      showError(action === 'accept' ? t('employerDashboard.acceptFailed') : t('employerDashboard.rejectFailed'));
    }
  }
  
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: name === 'price' ? parseFloat(value) || value : value
    });
  }
  
  const handleSkillInput = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const newSkill = e.target.value.trim();
      
      // Check if skill already exists
      if (editFormData.skillsRequired.includes(newSkill)) {
        // Indicate duplicate skill without showing a full error
        e.target.classList.add('input-error');
        setTimeout(() => {
          e.target.classList.remove('input-error');
        }, 1000);
        return;
      }
      
      // Limit number of skills
      if (editFormData.skillsRequired.length >= 10) {
        showError('You can add up to 10 skills maximum');
        return;
      }
      
      // Add the new skill
      setEditFormData({
        ...editFormData,
        skillsRequired: [...editFormData.skillsRequired, newSkill]
      });
      
      // Clear input
      e.target.value = '';
    }
  }
  
  const removeSkill = (skillToRemove) => {
    setEditFormData({
      ...editFormData,
      skillsRequired: editFormData.skillsRequired.filter(skill => skill !== skillToRemove)
    });
  }
  
  const handleSaveJob = async (e) => {
    e.preventDefault();
    
    if (!currentEditJob || !currentEditJob._id) {
      showError('Invalid job data');
      return;
    }
    
    // Form validation
    if (!editFormData.title || !editFormData.description || !editFormData.price || !editFormData.barangay) {
      showError('Please fill in all required fields');
      return;
    }
    
    // Price validation
    const price = parseFloat(editFormData.price);
    if (isNaN(price) || price <= 0) {
      showError('Please enter a valid price');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Saving job edit:', {
        jobId: currentEditJob._id,
        updates: editFormData
      });
      
      // Make API call to update job using apiService
      const result = await apiService.editJob(currentEditJob._id, {
        ...editFormData,
        price: parseFloat(editFormData.price)
      });
      
      success(result.alert || t('employerDashboard.editSuccess'));
      setShowEditModal(false);
      
      // Refresh the jobs list
      await loadMyJobs();
      await loadDashboardStats();
    } catch (error) {
      console.error('Error updating job:', error);
      showError(error.message || t('employerDashboard.editFailed'));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>{t('employerDashboard.loadingDashboard')}</p>
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
    )
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>{t('employerDashboard.title')}</h1>
        <p>Welcome back, {user?.firstName}!</p>
        <Link to="/landing" className="back-btn">Back to Landing</Link>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💼</div>
          <div className="stat-content">
            <h3>{stats.activeJobs}</h3>
            <p>{t('employerDashboard.activeJobs')}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>{stats.totalApplications}</h3>
            <p>{t('employerDashboard.totalApplications')}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.completedJobs}</h3>
            <p>{t('employerDashboard.completedJobs')}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>{stats.averageRating.toFixed(1)}</h3>
            <p>{t('employerDashboard.averageRating')}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <Link to="/post-job" className="action-btn primary">
          ➕ {t('employerDashboard.postNewJob')}
        </Link>
        <Link to="/search-workers" className="action-btn secondary">
          🔍 {t('employerDashboard.searchWorkers')}
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${currentTab === 'my-jobs' ? 'active' : ''}`}
          onClick={() => handleTabChange('my-jobs')}
        >
          {t('employerDashboard.myJobs')}
        </button>
        <button 
          className={`tab-btn ${currentTab === 'applications' ? 'active' : ''}`}
          onClick={() => handleTabChange('applications')}
        >
          {t('employerDashboard.applications')}
        </button>
        <button 
          className={`tab-btn ${currentTab === 'workers' ? 'active' : ''}`}
          onClick={() => handleTabChange('workers')}
        >
          {t('employerDashboard.workers')}
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {tabLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>{t('common.loading')}</p>
          </div>
        ) : (
          <>
            {/* My Jobs Tab */}
            {currentTab === 'my-jobs' && (
              <div className="jobs-container">
                {myJobs.length > 0 ? (
                  <>
                    {/* Active Jobs Section */}
                    <div className="jobs-section">
                      <h2 className="section-title">{t('employerDashboard.activeJobs')}</h2>
                      <div className="jobs-grid">
                        {myJobs.filter(job => job.status !== 'completed' && !job.completed).length > 0 ? (
                          myJobs.filter(job => job.status !== 'completed' && !job.completed).map(job => (
                            <div key={job._id} className="job-card">
                              <div className="job-header">
                                <h3>{job.title}</h3>
                                <div className="job-price">{formatPrice(job.price)}</div>
                              </div>
                              
                              <div className="job-meta">
                                <div className="meta-item">
                                  📍 {job.barangay}
                                </div>
                                <div className="meta-item">
                                  👥 {job.applicants ? job.applicants.length : 0} {t('employerDashboard.applicants')}
                                </div>
                                <div className="meta-item">
                                  <span className={`status ${job.isOpen !== false ? 'active' : 'closed'}`}>
                                    {job.isOpen !== false ? t('employerDashboard.open') : t('employerDashboard.closed')}
                                  </span>
                                </div>
                                {job.assignedTo && (
                                  <div className="meta-item">
                                    👤 {t('employerDashboard.assignedTo')}: {job.assignedTo.firstName} {job.assignedTo.lastName}
                                  </div>
                                )}
                              </div>
                              
                              <p className="job-description">
                                {job.description?.substring(0, 100)}
                                {job.description?.length > 100 ? '...' : ''}
                              </p>
                              
                              <div className="job-actions">
                                <button 
                                  className="btn secondary"
                                  onClick={() => editJob(job)}
                                >
                                  {t('employerDashboard.edit')}
                                </button>
                                {job.assignedTo && job.status !== 'completed' && !job.completed && (
                                  <button 
                                    className="btn success"
                                    onClick={() => openCompleteModal(job)}
                                  >
                                    {t('employerDashboard.complete')}
                                  </button>
                                )}
                                <button 
                                  className="btn danger"
                                  onClick={() => openDeleteModal(job)}
                                >
                                  {t('employerDashboard.delete')}
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="no-data">
                            <p>{t('employerDashboard.noJobsYet')}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Completed Jobs Section */}
                    <div className="jobs-section">
                      <h2 className="section-title">{t('employerDashboard.completedJobs')}</h2>
                      <div className="jobs-grid">
                        {myJobs.filter(job => job.status === 'completed' || job.completed).length > 0 ? (
                          myJobs.filter(job => job.status === 'completed' || job.completed).map(job => (
                            <div key={job._id} className="job-card completed">
                              <div className="job-header">
                                <h3>{job.title}</h3>
                                <div className="job-price">{formatPrice(job.price)}</div>
                              </div>
                              
                              <div className="job-meta">
                                <div className="meta-item">
                                  📍 {job.barangay}
                                </div>
                                <div className="meta-item">
                                  <span className="status completed">{t('employerDashboard.completed')}</span>
                                </div>
                                {job.assignedTo && (
                                  <div className="meta-item">
                                    👤 <Link 
                                      to={`/profile/${job.assignedTo._id}`}
                                      className="employee-link"
                                    >
                                      {job.assignedTo.firstName} {job.assignedTo.lastName}
                                    </Link>
                                  </div>
                                )}
                              </div>
                              
                              <p className="job-description">
                                {job.description?.substring(0, 100)}
                                {job.description?.length > 100 ? '...' : ''}
                              </p>
                              
                              <div className="job-actions">
                                <button 
                                  className="btn danger"
                                  onClick={() => openDeleteModal(job)}
                                >
                                  {t('employerDashboard.delete')}
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="no-data">
                            <p>{t('employerDashboard.noJobsYet')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="no-data">
                    <p>{t('employerDashboard.noJobsYet')}</p>
                    <Link to="/post-job" className="btn primary">{t('employerDashboard.startPosting')}</Link>
                  </div>
                )}
              </div>
            )}

            {/* Applications Tab */}
            {currentTab === 'applications' && (
              <div className="applications-grid">
                {applications.length > 0 ? (
                  applications.map(job => (
                    <div key={job._id} className="application-section">
                      <h3 className="job-title">{job.title}</h3>
                      <div className="applicants-list">
                        {job.applicants?.map(app => (
                          <div key={app._id} className="applicant-card">
                            <div className="applicant-info">
                              <h4>{app.user?.firstName} {app.user?.lastName}</h4>
                              <p>{app.user?.email}</p>
                              <span className={`status ${app.status}`}>
                                {app.status === 'pending' ? t('employerDashboard.pending') : 
                                 app.status === 'accepted' ? t('employerDashboard.accepted') : 
                                 app.status === 'rejected' ? t('employerDashboard.rejected') : 
                                 app.status || t('employerDashboard.pending')}
                              </span>
                            </div>
                            <div className="applicant-actions">
                              {app.status === 'pending' && (
                                <>
                                  <button 
                                    className="btn primary"
                                    onClick={() => handleApplication(app._id, 'accept', job._id, app.user?._id || app.userId)}
                                    disabled={!app.user?._id && !app.userId}
                                  >
                                    {t('employerDashboard.accept')}
                                  </button>
                                  <button 
                                    className="btn danger"
                                    onClick={() => handleApplication(app._id, 'reject', job._id, app.user?._id || app.userId)}
                                    disabled={!app.user?._id && !app.userId}
                                  >
                                    {t('employerDashboard.reject')}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )) || []}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-data">
                    <p>{t('employerDashboard.noApplications')}</p>
                  </div>
                )}
              </div>
            )}

            {/* Workers Tab */}
            {currentTab === 'workers' && (
              <div className="workers-grid">
                {workers.length > 0 ? (
                  workers.map(worker => (
                    <div key={worker._id} className="worker-card">
                      <div className="worker-header">
                        <div className="worker-header-left">
                          <div className="worker-card-avatar">
                            {getProfilePictureUrl(worker) ? (
                              <img src={getProfilePictureUrl(worker)} alt={`${worker.firstName} ${worker.lastName}`} />
                            ) : (
                              <div className="avatar-placeholder">
                                {worker.firstName?.[0]}{worker.lastName?.[0]}
                              </div>
                            )}
                          </div>
                          <div className="worker-header-info">
                            <h3>{worker.firstName} {worker.lastName}</h3>
                            <div className="worker-rating">
                              <span className="star-icon">★</span>
                              {worker.avgRating ? worker.avgRating.toFixed(1) : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="worker-info">
                        <p>{worker.bio || t('employerDashboard.noDescription')}</p>
                        <div className="worker-skills">
                          {worker.skills?.map((skill, index) => (
                            <span key={index} className="skill-tag">{skill}</span>
                          )) || []}
                        </div>
                      </div>
                      
                      <div className="worker-actions">
                        <button 
                          className="btn primary" 
                          onClick={() => contactWorker(worker)}
                          aria-label={`Contact ${worker.firstName}`}
                        >
                          {t('employerDashboard.message')}
                        </button>
                        <Link 
                          to={`/profile/${worker._id}`}
                          className="btn secondary" 
                          aria-label={`View ${worker.firstName}'s profile`}
                        >
                          {t('employerDashboard.viewProfile')}
                        </Link>
                        <button 
                          className="btn accent" 
                          onClick={() => openInviteModal(worker)}
                          aria-label={`Invite ${worker.firstName} to job`}
                        >
                          {t('employerDashboard.inviteWorker')}
                        </button>
                        <button 
                          className="btn danger" 
                          onClick={() => openReportModal(worker)}
                          aria-label={`Report ${worker.firstName}`}
                        >
                          🚩 {t('employerDashboard.report')}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-data">
                    <p>{t('employerDashboard.noWorkersFound')}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Job Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('employerDashboard.editJobTitle')}</h2>
            </div>
            
            <form onSubmit={handleSaveJob} className="edit-job-form">
              <div className="form-group">
                <label htmlFor="title">{t('employerDashboard.jobTitle')} *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={editFormData.title}
                  onChange={handleEditFormChange}
                  required
                  placeholder="e.g., House Cleaning, Plumbing Repair"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">{t('employerDashboard.description')} *</label>
                <textarea
                  id="description"
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditFormChange}
                  required
                  rows="4"
                  placeholder="Describe the job in detail..."
                ></textarea>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="price">{t('employerDashboard.price')} (₱) *</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={editFormData.price}
                    onChange={handleEditFormChange}
                    required
                    min="1"
                    step="1"
                    placeholder="e.g., 500"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="barangay">{t('employerDashboard.barangay')} *</label>
                  <input
                    type="text"
                    id="barangay"
                    name="barangay"
                    value={editFormData.barangay}
                    onChange={handleEditFormChange}
                    required
                    placeholder="e.g., San Antonio"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{t('employerDashboard.requiredSkills')}</label>
                <div className="skills-input">
                  <div className="skills-input-container">
                    <input
                      type="text"
                      id="skillInput"
                      placeholder="Type skill and press Enter or Add"
                      onKeyDown={handleSkillInput}
                    />
                    <button 
                      type="button" 
                      className="add-skill-btn"
                      onClick={() => {
                        const input = document.getElementById('skillInput');
                        if (input && input.value.trim()) {
                          const newSkill = input.value.trim();
                          
                          // Check if skill already exists
                          if (editFormData.skillsRequired.includes(newSkill)) {
                            input.classList.add('input-error');
                            setTimeout(() => {
                              input.classList.remove('input-error');
                            }, 1000);
                            return;
                          }
                          
                          // Limit number of skills
                          if (editFormData.skillsRequired.length >= 10) {
                            showError('You can add up to 10 skills maximum');
                            return;
                          }
                          
                          setEditFormData({
                            ...editFormData,
                            skillsRequired: [...editFormData.skillsRequired, newSkill]
                          });
                          input.value = '';
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                  <div className="skills-tags">
                    {editFormData.skillsRequired && editFormData.skillsRequired.map((skill, index) => (
                      <div key={index} className="skill-tag">
                        {skill}
                        <button 
                          type="button" 
                          className="remove-skill"
                          onClick={() => removeSkill(skill)}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                  {editFormData.skillsRequired && editFormData.skillsRequired.length > 0 && (
                    <small className="skill-count">{editFormData.skillsRequired.length} of 10 skills added</small>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn secondary" 
                  onClick={() => setShowEditModal(false)}
                >
                  {t('employerDashboard.cancel')}
                </button>
                <button 
                  type="submit" 
                  className="btn primary" 
                >
                  {t('employerDashboard.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

  <style>{`
        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 1rem;
        }
        
        .modal-content {
          background-color: white;
          border-radius: 12px;
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          padding: 2rem;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .modal-title-with-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .modal-header h2 {
          margin: 0;
          color: #2b6cb0;
        }
        
        .modal-close, .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #718096;
          cursor: pointer;
        }
        
        .modal-close:hover, .close-button:hover {
          color: #2b6cb0;
        }
        
        .edit-job-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        
        .skills-input {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .skills-input-container {
          display: flex;
          gap: 0.5rem;
        }
        
        .skills-input-container input {
          flex: 1;
        }
        
        .skills-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        
        .add-skill-btn {
          background: #2b6cb0;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          white-space: nowrap;
        }
        
        .add-skill-btn:hover {
          background: #2c5282;
        }
        
        .input-error {
          border-color: #e53e3e !important;
          animation: shake 0.5s;
        }
        
        .skill-count {
          color: #718096;
          font-size: 0.8rem;
          margin-top: 0.5rem;
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .skill-tag {
          background: #e2e8f0;
          color: #2d3748;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        
        .remove-skill {
          background: none;
          border: none;
          color: #4a5568;
          cursor: pointer;
          font-size: 1rem;
          padding: 0 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }
        
        .remove-skill:hover {
          color: #e53e3e;
        }
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
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          padding: 0.85rem 1.75rem;
          border-radius: 10px;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.95rem;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          white-space: nowrap;
          flex: 1 1 0;
          min-width: 200px;
        }
        
        .action-btn .icon {
          font-size: 1.2rem;
        }

        .action-btn.primary {
          background: linear-gradient(135deg, #2b6cb0 0%, #2c5282 100%);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .action-btn.primary:hover {
          background: linear-gradient(135deg, #2c5282 0%, #1e3a5f 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(43, 108, 176, 0.3);
        }

        .action-btn.secondary {
          background: linear-gradient(135deg, #f7fafc 0%, #e2e8f0 100%);
          color: #2d3748;
          border: 1px solid #cbd5e0;
        }

        .action-btn.secondary:hover {
          background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        @media (max-width: 768px) {
          .quick-actions {
            flex-direction: column;
          }
          
          .action-btn {
            max-width: 100%;
          }
        }

        .tab-navigation {
          background: white;
          border-radius: 12px 12px 0 0;
          display: flex;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
          border-bottom: none;
          overflow: hidden;
          width: 100%;
        }

        .tab-btn {
          flex: 1;
          padding: 1.1rem 1rem;
          border: none;
          background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
          color: #475569;
          cursor: pointer;
          font-size: 0.95rem;
          transition: all 0.3s ease;
          border-bottom: 3px solid transparent;
          font-weight: 600;
          position: relative;
          white-space: normal;
          word-wrap: break-word;
          overflow: hidden;
          text-align: center;
          line-height: 1.3;
          min-width: 0;
        }
        
        .tab-btn::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #2b6cb0 0%, #3b82f6 100%);
          transform: scaleX(0);
          transition: transform 0.3s ease;
        }

        .tab-btn:first-child {
          border-radius: 12px 0 0 0;
        }

        .tab-btn:last-child {
          border-radius: 0 12px 0 0;
        }

        .tab-btn.active {
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          color: #2b6cb0;
          font-weight: 700;
        }
        
        .tab-btn.active::before {
          transform: scaleX(1);
        }

        .tab-btn:not(.active):hover {
          background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
          color: #2b6cb0;
        }
        
        @media (max-width: 768px) {
          .tab-btn {
            padding: 1rem 0.5rem;
            font-size: 0.85rem;
          }
        }
        
        @media (max-width: 480px) {
          .tab-btn {
            padding: 0.9rem 0.4rem;
            font-size: 0.8rem;
          }
        }

        .tab-content {
          background: white;
          border-radius: 0 0 12px 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          padding: 2rem;
          min-height: 400px;
        }

        .jobs-grid, .workers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .jobs-container {
          display: flex;
          flex-direction: column;
          gap: 3rem;
        }

        .jobs-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .section-title {
          color: #2d3748;
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0;
          padding-bottom: 0.5rem;
          border-bottom: 3px solid #9333ea;
          display: inline-block;
        }

        .job-card.completed {
          background: #f8f9fa;
          border-color: #d1ecf1;
        }

        .employee-link {
          color: #9333ea;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }

        .employee-link:hover {
          color: #7c3aed;
          text-decoration: underline;
        }

        .applications-grid {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .job-card, .worker-card {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.5rem;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .job-card:hover, .worker-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
          border-color: rgba(59, 130, 246, 0.3);
        }
        
        .worker-card {
          min-height: 360px;
        }

        .job-header, .worker-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .worker-header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
        }

        .worker-card-avatar {
          width: 60px;
          height: 60px;
          min-width: 60px;
          min-height: 60px;
          max-width: 60px;
          max-height: 60px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .worker-card-avatar img {
          width: 100%;
          height: 100%;
          max-width: 60px;
          max-height: 60px;
          object-fit: cover;
          object-position: center;
        }

        .worker-card-avatar .avatar-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.5rem;
          font-weight: bold;
          text-transform: uppercase;
        }

        .worker-header-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .worker-header-info h3 {
          margin: 0;
          color: #2b6cb0;
          font-size: 1.15rem;
          font-weight: 600;
        }

        .job-header h3, .worker-header h3 {
          margin: 0;
          color: #2b6cb0;
          font-size: 1.1rem;
          flex: 1;
        }

        .job-price {
          background: #38a169;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 15px;
          font-weight: bold;
          font-size: 0.9rem;
        }

        .worker-rating {
          background: linear-gradient(135deg, #ffd700 0%, #ffb700 100%);
          color: #1a1a1a;
          padding: 0.4rem 0.9rem;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.95rem;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          box-shadow: 0 2px 8px rgba(255, 193, 7, 0.3);
          border: 1px solid rgba(255, 193, 7, 0.4);
          width: fit-content;
        }
        
        .worker-rating .star-icon {
          color: #1a1a1a;
          font-size: 1.1rem;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
        }

        .job-meta, .worker-info {
          margin-bottom: 1rem;
        }

        .meta-item {
          display: flex;
          align-items: center;
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        .meta-item .icon {
          margin-right: 0.4rem;
          font-size: 1.1rem;
        }

        .status {
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .status.active {
          background: #e6fffa;
          color: #00695c;
        }

        .status.closed {
          background: #fed7d7;
          color: #c53030;
        }
        
        .status.completed {
          background: #d1ecf1;
          color: #0c5460;
        }

        .status.pending {
          background: #fef7e5;
          color: #b7791f;
        }

        .status.accepted {
          background: #e6fffa;
          color: #00695c;
        }

        .status.rejected {
          background: #fed7d7;
          color: #c53030;
        }

        .job-description {
          color: #4a5568;
          margin-bottom: 1rem;
          line-height: 1.5;
          font-size: 0.9rem;
        }

        .job-actions, .worker-actions, .applicant-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
        }

        .btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background-color 0.2s;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 100px;
          height: 38px;
          text-align: center;
        }

        .btn.primary {
          background: #2b6cb0;
          color: white;
        }

        .btn.primary:hover {
          background: #2c5282;
        }

        .btn.secondary {
          background: #e2e8f0;
          color: #2d3748;
        }

        .btn.secondary:hover {
          background: #cbd5e0;
        }

        .btn.danger {
          background: #e53e3e;
          color: white;
        }

        .btn.danger:hover {
          background: #c53030;
        }
        
        .btn.success {
          background: #38a169;
          color: white;
        }
        
        .btn.success:hover {
          background: #2f855a;
        }
        
        .btn.accent {
          background: #8b5cf6;
          color: white;
        }
        
        .btn.accent:hover {
          background: #7c3aed;
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

        .application-section {
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 1.5rem;
        }

        .job-title {
          margin: 0 0 1rem 0;
          color: #2b6cb0;
          font-size: 1.2rem;
        }

        .applicants-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .applicant-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: #f7fafc;
          border-radius: 8px;
        }

        .applicant-info h4 {
          margin: 0;
          color: #2d3748;
        }

        .applicant-info p {
          margin: 0.25rem 0;
          color: #666;
          font-size: 0.9rem;
        }

        .worker-skills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .worker-info {
          flex: 1;
          margin-bottom: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }
        
        .worker-info p {
          color: #4a5568;
          font-size: 0.9rem;
          line-height: 1.5;
          margin: 0;
        }
        
        .worker-skills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .worker-card .worker-actions {
          margin-top: auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.6rem;
          padding-top: 0.5rem;
        }

        .worker-card .worker-actions .btn {
          width: 100%;
          padding: 0.6rem 0.8rem;
          font-weight: 500;
          font-size: 0.85rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .worker-card .worker-actions .btn.accent {
          grid-column: 1 / -1;
        }
        
        .worker-card .worker-actions .btn.danger {
          grid-column: 1 / -1;
        }
        
        @media (max-width: 768px) {
          .worker-card .worker-actions {
            grid-template-columns: 1fr;
          }
          
          .worker-card .worker-actions .btn {
            font-size: 0.9rem;
          }
        }

        .skill-tag {
          background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%);
          color: #2d3748;
          padding: 0.35rem 0.75rem;
          border-radius: 16px;
          font-size: 0.8rem;
          font-weight: 500;
          border: 1px solid rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease;
        }
        
        .skill-tag:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
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

        .no-data {
          text-align: center;
          padding: 2rem;
          color: #666;
        }

        .no-data p {
          margin-bottom: 1rem;
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

          .tab-navigation {
            flex-direction: column;
          }

          .tab-btn {
            border-radius: 0;
          }

          .tab-btn:first-child {
            border-radius: 12px 12px 0 0;
          }

          .tab-btn:last-child {
            border-radius: 0;
          }

          .jobs-grid, .workers-grid {
            grid-template-columns: 1fr;
          }

          .applicant-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
        }

        /* Worker Profile Modal Styles */
        .worker-profile-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .worker-profile-avatar {
          width: 80px;
          height: 80px;
          min-width: 80px;
          min-height: 80px;
          max-width: 80px;
          max-height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4c1d95, #6d28d9);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: bold;
          overflow: hidden;
          flex-shrink: 0;
        }

        .worker-profile-avatar img {
          width: 100%;
          height: 100%;
          max-width: 80px;
          max-height: 80px;
          object-fit: cover;
          object-position: center;
        }

        .worker-profile-info h3 {
          margin: 0;
          font-size: 1.5rem;
        }

        .worker-profile-contact {
          margin: 1.5rem 0;
          padding: 1rem;
          background: #f0f9ff;
          border-radius: 8px;
          border-left: 3px solid #3b82f6;
        }

        .worker-profile-details {
          margin-top: 1.5rem;
        }

        .worker-profile-section {
          margin-bottom: 1.5rem;
        }

        .worker-profile-section h4 {
          margin-bottom: 0.5rem;
          color: #1e40af;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 0.5rem;
        }
        
        /* Worker Profile Tabs */
        .worker-profile-tabs {
          margin-top: 1.5rem;
        }
        
        .tab-nav {
          display: flex;
          border-bottom: 2px solid #e2e8f0;
          margin-bottom: 1.5rem;
        }
        
        .tab-nav .tab-btn {
          padding: 0.75rem 1.5rem;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          margin-bottom: -2px;
          font-size: 1rem;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .tab-nav .tab-btn.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }
        
        .tab-nav .tab-btn:hover:not(.active) {
          color: #0f172a;
        }
        
        .worker-profile-tabs .tab-content {
          display: none;
        }
        
        .worker-profile-tabs .tab-content.active {
          display: block;
          animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        /* Ratings */
        .ratings-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .ratings-summary {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 10px;
        }
        
        .ratings-score {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }
        
        .big-score {
          font-size: 2.5rem;
          font-weight: bold;
          color: #2d3748;
        }
        
        .big-stars {
          font-size: 1.5rem;
          color: #cbd5e0;
        }
        
        .big-stars .star.filled {
          color: #f59e0b;
        }
        
        .rating-count {
          font-size: 0.9rem;
          color: #64748b;
        }
        
        .ratings-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-height: 400px;
          overflow-y: auto;
        }
        
        .rating-card {
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: white;
        }
        
        .rating-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }
        
        .rater-info {
          display: flex;
          flex-direction: column;
        }
        
        .rater-name {
          font-weight: 500;
          color: #2d3748;
        }
        
        .rating-date {
          font-size: 0.8rem;
          color: #94a3b8;
        }
        
        .rating-stars {
          color: #f59e0b;
          font-size: 1.1rem;
        }
        
        .rating-stars .star:not(.filled) {
          color: #cbd5e0;
        }
        
        .rating-comment {
          font-size: 0.95rem;
          color: #4a5568;
          line-height: 1.5;
          margin-bottom: 0.75rem;
        }
        
        .rating-job {
          font-size: 0.85rem;
          color: #64748b;
          padding-top: 0.5rem;
          border-top: 1px dashed #e2e8f0;
        }
        
        .job-label {
          font-weight: 500;
        }
        
        .job-title {
          color: #2d3748;
        }
        
        .no-ratings {
          text-align: center;
          padding: 2rem;
          color: #64748b;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px dashed #e2e8f0;
        }
        
        .worker-rating {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0.25rem 0;
        }
        
        .stars {
          color: #f59e0b;
          font-size: 1rem;
        }
        
        .star {
          color: #cbd5e0;
        }
        
        .star.filled {
          color: #f59e0b;
        }
        
        .rating-score {
          font-weight: bold;
          color: #2d3748;
        }
        
        /* Modal Footer Styles */
        .modal-footer {
          display: flex;
          gap: 12px;
          padding: 20px 24px;
          border-top: 1px solid #eee;
          background: #f9fafb;
          border-radius: 0 0 16px 16px;
        }

        .modal-footer .btn {
          flex: 1;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .modal-footer .btn.primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .modal-footer .btn.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }

        .modal-footer .btn.accent {
          background: #8b5cf6;
          color: white;
        }

        .modal-footer .btn.accent:hover {
          background: #7c3aed;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }

        .modal-footer .btn.secondary {
          background: white;
          color: #666;
          border: 2px solid #ddd;
        }

        .modal-footer .btn.secondary:hover {
          background: #f5f5f5;
          border-color: #999;
        }
        
        /* Contact Modal Styles */
        .contact-modal .modal-body {
          padding: 0;
        }
        
        .contact-info-section {
          padding: 1.5rem;
          background: linear-gradient(to bottom, #f0f9ff, #ffffff);
          border-radius: 8px 8px 0 0;
        }
        
        .contact-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .contact-avatar {
          width: 70px;
          height: 70px;
          min-width: 70px;
          min-height: 70px;
          max-width: 70px;
          max-height: 70px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4c1d95, #6d28d9);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          font-weight: bold;
          border: 3px solid white;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          overflow: hidden;
          flex-shrink: 0;
        }
        
        .contact-avatar img {
          width: 100%;
          height: 100%;
          max-width: 70px;
          max-height: 70px;
          object-fit: cover;
          object-position: center;
        }
        
        .contact-details {
          flex: 1;
        }
        
        .contact-details h3 {
          margin: 0 0 0.75rem 0;
          font-size: 1.5rem;
        }

        .worker-email,
        .worker-phone,
        .worker-skills {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0.5rem 0;
          color: #4a5568;
          font-size: 0.95rem;
        }

        .worker-email {
          color: #2b6cb0;
          font-weight: 500;
        }
        
        .contact-number, .contact-email {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0.25rem 0;
          color: #4a5568;
          font-size: 0.95rem;
        }
        
        .contact-icon {
          font-size: 1.1rem;
        }
        
        .contact-methods {
          background: #f8fafc;
          border-radius: 8px;
          padding: 1.25rem;
          margin-top: 1rem;
          border: 1px solid #e2e8f0;
        }
        
        .contact-method-header {
          margin-bottom: 1rem;
        }
        
        .contact-method-header h4 {
          margin: 0 0 0.25rem 0;
          color: #2d3748;
        }
        
        .contact-method-header p {
          margin: 0;
          font-size: 0.9rem;
          color: #64748b;
        }
        
        .contact-method-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 0.75rem;
        }
        
        .contact-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          color: inherit;
          background: white;
        }
        
        .contact-option:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        
        .option-icon {
          font-size: 1.8rem;
          margin-bottom: 0.5rem;
        }
        
        .option-label {
          font-size: 0.9rem;
          font-weight: 500;
          color: #2d3748;
        }
        
        .contact-option.call:hover {
          background: #ebf8ff;
          border-color: #63b3ed;
        }
        
        .contact-option.sms:hover {
          background: #e6fffa;
          border-color: #38b2ac;
        }
        
        .contact-option.email:hover {
          background: #faf5ff;
          border-color: #9f7aea;
        }
        
        .contact-option.message:hover {
          background: #f0fff4;
          border-color: #68d391;
        }
        
        .message-section {
          padding: 1.5rem;
          border-top: 1px solid #e2e8f0;
        }
        
        .message-section h4 {
          margin: 0 0 0.25rem 0;
          color: #2d3748;
        }
        
        .message-info {
          margin: 0 0 1rem 0;
          font-size: 0.9rem;
          color: #64748b;
        }
        
        .direct-message-link {
          margin: 1rem 0;
        }
        
        .chat-link-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.95rem;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(147, 51, 234, 0.3);
        }
        
        .chat-link-btn:hover {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          box-shadow: 0 4px 12px rgba(147, 51, 234, 0.4);
          transform: translateY(-1px);
        }
        
        .divider-text {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 1.5rem 0 1rem 0;
        }
        
        .divider-text::before,
        .divider-text::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .divider-text span {
          padding: 0 1rem;
          color: #94a3b8;
          font-size: 0.85rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .message-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .message-textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          resize: vertical;
          font-family: inherit;
          font-size: 0.95rem;
          transition: border-color 0.2s;
        }
        
        .message-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }
        
        .message-actions {
          display: flex;
          justify-content: flex-end;
        }
        
        @media (max-width: 640px) {
          .contact-method-options {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .job-invite-list {
          max-height: 300px;
          overflow-y: auto;
          display: grid;
          gap: 0.75rem;
          margin: 1rem 0;
        }

        .job-invite-item {
          padding: 1rem;
          border-radius: 10px;
          border: 2px solid #e2e8f0;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          position: relative;
          overflow: hidden;
          background-color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .job-invite-item-content {
          flex: 1;
        }
        
        .job-header-with-status {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        
        .job-status-indicator {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: inline-flex;
          align-items: center;
        }
        
        .job-status-indicator.active {
          background-color: #c6f6d5;
          color: #22543d;
          border: 1px solid #9ae6b4;
        }
        
        .job-status-indicator.completed {
          background-color: #bee3f8;
          color: #2a4365;
          border: 1px solid #90cdf4;
        }
        
        .job-status-indicator.closed {
          background-color: #fed7d7;
          color: #822727;
          border: 1px solid #feb2b2;
        }
        
        /* Job Status Badge Styling - For use in other contexts */
        .job-status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: inline-flex;
          align-items: center;
          margin-left: 10px;
        }
        
        .job-status-badge.active {
          background-color: #c6f6d5;
          color: #22543d;
          border: 1px solid #9ae6b4;
        }
        
        .job-status-badge.completed {
          background-color: #bee3f8;
          color: #2a4365;
          border: 1px solid #90cdf4;
        }
        
        .job-status-badge.closed {
          background-color: #fed7d7;
          color: #822727;
          border: 1px solid #feb2b2;
        }

        .job-invite-item:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .job-invite-item.selected {
          background: #e0f2fe;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4);
        }
        
        .job-invite-item.job-inactive {
          opacity: 0.7;
          cursor: not-allowed;
          position: relative;
        }
        
        .job-invite-item.job-inactive:hover {
          transform: none;
          box-shadow: none;
          background: #f1f5f9;
        }
        
        .job-invite-item.job-inactive:after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: repeating-linear-gradient(
            -45deg,
            rgba(0, 0, 0, 0.05),
            rgba(0, 0, 0, 0.05) 10px,
            transparent 10px,
            transparent 20px
          );
          border-radius: 8px;
          pointer-events: none;
        }
        
        .selected-indicator {
          background: #3b82f6;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: 10px;
          flex-shrink: 0;
        }
        
        .checkmark {
          color: white;
          font-size: 0.9rem;
          font-weight: bold;
        }
        
        .job-description-preview {
          margin: 0.5rem 0;
          font-size: 0.85rem;
          color: #4a5568;
          line-height: 1.4;
        }
        
        .job-invite-details {
          display: flex;
          justify-content: space-between;
          margin-top: 0.5rem;
          align-items: center;
        }
        
        .job-invite-item h4 {
          margin: 0;
          color: #2d3748;
          font-size: 1.1rem;
        }
        
        .job-price {
          margin: 0;
          color: #38a169;
          font-weight: bold;
          font-size: 1.1rem;
          background-color: #f0fff4;
          padding: 0.2rem 0.5rem;
          border-radius: 6px;
          border: 1px solid #c6f6d5;
          display: inline-block;
        }
        
        .job-location {
          margin: 0;
          color: #718096;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.9rem;
        }
        
        .location-icon {
          font-size: 0.9rem;
        }
        
        .skill-tag-small {
          background: #e2e8f0;
          color: #2d3748;
          padding: 0.15rem 0.4rem;
          border-radius: 12px;
          font-size: 0.75rem;
          margin-right: 0.3rem;
          display: inline-block;
        }
        
        .skill-tag-more {
          font-size: 0.75rem;
          color: #718096;
        }
        
        .job-skills-preview {
          margin-top: 0.7rem;
        }
        
        .invite-worker-info {
          display: flex;
          align-items: center;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 10px;
          margin-bottom: 1rem;
          border-left: 4px solid #3b82f6;
        }
        
        .worker-avatar {
          width: 60px;
          height: 60px;
          min-width: 60px;
          min-height: 60px;
          max-width: 60px;
          max-height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4c1d95, #6d28d9);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: bold;
          margin-right: 1rem;
          flex-shrink: 0;
          overflow: hidden;
        }
        
        .worker-avatar img {
          width: 100%;
          height: 100%;
          max-width: 60px;
          max-height: 60px;
          object-fit: cover;
          object-position: center;
        }
        
        .worker-details {
          flex: 1;
        }
        
        .worker-details h3 {
          margin: 0 0 0.3rem 0;
          color: #2d3748;
        }
        
        .worker-skills-preview {
          color: #64748b;
          font-size: 0.9rem;
          margin: 0;
        }
        
        .invitation-instruction {
          margin-bottom: 0.5rem;
        }
        
        .invitation-instruction p {
          font-weight: 500;
          color: #4a5568;
        }
        
        .no-jobs-message {
          text-align: center;
          padding: 2rem;
          background: #f0fff4;
          border-radius: 10px;
          border: 2px dashed #9ae6b4;
          box-shadow: inset 0 0 20px rgba(104, 211, 145, 0.1);
        }
        
        .no-jobs-message .icon {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          color: #38a169;
        }
        
        .no-jobs-message h3 {
          margin: 0.5rem 0;
          color: #276749;
          font-size: 1.3rem;
        }
        
        .no-jobs-message p {
          margin-bottom: 1.5rem;
          color: #2f855a;
          font-size: 0.95rem;
        }
        
        .no-jobs-info {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          text-align: left;
          background: rgba(255, 255, 255, 0.8);
          padding: 1rem;
          border-radius: 8px;
        }
        
        .info-item {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }
        
        .info-icon {
          font-size: 1.1rem;
          flex-shrink: 0;
        }
        
        .info-text {
          font-size: 0.9rem;
          color: #2d3748;
          line-height: 1.4;
        }
        
        .no-jobs-actions {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-top: 1rem;
        }
        
        .spinner-inline {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 1s ease-in-out infinite;
        }

        /* Complete Job Modal Styles */
        .complete-job-info {
          background: #f7fafc;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .complete-job-info h4 {
          margin: 0 0 0.5rem 0;
          color: #2b6cb0;
        }

        .worker-info {
          margin: 0.5rem 0;
          color: #4a5568;
        }

        .job-price-info {
          margin: 0.5rem 0;
          color: #2f855a;
          font-weight: 600;
        }

        .rating-section {
          margin-bottom: 1.5rem;
        }

        .rating-label {
          display: block;
          margin-bottom: 1rem;
          font-weight: 600;
          color: #2d3748;
        }

        .star-rating {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .star {
          background: none;
          border: none;
          font-size: 2.5rem;
          color: #cbd5e0;
          cursor: pointer;
          transition: all 0.2s;
          padding: 0;
        }

        .star:hover,
        .star.filled {
          color: #f6ad55;
          transform: scale(1.1);
        }

        .rating-description {
          color: #718096;
          font-size: 0.9rem;
          margin: 0.5rem 0;
          min-height: 20px;
        }

        .complete-note {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: #ebf8ff;
          border-radius: 8px;
          margin-top: 1rem;
        }

        .complete-note .note-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .complete-note .note-text {
          font-size: 0.9rem;
          color: #2c5282;
          line-height: 1.4;
        }

        .char-count {
          display: block;
          text-align: right;
          color: #718096;
          font-size: 0.85rem;
          margin-top: 0.25rem;
        }

        .field-description {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0.25rem 0 0.5rem 0;
        }

        .file-input {
          display: block;
          width: 100%;
          padding: 0.75rem;
          border: 2px dashed #cbd5e0;
          border-radius: 8px;
          background: #f7fafc;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .file-input:hover {
          border-color: #7c3aed;
          background: #faf5ff;
        }

        .payment-proof-preview {
          margin-top: 1rem;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }

        .payment-proof-preview img {
          width: 100%;
          max-height: 300px;
          object-fit: contain;
          background: #f7fafc;
        }

        .file-selected {
          margin-top: 0.5rem;
          padding: 0.75rem;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          border-radius: 8px;
          color: #065f46;
          font-size: 0.875rem;
        }
      `}</style>

      {/* Worker Profile Modal */}
      {showWorkerModal && currentWorker && (
        <div className="modal-overlay" onClick={() => setShowWorkerModal(false)}>
          <div className="modal-content worker-profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('employerDashboard.workerProfile')}</h2>
            </div>
            
            <div className="modal-body">
              <div className="worker-profile-header">
                <div className="worker-profile-avatar">
                  {getProfilePictureUrl(currentWorker) ? (
                    <img 
                      src={getProfilePictureUrl(currentWorker)} 
                      alt={`${currentWorker.firstName}'s profile`}
                      className="profile-image"
                    />
                  ) : (
                    currentWorker.firstName?.[0] || 'W'
                  )}
                </div>
                <div className="worker-profile-info">
                  <h3>{currentWorker.firstName} {currentWorker.lastName}</h3>
                  <div className="worker-rating">
                    <span className="stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span 
                          key={star} 
                          className={star <= (currentWorker.avgRating || 4.5) ? "star filled" : "star"}>
                          ★
                        </span>
                      ))}
                    </span>
                    <span className="rating-score">{(currentWorker.avgRating || 4.5).toFixed(1)}</span>
                  </div>
                  <p className="worker-location">
                    <span className="location-icon">📍</span> {currentWorker.barangay || t('employerDashboard.noDescription')}
                  </p>
                </div>
              </div>
              
              <div className="worker-profile-tabs">
                <div className="tab-nav">
                  <button 
                    className={`tab-btn ${activeProfileTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveProfileTab('profile')}
                  >
                    {t('employerDashboard.viewProfile')}
                  </button>
                  <button 
                    className={`tab-btn ${activeProfileTab === 'ratings' ? 'active' : ''}`}
                    onClick={() => setActiveProfileTab('ratings')}
                  >
                    {t('employerDashboard.rating')}
                  </button>
                </div>
                
                <div className={`tab-content ${activeProfileTab === 'profile' ? 'active' : ''}`}>
                  <div className="worker-profile-section">
                    <h4>{t('employerDashboard.about')}</h4>
                    <p>{currentWorker.bio || t('employerDashboard.noDescription')}</p>
                  </div>
                  
                  <div className="worker-profile-section">
                    <h4>{t('employerDashboard.skills')}</h4>
                    <div className="worker-skills">
                      {currentWorker.skills?.map((skill, index) => (
                        <span key={index} className="skill-tag">{skill}</span>
                      )) || <p>{t('employerDashboard.noSkills')}</p>}
                    </div>
                  </div>
                  
                  <div className="worker-profile-section">
                    <h4>{t('employerDashboard.experience')}</h4>
                    <p>{currentWorker.experience || t('employerDashboard.noDescription')}</p>
                  </div>
                  
                  <div className="worker-profile-section">
                    <h4>{t('employerDashboard.contactInformation')}</h4>
                    <p><strong>{t('employerDashboard.email')}:</strong> {currentWorker.email}</p>
                    <p><strong>{t('employerDashboard.phone')}:</strong> {currentWorker.mobileNo || t('employerDashboard.noDescription')}</p>
                  </div>
                </div>
                
                <div className={`tab-content ${activeProfileTab === 'ratings' ? 'active' : ''}`}>
                  <div className="ratings-container">
                    <div className="ratings-summary">
                      <div className="ratings-score">
                        <span className="big-score">{(currentWorker.avgRating || 4.5).toFixed(1)}</span>
                        <span className="big-stars">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span 
                              key={star} 
                              className={star <= (currentWorker.avgRating || 4.5) ? "star filled" : "star"}>
                              ★
                            </span>
                          ))}
                        </span>
                        <span className="rating-count">({workerRatings.length || 0} reviews)</span>
                      </div>
                    </div>
                    
                    <div className="ratings-list">
                      {workerRatings.length > 0 ? (
                        workerRatings.map(rating => (
                          <div key={rating._id} className="rating-card">
                            <div className="rating-header">
                              <div className="rater-info">
                                <span className="rater-name">
                                  {rating.rater?.firstName} {rating.rater?.lastName}
                                </span>
                                <span className="rating-date">
                                  {new Date(rating.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="rating-stars">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <span 
                                    key={star}
                                    className={star <= rating.rating ? "star filled" : "star"}>
                                    ★
                                  </span>
                                ))}
                              </div>
                            </div>
                            {rating.comment && (
                              <div className="rating-comment">{rating.comment}</div>
                            )}
                            {rating.job && (
                              <div className="rating-job">
                                <span className="job-label">{t('employerDashboard.jobTitle')}: </span>
                                <span className="job-title">{rating.job.title}</span>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="no-ratings">{t('employerDashboard.noJobsYet')}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn primary" 
                onClick={() => contactWorker(currentWorker)}
                aria-label={`Contact ${currentWorker.firstName}`}
              >
                {t('employerDashboard.message')}
              </button>
              <button 
                className="btn accent"
                onClick={() => {
                  setShowWorkerModal(false);
                  openInviteModal(currentWorker);
                }}
                aria-label={`Invite ${currentWorker.firstName} to job`}
              >
                {t('employerDashboard.inviteWorker')}
              </button>
              <button 
                className="btn secondary" 
                onClick={() => setShowWorkerModal(false)}
                aria-label="Close modal"
              >
                {t('employerDashboard.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Contact Worker Modal */}
      {showContactModal && currentWorker && (
        <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
          <div className="modal-content contact-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('employerDashboard.message')} {currentWorker.firstName}</h2>
            </div>
            
            <div className="modal-body">
              <div className="contact-info-section">
                <div className="contact-header">
                  <div className="contact-avatar">
                    {getProfilePictureUrl(currentWorker) ? (
                      <img 
                        src={getProfilePictureUrl(currentWorker)} 
                        alt={`${currentWorker.firstName}'s profile`}
                        className="profile-image"
                      />
                    ) : (
                      currentWorker.firstName?.[0] || 'W'
                    )}
                  </div>
                  <div className="contact-details">
                    <h3>{currentWorker.firstName} {currentWorker.lastName}</h3>
                    <p className="worker-email">
                      <span className="contact-icon">✉️</span>
                      {currentWorker.email}
                    </p>
                    {currentWorker.mobileNo && (
                      <p className="worker-phone">
                        <span className="contact-icon">📱</span>
                        {currentWorker.mobileNo}
                      </p>
                    )}
                    {currentWorker.skills && currentWorker.skills.length > 0 && (
                      <p className="worker-skills">
                        <span className="contact-icon">⚒️</span>
                        {currentWorker.skills.slice(0, 3).join(', ')}
                        {currentWorker.skills.length > 3 && '...'}
                      </p>
                    )}
                  </div>
                </div>
                
              </div>
              
              <div className="message-section">
                <h4>{t('employerDashboard.message')}</h4>
                <p className="message-info">{t('employerDashboard.message')} {currentWorker.firstName}</p>
                
                <div className="direct-message-link">
                  <Link 
                    to="/chat" 
                    state={{ recipientId: currentWorker._id, recipientName: `${currentWorker.firstName} ${currentWorker.lastName}` }}
                    className="chat-link-btn"
                    onClick={() => setShowContactModal(false)}
                  >
                    💬 {t('employerDashboard.message')} {currentWorker.firstName}
                  </Link>
                </div>
                
                <div className="divider-text">
                  <span>{t('common.or')}</span>
                </div>
                
                <div className="message-form">
                  <textarea 
                    id="message-input"
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder={`${t('employerDashboard.message')} ${currentWorker.firstName}...`}
                    rows="5"
                    className="message-textarea"
                  ></textarea>
                  
                  <div className="message-actions">
                    <button 
                      className="btn primary"
                      onClick={sendMessage}
                      disabled={!contactMessage.trim()}
                      aria-label={`Send message to ${currentWorker.firstName}`}
                    >
                      {loading ? (
                        <span className="spinner-inline"></span>
                      ) : (
                        t('common.send')
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn secondary" 
                onClick={() => setShowContactModal(false)}
                aria-label="Close contact modal"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Invitation Modal */}
      {showInviteModal && currentWorker && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-with-status">
                <h2>{t('employerDashboard.inviteWorker')}</h2>
              </div>
            </div>
            
            <div className="modal-body">
              <div className="invite-worker-info">
                <div className="worker-avatar">
                  {getProfilePictureUrl(currentWorker) ? (
                    <img 
                      src={getProfilePictureUrl(currentWorker)} 
                      alt={`${currentWorker.firstName}'s profile`} 
                      className="profile-image"
                    />
                  ) : (
                    currentWorker.firstName?.[0] || 'W'
                  )}
                </div>
                <div className="worker-details">
                  <h3>{currentWorker.firstName} {currentWorker.lastName}</h3>
                  <p className="worker-skills-preview">
                    {currentWorker.skills && currentWorker.skills.length > 0 
                      ? currentWorker.skills.slice(0, 3).join(', ') + (currentWorker.skills.length > 3 ? '...' : '') 
                      : t('employerDashboard.noSkills')}
                  </p>
                </div>
              </div>
              
              <div className="invitation-instruction">
                <p>{t('employerDashboard.selectJobMessage')}</p>
              </div>
              
              {myJobs.length > 0 ? (
                <div className="job-invite-list">
                  {myJobs
                    .map(job => (
                      <div 
                        key={job._id} 
                        className={`job-invite-item ${selectedJobForInvite === job._id ? 'selected' : ''} ${job.isOpen === false ? 'job-inactive' : ''}`}
                        onClick={() => job.isOpen !== false ? setSelectedJobForInvite(job._id) : null}
                        title={job.isOpen === false ? (job.completed ? 'Completed jobs cannot receive invitations' : 'Closed jobs cannot receive invitations') : ''}
                      >
                        <div className="job-invite-item-content">
                          <div className="job-header-with-status">
                            <h4>{job.title}</h4>
                            <div className={`job-status-badge ${job.completed ? 'completed' : (job.isOpen !== false ? 'active' : 'closed')}`}>
                              {job.completed ? t('employerDashboard.completed') : (job.isOpen !== false ? t('employerDashboard.open') : t('employerDashboard.closed'))}
                            </div>
                          </div>
                          <p className="job-description-preview">
                            {job.description?.substring(0, 60)}
                            {job.description?.length > 60 ? '...' : ''}
                          </p>
                          <div className="job-invite-details">
                            <p className="job-price">{formatPrice(job.price)}</p>
                            <p className="job-location"><span className="location-icon">📍</span> {job.barangay}</p>
                          </div>
                          {job.skillsRequired && job.skillsRequired.length > 0 && (
                            <div className="job-skills-preview">
                              {job.skillsRequired.slice(0, 3).map((skill, index) => (
                                <span key={index} className="skill-tag-small">{skill}</span>
                              ))}
                              {job.skillsRequired.length > 3 && (
                                <span className="skill-tag-more">+{job.skillsRequired.length - 3} more</span>
                              )}
                            </div>
                          )}
                        </div>
                        {selectedJobForInvite === job._id && (
                          <div className="selected-indicator">
                            <span className="checkmark">✓</span>
                          </div>
                        )}
                      </div>
                    ))
                  }
                </div>
              ) : (
                <div className="no-jobs-message">
                  <div className="icon">📭</div>
                  <h3>{t('employerDashboard.noJobsYet')}</h3>
                  <p>{t('employerDashboard.startPosting')}</p>
                  <div className="no-jobs-info">
                    <div className="info-item">
                      <span className="info-icon">💡</span>
                      <span className="info-text">Job invitations help you connect with qualified workers directly</span>
                    </div>
                    <div className="info-item">
                      <span className="info-icon">🔍</span>
                      <span className="info-text">Workers are more likely to apply to jobs they've been invited to</span>
                    </div>
                    <div className="info-item">
                      <span className="info-icon">⏱️</span>
                      <span className="info-text">Fill your positions faster by reaching out to skilled workers</span>
                    </div>
                  </div>
                  <div className="no-jobs-actions">
                    <Link to="/post-job" className="btn accent">{t('employerDashboard.postNewJob')}</Link>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn primary"
                disabled={
                  !selectedJobForInvite || 
                  (selectedJobForInvite && myJobs.find(job => job._id === selectedJobForInvite)?.isOpen === false)
                } 
                onClick={() => sendJobInvitation(selectedJobForInvite)}
                aria-label={`Send job invitation to ${currentWorker.firstName}`}
              >
                {loading ? (
                  <span className="spinner-inline"></span>
                ) : (
                  t('employerDashboard.invite')
                )}
              </button>
              <button 
                className="btn secondary" 
                onClick={() => setShowInviteModal(false)}
                aria-label="Cancel invitation"
              >
                {t('employerDashboard.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Payment Modal - PayMongo Integration */}
      {showPaymentModal && jobToComplete && (
        <PaymentModal
          job={jobToComplete}
          onClose={() => {
            setShowPaymentModal(false);
            setJobToComplete(null);
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && jobToDelete && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('employerDashboard.deleteJobTitle')}</h3>
            </div>
            
            <div className="modal-body">
              <div className="delete-warning">
                <div className="warning-icon">⚠️</div>
                <h4>{t('employerDashboard.confirmDelete')}</h4>
                <p>
                  <strong>"{jobToDelete.title}"</strong> {t('employerDashboard.confirmDeleteMessage')}
                </p>
                
                <div className="delete-job-details">
                  <div className="detail-item">
                    <span className="detail-label">{t('employerDashboard.price')}:</span>
                    <span className="detail-value">{formatPrice(jobToDelete.price)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">{t('employerDashboard.location')}:</span>
                    <span className="detail-value">{jobToDelete.barangay || t('employerDashboard.noDescription')}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">{t('employerDashboard.status')}:</span>
                    <span className={`status-badge ${jobToDelete.isOpen ? 'active' : 'closed'}`}>
                      {jobToDelete.isOpen ? t('employerDashboard.open') : t('employerDashboard.closed')}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">{t('employerDashboard.applicants')}:</span>
                    <span className="detail-value">{jobToDelete.applicants?.length || 0}</span>
                  </div>
                </div>
                
                <div className="delete-note">
                  <span className="note-icon">📝</span>
                  <span className="note-text">
                    Deleted jobs are not visible to users but can be restored by an administrator.
                  </span>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn secondary" 
                onClick={() => setShowDeleteModal(false)}
              >
                {t('employerDashboard.cancel')}
              </button>
              <button 
                className="btn danger"
                onClick={deleteJob}
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner-inline"></span>
                ) : (
                  t('employerDashboard.delete')
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report User Modal */}
      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={closeReportModal}
        onSubmit={handleReportSubmit}
        reportType="User"
        targetName={reportModal.userName}
      />
    </div>
  )
}

export default EmployerDashboard
