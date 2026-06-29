import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAlert } from '../context/AlertContext'
import apiService from '../api'
import TermsOfServiceModal from './TermsOfServiceModal'
import {useTranslation} from '../hooks/useTranslation'

function Register() {
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const { t } = useTranslation();

  // TOS Modal state
  const [showTOSModal, setShowTOSModal] = useState(false);
  
  // Barangay data state
  const [barangays, setBarangays] = useState([]);
  const [loadingBarangays, setLoadingBarangays] = useState(false);

  // Add touched and fieldErrors state for password fields
  const [touched, setTouched] = useState({
    password: false,
    confirmPassword: false
  })
  const [fieldErrors, setFieldErrors] = useState({})

  // Validate password fields
  const validateField = (name, value) => {
    switch (name) {
      case 'password':
        if (!value) return 'Password is required'
        if (value.length < 8) return 'Password must be at least 8 characters'
        return ''
      case 'confirmPassword':
        if (!value) return 'Please confirm your password'
        if (value !== formData.password) return 'Passwords do not match'
        return ''
      default:
        return ''
    }
  }

  // Handle blur for password fields
  const handleBlur = (e) => {
    const { name, value } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    const error = validateField(name, value)
    setFieldErrors(prev => ({ ...prev, [name]: error }))
  }

  // Handle focus for password fields
  const handleFocus = (e) => {
    const { name } = e.target
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }))
    }
  }
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  // Password requirements state
  const [requirements, setRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    match: false
  })
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    level: '',
    color: '#ef4444'
  })

  // Password strength checker
  const checkPasswordStrength = (password) => {
    let score = 0
    const newRequirements = { ...requirements }
    // Length check
    if (password.length >= 8) {
      score += 1
      newRequirements.length = true
    } else {
      newRequirements.length = false
    }
    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 1
      newRequirements.uppercase = true
    } else {
      newRequirements.uppercase = false
    }
    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 1
      newRequirements.lowercase = true
    } else {
      newRequirements.lowercase = false
    }
    // Number check
    if (/\d/.test(password)) {
      score += 1
      newRequirements.number = true
    } else {
      newRequirements.number = false
    }
    // Password match check
    if (formData.confirmPassword && password === formData.confirmPassword) {
      newRequirements.match = true
    } else if (formData.confirmPassword) {
      newRequirements.match = false
    }
    setRequirements(newRequirements)
    let level = t('register.passwordStrengthWeak')
    let color = '#ef4444'
    if (score >= 4) {
      level = t('register.passwordStrengthStrong')
      color = '#10b981'
    } else if (score >= 3) {
      level = t('register.passwordStrengthGood')
      color = '#f59e0b'
    } else if (score >= 2) {
      level = t('register.passwordStrengthFair')
      color = '#f97316'
    }
    setPasswordStrength({ score, level, color })
    return score >= 4
  }
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobileNo: '',
    address: '',
    barangay: '',
    gender: '',
    idType: '',
    idNumber: '',
    userType: 'employee',
    skills: [],
    idFrontImage: null,
    idBackImage: null,
    profilePicture: null,
    barangayClearanceImage: null,
    otherBarangay: '',
    otherSkill: '',
    acceptedTOS: false
  })
  
  const [skillsDropdownOpen, setSkillsDropdownOpen] = useState(false)
  const skillsDropdownRef = useRef(null)
  
  // File input refs to maintain file selections
  const idFrontInputRef = useRef(null)
  const idBackInputRef = useRef(null)
  const profilePicInputRef = useRef(null)
  const barangayClearanceInputRef = useRef(null)
  
  // Store file names for display
  const [fileNames, setFileNames] = useState({
    idFrontImage: '',
    idBackImage: '',
    profilePicture: '',
    barangayClearanceImage: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  
  const { isAuthenticated } = useAuth()
  const { success, error: showError } = useAlert()
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate('/landing')
    }
  }, [isAuthenticated, navigate])
  
  // Handle click outside to close the dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      const header = document.querySelector('.custom-select-header');
      const clickedOnHeader = header && header.contains(event.target);
      
      if (skillsDropdownRef.current && 
          !skillsDropdownRef.current.contains(event.target) && 
          !clickedOnHeader) {
        setSkillsDropdownOpen(false);
      }
    }

    // Add event listener when dropdown is open
    if (skillsDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [skillsDropdownOpen])

  // Fetch barangays from Philippine PSGC API
  useEffect(() => {
    const fetchBarangays = async () => {
      setLoadingBarangays(true);
      
      // Complete list of all 35 barangays in San Fernando, Pampanga
      const sanFernandoBarangays = [
        'Alasas',
        'Baliti',
        'Bulaon',
        'Calulut',
        'Dela Paz Norte',
        'Dela Paz Sur',
        'Del Carmen',
        'Del Pilar',
        'Del Rosario',
        'Dolores',
        'Juliana',
        'Lara',
        'Lourdes',
        'Magliman',
        'Maimpis',
        'Malino',
        'Malpitic',
        'Pandaras',
        'Panipuan',
        'Pulung Bulu',
        'Quebiawan',
        'Saguin',
        'San Agustin',
        'San Felipe',
        'San Isidro',
        'San Jose',
        'San Juan',
        'San Nicolas',
        'San Pedro',
        'Santa Lucia',
        'Santa Teresita',
        'Santo Niño',
        'Santo Rosario',
        'Sindalan',
        'Telabastagan'
      ];
      
      try {
        // Try to fetch from API first
        const response = await fetch('https://psgc.gitlab.io/api/cities-municipalities/035414000/barangays');
        const data = await response.json();
        
        console.log('API Response:', data);
        
        if (data && Array.isArray(data) && data.length > 20) {
          // Only use API data if it returns a reasonable number of barangays
          const sortedBarangays = data
            .map(brgy => brgy.name)
            .sort((a, b) => a.localeCompare(b));
          setBarangays(sortedBarangays);
          console.log('Loaded from API:', sortedBarangays.length, 'barangays');
        } else {
          // Use hardcoded list if API returns incomplete data
          setBarangays(sanFernandoBarangays);
          console.log('Using hardcoded list:', sanFernandoBarangays.length, 'barangays');
        }
      } catch (error) {
        console.error('Error fetching barangays:', error);
        // Use hardcoded list on error
        setBarangays(sanFernandoBarangays);
        console.log('Using fallback list:', sanFernandoBarangays.length, 'barangays');
      } finally {
        setLoadingBarangays(false);
      }
    };

    fetchBarangays();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target
    
    if (type === 'file') {
      setFormData(prev => ({
        ...prev,
        [name]: files[0]
      }))
      // Store file name for display
      if (files[0]) {
        setFileNames(prev => ({
          ...prev,
          [name]: files[0].name
        }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
    
    // Special case for barangay field
    if (name === 'barangay' && value === 'other') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        otherBarangay: ''
      }))
    }
    
    // Clear error when user starts typing
    if (error) {
      setError('')
    }
      if (name === 'password' || name === 'confirmPassword') {
        const updatedForm = {
          ...formData,
          [name]: value
        }
        checkPasswordStrength(updatedForm.password, updatedForm.confirmPassword)
    }
  }
  
  // Toggle skills dropdown visibility
  const toggleSkillsDropdown = () => {
    setSkillsDropdownOpen(prev => !prev)
  }
  
  // Handle skill checkbox selection
  const handleSkillCheckbox = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }))
  }

  const checkPasswordsMatch = () => {
    if (formData.confirmPassword === "") {
      setPasswordError("")
      return
    }

    if (formData.password === formData.confirmPassword) {
      setPasswordError("Passwords match!")
    } else {
      setPasswordError("Passwords do not match!")
    }
  }

  useEffect(() => {
    checkPasswordsMatch()
  }, [formData.password, formData.confirmPassword])

  // Validate current step
  const validateStep = (step) => {
    switch(step) {
      case 1: // Personal Information
        if (!formData.firstName || !formData.lastName || !formData.gender) {
          setError("Please fill in all personal information fields");
          return false;
        }
        break;
      case 2: // Account Details
        if (!formData.email || !formData.password || !formData.confirmPassword) {
          setError("Please fill in all account details");
          return false;
        }
        // Check password requirements
        const latestReq = {
          length: formData.password.length >= 8,
          uppercase: /[A-Z]/.test(formData.password),
          lowercase: /[a-z]/.test(formData.password),
          number: /\d/.test(formData.password),
          match: formData.password === formData.confirmPassword
        };
        if (!latestReq.length || !latestReq.uppercase || !latestReq.lowercase || 
            !latestReq.number || !latestReq.match) {
          setError("Password does not meet requirements");
          return false;
        }
        break;
      case 3: // Contact & Location
        if (!formData.mobileNo || !formData.address || !formData.barangay) {
          setError("Please fill in all contact and location fields");
          return false;
        }
        if (formData.barangay === 'other' && !formData.otherBarangay) {
          setError("Please specify your barangay");
          return false;
        }
        break;
      case 4: // Skills & User Type
        if (!formData.userType) {
          setError("Please select a user type");
          return false;
        }
        if (formData.userType === 'employee' && 
            (!formData.skills || formData.skills.length === 0)) {
          setError("Please select at least one skill");
          return false;
        }
        if (formData.skills.includes('Other') && !formData.otherSkill) {
          setError("Please specify your skill");
          return false;
        }
        break;
      case 5: // ID & Documents
        if (!formData.idType || !formData.idNumber || !formData.idFrontImage || !formData.idBackImage || !formData.barangayClearanceImage) {
          setError("Please fill in all ID and document fields");
          return false;
        }
        if (!formData.acceptedTOS) {
          setError("You must accept the Terms of Service to continue");
          return false;
        }
        break;
      default:
        return true;
    }
    setError('');
    return true;
  };

  // Navigate to next step
  const nextStep = async () => {
    if (!validateStep(currentStep)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Check email availability on step 2 before proceeding
    if (currentStep === 2 && formData.email) {
      try {
        setLoading(true);
        const response = await apiService.checkEmail(formData.email);
        
        if (response.exists) {
          const errorMsg = response.alert || 'This email is already registered. Please use a different email or login instead.';
          setError(errorMsg);
          setLoading(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      } catch (error) {
        console.error('Error checking email:', error);
        const errorMessage = error.response?.data?.alert || 
                           error.response?.data?.message || 
                           error.message ||
                           'Failed to verify email availability. Please try again.';
        setError(errorMessage);
        setLoading(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    setLoading(false);
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigate to previous step
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Always check latest requirements before validating
    const latestRequirements = (() => {
      let req = {
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        match: false
      };
      // Length check
      if (formData.password.length >= 8) req.length = true;
      // Uppercase check
      if (/[A-Z]/.test(formData.password)) req.uppercase = true;
      // Lowercase check
      if (/[a-z]/.test(formData.password)) req.lowercase = true;
      // Number check
      if (/\d/.test(formData.password)) req.number = true;
      // Password match check
      if (formData.confirmPassword && formData.password === formData.confirmPassword) req.match = true;
      return req;
    })();

    if (!latestRequirements.length || !latestRequirements.uppercase || !latestRequirements.lowercase || !latestRequirements.number || !latestRequirements.match) {
      setError("Password does not meet requirements.");
      return;
    }
    // Validate that at least one skill is selected if employee
    if (formData.userType === 'employee' && 
        (!formData.skills || formData.skills.length === 0)) {
      setError("Please select at least one skill")
      return
    }

    // Validate TOS acceptance
    if (!formData.acceptedTOS) {
      setError("You must accept the Terms of Service to register");
      return;
    }

    setLoading(true)
    setError('')

    const submitFormData = new FormData()
    
    // Add all text fields
    Object.keys(formData).forEach(key => {
      if (key === 'skills') {
        // Handle skills array - append each skill separately
        if (Array.isArray(formData.skills)) {
          formData.skills.forEach(skill => {
            submitFormData.append("skills", skill);
          });
        }
      } else if (key === 'otherSkill' && formData.skills.includes('Other')) {
        // Add other skill as a skill item
        submitFormData.append("skills", formData.otherSkill);
      } else if (key === 'barangay' && formData.barangay === 'other') {
        // Use the otherBarangay value if barangay is set to 'other'
        submitFormData.append('barangay', formData.otherBarangay);
      } else if (key !== 'confirmPassword' && key !== 'idFrontImage' && key !== 'idBackImage' && 
                key !== 'profilePicture' && key !== 'barangayClearanceImage' && key !== 'skills' && key !== 'otherBarangay' &&
                key !== 'otherSkill') {
        submitFormData.append(key, formData[key])
      }
    })

    // Add files
    if (formData.idFrontImage) {
      submitFormData.append("idFrontImage", formData.idFrontImage)
    }
    if (formData.idBackImage) {
      submitFormData.append("idBackImage", formData.idBackImage)
    }
    if (formData.profilePicture) {
      submitFormData.append("profilePicture", formData.profilePicture)
    }
    if (formData.barangayClearanceImage) {
      submitFormData.append("barangayClearanceImage", formData.barangayClearanceImage)
    }

    try {
      // Using apiService instead of direct fetch for consistent error handling and CORS settings
      const data = await apiService.register(submitFormData);

      if (data && data.success) {
        success(data.alert || 'Registration successful! Please check your email for verification.')
        // Navigate to the success page
        navigate('/registration-success')
      } else {
        // Handle the case where success is false but data is returned
        const errorMessage = data.alert || data.message || "Registration failed. Please try again."
        setError(errorMessage)
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Registration error:', err);
      // Display the actual error message from the API
      const errorMessage = err.response?.data?.alert || 
                          err.response?.data?.message || 
                          err.alert || 
                          err.message || 
                          "Connection error. Please try again."
      setError(errorMessage)
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-container fade-in">
      <div className="register-card">
        <div className="register-header">
          <img src="/logo.png" alt="ResiLinked Logo" className="register-logo" style={{ width: '120px', height: '120px', objectFit: 'contain', borderRadius: '24px', marginBottom: '1.5rem', boxShadow: '0 8px 32px rgba(147, 51, 234, 0.3)' }} />
          <h1>ResiLinked</h1>
          <p>Create a new account</p>
        </div>

        {/* Progress Indicator */}
        <div className="progress-container">
          <div className="progress-steps">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="progress-step-wrapper">
                <div className={`progress-step ${currentStep >= step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}>
                  {currentStep > step ? '✓' : step}
                </div>
                {step < totalSteps && <div className={`progress-line ${currentStep > step ? 'completed' : ''}`}></div>}
              </div>
            ))}
          </div>
          <div className="progress-labels">
            <span className={currentStep === 1 ? 'active' : ''}>Personal</span>
            <span className={currentStep === 2 ? 'active' : ''}>Account</span>
            <span className={currentStep === 3 ? 'active' : ''}>Contact</span>
            <span className={currentStep === 4 ? 'active' : ''}>Skills</span>
            <span className={currentStep === 5 ? 'active' : ''}>Documents</span>
          </div>
        </div>

        {/* Error Display - Positioned at top */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="form-step fade-in">
              <h2 className="step-title">{t('register.step1')}</h2>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">{t('register.firstName')}</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    placeholder={t('register.firstName')}
                    autoComplete="given-name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">{t('register.lastName')}</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    placeholder={t('register.lastName')}
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="gender">{t('register.sex')}</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  required
                  autoComplete="sex"
                >
                  <option value="">{t('common.select')} {t('register.sex')}</option>
                  <option value="male">{t('register.male')}</option>
                  <option value="female">{t('register.female')}</option>
                  <option value="other">{t('register.other')}</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Account Details */}
          {currentStep === 2 && (
            <div className="form-step fade-in">
              <h2 className="step-title">{t('register.step2')}</h2>
              <div className="form-group">
                <label htmlFor="email">{t('register.email')}</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder={t('register.emailPlaceholder')}
                  autoComplete="email"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">{t('register.password')}</label>
                  <div className="input-wrapper" style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      onFocus={handleFocus}
                      required
                      placeholder={t('register.password')}
                      autoComplete="new-password"
                      style={{ paddingRight: '2.5rem' }}
                    />
                    <div 
                      className="password-toggle-icon" 
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? t('register.hidePassword') : t('register.showPassword')}
                      style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', zIndex: 2 }}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      )}
                    </div>
                  </div>
                  {fieldErrors.password && touched.password && (
                    <div className="field-error">{fieldErrors.password}</div>
                  )}
                  {formData.password && (
                    <div className="password-strength">
                      <div className="strength-bar">
                        <div 
                          className="strength-fill"
                          style={{ 
                            width: `${(passwordStrength.score / 4) * 100}%`,
                            backgroundColor: passwordStrength.color 
                          }}
                        ></div>
                      </div>
                      <span 
                        className="strength-text"
                        style={{ color: passwordStrength.color }}
                      >
                        {passwordStrength.level}
                      </span>
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">{t('register.confirmPassword')}</label>
                  <div className="input-wrapper" style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      placeholder={t('register.confirmPasswordPlaceholder')}
                      autoComplete="new-password"
                      style={{
                        borderColor: passwordError === "Passwords match!" ? 'green' : 
                                   passwordError === "Passwords do not match!" ? 'red' : '',
                        paddingRight: '2.5rem'
                      }}
                    />
                    <div 
                      className="password-toggle-icon" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      title={showConfirmPassword ? t('register.hidePassword') : t('register.showPassword')}
                      style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', zIndex: 2 }}
                    >
                      {showConfirmPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {(formData.password || formData.confirmPassword) && (
                <div className="password-requirements">
                  <h4>{t('register.passwordRequirementsTitle')}</h4>
                  <ul>
                    <li className={requirements.length ? 'met' : ''}>
                      <span className="req-icon">{requirements.length ? '✓' : '✗'}</span>
                      {t('register.reqLength')}
                    </li>
                    <li className={requirements.uppercase ? 'met' : ''}>
                      <span className="req-icon">{requirements.uppercase ? '✓' : '✗'}</span>
                      {t('register.reqUppercase')}
                    </li>
                    <li className={requirements.lowercase ? 'met' : ''}>
                      <span className="req-icon">{requirements.lowercase ? '✓' : '✗'}</span>
                      {t('register.reqLowercase')}
                    </li>
                    <li className={requirements.number ? 'met' : ''}>
                      <span className="req-icon">{requirements.number ? '✓' : '✗'}</span>
                      {t('register.reqNumber')}
                    </li>
                    <li className={formData.confirmPassword && formData.password === formData.confirmPassword ? 'met' : ''}>
                      <span className="req-icon">{formData.confirmPassword && formData.password === formData.confirmPassword ? '✓' : '✗'}</span>
                      {t('register.reqMatch')}
                    </li>
                  </ul>
                  <style>{`
                    .password-requirements ul {
                      margin: 0;
                      padding: 0;
                      list-style: none;
                      display: grid;
                      gap: 0.5rem;
                    }
                    .password-requirements li {
                      position: relative;
                      font-size: 0.95rem;
                      color: #64748b;
                      padding-left: 2rem;
                      display: flex;
                      align-items: center;
                      transition: all 0.2s ease;
                    }
                    .password-requirements li .req-icon {
                      position: absolute;
                      left: 0;
                      width: 24px;
                      height: 24px;
                      border-radius: 50%;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      font-size: 1.1rem;
                      font-weight: bold;
                      background: rgba(220, 38, 38, 0.1);
                      color: #dc2626;
                      transition: all 0.2s ease;
                    }
                    .password-requirements li.met {
                      color: #059669;
                      font-weight: 500;
                    }
                    .password-requirements li.met .req-icon {
                      color: white;
                      background: #059669;
                      box-shadow: 0 2px 8px rgba(5, 150, 105, 0.3);
                    }
                  `}</style>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Contact & Location */}
          {currentStep === 3 && (
            <div className="form-step fade-in">
              <h2 className="step-title">{t('register.step3')}</h2>
              <div className="form-group">
                <label htmlFor="mobileNo">{t('register.mobileNumber')}</label>
                <input
                  type="tel"
                  id="mobileNo"
                  name="mobileNo"
                  value={formData.mobileNo}
                  onChange={handleInputChange}
                  required
                  placeholder={t('register.mobilePlaceholder')}
                  autoComplete="tel"
                />
              </div>

              <div className="form-group">
                <label htmlFor="address">{t('register.address')}</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  placeholder={t('register.addressPlaceholder')}
                  autoComplete="street-address"
                />
              </div>

              <div className="form-group">
                <label htmlFor="barangay">{t('register.barangay')}</label>
                <select
                  id="barangay"
                  name="barangay"
                  value={formData.barangay}
                  onChange={handleInputChange}
                  required
                  autoComplete="address-level2"
                  disabled={loadingBarangays}
                >
                  <option value="">
                    {loadingBarangays 
                      ? 'Loading barangays...' 
                      : `${t('common.select')} ${t('register.barangay')}`}
                  </option>
                  {barangays.map((barangay) => (
                    <option key={barangay} value={barangay}>
                      {barangay}
                    </option>
                  ))}
                  <option value="other">{t('register.other')}</option>
                </select>
                {formData.barangay === 'other' && (
                  <input
                    type="text"
                    id="otherBarangay"
                    name="otherBarangay"
                    value={formData.otherBarangay}
                    onChange={handleInputChange}
                    placeholder={t('register.specifyBarangay')}
                    style={{ marginTop: '0.5em' }}
                    required={formData.barangay === 'other'}
                    autoComplete="address-level2"
                  />
                )}
              </div>
            </div>
          )}

          {/* Step 4: Skills & User Type */}
          {currentStep === 4 && (
            <div className="form-step fade-in">
              <h2 className="step-title">{t('register.step4')}</h2>
              <div className="form-group">
                <label htmlFor="userType">{t('register.userType')}</label>
                <select
                  id="userType"
                  name="userType"
                  value={formData.userType}
                  onChange={handleInputChange}
                  required
                  autoComplete="organization-title"
                >
                  <option value="employee">{t('register.employee')}</option>
                  <option value="employer">{t('register.employer')}</option>
                </select>
              </div>

              {formData.userType === 'employee' && (
                <div className="form-group">
                  <label>{t('register.skills')} <span style={{color:'red'}}>*</span></label>
                  <div className="custom-select-container">
                    <div 
                      id="skills"
                      className="custom-select-header"
                      onClick={() => setSkillsDropdownOpen(!skillsDropdownOpen)}
                      style={{
                        borderColor: formData.skills.length > 0 ? '#7e22ce' : 'rgba(147, 51, 234, 0.1)',
                        boxShadow: skillsDropdownOpen ? '0 0 0 2px rgba(126, 34, 206, 0.1)' : 'none'
                      }}
                    >
                      <div className="custom-select-value">
                        {formData.skills.length === 0 
                          ? t('register.selectSkills')
                          : `${formData.skills.length} ${formData.skills.length === 1 ? 'skill' : 'skills'} selected`}
                      </div>
                      <div className="custom-select-arrow" style={{ 
                        transform: skillsDropdownOpen ? 'rotate(180deg)' : 'none' 
                      }}>▼</div>
                    </div>
                    
                    {skillsDropdownOpen && (
                      <div className="custom-select-options" ref={skillsDropdownRef}>
                        {['Plumbing', 'Carpentry', 'Cleaning', 'Electrical', 'Painting', 'Gardening', 
                          'Cooking', 'Driving', 'Babysitting', 'Tutoring', 'IT Support', 'Customer Service', 'Other'].map(skill => (
                          <div key={skill} className="custom-select-option">
                            <label className="checkbox-label">
                              <div className="checkbox-wrapper">
                                <input
                                  type="checkbox"
                                  id={`skill-${skill.toLowerCase().replace(/\s+/g, '-')}`}
                                  name="skills"
                                  checked={formData.skills.includes(skill)}
                                  onChange={() => handleSkillCheckbox(skill)}
                                  className="skill-checkbox"
                                  autoComplete="off"
                                />
                                <div className="checkbox-custom"></div>
                              </div>
                              <span className="checkbox-text">{t(`register.skill${skill.replace(/\s+/g, '')}`)}</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {formData.skills.includes('Other') && (
                    <input
                      type="text"
                      id="otherSkill"
                      name="otherSkill"
                      value={formData.otherSkill || ''}
                      onChange={e => setFormData(prev => ({...prev, otherSkill: e.target.value}))}
                      placeholder={t('register.specifySkill')}
                      style={{ marginTop: '0.5em' }}
                      required={formData.skills.includes('Other')}
                      autoComplete="off"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 5: ID & Documents + TOS */}
          {currentStep === 5 && (
            <div className="form-step fade-in">
              <h2 className="step-title">{t('register.step5')}</h2>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="idType">{t('register.idType')}</label>
                  <select
                    id="idType"
                    name="idType"
                    value={formData.idType}
                    onChange={handleInputChange}
                    required
                    autoComplete="off"
                  >
                    <option value="">{t('register.selectIDType')}</option>
                    <option value="drivers_license">{t('register.idDriversLicense')}</option>
                    <option value="passport">{t('register.idPassport')}</option>
                    <option value="national_id">National ID</option>
                    <option value="voter_id">{t('register.idVoters')}</option>
                    <option value="sss_id">{t('register.idSSS')}</option>
                    <option value="philhealth_id">{t('register.idPhilHealth')}</option>
                    <option value="tin_id">TIN ID</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="idNumber">{t('register.idNumber')}</label>
                  <input
                    type="text"
                    id="idNumber"
                    name="idNumber"
                    value={formData.idNumber}
                    onChange={handleInputChange}
                    required
                    placeholder={t('register.idNumber')}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="idFrontImage">{t('register.idFrontImage')}</label>
                {!fileNames.idFrontImage ? (
                  <input
                    type="file"
                    id="idFrontImage"
                    name="idFrontImage"
                    ref={idFrontInputRef}
                    onChange={handleInputChange}
                    accept="image/*"
                    required
                  />
                ) : (
                  <div className="file-display-wrapper">
                    <div className="file-selected-display">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                        <polyline points="13 2 13 9 20 9"></polyline>
                      </svg>
                      <span className="file-name">{fileNames.idFrontImage}</span>
                      <button 
                        type="button"
                        className="file-remove-btn"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, idFrontImage: null }));
                          setFileNames(prev => ({ ...prev, idFrontImage: '' }));
                          if (idFrontInputRef.current) idFrontInputRef.current.value = '';
                        }}
                        title={t('register.removeFile')}
                      >
                        ×
                      </button>
                    </div>
                    <button
                      type="button"
                      className="file-change-btn"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, idFrontImage: null }));
                        setFileNames(prev => ({ ...prev, idFrontImage: '' }));
                        if (idFrontInputRef.current) idFrontInputRef.current.value = '';
                      }}
                    >
                      {t('register.changeFile')}
                    </button>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="idBackImage">{t('register.idBackImage')}</label>
                {!fileNames.idBackImage ? (
                  <input
                    type="file"
                    id="idBackImage"
                    name="idBackImage"
                    ref={idBackInputRef}
                    onChange={handleInputChange}
                    accept="image/*"
                    required
                  />
                ) : (
                  <div className="file-display-wrapper">
                    <div className="file-selected-display">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                        <polyline points="13 2 13 9 20 9"></polyline>
                      </svg>
                      <span className="file-name">{fileNames.idBackImage}</span>
                      <button 
                        type="button"
                        className="file-remove-btn"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, idBackImage: null }));
                          setFileNames(prev => ({ ...prev, idBackImage: '' }));
                          if (idBackInputRef.current) idBackInputRef.current.value = '';
                        }}
                        title={t('register.removeFile')}
                      >
                        ×
                      </button>
                    </div>
                    <button
                      type="button"
                      className="file-change-btn"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, idBackImage: null }));
                        setFileNames(prev => ({ ...prev, idBackImage: '' }));
                        if (idBackInputRef.current) idBackInputRef.current.value = '';
                      }}
                    >
                      {t('register.changeFile')}
                    </button>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="profilePicture">{t('register.profilePicture')} ({t('common.optional')})</label>
                {!fileNames.profilePicture ? (
                  <input
                    type="file"
                    id="profilePicture"
                    name="profilePicture"
                    ref={profilePicInputRef}
                    onChange={handleInputChange}
                    accept="image/*"
                  />
                ) : (
                  <div className="file-display-wrapper">
                    <div className="file-selected-display">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                        <polyline points="13 2 13 9 20 9"></polyline>
                      </svg>
                      <span className="file-name">{fileNames.profilePicture}</span>
                      <button 
                        type="button"
                        className="file-remove-btn"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, profilePicture: null }));
                          setFileNames(prev => ({ ...prev, profilePicture: '' }));
                          if (profilePicInputRef.current) profilePicInputRef.current.value = '';
                        }}
                        title={t('register.removeFile')}
                      >
                        ×
                      </button>
                    </div>
                    <button
                      type="button"
                      className="file-change-btn"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, profilePicture: null }));
                        setFileNames(prev => ({ ...prev, profilePicture: '' }));
                        if (profilePicInputRef.current) profilePicInputRef.current.value = '';
                      }}
                    >
                      {t('register.changeFile')}
                    </button>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="barangayClearanceImage">{t('register.barangayClearanceImage')}</label>
                {!fileNames.barangayClearanceImage ? (
                  <input
                    type="file"
                    id="barangayClearanceImage"
                    name="barangayClearanceImage"
                    ref={barangayClearanceInputRef}
                    onChange={handleInputChange}
                    accept="image/*"
                    required
                  />
                ) : (
                  <div className="file-display-wrapper">
                    <div className="file-selected-display">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                        <polyline points="13 2 13 9 20 9"></polyline>
                      </svg>
                      <span className="file-name">{fileNames.barangayClearanceImage}</span>
                      <button 
                        type="button"
                        className="file-remove-btn"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, barangayClearanceImage: null }));
                          setFileNames(prev => ({ ...prev, barangayClearanceImage: '' }));
                          if (barangayClearanceInputRef.current) barangayClearanceInputRef.current.value = '';
                        }}
                        title={t('register.removeFile')}
                      >
                        ×
                      </button>
                    </div>
                    <button
                      type="button"
                      className="file-change-btn"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, barangayClearanceImage: null }));
                        setFileNames(prev => ({ ...prev, barangayClearanceImage: '' }));
                        if (barangayClearanceInputRef.current) barangayClearanceInputRef.current.value = '';
                      }}
                    >
                      {t('register.changeFile')}
                    </button>
                  </div>
                )}
              </div>

              {/* Terms of Service Checkbox */}
              <div className="tos-container" style={{ marginTop: '1.5rem', marginBottom: '1rem', padding: '1rem', background: 'rgba(147, 51, 234, 0.05)', borderRadius: '12px', border: '2px solid rgba(147, 51, 234, 0.1)' }}>
                <label htmlFor="acceptedTOS" className="tos-checkbox-label" style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    id="acceptedTOS"
                    name="acceptedTOS"
                    checked={formData.acceptedTOS}
                    onChange={(e) => setFormData(prev => ({ ...prev, acceptedTOS: e.target.checked }))}
                    className="tos-checkbox"
                    style={{ marginTop: '4px', marginRight: '10px', cursor: 'pointer' }}
                    required
                    autoComplete="off"
                  />
                  <span className="tos-text" style={{ fontSize: '0.9rem', lineHeight: '1.5', color: '#444' }}>
                    {t('register.tosAgreement')}{' '}
                    <span 
                      onClick={(e) => { e.preventDefault(); setShowTOSModal(true); }} 
                      className="tos-link"
                      style={{ color: '#7c3aed', fontWeight: '700', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      {t('register.termsOfService')}
                    </span>. 
                    {t('register.tosDisclaimer')} <span style={{color:'red', fontWeight:'bold'}}>*</span>
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="form-navigation">
            {currentStep > 1 && (
              <button 
                type="button" 
                className="nav-btn prev-btn" 
                onClick={prevStep}
              >
                ← {t('register.previous')}
              </button>
            )}
            {currentStep < totalSteps ? (
              <button 
                type="button" 
                className="nav-btn next-btn" 
                onClick={nextStep}
                style={{ marginLeft: currentStep === 1 ? 'auto' : '0' }}
              >
                {t('register.next')} →
              </button>
            ) : (
              <button 
                type="submit" 
                className="nav-btn submit-btn" 
                disabled={loading}
              >
                {loading ? (
                  <div className="btn-loader">
                    <div className="spinner"></div>
                    <span>{t('register.submitting')}</span>
                  </div>
                ) : (
                  t('register.submit')
                )}
              </button>
            )}
          </div>
        </form>

        <div className="register-footer">
          <p>{t('register.alreadyHaveAccount')}</p>
          <Link to="/login" className="login-link">
            {t('register.loginHere')}
          </Link>
        </div>

        <div className="back-home">
          <Link to="/" className="back-home-btn">
            {t('register.returnHome')}
          </Link>
        </div>
      </div>

      <style>{`
        .register-container {
          min-height: 100vh;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 2rem 1rem;
        }

        .register-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><defs><radialGradient id="a" cx="50%" cy="50%"><stop offset="0%" stop-color="%23ffffff" stop-opacity="0.1"/><stop offset="100%" stop-color="%23ffffff" stop-opacity="0"/></radialGradient></defs><circle cx="200" cy="200" r="150" fill="url(%23a)"/><circle cx="800" cy="300" r="100" fill="url(%23a)"/><circle cx="600" cy="700" r="120" fill="url(%23a)"/></svg>') center/cover;
          pointer-events: none;
        }

        /* Progress Indicator Styles */
        .progress-container {
          margin-bottom: 2rem;
          padding: 1.25rem;
          background: linear-gradient(135deg, rgba(147, 51, 234, 0.03), rgba(147, 51, 234, 0.08));
          border-radius: 16px;
          border: 1px solid rgba(147, 51, 234, 0.15);
        }

        .progress-steps {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .progress-step-wrapper {
          display: flex;
          align-items: center;
          flex: 1;
        }

        .progress-step-wrapper:last-child {
          flex: 0;
        }

        .progress-step {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border: 2px solid #e5e7eb;
          color: #9ca3af;
          font-weight: 700;
          font-size: 1rem;
          transition: all 0.3s ease;
          z-index: 1;
          flex-shrink: 0;
        }

        .progress-step.active {
          border-color: #9333ea;
          color: #9333ea;
          background: rgba(147, 51, 234, 0.1);
          box-shadow: 0 0 0 4px rgba(147, 51, 234, 0.1);
        }

        .progress-step.completed {
          background: linear-gradient(135deg, #9333ea, #7c3aed);
          border-color: #9333ea;
          color: white;
        }

        .progress-line {
          flex: 1;
          height: 2px;
          background: #e5e7eb;
          margin: 0 0.5rem;
          transition: all 0.3s ease;
        }

        .progress-line.completed {
          background: linear-gradient(135deg, #9333ea, #7c3aed);
        }

        .progress-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .progress-labels span {
          flex: 1;
          text-align: center;
          transition: color 0.3s ease;
        }

        .progress-labels span.active {
          color: #9333ea;
        }

        /* Form Step Styles */
        .form-step {
          animation: fadeSlideIn 0.3s ease;
        }

        .form-step img:not(.register-logo) {
          max-width: 100%;
          max-height: 250px;
          object-fit: contain;
          border-radius: 8px;
          margin: 0.5rem 0;
        }

        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .step-title {
          font-size: 1.35rem;
          font-weight: 700;
          color: #374151;
          margin-bottom: 1.25rem;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid rgba(147, 51, 234, 0.15);
          background: linear-gradient(135deg, #9333ea, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Form Navigation Styles */
        .form-navigation {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
        }

        .nav-btn {
          flex: 1;
          padding: 1rem 1.5rem;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .prev-btn {
          background: rgba(147, 51, 234, 0.1);
          color: #7c3aed;
          border: 2px solid rgba(147, 51, 234, 0.2);
        }

        .prev-btn:hover {
          background: rgba(147, 51, 234, 0.15);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(147, 51, 234, 0.2);
        }

        .next-btn {
          background: linear-gradient(135deg, #9333ea, #7c3aed);
          color: white;
          box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);
        }

        .next-btn:hover {
          background: linear-gradient(135deg, #7c3aed, #6b21a8);
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(147, 51, 234, 0.4);
        }

        .next-btn:active,
        .prev-btn:active {
          transform: translateY(0);
        }

        .submit-btn {
          background: linear-gradient(135deg, #9333ea, #7c3aed);
          color: white;
          box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);
        }

        .submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #7c3aed, #6b21a8);
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(147, 51, 234, 0.4);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .register-card {
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          box-shadow: 
            0 20px 60px rgba(147, 51, 234, 0.15),
            0 0 0 1px rgba(147, 51, 234, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
          padding: 2.5rem 3rem;
          width: 100%;
          max-width: 720px;
          position: relative;
          border: 1px solid rgba(147, 51, 234, 0.15);
        }



        .register-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .register-logo {
          width: 100px;
          height: 100px;
          border-radius: 20px;
          margin-bottom: 1rem;
          box-shadow: 0 8px 32px rgba(147, 51, 234, 0.25);
        }

        .register-header h1 {
          background: linear-gradient(135deg, #9333ea, #6b21a8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 0.5rem 0;
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .register-header p {
          color: #64748b;
          margin: 0;
          font-size: 0.95rem;
          font-weight: 500;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-bottom: 1.25rem;
        }

        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-row .form-group {
          margin-bottom: 0;
        }

        label {
          display: block;
          margin-bottom: 0.75rem;
          color: #374151;
          font-weight: 600;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        label::after {
          content: ' *';
          color: #dc2626;
          font-weight: bold;
        }

        .form-group:has(input[type="file"]:not([required])) label::after,
        .form-group:has(input[name="skills"]) label::after {
          content: ' (Optional)';
          color: #64748b;
          font-weight: normal;
          text-transform: none;
          font-size: 0.8rem;
        }

        input[type="text"],
        input[type="email"],
        input[type="password"],
        input[type="tel"],
        input[type="file"],
        select {
          width: 100%;
          padding: 1rem 1.25rem;
          border: 2px solid rgba(147, 51, 234, 0.1);
          border-radius: 16px;
          font-size: 1rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-sizing: border-box;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          font-family: inherit;
        }
        
        .custom-select-container {
          position: relative;
          width: 100%;
        }
        
        .custom-select-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          padding: 1rem 1.25rem;
          border: 2px solid rgba(147, 51, 234, 0.1);
          border-radius: 16px;
          font-size: 1rem;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .custom-select-header:hover {
          border-color: rgba(147, 51, 234, 0.2);
        }
        
        .custom-select-value {
          flex: 1;
        }
        
        .custom-select-arrow {
          font-size: 0.8rem;
          color: #666;
          transition: transform 0.2s;
        }
        
        .custom-select-options {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          max-height: 240px;
          overflow-y: auto;
          border: 2px solid rgba(147, 51, 234, 0.1);
          border-radius: 12px;
          background: white;
          z-index: 10;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          animation: fadeIn 0.2s ease-in-out;
          padding: 6px 0;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .custom-select-option {
          padding: 0.6rem 1rem;
          border-bottom: 1px solid rgba(147, 51, 234, 0.05);
        }
        
        .custom-select-option:last-child {
          border-bottom: none;
        }
        
        .custom-select-option:hover {
          background: rgba(147, 51, 234, 0.05);
        }
        
        .checkbox-label {
          display: flex;
          align-items: center;
          cursor: pointer;
          width: 100%;
          font-size: 0.9rem;
          font-weight: 500;
        }
        
        .checkbox-wrapper {
          position: relative;
          display: inline-block;
          width: 18px;
          height: 18px;
          flex-shrink: 0;
          margin-right: 10px;
          vertical-align: middle;
        }
        
        .skill-checkbox {
          position: absolute;
          opacity: 0;
          cursor: pointer;
          height: 0;
          width: 0;
        }
        
        .checkbox-custom {
          position: absolute;
          top: 0;
          left: 0;
          height: 18px;
          width: 18px;
          background-color: #fff;
          border: 2px solid #7e22ce;
          border-radius: 4px;
          transition: all 0.2s;
        }
        
        .skill-checkbox:checked ~ .checkbox-custom {
          background-color: #7e22ce;
        }
        
        .checkbox-custom:after {
          content: "";
          position: absolute;
          display: none;
          left: 5px;
          top: 2px;
          width: 4px;
          height: 9px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
        
        .skill-checkbox:checked ~ .checkbox-custom:after {
          display: block;
        }
        
        .checkbox-text {
          display: inline-block;
          vertical-align: middle;
          margin-top: 1px;
          font-size: 0.85rem;
          letter-spacing: 0.5px;
        }
        
        small {
          display: block;
          margin-top: 0.5rem;
          color: #64748b;
          font-size: 0.8rem;
          font-style: italic;
        }

        input:focus,
        select:focus {
          outline: none;
          border-color: #9333ea;
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.1);
          transform: translateY(-1px);
        }

        input:hover,
        select:hover {
          border-color: rgba(147, 51, 234, 0.2);
          background: rgba(255, 255, 255, 0.9);
        }

        select {
          background-image: url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 5"><path fill="%23374151" d="M2 0L0 2h4zm0 5L0 3h4z"/></svg>');
          background-repeat: no-repeat;
          background-position: right 1rem center;
          background-size: 12px;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
        }

        input[type="file"] {
          padding: 0.75rem 1rem;
          cursor: pointer;
          border-style: dashed;
        }

        input[type="file"]::-webkit-file-upload-button {
          background: linear-gradient(135deg, #9333ea, #7c3aed);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          margin-right: 1rem;
          transition: all 0.2s ease;
        }

        input[type="file"]::-webkit-file-upload-button:hover {
          background: linear-gradient(135deg, #7c3aed, #6b21a8);
          transform: translateY(-1px);
        }

        .file-display-wrapper {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .file-display-wrapper img {
          max-width: 100%;
          max-height: 200px;
          object-fit: contain;
          border-radius: 8px;
          border: 2px solid rgba(147, 51, 234, 0.1);
        }

        .file-selected-display {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          background: rgba(147, 51, 234, 0.08);
          border: 2px solid rgba(147, 51, 234, 0.25);
          border-radius: 16px;
          font-size: 0.95rem;
          color: #7c3aed;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .file-selected-display svg {
          flex-shrink: 0;
          color: #7c3aed;
        }

        .file-selected-display .file-name {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #374151;
        }

        .file-remove-btn {
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          border: none;
          background: rgba(220, 38, 38, 0.1);
          color: #dc2626;
          border-radius: 50%;
          font-size: 1.5rem;
          line-height: 1;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 300;
        }

        .file-remove-btn:hover {
          background: #dc2626;
          color: white;
          transform: scale(1.1);
        }

        .file-change-btn {
          padding: 0.65rem 1rem;
          background: rgba(147, 51, 234, 0.1);
          border: 2px solid rgba(147, 51, 234, 0.2);
          color: #7c3aed;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .file-change-btn:hover {
          background: rgba(147, 51, 234, 0.15);
          border-color: rgba(147, 51, 234, 0.3);
          transform: translateY(-1px);
        }

        .file-selected {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: rgba(147, 51, 234, 0.1);
          border: 1px solid rgba(147, 51, 234, 0.2);
          border-radius: 8px;
          font-size: 0.875rem;
          color: #7c3aed;
          font-weight: 500;
        }

        .file-selected svg {
          flex-shrink: 0;
          color: #7c3aed;
        }

        .file-selected span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        small {
          display: block;
          margin-top: 0.5rem;
          color: #64748b;
          font-size: 0.8rem;
          font-style: italic;
        }

        .password-feedback {
          font-size: 0.875rem;
          margin-top: 0.5rem;
          padding: 0.5rem 0.75rem;
          border-radius: 10px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .password-feedback.success {
          color: #059669;
          background: rgba(5, 150, 105, 0.1);
          border: 1px solid rgba(5, 150, 105, 0.2);
        }

        .password-feedback.success::before {
          content: '✓';
          font-weight: bold;
        }

        .password-feedback.error {
          color: #dc2626;
          background: rgba(220, 38, 38, 0.1);
          border: 1px solid rgba(220, 38, 38, 0.2);
        }

        .password-feedback.error::before {
          content: '✗';
          font-weight: bold;
        }

        .register-btn {
          width: 100%;
          background: linear-gradient(135deg, #9333ea, #7c3aed);
          color: white;
          border: none;
          padding: 1.25rem 1.5rem;
          border-radius: 16px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          margin-bottom: 2rem;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(147, 51, 234, 0.3);
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .register-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left 0.3s ease;
        }

        .register-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #7c3aed, #6b21a8);
          transform: translateY(-1px);
          box-shadow: 0 10px 28px rgba(147, 51, 234, 0.35);
        }

        .register-btn:hover:not(:disabled)::before {
          left: 100%;
        }

        .register-btn:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 4px 16px rgba(147, 51, 234, 0.3);
        }

        .register-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
          box-shadow: 0 4px 16px rgba(147, 51, 234, 0.2);
        }

        .btn-loader {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2.5px solid rgba(255, 255, 255, 0.3);
          border-top: 2.5px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .register-footer {
          text-align: center;
          padding-top: 2rem;
          border-top: 1px solid rgba(147, 51, 234, 0.1);
          margin-bottom: 1.5rem;
        }

        .register-footer p {
          margin: 0 0 0.75rem 0;
          color: #64748b;
          font-size: 0.95rem;
          font-weight: 500;
        }

        .login-link {
          color: #059669;
          text-decoration: none;
          font-weight: 700;
          padding: 0.5rem 1rem;
          border-radius: 12px;
          transition: all 0.2s ease;
          display: inline-block;
        }

        .login-link:hover {
          background: rgba(5, 150, 105, 0.1);
          text-decoration: none;
          transform: translateY(-1px);
        }

        .back-home {
          text-align: center;
        }

        .back-home-btn {
          color: #64748b;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          padding: 0.5rem 1rem;
          border-radius: 12px;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .back-home-btn:hover {
          color: #9333ea;
          background: rgba(147, 51, 234, 0.1);
          text-decoration: none;
        }

        .error-message {
          background: linear-gradient(135deg, #fef2f2, #fee2e2);
          color: #dc2626;
          padding: 1rem 1.25rem;
          border-radius: 16px;
          margin-bottom: 1.5rem;
          font-size: 0.95rem;
          font-weight: 500;
          border: 1px solid rgba(220, 38, 38, 0.2);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .error-message::before {
          content: '⚠';
          font-size: 1.1rem;
          flex-shrink: 0;
        }

        .success-message {
          padding: 2.5rem 2rem;
          background: linear-gradient(135deg, #faf5ff, #f3e8ff);
          border-radius: 20px;
          box-shadow: 0 4px 20px rgba(147, 51, 234, 0.1);
        }

        .success-message h2 {
          background: linear-gradient(135deg, #7c3aed, #6b21a8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 2rem;
          margin-top: 0;
          font-size: 2rem;
          font-weight: 700;
          text-align: center;
        }

        /* Horizontal Email Verification Progress */
        .email-verification-progress {
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 3rem 2rem 2rem 2rem;
          background: white;
          border-radius: 16px;
          margin-bottom: 2rem;
          width: 100%;
          position: relative;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .progress-item {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          gap: 0.75rem;
          flex-shrink: 0;
          position: relative;
          z-index: 2;
        }

        .progress-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 700;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          position: relative;
        }

        .progress-item.completed .progress-icon {
          background: linear-gradient(135deg, #ec4899, #db2777);
          color: white;
          border: 4px solid white;
          box-shadow: 0 4px 16px rgba(236, 72, 153, 0.4);
        }

        .progress-item.pending .progress-icon {
          background: white;
          border: 4px solid #e5e7eb;
          color: #9ca3af;
          font-size: 1.75rem;
        }

        .progress-item.pending .progress-icon.pulse {
          animation: iconPulse 2s ease-in-out infinite;
          border-color: #9333ea;
          color: #9333ea;
        }

        @keyframes iconPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(147, 51, 234, 0.4);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 0 8px rgba(147, 51, 234, 0);
          }
        }

        .progress-item.disabled .progress-icon {
          background: #f9fafb;
          border: 4px solid #e5e7eb;
          color: #d1d5db;
          box-shadow: none;
        }

        .progress-label {
          font-size: 0.875rem;
          font-weight: 600;
          text-align: center;
          color: #6b7280;
          white-space: nowrap;
          max-width: 100px;
          line-height: 1.3;
        }

        .progress-item.completed .progress-label {
          color: #ec4899;
          font-weight: 700;
        }

        .progress-item.pending .progress-label {
          color: #374151;
          font-weight: 600;
        }

        .progress-item.disabled .progress-label {
          color: #9ca3af;
        }

        .progress-connector {
          flex: 1;
          height: 4px;
          min-width: 60px;
          max-width: 120px;
          margin: 0 0.5rem;
          border-radius: 2px;
          align-self: flex-start;
          margin-top: 30px;
          position: relative;
          z-index: 1;
        }

        .progress-connector.completed {
          background: linear-gradient(to right, #ec4899, #ec4899);
        }

        .progress-connector.pending {
          background: linear-gradient(to right, #ec4899, #e5e7eb);
        }

        .progress-connector.disabled {
          background: #e5e7eb;
        }

        /* Verification Message Box */
        .verification-message-box {
          display: flex;
          align-items: flex-start;
          gap: 1.5rem;
          padding: 2rem;
          background: linear-gradient(135deg, #fef3f2, #fee2e2);
          border-radius: 16px;
          border: 2px solid rgba(239, 68, 68, 0.2);
          margin-bottom: 2rem;
          text-align: left;
        }

        .message-icon {
          font-size: 3rem;
          flex-shrink: 0;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        }

        .message-content {
          flex: 1;
          text-align: left;
        }

        .message-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #374151;
          margin: 0 0 0.5rem 0;
        }

        .message-text {
          margin: 0;
          color: #6b7280;
          line-height: 1.7;
          font-size: 0.95rem;
        }

        .success-actions {
          text-align: center;
          margin-top: 2rem;
        }

        .login-link-btn {
          display: inline-block;
          padding: 1rem 2.5rem;
          background: linear-gradient(135deg, #9333ea, #7c3aed);
          color: white;
          text-decoration: none;
          font-weight: 700;
          font-size: 1.1rem;
          border-radius: 16px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .login-link-btn:hover {
          background: linear-gradient(135deg, #7c3aed, #6b21a8);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(147, 51, 234, 0.4);
        }

        .fade-in {
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { 
            opacity: 0; 
          }
          to { 
            opacity: 1; 
          }
        }

        @media (max-width: 768px) {
          .register-container {
            padding: 1rem 0.5rem;
          }

          .register-card {
            padding: 2rem 1.5rem;
            border-radius: 20px;
            margin: 0.5rem;
          }

          .register-header h1 {
            font-size: 2rem;
          }

          .register-logo {
            width: 64px;
            height: 64px;
          }

          .form-row {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .form-step img:not(.register-logo) {
            max-height: 180px;
          }

          /* Mobile Email Verification Progress */
          .email-verification-progress {
            padding: 1.5rem 0.5rem;
            overflow-x: auto;
          }

          .progress-item {
            gap: 0.5rem;
          }

          .progress-icon {
            width: 48px;
            height: 48px;
            font-size: 1.5rem;
          }

          .progress-label {
            font-size: 0.75rem;
          }

          .progress-connector {
            min-width: 30px;
            margin: 0 0.25rem;
            margin-bottom: 1.75rem;
          }

          .verification-message-box {
            padding: 1.5rem;
            gap: 1rem;
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          .message-icon {
            font-size: 2.5rem;
          }

          .message-content {
            text-align: center;
          }

          .message-title {
            font-size: 1.1rem;
          }

          .message-text {
            font-size: 0.875rem;
          }

          .success-message {
            padding: 2rem 1.5rem;
          }

          .success-message h2 {
            font-size: 1.5rem;
            margin-bottom: 1.5rem;
            margin-top: 1.5rem;
          }

          .login-link-btn {
            padding: 0.875rem 2rem;
            font-size: 1rem;
            width: 100%;
          }

          .form-row .form-group {
            margin-bottom: 1.75rem;
          }

          input[type="text"],
          input[type="email"],
          input[type="password"],
          input[type="tel"],
          select {
            padding: 0.875rem 1rem;
            font-size: 16px; /* Prevents zoom on iOS */
          }

          .register-btn {
            padding: 1rem 1.25rem;
            font-size: 1rem;
          }

          /* Mobile Progress Indicator */
          .progress-step {
            width: 32px;
            height: 32px;
            font-size: 0.875rem;
          }

          .progress-labels {
            font-size: 0.65rem;
          }

          .progress-container {
            padding: 1rem;
          }

          .step-title {
            font-size: 1.25rem;
          }

          .form-navigation {
            gap: 0.75rem;
          }

          .nav-btn {
            width: 100%;
            padding: 0.875rem 1rem;
            font-size: 0.95rem;
          }
        }

        @media (max-width: 480px) {
          .register-card {
            padding: 1.5rem 1.25rem;
          }

          .register-header {
            margin-bottom: 2rem;
          }

          .register-header h1 {
            font-size: 1.75rem;
          }

          .form-group {
            margin-bottom: 1.5rem;
          }

          .form-step img:not(.register-logo) {
            max-height: 150px;
          }

          .file-display-wrapper img {
            max-height: 150px;
          }
        }

        /* Enhanced input validation states */
        input:valid:not(:placeholder-shown) {
          border-color: #059669;
        }

        input:invalid:not(:placeholder-shown):not(:focus) {
          border-color: #dc2626;
        }

        /* Progress indicator for multi-step feeling */
        .register-header::after {
          content: '';
          position: absolute;
          bottom: -1rem;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 4px;
          background: linear-gradient(135deg, #9333ea, #7c3aed);
          border-radius: 2px;
        }

        .register-header {
          position: relative;
        }

        /* Custom dropdown styles */
        .custom-dropdown-container {
          position: relative;
          width: 100%;
          user-select: none;
          font-size: 1rem;
        }
        
        .custom-dropdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 15px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s;
          min-height: 42px;
          color: #333;
          font-size: 0.9rem;
        }
        
        .custom-dropdown-header:hover {
          border-color: #7e22ce;
        }
        
        .dropdown-selected-value {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
          font-size: 0.9rem;
        }
        
        .dropdown-arrow {
          font-size: 10px;
          color: #555;
          margin-left: 8px;
          transition: transform 0.2s;
        }
        
        .custom-dropdown-options {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-top: 5px;
          max-height: 210px;
          overflow-y: auto;
          z-index: 100;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          padding: 6px 0;
        }
        
        .custom-dropdown-option {
          padding: 10px 15px;
          transition: background-color 0.2s;
        }
        
        .custom-dropdown-option:hover {
          background-color: #f5f3ff;
        }
        
        .checkbox-container {
          display: flex;
          align-items: center;
          cursor: pointer;
          width: 100%;
          font-size: 0.9rem;
        }
        
        .checkbox-checked {
          background-color: #7e22ce !important;
        }
        
        .checkbox-container input[type="checkbox"] {
          margin-right: 8px;
          appearance: none;
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border: 1px solid #7e22ce;
          border-radius: 4px;
          outline: none;
          cursor: pointer;
          position: relative;
          transition: background 0.2s, border-color 0.2s;
        }
        
        .checkbox-container input[type="checkbox"]:checked {
          background: #7e22ce;
        }
        
        .checkbox-container input[type="checkbox"]:checked::after {
          content: "";
          position: absolute;
          left: 5px;
          top: 2px;
          width: 4px;
          height: 8px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
        
        .checkbox-text {
          margin-left: 10px;
          font-size: 0.8rem;
          font-weight: 500;
          color: #444;
        }
        
        .custom-dropdown-option:not(:last-child) {
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }
      `}</style>

      {/* Terms of Service Modal */}
      <TermsOfServiceModal 
        isOpen={showTOSModal} 
        onClose={() => setShowTOSModal(false)} 
      />
    </div>
  )
}

export default Register
