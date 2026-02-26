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
   * Create a new room.
   * @param {Object} data - Room data
   */
  async create(data) {
    const response = await apiClient.post(ENDPOINTS.ROOMS.CREATE, data);
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
