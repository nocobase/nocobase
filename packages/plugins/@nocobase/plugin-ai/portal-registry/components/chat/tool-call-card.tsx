import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AIChatMessage, AIToolCallApproval } from "../../providers";
import {
  Check,
  ChevronDown,
  CircleAlert,
  LoaderCircle,
  Wrench,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useAIToolRenderer } from "../tools/tool-renderer-provider";

export type ToolCallPart = Extract<
  AIChatMessage["parts"][number],
  { type: `tool-${string}` | "dynamic-tool" }
>;

export function isToolCallPart(
  part: AIChatMessage["parts"][number]
): part is ToolCallPart {
  return part.type === "dynamic-tool" || part.type.startsWith("tool-");
}

export const getToolCallName = (part: ToolCallPart) =>
  part.type === "dynamic-tool" ? part.toolName : part.type.slice(5);

const toolLabel = (part: ToolCallPart) =>
  getToolCallName(part)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/^./, (character) => character.toUpperCase());

const formatValue = (value: unknown) => {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
};

const getStatus = (part: ToolCallPart) => {
  switch (part.state) {
    case "input-streaming":
      return {
        label: "Preparing",
        icon: LoaderCircle,
        tone: "text-muted-foreground",
      };
    case "input-available":
      return {
        label: "Running",
        icon: LoaderCircle,
        tone: "text-muted-foreground",
      };
    case "output-error":
      return {
        label: "Failed",
        icon: CircleAlert,
        tone: "text-destructive",
      };
    case "output-available":
      return {
        label: "Completed",
        icon: Check,
        tone: "text-foreground",
      };
  }
};

const approvalFromPart = (
  part: ToolCallPart
): AIToolCallApproval | undefined => {
  if (!("callProviderMetadata" in part)) return undefined;
  const metadata = part.callProviderMetadata?.nocobase;
  if (!metadata || typeof metadata !== "object") return undefined;
  const requiresApproval = (metadata as { requiresApproval?: unknown })
    .requiresApproval;
  return requiresApproval === true
    ? { required: true, status: "pending" }
    : undefined;
};

export type NocoBaseToolCallMetadata = {
  autoApprove?: boolean;
  invokeStatus?: string;
  messageId?: string;
  requiresApproval?: boolean;
  selectedSuggestion?: string;
  status?: string;
};

export const getNocoBaseToolCallMetadata = (part: ToolCallPart) => {
  if (!("callProviderMetadata" in part)) return undefined;
  const metadata = part.callProviderMetadata?.nocobase;
  return metadata && typeof metadata === "object"
    ? (metadata as NocoBaseToolCallMetadata)
    : undefined;
};

type ToolCallCardProps = {
  part: ToolCallPart;
  approval?: AIToolCallApproval;
  onDecision?: (
    decision: "approve" | "reject" | "edit",
    input?: unknown
  ) => void | Promise<void>;
  onRevise?: () => void;
  inlineActions?: ReactNode;
  disabled?: boolean;
};

