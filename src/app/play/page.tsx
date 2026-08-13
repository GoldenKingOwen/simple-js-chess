import type { Metadata } from "next";
import Link from "next/link";
import { Bot, MonitorPlay, Swords, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Play",
  description: "Play chess online, against the bot or on your own device.",
};

const MODES = [
  {
    href: "/play/online",
    icon: Swords,
    title: "Quick play",
    description: "Find an opponent online. Rated and casual games from bullet to classical.",
    cta: "Play online",
  },
  {
    href: "/play/bot",
    icon: Bot,
    title: "Play the bot",
    description: "Practice against the computer at five difficulty levels.",
    cta: "Play vs bot",
  },
  {
    href: "/play/local",
    icon: MonitorPlay,
    title: "Local game",
    description: "Play on the same device with a friend. No backend required.",
    cta: "Start local game",
  },
];

export default function PlayPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Play chess</h1>
        <p className="mt-1 text-muted-foreground">Choose how you want to play.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODES.map((mode) => (
          <Card key={mode.href} className="group transition-shadow hover:shadow-lg">
            <CardHeader>
              <mode.icon className="h-8 w-8 text-primary" aria-hidden="true" />
              <CardTitle>{mode.title}</CardTitle>
              <CardDescription>{mode.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button render={<Link href={mode.href} />} className="w-full">
                {mode.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardContent className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-primary" aria-hidden="true" />
            <div>
              <h2 className="font-semibold">Create a private game</h2>
              <p className="text-sm text-muted-foreground">Set up a game and invite a friend with a link.</p>
            </div>
          </div>
          <Button render={<Link href="/play/online?mode=create" />} variant="secondary">
            Create game
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}