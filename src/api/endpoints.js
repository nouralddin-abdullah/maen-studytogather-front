/**
 * API endpoints map — single source of truth for all routes.
 */
const ENDPOINTS = {
  // Users (auth + profile)
  USERS: {
    SIGNUP: "/users/signup",
    SIGNIN: "/users/signin",
    ME: "/users/me",
    PROFILE: (id) => `/users/users/${id}`,
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
    SETTINGS: (roomId) => `/rooms/${roomId}/settings`,
  },

  // Goals
  GOALS: {
    CREATE: "/goals",
    MY_GOALS: "/goals",
    UPDATE: (id) => `/goals/${id}`,
    DELETE: (id) => `/goals/${id}`,
    ROOM_GOALS: (roomId) => `/goals/room/${roomId}`,
  },

  // Friendships
  FRIENDSHIPS: {
    LIST: "/friendships",
    SEND: "/friendships",
    PENDING: "/friendships/requests/pending",
    RESPOND: (id) => `/friendships/${id}/respond`,
    REMOVE: (id) => `/friendships/${id}`,
    STATUS: (id) => `/friendships/get-status/${id}`,
    LIVE: "/friendships/live",
  },
};

export default ENDPOINTS;
