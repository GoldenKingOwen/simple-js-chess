import type { Metadata } from "next";
import { ProfileClient } from "./profile-client";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${username}'s profile`,
    description: `Chess profile and statistics for ${username}.`,
  };
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <ProfileClient username={username} />;
}