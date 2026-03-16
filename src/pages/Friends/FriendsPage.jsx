import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useFriendsStore } from "@/stores";
import { useDmChat } from "@/hooks";
import FriendsSidebar from "./FriendsSidebar";
import ChatPanel from "./ChatPanel";

/**
 * Friends page — split-panel messenger layout.
 * Left: ChatPanel (conversation with selected friend)
 * Right: FriendsSidebar (friends list + pending requests)
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

  // Selected friend profile  { id, nickName, username, avatar }
  const [selectedFriend, setSelectedFriend] = useState(null);

  // DM chat hook — keyed on selectedFriend.id
  const {
    messages,
    sendMessage,
    editMessage,
    emitTyping,
    isConnected,
    typingUserId,
    loadMore,
    hasMore,
    isLoadingHistory,
  } = useDmChat(selectedFriend?.id || null);

  // Fetch on mount + connect SSE
  useEffect(() => {
    fetchFriends();
    fetchPending();
    connectSSE();
    return () => disconnectSSE();
  }, [fetchFriends, fetchPending, connectSSE, disconnectSSE]);

  // Auto-select first friend once friends load
  useEffect(() => {
    if (!selectedFriend && friends.length > 0) {
      const profile = friends[0].friendProfile;
      if (profile) {
        setSelectedFriend({
          id: profile.id,
          nickName: profile.nickName,
          username: profile.username,
          avatar: profile.avatar,
        });
      }
    }
  }, [friends, selectedFriend]);

  // Handle friend selection
  const handleSelectFriend = useCallback((friendId, profile) => {
    setSelectedFriend({
      id: friendId,
      nickName: profile?.nickName,
      username: profile?.username,
      avatar: profile?.avatar,
    });
  }, []);

  // Handle respond to pending request
  const handleRespondToRequest = useCallback(
    (id, status) => {
      respondToRequest(id, status);
    },
    [respondToRequest],
  );

  // Handle remove friend
  const handleRemoveFriend = useCallback(
    (id) => {
      removeFriend(id);
      if (selectedFriend?.id === id) {
        setSelectedFriend(null);
      }
    },
    [removeFriend, selectedFriend],
  );

  // Handle join friend's room
  const handleJoinRoom = useCallback(
    (friend) => {
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
    },
    [navigate],
  );

  return (
    <div className="flex-1 flex gap-4 overflow-hidden h-full">
      {/* ── Chat Panel (left in RTL = main area) ── */}
      <ChatPanel
        friend={selectedFriend}
        messages={messages}
        isConnected={isConnected}
        isLoadingHistory={isLoadingHistory}
        hasMore={hasMore}
        typingUserId={typingUserId}
        onSendMessage={sendMessage}
        onEditMessage={editMessage}
        onEmitTyping={emitTyping}
        onLoadMore={loadMore}
      />

      {/* ── Friends Sidebar (right in RTL) ── */}
      <FriendsSidebar
        friends={friends}
        pendingRequests={pendingRequests}
        isLoading={isLoading}
        isPendingLoading={isPendingLoading}
        selectedFriendId={selectedFriend?.id}
        typingUserId={typingUserId}
        onSelectFriend={handleSelectFriend}
        onRespondToRequest={handleRespondToRequest}
        onRemoveFriend={handleRemoveFriend}
        onJoinRoom={handleJoinRoom}
      />
    </div>
  );
}

export default FriendsPage;
