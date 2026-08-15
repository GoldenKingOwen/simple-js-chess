import { describe, expect, it } from "vitest";
import { mapUser } from "@/lib/api/adapters";
import { toFriend, toFriendRequest } from "./friend-service";

/**
 * Fixtures captured from the live Render backend (chess-backend-ei5u).
 * These document the exact wire shapes the real services must handle, so a
 * change in the backend contract or a regression in the adapters fails fast.
 */

const PUBLIC_USER = {
  id: "cmsumnwmr0000fc38k04vwxsk",
  username: "demo_knight01",
  avatar: null,
  bio: null,
  isBot: false,
  createdAt: "2026-08-15T17:06:07.731Z",
  lastSeenAt: "2026-08-15T17:06:07.731Z",
  presence: "OFFLINE",
};

const FRIEND_ITEM = {
  friendshipId: "cmsump1fw0009fc3887phut84",
  friend: {
    id: "cmsumo3qa0004fc38gf2eyu6o",
    username: "demo_rook02",
    avatar: null,
    bio: null,
    isBot: false,
    createdAt: "2026-08-15T17:06:16.931Z",
    lastSeenAt: "2026-08-15T17:06:16.931Z",
    presence: "OFFLINE",
  },
  since: "2026-08-15T17:07:00.620Z",
};

const REQUEST_ITEM = {
  id: "cmsump1fw0009fc3887phut84",
  from: PUBLIC_USER,
  createdAt: "2026-08-15T17:07:00.620Z",
};

describe("backend wire format → frontend types", () => {
  it("maps public user objects (avatar + presence, no rating)", () => {
    const user = mapUser(PUBLIC_USER);
    expect(user.id).toBe("cmsumnwmr0000fc38k04vwxsk");
    expect(user.username).toBe("demo_knight01");
    expect(user.avatarUrl).toBeNull();
    expect(user.rating).toBe(1200); // backend omits rating on public users
    expect(user.status).toBe("offline");
    expect(user.createdAt).toBe("2026-08-15T17:06:07.731Z");
  });

  it("maps a friends-list item ({ friendshipId, friend, since })", () => {
    const friend = toFriend(FRIEND_ITEM);
    expect(friend.user.id).toBe("cmsumo3qa0004fc38gf2eyu6o");
    expect(friend.user.username).toBe("demo_rook02");
    expect(friend.since).toBe("2026-08-15T17:07:00.620Z");
  });

  it("maps a friend-request item ({ id, from, createdAt })", () => {
    const request = toFriendRequest(REQUEST_ITEM);
    expect(request.id).toBe("cmsump1fw0009fc3887phut84");
    expect(request.sender.username).toBe("demo_knight01");
    expect(request.status).toBe("pending");
    expect(request.createdAt).toBe("2026-08-15T17:07:00.620Z");
  });

  it("falls back to the record itself when the nested key is missing", () => {
    const bare = toFriend({ id: "u-1", username: "direct_friend", rating: 1500 });
    expect(bare.user.username).toBe("direct_friend");
    expect(bare.user.rating).toBe(1500);

    const flat = toFriendRequest({ ...REQUEST_ITEM, from: undefined, username: "flat_user", id: "req-x" });
    expect(flat.sender.username).toBe("flat_user");
    expect(flat.id).toBe("req-x");
  });
});
