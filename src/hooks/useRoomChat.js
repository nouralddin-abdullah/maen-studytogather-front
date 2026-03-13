import { useEffect, useState, useRef, useCallback } from "react";
import { io } from "socket.io-client";

/**
 * useRoomChat — manages Socket.IO chat for the active room.
 *
 * Connects to the backend `/api/room-chat` namespace, joins the room,
 * receives history + live messages, and exposes a sendMessage helper.
 * Also handles typing indicators (emit + listen).
 *
 * @param {string|null} roomId - The current room ID (null = don't connect).
 * @param {string|null} userAvatar - Current user's avatar URL to attach to messages.
 * @returns {{ messages, sendMessage, isChatConnected, typingUsers, emitTyping }}
 */
export default function useRoomChat(roomId, userAvatar = null) {
  const [messages, setMessages] = useState([]);
  const [isChatConnected, setIsChatConnected] = useState(false);
  const socketRef = useRef(null);

  // ── Typing indicator state ──
  // Map of username → timeout-id, so we can auto-expire stale entries
  const typingMapRef = useRef(new Map());
  const [typingUsers, setTypingUsers] = useState([]);
  const typingDebounceRef = useRef(null);
  const isTypingEmittedRef = useRef(false);

  /** Sync the typingUsers state array from the internal Map */
  const syncTypingState = useCallback(() => {
    setTypingUsers(Array.from(typingMapRef.current.keys()));
  }, []);

  useEffect(() => {
    if (!roomId) return;

    const token = localStorage.getItem("access_token");
    if (!token) return;

    // Derive the Socket.IO server URL from VITE_API_BASE_URL.
    // e.g. "http://localhost:3000/api" → "http://localhost:3000"
    const apiBase =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
    const serverUrl = apiBase.replace(/\/api\/?$/, "");

    const socket = io(`${serverUrl}/api/room-chat`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsChatConnected(true);
      socket.emit("join_room", { roomId });
    });

    socket.on("disconnect", () => {
      setIsChatConnected(false);
      // Clear all typing indicators on disconnect
      typingMapRef.current.forEach((tid) => clearTimeout(tid));
      typingMapRef.current.clear();
      syncTypingState();
    });

    // Receive chat history (array of past messages) on join
    socket.on("chat_history", (history) => {
      setMessages(history || []);
    });

    // Receive a single new message
    socket.on("new_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
      // When someone sends a message, they're no longer "typing"
      if (msg.username && typingMapRef.current.has(msg.username)) {
        clearTimeout(typingMapRef.current.get(msg.username));
        typingMapRef.current.delete(msg.username);
        syncTypingState();
      }
    });

    // ── Typing indicator from other users ──
    socket.on("user_typing", ({ username, isTyping }) => {
      if (!username) return;

      // Clear any existing timeout for this user
      if (typingMapRef.current.has(username)) {
        clearTimeout(typingMapRef.current.get(username));
      }

      if (isTyping) {
        // Auto-expire after 4s in case we never get isTyping=false
        const tid = setTimeout(() => {
          typingMapRef.current.delete(username);
          syncTypingState();
        }, 4000);
        typingMapRef.current.set(username, tid);
      } else {
        typingMapRef.current.delete(username);
      }

      syncTypingState();
    });

    // Re-join room on reconnection (socket.io auto-reconnects,
    // but the server-side socket loses the room membership)
    socket.io.on("reconnect", () => {
      socket.emit("join_room", { roomId });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsChatConnected(false);
      setMessages([]);

      // Cleanup typing state
      typingMapRef.current.forEach((tid) => clearTimeout(tid));
      typingMapRef.current.clear();
      setTypingUsers([]);
      clearTimeout(typingDebounceRef.current);
      isTypingEmittedRef.current = false;
    };
  }, [roomId, syncTypingState]);

  const sendMessage = useCallback(
    (text) => {
      if (!text.trim() || !socketRef.current) return;
      socketRef.current.emit("send_message", {
        text: text.trim(),
        avatar: userAvatar || undefined,
      });
      // Immediately stop typing indicator when message is sent
      if (isTypingEmittedRef.current) {
        socketRef.current.emit("typing", { isTyping: false });
        isTypingEmittedRef.current = false;
      }
      clearTimeout(typingDebounceRef.current);
    },
    [userAvatar],
  );

  /**
   * emitTyping — call this on every keystroke in the chat input.
   *
   * Emits `typing: true` once, then debounces — after 2s of no keystrokes,
   * emits `typing: false`. This avoids spamming the server on every key.
   */
  const emitTyping = useCallback(() => {
    if (!socketRef.current) return;

    // Emit "started typing" only once per burst
    if (!isTypingEmittedRef.current) {
      socketRef.current.emit("typing", { isTyping: true });
      isTypingEmittedRef.current = true;
    }

    // Reset the stop-typing debounce
    clearTimeout(typingDebounceRef.current);
    typingDebounceRef.current = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.emit("typing", { isTyping: false });
      }
      isTypingEmittedRef.current = false;
    }, 2000);
  }, []);

  return { messages, sendMessage, isChatConnected, typingUsers, emitTyping };
}

