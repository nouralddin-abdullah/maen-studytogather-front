import { apiClient, ENDPOINTS } from "@/api";

/**
 * Goal service — CRUD for study goals.
 */
const goalService = {
  /**
   * Create a new goal (optionally as a sub-goal).
   * @param {string} title
   * @param {string|null} parentId - parent goal ID for sub-goals
   */
  async create(title, parentId = null) {
    const body = { title };
    if (parentId) body.parentId = parentId;
    const response = await apiClient.post(ENDPOINTS.GOALS.CREATE, body);
    return response.data;
  },

  /**
   * Get the current user's goals.
   */
  async getMyGoals() {
    const response = await apiClient.get(ENDPOINTS.GOALS.MY_GOALS);
    return response.data;
  },

  /**
   * Update a goal (title, isCompleted).
   * @param {string} goalId
   * @param {Object} attrs - { title?, isCompleted? }
   */
  async update(goalId, attrs) {
    const response = await apiClient.patch(ENDPOINTS.GOALS.UPDATE(goalId), attrs);
    return response.data;
  },

  /**
   * Get all participants' goals for a room.
   * @param {string} roomId
   */
  async getRoomGoals(roomId) {
    const response = await apiClient.get(ENDPOINTS.GOALS.ROOM_GOALS(roomId));
    return response.data;
  },

  /**
   * Delete a goal.
   * @param {string} goalId
   */
  async delete(goalId) {
    const response = await apiClient.delete(ENDPOINTS.GOALS.DELETE(goalId));
    return response.data;
  },
};

export default goalService;
