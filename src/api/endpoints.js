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
    CREATE: "/rooms/create-room",
    UPDATE: (id) => `/rooms/${id}`,
    DETAIL: (id) => `/rooms/${id}`,
    JOIN: (inviteCode) => `/rooms/join/${inviteCode}`,
    LEAVE: "/rooms/leave",
    SSE: (roomId) => `/rooms/sse/${roomId}`,
    START_TIMER: (roomId) => `/rooms/${roomId}/start-timer`,
    PAUSE_TIMER: (roomId) => `/rooms/${roomId}/pause-timer`,
    RESUME_TIMER: (roomId) => `/rooms/${roomId}/resume-timer`,
    RESTART_TIMER: (roomId) => `/rooms/${roomId}/restart-timer`,
    CHANGE_POMODORO: (roomId) => `/rooms/${roomId}/change-pomodoro`,
  },
};

export default ENDPOINTS;
