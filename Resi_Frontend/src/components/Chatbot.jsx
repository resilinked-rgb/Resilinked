import { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import apiService from '../api';

function Chatbot() {
  const { isAuthenticated } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! 👋 I'm your ResiLinked assistant powered by Google Gemini AI. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickActions = [
    { id: 1, text: "How does ResiLinked work?", icon: "❓" },
    { id: 2, text: "Report a scammer", icon: "⚠️" },
    { id: 3, text: "Submit support ticket", icon: "🎫" },
    { id: 4, text: "Find jobs", icon: "🔍" },
    { id: 5, text: "Post a job", icon: "➕" },
  ];

  const getBotResponse = (userMessage) => {
    const msg = userMessage.toLowerCase();

    // How it works
    if (msg.includes('how') && (msg.includes('work') || msg.includes('use'))) {
      return {
        text: "ResiLinked connects workers and employers in your local community! 🏘️\n\n📋 **For Workers:**\n• Create your profile\n• Search for jobs\n• Apply to opportunities\n• Chat with employers\n\n💼 **For Employers:**\n• Post job listings\n• Review worker profiles\n• Invite workers to jobs\n• Manage applications\n\nIs there anything specific you'd like to know more about?",
        actions: ['Find jobs', 'Post a job']
      };
    }

    // Report scammer
    if (msg.includes('report') || msg.includes('scam')) {
      return {
        text: "I'm sorry you encountered a potential scammer. 😔\n\n**To report a user:**\n1. Go to their profile\n2. Click the 'Report' button\n3. Select the reason (scam, inappropriate behavior, etc.)\n4. Provide details\n\nOur admin team will review the report within 24-48 hours. Your report helps keep our community safe! 🛡️\n\nNeed immediate assistance?",
        actions: ['Submit support ticket', 'Contact admin']
      };
    }

    // Support ticket
    if (msg.includes('support') || msg.includes('ticket') || msg.includes('help') || msg.includes('problem')) {
      return {
        text: "I can help you submit a support ticket! 🎫\n\n**Common issues we can help with:**\n• Account problems\n• Payment issues\n• Profile verification\n• Job posting questions\n• Technical difficulties\n\nWould you like to create a support ticket now?",
        actions: ['Create ticket', 'View my tickets']
      };
    }

    // Find jobs
    if (msg.includes('find') && msg.includes('job')) {
      return {
        text: "Looking for work? Great! 🎯\n\n**Tips for finding jobs:**\n1. Complete your profile with skills\n2. Add a professional photo\n3. Use the search filters (location, job type)\n4. Apply quickly to new postings\n5. Keep your profile updated\n\nReady to start searching?",
        actions: ['Search jobs now']
      };
    }

    // Post job
    if (msg.includes('post') && msg.includes('job')) {
      return {
        text: "Ready to post a job? 📝\n\n**Before posting:**\n• Clear job title and description\n• Specify required skills\n• Set fair compensation\n• Add job location\n• Choose job type (one-time/recurring)\n\n**Tips:**\n✓ Be specific about requirements\n✓ Respond promptly to applicants\n✓ Verify worker profiles\n\nShall I take you to the job posting page?",
        actions: ['Post a job now']
      };
    }

    // Safety
    if (msg.includes('safe') || msg.includes('security')) {
      return {
        text: "Your safety is our priority! 🔒\n\n**Safety tips:**\n• Verify profiles before hiring\n• Read ratings and reviews\n• Meet in public places first\n• Use in-app messaging\n• Report suspicious behavior\n• Never share sensitive personal info\n• Trust your instincts\n\nStay safe out there! 💪",
        actions: ['Report a scammer', 'Safety guidelines']
      };
    }

    // Payment
    if (msg.includes('pay') || msg.includes('money') || msg.includes('price')) {
      return {
        text: "💰 **About payments:**\n\nResiLinked is FREE to use! We don't charge for:\n• Creating an account\n• Posting jobs\n• Applying to jobs\n• Messaging\n\n**Payment between users:**\nPayment terms are agreed upon between worker and employer. We recommend:\n• Discuss payment before starting\n• Put agreements in writing\n• Use secure payment methods\n\nNeed help with a payment dispute?",
        actions: ['Submit support ticket']
      };
    }

    // Profile
    if (msg.includes('profile') || msg.includes('account')) {
      return {
        text: "📱 **Managing your profile:**\n\n• Update your info anytime\n• Add skills to match more jobs\n• Upload a profile picture\n• Keep contact info current\n• Complete verification for trust\n\n**Having trouble with your profile?**",
        actions: ['Go to profile', 'Submit support ticket']
      };
    }

    // Verification
    if (msg.includes('verif') || msg.includes('confirm')) {
      return {
        text: "✅ **Account verification:**\n\nVerified accounts are more trusted!\n\n**To verify:**\n1. Check your email for verification link\n2. Click the link\n3. Your account will be verified\n\n**Didn't receive the email?**\n• Check spam/junk folder\n• Request a new verification email\n• Contact support if issues persist",
        actions: ['Resend verification', 'Submit support ticket']
      };
    }

    // Default response
    return {
      text: "I'm here to help! 😊\n\nI can assist you with:\n• How ResiLinked works\n• Finding or posting jobs\n• Reporting issues\n• Submitting support tickets\n• Safety tips\n• Account help\n\nWhat would you like to know?",
      actions: ['How does it work?', 'Report a scammer', 'Submit ticket']
    };
  };

  const handleSendMessage = async (text = inputText) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg = {
      id: messages.length + 1,
      text: text.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      // Build conversation history for context
      const conversationHistory = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));

      // Get AI response from backend
      const response = await apiService.chatbotQuery(text.trim(), conversationHistory);
      
      const botResponse = response.data?.response || response.response || "I'm having trouble understanding. Could you rephrase that?";
      const source = response.data?.source || response.source || 'unknown';

      console.log(`🤖 Response from: ${source}`);

      // Parse actions from response if needed
      const actions = extractActions(botResponse);

      const botMsg = {
        id: messages.length + 2,
        text: botResponse,
        sender: 'bot',
        timestamp: new Date(),
        actions: actions.length > 0 ? actions : undefined,
        source
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error('Chatbot error:', error);
      
      // Fallback to local response
      const response = getBotResponse(text);
      const botMsg = {
        id: messages.length + 2,
        text: response.text,
        sender: 'bot',
        timestamp: new Date(),
        actions: response.actions,
        source: 'fallback'
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // Extract action buttons from AI response (if it mentions navigation)
  const extractActions = (text) => {
    const actions = [];
    if (text.includes('/search-jobs') || text.toLowerCase().includes('search for jobs')) {
      actions.push('Search jobs now');
    }
    if (text.includes('/post-job') || text.toLowerCase().includes('post a job')) {
      actions.push('Post a job now');
    }
    if (text.includes('/help') || text.toLowerCase().includes('support ticket')) {
      actions.push('Create ticket');
    }
    if (text.includes('/profile')) {
      actions.push('Go to profile');
    }
    return actions;
  };

  const handleQuickAction = (actionText) => {
    handleSendMessage(actionText);
  };

  const handleActionClick = (action) => {
    const actionLower = action.toLowerCase();
    
    if (actionLower.includes('search') || actionLower.includes('find jobs')) {
      navigate('/search-jobs');
      setIsOpen(false);
    } else if (actionLower.includes('post a job')) {
      navigate('/post-job');
      setIsOpen(false);
    } else if (actionLower.includes('create ticket') || actionLower.includes('submit ticket')) {
      navigate('/help');
      setIsOpen(false);
    } else if (actionLower.includes('profile')) {
      navigate('/profile');
      setIsOpen(false);
    } else {
      handleSendMessage(action);
    }
  };

  // Don't render chatbot if user is not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button className="chatbot-button" onClick={() => setIsOpen(true)} title="Chat with ResiLinked Assistant">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" width="36" height="36">
            {/* Robot head */}
            <rect x="6" y="8" width="12" height="10" rx="2" fill="white" stroke="white" strokeWidth="0.5"/>
            {/* Antenna */}
            <line x1="12" y1="8" x2="12" y2="5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="12" cy="4" r="1.5" fill="white"/>
            {/* Eyes */}
            <circle cx="9.5" cy="11" r="1.2" fill="#6366f1"/>
            <circle cx="14.5" cy="11" r="1.2" fill="#6366f1"/>
            {/* Mouth */}
            <rect x="9" y="14" width="6" height="2" rx="1" fill="#6366f1"/>
            {/* Ears/Sensors */}
            <rect x="5" y="11" width="1.5" height="3" rx="0.5" fill="white"/>
            <rect x="17.5" y="11" width="1.5" height="3" rx="0.5" fill="white"/>
          </svg>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <span className="chatbot-avatar">🤖</span>
              <div>
                <h3>ResiLinked Assistant</h3>
                <p>Always here to help!</p>
              </div>
            </div>
            <button className="chatbot-close" onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`chatbot-message ${msg.sender}`}>
                {msg.sender === 'bot' && <span className="message-avatar">🤖</span>}
                <div className="message-content">
                  <div className="message-bubble">
                    <p style={{ whiteSpace: 'pre-line' }}>{msg.text}</p>
                  </div>
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="message-actions">
                      {msg.actions.map((action, idx) => (
                        <button
                          key={idx}
                          className="action-button"
                          onClick={() => handleActionClick(action)}
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="chatbot-message bot">
                <span className="message-avatar">🤖</span>
                <div className="message-content">
                  <div className="message-bubble typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 1 && (
            <div className="quick-actions">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  className="quick-action-btn"
                  onClick={() => handleQuickAction(action.text)}
                >
                  <span className="action-icon">{action.icon}</span>
                  <span className="action-text">{action.text}</span>
                </button>
              ))}
            </div>
          )}

          <form className="chatbot-input" onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
            <input
              type="text"
              placeholder="Type your question..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button type="submit" disabled={!inputText.trim()}>
              ➤
            </button>
          </form>
        </div>
      )}

      <style>{chatbotStyles}</style>
    </>
  );
}

