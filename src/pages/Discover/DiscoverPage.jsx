import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useRoomsStore } from "@/stores";
import { ROUTES } from "@/utils/constants";
import RoomCard from "@/components/ui/RoomCard";
import { Link } from "react-router-dom";

/**
 * Sort options for the room list.
 */
const SORT_OPTIONS = [
  { label: "الأكثر نشاطاً", sortBy: "currentNumParticipents", order: "desc" },
  { label: "الأحدث", sortBy: "createdAt", order: "desc" },
  { label: "الأقدم", sortBy: "createdAt", order: "asc" },
];

/**
 * Discover page — browse and search for public study rooms.
 * Full immersive layout with search, sort, and paginated room grid.
 */
function DiscoverPage() {
  const { rooms, meta, isLoading, error, fetchRooms, filters } =
    useRoomsStore();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState(filters.search || "");
  const [activeSort, setActiveSort] = useState(0);

  // Initial fetch
  useEffect(() => {
    fetchRooms();
  }, []);

  // ── Search handler (debounced) ── //
  const handleSearchChange = useCallback(
    (e) => {
      const value = e.target.value;
      setSearchInput(value);

      clearTimeout(window.__searchTimer);
      window.__searchTimer = setTimeout(() => {
        fetchRooms({ search: value, page: 1 });
      }, 400);
    },
    [fetchRooms],
  );

  // ── Sort handler ── //
  const handleSort = (index) => {
    setActiveSort(index);
    const opt = SORT_OPTIONS[index];
    fetchRooms({ sortBy: opt.sortBy, order: opt.order, page: 1 });
  };

  // ── Join room handler ── //
  const handleJoinRoom = (room) => {
    navigate(`/room/${room.inviteCode}`, {
      state: {
        roomPreview: {
          name: room.name,
          hasPassCode: room.hasPassCode,
        },
      },
    });
  };

  // ── Pagination ── //
  const handlePrevPage = () => {
    if (meta?.hasPreviousPage) {
      fetchRooms({ page: meta.currentPage - 1 });
    }
  };

  const handleNextPage = () => {
    if (meta?.hasNextPage) {
      fetchRooms({ page: meta.currentPage + 1 });
    }
  };

  return (
    <>
      {/* ══════ Header Bar ══════ */}
      <header className="flex-shrink-0 flex items-center gap-3 bg-surface-elevated border border-border p-3 rounded-lg flex-wrap">
        {/* Search */}
        <div className="flex-1 min-w-[200px] max-w-xl relative">
          <svg
            className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="ابحث عن غرفة..."
            className="w-full bg-surface-muted border border-border rounded-md py-2.5 ps-10 pe-4 text-text-primary placeholder-text-muted focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all text-sm"
          />
        </div>

        {/* Sort chips */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {SORT_OPTIONS.map((opt, i) => (
            <button
              key={opt.label}
              onClick={() => handleSort(i)}
              className={`px-3.5 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeSort === i
                  ? "bg-brand-600 text-white shadow-sm"
                  : "border border-border text-text-secondary hover:bg-surface-muted hover:text-text-primary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* My Rooms toggle */}
        <button
          onClick={() => {
            const nextVal = !filters.myRoomsOnly;
            useRoomsStore.getState().toggleMyRooms(nextVal);
            if (nextVal) setSearchInput(""); // Clear search visually when switching
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-bold transition-all cursor-pointer ${
            filters.myRoomsOnly
              ? "bg-brand-100 text-brand-700 border border-brand-200"
              : "bg-surface-elevated text-text-secondary border border-border hover:bg-surface-muted hover:text-text-primary"
          }`}
        >
          <svg
            className="w-4.5 h-4.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            />
          </svg>
          غرفي
        </button>

        {/* Create room button */}
        <Link
          to={ROUTES.CREATE_ROOM}
          className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-md text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ms-auto"
        >
          <svg
            className="w-4.5 h-4.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          إنشاء غرفة
        </Link>
      </header>

      {/* ══════ Room Grid ══════ */}
      <div className="flex-1 overflow-y-auto pe-1 mobile-no-scrollbar">
        {/* Error state */}
        {error && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <p className="text-error text-sm mb-3">{error}</p>
              <button
                onClick={() => fetchRooms()}
                className="text-brand-600 hover:underline text-sm font-medium cursor-pointer"
              >
                إعادة المحاولة
              </button>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && rooms.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 pb-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="rounded-lg overflow-hidden border border-border bg-surface-elevated animate-pulse h-[380px]"
              >
                <div className="h-44 bg-surface-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-surface-muted rounded w-3/4" />
                  <div className="h-3 bg-surface-muted rounded w-full" />
                  <div className="h-3 bg-surface-muted rounded w-1/2" />
                  <div className="flex gap-2 mt-4">
                    <div className="h-7 bg-surface-muted rounded-lg w-20" />
                    <div className="h-7 bg-surface-muted rounded-lg w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && rooms.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-surface-muted flex items-center justify-center mb-5">
              <svg
                className="w-10 h-10 text-text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </div>
            <h3 className="font-display text-lg font-bold text-text-primary mb-1">
              لا توجد غرف
            </h3>
            <p className="text-text-muted text-sm max-w-xs">
              {filters.myRoomsOnly
                ? "لم تقم بإنشاء أي غرفة بعد."
                : searchInput
                  ? `لم يتم العثور على غرف تطابق "${searchInput}"`
                  : "لا توجد غرف متاحة حالياً. كن أول من ينشئ غرفة!"}
            </p>
          </div>
        )}

        {/* Room cards grid */}
        {!error && rooms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 pb-4">
            {rooms.map((room) => (
              <RoomCard
                key={room.id || room.roomId}
                room={room}
                onJoin={handleJoinRoom}
                onDeleteSuccess={() => fetchRooms()}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 py-4">
            <button
              onClick={handlePrevPage}
              disabled={!meta.hasPreviousPage}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium border border-border text-text-secondary hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
              السابق
            </button>

            <span className="text-sm text-text-muted font-mono">
              {meta.currentPage} / {meta.totalPages}
            </span>

            <button
              onClick={handleNextPage}
              disabled={!meta.hasNextPage}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium border border-border text-text-secondary hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              التالي
              <svg
                className="w-4 h-4"
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
          </div>
        )}
      </div>
    </>
  );
}

export default DiscoverPage;
