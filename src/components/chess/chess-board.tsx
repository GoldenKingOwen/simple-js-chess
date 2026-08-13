"use client";

import { useCallback, useMemo, useState } from "react";
import { ChessEngine } from "@/lib/chess/chess-engine";
import type { Color, PieceSymbol, Square } from "@/lib/chess/chess-engine";
import { isDarkSquare, legalMovesMap, renderBoard } from "@/lib/chess/board-utils";
import type { BoardThemeId, PieceStyleId } from "@/config/board-themes";
import { DEFAULT_OVERLAYS, getBoardTheme } from "@/config/board-themes";
import { isCapture } from "@/lib/chess/move-utils";
import { ChessSquare } from "./chess-square";
import { BoardCoordinates } from "./board-coordinates";
import { MoveIndicators } from "./move-indicators";
import type { IndicatorCell } from "./move-indicators";
import { PromotionDialog } from "./promotion-dialog";
import type { PieceStyle } from "./pieces";

export type BoardInteraction = "play" | "white-only" | "black-only" | "none" | "spectator";

export interface ResolvedMove {
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
}

interface ChessBoardProps {
  /** FEN of the position to display. */
  fen: string;
  flipped?: boolean;
  /**
   * Who may interact:
   * - "play": whoever is to move (local / both sides)
   * - "white-only" / "black-only": one online player
   * - "spectator" / "none": read-only (replays, finished games)
   */
  interaction?: BoardInteraction;
  boardThemeId?: BoardThemeId;
  pieceStyle?: PieceStyleId;
  showCoordinates?: boolean;
  showLegalMoves?: boolean;
  highlightLastMove?: boolean;
  highlightCheck?: boolean;
  animations?: boolean;
  autoQueen?: boolean;
  lastMove?: { from: string; to: string } | null;
  /** Called when the user resolves a move. Supports drag & drop and clicks. */
  onMove?: (move: ResolvedMove) => boolean | void;
  className?: string;
}

/**
 * The main interactive chess board. Renders an 8×8 board from a FEN, supports
 * click-to-move, drag & drop, legal-move indicators, capture rings, last-move
 * and check highlighting, board coordinates and promotion.
 *
 * All chess logic lives behind the `ChessEngine` abstraction; this component
 * only orchestrates interaction.
 */
export function ChessBoard({
  fen,
  flipped = false,
  interaction = "play",
  boardThemeId,
  pieceStyle,
  showCoordinates = true,
  showLegalMoves = true,
  highlightLastMove = true,
  highlightCheck = true,
  animations = true,
  autoQueen = false,
  lastMove,
  onMove,
  className,
}: ChessBoardProps) {
  const [selected, setSelected] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<ResolvedMove | null>(null);

  const theme = getBoardTheme(boardThemeId ?? "green");
  const style: PieceStyle = pieceStyle ?? "standard";

  const engine = useMemo(() => new ChessEngine(fen), [fen]);

  const turn = engine.turn();
  const canInteract =
    interaction === "play" || interaction === "white-only" || interaction === "black-only";

  const board = useMemo(() => engine.board(), [engine]);
  const displayRows = useMemo(() => renderBoard(board, flipped), [board, flipped]);

  const legalTargets = useMemo(() => {
    if (!selected) return new Map<string, { to: Square; flags: string; captured?: string }>();
    return legalMovesMap(engine, selected);
  }, [engine, selected]);

  const checkSquare = useMemo(() => {
    if (!highlightCheck) return null;
    return engine.kingSquareInCheck();
  }, [engine, highlightCheck]);

  const requiresPromotion = useCallback(
    (from: Square, to: Square): boolean => {
      return engine
        .movesBySquare(from)
        .some((move) => move.piece === "p" && move.to === to && move.promotion !== undefined);
    },
    [engine],
  );

  const attemptMove = useCallback(
    (from: Square, to: Square) => {
      const target = legalTargets.get(to);
      if (!target || !onMove) return;
      setSelected(null);
      if (requiresPromotion(from, to)) {
        if (autoQueen) {
          onMove({ from, to, promotion: "q" });
        } else {
          setPendingPromotion({ from, to });
        }
      } else {
        onMove({ from, to });
      }
    },
    [legalTargets, onMove, requiresPromotion, autoQueen],
  );

  const handleSquareClick = useCallback(
    (square: Square) => {
      if (!canInteract) return;
      const piece = engine.get(square);
      if (selected) {
        if (legalTargets.has(square)) {
          attemptMove(selected, square);
          return;
        }
        if (piece && piece.color === turn) {
          setSelected(square);
          return;
        }
        setSelected(null);
        return;
      }
      if (piece && piece.color === turn) {
        setSelected(square);
      }
    },
    [canInteract, engine, selected, legalTargets, attemptMove, turn],
  );

  const handleDrop = useCallback(
    (from: string, to: string) => {
      if (!canInteract || !selected) return;
      if (from === selected && legalTargets.has(to)) {
        attemptMove(selected, to as Square);
      }
    },
    [canInteract, selected, legalTargets, attemptMove],
  );

  const cells: IndicatorCell[] = useMemo(() => {
    const result: IndicatorCell[] = [];
    for (const row of displayRows) {
      for (const cell of row) {
        const square = cell.square as Square;
        const target = legalTargets.get(square);
        const isLast = highlightLastMove && lastMove ? lastMove.from === square || lastMove.to === square : false;
        result.push({
          square,
          isTarget: showLegalMoves && target !== undefined,
          isCaptureTarget: target ? isCapture(target.flags) : false,
          isSelected: selected === square,
          isLastMove: isLast,
          isCheck: checkSquare === square,
        });
      }
    }
    return result;
  }, [displayRows, legalTargets, selected, lastMove, highlightLastMove, showLegalMoves, checkSquare]);

  const selectableColors: Color[] =
    interaction === "play" ? [turn] : interaction === "white-only" ? ["w"] : interaction === "black-only" ? ["b"] : [];

  const hasOverlays = showLegalMoves || lastMove || selected || checkSquare;

  return (
    <div className={`relative w-full ${className ?? ""}`} style={{ aspectRatio: "1 / 1" }}>
      <div className="grid h-full w-full grid-cols-8 grid-rows-8 overflow-hidden rounded-sm shadow-2xl">
        {displayRows.map((row) =>
          row.map((cell) => {
            const square = cell.square as Square;
            const isLight = !isDarkSquare(square);
            const piece = cell.piece;
            const pickable = piece !== null && selectableColors.includes(piece.color) && canInteract;
            return (
              <ChessSquare
                key={square}
                square={square}
                piece={piece as import("@/lib/chess/chess-engine").Piece | null}
                backgroundColor={isLight ? theme.light : theme.dark}
                pickable={pickable}
                interactive={canInteract}
                pieceStyle={style}
                animations={animations}
                onSquareClick={handleSquareClick}
                onDropFrom={handleDrop}
              />
            );
          }),
        )}
      </div>

      {showCoordinates && <BoardCoordinates flipped={flipped} lightColor={theme.light} darkColor={theme.dark} />}

      {hasOverlays && <MoveIndicators cells={cells} overlays={DEFAULT_OVERLAYS} />}

      <PromotionDialog
        open={pendingPromotion !== null}
        color={pendingPromotion ? (engine.get(pendingPromotion.from)?.color ?? "w") : "w"}
        style={style}
        onSelect={(promotion) => {
          if (pendingPromotion) onMove?.({ ...pendingPromotion, promotion });
          setPendingPromotion(null);
        }}
        onCancel={() => setPendingPromotion(null)}
      />
    </div>
  );
}