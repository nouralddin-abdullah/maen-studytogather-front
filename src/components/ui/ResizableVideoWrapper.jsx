import { useState, useRef, useCallback, useEffect } from "react";

/* ═══════════════════════════════════════════════
   ResizableVideoWrapper
   Wraps children (VideoGrid) in a container that
   the user can resize by dragging edges / corners,
   like an OS window. Resizing the container causes
   GridContainer inside to re-layout all tiles.

   UX: Handles are completely invisible by default.
   They fade in when the mouse hovers near edges,
   then fade out 1.5s after the mouse leaves.
   ═══════════════════════════════════════════════ */

const MIN_W = 200;
const MIN_H = 150;
const FADE_OUT_DELAY = 500; // ms after mouse leaves before handles hide

const HANDLES = [
  // edges
  { id: "n", cursor: "ns-resize", style: { top: 0, left: 6, right: 6, height: 6 } },
  { id: "s", cursor: "ns-resize", style: { bottom: 0, left: 6, right: 6, height: 6 } },
  { id: "e", cursor: "ew-resize", style: { top: 6, right: 0, bottom: 6, width: 6 } },
  { id: "w", cursor: "ew-resize", style: { top: 6, left: 0, bottom: 6, width: 6 } },
  // corners
  { id: "nw", cursor: "nwse-resize", style: { top: 0, left: 0, width: 12, height: 12 } },
  { id: "ne", cursor: "nesw-resize", style: { top: 0, right: 0, width: 12, height: 12 } },
  { id: "sw", cursor: "nesw-resize", style: { bottom: 0, left: 0, width: 12, height: 12 } },
  { id: "se", cursor: "nwse-resize", style: { bottom: 0, right: 0, width: 12, height: 12 } },
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
    // Don't hide while dragging
    if (isDraggingRef.current) return;
    clearTimeout(fadeTimerRef.current);
    fadeTimerRef.current = setTimeout(() => setHandlesVisible(false), FADE_OUT_DELAY);
  }, []);

  // Clean up on unmount
  useEffect(() => () => clearTimeout(fadeTimerRef.current), []);

  // Drag bookkeeping (refs to avoid re-renders during drag)
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
      showHandles(); // Keep handles visible during drag

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
        scheduleHide(); // Start fade-out timer after drag ends
      };

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    },
    [size, showHandles, scheduleHide],
  );

  // Reset to full size on double-click any handle
  const onDoubleClick = useCallback(() => setSize(null), []);

  return (
    <div
      ref={outerRef}
      className="resizable-video-outer"
      onMouseEnter={showHandles}
      onMouseLeave={scheduleHide}
    >
      <div
        ref={boxRef}
        className={`resizable-video-wrapper ${size ? "resizable-video-wrapper--custom" : ""} ${handlesVisible ? "resizable-video-wrapper--handles-visible" : ""}`}
        style={
          size
            ? { width: size.w, height: size.h }
            : { width: "100%", height: "100%" }
        }
      >
        {/* Content */}
        <div className="resizable-video-content">{children}</div>

        {/* Resize handles */}
        {HANDLES.map((h) => (
          <div
            key={h.id}
            className={`resize-handle resize-handle--${h.id}`}
            style={{ ...h.style, cursor: h.cursor }}
            onPointerDown={(e) => onPointerDown(h.id, e)}
            onDoubleClick={onDoubleClick}
          />
        ))}
      </div>
    </div>
  );
}
