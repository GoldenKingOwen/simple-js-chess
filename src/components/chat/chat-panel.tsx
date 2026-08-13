"use client";

import { useEffect, useRef, useState } from "react";
import { Send, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/profile/user-avatar";
import type { ChatMessage } from "@/types";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  messages: ChatMessage[];
  /** Who is this client sending as. */
  selfId: string;
  /** Whether chat is currently unavailable (e.g. sockets down). */
  disabled?: boolean;
  onSend?: (body: string) => void;
  loading?: boolean;
  error?: string | null;
  /** Show a "connecting" placeholder when the web socket isn't ready. */
  connecting?: boolean;
  className?: string;
}

const MAX_LENGTH = 500;

/**
 * In-game chat. Renders message history with avatars, timestamps and system
 * messages; prepared for the future Socket.IO gateway (events are centralized
 * in `lib/socket`). No chat persistence lives in the frontend.
 */
export function ChatPanel({
  messages,
  selfId,
  disabled,
  onSend,
  loading,
  error,
  connecting,
  className,
}: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const [sendState, setSendState] = useState<"idle" | "sending">("idle");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const handleSend = () => {
    const body = draft.trim();
    if (!body || disabled || sendState === "sending") return;
    setDraft("");
    setSendState("sending");
    onSend?.(body);
    // Reset immediately; a real onSend would await the socket ack.
    window.setTimeout(() => {
      setSendState("idle");
      bottomRef.current?.scrollIntoView({ block: "end" });
    }, 250);
  };

  const canSend = Boolean(onSend) && !disabled;

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-2 p-3">
          {connecting && (
            <p className="rounded-md bg-muted/40 px-3 py-2 text-center text-xs text-muted-foreground">
              Connecting to chat…
            </p>
          )}
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </div>
          )}
          {loading ? (
            <p className="p-4 text-center text-sm text-muted-foreground">Loading messages…</p>
          ) : messages.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              No messages yet. Say hello!
            </p>
          ) : (
            messages.map((message) =>
              message.kind === "system" ? (
                <p
                  key={message.id}
                  className="self-center rounded-full bg-muted/50 px-3 py-1 text-center text-xs text-muted-foreground"
                >
                  {message.body}
                </p>
              ) : (
                <div
                  key={message.id}
                  className={cn("flex items-end gap-2", message.senderId === selfId && "flex-row-reverse")}
                  data-testid="chat-message"
                >
                  <UserAvatar
                    user={{ username: message.senderUsername, avatarUrl: message.senderAvatarUrl }}
                    className="h-6 w-6 shrink-0 text-[9px]"
                  />
                  <div className={cn("max-w-[78%]", message.senderId === selfId && "text-right")}>
                    <div
                      className={cn(
                        "inline-block rounded-2xl px-3 py-1.5 text-sm",
                        message.senderId === selfId ? "bg-primary text-primary-foreground" : "bg-muted",
                      )}
                    >
                      {message.body}
                    </div>
                    <div className="mt-0.5 px-1 text-[10px] text-muted-foreground">
                      {message.senderUsername} · {timeAgo(message.timestamp)}
                    </div>
                  </div>
                </div>
              ),
            )
          )}
          <div ref={bottomRef} aria-hidden="true" />
        </div>
      </ScrollArea>

      <div className="flex items-center gap-2 border-t p-2">
        <Input
          value={draft}
          onChange={(event) => {
            if (event.target.value.length <= MAX_LENGTH) {
              setDraft(event.target.value);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSend();
            }
          }}
          placeholder={disabled ? "Chat unavailable" : "Type a message…"}
          aria-label="Chat message"
          disabled={!canSend}
          maxLength={MAX_LENGTH}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!canSend || !draft.trim() || sendState === "sending"}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}