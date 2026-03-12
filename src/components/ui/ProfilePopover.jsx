import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ROUTES, FIELD_LABELS, COUNTRY_LABELS } from "@/utils/constants";
import { useAuthStore } from "@/stores";
import { friendshipService } from "@/services";

/* ───────────────────────────────────────────
   Inline SVG icons (same as ProfilePage)
   ─────────────────────────────────────────── */
function DiscordIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
    </svg>
  );
}

function TwitterIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/* ───────────────────────────────────────────
   Default banner fallback
   ─────────────────────────────────────────── */
const DEFAULT_BANNER =
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=60";

/**
 * ProfilePopover — Discord-style mini profile card.
 *
 * @param {object}   participant  The participant data object.
 * @param {function} onClose      Called when the popover should close.
 * @param {string}   glassClass   Room-theme glass CSS class.
 */
export default function ProfilePopover({ participant, onClose, glassClass }) {
  const popoverRef = useRef(null);
  const currentUser = useAuthStore((s) => s.user);
  const [friendStatus, setFriendStatus] = useState(null); // NOT_FRIENDS | FRIENDS | PENDING_SENT | PENDING_RECEIVED
  const [friendshipId, setFriendshipId] = useState(null);
  const [friendLoading, setFriendLoading] = useState(false);

  const isSelf = currentUser?.id === participant?.id;

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };
    const id = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
    }, 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Fetch friendship status
  useEffect(() => {
    if (!participant?.id || isSelf) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await friendshipService.getStatus(participant.id);
        if (!cancelled) {
          setFriendStatus(data.status);
          setFriendshipId(data.friendshipId || null);
        }
      } catch {
        if (!cancelled) setFriendStatus(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [participant?.id, isSelf]);

  // Send friend request handler
  const handleSendRequest = async () => {
    setFriendLoading(true);
    try {
      await friendshipService.sendRequest(participant.id);
      setFriendStatus("PENDING_SENT");
    } catch {
      // ignore — already sent or other error
    } finally {
      setFriendLoading(false);
    }
  };

  // Accept incoming request
  const handleAcceptRequest = async () => {
    if (!friendshipId) return;
    setFriendLoading(true);
    try {
      await friendshipService.respond(friendshipId, "accepted");
      setFriendStatus("FRIENDS");
    } catch {
      // ignore
    } finally {
      setFriendLoading(false);
    }
  };

  // Reject incoming request
  const handleRejectRequest = async () => {
    if (!friendshipId) return;
    setFriendLoading(true);
    try {
      await friendshipService.respond(friendshipId, "rejected");
      setFriendStatus("NOT_FRIENDS");
      setFriendshipId(null);
    } catch {
      // ignore
    } finally {
      setFriendLoading(false);
    }
  };

  if (!participant) return null;

  const {
    id,
    nickName,
    userName,
    avatar,
    quote,
    country,
    field,
    currentStreak,
    twitterUrl,
    discordUsername,
    totalFocusMinutes,
    profileBackgroundUrl,
  } = participant;

  const [copiedDiscord, setCopiedDiscord] = useState(false);

  const fieldLabel = field ? FIELD_LABELS[field] || field : null;
  const countryLabel = country ? COUNTRY_LABELS[country] || country : null;
  const bannerUrl = profileBackgroundUrl || DEFAULT_BANNER;
  const focusHours = Math.round((totalFocusMinutes || 0) / 60);

  return (
    <div ref={popoverRef} className="animate-popover-in" style={{ width: 310 }}>
      <div
        className={`${glassClass} rounded-2xl shadow-2xl border border-white/15`}
        style={{ overflow: "visible" }}
      >
        {/* ── Banner ── */}
        <div
          className="relative rounded-t-2xl"
          style={{ height: 80, overflow: "hidden" }}
        >
          <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Friendship status icon on banner */}
          {!isSelf && friendStatus && (
            <div className="absolute top-3 start-3 flex items-center gap-1.5">
              {friendStatus === "FRIENDS" && (
                <span
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white/80"
                  title="أصدقاء"
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
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                  </svg>
                </span>
              )}
              {friendStatus === "PENDING_SENT" && (
                <span
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white/50"
                  title="طلب مُرسل"
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
                      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </span>
              )}
              {friendStatus === "PENDING_RECEIVED" && (
                <>
                  <button
                    onClick={handleAcceptRequest}
                    disabled={friendLoading}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-emerald-400 hover:bg-emerald-600/60 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                    title="قبول"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={handleRejectRequest}
                    disabled={friendLoading}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-red-400 hover:bg-red-600/60 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                    title="رفض"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </>
              )}
              {friendStatus === "NOT_FRIENDS" && (
                <button
                  onClick={handleSendRequest}
                  disabled={friendLoading}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white/50 hover:bg-brand-600/60 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                  title="إضافة صديق"
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
                      d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Avatar — overlapping banner ── */}
        <div
          className="relative flex justify-end px-5"
          style={{ marginTop: -32 }}
        >
          {avatar ? (
            <img
              src={avatar}
              alt={nickName}
              className="w-16 h-16 rounded-full object-cover border-[3px] border-black/60 shadow-lg"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-white/20 border-[3px] border-black/60 shadow-lg flex items-center justify-center">
              <span className="text-xl font-bold text-white">
                {(nickName || "؟").charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* ── Body content ── */}
        <div className="px-5 pt-3 pb-5">
          {/* Name row + social icons */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-white text-[17px] font-bold leading-tight">
                {nickName || "مستخدم"}
              </h3>
              {userName && (
                <p className="text-white/40 text-xs mt-0.5">@{userName}</p>
              )}
            </div>

            {/* Social icons */}
            {(discordUsername || twitterUrl) && (
              <div className="flex items-center gap-1.5 pt-0.5 flex-shrink-0">
                {discordUsername && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(discordUsername);
                      setCopiedDiscord(true);
                      setTimeout(() => setCopiedDiscord(false), 1500);
                    }}
                    className="relative w-7 h-7 rounded-lg bg-white/5 hover:bg-[#5865F2]/20 flex items-center justify-center text-white/40 hover:text-[#5865F2] transition-colors cursor-pointer"
                    title={discordUsername}
                  >
                    <DiscordIcon className="w-3.5 h-3.5" />
                    {copiedDiscord && (
                      <span className="absolute -bottom-7 start-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-black/80 text-[10px] text-emerald-400 font-medium whitespace-nowrap z-50">
                        تم النسخ!
                      </span>
                    )}
                  </button>
                )}
                {twitterUrl && (
                  <a
                    href={twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                  >
                    <TwitterIcon className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* ── Separator ── */}
          <div className="border-t border-white/10 my-3" />

          {/* Details row */}
          {(fieldLabel || countryLabel) && (
            <div className="mb-3">
              <div className="flex gap-6">
                {fieldLabel && (
                  <div>
                    <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider mb-0.5">
                      التخصص
                    </p>
                    <p className="text-white/90 text-xs font-medium">
                      {fieldLabel}
                    </p>
                  </div>
                )}
                {countryLabel && (
                  <div>
                    <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider mb-0.5">
                      الدولة
                    </p>
                    <p className="text-white/90 text-xs font-medium">
                      {countryLabel}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quote */}
          {quote && (
            <div className="mb-3">
              <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider mb-1">
                اقتباس
              </p>
              <p
                dir="auto"
                className="text-white/60 text-xs italic leading-relaxed"
              >
                &ldquo;{quote}&rdquo;
              </p>
            </div>
          )}

          {/* Stats badges */}
          <div className="flex gap-2 mb-3">
            <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-2.5 py-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <svg
                  className="w-3.5 h-3.5 text-brand-400"
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
                <span className="text-[10px] text-white/50 font-bold">
                  تركيز
                </span>
              </div>
              <span className="text-white text-xs font-bold">
                {focusHours}س
              </span>
            </div>
            <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-2.5 py-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">🔥</span>
                <span className="text-[10px] text-white/50 font-bold">
                  سلسلة
                </span>
              </div>
              <span className="text-white text-xs font-bold">
                {currentStreak || 0}ي
              </span>
            </div>
          </div>

          {/* View Full Profile button */}
          <Link
            to={ROUTES.PROFILE(id)}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-brand-600/20 text-center"
          >
            عرض الملف الشخصي
          </Link>
        </div>
      </div>
    </div>
  );
}
