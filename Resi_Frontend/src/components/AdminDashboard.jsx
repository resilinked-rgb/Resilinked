import { useState, useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { AlertContext } from '../context/AlertContext'
import { useTranslation } from '../hooks/useTranslation'

// Reusable SVG icons to ensure consistent rendering across tabs (avoid missing emoji glyphs)
const StatIcons = {
  users: (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  jobs: (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <path d="M2 13h20" />
    </svg>
  ),
  ratings: (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="32" height="32" fill="currentColor" stroke="none">
      <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z" />
    </svg>
  ),
  reports: (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
      <path d="M10 9H8" />
    </svg>
  )
}

// Date formatting helper function
const formatDate = (dateValue, format = 'full') => {
  try {
    if (!dateValue) return 'N/A';
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    const formatOptions = {
      full: { year: 'numeric', month: 'long', day: 'numeric' },
      short: { year: 'numeric', month: 'short', day: 'numeric' },
      compact: { month: 'short', day: 'numeric', year: '2-digit' }
    };
    
    return date.toLocaleDateString('en-US', formatOptions[format] || formatOptions.full);
  } catch (error) {
    return 'Invalid Date';
  }
};

// User Modal Component
function UserModal({ user, type, onClose, onSave }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    userType: 'employee',
    barangay: '',
    isVerified: false,
    isEmailVerified: false
  })
  
  const [viewingDocument, setViewingDocument] = useState(null) // For document lightbox

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        userType: user.userType || 'employee',
        barangay: user.barangay || '',
        isVerified: user.isVerified || false,
        isEmailVerified: user.isEmailVerified || false
      })
    }
  }, [user])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (type === 'edit') {
      onSave(user._id, formData)
    }
  }

  const handleChange = (e) => {
    const { name, value, type: inputType, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: inputType === 'checkbox' ? checked : value
    }))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{type === 'edit' ? 'Edit User' : 'User Details'}</h3>
          {type === 'view' && (
            <button className="modal-close" onClick={onClose}>×</button>
          )}
        </div>
        
        <div className="modal-body">
          {type === 'view' ? (
            <div className="user-details">
              <div className="detail-grid">
                <div className="detail-section">
                  <h4>Personal Information</h4>
                  <div className="detail-item">
                    <span className="label">Full Name:</span>
                    <span className="value">{user?.firstName} {user?.lastName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Email:</span>
                    <span className="value">{user?.email}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Mobile:</span>
                    <span className="value">{user?.mobileNo || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Gender:</span>
                    <span className="value">{user?.gender || 'Not specified'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Address:</span>
                    <span className="value">{user?.address || 'Not provided'}</span>
                  </div>
                </div>
                
                <div className="detail-section">
                  <h4>Account Information</h4>
                  <div className="detail-item">
                    <span className="label">User Type:</span>
                    <span className="value user-type-badge">{user?.userType}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Barangay:</span>
                    <span className="value">{user?.barangay || 'Not specified'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Email Verified:</span>
                    <span className={`value status-badge ${user?.isEmailVerified ? 'verified' : 'unverified'}`}>
                      {user?.isEmailVerified ? '“ Verified' : '— Not Verified'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Admin Approved:</span>
                    <span className={`value status-badge ${user?.isVerified ? 'verified' : 'unverified'}`}>
                      {user?.isVerified ? '“ Approved' : '— Pending'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Member Since:</span>
                    <span className="value">
                      {formatDate(user?.createdAt, 'full')}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Account ID:</span>
                    <span className="value account-id">{user?._id || 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              {/* Document Verification Section */}
              {(user?.idFrontImage || user?.idBackImage || user?.barangayClearanceImage) && (
                <div className="detail-section">
                  <h4>Uploaded Documents</h4>
                  <div className="documents-grid">
                    {user?.idFrontImage && (
                      <div className="document-item">
                        <span className="document-label">ID Front:</span>
                        <img 
                          src={user.idFrontImage} 
                          alt="ID Front" 
                          className="document-thumbnail"
                          onClick={() => setViewingDocument({ url: user.idFrontImage, title: 'ID Front' })}
                        />
                      </div>
                    )}
                    {user?.idBackImage && (
                      <div className="document-item">
                        <span className="document-label">ID Back:</span>
                        <img 
                          src={user.idBackImage} 
                          alt="ID Back" 
                          className="document-thumbnail"
                          onClick={() => setViewingDocument({ url: user.idBackImage, title: 'ID Back' })}
                        />
                      </div>
                    )}
                    {user?.barangayClearanceImage && (
                      <div className="document-item">
                        <span className="document-label">Barangay Clearance:</span>
                        <img 
                          src={user.barangayClearanceImage} 
                          alt="Barangay Clearance" 
                          className="document-thumbnail"
                          onClick={() => setViewingDocument({ url: user.barangayClearanceImage, title: 'Barangay Clearance' })}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {user?.skills && user.skills.length > 0 && (
                <div className="detail-section">
                  <h4>Skills</h4>
                  <div className="skills-list">
                    {user.skills.map((skill, index) => (
                      <span key={index} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="user-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="userType">User Type</label>
                  <select
                    id="userType"
                    name="userType"
                    value={formData.userType}
                    onChange={handleChange}
                    required
                  >
                    <option value="employee">Employee</option>
                    <option value="employer">Employer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="barangay">Barangay</label>
                  <input
                    type="text"
                    id="barangay"
                    name="barangay"
                    value={formData.barangay}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="form-group">
                  <label className="info-label">Email Verified:</label>
                  <span className={`status-badge ${formData.isEmailVerified ? 'verified' : 'unverified'}`}>
                    {formData.isEmailVerified ? '“ Verified' : '— Not Verified'}
                  </span>
                  <small style={{ display: 'block', color: '#666', marginTop: '0.25rem' }}>
                    (Email verification is automated when user clicks link)
                  </small>
                </div>
                
                <div className="form-group checkbox-group">
                  <label htmlFor="isVerified" className="checkbox-label">
                    <input
                      type="checkbox"
                      id="isVerified"
                      name="isVerified"
                      checked={formData.isVerified}
                      onChange={handleChange}
                    />
                    Admin Approved
                  </label>
                  <small style={{ display: 'block', color: '#666', marginLeft: '1.5rem', marginTop: '0.25rem' }}>
                    (Toggle to approve/revoke user account)
                  </small>
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn primary">
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </div>
        
        {/* Document Lightbox */}
        {viewingDocument && (
          <div className="document-lightbox" onClick={() => setViewingDocument(null)}>
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
              <div className="lightbox-header">
                <h4>{viewingDocument.title}</h4>
                <button className="lightbox-close" onClick={() => setViewingDocument(null)}>×</button>
              </div>
              <img src={viewingDocument.url} alt={viewingDocument.title} className="lightbox-image" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Job Modal Component
function JobModal({ job, type, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Job Details</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="job-details">
            <div className="detail-grid">
              <div className="detail-section">
                <h4>Job Information</h4>
                <div className="detail-item">
                  <span className="label">Title:</span>
                  <span className="value job-title">{job?.title}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Price:</span>
                  <span className="value job-price">₱{job?.price?.toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Location:</span>
                  <span className="value">{job?.barangay || job?.location}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Status:</span>
                  <span className={`value status-badge ${job?.isOpen ? 'active' : 'closed'}`}>
                    {job?.isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Completion:</span>
                  <span className={`value status-badge ${job?.completed ? 'completed' : 'in-progress'}`}>
                    {job?.completed ? 'Completed' : 'In Progress'}
                  </span>
                </div>
              </div>
              
              <div className="detail-section">
                <h4>Employer & Timeline</h4>
                <div className="detail-item">
                  <span className="label">Posted By:</span>
                  <span className="value">
                    {job?.postedBy ? `${job.postedBy.firstName} ${job.postedBy.lastName}` : 'Unknown'}
                  </span>
                </div>
                {job?.postedBy?.email && (
                  <div className="detail-item">
                    <span className="label">Email:</span>
                    <span className="value">{job.postedBy.email}</span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="label">Posted Date:</span>
                  <span className="value">
                    {formatDate(job?.datePosted || job?.createdAt, 'full')}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Applicants:</span>
                  <span className="value">{job?.applicants?.length || 0} applicant(s)</span>
                </div>
                <div className="detail-item">
                  <span className="label">Job ID:</span>
                  <span className="value account-id">{job?._id}</span>
                </div>
              </div>
            </div>
            
            {job?.description && (
              <div className="detail-section">
                <h4>Description</h4>
                <p className="job-description">{job.description}</p>
              </div>
            )}
            
            {job?.skillsRequired && job.skillsRequired.length > 0 && (
              <div className="detail-section">
                <h4>Required Skills</h4>
                <div className="skills-list">
                  {job.skillsRequired.map((skill, index) => (
                    <span key={index} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </div>
            )}
            
            {job?.applicants && job.applicants.length > 0 && (
              <div className="detail-section">
                <h4>Applicants ({job.applicants.length})</h4>
                <div className="applicants-list">
                  {job.applicants.map((applicant, index) => (
                    <div key={index} className="applicant-item">
                      <div className="applicant-info">
                        <span className="applicant-name">
                          {applicant.user ? `${applicant.user.firstName} ${applicant.user.lastName}` : 'Unknown User'}
                        </span>
                        {applicant.user?.email && (
                          <span className="applicant-email">{applicant.user.email}</span>
                        )}
                      </div>
                      <span className={`status-badge ${applicant.status || 'pending'}`}>
                        {applicant.status || 'pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminDashboard() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [currentTab, setCurrentTab] = useState('overview')
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalJobs: 0,
    totalRatings: 0,
    totalReports: 0,
    totalSupportTickets: 0
  })
  const [users, setUsers] = useState([])
  const [jobs, setJobs] = useState([])
  const [reports, setReports] = useState([])
  const [reportStatusFilter, setReportStatusFilter] = useState('all')
  const [reportSearchQuery, setReportSearchQuery] = useState('')
  const [supportTickets, setSupportTickets] = useState([])
  const [ticketStatusFilter, setTicketStatusFilter] = useState('all')
  const [ticketSearchQuery, setTicketSearchQuery] = useState('')
  const [deletedUsers, setDeletedUsers] = useState([])
  const [deletedJobs, setDeletedJobs] = useState([])
  const [deletedGoals, setDeletedGoals] = useState([])
  const [deletedItemType, setDeletedItemType] = useState('users') // 'users', 'jobs', 'goals'
  const [deletedSearchQuery, setDeletedSearchQuery] = useState('')
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [tabLoading, setTabLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [userModal, setUserModal] = useState({ show: false, user: null, type: 'view' })
  const [jobModal, setJobModal] = useState({ show: false, job: null, type: 'view' })
  const [analyticsData, setAnalyticsData] = useState(null)
  
  // Filter states
  const [barangayFilter, setBarangayFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all') // 'all', 'employee', 'employer'
  const [jobStatusFilter, setJobStatusFilter] = useState('all') // 'all', 'open', 'closed', 'completed'
  const [verificationFilter, setVerificationFilter] = useState('all') // 'all', 'verified', 'unverified'
  const [filteredUsers, setFilteredUsers] = useState([])
  const [filteredJobs, setFilteredJobs] = useState([])
  
  // Delete/Restore confirmation modals
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false)
  const [showDeleteJobModal, setShowDeleteJobModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [showPermanentDeleteModal, setShowPermanentDeleteModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [jobToDelete, setJobToDelete] = useState(null)
  const [itemToRestore, setItemToRestore] = useState({ id: null, type: null })
  const [itemToDeletePermanently, setItemToDeletePermanently] = useState({ id: null, type: null })

  const { user, hasAccessTo } = useContext(AuthContext)
  const { success, error: showError } = useContext(AlertContext)
  const navigate = useNavigate()

  useEffect(() => {
    if (!hasAccessTo('admin')) {
      showError('Admin access required')
      navigate('/landing')
      return
    }
    
    loadDashboardData()
  }, [hasAccessTo, navigate, showError])

  // Filter users whenever filters or users change
  useEffect(() => {
    let filtered = [...users]
    
    if (barangayFilter !== 'all') {
      filtered = filtered.filter(user => user.barangay === barangayFilter)
    }
    
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }
    
    if (verificationFilter === 'verified') {
      filtered = filtered.filter(user => user.isVerified === true)
    } else if (verificationFilter === 'unverified') {
      filtered = filtered.filter(user => user.isVerified !== true)
    }
    
    setFilteredUsers(filtered)
  }, [users, barangayFilter, roleFilter, verificationFilter])

  // Filter jobs whenever filters or jobs change
  useEffect(() => {
    let filtered = [...jobs]
    
    if (barangayFilter !== 'all') {
      filtered = filtered.filter(job => job.barangay === barangayFilter)
    }
    
    if (jobStatusFilter === 'open') {
      filtered = filtered.filter(job => job.isOpen === true)
    } else if (jobStatusFilter === 'closed') {
      filtered = filtered.filter(job => job.isOpen === false && !job.isCompleted)
    } else if (jobStatusFilter === 'completed') {
      filtered = filtered.filter(job => job.isCompleted === true)
    }
    
    setFilteredJobs(filtered)
  }, [jobs, barangayFilter, jobStatusFilter])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadDashboardStats(),
        loadTabContent(currentTab)
      ])
    } catch (error) {
      console.error('Dashboard initialization error:', error)
      showError('Failed to load dashboard. Please try refreshing.')
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token')
  const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://resi-backend-ihyu.vercel.app/api'}/admin/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        // Fallback with manual counting
        const [usersRes, jobsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/admin/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${import.meta.env.VITE_API_URL}/admin/jobs`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ])

        const usersData = usersRes.ok ? await usersRes.json() : { pagination: { total: 0 } }
        const jobsData = jobsRes.ok ? await jobsRes.json() : { pagination: { total: 0 } }

        setStats({
          totalUsers: usersData.pagination?.total || 0,
          totalJobs: jobsData.pagination?.total || 0,
          totalRatings: 0, // Placeholder
          totalReports: 0  // Placeholder
        })
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
      showError('Failed to load dashboard statistics')
    }
  }

  const loadTabContent = async (tabId) => {
    setTabLoading(true)
    try {
      switch (tabId) {
        case 'overview':
          await loadRecentJobs()
          break
        case 'users':
          await loadUsers()
          break
        case 'jobs':
          await loadAllJobs()
          break
        case 'analytics':
          await loadAnalytics()
          break
        case 'reports':
          await loadReports()
          break
        case 'support':
          await loadSupportTickets()
          break
        case 'deleted':
          await loadDeletedItems(deletedItemType)
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
  
  const loadDeletedItems = async (type = 'users') => {
    try {
      setDeletedItemType(type)
      const apiService = await import('../api').then(module => module.default)
      
      let data = []
      switch (type) {
        case 'users':
          const usersResponse = await apiService.getDeletedUsers()
          data = usersResponse.data?.users || usersResponse.users || []
          console.log('Deleted Users Response:', data)
          setDeletedUsers(data)
          break
        case 'jobs':
          const jobsResponse = await apiService.getDeletedJobs()
          data = jobsResponse.data?.jobs || jobsResponse.jobs || []
          console.log('Deleted Jobs Response:', data)
          setDeletedJobs(data)
          break
        case 'goals':
          const goalsResponse = await apiService.getDeletedGoals()
          data = goalsResponse.data?.goals || goalsResponse.goals || []
          console.log('Deleted Goals Response:', data)
          setDeletedGoals(data)
          break
        default:
          break
      }
      
      console.log(`Loaded ${data.length} deleted ${type}`)
      
    } catch (error) {
      console.error(`Error loading deleted ${type}:`, error)
      showError(`Failed to load deleted ${type}`)
    }
  }

  const loadUsers = async (page = 1, limit = 10) => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy: sortField,
        order: sortOrder
      })
      
      if (searchQuery) params.append('q', searchQuery)

  const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://resi-backend-ihyu.vercel.app/api'
      const response = await fetch(`${apiBaseUrl}/admin/users?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.data || [])
        setPagination(data.pagination || { page: 1, pages: 1, total: 0 })
      } else {
        showError('Failed to load users')
      }
    } catch (error) {
      console.error('Error loading users:', error)
      showError('Error loading users')
    }
  }

  const loadAllJobs = async (page = 1, limit = 10) => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy: sortField,
        order: sortOrder
      })
      
      if (searchQuery) params.append('q', searchQuery)

  const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/jobs?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setJobs(data.data || [])
        setPagination(data.pagination || { page: 1, pages: 1, total: 0 })
      } else {
        showError('Failed to load jobs')
      }
    } catch (error) {
      console.error('Error loading jobs:', error)
      showError('Error loading jobs')
    }
  }

  const loadRecentJobs = async () => {
    try {
      const token = localStorage.getItem('token')
  const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/jobs?limit=5&sortBy=createdAt&order=desc`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setJobs(data.data || [])
      }
    } catch (error) {
      console.error('Error loading recent jobs:', error)
    }
  }

  const loadAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/analytics/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      } else {
        showError('Failed to load analytics data');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      showError('Error loading analytics data');
    }
  }

  const loadReports = async () => {
    try {
      const apiService = await import('../api').then(module => module.default);
      const response = await apiService.getReports();
      const allReports = response.reports || [];
      
      // Filter reports based on status
      let filtered = allReports;
      if (reportStatusFilter !== 'all') {
        filtered = allReports.filter(report => report.status === reportStatusFilter);
      }
      
      setReports(filtered);
    } catch (error) {
      console.error('Error loading reports:', error);
      showError('Failed to load reports');
    }
  }

  const loadSupportTickets = async () => {
    try {
      const apiService = await import('../api').then(module => module.default);
      const params = ticketStatusFilter !== 'all' ? { status: ticketStatusFilter } : {};
      console.log('Loading support tickets with params:', params);
      
      const response = await apiService.getSupportTickets(params);
      console.log('Support tickets response:', response);
      
      const tickets = response.tickets || response.data?.tickets || [];
      console.log('Extracted tickets:', tickets);
      
      setSupportTickets(tickets);
    } catch (error) {
      console.error('Error loading support tickets:', error);
      showError('Failed to load support tickets');
    }
  }

  const handleTicketStatusUpdate = async (ticketId, newStatus) => {
    try {
      const apiService = await import('../api').then(module => module.default);
      await apiService.updateSupportTicket(ticketId, { status: newStatus });
      success(`Ticket ${newStatus} successfully`);
      await loadSupportTickets();
    } catch (error) {
      console.error('Error updating ticket status:', error);
      showError('Failed to update ticket status');
    }
  }

  const handleReportStatusUpdate = async (reportId, newStatus) => {
    try {
      const apiService = await import('../api').then(module => module.default);
      await apiService.updateReportStatus(reportId, newStatus);
      success(`Report ${newStatus} successfully`);
      await loadReports();
    } catch (error) {
      console.error('Error updating report status:', error);
      showError('Failed to update report status');
    }
  }

  const handleTabChange = async (tabId) => {
    setCurrentTab(tabId)
    await loadTabContent(tabId)
  }

  const handleSearch = async () => {
    if (currentTab === 'users') {
      await loadUsers(1, 10)
    } else if (currentTab === 'jobs') {
      await loadAllJobs(1, 10)
    }
  }

  const handleSort = async (field, order) => {
    setSortField(field)
    setSortOrder(order)
    if (currentTab === 'users') {
      await loadUsers(1, 10)
    } else if (currentTab === 'jobs') {
      await loadAllJobs(1, 10)
    }
  }

  const handlePageChange = async (newPage) => {
    if (currentTab === 'users') {
      await loadUsers(newPage, 10)
    } else if (currentTab === 'jobs') {
      await loadAllJobs(newPage, 10)
    }
  }

  const viewUser = async (userId) => {
    try {
      const token = localStorage.getItem('token')
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://resi-backend-ihyu.vercel.app/api'
      const response = await fetch(`${apiBaseUrl}/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const userData = await response.json()
        setUserModal({ show: true, user: userData.user || userData, type: 'view' })
      } else {
        showError('Failed to load user details')
      }
    } catch (error) {
      console.error('Error viewing user:', error)
      showError('Error loading user details')
    }
  }

  const editUser = async (userId) => {
    try {
      const token = localStorage.getItem('token')
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://resi-backend-ihyu.vercel.app/api'
      const response = await fetch(`${apiBaseUrl}/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const userData = await response.json()
        setUserModal({ show: true, user: userData.user || userData, type: 'edit' })
      } else {
        showError('Failed to load user details')
      }
    } catch (error) {
      console.error('Error loading user for edit:', error)
      showError('Error loading user details')
    }
  }

  const saveUser = async (userId, userData) => {
    try {
      const token = localStorage.getItem('token')
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://resi-backend-ihyu.vercel.app/api'
      
      console.log('Updating user with data:', userData)
      
      const response = await fetch(`${apiBaseUrl}/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('User update response:', data)
        success('User updated successfully')
        setUserModal({ show: false, user: null, type: 'view' })
        
        // Update users list immediately for better UX
        setUsers(prevUsers => prevUsers.map(user => 
          user._id === userId ? {...user, ...userData} : user
        ))
        
        // Then refresh from server
        await loadUsers(pagination.page, 10)
        await loadDashboardStats()
      } else {
        const errorData = await response.json()
        console.error('API error response:', errorData)
        showError(`Failed to update user: ${errorData.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating user:', error)
      showError('Error updating user')
    }
  }

  const openDeleteUserModal = (userId) => {
    setUserToDelete(userId)
    setShowDeleteUserModal(true)
  }

  const deleteUser = async () => {
    if (!userToDelete) return
    
    try {
      setTabLoading(true)
      const token = localStorage.getItem('token')
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://resi-backend-ihyu.vercel.app/api'
      
      const response = await fetch(`${apiBaseUrl}/admin/users/${userToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        success('User deleted successfully')
        
        // Update the users list immediately by removing the deleted user
        setUsers(prevUsers => prevUsers.filter(user => user._id !== userToDelete))
        
        // Then refresh from server
        await loadUsers(pagination.page, 10)
        await loadDashboardStats()
      } else {
        // Handle error response
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            showError(`Failed to delete user: ${errorData.message || 'Unknown error'}`);
          } else {
            showError(`Failed to delete user (HTTP ${response.status})`);
          }
        } catch (parseError) {
          showError('Failed to delete user');
        }
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      showError('Error deleting user: Network error')
    } finally {
      setTabLoading(false)
      setShowDeleteUserModal(false)
      setUserToDelete(null)
    }
  }
  
  // Functions for managing deleted items
  const openRestoreModal = (itemId, type) => {
    setItemToRestore({ id: itemId, type })
    setShowRestoreModal(true)
  }

  const restoreItem = async () => {
    const { id: itemId, type } = itemToRestore
    if (!itemId || !type) return
    
    const typeName = type.slice(0, -1);
    
    try {
      setTabLoading(true);
      const apiService = await import('../api').then(module => module.default)
      
      switch (type) {
        case 'users':
          await apiService.restoreUser(itemId)
          success('User restored successfully and is now active again')
          break
        case 'jobs':
          await apiService.restoreJob(itemId)
          success('Job restored successfully and is now visible again')
          break
        case 'goals':
          await apiService.restoreGoal(itemId)
          success('Goal restored successfully and is now available again')
          break
        default:
          break
      }
      
      // Refresh the deleted items list
      await loadDeletedItems(type)
    } catch (error) {
      console.error(`Error restoring ${typeName}:`, error)
      showError(`Failed to restore ${typeName}: ${error.message}`)
    } finally {
      setTabLoading(false);
      setShowRestoreModal(false)
      setItemToRestore({ id: null, type: null })
    }
  }

  const openPermanentDeleteModal = (itemId, type) => {
    setItemToDeletePermanently({ id: itemId, type })
    setShowPermanentDeleteModal(true)
  }

  const permanentlyDeleteItem = async () => {
    const { id: itemId, type } = itemToDeletePermanently
    if (!itemId || !type) return
    
    const typeName = type.slice(0, -1);
    
    try {
      setTabLoading(true);
      const apiService = await import('../api').then(module => module.default)
      
      switch (type) {
        case 'users':
          await apiService.permanentlyDeleteUser(itemId)
          success(`User permanently deleted from the system`)
          break
        case 'jobs':
          await apiService.permanentlyDeleteJob(itemId)
          success(`Job permanently deleted from the system`)
          break
        case 'goals':
          await apiService.permanentlyDeleteGoal(itemId)
          success(`Goal permanently deleted from the system`)
          break
        default:
          break
      }
      
      // Refresh the deleted items list
      await loadDeletedItems(type)
    } catch (error) {
      console.error(`Error permanently deleting ${typeName}:`, error)
      showError(`Failed to permanently delete ${typeName}: ${error.message}`)
    } finally {
      setTabLoading(false);
      setShowPermanentDeleteModal(false)
      setItemToDeletePermanently({ id: null, type: null })
    }
  }

  const toggleUserVerification = async (userId, currentStatus) => {
    try {
      if (!userId) {
        showError('Invalid user ID')
        return
      }
      
      const token = localStorage.getItem('token')
      if (!token) {
        showError('Authentication token not found. Please log in again.')
        return
      }
      
      // Log the action being attempted
      console.log(`Attempting to ${currentStatus ? 'disable' : 'verify'} user ${userId}`)
      
      // Ensure we have the correct API URL
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://resi-backend-ihyu.vercel.app/api'
      
      // First, get the current user data so we have all required fields
      const userDataResponse = await fetch(`${apiBaseUrl}/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!userDataResponse.ok) {
        console.error('Failed to fetch user data:', userDataResponse.status)
        showError('Failed to fetch user data')
        return
      }
      
      const userData = await userDataResponse.json()
      const user = userData.user || userData
      
      console.log('Retrieved user data:', user)
      
      // Create update object with all required fields and new verification status
      const updateData = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userType: user.userType,
        isVerified: !currentStatus
      }
      
      console.log('Sending user update with data:', updateData)
      
      // Make the API call to update user verification status
      const response = await fetch(`${apiBaseUrl}/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })
      
      // Log the response status
      console.log('Response status:', response.status)
      
      if (response.ok) {
        // Success path
        let userData
        try {
          userData = await response.json()
          console.log('API response data:', userData)
        } catch (parseError) {
          console.warn('Could not parse response as JSON, but request was successful')
        }
        
        // Update the local state immediately for better UX
        setUsers(prevUsers => prevUsers.map(user => 
          user._id === userId ? {...user, isVerified: !currentStatus} : user
        ))
        
        // Show success message
        success(`User ${!currentStatus ? 'verified' : 'disabled'} successfully`)
        
        // Refresh data from server to ensure consistency
        await loadUsers(pagination.page, 10)
        await loadDashboardStats()
      } else {
        // Error path - safely handle different types of error responses
        try {
          const contentType = response.headers.get("content-type")
          if (contentType && contentType.indexOf("application/json") !== -1) {
            const errorData = await response.json()
            console.error('API error response:', errorData)
            
            // Extract meaningful error message if available
            const errorMessage = errorData.message || errorData.error || 'Unknown error'
            showError(`Failed to update user verification: ${errorMessage}`)
          } else {
            // Non-JSON error response
            console.error('API error response: Non-JSON response with status', response.status)
            showError(`Failed to update user verification (HTTP ${response.status})`)
          }
        } catch (parseError) {
          // Error parsing the error response
          console.error('Failed to parse error response:', parseError)
          showError(`Failed to update user verification (HTTP ${response.status})`)
        }
      }
    } catch (error) {
      // Network or other unhandled errors
      console.error('Error toggling user verification:', error)
      showError('Network error while updating user verification')
    }
  }

  const viewJob = async (jobId) => {
    try {
      const token = localStorage.getItem('token')
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://resi-backend-ihyu.vercel.app/api'
      const response = await fetch(`${apiBaseUrl}/jobs/${jobId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const jobData = await response.json()
        setJobModal({ show: true, job: jobData.job || jobData, type: 'view' })
      } else {
        showError('Failed to load job details')
      }
    } catch (error) {
      console.error('Error viewing job:', error)
      showError('Error loading job details')
    }
  }

  const openDeleteJobModal = (jobId) => {
    setJobToDelete(jobId)
    setShowDeleteJobModal(true)
  }

  const deleteJob = async () => {
    if (!jobToDelete) return
    
    try {
      setTabLoading(true)
      const token = localStorage.getItem('token')
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://resi-backend-ihyu.vercel.app/api'
      const response = await fetch(`${apiBaseUrl}/admin/jobs/${jobToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        success('Job deleted successfully')
        if (currentTab === 'jobs') {
          await loadAllJobs(pagination.page, 10)
        } else {
          await loadRecentJobs()
        }
        await loadDashboardStats()
      } else {
        showError('Failed to delete job')
      }
    } catch (error) {
      console.error('Error deleting job:', error)
      showError('Error deleting job')
    } finally {
      setTabLoading(false)
      setShowDeleteJobModal(false)
      setJobToDelete(null)
    }
  }

  const toggleJobStatus = async (jobId, currentStatus) => {
    try {
      const token = localStorage.getItem('token')
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://resi-backend-ihyu.vercel.app/api'
      const response = await fetch(`${apiBaseUrl}/jobs/${jobId}/close`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isOpen: !currentStatus })
      })
      
      if (response.ok) {
        success(`Job ${!currentStatus ? 'reopened' : 'closed'} successfully`)
        await loadTabContent('jobs')
        await loadDashboardStats()
      } else {
        showError('Failed to update job status')
      }
    } catch (error) {
      console.error('Error updating job status:', error)
      showError('Error updating job status')
    }
  }

  const exportData = async (type, format = 'csv') => {
    try {
      const token = localStorage.getItem('token')
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://resi-backend-ihyu.vercel.app/api'
      
      // Build query params based on current filters
      const params = new URLSearchParams({
        format,
        sortBy: sortField,
        order: sortOrder
      })
      
      if (searchQuery) params.append('q', searchQuery)
      
      // Add filter params based on type
      if (type === 'users') {
        if (barangayFilter !== 'all') params.append('barangay', barangayFilter)
        if (roleFilter !== 'all') params.append('role', roleFilter)
        if (verificationFilter !== 'all') params.append('verified', verificationFilter === 'verified')
      } else if (type === 'jobs') {
        if (barangayFilter !== 'all') params.append('barangay', barangayFilter)
        if (jobStatusFilter !== 'all') params.append('status', jobStatusFilter)
      }
      
      console.log('Export request:', `${apiBaseUrl}/export/${type}?${params}`)
      
      // Show loading message for PDF exports
      if (format === 'pdf') {
        success('Generating PDF report, please wait...')
      }
      
      // Add timeout for long requests (2 minutes)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 120000)
      
      const response = await fetch(`${apiBaseUrl}/export/${type}?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      console.log('Export response status:', response.status, response.statusText)
      
      if (response.ok) {
        const blob = await response.blob()
        console.log('Blob received:', blob.size, 'bytes, type:', blob.type)
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `resilinked-${type}-${new Date().toISOString().split('T')[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        success(`${type} data exported successfully as ${format.toUpperCase()}`)
      } else {
        const errorText = await response.text()
        console.error('Export error response:', errorText)
        showError(`Failed to export ${type} data: ${response.status}`)
      }
    } catch (error) {
      console.error('Export error:', error)
      showError(`Error exporting data: ${error.message}`)
    }
  }

  // Export Reports
  const exportReports = (format = 'pdf') => {
    try {
      const filteredReports = reports.filter(report => {
        const matchesStatus = reportStatusFilter === 'all' || report.status === reportStatusFilter
        const matchesSearch = !reportSearchQuery || 
          report.reason?.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
          report.reporter?.email?.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
          report.reporter?.firstName?.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
          report.reporter?.lastName?.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
          report.reportedUser?.email?.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
          report.reportedUser?.firstName?.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
          report.reportedUser?.lastName?.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
          report.reportedJob?.title?.toLowerCase().includes(reportSearchQuery.toLowerCase())
        return matchesStatus && matchesSearch
      })

      if (format === 'csv') {
        // CSV Export
        const csvContent = [
          ['Report ID', 'Reporter Email', 'Reported Type', 'Reported Item', 'Reason', 'Status', 'Date Created'].join(','),
          ...filteredReports.map(report => [
            report._id,
            report.reporter?.email || 'Unknown',
            report.reportedUser ? 'User' : 'Job',
            report.reportedUser ? `${report.reportedUser.firstName} ${report.reportedUser.lastName}` : report.reportedJob?.title || 'N/A',
            `"${report.reason?.replace(/"/g, '""') || ''}"`,
            report.status,
            new Date(report.createdAt).toLocaleDateString()
          ].join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `resilinked-reports-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        success('Reports exported as CSV successfully')
      } else {
        // PDF Export
        const { jsPDF } = window.jspdf
        const doc = new jsPDF()
        
        // Header
        doc.setFontSize(18)
        doc.setTextColor(99, 102, 241) // ResiLinked brand color
        doc.text('ResiLinked - Reports Export', 14, 20)
        
        // Metadata
        doc.setFontSize(10)
        doc.setTextColor(100, 100, 100)
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)
        doc.text(`Total Reports: ${filteredReports.length}`, 14, 34)
        doc.text(`Status Filter: ${reportStatusFilter === 'all' ? 'All' : reportStatusFilter}`, 14, 40)
        
        // Table
        const tableData = filteredReports.map(report => [
          report._id.substring(0, 8) + '...',
          report.reporter?.email || 'Unknown',
          report.reportedUser ? 'User' : 'Job',
          report.reportedUser 
            ? `${report.reportedUser.firstName} ${report.reportedUser.lastName}` 
            : report.reportedJob?.title || 'N/A',
          report.reason || '',
          report.status,
          new Date(report.createdAt).toLocaleDateString()
        ])
        
        doc.autoTable({
          head: [['ID', 'Reporter', 'Type', 'Reported Item', 'Reason', 'Status', 'Date']],
          body: tableData,
          startY: 45,
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [99, 102, 241], textColor: 255 },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          margin: { top: 45 }
        })
        
        doc.save(`resilinked-reports-${new Date().toISOString().split('T')[0]}.pdf`)
        success('Reports exported as PDF successfully')
      }
    } catch (error) {
      showError('Error exporting reports: ' + error.message)
    }
  }

  // Export Support Tickets
  const exportSupportTickets = (format = 'pdf') => {
    try {
      const filteredTickets = supportTickets.filter(ticket => {
        const matchesStatus = ticketStatusFilter === 'all' || ticket.status === ticketStatusFilter
        const matchesSearch = !ticketSearchQuery ||
          ticket.subject?.toLowerCase().includes(ticketSearchQuery.toLowerCase()) ||
          ticket.message?.toLowerCase().includes(ticketSearchQuery.toLowerCase()) ||
          ticket.user?.email?.toLowerCase().includes(ticketSearchQuery.toLowerCase()) ||
          ticket.user?.firstName?.toLowerCase().includes(ticketSearchQuery.toLowerCase()) ||
          ticket.user?.lastName?.toLowerCase().includes(ticketSearchQuery.toLowerCase())
        return matchesStatus && matchesSearch
      })

      if (format === 'csv') {
        // CSV Export
        const csvContent = [
          ['Ticket ID', 'User Email', 'User Name', 'Subject', 'Message', 'Status', 'Date Created', 'Date Updated'].join(','),
          ...filteredTickets.map(ticket => [
            ticket._id,
            ticket.user?.email || 'Unknown',
            ticket.user ? `${ticket.user.firstName} ${ticket.user.lastName}` : 'Unknown',
            `"${ticket.subject?.replace(/"/g, '""') || ''}"`,
            `"${ticket.message?.replace(/"/g, '""') || ''}"`,
            ticket.status,
            new Date(ticket.createdAt).toLocaleDateString(),
            new Date(ticket.updatedAt).toLocaleDateString()
          ].join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `resilinked-support-tickets-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        success('Support tickets exported as CSV successfully')
      } else {
        // PDF Export
        const { jsPDF } = window.jspdf
        const doc = new jsPDF()
        
        // Header
        doc.setFontSize(18)
        doc.setTextColor(99, 102, 241)
        doc.text('ResiLinked - Support Tickets Export', 14, 20)
        
        // Metadata
        doc.setFontSize(10)
        doc.setTextColor(100, 100, 100)
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)
        doc.text(`Total Tickets: ${filteredTickets.length}`, 14, 34)
        doc.text(`Status Filter: ${ticketStatusFilter === 'all' ? 'All' : ticketStatusFilter}`, 14, 40)
        
        // Table
        const tableData = filteredTickets.map(ticket => [
          ticket._id.substring(0, 8) + '...',
          ticket.user?.email || 'Unknown',
          ticket.user ? `${ticket.user.firstName} ${ticket.user.lastName}` : 'Unknown',
          ticket.subject || '',
          ticket.message || '',
          ticket.status,
          new Date(ticket.createdAt).toLocaleDateString()
        ])
        
        doc.autoTable({
          head: [['ID', 'Email', 'Name', 'Subject', 'Message', 'Status', 'Date']],
          body: tableData,
          startY: 45,
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [99, 102, 241], textColor: 255 },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          margin: { top: 45 },
          columnStyles: {
            3: { cellWidth: 30 }, // Subject
            4: { cellWidth: 40 }  // Message
          }
        })
        
        doc.save(`resilinked-support-tickets-${new Date().toISOString().split('T')[0]}.pdf`)
        success('Support tickets exported as PDF successfully')
      }
    } catch (error) {
      showError('Error exporting support tickets: ' + error.message)
    }
  }

  // Export Deleted Items
  const exportDeletedItems = (format = 'pdf') => {
    try {
      let data, headers, filename, filteredData
      
      if (deletedItemType === 'users') {
        filteredData = deletedUsers.filter(user =>
          !deletedSearchQuery ||
          user.email?.toLowerCase().includes(deletedSearchQuery.toLowerCase()) ||
          user.firstName?.toLowerCase().includes(deletedSearchQuery.toLowerCase()) ||
          user.lastName?.toLowerCase().includes(deletedSearchQuery.toLowerCase())
        )
        headers = ['User ID', 'Email', 'Name', 'User Type', 'Barangay', 'Deleted At']
        data = filteredData.map(user => [
          user._id,
          user.email,
          `${user.firstName} ${user.lastName}`,
          user.userType,
          user.barangay || 'N/A',
          new Date(user.deletedAt).toLocaleDateString()
        ])
        filename = 'deleted-users'
      } else if (deletedItemType === 'jobs') {
        filteredData = deletedJobs.filter(job =>
          !deletedSearchQuery ||
          job.title?.toLowerCase().includes(deletedSearchQuery.toLowerCase()) ||
          job.description?.toLowerCase().includes(deletedSearchQuery.toLowerCase())
        )
        headers = ['Job ID', 'Title', 'Price', 'Barangay', 'Posted By', 'Deleted At']
        data = filteredData.map(job => [
          job._id,
          job.title || '',
          job.price || '0',
          job.barangay || 'N/A',
          job.postedBy?.email || 'Unknown',
          new Date(job.deletedAt).toLocaleDateString()
        ])
        filename = 'deleted-jobs'
      } else {
        filteredData = deletedGoals.filter(goal =>
          !deletedSearchQuery ||
          goal.description?.toLowerCase().includes(deletedSearchQuery.toLowerCase())
        )
        headers = ['Goal ID', 'User Email', 'Description', 'Status', 'Deleted At']
        data = filteredData.map(goal => [
          goal._id,
          goal.userId?.email || 'Unknown',
          goal.description || '',
          goal.completed ? 'Completed' : 'Pending',
          new Date(goal.deletedAt).toLocaleDateString()
        ])
        filename = 'deleted-goals'
      }

      if (format === 'csv') {
        // CSV Export
        const csvContent = [
          headers.join(','),
          ...data.map(row => row.map(cell => 
            typeof cell === 'string' && cell.includes(',') ? `"${cell.replace(/"/g, '""')}"` : cell
          ).join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `resilinked-${filename}-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        success(`${deletedItemType} exported as CSV successfully`)
      } else {
        // PDF Export
        const { jsPDF } = window.jspdf
        const doc = new jsPDF()
        
        // Header
        doc.setFontSize(18)
        doc.setTextColor(99, 102, 241)
        doc.text(`ResiLinked - ${filename.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Export`, 14, 20)
        
        // Metadata
        doc.setFontSize(10)
        doc.setTextColor(100, 100, 100)
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)
        doc.text(`Total Items: ${filteredData.length}`, 14, 34)
        
        // Table
        doc.autoTable({
          head: [headers],
          body: data,
          startY: 40,
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [99, 102, 241], textColor: 255 },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          margin: { top: 40 }
        })
        
        doc.save(`resilinked-${filename}-${new Date().toISOString().split('T')[0]}.pdf`)
        success(`${deletedItemType} exported as PDF successfully`)
      }
    } catch (error) {
      showError('Error exporting deleted items: ' + error.message)
    }
  }

  if (loading) {
    return (
      <>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>{t('admin.loadingDashboard')}</p>
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
        <h1>Admin Dashboard</h1>
        <p>Welcome back, {user?.firstName}!</p>
        <Link to="/landing" className="back-btn">Back to Landing</Link>
      </div>

      {/* Search and Export Controls */}
      <div className="controls-section">
        <div className="search-controls">
          <input
            type="text"
            placeholder={
              currentTab === 'users' || currentTab === 'jobs' ? 'Search...' :
              currentTab === 'reports' ? 'Search reports...' :
              currentTab === 'support' ? 'Search support tickets...' :
              currentTab === 'deleted' ? 'Search deleted items...' :
              'Search...'
            }
            value={
              currentTab === 'reports' ? reportSearchQuery :
              currentTab === 'support' ? ticketSearchQuery :
              currentTab === 'deleted' ? deletedSearchQuery :
              searchQuery
            }
            onChange={(e) => {
              if (currentTab === 'reports') setReportSearchQuery(e.target.value);
              else if (currentTab === 'support') setTicketSearchQuery(e.target.value);
              else if (currentTab === 'deleted') setDeletedSearchQuery(e.target.value);
              else setSearchQuery(e.target.value);
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="search-input"
            style={{ width: '300px' }}
          />
          <button onClick={handleSearch} className="btn primary">Search</button>
        </div>
        
        {/* Filter Controls */}
        <div className="filter-controls">
          <select 
            value={barangayFilter}
            onChange={(e) => setBarangayFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Barangays</option>
            <option value="Sta. Lucia">Sta. Lucia</option>
            <option value="Sta. Teresita">Sta. Teresita</option>
            <option value="Sto. Rosario">Sto. Rosario</option>
            <option value="Other">Other</option>
          </select>
          
          {currentTab === 'users' && (
            <>
              <select 
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Roles</option>
                <option value="employee">Employees</option>
                <option value="employer">Employers</option>
              </select>
              
              <select 
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Verification</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>
            </>
          )}
          
          {currentTab === 'jobs' && (
            <select 
              value={jobStatusFilter}
              onChange={(e) => setJobStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="completed">Completed</option>
            </select>
          )}
          
          {currentTab === 'reports' && (
            <select 
              value={reportStatusFilter}
              onChange={(e) => setReportStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          )}
          
          {currentTab === 'support' && (
            <select 
              value={ticketStatusFilter}
              onChange={(e) => setTicketStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          )}
          
          {currentTab === 'deleted' && (
            <select 
              value={deletedItemType}
              onChange={(e) => {
                setDeletedItemType(e.target.value);
                loadDeletedItems(e.target.value);
              }}
              className="filter-select"
            >
              <option value="users">Deleted Users</option>
              <option value="jobs">Deleted Jobs</option>
              <option value="goals">Deleted Goals</option>
            </select>
          )}
        </div>
        
        <div className="sort-controls">
          <select 
            value={`${sortField}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-')
              handleSort(field, order)
            }}
            className="sort-select"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="firstName-asc">Name A-Z</option>
            <option value="firstName-desc">Name Z-A</option>
          </select>
          
          <button 
            onClick={() => {
              setSearchQuery('');
              setReportSearchQuery('');
              setTicketSearchQuery('');
              setDeletedSearchQuery('');
              setBarangayFilter('all');
              setRoleFilter('all');
              setVerificationFilter('all');
              setJobStatusFilter('all');
              setReportStatusFilter('all');
              setTicketStatusFilter('all');
            }} 
            className="filter-select"
            style={{ cursor: 'pointer', background: 'white', color: '#2d3748', border: '1px solid #e2e8f0', fontWeight: '500' }}
            title={t('admin.clearFilters')}
          >
            {t('admin.clearFilters')}
          </button>
        </div>
        <div className="export-controls">
          {currentTab === 'users' && (
            <>
              <button 
                onClick={() => exportData('users', 'csv')} 
                className="btn secondary"
                title="Export filtered users as CSV"
              >
                📊 Export CSV
              </button>
              <button 
                onClick={() => exportData('users', 'pdf')} 
                className="btn secondary"
                title="Export filtered users as PDF"
              >
                📄 Export PDF
              </button>
            </>
          )}
          
          {currentTab === 'jobs' && (
            <>
              <button 
                onClick={() => exportData('jobs', 'csv')} 
                className="btn secondary"
                title="Export filtered jobs as CSV"
              >
                📊 Export CSV
              </button>
              <button 
                onClick={() => exportData('jobs', 'pdf')} 
                className="btn secondary"
                title="Export filtered jobs as PDF"
              >
                📄 Export PDF
              </button>
            </>
          )}
          
          {currentTab === 'reports' && (
            <>
              <button 
                onClick={() => exportReports('csv')} 
                className="btn secondary"
                title="Export filtered reports as CSV"
              >
                📊 Export CSV
              </button>
              <button 
                onClick={() => exportReports('pdf')} 
                className="btn secondary"
                title="Export filtered reports as PDF"
              >
                📄 Export PDF
              </button>
            </>
          )}
          
          {currentTab === 'support' && (
            <>
              <button 
                onClick={() => exportSupportTickets('csv')} 
                className="btn secondary"
                title="Export filtered support tickets as CSV"
              >
                📊 Export CSV
              </button>
              <button 
                onClick={() => exportSupportTickets('pdf')} 
                className="btn secondary"
                title="Export filtered support tickets as PDF"
              >
                📄 Export PDF
              </button>
            </>
          )}
          
          {currentTab === 'deleted' && (
            <>
              <button 
                onClick={() => exportDeletedItems('csv')} 
                className="btn secondary"
                title="Export filtered deleted items as CSV"
              >
                📊 Export CSV
              </button>
              <button 
                onClick={() => exportDeletedItems('pdf')} 
                className="btn secondary"
                title="Export filtered deleted items as PDF"
              >
                📄 Export PDF
              </button>
            </>
          )}
        </div>

      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${currentTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleTabChange('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-btn ${currentTab === 'users' ? 'active' : ''}`}
          onClick={() => handleTabChange('users')}
        >
          Users
        </button>
        <button 
          className={`tab-btn ${currentTab === 'jobs' ? 'active' : ''}`}
          onClick={() => handleTabChange('jobs')}
        >
          Jobs
        </button>
        <button 
          className={`tab-btn ${currentTab === 'analytics' ? 'active' : ''}`}
          onClick={() => handleTabChange('analytics')}
        >
          Analytics
        </button>
        <button 
          className={`tab-btn ${currentTab === 'reports' ? 'active' : ''}`}
          onClick={() => handleTabChange('reports')}
        >
          Reports
        </button>
        <button 
          className={`tab-btn ${currentTab === 'support' ? 'active' : ''}`}
          onClick={() => handleTabChange('support')}
        >
          Support Tickets
        </button>
        <button 
          className={`tab-btn ${currentTab === 'deleted' ? 'active' : ''}`}
          onClick={() => handleTabChange('deleted')}
        >
          Deleted Items
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
            {/* Overview Tab */}
            {currentTab === 'overview' && (
              <div className="overview-content">
                {/* Dashboard Stats Summary */}
                <div className="overview-stats">
                  <div className="stats-grid">
                    <div className="stat-card users-card">
                      <div className="stat-icon" title="Total Users">{StatIcons.users}</div>
                      <div className="stat-info">
                        <h3>{stats.totalUsers}</h3>
                        <p>Total Users</p>
                        <span className="stat-trend">+12% this month</span>
                      </div>
                    </div>
                    <div className="stat-card jobs-card">
                      <div className="stat-icon" title="Total Jobs">{StatIcons.jobs}</div>
                      <div className="stat-info">
                        <h3>{stats.totalJobs}</h3>
                        <p>Total Jobs</p>
                        <span className="stat-trend">+8% this month</span>
                      </div>
                    </div>
                    <div className="stat-card ratings-card">
                      <div className="stat-icon" title="Total Ratings">{StatIcons.ratings}</div>
                      <div className="stat-info">
                        <h3>{analyticsData?.totalRatings ?? stats.totalRatings}</h3>
                        <p>Total Ratings</p>
                        <span className="stat-trend">{analyticsData?.ratingsTrend ?? '+15% this month'}</span>
                      </div>
                    </div>
                    <div className="stat-card reports-card">
                      <div className="stat-icon" title="Total Reports">{StatIcons.reports}</div>
                      <div className="stat-info">
                        <h3>{analyticsData?.totalReports ?? stats.totalReports}</h3>
                        <p>Total Reports</p>
                        <span className="stat-trend">{analyticsData?.reportsTrend ?? '-5% this month'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity Section */}
                <div className="overview-section">
                  <div className="section-header">
                    <h3>Recent Jobs</h3>
                    <button 
                      className="btn secondary"
                      onClick={() => setCurrentTab('jobs')}
                    >
                      View All Jobs
                    </button>
                  </div>
                  <div className="jobs-grid">
                    {jobs.length > 0 ? (
                      jobs.slice(0, 6).map(job => (
                        <div key={job._id} className="job-card">
                          <div className="job-header">
                            <h4>{job.title}</h4>
                            <div className="job-price">₱{job.price?.toLocaleString() || '0'}</div>
                          </div>
                          
                          <div className="job-meta">
                            <div className="meta-item">
                              <span className="icon">📍</span>
                              {job.barangay || job.location || 'No location'}
                            </div>
                            <div className="meta-item">
                              <span className="icon">👤</span>
                              {job.postedBy?.firstName && job.postedBy?.lastName 
                                ? `${job.postedBy.firstName} ${job.postedBy.lastName}`
                                : job.postedBy?.email || 'Unknown'}
                            </div>
                            <div className="meta-item">
                              <span className="icon">📅</span>
                              {formatDate(job.datePosted || job.createdAt, 'short')}
                            </div>
                            <div className="meta-item">
                              <span className={`status ${job.isOpen ? 'active' : 'closed'}`}>
                                {job.isOpen ? 'Open' : 'Closed'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="job-actions">
                            <button 
                              className="btn secondary"
                              onClick={() => viewJob(job._id)}
                            >
                              View
                            </button>
                            <button 
                              className="btn danger"
                              onClick={() => deleteJob(job._id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-data">
                        <p>No jobs found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {currentTab === 'users' && (
              <div className="users-content">
                {/* Users Header with Controls */}
                <div className="users-header">
                  <div className="users-summary">
                    <h3>User Management</h3>
                    <p>Total: {users.length} users | Verified: {users.filter(user => user.isVerified).length} | Unverified: {users.filter(user => !user.isVerified).length}</p>
                  </div>
                  
                  <div className="users-controls">
                    <div className="users-search">
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                        style={{ width: '300px' }}
                      />
                    </div>
                    
                    <button 
                      className="btn primary"
                      onClick={() => exportData('users', 'csv')}
                    >
                      Export Users
                    </button>
                  </div>
                </div>

                {users.length === 0 ? (
                  <div className="no-data">
                    <div className="no-data-icon">👥</div>
                    <h3>No users found</h3>
                    <p>There are no users matching your search criteria.</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile Card View */}
                    <div className="users-mobile-view">
                      {filteredUsers.map(user => (
                        <div key={user._id} className="user-mobile-card">
                          <div className="user-mobile-header">
                            <div className="user-mobile-name">
                              {user.firstName} {user.lastName}
                            </div>
                            <span className={`status-badge ${user.isVerified ? 'verified' : 'unverified'}`}>
                              {user.isVerified ? 'Verified' : 'Unverified'}
                            </span>
                          </div>
                          
                          <div className="user-mobile-details">
                            <div className="user-mobile-item">
                              <span className="label">Email:</span>
                              <span className="value">{user.email}</span>
                            </div>
                            <div className="user-mobile-item">
                              <span className="label">Type:</span>
                              <span className="user-type" data-type={user.userType}>
                                {user.userType}
                              </span>
                            </div>
                            <div className="user-mobile-item">
                              <span className="label">Barangay:</span>
                              <span className="value">{user.barangay || 'N/A'}</span>
                            </div>
                            <div className="user-mobile-item">
                              <span className="label">Joined:</span>
                              <span className="value">
                                {formatDate(user.createdAt, 'short')}
                              </span>
                            </div>
                          </div>
                          
                          <div className="user-mobile-actions">
                            <button 
                              className="action-btn view-btn"
                              onClick={() => viewUser(user._id)}
                            >
                              View
                            </button>
                            <button 
                              className="action-btn edit-btn"
                              onClick={() => editUser(user._id)}
                            >
                              Edit
                            </button>
                            <button 
                              className="action-btn toggle-btn"
                              onClick={() => toggleUserVerification(user._id, user.isVerified)}
                            >
                              {user.isVerified ? 'Disable' : 'Verify'}
                            </button>
                            <button 
                              className="action-btn delete-btn"
                              onClick={() => openDeleteUserModal(user._id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="users-table-container">
                      <table className="users-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Type</th>
                            <th>Barangay</th>
                            <th>Status</th>
                            <th>Joined</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map(user => (
                            <tr key={user._id}>
                              <td>
                                <div className="user-name">
                                  {user.firstName} {user.lastName}
                                </div>
                              </td>
                              <td>{user.email}</td>
                              <td>
                                <span className="user-type" data-type={user.userType}>
                                  {user.userType}
                                </span>
                              </td>
                              <td>{user.barangay || 'N/A'}</td>
                              <td>
                                <span className={`status-badge ${user.isVerified ? 'verified' : 'unverified'}`}>
                                  {user.isVerified ? 'Verified' : 'Unverified'}
                                </span>
                              </td>
                              <td>
                                {formatDate(user.createdAt, 'short')}
                              </td>
                              <td className="actions">
                                <button 
                                  className="action-btn view-btn"
                                  onClick={() => viewUser(user._id)}
                                >
                                  View
                                </button>
                                <button 
                                  className="action-btn edit-btn"
                                  onClick={() => editUser(user._id)}
                                >
                                  Edit
                                </button>
                                <button 
                                  className="action-btn toggle-btn"
                                  onClick={() => toggleUserVerification(user._id, user.isVerified)}
                                >
                                  {user.isVerified ? 'Disable' : 'Verify'}
                                </button>
                                <button 
                                  className="action-btn delete-btn"
                                  onClick={() => openDeleteUserModal(user._id)}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="pagination">
                    <button 
                      className={`page-btn ${pagination.page === 1 ? 'disabled' : ''}`}
                      disabled={pagination.page === 1}
                      onClick={() => handlePageChange(pagination.page - 1)}
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                      <button 
                        key={page}
                        className={`page-btn ${page === pagination.page ? 'active' : ''}`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button 
                      className={`page-btn ${pagination.page === pagination.pages ? 'disabled' : ''}`}
                      disabled={pagination.page === pagination.pages}
                      onClick={() => handlePageChange(pagination.page + 1)}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Jobs Tab */}
            {currentTab === 'jobs' && (
              <div className="jobs-content">
                {/* Jobs Header with Controls */}
                <div className="jobs-header">
                  <div className="jobs-summary">
                    <h3>Job Management</h3>
                    <p>Total: {jobs.length} jobs | Active: {jobs.filter(job => job.isOpen).length} | Closed: {jobs.filter(job => !job.isOpen).length}</p>
                  </div>
                  
                  <div className="jobs-controls">
                    <div className="jobs-search">
                      <input
                        type="text"
                        placeholder="Search jobs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                        style={{ width: '300px' }}
                      />
                    </div>
                    
                    <button 
                      className="btn primary"
                      onClick={() => exportData('jobs', 'csv')}
                    >
                      Export Jobs
                    </button>
                  </div>
                </div>

                <div className="jobs-grid">
                  {filteredJobs.length > 0 ? (
                    filteredJobs.map(job => (
                      <div key={job._id} className="job-card">
                        <div className="job-header">
                          <h4>{job.title}</h4>
                          <div className="job-price">₱{job.price?.toLocaleString() || '0'}</div>
                        </div>
                        
                        <div className="job-meta">
                          <div className="meta-item">
                            <span className="icon">📍</span>
                            {job.barangay || job.location || 'No location'}
                          </div>
                          <div className="meta-item">
                            <span className="icon">👤</span>
                            {job.postedBy?.firstName && job.postedBy?.lastName 
                              ? `${job.postedBy.firstName} ${job.postedBy.lastName}`
                              : job.postedBy?.email || 'Unknown'}
                          </div>
                          <div className="meta-item">
                            <span className="icon">📅</span>
                            {formatDate(job.datePosted || job.createdAt, 'short')}
                          </div>
                          <div className="meta-item">
                            <span className="icon">👥</span>
                            {job.applicants?.length || 0} applicants
                          </div>
                          <div className="meta-item">
                            <span className={`status ${job.isOpen ? 'active' : 'closed'}`}>
                              {job.isOpen ? 'Open' : 'Closed'}
                            </span>
                          </div>
                        </div>
                        
                        <p className="job-description">
                          {job.description?.substring(0, 100)}
                          {job.description?.length > 100 ? '...' : ''}
                        </p>
                        
                        <div className="job-actions">
                          <button 
                            className="btn secondary"
                            onClick={() => viewJob(job._id)}
                          >
                            View
                          </button>
                          <button 
                            className="btn danger"
                            onClick={() => openDeleteJobModal(job._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-data">
                      <p>No jobs found</p>
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="pagination">
                    <button 
                      className={`page-btn ${pagination.page === 1 ? 'disabled' : ''}`}
                      disabled={pagination.page === 1}
                      onClick={() => handlePageChange(pagination.page - 1)}
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                      <button 
                        key={page}
                        className={`page-btn ${page === pagination.page ? 'active' : ''}`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button 
                      className={`page-btn ${pagination.page === pagination.pages ? 'disabled' : ''}`}
                      disabled={pagination.page === pagination.pages}
                      onClick={() => handlePageChange(pagination.page + 1)}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {currentTab === 'analytics' && (
              <div className="analytics-content">
                {/* Analytics Header */}
                <div className="analytics-header">
                  <h3>Analytics Dashboard</h3>
                  <p>Comprehensive insights into your platform's performance</p>
                </div>

                {/* Key Performance Indicators */}
                <div className="kpi-section">
                  <h4>Key Performance Indicators</h4>
                  <div className="stats-grid">
                    <div className="stat-card users-card">
                      <div className="stat-icon" title="Total Users">{StatIcons.users}</div>
                      <div className="stat-info">
                        <h3>{analyticsData?.totalUsers ?? 0}</h3>
                        <p>Total Users</p>
                        <span className="stat-trend">{analyticsData?.usersTrend ?? '+0% this month'}</span>
                      </div>
                    </div>

                    <div className="stat-card jobs-card">
                      <div className="stat-icon" title="Total Jobs">{StatIcons.jobs}</div>
                      <div className="stat-info">
                        <h3>{analyticsData?.totalJobs ?? 0}</h3>
                        <p>Total Jobs</p>
                        <span className="stat-trend">{analyticsData?.jobsTrend ?? '+0% this month'}</span>
                      </div>
                    </div>

                    <div className="stat-card ratings-card">
                      <div className="stat-icon" title="Total Ratings">{StatIcons.ratings}</div>
                      <div className="stat-info">
                        <h3>{analyticsData?.totalRatings ?? 0}</h3>
                        <p>Total Ratings</p>
                        <span className="stat-trend">{analyticsData?.ratingsTrend ?? '+0% this month'}</span>
                      </div>
                    </div>

                    <div className="stat-card reports-card">
                      <div className="stat-icon" title="Total Reports">{StatIcons.reports}</div>
                      <div className="stat-info">
                        <h3>{analyticsData?.totalReports ?? 0}</h3>
                        <p>Total Reports</p>
                        <span className="stat-trend">{analyticsData?.reportsTrend ?? '+0% this month'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Analytics */}
                <div className="analytics-sections">
                  <div className="analytics-row">
                    <div className="analytics-card large">
                      <h4>User Distribution</h4>
                      <div className="chart-placeholder">
                        <div className="user-type-stats">
                          <div className="stat-row">
                            <span className="stat-label">Employees:</span>
                            <span className="stat-value">{analyticsData?.userDistribution?.employee ?? 0}</span>
                            <span className="stat-percentage">
                              {analyticsData?.userDistribution?.employeePercentage?.toFixed(1) ?? 0}%
                            </span>
                          </div>
                          <div className="stat-row">
                            <span className="stat-label">Employers:</span>
                            <span className="stat-value">{analyticsData?.userDistribution?.employer ?? 0}</span>
                            <span className="stat-percentage">
                              {analyticsData?.userDistribution?.employerPercentage?.toFixed(1) ?? 0}%
                            </span>
                          </div>
                          <div className="stat-row">
                            <span className="stat-label">Verified Users:</span>
                            <span className="stat-value">{analyticsData?.verifiedUsers?.count ?? 0}</span>
                            <span className="stat-percentage">
                              {analyticsData?.verifiedUsers?.percentage?.toFixed(1) ?? 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="analytics-card">
                      <h4>Job Statistics</h4>
                      <div className="job-stats-grid">
                        <div className="job-stat-item">
                          <div className="job-stat-number">{analyticsData?.jobStats?.active ?? 0}</div>
                          <div className="job-stat-label">Active Jobs</div>
                        </div>
                        <div className="job-stat-item">
                          <div className="job-stat-number">{analyticsData?.jobStats?.completed ?? 0}</div>
                          <div className="job-stat-label">Completed Jobs</div>
                        </div>
                        <div className="job-stat-item">
                          <div className="job-stat-number">
                            ₱{analyticsData?.jobStats?.totalValue?.toLocaleString() ?? 0}
                          </div>
                          <div className="job-stat-label">Total Value</div>
                        </div>
                        <div className="job-stat-item">
                          <div className="job-stat-number">
                            ₱{analyticsData?.jobStats?.averagePrice?.toLocaleString() ?? 0}
                          </div>
                          <div className="job-stat-label">Average Price</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="analytics-row">
                    <div className="analytics-card">
                      <h4>Gender Distribution</h4>
                      <div className="user-stats">
                        <div className="user-stat-item">
                          <div className="stat-label">♂ Male</div>
                          <div className="stat-details">
                            <span className="stat-value">{analyticsData?.genderDistribution?.male ?? 0}</span>
                            <span className="stat-percentage">
                              {analyticsData?.totalUsers > 0 ? ((analyticsData?.genderDistribution?.male / analyticsData?.totalUsers) * 100).toFixed(1) : 0}%
                            </span>
                          </div>
                        </div>
                        <div className="user-stat-item">
                          <div className="stat-label">♀ Female</div>
                          <div className="stat-details">
                            <span className="stat-value">{analyticsData?.genderDistribution?.female ?? 0}</span>
                            <span className="stat-percentage">
                              {analyticsData?.totalUsers > 0 ? ((analyticsData?.genderDistribution?.female / analyticsData?.totalUsers) * 100).toFixed(1) : 0}%
                            </span>
                          </div>
                        </div>
                        <div className="user-stat-item">
                          <div className="stat-label">⚧ Others</div>
                          <div className="stat-details">
                            <span className="stat-value">{analyticsData?.genderDistribution?.others ?? 0}</span>
                            <span className="stat-percentage">
                              {analyticsData?.totalUsers > 0 ? ((analyticsData?.genderDistribution?.others / analyticsData?.totalUsers) * 100).toFixed(1) : 0}%
                            </span>
                          </div>
                        </div>
                        <div className="user-stat-item">
                          <div className="stat-label">❓ Not Specified</div>
                          <div className="stat-details">
                            <span className="stat-value">{analyticsData?.genderDistribution?.notSpecified ?? 0}</span>
                            <span className="stat-percentage">
                              {analyticsData?.totalUsers > 0 ? ((analyticsData?.genderDistribution?.notSpecified / analyticsData?.totalUsers) * 100).toFixed(1) : 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="analytics-card">
                      <h4>Popular Skills</h4>
                      <div className="location-stats">
                        {analyticsData?.popularSkills?.slice(0, 10).map((skill, index) => (
                          <div key={skill.skill} className="location-stat-row">
                            <span className="location-name">{index + 1}. {skill.skill}</span>
                            <span className="location-count">{skill.count} users</span>
                          </div>
                        ))}
                        {(!analyticsData?.popularSkills || analyticsData.popularSkills.length === 0) && (
                          <div style={{ textAlign: 'center', color: '#999', padding: '1rem' }}>
                            No skills data available
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="analytics-row">
                    <div className="analytics-card full-width">
                      <h4>Popular Jobs (By Applicants)</h4>
                      <div className="job-list-analytics">
                        {analyticsData?.popularJobs?.map((job, index) => (
                          <div key={job._id} className="job-item-analytics">
                            <div className="job-rank">{index + 1}</div>
                            <div className="job-details-analytics">
                              <div className="job-title-analytics">{job.title}</div>
                              <div className="job-meta-analytics">
                                <span>📍 {job.barangay}</span>
                                <span>💰 {job.price?.toLocaleString()}</span>
                                <span>👥 {job.applicantCount} applicants</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {(!analyticsData?.popularJobs || analyticsData.popularJobs.length === 0) && (
                          <div style={{ textAlign: 'center', color: '#999', padding: '1rem' }}>
                            No popular jobs data available
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="analytics-row">
                    <div className="analytics-card">
                      <h4>Popular Barangays</h4>
                      <div className="location-stats">
                        {analyticsData?.popularBarangays?.slice(0, 5).map((item) => (
                          <div key={item.barangay} className="location-stat-row">
                            <span className="location-name">{item.barangay}</span>
                            <span className="location-count">{item.count} jobs</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="analytics-card">
                      <h4>Recent Activity</h4>
                      <div className="activity-feed">
                        {analyticsData?.recentActivity?.slice(0, 4).map((activity) => (
                          <div key={activity._id} className="activity-item">
                            <span className="activity-icon">{activity.type === 'user' ? '👤' : '💼'}</span>
                            <span className="activity-text">{activity.description}</span>
                            <span className="activity-time">{formatDate(activity.createdAt, 'short')}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="analytics-card">
                      <h4>System Performance</h4>
                      <div className="performance-metrics">
                        <div className="metric-item">
                          <span className="metric-label">Response Time:</span>
                          <span className="metric-value good">142ms</span>
                        </div>
                        <div className="metric-item">
                          <span className="metric-label">Uptime:</span>
                          <span className="metric-value excellent">99.8%</span>
                        </div>
                        <div className="metric-item">
                          <span className="metric-label">Error Rate:</span>
                          <span className="metric-value good">0.2%</span>
                        </div>
                        <div className="metric-item">
                          <span className="metric-label">Active Sessions:</span>
                          <span className="metric-value">23</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Export Options - Centered */}
                <div className="analytics-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '2rem' }}>
                  <h4 style={{ textAlign: 'center' }}>Export Analytics</h4>
                  <div className="export-buttons" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button 
                      className="btn secondary"
                      onClick={() => exportData('users', 'csv')}
                    >
                      Export User Data
                    </button>
                    <button 
                      className="btn secondary"
                      onClick={() => exportData('jobs', 'csv')}
                    >
                      Export Job Data
                    </button>
                    <button 
                      className="btn primary"
                      onClick={() => exportData('analytics', 'pdf')}
                    >
                      Generate Report
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Reports Tab */}
            {currentTab === 'reports' && (
              <div className="reports-content">
                {/* Reports Header */}
                <div className="reports-header">
                  <h3>User & Job Reports</h3>
                  <p>Manage reports submitted by users for policy violations</p>
                </div>

                {/* Reports List */}
                {(() => {
                  const filteredReports = reports.filter(report => {
                    const matchesStatus = reportStatusFilter === 'all' || report.status === reportStatusFilter
                    const matchesSearch = !reportSearchQuery || 
                      report.reason?.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
                      report.reporter?.email?.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
                      report.reporter?.firstName?.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
                      report.reporter?.lastName?.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
                      report.reportedUser?.email?.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
                      report.reportedUser?.firstName?.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
                      report.reportedUser?.lastName?.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
                      report.reportedJob?.title?.toLowerCase().includes(reportSearchQuery.toLowerCase())
                    return matchesStatus && matchesSearch
                  })

                  return filteredReports.length === 0 ? (
                    <div className="no-data">
                      <p>No reports found</p>
                    </div>
                  ) : (
                    <div className="reports-table-container">
                      <table className="reports-table">
                        <thead>
                          <tr>
                            <th>Reporter</th>
                            <th>Type</th>
                            <th>Reported Item</th>
                            <th>Reason</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredReports.map(report => (
                          <tr key={report._id}>
                            <td>
                              <div className="user-cell">
                                <strong>{report.reporter?.firstName} {report.reporter?.lastName}</strong>
                                <small>{report.reporter?.email}</small>
                              </div>
                            </td>
                            <td>
                              <span className={`report-type-badge ${report.reportedUser ? 'user' : 'job'}`}>
                                {report.reportedUser ? '👤 User' : '💼 Job'}
                              </span>
                            </td>
                            <td>
                              {report.reportedUser ? (
                                <div className="reported-cell">
                                  <strong>{report.reportedUser.firstName} {report.reportedUser.lastName}</strong>
                                  <small>{report.reportedUser.email}</small>
                                </div>
                              ) : report.reportedJob ? (
                                <div className="reported-cell">
                                  <strong>{report.reportedJob.title}</strong>
                                  <small>Posted by: {report.reportedJob.postedBy?.firstName || 'Unknown'}</small>
                                </div>
                              ) : (
                                <span className="text-muted">Item deleted</span>
                              )}
                            </td>
                            <td>
                              <div className="reason-cell" title={report.reason}>
                                {report.reason.length > 50 
                                  ? report.reason.substring(0, 50) + '...' 
                                  : report.reason}
                              </div>
                            </td>
                            <td>
                              <span className={`status-badge ${report.status}`}>
                                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                              </span>
                            </td>
                            <td>
                              <small>{formatDate(report.createdAt, 'short')}</small>
                            </td>
                            <td>
                              <div className="action-buttons">
                                {report.status === 'pending' && (
                                  <>
                                    <button
                                      key="resolve"
                                      className="btn-action resolve"
                                      onClick={() => handleReportStatusUpdate(report._id, 'resolved')}
                                      title="Mark as Resolved"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      key="dismiss"
                                      className="btn-action dismiss"
                                      onClick={() => handleReportStatusUpdate(report._id, 'dismissed')}
                                      title="Dismiss Report"
                                    >
                                      ✕
                                    </button>
                                  </>
                                )}
                                {report.status !== 'pending' && (
                                  <button
                                    key="reopen"
                                    className="btn-action reopen"
                                    onClick={() => handleReportStatusUpdate(report._id, 'pending')}
                                    title="Reopen Report"
                                  >
                                    ↻
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  )
                })()}
              </div>
            )}
            
            {/* Support Tickets Tab */}
            {currentTab === 'support' && (
              <div className="support-tickets-content">
                {/* Support Tickets Header */}
                <div className="support-header">
                  <h3>Support Tickets</h3>
                  <p>Manage support requests from users</p>
                </div>

                {/* Support Tickets List */}
                {(() => {
                  const filteredTickets = supportTickets.filter(ticket => {
                    const matchesStatus = ticketStatusFilter === 'all' || ticket.status === ticketStatusFilter
                    const matchesSearch = !ticketSearchQuery ||
                      ticket.subject?.toLowerCase().includes(ticketSearchQuery.toLowerCase()) ||
                      ticket.message?.toLowerCase().includes(ticketSearchQuery.toLowerCase()) ||
                      ticket.user?.email?.toLowerCase().includes(ticketSearchQuery.toLowerCase()) ||
                      ticket.user?.firstName?.toLowerCase().includes(ticketSearchQuery.toLowerCase()) ||
                      ticket.user?.lastName?.toLowerCase().includes(ticketSearchQuery.toLowerCase())
                    return matchesStatus && matchesSearch
                  })

                  return filteredTickets.length === 0 ? (
                    <div className="no-data">
                      <p>No support tickets found</p>
                    </div>
                  ) : (
                    <div className="support-table-container">
                    <table className="support-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Subject</th>
                          <th>Message</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTickets.map(ticket => (
                          <tr key={ticket._id}>
                            <td>
                              <strong>{ticket.name}</strong>
                              {ticket.user && (
                                <small style={{ display: 'block', color: '#666' }}>
                                  User ID: {ticket.user._id || ticket.user}
                                </small>
                              )}
                            </td>
                            <td>{ticket.email}</td>
                            <td>
                              <span className="subject-badge" style={{ 
                                padding: '4px 8px', 
                                borderRadius: '4px', 
                                background: '#e3f2fd',
                                fontSize: '0.85rem'
                              }}>
                                {ticket.subject}
                              </span>
                            </td>
                            <td>
                              <div className="message-cell" title={ticket.message}>
                                {ticket.message.length > 60 
                                  ? ticket.message.substring(0, 60) + '...' 
                                  : ticket.message}
                              </div>
                            </td>
                            <td>
                              <span className={`priority-badge ${ticket.priority || 'medium'}`} style={{
                                padding: '4px 10px',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                background: 
                                  ticket.priority === 'urgent' ? '#ff1744' :
                                  ticket.priority === 'high' ? '#ff6f00' :
                                  ticket.priority === 'low' ? '#00c853' : '#ffa726',
                                color: 'white'
                              }}>
                                {ticket.priority ? ticket.priority.toUpperCase() : 'MEDIUM'}
                              </span>
                            </td>
                            <td>
                              <span className={`status-badge ${ticket.status}`} style={{
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '0.85rem',
                                fontWeight: '500'
                              }}>
                                {ticket.status === 'in-progress' ? 'In Progress' : 
                                 ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                              </span>
                            </td>
                            <td>
                              <small>{formatDate(ticket.createdAt, 'short')}</small>
                            </td>
                            <td>
                              <div className="action-buttons">
                                {ticket.status === 'open' && (
                                  <button
                                    key="in-progress"
                                    className="btn-action"
                                    onClick={() => handleTicketStatusUpdate(ticket._id, 'in-progress')}
                                    title="Mark as In Progress"
                                    style={{ background: '#ffa726', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}
                                  >
                                    ▶️
                                  </button>
                                )}
                                {(ticket.status === 'open' || ticket.status === 'in-progress') && (
                                  <button
                                    key="resolve"
                                    className="btn-action resolve"
                                    onClick={() => handleTicketStatusUpdate(ticket._id, 'resolved')}
                                    title="Mark as Resolved"
                                    style={{ background: '#4caf50', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}
                                  >
                                    ✓
                                  </button>
                                )}
                                {ticket.status === 'resolved' && (
                                  <button
                                    key="close"
                                    className="btn-action"
                                    onClick={() => handleTicketStatusUpdate(ticket._id, 'closed')}
                                    title="Close Ticket"
                                    style={{ background: '#757575', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}
                                  >
                                    ✕
                                  </button>
                                )}
                                {ticket.status === 'closed' && (
                                  <button
                                    key="reopen"
                                    className="btn-action reopen"
                                    onClick={() => handleTicketStatusUpdate(ticket._id, 'open')}
                                    title="Reopen Ticket"
                                    style={{ background: '#2196f3', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}
                                  >
                                    ↻
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  )
                })()}
              </div>
            )}
            
            {/* Deleted Items Tab */}
            {currentTab === 'deleted' && (
              <div className="deleted-items-content">
                {/* Deleted Items Header */}
                <div className="deleted-items-header">
                  <h3>Deleted Items</h3>
                  <p>Manage soft-deleted items across the platform</p>
                </div>

                {/* Deleted Users */}
                {deletedItemType === 'users' && (() => {
                  const filteredUsers = deletedUsers.filter(user =>
                    !deletedSearchQuery ||
                    user.email?.toLowerCase().includes(deletedSearchQuery.toLowerCase()) ||
                    user.firstName?.toLowerCase().includes(deletedSearchQuery.toLowerCase()) ||
                    user.lastName?.toLowerCase().includes(deletedSearchQuery.toLowerCase())
                  )

                  return (
                    <div className="deleted-users">
                      <h4>Deleted Users <span className="count-badge">{filteredUsers.length}</span></h4>
                      
                      {filteredUsers.length === 0 ? (
                        <div className="no-data">
                          <p>No deleted users found</p>
                        </div>
                      ) : (
                        <div className="deleted-items-table-container">
                          <table className="deleted-items-table">
                            <thead>
                              <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Type</th>
                                <th>Barangay</th>
                                <th>Deleted At</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredUsers.map(user => (
                              <tr key={user._id} className="deleted-item">
                                <td>
                                  <div className="user-name">
                                    {user.firstName} {user.lastName}
                                  </div>
                                </td>
                                <td>{user.email}</td>
                                <td>
                                  <span className="user-type" data-type={user.userType}>
                                    {user.userType}
                                  </span>
                                </td>
                                <td>{user.barangay || 'N/A'}</td>
                                <td>
                                  {user.deletedAt ? formatDate(user.deletedAt, 'short') : 'N/A'}
                                </td>
                                <td className="actions">
                                  <button 
                                    className="action-btn restore-btn"
                                    onClick={() => openRestoreModal(user._id, 'users')}
                                  >
                                    Restore
                                  </button>
                                  <button 
                                    className="action-btn delete-permanent-btn"
                                    onClick={() => openPermanentDeleteModal(user._id, 'users')}
                                  >
                                    Delete Permanently
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                  )
                })()}

                {/* Deleted Jobs */}
                {deletedItemType === 'jobs' && (() => {
                  const filteredJobs = deletedJobs.filter(job =>
                    !deletedSearchQuery ||
                    job.title?.toLowerCase().includes(deletedSearchQuery.toLowerCase()) ||
                    job.description?.toLowerCase().includes(deletedSearchQuery.toLowerCase())
                  )

                  return (
                    <div className="deleted-jobs">
                      <h4>Deleted Jobs <span className="count-badge">{filteredJobs.length}</span></h4>
                      
                      {filteredJobs.length === 0 ? (
                        <div className="no-data">
                          <p>No deleted jobs found</p>
                        </div>
                      ) : (
                        <div className="deleted-items-grid">
                          {filteredJobs.map(job => (
                          <div key={job._id} className="deleted-job-card">
                            <div className="job-header">
                              <h4>{job.title}</h4>
                              <div className="job-price">₱{job.price?.toLocaleString() || '0'}</div>
                            </div>
                            
                            <div className="job-meta">
                              <div className="meta-item">
                                <span className="icon">📍</span>
                                {job.barangay || job.location || 'No location'}
                              </div>
                              <div className="meta-item">
                                <span className="icon">👤</span>
                                {job.postedBy?.firstName && job.postedBy?.lastName 
                                  ? `${job.postedBy.firstName} ${job.postedBy.lastName}`
                                  : job.postedBy?.email || 'Unknown'}
                              </div>
                              <div className="meta-item">
                                <span className="icon">📅</span>
                                {job.deletedAt ? formatDate(job.deletedAt, 'short') : 'N/A'}
                              </div>
                              <div className="meta-item">
                                <span className="icon">🗑️</span>
                                Deleted
                              </div>
                            </div>
                            
                            <div className="job-actions">
                              <button 
                                className="btn secondary restore-btn"
                                onClick={() => openRestoreModal(job._id, 'jobs')}
                              >
                                Restore
                              </button>
                              <button 
                                className="btn danger delete-permanent-btn"
                                onClick={() => openPermanentDeleteModal(job._id, 'jobs')}
                              >
                                Delete Permanently
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  )
                })()}

                {/* Deleted Goals */}
                {deletedItemType === 'goals' && (() => {
                  const filteredGoals = deletedGoals.filter(goal =>
                    !deletedSearchQuery ||
                    goal.description?.toLowerCase().includes(deletedSearchQuery.toLowerCase())
                  )

                  return (
                    <div className="deleted-goals">
                      <h4>Deleted Goals <span className="count-badge">{filteredGoals.length}</span></h4>
                      
                      {filteredGoals.length === 0 ? (
                        <div className="no-data">
                          <p>No deleted goals found</p>
                        </div>
                      ) : (
                        <div className="deleted-items-table-container">
                          <table className="deleted-items-table">
                            <thead>
                              <tr>
                                <th>Description</th>
                                <th>Target</th>
                                <th>Progress</th>
                              <th>Owner</th>
                              <th>Deleted At</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredGoals.map(goal => (
                              <tr key={goal._id} className="deleted-item">
                                <td>
                                  <div className="goal-title">
                                    {goal.description || 'No description'}
                                  </div>
                                </td>
                                <td>₱{goal.targetAmount?.toLocaleString() || '0'}</td>
                                <td>
                                  {goal.currentAmount && goal.targetAmount 
                                    ? ((goal.currentAmount / goal.targetAmount) * 100).toFixed(1) 
                                    : '0'}%
                                </td>
                                <td>
                                  {goal.user?.firstName} {goal.user?.lastName}
                                </td>
                                <td>
                                  {goal.deletedAt ? formatDate(goal.deletedAt, 'short') : 'N/A'}
                                </td>
                                <td className="actions">
                                  <button 
                                    className="action-btn restore-btn"
                                    onClick={() => openRestoreModal(goal._id, 'goals')}
                                  >
                                    Restore
                                  </button>
                                  <button 
                                    className="action-btn delete-permanent-btn"
                                    onClick={() => openPermanentDeleteModal(goal._id, 'goals')}
                                  >
                                    Delete Permanently
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                  )
                })()}
              </div>
            )}
          </>
        )}
      </div>

      {/* User Modal */}
      {userModal.show && (
        <UserModal 
          user={userModal.user}
          type={userModal.type}
          onClose={() => setUserModal({ show: false, user: null, type: 'view' })}
          onSave={saveUser}
        />
      )}

      {/* Job Modal */}
      {jobModal.show && (
        <JobModal 
          job={jobModal.job}
          type={jobModal.type}
          onClose={() => setJobModal({ show: false, job: null, type: 'view' })}
        />
      )}

      {/* Delete User Confirmation Modal */}
      {showDeleteUserModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteUserModal(false)}>
          <div className="modal-content confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete User</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this user?</p>
              <p className="warning-text">This action can be undone later from the Deleted Items section.</p>
            </div>
            <div className="modal-actions">
              <button className="btn secondary" onClick={() => setShowDeleteUserModal(false)}>
                Cancel
              </button>
              <button className="btn danger" onClick={deleteUser}>
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Job Confirmation Modal */}
      {showDeleteJobModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteJobModal(false)}>
          <div className="modal-content confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Job</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this job?</p>
              <p className="warning-text">This action can be undone later from the Deleted Items section.</p>
            </div>
            <div className="modal-actions">
              <button className="btn secondary" onClick={() => setShowDeleteJobModal(false)}>
                Cancel
              </button>
              <button className="btn danger" onClick={deleteJob}>
                Delete Job
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Item Confirmation Modal */}
      {showRestoreModal && (
        <div className="modal-overlay" onClick={() => setShowRestoreModal(false)}>
          <div className="modal-content confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Restore {itemToRestore.type ? itemToRestore.type.slice(0, -1).charAt(0).toUpperCase() + itemToRestore.type.slice(0, -1).slice(1) : 'Item'}</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to restore this {itemToRestore.type ? itemToRestore.type.slice(0, -1) : 'item'}?</p>
              <div className="info-box">
                <p><strong>This action will:</strong></p>
                <ul>
                  <li>Make this {itemToRestore.type ? itemToRestore.type.slice(0, -1) : 'item'} visible again in the system</li>
                  <li>Notify the owner that their {itemToRestore.type ? itemToRestore.type.slice(0, -1) : 'item'} has been restored</li>
                  <li>Allow normal interactions with this {itemToRestore.type ? itemToRestore.type.slice(0, -1) : 'item'}</li>
                </ul>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn secondary" onClick={() => setShowRestoreModal(false)}>
                Cancel
              </button>
              <button className="btn primary" onClick={restoreItem}>
                Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Confirmation Modal */}
      {showPermanentDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowPermanentDeleteModal(false)}>
          <div className="modal-content confirmation-modal danger-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header danger-header">
              <h3>š ï¸ Permanent Deletion Warning</h3>
            </div>
            <div className="modal-body">
              <p className="danger-text">
                You are about to <strong>PERMANENTLY DELETE</strong> this {itemToDeletePermanently.type ? itemToDeletePermanently.type.slice(0, -1) : 'item'}.
              </p>
              <div className="warning-box">
                <p><strong>š ï¸ This action:</strong></p>
                <ul>
                  <li><strong>CANNOT be undone</strong></li>
                  <li>Will remove <strong>ALL data</strong> related to this {itemToDeletePermanently.type ? itemToDeletePermanently.type.slice(0, -1) : 'item'}</li>
                  <li>Is only available to administrators</li>
                </ul>
              </div>
              <p className="confirmation-question">Are you absolutely sure you want to continue?</p>
            </div>
            <div className="modal-actions">
              <button className="btn secondary" onClick={() => setShowPermanentDeleteModal(false)}>
                Cancel
              </button>
              <button className="btn danger-strong" onClick={permanentlyDeleteItem}>
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

  <style>{`
        .dashboard-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        /* Deleted Items Styles */
        .deleted-items-header {
          margin-bottom: 1.5rem;
        }
        
        .deleted-items-header h3 {
          margin: 0;
          color: #2b6cb0;
          font-size: 1.8rem;
        }
        
        .deleted-items-header p {
          margin: 0.5rem 0;
          color: #666;
        }
        
        .deleted-items-selector {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          padding: 0.5rem;
          background: #f7fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        
        .selector-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          background: transparent;
          color: #4a5568;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .selector-btn.active {
          background: #2b6cb0;
          color: white;
          font-weight: 600;
        }
        
        .selector-btn:not(.active):hover {
          background: #e2e8f0;
          color: #2d3748;
        }
        
        .count-badge {
          background: #e2e8f0;
          color: #4a5568;
          padding: 0.25rem 0.75rem;
          border-radius: 16px;
          font-size: 0.875rem;
          margin-left: 0.5rem;
        }
        
        .deleted-items-table-container {
          overflow-x: auto;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          margin-bottom: 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .deleted-items-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .deleted-items-table th {
          background: #f7fafc;
          padding: 0.875rem 1rem;
          text-align: left;
          font-weight: 600;
          color: #4a5568;
          border-bottom: 2px solid #e2e8f0;
        }
        
        .deleted-items-table td {
          padding: 0.875rem 1rem;
          border-bottom: 1px solid #e2e8f0;
          color: #2d3748;
        }
        
        .deleted-item:hover {
          background: #f7fafc;
        }
        
        .deleted-items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .deleted-job-card {
          background: white;
          border-radius: 8px;
          padding: 1.25rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
        }
        
        .action-btn.restore-btn {
          background: #3182ce;
          color: white;
          width: auto;
          min-width: 80px;
          padding: 0.4rem 0.75rem;
          font-weight: 600;
        }
        
        .action-btn.restore-btn:hover {
          background: #2b6cb0;
        }
        
        .action-btn.delete-permanent-btn {
          background: #e53e3e;
          color: white;
          width: auto;
          min-width: 140px;
          padding: 0.4rem 0.75rem;
          font-weight: 600;
        }
        
        .action-btn.delete-permanent-btn:hover {
          background: #c53030;
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
          background: linear-gradient(135deg, #2b6cb0 0%, #1a365d 100%);
          color: white;
          padding: 1.5rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          margin-right: 20px;
          flex-shrink: 0;
          background-color: rgba(255, 255, 255, 0.2);
          color: #fff;
          transition: all 0.3s ease;
        }

        .stat-icon svg {
          width: 36px;
          height: 36px;
        }

        .stat-info {
          flex-grow: 1;
        }

        .stat-info h3 {
          margin: 0;
          font-size: 2rem;
          font-weight: bold;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          color: white;
        }

        .stat-info p {
          margin: 0.5rem 0;
          opacity: 1;
          font-size: 0.9rem;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          color: rgba(255, 255, 255, 0.95);
        }

        .stat-trend {
          font-size: 0.8rem;
          background: rgba(255, 255, 255, 0.9);
          color: #2b6cb0;
          padding: 0.3rem 0.6rem;
          border-radius: 12px;
          display: inline-block;
          font-weight: 600;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        /* Specific card color variants */
        .stat-card.users-card {
          background: linear-gradient(135deg, #4299e1 0%, #2b6cb0 100%);
        }

        .stat-card.jobs-card {
          background: linear-gradient(135deg, #48bb78 0%, #2f855a 100%);
        }

        .stat-card.ratings-card {
          background: linear-gradient(135deg, #ed8936 0%, #c05621 100%);
        }

        .stat-card.reports-card {
          background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
        }

        .controls-section {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          align-items: center;
          background: white;
          padding: 1rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }

        .search-controls {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .search-input {
          width: 300px;
          padding: 0.375rem 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 0.875rem;
        }

        .filter-controls {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          align-items: center;
        }

        .filter-select {
          padding: 0.375rem 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 0.875rem;
          background: white;
          min-width: 150px;
          cursor: pointer;
        }

        .filter-select:hover {
          border-color: #cbd5e1;
        }

        .sort-select {
          padding: 0.375rem 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 0.875rem;
          background: white;
        }

        .export-controls {
          display: flex;
          gap: 0.5rem;
        }

        .btn {
          padding: 0.375rem 0.75rem;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background-color 0.2s;
          text-decoration: none;
          display: inline-block;
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

        .tab-navigation {
          background: white;
          border-radius: 12px 12px 0 0;
          display: flex;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          border-bottom: none;
        }

        .tab-btn {
          flex: 1;
          padding: 1rem 1.5rem;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
          color: #4a5568;
          transition: all 0.2s;
          border-radius: 12px 12px 0 0;
          position: relative;
          border-bottom: 2px solid transparent;
        }

        .tab-btn:first-child {
          border-radius: 12px 0 0 0;
        }

        .tab-btn:last-child {
          border-radius: 0 12px 0 0;
        }

        .tab-btn.active {
          background: #2b6cb0;
          color: white;
          font-weight: 600;
          border-bottom: 2px solid #2b6cb0;
        }

        .tab-btn:not(.active):hover {
          background: #f7fafc;
          color: #2d3748;
          border-bottom: 2px solid #cbd5e0;
        }

        .tab-btn:not(.active) {
          border-bottom: 2px solid #e2e8f0;
        }

        .tab-content {
          background: white;
          border-radius: 0 0 12px 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          border-top: none;
          padding: 1.5rem;
          min-height: 300px;
        }

        .users-mobile-view {
          display: none;
        }

        .user-mobile-card {
          background: white;
          border-radius: 6px;
          padding: 0.875rem;
          margin-bottom: 0.75rem;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }

        .user-mobile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
          padding-bottom: 0.375rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .user-mobile-name {
          font-weight: 600;
          color: #2d3748;
          font-size: 0.9rem;
        }

        .user-mobile-details {
          margin-bottom: 0.75rem;
        }

        .user-mobile-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.375rem;
        }

        .user-mobile-item .label {
          font-weight: 500;
          color: #4a5568;
          font-size: 0.8rem;
        }

        .user-mobile-item .value {
          color: #2d3748;
          font-size: 0.8rem;
        }

        .user-mobile-actions {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
        }
        
        .user-mobile-actions .action-btn {
          width: 100%;
          min-width: unset;
          padding: 0.4rem 0.5rem;
        }

        .users-table-container {
          overflow-x: auto;
          margin-bottom: 1.5rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }

        .users-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 800px;
          font-size: 0.875rem;
        }

        .users-table th,
        .users-table td {
          padding: 0.5rem 0.75rem;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
          white-space: nowrap;
          vertical-align: middle;
        }

        .users-table th {
          background: #f8fafc;
          font-weight: 600;
          color: #2d3748;
          position: sticky;
          top: 0;
          z-index: 10;
          border-bottom: 2px solid #e2e8f0;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.025em;
          padding: 0.75rem;
        }

        .users-table tbody tr:hover {
          background: #f8fafc;
        }

        .users-table tbody tr:last-child td {
          border-bottom: none;
        }

        .user-name {
          font-weight: 500;
          color: #2d3748;
          min-width: 120px;
          font-size: 0.875rem;
        }

        .user-type {
          background: #e2e8f0;
          color: #2d3748;
          padding: 0.125rem 0.5rem;
          border-radius: 8px;
          font-size: 0.75rem;
          text-transform: capitalize;
          font-weight: 500;
          display: inline-block;
          min-width: 60px;
          text-align: center;
        }

        .user-type[data-type="admin"] {
          background: #fed7d7;
          color: #c53030;
        }

        .user-type[data-type="employer"] {
          background: #bee3f8;
          color: #2b6cb0;
        }

        .user-type[data-type="employee"] {
          background: #c6f6d5;
          color: #276749;
        }

        .status-badge {
          padding: 0.125rem 0.5rem;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 500;
          display: inline-block;
          min-width: 70px;
          text-align: center;
        }

        .status-badge.verified {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #10b981;
        }

        .status-badge.unverified {
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #f59e0b;
        }

        .actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          min-width: 240px;
          justify-content: flex-start;
        }

        .action-btn {
          padding: 0.25rem 0.5rem;
          border: none;
          border-radius: 4px;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
          width: 60px;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .action-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
        }

        .action-btn.view-btn {
          background: #f0f9ff;
          color: #0369a1;
          border: 1px solid #0ea5e9;
        }

        .action-btn.view-btn:hover {
          background: #e0f2fe;
          color: #0c4a6e;
        }

        .action-btn.edit-btn {
          background: #fffbeb;
          color: #92400e;
          border: 1px solid #f59e0b;
        }

        .action-btn.edit-btn:hover {
          background: #fef3c7;
          color: #78350f;
        }

        .action-btn.toggle-btn {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #22c55e;
        }

        .action-btn.toggle-btn:hover {
          background: #dcfce7;
          color: #14532d;
        }

        .action-btn.delete-btn {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #ef4444;
        }

        .action-btn.delete-btn:hover {
          background: #fee2e2;
          color: #b91c1c;
        }

        .jobs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .job-card {
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 1.5rem;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .job-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .job-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .job-header h4 {
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
          display: inline-block;
          white-space: nowrap;
          min-width: 60px;
          text-align: center;
        }

        .job-meta {
          margin-bottom: 1rem;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

       

        .icon {
          font-size: 1rem;
          width: 16px;
          text-align: center;
          flex-shrink: 0;
        }

        .status {
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
          display: inline-block;
          min-width: 50px;
          text-align: center;
        }

        .status.active {
          background: #e6fffa;
          color: #00695c;
          border: 1px solid #4fd1c7;
        }

        .status.closed {
          background: #fed7d7;
          color: #c53030;
          border: 1px solid #fc8181;
        }

        .job-description {
          color: #4a5568;
          margin-bottom: 1rem;
          line-height: 1.5;
          font-size: 0.9rem;
        }

        .job-actions {
          display: flex;
          gap: 0.5rem;
        }

        .pagination {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 2rem;
        }

        .page-btn {
          padding: 0.5rem 1rem;
          border: 1px solid #e2e8f0;
          background: white;
          color: #2d3748;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .page-btn:hover:not(.disabled) {
          background: #f7fafc;
        }

        .page-btn.active {
          background: #2b6cb0;
          color: white;
          border-color: #2b6cb0;
        }

        .page-btn.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .analytics-content {
          text-align: center;
        }

        /* Reports Styles */
        .reports-content {
          padding: 1rem;
        }

        .reports-header {
          margin-bottom: 2rem;
          text-align: center;
        }

        .reports-header h3 {
          color: #2b6cb0;
          margin-bottom: 0.5rem;
        }

        .reports-header p {
          color: #666;
        }

        .reports-filter {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
          padding: 1rem;
          background: #f7fafc;
          border-radius: 8px;
        }

        .reports-filter label {
          font-weight: 600;
          color: #2d3748;
        }

        .filter-select {
          padding: 0.5rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 6px;
          font-size: 1rem;
          background: white;
          cursor: pointer;
        }

        .report-count {
          margin-left: auto;
          color: #666;
          font-weight: 500;
        }

        .reports-table-container {
          overflow-x: auto;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .reports-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
        }

        .reports-table thead {
          background: #2b6cb0;
          color: white;
        }

        .reports-table th {
          padding: 1rem;
          text-align: left;
          font-weight: 600;
        }

        .reports-table td {
          padding: 1rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .reports-table tbody tr:hover {
          background: #f7fafc;
        }

        .user-cell {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .user-cell strong {
          color: #2d3748;
        }

        .user-cell small {
          color: #718096;
          font-size: 0.875rem;
        }

        .report-type-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .report-type-badge.user {
          background: #bee3f8;
          color: #2c5282;
        }

        .report-type-badge.job {
          background: #c6f6d5;
          color: #22543d;
        }

        .reported-cell {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .reported-cell strong {
          color: #2d3748;
        }

        .reported-cell small {
          color: #718096;
          font-size: 0.875rem;
        }

        .reason-cell {
          max-width: 300px;
          word-wrap: break-word;
          color: #4a5568;
        }

        .status-badge {
          display: inline-block;
          padding: 0.35rem 0.75rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: capitalize;
        }

        .status-badge.pending {
          background: #fef3c7;
          color: #92400e;
        }

        .status-badge.resolved {
          background: #d1fae5;
          color: #065f46;
        }

        .status-badge.dismissed {
          background: #fee2e2;
          color: #991b1b;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .btn-action {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: bold;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-action.resolve {
          background: #10b981;
          color: white;
        }

        .btn-action.resolve:hover {
          background: #059669;
          transform: scale(1.1);
        }

        .btn-action.dismiss {
          background: #ef4444;
          color: white;
        }

        .btn-action.dismiss:hover {
          background: #dc2626;
          transform: scale(1.1);
        }

        .btn-action.reopen {
          background: #f59e0b;
          color: white;
        }

        .btn-action.reopen:hover {
          background: #d97706;
          transform: scale(1.1);
        }

        .text-muted {
          color: #a0aec0;
          font-style: italic;
        }

        .analytics-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-top: 2rem;
        }

        .analytics-card {
          background: #f7fafc;
          padding: 2rem;
          border-radius: 8px;
          border: 2px solid #e2e8f0;
        }

        .analytics-card h4 {
          margin: 0 0 1rem 0;
          color: #2b6cb0;
        }

        .analytics-card p {
          margin: 0;
          color: #666;
        }

        /* Enhanced Overview Styles */
        .overview-stats {
          margin-bottom: 2rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: linear-gradient(135deg, #2b6cb0 0%, #1a365d 100%);
          color: white;
          padding: 1.5rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          margin-right: 20px;
          flex-shrink: 0;
          background-color: rgba(255, 255, 255, 0.2);
          color: #fff;
          transition: all 0.3s ease;
        }

        .stat-icon svg {
          width: 36px;
          height: 36px;
        }

        .stat-info {
          flex-grow: 1;
        }

        .stat-info h3 {
          margin: 0;
          font-size: 2rem;
          font-weight: bold;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          color: white;
        }

        .stat-info p {
          margin: 0.5rem 0;
          opacity: 1;
          font-size: 0.9rem;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          color: rgba(255, 255, 255, 0.95);
        }

        .stat-trend {
          font-size: 0.8rem;
          background: rgba(255, 255, 255, 0.9);
          color: #2b6cb0;
          padding: 0.3rem 0.6rem;
          border-radius: 12px;
          display: inline-block;
          font-weight: 600;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        /* Specific card color variants */
        .stat-card.users-card {
          background: linear-gradient(135deg, #4299e1 0%, #2b6cb0 100%);
        }

        .stat-card.jobs-card {
          background: linear-gradient(135deg, #48bb78 0%, #2f855a 100%);
        }

        .stat-card.ratings-card {
          background: linear-gradient(135deg, #ed8936 0%, #c05621 100%);
        }

        .stat-card.reports-card {
          background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
        }

        .overview-section {
          margin-bottom: 2rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .section-header h3 {
          margin: 0;
          color: #2b6cb0;
        }

        .quick-actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .quick-action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1.5rem;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          color: #2d3748;
        }

        .quick-action-btn:hover {
          border-color: #2b6cb0;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(43, 108, 176, 0.1);
        }

        .action-icon {
          font-size: 2rem;
        }

        .action-text {
          font-weight: 500;
        }

        /* Enhanced Jobs Styles */
        .jobs-header {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .jobs-summary h3 {
          margin: 0 0 0.5rem 0;
          color: #2b6cb0;
        }

        .jobs-summary p {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
        }

        .jobs-controls {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
          flex-wrap: wrap;
          align-items: center;
        }

        .jobs-search {
          flex: 1;
          min-width: 200px;
          max-width: 400px;
        }

        /* Users Header Styles */
        .users-header {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .users-summary h3 {
          margin: 0 0 0.5rem 0;
          color: #2b6cb0;
        }

        .users-summary p {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
        }

        .users-controls {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
          flex-wrap: wrap;
          align-items: center;
        }

        .users-search {
          display: flex;
        }

        .users-search .search-input {
          width: 300px;
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.9rem;
        }

        .search-input {
          width: 300px;
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.9rem;
        }

        .jobs-filters {
          display: flex;
          gap: 0.5rem;
        }

        .filter-select {
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.9rem;
          background: white;
        }

        .job-card.enhanced {
          border: 2px solid #e2e8f0;
        }

        .job-stats {
          margin: 1rem 0;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .stat-item:last-child {
          margin-bottom: 0;
        }

        .stat-label {
          font-weight: 500;
          color: #4a5568;
        }

        .stat-value {
          color: #2d3748;
        }

        /* Enhanced Analytics Styles */
        .analytics-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .analytics-header h3 {
          margin: 0 0 0.5rem 0;
          color: #2b6cb0;
          font-size: 2rem;
        }

        .analytics-header p {
          margin: 0;
          color: #666;
        }

        .kpi-section {
          margin-bottom: 2rem;
        }

        .kpi-section h4 {
          margin: 0 0 1rem 0;
          color: #2b6cb0;
        }

        .analytics-sections {
          margin-bottom: 2rem;
        }

        .analytics-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .analytics-card.large {
          grid-column: span 2;
        }

        .user-type-stats {
          text-align: left;
        }

        .stat-row {
          display: grid;
          grid-template-columns: 1fr 100px 100px;
          align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid #e2e8f0;
        }

        .stat-row:last-child {
          border-bottom: none;
        }
        
        .stat-label {
          font-weight: 500;
          color: #4a5568;
          text-align: left;
        }
        
        .stat-value {
          color: #2d3748;
          font-weight: bold;
          text-align: right;
          padding-right: 15px;
        }

        .job-stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .job-stat-item {
          text-align: center;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .job-stat-number {
          font-size: 1.5rem;
          font-weight: bold;
          color: #2b6cb0;
          margin-bottom: 0.25rem;
        }

        .job-stat-label {
          font-size: 0.8rem;
          color: #666;
        }

        .location-stats {
          text-align: left;
        }

        .location-stat-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .location-stat-row:last-child {
          border-bottom: none;
        }

        .location-name {
          font-weight: 500;
        }

        .location-count {
          color: #666;
          font-size: 0.9rem;
        }

        .activity-feed {
          text-align: left;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .activity-item:last-child {
          border-bottom: none;
        }

        .activity-icon {
          font-size: 1.2rem;
        }

        .activity-text {
          flex: 1;
          font-size: 0.9rem;
        }

        .activity-time {
          font-size: 0.8rem;
          color: #666;
        }

        .performance-metrics {
          text-align: left;
        }

        .metric-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .metric-item:last-child {
          border-bottom: none;
        }

        .metric-label {
          font-weight: 500;
        }

        .metric-value {
          font-weight: bold;
        }

        .metric-value.excellent {
          color: #22543d;
        }

        .metric-value.good {
          color: #2b6cb0;
        }

        .analytics-card.full-width {
          grid-column: 1 / -1;
        }

        .job-list-analytics {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .job-item-analytics {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid #2b6cb0;
        }

        .job-rank {
          font-size: 1.5rem;
          font-weight: bold;
          color: #2b6cb0;
          min-width: 40px;
          text-align: center;
        }

        .job-details-analytics {
          flex: 1;
        }

        .job-title-analytics {
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 0.5rem;
          font-size: 1rem;
        }

        .job-meta-analytics {
          display: flex;
          gap: 1rem;
          font-size: 0.875rem;
          color: #666;
          flex-wrap: wrap;
        }

        .job-meta-analytics span {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .user-stats {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .user-stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .user-stat-item .stat-label {
          font-weight: 500;
          color: #4a5568;
        }

        .stat-details {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stat-percentage {
          color: #2b6cb0;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .analytics-actions {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .analytics-actions h4 {
          margin: 0 0 1rem 0;
          color: #2b6cb0;
        }

        .export-buttons {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
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
          padding: 3rem 2rem;
          color: #666;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }

        .no-data-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .no-data h3 {
          color: #4a5568;
          margin-bottom: 0.5rem;
          font-size: 1.25rem;
        }

        .no-data p {
          color: #718096;
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

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          width: 90%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-header h3 {
          margin: 0;
          color: #2b6cb0;
        }

        .modal-close {
          background: #fff;
          border: 1.5px solid #e5e7eb;
          font-size: 1.5rem;
          cursor: pointer;
          color: #7c3aed;
          padding: 0.25rem 0.5rem 0.35rem 0.5rem;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(80,0,120,0.06);
          transition: background 0.2s, color 0.2s, box-shadow 0.2s;
        }

        .modal-close:hover, .modal-close:focus {
          background: #ede9fe;
          color: #4c1d95;
          box-shadow: 0 4px 16px rgba(80,0,120,0.10);
          outline: none;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .detail-section {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 8px;
        }

        .detail-section h4 {
          margin: 0 0 1rem 0;
          color: #2b6cb0;
          border-bottom: 1px solid #dee2e6;
          padding-bottom: 0.5rem;
        }
        
        /* Document Viewing Styles */
        .documents-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }
        
        .document-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .document-label {
          font-weight: 500;
          color: #4a5568;
          font-size: 0.9rem;
        }
        
        .document-thumbnail {
          width: 100%;
          max-width: 250px;
          height: auto;
          max-height: 180px;
          object-fit: contain;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          background: white;
          padding: 0.5rem;
        }
        
        .document-thumbnail:hover {
          border-color: #2b6cb0;
          box-shadow: 0 4px 12px rgba(43, 108, 176, 0.2);
          transform: scale(1.02);
        }
        
        /* Document Lightbox */
        .document-lightbox {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.85);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }
        
        .lightbox-content {
          background: white;
          border-radius: 12px;
          max-width: 90vw;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .lightbox-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #e2e8f0;
          background: #f7fafc;
        }
        
        .lightbox-header h4 {
          margin: 0;
          color: #2b6cb0;
        }
        
        .lightbox-close {
          background: none;
          border: none;
          font-size: 2rem;
          color: #4a5568;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s;
        }
        
        .lightbox-close:hover {
          background: #e2e8f0;
          color: #2b6cb0;
        }
        
        .lightbox-image {
          width: 100%;
          height: auto;
          max-height: calc(90vh - 80px);
          object-fit: contain;
          padding: 1rem;
        }
        
        .info-label {
          display: block;
          margin-bottom: 0.5rem;
          color: #4a5568;
          font-weight: 500;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }

        .detail-item .label {
          font-weight: 500;
          color: #4a5568;
        }

        .detail-item .value {
          color: #2d3748;
          text-align: right;
        }

        .detail-item .value.job-price {
          background: #38a169 !important;
          color: white !important;
          padding: 0.25rem 0.75rem;
          border-radius: 15px;
          font-weight: bold;
          display: inline-block;
          text-align: center;
        }

        .user-type-badge {
          background: #e2e8f0;
          color: #2d3748;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
          text-transform: capitalize;
        }

        .status-badge.verified {
          background: #e6fffa;
          color: #00695c;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
        }

        .status-badge.unverified {
          background: #fef7e5;
          color: #b7791f;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
        }

        .status-badge.active {
          background: #e6fffa;
          color: #00695c;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
        }

        .status-badge.closed {
          background: #fed7d7;
          color: #c53030;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
        }

        .status-badge.completed {
          background: #d1ecf1;
          color: #0c5460;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
        }

        .status-badge.in-progress {
          background: #fff3cd;
          color: #856404;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
        }

        .status-badge.pending {
          background: #fff3cd;
          color: #856404;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
        }

        .status-badge.accepted {
          background: #e6fffa;
          color: #00695c;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
        }

        .status-badge.rejected {
          background: #fed7d7;
          color: #c53030;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
        }

        .account-id {
          font-family: monospace;
          font-size: 0.8rem;
          color: #999;
        }

        .job-title {
          font-weight: 600;
          color: #2b6cb0;
        }

        .job-description {
          line-height: 1.6;
          color: #4a5568;
          background: white;
          padding: 1rem;
          border-radius: 6px;
          margin: 0;
        }

        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .skill-tag {
          background: #9c27b0;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .applicants-list {
          max-height: 200px;
          overflow-y: auto;
        }

        .applicant-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          margin-bottom: 0.5rem;
          background: white;
          border-radius: 6px;
          border-left: 4px solid #e2e8f0;
        }

        .applicant-info {
          display: flex;
          flex-direction: column;
        }

        .applicant-name {
          font-weight: 500;
          color: #2d3748;
        }

        .applicant-email {
          font-size: 0.8rem;
          color: #666;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #4a5568;
        }

        .form-group input,
        .form-group select {
          padding: 0.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #2b6cb0;
          box-shadow: 0 0 0 3px rgba(43, 108, 176, 0.1);
        }

        .checkbox-group {
          grid-column: span 2;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        .job-details {
          /* No centering or sizing changes, just a placeholder for future styles if needed */
        }

        /* Confirmation Modal Styles */
        .confirmation-modal {
          max-width: 500px;
          animation: slideUp 0.3s ease-out;
        }

        .modal-header.danger-header {
          background: #fed7d7;
          color: #c53030;
          border-bottom: 2px solid #fc8181;
        }

        .modal-body .warning-text {
          color: #856404;
          background: #fff3cd;
          padding: 0.75rem;
          border-radius: 6px;
          margin-top: 0.75rem;
          font-size: 0.9rem;
          border-left: 4px solid #ffc107;
        }

        .modal-body .danger-text {
          color: #c53030;
          font-size: 1.1rem;
          margin-bottom: 1rem;
          line-height: 1.6;
        }

        .modal-body .info-box {
          background: #e6f3ff;
          border: 1px solid #90cdf4;
          border-radius: 8px;
          padding: 1rem;
          margin-top: 1rem;
        }

        .modal-body .info-box p {
          margin: 0 0 0.5rem 0;
          color: #2b6cb0;
          font-weight: 600;
        }

        .modal-body .info-box ul {
          margin: 0;
          padding-left: 1.5rem;
          color: #2c5282;
        }

        .modal-body .info-box li {
          margin: 0.25rem 0;
        }

        .modal-body .warning-box {
          background: #fff5f5;
          border: 2px solid #fc8181;
          border-radius: 8px;
          padding: 1rem;
          margin-top: 1rem;
        }

        .modal-body .warning-box p {
          margin: 0 0 0.5rem 0;
          color: #c53030;
          font-weight: 600;
        }

        .modal-body .warning-box ul {
          margin: 0;
          padding-left: 1.5rem;
          color: #9b2c2c;
        }

        .modal-body .warning-box li {
          margin: 0.25rem 0;
        }

        .modal-body .confirmation-question {
          margin-top: 1rem;
          font-weight: 600;
          color: #2d3748;
          font-size: 1.05rem;
        }

        .btn.danger-strong {
          background: #c53030;
          color: white;
          font-weight: 600;
        }

        .btn.danger-strong:hover {
          background: #9b2c2c;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          .dashboard-container {
            padding: 1rem;
          }

          .dashboard-header h1 {
            font-size: 1.5rem;
          }

          .controls-section {
            flex-direction: column;
            gap: 1rem;
          }

          .search-controls,
          .filter-controls,
          .sort-controls,
          .export-controls {
            width: 100%;
            flex-direction: column;
          }

          .filter-select,
          .sort-select {
            width: 100%;
          }
          
          .search-input {
            width: 300px;
            max-width: 100%;
          }

          .export-controls {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
          }

          .export-controls .btn {
            font-size: 0.875rem;
            padding: 0.625rem 0.75rem;
          }

          .tab-navigation {
            overflow-x: auto;
            overflow-y: hidden;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .tab-navigation::-webkit-scrollbar {
            display: none;
          }

          .tab-btn {
            min-width: 120px;
            font-size: 0.875rem;
          }

          .stats-grid {
            grid-template-columns: 1fr 1fr;
          }

          .jobs-grid {
            grid-template-columns: 1fr;
          }

          .deleted-items-selector {
            flex-direction: column;
            gap: 0.5rem;
          }

          .selector-btn {
            width: 100%;
            text-align: center;
          }

          .users-table-container {
            display: none;
          }

          .users-mobile-view {
            display: block;
          }

          .modal-content {
            width: 95%;
            max-width: 95%;
            margin: 1rem;
            max-height: 90vh;
          }

          .modal-body {
            max-height: 60vh;
            overflow-y: auto;
          }

          .modal-footer {
            flex-direction: column-reverse;
            gap: 0.5rem;
          }

          .modal-footer .btn {
            width: 100%;
          }

          .job-card {
            padding: 1rem;
          }

          .user-mobile-card {
            padding: 1rem;
          }

          .deleted-items-table-container {
            overflow-x: auto;
          }

          .deleted-items-table {
            min-width: 600px;
          }

          .analytics-charts {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .export-controls {
            grid-template-columns: 1fr;
          }

          .dashboard-header p {
            font-size: 0.875rem;
          }

          .tab-btn {
            padding: 0.625rem 0.875rem;
            font-size: 0.813rem;
          }

          .stat-icon {
            width: 40px;
            height: 40px;
          }

          .stat-content h3 {
            font-size: 1.5rem;
          }

          .filter-controls select {
            font-size: 0.875rem;
          }
        }
      `}</style>
    </div>
  )
}

export default AdminDashboard




