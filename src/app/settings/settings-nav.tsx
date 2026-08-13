"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gamepad2, Paintbrush, Shield, User } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/settings/account", label: "Account", icon: User },
  { href: "/settings/appearance", label: "Appearance", icon: Paintbrush },
  { href: "/settings/game", label: "Game", icon: Gamepad2 },
  { href: "/settings/privacy", label: "Privacy", icon: Shield },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex w-full flex-wrap gap-1 md:w-44 md:flex-col" aria-label="Settings sections">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            <link.icon className="h-4 w-4" aria-hidden="true" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}