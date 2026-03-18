import { useState, useRef, useCallback, useEffect } from "react";

/* ═══════════════════════════════════════════════
   ResizableVideoWrapper
   Wraps children (VideoGrid) in a container that
   the user can resize by dragging edges / corners,
   like an OS window / Figma frame.

   Lock toggle: when unlocked, the entire grid
   can be dragged freely within the parent bounds.
   ═══════════════════════════════════════════════ */

const MIN_W = 200;
const MIN_H = 150;
const FADE_OUT_DELAY = 3000;

const HANDLE_HIT = 28;
const CORNER_HIT = 36;

const HANDLES = [
  { id: "n", cursor: "ns-resize", style: { top: -HANDLE_HIT / 2, left: CORNER_HIT, right: CORNER_HIT, height: HANDLE_HIT } },
  { id: "s", cursor: "ns-resize", style: { bottom: -HANDLE_HIT / 2, left: CORNER_HIT, right: CORNER_HIT, height: HANDLE_HIT } },
  { id: "e", cursor: "ew-resize", style: { top: CORNER_HIT, right: -HANDLE_HIT / 2, bottom: CORNER_HIT, width: HANDLE_HIT } },
  { id: "w", cursor: "ew-resize", style: { top: CORNER_HIT, left: -HANDLE_HIT / 2, bottom: CORNER_HIT, width: HANDLE_HIT } },
  { id: "nw", cursor: "nwse-resize", style: { top: -CORNER_HIT / 2, left: -CORNER_HIT / 2, width: CORNER_HIT, height: CORNER_HIT } },
  { id: "ne", cursor: "nesw-resize", style: { top: -CORNER_HIT / 2, right: -CORNER_HIT / 2, width: CORNER_HIT, height: CORNER_HIT } },
  { id: "sw", cursor: "nesw-resize", style: { bottom: -CORNER_HIT / 2, left: -CORNER_HIT / 2, width: CORNER_HIT, height: CORNER_HIT } },
  { id: "se", cursor: "nwse-resize", style: { bottom: -CORNER_HIT / 2, right: -CORNER_HIT / 2, width: CORNER_HIT, height: CORNER_HIT } },
];

