import { TeamMember } from "@/lib/api";

export interface ReplyTo {
  id: string;
  senderName: string;
  content: string | null;
  type: "text" | "image" | "video";
}

export interface DisplayMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  content: string | null;
  type: "text" | "image" | "video" | "system";
  systemMessageType?: string | null;
  mediaUrl?: string;
  createdAt: string;
  isOptimistic?: boolean;
  replyTo?: ReplyTo | null;
}

export interface OnlineMember extends TeamMember {
  isOnline: boolean;
  isTyping: boolean;
}