const chatbotStyles = `
  .chatbot-button {
    position: fixed !important;
    bottom: 2rem !important;
    right: 2rem !important;
    width: 64px !important;
    height: 64px !important;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
    color: white !important;
    border: none !important;
    border-radius: 50% !important;
    padding: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    cursor: pointer !important;
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4) !important;
    transition: all 0.3s ease !important;
    z-index: 9999 !important;
    animation: pulse 2s infinite !important;
  }

  @keyframes pulse {
    0%, 100% {
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
    }
    50% {
      box-shadow: 0 4px 30px rgba(99, 102, 241, 0.6);
    }
  }

  .chatbot-button:hover {
    transform: translateY(-4px) scale(1.05) !important;
    box-shadow: 0 8px 30px rgba(99, 102, 241, 0.6) !important;
  }

  .chatbot-button svg {
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  }

  .chatbot-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(99, 102, 241, 0.5);
  }

  .chatbot-icon {
    font-size: 1.5rem;
  }

  .chatbot-container {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    width: 400px;
    height: 600px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    z-index: 1000;
    overflow: hidden;
  }

  .chatbot-header {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    padding: 1.25rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .chatbot-header-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .chatbot-avatar {
    font-size: 2rem;
  }

  .chatbot-header h3 {
    margin: 0;
    font-size: 1.1rem;
  }

  .chatbot-header p {
    margin: 0;
    font-size: 0.85rem;
    opacity: 0.9;
  }

  .chatbot-close {
    color: white !important;
    font-size: 1.5rem !important;

    /* FIXED SIZE so it stays positioned correctly on mobile */
    width: 32px !important;
    height: 32px !important;

    /* Make the hitbox circular but invisible */
    border-radius: 50% !important;

    background: none !important;
    border: none !important;
    padding: 0 !important;
    margin: 0 !important;

    cursor: pointer;

    display: flex;
    align-items: center;
    justify-content: center;

    line-height: 1 !important;

    outline: none !important;
    box-shadow: none !important;

    transition: background 0.15s ease;
}

/* Circle ONLY appears on hover */
.chatbot-close:hover {
    background: rgba(255, 255, 255, 0.25) !important;
}

  .chatbot-messages {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    background: #f8fafc;
  }

  .chatbot-message {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .chatbot-message.user {
    flex-direction: row-reverse;
  }

  .message-avatar {
    font-size: 1.5rem;
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .message-content {
    max-width: 75%;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .message-bubble {
    background: white;
    padding: 0.875rem 1rem;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  .chatbot-message.user .message-bubble {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
  }

  .message-bubble p {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.6;
  }

  .typing-indicator {
    display: flex;
    gap: 0.3rem;
    padding: 0.875rem 1.25rem !important;
  }

  .typing-indicator span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #6366f1;
    animation: typing 1.4s infinite;
  }

  .typing-indicator span:nth-child(2) {
    animation-delay: 0.2s;
  }

  .typing-indicator span:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes typing {
    0%, 60%, 100% {
      transform: translateY(0);
      opacity: 0.7;
    }
    30% {
      transform: translateY(-10px);
      opacity: 1;
    }
  }

  .message-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .action-button {
    background: #e0e7ff;
    color: #6366f1;
    border: 1px solid #c7d2fe;
    padding: 0.5rem 0.875rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }

  .action-button:hover {
    background: #c7d2fe;
    border-color: #a5b4fc;
  }

  .quick-actions {
    padding: 1rem;
    background: white;
    border-top: 1px solid #e2e8f0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

  .quick-action-btn {
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    padding: 0.75rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .quick-action-btn:hover {
    background: #e2e8f0;
    border-color: #cbd5e1;
  }

  .action-icon {
    font-size: 1.5rem;
  }

  .action-text {
    font-size: 0.75rem;
    text-align: center;
    color: #475569;
  }

  .chatbot-input {
    padding: 1rem;
    background: white;
    border-top: 1px solid #e2e8f0;
    display: flex;
    gap: 0.5rem;
  }

  .chatbot-input input {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 0.9rem;
  }

  .chatbot-input input:focus {
    outline: none;
    border-color: #6366f1;
  }

  .chatbot-input button {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s;
  }

  .chatbot-input button:hover:not(:disabled) {
    transform: scale(1.05);
  }

  .chatbot-input button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    .chatbot-button {
      bottom: 1rem;
      right: 1rem;
      padding: 0.875rem 1.25rem;
    }

    .chatbot-container {
      bottom: 0;
      right: 0;
      left: 0;
      width: 100%;
      height: 100vh;
      border-radius: 0;
    }

    .message-content {
      max-width: 85%;
    }
  }
`;

export default Chatbot;
