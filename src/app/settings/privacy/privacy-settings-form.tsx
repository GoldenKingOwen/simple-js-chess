"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettingsStore } from "@/stores/settings-store";
import type { PrivacySettings } from "@/stores/settings-store";

function PrivacyRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <Label htmlFor={id} className="font-medium">
          {label}
        </Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </div>
  );
}

export function PrivacySettingsForm() {
  const privacy = useSettingsStore((state) => state.privacy);
  const updatePrivacy = useSettingsStore((state) => state.updatePrivacy);

  const toggle = (patch: Partial<PrivacySettings>) => updatePrivacy(patch);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy</CardTitle>
        <CardDescription>Control who can reach you and what you share.</CardDescription>
      </CardHeader>
      <CardContent className="divide-y">
        <PrivacyRow
          id="allowChallenges"
          label="Allow challenges"
          description="Let friends invite you to rated or casual games."
          checked={privacy.allowChallenges}
          onCheckedChange={(checked) => toggle({ allowChallenges: checked })}
        />
        <PrivacyRow
          id="allowFriendRequests"
          label="Allow friend requests"
          description="Allow other players to send you friend requests."
          checked={privacy.allowFriendRequests}
          onCheckedChange={(checked) => toggle({ allowFriendRequests: checked })}
        />
        <PrivacyRow
          id="showOnlineStatus"
          label="Show online status"
          description="Display whether you are online, offline or in-game."
          checked={privacy.showOnlineStatus}
          onCheckedChange={(checked) => toggle({ showOnlineStatus: checked })}
        />
        <PrivacyRow
          id="allowChat"
          label="Allow game chat"
          description="Let opponents chat with you during games."
          checked={privacy.allowChat}
          onCheckedChange={(checked) => toggle({ allowChat: checked })}
        />
      </CardContent>
    </Card>
  );
}