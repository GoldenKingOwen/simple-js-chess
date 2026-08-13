"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Search, Swords, UserMinus, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/profile/user-avatar";
import { friendService } from "@/services/friend-service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function FriendsClient() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: friends, isLoading } = useQuery({
    queryKey: ["friends", "list"],
    queryFn: () => friendService.getFriends(),
  });

  const { data: requests } = useQuery({
    queryKey: ["friends", "requests"],
    queryFn: () => friendService.getPendingRequests(),
  });

  const { data: results, isFetching: searching } = useQuery({
    queryKey: ["players", "search", searchQuery],
    queryFn: () => friendService.searchPlayers(searchQuery),
    enabled: searchQuery.length > 0,
  });

  const onSearchChange = (value: string) => {
    setSearch(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setSearchQuery(value.trim()), 300);
  };

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["friends"] });
  };

  const respondMutation = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) => friendService.respondFriendRequest(id, accept),
    onSuccess: () => {
      toast.success("Request handled");
      invalidate();
    },
  });

  const sendMutation = useMutation({
    mutationFn: (userId: string) => friendService.sendFriendRequest(userId),
    onSuccess: () => {
      toast.success("Friend request sent");
      void queryClient.invalidateQueries({ queryKey: ["players"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => friendService.removeFriend(userId),
    onSuccess: () => {
      toast.success("Friend removed");
      invalidate();
    },
  });

  const onlineCount = friends?.filter((friend) => friend.user.status !== "offline").length ?? 0;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Friends</h1>
        <p className="mt-1 text-muted-foreground">
          {friends?.length ?? 0} friends · {onlineCount} online
        </p>
      </div>

      <Tabs defaultValue="friends">
        <TabsList className="mb-4">
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="requests">
            Requests
            {requests && requests.length > 0 && (
              <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{requests.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="search">Add friends</TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-1">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : friends?.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                You have no friends yet. Add some on the search tab!
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <ul className="divide-y">
                  {friends?.map((friend) => (
                    <li key={friend.user.id} className="flex items-center gap-3 px-4 py-3">
                      <Link href={`/profile/${friend.user.username}`} className="flex min-w-0 flex-1 items-center gap-3">
                        <UserAvatar user={friend.user} className="h-10 w-10 text-sm" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">{friend.user.username}</span>
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span
                              className={cn(
                                "h-2 w-2 rounded-full",
                                friend.user.status === "online" && "bg-emerald-500",
                                friend.user.status === "in-game" && "bg-amber-500",
                                friend.user.status === "offline" && "bg-muted-foreground/40",
                              )}
                            />
                            {friend.user.status === "online" ? "Online" : friend.user.status === "in-game" ? "In game" : "Offline"} ·{" "}
                            {friend.user.rating}
                          </span>
                        </span>
                      </Link>
                      <div className="flex items-center gap-1.5">
                        <Button variant="outline" size="sm" render={<Link href="/play/online" />}>
                          <Swords className="h-3.5 w-3.5" aria-hidden="true" /> Challenge
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => removeMutation.mutate(friend.user.id)}
                          aria-label={`Remove ${friend.user.username}`}
                        >
                          <UserMinus className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="requests">
          {requests?.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">No pending requests.</CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <ul className="divide-y">
                  {requests?.map((request) => (
                    <li key={request.id} className="flex items-center gap-3 px-4 py-3">
                      <UserAvatar user={request.sender} className="h-10 w-10 text-sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{request.sender.username}</p>
                        <p className="text-xs text-muted-foreground">{request.sender.rating} rating</p>
                      </div>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => respondMutation.mutate({ id: request.id, accept: true })}
                        disabled={respondMutation.isPending}
                      >
                        <Check className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => respondMutation.mutate({ id: request.id, accept: false })}
                        disabled={respondMutation.isPending}
                      >
                        <X className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Decline
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle>Find players</CardTitle>
              <CardDescription>Search by username and send a friend request.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder="Search players…"
                  value={search}
                  onChange={(event) => onSearchChange(event.target.value)}
                  className="pl-9"
                />
              </div>
              <Separator />
              {searching && (
                <p className="flex items-center gap-2 py-6 text-center text-sm text-muted-foreground">
                  <Search className="h-4 w-4 animate-pulse" aria-hidden="true" /> Searching…
                </p>
              )}
              {!searching && searchQuery && results?.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">No players found for “{searchQuery}”.</p>
              )}
              {!searching && searchQuery && results && results.length > 0 && (
                <ul className="divide-y">
                  {results.map((player) => (
                    <li key={player.id} className="flex items-center gap-3 py-2.5">
                      <Link href={`/profile/${player.username}`} className="flex min-w-0 flex-1 items-center gap-2.5">
                        <UserAvatar user={player} className="h-8 w-8 text-xs" />
                        <span className="truncate text-sm font-medium">{player.username}</span>
                        <span className="text-xs text-muted-foreground">{player.rating}</span>
                      </Link>
                      <Button variant="outline" size="sm" onClick={() => sendMutation.mutate(player.id)} disabled={sendMutation.isPending}>
                        <UserPlus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Add friend
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              {!searchQuery && (
                <p className="py-6 text-center text-sm text-muted-foreground">Start typing to find players to add.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}