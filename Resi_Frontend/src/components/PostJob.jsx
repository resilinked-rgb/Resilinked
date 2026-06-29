import { useState, useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { AlertContext } from '../context/AlertContext'
import { useTranslation } from '../hooks/useTranslation'
import apiService from '../api'

function PostJob() {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    barangay: '',
    otherBarangay: '',
    postMethod: 'public'
  })
  
  const [skills, setSkills] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [skillError, setSkillError] = useState('')
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { user, isLoggedIn } = useContext(AuthContext)
  const { success, error: showError } = useContext(AlertContext)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoggedIn) {
      showError(t('postJob.loginRequired'))
      navigate('/login')
      return
    }

    // Check if user is employer, both, or admin
    if (user && user.userType !== 'employer' && user.userType !== 'both' && user.userType !== 'admin') {
      showError(t('postJob.employerOnly'))
      navigate('/profile')
      return
    }

    // Load draft if exists
    const draft = localStorage.getItem('draftJob')
    if (draft) {
      try {
        const draftData = JSON.parse(draft)
        setFormData({
          title: draftData.title || '',
          description: draftData.description || '',
          price: draftData.price || '',
          barangay: draftData.barangay || '',
          otherBarangay: draftData.otherBarangay || '',
          postMethod: draftData.postMethod || 'public'
        })
        
        if (draftData.skillsRequired && draftData.skillsRequired.length > 0) {
          setSkills(draftData.skillsRequired)
        }
      } catch (e) {
        console.error('Error loading draft:', e)
      }
    }
  }, [isLoggedIn, user, navigate, showError])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    // Special case for barangay field
    if (name === 'barangay' && value === 'other') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        otherBarangay: ''
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
    
    if (formError) {
      setFormError('')
    }
  }

  const handleSkillInputKeyDown = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault()
      addSkill(skillInput.trim())
      setSkillInput('')
    }
  }

  const addSkill = (skill) => {
    if (!skills.includes(skill)) {
      setSkills(prev => [...prev, skill])
      setSkillError('')
    } else {
      setSkillError(t('postJob.skillAlreadyAdded'))
    }
  }

  const removeSkill = (skillToRemove) => {
    setSkills(prev => prev.filter(skill => skill !== skillToRemove))
  }

  const handleSaveDraft = () => {
    const draftData = {
      ...formData,
      skillsRequired: skills
    }
    localStorage.setItem('draftJob', JSON.stringify(draftData))
    success(t('postJob.draftSaved'))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    
    if (skills.length === 0) {
      setFormError(t('postJob.atLeastOneSkill'))
      return
    }
    if (!formData.postTiming || (formData.postTiming === 'schedule' && !formData.scheduledTime)) {
      setFormError(t('postJob.selectPostTiming'))
      return
    }
    if (formData.barangay === 'other' && !formData.otherBarangay) {
      setFormError(t('postJob.specifyBarangay'))
      return
    }

    setLoading(true);
    try {
      const jobData = {
        ...formData,
        skillsRequired: skills
      };
      
      // If barangay is 'other', use the otherBarangay value
      if (formData.barangay === 'other') {
        jobData.barangay = formData.otherBarangay;
      }
      // Remove otherBarangay from the submission
      delete jobData.otherBarangay;
      
      const result = await apiService.createJob(jobData);

      success(t('postJob.jobPostedSuccess'));
      setFormData({
        title: '',
        description: '',
        price: '',
        barangay: '',
        otherBarangay: '',
        postMethod: 'public',
        postTiming: 'now',
        scheduledTime: ''
      });
      setSkills([]);
      localStorage.removeItem('draftJob');
      setTimeout(() => {
        navigate('/employer-dashboard');
      }, 1500);
    } catch (err) {
      console.error('Error posting job:', err);
      const errorMessage = err?.message || t('postJob.jobPostFailed');
      setFormError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="post-job-container">
      <div className="post-job-card">
        <div className="post-job-header">
          <h1>{t('postJob.title')}</h1>
          <Link to="/employer-dashboard" className="back-btn">{t('postJob.backToDashboard')}</Link>
        </div>

        <form onSubmit={handleSubmit} className="post-job-form">
          {formError && (
            <div className="error-message">
              {formError}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="title">{t('postJob.jobTitle')} *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder={t('postJob.jobTitlePlaceholder')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">{t('postJob.jobDescription')} *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows="4"
              placeholder={t('postJob.jobDescriptionPlaceholder')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="price">{t('postJob.price')} *</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              placeholder={t('postJob.pricePlaceholder')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="barangay">{t('postJob.location')} *</label>
            <select
              id="barangay"
              name="barangay"
              value={formData.barangay}
              onChange={handleInputChange}
              required
            >
            <option value="Alasas">Alasas</option>
            <option value="Baliti">Baliti</option>
            <option value="Bulaon">Bulaon</option>
            <option value="Calulut">Calulut</option>
            <option value="Dela Paz Norte">Dela Paz Norte</option>
            <option value="Dela Paz Sur">Dela Paz Sur</option>
            <option value="Del Carmen">Del Carmen</option>
            <option value="Del Pilar">Del Pilar</option>
            <option value="Del Rosario">Del Rosario</option>
            <option value="Dolores">Dolores</option>
            <option value="Juliana">Juliana</option>
            <option value="Lara">Lara</option>
            <option value="Lourdes">Lourdes</option>
            <option value="Magliman">Magliman</option>
            <option value="Maimpis">Maimpis</option>
            <option value="Malino">Malino</option>
            <option value="Malpitic">Malpitic</option>
            <option value="Pandaras">Pandaras</option>
            <option value="Panipuan">Panipuan</option>
            <option value="Pulung Bulu">Pulung Bulu</option>
            <option value="Quebiawan">Quebiawan</option>
            <option value="Saguin">Saguin</option>
            <option value="San Agustin">San Agustin</option>
            <option value="San Felipe">San Felipe</option>
            <option value="San Isidro">San Isidro</option>
            <option value="San Jose">San Jose</option>
            <option value="San Juan">San Juan</option>
            <option value="San Nicolas">San Nicolas</option>
            <option value="San Pedro">San Pedro</option>
            <option value="Santa Lucia">Santa Lucia</option>
            <option value="Santa Teresita">Santa Teresita</option>
            <option value="Santo Niño">Santo Niño</option>
            <option value="Santo Rosario">Santo Rosario</option>
            <option value="Sindalan">Sindalan</option>
            <option value="Telabastagan">Telabastagan</option>
            <option value="other">{t('postJob.other')}</option>
            </select>
            {formData.barangay === 'other' && (
              <input
                type="text"
                id="otherBarangay"
                name="otherBarangay"
                value={formData.otherBarangay}
                onChange={handleInputChange}
                placeholder={t('postJob.specifyBarangayPlaceholder')}
                style={{ marginTop: '0.5em' }}
                required={formData.barangay === 'other'}
              />
            )}
          </div>

          <div className="form-group">
            <label>{t('postJob.requiredSkills')} <span style={{color:'red'}}>*</span></label>
            <div className="skills-table">
              {[
                { key: 'houseCleaning', label: t('postJob.skills.houseCleaning') },
                { key: 'laundry', label: t('postJob.skills.laundry') },
                { key: 'cooking', label: t('postJob.skills.cooking') },
                { key: 'babysitting', label: t('postJob.skills.babysitting') },
                { key: 'elderCare', label: t('postJob.skills.elderCare') },
                { key: 'gardening', label: t('postJob.skills.gardening') },
                { key: 'petCare', label: t('postJob.skills.petCare') },
                { key: 'carWashing', label: t('postJob.skills.carWashing') },
                { key: 'driving', label: t('postJob.skills.driving') },
                { key: 'delivery', label: t('postJob.skills.delivery') },
                { key: 'moving', label: t('postJob.skills.moving') },
                { key: 'painting', label: t('postJob.skills.painting') },
                { key: 'plumbing', label: t('postJob.skills.plumbing') },
                { key: 'electrical', label: t('postJob.skills.electrical') },
                { key: 'carpentry', label: t('postJob.skills.carpentry') },
                { key: 'masonry', label: t('postJob.skills.masonry') },
                { key: 'roofing', label: t('postJob.skills.roofing') },
                { key: 'airconCleaning', label: t('postJob.skills.airconCleaning') }
              ].map(skill => (
                <div key={skill.key} className="skills-table-row">
                  <span className="skills-table-name">{skill.label}</span>
                  <input
                    type="checkbox"
                    name="skillsRequired"
                    value={skill.label}
                    checked={skills.includes(skill.label)}
                    onChange={e => {
                      const checked = e.target.checked;
                      setSkills(checked
                        ? [...skills, skill.label]
                        : skills.filter(s => s !== skill.label)
                      );
                    }}
                    className="skills-table-checkbox"
                  />
                </div>
              ))}
            </div>
            <div className="form-group">
              <label htmlFor="otherSkill">{t('postJob.other')}:</label>
              <input
                type="text"
                id="otherSkill"
                name="otherSkill"
                value={formData.otherSkill || ''}
                onChange={e => setFormData(prev => ({...prev, otherSkill: e.target.value}))}
                placeholder={t('postJob.addCustomSkill')}
              />
              <div className="custom-skill-actions">
                <button type="button" className="btn btn-secondary add-btn"
                  onClick={() => {
                    if (formData.otherSkill && !skills.includes(formData.otherSkill)) {
                      setSkills([...skills, formData.otherSkill]);
                      setFormData(prev => ({...prev, otherSkill: ''}));
                    }
                  }}
                >{t('postJob.add')}</button>
                <button type="button" className="btn btn-secondary clear-btn"
                  onClick={() => {
                    setFormData(prev => ({...prev, otherSkill: ''}));
                    setSkills([]);
                  }}
                >{t('postJob.clear')}</button>
              </div>
            </div>
            <small>{t('postJob.selectAllApply')}</small>
            {skills.length === 0 && (
              <div className="field-error">{t('postJob.atLeastOneSkill')}</div>
            )}
            {skills.length > 0 && (
                <div className="skill-tags">
                  {skills.map((skill, index) => (
                    <span key={index} className="skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>
            )}
          </div>

          <div className="form-group">
            <label>{t('postJob.postTiming')} *</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="postTiming"
                  value="now"
                  checked={formData.postTiming === 'now'}
                  onChange={() => setFormData(prev => ({...prev, postTiming: 'now'}))}
                  style={{ marginRight: "5px" }}
                  required
                />
                <span className="radio-text">{t('postJob.postNow')}</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="postTiming"
                  value="schedule"
                  checked={formData.postTiming === 'schedule'}
                  onChange={() => setFormData(prev => ({...prev, postTiming: 'schedule'}))}
                  style={{ marginRight: "5px" }}
                  required
                />
                <span className="radio-text">{t('postJob.schedulePost')}</span>
              </label>
            </div>
            {formData.postTiming === 'schedule' && (
              <div style={{marginTop: '0.7em'}}>
                <label htmlFor="scheduledTime">{t('postJob.selectDateTime')}:</label>
                <input
                  type="datetime-local"
                  id="scheduledTime"
                  name="scheduledTime"
                  value={formData.scheduledTime || ''}
                  onChange={e => setFormData(prev => ({...prev, scheduledTime: e.target.value}))}
                  style={{marginLeft: '0.5em'}}
                  required
                />
              </div>
            )}
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="save-draft-btn"
              onClick={handleSaveDraft}
            >
              {t('postJob.saveAsDraft')}
            </button>
            
            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  {t('postJob.postingJob')}
                </>
              ) : (
                t('postJob.postJob')
              )}
            </button>
          </div>
        </form>
      </div>

  <style>{`
        .post-job-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }

        .post-job-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          padding: 2rem;
        }

        .post-job-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e2e8f0;
        }

        .post-job-header h1 {
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

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #2d3748;
        }

        input[type="text"],
        input[type="number"],
        select,
        textarea {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.2s;
          box-sizing: border-box;
          background-color: white;
          font-family: inherit;
        }

        select {
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232d3748' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          background-size: 1.2em;
          padding-right: 2.5rem;
        }

        input[type="text"]:focus,
        input[type="number"]:focus,
        select:focus,
        textarea:focus {
          outline: none;
          border-color: #2b6cb0;
          box-shadow: 0 0 0 3px rgba(43, 108, 176, 0.1);
        }

        input[type="text"]:hover,
        input[type="number"]:hover,
        select:hover,
        textarea:hover {
          border-color: #cbd5e0;
        }

        textarea {
          resize: vertical;
          font-family: inherit;
        }

        .skill-tags {
          margin-top: 0.5rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .skill-tag {
          background: #2b6cb0;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

          .skills-table {
            display: flex;
            flex-direction: column;
            gap: 0;
            max-height: 140px;
            overflow-y: auto;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            background: #f9f9f9;
            padding: 0.5em 0.5em;
          }
          .skills-table-row {
            display: grid;
            grid-template-columns: 1fr auto;
            align-items: center;
            padding: 0.3em 0.5em;
            border-bottom: 1px solid #f0f0f0;
          }
          .skills-table-row:last-child {
            border-bottom: none;
          }
          .skills-table-name {
            font-size: 1em;
            color: #2d3748;
          }
          .skills-table-checkbox {
            justify-self: end;
            accent-color: #2b6cb0;
            width: 18px;
            height: 18px;
          }
          @media (max-width: 600px) {
            .skills-table-row {
              grid-template-columns: 1fr auto;
              padding: 0.3em 0.3em;
            }
            .skills-table-name {
              font-size: 0.98em;
            }
            .skills-table-checkbox {
              width: 16px;
              height: 16px;
            }
          }

            .pro-checkbox-label {
              display: flex;
              align-items: center;
              gap: 0.4em;
              padding: 0.15em 0.3em;
            }
            .pro-checkbox {
              margin: 0 0.2em 0 0;
              vertical-align: middle;
              accent-color: #2b6cb0;
              width: 16px;
              height: 16px;
            }
            .pro-checkbox-text {
              display: inline-block;
              vertical-align: middle;
              font-size: 0.98rem;
              color: #2d3748;
            }
            .skill-tag {
              background: linear-gradient(90deg, #2b6cb0 80%, #2563eb 100%);
              color: #fff;
              padding: 0.18rem 0.7rem 0.18rem 0.7rem;
              border-radius: 16px;
              font-size: 0.95rem;
              display: flex;
              align-items: center;
              gap: 0.35rem;
              box-shadow: 0 2px 8px rgba(43,108,176,0.08);
            }
            .remove-skill {
              margin-left: 0.3em;
              background: none;
              border: none;
              color: #e53e3e;
              cursor: pointer;
              font-weight: 500;
              font-size: 1em;
              line-height: 1;
              transition: color 0.2s;
            }
            .remove-skill:hover {
              color: #b91c1c;
            }
            .pro-checkbox {
              margin: 0;
              vertical-align: middle;
              position: relative;
              top: 0;
            }
            .pro-checkbox-text {
              display: inline-block;
              vertical-align: middle;
            }

        .remove-skill {
          cursor: pointer;
          font-weight: bold;
          font-size: 1.2rem;
          line-height: 1;
        }

        .remove-skill:hover {
          color: #fed7d7;
        }

        .radio-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .radio-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-weight: normal;
          user-select: none;
        }

        .radio-label input[type="radio"] {
          margin: 0;
          width: auto;
          height: 16px;
          width: 16px;
          vertical-align: middle;
          position: relative;
          top: -1px;
        }
        
        .radio-text {
          display: inline-block;
          vertical-align: middle;
          line-height: 1;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        .save-draft-btn {
          background: #718096;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .save-draft-btn:hover {
          background: #4a5568;
        }

        .submit-btn {
          background: #2b6cb0;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .submit-btn:hover:not(:disabled) {
          background: #2c5282;
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-message {
          background: #fed7d7;
          color: #c53030;
          padding: 0.75rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }

        .field-error {
          color: #e53e3e;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

        @media (max-width: 768px) {
            .pro-checkbox-group-grid {
              grid-template-columns: 1fr;
              max-height: 56px; /* Show 2 skills at a time on mobile */
              overflow-y: auto;
            }
          .post-job-container {
            padding: 1rem;
          }

          .post-job-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }
        }
        .custom-skill-actions {
          display: flex;
          gap: 0.5em;
          margin-top: 0.5em;
        }
        .add-btn, .clear-btn {
          background: #e2e8f0;
          color: #2b6cb0;
          border: none;
          border-radius: 6px;
          padding: 0.4em 1em;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s, color 0.2s, box-shadow 0.2s;
        }
        .add-btn:hover, .add-btn:focus {
          background: #2b6cb0;
          color: #fff;
          box-shadow: 0 2px 8px rgba(43,108,176,0.12);
        }
        .clear-btn:hover, .clear-btn:focus {
          background: #fed7d7;
          color: #c53030;
          box-shadow: 0 2px 8px rgba(197,48,48,0.12);
        }
        @media (max-width: 600px) {
          .custom-skill-actions {
            flex-direction: column;
            gap: 0.3em;
            width: 100%;
          }
          .add-btn, .clear-btn {
            width: 100%;
            padding: 0.5em 0;
          }
        }
        .custom-skill-actions {
          display: flex;
          gap: 0.5em;
          margin-top: 0.5em;
        }
        .add-btn, .clear-btn {
          background: #e2e8f0;
          color: #2b6cb0;
          border: none;
          border-radius: 6px;
          padding: 0.4em 1em;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s, color 0.2s, box-shadow 0.2s;
        }
        .add-btn:hover, .add-btn:focus {
          background: #2b6cb0;
          color: #fff;
          box-shadow: 0 2px 8px rgba(43,108,176,0.12);
        }
        .clear-btn:hover, .clear-btn:focus {
          background: #fed7d7;
          color: #c53030;
          box-shadow: 0 2px 8px rgba(197,48,48,0.12);
        }
        @media (max-width: 600px) {
          .custom-skill-actions {
            flex-direction: column;
            gap: 0.3em;
            width: 100%;
          }
          .add-btn, .clear-btn {
            width: 100%;
            padding: 0.5em 0;
          }
        }
      `}</style>
    </div>
  )
}

export default PostJob
