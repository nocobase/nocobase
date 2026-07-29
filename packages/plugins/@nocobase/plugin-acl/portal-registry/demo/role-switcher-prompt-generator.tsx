import { useMemo, useState } from "react";

import { PromptOutput } from "@/components/demo/prompt-output";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Placement = "header" | "user-menu" | "settings" | "custom";
type UnavailableState = "hide" | "current-role";

const placementLabels: Record<Placement, string> = {
  header: "Application header",
  "user-menu": "User menu",
  settings: "Account settings",
  custom: "Custom surface",
};

const unavailableStateLabels: Record<UnavailableState, string> = {
  "current-role": "Show current role",
  hide: "Hide component",
};

const placementInstructions: Record<Placement, string> = {
  header:
    "Place it in the application header beside the existing account controls. Keep the trigger compact and preserve the responsive user menu.",
  "user-menu":
    "Place it inside the existing user/account popover as a full-width menu section, separated from profile and sign-out actions.",
  settings:
    "Place it in an account settings section with a field label and short explanation of how the active role changes visible data and actions.",
  custom:
    "Place it in the application surface described below, matching the surrounding layout and spacing.",
};

export function RoleSwitcherPromptGenerator() {
  const [placement, setPlacement] = useState<Placement>("user-menu");
  const [label, setLabel] = useState("Working as");
  const [unavailableState, setUnavailableState] =
    useState<UnavailableState>("current-role");
  const [surface, setSurface] = useState(
    "Use the Starter's existing account controls and visual language. Do not create a separate demo page."
  );

  const prompt = useMemo(
    () => `Integrate the RoleSwitcher into the existing NocoBase Admin Starter.

Target placement
- Placement: ${placementLabels[placement]}
- ${placementInstructions[placement]}
- Application context: ${surface}

Component presentation
- Label: ${label.trim() ? label : "No label; pass label={false}."}
- When role switching is unavailable: ${
      unavailableState === "current-role"
        ? "Keep the current identity visible by passing showWhenUnavailable."
        : "Hide the component by keeping showWhenUnavailable false."
    }
- Use className and triggerClassName only to fit the existing surface; do not fork or restyle the internal Select implementation.

Integration requirements
- Import and reuse RoleSwitcher from the installed local entry point at @/extensions/nocobase-acl.
- Update the existing application surface instead of creating an isolated example page.
- Do not fetch, hard-code, or pass a duplicate role list. The component reads roles from the signed-in identity.
- Do not reimplement Full permissions, Anonymous, or role-mode logic. The component derives these options from the Starter ACL store.
- Do not add a separate role-switch mutation. The component already calls users:setDefaultRole and reloads the application after a successful switch.
- Preserve existing account, responsive navigation, and sign-out behavior.
- Return the complete updated component for the target surface and mention any imports that were added.`,
    [label, placement, surface, unavailableState]
  );

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-base">Placement settings</CardTitle>
          <CardDescription>
            Choose where the shared role switcher belongs and how its compact
            state should appear.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 py-5">
          <div className="space-y-2">
            <Label>Placement</Label>
            <Select
              value={placement}
              onValueChange={(value) =>
                value && setPlacement(value as Placement)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue>{placementLabels[placement]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="header">Application header</SelectItem>
                <SelectItem value="user-menu">User menu</SelectItem>
                <SelectItem value="settings">Account settings</SelectItem>
                <SelectItem value="custom">Custom surface</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role-switcher-label">Label</Label>
            <Input
              id="role-switcher-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Leave empty for no label"
            />
          </div>
          <div className="space-y-2">
            <Label>Single-role behavior</Label>
            <Select
              value={unavailableState}
              onValueChange={(value) =>
                value && setUnavailableState(value as UnavailableState)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {unavailableStateLabels[unavailableState]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current-role">Show current role</SelectItem>
                <SelectItem value="hide">Hide component</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role-switcher-surface">Application context</Label>
            <Textarea
              id="role-switcher-surface"
              value={surface}
              onChange={(event) => setSurface(event.target.value)}
              className="min-h-28"
            />
          </div>
        </CardContent>
      </Card>

      <PromptOutput
        title="Generated integration prompt"
        description="Updates as you change placement and presentation settings."
        prompt={prompt}
      />
    </div>
  );
}
