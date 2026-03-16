"use client";

import { RefObject } from "react";
import { DisplayMessage } from "./types";

interface ChatInputProps {
  newMessage: string;
  onMessageChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSend: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  textareaRef: RefObject<HTMLInputElement>;
  fileInputRef: RefObject<HTMLInputElement>;
  isConnected: boolean;
  isSending: boolean;
  selectedMedia: File | null;
  mediaPreview: string | null;
  isUploading: boolean;
  uploadProgress: number;
  onRemoveMedia: () => void;
  replyToMessage: DisplayMessage | null;
  onCancelReply: () => void;
  currentUserId?: string;
}

export function ChatInput({
  newMessage,
  onMessageChange,
  onKeyDown,
  onSend,
  onFileSelect,
  textareaRef,
  fileInputRef,
  isConnected,
  isSending,
  selectedMedia,
  mediaPreview,
  isUploading,
  uploadProgress,
  onRemoveMedia,
  replyToMessage,
  onCancelReply,
  currentUserId,
}: ChatInputProps) {
  return (
    <div className="p-3 sm:p-4 bg-background-dark/80 backdrop-blur-lg border-t border-border-dark/50 z-20">
      <div className="flex flex-col gap-2 max-w-4xl mx-auto">
        {/* Reply Preview */}
        {replyToMessage && (
          <div className="flex items-center gap-2 px-3 py-2 bg-surface-dark/80 rounded-2xl border border-border-dark/50 backdrop-blur-sm">
            <div className="w-0.5 h-8 bg-primary rounded-full shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-primary text-xs font-semibold">
                {replyToMessage.senderId === currentUserId
                  ? "أنت"
                  : replyToMessage.senderName}
              </p>
              <p className="text-text-secondary text-xs truncate">
                {replyToMessage.type !== "text"
                  ? replyToMessage.type === "video"
                    ? "🎥 فيديو"
                    : "📷 صورة"
                  : replyToMessage.content || "رسالة"}
              </p>
            </div>
            <button
              onClick={onCancelReply}
              className="p-1 text-text-secondary hover:text-white hover:bg-white/10 rounded-full transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        )}

        {/* Media Preview */}
        {mediaPreview && (
          <div className="relative inline-block">
            {selectedMedia?.type.startsWith("video/") ? (
              <video
                src={mediaPreview}
                className="max-h-24 rounded-xl border border-border-dark/50"
              />
            ) : (
              <img
                src={mediaPreview}
                alt="معاينة"
                className="max-h-24 rounded-xl border border-border-dark/50"
              />
            )}
            {/* Upload progress overlay */}
            {isUploading && (
              <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                <div className="relative w-10 h-10">
                  <svg className="w-10 h-10 -rotate-90" viewBox="0 0 48 48">
                    <circle
                      className="text-white/20"
                      strokeWidth="4"
                      stroke="currentColor"
                      fill="transparent"
                      r="20"
                      cx="24"
                      cy="24"
                    />
                    <circle
                      className="text-primary transition-all duration-150"
                      strokeWidth="4"
                      strokeDasharray={`${uploadProgress * 1.256} 125.6`}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="20"
                      cx="24"
                      cy="24"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold">
                    {uploadProgress}%
                  </span>
                </div>
              </div>
            )}
            {/* Remove button - hide while uploading */}
            {!isUploading && (
              <button
                onClick={onRemoveMedia}
                className="absolute -top-1.5 -end-1.5 w-5 h-5 bg-red-500/90 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors shadow-lg"
              >
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            )}
          </div>
        )}

        {/* Input Field - Modern floating style */}
        <div className="relative flex items-center gap-1.5 bg-surface-dark/60 backdrop-blur-sm border border-border-dark/40 rounded-full px-1.5 transition-all focus-within:border-primary/40 focus-within:bg-surface-dark/80 min-h-[44px]">
          {/* Hidden file input */}
          <input
            id="chat-file-input"
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={onFileSelect}
            className="hidden"
          />

          {/* Attach button */}
          <label
            htmlFor="chat-file-input"
            className="w-9 h-9 flex items-center justify-center text-text-secondary hover:text-primary rounded-full transition-colors shrink-0 cursor-pointer hover:bg-white/5"
            title="إرفاق صورة أو فيديو"
          >
            <span className="material-symbols-outlined text-xl">
              add_circle
            </span>
          </label>

          {/* Text input */}
          <input
            ref={textareaRef}
            type="text"
            value={newMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={isConnected ? "اكتب رسالة..." : "جاري الاتصال..."}
            disabled={!isConnected}
            className="flex-1 bg-transparent border-none text-white placeholder-text-secondary/70 focus:ring-0 focus:outline-none h-[44px] disabled:opacity-50 text-sm"
          />

          {/* Send button */}
          <button
            onClick={onSend}
            disabled={
              isSending ||
              !isConnected ||
              (!newMessage.trim() && !selectedMedia)
            }
            className={`
              w-9 h-9 flex items-center justify-center rounded-full transition-all shrink-0
              ${
                isSending ||
                !isConnected ||
                (!newMessage.trim() && !selectedMedia)
                  ? "text-text-secondary/50 cursor-not-allowed scale-90"
                  : "text-primary hover:bg-primary/10 hover:scale-105 active:scale-95"
              }
            `}
          >
            <span
              className="material-symbols-outlined text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {isSending ? "hourglass_empty" : "send"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
