import {
  AIChatWindow,
  ChatInline,
  useAIPageElement,
  useAIPageElementPicker,
  type AIChatComposerAction,
} from "../components";
import { Badge } from "@/components/ui/badge";
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
import { AIChatProvider, useAIChatBase } from "../providers";
import { Globe2, MousePointer2 } from "lucide-react";
import { useMemo, useState } from "react";

export function PageElementShowcase() {
  return (
    <AIChatProvider id="page-element-demo">
      <PageElementShowcaseContent />
    </AIChatProvider>
  );
}

function PageElementShowcaseContent() {
  const [customerName, setCustomerName] = useState("Northwind Studio");
  const [contactEmail, setContactEmail] = useState("ops@northwind.test");
  const [priority, setPriority] = useState("high");
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
        onClick: () =>
          startPicking({
            chatId,
            onSelect: (item) => {
              addWorkContext(item);
              focusComposer();
            },
          }),
      },
      {
        key: "web-search",
        label: "Web search",
        icon: <Globe2 />,
        active: webSearch,
        onClick: () => setWebSearch((active) => !active),
      },
    ],
    [
      addWorkContext,
      chatId,
      focusComposer,
      registeredCount,
      startPicking,
      webSearch,
    ]
  );

  const formRef = useAIPageElement({
    id: "customer-intake-form",
    title: "Customer intake form",
    kind: "form",
    getContext: () => ({
      form: "customer-intake",
      values: { customerName, contactEmail, priority },
    }),
  });
  const detailRef = useAIPageElement({
    id: "customer-health-summary",
    title: "Customer health summary",
    kind: "record-detail",
    getContext: () => ({
      resource: "customers",
      record: {
        name: customerName,
        plan: "Enterprise",
        healthScore: 86,
        openRequests: 3,
        renewalDate: "2026-09-30",
      },
    }),
  });

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="grid min-h-[560px] lg:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-4 bg-muted/15 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">Customer workspace</div>
              <div className="text-xs text-muted-foreground">
                The form and detail card are registered page elements.
              </div>
            </div>
            <Badge variant="outline">2 selectable elements</Badge>
          </div>

          <Card ref={formRef} className="transition-shadow">
            <CardHeader>
              <CardTitle>Customer intake form</CardTitle>
              <p className="text-xs leading-5 text-muted-foreground">
                Update a value, then pick this form to capture its current
                state.
              </p>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="page-context-customer-name">
                  Customer name
                </Label>
                <Input
                  id="page-context-customer-name"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="page-context-contact-email">
                  Contact email
                </Label>
                <Input
                  id="page-context-contact-email"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(value) => value && setPriority(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card ref={detailRef} className="transition-shadow">
            <CardHeader>
              <CardTitle>Customer health summary</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Plan", "Enterprise"],
                ["Health score", "86 / 100"],
                ["Open requests", "3"],
                ["Renewal", "Sep 30, 2026"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg border bg-background p-3"
                >
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="mt-1 text-sm font-medium">{value}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="min-h-0 border-t bg-card lg:border-l lg:border-t-0">
          <ChatInline className="h-[560px] rounded-none border-0">
            <AIChatWindow
              composerActions={composerActions}
              showConversationToggle={false}
              enableAttachments
              attachmentActionIndex={1}
              disclaimer={false}
            />
          </ChatInline>
        </div>
      </div>
    </Card>
  );
}
