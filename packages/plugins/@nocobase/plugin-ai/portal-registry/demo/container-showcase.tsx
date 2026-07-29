import {
  AIChatWindow,
  ChatInline,
  ChatPage,
  type AIChatWindowProps,
} from "../components";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AppWindow,
  Columns3,
  Maximize2,
  PanelRight,
  Smartphone,
} from "lucide-react";

export type ChatContainer =
  | "embedded"
  | "page"
  | "side-panel"
  | "dialog"
  | "mobile";

const containerOptions: Array<{
  value: ChatContainer;
  title: string;
  description: string;
  action: string;
  icon: typeof AppWindow;
}> = [
  {
    value: "embedded",
    title: "Embedded block",
    description:
      "Place chat inside a dashboard, record page, or workspace region.",
    action: "Preview block",
    icon: Columns3,
  },
  {
    value: "page",
    title: "Dedicated page",
    description:
      "Give the conversation a full route and the largest working area.",
    action: "Preview page",
    icon: AppWindow,
  },
  {
    value: "side-panel",
    title: "Push side panel",
    description: "Keep the page operable while the content narrows for chat.",
    action: "Open panel",
    icon: PanelRight,
  },
  {
    value: "dialog",
    title: "Dialog",
    description:
      "Open a focused conversation from an action without changing route.",
    action: "Open dialog",
    icon: Maximize2,
  },
  {
    value: "mobile",
    title: "Mobile container",
    description: "Use the same component in a narrow, touch-friendly viewport.",
    action: "Preview mobile",
    icon: Smartphone,
  },
];

export function ContainerShowcase({
  value,
  onValueChange,
  windowProps,
}: {
  value: ChatContainer;
  onValueChange: (value: ChatContainer) => void;
  windowProps: AIChatWindowProps;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {containerOptions.map((option) => {
          const Icon = option.icon;
          const active = option.value === value;
          return (
            <Card
              key={option.value}
              data-active={active}
              className="gap-0 py-0 transition-colors data-active:border-foreground/35 data-active:bg-muted/20"
            >
              <CardHeader className="p-4">
                <div className="mb-3 flex size-9 items-center justify-center rounded-lg border bg-background">
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <CardTitle className="text-sm">{option.title}</CardTitle>
                <p className="min-h-15 text-xs leading-5 text-muted-foreground">
                  {option.description}
                </p>
              </CardHeader>
              <CardContent className="border-t p-3">
                <Button
                  variant={active ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full"
                  onClick={() => onValueChange(option.value)}
                >
                  {option.action}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="gap-0 py-0">
        <div className="flex min-h-12 items-center justify-between border-b px-4">
          <div>
            <div className="text-sm font-medium">Container preview</div>
            <div className="text-xs text-muted-foreground">
              {containerOptions.find((option) => option.value === value)?.title}
            </div>
          </div>
          <code className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
            {containerComponent(value)}
          </code>
        </div>
        <div className="flex min-h-[650px] justify-center bg-muted/15 p-3 sm:p-5">
          {value === "embedded" ? (
            <ChatInline className="h-[610px] w-full max-w-3xl shadow-sm">
              <AIChatWindow {...windowProps} />
            </ChatInline>
          ) : null}
          {value === "page" ? (
            <ChatPage className="h-[610px] min-h-0 w-full">
              <AIChatWindow {...windowProps} />
            </ChatPage>
          ) : null}
          {value === "mobile" ? (
            <div className="w-full max-w-[390px] rounded-[2rem] border-4 border-foreground/10 bg-background p-1 shadow-xl">
              <ChatInline className="h-[610px] rounded-[1.55rem] border-0">
                <AIChatWindow {...windowProps} />
              </ChatInline>
            </div>
          ) : null}
          {value === "side-panel" || value === "dialog" ? (
            <ContainerLaunchPlaceholder
              mode={value}
              onOpen={() => onValueChange(value)}
            />
          ) : null}
        </div>
      </Card>
    </div>
  );
}

function ContainerLaunchPlaceholder({
  mode,
  onOpen,
}: {
  mode: "side-panel" | "dialog";
  onOpen: () => void;
}) {
  return (
    <div className="grid w-full max-w-4xl grid-cols-[200px_minmax(0,1fr)] overflow-hidden rounded-xl border bg-background shadow-sm">
      <div className="border-r bg-muted/30 p-4">
        <div className="h-5 w-24 rounded bg-muted" />
        <div className="mt-6 space-y-3">
          <div className="h-8 rounded bg-muted" />
          <div className="h-8 rounded bg-muted/70" />
          <div className="h-8 rounded bg-muted/70" />
        </div>
      </div>
      <div className="flex items-center justify-center p-8">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 h-24 rounded-xl border bg-muted/20" />
          <h3 className="text-sm font-medium">
            {mode === "side-panel"
              ? "Chat opens beside the current page"
              : "Chat opens above the current page"}
          </h3>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {mode === "side-panel"
              ? "The live preview pushes this page narrower instead of blocking interaction."
              : "The live preview uses a focused dialog while preserving the page underneath."}
          </p>
          <Button className="mt-4" size="sm" onClick={onOpen}>
            {mode === "side-panel" ? "Open side panel" : "Open dialog"}
          </Button>
        </div>
      </div>
    </div>
  );
}

const containerComponent = (value: ChatContainer) => {
  switch (value) {
    case "page":
      return "<ChatPage />";
    case "side-panel":
      return '<ChatSurface variant="side-panel" />';
    case "dialog":
      return '<ChatSurface variant="dialog" />';
    case "mobile":
      return "<ChatInline /> · 390px";
    default:
      return "<ChatInline />";
  }
};
