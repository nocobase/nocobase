import {
  AIChatCompact,
  AIChatMessageList,
  ChatInline,
  type AIChatComposerAction,
} from "../components";
import { AIChatProvider, type AIChatMessage } from "../providers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUp, Globe2, Menu, Paperclip, PlusCircle } from "lucide-react";

const showcaseMessages = [
  {
    id: "message-presentation-user",
    role: "user",
    parts: [
      {
        type: "text",
        text: "Review the support workspace and propose the most useful dashboard.",
      },
    ],
  },
  {
    id: "message-presentation-assistant",
    role: "assistant",
    parts: [
      {
        type: "reasoning",
        text: "I should inspect the existing collections first, then keep the recommendation focused on operational decisions.",
        state: "done",
      },
      {
        type: "dynamic-tool",
        toolName: "inspectDataModel",
        toolCallId: "message-presentation-tool",
        state: "output-available",
        input: { collections: ["tickets", "categories", "users"] },
        output: { collectionsFound: 3 },
      },
      {
        type: "text",
        text: "Start with open workload, ownership gaps, SLA risk, and the created-versus-resolved trend. That gives the team one clear operational view without duplicating the underlying NocoBase rules.",
      },
    ],
  },
] satisfies AIChatMessage[];

const compactActions: AIChatComposerAction[] = [
  {
    key: "web-search",
    label: "Web search",
    icon: <Globe2 />,
  },
];

export function InteractionShowcase() {
  return (
    <div className="grid items-start gap-4 xl:grid-cols-2">
      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Inline messages</Badge>
            <CardTitle className="text-base">
              Standard conversation transcript
            </CardTitle>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            This fixed example shows where reasoning, a normal tool call, and
            the final assistant response appear in one message sequence.
          </p>
        </CardHeader>
        <CardContent className="bg-muted/15 p-4">
          <ChatInline className="h-[520px] bg-background shadow-sm">
            <div className="flex h-full min-h-0 flex-col">
              <div className="relative flex h-12 shrink-0 items-center justify-between border-b px-2.5">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Conversations"
                >
                  <Menu />
                </Button>
                <div className="pointer-events-none absolute left-1/2 max-w-[55%] -translate-x-1/2 truncate text-sm font-medium">
                  Support workspace review
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="New conversation"
                >
                  <PlusCircle />
                </Button>
              </div>
              <AIChatMessageList
                className="h-full"
                messages={showcaseMessages}
                showMessageActions={false}
              />
              <div className="shrink-0 bg-card px-4 pt-2 pb-3">
                <div className="rounded-xl border bg-background px-3 py-2.5 shadow-sm">
                  <div className="min-h-10 text-sm text-muted-foreground">
                    Message your AI employee…
                  </div>
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Attach file"
                    >
                      <Paperclip />
                    </Button>
                    <Button size="icon-sm" aria-label="Send message">
                      <ArrowUp />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </ChatInline>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Compact composer</Badge>
            <CardTitle className="text-base">
              Open the transcript only when needed
            </CardTitle>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            The compact variant keeps only the chat header and composer. Its
            history button opens a dialog with conversation switching and the
            selected transcript.
          </p>
        </CardHeader>
        <CardContent className="bg-muted/15 p-4">
          <AIChatProvider id="message-presentation-compact-demo">
            <AIChatCompact
              className="bg-background"
              composerActions={compactActions}
              showModelSelector={false}
              disclaimer={false}
            />
          </AIChatProvider>
        </CardContent>
      </Card>
    </div>
  );
}
