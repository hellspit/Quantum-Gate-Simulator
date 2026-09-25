import type { CSSProperties } from "react";

export type IconName =
  | "circuit"
  | "library"
  | "arrow"
  | "play"
  | "undo"
  | "redo"
  | "plus"
  | "minus"
  | "trash"
  | "download"
  | "chevron"
  | "search"
  | "close"
  | "check"
  | "expand"
  | "reset"
  | "info";
const paths: Record<IconName, string> = {
  circuit:
    "M3 6h5m6 0h7M3 12h11m4 0h3M3 18h5m6 0h7M8 3h6v6H8zM14 9h4v6h-4zM8 15h6v6H8z",
  library: "M4 4h4v16H4zM11 4h3v16h-3zM17 4l3-1 4 16-3 1z",
  arrow: "M4 12h15m-6-6 6 6-6 6",
  play: "m8 5 11 7-11 7Z",
  undo: "M8 4 3 9l5 5M3 9h11a6 6 0 0 1 0 12",
  redo: "m16 4 5 5-5 5m5-5H10a6 6 0 0 0 0 12",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  trash: "M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7",
  download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
  chevron: "m9 5 7 7-7 7",
  search: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  close: "m6 6 12 12M6 18 18 6",
  check: "m5 12 4 4L19 6",
  expand:
    "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M3 3l6 6m12-6-6 6M3 21l6-6m12 6-6-6",
  reset: "M3 4v6h6M3 10a9 9 0 1 1 1 8",
  info: "M12 11v6m0-11v1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
};
export default function Icon({
  name,
  size = 18,
  style,
}: {
  name: IconName;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      <path d={paths[name]} />
    </svg>
  );
}
