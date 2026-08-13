import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="font-mono text-5xl font-bold tracking-tight text-muted-foreground">404</p>
      <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <Button render={<Link href="/dashboard" />}>
          Go to dashboard
        </Button>
        <Button variant="outline" render={<Link href="/play" />}>
          Play chess
        </Button>
      </div>
    </div>
  );
}