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
   * Join a room.
   * @param {string} id
   */
  async join(id) {
    const response = await apiClient.post(ENDPOINTS.ROOMS.JOIN(id));
    return response.data;
  },

  /**
   * Leave a room.
   * @param {string} id
   */
  async leave(id) {
    const response = await apiClient.post(ENDPOINTS.ROOMS.LEAVE(id));
    return response.data;
  },
};

export default roomService;
