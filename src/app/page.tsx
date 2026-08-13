"use client";

import Link from "next/link";
import { MotionConfig, motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Clock3,
  MonitorPlay,
  Palette,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChessPieceIcon } from "@/components/chess/pieces";
import type { PieceSymbol } from "@/lib/chess/chess-engine";

const MODES = [
  {
    href: "/play/online",
    icon: Swords,
    title: "Play online",
    description: "Find an opponent in seconds. Rated and casual games from bullet to classical.",
    cta: "Find a game",
  },
  {
    href: "/play/bot",
    icon: Bot,
    title: "Play the bot",
    description: "Practice against the computer at five difficulty levels, from Beginner to Expert.",
    cta: "Play vs bot",
  },
  {
    href: "/play/local",
    icon: MonitorPlay,
    title: "Local game",
    description: "Play on the same device with a friend. No account or backend required.",
    cta: "Start local game",
  },
];

const FEATURES = [
  {
    icon: Clock3,
    title: "Real time controls",
    description: "Bullet, blitz, rapid and classical clocks with increments, just like tournament play.",
  },
  {
    icon: Trophy,
    title: "Ratings & leaderboard",
    description: "Climb the leaderboard and watch your rating grow game after game.",
  },
  {
    icon: Users,
    title: "Friends & chat",
    description: "Follow friends, get notified of challenges and chat during your games.",
  },
  {
    icon: Palette,
    title: "Make it yours",
    description: "Pick a board theme, piece style and animations to suit your taste.",
  },
];

/** Decorative white pieces floating around the hero (visible on light and dark). */
const FLOATERS: { type: PieceSymbol; className: string; delay: number }[] = [
  { type: "n", className: "left-[5%] top-[14%] h-14 w-14 lg:h-20 lg:w-20", delay: 0 },
  { type: "q", className: "right-[7%] top-[10%] h-16 w-16 lg:h-24 lg:w-24", delay: 0.8 },
  { type: "r", className: "left-[10%] bottom-[16%] h-12 w-12 lg:h-16 lg:w-16", delay: 1.6 },
  { type: "b", className: "right-[12%] bottom-[20%] h-12 w-12 lg:h-16 lg:w-16", delay: 2.4 },
];

export default function HomePage() {
  return (
    <MotionConfig reducedMotion="user">
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-40 left-1/2 h-[32rem] w-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -bottom-32 right-[10%] h-72 w-72 rounded-full bg-secondary/70 blur-3xl" />
          </div>

          {FLOATERS.map((piece) => (
            <motion.div
              key={piece.type}
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5, y: [0, -16, 0] }}
              transition={{
                opacity: { delay: 0.8, duration: 1 },
                y: { repeat: Infinity, duration: 5.5, delay: piece.delay, ease: "easeInOut" },
              }}
              className={`pointer-events-none absolute hidden select-none md:block ${piece.className}`}
            >
              <ChessPieceIcon type={piece.type} color="w" className="h-full w-full" />
            </motion.div>
          ))}

          <div className="mx-auto flex max-w-4xl flex-col items-center px-4 pb-20 pt-20 text-center sm:px-6 sm:pt-28">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1">
                <span aria-hidden="true">♞</span> Free online chess
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl"
            >
              Play chess. <span className="text-primary">Make your move.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg"
            >
              Chess Arena is free online chess for everyone. Challenge the bot at five difficulty
              levels, find rated games in seconds, or play a match with a friend on the same device.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 flex w-full max-w-md flex-col items-center gap-3 sm:w-auto sm:flex-row"
            >
              <Button render={<Link href="/play/online" />} size="lg" className="w-full sm:w-auto">
                Play online
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
              <Button render={<Link href="/play/bot" />} variant="outline" size="lg" className="w-full sm:w-auto">
                <Bot className="mr-2 h-4 w-4" aria-hidden="true" /> Play the bot
              </Button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-6 text-sm text-muted-foreground"
            >
              No account needed to play the bot or a local game.
            </motion.p>
          </div>
        </section>

        {/* Play modes */}
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MODES.map((mode, index) => (
              <motion.div
                key={mode.href}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="group h-full transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <mode.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <CardTitle>{mode.title}</CardTitle>
                    <CardDescription>{mode.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button render={<Link href={mode.href} />} variant="outline" className="w-full">
                      {mode.cta}
                      <ArrowRight
                        className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="border-y bg-muted/40 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything a chess player needs
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                Built for quick games and serious play alike.
              </p>
            </motion.div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="flex h-full flex-col items-center gap-3 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                    </div>
                    <h3 className="text-base font-semibold">{feature.title}</h3>
                    <p className="text-sm leading-6 text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Closing CTA with an animated knight hopping an L-move */}
        <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
          >
            <div aria-hidden="true" className="mb-8 flex justify-center">
              <div className="relative h-24 w-16">
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-3 gap-0.5 rounded-sm p-0.5 ring-1 ring-foreground/10">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={index}
                      className={`rounded-[2px] ${index % 2 === 0 ? "bg-muted" : "bg-muted/50"}`}
                    />
                  ))}
                </div>
                <motion.div
                  className="absolute bottom-0 left-0 h-8 w-8"
                  animate={{ x: [0, 0, 26, 26], y: [0, -30, -30, 0] }}
                  transition={{ repeat: Infinity, duration: 3, repeatDelay: 1.4, ease: "easeInOut" }}
                >
                  <ChessPieceIcon type="n" color="w" className="h-full w-full" />
                </motion.div>
              </div>
            </div>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to make your move?</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Join Chess Arena and play your first game in seconds — the clock is running.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button render={<Link href="/play" />} size="lg">
                Explore the play menu
              </Button>
              <Button render={<Link href="/leaderboard" />} variant="outline" size="lg">
                <Trophy className="mr-2 h-4 w-4" aria-hidden="true" /> See the leaderboard
              </Button>
            </div>
          </motion.div>
        </section>
      </main>
    </MotionConfig>
  );
}
