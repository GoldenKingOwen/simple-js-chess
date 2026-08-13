import { coordinates } from "@/lib/chess/board-utils";

interface BoardCoordinatesProps {
  flipped?: boolean;
  lightColor: string;
  darkColor: string;
  filesClassName?: string;
  ranksClassName?: string;
}

/**
 * Rank (1-8) and file (a-h) coordinate labels. Positioned absolutely around the
 * board edges and colored to contrast with each square tone.
 */
export function BoardCoordinates({
  flipped = false,
  lightColor,
  darkColor,
  filesClassName,
  ranksClassName,
}: BoardCoordinatesProps) {
  const { files, ranks } = coordinates(flipped);

  return (
    <>
      {files.map((file, i) => {
        const isDark = i % 2 === (flipped ? 1 : 0);
        const color = isDark ? darkColor : lightColor;
        return (
          <span
            key={`file-${file}`}
            aria-hidden="true"
            style={{ color, bottom: flipped ? "auto" : "0px", top: flipped ? "0px" : "auto", left: `calc(${(i / 8) * 100}% + 3px)` }}
            className={`pointer-events-none absolute z-10 text-[10px] font-semibold sm:text-xs ${filesClassName ?? ""}`}
          >
            {file}
          </span>
        );
      })}
      {ranks.map((rank, i) => {
        const isDark = (0 + i) % 2 === (flipped ? 0 : 1);
        const color = isDark ? darkColor : lightColor;
        return (
          <span
            key={`rank-${rank}`}
            aria-hidden="true"
            style={{ left: "0px", color }}
            className={`pointer-events-none absolute z-10 top-[calc(${((i / 8) * 100 + 3).toFixed(2)}%)] ml-[3px] text-[10px] font-semibold sm:text-xs ${ranksClassName ?? ""}`}
          >
            {rank}
          </span>
        );
      })}
    </>
  );
}