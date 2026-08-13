import type { Metadata } from "next";
import { FriendsClient } from "./friends-client";

export const metadata: Metadata = {
  title: "Friends",
  description: "Manage your friends on Chess Arena.",
};

export default function FriendsPage() {
  return <FriendsClient />;
}