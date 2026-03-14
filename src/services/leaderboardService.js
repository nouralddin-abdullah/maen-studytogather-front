import apiClient from "@/api/apiClient";
import ENDPOINTS from "@/api/endpoints";

/**
 * Leaderboard API service.
 */
const leaderboardService = {
  /**
   * Fetch paginated global leaderboard.
   * @param {"daily"|"weekly"|"monthly"|"overall"} period
   * @param {number} page
   * @param {number} limit
   */
  getLeaderboard(period = "daily", page = 1, limit = 50) {
    return apiClient
      .get(ENDPOINTS.LEADERBOARD.LIST, { params: { period, page, limit } })
      .then((r) => r.data);
  },

  /**
   * Fetch the current user's rank for a given period.
   * @param {"daily"|"weekly"|"monthly"|"overall"} period
   */
  getMyRank(period = "daily") {
    return apiClient
      .get(ENDPOINTS.LEADERBOARD.ME, { params: { period } })
      .then((r) => r.data);
  },
};

export default leaderboardService;
