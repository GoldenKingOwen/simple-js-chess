"use client";

import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface PgnPanelProps {
  pgn: string;
  filename?: string;
  className?: string;
}

/**
 * View / copy / download the game PGN. The backend is the authoritative PGN
 * source for online games; this panel just serializes what the client holds.
 */
export function PgnPanel({ pgn, filename = "game", className }: PgnPanelProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pgn);
      setCopied(true);
      toast.success("PGN copied to clipboard");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy PGN");
    }
  };

  const download = () => {
    const blob = new Blob([pgn], { type: "application/x-chess-pgn" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${filename.replace(/[^\w-]/g, "_")}.pgn`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`flex h-full min-h-0 flex-col ${className ?? ""}`}>
      <div className="flex items-center gap-1.5 px-3 pb-1 pt-2">
        <Button variant="ghost" size="xs" onClick={copy} aria-label="Copy PGN">
          {copied ? <Check className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="mr-1 h-3.5 w-3.5" aria-hidden="true" />}
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button variant="ghost" size="xs" onClick={download} aria-label="Download PGN">
          <Download className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Download
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <pre className="whitespace-pre-wrap break-words p-3 font-mono text-xs leading-relaxed text-muted-foreground">
          {pgn || "No moves recorded yet."}
        </pre>
      </ScrollArea>
    </div>
  );
}