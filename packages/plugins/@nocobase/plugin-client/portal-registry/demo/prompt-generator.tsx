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
import {
  getRouteSurfacePrompt,
  routeSurfaceScenarios,
  type RouteSurfaceScenarioId,
} from "./scenarios";

export function RouteSurfacePromptGenerator() {
  const [scenarioId, setScenarioId] =
    useState<RouteSurfaceScenarioId>("drawer");
  const [target, setTarget] = useState("a customer detail workflow");
  const scenario =
    routeSurfaceScenarios.find((item) => item.id === scenarioId) ??
    routeSurfaceScenarios[0];
  const prompt = useMemo(
    () => getRouteSurfacePrompt(scenario, target),
    [scenario, target]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prompt generator</CardTitle>
        <CardDescription>
          Generate a complete routing scenario, not just an isolated overlay
          component.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid items-start gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="route-surface-scenario">Scenario</Label>
            <Select
              value={scenarioId}
              onValueChange={(value) =>
                setScenarioId(value as RouteSurfaceScenarioId)
              }
            >
              <SelectTrigger id="route-surface-scenario" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {routeSurfaceScenarios.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.number}. {item.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="route-surface-target">Business target</Label>
            <Input
              id="route-surface-target"
              value={target}
              onChange={(event) => setTarget(event.target.value)}
            />
          </div>
        </div>
        <PromptOutput
          title="Generated routing prompt"
          description="Updates as you change the scenario and business target."
          prompt={prompt}
          promptClassName="min-h-80"
        />
      </CardContent>
    </Card>
  );
}
