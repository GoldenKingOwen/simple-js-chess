"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { UserMenu } from "./user-menu";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ConnectionIndicator } from "./connection-indicator";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/play", label: "Play" },
  { href: "/games", label: "Games" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/friends", label: "Friends" },
];

export function AppHeader() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const [mobileOpen, setMobileOpen] = useState(false);

  const authenticated = Boolean(user);

  const isActive = useCallback(
    (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/")),
    [pathname],
  );

  const links = useMemo(
    () =>
      authenticated
        ? NAV
        : [
            { href: "/", label: "Home" },
            { href: "/play", label: "Play" },
            { href: "/leaderboard", label: "Leaderboard" },
          ],
    [authenticated],
  );

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Logo />
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive(link.href) ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ConnectionIndicator className="hidden lg:inline-flex" />
          {authenticated && <NotificationBell />}
          {authenticated ? (
            <UserMenu />
          ) : (
            <>
              <Button render={<Link href="/login" />} variant="ghost" size="sm" className="hidden sm:inline-flex">
                Log in
              </Button>
              <Button render={<Link href="/register" />} size="sm">
                Register
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <nav aria-label="Mobile" className="border-t px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium",
                  isActive(link.href) ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={authenticated ? "/play" : "/register"}
              onClick={() => setMobileOpen(false)}
              className="mt-1 rounded-md border px-3 py-2 text-center text-sm font-semibold"
            >
              {authenticated ? "Quick play" : "Create account"}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}