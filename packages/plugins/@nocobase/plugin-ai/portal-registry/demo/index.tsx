import {
  AIChatWindow,
  ChatSurface,
  ChatSurfaceActions,
  useAIPageElementPicker,
  type AIChatComposerAction,
  type AIChatWindowProps,
} from "../components";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AIChatProvider, useAIChatBase } from "../providers";
import { Globe2, MousePointer2 } from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";
import { ContainerShowcase, type ChatContainer } from "./container-showcase";
import { InteractionShowcase } from "./interaction-showcase";
import { AIConfigurationGate } from "./configuration-gate";
import { PromptGenerator } from "./prompt-generator";

const propRows = [
  [
    "className",
    "string",
    "undefined",
    "Adds layout or sizing classes to the root conversation window.",
  ],
  [
    "headerActions",
    "ReactNode",
    "undefined",
    "Adds surface actions such as expand, collapse, or close to the header.",
  ],
  [
    "composerActions",
    "AIChatComposerAction[]",
    "[]",
    "Application-specific buttons rendered in the composer toolbar.",
  ],
  [
    "showConversationToggle",
    "boolean",
    "true",
    "Shows the conversation-list control.",
  ],
  [
    "showNewConversation",
    "boolean",
    "true",
    "Shows the new-conversation action.",
  ],
  [
    "showEmployeeSelector",
    "boolean",
    "true",
    "Shows the AI employee selector in the composer.",
  ],
  [
    "showModelSelector",
    "boolean",
    "true",
    "Shows the model selector in the composer.",
  ],
  [
    "showUserPrompt",
    "boolean",
    "true",
    "Shows the personalized AI employee prompt editor.",
  ],
  [
    "enableAttachments",
    "boolean",
    "false",
    "Enables file picker, drag-and-drop, and pasted-image uploads.",
  ],
  [
    "attachmentActionIndex",
    "number",
    "0",
    "Places the attachment action at a specific position in the composer toolbar.",
  ],
  [
    "onToolCallDecision",
    "(decision: AIToolCallDecision) => void | Promise<void>",
    "undefined",
    "Observes approve, reject, or edit decisions after AIChatProvider has processed them; use it for application side effects or telemetry.",
  ],
  [
    "placeholder",
    "string",
    "Message your AI employee…",
    "Composer placeholder text.",
  ],
  [
    "disclaimer",
    "ReactNode | false",
    "Default disclaimer",
    "Customizes or hides the footer disclaimer.",
  ],
];

const surfacePropRows = [
  [
    "variant",
    '"side-panel" | "dialog"',
    "required",
    "Changes only the outer presentation while keeping the same chat window mounted.",
  ],
  ["open", "boolean", "required", "Controls whether the surface is open."],
  [
    "onOpenChange",
    "(open: boolean) => void",
    "required",
    "Receives close requests from Escape, the dialog backdrop, or surface actions.",
  ],
  [
    "side",
    '"left" | "right"',
    '"right"',
    "Chooses the side used by the side-panel variant.",
  ],
  [
    "width",
    "number | string",
    "450",
    "Sets the width used by the side-panel variant.",
  ],
  [
    "closeOnEscape",
    "boolean",
    "true",
    "Allows Escape to close the active surface.",
  ],
  [
    "showCloseHandle",
    "boolean",
    "false",
    "Shows an outside close handle for the side-panel variant.",
  ],
];

export function AIChatPage() {
  return (
    <AIConfigurationGate>
      <AIChatProvider id="ai-chat-demo">
        <AIChatPageContent />
      </AIChatProvider>
    </AIConfigurationGate>
  );
}

