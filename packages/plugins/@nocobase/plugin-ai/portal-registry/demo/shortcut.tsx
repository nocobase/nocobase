import {
  AIChatWindow,
  AIEmployeeShortcut,
  AIModelSelectOptions,
  ChatInline,
  useAIPageElement,
  useAIPageElementPicker,
} from "../components";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  AIChatProvider,
  AIPageContextScope,
  findAIModel,
  useAI,
  useAIChatController,
  type AIChatController,
  type AIEmployeeTask,
  type AIEmployeeTasks,
  type AIWorkContextItem,
} from "../providers";
import { MousePointer2, Plus, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { PromptCard } from "./prompt-card";
import { AIConfigurationGate } from "./configuration-gate";

const analyzeTicketTask: AIEmployeeTask = {
  title: "Analyze this ticket",
  message: {
    system:
      "Review the current ticket, identify operational risk, and suggest the next action.",
    user: "Analyze the current ticket and recommend the next action.",
  },
  autoSend: true,
  model: { llmService: "openai", model: "gpt-5" },
  webSearch: true,
  skillSettings: {
    skills: ["ticket-analysis"],
    tools: ["inspect-record"],
  },
};

const draftReplyTask: AIEmployeeTask = {
  title: "Draft a customer reply",
  message: {
    user: "Draft a concise customer reply for the current ticket.",
  },
  autoSend: false,
  skillSettings: {
    skills: ["response-drafting"],
    tools: ["inspect-record"],
  },
};

const reviewOperationalRiskTask: AIEmployeeTask = {
  title: "Review operational risk",
  message: {
    system:
      "Review the current queue, identify operational risk, and prioritize the next actions.",
    user: "Review the current ticket queue and identify operational risk.",
  },
  autoSend: false,
  skillSettings: {
    skills: ["ticket-analysis"],
    tools: ["inspect-record"],
  },
};

const ticketDetail = {
  id: "TK-1042",
  title: "Payment callback delayed",
  status: "Open",
  requester: "Northwind Finance",
  createdAt: "July 22, 2026 · 09:42",
  description:
    "Payment succeeded, but the callback reached the order service twelve minutes late. The customer needs an impact assessment and a response before the next settlement window.",
};

const tickets = [
  ticketDetail,
  { id: "TK-1041", title: "Unable to update profile" },
  { id: "TK-1038", title: "Invoice export formatting" },
];

const isBusinessEmployee = (employee: { username: string }) =>
  !["nathan", "dara"].includes(employee.username.toLowerCase());

export function ShortcutPage() {
  return (
    <AIConfigurationGate>
      <ShortcutPageContent />
    </AIConfigurationGate>
  );
}

function ShortcutPageContent() {
  const { employees } = useAI();
  const embeddedController = useAIChatController();
  const businessEmployees = employees.filter(isBusinessEmployee);
  const primaryEmployee =
    businessEmployees.find(
      (employee) => employee.username.toLowerCase() === "atlas"
    ) ?? businessEmployees[0]!;
  const secondaryEmployee =
    businessEmployees.find(
      (employee) => employee.username !== primaryEmployee.username
    ) ?? primaryEmployee;
  const embeddedEmployee =
    businessEmployees.find(
      (employee) => employee.username.toLowerCase() === "atlas"
    ) ??
    businessEmployees.find(
      (employee) => employee.username !== primaryEmployee.username
    ) ??
    primaryEmployee;
  const ticketDetailRef = useAIPageElement({
    id: "support-ticket-detail",
    title: `${ticketDetail.id} · ${ticketDetail.title}`,
    kind: "record-detail",
    getContext: () => ({
      resource: "supportTickets",
      record: ticketDetail,
    }),
  });
  const chatEmployeeTasks = useMemo<AIEmployeeTasks>(
    () => ({
      [primaryEmployee.username]: [analyzeTicketTask, draftReplyTask],
      ...(secondaryEmployee.username !== primaryEmployee.username
        ? {
            [secondaryEmployee.username]: [reviewOperationalRiskTask],
          }
        : {}),
    }),
    [primaryEmployee.username, secondaryEmployee.username]
  );

  return (
    <div className="space-y-12 pb-12">
      <section className="flex flex-wrap items-start justify-between gap-5 border-b pb-8">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">AI Components</Badge>
            <Badge variant="outline">Employee capability</Badge>
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.035em]">
            Employee tasks
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            Bind reusable tasks to AI employees. Tasks can appear directly
            inside a chat when the employee is selected, or be triggered from
            contextual buttons elsewhere in the application.
          </p>
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Scenario 1 · Multiple tasks
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">
            Trigger employee tasks from a business record
          </h2>
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted-foreground">
            The Shortcut component can still sit in a detail header and provide
            the current record as work context. Opening it shows the configured
            analysis and reply tasks below the employee greeting.
          </p>
        </div>
        <AIPageContextScope
          context={{
            type: "page-element",
            id: "support-ticket-detail",
            title: `${ticketDetail.id} · ${ticketDetail.title}`,
          }}
        >
          <Card ref={ticketDetailRef} className="gap-0 overflow-hidden py-0">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b p-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {ticketDetail.id}
                  </span>
                  <Badge variant="outline">{ticketDetail.status}</Badge>
                </div>
                <h3 className="mt-2 text-lg font-semibold tracking-tight">
                  {ticketDetail.title}
                </h3>
              </div>
              <AIEmployeeShortcut
                aiEmployee={primaryEmployee.username}
                tasks={[analyzeTicketTask, draftReplyTask]}
                label={`Ask ${primaryEmployee.nickname}`}
                size={34}
              />
            </div>
            <div className="grid gap-5 p-5 sm:grid-cols-2">
              <div>
                <div className="text-xs text-muted-foreground">Requester</div>
                <div className="mt-1 text-sm font-medium">
                  {ticketDetail.requester}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Created</div>
                <div className="mt-1 text-sm font-medium">
                  {ticketDetail.createdAt}
                </div>
              </div>
            </div>
            <div className="border-t p-5">
              <div className="text-xs text-muted-foreground">Description</div>
              <p className="mt-2 max-w-3xl text-sm leading-6">
                {ticketDetail.description}
              </p>
            </div>
          </Card>
        </AIPageContextScope>
      </section>

      <section className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Scenario 2 · Explicit target
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">
            Send a shortcut task to a designated embedded chat
          </h2>
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted-foreground">
            The shortcut receives the embedded chat Controller directly. Its
            Provider explicitly configures {embeddedEmployee.nickname} and an
            employee task set. It does not need a global target ID and cannot
            accidentally trigger another conversation on the same page.
          </p>
        </div>
        <AIChatProvider
          id="shortcut-embedded-chat"
          controller={embeddedController}
          defaultEmployee={embeddedEmployee.username}
        >
          <div className="grid items-stretch gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Risk review workspace
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-sm leading-6 text-muted-foreground">
                  The embedded chat starts without preset tasks. Clicking the
                  Shortcut injects “Review operational risk” into this specific
                  conversation, where the user can choose it before the request
                  is placed in the composer.
                </p>
                <AIEmployeeShortcut
                  aiEmployee={embeddedEmployee.username}
                  target={embeddedController}
                  tasks={[reviewOperationalRiskTask]}
                  auto={false}
                  context={[
                    {
                      type: "table",
                      title: "Open ticket queue",
                      content: tickets,
                    },
                  ]}
                  label={`Ask ${embeddedEmployee.nickname}`}
                  size={36}
                />
              </CardContent>
            </Card>
            <ChatInline className="h-[560px] min-h-0">
              <AIChatWindow />
            </ChatInline>
          </div>
        </AIChatProvider>
      </section>

      <section className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Scenario 3 · Chat-bound tasks
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">
            Show tasks when the selected employee changes
          </h2>
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted-foreground">
            This conversation window binds task lists directly to business AI
            employees. Starting a new conversation or switching employees in the
            composer immediately replaces the empty-state tasks. Employees
            without a binding keep the normal greeting-only state.
          </p>
        </div>
        <div className="grid items-stretch gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Employee task bindings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="rounded-lg border bg-muted/25 p-3 font-mono text-xs leading-5">
                <div>{primaryEmployee.username}</div>
                <div className="pl-4">Analyze this ticket</div>
                <div className="pl-4">Draft a customer reply</div>
                {secondaryEmployee.username !== primaryEmployee.username ? (
                  <>
                    <div className="mt-2">{secondaryEmployee.username}</div>
                    <div className="pl-4">Review operational risk</div>
                  </>
                ) : null}
              </div>
              <p>
                Switch employees from the bottom of the chat to preview each
                configured task list.
              </p>
              <p>
                The same <code>employeeTasks</code> parameter works in page,
                embedded, side-panel, dialog, and mobile containers.
              </p>
            </CardContent>
          </Card>
          <AIChatProvider
            id="employee-task-scenario-chat"
            defaultEmployee={primaryEmployee.username}
            employeeTasks={chatEmployeeTasks}
          >
            <ChatInline className="h-[620px] min-h-0">
              <AIChatWindow />
            </ChatInline>
          </AIChatProvider>
        </div>
      </section>

      <ShortcutPromptGenerator embeddedController={embeddedController} />
    </div>
  );
}

