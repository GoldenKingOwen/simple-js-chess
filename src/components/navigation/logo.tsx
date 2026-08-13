import Link from "next/link";
import type { LucideProps } from "lucide-react";

function LogoMark(props: LucideProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="6" r="1.6" />
      <path d="M12 7.5 10.8 11h2.4L12 7.5Z" fill="currentColor" stroke="none" />
      <path d="M9.5 11c1.6 1 4 1 5.5 0l2.5 4h-10.5l2.5-4Z" />
      <path d="M10 15h4" />
      <path d="M6 20h12l-1.5-2h-9L6 20Z" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`group flex items-center gap-2 font-semibold tracking-tight ${className ?? ""}`}
      aria-label="Chess Arena home"
    >
      <LogoMark className="h-7 w-7 text-primary transition-transform group-hover:scale-110" />
      <span className="text-lg">
        Chess<span className="text-primary">Arena</span>
      </span>
    </Link>
  );
}