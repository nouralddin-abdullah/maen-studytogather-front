import { apiClient, ENDPOINTS } from "@/api";

/**
 * Direct Messages service — REST calls for DM conversations.
 */
const dmService = {
  /**
   * Fetch paginated conversation with a friend.
   * @param {string} friendId
   * @param {Object} params - { page, limit }
   */
  async getConversation(friendId, params = {}) {
    const response = await apiClient.get(
      ENDPOINTS.DIRECT_MESSAGES.CONVERSATION(friendId),
      { params },
    );
    return response.data; // { data: [...], meta: { ... } }
  },

  /**
   * Edit a message.
   * @param {string} messageId
   * @param {string} text
   */
  async editMessage(messageId, text) {
    const response = await apiClient.patch(
      ENDPOINTS.DIRECT_MESSAGES.EDIT(messageId),
      { text },
    );
    return response.data;
  },
};

export default dmService;