type CapabilityMode = "preset" | "custom";
type IntegrationMode = "shortcut" | "chat-tasks";
type ChatContainer = "page" | "embedded" | "side-panel" | "dialog";

type ConfigTask = {
  id: string;
  employee: string;
  title: string;
  background: string;
  userMessage: string;
  autoSend: boolean;
  workContext: AIWorkContextItem[];
  model: string;
  webSearch: boolean;
  skillsMode: CapabilityMode;
  skills: string[];
  toolsMode: CapabilityMode;
  tools: string[];
};

const availableSkills = [
  { value: "ticket-analysis", label: "Ticket analysis" },
  { value: "response-drafting", label: "Response drafting" },
  { value: "workflow-design", label: "Workflow design" },
];

const availableTools = [
  { value: "inspect-record", label: "Inspect record" },
  { value: "search-records", label: "Search records" },
  { value: "update-record", label: "Update record" },
];

const initialConfigTasks: ConfigTask[] = [
  {
    id: "analyze-ticket",
    employee: "",
    title: "Analyze this ticket",
    background: "Identify operational risk and recommend the next action.",
    userMessage: "Analyze the current ticket and recommend the next action.",
    autoSend: true,
    workContext: [
      {
        type: "page-element",
        id: "support-ticket-detail",
        title: `${ticketDetail.id} · ${ticketDetail.title}`,
      },
    ],
    model: "gpt-5",
    webSearch: true,
    skillsMode: "custom",
    skills: ["ticket-analysis"],
    toolsMode: "custom",
    tools: ["inspect-record"],
  },
  {
    id: "draft-reply",
    employee: "",
    title: "Draft a customer reply",
    background:
      "Write a concise and helpful response using the ticket context.",
    userMessage: "Draft a customer reply for the current ticket.",
    autoSend: false,
    workContext: [],
    model: "default",
    webSearch: false,
    skillsMode: "custom",
    skills: ["response-drafting"],
    toolsMode: "preset",
    tools: [],
  },
];

