"use client";

import { Team } from "@/lib/api";

interface ChatHeaderProps {
  team: Team | null;
  isConnected: boolean;
  onlineCount: number;
  onBack: () => void;
  onOpenSidebar: () => void;
}

export function MobileChatHeader({
  team,
  isConnected,
  onlineCount,
  onBack,
  onOpenSidebar,
}: ChatHeaderProps) {
  return (
    <header className="md:hidden flex items-center justify-between border-b border-border-dark bg-background-dark/95 backdrop-blur px-4 py-3 shrink-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 -me-2 text-text-secondary hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h2 className="text-white text-base font-bold leading-tight">
              {team?.teamName || team?.name || "المحادثة"}
            </h2>
            <span
              className={`w-2 h-2 rounded-full ${isConnected ? "bg-primary" : "bg-red-500"}`}
              title={isConnected ? "متصل" : "غير متصل"}
            />
          </div>
          <p className="text-text-secondary text-xs">{onlineCount} متصل الآن</p>
        </div>
      </div>
      <button
        onClick={onOpenSidebar}
        className="p-2 text-text-secondary hover:text-white transition-colors"
      >
        <span className="material-symbols-outlined">group</span>
      </button>
    </header>
  );
}

interface DesktopChatHeaderProps {
  team: Team | null;
  isConnected: boolean;
}

export function DesktopChatHeader({
  team,
  isConnected,
}: DesktopChatHeaderProps) {
  return (
    <div className="hidden md:flex items-center justify-between border-b border-border-dark bg-background-dark/95 backdrop-blur-md px-6 py-4 sticky top-0 z-10">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h2 className="text-white text-xl font-bold leading-tight">
            {team?.habitName || "عادة الفريق"}
          </h2>
          <span className="bg-surface-dark border border-border-dark px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-text-secondary">
            هدف جماعي
          </span>
          <span
            className={`w-2 h-2 rounded-full ${isConnected ? "bg-primary" : "bg-red-500"}`}
            title={isConnected ? "متصل" : "غير متصل"}
          />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-primary font-bold">
            🔥 يوم {team?.currentTeamStreak || 0} من{" "}
            {team?.wantedTeamStreak || 30}
          </span>
          <span className="text-text-secondary">•</span>
          <span className="text-text-secondary">حافظوا على السلسلة!</span>
        </div>
      </div>
    </div>
  );
}
