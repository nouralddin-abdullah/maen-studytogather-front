import { useState, useRef, useEffect } from "react";

/**
 * ChatPanel — combined chat + notifications panel for the study room.
 *
 * Renders chat messages and system notifications in a single chronological feed.
 * Notifications appear as compact system lines; chat messages appear as bubbles.
 */
export default function ChatPanel({
  glassClass,
  themeCfg,
  notifications,
  chatMessages,
  onSendMessage,
  isChatConnected,
  isCollapsed,
  onToggleCollapse,
  currentUserId,
  typingUsers = [],
  onTyping,
  isMobileFullHeight,
}) {
  const [inputText, setInputText] = useState("");
  const feedEndRef = useRef(null);
  const inputRef = useRef(null);

  // Build a merged, time-sorted feed of notifications + chat messages
  const feed = buildFeed(notifications, chatMessages);

  // Auto-scroll to bottom on new items
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [feed.length]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={`${glassClass} rounded-3xl flex flex-col overflow-hidden transition-all duration-300 ${isCollapsed ? "h-[50px] flex-shrink-0" : "flex-1 min-h-[180px]"}`}
    >
      {/* ── Header ── */}
      <div
        className={`p-3 ${themeCfg.accentBg} border-b border-white/5 flex justify-between items-center flex-shrink-0`}
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-white/70"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
            />
          </svg>
          <span className="font-bold text-white text-sm">المحادثة</span>
        </div>
        {!isMobileFullHeight && (
          <button
            onClick={onToggleCollapse}
            className="text-white/40 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10 cursor-pointer"
          >
            <svg
              className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? "rotate-90" : "-rotate-90"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </button>
        )}
      </div>

      {/* ── Feed ── */}
      {!isCollapsed && (
        <>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-1.5">
            {feed.length === 0 && (
              <p className="text-white/30 text-xs text-center mt-4">
                لا توجد رسائل بعد — ابدأ المحادثة! 💬
              </p>
            )}

            {feed.map((item) => {
              if (item._feedType === "notification") {
                return <NotificationItem key={item.id} notif={item} />;
              }
              return (
                <ChatBubble
                  key={item.id}
                  msg={item}
                  isOwn={item.userId === currentUserId}
                  themeCfg={themeCfg}
                />
              );
            })}
            <div ref={feedEndRef} />
          </div>

          {/* ── Typing indicator ── */}
          {typingUsers.length > 0 && (
            <div className="flex-shrink-0 px-3 py-1 flex items-center gap-1.5 animate-fade-in">
              <span className="flex gap-0.5 items-center">
                <span className="w-1 h-1 rounded-full bg-white/50 animate-bounce [animation-delay:0ms]" />
                <span className="w-1 h-1 rounded-full bg-white/50 animate-bounce [animation-delay:150ms]" />
                <span className="w-1 h-1 rounded-full bg-white/50 animate-bounce [animation-delay:300ms]" />
              </span>
              <span className="text-[10px] text-white/40">
                {typingUsers.length === 1
                  ? `${typingUsers[0]} يكتب...`
                  : typingUsers.length === 2
                    ? `${typingUsers[0]} و ${typingUsers[1]} يكتبون...`
                    : `${typingUsers[0]} و ${typingUsers.length - 1} آخرين يكتبون...`}
              </span>
            </div>
          )}

          {/* ── Input ── */}
          <div className="flex-shrink-0 p-2 border-t border-white/5">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  onTyping?.();
                }}
                onKeyDown={handleKeyDown}
                placeholder="اكتب رسالة..."
                className="flex-1 bg-white/10 text-white placeholder-white/30 text-xs rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-white/20 transition-all"
                disabled={!isChatConnected}
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || !isChatConnected}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${themeCfg.accent} ${themeCfg.accentHover} text-white`}
              >
                <svg
                  className="w-4 h-4 rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                  />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────────────── */

function NotificationItem({ notif }) {
  return (
    <div className="flex items-center gap-2 text-[11px] animate-fade-in py-0.5 px-1">
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${notif.type === "join"
            ? "bg-emerald-400"
            : notif.type === "goal_complete"
              ? "bg-amber-400"
              : "bg-red-400"
          }`}
      />
      <span className="text-white/60">
        <span className="font-bold text-white/80">
          {notif.user?.nickName || notif.user?.username || "مستخدم"}
        </span>{" "}
        {notif.type === "join"
          ? "انضم للغرفة"
          : notif.type === "leave"
            ? "غادر الغرفة"
            : ""}
        {notif.type === "goal_complete" && (
          <>
            أكمل هدف:{" "}
            <span className="font-bold text-emerald-400">
              {notif.goalTitle}
            </span>{" "}
            🎯
          </>
        )}
        {notif.type === "join" && notif.user?.currentStreak > 0 && (
          <span className="ms-1 text-[10px] text-orange-400 font-bold">
            🔥{notif.user.currentStreak}
          </span>
        )}
      </span>
      <span className="text-white/20 ms-auto font-mono text-[9px] flex-shrink-0">
        {notif.timestamp
          ? new Date(notif.timestamp).toLocaleTimeString("ar-SA", {
            hour: "2-digit",
            minute: "2-digit",
          })
          : ""}
      </span>
    </div>
  );
}

function ChatBubble({ msg, isOwn, themeCfg }) {
  return (
    <div
      className={`flex gap-2 animate-fade-in ${isOwn ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      {!isOwn && (
        <div className="flex-shrink-0 mt-0.5">
          {msg.avatar ? (
            <img
              src={msg.avatar}
              alt={msg.username}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold text-white">
              {(msg.username || "؟").charAt(0)}
            </div>
          )}
        </div>
      )}

      {/* Bubble */}
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-1.5 ${isOwn
            ? `${themeCfg.accent} text-white`
            : "bg-white/10 text-white"
          }`}
      >
        {/* Username (other users only) */}
        {!isOwn && (
          <p className="text-[10px] font-bold text-white/60 mb-0.5">
            {msg.username}
          </p>
        )}
        <p className="text-xs leading-relaxed break-words">{msg.text}</p>
        <p
          className={`text-[9px] mt-0.5 ${isOwn ? "text-white/50" : "text-white/30"} font-mono text-end`}
        >
          {msg.timestamp
            ? new Date(msg.timestamp).toLocaleTimeString("ar-SA", {
              hour: "2-digit",
              minute: "2-digit",
            })
            : ""}
        </p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────
   Merge + sort notifications and chat messages
   ──────────────────────────────────────────────────── */

function buildFeed(notifications, chatMessages) {
  const notifs = (notifications || []).map((n) => ({
    ...n,
    _feedType: "notification",
    _ts: n.timestamp ? new Date(n.timestamp).getTime() : 0,
  }));

  const chats = (chatMessages || []).map((m) => ({
    ...m,
    _feedType: "chat",
    _ts: m.timestamp || 0,
  }));

  return [...notifs, ...chats].sort((a, b) => a._ts - b._ts);
}
