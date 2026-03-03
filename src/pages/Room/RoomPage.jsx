import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores";
import useRoomStore from "@/stores/useRoomStore";
import {
  ROUTES,
  TIMER_PHASES,
  TIMER_PHASE_LABELS,
  AMBIENT_SOUND_LABELS,
} from "@/utils/constants";
import { EditRoomModal, ProfilePopover } from "@/components/ui";
import useAmbientSound from "@/hooks/useAmbientSound";

/* ═══════════════════════════════════════════════════
   Theme config — CLASSIC uses site brand (blue),
   NIGHT_CITY uses a neon purple/indigo vibe.
   ═══════════════════════════════════════════════════ */
const THEME_CONFIG = {
  CLASSIC: {
    fallbackBg:
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1920&q=80",
    overlay: "bg-gradient-to-b from-black/30 via-transparent to-black/30",
    glass: "room-glass-classic",
    // Accent colours used across UI
    accent: "bg-brand-600",
    accentHover: "hover:bg-brand-700",
    accentShadow: "shadow-brand-600/20",
    accentText: "text-brand-500",
    accentBorder: "border-brand-500",
    accentBg: "bg-brand-600/20",
    notifHeader: "bg-brand-600/80",
  },
  NIGHT_CITY: {
    fallbackBg:
      "https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=1920&q=80",
    overlay: "bg-gradient-to-b from-black/35 via-transparent to-black/35",
    glass: "room-glass-night",
    accent: "bg-violet-600",
    accentHover: "hover:bg-violet-700",
    accentShadow: "shadow-violet-600/30",
    accentText: "text-violet-400",
    accentBorder: "border-violet-500",
    accentBg: "bg-violet-600/20",
    notifHeader: "bg-violet-600/80",
  },
};

/* ═══════════════════════════════════════════════════
   Phase colours for the timer ring / badge
   ═══════════════════════════════════════════════════ */
const PHASE_STYLE = {
  FOCUS: {
    dot: "bg-emerald-400",
    ring: "shadow-[0_0_14px_rgba(16,185,129,.5)]",
    text: "text-emerald-400",
    ping: true,
  },
  BREAK: {
    dot: "bg-yellow-400",
    ring: "shadow-[0_0_14px_rgba(245,158,11,.4)]",
    text: "text-yellow-400",
    ping: false,
  },
  IDLE: {
    dot: "bg-white/50",
    ring: "",
    text: "text-white/60",
    ping: false,
  },
  PAUSED: {
    dot: "bg-orange-400",
    ring: "shadow-[0_0_14px_rgba(251,146,60,.4)]",
    text: "text-orange-400",
    ping: false,
  },
};

/* ═══════════════════════════════════════════════════
   Utility — format ms → MM:SS
   ═══════════════════════════════════════════════════ */
