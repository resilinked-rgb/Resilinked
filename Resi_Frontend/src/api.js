class ApiService {
  constructor() {
    // FOR LOCAL TESTING: Use localhost, for production use Vercel
    this.baseURL =
  import.meta.env.VITE_API_URL ||
  "https://resi-backend-ihyu.vercel.app/api";
    this.DEBUG = import.meta.env.MODE === 'development' && import.meta.env.VITE_DEBUG === 'true';
  }

  normalizeEndpoint(endpoint) {
    return endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  }

  async request(endpoint, options = {}) {
    const token = localStorage.getItem("token");
    endpoint = this.normalizeEndpoint(endpoint);

    const defaultHeaders = {
      "Content-Type": "application/json",
    };

    // Only attach Authorization header for protected endpoints
    const protectedRoutes = [
      "/auth/logout",
      "/users/me",
      "/users/edit",
      "/users/goals",
      "/users/applications",
      "/users/notifications",
      "/users/search",
      "/users/support-contact",
      "/jobs/my-jobs",
      "/jobs/my-applications",
      "/jobs/my-matches",
      "/dashboard",
      "/analytics",
      "/auth/me",
      "/users/me/password",
      "/users/me/settings"
    ];
    const isProtected = protectedRoutes.some(route => endpoint.startsWith(route));
    const isAuthRoute = endpoint === "/auth/login" || endpoint === "/auth/register";
    if (token && (isProtected || !isAuthRoute)) {
      defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    const config = {
      method: options.method || "GET",
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      credentials: "include",
      ...options,
    };

    const isFormData = options.body instanceof FormData;
    if (config.body && typeof config.body === "object" && !isFormData) {
      config.body = JSON.stringify(config.body);
    }
    if (isFormData) {
      delete config.headers["Content-Type"];
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);

      const contentType = response.headers.get("content-type");
      let data;
      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else if (contentType?.includes("application/pdf")) {
        data = await response.blob();
      } else {
        data = await response.text();
      }

      if (typeof data === "object" && data !== null) {
        data._httpStatus = response.status;
      }

      if (!response.ok) {
        const isProfilePictureUpload =
          endpoint === "/users/me" && config.method === "PUT" && isFormData;
        const isProfileUpdate =
          endpoint === "/users/me" && config.method === "PUT";

        // Handle rate limiting
        if (response.status === 429) {
          throw new Error(data?.alert || data?.message || "Too many attempts. Please wait and try again later.");
        }

        if (response.status === 401 && !isProfilePictureUpload && !isProfileUpdate) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.dispatchEvent(new Event("storage"));
          throw new Error(data?.alert || data?.message || "Session expired. Please login again.");
        } else if (response.status === 403) {
          throw new Error(data?.alert || data?.message || "Forbidden: You don't have permission");
        } else if (response.status === 404) {
          throw new Error(data?.alert || data?.message || "Resource not found");
        } else if (response.status >= 500) {
          throw new Error(data?.alert || data?.message || "Server error. Please try again later.");
        } else if (response.status === 400) {
          // Handle 400 Bad Request - this is where "Email already registered" comes from
          throw new Error(data?.alert || data?.message || "Bad request. Please check your input.");
        } else {
          if (
            response.status === 401 &&
            (isProfilePictureUpload || isProfileUpdate)
          ) {
            throw new Error(
              data?.alert || data?.message || "Authentication required. Please try saving your changes again."
            );
          }
          throw new Error(
            data?.alert ||
              data?.message ||
              data?.error ||
              `HTTP error! status: ${response.status}`
          );
        }
      }

      return data;
    } catch (error) {
      // Only log in development mode (if DEBUG is explicitly enabled)
      if (this.DEBUG) {
        console.error("❌ API Error:", error.message);
      }

      if (error.name === "TypeError" && error.message.includes("fetch")) {
        throw new Error(
          "Network error. Please check your connection and try again."
        );
      }
      throw error;
    }
  }

  // ================= Auth =================
  async login(credentials) {
    // Never log credentials - security risk
    return this.request("/auth/login", {
      method: "POST",
      body: credentials,
    });
  }

  async register(userData) {
    if (userData.profilePicture instanceof File) {
      const formData = new FormData();
      Object.keys(userData).forEach((key) => {
        if (key === "skills" && Array.isArray(userData[key])) {
          userData[key].forEach((skill) => formData.append("skills", skill));
        } else if (userData[key] != null) {
          formData.append(key, userData[key]);
        }
      });

      return this.request("/auth/register", {
        method: "POST",
        headers: {},
        body: formData,
      });
    } else {
      return this.request("/auth/register", {
        method: "POST",
        body: userData,
      });
    }
  }

  async checkEmail(email) {
    return this.request("/auth/check-email", {
      method: "POST",
      body: { email },
    });
  }

  async verifyEmail(token) {
    return this.request("/auth/verify", {
      method: "POST",
      body: { token },
    });
  }

  async requestPasswordReset(email) {
    return this.request("/auth/reset/request", {
      method: "POST",
      body: { email },
    });
  }

  async resetPassword(token, newPassword) {
    return this.request("/auth/reset", {
      method: "POST",
      body: { token, newPassword },
    });
  }

  async logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("rememberMe");
    localStorage.removeItem("savedEmail");

    try {
      await this.request("/auth/logout", { method: "POST" });
    } catch {
      // Logout failed on server, but local state is cleared
      if (this.DEBUG) {
        console.warn("Server logout failed, but local state cleared");
      }
    }
  }

  // ================= Users =================
  async getProfileMe() {
    return this.request("/users/me");
  }

  async getWorkers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/users/workers${query ? "?" + query : ""}`);
  }

    // Employee dashboard stats
    async getEmployeeDashboardStats(userId) {
      return this.request(`/dashboard/employee/${userId}/stats`);
    }

  async getProfile(userId) {
    return this.request(`/users/${userId}`);
  }
  
  async getUserRatings(userId) {
    return this.request(`/ratings/${userId}`);
  }

  async updateProfile(updates) {
    try {
      return await this.request("/users/me", {
        method: "PUT",
        body: updates,
      });
    } catch (error) {
      if (
        error.message.includes("Session expired") ||
        error.message.includes("Authentication required")
      ) {
        throw new Error("Please check your authentication and try again.");
      }
      throw error;
    }
  }

  async updateProfileWithFile(formData) {
    const token = localStorage.getItem("token");
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    if (!token) {
      throw new Error("Authentication required. Please log in again.");
    }

    // Add required user data to formData
    if (!formData.get('firstName')) formData.append('firstName', userData.firstName || '');
    if (!formData.get('lastName')) formData.append('lastName', userData.lastName || '');
    if (!formData.get('email')) formData.append('email', userData.email || '');

    try {
      return await this.request("/users/me", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      });
    } catch (error) {
      if (
        error.message.includes("Session expired") ||
        error.message.includes("Authentication required")
      ) {
        throw new Error("Please check your authentication and try again.");
      }
      throw error;
    }
  }

  async getWorkers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/users/workers${query ? "?" + query : ""}`);
  }

  // ================= Ratings =================
  async getUserRatings(userId) {
    return this.request(`/ratings/${userId}`);
  }

  async getTopRated() {
    return this.request("/ratings/top-rated");
  }

  async getGivenRatings() {
    return this.request("/ratings/given");
  }

  async rateUser(ratingData) {
    return this.request("/ratings", {
      method: "POST",
      body: ratingData,
    });
  }

  async reportRating(ratingId) {
    return this.request(`/ratings/${ratingId}/report`, {
      method: "POST",
    });
  }

  // ================= Jobs =================
  async getPopularJobs() {
    return this.request("/jobs/popular");
  }

  async getMyMatches() {
    try {
      const result = await this.request("/jobs/my-matches");
      return result;
    } catch (error) {
      if (error.message.includes('Resource not found')) {
        return { jobs: [], error: 'Job matching service not available' };
      }
      throw error;
    }
  }

  async getJobs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/jobs${query ? "?" + query : ""}`);
  }

  async getJob(id) {
    return this.request(`/jobs/${id}`);
  }

  async createJob(jobData) {
    return this.request("/jobs", {
      method: "POST",
      body: jobData,
    });
  }

  async applyToJob(jobId) {
    return this.request(`/jobs/${jobId}/apply`, {
      method: "POST",
    });
  }

  async cancelApplication(jobId) {
    try {
      const result = await this.request(`/jobs/${jobId}/cancel-application`, {
        method: "DELETE",
      });
      
      return result;
    } catch (error) {
      // Enhance error handling to provide better error messages
      if (error.message.includes('No application found')) {
        throw new Error('No application found');
      }
      throw error;
    }
  }

  async getMyJobs() {
    return this.request("/jobs/my-jobs");
  }

  async getMyApplications() {
    return this.request("/jobs/my-applications");
  }

  async getMyApplicationsReceived() {
    return this.request("/jobs/my-applications-received");
  }

  async getMyInvitations() {
    return this.request("/jobs/my-invitations");
  }

  async acceptInvitation(jobId) {
    return this.request(`/jobs/${jobId}/accept-invitation`, {
      method: "POST",
    });
  }

  async declineInvitation(jobId) {
    return this.request(`/jobs/${jobId}/decline-invitation`, {
      method: "POST",
    });
  }

  async searchJobs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/jobs/search${query ? "?" + query : ""}`);
  }

  async closeJob(jobId) {
    return this.request(`/jobs/${jobId}/close`, {
      method: "PUT",
    });
  }
  
  async completeJob(jobId) {
    return this.request(`/jobs/${jobId}/complete`, {
      method: "PUT",
    });
  }

  async completeJobWithPayment(jobId, formData) {
    const token = localStorage.getItem("token");
    const apiUrl = import.meta.env.VITE_API_URL || "https://resilinked-api.onrender.com/api";
    
    const response = await fetch(`${apiUrl}/jobs/${jobId}/complete`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData, // FormData with paymentProof file
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.alert || errorData.message || "Failed to complete job");
    }

    return response.json();
  }

  async deleteJob(jobId) {
    return this.request(`/jobs/${jobId}`, {
      method: "DELETE",
    });
  }
  
  async editJob(jobId, jobData) {
    try {
      const result = await this.request(`/jobs/${jobId}`, {
        method: "PUT",
        body: jobData,
      });
      
      return result;
    } catch (error) {
      if (error.message.includes('403') || error.message.includes('Forbidden')) {
        throw new Error('Not authorized: You can only edit your own jobs');
      }
      throw error;
    }
  }

  async assignWorker(jobId, userId) {
    return this.request(`/jobs/${jobId}/assign`, {
      method: "POST",
      body: { userId },
    });
  }

  async rejectApplication(jobId, userId) {
    return this.request(`/jobs/${jobId}/reject`, {
      method: "POST",
      body: { userId },
    });
  }
  
  async inviteWorker(jobId, workerId) {
    if (!jobId || !workerId) {
      throw new Error('Missing jobId or workerId');
    }
    
    try {
      // Verify the job exists first
      try {
        await this.getJob(jobId);
      } catch (jobError) {
        throw new Error('Job not found or no longer available');
      }
      
      // Send the invitation
      const result = await this.request(`/jobs/${jobId}/invite`, {
        method: "POST",
        body: { workerId },
      });
      
      return result;
    } catch (error) {
      // Provide more helpful error messages
      if (error.message.includes('404')) {
        throw new Error('Job not found. It may have been deleted or closed.');
      } else if (error.message.includes('403')) {
        throw new Error('Not authorized to send this invitation.');
      } else if (error.message.includes('400')) {
        throw new Error('Invalid request. Please check worker and job details.');
      } else {
        throw error;
      }
    }
  }

  async updateApplicantStatus(jobId, userId, status) {
    return this.request(`/jobs/${jobId}/applicants/${userId}`, {
      method: "PUT",
      body: { status },
    });
  }

  // ================= Goals =================
  async createGoal(goalData) {
    return this.request("/goals", {
      method: "POST",
      body: goalData,
    });
  }

  async getMyGoals(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/goals${query ? "?" + query : ""}`);
  }

  async updateGoal(goalId, updates) {
    return this.request(`/goals/${goalId}`, {
      method: "PUT",
      body: updates,
    });
  }

  async deleteGoal(goalId) {
    return this.request(`/goals/${goalId}`, {
      method: "DELETE",
    });
  }
  
  async addIncomeToGoal(data) {
    return this.request('/goals/income', {
      method: "POST",
      body: data
    });
  }
  
  async setActiveGoal(goalId, isPriority = false) {
    return this.request(`/goals/${goalId}/activate`, {
      method: "POST",
      body: { isPriority }
    });
  }

  // ================= Notifications =================
  async getNotifications(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/notifications${query ? "?" + query : ""}`);
  }

  async markNotificationAsRead(notificationId) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: "PATCH",
    });
  }

  async markAllNotificationsAsRead() {
    return this.request("/notifications/read-all", {
      method: "PATCH",
      body: { all: true },
    });
  }

  async deleteNotification(notificationId) {
    return this.request(`/notifications/${notificationId}`, {
      method: "DELETE",
    });
  }

  // ================= Reports =================
  async reportUser(reportData) {
    return this.request("/reports/user", {
      method: "POST",
      body: reportData,
    });
  }

  async reportJob(reportData) {
    return this.request("/reports/job", {
      method: "POST",
      body: reportData,
    });
  }

  async getReports() {
    return this.request("/reports");
  }

  async updateReportStatus(reportId, status) {
    return this.request(`/reports/${reportId}`, {
      method: "PATCH",
      body: { status },
    });
  }

  // ================= Support Tickets =================
  async createSupportTicket(ticketData) {
    return this.request("/support", {
      method: "POST",
      body: ticketData,
    });
  }

  async getSupportTickets(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/support${query ? "?" + query : ""}`);
  }

  async getSupportTicket(ticketId) {
    return this.request(`/support/${ticketId}`);
  }

  async updateSupportTicket(ticketId, updateData) {
    return this.request(`/support/${ticketId}`, {
      method: "PATCH",
      body: updateData,
    });
  }

  async deleteSupportTicket(ticketId) {
    return this.request(`/support/${ticketId}`, {
      method: "DELETE",
    });
  }

  // ================= Messages =================
  async sendMessage(messageData) {
    return this.request("/messages", {
      method: "POST",
      body: messageData,
    });
  }

  async getInbox() {
    return this.request("/messages/inbox");
  }

  async getSentMessages() {
    return this.request("/messages/sent");
  }

  async getConversation(userId) {
    return this.request(`/messages/conversation/${userId}`);
  }

  async markMessageAsRead(messageId) {
    return this.request(`/messages/${messageId}/read`, {
      method: "PATCH",
    });
  }

  async markMessagesAsSeen(messageIds) {
    return this.request("/messages/seen", {
      method: "POST",
      body: { messageIds },
    });
  }

  async deleteMessage(messageId) {
    return this.request(`/messages/${messageId}`, {
      method: "DELETE",
    });
  }

  async getUnreadCount() {
    return this.request("/messages/unread/count");
  }

  // ================= Chatbot =================
  async chatbotQuery(message, conversationHistory = []) {
    return this.request("/chatbot/query", {
      method: "POST",
      body: { message, conversationHistory },
    });
  }

  // ================= Dashboard =================
  async getDashboardStats() {
    return this.request("/dashboard/barangay");
  }

  // ================= Admin =================
  async getAdminDashboard() {
    return this.request("/admin/dashboard");
  }

  async searchUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/users/search${query ? "?" + query : ""}`);
  }

  async getSupportContact() {
    return this.request("/users/support-contact");
  }

  async searchUsersAdmin(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/admin/users${query ? "?" + query : ""}`);
  }

  async exportUsers(format = "pdf", filters = {}) {
    const query = new URLSearchParams({
      format,
      filters: JSON.stringify(filters),
    }).toString();
    return this.request(`/admin/export/users${query ? "?" + query : ""}`);
  }

  async exportJobs(format = "pdf", filters = {}) {
    const query = new URLSearchParams({
      format,
      filters: JSON.stringify(filters),
    }).toString();
    return this.request(`/admin/export/jobs${query ? "?" + query : ""}`);
  }

  async exportRatings(format = "pdf", filters = {}) {
    const query = new URLSearchParams({
      format,
      filters: JSON.stringify(filters),
    }).toString();
    return this.request(`/admin/export/ratings${query ? "?" + query : ""}`);
  }

  // Soft Delete Management
  async getDeletedUsers() {
    return this.request("/admin/soft-delete/users");
  }

  async getDeletedJobs() {
    return this.request("/admin/soft-delete/jobs");
  }

  async getDeletedGoals() {
    return this.request("/admin/soft-delete/goals");
  }

  async restoreUser(userId) {
    try {
      return await this.request(`/admin/soft-delete/users/${userId}/restore`, {
        method: "POST"
      });
    } catch (error) {
      if (error.message.includes('403') || error.message.includes('Forbidden')) {
        throw new Error('Not authorized: Only administrators can restore deleted users');
      }
      throw error;
    }
  }

  async restoreJob(jobId) {
    try {
      return await this.request(`/admin/soft-delete/jobs/${jobId}/restore`, {
        method: "POST"
      });
    } catch (error) {
      if (error.message.includes('403') || error.message.includes('Forbidden')) {
        throw new Error('Not authorized: Only administrators can restore deleted jobs');
      }
      throw error;
    }
  }

  async restoreGoal(goalId) {
    try {
      return await this.request(`/admin/soft-delete/goals/${goalId}/restore`, {
        method: "POST"
      });
    } catch (error) {
      if (error.message.includes('403') || error.message.includes('Forbidden')) {
        throw new Error('Not authorized: Only administrators can restore deleted goals');
      }
      throw error;
    }
  }

  async permanentlyDeleteUser(userId) {
    try {
      return await this.request(`/admin/soft-delete/users/${userId}/permanent`, {
        method: "DELETE"
      });
    } catch (error) {
      if (error.message.includes('403') || error.message.includes('Forbidden')) {
        throw new Error('Not authorized: Only administrators can permanently delete users');
      }
      throw error;
    }
  }

  async permanentlyDeleteJob(jobId) {
    try {
      return await this.request(`/admin/soft-delete/jobs/${jobId}/permanent`, {
        method: "DELETE"
      });
    } catch (error) {
      if (error.message.includes('403') || error.message.includes('Forbidden')) {
        throw new Error('Not authorized: Only administrators can permanently delete jobs');
      }
      throw error;
    }
  }

  async permanentlyDeleteGoal(goalId) {
    try {
      return await this.request(`/admin/soft-delete/goals/${goalId}/permanent`, {
        method: "DELETE"
      });
    } catch (error) {
      if (error.message.includes('403') || error.message.includes('Forbidden')) {
        throw new Error('Not authorized: Only administrators can permanently delete goals');
      }
      throw error;
    }
  }

  // ================= Activity =================
  async getUserActivity(userId, params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(
      `/activity/users/${userId}${query ? "?" + query : ""}`
    );
  }

  async getRecentActivity(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/activity/recent${query ? "?" + query : ""}`);
  }

  async getMyActivity() {
    return this.request("/activity/me");
  }

  // ================= Change Password =================
  async changePassword({ currentPassword, newPassword }) {
    return this.request("/users/me/password", {
      method: "PUT",
      body: { currentPassword, newPassword },
    });
  }

  // ================= Health Check =================
    // ================= Jobs =================
    async getPopularJobs() {
      return this.request("/jobs/popular", {
        method: "GET"
      });
    }

    async getJobs(params = {}) {
      // params: { limit, sortBy, order, ... }
      const query = new URLSearchParams(params).toString();
      return this.request(`/jobs${query ? `?${query}` : ''}`, {
        method: "GET"
      });
    }

    async getProfile(userId) {
      return this.request(`/users/${userId}`, {
        method: "GET"
      });
    }
  async healthCheck() {
    try {
      const response = await fetch(
        `${this.baseURL.replace("/api", "")}/health`,
        { credentials: "include" }
      );
      return await response.json();
    } catch {
      throw new Error("Service health check failed");
    }
  }

  // ================= Analytics =================
  async getAnalyticsDashboard() {
    return this.request("/analytics/dashboard");
  }

  async getUserGrowth(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/analytics/user-growth${query ? "?" + query : ""}`);
  }

  async getJobStatistics(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/analytics/job-stats${query ? "?" + query : ""}`);
  }

  // ================= User Profile =================
  async getUserById(userId) {
    return this.request(`/users/${userId}`, {
      method: "GET"
    });
  }

  // ================= Employer Jobs =================
  async getCompletedJobsByEmployer(employerId) {
    return this.request(`/jobs/employer/${employerId}/completed`, {
      method: "GET"
    });
  }

  // Email Change Methods
  async requestEmailChange(newEmail) {
    return this.request("/email-change/request", {
      method: "POST",
      body: { newEmail }
    });
  }

  async verifyEmailChange(token) {
    return this.request(`/email-change/verify/${token}`, {
      method: "GET"
    });
  }

  async cancelEmailChange() {
    return this.request("/email-change/cancel", {
      method: "DELETE"
    });
  }

  async getPendingEmailChange() {
    return this.request("/email-change/pending", {
      method: "GET"
    });
  }

  // ================= Payment Methods =================
  async initiatePayment(jobId, paymentMethod, receiptImage = null) {
    return this.request("/payments/initiate", {
      method: "POST",
      body: { jobId, paymentMethod, receiptImage }
    });
  }

  async getPaymentStatus(paymentId) {
    return this.request(`/payments/${paymentId}/status`, {
      method: "GET"
    });
  }

  async getJobPayments(jobId) {
    return this.request(`/payments/job/${jobId}`, {
      method: "GET"
    });
  }

  async getJobPayment(jobId) {
    return this.request(`/payments/job/${jobId}`, {
      method: "GET"
    });
  }

  async getMyPayments(type = 'all') {
    return this.request(`/payments/my-payments?type=${type}`, {
      method: "GET"
    });
  }

  async completePaymentByJobId(jobId) {
    return this.request(`/payments/complete-by-job/${jobId}`, {
      method: "POST"
    });
  }
}

const apiService = new ApiService();

export const apiCall = async (endpoint, method = "GET", data = null) => {
  const options = { method };
  if (data && ["POST", "PUT", "PATCH"].includes(method)) {
    options.body = data;
  }
  return await apiService.request(endpoint, options);
};

export default apiService;
