import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import apiService from '../api';
import { getProfilePictureUrl } from '../utils/imageHelper';
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'https://resi-backend-ihyu.vercel.app';

function Chat() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [modalSearchResults, setModalSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [modalSearching, setModalSearching] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [recommendedUsers, setRecommendedUsers] = useState([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [shouldScroll, setShouldScroll] = useState(true);
  const [pendingRecipient, setPendingRecipient] = useState(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const isFirstLoadRef = useRef(true);
  
  const { user } = useAuth();
  const { success, error: showError } = useAlert();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  // Get the current user's ID consistently - try multiple field names
  const currentUserId = user?.userId || user?._id || user?.id;
  
  // Debug: Log user object structure on mount to identify the correct ID field
  useEffect(() => {
    console.log('👤 User object structure:', {
      hasUserId: !!user?.userId,
      has_id: !!user?._id,
      hasId: !!user?.id,
      userKeys: user ? Object.keys(user) : [],
      calculatedId: currentUserId
    });
  }, [user]);

  // Load conversations on mount and handle support contact from navigation state
  useEffect(() => {
    console.log('🚀 Chat component mounted');
    console.log('📍 Location state:', location.state);
    loadConversations();
    
    // Store the recipient info to process after conversations load
    if (location.state?.supportContact) {
      console.log('💼 Support contact detected:', location.state.supportContact);
      setPendingRecipient({ type: 'direct', user: location.state.supportContact });
      // Clear the state so it doesn't trigger again
      window.history.replaceState({}, document.title);
    }
    // If coming from "Message Employer" with recipientEmail/recipientId/recipientName
    else if (location.state?.recipientEmail || location.state?.recipientId || location.state?.recipientName) {
      // Use email first, then ID, then name as fallback
      const searchTerm = location.state.recipientEmail || location.state.recipientId || location.state.recipientName;
      console.log('📧 Message recipient detected:', {
        email: location.state.recipientEmail,
        id: location.state.recipientId,
        name: location.state.recipientName,
        searchTerm
      });
      setPendingRecipient({ type: 'search', searchTerm });
      // Clear the state so it doesn't trigger again
      window.history.replaceState({}, document.title);
    } else {
      console.log('ℹ️ No pending recipient');
    }
  }, []);

  // Handle pending recipient after conversations are loaded
  useEffect(() => {
    if (!loading && conversations.length >= 0 && pendingRecipient) {
      console.log('🎯 Processing pending recipient:', pendingRecipient);
      console.log('📋 Current conversations:', conversations.length);
      
      if (pendingRecipient.type === 'direct') {
        // Direct user object from support contact
        console.log('👤 Direct user:', pendingRecipient.user);
        const existingConv = conversations.find(conv => conv.user._id === pendingRecipient.user._id);
        if (existingConv) {
          console.log('✅ Found existing conversation:', existingConv);
          setSelectedConversation(existingConv);
        } else {
          console.log('🆕 Creating new conversation');
          setSelectedConversation({
            _id: pendingRecipient.user._id,
            user: pendingRecipient.user,
            lastMessage: {},
            unreadCount: 0
          });
          setMessages([]);
        }
        setPendingRecipient(null);
      } else if (pendingRecipient.type === 'search') {
        // Check if searchTerm looks like a MongoDB ObjectId (24 hex characters)
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(pendingRecipient.searchTerm);
        
        if (isObjectId) {
          // It's an ID - fetch user directly by ID
          console.log('🆔 Fetching user by ID:', pendingRecipient.searchTerm);
          apiService.request(`/users/${pendingRecipient.searchTerm}`)
            .then(res => {
              console.log('👤 User by ID response:', res);
              const userObj = res?.user || res?.data?.user || null;
              
              if (userObj && userObj._id) {
                console.log('✅ Found user:', userObj);
                
                // Check if conversation already exists
                const existingConv = conversations.find(conv => conv.user._id === userObj._id);
                if (existingConv) {
                  console.log('✅ Found existing conversation with user');
                  setSelectedConversation(existingConv);
                } else {
                  console.log('🆕 Creating new conversation with user');
                  setSelectedConversation({
                    _id: userObj._id,
                    user: userObj,
                    lastMessage: {},
                    unreadCount: 0
                  });
                  setMessages([]);
                }
              } else {
                console.log('❌ User not found by ID');
                showError(t('chat.errors.recipientNotFound'));
              }
            })
            .catch(err => {
              console.error('❌ Failed to fetch user by ID:', err);
              showError(t('chat.errors.recipientNotFound'));
            })
            .finally(() => {
              setPendingRecipient(null);
            });
        } else {
          // It's not an ID - search by name/email
          console.log('🔍 Searching for user by name/email:', pendingRecipient.searchTerm);
          apiService.searchUsers({ search: pendingRecipient.searchTerm })
            .then(res => {
              console.log('🔍 Search response:', res);
              const users = res?.users || res?.data?.users || res?.data?.data?.users || [];
              console.log('👥 Found users:', users);
              
              if (users.length > 0) {
                const userToMessage = users[0];
                console.log('✅ Selecting user:', userToMessage);
                
                // Check if conversation already exists
                const existingConv = conversations.find(conv => conv.user._id === userToMessage._id);
                if (existingConv) {
                  console.log('✅ Found existing conversation with user');
                  setSelectedConversation(existingConv);
                } else {
                  console.log('🆕 Creating new conversation with user');
                  setSelectedConversation({
                    _id: userToMessage._id,
                    user: userToMessage,
                    lastMessage: {},
                    unreadCount: 0
                  });
                  setMessages([]);
                }
              } else {
                console.log('❌ No users found');
                showError(t('chat.errors.recipientNotFound'));
              }
            })
            .catch(err => {
              console.error('❌ Failed to find recipient:', err);
              showError(t('chat.errors.recipientNotFound'));
            })
            .finally(() => {
              setPendingRecipient(null);
            });
        }
      }
    }
  }, [loading, conversations, pendingRecipient]);

  // Search users when searchQuery changes (sidebar search)
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      setSearching(true);
      apiService.searchUsers({ search: searchQuery.trim() })
        .then(res => {
          console.log('Search response:', res);
          // Try multiple paths to extract users array
          const users = res?.users || res?.data?.users || res?.data?.data?.users || [];
          console.log('Extracted users:', users);
          // Exclude self
          const filteredUsers = users.filter(u => u._id !== user._id);
          console.log('Filtered users (excluding self):', filteredUsers);
          setSearchResults(filteredUsers);
        })
        .catch((err) => {
          console.error('Search error:', err);
          const errorMessage = err.message || t('chat.errors.searchFailed');
          showError(errorMessage);
          setSearchResults([]);
        })
        .finally(() => setSearching(false));
    } else {
      setSearchResults([]);
      setSearching(false);
    }
  }, [searchQuery, user._id]);

  // Search users when modalSearchQuery changes (modal search)
  useEffect(() => {
    if (modalSearchQuery.trim().length > 0) {
      setModalSearching(true);
      apiService.searchUsers({ search: modalSearchQuery.trim() })
        .then(res => {
          console.log('Modal search response:', res);
          const users = res?.users || res?.data?.users || res?.data?.data?.users || [];
          const filteredUsers = users.filter(u => u._id !== user._id);
          setModalSearchResults(filteredUsers);
        })
        .catch((err) => {
          console.error('Modal search error:', err);
          const errorMessage = err.message || t('chat.errors.searchFailed');
          showError(errorMessage);
          setModalSearchResults([]);
        })
        .finally(() => setModalSearching(false));
    } else {
      setModalSearchResults([]);
      setModalSearching(false);
    }
  }, [modalSearchQuery, user._id]);

  // Socket.io connection and real-time listeners (only works when backend supports WebSocket)
  useEffect(() => {
    // Only try Socket.io if BOTH frontend AND backend are running locally
    const isFrontendLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isBackendLocal = SOCKET_URL.includes('localhost') || SOCKET_URL.includes('127.0.0.1');
    
    if (isFrontendLocal && isBackendLocal) {
      try {
        // Initialize socket connection
        socketRef.current = io(SOCKET_URL, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 1000
        });

        socketRef.current.on('connect', () => {
          console.log('🔌 Connected to Socket.io server');
          // Join with user ID
          socketRef.current.emit('join', currentUserId);
        });

        socketRef.current.on('connect_error', (error) => {
          console.log('⚠️ Socket.io not available, using polling fallback');
        });

        // Listen for incoming messages
        socketRef.current.on('receive_message', (message) => {
          console.log('📨 Received real-time message:', message);
          
          // If message is from current conversation, add it
          if (selectedConversation && 
              (message.sender === selectedConversation._id || message.sender._id === selectedConversation._id)) {
            setMessages(prev => [...prev, message]);
            setShouldScroll(true);
            
            // Mark as seen immediately
            apiService.markMessagesAsSeen(selectedConversation._id);
            
            // Notify sender it was seen
            socketRef.current.emit('message_seen', {
              senderId: message.sender._id || message.sender,
              messageId: message._id,
              seenBy: [{ user: user._id, seenAt: new Date() }]
            });
          }
          
          // Reload conversations to update last message
          loadConversations();
        });

        // Listen for message seen notifications
        socketRef.current.on('message_marked_seen', (data) => {
          console.log('✅ Message marked as seen:', data);
          setMessages(prev => prev.map(msg => 
            msg._id === data.messageId 
              ? { ...msg, seenBy: data.seenBy }
              : msg
          ));
        });
      } catch (error) {
        console.log('⚠️ Socket.io failed to initialize, using polling fallback');
      }
    } else {
      console.log('📡 Running on serverless, using polling for messages');
    }

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        console.log('👋 Disconnected from Socket.io server');
      }
    };
  }, [user._id]);

  // Poll for new messages when a conversation is selected (fallback for serverless)
  useEffect(() => {
    // Check if BOTH frontend and backend are on localhost
    const isLocalhost = window.location.hostname === 'localhost' && SOCKET_URL.includes('localhost');
    
    if (selectedConversation && !isLocalhost) {
      console.log('📡 Starting message polling for conversation:', selectedConversation._id);
      isFirstLoadRef.current = true; // Reset on conversation change
      loadMessages(selectedConversation._id);
      
      // Poll every 3 seconds for new messages
      const pollingInterval = setInterval(() => {
        console.log('🔄 Polling for new messages...');
        loadMessages(selectedConversation._id, true); // silent = true for polling
      }, 3000);

      return () => {
        console.log('⏹️ Stopping message polling');
        clearInterval(pollingInterval);
      };
    } else if (selectedConversation) {
      console.log('🏠 Using Socket.io (localhost mode)');
      isFirstLoadRef.current = true;
      // Load initial messages even with Socket.io
      loadMessages(selectedConversation._id);
    }
  }, [selectedConversation]);

  // Manual scroll only when user sends a message
  const scrollToBottom = () => {
    if (shouldScroll && messagesEndRef.current) {
      setTimeout(() => {
        const messagesContainer = messagesEndRef.current.parentElement;
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        setShouldScroll(false);
      }, 100);
    }
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      
      // Fetch both inbox and sent messages to build complete conversation list
      const [inboxResponse, sentResponse] = await Promise.all([
        apiService.getInbox(),
        apiService.getSentMessages()
      ]);
      
      const inboxMessages = inboxResponse?.data?.data?.messages || inboxResponse?.data?.messages || [];
      const sentMessages = sentResponse?.data?.data || sentResponse?.data || [];
      
      // Combine all messages and remove duplicates by _id
      const messageMap = new Map();
      [...inboxMessages, ...sentMessages].forEach(msg => {
        if (!messageMap.has(msg._id)) {
          messageMap.set(msg._id, msg);
        }
      });
      const allMessages = Array.from(messageMap.values());
      const conversationMap = new Map();
      
      // Debug: Log current user info
      const currentUserId = user.userId || user._id || user.id;
      console.log('🔍 Current User:', {
        id: currentUserId,
        fullUser: user,
        totalMessages: allMessages.length
      });
      
      allMessages.forEach(msg => {
        // Skip messages with missing sender or recipient (deleted users)
        const hasSender = msg.sender && typeof msg.sender === 'object' && msg.sender._id;
        const hasRecipient = msg.recipient && typeof msg.recipient === 'object' && msg.recipient._id;
        
        if (!hasSender || !hasRecipient) {
          console.warn('Skipping message with deleted user:', {
            id: msg._id,
            hasSender,
            hasRecipient
          });
          return;
        }
        
        // Determine the other user (not current user)
        // Match by ID or email as fallback
        const currentUserId = user.userId || user._id || user.id;
        const currentUserEmail = user.email;
        
        const isCurrentUserSender = 
          msg.sender._id === currentUserId || 
          (currentUserEmail && msg.sender.email === currentUserEmail);
        
        const isCurrentUserRecipient = 
          msg.recipient._id === currentUserId || 
          (currentUserEmail && msg.recipient.email === currentUserEmail);
        
        // Skip if somehow both or neither match (shouldn't happen)
        if ((!isCurrentUserSender && !isCurrentUserRecipient) || (isCurrentUserSender && isCurrentUserRecipient)) {
          console.warn('Message does not involve current user:', {
            messageId: msg._id,
            currentUserId,
            currentUserEmail,
            senderId: msg.sender._id,
            senderEmail: msg.sender.email,
            recipientId: msg.recipient._id,
            recipientEmail: msg.recipient.email,
            isCurrentUserSender,
            isCurrentUserRecipient
          });
          return;
        }
        
        const otherUser = isCurrentUserSender ? msg.recipient : msg.sender;
        const userId = otherUser._id;
        
        if (!conversationMap.has(userId)) {
          conversationMap.set(userId, {
            _id: userId,
            user: otherUser,
            lastMessage: msg,
            unreadCount: 0
          });
        } else {
          // Update to most recent message
          const existing = conversationMap.get(userId);
          if (new Date(msg.createdAt) > new Date(existing.lastMessage.createdAt)) {
            existing.lastMessage = msg;
          }
        }
        
        // Count unread messages (only received messages that aren't read)
        const isMessageForCurrentUser = 
          msg.recipient._id === currentUserId || 
          (currentUserEmail && msg.recipient.email === currentUserEmail);
        
        if (!msg.isRead && isMessageForCurrentUser) {
          conversationMap.get(userId).unreadCount++;
        }
      });
      
      // Convert to array and sort by most recent message
      const conversationsArray = Array.from(conversationMap.values())
        .sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));
      
      // Ensure uniqueness by user ID before setting state
      const uniqueConversationsArray = Array.from(
        new Map(conversationsArray.map(conv => [conv._id, conv])).values()
      );
      
      console.log('📊 Conversations loaded:', {
        total: conversationsArray.length,
        unique: uniqueConversationsArray.length,
        ids: uniqueConversationsArray.map(c => c._id),
        userNames: uniqueConversationsArray.map(c => `${c.user.firstName} ${c.user.lastName}`)
      });
      
      setConversations(uniqueConversationsArray);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      const errorMessage = error.message || t('chat.errors.loadConversationsFailed');
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendedUsers = async () => {
    try {
      setLoadingRecommended(true);
      // Get users that are opposite type (if employee, show employers and vice versa)
      const oppositeType = user.userType === 'employee' ? 'employer' : 'employee';
      
      console.log('Loading recommended users, oppositeType:', oppositeType);
      const response = await apiService.searchUsers({ userType: oppositeType });
      console.log('Search users response:', response);
      
      const users = response?.users || response?.data?.users || response?.data?.data?.users || [];
      console.log('Extracted users:', users.length, users);
      
      // Exclude self only, show all other users including those with conversations
      const filtered = users
        .filter(u => u._id !== user._id && u._id !== user.id)
        .slice(0, 10); // Increased limit to 10 recommendations
      
      console.log('Filtered recommended users:', filtered.length, filtered);
      setRecommendedUsers(filtered);
    } catch (error) {
      console.error('Failed to load recommended users:', error);
    } finally {
      setLoadingRecommended(false);
    }
  };

  // Load recommended users when conversations are loaded
  useEffect(() => {
    if (conversations.length >= 0 && !loadingRecommended) {
      loadRecommendedUsers();
    }
  }, [conversations.length]);

  // Load recommended users when search is focused
  useEffect(() => {
    if (searchFocused && recommendedUsers.length === 0 && !loadingRecommended) {
      loadRecommendedUsers();
    }
  }, [searchFocused]);

  const loadMessages = async (recipientId, silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      const [inbox, sent] = await Promise.all([
        apiService.getInbox(),
        apiService.getSentMessages()
      ]);
      
      const inboxMsgs = inbox?.data?.data?.messages || inbox?.data?.messages || [];
      const sentMsgs = sent?.data?.data || sent?.data || [];
      
      // Filter messages for this conversation
      const conversationMsgs = [...inboxMsgs, ...sentMsgs]
        .filter(msg => {
          // Skip messages with missing sender or recipient (deleted users)
          const hasSender = msg.sender && typeof msg.sender === 'object' && msg.sender._id;
          const hasRecipient = msg.recipient && typeof msg.recipient === 'object' && msg.recipient._id;
          
          if (!hasSender || !hasRecipient) {
            console.warn('Skipping message with deleted user:', {
              id: msg._id,
              hasSender,
              hasRecipient,
              sender: msg.sender,
              recipient: msg.recipient
            });
            return false;
          }
          
          // Match by ID or email
          const matchesSender = msg.sender._id === recipientId || 
                                (selectedConversation?.user?.email && msg.sender.email === selectedConversation.user.email);
          const matchesRecipient = msg.recipient._id === recipientId || 
                                   (selectedConversation?.user?.email && msg.recipient.email === selectedConversation.user.email);
          
          return matchesSender || matchesRecipient;
        })
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      setMessages(conversationMsgs);
      
      // Mark unread messages as seen (do this even during polling)
      const currentUserId = user._id || user.id;
      const currentUserEmail = user.email;
      
      const unreadMessageIds = conversationMsgs
        .filter(msg => {
          const isForCurrentUser = msg.recipient._id === currentUserId || 
                                    (currentUserEmail && msg.recipient.email === currentUserEmail);
          return !msg.isRead && isForCurrentUser;
        })
        .map(msg => msg._id);
      
      if (unreadMessageIds.length > 0) {
        markMessagesAsSeen(unreadMessageIds);
      }
      
      // Mark unread messages as read
      const unreadMsgs = conversationMsgs.filter(msg => {
        const isForCurrentUser = msg.recipient._id === currentUserId || 
                                  (currentUserEmail && msg.recipient.email === currentUserEmail);
        return !msg.isRead && isForCurrentUser;
      });
      
      for (const msg of unreadMsgs) {
        try {
          await apiService.markMessageAsRead(msg._id);
        } catch (error) {
          console.error('Failed to mark message as read:', error);
        }
      }
      
      // Scroll to bottom ONLY on first load (not during polling)
      if (isFirstLoadRef.current && messagesEndRef.current) {
        isFirstLoadRef.current = false; // Mark as loaded
        const messagesContainer = messagesEndRef.current.parentElement;
        if (messagesContainer) {
          // Use setTimeout to ensure DOM is fully rendered
          setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }, 50);
        }
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      if (!silent) {
        const errorMessage = error.message || t('chat.errors.loadMessagesFailed');
        showError(errorMessage);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const markMessagesAsSeen = async (messageIds) => {
    try {
      await apiService.markMessagesAsSeen(messageIds);
      console.log('✅ Messages marked as seen:', messageIds.length);
    } catch (error) {
      console.error('Failed to mark messages as seen:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedConversation) return;
    
    try {
      setSending(true);
      
      const response = await apiService.sendMessage({
        recipientId: selectedConversation._id,
        subject: `Chat with ${selectedConversation.user.firstName}`,
        content: newMessage.trim()
      });
      
      console.log('Message sent:', response);
      const sentMessage = response.data || response;
      
      // Add message to UI immediately
      setMessages(prev => [...prev, sentMessage]);
      
      // Emit via Socket.io for real-time delivery (only if connected)
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('send_message', {
          recipientId: selectedConversation._id,
          message: sentMessage
        });
        console.log('📤 Message sent via Socket.io');
      } else {
        console.log('📡 Message saved (polling will deliver)');
      }
      
      setNewMessage('');
      setShouldScroll(true);
      scrollToBottom();
      
      // Reload conversations to update the list with new message
      await loadConversations();
      
      // Update the selected conversation to the real one from the list
      setSelectedConversation(prev => {
        const updated = conversations.find(c => c._id === prev._id);
        return updated || prev;
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage = error.message || t('chat.errors.sendMessageFailed');
      showError(errorMessage);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const filteredConversations = searchQuery.trim().length === 0
    ? conversations
    : conversations.filter(conv =>
        `${conv.user.firstName} ${conv.user.lastName}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
  
  // Debug: Check for duplicates
  const conversationIds = filteredConversations.map(c => c._id);
  const uniqueIds = [...new Set(conversationIds)];
  if (conversationIds.length !== uniqueIds.length) {
    console.error('⚠️ Duplicate conversations detected!', {
      total: conversationIds.length,
      unique: uniqueIds.length,
      duplicates: conversationIds.filter((id, index) => conversationIds.indexOf(id) !== index)
    });
  }

  // Start new conversation with searched user
  const handleStartConversation = (userObj) => {
    // Check if conversation already exists
    const existingConv = conversations.find(conv => conv.user._id === userObj._id);
    if (existingConv) {
      setSelectedConversation(existingConv);
    } else {
      // Create a temporary conversation object
      setSelectedConversation({
        _id: userObj._id,
        user: userObj,
        lastMessage: {},
        unreadCount: 0
      });
      setMessages([]);
    }
  };

  const handleViewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const formatTime = (date) => {
    const msgDate = new Date(date);
    const now = new Date();
    const diff = now - msgDate;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      // Today - show time
      return msgDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (days === 1) {
      // Yesterday
      return 'Yesterday ' + msgDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (days < 7) {
      // This week - show day and time
      return msgDate.toLocaleDateString('en-US', { weekday: 'short' }) + ' ' + 
             msgDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else {
      // Older - show date and time
      return msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
             msgDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="chat-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>{t('chat.loadingConversations')}</p>
        </div>
        <style>{chatStyles}</style>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-layout">
        {/* Conversations Sidebar */}
        <div className={`conversations-sidebar ${selectedConversation ? 'mobile-hide' : ''}`}>
          <div className="sidebar-header">
            <h2>{t('chat.messages')}</h2>
            <div className="search-wrapper">
              <span className="search-icon-inline">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder={t('chat.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              />
            </div>
          </div>

          {/* Show search/recommended when focused or typing */}
          {(searchQuery.trim().length > 0 || searchFocused) && (
            <div className="search-results-list">
              {searchQuery.trim().length > 0 && (
                <div className="search-results-header">
                  {searching ? t('chat.searching') : `${t('chat.searchResults')} ${searchResults.length > 0 ? `(${searchResults.length})` : ''}`}
                </div>
              )}
              {searching ? (
                <div className="search-loading">
                  <div className="spinner-sm"></div>
                  <span>{t('chat.searchingUsers')}</span>
                </div>
              ) : (
                <>
                  {/* Only show search results section if there's a search query */}
                  {searchQuery.trim().length > 0 && (
                    <>
                      {searchResults.length > 0 ? (
                        <>
                          <div className="results-section-label">{t('chat.usersFound')}</div>
                          {searchResults.map(userObj => (
                            <div
                              key={userObj._id}
                              className="conversation-item"
                              onClick={() => handleStartConversation(userObj)}
                            >
                              <div className="conv-avatar">
                                {userObj.profilePicture ? (
                                  <img 
                                    src={getProfilePictureUrl(userObj)} 
                                    alt={userObj.firstName}
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <div 
                                  className="avatar-placeholder" 
                                  style={{ display: userObj.profilePicture ? 'none' : 'flex' }}
                                >
                                  {userObj.firstName?.[0]}{userObj.lastName?.[0]}
                                </div>
                                <span className="online-indicator"></span>
                              </div>
                              <div className="conv-info">
                                <div className="conv-header">
                                  <h3>{userObj.firstName} {userObj.lastName}</h3>
                                  <span className="user-type">{userObj.userType}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="search-no-results">
                          <span>{t('chat.noUsersFound')} "{searchQuery}"</span>
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Show recommended users when focused or searching */}
                  {loadingRecommended ? (
                    <>
                      <div className="results-section-label">
                        💡 {t('chat.recommendedPeople')}
                      </div>
                      <div className="search-loading">
                        <div className="spinner-sm"></div>
                        <span>{t('chat.loadingRecommendations')}</span>
                      </div>
                    </>
                  ) : recommendedUsers.length > 0 ? (
                    <>
                      <div className="results-section-label">
                        💡 {t('chat.recommendedPeople')}
                      </div>
                      <div className="recommended-horizontal-list">
                        {recommendedUsers.map(userObj => (
                          <div
                            key={userObj._id}
                            className="recommended-user-card"
                            onClick={() => handleStartConversation(userObj)}
                            title={`${t('chat.startChatWith')} ${userObj.firstName} ${userObj.lastName}`}
                          >
                            <div className="recommended-user-avatar">
                              {userObj.profilePicture ? (
                                <img 
                                  src={getProfilePictureUrl(userObj)} 
                                  alt={userObj.firstName}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div 
                                className="avatar-placeholder" 
                                style={{ display: userObj.profilePicture ? 'none' : 'flex' }}
                              >
                                {userObj.firstName?.[0]}{userObj.lastName?.[0]}
                              </div>
                            </div>
                            <div className="recommended-user-name">
                              {userObj.firstName}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : searchFocused && !searchQuery.trim() ? (
                    <>
                      <div className="results-section-label">
                        💡 {t('chat.recommendedPeople')}
                      </div>
                      <div className="search-no-results">
                        <span>{t('chat.noRecommendations')}</span>
                      </div>
                    </>
                  ) : null}
                </>
              )}
            </div>
          )}

          <div className="conversations-list">
            {filteredConversations.length === 0 && !searchQuery.trim() && !searchFocused ? (
              <div className="empty-state">
                <p>{t('chat.noConversations')}</p>
                <span>{t('chat.startChattingPrompt')}</span>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv._id}
                  className={`conversation-item ${selectedConversation?._id === conv._id ? 'active' : ''}`}
                  onClick={() => setSelectedConversation(conv)}
                >
                  <div className="conv-avatar">
                    {conv.user.profilePicture ? (
                      <img 
                        src={getProfilePictureUrl(conv.user)} 
                        alt={conv.user.firstName}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="avatar-placeholder" 
                      style={{ display: conv.user.profilePicture ? 'none' : 'flex' }}
                    >
                      {conv.user.firstName?.[0]}{conv.user.lastName?.[0]}
                    </div>
                    <span className="online-indicator"></span>
                  </div>
                  <div className="conv-info">
                    <div className="conv-header">
                      <h3>{conv.user.firstName} {conv.user.lastName}</h3>
                      <span className="conv-time">{formatTime(conv.lastMessage.createdAt)}</span>
                    </div>
                    <div className="conv-preview">
                      <p>{conv.lastMessage.content?.substring(0, 50)}...</p>
                      {conv.unreadCount > 0 && (
                        <span className="unread-badge">{conv.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* New Chat Button at Bottom */}
          <div className="sidebar-footer">
            <button 
              className="new-chat-btn"
              onClick={() => setShowNewChatModal(true)}
              title={t('chat.startNewChat')}
            >
              ➕ {t('chat.newChat')}
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className={`chat-area ${!selectedConversation ? 'mobile-hide' : ''}`}>
          {selectedConversation ? (
            <>
              <div className="chat-header">
                <button className="back-button" onClick={() => setSelectedConversation(null)}>
                  ← {t('chat.back')}
                </button>
                <div 
                  className="chat-user-info clickable" 
                  onClick={() => handleViewProfile(selectedConversation.user._id)}
                  title={t('chat.viewProfile')}
                >
                  <div className="chat-avatar">
                    {selectedConversation.user.profilePicture ? (
                      <img 
                        src={getProfilePictureUrl(selectedConversation.user)} 
                        alt={selectedConversation.user.firstName}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="avatar-placeholder" 
                      style={{ display: selectedConversation.user.profilePicture ? 'none' : 'flex' }}
                    >
                      {selectedConversation.user.firstName?.[0]}{selectedConversation.user.lastName?.[0]}
                    </div>
                  </div>
                  <div>
                    <h3>{selectedConversation.user.firstName} {selectedConversation.user.lastName}</h3>
                    <span className="user-type">{selectedConversation.user.userType}</span>
                  </div>
                </div>
              </div>

              <div className="messages-container">
                {messages.map((msg) => {
                  // Try multiple ways to get the sender ID
                  const senderId = String(
                    msg.sender?._id || 
                    msg.sender?.userId || 
                    msg.sender || 
                    ''
                  );
                  const myUserId = String(currentUserId || '');
                  const isOwnMessage = senderId === myUserId;
                  const isSeen = isOwnMessage && msg.seenBy && msg.seenBy.length > 0;
                  
                  return (
                    <div key={msg._id} className={`message-wrapper ${isOwnMessage ? 'own' : 'other'}`}>
                      <div className="message-row">
                        <div className="message-content">
                          <div className="message-bubble">
                            <p>{msg.content}</p>
                          </div>
                          <div className="message-meta">
                            <span className="message-time">{formatTime(msg.createdAt)}</span>
                            {isSeen && <span className="message-seen">{t('chat.seen')}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form className="message-input-container" onSubmit={handleSendMessage}>
                <textarea
                  placeholder={t('chat.typePlaceholder')}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  rows="1"
                  disabled={sending}
                />
                <button type="submit" disabled={!newMessage.trim() || sending}>
                  {sending ? '⏳' : '➤'}
                </button>
              </form>
            </>
          ) : (
            <div className="no-conversation-selected">
              <div className="empty-chat-state">
                <span className="empty-icon">💬</span>
                <h3>{t('chat.selectConversation')}</h3>
                <p>{t('chat.selectConversationPrompt')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="modal-overlay" onClick={() => {
          setShowNewChatModal(false);
          setModalSearchQuery('');
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('chat.startNewChat')}</h3>
              <button className="close-btn" onClick={() => {
                setShowNewChatModal(false);
                setModalSearchQuery('');
              }}>✕</button>
            </div>
            <div className="modal-body">
              <div className="search-box">
                <input
                  type="text"
                  placeholder={t('chat.searchUsersPlaceholder')}
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  autoFocus
                />
                <span className="search-icon">🔍</span>
              </div>

              <div className="user-search-results">
                {modalSearching ? (
                  <div className="search-loading">
                    <div className="spinner-sm"></div>
                    <span>{t('chat.searchingUsers')}</span>
                  </div>
                ) : modalSearchResults.length > 0 ? (
                  <div className="users-list">
                    {modalSearchResults.map(userObj => (
                      <div
                        key={userObj._id}
                        className="user-item"
                        onClick={() => {
                          handleStartConversation(userObj);
                          setShowNewChatModal(false);
                          setModalSearchQuery('');
                        }}
                      >
                        <div className="user-avatar">
                          {userObj.profilePicture ? (
                            <img 
                              src={getProfilePictureUrl(userObj)} 
                              alt={userObj.firstName}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className="avatar-placeholder" 
                            style={{ display: userObj.profilePicture ? 'none' : 'flex' }}
                          >
                            {userObj.firstName?.[0]}{userObj.lastName?.[0]}
                          </div>
                        </div>
                        <div className="user-details">
                          <h4>{userObj.firstName} {userObj.lastName}</h4>
                          <span className="user-type-badge">{userObj.userType}</span>
                          {userObj.email && <p className="user-email">{userObj.email}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : modalSearchQuery.trim().length > 0 ? (
                  <div className="search-no-results">
                    <span>{t('chat.noUsersFound')} "{modalSearchQuery}"</span>
                  </div>
                ) : recommendedUsers.length > 0 ? (
                  <div className="recommended-section">
                    <h4 className="recommended-title">👥 {t('chat.recommendedUsers')}</h4>
                    <div className="users-list">
                      {recommendedUsers.map(userObj => (
                        <div
                          key={userObj._id}
                          className="user-item"
                          onClick={() => {
                            handleStartConversation(userObj);
                            setShowNewChatModal(false);
                            setModalSearchQuery('');
                          }}
                        >
                          <div className="user-avatar">
                            {userObj.profilePicture ? (
                              <img 
                                src={getProfilePictureUrl(userObj)} 
                                alt={userObj.firstName}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className="avatar-placeholder" 
                              style={{ display: userObj.profilePicture ? 'none' : 'flex' }}
                            >
                              {userObj.firstName?.[0]}{userObj.lastName?.[0]}
                            </div>
                          </div>
                          <div className="user-details">
                            <h4>{userObj.firstName} {userObj.lastName}</h4>
                            <span className="user-type-badge">{userObj.userType}</span>
                            {userObj.email && <p className="user-email">{userObj.email}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="search-hint">
                    <p>💡 {t('chat.searchHint')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{chatStyles}</style>
    </div>
  );
}

const chatStyles = `
  .search-results-list {
    border-bottom: 1px solid #e2e8f0;
    background: #f3f4f6;
    padding: 0.5rem 0;
    max-height: 500px;
    overflow-y: auto;
  }
  .search-results-header {
    font-size: 0.95rem;
    font-weight: 600;
    color: #6366f1;
    padding: 0.5rem 1.5rem 0.25rem 1.5rem;
  }
  .search-loading {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    color: #64748b;
  }
  .spinner-sm {
    width: 20px;
    height: 20px;
    border: 3px solid #e2e8f0;
    border-top: 3px solid #6366f1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  .search-no-results {
    padding: 1.5rem;
    text-align: center;
    color: #94a3b8;
    font-size: 0.9rem;
  }
  
  .results-section-label {
    padding: 0.75rem 1rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: #64748b;
    background: #f1f5f9;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-top: 1px solid #e2e8f0;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .recommended-item {
    background: linear-gradient(90deg, #fefce8 0%, #ffffff 100%);
    border-left: 3px solid #eab308;
  }
  
  .recommended-item:hover {
    background: linear-gradient(90deg, #fef3c7 0%, #fefce8 100%);
  }

  .recommended-horizontal-list {
    display: flex;
    gap: 1rem;
    padding: 1rem 1.5rem;
    overflow-x: auto;
    overflow-y: hidden;
    white-space: nowrap;
  }

  .recommended-horizontal-list::-webkit-scrollbar {
    height: 6px;
  }

  .recommended-horizontal-list::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }

  .recommended-horizontal-list::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }

  .recommended-horizontal-list::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }

  .recommended-user-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    min-width: 80px;
    cursor: pointer;
    border-radius: 12px;
    transition: all 0.2s ease;
    background: white;
  }

  .recommended-user-card:hover {
    background: #f8fafc;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .recommended-user-avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    overflow: hidden;
    position: relative;
    flex-shrink: 0;
    border: 3px solid #e2e8f0;
    transition: border-color 0.2s ease;
  }

  .recommended-user-card:hover .recommended-user-avatar {
    border-color: #9333ea;
  }

  .recommended-user-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .recommended-user-avatar .avatar-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: 600;
    font-size: 1rem;
  }

  .recommended-user-name {
    font-size: 0.75rem;
    font-weight: 500;
    color: #475569;
    text-align: center;
    white-space: normal;
    word-break: break-word;
    max-width: 80px;
    line-height: 1.2;
  }
  
  .chat-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
    min-height: calc(100vh - 80px);
  }

  .chat-layout {
    display: grid;
    grid-template-columns: 350px 1fr;
    gap: 0;
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    height: calc(100vh - 120px);
    overflow: hidden;
  }

  /* Conversations Sidebar */
  .conversations-sidebar {
    border-right: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
    background: #f8fafc;
  }

  .sidebar-header {
    padding: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
    background: white;
  }

  .sidebar-header h2 {
    margin: 0 0 1rem 0;
    font-size: 1.5rem;
    color: #1e293b;
  }

  .new-chat-section {
    padding: 1rem;
    background: white;
  }

  .new-chat-btn {
    width: 100%;
    padding: 0.875rem 1rem;
    background: #9333ea;
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.2s;
  }

  .new-chat-btn:hover {
    background: #7c3aed;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);
  }

  .search-wrapper {
    position: relative;
  }

  .search-icon-inline {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    font-size: 1rem;
    color: #94a3b8;
    pointer-events: none;
    z-index: 1;
  }

  .search-wrapper .search-input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 2.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    font-size: 0.95rem;
    transition: all 0.2s;
    background: #f8fafc;
  }

  .search-wrapper .search-input:focus {
    outline: none;
    border-color: #9333ea;
    background: white;
    box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.1);
  }

  .search-wrapper .search-input::placeholder {
    color: #94a3b8;
  }

  .sidebar-footer {
    padding: 1rem;
    background: white;
    border-top: 1px solid #e2e8f0;
    margin-top: auto;
  }

  .conversations-list {
    flex: 1;
    overflow-y: auto;
  }

  .recommended-section {
    padding: 1rem;
    border-top: 1px solid #e2e8f0;
    border-bottom: 1px solid #e2e8f0;
    background: #fefce8;
  }

  .recommended-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .recommended-icon {
    font-size: 1.25rem;
  }

  .recommended-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #854d0e;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .recommended-list {
    display: flex;
    gap: 0.75rem;
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }

  .recommended-list::-webkit-scrollbar {
    height: 4px;
  }

  .recommended-list::-webkit-scrollbar-track {
    background: #fef3c7;
  }

  .recommended-list::-webkit-scrollbar-thumb {
    background: #d97706;
    border-radius: 2px;
  }

  .recommended-user {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: transform 0.2s;
    flex-shrink: 0;
  }

  .recommended-user:hover {
    transform: scale(1.05);
  }

  .recommended-avatar {
    position: relative;
    width: 48px;
    height: 48px;
    flex-shrink: 0;
  }

  .recommended-avatar img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #fbbf24;
  }

  .recommended-avatar .avatar-placeholder {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.875rem;
    border: 2px solid #fbbf24;
  }

  .recommended-name {
    font-size: 0.75rem;
    font-weight: 500;
    color: #78350f;
    text-align: center;
    max-width: 60px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .conversation-item {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    cursor: pointer;
    transition: background 0.2s;
    border-bottom: 1px solid #e2e8f0;
  }

  .conversation-item:hover {
    background: #f1f5f9;
  }

  .conversation-item.active {
    background: #e0e7ff;
    border-left: 4px solid #6366f1;
  }

  .conv-avatar {
    position: relative;
    flex-shrink: 0;
  }

  .conv-avatar img,
  .conv-avatar .avatar-placeholder {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
  }

  .avatar-placeholder {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 1.1rem;
  }

  .online-indicator {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 12px;
    height: 12px;
    background: #10b981;
    border: 2px solid white;
    border-radius: 50%;
  }

  .conv-info {
    flex: 1;
    min-width: 0;
  }

  .conv-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
  }

  .conv-header h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #1e293b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .conv-time {
    font-size: 0.75rem;
    color: #64748b;
    flex-shrink: 0;
  }

  .conv-preview {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .conv-preview p {
    margin: 0;
    font-size: 0.875rem;
    color: #64748b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }

  .unread-badge {
    background: #6366f1;
    color: white;
    border-radius: 12px;
    padding: 0.125rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    margin-left: 0.5rem;
    flex-shrink: 0;
  }

  /* Chat Area */
  .chat-area {
    display: flex;
    flex-direction: column;
    background: white;
  }

  .chat-header {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #e2e8f0;
    background: white;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .back-button {
    display: none;
    padding: 0.5rem 1rem;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 0.9rem;
    color: #475569;
    cursor: pointer;
    transition: background 0.2s;
    align-self: flex-start;
  }

  .back-button:hover {
    background: #e2e8f0;
  }

  .chat-user-info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .chat-user-info.clickable {
    cursor: pointer;
    padding: 0.5rem;
    margin: -0.5rem;
    border-radius: 8px;
    transition: background 0.2s;
  }

  .chat-user-info.clickable:hover {
    background: #f1f5f9;
  }

  .chat-avatar img,
  .chat-avatar .avatar-placeholder {
    width: 45px;
    height: 45px;
    border-radius: 50%;
    object-fit: cover;
  }

  .chat-user-info h3 {
    margin: 0;
    font-size: 1.1rem;
    color: #1e293b;
  }

  .user-type {
    font-size: 0.85rem;
    color: #64748b;
    text-transform: capitalize;
  }

  .messages-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 1.5rem;
    padding-bottom: 4rem;
    background: #f8fafc;
    scroll-behavior: smooth;
    max-height: calc(100vh - 220px);
  }

  .messages-container::-webkit-scrollbar {
    width: 8px;
  }

  .messages-container::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }

  .messages-container::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }

  .messages-container::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }

  .message-wrapper {
    margin-bottom: 1rem;
    display: flex;
  }

  .message-wrapper.own {
    justify-content: flex-end;
  }

  .message-wrapper.other {
    justify-content: flex-start;
  }

  .message-row {
    display: flex;
    max-width: 75%;
    min-width: 120px;
  }

  .message-wrapper.own .message-row {
    margin-left: auto;
  }

  .message-wrapper.other .message-row {
    margin-right: auto;
  }

  .message-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    width: fit-content;
    max-width: 100%;
  }

  .message-wrapper.own .message-content {
    align-items: flex-end;
    margin-left: auto;
  }

  .message-wrapper.other .message-content {
    align-items: flex-start;
    margin-right: auto;
  }

  .message-bubble {
    background: white;
    padding: 0.875rem 1.125rem;
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    word-wrap: break-word;
    overflow-wrap: break-word;
    width: 100%;
    max-width: 100%;
    min-width: 100px;
  }

  .message-wrapper.own .message-bubble {
    background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
    color: white;
    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
  }

  .message-bubble p {
    margin: 0;
    font-size: 1rem;
    line-height: 1.5;
    word-break: break-word;
    overflow-wrap: break-word;
    white-space: pre-wrap;
    font-weight: 500;
  }

  .message-wrapper.own .message-bubble p {
    color: #ffffff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .message-meta {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    padding: 0 0.25rem;
    margin-top: 0.25rem;
    min-height: 16px;
  }

  .message-wrapper.own .message-meta {
    justify-content: flex-end;
  }

  .message-wrapper.other .message-meta {
    justify-content: flex-start;
  }

  .message-time {
    font-size: 0.7rem;
    color: #94a3b8;
    font-weight: 500;
    line-height: 1.2;
    white-space: nowrap;
  }

  .message-seen {
    font-size: 0.7rem;
    color: #10b981;
    font-weight: 600;
    line-height: 1.2;
    white-space: nowrap;
  }

  .message-input-container {
    padding: 1rem 1.5rem;
    border-top: 1px solid #e2e8f0;
    background: white;
    display: flex !important;
    gap: 0.75rem;
    align-items: center;
    position: sticky;
    bottom: 0;
    z-index: 10;
  }

  .message-input-container textarea {
    flex: 1;
    padding: 0.875rem 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    font-size: 0.95rem;
    font-family: inherit;
    resize: none;
    min-height: 44px;
    max-height: 120px;
    transition: border-color 0.2s;
    display: block !important;
    visibility: visible !important;
  }

  .message-input-container textarea:focus {
    outline: none;
    border-color: #6366f1;
  }

  .message-input-container button {
    width: 44px;
    height: 44px;
    padding: 0;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 1.25rem;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .message-input-container button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  }

  .message-input-container button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .no-conversation-selected {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  .empty-chat-state {
    text-align: center;
    color: #64748b;
  }

  .empty-icon {
    font-size: 4rem;
    display: block;
    margin-bottom: 1rem;
  }

  .empty-chat-state h3 {
    margin: 0 0 0.5rem 0;
    color: #1e293b;
    font-size: 1.5rem;
  }

  .empty-chat-state p {
    margin: 0;
    font-size: 1rem;
  }

  .empty-state {
    padding: 3rem 1.5rem;
    text-align: center;
    color: #64748b;
  }

  .empty-state p {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 500;
  }

  .empty-state span {
    font-size: 0.875rem;
  }

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

  @media (max-width: 768px) {
    .chat-container {
      padding: 0;
      min-height: 100vh;
    }

    .chat-layout {
      grid-template-columns: 1fr;
      border-radius: 0;
      height: 100vh;
    }

    .conversations-sidebar.mobile-hide {
      display: none;
    }

    .chat-area.mobile-hide {
      display: none;
    }

    .back-button {
      display: block;
    }

    .sidebar-header {
      padding: 1rem;
    }

    .sidebar-header h2 {
      font-size: 1.25rem;
    }

    .conversation-item {
      padding: 0.875rem;
    }

    .conv-avatar img,
    .conv-avatar .avatar-placeholder {
      width: 40px;
      height: 40px;
    }

    .conv-header h3 {
      font-size: 0.95rem;
    }

    .chat-header {
      padding: 1rem;
    }

    .chat-avatar img,
    .chat-avatar .avatar-placeholder {
      width: 40px;
      height: 40px;
    }

    .chat-user-info h3 {
      font-size: 1rem;
    }

    .messages-container {
      padding: 1rem;
    }

    .message-row {
      max-width: 85%;
    }

    .message-bubble {
      padding: 0.625rem 0.875rem;
    }

    .message-bubble p {
      font-size: 0.9rem;
    }

    .message-input-container {
      padding: 0.75rem 1rem;
      gap: 0.5rem;
    }

    .message-input-container textarea {
      padding: 0.75rem 0.875rem;
      font-size: 0.9rem;
      min-height: 40px;
    }

    .message-input-container button {
      width: 40px;
      height: 40px;
      font-size: 1.1rem;
    }
  }

  @media (max-width: 480px) {
    .message-row {
      max-width: 90%;
    }

    .search-box input {
      font-size: 0.875rem;
      padding: 0.625rem 2rem 0.625rem 0.875rem;
    }

    .empty-icon {
      font-size: 3rem;
    }

    .empty-chat-state h3 {
      font-size: 1.25rem;
    }

    .empty-chat-state p {
      font-size: 0.9rem;
    }
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
    justify-content: center;
    align-items: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease-in;
  }

  .modal-content {
    background: white;
    border-radius: 16px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: slideIn 0.3s ease-out;
  }

  .modal-header {
    padding: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
    color: #1e293b;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #64748b;
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

  .close-btn:hover {
    background: #f1f5f9;
    color: #1e293b;
  }

  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
  }

  .search-box {
    position: relative;
    width: 100%;
  }

  .search-box input {
    width: 100%;
    padding: 0.875rem 3rem 0.875rem 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    font-size: 1rem;
    transition: all 0.2s;
    background: #f8fafc;
  }

  .search-box input:focus {
    outline: none;
    border-color: #9333ea;
    background: white;
    box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.1);
  }

  .search-box input::placeholder {
    color: #94a3b8;
  }

  .search-box .search-icon {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    font-size: 1.25rem;
    color: #94a3b8;
    pointer-events: none;
  }

  .user-search-results {
    margin-top: 1rem;
    max-height: 400px;
    overflow-y: auto;
  }

  .users-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .user-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .user-item:hover {
    background: #f8fafc;
    border-color: #9333ea;
    transform: translateX(4px);
  }

  .user-avatar {
    position: relative;
    width: 50px;
    height: 50px;
    flex-shrink: 0;
  }

  .user-avatar img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }

  .user-avatar .avatar-placeholder {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 1rem;
  }

  .user-details {
    flex: 1;
  }

  .user-details h4 {
    margin: 0 0 0.25rem 0;
    font-size: 1rem;
    color: #1e293b;
  }

  .user-type-badge {
    display: inline-block;
    padding: 0.125rem 0.5rem;
    background: #ede9fe;
    color: #7c3aed;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: capitalize;
  }

  .user-email {
    margin: 0.25rem 0 0 0;
    font-size: 0.875rem;
    color: #64748b;
  }

  .search-hint {
    text-align: center;
    padding: 2rem;
    color: #94a3b8;
  }

  .search-hint p {
    margin: 0;
    font-size: 0.95rem;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideIn {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

export default Chat;
