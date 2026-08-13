"use client";

import { useState } from "react";
import {
  Flag,
  Handshake,
  RefreshCw,
  Repeat,
  RotateCcw,
  Settings2,
  Volume2,
  VolumeX,
  DoorOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface GameControlsProps {
  onResign?: () => void;
  onOfferDraw?: () => void;
  onAcceptDraw?: () => void;
  onDeclineDraw?: () => void;
  drawOffered?: boolean;
  drawReceived?: boolean;
  onFlipBoard?: () => void;
  onSettings?: () => void;
  onNewGame?: () => void;
  onTakeback?: () => void;
  onLeave?: () => void;
  soundOn: boolean;
  onToggleSound?: () => void;
  gameOver?: boolean;
  className?: string;
}

/**
 * In-game action bar: resign / draw / flip / settings / sound / leave.
 * Destructive actions (resign, leave) require confirmation.
 */
export function GameControls({
  onResign,
  onOfferDraw,
  onAcceptDraw,
  onDeclineDraw,
  drawOffered,
  drawReceived,
  onFlipBoard,
  onSettings,
  onNewGame,
  onTakeback,
  onLeave,
  soundOn,
  onToggleSound,
  gameOver,
  className,
}: GameControlsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)} role="group" aria-label="Game controls">
      {!gameOver && (
        <>
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogTrigger
              render={<Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10" aria-label="Resign game" disabled={!onResign}>
                <Flag className="h-4 w-4" aria-hidden="true" />
              </Button>}
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Resign?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to resign? The game will end and your opponent wins.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setConfirmOpen(false);
                    onResign?.();
                  }}
                >
                  Resign
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {drawReceived ? (
            <>
              <Button variant="secondary" size="sm" onClick={onAcceptDraw}>
                <Handshake className="mr-1 h-4 w-4" aria-hidden="true" /> Accept draw
              </Button>
              <Button variant="outline" size="sm" onClick={onDeclineDraw}>
                Decline
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="icon"
              onClick={onOfferDraw}
              disabled={!onOfferDraw || Boolean(drawOffered)}
              aria-label={drawOffered ? "Draw offered" : "Offer draw"}
              data-active={Boolean(drawOffered)}
              className={drawOffered ? "border-primary text-primary" : ""}
            >
              <Handshake className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}

          {onTakeback && (
            <Button variant="outline" size="icon" onClick={onTakeback} aria-label="Take back move">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </>
      )}

      {onFlipBoard && (
        <Button variant="outline" size="icon" onClick={onFlipBoard} aria-label="Flip board">
          <Repeat className="h-4 w-4" aria-hidden="true" />
        </Button>
      )}
      {onToggleSound && (
        <Button variant="outline" size="icon" onClick={onToggleSound} aria-label={soundOn ? "Mute sound" : "Unmute sound"}>
          {soundOn ? <Volume2 className="h-4 w-4" aria-hidden="true" /> : <VolumeX className="h-4 w-4" aria-hidden="true" />}
        </Button>
      )}
      {onSettings && (
        <Button variant="outline" size="icon" onClick={onSettings} aria-label="Game settings">
          <Settings2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      )}

      {gameOver && onNewGame && (
        <Button size="sm" onClick={onNewGame}>
          <RefreshCw className="mr-1 h-4 w-4" aria-hidden="true" /> New game
        </Button>
      )}

      {onLeave && (
        <AlertDialog>
          <AlertDialogTrigger
            render={<Button variant="outline" size="icon" aria-label="Leave game">
              <DoorOpen className="h-4 w-4" aria-hidden="true" />
            </Button>}
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Leave game?</AlertDialogTitle>
              <AlertDialogDescription>You will be returned to the play menu. This counts as a loss in rated games.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onLeave}>Leave game</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}