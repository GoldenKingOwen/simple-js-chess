import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/navigation/logo";
import { sanitizeRedirectPath } from "@/lib/utils";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Join Chess Arena and start playing for free.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const raw = typeof params.redirect === "string" ? params.redirect : undefined;
  const redirect = sanitizeRedirectPath(raw);
  const loginHref = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login";

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <Logo />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Create your account</CardTitle>
            <CardDescription>Free forever. Play online, against the bot, or with friends.</CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm redirectTo={redirect ?? undefined} />
          </CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href={loginHref} className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}