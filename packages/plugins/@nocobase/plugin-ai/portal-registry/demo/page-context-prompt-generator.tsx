import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useMemo, useState } from "react";
import { useAI } from "../providers";
import { PromptCard } from "./prompt-card";

type ContextPattern = "shortcut" | "preset" | "scope" | "manual";
type PageCapability = "context" | "form-filler" | "custom-tool";

const isBusinessEmployee = (username: string) =>
  !["nathan", "dara"].includes(username.toLowerCase());

export function PageContextPromptGenerator() {
  const { employees } = useAI();
  const availableEmployees = employees.filter((employee) =>
    isBusinessEmployee(employee.username)
  );
  const [employeeUsername, setEmployeeUsername] = useState(
    availableEmployees[0]?.username ?? employees[0]?.username ?? ""
  );
  const [sceneTitle, setSceneTitle] = useState("Customer renewal workspace");
  const [sceneBrief, setSceneBrief] = useState(
    "Show a customer renewal detail with account health, contract value, renewal date, owner, recent activity, and a working AI conversation beside it."
  );
  const [taskTitle, setTaskTitle] = useState("Review renewal risk");
  const [taskMessage, setTaskMessage] = useState(
    "Review this customer renewal, identify risks, and recommend the next action."
  );
  const [autoSend, setAutoSend] = useState(false);
  const [pattern, setPattern] = useState<ContextPattern>("shortcut");
  const [contextId, setContextId] = useState("renewal-detail");
  const [contextTitle, setContextTitle] = useState("Customer renewal detail");
  const [capability, setCapability] = useState<PageCapability>("context");
  const [toolName, setToolName] = useState("update_renewal_plan");
  const [toolAction, setToolAction] = useState(
    "Update the renewal risk level and the visible follow-up note on the page."
  );
  const [toolPermission, setToolPermission] = useState<"ASK" | "ALLOW">("ASK");

  const prompt = useMemo(() => {
    const employee =
      employees.find((item) => item.username === employeeUsername)?.nickname ??
      employeeUsername;
    const contextReference = `{ type: "page-element", id: "${contextId}", title: "${contextTitle}" }`;
    const taskAutoSend = pattern === "manual" ? false : autoSend;
    const patternInstructions = {
      shortcut: `Place an AIEmployeeShortcut in the page header, visually separated from the registered business element. Target the embedded chat controller and configure this task on its tasks prop:
- Title: ${taskTitle}
- User message: ${taskMessage}
- Auto send: ${taskAutoSend}
- Set task.message.workContext to [${contextReference}].

The Shortcut must remain outside the registered element so the scene clearly demonstrates an explicit task-to-context reference.`,
      preset: `Do not render an AIEmployeeShortcut. Configure AIChatProvider.employeeTasks for ${employee} (${employeeUsername}) and show this task in the embedded conversation empty state:
- Title: ${taskTitle}
- User message: ${taskMessage}
- Auto send: ${taskAutoSend}
- Set task.message.workContext to [${contextReference}].

The task should disappear after a conversation starts and must resolve the latest page values when triggered.`,
      scope: `Place an AIEmployeeShortcut in the scene header and wrap both the business work area and chat surface with:

<AIPageContextScope context={${contextReference}}>
  {/* Complete business scene and conversation */}
</AIPageContextScope>

Configure the Shortcut task without message.workContext so it inherits the surrounding context. Keep the registered element and task visibly within the same scoped scene.`,
      manual: `Do not pre-attach workContext to a Shortcut or preset task. Add a "Pick page element" composer action using useAIPageElementPicker. When the user selects an element, call addWorkContext(item) and focusComposer().

Show "${taskMessage}" as a suggested prompt near the chat, but keep it in the composer for review. The user must pick context manually before sending, so this scene must not auto-send.`,
    }[pattern];

    const capabilityInstructions = {
      context: `Build the primary work area as a polished, read-only business detail view based on the scene brief. Include at least five realistic fields, a status indicator, and a short recent-activity section. Register the complete detail region with useAIPageElementHandle and return its current serializable values from getContext. Reuse handle.ref on the visible element and handle.context wherever the scene needs a context reference.`,
      "form-filler": `Build the primary work area with two connected parts: realistic source material and an editable business form derived from the scene brief. Use React Hook Form and register the form with useAIForm using id "${contextId}", meaningful field definitions, getValues, and setValues.

Use the fixed built-in formFiller Tool. Do not register Form filler as a custom frontend Tool and do not add formFiller manually to task.skillSettings: the Registry activates it automatically when a registered form context is sent. The Tool may fill declared editable values only and must never submit or save the form. Include a visible reset action and import applyReactHookFormValues from the optional adapters/react-hook-form Registry item for setValues.`,
      "custom-tool": `Register a custom frontend Tool on the useAIPageElement descriptor:
- Name: ${toolName}
- Business action: ${toolAction}
- Permission: ${toolPermission}
- Provide a concise description, JSON inputSchema, and execute(args).

Build visible state in the business work area that clearly changes when this Tool succeeds, including before/after values or a status/note update. Keep it separate from the fixed formFiller Tool. The execute function must update only the current React page state and return a serializable result. NocoBase runtime handles ASK / ALLOW execution behavior.
`,
    }[capability];

    return `Build a complete, self-contained NocoBase AI page-context scene.

Scene
- Title: ${sceneTitle}
- Business brief: ${sceneBrief}
- Create a dedicated demo page or scene component rather than adding an isolated integration snippet to an unspecified page.
- Use realistic fixed sample data so the scene works immediately without additional backend setup.
- Add a clear page header, a primary business work area, and an embedded AI conversation in a responsive two-column layout. Stack the conversation below the work area on smaller screens.
- Keep one AIChatProvider mounted for the entire scene and target the same chat controller from any Shortcut.

AI employee and task
- Employee: ${employee} (${employeeUsername})
- Task: ${taskTitle}
- Message: ${taskMessage}
- Auto send: ${taskAutoSend}

Business context
- Context id: ${contextId}
- Context title: ${contextTitle}
- Register a visible, meaningful business element with this stable id.
- Resolve its content at task or message send time so the AI always receives the latest displayed values.
- Prefer useAIPageElementHandle so the registered ref and context reference cannot drift apart.

AI interaction pattern
${patternInstructions}

Business surface and capability
${capabilityInstructions}

Implementation requirements
- Use AIProvider and AIPageElementProvider from the NocoBase AI Registry.
- Use AIChatProvider, ChatInline, AIChatWindow, and useAIChatController to create the working conversation beside the business surface.
- The finished result must demonstrate the entire user journey: inspect or edit the business surface, trigger or compose the AI request, see the selected context, and observe the response or page update.
- Keep page context serializable. Never pass React instances, DOM nodes, form instances, or callback functions to the backend.
- Public React APIs use context id, not Flow Model uid.
- Page-context resolution errors must block sending and remain visible to the user; do not silently send an unresolved reference.
- Explicit task message.workContext takes precedence over trigger context and AIPageContextScope.
- A task without explicit context inherits the surrounding scope.
- Manual Pick affects only the current composed message.
- Preserve NocoBase streaming, conversation history, Tool approval, and resume behavior.
- Use shadcn/Base UI components and the existing Registry components.
- Deliver the complete component code, including sample state, context registration, task configuration, chat layout, and all visible business UI.`;
  }, [
    autoSend,
    capability,
    contextId,
    contextTitle,
    employeeUsername,
    employees,
    pattern,
    sceneBrief,
    sceneTitle,
    taskMessage,
    taskTitle,
    toolAction,
    toolName,
    toolPermission,
  ]);

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4">
          <CardTitle>Scene settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 py-5">
          <div className="space-y-2">
            <Label htmlFor="context-generator-scene-title">Scene title</Label>
            <Input
              id="context-generator-scene-title"
              value={sceneTitle}
              onChange={(event) => setSceneTitle(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="context-generator-scene-brief">
              Business scene
            </Label>
            <Textarea
              id="context-generator-scene-brief"
              value={sceneBrief}
              onChange={(event) => setSceneBrief(event.target.value)}
              className="min-h-28"
            />
          </div>

          <div className="space-y-2">
            <Label>AI employee</Label>
            <Select
              value={employeeUsername}
              onValueChange={(value) => value && setEmployeeUsername(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(availableEmployees.length
                  ? availableEmployees
                  : employees
                ).map((employee) => (
                  <SelectItem key={employee.username} value={employee.username}>
                    {employee.nickname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="context-generator-task-title">Task title</Label>
            <Input
              id="context-generator-task-title"
              value={taskTitle}
              onChange={(event) => setTaskTitle(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="context-generator-task-message">Task message</Label>
            <Textarea
              id="context-generator-task-message"
              value={taskMessage}
              onChange={(event) => setTaskMessage(event.target.value)}
              className="min-h-24"
            />
          </div>
          <label className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2.5">
            <span>
              <span className="block text-sm font-medium">Auto send</span>
              <span className="block text-xs text-muted-foreground">
                Otherwise fill the composer for review.
              </span>
            </span>
            <Switch
              checked={pattern === "manual" ? false : autoSend}
              disabled={pattern === "manual"}
              onCheckedChange={setAutoSend}
            />
          </label>
          {pattern === "manual" ? (
            <p className="-mt-3 text-xs leading-5 text-muted-foreground">
              Manual Pick keeps the message in the composer so context can be
              selected before sending.
            </p>
          ) : null}

          <div className="space-y-2">
            <Label>Context integration</Label>
            <Select
              value={pattern}
              onValueChange={(value) =>
                value && setPattern(value as ContextPattern)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shortcut">Shortcut task</SelectItem>
                <SelectItem value="preset">Conversation preset task</SelectItem>
                <SelectItem value="scope">Scope inheritance</SelectItem>
                <SelectItem value="manual">Manual Pick</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div className="space-y-2">
              <Label htmlFor="context-generator-id">Context id</Label>
              <Input
                id="context-generator-id"
                value={contextId}
                onChange={(event) => setContextId(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="context-generator-title">Context title</Label>
              <Input
                id="context-generator-title"
                value={contextTitle}
                onChange={(event) => setContextTitle(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Page capability</Label>
            <Select
              value={capability}
              onValueChange={(value) =>
                value && setCapability(value as PageCapability)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="context">Context only</SelectItem>
                <SelectItem value="form-filler">
                  Built-in Form filler
                </SelectItem>
                <SelectItem value="custom-tool">
                  Custom frontend Tool
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {capability === "custom-tool" ? (
            <div className="space-y-4 rounded-lg border p-3">
              <div className="space-y-2">
                <Label htmlFor="context-generator-tool-name">Tool name</Label>
                <Input
                  id="context-generator-tool-name"
                  value={toolName}
                  onChange={(event) => setToolName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="context-generator-tool-action">
                  Business action
                </Label>
                <Textarea
                  id="context-generator-tool-action"
                  value={toolAction}
                  onChange={(event) => setToolAction(event.target.value)}
                  className="min-h-20"
                />
              </div>
              <div className="space-y-2">
                <Label>Permission</Label>
                <Select
                  value={toolPermission}
                  onValueChange={(value) =>
                    value && setToolPermission(value as "ASK" | "ALLOW")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ASK">ASK</SelectItem>
                    <SelectItem value="ALLOW">ALLOW</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <PromptCard
        title="Complete page context scene prompt"
        description="Copy this prompt to generate the business page, AI interaction, context binding, and working conversation as one complete scene."
        prompt={prompt}
      />
    </div>
  );
}
