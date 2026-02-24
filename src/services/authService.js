import { apiClient, ENDPOINTS } from "@/api";

/**
 * Auth service — handles login, register, and session management.
 * Stateless: stores JWT in localStorage, sends it on every request.
 *
 * API response shape:
 *   { success: boolean, message: string, data: { accessToken, expiresIn, tokenType } }
 */
const authService = {
  /**
   * Register a new user.
   * Sends multipart/form-data (backend expects FormData for avatar support).
   * @param {Object} data - matches CreateUserDto fields
   */
  async register(data) {
    const formData = new FormData();

    // Append required fields
    formData.append("email", data.email);
    formData.append("username", data.username);
    formData.append("password", data.password);
    formData.append("nickName", data.nickName);

    // Append optional fields only if provided
    if (data.country) formData.append("country", data.country);
    if (data.gender) formData.append("gender", data.gender);
    if (data.field) formData.append("field", data.field);
    if (data.avatar) formData.append("avatar", data.avatar);

    const response = await apiClient.post(ENDPOINTS.USERS.SIGNUP, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const { accessToken } = response.data.data;

    if (accessToken) {
      localStorage.setItem("access_token", accessToken);
    }

    // Fetch user profile after signup
    const user = await this.getMe();
    localStorage.setItem("user", JSON.stringify(user));

    return { accessToken, user };
  },

  /**
   * Login with email/username & password.
   * @param {{ loginIdentifier: string, password: string }} credentials
   */
  async login(credentials) {
    const response = await apiClient.post(ENDPOINTS.USERS.SIGNIN, credentials);
    const { accessToken } = response.data.data;

    if (accessToken) {
      localStorage.setItem("access_token", accessToken);
    }

    // Fetch user profile after login
    const user = await this.getMe();
    localStorage.setItem("user", JSON.stringify(user));

    return { accessToken, user };
  },

  /**
   * Get current authenticated user's profile.
   */
  async getMe() {
    const response = await apiClient.get(ENDPOINTS.USERS.ME);
    return response.data;
  },

  /**
   * Logout — clear local storage.
   */
  logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
  },

  /**
   * Check if user is authenticated (has a token stored).
   */
  isAuthenticated() {
    return !!localStorage.getItem("access_token");
  },

  /**
   * Get the stored user object.
   */
  getStoredUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },
};

export default authService;
