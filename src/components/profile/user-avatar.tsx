import type { User } from "@/types";

interface UserAvatarProps {
  user?: Pick<User, "username" | "avatarUrl"> | null;
  className?: string;
}

const GRADIENTS = [
  "from-amber-500 to-orange-600",
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-fuchsia-500 to-purple-600",
  "from-rose-500 to-red-600",
  "from-lime-500 to-green-600",
  "from-indigo-500 to-violet-600",
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Avatar rendered from an image URL, or initials on a color derived from the username. */
export function UserAvatar({ user, className }: UserAvatarProps) {
  if (user?.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatarUrl}
        alt={`${user.username}'s avatar`}
        className={`overflow-hidden rounded-full object-cover ${className ?? "h-8 w-8"}`}
      />
    );
  }
  const name = user?.username ?? "?";
  const initials = name.slice(0, 2).toUpperCase();
  const gradient = GRADIENTS[hashString(name) % GRADIENTS.length];
  return (
    <span
      aria-hidden="true"
      className={`inline-flex overflow-hidden rounded-full bg-gradient-to-br ${gradient} align-middle font-semibold text-white ${className ?? "h-8 w-8 text-xs"}`}
    >
      <span className="m-auto">{initials}</span>
    </span>
  );
}