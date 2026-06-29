import { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { AlertContext } from '../context/AlertContext'
import { useLanguage } from '../context/LanguageContext'
import apiService from '../api'
import './Help.module.css' // Changed from default import to side-effect import

// Help Center with comprehensive FAQ and support options
function Help() {
  const { t } = useLanguage()
  const { user, token } = useContext(AuthContext)
  const { success, error: showError } = useContext(AlertContext)
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeItems, setActiveItems] = useState(new Set())
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [supportForm, setSupportForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [submitting, setSubmitting] = useState(false)

  // Message templates based on subject
  const messageTemplates = {
    'Account Issues': 'I am experiencing issues with my account. Specifically:\n\n[Please describe your account issue here]\n\nMy account email: [Your email]\nIssue started: [Date/Time]',
    'Technical Support': 'I am encountering a technical problem:\n\n[Please describe the technical issue]\n\nBrowser: [e.g., Chrome, Firefox]\nDevice: [e.g., Desktop, Mobile]\nSteps to reproduce:\n1. \n2. \n3. ',
    'Job Posting': 'I need help with job posting:\n\n[Describe your question or issue]\n\nJob Title (if applicable): \nIssue type: [e.g., posting, editing, deleting]',
    'Profile Management': 'I have a question about my profile:\n\n[Describe what you need help with]\n\nProfile section: [e.g., work history, skills, verification]',
    'Billing & Payments': 'I have a question about billing or payments:\n\n[Describe your billing/payment question]\n\nTransaction ID (if applicable): \nDate of transaction: ',
    'Report a Problem': '⚠️ I would like to report a problem:\n\n[Detailed description of the problem]\n\nSeverity: [Low/Medium/High]\nAffected feature: \nFrequency: [Once/Multiple times/Always]',
    'Feature Request': '💡 I would like to suggest a new feature:\n\n[Describe the feature]\n\nBenefit: [How would this help users?]\nUse case: [When would you use this?]',
    'General Inquiry': 'I have a general question:\n\n[Your question here]',
    'Other': '[Please describe your inquiry]'
  }

  const faqData = [
    {
      id: 1,
      category: t('help.gettingStarted'),
      icon: 'fas fa-rocket',
      questions: [
        {
          id: 'reg',
          question: t('help.q1'),
          answer: t('help.a1')
        },
        {
          id: 'verify',
          question: t('help.q2'),
          answer: t('help.a2')
        },
        {
          id: 'login',
          question: t('help.q3'),
          answer: t('help.a3')
        }
      ]
    },
    {
      id: 2,
      category: t('help.accountManagement'),
      icon: 'fas fa-user-circle',
      questions: [
        {
          id: 'pass',
          question: t('help.q4'),
          answer: t('help.a4')
        },
        {
          id: 'update',
          question: t('help.q5'),
          answer: t('help.a5')
        },
        {
          id: 'delete',
          question: t('help.q6'),
          answer: t('help.a6')
        },
        {
          id: 'privacy',
          question: t('help.q7'),
          answer: t('help.a7')
        }
      ]
    },
    {
      id: 3,
      category: t('help.findingWork'),
      icon: 'fas fa-briefcase',
      questions: [
        {
          id: 'search',
          question: t('help.q8'),
          answer: t('help.a8')
        },
        {
          id: 'apply',
          question: t('help.q9'),
          answer: t('help.a9')
        },
        {
          id: 'track',
          question: t('help.q10'),
          answer: t('help.a10')
        },
        {
          id: 'match',
          question: t('help.q11'),
          answer: t('help.a11')
        }
      ]
    },
    {
      id: 4,
      category: t('help.forEmployers'),
      icon: 'fas fa-building',
      questions: [
        {
          id: 'employer',
          question: t('help.q12'),
          answer: t('help.a12')
        },
        {
          id: 'cost',
          question: t('help.q13'),
          answer: t('help.a13')
        },
        {
          id: 'manage',
          question: t('help.q14'),
          answer: t('help.a14')
        },
        {
          id: 'edit',
          question: t('help.q15'),
          answer: t('help.a15')
        }
      ]
    },
    {
      id: 5,
      category: t('help.ratingsReviews'),
      icon: 'fas fa-star',
      questions: [
        {
          id: 'rating',
          question: t('help.q16'),
          answer: t('help.a16')
        },
        {
          id: 'review',
          question: t('help.q17'),
          answer: t('help.a17')
        },
        {
          id: 'dispute',
          question: t('help.q18'),
          answer: t('help.a18')
        }
      ]
    },
    {
      id: 6,
      category: t('help.safety'),
      icon: 'fas fa-shield-alt',
      questions: [
        {
          id: 'safe',
          question: t('help.q19'),
          answer: t('help.a19')
        },
        {
          id: 'scam',
          question: t('help.q20'),
          answer: t('help.a20')
        },
        {
          id: 'report',
          question: t('help.q21'),
          answer: t('help.a21')
        },
        {
          id: 'verify',
          question: t('help.q22'),
          answer: t('help.a22')
        }
      ]
    },
    {
      id: 7,
      category: t('help.messaging'),
      icon: 'fas fa-wallet',
      questions: [
        {
          id: 'payment',
          question: t('help.q23'),
          answer: t('help.a23')
        },
        {
          id: 'goals',
          question: t('help.q24'),
          answer: t('help.a24')
        },
        {
          id: 'priority',
          question: t('help.q25'),
          answer: t('help.a25')
        }
      ]
    },
    {
      id: 8,
      category: t('help.troubleshooting'),
      icon: 'fas fa-tools',
      questions: [
        {
          id: 'browser',
          question: t('help.q26'),
          answer: t('help.a26')
        },
        {
          id: 'slow',
          question: t('help.q27'),
          answer: t('help.a27')
        },
        {
          id: 'mobile',
          question: t('help.q28'),
          answer: t('help.a28')
        },
        {
          id: 'error',
          question: t('help.q29'),
          answer: t('help.a29')
        }
      ]
    }
  ]

  const toggleFAQ = (categoryId, questionId) => {
    const itemKey = `${categoryId}-${questionId}`
    const newActiveItems = new Set(activeItems)
    
    if (newActiveItems.has(itemKey)) {
      newActiveItems.delete(itemKey)
    } else {
      newActiveItems.add(itemKey)
    }
    
    setActiveItems(newActiveItems)
  }

  const filterQuestions = (questions) => {
    if (!searchTerm) return questions
    
    return questions.filter(q => 
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const openSupportChat = async () => {
    // Check if user is logged in
    if (!user || !token) {
      showError(t('help.mustBeLoggedIn'))
      return
    }

    try {
      // Get support contact (admin)
      const response = await apiService.getSupportContact()
      const supportContact = response.supportContact || response.data?.supportContact
      
      if (supportContact) {
        // Navigate to chat with support contact pre-selected
        navigate('/chat', { state: { supportContact } })
      } else {
        showError('Support contact not available')
      }
    } catch (error) {
      console.error('Error loading support contact:', error)
      showError('Failed to connect to support. Please try again.')
    }
  }

  const openSupportModal = () => {
    // Pre-populate form with user data if available
    if (user) {
      setSupportForm(prev => ({
        ...prev,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        email: user.email || ''
      }))
    }
    setShowSupportModal(true)
  }

  const handleSupportFormChange = (field, value) => {
    setSupportForm(prev => {
      const updated = { ...prev, [field]: value }
      
      // Auto-fill message template when subject changes
      if (field === 'subject' && value && messageTemplates[value]) {
        // Only auto-fill if message is empty
        if (!prev.message || prev.message === messageTemplates[prev.subject]) {
          updated.message = messageTemplates[value]
        }
      }
      
      return updated
    })
  }

  const submitSupportForm = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await apiService.createSupportTicket({
        name: supportForm.name,
        email: supportForm.email,
        subject: supportForm.subject,
        message: supportForm.message,
        priority: 'medium'
      })

      success('Support request submitted successfully! We will get back to you soon.')
      setShowSupportModal(false)
      setSupportForm({ name: '', email: '', subject: '', message: '' })
    } catch (error) {
      console.error('Error submitting support request:', error)
      showError('Failed to submit support request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="help-container">
      <div className="content-wrapper">
        <div className="main-content">
          <div className="page-header">
            <h1><i className="fas fa-life-ring"></i> {t('help.title')}</h1>
            <p>{t('help.subtitle')}</p>
          </div>

          <div className="search-container">
            <input
              type="text"
              id="helpSearch"
              name="helpSearch"
              className="search-box"
              placeholder={`🔍 ${t('help.searchPlaceholder')}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="faq-sections">
            {faqData.map(section => {
              const filteredQuestions = filterQuestions(section.questions)
              if (filteredQuestions.length === 0 && searchTerm) return null

              return (
                <div key={section.id} className="faq-section">
                  <h2>
                    <i className={section.icon}></i> {section.category}
                  </h2>
                  
                  {filteredQuestions.map(q => {
                    const itemKey = `${section.id}-${q.id}`
                    const isActive = activeItems.has(itemKey)
                    const answerId = `faq-${section.id}-${q.id}-answer`
                    const buttonId = `faq-${section.id}-${q.id}-button`

                    return (
                      <div 
                        key={q.id} 
                        className={`faq-item ${isActive ? 'active' : ''}`}
                      >
                        <button
                          id={buttonId}
                          aria-controls={answerId}
                          aria-expanded={isActive}
                          className="faq-question"
                          onClick={() => toggleFAQ(section.id, q.id)}
                        >
                          <span>{q.question}</span>
                          <i className={`fas fa-chevron-${isActive ? 'up' : 'down'}`}></i>
                        </button>
                        <div id={answerId} className="faq-answer" role="region" aria-labelledby={buttonId}>
                          <p>{q.answer}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>

          {searchTerm && faqData.every(section => filterQuestions(section.questions).length === 0) && (
            <div className="no-results">
              <i className="fas fa-search"></i>
              <p>{t('help.noResults')} "{searchTerm}"</p>
              <p>{t('help.tryDifferent')}</p>
            </div>
          )}
        </div>

        <div className="sidebar">
          <div className="contact-card">
            <h3><i className="fas fa-headset"></i> {t('help.needHelp')}</h3>
            <button className="contact-btn" onClick={openSupportChat}>
              <i className="fas fa-comments"></i>
              {t('help.chatWithSupport')}
            </button>
            <button className="contact-btn secondary" onClick={openSupportModal} style={{ marginTop: '10px', background: '#6c757d' }}>
              <i className="fas fa-envelope"></i>
              {t('help.emailSupport')}
            </button>
            
            <div className="contact-info">
              <div className="contact-methods">
                <div className="contact-method">
                  <i className="fas fa-envelope"></i>
                  <div>
                    <strong>{t('help.email')}:</strong>
                    <a href="mailto:support@resilinked.com">support@resilinked.com</a>
                  </div>
                </div>
                <div className="contact-method">
                  <i className="fas fa-phone"></i>
                  <div>
                    <strong>{t('help.phone')}:</strong>
                    <a href="tel:+639451234567">+63 945 123 4567</a>
                  </div>
                </div>
                <div className="contact-method">
                  <i className="fas fa-clock"></i>
                  <div>
                    <strong>{t('help.hours')}:</strong>
                    <span>{t('help.monSat')}</span>
                  </div>
                </div>
                <div className="contact-method">
                  <i className="fas fa-map-marker-alt"></i>
                  <div>
                    <strong>{t('help.location')}:</strong>
                    <span>San Fernando, Pampanga</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="quick-links">
            <h3>{t('help.quickLinks')}</h3>
            <Link to="/dashboard" className="quick-link">
              <i className="fas fa-home"></i> {t('help.backToDashboard')}
            </Link>
            <Link to="/profile" className="quick-link">
              <i className="fas fa-user"></i> {t('help.myProfile')}
            </Link>
            <Link to="/user-settings" className="quick-link">
              <i className="fas fa-cog"></i> {t('help.settings')}
            </Link>
            <Link to="/jobs" className="quick-link">
              <i className="fas fa-search"></i> {t('help.findJobs')}
            </Link>
            <Link to="/about" className="quick-link">
              <i className="fas fa-info-circle"></i> {t('help.aboutUs')}
            </Link>
            <Link to="/privacy" className="quick-link">
              <i className="fas fa-shield-alt"></i> {t('help.privacyPolicy')}
            </Link>
          </div>
        </div>
      </div>

      {/* Support Modal */}
      {showSupportModal && (
        <div className="modal-overlay" onClick={() => setShowSupportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><i className="fas fa-headset"></i> {t('help.contactSupport')}</h2>
              <button className="modal-close" onClick={() => setShowSupportModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={submitSupportForm}>
                <div className="form-group">
                  <label htmlFor="supportName">{t('help.name')}:</label>
                  <input
                    type="text"
                    id="supportName"
                    value={supportForm.name}
                    onChange={(e) => handleSupportFormChange('name', e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="supportEmail">{t('help.email')}:</label>
                  <input
                    type="email"
                    id="supportEmail"
                    value={supportForm.email}
                    onChange={(e) => handleSupportFormChange('email', e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="supportSubject">{t('help.subject')}:</label>
                  <select
                    id="supportSubject"
                    value={supportForm.subject}
                    onChange={(e) => handleSupportFormChange('subject', e.target.value)}
                    required
                  >
                    <option value="">{t('help.selectTopic')}</option>
                    <option value="Account Issues">{t('help.accountIssues')}</option>
                    <option value="Technical Support">{t('help.technicalSupport')}</option>
                    <option value="Job Posting">{t('help.jobPosting')}</option>
                    <option value="Profile Management">{t('help.profileManagement')}</option>
                    <option value="Billing & Payments">{t('help.billingPayments')}</option>
                    <option value="Report a Problem">{t('help.reportProblem')}</option>
                    <option value="Feature Request">{t('help.featureRequest')}</option>
                    <option value="General Inquiry">{t('help.generalInquiry')}</option>
                    <option value="Other">{t('help.other')}</option>
                  </select>
                  {supportForm.subject && (
                    <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.5rem', display: 'block' }}>
                      💡 {t('help.templateAdded')}
                    </small>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="supportMessage">{t('help.message')}:</label>
                  <textarea
                    id="supportMessage"
                    value={supportForm.message}
                    onChange={(e) => handleSupportFormChange('message', e.target.value)}
                    rows="5"
                    placeholder={t('help.messagePlaceholder')}
                    required
                  />
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn secondary" 
                    onClick={() => setShowSupportModal(false)}
                  >
                    {t('help.cancel')}
                  </button>
                  <button 
                    type="submit" 
                    className="btn primary" 
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <div className="spinner small"></div>
                        {t('help.sending')}
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane"></i>
                        {t('help.sendMessage')}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Help Center Styles */}
      <style>{`
        .help-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .help-container .content-wrapper {
          max-width: 1300px;
          margin: 0 auto;
          padding: 3rem;
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 3rem;
        }

        .main-content {
          background: white;
          border-radius: 12px;
          padding: 3rem;
          box-shadow: 0 6px 28px rgba(0,0,0,0.08);
        }

        .help-container .page-header {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
          margin-bottom: 3rem;
          padding-bottom: 1.25rem;
          border-bottom: 2px solid #e2e8f0;
          gap: 0.5rem;
        }

        .help-container .page-header h1 {
          color: #6b21a8;
          margin: 0;
          font-size: 2.5rem;
          font-weight: 700;
          display: block;
        }

        .help-container .page-header p {
          color: #666;
          margin: 0;
          font-size: 1.05rem;
          max-width: 60%;
        }

        .search-container {
          margin-bottom: 2.5rem;
        }

        .search-box {
          width: 100%;
          padding: 1rem;
          font-size: 1.1rem;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          transition: all 0.3s;
        }

        .search-box:focus {
          outline: none;
          border-color: #2b6cb0;
          box-shadow: 0 0 0 3px rgba(43, 108, 176, 0.1);
        }

        .faq-sections {
          margin-bottom: 2.5rem;
        }

        .faq-section {
          margin-bottom: 2.5rem;
        }

        .faq-section h2 {
          color: #2b6cb0;
          margin: 0 0 1rem 0;
          font-size: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .faq-item {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          margin-bottom: 1rem;
          overflow: hidden;
          transition: all 0.3s;
        }

        .faq-item:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        .faq-question {
          padding: 1.25rem;
          background: #f8f9fa;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
          color: #2d3748;
          transition: all 0.3s;
          border: none;
          width: 100%;
          text-align: left;
          font-size: 1rem;
        }

        .faq-question:hover {
          background: #e9ecef;
        }

        .faq-question:focus {
          outline: none;
        }

        .faq-question:focus-visible {
          box-shadow: 0 0 0 4px rgba(43,108,176,0.12);
          border-radius: 6px;
        }

        .faq-item.active .faq-question {
          background: #2b6cb0;
          color: white;
        }

        .faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s ease, opacity 0.3s ease;
          opacity: 0;
        }

        .faq-item.active .faq-answer {
          max-height: 500px;
          opacity: 1;
        }

        .faq-answer p {
          padding: 1.25rem;
          margin: 0;
          line-height: 1.8;
          color: #4a5568;
        }

        .no-results {
          text-align: center;
          padding: 4rem 2rem;
          color: #718096;
          background: #f7fafc;
          border-radius: 12px;
          margin-top: 2rem;
        }

        .no-results i {
          font-size: 4rem;
          color: #cbd5e0;
          margin-bottom: 1rem;
        }

        .no-results p:first-of-type {
          font-size: 1.25rem;
          color: #4a5568;
          margin: 1rem 0 0.5rem 0;
          font-weight: 600;
        }

        .no-results p:last-of-type {
          color: #718096;
          margin: 0;
        }

        .sidebar {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .contact-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem 1.75rem;
          box-shadow: 0 6px 18px rgba(20, 24, 31, 0.06);
        }

        .contact-card h3 {
          color: #2b6cb0;
          margin: 0 0 1.25rem 0;
          font-size: 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .contact-btn {
          width: 100%;
          padding: 0.9rem 1rem;
          background: #2f9a5f;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          transition: transform 0.12s ease, background 0.12s ease, box-shadow 0.12s ease;
          box-shadow: 0 4px 12px rgba(47, 154, 95, 0.2);
          font-size: 0.95rem;
        }

        .contact-btn:hover {
          background: #24804b;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(47, 154, 95, 0.3);
        }

        .contact-btn.secondary {
          background: #6c757d;
          box-shadow: 0 4px 12px rgba(108, 117, 125, 0.2);
        }

        .contact-btn.secondary:hover {
          background: #5a6268;
          box-shadow: 0 6px 16px rgba(108, 117, 125, 0.3);
        }

        .contact-btn:focus-visible {
          outline: none;
          box-shadow: 0 0 0 4px rgba(47, 154, 95, 0.2);
        }

        .contact-info {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e2e8f0;
        }

        .contact-methods {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .contact-method {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .contact-method i {
          width: 22px;
          color: #2b6cb0;
          margin-top: 3px;
        }

        .contact-method div {
          flex: 1;
        }

        .contact-method strong {
          display: inline-block;
          min-width: 70px;
          font-size: 0.95rem;
          color: #2d3748;
          font-weight: 700;
          margin-right: 6px;
        }

        .contact-method a,
        .contact-method span {
          color: #2b6cb0;
          text-decoration: none;
          font-size: 0.95rem;
        }

        .contact-method a:hover {
          text-decoration: underline;
        }

        .quick-links {
          background: white;
          border-radius: 12px;
          padding: 1.5rem 1.75rem;
          box-shadow: 0 6px 18px rgba(20, 24, 31, 0.06);
        }

        .quick-links h3 {
          color: #2b6cb0;
          margin: 0 0 1rem 0;
          font-size: 1.25rem;
        }

        .quick-link {
          display: block;
          padding: 0.65rem 0.5rem;
          color: #4a5568;
          text-decoration: none;
          border-radius: 6px;
          transition: background 0.16s ease, color 0.16s ease;
          margin-bottom: 0.5rem;
          font-size: 0.975rem;
        }

        .quick-link:hover {
          background: #f8f9fa;
          color: #2b6cb0;
        }

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
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          width: 90%;
          max-width: 550px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .modal-header h2 {
          margin: 0;
          color: #2d3748;
          font-size: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 2rem;
          color: #718096;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: #f7fafc;
          color: #2d3748;
        }

        .modal-body {
          padding: 2rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: #2d3748;
          font-weight: 600;
          font-size: 0.95rem;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.2s;
          font-family: inherit;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #2b6cb0;
          box-shadow: 0 0 0 3px rgba(43, 108, 176, 0.1);
        }

        .form-group textarea {
          resize: vertical;
          min-height: 120px;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          font-size: 0.95rem;
        }

        .btn.primary {
          background: #2b6cb0;
          color: white;
          box-shadow: 0 4px 12px rgba(43, 108, 176, 0.2);
        }

        .btn.primary:hover {
          background: #1e5a8e;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(43, 108, 176, 0.3);
        }

        .btn.secondary {
          background: #e2e8f0;
          color: #4a5568;
        }

        .btn.secondary:hover {
          background: #cbd5e0;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 1024px) {
          .help-container .page-header p { max-width: 75%; }
        }

        @media (max-width: 768px) {
          .help-container .page-header p { max-width: 100%; }
          .content-wrapper { grid-template-columns: 1fr !important; padding: 1.25rem !important; gap: 1rem !important; }
          .main-content { padding: 1.5rem !important; }
          .faq-question { font-size: 0.95rem !important; }
        }
      `}</style>
    </div>
  )
}

export default Help