function ShortcutPromptGenerator({
  embeddedController,
}: {
  embeddedController: AIChatController;
}) {
  const { employees, models } = useAI();
  const { registeredCount, startPicking } = useAIPageElementPicker();
  const businessEmployees = employees.filter(isBusinessEmployee);
  const defaultBusinessEmployee =
    businessEmployees.find((item) => item.username.toLowerCase() === "atlas") ??
    businessEmployees[0]!;
  const [integrationMode, setIntegrationMode] =
    useState<IntegrationMode>("shortcut");
  const [location, setLocation] = useState("the ticket detail header actions");
  const [employee, setEmployee] = useState(defaultBusinessEmployee.username);
  const [taskEmployee, setTaskEmployee] = useState(
    defaultBusinessEmployee.username
  );
  const [target, setTarget] = useState<"global-side-panel" | "embedded">(
    "global-side-panel"
  );
  const [chatContainer, setChatContainer] = useState<ChatContainer>("embedded");
  const [tasks, setTasks] = useState<ConfigTask[]>(() =>
    initialConfigTasks.map((task) => ({
      ...task,
      employee: defaultBusinessEmployee.username,
    }))
  );
  const [selectedTaskId, setSelectedTaskId] = useState(
    initialConfigTasks[0].id
  );

  const visibleTasks =
    integrationMode === "chat-tasks"
      ? tasks.filter((task) => task.employee === taskEmployee)
      : tasks;
  const selectedTask =
    visibleTasks.find((task) => task.id === selectedTaskId) ?? visibleTasks[0];

  const runtimeTasks = useMemo<AIEmployeeTask[]>(
    () =>
      tasks.map((task) => {
        const selectedModel = findAIModel(models, task.model);
        const customCapabilities =
          task.skillsMode === "custom" || task.toolsMode === "custom";
        return {
          title: task.title,
          message: {
            system: task.background || undefined,
            user: task.userMessage || undefined,
            workContext: task.workContext.length ? task.workContext : undefined,
          },
          autoSend: task.autoSend,
          model: selectedModel
            ? {
                llmService: selectedModel.llmService,
                model: selectedModel.value,
              }
            : undefined,
          webSearch: task.webSearch,
          skillSettings: customCapabilities
            ? {
                skills: task.skillsMode === "custom" ? task.skills : undefined,
                tools: task.toolsMode === "custom" ? task.tools : undefined,
              }
            : undefined,
        };
      }),
    [models, tasks]
  );

  const prompt = useMemo(() => {
    const describeTask = (task: ConfigTask, index: number) => {
      const model =
        task.model === "default"
          ? "Use the AI employee default"
          : models.find((item) => item.value === task.model)?.label ??
            task.model;
      return `${index + 1}. ${task.title}
   - Background: ${task.background || "None"}
   - Default user message: ${task.userMessage || "None"}
   - Send automatically: ${task.autoSend}
   - Work context: ${
     task.workContext.map((item) => item.title ?? item.id).join(", ") ||
     "Inherit the surrounding context"
   }
   - Model: ${model}
   - Web search: ${task.webSearch}
   - Skills: ${
     task.skillsMode === "preset"
       ? "Use the AI employee defaults"
       : task.skills.join(", ") || "Disabled"
   }
   - Tools: ${
     task.toolsMode === "preset"
       ? "Use the AI employee defaults"
       : task.tools.join(", ") || "Disabled"
   }`;
    };

    const taskDescriptions =
      integrationMode === "chat-tasks"
        ? Array.from(new Set(tasks.map((task) => task.employee)))
            .map((employeeUsername) => {
              const employeeTasks = tasks.filter(
                (task) => task.employee === employeeUsername
              );
              return `AI employee: ${employeeUsername}\n${employeeTasks
                .map(describeTask)
                .join("\n")}`;
            })
            .join("\n\n")
        : tasks.map(describeTask).join("\n");

    if (integrationMode === "chat-tasks") {
      const containerLabel = {
        page: "a dedicated page",
        embedded: "an embedded block in the page",
        "side-panel": "a push side panel",
        dialog: "a dialog",
      }[chatContainer];
      return `Add an AI conversation window to ${location} using ${containerLabel}.

Employee task bindings:
${taskDescriptions}

Implementation requirements:
- Render AIChatWindow in the selected container and wrap it with AIChatProvider.
- Configure AIChatProvider with employeeTasks grouped by AI employee username.
- When the user starts a new conversation or switches AI employees, show the matching tasks below that employee’s greeting.
- Employees without configured tasks must keep the greeting-only empty state.
- Selecting a task must respect autoSend: either send immediately or fill the composer for review.
- Resolve task message.workContext when the task starts so selected page elements use their latest values.
- When a task has no message.workContext, inherit the context surrounding the Shortcut or AIChatProvider.
- Preserve every task’s background prompt, model override, Web search setting, Skills, Tools, and work context.
- Keep the employeeTasks capability independent of the container so the same configuration works in page, embedded, side-panel, dialog, and mobile layouts.
- Use the existing AIProvider/AIChatProvider runtime with shadcn/Base UI components.`;
    }

    return `Add an AI employee shortcut to ${location}.

Shortcut configuration:
- AI employee: ${employee}
- Target conversation: ${
      target === "global-side-panel"
        ? "the default global push side panel"
        : "the embedded chat rendered in this page section"
    }
- Include the current record or form values as work context.

Tasks:
${taskDescriptions}

Implementation requirements:
- Use AIEmployeeShortcut and pass all configured tasks through its tasks prop.
- When multiple tasks are provided, open a new conversation and show the tasks below the AI employee greeting.
- Selecting a task must respect that task's autoSend setting: either send immediately or fill the composer for review.
- Resolve task message.workContext when the task starts so selected page elements use their latest values.
- When a task has no message.workContext, inherit the context surrounding the Shortcut or AIChatProvider.
- Preserve each task's background prompt, work context, model override, Web search setting, Skills, and Tools.
- ${
      target === "global-side-panel"
        ? "Use the global AI chat controller; do not pass a target prop."
        : "Create a dedicated controller with useAIChatController(), bind it to the embedded AIChatProvider, and pass it through the shortcut target prop."
    }
- Use the existing AIProvider and AIChatProvider runtime with shadcn/Base UI components.`;
  }, [
    chatContainer,
    employee,
    integrationMode,
    location,
    models,
    target,
    tasks,
  ]);

  const updateSelectedTask = (patch: Partial<ConfigTask>) => {
    if (!selectedTask) return;
    setTasks((current) =>
      current.map((task) =>
        task.id === selectedTask.id ? { ...task, ...patch } : task
      )
    );
  };

  const addTask = () => {
    const id = `task-${crypto.randomUUID()}`;
    setTasks((current) => [
      ...current,
      {
        id,
        employee: integrationMode === "chat-tasks" ? taskEmployee : employee,
        title: `Task ${current.length + 1}`,
        background: "",
        userMessage: "",
        autoSend: false,
        workContext: [],
        model: "default",
        webSearch: false,
        skillsMode: "preset",
        skills: [],
        toolsMode: "preset",
        tools: [],
      },
    ]);
    setSelectedTaskId(id);
  };

  const removeTask = (id: string) => {
    if (tasks.length === 1) return;
    const nextTasks = tasks.filter((task) => task.id !== id);
    setTasks(nextTasks);
    if (selectedTaskId === id) {
      const nextSelectedTask =
        integrationMode === "chat-tasks"
          ? nextTasks.find((task) => task.employee === taskEmployee)
          : nextTasks[0];
      setSelectedTaskId(nextSelectedTask?.id ?? "");
    }
  };

  const toggleCapability = (
    type: "skills" | "tools",
    value: string,
    checked: boolean
  ) => {
    if (!selectedTask) return;
    const current = selectedTask[type];
    updateSelectedTask({
      [type]: checked
        ? [...current, value]
        : current.filter((item) => item !== value),
    });
  };

  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Employee tasks prompt
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">
          Generate an integration prompt
        </h2>
        <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted-foreground">
          Choose whether tasks are exposed through a contextual Shortcut or
          directly by the selected employee in a chat. Both modes share the same
          task, model, Web search, Skills, and Tools configuration.
        </p>
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="gap-0 py-0">
          <CardHeader className="py-4">
            <CardTitle className="text-base">
              Employee task configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pb-4">
            <label className="block space-y-2 text-xs font-medium">
              <span>Integration</span>
              <Select
                value={integrationMode}
                onValueChange={(value) => {
                  if (!value) return;
                  const mode = value as IntegrationMode;
                  setIntegrationMode(mode);
                  setLocation(
                    mode === "shortcut"
                      ? "the ticket detail header actions"
                      : "the ticket detail page"
                  );
                  const nextTask =
                    mode === "chat-tasks"
                      ? tasks.find((task) => task.employee === taskEmployee)
                      : tasks[0];
                  setSelectedTaskId(nextTask?.id ?? "");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {integrationMode === "shortcut"
                      ? "Contextual Shortcut"
                      : "Tasks inside a chat"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shortcut">Contextual Shortcut</SelectItem>
                  <SelectItem value="chat-tasks">
                    Tasks inside a chat
                  </SelectItem>
                </SelectContent>
              </Select>
            </label>
            {integrationMode === "chat-tasks" ? (
              <label className="block space-y-2 border-t pt-4 text-xs font-medium">
                <span>AI employee</span>
                <Select
                  value={taskEmployee}
                  onValueChange={(value) => {
                    if (!value) return;
                    setTaskEmployee(value);
                    setSelectedTaskId(
                      tasks.find((task) => task.employee === value)?.id ?? ""
                    );
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {businessEmployees.find(
                        (item) => item.username === taskEmployee
                      )?.nickname ?? taskEmployee}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {businessEmployees.map((item) => (
                      <SelectItem key={item.username} value={item.username}>
                        {item.nickname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="block font-normal leading-5 text-muted-foreground">
                  Select an employee first, then configure the tasks shown in
                  that employee’s new-conversation state.
                </span>
              </label>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              {integrationMode === "shortcut" ? (
                <label className="block space-y-2 text-xs font-medium">
                  <span>AI employee</span>
                  <Select
                    value={employee}
                    onValueChange={(value) => value && setEmployee(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {businessEmployees.find(
                          (item) => item.username === employee
                        )?.nickname ?? employee}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {businessEmployees.map((item) => (
                        <SelectItem key={item.username} value={item.username}>
                          {item.nickname}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              ) : null}
              <label className="block space-y-2 text-xs font-medium">
                <span>Placement</span>
                <Input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                />
              </label>
              {integrationMode === "chat-tasks" ? (
                <label className="block space-y-2 text-xs font-medium">
                  <span>Chat container</span>
                  <Select
                    value={chatContainer}
                    onValueChange={(value) =>
                      value && setChatContainer(value as ChatContainer)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {
                          {
                            page: "Page",
                            embedded: "Embedded block",
                            "side-panel": "Side panel",
                            dialog: "Dialog",
                          }[chatContainer]
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="page">Page</SelectItem>
                      <SelectItem value="embedded">Embedded block</SelectItem>
                      <SelectItem value="side-panel">Side panel</SelectItem>
                      <SelectItem value="dialog">Dialog</SelectItem>
                    </SelectContent>
                  </Select>
                </label>
              ) : null}
            </div>

            {integrationMode === "shortcut" ? (
              <label className="block space-y-2 text-xs font-medium">
                <span>Target conversation</span>
                <Select
                  value={target}
                  onValueChange={(value) =>
                    value &&
                    setTarget(value as "global-side-panel" | "embedded")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {target === "global-side-panel"
                        ? "Global side panel"
                        : "Embedded chat"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global-side-panel">
                      Global side panel
                    </SelectItem>
                    <SelectItem value="embedded">Embedded chat</SelectItem>
                  </SelectContent>
                </Select>
              </label>
            ) : null}

            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">Tasks</div>
                  <div className="text-xs text-muted-foreground">
                    {visibleTasks.length} configured task
                    {visibleTasks.length === 1 ? "" : "s"}
                    {integrationMode === "chat-tasks"
                      ? " for this employee"
                      : ""}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={addTask}>
                  <Plus /> Add task
                </Button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {visibleTasks.map((task, index) => (
                  <div
                    key={task.id}
                    className={
                      task.id === selectedTask?.id
                        ? "flex items-center gap-2 rounded-lg border border-foreground/25 bg-muted/60 p-1"
                        : "flex items-center gap-2 rounded-lg border p-1"
                    }
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 rounded-md px-2 py-1.5 text-left"
                      onClick={() => setSelectedTaskId(task.id)}
                    >
                      <span className="block truncate text-xs font-medium">
                        {index + 1}. {task.title}
                      </span>
                      <span className="block text-[10px] text-muted-foreground">
                        {task.autoSend ? "Auto send" : "Fill composer"}
                        {task.workContext.length ? " · Task context" : ""}
                        {task.webSearch ? " · Web search" : ""}
                      </span>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      disabled={tasks.length === 1}
                      aria-label={`Remove ${task.title}`}
                      onClick={() => removeTask(task.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {selectedTask ? (
              <div className="space-y-3 border-t pt-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-2 text-xs font-medium">
                    <span>Title</span>
                    <Input
                      value={selectedTask.title}
                      onChange={(event) =>
                        updateSelectedTask({ title: event.target.value })
                      }
                    />
                  </label>
                  <label className="block space-y-2 text-xs font-medium">
                    <span>Model</span>
                    <Select
                      value={selectedTask.model}
                      onValueChange={(value) =>
                        value && updateSelectedTask({ model: value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue className="min-w-0 overflow-hidden">
                          <span
                            className="block min-w-0 truncate"
                            title={
                              selectedTask.model === "default"
                                ? "Use employee default"
                                : findAIModel(models, selectedTask.model)
                                    ?.label ?? selectedTask.model
                            }
                          >
                            {selectedTask.model === "default"
                              ? "Use employee default"
                              : findAIModel(models, selectedTask.model)
                                  ?.label ?? selectedTask.model}
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">
                          Use employee default
                        </SelectItem>
                        <SelectSeparator />
                        <AIModelSelectOptions models={models} />
                      </SelectContent>
                    </Select>
                  </label>
                </div>
                <label className="block space-y-2 text-xs font-medium">
                  <span>Default user message</span>
                  <Textarea
                    className="min-h-16"
                    value={selectedTask.userMessage}
                    onChange={(event) =>
                      updateSelectedTask({ userMessage: event.target.value })
                    }
                  />
                </label>
                <label className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2.5 text-sm">
                  <span>
                    <span className="block font-medium">Auto send</span>
                    <span className="block text-xs text-muted-foreground">
                      Otherwise the message is placed in the composer.
                    </span>
                  </span>
                  <Switch
                    size="sm"
                    checked={selectedTask.autoSend}
                    onCheckedChange={(checked) =>
                      updateSelectedTask({ autoSend: checked })
                    }
                  />
                </label>
                <div className="space-y-3 rounded-lg border px-3 py-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <span>
                      <span className="block text-sm font-medium">
                        Work context
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Select a page context for this task. Without one, the
                        task inherits its surrounding context.
                      </span>
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={registeredCount === 0}
                      onClick={() =>
                        startPicking({
                          onSelect: (item) =>
                            updateSelectedTask({
                              workContext: [
                                {
                                  type: item.type,
                                  id: item.id,
                                  title: item.title,
                                  kind: item.kind,
                                },
                              ],
                            }),
                        })
                      }
                    >
                      <MousePointer2 /> Pick context
                    </Button>
                  </div>
                  {selectedTask.workContext.map((item, index) => (
                    <div
                      key={`${item.type}:${item.id ?? index}`}
                      className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5 text-xs"
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {item.title ?? item.id ?? item.type}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Remove task context"
                        onClick={() => updateSelectedTask({ workContext: [] })}
                      >
                        <X />
                      </Button>
                    </div>
                  ))}
                </div>

                <Accordion>
                  <AccordionItem
                    value="advanced-task-settings"
                    className="rounded-lg border px-3"
                  >
                    <AccordionTrigger className="no-underline hover:no-underline">
                      <span>
                        <span className="block">Advanced task settings</span>
                        <span className="block text-xs font-normal text-muted-foreground">
                          Background, Web search, Skills, and Tools
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-1">
                      <label className="block space-y-2 text-xs font-medium">
                        <span>Background</span>
                        <Textarea
                          className="min-h-16"
                          value={selectedTask.background}
                          onChange={(event) =>
                            updateSelectedTask({
                              background: event.target.value,
                            })
                          }
                        />
                      </label>
                      <label className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2.5 text-sm">
                        <span>
                          <span className="block font-medium">Web search</span>
                          <span className="block text-xs text-muted-foreground">
                            Subject to the selected LLM service capability.
                          </span>
                        </span>
                        <Switch
                          size="sm"
                          checked={selectedTask.webSearch}
                          onCheckedChange={(checked) =>
                            updateSelectedTask({ webSearch: checked })
                          }
                        />
                      </label>
                      <CapabilityEditor
                        title="Skills"
                        mode={selectedTask.skillsMode}
                        values={selectedTask.skills}
                        options={availableSkills}
                        onModeChange={(skillsMode) =>
                          updateSelectedTask({ skillsMode })
                        }
                        onToggle={(value, checked) =>
                          toggleCapability("skills", value, checked)
                        }
                      />
                      <CapabilityEditor
                        title="Tools"
                        mode={selectedTask.toolsMode}
                        values={selectedTask.tools}
                        options={availableTools}
                        onModeChange={(toolsMode) =>
                          updateSelectedTask({ toolsMode })
                        }
                        onToggle={(value, checked) =>
                          toggleCapability("tools", value, checked)
                        }
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <div>
                <div className="text-xs font-medium">
                  {integrationMode === "shortcut"
                    ? "Live shortcut preview"
                    : "Chat-bound task configuration"}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {integrationMode === "shortcut"
                    ? "Multiple tasks appear in the chat empty state after opening."
                    : "Use the third scenario above to preview employee switching."}
                </div>
              </div>
              {integrationMode === "shortcut" ? (
                <AIEmployeeShortcut
                  aiEmployee={employee}
                  tasks={runtimeTasks}
                  target={
                    target === "embedded" ? embeddedController : undefined
                  }
                  label={`Ask ${
                    businessEmployees.find((item) => item.username === employee)
                      ?.nickname ?? employee
                  }`}
                  size={34}
                />
              ) : null}
            </div>
          </CardContent>
        </Card>
        <PromptCard
          title={
            integrationMode === "shortcut"
              ? "Add an AI employee task shortcut"
              : "Add employee tasks to a chat"
          }
          description={
            integrationMode === "shortcut"
              ? "The prompt includes every task, capability override, and target conversation."
              : "The prompt groups configured tasks by business AI employee and selected chat container."
          }
          prompt={prompt}
        />
      </div>
    </section>
  );
}

function CapabilityEditor({
  title,
  mode,
  values,
  options,
  onModeChange,
  onToggle,
}: {
  title: string;
  mode: CapabilityMode;
  values: string[];
  options: { value: string; label: string }[];
  onModeChange: (mode: CapabilityMode) => void;
  onToggle: (value: string, checked: boolean) => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-medium">{title}</div>
          <div className="text-xs text-muted-foreground">
            Preset inherits the AI employee configuration.
          </div>
        </div>
        <Select
          value={mode}
          onValueChange={(value) =>
            value && onModeChange(value as CapabilityMode)
          }
        >
          <SelectTrigger size="sm" className="w-28">
            <SelectValue>{mode === "preset" ? "Preset" : "Custom"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="preset">Preset</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {mode === "custom" ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 rounded-md bg-muted/40 px-2.5 py-2 text-xs"
            >
              <Checkbox
                checked={values.includes(option.value)}
                onCheckedChange={(checked) => onToggle(option.value, checked)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}
