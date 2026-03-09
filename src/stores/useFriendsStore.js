import { create } from "zustand";
import { EventSourcePolyfill } from "event-source-polyfill";
import { friendshipService } from "@/services";

/**
 * Friends store — manages friends list, pending requests, and live presence SSE.
 */
const useFriendsStore = create((set, get) => ({
  // ── State ──
  friends: [],
  friendsMeta: null,
  pendingRequests: [],
  pendingMeta: null,
  isLoading: false,
  isPendingLoading: false,
  error: null,

  // ── SSE ──
  _eventSource: null,

  // ── Fetch friends ──
  fetchFriends: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const result = await friendshipService.getAll({
        page: 1,
        limit: 50,
        sortBy: "createdAt",
        order: "desc",
        ...params,
      });
      set({ friends: result.data, friendsMeta: result.meta, isLoading: false });
    } catch (error) {
      const message =
        error.response?.data?.message || "فشل تحميل الأصدقاء.";
      set({ error: message, isLoading: false });
    }
  },

  // ── Fetch pending requests ──
  fetchPending: async (params = {}) => {
    set({ isPendingLoading: true });
    try {
      const result = await friendshipService.getPending({
        page: 1,
        limit: 50,
        sortBy: "createdAt",
        order: "desc",
        ...params,
      });
      set({
        pendingRequests: result.data,
        pendingMeta: result.meta,
        isPendingLoading: false,
      });
    } catch (error) {
      set({ isPendingLoading: false });
    }
  },

  // ── Respond to request (accept / reject) ──
  respondToRequest: async (id, status) => {
    try {
      await friendshipService.respond(id, status);
      set((s) => ({
        pendingRequests: s.pendingRequests.filter((r) => r.id !== id),
      }));
      if (status === "accepted") {
        get().fetchFriends();
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "حدث خطأ. حاول مرة أخرى.";
      set({ error: message });
    }
  },

  // ── Remove friend ──
  removeFriend: async (id) => {
    try {
      await friendshipService.remove(id);
      set((s) => ({
        friends: s.friends.filter((f) => f.id !== id),
      }));
    } catch (error) {
      const message =
        error.response?.data?.message || "فشل إزالة الصديق.";
      set({ error: message });
    }
  },

  // ── SSE — live friend presence ──
  connectSSE: () => {
    const existing = get()._eventSource;
    if (existing) existing.close();

    const url = friendshipService.getSSEUrl();
    const token = localStorage.getItem("access_token");

    const es = new EventSourcePolyfill(url, {
      headers: { Authorization: `Bearer ${token}` },
      heartbeatTimeout: 200 * 60 * 1000,
    });

    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed?.type === "FRIEND_PRESENCE_UPDATE") {
          const payload = parsed.payload;
          set((state) => ({
            friends: state.friends.map((f) => {
              const friendId = f.friendProfile?.id;
              if (friendId === payload.userId) {
                return {
                  ...f,
                  isOnline: payload.isOnline,
                  roomId: payload.roomId || null,
                  roomName: payload.roomName || null,
                  inviteCode: payload.inviteCode || null,
                };
              }
              return f;
            }),
          }));
        }
      } catch {
        // Silently ignore parse errors
      }
    };

    es.onerror = () => {
      // EventSource auto-reconnects
    };

    set({ _eventSource: es });
  },

  disconnectSSE: () => {
    const es = get()._eventSource;
    if (es) es.close();
    set({ _eventSource: null });
  },

  clearError: () => set({ error: null }),
}));

export default useFriendsStore;
