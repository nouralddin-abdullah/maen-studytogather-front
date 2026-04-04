import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo, memo } from "react";
import { useAuthStore } from "@/stores";

/* ─────────────── Helpers ─────────────── */

function formatTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateSeparator(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "اليوم";
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "أمس";
  return d.toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function isEdited(msg) {
  return (
    msg.updatedAt &&
    msg.createdAt &&
    new Date(msg.updatedAt).getTime() - new Date(msg.createdAt).getTime() > 1000
  );
}

/* ─────────────── SwipeableMessage ─────────────── */

const SwipeableMessage = memo(function SwipeableMessage({
  children,
  isOwnMessage,
  onReply,
}) {
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isHorizontalSwipeRef = useRef(null);

  const SWIPE_THRESHOLD = 60;
  const MAX_SWIPE = 80;
  const DIRECTION_LOCK_THRESHOLD = 10;

  const handleTouchStart = (e) => {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    isHorizontalSwipeRef.current = null;
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!isSwiping) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - startXRef.current;
    const deltaY = currentY - startYRef.current;

    if (isHorizontalSwipeRef.current === null) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      if (absX > DIRECTION_LOCK_THRESHOLD || absY > DIRECTION_LOCK_THRESHOLD) {
        isHorizontalSwipeRef.current = absX > absY * 1.5;
      }
    }

    if (isHorizontalSwipeRef.current === false) return;
    if (isHorizontalSwipeRef.current === null) return;

    let delta = deltaX;
    if (isOwnMessage) {
      delta = Math.max(0, Math.min(delta, MAX_SWIPE));
    } else {
      delta = Math.min(0, Math.max(delta, -MAX_SWIPE));
    }
    setTranslateX(delta);
  };

  const handleTouchEnd = () => {
    if (isHorizontalSwipeRef.current && Math.abs(translateX) >= SWIPE_THRESHOLD) {
      onReply();
    }
    setTranslateX(0);
    setIsSwiping(false);
    isHorizontalSwipeRef.current = null;
  };

  return (
    <div
      className={`relative w-full flex group ${isOwnMessage ? "justify-end" : "justify-start"}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={onReply}
    >
      {/* Mobile swipe reply indicator */}
      <div
        className={`
          absolute top-1/2 -translate-y-1/2 transition-opacity duration-150 md:hidden z-10
          ${isOwnMessage ? "left-2" : "right-2"}
          ${Math.abs(translateX) > 20 ? "opacity-100" : "opacity-0"}
        `}
      >
        <div
          className={`
            w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center
            ${Math.abs(translateX) >= SWIPE_THRESHOLD ? "bg-brand-500/40 scale-110" : ""}
            transition-all duration-150
          `}
        >
          <svg
            className="w-4 h-4 text-brand-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            style={isOwnMessage ? { transform: "scaleX(-1)" } : undefined}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
        </div>
      </div>

      {/* Message wrapper with swipe transform */}
      <div
        className="flex items-center gap-3 max-w-[85%] sm:max-w-[75%] will-change-transform"
        style={{
          transform: `translate3d(${translateX}px, 0, 0)`,
          transition: isSwiping ? "none" : "transform 0.15s ease-out",
        }}
      >
        {/* Desktop reply button — before message for own messages */}
        {isOwnMessage && (
          <button
            onClick={(e) => { e.stopPropagation(); onReply(); }}
            className="hidden md:flex opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full bg-surface-elevated border border-border items-center justify-center hover:bg-brand-500/10 hover:border-brand-500/40 transition-all duration-150 shrink-0 cursor-pointer"
            title="رد على الرسالة"
          >
            <svg className="w-3.5 h-3.5 text-text-muted group-hover:text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ transform: "scaleX(-1)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
          </button>
        )}

        {/* Message content */}
        <div className="min-w-0">{children}</div>

        {/* Desktop reply button — after message for others */}
        {!isOwnMessage && (
          <button
            onClick={(e) => { e.stopPropagation(); onReply(); }}
            className="hidden md:flex opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full bg-surface-elevated border border-border items-center justify-center hover:bg-brand-500/10 hover:border-brand-500/40 transition-all duration-150 shrink-0 cursor-pointer"
            title="رد على الرسالة"
          >
            <svg className="w-3.5 h-3.5 text-text-muted group-hover:text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
});

/* ─────────────── ChatBubble ─────────────── */

const ChatBubble = memo(function ChatBubble({
  msg,
  isMine,
  isGrouped,
  currentUser,
  friend,
  onReply,
  onEdit,
}) {
  return (
    <SwipeableMessage isOwnMessage={isMine} onReply={onReply}>
      <div
        className={`
          flex gap-3
          ${isMine ? "flex-row-reverse" : ""}
          ${isGrouped ? "mt-0.5" : "mt-3"}
        `}
      >
        {/* Avatar — only for others & first in group */}
        {!isMine && (
          <div className="shrink-0 w-9">
            {!isGrouped ? (
              (msg.senderData?.avatar || friend.avatar) ? (
                <img
                  src={msg.senderData?.avatar || friend.avatar}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {(friend.nickName || friend.username || "?").charAt(0)}
                  </span>
                </div>
              )
            ) : null}
          </div>
        )}

        {/* Message content */}
        <div className={`flex flex-col ${isMine ? "items-end" : ""}`}>
          {/* Sender name & time — first in group only */}
          {!isGrouped && (
            <div className={`flex items-baseline gap-2 mb-1 ${isMine ? "flex-row-reverse" : ""}`}>
              <span className={`text-[13px] font-semibold ${isMine ? "text-brand-500" : "text-text-primary"}`}>
                {isMine
                  ? currentUser?.nickName || currentUser?.username || "أنت"
                  : msg.senderData?.username || friend.nickName || friend.username}
              </span>
              <span className="text-[11px] text-text-muted">
                {formatTime(msg.createdAt)}
              </span>
            </div>
          )}

          {/* Message bubble */}
          <div
            className={`
              relative group/bubble px-3.5 py-2 rounded-lg leading-relaxed max-w-[85vw] sm:max-w-md
              ${isMine
                ? "bg-brand-600 text-white"
                : "bg-surface-muted text-text-primary border border-border"}
              ${!isGrouped
                ? isMine
                  ? "rounded-tl-none rtl:rounded-tl-2xl rtl:rounded-tr-none"
                  : "rounded-tr-none rtl:rounded-tr-2xl rtl:rounded-tl-none"
                : ""}
            `}
          >
            {/* Reply reference */}
            {msg.replyTo && (
              <div
                className={`
                  mb-2 p-2 rounded-lg border-s-2 cursor-pointer overflow-hidden
                  ${isMine
                    ? "bg-black/15 border-white/40"
                    : "bg-brand-500/8 border-brand-500/40"}
                `}
                onClick={() => {
                  const el = document.getElementById(`msg-${msg.replyTo.id}`);
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
              >
                <p className={`text-xs font-bold mb-0.5 ${isMine ? "text-white/70" : "text-brand-500"}`}>
                  رد على رسالة
                </p>
                <p className={`text-xs line-clamp-2 ${isMine ? "text-white/60" : "text-text-muted"}`}>
                  {msg.replyTo.text || "رسالة"}
                </p>
              </div>
            )}

            {/* Text content */}
            <p className={`text-[13.5px] break-words leading-[1.6] ${isMine ? "font-medium" : ""}`}>
              {msg.text}
              {isEdited(msg) && (
                <span className={`text-[10px] ms-1.5 ${isMine ? "text-white/50" : "text-text-muted/60"}`}>
                  (معدّلة)
                </span>
              )}
            </p>

            {/* Desktop edit button for own messages — shown on hover */}
            {isMine && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="hidden md:flex absolute -top-3 -start-3 opacity-0 group-hover/bubble:opacity-100 w-7 h-7 rounded-full bg-surface-elevated border border-border items-center justify-center hover:bg-brand-500/10 hover:border-brand-500/40 transition-all duration-150 shadow-sm cursor-pointer z-10"
                title="تعديل"
              >
                <svg className="w-3 h-3 text-text-muted hover:text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </SwipeableMessage>
  );
});

/* ─────────────── TypingIndicator ─────────────── */

function TypingIndicator({ friend }) {
  return (
    <div className="flex items-center gap-2.5 px-2 py-2">
      <div className="shrink-0">
        {friend.avatar ? (
          <img
            src={friend.avatar}
            alt=""
            className="w-7 h-7 rounded-full object-cover opacity-70"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center">
            <span className="text-[9px] font-bold text-brand-500">
              {(friend.nickName || friend.username || "?").charAt(0)}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 h-7 bg-surface-muted px-3 rounded-full border border-border">
        <span className="w-1.5 h-1.5 rounded-full bg-text-muted typing-dot-1" />
        <span className="w-1.5 h-1.5 rounded-full bg-text-muted typing-dot-2" />
        <span className="w-1.5 h-1.5 rounded-full bg-text-muted typing-dot-3" />
      </div>
    </div>
  );
}

/* ─────────────── Main Component ─────────────── */

export default function ChatPanel({
  className = "",
  onBack,
  friend,
  messages,
  isConnected,
  isLoadingHistory,
  hasMore,
  typingUserId,
  onSendMessage,
  onEditMessage,
  onEmitTyping,
  onLoadMore,
}) {
  const currentUser = useAuthStore((s) => s.user);
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const loadMoreSentinelRef = useRef(null);
  const inputRef = useRef(null);
  const wasAtBottomRef = useRef(true);
  const prevScrollHeightRef = useRef(0);
  const isLoadingHistoryRef = useRef(false);
  const hasMoreRef = useRef(false);
  const onLoadMoreRef = useRef(onLoadMore);

  const currentUserId = currentUser?.userId || currentUser?.id;

  // Keep refs in sync with props
  useEffect(() => { isLoadingHistoryRef.current = isLoadingHistory; }, [isLoadingHistory]);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
  useEffect(() => { onLoadMoreRef.current = onLoadMore; }, [onLoadMore]);

  // Mark initial load as done once we get first batch of messages
  useEffect(() => {
    if (messages.length > 0 && !initialLoadDone) {
      const timer = setTimeout(() => setInitialLoadDone(true), 300);
      return () => clearTimeout(timer);
    }
  }, [messages.length, initialLoadDone, hasMore]);

  // Reset initialLoadDone when friend changes
  useEffect(() => {
    setInitialLoadDone(false);
  }, [friend?.id]);

  /* ── Smart auto-scroll — preserve position when older messages prepend ── */
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (wasAtBottomRef.current) {
      // At bottom → scroll to latest message
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      // Not at bottom → older messages were prepended, preserve visual position
      const newScrollHeight = container.scrollHeight;
      const diff = newScrollHeight - prevScrollHeightRef.current;
      if (diff > 0 && prevScrollHeightRef.current > 0) {
        container.scrollTop += diff;
      }
    }

    prevScrollHeightRef.current = container.scrollHeight;
  }, [messages]);

  /* ── Auto-scroll when typing indicator appears ── */
  useEffect(() => {
    if (typingUserId && wasAtBottomRef.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [typingUserId]);

  const trackScrollPosition = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    wasAtBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }, []);

  /* ── IntersectionObserver for loading older messages ── */
  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    const container = containerRef.current;
    if (!sentinel || !container || !friend || !initialLoadDone) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreRef.current && !isLoadingHistoryRef.current) {
          onLoadMoreRef.current();
        }
      },
      {
        root: container,
        rootMargin: "100px 0px 0px 0px",
        threshold: 0,
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [friend?.id, initialLoadDone]);

  /* ── Reset on friend change ── */
  useEffect(() => {
    setInput("");
    setReplyTo(null);
    setEditingMsg(null);
    wasAtBottomRef.current = true;
    inputRef.current?.focus();
  }, [friend?.id]);

  /* ── Populate input when editing ── */
  useEffect(() => {
    if (editingMsg) {
      setInput(editingMsg.text);
      inputRef.current?.focus();
    }
  }, [editingMsg]);

  /* ── Send/Edit handler ── */
  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    if (editingMsg) {
      onEditMessage(editingMsg.id, input.trim());
      setEditingMsg(null);
    } else {
      onSendMessage(input.trim(), replyTo?.id || null);
      setReplyTo(null);
    }
    setInput("");
    wasAtBottomRef.current = true;
  }, [input, editingMsg, replyTo, onEditMessage, onSendMessage]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape") {
      setReplyTo(null);
      setEditingMsg(null);
      setInput("");
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    onEmitTyping();
  };

  /* ── Group messages with date separators ── */
  const processedMessages = useMemo(() => {
    const result = [];
    let lastDate = null;
    const MERGE_GAP = 3 * 60 * 1000;

    messages.forEach((msg, i) => {
      const msgDate = new Date(msg.createdAt).toDateString();
      if (msgDate !== lastDate) {
        result.push({ type: "date", date: msg.createdAt, key: `date-${i}` });
        lastDate = msgDate;
      }

      const prev = messages[i - 1];
      const isGrouped =
        prev &&
        prev.senderId === msg.senderId &&
        new Date(msg.createdAt).toDateString() === new Date(prev.createdAt).toDateString() &&
        new Date(msg.createdAt) - new Date(prev.createdAt) < MERGE_GAP &&
        !msg.replyTo;

      result.push({ type: "msg", msg, isGrouped, key: msg.id });
    });

    return result;
  }, [messages]);

  /* ── No friend selected ── */
  if (!friend) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center bg-surface-elevated border border-border rounded-lg ${className}`}>
        <div className="w-20 h-20 rounded-full bg-surface-muted flex items-center justify-center mb-5">
          <svg
            className="w-10 h-10 text-brand-500/60"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
            />
          </svg>
        </div>
        <h3 className="font-display text-lg font-bold text-text-primary mb-1">
          ابدأ محادثة
        </h3>
        <p className="text-text-muted text-sm">
          اختر صديقاً من القائمة لبدء المحادثة
        </p>
        <button
          onClick={onBack}
          className="md:hidden mt-4 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium"
        >
          العودة للأصدقاء
        </button>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col bg-surface-elevated border border-border rounded-lg overflow-hidden ${className}`}>
      {/* ════════ Header ════════ */}
      <div className="flex items-center gap-3 px-3 md:px-5 py-3 border-b border-border bg-surface-elevated flex-shrink-0">
        <button
          onClick={onBack}
          className="md:hidden flex items-center justify-center w-8 h-8 rounded-full text-text-muted hover:bg-surface-muted transition-colors cursor-pointer flex-shrink-0"
        >
          <svg className="w-5 h-5 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div className="relative flex-shrink-0">
          {friend.avatar ? (
            <img
              src={friend.avatar}
              alt=""
              className="w-9 h-9 rounded-full object-cover ring-2 ring-border"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center ring-2 ring-border">
              <span className="text-xs font-bold text-white">
                {(friend.nickName || friend.username || "?").charAt(0)}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate leading-tight">
            {friend.nickName || friend.username}
          </p>
        </div>
      </div>

      {/* ════════ Messages ════════ */}
      <div
        ref={containerRef}
        onScroll={trackScrollPosition}
        className="flex-1 overflow-y-auto chat-scroll px-4"
      >
        {/* Sentinel for infinite scroll — loads more when scrolled to top */}
        <div ref={loadMoreSentinelRef} className="h-1 w-full flex-shrink-0" />

        {/* Loading indicator */}
        {isLoadingHistory && (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!isLoadingHistory && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="mb-5">
              {friend.avatar ? (
                <img
                  src={friend.avatar}
                  alt=""
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-surface-muted"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-brand-600 flex items-center justify-center ring-4 ring-surface-muted">
                  <span className="text-3xl font-bold text-white">
                    {(friend.nickName || friend.username || "?").charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <h3 className="font-display text-xl font-bold text-text-primary mb-1">
              {friend.nickName || friend.username}
            </h3>
            <p className="text-sm text-text-muted max-w-xs">
              هذه بداية محادثتكما! أرسل رسالة لبدء المحادثة 👋
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="py-2 space-y-0">
          {processedMessages.map((item) => {
            if (item.type === "date") {
              return (
                <div
                  key={item.key}
                  className="flex justify-center my-4 select-none"
                >
                  <span className="text-[11px] font-medium text-text-muted bg-surface-elevated px-3 py-1 rounded-full border border-border">
                    {formatDateSeparator(item.date)}
                  </span>
                </div>
              );
            }

            const { msg, isGrouped } = item;
            const isMine = msg.senderId === currentUserId;

            return (
              <div key={item.key} id={`msg-${msg.id}`} className="chat-msg-enter">
                <ChatBubble
                  msg={msg}
                  isMine={isMine}
                  isGrouped={isGrouped}
                  currentUser={currentUser}
                  friend={friend}
                  onReply={() => {
                    setReplyTo(msg);
                    inputRef.current?.focus();
                  }}
                  onEdit={() => setEditingMsg(msg)}
                />
              </div>
            );
          })}
        </div>

        {/* Typing indicator */}
        {typingUserId && <TypingIndicator friend={friend} />}

        <div ref={messagesEndRef} />
      </div>

      {/* ════════ Reply / Edit banner ════════ */}
      {(replyTo || editingMsg) && (
        <div className="flex items-center gap-3 px-4 py-2.5 border-t border-border bg-surface-muted/30 flex-shrink-0 animate-fade-in">
          <div className="w-0.5 self-stretch rounded-full bg-brand-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-brand-500 leading-tight">
              {editingMsg ? "تعديل الرسالة" : `الرد على ${replyTo?.senderId === currentUserId ? "رسالتك" : (friend.nickName || friend.username)}`}
            </p>
            <p className="text-[11px] text-text-muted truncate leading-tight mt-0.5">
              {editingMsg ? editingMsg.text : replyTo.text}
            </p>
          </div>
          <button
            onClick={() => {
              setReplyTo(null);
              setEditingMsg(null);
              setInput("");
            }}
            className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors cursor-pointer flex-shrink-0"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ════════ Input ════════ */}
      <div className="px-4 pb-3 pt-2 flex-shrink-0">
        <div className="relative flex items-end bg-surface-muted rounded-lg border border-border focus-within:border-brand-500/40 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={`أرسل رسالة إلى ${friend.nickName || friend.username}...`}
            rows={1}
            className="flex-1 resize-none bg-transparent px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none max-h-28 leading-relaxed"
            style={{ minHeight: "44px" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className={`w-9 h-9 flex items-center justify-center rounded-md mb-1 me-1 transition-all flex-shrink-0 cursor-pointer ${
              input.trim()
                ? "bg-brand-600 text-white shadow-sm hover:bg-brand-500 active:scale-95"
                : "text-text-muted/30 cursor-not-allowed"
            }`}
          >
            <svg className="w-4 h-4 rotate-180" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
