"use client";

import { OnlineMember } from "./types";

interface MembersSidebarProps {
  members: OnlineMember[];
  currentUserId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function MembersSidebar({
  members,
  currentUserId,
  isOpen,
  onClose,
}: MembersSidebarProps) {
  const onlineCount = members.filter((m) => m.isOnline).length;

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`
          w-80 bg-background-dark border-e border-border-dark flex-col shrink-0
          lg:relative lg:inset-auto lg:transform-none lg:z-auto lg:flex
          ${isOpen ? "fixed inset-y-0 start-0 z-40 flex" : "hidden lg:flex"}
        `}
      >
        {/* Sidebar Header */}
        <div className="p-6 pb-2 border-b border-border-dark lg:border-b-0">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-white text-xl font-bold leading-normal">
                أعضاء الفريق
              </h1>
              <p className="text-text-secondary text-sm">
                {onlineCount} متصل الآن
              </p>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-text-secondary hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-text-secondary text-base">
              groups
            </span>
            <p className="text-text-secondary text-xs font-bold uppercase tracking-wider">
              قائمة الأعضاء
            </p>
          </div>
        </div>

        {/* Members List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1 max-h-[calc(100vh-180px)]">
          {members.map((member) => (
            <div
              key={member.id}
              className={`
                flex items-center gap-3 p-3 rounded-xl
                hover:bg-surface-dark/50 transition-colors cursor-pointer group
                ${!member.isOnline ? "opacity-60" : ""}
              `}
            >
              {/* Avatar with status indicator */}
              <div className="relative">
                {member.avatar ? (
                  <img
                    src={member.avatar}
                    alt={member.nickName}
                    className={`w-10 h-10 rounded-full object-cover ${!member.isOnline ? "grayscale" : ""}`}
                  />
                ) : (
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${member.isOnline ? "bg-primary/20 text-primary" : "bg-surface-dark text-text-secondary"}
                    `}
                  >
                    <span className="material-symbols-outlined text-xl">
                      person
                    </span>
                  </div>
                )}
                {/* Status dot */}
                <span
                  className={`
                    absolute bottom-0 end-0 w-3 h-3 rounded-full border-2 border-background-dark
                    ${member.isOnline ? "bg-primary" : "bg-gray-500"}
                  `}
                />
              </div>

              {/* Member info */}
              <div className="flex flex-col flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {member.nickName}
                  {member.id === currentUserId && (
                    <span className="text-text-secondary text-xs me-1">
                      (أنت)
                    </span>
                  )}
                </p>
                {member.isTyping ? (
                  <p className="text-primary text-xs">يكتب...</p>
                ) : member.isOnline ? (
                  <p className="text-text-secondary text-xs">متصل</p>
                ) : (
                  <p className="text-text-secondary text-xs">غير متصل</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Sidebar Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
}