function AIChatPageContent() {
  const [container, setContainer] = useState<ChatContainer>("embedded");
  const [surfaceOpen, setSurfaceOpen] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const { id: chatId, addWorkContext, focusComposer } = useAIChatBase();
  const { registeredCount, startPicking } = useAIPageElementPicker();

  const composerActions = useMemo<AIChatComposerAction[]>(
    () => [
      {
        key: "pick-page-element",
        label: "Pick page element",
        icon: <MousePointer2 />,
        disabled: registeredCount === 0,
        onClick: () => {
          if (surfaceOpen && container === "dialog") {
            setContainer("side-panel");
          }
          startPicking({
            chatId,
            onSelect: (item) => {
              addWorkContext(item);
              focusComposer();
            },
          });
        },
      },
      {
        key: "web-search",
        label: "Web search",
        icon: <Globe2 />,
        active: webSearch,
        onClick: () => {
          setWebSearch((active) => !active);
        },
      },
    ],
    [
      addWorkContext,
      chatId,
      container,
      focusComposer,
      registeredCount,
      startPicking,
      surfaceOpen,
      webSearch,
    ]
  );

  const windowProps = useMemo<AIChatWindowProps>(
    () => ({
      composerActions,
      enableAttachments: true,
      attachmentActionIndex: 1,
      onToolCallDecision: async () => undefined,
    }),
    [composerActions]
  );

  const closeSurface = () => {
    setSurfaceOpen(false);
  };

  const surfaceWindowProps: AIChatWindowProps = {
    ...windowProps,
    headerActions: (
      <ChatSurfaceActions
        expanded={container === "dialog"}
        onExpandedChange={(expanded) => {
          setContainer(expanded ? "dialog" : "side-panel");
        }}
        onClose={closeSurface}
      />
    ),
  };

  const selectContainer = (nextContainer: ChatContainer) => {
    setContainer(nextContainer);
    setSurfaceOpen(
      nextContainer === "side-panel" || nextContainer === "dialog"
    );
  };

  return (
    <div
      data-open={surfaceOpen && container === "side-panel"}
      data-side="right"
      className="chat-side-panel-layout @container min-w-0"
      style={
        {
          "--chat-side-panel-width": "450px",
        } as CSSProperties
      }
    >
      <div className="space-y-14 pb-12">
        <section className="flex flex-wrap items-start justify-between gap-5 border-b pb-8">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">AI Components</Badge>
              <Badge variant="outline">Preview</Badge>
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.035em]">
              AI Chat Window
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              A position-independent NocoBase AI employee conversation
              component. Explore message interactions independently, place the
              same chat in different containers, then generate an implementation
              prompt for a target page.
            </p>
          </div>
        </section>

        <section className="space-y-5">
          <SectionTitle
            eyebrow="Container patterns"
            title="Use the same conversation window wherever the product needs it"
            description="The provider owns conversation state. Page, embedded block, push side panel, dialog, and mobile containers only decide placement and dimensions."
          />
          <ContainerShowcase
            value={container}
            onValueChange={selectContainer}
            windowProps={windowProps}
          />
        </section>

        <section className="space-y-5">
          <SectionTitle
            eyebrow="Message presentation"
            title="Choose how much conversation history the page should expose"
            description="Use the complete transcript for conversational work, or a compact worker surface that opens message history only when the user asks for it."
          />
          <InteractionShowcase />
        </section>

        <section className="space-y-5">
          <SectionTitle
            eyebrow="Prompt generator"
            title="Describe where chat belongs, then copy an implementation prompt"
            description="This replaces a generic prop configuration panel with a task-oriented generator: choose the target area, placement mode, and required capabilities."
          />
          <PromptGenerator />
        </section>

        <section className="space-y-5">
          <SectionTitle
            eyebrow="Component API"
            title="ChatSurface props"
            description="Use variant as the single presentation switch. The child AIChatWindow remains the same React instance while the surface changes shape."
          />
          <PropsTable rows={surfacePropRows} />
        </section>

        <section className="space-y-5">
          <SectionTitle
            eyebrow="Component API"
            title="AIChatWindow props"
            description="The core window stays reusable while business pages provide placement, composer actions, and tool-approval behavior."
          />
          <PropsTable rows={propRows} />
        </section>

      </div>
      <ChatSurface
        open={surfaceOpen}
        variant={container === "dialog" ? "dialog" : "side-panel"}
        onOpenChange={setSurfaceOpen}
        width={450}
      >
        <AIChatWindow {...surfaceWindowProps} />
      </ChatSurface>
    </div>
  );
}

function PropsTable({ rows }: { rows: string[][] }) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Prop</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Default</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(([name, type, defaultValue, description]) => (
            <TableRow key={name}>
              <TableCell className="font-mono text-xs font-medium">
                {name}
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {type}
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {defaultValue}
              </TableCell>
              <TableCell className="min-w-80 whitespace-normal text-muted-foreground">
                {description}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
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
