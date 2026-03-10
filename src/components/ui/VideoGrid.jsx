import "@livekit/components-styles";
import { useTracks, VideoTrack } from "@livekit/components-react";
import { Track } from "livekit-client";
import {
  GridContainer,
  GridItem,
  FloatingGridItem,
  DEFAULT_FLOAT_BREAKPOINTS,
} from "@thangdevalone/meeting-grid-layout-react";
import { useState, useCallback, useMemo } from "react";

/* ═══════════════════════════════════════════════════
   VideoGrid — Full-featured video grid using
   meeting-grid-layout with pin, spotlight,
   pagination, PiP, and layout mode support.
   ═══════════════════════════════════════════════════ */
export default function VideoGrid({
  layoutMode = "gallery",
  pinnedIndex: externalPinnedIndex = null,
  onPinnedIndexChange,
  maxVisible = 0,
  aspectRatio = "16:9",
  gap = 8,
}) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: false },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: true },
  );

  // Internal pin state (used when parent doesn't control it)
  const [internalPinnedIndex, setInternalPinnedIndex] = useState(null);
  const pinnedIndex = externalPinnedIndex ?? internalPinnedIndex;

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [currentVisiblePage, setCurrentVisiblePage] = useState(0);

  // Unsubscribed tracks — stored by participant sid + source key
  const [unsubscribedSet, setUnsubscribedSet] = useState(new Set());

  const toggleUnsubscribe = useCallback((key) => {
    setUnsubscribedSet((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handlePin = useCallback(
    (index) => {
      const newVal = pinnedIndex === index ? null : index;
      if (onPinnedIndexChange) {
        onPinnedIndexChange(newVal);
      } else {
        setInternalPinnedIndex(newVal);
      }
    },
    [pinnedIndex, onPinnedIndexChange],
  );

  if (tracks.length === 0) return null;

  /* Per-item aspect ratios: screen shares are wider */
  const itemAspectRatios = tracks.map((t) =>
    t.source === Track.Source.ScreenShare ? "16:9" : undefined,
  );

  /* Pagination math */
  const isPaginated = maxVisible > 0;
  const hasPinned = pinnedIndex !== null && pinnedIndex !== undefined;
  const totalPages = isPaginated
    ? hasPinned
      ? 1 + Math.ceil(Math.max(0, tracks.length - 1) / maxVisible)
      : Math.ceil(tracks.length / maxVisible)
    : 1;

  /* Use PiP for exactly 2 tracks in gallery mode */
  const usePip = tracks.length === 2 && layoutMode === "gallery" && !hasPinned;

  return (
    <div className="w-full h-full meetgrid-wrapper">
      <GridContainer
        aspectRatio={aspectRatio}
        itemAspectRatios={itemAspectRatios}
        gap={gap}
        layoutMode={layoutMode}
        count={tracks.length}
        pinnedIndex={hasPinned ? pinnedIndex : undefined}
        othersPosition="right"
        maxVisible={isPaginated && !hasPinned ? maxVisible : undefined}
        currentPage={isPaginated && !hasPinned ? currentPage : undefined}
        maxItemsPerPage={isPaginated && !hasPinned ? maxVisible : undefined}
        currentVisiblePage={
          isPaginated && hasPinned ? currentVisiblePage : undefined
        }
        floatBreakpoints={usePip ? DEFAULT_FLOAT_BREAKPOINTS : undefined}
      >
        {tracks.map((trackRef, index) => {
          const participant = trackRef.participant;
          const isScreen = trackRef.source === Track.Source.ScreenShare;
          const name =
            participant?.name || participant?.identity || "Participant";
          const isPinned = pinnedIndex === index;
          const trackKey = `${participant?.sid}-${trackRef.source}`;
          const isUnsubscribed = unsubscribedSet.has(trackKey);

          return (
            <GridItem
              key={`${participant?.sid}-${trackRef.source}`}
              index={index}
            >
              {({ isLastVisibleOther, hiddenCount }) => (
                <>
                  {isLastVisibleOther && hiddenCount > 0 ? (
                    <div className="meetgrid-tile meetgrid-tile--more">
                      <span className="text-2xl font-bold text-white/80">
                        +{hiddenCount}
                      </span>
                      <span className="text-xs text-white/50 mt-1">المزيد</span>
                    </div>
                  ) : (
                    <div
                      className={`meetgrid-tile ${isPinned ? "meetgrid-tile--pinned" : ""}`}
                    >
                      {/* Video or unsubscribed placeholder */}
                      {isUnsubscribed ? (
                        <div className="meetgrid-tile-placeholder">
                          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-xl font-bold text-white/60">
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs text-white/40 mt-2 truncate max-w-[80%]">
                            {name}
                          </span>
                        </div>
                      ) : (
                        <VideoTrack
                          trackRef={trackRef}
                          className="meetgrid-tile-video"
                        />
                      )}

                      {/* Participant label */}
                      <div className="meetgrid-tile-label">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          {isScreen && (
                            <svg
                              className="w-3 h-3 text-violet-400 flex-shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12"
                              />
                            </svg>
                          )}
                          <span className="truncate">{name}</span>
                        </div>

                        {/* Unsubscribe toggle */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleUnsubscribe(trackKey);
                          }}
                          className={`flex-shrink-0 p-0.5 rounded transition-colors ${
                            isUnsubscribed
                              ? "text-red-400"
                              : "text-white/40 hover:text-white/80"
                          }`}
                          title={
                            isUnsubscribed ? "إعادة التشغيل" : "إيقاف العرض"
                          }
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            {isUnsubscribed ? (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                              />
                            ) : (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                              />
                            )}
                          </svg>
                        </button>

                        {/* Pin button */}
                        {layoutMode === "gallery" && tracks.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePin(index);
                            }}
                            className={`flex-shrink-0 p-0.5 rounded transition-colors ${
                              isPinned
                                ? "text-amber-400"
                                : "text-white/40 hover:text-white/80"
                            }`}
                            title={isPinned ? "إلغاء التثبيت" : "تثبيت"}
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill={isPinned ? "currentColor" : "none"}
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </GridItem>
          );
        })}
      </GridContainer>

      {/* Pagination controls */}
      {isPaginated && totalPages > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          <button
            onClick={() => {
              if (hasPinned) {
                setCurrentVisiblePage((p) => Math.max(0, p - 1));
              } else {
                setCurrentPage((p) => Math.max(0, p - 1));
              }
            }}
            disabled={hasPinned ? currentVisiblePage === 0 : currentPage === 0}
            className="w-7 h-7 rounded-full bg-black/60 text-white/70 hover:bg-black/80 hover:text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </button>
          <span className="text-[11px] font-mono text-white/60 tabular-nums">
            {(hasPinned ? currentVisiblePage : currentPage) + 1}/{totalPages}
          </span>
          <button
            onClick={() => {
              if (hasPinned) {
                setCurrentVisiblePage((p) => Math.min(totalPages - 1, p + 1));
              } else {
                setCurrentPage((p) => Math.min(totalPages - 1, p + 1));
              }
            }}
            disabled={
              hasPinned
                ? currentVisiblePage >= totalPages - 1
                : currentPage >= totalPages - 1
            }
            className="w-7 h-7 rounded-full bg-black/60 text-white/70 hover:bg-black/80 hover:text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
