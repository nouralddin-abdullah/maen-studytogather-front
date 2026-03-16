"use client";

import { OnlineMember } from "./types";

interface TypingIndicatorProps {
  typingMembers: OnlineMember[];
}

export function TypingIndicator({ typingMembers }: TypingIndicatorProps) {
  if (typingMembers.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      {/* Avatars - show up to 3 */}
      <div className="flex -space-x-2 rtl:space-x-reverse">
        {typingMembers.slice(0, 3).map((member, index) => (
          <div
            key={member.id}
            className="relative"
            style={{ zIndex: 3 - index }}
          >
            {member.avatar ? (
              <img
                src={member.avatar}
                alt={member.nickName}
                className="w-7 h-7 rounded-full border-2 border-background-dark object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full border-2 border-background-dark bg-surface-dark flex items-center justify-center">
                <span className="material-symbols-outlined text-text-secondary text-xs">
                  person
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Animated dots bubble */}
      <div className="flex items-center gap-1 h-7 bg-surface-dark/80 backdrop-blur-sm px-3 rounded-full border border-border-dark/50">
        <div
          className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce"
          style={{ animationDuration: "0.6s" }}
        />
        <div
          className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce"
          style={{ animationDelay: "0.15s", animationDuration: "0.6s" }}
        />
        <div
          className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce"
          style={{ animationDelay: "0.3s", animationDuration: "0.6s" }}
        />
      </div>
    </div>
  );
}
