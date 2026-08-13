export type ChatMessageKind = "chat" | "system" | "move" | "status";

export interface ChatMessage {
  id: string;
  gameId: string;
  senderId: string;
  senderUsername: string;
  senderAvatarUrl: string | null;
  body: string;
  kind: ChatMessageKind;
  timestamp: string;
}

export interface SendChatMessageInput {
  gameId: string;
  body: string;
}

export interface ChatPage {
  messages: ChatMessage[];
  nextCursor: string | null;
}