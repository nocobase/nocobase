import { cn } from "@/lib/utils";
import { Bot, ChevronDown, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useAI } from "../../providers";
import { AIEmployeeAvatar } from "../chat/ai-employee-avatar";
import { getNocoBaseToolCallMetadata } from "../chat/tool-call-card";
import type { AIToolRendererProps } from "./tool-renderer-provider";
import { asRecord, asString } from "./tool-renderer-utils";

export function SubAgentRenderer({ part }: AIToolRendererProps) {
  const { employees } = useAI();
  const input = asRecord(part.input);
  const username = asString(input.username);
  const employee = employees.find((item) => item.username === username);
  const fallbackName = username
    ? `${username.charAt(0).toUpperCase()}${username.slice(1)}`
    : "AI employee";
  const [expanded, setExpanded] = useState(false);
  const question = asString(input.question);
  const metadata = getNocoBaseToolCallMetadata(part);
  const generating =
    part.state !== "output-available" &&
    part.state !== "output-error" &&
    !["done", "confirmed"].includes(metadata?.invokeStatus ?? "");

  return (
    <button
      type="button"
      className="w-full rounded-lg bg-muted/50 p-2.5 text-left"
      onClick={() => question && setExpanded((value) => !value)}
    >
      <div className="flex items-center gap-2.5">
        {employee ? (
          <AIEmployeeAvatar employee={employee} className="size-8" />
        ) : (
          <span className="flex size-8 items-center justify-center rounded-full border bg-background">
            <Bot className="size-4" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">
            @{employee?.nickname || fallbackName}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {employee?.position || "Working on a delegated task"}
          </div>
        </div>
        {question ? (
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform",
              expanded && "rotate-180"
            )}
          />
        ) : null}
        {generating ? (
          <LoaderCircle className="size-4 shrink-0 animate-spin text-muted-foreground" />
        ) : null}
      </div>
      {expanded ? (
        <p className="mt-2 border-t pt-2 text-xs leading-5 text-muted-foreground">
          {question}
        </p>
      ) : null}
    </button>
  );
}
