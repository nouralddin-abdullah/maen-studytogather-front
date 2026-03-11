import { apiClient, ENDPOINTS } from "@/api";

/**
 * Friendship service — manage friends and friend requests.
 */
const friendshipService = {
  /**
   * Fetch paginated friends list.
   * @param {Object} params - { page, limit, sortBy, order, search }
   */
  async getAll(params = {}) {
    const response = await apiClient.get(ENDPOINTS.FRIENDSHIPS.LIST, {
      params,
    });
    return response.data; // { data: [...], meta: { ... } }
  },

  /**
   * Fetch paginated pending (incoming) friend requests.
   * @param {Object} params - { page, limit, sortBy, order, search }
   */
  async getPending(params = {}) {
    const response = await apiClient.get(ENDPOINTS.FRIENDSHIPS.PENDING, {
      params,
    });
    return response.data;
  },

  /**
   * Accept or reject a friend request.
   * @param {string} id - Friendship ID
   * @param {"accepted"|"rejected"} status
   */
  async respond(id, status) {
    const response = await apiClient.patch(ENDPOINTS.FRIENDSHIPS.RESPOND(id), {
      status,
    });
    return response.data;
  },

  /**
   * Remove a friend.
   * @param {string} id - Friendship ID
   */
  async remove(id) {
    const response = await apiClient.delete(ENDPOINTS.FRIENDSHIPS.REMOVE(id));
    return response.data;
  },

  /**
   * Send a friend request to a user.
   * @param {string} addresseeId - The target user's ID
   */
  async sendRequest(addresseeId) {
    const response = await apiClient.post(ENDPOINTS.FRIENDSHIPS.SEND, {
      addresseeId,
    });
    return response.data;
  },

  /**
   * Get friendship status with a specific user.
   * @param {string} targetId - The other user's ID
   * @returns {{ status: 'NOT_FRIENDS' | 'FRIENDS' | 'PENDING_SENT' | 'PENDING_RECEIVED' }}
   */
  async getStatus(targetId) {
    const response = await apiClient.get(
      ENDPOINTS.FRIENDSHIPS.STATUS(targetId),
    );
    return response.data;
  },

  /**
   * Build the full SSE URL for friend presence updates.
   * @returns {string}
   */
  getSSEUrl() {
    const base =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
    return `${base}${ENDPOINTS.FRIENDSHIPS.LIVE}`;
  },
};

export default friendshipService;
