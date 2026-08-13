"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center antialiased">
        <p className="font-mono text-5xl font-bold tracking-tight text-muted-foreground">500</p>
        <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          An unexpected error occurred. Try reloading the page, or come back shortly.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" render={<a href="/dashboard">Back to dashboard</a>}>
            Back to dashboard
          </Button>
        </div>
      </body>
    </html>
  );
}