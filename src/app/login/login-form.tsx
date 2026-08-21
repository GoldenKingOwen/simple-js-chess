"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/auth-service";
import { useAuthStore } from "@/stores/auth-store";
import { setSocketAuth } from "@/lib/socket/socket-client";
import { ApiError } from "@/types";

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, "Username or email is required."),
  password: z.string().min(1, "Password is required."),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { usernameOrEmail: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const session = await authService.login({ ...values, rememberMe });
      setAuthenticated(session.user, session.token);
      setSocketAuth(session.token);
      router.push(redirectTo ?? "/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="usernameOrEmail">Username or email</Label>
        <Input
          id="usernameOrEmail"
          autoComplete="username"
          placeholder="Onewen111"
          {...register("usernameOrEmail")}
          aria-invalid={Boolean(errors.usernameOrEmail)}
        />
        {errors.usernameOrEmail && <p className="text-xs text-destructive">{errors.usernameOrEmail.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register("password")}
          aria-invalid={Boolean(errors.password)}
        />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked === true)} aria-label="Remember me" />
          Remember me
        </label>
        <Link href="/forgot-password" className="text-sm text-primary hover:underline">
          Forgot password?
        </Link>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        Log in
      </Button>
    </form>
  );
}