export function ToolCallCard({
  part,
  approval,
  onDecision,
  onRevise,
  inlineActions,
  disabled = false,
}: ToolCallCardProps) {
  const resolvedApproval = approval ?? approvalFromPart(part);
  const [approvalStatus, setApprovalStatus] = useState(
    resolvedApproval?.status ?? "pending"
  );
  const [deciding, setDeciding] = useState(false);
  const renderer = useAIToolRenderer(getToolCallName(part));
  const Renderer = renderer?.component;
  const [open, setOpen] = useState(false);
  const toolStatus = getStatus(part);
  const approvalRequired =
    resolvedApproval?.required === true && approvalStatus === "pending";
  const status = approvalRequired
    ? { label: "Approval required", icon: CircleAlert, tone: "text-foreground" }
    : approvalStatus === "rejected"
    ? { label: "Denied", icon: CircleAlert, tone: "text-muted-foreground" }
    : approvalStatus === "approved" && part.state === "input-available"
    ? { label: "Allowed", icon: Check, tone: "text-foreground" }
    : toolStatus;
  const StatusIcon = status.icon;
  const hasInput = part.input !== undefined;
  const hasError = part.state === "output-error";

  useEffect(() => {
    setApprovalStatus(resolvedApproval?.status ?? "pending");
  }, [resolvedApproval?.status]);

  const decide = async (
    decision: "approve" | "reject" | "edit",
    input?: unknown
  ) => {
    if (disabled) return;
    setDeciding(true);
    try {
      await onDecision?.(decision, input);
      setApprovalStatus(decision === "reject" ? "rejected" : "approved");
    } finally {
      setDeciding(false);
    }
  };

  if (Renderer && renderer?.standalone) {
    const specializedDisabled =
      disabled ||
      approvalStatus === "rejected" ||
      (resolvedApproval?.required === true && approvalStatus !== "pending");
    return (
      <div>
        <Renderer
          part={part}
          disabled={specializedDisabled}
          onEdit={(input) => onDecision?.("edit", input)}
          onApprove={() => onDecision?.("approve")}
          onReject={(message) => onDecision?.("reject", message)}
          onRevise={() => onRevise?.()}
        />
        {part.state === "output-error" ? (
          <div className="mt-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {part.errorText}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="overflow-hidden rounded-lg border border-border/70 bg-muted/30"
    >
      <div className="flex items-center">
        <CollapsibleTrigger className="group/tool-call flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left text-xs font-medium text-muted-foreground outline-none hover:bg-muted/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
          <Wrench className="size-3.5 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{toolLabel(part)}</span>
          <span
            className={cn(
              "flex shrink-0 items-center gap-1.5 font-normal",
              status.tone
            )}
          >
            <StatusIcon
              className={cn(
                "size-3.5",
                (deciding ||
                  (!approvalRequired &&
                    approvalStatus === "pending" &&
                    (part.state === "input-streaming" ||
                      part.state === "input-available"))) &&
                  "animate-spin"
              )}
            />
            {deciding ? "Applying…" : status.label}
          </span>
          <ChevronDown className="size-3.5 shrink-0 transition-transform group-data-panel-open/tool-call:rotate-180" />
        </CollapsibleTrigger>
        {inlineActions ? (
          <div className="flex shrink-0 items-center pr-2">{inlineActions}</div>
        ) : null}
      </div>
      {approvalRequired && !renderer?.handlesApproval ? (
        <div className="flex items-center justify-between gap-3 border-t px-3 py-2.5">
          <p className="text-xs text-muted-foreground">
            This tool needs permission before it can run.
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={disabled || deciding}
              onClick={() => void decide("reject")}
            >
              Deny
            </Button>
            <Button
              size="sm"
              disabled={disabled || deciding}
              onClick={() => void decide("approve")}
            >
              Allow
            </Button>
          </div>
        </div>
      ) : null}
      <CollapsibleContent className="border-t">
        {Renderer ? (
          <div className="p-3">
            <Renderer
              part={part}
              disabled={
                disabled ||
                deciding ||
                approvalStatus === "rejected" ||
                (resolvedApproval?.required === true &&
                  approvalStatus !== "pending")
              }
              onEdit={(input) => decide("edit", input)}
              onApprove={() => decide("approve")}
              onReject={() => decide("reject")}
              onRevise={() => onRevise?.()}
            />
          </div>
        ) : hasInput ? (
          <ToolCallValue label="Input" value={part.input} />
        ) : null}
        {part.state === "output-error" ? (
          <ToolCallValue label="Error" value={part.errorText} error />
        ) : null}
        {!Renderer && !hasInput && !hasError ? (
          <p className="px-3 py-3 text-xs text-muted-foreground">
            Waiting for tool input…
          </p>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
}

function ToolCallValue({
  label,
  value,
  error = false,
}: {
  label: string;
  value: unknown;
  error?: boolean;
}) {
  return (
    <div className="border-b px-3 py-3 last:border-b-0">
      <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <pre
        className={cn(
          "max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-background p-2.5 font-mono text-xs leading-5",
          error && "text-destructive"
        )}
      >
        {formatValue(value)}
      </pre>
    </div>
  );
}