export default function ResizableVideoWrapper({ children }) {
  const outerRef = useRef(null);
  const boxRef = useRef(null);

  // Dimensions — null means "fill parent"
  const [size, setSize] = useState(null);
  // Position offset — { x, y } from center
  const [position, setPosition] = useState(null);
  // Lock state — locked = no dragging
  const [locked, setLocked] = useState(true);

  // Handles visibility
  const [handlesVisible, setHandlesVisible] = useState(false);
  const fadeTimerRef = useRef(null);
  const isDraggingRef = useRef(false);

  const showHandles = useCallback(() => {
    clearTimeout(fadeTimerRef.current);
    setHandlesVisible(true);
  }, []);

  const scheduleHide = useCallback(() => {
    if (isDraggingRef.current) return;
    clearTimeout(fadeTimerRef.current);
    fadeTimerRef.current = setTimeout(() => setHandlesVisible(false), FADE_OUT_DELAY);
  }, []);

  useEffect(() => () => clearTimeout(fadeTimerRef.current), []);

  const dragRef = useRef(null);
  const parentBounds = useRef({ w: 0, h: 0 });

  useEffect(() => {
    if (!outerRef.current) return;
    const measure = () => {
      const r = outerRef.current.getBoundingClientRect();
      parentBounds.current = { w: r.width, h: r.height };
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(outerRef.current);
    return () => ro.disconnect();
  }, []);

  // ── Resize pointer handlers ──
  const onPointerDown = useCallback(
    (handleId, e) => {
      e.preventDefault();
      e.stopPropagation();

      const parentW = parentBounds.current.w;
      const parentH = parentBounds.current.h;
      const startW = size?.w ?? parentW;
      const startH = size?.h ?? parentH;

      dragRef.current = { handleId, startX: e.clientX, startY: e.clientY, startW, startH };
      isDraggingRef.current = true;
      showHandles();

      document.body.style.cursor = HANDLES.find((h) => h.id === handleId)?.cursor || "default";
      document.body.style.userSelect = "none";

      const onMove = (ev) => {
        if (!dragRef.current) return;
        const { handleId: hid, startX, startY, startW: sw, startH: sh } = dragRef.current;
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;

        let newW = sw;
        let newH = sh;

        if (hid.includes("e")) newW = sw + dx;
        if (hid.includes("w")) newW = sw - dx;
        if (hid.includes("s")) newH = sh + dy;
        if (hid.includes("n")) newH = sh - dy;

        newW = Math.max(MIN_W, Math.min(newW, parentW));
        newH = Math.max(MIN_H, Math.min(newH, parentH));

        setSize({ w: newW, h: newH });
      };

      const onUp = () => {
        dragRef.current = null;
        isDraggingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.removeEventListener("pointercancel", onUp);
        scheduleHide();
      };

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
      document.addEventListener("pointercancel", onUp);
    },
    [size, showHandles, scheduleHide],
  );

  // ── Move (drag entire box) handler — only when unlocked ──
  const moveRef = useRef(null);

  const onMovePointerDown = useCallback(
    (e) => {
      if (locked) return;
      // Only start move on left-click on the content area (not handles/buttons)
      if (e.button !== 0) return;

      e.preventDefault();

      const parentW = parentBounds.current.w;
      const parentH = parentBounds.current.h;
      const boxW = size?.w ?? parentW;
      const boxH = size?.h ?? parentH;

      moveRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPosX: position?.x ?? 0,
        startPosY: position?.y ?? 0,
      };

      isDraggingRef.current = true;
      showHandles();
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";

      const onMove = (ev) => {
        if (!moveRef.current) return;
        const { startX, startY, startPosX, startPosY } = moveRef.current;
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;

        let newX = startPosX + dx;
        let newY = startPosY + dy;

        // Clamp so the box doesn't go outside parent
        const maxX = (parentW - boxW) / 2;
        const maxY = (parentH - boxH) / 2;
        newX = Math.max(-maxX, Math.min(maxX, newX));
        newY = Math.max(-maxY, Math.min(maxY, newY));

        setPosition({ x: newX, y: newY });
      };

      const onUp = () => {
        moveRef.current = null;
        isDraggingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.removeEventListener("pointercancel", onUp);
        scheduleHide();
      };

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
      document.addEventListener("pointercancel", onUp);
    },
    [locked, size, position, showHandles, scheduleHide],
  );

  const resetAll = useCallback(() => {
    setSize(null);
    setPosition(null);
  }, []);

  const onDoubleClick = useCallback(() => resetAll(), [resetAll]);

  const isCustom = !!size || !!position;

  // Build transform style
  const boxStyle = {};
  if (size) {
    boxStyle.width = size.w;
    boxStyle.height = size.h;
  } else {
    boxStyle.width = "100%";
    boxStyle.height = "100%";
  }
  if (position) {
    boxStyle.transform = `translate(${position.x}px, ${position.y}px)`;
  }

  return (
    <div ref={outerRef} className="resizable-video-outer">
      <div
        ref={boxRef}
        className={`resizable-video-wrapper ${isCustom ? "resizable-video-wrapper--custom" : ""} ${handlesVisible ? "resizable-video-wrapper--handles-visible" : ""} ${!locked ? "resizable-video-wrapper--unlocked" : ""}`}
        style={boxStyle}
        onMouseEnter={showHandles}
        onMouseLeave={scheduleHide}
        onTouchStart={showHandles}
        onClick={showHandles}
      >
        {/* Content — draggable when unlocked */}
        <div
          className={`resizable-video-content ${!locked ? "cursor-grab active:cursor-grabbing touch-none" : ""}`}
          onPointerDown={onMovePointerDown}
        >
          {children}
        </div>

        {/* Resize handles */}
        {HANDLES.map((h) => {
          const isCorner = h.id.length === 2;
          return (
            <div
              key={h.id}
              className={`resize-handle resize-handle--${h.id} touch-none`}
              style={{ ...h.style, cursor: h.cursor }}
              onPointerDown={(e) => onPointerDown(h.id, e)}
              onDoubleClick={onDoubleClick}
            >
              {isCorner && <div className="resize-handle-grip" />}
            </div>
          );
        })}

        {/* Toolbar — shown when handles visible */}
        {handlesVisible && (
          <div className="resize-toolbar">
            {/* Lock / Unlock toggle */}
            <button
              className={`resize-toolbar-btn ${!locked ? "resize-toolbar-btn--active" : ""}`}
              onClick={() => setLocked((l) => !l)}
              title={locked ? "تحريك الشبكة" : "تثبيت الشبكة"}
            >
              {locked ? (
                /* Locked icon */
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              ) : (
                /* Unlocked icon */
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              )}
            </button>

            {/* Reset button — only when customized */}
            {isCustom && (
              <button
                className="resize-toolbar-btn"
                onClick={resetAll}
                title="إعادة الحجم الأصلي"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
