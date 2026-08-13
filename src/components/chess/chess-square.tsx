import type { DragEvent } from "react";
import type { Piece, Square } from "@/lib/chess/chess-engine";
import { pieceLabel } from "@/lib/chess/move-utils";
import { ChessPieceIcon } from "./pieces";
import type { PieceStyle } from "./pieces";

interface ChessSquareProps {
  square: Square;
  piece: Piece | null;
  backgroundColor: string;
  /** Whether the piece on this square may currently be picked up. */
  pickable: boolean;
  interactive: boolean;
  pieceStyle: PieceStyle;
  animations: boolean;
  onSquareClick: (square: Square) => void;
  onDropFrom?: (from: Square, to: Square) => void;
}

/**
 * A single board square: renders its piece and exposes click / drag-and-drop
 * targets. Visual state (selection, legal moves, last move, check) is drawn by
 * the sibling MoveIndicators overlay layer.
 */
export function ChessSquare({
  square,
  piece,
  backgroundColor,
  pickable,
  interactive,
  pieceStyle,
  animations,
  onSquareClick,
  onDropFrom,
}: ChessSquareProps) {
  const label = piece ? `${pieceLabel(piece.color, piece.type)} on ${square}` : `Empty square ${square}`;

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const from = event.dataTransfer.getData("text/plain");
    if (onDropFrom && from) onDropFrom(from as Square, square);
  };

  return (
    <div
      role="button"
      tabIndex={interactive ? 0 : -1}
      aria-label={label}
      data-square={square}
      data-chess-piece={piece ? `${piece.color}:${piece.type}` : "empty"}
      className={`group relative aspect-square select-none outline-none ${
        interactive ? "cursor-pointer focus-visible:ring-2 focus-visible:ring-ring/70" : ""
      }`}
      style={{
        background: backgroundColor,
        touchAction: "manipulation",
      }}
      onClick={() => onSquareClick(square)}
      onKeyDown={(event) => {
        if (interactive && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onSquareClick(square);
        }
      }}
      onDragOver={(event) => {
        if (onDropFrom) event.preventDefault();
      }}
      onDrop={handleDrop}
    >
      <span
        className={`absolute inset-0 ${animations && piece ? "transition-transform duration-150" : ""}`}
        draggable={pickable}
        onDragStart={(event) => {
          if (pickable) event.dataTransfer.setData("text/plain", square);
        }}
      >
        {piece && (
          <ChessPieceIcon
            type={piece.type}
            color={piece.color}
            style={pieceStyle}
            className="absolute inset-0 h-full w-full p-[3%]"
          />
        )}
      </span>
    </div>
  );
}