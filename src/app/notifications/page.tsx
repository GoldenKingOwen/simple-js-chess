import type { Metadata } from "next";
import { NotificationsClient } from "./notifications-client";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Your recent activity and alerts.",
  robots: { index: false },
};

export default function NotificationsPage() {
  return <NotificationsClient />;
}