import { create } from "zustand";
import { io } from "socket.io-client";
import { roomService, goalService } from "@/services";

/**
 * Active room store — manages the current study room session.
 *
 * Uses a single Socket.IO connection to `/api/room` for:
 *  - Room events (USER_JOINED, PHASE_CHANGED, etc.)  — replaces SSE
 *  - Chat messages & typing indicators               — replaces `/api/room-chat`
 */
const useRoomStore = create((set, get) => ({
  // ── Room data ──
  room: null,
  participants: [],
  notifications: [],
  roomGoals: [],
  isGoalsLoading: false,
  livekitToken: null,

  // ── Connection state ──
  isJoining: false,
  isLeaving: false,
  isConnected: false,
  isTimerLoading: false,
  error: null,
  passCodeRequired: false,

  // ── Chat state (merged from useRoomChat) ──
  chatMessages: [],
  isChatConnected: false,
  typingUsers: [],
  _typingMap: new Map(), // username → timeout-id (internal)

  // ── Internal Socket.IO reference ──
  _socket: null,
  _typingDebounceTimer: null,
  _isTypingEmitted: false,

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
        livekitToken: data.livekitToken || null,
        isJoining: false,
      });
      // Auto-connect to WebSocket
      get().connectWS(data.room.roomId);
      // Load room participants' goals
      get().loadRoomGoals(data.room.roomId);
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
      const socket = get()._socket;
      if (socket) socket.emit("leave_room");
      get().disconnectWS();
      const data = await roomService.leave();
      set({
        room: null,
        participants: [],
        notifications: [],
        roomGoals: [],
        chatMessages: [],
        typingUsers: [],
        livekitToken: null,
        isLeaving: false,
        isConnected: false,
        isChatConnected: false,
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
        roomGoals: [],
        chatMessages: [],
        typingUsers: [],
        livekitToken: null,
        isLeaving: false,
        isConnected: false,
        isChatConnected: false,
      });
    }
  },

  // ─────────────────────────────────────────────────
  // Timer controls (host only). The PHASE_CHANGED
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
  // Goal actions.
  // ─────────────────────────────────────────────────
  loadRoomGoals: async (roomId) => {
    set({ isGoalsLoading: true });
    try {
      const data = await goalService.getRoomGoals(roomId);
      // Sort goals and children oldest-first
      const sorted = (data.items || []).map((pg) => ({
        ...pg,
        goals: [...pg.goals]
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
          .map((g) => ({
            ...g,
            children: g.children
              ? [...g.children].sort(
                  (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
                )
              : [],
          })),
      }));
      set({ roomGoals: sorted, isGoalsLoading: false });
    } catch (e) {
      console.error("loadRoomGoals failed:", e.response?.data?.message);
      set({ isGoalsLoading: false });
    }
  },

  createGoal: async (title, parentId = null) => {
    try {
      await goalService.create(title, parentId);
      // The room_event will update the goals list
    } catch (e) {
      console.error("createGoal failed:", e.response?.data?.message);
      throw e;
    }
  },

  toggleGoal: async (goalId, isCompleted) => {
    try {
      await goalService.update(goalId, { isCompleted });
      // The room_event will update the goals list

      // Auto-complete parent: if we just completed a sub-goal, check if all
      // siblings under the same parent are now complete.
      if (isCompleted) {
        const { roomGoals } = get();
        for (const participant of roomGoals) {
          for (const parentGoal of participant.goals) {
            if (!parentGoal.children) continue;
            const child = parentGoal.children.find((c) => c.id === goalId);
            if (child) {
              // Check if all siblings (including the one we just toggled) are complete
              const allDone = parentGoal.children.every((c) =>
                c.id === goalId ? true : c.isCompleted,
              );
              if (allDone && !parentGoal.isCompleted) {
                // Auto-complete the parent
                await goalService.update(parentGoal.id, { isCompleted: true });
              }
              return;
            }
          }
        }
      } else {
        // Auto-uncomplete parent: if we just unchecked a sub-goal,
        // the parent should no longer be completed.
        const { roomGoals } = get();
        for (const participant of roomGoals) {
          for (const parentGoal of participant.goals) {
            if (!parentGoal.children) continue;
            const child = parentGoal.children.find((c) => c.id === goalId);
            if (child && parentGoal.isCompleted) {
              await goalService.update(parentGoal.id, { isCompleted: false });
              return;
            }
          }
        }
      }
    } catch (e) {
      console.error("toggleGoal failed:", e.response?.data?.message);
      throw e;
    }
  },

  updateGoalTitle: async (goalId, title) => {
    try {
      await goalService.update(goalId, { title });
      // The room_event will update the goals list
    } catch (e) {
      console.error("updateGoalTitle failed:", e.response?.data?.message);
      throw e;
    }
  },

  deleteGoal: async (goalId) => {
    try {
      await goalService.delete(goalId);
      // No event for deletion, so remove locally
      set((state) => ({
        roomGoals: state.roomGoals.map((pg) => ({
          ...pg,
          goals: pg.goals
            .filter((g) => g.id !== goalId)
            .map((g) => ({
              ...g,
              children: g.children
                ? g.children.filter((c) => c.id !== goalId)
                : [],
            })),
        })),
      }));
    } catch (e) {
      console.error("deleteGoal failed:", e.response?.data?.message);
      throw e;
    }
  },

  // ─────────────────────────────────────────────────
  // Chat helpers (emit to the unified room socket).
  // ─────────────────────────────────────────────────
  sendChatMessage: (text, avatar) => {
    const socket = get()._socket;
    if (!socket || !text?.trim()) return;
    socket.emit("send_message", {
      text: text.trim(),
      avatar: avatar || undefined,
    });
    // Immediately stop typing indicator when message is sent
    if (get()._isTypingEmitted) {
      socket.emit("typing", { isTyping: false });
      set({ _isTypingEmitted: false });
    }
    clearTimeout(get()._typingDebounceTimer);
  },

  /**
   * emitTyping — call on every keystroke in the chat input.
   *
   * Emits `typing: true` once, then debounces — after 2s of no keystrokes,
   * emits `typing: false`. This avoids spamming the server on every key.
   */
  emitTyping: () => {
    const socket = get()._socket;
    if (!socket) return;

    // Emit "started typing" only once per burst
    if (!get()._isTypingEmitted) {
      socket.emit("typing", { isTyping: true });
      set({ _isTypingEmitted: true });
    }

    // Reset the stop-typing debounce
    clearTimeout(get()._typingDebounceTimer);
    const timer = setTimeout(() => {
      const s = get()._socket;
      if (s) s.emit("typing", { isTyping: false });
      set({ _isTypingEmitted: false });
    }, 2000);
    set({ _typingDebounceTimer: timer });
  },

  // ─────────────────────────────────────────────────
  // WebSocket connection management (replaces SSE).
  // ─────────────────────────────────────────────────
  connectWS: (roomId) => {
    // Close existing connection if any
    const existing = get()._socket;
    if (existing) existing.disconnect();

    const token = localStorage.getItem("access_token");
    if (!token) return;

    // Derive Socket.IO server URL from VITE_API_BASE_URL
    // e.g. "http://localhost:3000/api" → "http://localhost:3000"
    const apiBase =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
    const serverUrl = apiBase.replace(/\/api\/?$/, "");

    const socket = io(`${serverUrl}/api/room`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
    });

    socket.on("connect", () => {
      set({ isConnected: true, isChatConnected: true });
      socket.emit("join_room", { roomId });
    });

    socket.on("disconnect", () => {
      set({ isConnected: false, isChatConnected: false });
      // Clear typing indicators on disconnect
      const map = get()._typingMap;
      map.forEach((tid) => clearTimeout(tid));
      map.clear();
      set({ typingUsers: [] });
    });

    // Initial connection confirmation from gateway
    socket.on("connected", () => {
      set({ isConnected: true, isChatConnected: true });
    });

    // ── Room events (replaces SSE onmessage) ──
    socket.on("room_event", (data) => {
      try {
        get()._handleRoomEvent(data);
      } catch {
        // Silently ignore
      }
    });

    // ── Chat events ──
    socket.on("chat_history", (history) => {
      set({ chatMessages: history || [] });
    });

    socket.on("new_message", (msg) => {
      set((state) => ({ chatMessages: [...state.chatMessages, msg] }));
      // When someone sends a message, they're no longer "typing"
      if (msg.username) {
        const map = get()._typingMap;
        if (map.has(msg.username)) {
          clearTimeout(map.get(msg.username));
          map.delete(msg.username);
          set({ typingUsers: Array.from(map.keys()) });
        }
      }
    });

    socket.on("user_typing", ({ username, isTyping }) => {
      if (!username) return;
      const map = get()._typingMap;

      // Clear any existing timeout for this user
      if (map.has(username)) {
        clearTimeout(map.get(username));
      }

      if (isTyping) {
        // Auto-expire after 4s in case we never get isTyping=false
        const tid = setTimeout(() => {
          map.delete(username);
          set({ typingUsers: Array.from(map.keys()) });
        }, 4000);
        map.set(username, tid);
      } else {
        map.delete(username);
      }

      set({ typingUsers: Array.from(map.keys()) });
    });

    // ── Error from gateway ──
    socket.on("room_error", ({ message }) => {
      console.error("[RoomGateway] Error:", message);
    });

    // Re-join room on reconnection (socket.io auto-reconnects,
    // but the server-side socket loses the room membership)
    socket.io.on("reconnect", () => {
      socket.emit("join_room", { roomId });
    });

    set({ _socket: socket });
  },

  disconnectWS: () => {
    const socket = get()._socket;
    if (socket) socket.disconnect();
    // Clear typing map
    const map = get()._typingMap;
    map.forEach((tid) => clearTimeout(tid));
    map.clear();
    set({
      _socket: null,
      isConnected: false,
      isChatConnected: false,
      chatMessages: [],
      typingUsers: [],
    });
  },

  // ─────────────────────────────────────────────────
  // Room event handler — processes room events
  // (same logic as the old _handleSSEEvent).
  // ─────────────────────────────────────────────────
  _handleRoomEvent: (event) => {
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

      case "ROOM_SETTINGS_CHANGED": {
        set((state) => ({
          room: state.room
            ? {
                ...state.room,
                name: payload.name ?? state.room.name,
                theme: payload.theme ?? state.room.theme,
                ambientSound: payload.ambientSound ?? state.room.ambientSound,
                wallPaperUrl: payload.wallPaperUrl ?? state.room.wallPaperUrl,
              }
            : null,
        }));
        break;
      }

      case "USER_CREATED_GOAL": {
        const { goal } = payload;
        set((state) => {
          const newRoomGoals = state.roomGoals.map((pg) => {
            if (pg.id !== goal.userId) return pg;
            if (goal.parentId) {
              // Insert as child of parent goal
              return {
                ...pg,
                goals: pg.goals.map((g) =>
                  g.id === goal.parentId
                    ? { ...g, children: [...(g.children || []), goal] }
                    : g,
                ),
              };
            }
            // Top-level goal
            return { ...pg, goals: [...pg.goals, { ...goal, children: [] }] };
          });
          // If user has no entry yet, create one
          const hasEntry = newRoomGoals.some((pg) => pg.id === goal.userId);
          if (!hasEntry) {
            newRoomGoals.push({
              id: goal.userId,
              goals: [{ ...goal, children: goal.parentId ? undefined : [] }],
            });
          }
          return { roomGoals: newRoomGoals };
        });
        break;
      }

      case "USER_COMPLETED_GOAL":
      case "USER_UPDATED_GOAL":
      case "USER_UNCHECKED_GOAL": {
        const { goal, userId } = payload;
        const uid = userId || goal.userId;
        set((state) => {
          const newRoomGoals = state.roomGoals.map((pg) => {
            if (pg.id !== uid) return pg;
            if (goal.parentId) {
              // Update child goal
              return {
                ...pg,
                goals: pg.goals.map((g) =>
                  g.id === goal.parentId
                    ? {
                        ...g,
                        children: (g.children || []).map((c) =>
                          c.id === goal.id ? { ...c, ...goal } : c,
                        ),
                      }
                    : g.id === goal.id
                      ? { ...g, ...goal }
                      : g,
                ),
              };
            }
            // Top-level goal update
            return {
              ...pg,
              goals: pg.goals.map((g) =>
                g.id === goal.id
                  ? { ...g, ...goal, children: g.children }
                  : g,
              ),
            };
          });

          // Notification for completed parent goal
          let newNotifications = state.notifications;
          if (
            type === "USER_COMPLETED_GOAL" &&
            goal.parentId === null
          ) {
            const participant = state.participants.find((p) => p.id === uid);
            newNotifications = [
              ...state.notifications,
              {
                id: `goal-complete-${goal.id}-${Date.now()}`,
                type: "goal_complete",
                user: participant || { id: uid, nickName: "مستخدم" },
                goalTitle: goal.title,
                timestamp: new Date(),
              },
            ];
          }

          return { roomGoals: newRoomGoals, notifications: newNotifications };
        });
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
    get().disconnectWS();
    set({
      room: null,
      participants: [],
      notifications: [],
      roomGoals: [],
      chatMessages: [],
      typingUsers: [],
      livekitToken: null,
      isJoining: false,
      isLeaving: false,
      isConnected: false,
      isChatConnected: false,
      isGoalsLoading: false,
      isTimerLoading: false,
      error: null,
      passCodeRequired: false,
    });
  },
}));

export default useRoomStore;
