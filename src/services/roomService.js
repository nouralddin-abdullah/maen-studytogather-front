import { apiClient, ENDPOINTS } from "@/api";

/**
 * Room service — CRUD and interaction with study rooms.
 */
const roomService = {
  /**
   * Fetch paginated list of public/discoverable rooms.
   * @param {Object} params - { page, limit, sortBy, order, search }
   */
  async discover(params = {}) {
    const response = await apiClient.get(ENDPOINTS.ROOMS.DISCOVER, { params });
    return response.data; // { data: [...rooms], meta: { ... } }
  },

  /**
   * Fetch user's own rooms (no pagination/sorting from backend).
   */
  async getMyRooms() {
    const response = await apiClient.get(ENDPOINTS.ROOMS.MY_ROOMS);
    return response.data; // { item: [...rooms] }
  },

  /**
   * Fetch paginated list of rooms.
   * @param {Object} params - Query params (page, limit, search, etc.)
   */
  async getAll(params = {}) {
    const response = await apiClient.get(ENDPOINTS.ROOMS.LIST, { params });
    return response.data;
  },

  /**
   * Get a single room by ID.
   * @param {string} id
   */
  async getById(id) {
    const response = await apiClient.get(ENDPOINTS.ROOMS.DETAIL(id));
    return response.data;
  },

  /**
   * Create a new room (multipart/form-data for wallpaper upload).
   * @param {Object} data - Room fields + wallpaper File
   */
  async create(data) {
    const formData = new FormData();

    // Required fields
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("focusDuration", String(data.focusDuration));
    formData.append("breakDuration", String(data.breakDuration));
    formData.append("wallpaper", data.wallpaper); // File

    // Optional fields
    if (data.theme) formData.append("theme", data.theme);
    if (data.ambientSound) formData.append("ambientSound", data.ambientSound);
    if (data.isPublic !== undefined)
      formData.append("isPublic", String(data.isPublic));
    if (data.passCode) formData.append("passCode", data.passCode);
    if (data.maxCapacity)
      formData.append("maxCapacity", String(data.maxCapacity));

    const response = await apiClient.post(ENDPOINTS.ROOMS.CREATE, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  /**
   * Update an existing room (multipart/form-data for wallpaper upload).
   * @param {string} roomId
   * @param {Object} data - Room fields + optional wallpaper File
   */
  async update(roomId, data) {
    const formData = new FormData();

    // Optional fields
    if (data.name) formData.append("name", data.name);
    if (data.description) formData.append("description", data.description);
    if (data.theme) formData.append("theme", data.theme);
    if (data.ambientSound) formData.append("ambientSound", data.ambientSound);
    if (data.isPublic !== undefined)
      formData.append("isPublic", String(data.isPublic));
    if (data.passCode !== undefined) formData.append("passCode", data.passCode || "");
    if (data.maxCapacity)
      formData.append("maxCapacity", String(data.maxCapacity));
      
    // File
    if (data.wallpaper && data.wallpaper instanceof File) {
      formData.append("wallpaper", data.wallpaper);
    }

    const response = await apiClient.patch(ENDPOINTS.ROOMS.UPDATE(roomId), formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  /**
   * Delete a room.
   * @param {string} roomId
   */
  async deleteRoom(roomId) {
    const response = await apiClient.delete(ENDPOINTS.ROOMS.DELETE(roomId));
    return response.data;
  },

  /**
   * Join a room via invite code.
   * @param {string} inviteCode
   * @param {string|null} passCode - optional passcode for protected rooms
   */
  async join(inviteCode, passCode = null) {
    const response = await apiClient.post(
      ENDPOINTS.ROOMS.JOIN(inviteCode),
      { passCode: passCode || "" },
      { _skipAuthRedirect: true },
    );
    return response.data;
  },

  /**
   * Leave the current active room.
   */
  async leave() {
    const response = await apiClient.post(ENDPOINTS.ROOMS.LEAVE);
    return response.data;
  },

  /**
   * Build the full SSE URL for the given room (no token in query).
   * @param {string} roomId
   * @returns {string}
   */
  getSSEUrl(roomId) {
    const base =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
    return `${base}${ENDPOINTS.ROOMS.SSE(roomId)}`;
  },

  // ── Host-only settings (includes passCode) ──

  /**
   * Fetch room settings for the host (includes passCode).
   * @param {string} roomId
   */
  async getSettings(roomId) {
    const response = await apiClient.get(ENDPOINTS.ROOMS.SETTINGS(roomId));
    return response.data;
  },

  // ── Timer controls (host only) ──

  async startTimer(roomId) {
    const response = await apiClient.post(ENDPOINTS.ROOMS.START_TIMER(roomId));
    return response.data;
  },

  async pauseTimer(roomId) {
    const response = await apiClient.post(ENDPOINTS.ROOMS.PAUSE_TIMER(roomId));
    return response.data;
  },

  async resumeTimer(roomId) {
    const response = await apiClient.post(ENDPOINTS.ROOMS.RESUME_TIMER(roomId));
    return response.data;
  },

  async restartTimer(roomId) {
    const response = await apiClient.post(
      ENDPOINTS.ROOMS.RESTART_TIMER(roomId),
    );
    return response.data;
  },

  async changePomodoro(roomId, { focusDuration, breakDuration }) {
    const response = await apiClient.patch(
      ENDPOINTS.ROOMS.CHANGE_POMODORO(roomId),
      { focusDuration, breakDuration },
    );
    return response.data;
  },
};

export default roomService;
