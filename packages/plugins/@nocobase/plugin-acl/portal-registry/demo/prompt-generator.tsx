import { ChevronDown, Sparkles } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";

export type AclPromptGeneratorConfig = {
  title: string;
  description: string;
  defaultScene: string;
  defaultTarget: string;
  requirements: string;
};

export function AclScenarioPromptGenerator({
  config,
}: {
  config: AclPromptGeneratorConfig;
}) {
  const [scene, setScene] = useState(config.defaultScene);
  const [target, setTarget] = useState(config.defaultTarget);

  const prompt = useMemo(
    () => `Build a complete NocoBase ACL scene in the NocoBase Admin Starter.

Business scene
- Page or feature: ${scene}
- Permission target: ${target}
- Use realistic fixed sample content so the permission behavior is visible immediately.
- Build the complete page section and user flow, not an isolated ACL snippet.

ACL scenario
${config.requirements}

Implementation contract
- Use the Starter's built-in NocoBase accessControlProvider and ACL store.
- NocoBase roles:check is the source of truth. Do not create a second permission store. Use configured role names only when the requirement explicitly includes a role constraint.
- Import the Starter CanAccess from @/components/access-control/can-access. Use it with AclPage, AclRegion, and AclField for permission presentation. Do not copy their checks into local booleans or role comparisons.
- Use useGetRoles only when UI needs to display or pass through the current effective ACL roles; it is not a replacement permission evaluator.
- Keep backend ACL enforcement in place; frontend checks only control presentation and navigation.
- Import reusable components from the installed local entry point at @/extensions/nocobase-acl when page composition is needed.
- Resource actions use the application names list, show, create, edit, and delete. Let the Starter map them to NocoBase list/get/create/update/destroy.
- Preserve dataSourceKey when the collection belongs to a non-main data source.
- Show an understandable forbidden or hidden state where appropriate.
- Deliver complete React component code, resource metadata, route integration, and the visible sample UI.`,
    [config.requirements, scene, target]
  );

  return (
    <details className="group rounded-xl border bg-muted/15">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium marker:hidden">
        <Sparkles className="size-4 text-primary" />
        Prompt generator
        <span className="ml-auto text-xs font-normal text-muted-foreground">
          {config.title}
        </span>
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="grid items-start gap-5 border-t p-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="gap-0 py-0">
          <CardHeader className="border-b py-4">
            <CardTitle className="text-base">Scenario settings</CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 py-5">
            <div className="space-y-2">
              <Label htmlFor={`${config.title}-scene`}>Business scene</Label>
              <Input
                id={`${config.title}-scene`}
                value={scene}
                onChange={(event) => setScene(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${config.title}-target`}>
                Permission target
              </Label>
              <Textarea
                id={`${config.title}-target`}
                value={target}
                onChange={(event) => setTarget(event.target.value)}
                className="min-h-24"
              />
            </div>
          </CardContent>
        </Card>
        <PromptOutput
          description="Updates as you change the business scene and permission target."
          prompt={prompt}
        />
      </div>
    </details>
  );
}
