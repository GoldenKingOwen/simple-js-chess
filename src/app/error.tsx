"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="font-mono text-5xl font-bold tracking-tight text-muted-foreground">Error</p>
      <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">
        An unexpected error occurred while rendering this page.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" render={<a href="/dashboard">Back to dashboard</a>}>
          Back to dashboard
        </Button>
      </div>
    </div>
  );
}