function formatTime(ms) {
  if (!ms || ms <= 0) return "00:00";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/* ═══════════════════════════════════════════════════
   Main component
   ═══════════════════════════════════════════════════ */
function RoomPage() {
  const { inviteCode } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  // ── Stores ──
  const user = useAuthStore((s) => s.user);

  const {
    room,
    participants,
    notifications,
    isJoining,
    isLeaving,
    isConnected,
    isTimerLoading,
    error,
    passCodeRequired,
    join,
    leave,
    reset,
    startTimer,
    pauseTimer,
    resumeTimer,
    restartTimer,
    changePomodoro,
    isPomodoroLoading,
  } = useRoomStore();

  // ── Local state ──
  const [passCodeInput, setPassCodeInput] = useState("");
  const [passCodeError, setPassCodeError] = useState("");
  const [volume, setVolume] = useState(60);
  const [isMuted, setIsMuted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [showInviteToast, setShowInviteToast] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showPomodoroSettings, setShowPomodoroSettings] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const [editFocus, setEditFocus] = useState(25);
  const [editBreak, setEditBreak] = useState(5);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const notifEndRef = useRef(null);
  const soundPickerRef = useRef(null);
  const selectedAvatarRef = useRef(null);

  // ── Ambient sound engine ──
  const { currentTrack, availableTracks, changeTrack, isLoadingLofi } =
    useAmbientSound(room?.ambientSound, volume, isMuted);

  // ── Derived ──
  const isHost = room?.hostId === user?.id;
  const hasPassCode = state?.roomPreview?.hasPassCode;
  const roomName = room?.name || state?.roomPreview?.name || "غرفة الدراسة";
  const phase = room?.currentPhase || TIMER_PHASES.IDLE;
  const phaseStyle = PHASE_STYLE[phase] || PHASE_STYLE.IDLE;
  const themeCfg = THEME_CONFIG[room?.theme] || THEME_CONFIG.CLASSIC;
  const wallpaper = room?.wallPaperUrl || themeCfg.fallbackBg;
  const glassClass = themeCfg.glass;
  const ambientLabel =
    AMBIENT_SOUND_LABELS[room?.ambientSound] || AMBIENT_SOUND_LABELS.NONE;

  // ── Join on mount ──
  useEffect(() => {
    // If we already have the room loaded for this invite code, skip
    if (room?.inviteCode === inviteCode) return;

    // If room requires passcode, wait for user input
    if (hasPassCode) return;

    // Auto-join
    join(inviteCode).catch(() => {
      // error is already in store
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteCode]);

  useEffect(() => {
    return () => {
      // Disconnect SSE when navigating away.
      // We do NOT call leave() — the backend handles disconnect via SSE close.
      useRoomStore.getState().disconnectSSE();
    };
  }, []);

  // ── ESC to exit fullscreen focus mode ──
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isFullscreen]);

  // ── Close sound picker on outside click ──
  useEffect(() => {
    if (!showSoundPicker) return;
    const handleClick = (e) => {
      if (soundPickerRef.current && !soundPickerRef.current.contains(e.target)) {
        setShowSoundPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showSoundPicker]);

  // ── Timer countdown ──
  useEffect(() => {
    if (!room) return;

    if (
      (phase === TIMER_PHASES.FOCUS || phase === TIMER_PHASES.BREAK) &&
      room.timerEndAt
    ) {
      const tick = () => {
        const remaining = Math.max(
          0,
          new Date(room.timerEndAt).getTime() - Date.now(),
        );
        setTimeLeft(remaining);
      };
      tick(); // immediate
      const id = setInterval(tick, 1000);
      return () => clearInterval(id);
    }

    if (phase === TIMER_PHASES.PAUSED && room.pauseRemainingMs) {
      setTimeLeft(room.pauseRemainingMs);
      return;
    }

    // IDLE — show full focus duration as static
    if (phase === TIMER_PHASES.IDLE && room.focusDuration) {
      setTimeLeft(room.focusDuration * 60 * 1000);
      return;
    }

    setTimeLeft(null);
  }, [room, phase]);

  // ── Auto-scroll notifications ──
  useEffect(() => {
    notifEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [notifications.length]);

  // ── Handlers ──
  const handlePassCodeSubmit = async (e) => {
    e.preventDefault();
    if (!passCodeInput.trim()) return;
    setPassCodeError("");
    try {
      await join(inviteCode, passCodeInput.trim());
    } catch {
      setPassCodeError("رمز الدخول غير صحيح");
    }
  };

  const handleLeave = async () => {
    try {
      await leave();
    } catch {
      // ignore
    }
    navigate(ROUTES.DISCOVER);
  };

  const handleCopyInvite = useCallback(() => {
    const link = `${window.location.origin}/room/${room?.inviteCode || inviteCode}`;
    navigator.clipboard.writeText(link).then(() => {
      setShowInviteToast(true);
      setTimeout(() => setShowInviteToast(false), 2000);
    });
  }, [room, inviteCode]);

  /* ═══════════════════════════════════════════════
     Passcode gate screen
     ═══════════════════════════════════════════════ */
  if ((hasPassCode && !room) || (passCodeRequired && !room)) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-surface relative overflow-hidden">
        {/* Decorative blurs */}
        <div className="absolute -top-[15%] -end-[15%] w-[40%] h-[40%] bg-brand-500/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[15%] -start-[15%] w-[40%] h-[40%] bg-brand-400/8 blur-[120px] rounded-full" />

        <form
          onSubmit={handlePassCodeSubmit}
          className="relative z-10 bg-surface-elevated border border-border rounded-3xl p-8 shadow-elevated w-full max-w-sm flex flex-col items-center gap-5 animate-fade-in"
        >
          {/* Lock icon */}
          <div className="w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-brand-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>

          <div className="text-center">
            <h2 className="font-display text-xl font-bold text-text-primary mb-1">
              {roomName}
            </h2>
            <p className="text-text-muted text-sm">
              هذه الغرفة محمية برمز دخول
            </p>
          </div>

          <div className="w-full">
            <input
              dir="ltr"
              type="text"
              value={passCodeInput}
              onChange={(e) => setPassCodeInput(e.target.value)}
              placeholder="أدخل رمز الدخول"
              className="w-full bg-surface-muted border border-border rounded-xl py-3 px-4 text-center text-text-primary placeholder-text-muted font-mono text-lg tracking-[0.3em] focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
              autoFocus
            />
            {(passCodeError || error) && (
              <p className="text-error text-xs mt-2 text-center">
                {passCodeError || error}
              </p>
            )}
          </div>

          <div className="flex gap-3 w-full">
            <button
              type="button"
              onClick={() => navigate(ROUTES.DISCOVER)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-border text-text-secondary hover:bg-surface-muted transition-colors cursor-pointer"
            >
              رجوع
            </button>
            <button
              type="submit"
              disabled={isJoining || !passCodeInput.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isJoining ? "جاري الانضمام..." : "انضمام"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════
     Loading / Error states
     ═══════════════════════════════════════════════ */
  if (isJoining && !room) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-surface gap-4">
        <div className="w-10 h-10 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-text-muted text-sm">جاري الانضمام...</p>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-surface gap-4 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-error"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <p className="text-text-primary font-bold text-lg">{error}</p>
        <button
          onClick={() => navigate(ROUTES.DISCOVER)}
          className="text-brand-600 hover:underline text-sm font-medium cursor-pointer"
        >
          العودة للاكتشاف
        </button>
      </div>
    );
  }

  if (!room) return null;

  /* ═══════════════════════════════════════════════
     Main Room UI
     ═══════════════════════════════════════════════ */
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col relative">
      {/* ── Background ── */}
      <div className="absolute inset-0 z-0">
        <img src={wallpaper} alt="" className="w-full h-full object-cover" />
      </div>

      {/* ── Content layer ── */}
      <div className="relative z-10 flex h-full p-3 gap-3">
        {/* ════════════════════════════════════════
           LEFT — Participants sidebar
           (RTL: appears on RIGHT side)
           ════════════════════════════════════════ */}
        <aside className="w-[88px] flex-shrink-0 flex flex-col items-center justify-center py-4 relative">
          <div
            className={`${glassClass} rounded-3xl py-3 flex flex-col items-center gap-3 overflow-y-auto overflow-x-hidden custom-scrollbar max-h-[70vh] min-h-[120px] w-[82px]`}
          >
            {participants.map((p) => {
              const isMe = p.id === user?.id;
              const isSelected = selectedParticipant?.id === p.id;
              return (
                <div
                  key={p.id}
                  className="relative group cursor-pointer"
                  onClick={(e) => {
                    // If clicking the same participant, toggle off
                    if (isSelected) {
                      setSelectedParticipant(null);
                      selectedAvatarRef.current = null;
                    } else {
                      // For current user, enrich with full auth store data
                      const data = isMe ? { ...p, ...user } : p;
                      setSelectedParticipant(data);
                      selectedAvatarRef.current = e.currentTarget;
                    }
                  }}
                >
                  {p.avatar ? (
                    <img
                      src={p.avatar}
                      alt={p.nickName}
                      className={`w-13 h-13 rounded-full object-cover border-2 transition-colors flex-shrink-0 ${
                        isMe
                          ? `${themeCfg.accentBorder}`
                          : isSelected
                            ? "border-white/70"
                            : "border-transparent hover:border-white/50"
                      }`}
                    />
                  ) : (
                    <div
                      className={`w-13 h-13 rounded-full flex items-center justify-center text-base font-bold border-2 transition-colors flex-shrink-0 ${
                        isMe
                          ? `${themeCfg.accentBorder} ${themeCfg.accent} text-white`
                          : isSelected
                            ? "border-white/70 bg-white/30 text-white"
                            : "border-transparent hover:border-white/50 bg-white/20 text-white"
                      }`}
                    >
                      {(p.nickName || p.username || "؟").charAt(0)}
                    </div>
                  )}
                  {/* Host crown */}
                  {p.id === room.hostId && (
                    <span className="absolute -top-1.5 start-1/2 -translate-x-1/2 text-yellow-400 text-xs drop-shadow-[0_0_4px_rgba(250,204,21,.6)]">
                      👑
                    </span>
                  )}
                  {/* Tooltip — hide when popover is open for this participant */}
                  {!isSelected && (
                    <span className="absolute start-full ms-3 px-2.5 py-1 rounded-lg bg-black/80 text-[11px] font-medium text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                      {p.nickName || p.username}
                      {isMe && " (أنت)"}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Participant count */}
            {participants.length > 0 && (
              <div className="text-[10px] font-mono text-white/40 pt-1 border-t border-white/10 mt-1 w-full text-center">
                {participants.length}/{room.maxCapacity}
              </div>
            )}
          </div>

          {/* Profile popover — vertically centered next to sidebar */}
          {selectedParticipant && (
            <div
              className="absolute start-full ms-3 z-[100]"
              style={{
                top: "50%",
                transform: "translateY(-50%)",
              }}
            >
              <ProfilePopover
                participant={selectedParticipant}
                onClose={() => {
                  setSelectedParticipant(null);
                  selectedAvatarRef.current = null;
                }}
                glassClass={glassClass}
              />
            </div>
          )}
        </aside>

        {/* ════════════════════════════════════════
           CENTER — Main area
           ════════════════════════════════════════ */}
        <main className="flex-1 flex flex-col justify-between relative">
          {/* ── Top bar: Room name + Invite + Leave ── */}
          <header className="flex justify-center items-start pt-1">
            <div
              className={`${glassClass} px-5 py-2 rounded-full flex items-center gap-4`}
            >
              {/* Leave button */}
              <button
                onClick={handleLeave}
                disabled={isLeaving}
                title="مغادرة"
                className="text-white/60 hover:text-red-400 transition-colors cursor-pointer"
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
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                  />
                </svg>
              </button>

              {/* Room name + connection badge */}
              <div className="flex items-center gap-2.5 border-s border-e border-white/10 px-4">
                {/* Connection indicator */}
                <span className="relative flex h-2 w-2">
                  {isConnected && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? "bg-emerald-400" : "bg-red-400"}`}
                  />
                </span>
                <span className="font-bold text-white tracking-wide text-sm">
                  {room.name}
                </span>
              </div>

              {/* Invite button */}
              <div className="relative">
                <button
                  onClick={handleCopyInvite}
                  className={`${themeCfg.accent} ${themeCfg.accentHover} text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg ${themeCfg.accentShadow} transition-all hover:scale-105 cursor-pointer`}
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
                      d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                    />
                  </svg>
                  دعوة
                </button>
                {/* Copy toast */}
                {showInviteToast && (
                  <span className="absolute top-full start-1/2 -translate-x-1/2 mt-2 px-3 py-1 rounded-lg bg-emerald-500 text-white text-[11px] font-medium whitespace-nowrap animate-fade-in">
                    تم نسخ الرابط!
                  </span>
                )}
              </div>

              {/* Edit Room button (Host only) */}
              {isHost && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className={`${themeCfg.accentBg} text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm border border-white/10 transition-all hover:bg-white/10 cursor-pointer`}
                >
                  <svg
                    className="w-3.5 h-3.5 text-white/80"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                    />
                  </svg>
                  تعديل
                </button>
              )}
            </div>
          </header>

          {/* ── Bottom bar: Sound controls ── */}
          <div className="flex justify-center pb-1">
            <div
              className={`${glassClass} px-5 py-3 rounded-2xl flex items-center gap-5`}
            >
              {/* Ambient sound info — clickable to open variant picker */}
              <div className="relative" ref={soundPickerRef}>
                <button
                  onClick={() =>
                    room.ambientSound && room.ambientSound !== "NONE"
                      ? setShowSoundPicker((v) => !v)
                      : null
                  }
                  className={`flex items-center gap-3 pe-4 border-e border-white/10 transition-colors ${
                    room.ambientSound && room.ambientSound !== "NONE"
                      ? "cursor-pointer hover:bg-white/5 rounded-lg px-3 py-1.5 -mx-1"
                      : ""
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-lg">
                    {room.ambientSound === "RAIN"
                      ? "🌧️"
                      : room.ambientSound === "LOFIC_MUSIC"
                        ? "🎵"
                        : room.ambientSound === "SEA"
                          ? "🌊"
                          : "🔇"}
                  </div>
                  <div className="flex flex-col text-start">
                    <span className="text-xs font-bold text-white">
                      {currentTrack?.label || ambientLabel}
                    </span>
                    <span className="text-[10px] text-white/50">صوت محيطي</span>
                  </div>
                  {room.ambientSound && room.ambientSound !== "NONE" && (
                    <svg
                      className={`w-3.5 h-3.5 text-white/40 transition-transform ms-1 ${
                        showSoundPicker ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                    </svg>
                  )}
                </button>

                {/* Sound variant picker popover */}
                {showSoundPicker && (
                  <div className="absolute bottom-full mb-2 start-0 min-w-[220px] max-w-[280px] bg-black/80 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden animate-fade-in z-50">
                    <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white/70">
                        {room.ambientSound === "RAIN"
                          ? "🌧️ أنواع صوت المطر"
                          : room.ambientSound === "SEA"
                            ? "🌊 أنواع صوت البحر"
                            : "🎵 محطات لوفي"}
                      </span>
                      {isLoadingLofi && (
                        <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>
                    <div className="max-h-[200px] overflow-y-auto custom-scrollbar py-1">
                      {availableTracks.length === 0 && isLoadingLofi && (
                        <p className="text-white/30 text-xs text-center py-4">
                          جاري تحميل المحطات...
                        </p>
                      )}
                      {availableTracks.length === 0 && !isLoadingLofi && room.ambientSound === "LOFIC_MUSIC" && (
                        <p className="text-white/30 text-xs text-center py-4">
                          لم يتم العثور على محطات
                        </p>
                      )}
                      {availableTracks.map((track) => {
                        const isActive = currentTrack?.id === track.id;
                        return (
                          <button
                            key={track.id}
                            onClick={() => {
                              changeTrack(track.id);
                              setShowSoundPicker(false);
                            }}
                            className={`w-full text-start px-3 py-2 text-xs transition-colors cursor-pointer flex items-center gap-2.5 ${
                              isActive
                                ? "bg-white/15 text-white font-bold"
                                : "text-white/70 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            {isActive && (
                              <span className="relative flex h-2 w-2 flex-shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                              </span>
                            )}
                            {!isActive && (
                              <span className="w-2 h-2 rounded-full bg-white/20 flex-shrink-0" />
                            )}
                            <span className="truncate">{track.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Volume control */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-full hover:bg-white/10 text-white transition-colors cursor-pointer"
                >
                  {isMuted || volume === 0 ? (
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
                        d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
                      />
                    </svg>
                  ) : (
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
                        d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
                      />
                    </svg>
                  )}
                </button>

                {/* Slider */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(Number(e.target.value));
                    if (isMuted) setIsMuted(false);
                  }}
                  className="w-24 h-1 accent-brand-500 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                  dir="ltr"
                />
              </div>

              {/* Divider + Fullscreen focus toggle */}
              <div className="ps-4 border-s border-white/10">
                <button
                  onClick={() => setIsFullscreen(true)}
                  title="وضع التركيز"
                  className={`w-9 h-9 rounded-full ${themeCfg.accent} flex items-center justify-center text-white shadow-lg ${themeCfg.accentShadow} cursor-pointer transition-all hover:scale-110`}
                >
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
                      d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* ════════════════════════════════════════
           RIGHT — Panels sidebar
           (RTL: appears on LEFT side)
           ════════════════════════════════════════ */}
        <aside className="w-80 flex-shrink-0 flex flex-col gap-3 h-full">
          {/* ── Timer Panel ── */}
          <div className={`${glassClass} p-5 rounded-3xl flex flex-col gap-4`}>
            {/* Header */}
            <div className="flex justify-between items-center text-white/90">
              <span className="font-bold flex items-center gap-2 text-sm">
                مؤقت الجلسة
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold ${phaseStyle.text}`}>
                  {TIMER_PHASE_LABELS[phase]}
                </span>
                <span className="relative flex h-2 w-2">
                  {phaseStyle.ping && (
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full ${phaseStyle.dot} opacity-75`}
                    />
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${phaseStyle.dot} ${phaseStyle.ring}`}
                  />
                </span>
              </div>
            </div>

            {/* Countdown */}
            <div className="text-center py-2">
              <div
                className={`text-6xl font-mono font-bold text-white tracking-widest tabular-nums ${
                  phase === TIMER_PHASES.FOCUS
                    ? "drop-shadow-[0_0_16px_rgba(16,185,129,.3)]"
                    : phase === TIMER_PHASES.BREAK
                      ? "drop-shadow-[0_0_16px_rgba(245,158,11,.3)]"
                      : ""
                }`}
              >
                {formatTime(timeLeft)}
              </div>
              {/* Pomodoro config label */}
              <p className="text-[11px] text-white/40 mt-1 font-mono">
                {room.focusDuration}د تركيز / {room.breakDuration}د استراحة
              </p>
            </div>

            {/* Host controls */}
            {isHost && (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  {phase === TIMER_PHASES.IDLE && (
                    <>
                      <button
                        onClick={startTimer}
                        disabled={isTimerLoading}
                        className="flex-1 bg-emerald-500/80 hover:bg-emerald-500 text-white py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
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
                            d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                          />
                        </svg>
                        ابدأ الجلسة
                      </button>
                      <button
                        onClick={() => {
                          setEditFocus(room.focusDuration);
                          setEditBreak(room.breakDuration);
                          setShowPomodoroSettings(!showPomodoroSettings);
                        }}
                        className={`w-10 flex items-center justify-center rounded-xl transition-colors cursor-pointer ${
                          showPomodoroSettings
                            ? "bg-white/25 text-white"
                            : "bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
                        }`}
                        title="إعدادات البومودورو"
                      >
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
                            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </button>
                    </>
                  )}
                  {phase === TIMER_PHASES.FOCUS && (
                    <button
                      onClick={pauseTimer}
                      disabled={isTimerLoading}
                      className="flex-1 bg-orange-500/80 hover:bg-orange-500 text-white py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
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
                          d="M15.75 5.25v13.5m-7.5-13.5v13.5"
                        />
                      </svg>
                      إيقاف مؤقت
                    </button>
                  )}
                  {phase === TIMER_PHASES.PAUSED && (
                    <>
                      <button
                        onClick={resumeTimer}
                        disabled={isTimerLoading}
                        className="flex-1 bg-emerald-500/80 hover:bg-emerald-500 text-white py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
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
                            d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                          />
                        </svg>
                        استئناف
                      </button>
                      <button
                        onClick={restartTimer}
                        disabled={isTimerLoading}
                        className="w-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                      >
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
                            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
                          />
                        </svg>
                      </button>
                    </>
                  )}
                  {phase === TIMER_PHASES.BREAK && (
                    <div className="flex-1 text-center py-2 text-yellow-300/80 text-sm font-medium">
                      ☕ استمتع بالاستراحة
                    </div>
                  )}
                </div>

                {/* Pomodoro settings popover (IDLE only) */}
                {showPomodoroSettings && phase === TIMER_PHASES.IDLE && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex flex-col gap-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-xs font-bold">
                        إعدادات البومودورو
                      </span>
                      <button
                        onClick={() => setShowPomodoroSettings(false)}
                        className="text-white/40 hover:text-white/70 transition-colors cursor-pointer"
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="flex gap-3">
                      {/* Focus duration */}
                      <div className="flex-1 flex flex-col gap-1">
                        <label className="text-[10px] text-white/50 font-medium">
                          تركيز (دقيقة)
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              setEditFocus((v) => Math.max(5, v - 5))
                            }
                            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                          >
                            −
                          </button>
                          <span className="flex-1 text-center text-white font-mono text-sm font-bold">
                            {editFocus}
                          </span>
                          <button
                            onClick={() =>
                              setEditFocus((v) => Math.min(360, v + 5))
                            }
                            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Break duration */}
                      <div className="flex-1 flex flex-col gap-1">
                        <label className="text-[10px] text-white/50 font-medium">
                          استراحة (دقيقة)
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              setEditBreak((v) => Math.max(5, v - 5))
                            }
                            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                          >
                            −
                          </button>
                          <span className="flex-1 text-center text-white font-mono text-sm font-bold">
                            {editBreak}
                          </span>
                          <button
                            onClick={() =>
                              setEditBreak((v) => Math.min(360, v + 5))
                            }
                            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Save */}
                    <button
                      disabled={
                        isPomodoroLoading ||
                        (editFocus === room.focusDuration &&
                          editBreak === room.breakDuration)
                      }
                      onClick={async () => {
                        try {
                          await changePomodoro({
                            focusDuration: editFocus,
                            breakDuration: editBreak,
                          });
                          setShowPomodoroSettings(false);
                        } catch {
                          // error logged in store
                        }
                      }}
                      className={`w-full py-1.5 rounded-lg text-xs font-bold text-white transition-colors cursor-pointer disabled:opacity-40 ${themeCfg.accent} ${themeCfg.accentHover}`}
                    >
                      {isPomodoroLoading ? "جاري الحفظ..." : "حفظ"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Non-host sees read-only status */}
            {!isHost && phase === TIMER_PHASES.IDLE && (
              <p className="text-center text-white/40 text-xs">
                في انتظار المضيف لبدء الجلسة
              </p>
            )}
            {!isHost && phase === TIMER_PHASES.FOCUS && (
              <div className="text-center py-2 text-emerald-300/80 text-sm font-medium flex items-center justify-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                وقت التركيز — أعطِها كل ما عندك!
              </div>
            )}
            {!isHost && phase === TIMER_PHASES.BREAK && (
              <div className="text-center py-2 text-yellow-300/80 text-sm font-medium">
                ☕ استمتع بالاستراحة
              </div>
            )}
            {!isHost && phase === TIMER_PHASES.PAUSED && (
              <p className="text-center text-orange-300/60 text-xs">
                الجلسة متوقفة مؤقتاً
              </p>
            )}
          </div>

          {/* ── Goals Panel (placeholder) ── */}
          <div
            className={`${glassClass} flex-1 rounded-3xl flex flex-col overflow-hidden min-h-[200px]`}
          >
            <div
              className={`p-4 ${themeCfg.accentBg} border-b border-white/5 flex justify-between items-center`}
            >
              <span className="font-bold text-white text-sm">أهدافي</span>
              <span className="text-[11px] font-mono text-white/40">0/0</span>
            </div>
            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2.5">
              {/* Placeholder goals */}
              {[
                { text: "مراجعة الفصل الثالث", done: true },
                { text: "حل تمارين الرياضيات", done: false },
                { text: "قراءة ٢٠ صفحة", done: false },
              ].map((goal, i) => (
                <div
                  key={i}
                  className="group flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <button
                    className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer ${
                      goal.done
                        ? "border border-emerald-400 bg-emerald-400/20 text-emerald-400"
                        : "border border-white/30 hover:border-white/60"
                    }`}
                  >
                    {goal.done && (
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    )}
                  </button>
                  <p
                    className={`text-sm ${
                      goal.done
                        ? "text-white/50 line-through decoration-white/30"
                        : "text-white"
                    }`}
                  >
                    {goal.text}
                  </p>
                </div>
              ))}

              {/* Add goal button (placeholder) */}
              <button className="mt-2 flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors px-2 cursor-pointer">
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
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                إضافة هدف
              </button>
            </div>
          </div>

          {/* ── Notifications Panel ── */}
          <div
            className={`${glassClass} h-1/4 min-h-[140px] rounded-3xl flex flex-col overflow-hidden`}
          >
            <div className={`p-3 ${themeCfg.notifHeader} flex items-center`}>
              <span className="font-bold text-white text-sm">الإشعارات</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-2">
              {notifications.length === 0 && (
                <p className="text-white/30 text-xs text-center mt-4">
                  لا توجد إشعارات بعد
                </p>
              )}
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="flex items-center gap-2 text-xs animate-fade-in"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      notif.type === "join" ? "bg-emerald-400" : "bg-red-400"
                    }`}
                  />
                  <span className="text-white/80">
                    <span className="font-bold text-white">
                      {notif.user?.nickName || notif.user?.username || "مستخدم"}
                    </span>{" "}
                    {notif.type === "join" ? "انضم للغرفة" : "غادر الغرفة"}
                  </span>
                  <span className="text-white/30 ms-auto font-mono text-[10px]">
                    {notif.timestamp
                      ? new Date(notif.timestamp).toLocaleTimeString("ar-SA", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </span>
                </div>
              ))}
              <div ref={notifEndRef} />
            </div>
          </div>
        </aside>
      </div>

      {/* ── Modals ── */}
      {isHost && (
        <EditRoomModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          room={room}
        />
      )}

      {/* ═════════════════════════════════════════
         FULLSCREEN FOCUS MODE
         ═════════════════════════════════════════ */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center animate-fade-in">
          {/* Wallpaper background */}
          <div className="absolute inset-0 z-0">
            <img src={wallpaper} alt="" className="w-full h-full object-cover" />
          </div>

          {/* Dark overlay for readability */}
          <div className="absolute inset-0 z-[1] bg-black/50 backdrop-blur-[2px]" />

          {/* Exit button — top-start */}
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 start-6 z-[3] w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer border border-white/10"
            title="الخروج من وضع التركيز"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
            </svg>
          </button>

          {/* Main content */}
          <div className="relative z-[2] flex flex-col items-center gap-8 select-none">

            {/* Room name */}
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                {phaseStyle.ping && (
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${phaseStyle.dot} opacity-75`} />
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${phaseStyle.dot} ${phaseStyle.ring}`} />
              </span>
              <span className="font-bold text-white/80 tracking-wide text-lg">
                {room.name}
              </span>
            </div>

            {/* Phase label */}
            <div className={`px-5 py-1.5 rounded-full backdrop-blur-md border border-white/10 ${phaseStyle.text} text-sm font-bold tracking-wider uppercase`}
              style={{ background: 'rgba(255,255,255,0.07)' }}
            >
              {TIMER_PHASE_LABELS[phase]}
            </div>

            {/* Giant timer */}
            <div className="relative">
              {/* Glow ring behind the timer */}
              <div className={`absolute inset-0 rounded-full blur-3xl opacity-30 scale-150 ${
                phase === TIMER_PHASES.FOCUS
                  ? "bg-emerald-400"
                  : phase === TIMER_PHASES.BREAK
                    ? "bg-yellow-400"
                    : phase === TIMER_PHASES.PAUSED
                      ? "bg-orange-400"
                      : "bg-white/20"
              }`} />

              <div className={`relative text-[10rem] font-mono font-bold text-white tracking-[0.15em] tabular-nums leading-none ${
                phase === TIMER_PHASES.FOCUS
                  ? "drop-shadow-[0_0_40px_rgba(16,185,129,.35)]"
                  : phase === TIMER_PHASES.BREAK
                    ? "drop-shadow-[0_0_40px_rgba(245,158,11,.35)]"
                    : phase === TIMER_PHASES.PAUSED
                      ? "drop-shadow-[0_0_40px_rgba(251,146,60,.35)]"
                      : "drop-shadow-[0_0_20px_rgba(255,255,255,.15)]"
              }`}>
                {formatTime(timeLeft)}
              </div>
            </div>

            {/* Pomodoro config */}
            <p className="text-sm text-white/30 font-mono tracking-wider">
              {room.focusDuration}د تركيز / {room.breakDuration}د استراحة
            </p>

            {/* Ambient sound badge */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <span className="text-base">
                {room.ambientSound === "RAIN"
                  ? "🌧️"
                  : room.ambientSound === "LOFIC_MUSIC"
                    ? "🎵"
                    : room.ambientSound === "SEA"
                      ? "🌊"
                      : "🔇"}
              </span>
              <span className="text-xs text-white/50 font-medium">
                {currentTrack?.label || ambientLabel}
              </span>
            </div>

            {/* Keyboard hint */}
            <p className="text-[11px] text-white/20 font-mono mt-4">
              ESC للخروج من وضع التركيز
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoomPage;
