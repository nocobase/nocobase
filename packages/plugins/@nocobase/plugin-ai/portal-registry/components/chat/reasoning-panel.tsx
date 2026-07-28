import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Brain, ChevronDown } from "lucide-react";

export function ReasoningPanel({
  children,
  streaming,
}: {
  children: string;
  streaming?: boolean;
}) {
  if (!children) return null;

  return (
    <Collapsible className="overflow-hidden rounded-lg border border-border/70 bg-muted/30">
      <CollapsibleTrigger className="group/reasoning flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground outline-none hover:bg-muted/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
        <Brain className="size-3.5" />
        <span>{streaming ? "Thinking…" : "Reasoning"}</span>
        <ChevronDown className="ml-auto size-3.5 transition-transform group-data-panel-open/reasoning:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t px-3 py-2.5 text-xs leading-5 text-muted-foreground">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
