import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import {
  AclScenarioPromptGenerator,
  type AclPromptGeneratorConfig,
} from "./prompt-generator";

export function AclScenarioSection({
  eyebrow,
  title,
  description,
  children,
  prompt,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  prompt: AclPromptGeneratorConfig;
}) {
  return (
    <section className="space-y-5 border-t pt-8">
      <div>
        <Badge variant="outline">{eyebrow}</Badge>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em]">
          {title}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {children}
      <AclScenarioPromptGenerator config={prompt} />
    </section>
  );
}
