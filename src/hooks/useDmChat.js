import { useEffect, useState, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { dmService } from "@/services";

/**
 * useDmChat — manages Socket.IO direct-message chat with a single friend.
 *
 * Connects to the backend `/api/dm-chat` namespace, loads conversation
 * history via REST, receives live messages via socket, and exposes helpers
 * for sending, editing, and typing.
 *
 * @param {string|null} friendId - The friend to chat with (null = don't connect).
 * @returns {{ messages, sendMessage, editMessage, emitTyping, isConnected, typingUserId, loadMore, hasMore, isLoadingHistory }}
 */
export default function useDmChat(friendId) {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const socketRef = useRef(null);

  // ── Typing indicator state ──
  const [typingUserId, setTypingUserId] = useState(null);
  const typingTimeoutRef = useRef(null);
  const typingDebounceRef = useRef(null);
  const isTypingEmittedRef = useRef(false);

  // Track friendId in a ref so socket listeners always have the latest value
  const friendIdRef = useRef(friendId);
  friendIdRef.current = friendId;

  // ── Load conversation history (REST) ──
  const loadHistory = useCallback(
    async (pageNum = 1) => {
      if (!friendId) return;
      setIsLoadingHistory(true);
      try {
        const result = await dmService.getConversation(friendId, {
          page: pageNum,
          limit: 40,
        });
        const fetched = result.data || [];
        if (pageNum === 1) {
          setMessages(fetched);
        } else {
          // Prepend older messages
          setMessages((prev) => [...fetched, ...prev]);
        }
        setHasMore(result.meta?.hasNextPage === true || result.meta?.currentPage < result.meta?.totalPages);
        setPage(pageNum);
      } catch {
        // Silently fail — user can retry
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [friendId],
  );

  const loadMore = useCallback(() => {
    if (!isLoadingHistory && hasMore) {
      loadHistory(page + 1);
    }
  }, [isLoadingHistory, hasMore, page, loadHistory]);

  // ── Socket.IO connection — only when friendId is present ──
  useEffect(() => {
    if (!friendId) return;

    const token = localStorage.getItem("access_token");
    if (!token) return;

    const apiBase =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
    const serverUrl = apiBase.replace(/\/api\/?$/, "");

    const socket = io(`${serverUrl}/api/dm-chat`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
    });

    socketRef.current = socket;

    socket.on("connect", () => setIsConnected(true));
    socket.on("connect_error", (err) => {
      console.warn("[DM] connect_error:", err.message);
    });
    socket.on("disconnect", () => {
      setIsConnected(false);
      setTypingUserId(null);
    });

    // ── Live message from socket ──
    socket.on("receive_dm", (msg) => {
      const currentFriend = friendIdRef.current;
      if (!currentFriend) return;
      if (
        msg.senderId === currentFriend ||
        msg.receiverId === currentFriend
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        if (msg.senderId === currentFriend) {
          setTypingUserId(null);
          clearTimeout(typingTimeoutRef.current);
        }
      }
    });

    // ── Edited message ──
    socket.on("dm_edited", (updated) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)),
      );
    });

    // ── Typing indicator ──
    socket.on("friend_typing", ({ userId, isTyping }) => {
      if (userId !== friendIdRef.current) return;
      if (isTyping) {
        setTypingUserId(userId);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(
          () => setTypingUserId(null),
          4000,
        );
      } else {
        setTypingUserId(null);
        clearTimeout(typingTimeoutRef.current);
      }
    });

    // Load conversation history
    setMessages([]);
    setPage(1);
    setHasMore(false);
    loadHistory(1);

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setTypingUserId(null);
      clearTimeout(typingTimeoutRef.current);
      clearTimeout(typingDebounceRef.current);
      isTypingEmittedRef.current = false;
    };
  }, [friendId]); // Reconnect when friend changes

  // ── Send message ──
  const sendMessage = useCallback(
    (text, replyToId = null) => {
      if (!text.trim() || !socketRef.current || !friendId) return;
      socketRef.current.emit("send_dm", {
        receiverId: friendId,
        text: text.trim(),
        replyToId,
      });
      // Stop typing indicator
      if (isTypingEmittedRef.current) {
        socketRef.current.emit("typing_dm", {
          receiverId: friendId,
          isTyping: false,
        });
        isTypingEmittedRef.current = false;
      }
      clearTimeout(typingDebounceRef.current);
    },
    [friendId],
  );

  // ── Edit message ──
  const editMessage = useCallback(
    (messageId, newText) => {
      if (!socketRef.current || !friendId) return;
      socketRef.current.emit("edit_dm", {
        messageId,
        newText,
        receiverId: friendId,
      });
    },
    [friendId],
  );

  // ── Typing indicator — debounced emit ──
  const emitTyping = useCallback(() => {
    if (!socketRef.current || !friendId) return;

    if (!isTypingEmittedRef.current) {
      socketRef.current.emit("typing_dm", {
        receiverId: friendId,
        isTyping: true,
      });
      isTypingEmittedRef.current = true;
    }

    clearTimeout(typingDebounceRef.current);
    typingDebounceRef.current = setTimeout(() => {
      if (socketRef.current && friendId) {
        socketRef.current.emit("typing_dm", {
          receiverId: friendId,
          isTyping: false,
        });
      }
      isTypingEmittedRef.current = false;
    }, 2000);
  }, [friendId]);

  return {
    messages,
    sendMessage,
    editMessage,
    emitTyping,
    isConnected,
    typingUserId,
    loadMore,
    hasMore,
    isLoadingHistory,
  };
}
