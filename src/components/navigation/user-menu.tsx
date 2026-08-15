"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Settings, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/profile/user-avatar";
import { useAuthStore } from "@/stores/auth-store";
import { authService } from "@/services/auth-service";
import { disconnectSocket } from "@/lib/socket/socket-client";

export function UserMenu() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  if (!user) return null;

  const handleLogout = () => {
    // Revoke the refresh cookie on the backend, then drop the local session.
    authService.logout().catch(() => undefined);
    disconnectSocket();
    logout();
    router.push("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="gap-2 px-2"
            aria-label="Account menu"
          />
        }
      >
        <UserAvatar user={user} className="h-7 w-7" />
        <span className="hidden max-w-[8rem] truncate text-sm font-medium sm:inline">{user.username}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="truncate font-semibold">{user.username}</span>
              <span className="text-xs font-normal text-muted-foreground">
                Rating {user.rating}
                {user.title ? ` · ${user.title}` : ""}
              </span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href={`/profile/${user.username}`} />}>
          <UserIcon className="mr-2 h-4 w-4" aria-hidden="true" /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/settings/account" />}>
          <Settings className="mr-2 h-4 w-4" aria-hidden="true" /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Base UI's Menu.Item fires onClick — onSelect is a Radix-ism that
            never fires here, so the handler must use onClick. */}
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" aria-hidden="true" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}