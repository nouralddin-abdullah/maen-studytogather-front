import { useEffect } from "react";
import { useLeaderboardStore, useAuthStore } from "@/stores";
import { FIELD_LABELS } from "@/utils/constants";

/**
 * Period tab config.
 */
const PERIODS = [
  { key: "daily", label: "يومي" },
  { key: "weekly", label: "أسبوعي" },
  { key: "monthly", label: "شهري" },
  { key: "overall", label: "الكل" },
];

/**
 * Format minutes into a readable string.
 */
function formatMinutes(mins) {
  if (!mins || mins <= 0) return "٠ د";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} د`;
  if (m === 0) return `${h} س`;
  return `${h} س ${m} د`;
}

/**
 * Leaderboard page — reference-inspired layout with hero, glass tabs, table rows.
 */
function LeaderboardPage() {
  const {
    period,
    entries,
    myRank,
    totalItems,
    isLoading,
    setPeriod,
    fetchLeaderboard,
    loadMore,
  } = useLeaderboardStore();

  const { user } = useAuthStore();

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const hasMore = entries.length < totalItems;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto w-full px-2 md:px-0 flex flex-col gap-6 pb-8">
        {/* ═══════ Hero — My Rank ═══════ */}
        <section className="flex flex-col items-center text-center gap-4 pt-8 pb-2 animate-fade-in">
          {/* Avatar ring */}
          <div className="relative">
            <div className="w-28 h-28 rounded-full border-4 border-brand-600 p-1">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.nickName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                  <span className="text-3xl font-bold text-brand-600">
                    {(user?.nickName || user?.username || "أ").charAt(0)}
                  </span>
                </div>
              )}
            </div>
            {/* Rank badge */}
            {myRank?.rank && (
              <div className="absolute -bottom-2 start-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg whitespace-nowrap">
                المركز {myRank.rank}#
              </div>
            )}
          </div>

          {/* Motivational text */}
          <div className="mt-2">
            {myRank?.rank ? (
              <>
                <h1 className="font-display text-2xl font-bold text-text-primary">
                  أحسنت يا{" "}
                  <span className="text-brand-600">
                    {user?.nickName || user?.username || "دارس"}
                  </span>
                  !
                </h1>
                <p className="text-text-muted text-sm mt-1.5">
                  {formatMinutes(myRank.score)} من الدراسة في هذه الفترة
                </p>
              </>
            ) : (
              <>
                <h1 className="font-display text-2xl font-bold text-text-primary">
                  مرحباً{" "}
                  <span className="text-brand-600">
                    {user?.nickName || user?.username || ""}
                  </span>
                </h1>
                {!isLoading && (
                  <p className="text-text-muted text-sm mt-1.5">
                    ابدأ جلسة دراسة لتظهر في الترتيب!
                  </p>
                )}
              </>
            )}
          </div>
        </section>

        {/* ═══════ Period Tabs — Glass Pill ═══════ */}
        <nav className="flex justify-center">
          <div className="bg-surface-elevated/60 backdrop-blur-xl border border-border p-1 rounded-xl flex gap-1 shadow-card">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  period === p.key
                    ? "bg-brand-600 text-white shadow-md"
                    : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </nav>

        {/* ═══════ Leaderboard Table ═══════ */}
        <section className="flex flex-col gap-2.5">
          {/* Column headers */}
          {entries.length > 0 && (
            <div className="flex items-center px-5 py-2 text-[11px] font-bold uppercase tracking-wider text-text-muted">
              <span className="w-12">الترتيب</span>
              <span className="flex-1">الطالب</span>
              <span className="w-24 text-start">الوقت</span>
              <span className="w-20 text-start">السلسلة</span>
            </div>
          )}

          {/* ── Loading skeletons ── */}
          {isLoading && entries.length === 0 && (
            <div className="space-y-2.5">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-surface-elevated/60 backdrop-blur-xl border border-border animate-pulse"
                >
                  <div className="w-8 h-8 rounded-lg bg-surface-muted" />
                  <div className="w-10 h-10 rounded-full bg-surface-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-surface-muted rounded w-1/3" />
                    <div className="h-3 bg-surface-muted rounded w-1/5" />
                  </div>
                  <div className="h-5 bg-surface-muted rounded w-16" />
                </div>
              ))}
            </div>
          )}

          {/* ── Empty state ── */}
          {!isLoading && entries.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-surface-muted flex items-center justify-center mb-5">
                <svg
                  className="w-10 h-10 text-text-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                  />
                </svg>
              </div>
              <h3 className="font-display text-lg font-bold text-text-primary mb-1">
                لا توجد بيانات بعد
              </h3>
              <p className="text-text-muted text-sm max-w-xs">
                لم يسجّل أحد وقت دراسة في هذه الفترة
              </p>
            </div>
          )}

          {/* ── Leaderboard rows ── */}
          {entries.map((entry) => {
            const isMe = entry.user?.id === user?.id;
            const isFirst = entry.rank === 1;

            return (
              <div
                key={entry.rank}
                className={`flex items-center px-5 rounded-2xl transition-all ${
                  isMe
                    ? "py-4 bg-brand-600/5 dark:bg-brand-600/10 border border-brand-500/20 scale-[1.02] shadow-elevated"
                    : isFirst
                      ? "py-4 bg-surface-elevated/60 backdrop-blur-xl border border-brand-500/30 ring-2 ring-brand-500/20"
                      : "py-3.5 bg-surface-elevated/60 backdrop-blur-xl border border-border"
                }`}
              >
                {/* Rank */}
                <span
                  className={`w-12 text-2xl font-black ${
                    isFirst || isMe ? "text-brand-600" : "opacity-40"
                  }`}
                >
                  {entry.rank}
                </span>

                {/* Avatar + Info */}
                <div className="flex-1 flex items-center gap-3.5 min-w-0">
                  <div className="relative flex-shrink-0">
                    {entry.user?.avatar ? (
                      <img
                        src={entry.user.avatar}
                        alt={entry.user.nickName || entry.user.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                        <span className="text-sm font-bold text-brand-600">
                          {(
                            entry.user?.nickName ||
                            entry.user?.username ||
                            "?"
                          ).charAt(0)}
                        </span>
                      </div>
                    )}
                    {isMe && (
                      <div className="absolute -top-0.5 -end-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-surface-elevated rounded-full" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-text-primary truncate">
                      {entry.user?.nickName || entry.user?.username || "مستخدم"}
                      {isMe && (
                        <span className="text-brand-600 me-1"> (أنت)</span>
                      )}
                    </p>
                    {entry.user?.field && FIELD_LABELS[entry.user.field] && (
                      <p className="text-xs text-text-muted truncate">
                        {FIELD_LABELS[entry.user.field]}
                      </p>
                    )}
                  </div>
                </div>

                {/* Time */}
                <span
                  className={`w-24 text-start font-mono font-bold text-sm ${
                    isMe ? "text-brand-600" : "text-text-primary"
                  }`}
                >
                  {formatMinutes(entry.score)}
                </span>

                {/* Streak */}
                <div
                  className={`w-20 flex items-center gap-1 ${
                    isFirst || isMe
                      ? "text-brand-600"
                      : "text-brand-600/50"
                  }`}
                >
                  {entry.user?.longestStreak > 0 ? (
                    <>
                      <span className="font-bold text-sm">
                        {entry.user.longestStreak}
                      </span>
                      <span className="text-base">🔥</span>
                    </>
                  ) : (
                    <span className="text-xs text-text-muted">—</span>
                  )}
                </div>
              </div>
            );
          })}

          {/* ── Load more ── */}
          {hasMore && !isLoading && (
            <div className="flex justify-center pt-4">
              <button
                onClick={loadMore}
                className="px-6 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-all cursor-pointer"
              >
                عرض المزيد
              </button>
            </div>
          )}

          {/* ── Loading more spinner ── */}
          {isLoading && entries.length > 0 && (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default LeaderboardPage;
