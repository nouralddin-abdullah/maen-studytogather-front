/**
 * API endpoints map — single source of truth for all routes.
 */
const ENDPOINTS = {
  // Users (auth + profile)
  USERS: {
    SIGNUP: "/users/signup",
    SIGNIN: "/users/signin",
    ME: "/users/me",
    PROFILE: (id) => `/users/${id}`,
    UPDATE: "/users/me",
    HEATMAP: (id) => `/users/${id}/heatmap`,
  },

  // Rooms
  ROOMS: {
    LIST: "/rooms",
    DISCOVER: "/rooms/discover",
    CREATE: "/rooms",
    DETAIL: (id) => `/rooms/${id}`,
    JOIN: (id) => `/rooms/${id}/join`,
    LEAVE: (id) => `/rooms/${id}/leave`,
  },
};

export default ENDPOINTS;
