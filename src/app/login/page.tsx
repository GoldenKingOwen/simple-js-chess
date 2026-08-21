import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/navigation/logo";
import { sanitizeRedirectPath } from "@/lib/utils";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your Chess Arena account.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const raw = typeof params.redirect === "string" ? params.redirect : undefined;
  const redirect = sanitizeRedirectPath(raw);
  const registerHref = redirect ? `/register?redirect=${encodeURIComponent(redirect)}` : "/register";

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <Logo />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>Log in to keep playing and climb the leaderboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm redirectTo={redirect ?? undefined} />
          </CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link href={registerHref} className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}