import {
  ToolCallCard,
  type ToolCallPart,
} from "../components/chat/tool-call-card";
import { PromptOutput } from "@/components/demo/prompt-output";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

const tools = {
  suggestions: {
    type: "dynamic-tool",
    toolName: "suggestions",
    toolCallId: "tool-demo-suggestions",
    state: "input-available",
    input: {
      options: [
        "Summarize the operational risks",
        "Draft a weekly support report",
        "Propose the next automation",
      ],
    },
  },
  report: {
    type: "dynamic-tool",
    toolName: "businessReportGenerator",
    toolCallId: "tool-demo-report",
    state: "output-available",
    input: {
      title: "Customer support operations · Weekly review",
      summary:
        "Ticket volume remained stable while SLA exposure concentrated in two queues.",
      markdown: `# Weekly support review

## Executive summary

Ticket volume remained stable, but unresolved priority requests increased in the onboarding and billing queues.

{{ chart:1 }}

{{ chart:2 }}

## Recommended actions

- Reassign unowned priority tickets before the next shift.
- Add an SLA warning automation for billing requests.
- Review the onboarding knowledge-base gaps with the support lead.`,
      charts: [
        {
          title: "Open tickets by queue",
          options: {
            xAxis: {
              type: "category",
              data: ["Billing", "Onboarding", "API", "General"],
            },
            yAxis: { type: "value" },
            series: [{ type: "bar", data: [31, 26, 18, 14] }],
          },
        },
        {
          title: "SLA exposure trend",
          options: {
            xAxis: {
              type: "category",
              data: ["Mon", "Tue", "Wed", "Thu", "Fri"],
            },
            yAxis: { type: "value" },
            series: [{ type: "line", smooth: true, data: [8, 11, 9, 15, 12] }],
          },
        },
      ],
    },
    output: { ready: true },
  },
  chart: {
    type: "dynamic-tool",
    toolName: "chartGenerator",
    toolCallId: "tool-demo-chart",
    state: "output-available",
    input: {
      options: {
        tooltip: { trigger: "axis" },
        xAxis: {
          type: "category",
          data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        },
        yAxis: { type: "value" },
        series: [
          { type: "bar", name: "Tickets", data: [42, 64, 51, 78, 58, 86, 72] },
        ],
      },
    },
    output: { ready: true },
  },
  subAgent: {
    type: "dynamic-tool",
    toolName: "dispatch-sub-agent-task",
    toolCallId: "tool-demo-sub-agent",
    state: "input-available",
    input: {
      username: "dex",
      question:
        "Review the current ticket categories and identify where automation would remove the most repetitive work.",
    },
  },
  workflow: {
    type: "dynamic-tool",
    toolName: "aiEmployeeWorkflowTaskOutput",
    toolCallId: "tool-demo-workflow",
    state: "input-available",
    input: {
      workflowTitle: "Publish weekly service review",
      result: {
        audience: "Support leadership",
        format: "Markdown report",
        records: 128,
        delivery: "Team workspace",
      },
    },
  },
  approval: {
    type: "dynamic-tool",
    toolName: "updateRecords",
    toolCallId: "tool-demo-approval",
    state: "input-available",
    input: {
      collection: "tickets",
      action: "Assign priority tickets to the on-call team",
    },
  },
  preparing: {
    type: "dynamic-tool",
    toolName: "inspectWorkspace",
    toolCallId: "tool-demo-preparing",
    state: "input-streaming",
    input: { scope: "support operations" },
  },
  running: {
    type: "dynamic-tool",
    toolName: "searchRecords",
    toolCallId: "tool-demo-running",
    state: "input-available",
    input: { collection: "tickets", filter: { status: "open" } },
  },
  completed: {
    type: "dynamic-tool",
    toolName: "inspectWorkspace",
    toolCallId: "tool-demo-completed",
    state: "output-available",
    input: { scope: "support operations" },
    output: { reviewed: true },
  },
  failed: {
    type: "dynamic-tool",
    toolName: "publishReport",
    toolCallId: "tool-demo-failed",
    state: "output-error",
    input: { destination: "leadership workspace" },
    errorText: "The current role cannot publish to this workspace.",
  },
} satisfies Record<string, ToolCallPart>;

