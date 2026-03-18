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
import {
  ChatPanel,
  EditRoomModal,
  ProfilePopover,
  GoalsPanel,
  ResizableVideoWrapper,
  VideoGrid,
} from "@/components/ui";
import { LiveKitRoom } from "@livekit/components-react";
import useAmbientSound from "@/hooks/useAmbientSound";
import useLiveKit from "@/hooks/useLiveKit";
import useRoomChat from "@/hooks/useRoomChat";
import useIsMobile from "@/hooks/useIsMobile";

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
  PINKY: {
    fallbackBg:
      "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80",
    overlay: "bg-gradient-to-b from-pink-950/40 via-pink-900/15 to-pink-950/40",
    glass: "room-glass-pinky",
    accent: "bg-pink-500",
    accentHover: "hover:bg-pink-600",
    accentShadow: "shadow-pink-500/20",
    accentText: "text-pink-300",
    accentBorder: "border-pink-400",
    accentBg: "bg-pink-500/20",
    notifHeader: "bg-pink-600/80",
  },
  GITHUB: {
    fallbackBg:
      "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=1920&q=80",
    overlay: "bg-gradient-to-b from-gray-900/40 via-transparent to-gray-900/40",
    glass: "room-glass-github",
    accent: "bg-gray-800",
    accentHover: "hover:bg-gray-900",
    accentShadow: "shadow-gray-800/20",
    accentText: "text-gray-300",
    accentBorder: "border-gray-600",
    accentBg: "bg-gray-800/20",
    notifHeader: "bg-gray-800/80",
  },
  DARK: {
    fallbackBg:
      "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1920&q=80",
    overlay: "bg-gradient-to-b from-black/50 via-transparent to-black/50",
    glass: "room-glass-dark",
    accent: "bg-neutral-700",
    accentHover: "hover:bg-neutral-800",
    accentShadow: "shadow-neutral-900/30",
    accentText: "text-neutral-300",
    accentBorder: "border-neutral-600",
    accentBg: "bg-neutral-700/20",
    notifHeader: "bg-neutral-800/80",
  },
  GRAY: {
    fallbackBg:
      "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=1920&q=80",
    overlay: "bg-gradient-to-b from-gray-500/20 via-transparent to-gray-500/20",
    glass: "room-glass-gray",
    accent: "bg-gray-500",
    accentHover: "hover:bg-gray-600",
    accentShadow: "shadow-gray-500/20",
    accentText: "text-gray-400",
    accentBorder: "border-gray-400",
    accentBg: "bg-gray-500/20",
    notifHeader: "bg-gray-500/80",
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
function RoomPageInner() {
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
    roomGoals,
    isGoalsLoading,
    createGoal,
    toggleGoal,
    updateGoalTitle,
    deleteGoal,
    livekitToken,
  } = useRoomStore();

  // ── LiveKit video ──
  const {
    isCameraOn,
    isScreenOn,
    participantMediaMap,
    hasActiveTracks,
    trackCount,
    toggleCamera,
    toggleScreenShare,
  } = useLiveKit();

  // ── Room chat (Socket.IO) ──
  const {
    messages: chatMessages,
    sendMessage,
    isChatConnected,
    typingUsers,
    emitTyping,
  } = useRoomChat(room?.roomId, user?.avatar);

  const isMobile = useIsMobile();
  const [showVideoGrid, setShowVideoGrid] = useState(false);
  const [showPublishMenu, setShowPublishMenu] = useState(false);
  const [videoLayoutMode, setVideoLayoutMode] = useState("gallery");
  const [videoPinnedIndex, setVideoPinnedIndex] = useState(null);
  const publishMenuRef = useRef(null);

  // ── Mobile-only state ──
  const [activeMobileTab, setActiveMobileTab] = useState("timer");
  const [showMobileSoundPicker, setShowMobileSoundPicker] = useState(false);
  const [showMobileVideoOverlay, setShowMobileVideoOverlay] = useState(false);
  const mobileSoundRef = useRef(null);

  // Close mobile sound picker on outside click
  useEffect(() => {
    if (!showMobileSoundPicker) return;
    const handleClick = (e) => {
      if (mobileSoundRef.current && !mobileSoundRef.current.contains(e.target)) {
        setShowMobileSoundPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMobileSoundPicker]);
  const isPublishing = isCameraOn || isScreenOn;

  const prevTrackCount = useRef(trackCount);
  useEffect(() => {
    if (trackCount > 0 && prevTrackCount.current === 0) {
      setShowVideoGrid(true);
    } else if (trackCount === 0 && prevTrackCount.current > 0) {
      setShowVideoGrid(false);
    }
    prevTrackCount.current = trackCount;
  }, [trackCount]);

  // ── Compact video layout (for 3+ streams opt-in) ──
  const [compactVideoLayout, setCompactVideoLayout] = useState(false);
  const [showFsGoals, setShowFsGoals] = useState(true);
  const [isNotifsCollapsed, setIsNotifsCollapsed] = useState(false);

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
  const chatPanelRef = useRef(null);
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
      if (
        soundPickerRef.current &&
        !soundPickerRef.current.contains(e.target)
      ) {
        setShowSoundPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showSoundPicker]);

  // ── Close publish menu on outside click ──
  useEffect(() => {
    if (!showPublishMenu) return;
    const handleClick = (e) => {
      if (
        publishMenuRef.current &&
        !publishMenuRef.current.contains(e.target)
      ) {
        setShowPublishMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showPublishMenu]);

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

  // Auto-scroll is now handled inside ChatPanel

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

      {/* ══════════════════════════════════════════
         MOBILE LAYOUT
         ══════════════════════════════════════════ */}
      {isMobile && (
        <>
          <div className="room-mobile-content">
            {/* ── Mobile Top Bar ── */}
            {!showMobileVideoOverlay && (
              <div className="room-mobile-topbar">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleLeave}
                    disabled={isLeaving}
                    className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-red-400 transition-colors cursor-pointer border border-white/10"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? "bg-emerald-400" : "bg-red-400"}`} />
                    </span>
                    <span className="font-bold text-white text-sm truncate max-w-[140px]">{room.name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Video button */}
                  <button
                    onClick={() => setShowMobileVideoOverlay(true)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer border border-white/10 ${hasActiveTracks
                      ? `${themeCfg.accent} text-white`
                      : "bg-white/10 text-white/60"
                      }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                    </svg>
                    {hasActiveTracks && (
                      <span className="absolute -top-0.5 -end-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black/50" />
                    )}
                  </button>

                  {/* Fullscreen button */}
                  <button
                    onClick={() => setIsFullscreen(true)}
                    className="w-9 h-9 rounded-full bg-white/10 text-white/60 flex items-center justify-center cursor-pointer transition-all border border-white/10"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                    </svg>
                  </button>

                  {/* Invite button */}
                  <div className="relative">
                    <button
                      onClick={handleCopyInvite}
                      className={`w-9 h-9 rounded-full ${themeCfg.accent} text-white flex items-center justify-center cursor-pointer shadow-lg ${themeCfg.accentShadow} transition-all`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                      </svg>
                    </button>
                    {showInviteToast && (
                      <span className="fixed top-20 start-1/2 -translate-x-1/2 mt-1 px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold whitespace-nowrap animate-fade-in shadow-xl shadow-emerald-500/20" style={{ zIndex: 9999 }}>
                        تم نسخ الرابط!
                      </span>
                    )}
                  </div>

                  {/* Edit Room (Host only) */}
                  {isHost && (
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="w-9 h-9 rounded-full bg-white/10 text-white/70 flex items-center justify-center cursor-pointer border border-white/10"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── Tab Content ── */}
            <div className="room-mobile-tab-panel" key={activeMobileTab}>
              {/* TIMER TAB */}
              {activeMobileTab === "timer" && (
                <div className="flex flex-col items-center justify-center h-full px-4">
                  {/* Phase badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="relative flex h-3 w-3">
                      {phaseStyle.ping && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${phaseStyle.dot} opacity-75`} />}
                      <span className={`relative inline-flex rounded-full h-3 w-3 ${phaseStyle.dot}`} />
                    </span>
                    <span className={`text-sm font-bold ${phaseStyle.text}`}>
                      {TIMER_PHASE_LABELS[phase] || "خامل"}
                    </span>
                  </div>

                  {/* Big timer */}
                  <div
                    className={`font-mono font-bold text-white tabular-nums tracking-[0.1em] leading-none text-[5rem] ${phase === TIMER_PHASES.FOCUS
                      ? "drop-shadow-[0_0_20px_rgba(16,185,129,.35)]"
                      : phase === TIMER_PHASES.BREAK
                        ? "drop-shadow-[0_0_20px_rgba(245,158,11,.35)]"
                        : ""
                      }`}
                  >
                    {formatTime(timeLeft)}
                  </div>

                  {/* Pomodoro config */}
                  <span className="text-[11px] text-white/35 font-mono mt-2">
                    {room.focusDuration}د تركيز / {room.breakDuration}د استراحة
                  </span>

                  {/* Host controls */}
                  <div className="flex items-center gap-4 mt-6">
                    {isHost && (phase === TIMER_PHASES.IDLE || phase === TIMER_PHASES.PAUSED) && (
                      <button
                        onClick={phase === TIMER_PHASES.IDLE ? startTimer : resumeTimer}
                        disabled={isTimerLoading}
                        className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 border border-emerald-500/30"
                      >
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                        </svg>
                      </button>
                    )}
                    {isHost && phase === TIMER_PHASES.FOCUS && (
                      <button
                        onClick={pauseTimer}
                        disabled={isTimerLoading}
                        className="w-14 h-14 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 border border-orange-500/30"
                      >
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                        </svg>
                      </button>
                    )}
                    {isHost && phase === TIMER_PHASES.PAUSED && (
                      <button
                        onClick={restartTimer}
                        disabled={isTimerLoading}
                        className="w-12 h-12 rounded-full bg-white/10 text-white/60 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 border border-white/10"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                        </svg>
                      </button>
                    )}
                    {phase === TIMER_PHASES.BREAK && (
                      <span className="text-yellow-300/80 text-3xl">☕</span>
                    )}
                    {!isHost && phase === TIMER_PHASES.IDLE && (
                      <p className="text-white/30 text-sm">في انتظار المضيف</p>
                    )}
                  </div>

                  {/* Pomodoro settings (host, idle) */}
                  {isHost && phase === TIMER_PHASES.IDLE && (
                    <div className="mt-6 w-full max-w-xs">
                      <button
                        onClick={() => {
                          setEditFocus(room.focusDuration);
                          setEditBreak(room.breakDuration);
                          setShowPomodoroSettings(!showPomodoroSettings);
                        }}
                        className="text-white/40 text-xs flex items-center gap-1.5 mx-auto cursor-pointer hover:text-white/60 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        إعدادات البومودورو
                      </button>
                      {showPomodoroSettings && (
                        <div className={`${glassClass} rounded-2xl p-4 mt-3 animate-fade-in`}>
                          <div className="flex gap-3">
                            <div className="flex-1 flex flex-col gap-1">
                              <label className="text-[10px] text-white/50 font-medium">تركيز (دقيقة)</label>
                              <div className="flex items-center gap-1">
                                <button onClick={() => setEditFocus((v) => Math.max(5, v - 5))} className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center text-sm font-bold cursor-pointer">−</button>
                                <span className="flex-1 text-center text-white font-mono text-sm font-bold">{editFocus}</span>
                                <button onClick={() => setEditFocus((v) => Math.min(360, v + 5))} className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center text-sm font-bold cursor-pointer">+</button>
                              </div>
                            </div>
                            <div className="flex-1 flex flex-col gap-1">
                              <label className="text-[10px] text-white/50 font-medium">استراحة (دقيقة)</label>
                              <div className="flex items-center gap-1">
                                <button onClick={() => setEditBreak((v) => Math.max(5, v - 5))} className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center text-sm font-bold cursor-pointer">−</button>
                                <span className="flex-1 text-center text-white font-mono text-sm font-bold">{editBreak}</span>
                                <button onClick={() => setEditBreak((v) => Math.min(360, v + 5))} className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center text-sm font-bold cursor-pointer">+</button>
                              </div>
                            </div>
                          </div>
                          <button
                            disabled={isPomodoroLoading || (editFocus === room.focusDuration && editBreak === room.breakDuration)}
                            onClick={async () => {
                              try {
                                await changePomodoro({ focusDuration: editFocus, breakDuration: editBreak });
                                setShowPomodoroSettings(false);
                              } catch { }
                            }}
                            className={`w-full py-2 rounded-lg text-xs font-bold text-white mt-3 cursor-pointer disabled:opacity-40 ${themeCfg.accent} ${themeCfg.accentHover}`}
                          >
                            {isPomodoroLoading ? "جاري الحفظ..." : "حفظ"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Participant count pill */}
                  <div className="mt-8 flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                    <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                    <span className="text-xs text-white/50 font-medium">{participants.length}/{room.maxCapacity}</span>
                  </div>
                </div>
              )}

              {/* CHAT TAB */}
              {activeMobileTab === "chat" && (
                <div className="flex flex-col h-full px-3 pt-2 pb-2">
                  <ChatPanel
                    glassClass={glassClass}
                    themeCfg={themeCfg}
                    notifications={notifications}
                    chatMessages={chatMessages}
                    onSendMessage={sendMessage}
                    isChatConnected={isChatConnected}
                    isCollapsed={false}
                    onToggleCollapse={() => { }}
                    currentUserId={user?.id}
                    typingUsers={typingUsers}
                    onTyping={emitTyping}
                    isMobileFullHeight
                  />
                </div>
              )}

              {/* GOALS TAB */}
              {activeMobileTab === "goals" && (
                <div className="flex flex-col h-full px-3 pt-2 pb-2">
                  <GoalsPanel
                    glassClass={glassClass}
                    themeCfg={themeCfg}
                    userId={user?.id}
                    participants={participants}
                    roomGoals={roomGoals}
                    isGoalsLoading={isGoalsLoading}
                    createGoal={createGoal}
                    toggleGoal={toggleGoal}
                    updateGoalTitle={updateGoalTitle}
                    deleteGoal={deleteGoal}
                    isMobileFullHeight
                  />
                </div>
              )}

              {/* PARTICIPANTS TAB */}
              {activeMobileTab === "participants" && (
                <div className="room-mobile-participants-grid">
                  {participants.map((p) => {
                    const isMe = p.id === user?.id;
                    const pInfo = Object.values(participantMediaMap).find((info) => {
                      const candidates = [p.id, String(p.id), p.username, p.nickName, p.email].filter(Boolean);
                      return candidates.includes(info.identity) || candidates.includes(info.name);
                    });
                    const hasCam = !!pInfo?.hasCam;
                    const hasScreen = !!pInfo?.hasScreen;
                    return (
                      <div
                        key={p.id}
                        className="room-mobile-participant-card"
                        onClick={(e) => {
                          const data = isMe ? { ...p, ...user } : p;
                          setSelectedParticipant(selectedParticipant?.id === p.id ? null : data);
                          selectedAvatarRef.current = e.currentTarget;
                        }}
                      >
                        <div className="relative">
                          {p.avatar ? (
                            <img
                              src={p.avatar}
                              alt={p.nickName}
                              className={`w-14 h-14 rounded-full object-cover border-2 ${isMe ? themeCfg.accentBorder : "border-transparent"}`}
                            />
                          ) : (
                            <div
                              className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold border-2 ${isMe ? `${themeCfg.accentBorder} ${themeCfg.accent} text-white` : "border-transparent bg-white/20 text-white"}`}
                            >
                              {(p.nickName || p.username || "؟").charAt(0)}
                            </div>
                          )}
                          {p.id === room.hostId && (
                            <span className="absolute -top-1 start-1/2 -translate-x-1/2 text-yellow-400 text-xs drop-shadow-[0_0_4px_rgba(250,204,21,.6)]">👑</span>
                          )}
                          {(hasCam || hasScreen) && (
                            <div className="absolute -bottom-1 -end-1 flex gap-0.5">
                              {hasCam && <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center lk-indicator"><svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg></span>}
                              {hasScreen && <span className="w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center lk-indicator-screen"><svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12" /></svg></span>}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-white/80 font-medium truncate max-w-full">{p.nickName || p.username}</span>
                        {isMe && <span className="text-[10px] text-white/30">أنت</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Mobile Sound FAB ── */}
          {room.ambientSound && room.ambientSound !== "NONE" && activeMobileTab !== "chat" && activeMobileTab !== "goals" && !showMobileVideoOverlay && (
            <div ref={mobileSoundRef}>
              <button
                onClick={() => setShowMobileSoundPicker((v) => !v)}
                className="room-mobile-sound-fab"
              >
                {room.ambientSound === "RAIN" ? "🌧️" : room.ambientSound === "LOFIC_MUSIC" ? "🎵" : room.ambientSound === "SEA" ? "🌊" : "🔇"}
              </button>

              {/* Sound picker sheet */}
              {showMobileSoundPicker && (
                <div className="room-mobile-sound-sheet">
                  <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                    <span className="text-xs font-bold text-white/70">
                      {room.ambientSound === "RAIN" ? "🌧️ أنواع صوت المطر" : room.ambientSound === "SEA" ? "🌊 أنواع صوت البحر" : "🎵 محطات لوفي"}
                    </span>
                    {isLoadingLofi && <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-transparent rounded-full animate-spin" />}
                  </div>
                  <div className="max-h-[40vh] overflow-y-auto custom-scrollbar py-1">
                    {availableTracks.map((track) => {
                      const isActive = currentTrack?.id === track.id;
                      return (
                        <button
                          key={track.id}
                          onClick={() => { changeTrack(track.id); setShowMobileSoundPicker(false); }}
                          className={`w-full text-start px-4 py-2.5 text-xs transition-colors cursor-pointer flex items-center gap-2.5 ${isActive ? "bg-white/15 text-white font-bold" : "text-white/70 hover:bg-white/10"}`}
                        >
                          {isActive ? (
                            <span className="relative flex h-2 w-2 flex-shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                            </span>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-white/20 flex-shrink-0" />
                          )}
                          <span className="truncate">{track.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {/* Volume control */}
                  <div className="px-4 py-3 border-t border-white/10 flex items-center gap-3">
                    <button onClick={() => setIsMuted(!isMuted)} className="text-white/60 cursor-pointer">
                      {isMuted || volume === 0 ? (
                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>
                      ) : (
                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>
                      )}
                    </button>
                    <input
                      type="range" min="0" max="100"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => { setVolume(Number(e.target.value)); if (isMuted) setIsMuted(false); }}
                      className="flex-1 h-1 accent-brand-500 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                      dir="ltr"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Mobile Video Overlay ── */}
          {showMobileVideoOverlay && (
            <div className="fixed inset-0 z-50 bg-black/95 flex flex-col animate-fade-in pb-[calc(16px+env(safe-area-inset-bottom,0px))]">
              {/* Header with Timer, Controls, and Close */}
              <div className="flex items-center justify-between px-3 mt-[calc(12px+env(safe-area-inset-top,0px))] mb-3 flex-shrink-0 gap-2">
                {/* Left side: Compact Timer */}
                <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 border border-white/10 shadow-lg">
                  <span className="relative flex h-2 w-2 flex-shrink-0">
                    {phaseStyle.ping && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${phaseStyle.dot} opacity-75`} />}
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${phaseStyle.dot}`} />
                  </span>
                  <span className="font-mono text-white text-sm font-bold tabular-nums tracking-widest leading-none relative top-[1px]">
                    {formatTime(timeLeft)}
                  </span>
                </div>

                {/* Right side: Video toggles & Close */}
                <div className="flex items-center gap-2 ms-auto">
                  <button
                    onClick={async () => { await toggleCamera(); }}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${isCameraOn ? "bg-emerald-500 text-white" : "bg-white/15 text-white/60 hover:bg-white/25"}`}
                  >
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </button>
                  <button
                    onClick={async () => { await toggleScreenShare(); }}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${isScreenOn ? "bg-violet-500 text-white" : "bg-white/15 text-white/60 hover:bg-white/25"}`}
                  >
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12" />
                    </svg>
                  </button>
                  <div className="w-[1px] h-5 bg-white/20 mx-0.5" />
                  <button
                    onClick={() => setShowMobileVideoOverlay(false)}
                    className="w-9 h-9 rounded-full bg-red-500/80 border border-white/10 text-white flex items-center justify-center cursor-pointer hover:bg-red-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Video Grid */}
              <div className="flex-1 min-h-0 w-full px-2" style={{ position: "relative", overflow: "hidden" }}>
                <VideoGrid
                  layoutMode={videoLayoutMode}
                  pinnedIndex={videoPinnedIndex}
                  onPinnedIndexChange={setVideoPinnedIndex}
                  gap={6}
                  maxCapacity={room.maxCapacity || 6}
                  participants={participants}
                  localIdentity={user?.id}
                  onPublishCamera={toggleCamera}
                  onPublishScreen={toggleScreenShare}
                  isCameraOn={isCameraOn}
                  isScreenOn={isScreenOn}
                  wrapperStyle={{ position: "relative", width: "100%", height: "91%", overflow: "hidden" }}
                />
              </div>
            </div>
          )}

          {/* ── Bottom Navigation ── */}
          <nav className="room-mobile-nav">
            <button
              className={`room-mobile-nav-btn ${activeMobileTab === "timer" ? "active" : ""}`}
              onClick={() => setActiveMobileTab("timer")}
            >
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>المؤقت</span>
            </button>
            <button
              className={`room-mobile-nav-btn ${activeMobileTab === "chat" ? "active" : ""}`}
              onClick={() => setActiveMobileTab("chat")}
            >
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
              <span>المحادثة</span>
            </button>
            <button
              className={`room-mobile-nav-btn ${activeMobileTab === "goals" ? "active" : ""}`}
              onClick={() => setActiveMobileTab("goals")}
            >
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>الأهداف</span>
            </button>
            <button
              className={`room-mobile-nav-btn ${activeMobileTab === "participants" ? "active" : ""}`}
              onClick={() => setActiveMobileTab("participants")}
            >
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              <span>المشاركون</span>
            </button>
          </nav>

          {/* Mobile profile popover */}
          {selectedParticipant && (
            <div className="fixed inset-0 z-[70] flex items-end justify-center" onClick={() => { setSelectedParticipant(null); selectedAvatarRef.current = null; }}>
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
              <div className="relative mb-[calc(64px+env(safe-area-inset-bottom,0px)+8px)] mx-3 w-full max-w-sm animate-fade-in" onClick={(e) => e.stopPropagation()}>
                <ProfilePopover
                  participant={selectedParticipant}
                  onClose={() => { setSelectedParticipant(null); selectedAvatarRef.current = null; }}
                  glassClass={glassClass}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════
         DESKTOP LAYOUT
         ══════════════════════════════════════════ */}
      {!isMobile && (
        <div className="relative z-10 flex h-full p-3 gap-3">
          {/* ════════════════════════════════════════
           LEFT — Participants sidebar
           (RTL: appears on RIGHT side)
           Hidden when video grid is active for max space
           ════════════════════════════════════════ */}
          <aside
            className={`w-[88px] flex-shrink-0 flex flex-col items-center justify-center py-4 relative transition-all duration-300`}
          >
            <div
              className={`${glassClass} rounded-3xl py-3 flex flex-col items-center gap-3 overflow-y-auto overflow-x-hidden custom-scrollbar max-h-[70vh] min-h-[120px] w-[82px]`}
            >
              {participants.map((p) => {
                const isMe = p.id === user?.id;
                const isSelected = selectedParticipant?.id === p.id;
                // Find LiveKit tracks for this participant
                // Match by identity OR name against all known participant fields
                const pInfo = Object.values(participantMediaMap).find((info) => {
                  const candidates = [
                    p.id,
                    String(p.id),
                    p.username,
                    p.nickName,
                    p.email,
                  ].filter(Boolean);
                  return (
                    candidates.includes(info.identity) ||
                    candidates.includes(info.name)
                  );
                });
                const hasCam = !!pInfo?.hasCam;
                const hasScreen = !!pInfo?.hasScreen;
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
                        className={`w-13 h-13 rounded-full object-cover border-2 transition-colors flex-shrink-0 ${isMe
                          ? `${themeCfg.accentBorder}`
                          : isSelected
                            ? "border-white/70"
                            : "border-transparent hover:border-white/50"
                          }`}
                      />
                    ) : (
                      <div
                        className={`w-13 h-13 rounded-full flex items-center justify-center text-base font-bold border-2 transition-colors flex-shrink-0 ${isMe
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

                    {/* ── LiveKit indicators ── */}
                    {(hasCam || hasScreen) && !isMe && (
                      <div className="absolute -bottom-1 -end-1 z-20 flex gap-0.5">
                        {hasCam && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowVideoGrid(true);
                            }}
                            className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center lk-indicator"
                            title="الكاميرا مفعّلة"
                          >
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2.5}
                            >
                              <path
                                strokeLinecap="round"
                                d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
                              />
                            </svg>
                          </button>
                        )}
                        {hasScreen && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowVideoGrid(true);
                            }}
                            className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center lk-indicator-screen"
                            title="مشاركة الشاشة"
                          >
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                    {/* Self indicators (no unsubscribe) */}
                    {(hasCam || hasScreen) && isMe && (
                      <div className="absolute -bottom-1 -end-1 z-20 flex gap-0.5">
                        {hasCam && (
                          <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center lk-indicator">
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2.5}
                            >
                              <path
                                strokeLinecap="round"
                                d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
                              />
                            </svg>
                          </span>
                        )}
                        {hasScreen && (
                          <span className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center lk-indicator-screen">
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12"
                              />
                            </svg>
                          </span>
                        )}
                      </div>
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
            {/* ── LiveKit Video Grid + Floating Timer ── */}
            {showVideoGrid && (
              <div className="absolute inset-x-0 top-14 bottom-24 px-4 sm:px-6 z-20 animate-fade-in flex items-center justify-center">
                <ResizableVideoWrapper>
                  <VideoGrid
                    layoutMode={videoLayoutMode}
                    pinnedIndex={videoPinnedIndex}
                    onPinnedIndexChange={setVideoPinnedIndex}
                    gap={8}
                    maxCapacity={room.maxCapacity || 6}
                    participants={participants}
                    localIdentity={user?.id}
                    onPublishCamera={toggleCamera}
                    onPublishScreen={toggleScreenShare}
                    isCameraOn={isCameraOn}
                    isScreenOn={isScreenOn}
                  />
                </ResizableVideoWrapper>
              </div>
            )}

            {/* ── Top bar: Room name + Invite + Leave + Timer ── */}
            <header className="flex justify-center items-start pt-1 gap-3">
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
            <div className="relative z-30 flex justify-center pb-1">
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
                    className={`flex items-center gap-3 pe-4 border-e border-white/10 transition-colors ${room.ambientSound && room.ambientSound !== "NONE"
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
                        className={`w-3.5 h-3.5 text-white/40 transition-transform ms-1 ${showSoundPicker ? "rotate-180" : ""
                          }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 15.75l7.5-7.5 7.5 7.5"
                        />
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
                        {availableTracks.length === 0 &&
                          !isLoadingLofi &&
                          room.ambientSound === "LOFIC_MUSIC" && (
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
                              className={`w-full text-start px-3 py-2 text-xs transition-colors cursor-pointer flex items-center gap-2.5 ${isActive
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

                {/* Divider + Publish / Grid / Fullscreen buttons */}
                <div className="ps-4 border-s border-white/10 flex items-center gap-2">
                  {/* Combined publish (camera / screen) button with dropdown */}
                  <div className="relative h-9" ref={publishMenuRef}>
                    <button
                      onClick={() => setShowPublishMenu((v) => !v)}
                      title="بث فيديو"
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${isPublishing
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600"
                        : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
                        }`}
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
                          d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
                        />
                      </svg>
                    </button>

                    {/* Dropdown menu — anchored to button top */}
                    {showPublishMenu && (
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-44 bg-black/80 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden animate-fade-in z-50">
                        <button
                          onClick={async () => {
                            setShowPublishMenu(false);
                            await toggleCamera();
                            if (!isCameraOn) setShowVideoGrid(true);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs transition-colors cursor-pointer ${isCameraOn
                            ? "bg-emerald-500/20 text-emerald-400 font-bold"
                            : "text-white/70 hover:bg-white/10 hover:text-white"
                            }`}
                        >
                          <svg
                            className="w-4 h-4 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
                            />
                          </svg>
                          {isCameraOn ? "إيقاف الكاميرا" : "تشغيل الكاميرا"}
                          {isCameraOn && (
                            <span className="ms-auto relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                            </span>
                          )}
                        </button>
                        <div className="h-px bg-white/10" />
                        <button
                          onClick={async () => {
                            setShowPublishMenu(false);
                            await toggleScreenShare();
                            if (!isScreenOn) setShowVideoGrid(true);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs transition-colors cursor-pointer ${isScreenOn
                            ? "bg-violet-500/20 text-violet-400 font-bold"
                            : "text-white/70 hover:bg-white/10 hover:text-white"
                            }`}
                        >
                          <svg
                            className="w-4 h-4 flex-shrink-0"
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
                          {isScreenOn ? "إيقاف المشاركة" : "مشاركة الشاشة"}
                          {isScreenOn && (
                            <span className="ms-auto relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-400" />
                            </span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Video grid toggle */}

                  <button
                    onClick={() => setShowVideoGrid((v) => !v)}
                    title={showVideoGrid ? "إخفاء بث الفيديو" : "عرض بث الفيديو"}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${showVideoGrid
                      ? `${themeCfg.accent} text-white shadow-lg ${themeCfg.accentShadow}`
                      : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
                      }`}
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
                        d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                      />
                    </svg>
                  </button>
                  {/* Fullscreen focus toggle */}
                  <button
                    onClick={() => {
                      if (isMobile) setShowVideoGrid(true);
                      setIsFullscreen(true);
                    }}
                    title="وضع التركيز"
                    className="w-9 h-9 rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white flex items-center justify-center cursor-pointer transition-all hover:scale-110"
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
           Collapses to timer-only when video grid is active
           ════════════════════════════════════════ */}
          <aside
            className="flex-shrink-0 flex flex-col gap-3 h-full transition-all duration-300 w-80"
          >
            {/* ── Timer Panel ── */}
            <div className={`${glassClass} p-5 rounded-3xl flex flex-col gap-4`}>
              {/* Header */}
              <div className="flex justify-between items-center text-white/90">
                <span className="font-bold text-sm">مؤقت الجلسة</span>
                {/* Pomodoro config label */}
                <span className="text-[11px] text-white/40 font-mono">
                  {room.focusDuration}د تركيز / {room.breakDuration}د استراحة
                </span>
              </div>

              {/* Countdown + Controls */}
              <div className="flex items-center justify-center gap-4 py-2">
                {/* Play / Pause / Resume button (host only) */}
                {isHost &&
                  (phase === TIMER_PHASES.IDLE ||
                    phase === TIMER_PHASES.PAUSED) && (
                    <button
                      onClick={
                        phase === TIMER_PHASES.IDLE ? startTimer : resumeTimer
                      }
                      disabled={isTimerLoading}
                      className="flex items-center justify-center text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer disabled:opacity-50"
                      title={
                        phase === TIMER_PHASES.IDLE ? "ابدأ الجلسة" : "استئناف"
                      }
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
                          d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                        />
                      </svg>
                    </button>
                  )}
                {isHost && phase === TIMER_PHASES.FOCUS && (
                  <button
                    onClick={pauseTimer}
                    disabled={isTimerLoading}
                    className="flex items-center justify-center text-orange-400 hover:text-orange-300 transition-all cursor-pointer disabled:opacity-50"
                    title="إيقاف مؤقت"
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
                        d="M15.75 5.25v13.5m-7.5-13.5v13.5"
                      />
                    </svg>
                  </button>
                )}

                {/* Timer display */}
                <div
                  className={`text-5xl font-mono font-bold text-white tracking-widest tabular-nums ${phase === TIMER_PHASES.FOCUS
                    ? "drop-shadow-[0_0_16px_rgba(16,185,129,.3)]"
                    : phase === TIMER_PHASES.BREAK
                      ? "drop-shadow-[0_0_16px_rgba(245,158,11,.3)]"
                      : ""
                    }`}
                >
                  {formatTime(timeLeft)}
                </div>

                {/* Restart button (host, paused only) */}
                {isHost && phase === TIMER_PHASES.PAUSED && (
                  <button
                    onClick={restartTimer}
                    disabled={isTimerLoading}
                    className="flex items-center justify-center text-white/60 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                    title="إعادة البدء"
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
                        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
                      />
                    </svg>
                  </button>
                )}

                {/* Settings button (host, idle only) */}
                {isHost && phase === TIMER_PHASES.IDLE && (
                  <button
                    onClick={() => {
                      setEditFocus(room.focusDuration);
                      setEditBreak(room.breakDuration);
                      setShowPomodoroSettings(!showPomodoroSettings);
                    }}
                    className={`flex items-center justify-center transition-all cursor-pointer ${showPomodoroSettings
                      ? "text-white"
                      : "text-white/60 hover:text-white"
                      }`}
                    title="إعدادات البومودورو"
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
                        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </button>
                )}

                {/* Break indicator (no button needed) */}
                {phase === TIMER_PHASES.BREAK && (
                  <span className="text-yellow-300/80 text-lg">☕</span>
                )}
              </div>

              {/* Host controls — Pomodoro settings (IDLE only) */}
              {isHost && showPomodoroSettings && phase === TIMER_PHASES.IDLE && (
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
                          onClick={() => setEditFocus((v) => Math.max(5, v - 5))}
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
                          onClick={() => setEditBreak((v) => Math.max(5, v - 5))}
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

              {/* Non-host — no verbose messages, just quiet state */}
              {!isHost && phase === TIMER_PHASES.IDLE && (
                <p className="text-center text-white/30 text-xs">
                  في انتظار المضيف
                </p>
              )}
            </div>

            {/* ── Goals Panel ── */}
            <GoalsPanel
              glassClass={glassClass}
              themeCfg={themeCfg}
              userId={user?.id}
              participants={participants}
              roomGoals={roomGoals}
              isGoalsLoading={isGoalsLoading}
              createGoal={createGoal}
              toggleGoal={toggleGoal}
              updateGoalTitle={updateGoalTitle}
              deleteGoal={deleteGoal}
            />

            {/* ── Chat + Notifications Panel ── */}
            <ChatPanel
              glassClass={glassClass}
              themeCfg={themeCfg}
              notifications={notifications}
              chatMessages={chatMessages}
              onSendMessage={sendMessage}
              isChatConnected={isChatConnected}
              isCollapsed={isNotifsCollapsed}
              onToggleCollapse={() => setIsNotifsCollapsed(!isNotifsCollapsed)}
              currentUserId={user?.id}
              typingUsers={typingUsers}
              onTyping={emitTyping}
            />
          </aside>
        </div>
      )}

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
      {isFullscreen &&
        (() => {
          const fsGridActive = showVideoGrid;
          // Compact mode: always for 1-2 streams, opt-in for 3+ (Desktop only)
          const useCompactGrid =
            !isMobile && fsGridActive &&
            (trackCount <= 2 || (trackCount >= 3 && compactVideoLayout));
          const useFullGrid = fsGridActive && !useCompactGrid;

          return (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center animate-fade-in">
              {/* Wallpaper background */}
              <div className="absolute inset-0 z-0">
                <img
                  src={wallpaper}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Dark overlay for readability */}
              <div className="absolute inset-0 z-[1] bg-black/50 backdrop-blur-[2px]" />

              {/* Top-start buttons — exit + video grid toggle + publish + compact toggle */}
              <div className="absolute top-6 start-6 z-[3] flex items-center gap-2">
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer border border-white/10"
                  title="الخروج من وضع التركيز"
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
                      d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
                    />
                  </svg>
                </button>

                {/* Video grid toggle */}

                <button
                  onClick={() => setShowVideoGrid((v) => !v)}
                  className={`w-11 h-11 rounded-full backdrop-blur-md flex items-center justify-center transition-all cursor-pointer border border-white/10 ${showVideoGrid
                    ? `${themeCfg.accent} text-white`
                    : "bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
                    }`}
                  title={showVideoGrid ? "إخفاء بث الفيديو" : "عرض بث الفيديو"}
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
                      d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                    />
                  </svg>
                </button>
                {/* Camera toggle */}
                <button
                  onClick={async () => {
                    await toggleCamera();
                    if (!isCameraOn) setShowVideoGrid(true);
                  }}
                  className={`w-11 h-11 rounded-full backdrop-blur-md flex items-center justify-center transition-all cursor-pointer border border-white/10 ${isCameraOn
                    ? "bg-emerald-500 text-white"
                    : "bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
                    }`}
                  title={isCameraOn ? "إيقاف الكاميرا" : "تشغيل الكاميرا"}
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
                      d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                </button>

                {/* Screen share toggle */}
                <button
                  onClick={async () => {
                    await toggleScreenShare();
                    if (!isScreenOn) setShowVideoGrid(true);
                  }}
                  className={`w-11 h-11 rounded-full backdrop-blur-md flex items-center justify-center transition-all cursor-pointer border border-white/10 ${isScreenOn
                    ? "bg-violet-500 text-white"
                    : "bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
                    }`}
                  title={isScreenOn ? "إيقاف مشاركة الشاشة" : "مشاركة الشاشة"}
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
                      d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12"
                    />
                  </svg>
                </button>

                {/* Compact layout toggle — only visible for 3+ streams on Desktop */}
                {!isMobile && fsGridActive && trackCount >= 3 && (
                  <button
                    onClick={() => setCompactVideoLayout((v) => !v)}
                    className={`w-11 h-11 rounded-full backdrop-blur-md flex items-center justify-center transition-all cursor-pointer border border-white/10 ${compactVideoLayout
                      ? `${themeCfg.accent} text-white`
                      : "bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
                      }`}
                    title={
                      compactVideoLayout
                        ? "عرض كامل الشاشة"
                        : "عرض مصغّر مع المؤقت"
                    }
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
                        d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* ═══════════════════════════════════
             COMPACT LAYOUT — 1-2 streams, or 3+ opt-in
             Video on the left (end in RTL), panels on the right (start in RTL)
             ═══════════════════════════════════ */}
              {useCompactGrid && (
                <div className="absolute inset-0 z-[2] flex flex-col md:flex-row-reverse pt-16 md:pt-20 pb-[120px] md:pb-8 px-4 md:px-6 gap-4 md:gap-6 animate-fade-in">
                  {/* Left side (end in RTL): Video grid — compact */}
                  <div className="fs-compact-grid">
                    <ResizableVideoWrapper>
                      <VideoGrid
                        layoutMode={videoLayoutMode}
                        pinnedIndex={videoPinnedIndex}
                        onPinnedIndexChange={setVideoPinnedIndex}
                        gap={8}
                        compact
                        maxCapacity={room.maxCapacity || 6}
                        participants={participants}
                        localIdentity={user?.id}
                        onPublishCamera={toggleCamera}
                        onPublishScreen={toggleScreenShare}
                        isCameraOn={isCameraOn}
                        isScreenOn={isScreenOn}
                      />
                    </ResizableVideoWrapper>
                  </div>

                  {/* Right side (start in RTL): Timer + Goals */}
                  <div
                    className={`fs-compact-panels ${(!showFsGoals || isMobile) ? "justify-center md:justify-center" : ""}`}
                  >
                    {/* Timer */}
                    <div className="flex flex-col items-center gap-3 py-4">
                      {/* Timer + phase dot inline */}
                      <div className="flex items-center gap-3">
                        <span className="relative flex h-3.5 w-3.5">
                          {phaseStyle.ping && (
                            <span
                              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${phaseStyle.dot} opacity-75`}
                            />
                          )}
                          <span
                            className={`relative inline-flex rounded-full h-3.5 w-3.5 ${phaseStyle.dot}`}
                          />
                        </span>
                        <div
                          className={`font-mono font-bold text-white tabular-nums leading-none tracking-[0.12em] ${showFsGoals ? "text-6xl md:text-8xl" : "text-7xl md:text-[10rem]"
                            } ${phase === TIMER_PHASES.FOCUS
                              ? "drop-shadow-[0_0_16px_rgba(16,185,129,.3)]"
                              : phase === TIMER_PHASES.BREAK
                                ? "drop-shadow-[0_0_16px_rgba(245,158,11,.3)]"
                                : ""
                            }`}
                        >
                          {formatTime(timeLeft)}
                        </div>
                      </div>

                      {/* Host controls */}
                      <div className="flex items-center gap-3 mt-1">
                        {isHost &&
                          (phase === TIMER_PHASES.IDLE ||
                            phase === TIMER_PHASES.PAUSED) && (
                            <button
                              onClick={
                                phase === TIMER_PHASES.IDLE
                                  ? startTimer
                                  : resumeTimer
                              }
                              disabled={isTimerLoading}
                              className="flex items-center justify-center text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer disabled:opacity-50"
                              title={
                                phase === TIMER_PHASES.IDLE
                                  ? "ابدأ الجلسة"
                                  : "استئناف"
                              }
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
                                  d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                                />
                              </svg>
                            </button>
                          )}
                        {isHost && phase === TIMER_PHASES.FOCUS && (
                          <button
                            onClick={pauseTimer}
                            disabled={isTimerLoading}
                            className="flex items-center justify-center text-orange-400 hover:text-orange-300 transition-all cursor-pointer disabled:opacity-50"
                            title="إيقاف مؤقت"
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
                                d="M15.75 5.25v13.5m-7.5-13.5v13.5"
                              />
                            </svg>
                          </button>
                        )}
                        {isHost && phase === TIMER_PHASES.PAUSED && (
                          <button
                            onClick={restartTimer}
                            disabled={isTimerLoading}
                            className="flex items-center justify-center text-white/60 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                            title="إعادة البدء"
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
                                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
                              />
                            </svg>
                          </button>
                        )}
                        {phase === TIMER_PHASES.BREAK && (
                          <span className="text-yellow-300/80 text-lg">☕</span>
                        )}
                        {!isHost && phase === TIMER_PHASES.IDLE && (
                          <p className="text-white/30 text-xs">
                            في انتظار المضيف
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Goals panel — visible by default, toggleable */}
                    {!isMobile && (
                      <div className="flex items-center justify-between px-1">
                        <button
                          onClick={() => setShowFsGoals((v) => !v)}
                          className="text-[11px] text-white/40 hover:text-white/70 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <svg
                            className={`w-3 h-3 transition-transform ${showFsGoals ? "rotate-180" : ""}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.5 15.75l7.5-7.5 7.5 7.5"
                            />
                          </svg>
                          {showFsGoals ? "إخفاء الأهداف" : "عرض الأهداف"}
                        </button>
                      </div>
                    )}

                    {!isMobile && showFsGoals && (
                      <div className="flex-1 min-h-0 animate-fade-in">
                        <GoalsPanel
                          glassClass={glassClass}
                          themeCfg={themeCfg}
                          userId={user?.id}
                          participants={participants}
                          roomGoals={roomGoals}
                          isGoalsLoading={isGoalsLoading}
                          createGoal={createGoal}
                          toggleGoal={toggleGoal}
                          updateGoalTitle={updateGoalTitle}
                          deleteGoal={deleteGoal}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════
             FULL GRID LAYOUT — 3+ streams default
             Unchanged from original behavior
             ═══════════════════════════════════ */}
              {useFullGrid && (
                <div className="absolute inset-0 z-[2] p-6 pt-20 pb-28 animate-fade-in flex items-center justify-center">
                  <ResizableVideoWrapper>
                    <VideoGrid
                      layoutMode={videoLayoutMode}
                      pinnedIndex={videoPinnedIndex}
                      onPinnedIndexChange={setVideoPinnedIndex}
                      gap={8}
                      maxCapacity={room.maxCapacity || 6}
                      participants={participants}
                      localIdentity={user?.id}
                      onPublishCamera={toggleCamera}
                      onPublishScreen={toggleScreenShare}
                      isCameraOn={isCameraOn}
                      isScreenOn={isScreenOn}
                    />
                  </ResizableVideoWrapper>
                </div>
              )}

              {/* Timer — centered when no grid, bottom pill when full grid */}
              {!useCompactGrid && (
                <div
                  className={
                    useFullGrid
                      ? "absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-[3] flex flex-col md:flex-row items-center gap-2 md:gap-3 px-6 py-2 md:py-3 md:rounded-full bg-transparent md:bg-black/60 backdrop-blur-none md:backdrop-blur-md border-none md:border md:border-white/10 select-none w-full md:w-auto"
                      : "relative z-[2] flex flex-col md:flex-row items-center justify-center gap-4 select-none w-full"
                  }
                >
                  {/* Phase dot */}
                  <span
                    className={`relative flex ${useFullGrid ? "h-2.5 w-2.5" : "h-4 w-4"}`}
                  >
                    {phaseStyle.ping && (
                      <span
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full ${phaseStyle.dot} opacity-75`}
                      />
                    )}
                    <span
                      className={`relative inline-flex rounded-full ${useFullGrid ? "h-2.5 w-2.5" : "h-4 w-4"} ${phaseStyle.dot}`}
                    />
                  </span>

                  {/* Timer text */}
                  <div
                    className={`font-mono font-bold text-white tabular-nums leading-none text-center ${useFullGrid
                      ? "text-5xl md:text-3xl tracking-[0.1em] drop-shadow-[0_0_12px_rgba(0,0,0,0.8)] md:drop-shadow-none"
                      : "text-6xl sm:text-7xl md:text-[14rem] tracking-[0.15em]"
                      }`}
                  >
                    {formatTime(timeLeft)}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
    </div>
  );
}

export default function RoomPage() {
  const { livekitToken } = useRoomStore();
  const LIVEKIT_URL =
    import.meta.env.VITE_LIVEKIT_URL || "wss://maeen-r9pg430b.livekit.cloud";

  return (
    <LiveKitRoom
      token={livekitToken || undefined}
      serverUrl={LIVEKIT_URL}
      connect={!!livekitToken}
      options={{ adaptiveStream: true }}
    >
      <RoomPageInner />
    </LiveKitRoom>
  );
}
