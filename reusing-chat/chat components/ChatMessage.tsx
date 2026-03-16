"use client";

import { memo } from "react";
import { DisplayMessage } from "./types";
import { SwipeableMessage } from "./SwipeableMessage";

interface ChatMessageProps {
  message: DisplayMessage;
  isOwnMessage: boolean;
  isContinuation: boolean;
  onReply: () => void;
  formatTime: (date: string) => string;
}

// Get system message icon
function getSystemMessageIcon(systemType: string | null | undefined) {
  switch (systemType) {
    case "streak_completed":
      return "local_fire_department";
    case "streak_failed":
      return "heart_broken";
    case "streak_milestone":
      return "emoji_events";
    case "user_joined":
      return "person_add";
    case "user_left":
      return "person_remove";
    case "team_goal_reached":
      return "flag";
    default:
      return "info";
  }
}

export const ChatMessage = memo(
  function ChatMessage({
    message,
    isOwnMessage,
    isContinuation,
    onReply,
    formatTime,
  }: ChatMessageProps) {
    if (message.type === "system") {
      return (
        <div className="flex justify-center my-2 w-full">
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
            <span className="material-symbols-outlined text-primary text-sm">
              {getSystemMessageIcon(message.systemMessageType)}
            </span>
            <span className="text-primary text-sm font-medium">
              {message.content}
            </span>
          </div>
        </div>
      );
    }

    return (
      <SwipeableMessage isOwnMessage={isOwnMessage} onReply={onReply}>
        <div
          className={`
          flex gap-3
          ${isOwnMessage ? "flex-row-reverse" : ""}
          ${message.isOptimistic ? "opacity-70" : ""}
          ${isContinuation ? "mt-0.5" : "mt-3"}
        `}
        >
          {/* Avatar - only for others and first message in group */}
          {!isOwnMessage && (
            <div className="shrink-0 w-9">
              {!isContinuation ? (
                message.senderAvatar ? (
                  <img
                    src={message.senderAvatar}
                    alt={message.senderName}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-surface-dark flex items-center justify-center">
                    <span className="material-symbols-outlined text-text-secondary text-lg">
                      person
                    </span>
                  </div>
                )
              ) : null}
            </div>
          )}

          {/* Message content */}
          <div className={`flex flex-col ${isOwnMessage ? "items-end" : ""}`}>
            {/* Sender name & time - only show for first message in group */}
            {!isContinuation && (
              <div
                className={`flex items-baseline gap-2 mb-1 ${isOwnMessage ? "flex-row-reverse" : ""}`}
              >
                <span className="text-white text-sm font-bold">
                  {isOwnMessage ? "أنت" : message.senderName}
                </span>
                <span className="text-text-secondary text-xs">
                  {formatTime(message.createdAt)}
                </span>
              </div>
            )}

            {/* Message bubble */}
            <div
              className={`
              p-3 rounded-2xl leading-relaxed shadow-sm max-w-[85vw] sm:max-w-md
              ${
                isOwnMessage
                  ? "bg-primary text-background-dark"
                  : "bg-surface-dark text-white border border-border-dark"
              }
              ${
                !isContinuation
                  ? isOwnMessage
                    ? "rounded-tl-none rtl:rounded-tl-2xl rtl:rounded-tr-none"
                    : "rounded-tr-none rtl:rounded-tr-2xl rtl:rounded-tl-none"
                  : ""
              }
            `}
            >
              {/* Reply reference */}
              {message.replyTo && (
                <div
                  className={`
                  mb-2 p-2 rounded-lg border-s-2 cursor-pointer overflow-hidden
                  ${
                    isOwnMessage
                      ? "bg-background-dark/20 border-background-dark/50"
                      : "bg-primary/10 border-primary/50"
                  }
                `}
                  onClick={() => {
                    const el = document.getElementById(
                      `msg-${message.replyTo!.id}`,
                    );
                    el?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                >
                  <p
                    className={`text-xs font-bold mb-0.5 ${isOwnMessage ? "text-background-dark/70" : "text-primary"}`}
                  >
                    {message.replyTo.senderName}
                  </p>
                  <p
                    className={`text-xs line-clamp-2 ${isOwnMessage ? "text-background-dark/60" : "text-text-secondary"}`}
                  >
                    {message.replyTo.type !== "text"
                      ? message.replyTo.type === "video"
                        ? "🎥 فيديو"
                        : "📷 صورة"
                      : message.replyTo.content || "رسالة"}
                  </p>
                </div>
              )}

              {/* Media content */}
              {message.mediaUrl && (
                <div className="mb-2 rounded-lg overflow-hidden">
                  {message.type === "video" ? (
                    <video
                      src={message.mediaUrl}
                      controls
                      className="max-w-full max-h-64 rounded-lg"
                    />
                  ) : (
                    <img
                      src={message.mediaUrl}
                      alt="صورة مرفقة"
                      className="max-w-full max-h-64 rounded-lg object-cover"
                    />
                  )}
                </div>
              )}

              {/* Text content */}
              {message.content && (
                <p
                  className={`break-words ${isOwnMessage ? "font-medium" : ""}`}
                >
                  {message.content}
                </p>
              )}
            </div>

            {/* Sending indicator for optimistic messages */}
            {isOwnMessage && message.isOptimistic && (
              <span className="text-xs text-text-secondary">
                جاري الإرسال...
              </span>
            )}
          </div>
        </div>
      </SwipeableMessage>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison - only re-render if these specific props change
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.content === nextProps.message.content &&
      prevProps.message.isOptimistic === nextProps.message.isOptimistic &&
      prevProps.isOwnMessage === nextProps.isOwnMessage &&
      prevProps.isContinuation === nextProps.isContinuation
    );
  },
);