const specializedCards = [
  [
    "Suggestions",
    "Let the user choose how the AI should continue.",
    tools.suggestions,
  ],
  [
    "Business report",
    "Open a generated report for preview and export.",
    tools.report,
  ],
  [
    "Chart",
    "Render generated visualization options as an inline preview.",
    tools.chart,
  ],
  [
    "Sub-agent",
    "Show delegated AI employee work without expanding the whole payload.",
    tools.subAgent,
  ],
  [
    "Workflow output",
    "Present structured workflow results in a business-friendly card.",
    tools.workflow,
  ],
] as const;

export function ToolCardsPage() {
  const [decision, setDecision] = useState("Waiting for a decision");
  const [workflowDecision, setWorkflowDecision] = useState(
    "Waiting for workflow review"
  );

  return (
    <div className="space-y-10 pb-12">
      <section className="flex flex-wrap items-start justify-between gap-5 border-b pb-8">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">AI Components</Badge>
            <Badge variant="outline">Tool renderers</Badge>
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.035em]">
            Tool Cards
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            Specialized tools render their complete business interaction. Tools
            without a registered renderer fall back to the shared status,
            approval, error, and input disclosure card.
          </p>
        </div>
      </section>

      <section className="space-y-5">
        <SectionTitle
          eyebrow="Specialized renderers"
          title="Adapt NocoBase tool results to the job they represent"
          description="These cards follow the original AI employee patterns while using the starter's shadcn and Base UI component system."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {specializedCards.map(([title, description, part]) => (
            <Card key={title} className="gap-0 py-0">
              <CardHeader className="border-b py-4">
                <CardTitle className="text-base">{title}</CardTitle>
                <p className="text-xs leading-5 text-muted-foreground">
                  {description}
                </p>
              </CardHeader>
              <CardContent className="p-4">
                <ToolCallCard
                  part={part}
                  approval={
                    part.toolName === "aiEmployeeWorkflowTaskOutput"
                      ? { required: true, status: "pending" }
                      : undefined
                  }
                  onDecision={async (nextDecision) => {
                    if (part.toolName !== "aiEmployeeWorkflowTaskOutput")
                      return;
                    setWorkflowDecision(
                      nextDecision === "approve"
                        ? "Workflow output approved"
                        : nextDecision === "reject"
                        ? "Workflow output rejected"
                        : "Revision requested"
                    );
                  }}
                />
                {part.toolName === "aiEmployeeWorkflowTaskOutput" ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {workflowDecision}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <SectionTitle
          eyebrow="Default Tool Card"
          title="One shared shell for every normal tool state"
          description="Tools without a specialized renderer still use the same compact status, input disclosure, error, and permission behavior."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            ["Preparing input", tools.preparing],
            ["Running", tools.running],
            ["Completed", tools.completed],
            ["Failed", tools.failed],
          ].map(([label, part]) => (
            <Card key={label as string} className="gap-0 py-0">
              <CardHeader className="border-b py-3">
                <CardTitle className="text-sm">{label as string}</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <ToolCallCard part={part as ToolCallPart} />
              </CardContent>
            </Card>
          ))}
          <Card className="gap-0 py-0 md:col-span-2 xl:col-span-2">
            <CardHeader className="border-b py-3">
              <CardTitle className="text-sm">Approval required</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ToolCallCard
                part={tools.approval}
                approval={{ required: true, status: "pending" }}
                onDecision={async (nextDecision) => {
                  setDecision(
                    nextDecision === "approve"
                      ? "The tool was allowed."
                      : "The tool was denied."
                  );
                }}
              />
              <p className="mt-2 text-xs text-muted-foreground">{decision}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-5">
        <SectionTitle
          eyebrow="Code prompt"
          title="Generate an implementation prompt for a specialized Tool Card"
          description="Choose the nearest existing renderer and describe the business interaction. The generated prompt tells the coding agent exactly where and how to implement it."
        />
        <ToolCardCodePrompt />
      </section>
    </div>
  );
}

type ReferenceRenderer =
  | "suggestions"
  | "business-report"
  | "chart"
  | "sub-agent"
  | "workflow";

const referenceRenderers: Record<
  ReferenceRenderer,
  { label: string; guidance: string }
> = {
  suggestions: {
    label: "Suggestions",
    guidance:
      "Follow SuggestionsRenderer for selectable options that call onEdit with the user's choice.",
  },
  "business-report": {
    label: "Business report",
    guidance:
      "Follow BusinessReportRenderer for an inline summary that opens a larger preview or export dialog.",
  },
  chart: {
    label: "Chart",
    guidance:
      "Follow ChartRenderer for a compact visual preview derived from structured tool arguments.",
  },
  "sub-agent": {
    label: "Sub-agent",
    guidance:
      "Follow SubAgentRenderer for a compact entity card with expandable task details.",
  },
  workflow: {
    label: "Workflow output",
    guidance:
      "Follow WorkflowRenderer for structured results and card-owned Reject, Revise, and Approve actions.",
  },
};

function ToolCardCodePrompt() {
  const [toolName, setToolName] = useState("reviewSupportQueue");
  const [reference, setReference] = useState<ReferenceRenderer>("workflow");
  const [behavior, setBehavior] = useState(
    "Show the affected support records, summarize the proposed changes, and let the user approve, request a revision, or reject the operation."
  );
  const [handlesApproval, setHandlesApproval] = useState(true);
  const referenceDefinition = referenceRenderers[reference];
  const prompt = `Implement a specialized NocoBase AI Tool Card for the tool "${
    toolName || "customTool"
  }" in the shadcn Registry source at registry/nocobase-ai.

Business interaction:
${behavior || "Render the tool's business-specific interaction."}

Reference implementation:
- ${referenceDefinition.guidance}
- Reuse the shared visual language from the existing specialized Tool Cards demo.

Implementation requirements:
- Create a focused renderer component under registry/nocobase-ai/components/tools. It renders the complete business-specific card.
- Accept AIToolRendererProps: part, disabled, onEdit, onApprove, onReject, and onRevise.
- Register the renderer for the exact tool name "${
    toolName || "customTool"
  }" in the built-in renderer map, or provide it through AIToolRendererProvider when it belongs to an external Registry package.
- Set handlesApproval to ${handlesApproval}. ${
    handlesApproval
      ? "The specialized body must expose the complete decision UI and call onApprove, onReject, onEdit, or onRevise itself."
      : "Leave approval, status, errors, and disclosure to the shared ToolCallCard shell."
  }
- Set standalone to true when the renderer replaces the Default Tool Card shell.
- Do not add tool-name branches to ChatMessage or AIChatMessageList.
- Do not render a separate raw Output section.
- Preserve the actual message order: reasoning, assistant text, then the Tool Card in the position used by the NocoBase message renderer.
- Use shadcn/Base UI components only; do not add Ant Design, Radix, or Zustand.
- Add a fixed ToolCallPart example to registry/nocobase-ai/demo/tool-cards.tsx so every state and action can be reviewed without calling the backend.
- Export any public renderer types or components from registry/nocobase-ai/components/index.ts when application code needs them.

Verification:
- Run pnpm registry:preview.
- Run pnpm exec tsc --noEmit.
- Run the scoped ESLint check and pnpm registry:build.
- Verify the card in light and dark themes, narrow chat panels, expanded dialogs, pending approval, completed, and error states.`;

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-base">Describe the Tool Card</CardTitle>
          <p className="text-xs leading-5 text-muted-foreground">
            The examples above remain the visual reference; these values define
            the implementation task.
          </p>
        </CardHeader>
        <CardContent className="space-y-5 p-4">
          <div className="space-y-2">
            <label className="text-xs font-medium" htmlFor="tool-name">
              Tool name
            </label>
            <Input
              id="tool-name"
              value={toolName}
              onChange={(event) => setToolName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="text-xs font-medium">Closest example</div>
            <Select
              value={reference}
              onValueChange={(value) => {
                if (!value) return;
                const nextReference = value as ReferenceRenderer;
                setReference(nextReference);
                setHandlesApproval(nextReference === "workflow");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue>{referenceDefinition.label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(referenceRenderers).map(([value, option]) => (
                  <SelectItem key={value} value={value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium" htmlFor="tool-behavior">
              Business interaction
            </label>
            <Textarea
              id="tool-behavior"
              className="min-h-28"
              value={behavior}
              onChange={(event) => setBehavior(event.target.value)}
            />
          </div>
          <label className="flex items-center justify-between gap-4 border-t pt-4 text-sm">
            <span>
              <span className="block font-medium">Card owns approval UI</span>
              <span className="block text-xs text-muted-foreground">
                Enable for actions such as Approve, Revise, and Reject.
              </span>
            </span>
            <Switch
              size="sm"
              checked={handlesApproval}
              onCheckedChange={setHandlesApproval}
            />
          </label>
        </CardContent>
      </Card>
      <PromptOutput
        title="Coding prompt"
        description="Ready to paste into an implementation task."
        prompt={prompt}
        promptClassName="max-h-[720px] min-h-[560px]"
      />
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
