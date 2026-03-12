import { ROUTES } from "@/utils/constants";
import { useAuthStore } from "@/stores";
import { roomService } from "@/services";
import toast from "react-hot-toast";

/**
 * Default wallpaper fallback when room has no wallPaperUrl.
 */
const DEFAULT_WALLPAPER =
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80";

/**
 * Phase badge config — color & label per TimerPhase.
 */
const PHASE_CONFIG = {
  FOCUS: {
    label: "FOCUS",
    dotColor: "bg-success",
    ping: true,
  },
  BREAK: {
    label: "BREAK",
    dotColor: "bg-yellow-400",
    ping: false,
  },
  IDLE: {
    label: "IDLE",
    dotColor: "bg-white/50",
    ping: false,
  },
  PAUSED: {
    label: "PAUSED",
    dotColor: "bg-orange-400",
    ping: false,
  },
};

/**
 * Default avatar placeholder.
 */
const DEFAULT_AVATAR = null;

/**
 * Ambient sound config — label + color classes per type.
 */
const AMBIENT_CONFIG = {
  LOFIC_MUSIC: { label: "🎵 لوفي", bg: "bg-purple-500/80" },
  RAIN: { label: "🌧️ مطر", bg: "bg-sky-500/80" },
  FIREPLACE: { label: "🔥 مدفأة", bg: "bg-orange-500/80" },
  NATURE: { label: "🌿 طبيعة", bg: "bg-emerald-500/80" },
  CAFE: { label: "☕ مقهى", bg: "bg-amber-600/80" },
  OCEAN: { label: "🌊 محيط", bg: "bg-cyan-500/80" },
  LIBRARY: { label: "📚 مكتبة", bg: "bg-indigo-500/80" },
  WHITE_NOISE: { label: "🔊 ضوضاء بيضاء", bg: "bg-gray-500/80" },
};

/**
 * RoomCard — displays a study room in the discover grid.
 *
 * Props:
 *   room — room object from API
 *   onJoin — callback when user clicks Join
 *   onDeleteSuccess — callback when room is successfully deleted
 */
function RoomCard({ room, onJoin, onDeleteSuccess }) {
  const { user: currentUser } = useAuthStore();
  const {
    id,
    name,
    description,
    currentNumParticipents,
    maxCapacity,
    focusDuration,
    breakDuration,
    wallPaperUrl,
    hasPassCode,
    ambientSound,
    currentPhase,
    host,
    hostId,
  } = room;

  const wallpaper = wallPaperUrl || DEFAULT_WALLPAPER;
  const hostAvatar = host?.avatar || DEFAULT_AVATAR;
  const hostName = host?.nickName || host?.username || "مجهول";
  const ambientCfg = AMBIENT_CONFIG[ambientSound];
  const ambientLabel = ambientCfg?.label || ambientSound;
  const ambientBg = ambientCfg?.bg || "bg-brand-600/80";

  // Capacity percentage for visual indicator
  const capacityPercent = maxCapacity
    ? Math.round((currentNumParticipents / maxCapacity) * 100)
    : 0;
  const isAlmostFull = capacityPercent >= 80;

  const isHost =
    currentUser?.id &&
    (currentUser.id === hostId ||
      currentUser.id === host?.id ||
      currentUser.id === host?.userId);

  const handleDelete = async () => {
    if (!window.confirm("هل أنت متأكد من حذف هذه الغرفة بشكل نهائي؟")) return;
    
    try {
      await roomService.deleteRoom(id || room.roomId);
      toast.success("تم حذف الغرفة بنجاح");
      onDeleteSuccess?.();
    } catch (error) {
      toast.error(error.message || "فشل حذف الغرفة. حاول مرة أخرى.");
    }
  };

  return (
    <div className="group relative rounded-2xl overflow-hidden border border-border hover:border-brand-500/50 bg-surface-elevated transition-all duration-300 hover:shadow-card-hover flex flex-col h-[380px]">
      {/* ── Wallpaper ── */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={wallpaper}
          alt={name}
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
          loading="lazy"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-elevated via-transparent to-transparent opacity-90" />

        {/* Phase badge */}
        {(() => {
          const phase = PHASE_CONFIG[currentPhase] || PHASE_CONFIG.IDLE;
          return (
            <div className="absolute top-3 start-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
              <span className="relative flex h-2 w-2">
                {phase.ping && (
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full ${phase.dotColor} opacity-75`}
                  />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${phase.dotColor}`}
                />
              </span>
              <span className="text-[11px] font-mono font-bold text-white tracking-wider">
                {phase.label}
              </span>
            </div>
          );
        })()}

        {/* Ambient sound badge */}
        {ambientSound && (
          <div
            className={`absolute top-3 end-3 ${ambientBg} backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-lg`}
          >
            {ambientLabel}
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="p-4 flex flex-col flex-1">
        {/* Room name */}
        <h3 className="font-display text-lg font-bold text-text-primary group-hover:text-brand-600 transition-colors mb-1 line-clamp-1">
          {name}
        </h3>

        {/* Description */}
        <p className="text-text-muted text-sm mb-3 line-clamp-2 leading-relaxed">
          {description || "غرفة دراسية"}
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-3 mb-auto text-sm flex-wrap">
          {/* Participants */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
              isAlmostFull
                ? "text-warning bg-warning/10 border border-warning/20"
                : "text-text-secondary bg-surface-muted"
            }`}
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
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
              />
            </svg>
            <span className="font-mono text-xs">
              {currentNumParticipents}/{maxCapacity}
            </span>
          </div>

          {/* Pomodoro config */}
          <div className="flex items-center gap-1.5 text-success bg-success/10 border border-success/20 px-2.5 py-1 rounded-lg">
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
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-mono text-xs">
              {focusDuration}/{breakDuration}
            </span>
          </div>
        </div>

        {/* ── Footer: Host + Join ── */}
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
          {/* Host info */}
          <div className="flex items-center gap-2">
            {hostAvatar ? (
              <img
                src={hostAvatar}
                alt={hostName}
                className="w-7 h-7 rounded-full border border-border object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/30 border border-border flex items-center justify-center">
                <span className="text-xs font-bold text-brand-600">
                  {hostName.charAt(0)}
                </span>
              </div>
            )}
            <span className="text-xs text-text-muted truncate max-w-[100px]">
              {hostName}
            </span>
          </div>

          {/* Call to actions (Delete + Join) */}
          <div className="flex items-center gap-2">
            {isHost && (
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-xl text-error/70 hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
                title="حذف الغرفة"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
              </button>
            )}
            <button
              onClick={() => onJoin?.(room)}
              className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white px-4 py-1.5 rounded-xl text-sm font-bold transition-colors shadow-sm hover:shadow-md cursor-pointer"
            >
              {hasPassCode && (
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
                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                  />
                </svg>
              )}
              انضم
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoomCard;
