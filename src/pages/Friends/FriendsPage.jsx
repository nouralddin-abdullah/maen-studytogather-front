import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useFriendsStore } from "@/stores";
import { userService } from "@/services";
import ProfilePopover from "@/components/ui/ProfilePopover";

/**
 * Friends page — full-page view of friends list and pending requests.
 */
function FriendsPage() {
  const navigate = useNavigate();
  const {
    friends,
    pendingRequests,
    isLoading,
    isPendingLoading,
    fetchFriends,
    fetchPending,
    respondToRequest,
    removeFriend,
    connectSSE,
    disconnectSSE,
  } = useFriendsStore();

  const [activeTab, setActiveTab] = useState("friends");
  const [menuOpenId, setMenuOpenId] = useState(null);
  const menuRef = useRef(null);

  // Profile popover state
  const [popoverUser, setPopoverUser] = useState(null);
  const [popoverPos, setPopoverPos] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Fetch on mount + connect SSE
  useEffect(() => {
    fetchFriends();
    fetchPending();
    connectSSE();
    return () => disconnectSSE();
  }, [fetchFriends, fetchPending, connectSSE, disconnectSSE]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleJoinRoom = (friend) => {
    if (friend.inviteCode) {
      navigate(`/room/${friend.inviteCode}`, {
        state: {
          roomPreview: {
            name: friend.roomName,
            hasPassCode: false,
          },
        },
      });
    }
  };

  // Open profile popover on avatar click
  const handleAvatarClick = useCallback(async (e, userId) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // RTL: popover opens to the left of the avatar
    const rightPos = window.innerWidth - rect.left + 12;
    // Clamp vertical so it doesn't overflow
    const topPos = Math.min(rect.top, window.innerHeight - 420);
    setPopoverPos({
      top: Math.max(16, topPos),
      right: rightPos,
    });
    setIsLoadingProfile(true);
    setPopoverUser(null);

    try {
      const profile = await userService.getProfile(userId);
      setPopoverUser({
        id: profile.id,
        nickName: profile.nickName,
        userName: profile.username,
        avatar: profile.avatar,
        quote: profile.quote,
        country: profile.country,
        field: profile.field,
        currentStreak: profile.currentStreak,
        twitterUrl: profile.twitterUrl,
        discordUsername: profile.discordUsername,
        totalFocusMinutes: profile.totalFocusMinutes,
        profileBackgroundUrl: profile.profileBackgroundUrl,
      });
    } catch {
      setPopoverUser(null);
      setPopoverPos(null);
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  const closePopover = useCallback(() => {
    setPopoverUser(null);
    setPopoverPos(null);
  }, []);

  return (
    <>
      {/* ══════ Header Bar ══════ */}
      <header className="flex-shrink-0 flex items-center gap-4 bg-surface-elevated/80 backdrop-blur-xl border border-border p-3.5 rounded-2xl shadow-card">
        <h1 className="font-display text-lg font-bold text-text-primary">
          أصدقائي
        </h1>

        {/* Tabs */}
        <div className="flex items-center gap-2 ms-auto">
          <button
            onClick={() => setActiveTab("friends")}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "friends"
                ? "bg-brand-600 text-white shadow-sm"
                : "border border-border text-text-secondary hover:bg-surface-muted hover:text-text-primary"
            }`}
          >
            الأصدقاء
            {friends.length > 0 && (
              <span className="ms-1.5 opacity-75">({friends.length})</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "pending"
                ? "bg-brand-600 text-white shadow-sm"
                : "border border-border text-text-secondary hover:bg-surface-muted hover:text-text-primary"
            }`}
          >
            طلبات الصداقة
            {pendingRequests.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-brand-600 text-white text-[11px] font-bold border border-white/20">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ══════ Content ══════ */}
      <div className="flex-1 overflow-y-auto pe-1">
        {activeTab === "friends" && (
          <>
            {/* Loading skeleton */}
            {isLoading && friends.length === 0 && (
              <div className="space-y-3 pb-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-surface-elevated animate-pulse"
                  >
                    <div className="w-12 h-12 rounded-full bg-surface-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-surface-muted rounded w-1/3" />
                      <div className="h-3 bg-surface-muted rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isLoading && friends.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
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
                      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                    />
                  </svg>
                </div>
                <h3 className="font-display text-lg font-bold text-text-primary mb-1">
                  لا يوجد أصدقاء بعد
                </h3>
                <p className="text-text-muted text-sm max-w-xs">
                  أضف أصدقاء للدراسة معهم!
                </p>
              </div>
            )}

            {/* Friends list — full width, 1 per row */}
            {friends.length > 0 && (
              <div className="space-y-3 pb-4">
                {friends.map((friend) => (
                  <FriendCard
                    key={friend.id}
                    friend={friend}
                    menuOpenId={menuOpenId}
                    menuRef={menuRef}
                    onToggleMenu={(id) =>
                      setMenuOpenId(menuOpenId === id ? null : id)
                    }
                    onJoinRoom={() => handleJoinRoom(friend)}
                    onRemove={() => {
                      setMenuOpenId(null);
                      removeFriend(friend.id);
                    }}
                    onAvatarClick={handleAvatarClick}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "pending" && (
          <>
            {/* Loading skeleton */}
            {isPendingLoading && pendingRequests.length === 0 && (
              <div className="space-y-3 pb-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-surface-elevated animate-pulse"
                  >
                    <div className="w-12 h-12 rounded-full bg-surface-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-surface-muted rounded w-1/3" />
                      <div className="h-3 bg-surface-muted rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isPendingLoading && pendingRequests.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
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
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                    />
                  </svg>
                </div>
                <h3 className="font-display text-lg font-bold text-text-primary mb-1">
                  لا توجد طلبات
                </h3>
                <p className="text-text-muted text-sm max-w-xs">
                  ليس لديك طلبات صداقة معلقة
                </p>
              </div>
            )}

            {/* Pending requests — full width, 1 per row */}
            {pendingRequests.length > 0 && (
              <div className="space-y-3 pb-4">
                {pendingRequests.map((req) => (
                  <PendingRequestCard
                    key={req.id}
                    request={req}
                    onAccept={() => respondToRequest(req.id, "accepted")}
                    onReject={() => respondToRequest(req.id, "rejected")}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ══════ Profile Popover ══════ */}
      {popoverUser && popoverPos && (
        <div
          className="fixed z-[200]"
          style={{ top: popoverPos.top, right: popoverPos.right }}
        >
          <ProfilePopover
            participant={popoverUser}
            onClose={closePopover}
            glassClass="bg-surface-elevated/95 backdrop-blur-xl"
          />
        </div>
      )}

      {/* Loading indicator for profile fetch */}
      {isLoadingProfile && popoverPos && (
        <div
          className="fixed z-[200]"
          style={{ top: popoverPos.top, right: popoverPos.right }}
        >
          <div className="bg-surface-elevated/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-border p-6 w-[310px] flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      )}
    </>
  );
}

/* ─────────────── Sub-components ─────────────── */

/**
 * Single friend card — full width, with online indicator and 3-dot menu.
 */
function FriendCard({
  friend,
  menuOpenId,
  menuRef,
  onToggleMenu,
  onJoinRoom,
  onRemove,
  onAvatarClick,
}) {
  const profile = friend.friendProfile;
  const isOnline = friend.isOnline;

  return (
    <div className="group relative flex items-center gap-4 p-4 rounded-2xl border border-border bg-surface-elevated hover:bg-surface-elevated/90 hover:border-brand-500/30 transition-all">
      {/* Avatar — clickable for profile popover */}
      <button
        className="relative flex-shrink-0 cursor-pointer"
        onClick={(e) => onAvatarClick(e, profile?.id)}
      >
        {profile?.avatar ? (
          <img
            src={profile.avatar}
            alt={profile.nickName || profile.username}
            className="w-12 h-12 rounded-full border border-border object-cover hover:border-brand-500 transition-colors"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/30 border border-border hover:border-brand-500 flex items-center justify-center transition-colors">
            <span className="text-base font-bold text-brand-600">
              {(profile?.nickName || profile?.username || "?").charAt(0)}
            </span>
          </div>
        )}
        {/* Online dot */}
        {isOnline && (
          <span className="absolute -bottom-0.5 -end-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-surface-elevated rounded-full" />
        )}
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary truncate">
          {profile?.nickName || profile?.username}
        </p>
        <p className="text-xs text-text-muted truncate">
          @{profile?.username}
        </p>
        {isOnline && friend.roomName && (
          <p className="text-xs text-green-500 truncate mt-0.5">
            🟢 في {friend.roomName}
          </p>
        )}
      </div>

      {/* 3-dot menu */}
      <div className="relative" ref={menuOpenId === friend.id ? menuRef : null}>
        <button
          onClick={() => onToggleMenu(friend.id)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-surface-muted hover:text-text-primary transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
        >
          <svg
            className="w-4.5 h-4.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        {/* Dropdown */}
        {menuOpenId === friend.id && (
          <div className="absolute end-0 top-full mt-1 w-48 bg-surface-elevated border border-border rounded-xl shadow-elevated py-1.5 z-[110]">
            {isOnline && friend.inviteCode && (
              <button
                onClick={onJoinRoom}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-text-primary hover:bg-surface-muted transition-colors cursor-pointer"
              >
                <svg
                  className="w-4 h-4 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                  />
                </svg>
                انضم للغرفة
              </button>
            )}
            <button
              onClick={onRemove}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-error hover:bg-error/10 transition-colors cursor-pointer"
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
                  d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                />
              </svg>
              إزالة صديق
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Pending friend request card with accept/reject buttons.
 */
function PendingRequestCard({ request, onAccept, onReject }) {
  const requester = request.requester;

  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-surface-elevated">
      {/* Avatar */}
      {requester?.avatar ? (
        <img
          src={requester.avatar}
          alt={requester.nickName || requester.username}
          className="w-12 h-12 rounded-full border border-border object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/30 border border-border flex items-center justify-center flex-shrink-0">
          <span className="text-base font-bold text-brand-600">
            {(requester?.nickName || requester?.username || "?").charAt(0)}
          </span>
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary truncate">
          {requester?.nickName || requester?.username}
        </p>
        <p className="text-xs text-text-muted truncate">
          @{requester?.username}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onAccept}
          title="قبول"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-green-500/15 text-green-500 hover:bg-green-500/25 transition-colors cursor-pointer"
        >
          <svg
            className="w-5 h-5"
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
          onClick={onReject}
          title="رفض"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-error/10 text-error hover:bg-error/20 transition-colors cursor-pointer"
        >
          <svg
            className="w-5 h-5"
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
      </div>
    </div>
  );
}

export default FriendsPage;
