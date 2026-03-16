"use client";

import { useState, useRef, ReactNode, memo, useCallback } from "react";

interface SwipeableMessageProps {
  children: ReactNode;
  isOwnMessage: boolean;
  onReply: () => void;
}

export const SwipeableMessage = memo(function SwipeableMessage({
  children,
  isOwnMessage,
  onReply,
}: SwipeableMessageProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isHorizontalSwipeRef = useRef<boolean | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const SWIPE_THRESHOLD = 60;
  const MAX_SWIPE = 80;
  const DIRECTION_LOCK_THRESHOLD = 10; // Pixels to move before locking direction

  // Mobile touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    isHorizontalSwipeRef.current = null; // Reset direction lock
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - startXRef.current;
    const deltaY = currentY - startYRef.current;

    // Determine direction if not yet locked
    if (isHorizontalSwipeRef.current === null) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Only lock direction after moving past threshold
      if (absX > DIRECTION_LOCK_THRESHOLD || absY > DIRECTION_LOCK_THRESHOLD) {
        // Lock to horizontal only if horizontal movement is clearly dominant
        isHorizontalSwipeRef.current = absX > absY * 1.5;
      }
    }

    // If direction is locked to vertical (scrolling), don't swipe
    if (isHorizontalSwipeRef.current === false) {
      return;
    }

    // If direction is not yet determined, don't move yet
    if (isHorizontalSwipeRef.current === null) {
      return;
    }

    // Horizontal swipe confirmed - apply transform
    let delta = deltaX;

    // RTL: own messages swipe right (positive), others swipe left (negative)
    if (isOwnMessage) {
      delta = Math.max(0, Math.min(delta, MAX_SWIPE));
    } else {
      delta = Math.min(0, Math.max(delta, -MAX_SWIPE));
    }
    setTranslateX(delta);
  };

  const handleTouchEnd = () => {
    if (
      isHorizontalSwipeRef.current &&
      Math.abs(translateX) >= SWIPE_THRESHOLD
    ) {
      onReply();
    }
    setTranslateX(0);
    setIsSwiping(false);
    isHorizontalSwipeRef.current = null;
  };

  // Desktop double-click to reply
  const handleDoubleClick = () => {
    onReply();
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full flex group ${isOwnMessage ? "justify-end" : "justify-start"}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={handleDoubleClick}
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
            w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center
            ${Math.abs(translateX) >= SWIPE_THRESHOLD ? "bg-primary/40 scale-110" : ""}
            transition-all duration-150
          `}
        >
          <span
            className="material-symbols-outlined text-primary text-lg"
            style={isOwnMessage ? { transform: "scaleX(-1)" } : undefined}
          >
            reply
          </span>
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
        {/* Desktop reply button - before message for own messages */}
        {isOwnMessage && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReply();
            }}
            className="hidden md:flex opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full bg-surface-dark border border-border-dark items-center justify-center hover:bg-primary/20 hover:border-primary/50 transition-all duration-150 shrink-0"
            title="رد على الرسالة"
          >
            <span
              className="material-symbols-outlined text-text-secondary text-base group-hover:text-primary"
              style={{ transform: "scaleX(-1)" }}
            >
              reply
            </span>
          </button>
        )}

        {/* Message content */}
        <div className="min-w-0">{children}</div>

        {/* Desktop reply button - after message for others */}
        {!isOwnMessage && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReply();
            }}
            className="hidden md:flex opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full bg-surface-dark border border-border-dark items-center justify-center hover:bg-primary/20 hover:border-primary/50 transition-all duration-150 shrink-0"
            title="رد على الرسالة"
          >
            <span className="material-symbols-outlined text-text-secondary text-base group-hover:text-primary">
              reply
            </span>
          </button>
        )}
      </div>
    </div>
  );
});
