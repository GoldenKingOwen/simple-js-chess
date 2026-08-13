"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/auth-service";
import { ApiError } from "@/types";

const forgotSchema = z.object({
  email: z.string().email("Enter a valid email address."),
});

type ForgotValues = z.infer<typeof forgotSchema>;

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await authService.forgotPassword(values);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  });

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <MailCheck className="h-10 w-10 text-primary" aria-hidden="true" />
        <p className="font-medium">Check your inbox</p>
        <p className="text-sm text-muted-foreground">
          If an account exists for that email, you&apos;ll receive a reset link shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} aria-invalid={Boolean(errors.email)} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        Send reset link
      </Button>
    </form>
  );
}