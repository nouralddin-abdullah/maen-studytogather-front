import { apiClient, ENDPOINTS } from "@/api";

/**
 * User service — profile viewing, updating, and heatmap data.
 */
const userService = {
  /**
   * Get a user's public profile by ID.
   * (Endpoint not live yet — placeholder for future use.)
   * @param {string} id
   */
  async getProfile(id) {
    const response = await apiClient.get(ENDPOINTS.USERS.PROFILE(id));
    return response.data;
  },

  /**
   * Update current user's profile (multipart — supports avatar + profileBackground).
   * @param {Object} data — plain fields to update
   * @param {File|null} avatarFile — optional avatar file
   * @param {File|null} backgroundFile — optional profile background file
   */
  async updateMe(data, avatarFile = null, backgroundFile = null) {
    const formData = new FormData();

    // Append text fields (skip null/undefined)
    const textFields = [
      "username",
      "nickName",
      "timezone",
      "country",
      "gender",
      "field",
      "quote",
      "discordUsername",
      "twitterUrl",
    ];

    for (const key of textFields) {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    }

    // Interests — send as comma-separated or multiple entries
    if (data.interests && Array.isArray(data.interests)) {
      for (const interest of data.interests) {
        formData.append("interests", interest);
      }
    }

    // File uploads
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }
    if (backgroundFile) {
      formData.append("profileBackground", backgroundFile);
    }

    const response = await apiClient.patch(ENDPOINTS.USERS.UPDATE, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data;
  },

  /**
   * Get a user's activity heatmap for a given year.
   * @param {string} id — user ID
   * @param {number|null} year — year (null = current year)
   * @returns {{ year: number, data: Array<{ date: string, minutes: number }> }}
   */
  async getHeatmap(id, year = null) {
    const params = {};
    if (year) params.year = year;
    const response = await apiClient.get(ENDPOINTS.USERS.HEATMAP(id), {
      params,
    });
    return response.data;
  },
};

export default userService;
