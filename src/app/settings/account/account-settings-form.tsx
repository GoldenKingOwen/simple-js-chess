"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { profileService } from "@/services/profile-service";
import { authService } from "@/services/auth-service";
import { useAuthStore } from "@/stores/auth-store";
import { ApiError } from "@/types";

const profileSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  bio: z.string().max(160).optional(),
  country: z.string().max(40).optional(),
});

type ProfileValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type PasswordValues = z.infer<typeof passwordSchema>;

export function AccountSettingsForm() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  const { data: user, isLoading } = useQuery({
    queryKey: ["users", "me"],
    queryFn: () => profileService.getCurrentUser(),
  });

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: user
      ? {
          username: user.username,
          bio: "",
          country: "",
        }
      : undefined,
  });

  const updateProfile = useMutation({
    mutationFn: (values: ProfileValues) =>
      profileService.updateProfile({ username: values.username, bio: values.bio, country: values.country }),
    onSuccess: (updated) => {
      setUser(updated);
      toast.success("Profile updated");
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not update profile."),
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const changePassword = useMutation({
    mutationFn: (values: PasswordValues) =>
      profileService.changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword }),
    onSuccess: () => {
      toast.success("Password changed");
      passwordForm.reset();
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not change password."),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>How you appear to other players.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit((values) => updateProfile.mutate(values))} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input id="username" autoComplete="off" {...profileForm.register("username")} aria-invalid={Boolean(profileForm.formState.errors.username)} />
              {profileForm.formState.errors.username && (
                <p className="text-xs text-destructive">{profileForm.formState.errors.username.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bio">Bio</Label>
              <Input id="bio" placeholder="Tell players about yourself" {...profileForm.register("bio")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="country">Country</Label>
              <Input id="country" placeholder="e.g. US" {...profileForm.register("country")} />
            </div>
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" aria-hidden="true" /> Change password
          </CardTitle>
          <CardDescription>Use a strong, unique password for your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit((values) => changePassword.mutate(values))} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input id="currentPassword" type="password" autoComplete="current-password" {...passwordForm.register("currentPassword")} />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-xs text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">New password</Label>
                <Input id="newPassword" type="password" autoComplete="new-password" {...passwordForm.register("newPassword")} />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-xs text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input id="confirmPassword" type="password" autoComplete="new-password" {...passwordForm.register("confirmPassword")} />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
            <Button type="submit" variant="secondary" disabled={changePassword.isPending}>
              {changePassword.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              Update password
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sign out</CardTitle>
          <CardDescription>End your session on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <SignOutButton />
        </CardContent>
      </Card>
    </div>
  );
}

function SignOutButton() {
  const logout = useAuthStore((state) => state.logout);
  return (
    <Button
      variant="destructive"
      onClick={async () => {
        await authService.logout().catch(() => undefined);
        logout();
      }}
    >
      Sign out
    </Button>
  );
}