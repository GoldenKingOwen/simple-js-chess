import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { PieceSymbol } from "@/lib/chess/chess-engine";
import { ChessPieceIcon } from "./pieces";
import type { PieceStyle } from "./pieces";

const PROMOTION_PIECES: PieceSymbol[] = ["q", "r", "b", "n"];

interface PromotionDialogProps {
  /** Color of the pawn being promoted. */
  color: "w" | "b";
  style?: PieceStyle;
  open: boolean;
  onSelect: (piece: PieceSymbol) => void;
  onCancel?: () => void;
}

/**
 * Modal presented when a pawn reaches the 8th (white) or 1st (black) rank.
 * Accessible, keyboard friendly (ESC cancels) and click/tap-focused.
 */
export function PromotionDialog({ color, style, open, onSelect, onCancel }: PromotionDialogProps) {
  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 p-4 backdrop-blur-sm"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label="Choose promotion piece"
    >
      <motion.div
        initial={{ scale: 0.92, y: 8 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="w-full max-w-md rounded-xl border bg-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Promote pawn</h2>
          <ChessPieceIcon type="p" color={color} style="standard" className="h-8 w-8" />
        </div>
        <div className="grid grid-cols-4 gap-3">
          {PROMOTION_PIECES.map((piece) => (
            <button
              key={piece}
              type="button"
              onClick={() => onSelect(piece)}
              className="flex aspect-square items-center justify-center rounded-lg border bg-accent/30 p-2 transition hover:border-primary hover:bg-accent"
              aria-label={`Promote to ${piece === "q" ? "queen" : piece === "r" ? "rook" : piece === "b" ? "bishop" : "knight"}`}
            >
              <ChessPieceIcon type={piece} color={color} style={style} className="h-full w-full" />
            </button>
          ))}
        </div>
        <div className="mt-3 flex justify-center">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <ChevronDown className="h-3 w-3" aria-hidden="true" />
            Choose a piece to complete the move
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}