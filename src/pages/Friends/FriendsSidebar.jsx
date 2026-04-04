import { useState, useRef, useEffect, useMemo } from "react";

/**
 * FriendsSidebar — right-side panel listing friends & pending requests.
 * Highlights the currently selected friend.
 * Includes room indicator, join room, and remove friend options.
 */
export default function FriendsSidebar({
  className = "",
  friends,
  pendingRequests,
  isLoading,
  isPendingLoading,
  selectedFriendId,
  typingUserId,
  onSelectFriend,
  onRespondToRequest,
  onRemoveFriend,
  onJoinRoom,
}) {
  const [activeTab, setActiveTab] = useState("friends");
  const [search, setSearch] = useState("");
  const [menuOpenId, setMenuOpenId] = useState(null);
  const menuRef = useRef(null);

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

  // Filter friends by search term
  const filteredFriends = useMemo(() => {
    if (!search.trim()) return friends;
    const q = search.trim().toLowerCase();
    return friends.filter((f) => {
      const p = f.friendProfile;
      return (
        p?.nickName?.toLowerCase().includes(q) ||
        p?.username?.toLowerCase().includes(q)
      );
    });
  }, [friends, search]);

  return (
    <aside className={`w-full md:w-[320px] flex-shrink-0 flex flex-col bg-surface-elevated border border-border rounded-lg overflow-hidden ${className}`}>
      {/* ── Header + Tabs ── */}
      <div className="p-3.5 border-b border-border space-y-3">
        <h2 className="font-display text-base font-bold text-text-primary">
          المحادثات
        </h2>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("friends")}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${activeTab === "friends"
                ? "bg-brand-600 text-white shadow-sm"
                : "border border-border text-text-secondary hover:bg-surface-muted hover:text-text-primary"
              }`}
          >
            الأصدقاء
            {friends.length > 0 && (
              <span className="ms-1 opacity-75">({friends.length})</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === "pending"
                ? "bg-brand-600 text-white shadow-sm"
                : "border border-border text-text-secondary hover:bg-surface-muted hover:text-text-primary"
              }`}
          >
            الطلبات
            {pendingRequests.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-brand-600 text-white text-[11px] font-bold border border-white/20">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Search (friends tab only) */}
        {activeTab === "friends" && (
          <div className="relative">
            <svg
              className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن صديق..."
              className="w-full ps-9 pe-3 py-2 rounded-md bg-surface-muted border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
        )}
      </div>

      {/* ── List ── */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {activeTab === "friends" && (
          <>
            {/* Loading */}
            {isLoading && friends.length === 0 && (
              <div className="space-y-2 p-2">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-md animate-pulse"
                  >
                    <div className="w-10 h-10 rounded-full bg-surface-muted" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 bg-surface-muted rounded w-2/3" />
                      <div className="h-2.5 bg-surface-muted rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty */}
            {!isLoading && friends.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <div className="w-16 h-16 rounded-full bg-surface-muted flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-text-muted"
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
                <p className="text-sm font-semibold text-text-primary mb-1">
                  لا يوجد أصدقاء بعد
                </p>
                <p className="text-xs text-text-muted">
                  أضف أصدقاء للدراسة معهم!
                </p>
              </div>
            )}

            {/* No results */}
            {!isLoading &&
              friends.length > 0 &&
              filteredFriends.length === 0 && (
                <div className="text-center py-10 text-text-muted text-sm">
                  لا توجد نتائج
                </div>
              )}

            {/* Friend items */}
            {filteredFriends.map((friend) => {
              const profile = friend.friendProfile;
              const isActive = profile?.id === selectedFriendId;
              const isOnline = friend.isOnline;
              return (
                <div
                  key={friend.id}
                  className={`group relative flex items-center gap-3 p-3 rounded-md transition-all ${isActive
                      ? "bg-brand-600/15 border border-brand-500/30"
                      : "hover:bg-surface-muted border border-transparent"
                    }`}
                >
                  {/* Clickable area — select friend for chat */}
                  <button
                    onClick={() => onSelectFriend(profile?.id, profile)}
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer text-start"
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {profile?.avatar ? (
                        <img
                          src={profile.avatar}
                          alt={profile.nickName || profile.username}
                          className="w-10 h-10 rounded-full border border-border object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 border border-border flex items-center justify-center">
                          <span className="text-sm font-bold text-brand-600">
                            {(
                              profile?.nickName ||
                              profile?.username ||
                              "?"
                            ).charAt(0)}
                          </span>
                        </div>
                      )}
                      {/* Online dot */}
                      {isOnline && (
                        <span className="absolute -bottom-0.5 -end-0.5 w-3 h-3 bg-green-500 border-2 border-surface-elevated rounded-full" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-semibold truncate ${isActive ? "text-brand-600" : "text-text-primary"
                          }`}
                      >
                        {profile?.nickName || profile?.username}
                      </p>
                      {typingUserId === profile?.id ? (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 typing-dot-1" />
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 typing-dot-2" />
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 typing-dot-3" />
                          <span className="text-xs text-brand-500 ms-1">يكتب...</span>
                        </div>
                      ) : (
                        <p className="text-xs text-text-muted truncate">
                          @{profile?.username}
                        </p>
                      )}
                      {/* Room indicator */}
                      {isOnline && friend.roomName && (
                        <p className="text-xs text-green-500 truncate mt-0.5">
                          🟢 في {friend.roomName}
                        </p>
                      )}
                    </div>
                  </button>

                  {/* 3-dot menu */}
                  <div
                    className="relative"
                    ref={menuOpenId === friend.id ? menuRef : null}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(
                          menuOpenId === friend.id ? null : friend.id,
                        );
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:bg-surface-muted hover:text-text-primary transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>

                    {/* Dropdown */}
                    {menuOpenId === friend.id && (
                      <div className="absolute end-0 top-full mt-1 w-44 bg-surface-elevated border border-border rounded-lg shadow-elevated py-1.5 z-[110]">
                        {isOnline && friend.inviteCode && (
                          <button
                            onClick={() => {
                              setMenuOpenId(null);
                              onJoinRoom(friend);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-primary hover:bg-surface-muted transition-colors cursor-pointer"
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
                          onClick={() => {
                            setMenuOpenId(null);
                            onRemoveFriend(friend.id);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-error hover:bg-error/10 transition-colors cursor-pointer"
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
            })}
          </>
        )}

        {activeTab === "pending" && (
          <>
            {/* Loading */}
            {isPendingLoading && pendingRequests.length === 0 && (
              <div className="space-y-2 p-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-md animate-pulse"
                  >
                    <div className="w-10 h-10 rounded-full bg-surface-muted" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 bg-surface-muted rounded w-2/3" />
                      <div className="h-2.5 bg-surface-muted rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty */}
            {!isPendingLoading && pendingRequests.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <div className="w-16 h-16 rounded-full bg-surface-muted flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-text-muted"
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
                <p className="text-sm font-semibold text-text-primary mb-1">
                  لا توجد طلبات
                </p>
                <p className="text-xs text-text-muted">
                  ليس لديك طلبات صداقة معلقة
                </p>
              </div>
            )}

            {/* Pending items */}
            {pendingRequests.map((req) => {
              const requester = req.requester;
              return (
                <div
                  key={req.id}
                  className="flex items-center gap-3 p-3 rounded-md border border-border bg-surface-elevated"
                >
                  {/* Avatar */}
                  {requester?.avatar ? (
                    <img
                      src={requester.avatar}
                      alt={requester.nickName || requester.username}
                      className="w-10 h-10 rounded-full border border-border object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 border border-border flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-brand-600">
                        {(
                          requester?.nickName ||
                          requester?.username ||
                          "?"
                        ).charAt(0)}
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
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onRespondToRequest(req.id, "accepted")}
                      title="قبول"
                      className="w-8 h-8 flex items-center justify-center rounded-md bg-green-500/15 text-green-500 hover:bg-green-500/25 transition-colors cursor-pointer"
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
                      onClick={() => onRespondToRequest(req.id, "rejected")}
                      title="رفض"
                      className="w-8 h-8 flex items-center justify-center rounded-md bg-error/10 text-error hover:bg-error/20 transition-colors cursor-pointer"
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
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </aside>
  );
}
