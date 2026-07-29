import { Button } from "@/components/ui/button";
import { CheckCircle2, GitBranch } from "lucide-react";
import { useState } from "react";
import { MarkdownMessage } from "../chat/markdown-message";
import { getNocoBaseToolCallMetadata } from "../chat/tool-call-card";
import type { AIToolRendererProps } from "./tool-renderer-provider";
import { asRecord, asString } from "./tool-renderer-utils";

export function WorkflowRenderer({
  part,
  disabled,
  onApprove,
  onReject,
  onRevise,
}: AIToolRendererProps) {
  const input = asRecord(part.input);
  const metadata = getNocoBaseToolCallMetadata(part);
  const entries = Object.entries(asRecord(input.result));
  const [action, setAction] = useState<"approve" | "reject" | "revise">();
  const [decided, setDecided] = useState(false);
  const canDecide =
    metadata?.invokeStatus === undefined ||
    metadata.invokeStatus === "interrupted";
  const actionDisabled =
    disabled || action !== undefined || decided || !canDecide;

  const runAction = async (
    nextAction: "approve" | "reject",
    callback: () => void | Promise<void>
  ) => {
    setAction(nextAction);
    try {
      await callback();
      setDecided(true);
    } finally {
      setAction(undefined);
    }
  };

  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <GitBranch className="size-4" />
        {asString(input.workflowTitle) || "Workflow task"}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {entries.map(([key, value]) => (
          <div key={key} className="rounded-md bg-muted/40 px-2.5 py-2">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {key}
            </div>
            <div className="mt-0.5 overflow-x-auto text-xs font-medium">
              {typeof value === "string" ||
              typeof value === "number" ||
              typeof value === "boolean" ? (
                <MarkdownMessage>{String(value)}</MarkdownMessage>
              ) : (
                <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-5">
                  {JSON.stringify(value, null, 2)}
                </pre>
              )}
            </div>
          </div>
        ))}
      </div>
      {!entries.length ? (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="size-3.5" /> Ready for review
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap justify-end gap-2 border-t pt-3">
        <Button
          variant="ghost"
          size="sm"
          disabled={actionDisabled}
          onClick={() =>
            void runAction("reject", () =>
              onReject(
                "The user rejected this workflow node. Stop. Do not continue, do not reply about the task result, and do not call this tool again. Only state that you understand."
              )
            )
          }
        >
          {action === "reject" ? "Rejecting…" : "Reject"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={actionDisabled}
          onClick={() => {
            setAction("revise");
            onRevise();
            setAction(undefined);
          }}
        >
          Revise
        </Button>
        <Button
          size="sm"
          disabled={actionDisabled}
          onClick={() => void runAction("approve", onApprove)}
        >
          {action === "approve" ? "Approving…" : "Approve"}
        </Button>
      </div>
    </div>
  );
}
