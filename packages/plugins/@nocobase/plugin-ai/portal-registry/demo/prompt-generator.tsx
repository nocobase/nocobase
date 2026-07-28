import {
  AIChatCompact,
  AIChatWindow,
  ChatInline,
  ChatPage,
  useAIPageElementPicker,
  type AIChatComposerAction,
} from "../components";
import { PromptOutput } from "@/components/demo/prompt-output";
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
import { AIChatProvider, useAIChatBase } from "../providers";
import { Globe2, MousePointer2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { ChatContainer } from "./container-showcase";

type PromptCapabilities = {
  conversationList: boolean;
  employeeSelector: boolean;
  modelSelector: boolean;
  userPrompt: boolean;
  pageElement: boolean;
  upload: boolean;
  webSearch: boolean;
  panelExpansion: boolean;
};

type MessagePresentation = "transcript" | "compact-history-dialog";

const placements: Array<{
  value: ChatContainer;
  label: string;
  description: string;
}> = [
  {
    value: "embedded",
    label: "Inside the page",
    description: "Embed chat in the selected content region.",
  },
  {
    value: "page",
    label: "Dedicated page",
    description: "Create a full route for the AI conversation.",
  },
  {
    value: "side-panel",
    label: "Right side panel",
    description: "Push the page narrower while chat is open.",
  },
  {
    value: "dialog",
    label: "Dialog",
    description: "Open chat from a button or page action.",
  },
  {
    value: "mobile",
    label: "Mobile region",
    description: "Optimize the embedded container for a narrow viewport.",
  },
];

const DEFAULT_CAPABILITIES: PromptCapabilities = {
  conversationList: true,
  employeeSelector: true,
  modelSelector: true,
  userPrompt: true,
  pageElement: true,
  upload: true,
  webSearch: true,
  panelExpansion: true,
};

export function PromptGenerator() {
  return (
    <AIChatProvider id="prompt-generator-preview">
      <PromptGeneratorContent />
    </AIChatProvider>
  );
}

function PromptGeneratorContent() {
  const { id: chatId, addWorkContext, focusComposer } = useAIChatBase();
  const { registeredCount, startPicking } = useAIPageElementPicker();
  const [target, setTarget] = useState("the current page's main content area");
  const [placement, setPlacement] = useState<ChatContainer>("embedded");
  const [panelWidth, setPanelWidth] = useState("450");
  const [messagePresentation, setMessagePresentation] =
    useState<MessagePresentation>("transcript");
  const [capabilities, setCapabilities] = useState(DEFAULT_CAPABILITIES);

  const previewActions = useMemo<AIChatComposerAction[]>(() => {
    const actions: AIChatComposerAction[] = [];
    if (capabilities.pageElement) {
      actions.push({
        key: "pick-page-element",
        label: "Pick page element",
        icon: <MousePointer2 />,
        disabled: registeredCount === 0,
        onClick: () =>
          startPicking({
            chatId,
            onSelect: (item) => {
              addWorkContext(item);
              focusComposer();
            },
          }),
      });
    }
    if (capabilities.webSearch) {
      actions.push({
        key: "web-search",
        label: "Web search",
        icon: <Globe2 />,
      });
    }
    return actions;
  }, [
    addWorkContext,
    capabilities.pageElement,
    capabilities.webSearch,
    chatId,
    focusComposer,
    registeredCount,
    startPicking,
  ]);

  const updateCapability = (key: keyof PromptCapabilities, value: boolean) => {
    setCapabilities((current) => ({ ...current, [key]: value }));
  };

  const prompt = useMemo(() => {
    const placementInstruction = {
      embedded:
        "Render ChatInline inside the target content region and keep its width fluid within the parent container.",
      page: "Create a dedicated route and render ChatPage with AIChatWindow filling the available page content.",
      "side-panel": `Use ChatSurface with variant="side-panel" on the right and a ${panelWidth}px width. Opening chat must push the page narrower instead of covering it on desktop; mobile may use an overlay.`,
      dialog:
        "Open ChatSurface with variant=\"dialog\" from a page action. Keep conversation state in AIProvider/AIChatProvider so closing the dialog does not discard it.",
      mobile:
        "Render ChatInline in the target region with a mobile-first width around 390px and preserve the same responsive AIChatWindow API.",
    }[placement];

    return `Add the standard NocoBase AI conversation to ${
      target || "the target page"
    }.

Placement:
- ${placementInstruction}
- Keep AIChatWindow position-independent. The surface wrapper owns placement and dimensions.

Message presentation:
- ${
      messagePresentation === "transcript"
        ? "Render the full AIChatMessageList inline as part of AIChatWindow."
        : "Use AIChatCompact for the working surface and open AIChatHistoryDialog when the user requests the full transcript."
    }

Conversation capabilities:
- Conversation list: ${capabilities.conversationList}
- AI employee selector: ${capabilities.employeeSelector}
- Model selector: ${capabilities.modelSelector}
- Personalized prompt editor: ${capabilities.userPrompt}
- Pick page element: ${capabilities.pageElement}
- Upload action: ${capabilities.upload}
- Web search action: ${capabilities.webSearch}
- Side panel can expand to a 95% dialog and collapse back: ${
      capabilities.panelExpansion
    }
- Tool approval follows NocoBase permissions. Always show Allow / Deny when the backend marks a tool as ASK.

Implementation requirements:
- Use AIProvider at application level and AIChatProvider with a stable id for this chat instance.
- Wrap the application content with AIPageElementProvider when page-element picking is enabled.
- Register selectable React components with useAIPageElement and return serializable business context from getContext.
- Reuse AIChatWindow and the existing providers; do not duplicate message, streaming, reasoning, or tool-call state.
- When the right panel is expandable, render one AIChatWindow inside ChatSurface and change only its variant between "side-panel" and "dialog". Put ChatSurfaceActions in the window header.
- Keep the generic Tool Call shell responsible for status, ASK approval, errors, and disclosure. Register business-specific bodies through AIToolRendererProvider.
- Include the built-in specialized Tool Card renderers. This is part of the standard AI chat capability, not an optional page setting.
- Register browser-side tool implementations through AIProvider.toolInvokers. After all interrupted calls are approved, the provider executes these handlers and sends their results when resuming the NocoBase conversation.
- Pass application actions through composerActions.
- AIChatProvider handles NocoBase ASK decisions and resumes tool execution. Use onToolCallDecision only for application-specific side effects or telemetry.
- Use shadcn/Base UI components only; do not introduce Ant Design, Radix, or Zustand.
- Match the existing NocoBase ChatBox behavior and black/white/gray visual system.`;
  }, [capabilities, messagePresentation, panelWidth, placement, target]);

  const previewChat =
    messagePresentation === "transcript" ? (
      <AIChatWindow
        composerActions={previewActions}
        showConversationToggle={capabilities.conversationList}
        showEmployeeSelector={capabilities.employeeSelector}
        showModelSelector={capabilities.modelSelector}
        showUserPrompt={capabilities.userPrompt}
        enableAttachments={capabilities.upload}
        attachmentActionIndex={capabilities.pageElement ? 1 : 0}
        disclaimer={false}
        onToolCallDecision={async () => undefined}
      />
    ) : (
      <AIChatCompact
        className="h-full rounded-none border-0"
        composerActions={previewActions}
        showEmployeeSelector={capabilities.employeeSelector}
        showModelSelector={capabilities.modelSelector}
        showUserPrompt={capabilities.userPrompt}
        enableAttachments={capabilities.upload}
        disclaimer={false}
        onToolCallDecision={async () => undefined}
      />
    );

  const previewSurface = (() => {
    if (placement === "page") {
      return (
        <ChatPage className="h-[430px] min-h-0 w-full max-w-none">
          {previewChat}
        </ChatPage>
      );
    }
    if (placement === "side-panel") {
      return (
        <div className="flex h-[430px] w-full overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="hidden min-w-0 flex-1 space-y-4 bg-muted/20 p-5 sm:block">
            <div className="h-7 w-40 rounded-md bg-muted" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-24 rounded-lg border bg-background" />
              <div className="h-24 rounded-lg border bg-background" />
            </div>
            <div className="h-48 rounded-lg border bg-background" />
          </div>
          <aside
            className="h-full max-w-full shrink-0 border-l bg-card"
            style={{ width: `${panelWidth}px` }}
          >
            {previewChat}
          </aside>
        </div>
      );
    }
    if (placement === "dialog") {
      return (
        <div className="relative h-[430px] w-full overflow-hidden rounded-xl border bg-muted/30 p-5">
          <div className="space-y-3 opacity-45">
            <div className="h-7 w-44 rounded bg-muted-foreground/20" />
            <div className="h-24 rounded-lg bg-background" />
            <div className="h-48 rounded-lg bg-background" />
          </div>
          <div className="absolute inset-4 overflow-hidden rounded-xl border bg-card shadow-2xl sm:inset-8">
            {previewChat}
          </div>
        </div>
      );
    }
    if (placement === "mobile") {
      return (
        <div className="h-[430px] w-full max-w-[390px] overflow-hidden rounded-[2rem] border-4 border-foreground/15 bg-card shadow-lg">
          {previewChat}
        </div>
      );
    }
    return (
      <ChatInline className="h-[430px] w-full max-w-2xl">
        {previewChat}
      </ChatInline>
    );
  })();

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-base">Describe the integration</CardTitle>
          <p className="text-xs leading-5 text-muted-foreground">
            Choose where chat belongs and which capabilities the target page
            needs.
          </p>
        </CardHeader>
        <CardContent className="space-y-5 p-4">
          <div className="space-y-2">
            <label className="text-xs font-medium" htmlFor="ai-chat-target">
              Target page or region
            </label>
            <Input
              id="ai-chat-target"
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              placeholder="e.g. the ticket detail page"
            />
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium">Placement</div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {placements.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  data-active={placement === option.value}
                  className="rounded-lg border px-3 py-2.5 text-left transition-colors hover:bg-muted/40 data-active:border-foreground/35 data-active:bg-muted/60"
                  onClick={() => setPlacement(option.value)}
                >
                  <span className="block text-sm font-medium">
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {placement === "side-panel" ? (
            <div className="space-y-2">
              <div className="text-xs font-medium">Side panel width</div>
              <Select
                value={panelWidth}
                onValueChange={(value) => value && setPanelWidth(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{panelWidth}px</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="400">400px</SelectItem>
                  <SelectItem value="450">450px · NocoBase default</SelectItem>
                  <SelectItem value="520">520px</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="space-y-2">
            <div className="text-xs font-medium">Message presentation</div>
            <Select
              value={messagePresentation}
              onValueChange={(value) =>
                value && setMessagePresentation(value as MessagePresentation)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {messagePresentation === "transcript"
                    ? "Full transcript"
                    : "Compact + history dialog"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transcript">Full transcript</SelectItem>
                <SelectItem value="compact-history-dialog">
                  Compact + history dialog
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 border-t pt-4">
            <div className="mb-2 text-xs font-medium">Capabilities</div>
            {(Object.keys(capabilities) as Array<keyof PromptCapabilities>).map(
              (key) => (
                <label
                  key={key}
                  className="flex items-center justify-between gap-4 py-1.5 text-sm"
                >
                  <span className="min-w-0">
                    <span className="block">{capabilityLabel(key)}</span>
                  </span>
                  <Switch
                    size="sm"
                    checked={capabilities[key]}
                    onCheckedChange={(checked) =>
                      updateCapability(key, checked)
                    }
                  />
                </label>
              )
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-5">
        <Card className="gap-0 overflow-hidden py-0">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <div className="text-sm font-medium">Capabilities preview</div>
              <div className="text-xs text-muted-foreground">
                The selected controls are rendered on the real AIChatWindow.
              </div>
            </div>
            <code className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
              {placementLabel(placement)}
            </code>
          </div>
          <div className="flex justify-center bg-muted/20 p-3 sm:p-4">
            {previewSurface}
          </div>
        </Card>

        <PromptOutput
          title="Generated implementation prompt"
          description="Updates from the selected page, placement, and capabilities."
          prompt={prompt}
          promptClassName="max-h-[760px] min-h-[520px]"
        />
      </div>
    </div>
  );
}

const capabilityLabel = (key: keyof PromptCapabilities) =>
  ({
    conversationList: "Conversation list",
    employeeSelector: "AI employee selector",
    modelSelector: "Model selector",
    userPrompt: "Personalized prompt editor",
    pageElement: "Pick page element",
    upload: "Upload files",
    webSearch: "Web search",
    panelExpansion: "Panel expand / collapse",
  }[key]);

const placementLabel = (placement: ChatContainer) =>
  placements.find((option) => option.value === placement)?.label ?? placement;
