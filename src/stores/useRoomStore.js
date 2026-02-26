import { create } from "zustand";
import { EventSourcePolyfill } from "event-source-polyfill";
import { roomService } from "@/services";

/**
 * Active room store — manages the current study room session (join, SSE, leave).
 * Separate from useRoomsStore which handles the discover page listing.
 */
const useRoomStore = create((set, get) => ({
  // ── Room data ──
  room: null,
  participants: [],
  notifications: [],

  // ── Connection state ──
  isJoining: false,
  isLeaving: false,
  isConnected: false,
  isTimerLoading: false,
  error: null,
  passCodeRequired: false,

  // ── Internal SSE reference ──
  _eventSource: null,

  // ─────────────────────────────────────────────────
  // Join a room via invite code.
  // ─────────────────────────────────────────────────
  join: async (inviteCode, passCode = null) => {
    set({ isJoining: true, error: null, passCodeRequired: false });
    try {
      const data = await roomService.join(inviteCode, passCode);
      set({
        room: data.room,
        participants: data.participants || data.currentParticipants || [],
        isJoining: false,
      });
      // Auto-connect to SSE
      get().connectSSE(data.room.roomId);
      return data;
    } catch (error) {
      const status = error.response?.status;
      const message =
        error.response?.data?.message || "فشل الانضمام إلى الغرفة";

      if (status === 401) {
        // Room requires a passcode (or provided one was wrong)
        set({ passCodeRequired: true, isJoining: false, error: message });
      } else {
        set({ error: message, isJoining: false });
      }
      throw error;
    }
  },

  // ─────────────────────────────────────────────────
  // Leave the current room.
  // ─────────────────────────────────────────────────
  leave: async () => {
    set({ isLeaving: true });
    try {
      get().disconnectSSE();
      const data = await roomService.leave();
      set({
        room: null,
        participants: [],
        notifications: [],
        isLeaving: false,
        isConnected: false,
        error: null,
        passCodeRequired: false,
      });
      return data;
    } catch {
      // Even on error, clean up local state
      set({
        room: null,
        participants: [],
        notifications: [],
        isLeaving: false,
        isConnected: false,
      });
    }
  },

  // ─────────────────────────────────────────────────
  // Timer controls (host only). The SSE PHASE_CHANGED
  // event updates the room state for ALL participants;
  // these actions just fire the API call.
  // ─────────────────────────────────────────────────
  startTimer: async () => {
    const roomId = get().room?.roomId;
    if (!roomId) return;
    set({ isTimerLoading: true });
    try {
      await roomService.startTimer(roomId);
    } catch (e) {
      console.error("startTimer failed:", e.response?.data?.message);
    } finally {
      set({ isTimerLoading: false });
    }
  },

  pauseTimer: async () => {
    const roomId = get().room?.roomId;
    if (!roomId) return;
    set({ isTimerLoading: true });
    try {
      await roomService.pauseTimer(roomId);
    } catch (e) {
      console.error("pauseTimer failed:", e.response?.data?.message);
    } finally {
      set({ isTimerLoading: false });
    }
  },

  resumeTimer: async () => {
    const roomId = get().room?.roomId;
    if (!roomId) return;
    set({ isTimerLoading: true });
    try {
      await roomService.resumeTimer(roomId);
    } catch (e) {
      console.error("resumeTimer failed:", e.response?.data?.message);
    } finally {
      set({ isTimerLoading: false });
    }
  },

  restartTimer: async () => {
    const roomId = get().room?.roomId;
    if (!roomId) return;
    set({ isTimerLoading: true });
    try {
      await roomService.restartTimer(roomId);
    } catch (e) {
      console.error("restartTimer failed:", e.response?.data?.message);
    } finally {
      set({ isTimerLoading: false });
    }
  },

  // ─────────────────────────────────────────────────
  // Pomodoro settings (host only, IDLE phase only).
  // ─────────────────────────────────────────────────
  isPomodoroLoading: false,
  changePomodoro: async ({ focusDuration, breakDuration }) => {
    const roomId = get().room?.roomId;
    if (!roomId) return;
    set({ isPomodoroLoading: true });
    try {
      await roomService.changePomodoro(roomId, {
        focusDuration,
        breakDuration,
      });
    } catch (e) {
      console.error("changePomodoro failed:", e.response?.data?.message);
      throw e;
    } finally {
      set({ isPomodoroLoading: false });
    }
  },

  // ─────────────────────────────────────────────────
  // SSE connection management.
  // ─────────────────────────────────────────────────
  connectSSE: (roomId) => {
    // Close existing connection if any
    const existing = get()._eventSource;
    if (existing) existing.close();

    const url = roomService.getSSEUrl(roomId);
    const token = localStorage.getItem("access_token");
    const es = new EventSourcePolyfill(url, {
      headers: { Authorization: `Bearer ${token}` },
      heartbeatTimeout: 200 * 60 * 1000, // 5 min — backend doesn't send heartbeats
    });

    es.onopen = () => {
      set({ isConnected: true });
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        get()._handleSSEEvent(data);
      } catch {
        // Silently ignore parse errors
      }
    };

    es.onerror = () => {
      set({ isConnected: false });
      // EventSource auto-reconnects; we just update state
    };

    set({ _eventSource: es });
  },

  disconnectSSE: () => {
    const es = get()._eventSource;
    if (es) es.close();
    set({ _eventSource: null, isConnected: false });
  },

  // ─────────────────────────────────────────────────
  // SSE event handler — processes room events.
  // ─────────────────────────────────────────────────
  _handleSSEEvent: (event) => {
    const { type, payload } = event;

    switch (type) {
      case "USER_JOINED": {
        set((state) => ({
          participants: [...state.participants, payload],
          notifications: [
            ...state.notifications,
            {
              id: `join-${payload.id}-${Date.now()}`,
              type: "join",
              user: payload,
              timestamp: new Date(),
            },
          ],
        }));
        break;
      }

      case "USER_LEFT": {
        set((state) => {
          const leaving = state.participants.find(
            (p) => p.id === payload.userId,
          );
          return {
            participants: state.participants.filter(
              (p) => p.id !== payload.userId,
            ),
            notifications: [
              ...state.notifications,
              {
                id: `leave-${payload.userId}-${Date.now()}`,
                type: "leave",
                user: leaving || { id: payload.userId, nickName: "مستخدم" },
                timestamp: new Date(),
              },
            ],
          };
        });
        break;
      }

      case "PHASE_CHANGED": {
        set((state) => ({
          room: state.room
            ? {
                ...state.room,
                currentPhase: payload.phase,
                timerEndAt: payload.timerEndAt || null,
                phaseStartedAt: payload.phaseStartedAt || null,
                pauseRemainingMs: payload.pausedRemainingMs || null,
                ...(payload.pomodoro
                  ? {
                      focusDuration: payload.pomodoro.focusDuration,
                      breakDuration: payload.pomodoro.breakDuration,
                    }
                  : {}),
              }
            : null,
        }));
        break;
      }

      case "POMODORO_CHANGED": {
        set((state) => ({
          room: state.room
            ? {
                ...state.room,
                focusDuration: payload.pomodoro.focusDuration,
                breakDuration: payload.pomodoro.breakDuration,
              }
            : null,
        }));
        break;
      }

      default:
        break;
    }
  },

  // ─────────────────────────────────────────────────
  // Full reset — call on page unmount / navigation away.
  // ─────────────────────────────────────────────────
  reset: () => {
    get().disconnectSSE();
    set({
      room: null,
      participants: [],
      notifications: [],
      isJoining: false,
      isLeaving: false,
      isConnected: false,
      isTimerLoading: false,
      error: null,
      passCodeRequired: false,
    });
  },
}));

export default useRoomStore;
