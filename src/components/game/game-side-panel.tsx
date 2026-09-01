"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoveList } from "./move-list";
import { ChatPanel } from "@/components/chat/chat-panel";
import { NotesPanel } from "@/components/notes/notes-panel";
import type { EngineMove } from "@/lib/chess/chess-engine";
import type { ChatMessage } from "@/types";

interface GameSidePanelProps {
  moves: EngineMove[];
  activeIndex?: number | null;
  onSelectMove?: (index: number) => void;
  gameId: string;
  chat?: {
    messages: ChatMessage[];
    selfId: string;
    disabled?: boolean;
    onSend?: (body: string) => void;
    loading?: boolean;
    error?: string | null;
    connecting?: boolean;
  };
  defaultTab?: "moves" | "chat" | "notes";
  /** Live-updating ECO opening label rendered above the tabs. */
  opening?: { eco: string; name: string } | null;
  className?: string;
}

/**
 * Right-hand side panel for the game screen: Moves / Chat / Notes tabs.
 * On mobile this panel is typically rendered inside a drawer or below the board.
 */
export function GameSidePanel({
  moves,
  activeIndex,
  onSelectMove,
  gameId,
  chat,
  opening,
  defaultTab = "moves",
  className,
}: GameSidePanelProps) {
  return (
    <Tabs defaultValue={defaultTab} className={className}>
      {opening && (
        <p
          className="mb-1 truncate px-1 text-xs text-muted-foreground"
          title={`${opening.name} (${opening.eco})`}
          data-testid="opening-label"
        >
          <span className="font-medium text-foreground">{opening.name}</span>{" "}
          <span className="tabular-nums">({opening.eco})</span>
        </p>
      )}
      <TabsList className="w-full">
        <TabsTrigger value="moves" className="flex-1">Moves</TabsTrigger>
        <TabsTrigger value="chat" className="flex-1">Chat</TabsTrigger>
        <TabsTrigger value="notes" className="flex-1">Notes</TabsTrigger>
      </TabsList>
      <TabsContent value="moves" className="h-[calc(100%-2.5rem)] data-[state=active]:flex">
        <MoveList
          moves={moves}
          activeIndex={activeIndex}
          onSelectMove={onSelectMove}
          className="h-full"
        />
      </TabsContent>
      <TabsContent value="chat" className="h-[calc(100%-2.5rem)] data-[state=active]:flex">
        <ChatPanel
          messages={chat?.messages ?? []}
          selfId={chat?.selfId ?? "me"}
          disabled={chat?.disabled}
          onSend={chat?.onSend}
          loading={chat?.loading}
          error={chat?.error}
          connecting={chat?.connecting}
          className="h-full w-full"
        />
      </TabsContent>
      <TabsContent value="notes" className="h-[calc(100%-2.5rem)] data-[state=active]:flex">
        <NotesPanel key={gameId} storageKey={`game:${gameId}`} className="h-full w-full" />
      </TabsContent>
    </Tabs>
  );
}