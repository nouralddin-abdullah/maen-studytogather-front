"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout";
import {
  getCurrentUser,
  getMyTeam,
  getMyTeamMembers,
  User,
  Team,
  chatSocket,
  getChatHistory,
  getOnlineUsers,
  uploadChatAttachment,
  ChatMessage as APIChatMessage,
  TypingUser,
} from "@/lib/api";
import {
  DisplayMessage,
  OnlineMember,
  ReplyTo,
  ChatMessage,
  ChatInput,
  MembersSidebar,
  MobileChatHeader,
  DesktopChatHeader,
  TypingIndicator,
} from "@/components/chat";

export default function TeamChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<OnlineMember[]>([]);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isLoadingHistoryRef = useRef(false);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [historyCursor, setHistoryCursor] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<DisplayMessage | null>(
    null,
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const isAtBottomRef = useRef(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLInputElement>(null);

  // Check if at bottom helper
  const checkIfAtBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight <
      150
    );
  }, []);

  // Scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
    setUnreadCount(0);
    setIsAtBottom(true);
    isAtBottomRef.current = true;
  }, []);

  // Track scroll position using scroll event
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;

      ticking = true;
      requestAnimationFrame(() => {
        const distanceFromBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight;
        const nearBottom = distanceFromBottom < 100;

        // Only update state if changed to prevent re-renders
        if (isAtBottomRef.current !== nearBottom) {
          setIsAtBottom(nearBottom);
          isAtBottomRef.current = nearBottom;
        }

        // Clear unread when scrolled to bottom
        if (nearBottom) {
          setUnreadCount(0);
        }

        ticking = false;
      });
    };

    // Force check on touch end (for mobile swipe scrolling)
    const handleTouchEnd = () => {
      // Small delay to let scroll settle
      setTimeout(handleScroll, 100);
    };

    // Run once on mount to check initial position
    handleScroll();

    container.addEventListener("scroll", handleScroll, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  // Also use IntersectionObserver for more reliable bottom detection
  useEffect(() => {
    const endRef = messagesEndRef.current;
    const container = messagesContainerRef.current;
    if (!endRef || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries[0]?.isIntersecting;
        if (isVisible) {
          setUnreadCount(0);
          setIsAtBottom(true);
          isAtBottomRef.current = true;
        }
      },
      {
        root: container,
        rootMargin: "100px", // Trigger earlier when approaching bottom
        threshold: 0, // Use 0 for zero-height element
      },
    );

    observer.observe(endRef);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        200;
      if (isNearBottom) {
        scrollToBottom();
      }
    }
  }, [messages, scrollToBottom]);

  // Convert API message to display message
  const toDisplayMessage = useCallback(
    (msg: APIChatMessage, allMessages?: APIChatMessage[]): DisplayMessage => {
      const isSystem = msg.messageType === "system";

      let replyTo: ReplyTo | null = null;
      if (msg.replyToId && allMessages) {
        const replyMsg = allMessages.find((m) => m.id === msg.replyToId);
        if (replyMsg) {
          replyTo = {
            id: replyMsg.id,
            senderName: replyMsg.sender?.nickName || "النظام",
            content: replyMsg.content,
            type:
              replyMsg.attachment?.type === "video"
                ? "video"
                : replyMsg.attachment?.type === "image"
                  ? "image"
                  : "text",
          };
        }
      }

      return {
        id: msg.id,
        senderId: msg.sender?.id || "system",
        senderName: msg.sender?.nickName || "النظام",
        senderAvatar: msg.sender?.avatar || null,
        content: msg.content,
        type: isSystem
          ? "system"
          : msg.attachment?.type === "video"
            ? "video"
            : msg.attachment?.type === "image"
              ? "image"
              : "text",
        systemMessageType: msg.systemMessageType,
        mediaUrl: msg.attachment?.url,
        createdAt: msg.createdAt,
        replyTo,
      };
    },
    [],
  );

  // Setup WebSocket event handlers
  const setupSocketHandlers = useCallback(
    (teamId: string, currentUser: User) => {
      chatSocket.onMessage((message: APIChatMessage) => {
        setMessages((prev) => {
          let replyTo: ReplyTo | null = null;
          if (message.replyToId) {
            const replyMsg = prev.find((m) => m.id === message.replyToId);
            if (replyMsg) {
              replyTo = {
                id: replyMsg.id,
                senderName: replyMsg.senderName,
                content: replyMsg.content,
                type: replyMsg.type === "system" ? "text" : replyMsg.type,
              };
            }
          }

          const displayMsg: DisplayMessage = {
            id: message.id,
            senderId: message.sender?.id || "system",
            senderName: message.sender?.nickName || "النظام",
            senderAvatar: message.sender?.avatar || null,
            content: message.content,
            type:
              message.messageType === "system"
                ? "system"
                : message.attachment?.type === "video"
                  ? "video"
                  : message.attachment?.type === "image"
                    ? "image"
                    : "text",
            systemMessageType: message.systemMessageType,
            mediaUrl: message.attachment?.url,
            createdAt: message.createdAt,
            replyTo,
          };

          const optimisticIndex = prev.findIndex(
            (m) =>
              m.isOptimistic &&
              m.senderId === currentUser.id &&
              m.content === message.content,
          );

          if (optimisticIndex !== -1) {
            const updated = [...prev];
            updated[optimisticIndex] = displayMsg;
            return updated;
          }

          if (prev.some((m) => m.id === message.id)) {
            return prev;
          }

          return [...prev, displayMsg];
        });

        // Increment unread count if not at bottom and message is from someone else
        if (message.sender?.id !== currentUser.id) {
          // Use ref for synchronous check - more reliable than state
          if (!isAtBottomRef.current) {
            setUnreadCount((c) => c + 1);
          }
        }
      });

      chatSocket.onUserOnline((userId: string) => {
        setMembers((prev) =>
          prev.map((m) => (m.id === userId ? { ...m, isOnline: true } : m)),
        );
      });

      chatSocket.onUserOffline((userId: string) => {
        setMembers((prev) =>
          prev.map((m) =>
            m.id === userId ? { ...m, isOnline: false, isTyping: false } : m,
          ),
        );
      });

      chatSocket.onUserTyping((typingUser: TypingUser) => {
        if (typingUser.userId === currentUser.id) return;
        setMembers((prev) =>
          prev.map((m) =>
            m.id === typingUser.userId ? { ...m, isTyping: true } : m,
          ),
        );
      });

      chatSocket.onUserStopTyping((userId: string) => {
        setMembers((prev) =>
          prev.map((m) => (m.id === userId ? { ...m, isTyping: false } : m)),
        );
      });

      chatSocket.onConnect(() => {
        setIsConnected(true);
        setConnectionError(null);
        chatSocket.joinRoom(teamId);
      });

      chatSocket.onRoomJoined((onlineUserIds: string[]) => {
        const onlineSet = new Set(onlineUserIds);
        onlineSet.add(currentUser.id);
        setMembers((prev) =>
          prev.map((m) => ({
            ...m,
            isOnline: onlineSet.has(m.id),
          })),
        );
      });

      chatSocket.onDisconnect((reason: string) => {
        setIsConnected(false);
        if (reason === "io server disconnect") {
          setConnectionError("تم قطع الاتصال من الخادم");
        }
      });

      chatSocket.onError((error: { message: string }) => {
        console.error("[Chat] Error:", error.message);
        setConnectionError(error.message);
      });
    },
    [],
  );

  // Fetch initial data and connect
  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const userData = await getCurrentUser();
        if (!mounted) return;
        setUser(userData);

        if (!userData.teamId) {
          router.push("/discover");
          return;
        }

        const teamData = await getMyTeam();
        if (!mounted) return;

        if (!teamData) {
          router.push("/discover");
          return;
        }

        setTeam(teamData);

        try {
          const teamMembersResponse = await getMyTeamMembers();
          if (!mounted) return;

          const onlineMembers: OnlineMember[] = teamMembersResponse.items.map(
            (member) => ({
              ...member,
              isOnline: member.id === userData.id,
              isTyping: false,
            }),
          );
          setMembers(onlineMembers);

          try {
            const onlineIds = await getOnlineUsers(teamData.id);
            if (!mounted) return;

            const onlineSet = new Set(onlineIds);
            onlineSet.add(userData.id);
            setMembers((prev) =>
              prev.map((m) => ({
                ...m,
                isOnline: onlineSet.has(m.id),
              })),
            );
          } catch {
            // Silently fail
          }
        } catch (error) {
          console.error("Failed to fetch team members:", error);
        }

        try {
          const history = await getChatHistory(teamData.id, { limit: 50 });
          if (!mounted) return;

          if (history.messages && history.messages.length > 0) {
            const displayMessages = history.messages.map((m) =>
              toDisplayMessage(m, history.messages),
            );
            setMessages(displayMessages.reverse());
            setHasMoreHistory(history.hasMore);
            setHistoryCursor(history.oldestCursor);

            setTimeout(() => {
              scrollToBottom(false);
              setTimeout(() => setInitialLoadComplete(true), 50);
            }, 100);
          } else {
            setHasMoreHistory(false);
            setInitialLoadComplete(true);
          }
        } catch (error) {
          console.error("[Chat] Failed to fetch history:", error);
          setHasMoreHistory(false);
        }

        setupSocketHandlers(teamData.id, userData);
        chatSocket.connect();
      } catch {
        router.push("/login");
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
      chatSocket.disconnect();
    };
  }, [router, toDisplayMessage, setupSocketHandlers, scrollToBottom]);

  // Load more history
  const loadMoreHistory = useCallback(async () => {
    if (
      !team ||
      isLoadingHistoryRef.current ||
      !hasMoreHistory ||
      !historyCursor
    )
      return;

    isLoadingHistoryRef.current = true;
    const container = messagesContainerRef.current;
    const previousScrollHeight = container?.scrollHeight || 0;

    setIsLoadingHistory(true);
    try {
      const history = await getChatHistory(team.id, {
        limit: 50,
        before: historyCursor,
      });

      if (history.messages && history.messages.length > 0) {
        const displayMessages = history.messages.map((m) =>
          toDisplayMessage(m, history.messages),
        );

        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newMessages = displayMessages
            .reverse()
            .filter((m) => !existingIds.has(m.id));
          return [...newMessages, ...prev];
        });

        requestAnimationFrame(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - previousScrollHeight;
          }
        });

        setHasMoreHistory(history.hasMore);
        setHistoryCursor(history.oldestCursor);
      } else {
        setHasMoreHistory(false);
      }
    } catch (error) {
      console.error("Failed to load more history:", error);
    } finally {
      setIsLoadingHistory(false);
      isLoadingHistoryRef.current = false;
    }
  }, [team, hasMoreHistory, historyCursor, toDisplayMessage]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel || !team || !initialLoadComplete) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (
          entry.isIntersecting &&
          hasMoreHistory &&
          !isLoadingHistoryRef.current
        ) {
          loadMoreHistory();
        }
      },
      {
        root: messagesContainerRef.current,
        rootMargin: "100px 0px 0px 0px",
        threshold: 0,
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [team, hasMoreHistory, loadMoreHistory, initialLoadComplete]);

  const formatTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    if (isToday) return "اليوم";

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "أمس";

    return date.toLocaleDateString("ar-SA", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedImages = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      const allowedVideos = ["video/mp4", "video/webm", "video/quicktime"];
      const isImage = allowedImages.includes(file.type);
      const isVideo = allowedVideos.includes(file.type);

      if (!isImage && !isVideo) {
        alert(
          "نوع الملف غير مدعوم. يرجى اختيار صورة (JPEG, PNG, GIF, WebP) أو فيديو (MP4, WebM, MOV)",
        );
        return;
      }

      const maxSize = 20 * 1024 * 1024;
      if (file.size > maxSize) {
        alert("حجم الملف يجب أن يكون أقل من 20 ميجابايت");
        return;
      }

      setSelectedMedia(file);
      const previewUrl = URL.createObjectURL(file);
      setMediaPreview(previewUrl);
    }
  };

  const removeSelectedMedia = () => {
    if (mediaPreview && mediaPreview.startsWith("blob:")) {
      URL.revokeObjectURL(mediaPreview);
    }
    setSelectedMedia(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const sendMessage = async (content?: string) => {
    const messageContent = content || newMessage.trim();

    if (!messageContent && !selectedMedia) return;
    if (isSending || !team || !user) return;

    setIsSending(true);

    try {
      let attachmentUrl: string | undefined;
      let attachmentType: "image" | "video" | undefined;
      let attachmentFileName: string | undefined;
      let attachmentFileSize: number | undefined;
      let attachmentMimeType: string | undefined;

      if (selectedMedia) {
        attachmentFileName = selectedMedia.name;
        attachmentFileSize = selectedMedia.size;
        attachmentMimeType = selectedMedia.type;
        attachmentType = selectedMedia.type.startsWith("video/")
          ? "video"
          : "image";

        try {
          setIsUploading(true);
          setUploadProgress(0);
          const uploadResult = await uploadChatAttachment(
            selectedMedia,
            (progress) => setUploadProgress(progress),
          );
          attachmentUrl = uploadResult.url;
          setIsUploading(false);
          setUploadProgress(0);
        } catch (error) {
          console.error("Failed to upload attachment:", error);
          setConnectionError("فشل رفع الملف");
          setIsUploading(false);
          setUploadProgress(0);
          setIsSending(false);
          return;
        }
      }

      const replyTo = replyToMessage
        ? {
            id: replyToMessage.id,
            senderName: replyToMessage.senderName,
            content: replyToMessage.content,
            type:
              replyToMessage.type === "system"
                ? ("text" as const)
                : replyToMessage.type,
          }
        : null;
      const replyToId = replyToMessage?.id;

      const optimisticMsg: DisplayMessage = {
        id: `temp-${Date.now()}`,
        senderId: user.id,
        senderName: user.nickName,
        senderAvatar: user.avatar || null,
        content: messageContent || null,
        type: attachmentType || "text",
        mediaUrl: mediaPreview || undefined,
        createdAt: new Date().toISOString(),
        isOptimistic: true,
        replyTo,
      };

      setMessages((prev) => [...prev, optimisticMsg]);
      setNewMessage("");
      setReplyToMessage(null);
      removeSelectedMedia();

      const payload = {
        teamId: team.id,
        content: messageContent || undefined,
        ...(replyToId ? { replyToId } : {}),
        ...(attachmentUrl
          ? {
              attachment: {
                url: attachmentUrl,
                type: attachmentType!,
                fileName: attachmentFileName,
                fileSize: attachmentFileSize,
                mimeType: attachmentMimeType,
              },
            }
          : {}),
      };

      chatSocket.sendMessage(payload);
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => prev.filter((m) => !m.isOptimistic));
      setConnectionError("فشل إرسال الرسالة");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (value: string) => {
    setNewMessage(value);
    if (team) {
      chatSocket.handleTyping(team.id);
    }
  };

  const getOnlineCount = () => members.filter((m) => m.isOnline).length;
  const getTypingMembers = () =>
    members.filter((m) => m.isTyping && m.id !== user?.id);

  const handleReply = useCallback((message: DisplayMessage) => {
    if (message.type === "system") return;
    setReplyToMessage(message);
    textareaRef.current?.focus();
  }, []);

  const cancelReply = () => {
    setReplyToMessage(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-dark flex flex-col h-screen overflow-hidden">
      {/* Header - Hidden on mobile, shown on desktop */}
      <div className="hidden md:block">
        {user && <AppHeader user={user} teamStatus={team?.status} />}
      </div>

      {/* Mobile Header */}
      <MobileChatHeader
        team={team}
        isConnected={isConnected}
        onlineCount={getOnlineCount()}
        onBack={() => router.push("/team")}
        onOpenSidebar={() => setIsSidebarOpen(true)}
      />

      {/* Connection Error Banner */}
      {connectionError && (
        <div className="bg-red-500/20 border-b border-red-500/30 px-4 py-2 flex items-center justify-between">
          <span className="text-red-400 text-sm">{connectionError}</span>
          <button
            onClick={() => {
              setConnectionError(null);
              chatSocket.connect();
            }}
            className="text-red-400 hover:text-red-300 text-sm underline"
          >
            إعادة الاتصال
          </button>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden flex-row-reverse lg:flex-row">
        {/* Sidebar - Members List */}
        <MembersSidebar
          members={members}
          currentUserId={user?.id}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Chat Area */}
        <main className="flex flex-1 flex-col relative bg-background-dark overflow-hidden">
          {/* Desktop Chat Header */}
          <DesktopChatHeader team={team} isConnected={isConnected} />

          {/* Chat Feed */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 flex flex-col"
            style={{ contain: "content" }}
          >
            {/* Sentinel for infinite scroll */}
            <div
              ref={loadMoreSentinelRef}
              className="h-1 w-full flex-shrink-0"
            />

            {/* Load more indicator */}
            {isLoadingHistory && (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Date Separator */}
            {messages.length > 0 && (
              <div className="flex justify-center my-4">
                <span className="bg-surface-dark text-text-secondary text-xs px-3 py-1 rounded-full border border-border-dark">
                  {formatDate(
                    messages[0]?.createdAt || new Date().toISOString(),
                  )}
                </span>
              </div>
            )}

            {/* Empty state */}
            {messages.length === 0 && !isLoadingHistory && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center py-12">
                <div className="w-16 h-16 rounded-full bg-surface-dark flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-text-secondary">
                    chat_bubble
                  </span>
                </div>
                <div>
                  <h3 className="text-white font-bold mb-1">
                    لا توجد رسائل بعد
                  </h3>
                  <p className="text-text-secondary text-sm">
                    ابدأ المحادثة وشجع فريقك!
                  </p>
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((message, index) => {
              const isOwnMessage = message.senderId === user?.id;
              const prevMessage = index > 0 ? messages[index - 1] : null;

              const isContinuation =
                prevMessage &&
                prevMessage.senderId === message.senderId &&
                prevMessage.type !== "system" &&
                message.type !== "system" &&
                new Date(message.createdAt).getTime() -
                  new Date(prevMessage.createdAt).getTime() <
                  2 * 60 * 1000;

              const showDateSeparator =
                index > 0 &&
                formatDate(message.createdAt) !==
                  formatDate(messages[index - 1].createdAt);

              return (
                <div key={message.id} id={`msg-${message.id}`}>
                  {showDateSeparator && (
                    <div className="flex justify-center my-4">
                      <span className="bg-surface-dark text-text-secondary text-xs px-3 py-1 rounded-full border border-border-dark">
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                  )}

                  <ChatMessage
                    message={message}
                    isOwnMessage={isOwnMessage}
                    isContinuation={!!isContinuation}
                    onReply={() => handleReply(message)}
                    formatTime={formatTime}
                  />
                </div>
              );
            })}

            {/* Bottom anchor for scroll detection - needs height for IntersectionObserver */}
            <div ref={messagesEndRef} className="h-1 w-full flex-shrink-0" />
          </div>

          {/* Typing indicator - sticky at bottom of messages */}
          {getTypingMembers().length > 0 && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20">
              <TypingIndicator typingMembers={getTypingMembers()} />
            </div>
          )}

          {/* New messages indicator - floating button */}
          {unreadCount > 0 && (
            <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-30">
              <button
                onClick={() => scrollToBottom()}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-background-dark rounded-full shadow-xl hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 font-bold text-sm animate-bounce"
                style={{ animationDuration: "2s" }}
              >
                <span className="material-symbols-outlined text-lg">
                  arrow_downward
                </span>
                {unreadCount}{" "}
                {unreadCount === 1 ? "رسالة جديدة" : "رسائل جديدة"}
              </button>
            </div>
          )}

          {/* Input Area */}
          <ChatInput
            newMessage={newMessage}
            onMessageChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onSend={() => sendMessage()}
            onFileSelect={handleFileSelect}
            textareaRef={textareaRef}
            fileInputRef={fileInputRef}
            isConnected={isConnected}
            isSending={isSending}
            selectedMedia={selectedMedia}
            mediaPreview={mediaPreview}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            onRemoveMedia={removeSelectedMedia}
            replyToMessage={replyToMessage}
            onCancelReply={cancelReply}
            currentUserId={user?.id}
          />
        </main>
      </div>
    </div>
  );
}
