import { useState, useRef, useCallback, useEffect } from "react";

/* ═══════════════════════════════════════════════
   ResizableVideoWrapper
   Wraps children (VideoGrid) in a container that
   the user can resize by dragging edges / corners,
   like an OS window / Figma frame.

   UX: Handles only show when the mouse is over
   the actual video box (not the entire parent).
   They fade out after the mouse leaves.
   ═══════════════════════════════════════════════ */

const MIN_W = 200;
const MIN_H = 150;
const FADE_OUT_DELAY = 800; // ms after mouse leaves before handles hide

// Larger hit areas for comfortable dragging, rendered elements are smaller
const HANDLE_HIT = 14; // invisible hit zone size
const CORNER_HIT = 20;

const HANDLES = [
  // edges — large invisible hit zone
  { id: "n", cursor: "ns-resize", style: { top: -HANDLE_HIT / 2, left: CORNER_HIT, right: CORNER_HIT, height: HANDLE_HIT } },
  { id: "s", cursor: "ns-resize", style: { bottom: -HANDLE_HIT / 2, left: CORNER_HIT, right: CORNER_HIT, height: HANDLE_HIT } },
  { id: "e", cursor: "ew-resize", style: { top: CORNER_HIT, right: -HANDLE_HIT / 2, bottom: CORNER_HIT, width: HANDLE_HIT } },
  { id: "w", cursor: "ew-resize", style: { top: CORNER_HIT, left: -HANDLE_HIT / 2, bottom: CORNER_HIT, width: HANDLE_HIT } },
  // corners — large invisible hit zone
  { id: "nw", cursor: "nwse-resize", style: { top: -CORNER_HIT / 2, left: -CORNER_HIT / 2, width: CORNER_HIT, height: CORNER_HIT } },
  { id: "ne", cursor: "nesw-resize", style: { top: -CORNER_HIT / 2, right: -CORNER_HIT / 2, width: CORNER_HIT, height: CORNER_HIT } },
  { id: "sw", cursor: "nesw-resize", style: { bottom: -CORNER_HIT / 2, left: -CORNER_HIT / 2, width: CORNER_HIT, height: CORNER_HIT } },
  { id: "se", cursor: "nwse-resize", style: { bottom: -CORNER_HIT / 2, right: -CORNER_HIT / 2, width: CORNER_HIT, height: CORNER_HIT } },
];

export default function ResizableVideoWrapper({ children }) {
  const outerRef = useRef(null);
  const boxRef = useRef(null);

  // Dimensions — null means "fill parent" (initial state)
  const [size, setSize] = useState(null);

  // Handles visibility — auto-hide after inactivity
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

  // Clean up on unmount
  useEffect(() => () => clearTimeout(fadeTimerRef.current), []);

  // Drag bookkeeping
  const dragRef = useRef(null);

  // Measure parent on mount / resize to know max bounds
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

  // ── Pointer handlers ──
  const onPointerDown = useCallback(
    (handleId, e) => {
      e.preventDefault();
      e.stopPropagation();

      const parentW = parentBounds.current.w;
      const parentH = parentBounds.current.h;

      const startW = size?.w ?? parentW;
      const startH = size?.h ?? parentH;

      dragRef.current = {
        handleId,
        startX: e.clientX,
        startY: e.clientY,
        startW,
        startH,
      };

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
        scheduleHide();
      };

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    },
    [size, showHandles, scheduleHide],
  );

  // Reset to full size on double-click any handle
  const onDoubleClick = useCallback(() => setSize(null), []);

  const isCustomSized = !!size;

  return (
    <div
      ref={outerRef}
      className="resizable-video-outer"
    >
      <div
        ref={boxRef}
        className={`resizable-video-wrapper ${isCustomSized ? "resizable-video-wrapper--custom" : ""} ${handlesVisible ? "resizable-video-wrapper--handles-visible" : ""}`}
        style={
          size
            ? { width: size.w, height: size.h }
            : { width: "100%", height: "100%" }
        }
        onMouseEnter={showHandles}
        onMouseLeave={scheduleHide}
      >
        {/* Content */}
        <div className="resizable-video-content">{children}</div>

        {/* Resize handles — only rendered when custom-sized or hovering */}
        {HANDLES.map((h) => {
          const isCorner = h.id.length === 2;
          return (
            <div
              key={h.id}
              className={`resize-handle resize-handle--${h.id}`}
              style={{ ...h.style, cursor: h.cursor }}
              onPointerDown={(e) => onPointerDown(h.id, e)}
              onDoubleClick={onDoubleClick}
            >
              {/* Visual indicator inside the hit zone */}
              {isCorner && (
                <div className="resize-handle-grip" />
              )}
            </div>
          );
        })}

        {/* Reset button — shown when custom-sized & handles visible */}
        {isCustomSized && handlesVisible && (
          <button
            className="resize-reset-btn"
            onClick={() => setSize(null)}
            title="إعادة الحجم الأصلي"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
