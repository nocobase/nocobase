import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  getAIModelKey,
  useAIChatBase,
  useAIChatStatus,
  type AIEmployee,
} from "../../providers";
import { cn } from "@/lib/utils";
import { ArrowUp, Paperclip, Pencil, Square, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AIEmployeeAvatar } from "./ai-employee-avatar";
import { WorkContextChip } from "./work-context-chip";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AIModelSelectOptions } from "./model-select-options";
import { ChatAttachment } from "./chat-attachment";

export type AIChatComposerAction = {
  key: string;
  label: string;
  icon?: ReactNode;
  active?: boolean;
  disabled?: boolean;
  showLabel?: boolean;
  onClick?: () => void;
};

export function ChatComposer({
  actions = [],
  showEmployeeSelector = true,
  showModelSelector = true,
  enableAttachments = false,
  attachmentActionIndex = 0,
  placeholder = "Message your AI employee…",
  disclaimer = "AI can make mistakes. Review important changes before publishing.",
}: {
  actions?: AIChatComposerAction[];
  showEmployeeSelector?: boolean;
  showModelSelector?: boolean;
  enableAttachments?: boolean;
  attachmentActionIndex?: number;
  placeholder?: string;
  disclaimer?: ReactNode | false;
}) {
  const {
    draft,
    setDraft,
    send,
    stop,
    models,
    employees,
    currentEmployee,
    currentModel,
    selectModel,
    selectEmployee,
    composerFocusRequest,
    attachments,
    uploadingAttachments,
    uploadFiles,
    removeAttachment,
    workContext,
    removeWorkContext,
    editingMessageId,
    cancelEditingMessage,
  } = useAIChatBase();
  const { status } = useAIChatStatus();
  const busy = status === "submitted" || status === "streaming";
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [employeeSelectOpen, setEmployeeSelectOpen] = useState(false);
  const [previewedEmployee, setPreviewedEmployee] = useState<string>();
  const visibleEmployees = employees.filter(
    (employee) =>
      (employee.category === undefined || employee.category === "business") &&
      employee.deprecated !== true
  );
  const normalizedAttachmentActionIndex = Math.max(
    0,
    Math.min(attachmentActionIndex, actions.length)
  );
  const renderAction = (action: AIChatComposerAction) => (
    <Tooltip key={action.key}>
      <TooltipTrigger
        render={
          <InputGroupButton
            size={action.showLabel ? "xs" : "icon-sm"}
            variant={action.active ? "secondary" : "ghost"}
            className={cn(
              "h-7 shrink-0",
              action.showLabel ? "px-2" : "w-7 p-0"
            )}
            disabled={action.disabled}
            aria-label={action.label}
            aria-pressed={action.active}
            onClick={action.onClick}
          />
        }
      >
        {action.icon}
        {action.showLabel ? action.label : null}
      </TooltipTrigger>
      <TooltipContent>{action.label}</TooltipContent>
    </Tooltip>
  );

  useEffect(() => {
    if (composerFocusRequest === 0) return;
    const frame = requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      const end = textarea.value.length;
      textarea.setSelectionRange(end, end);
    });
    return () => cancelAnimationFrame(frame);
  }, [composerFocusRequest]);

  return (
    <footer className="shrink-0 bg-card">
      <div className="mx-4 mt-2">
        <InputGroup className="rounded-xl bg-background shadow-[0_6px_24px_rgba(0,0,0,0.06)] has-disabled:bg-background has-disabled:opacity-100 focus-within:shadow-[0_8px_28px_rgba(0,0,0,0.08)] dark:has-disabled:bg-background">
          {editingMessageId ? (
            <InputGroupAddon
              align="block-start"
              className="justify-between border-b px-3 py-2 text-xs"
            >
              <span className="flex items-center gap-2 text-foreground">
                <Pencil className="size-3.5" /> Editing message
              </span>
              <InputGroupButton
                size="icon-xs"
                aria-label="Cancel editing"
                onClick={cancelEditingMessage}
              >
                <X />
              </InputGroupButton>
            </InputGroupAddon>
          ) : null}
          {workContext.length ? (
            <InputGroupAddon
              align="block-start"
              className="flex-wrap justify-start gap-1.5 px-3 pt-2"
            >
              {workContext.map((item, index) => (
                <WorkContextChip
                  key={`${item.type}:${item.id ?? item.title ?? index}`}
                  item={item}
                  onRemove={() => removeWorkContext(item)}
                />
              ))}
            </InputGroupAddon>
          ) : null}
          {enableAttachments && attachments.length ? (
            <InputGroupAddon
              align="block-start"
              className="flex-wrap justify-start gap-1.5 px-3 pt-2"
            >
              {attachments.map((attachment) => (
                <ChatAttachment
                  key={attachment.uid}
                  attachment={attachment}
                  removable
                  onRemove={() => removeAttachment(attachment.uid)}
                />
              ))}
            </InputGroupAddon>
          ) : null}
          <InputGroupTextarea
            ref={textareaRef}
            value={draft}
            rows={2}
            placeholder={placeholder}
            className="max-h-44 min-h-16 px-3 pt-3 text-sm"
            onChange={(event) => setDraft(event.target.value)}
            onPaste={(event) => {
              if (!enableAttachments) return;
              const files = Array.from(event.clipboardData.items)
                .filter((item) => item.kind === "file")
                .map((item) => item.getAsFile())
                .filter((file): file is File => file !== null);
              if (!files.length) return;
              event.preventDefault();
              void uploadFiles(files);
            }}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) return;
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send();
              }
            }}
          />
          <InputGroupAddon
            align="block-end"
            className="justify-between px-2.5 pb-2"
          >
            <div className="flex min-w-0 items-center gap-2 overflow-x-auto [scrollbar-width:none]">
              {actions
                .slice(0, normalizedAttachmentActionIndex)
                .map(renderAction)}
              {enableAttachments ? (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <InputGroupButton
                        size="icon-sm"
                        variant="ghost"
                        className="h-7 w-7 shrink-0 p-0"
                        aria-label="Upload files"
                        onClick={() => fileInputRef.current?.click()}
                      />
                    }
                  >
                    <Paperclip />
                  </TooltipTrigger>
                  <TooltipContent>Upload files</TooltipContent>
                </Tooltip>
              ) : null}
              {actions.slice(normalizedAttachmentActionIndex).map(renderAction)}
              {showEmployeeSelector ? (
                <Select
                  open={employeeSelectOpen}
                  value={currentEmployee.username}
                  onOpenChange={(open) => {
                    setEmployeeSelectOpen(open);
                    if (!open) setPreviewedEmployee(undefined);
                  }}
                  onValueChange={(value) => {
                    setPreviewedEmployee(undefined);
                    if (value) selectEmployee(value);
                  }}
                >
                  <SelectTrigger
                    size="sm"
                    className="max-w-36 shrink-0 border-0 bg-muted/60 px-1.5 shadow-none"
                  >
                    <SelectValue>
                      <span className="flex min-w-0 items-center gap-1.5">
                        <AIEmployeeAvatar
                          employee={currentEmployee}
                          className="size-5"
                        />
                        <span className="truncate">
                          {currentEmployee.nickname}
                        </span>
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent side="top" className="max-h-[400px] min-w-72">
                    {visibleEmployees.map((employee) => (
                      <SelectItem
                        key={employee.username}
                        value={employee.username}
                        className="py-1.5"
                      >
                        <HoverCard
                          open={
                            employeeSelectOpen &&
                            previewedEmployee === employee.username
                          }
                          onOpenChange={(open) => {
                            if (!employeeSelectOpen) return;
                            setPreviewedEmployee(
                              open ? employee.username : undefined
                            );
                          }}
                        >
                          <HoverCardTrigger
                            delay={250}
                            closeDelay={100}
                            render={
                              <span className="flex min-w-0 flex-1 items-center gap-2" />
                            }
                          >
                            <AIEmployeeAvatar
                              employee={employee}
                              className="size-9"
                            />
                            <span className="min-w-0">
                              <span className="block font-medium">
                                {employee.nickname}
                              </span>
                              {employee.position ? (
                                <span className="block truncate text-xs text-muted-foreground">
                                  {employee.position}
                                </span>
                              ) : null}
                            </span>
                          </HoverCardTrigger>
                          <HoverCardContent
                            side="left"
                            align="start"
                            sideOffset={8}
                            className="w-65 p-3 data-closed:hidden"
                          >
                            <AIEmployeeProfile employee={employee} />
                          </HoverCardContent>
                        </HoverCard>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
              {showModelSelector ? (
                <Select
                  value={getAIModelKey(currentModel)}
                  onValueChange={(value) => value && selectModel(value)}
                >
                  <SelectTrigger
                    size="sm"
                    title={currentModel.label}
                    className="w-28 max-w-28 shrink-0 border-0 bg-muted/60 px-1.5 shadow-none"
                  >
                    <SelectValue className="min-w-0 overflow-hidden">
                      <span className="block min-w-0 truncate">
                        {currentModel.label}
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent side="top" className="max-h-[400px] min-w-56">
                    <AIModelSelectOptions models={models} />
                  </SelectContent>
                </Select>
              ) : null}
            </div>
            {busy ? (
              <InputGroupButton
                size="icon-sm"
                variant="default"
                className="rounded-lg"
                aria-label="Stop generating"
                onClick={() => void stop()}
              >
                <Square className="size-3 fill-current" />
              </InputGroupButton>
            ) : (
              <InputGroupButton
                size="icon-sm"
                variant="default"
                className="rounded-lg"
                aria-label="Send message"
                disabled={
                  uploadingAttachments ||
                  (!draft.trim() &&
                    !attachments.some(
                      (attachment) => attachment.status === "done"
                    ) &&
                    !workContext.length)
                }
                onClick={() => void send()}
              >
                <ArrowUp />
              </InputGroupButton>
            )}
          </InputGroupAddon>
        </InputGroup>
        {enableAttachments ? (
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              if (files.length) void uploadFiles(files);
              event.target.value = "";
            }}
          />
        ) : null}
      </div>
      {disclaimer !== false ? (
        <p className="my-2.5 px-4 text-center text-[11px] text-muted-foreground">
          {disclaimer}
        </p>
      ) : (
        <div className="h-2" />
      )}
    </footer>
  );
}

function AIEmployeeProfile({ employee }: { employee: AIEmployee }) {
  const description = employee.bio ?? employee.description;

  return (
    <div>
      <div className="flex items-center gap-3">
        <AIEmployeeAvatar employee={employee} className="size-10" />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">
            {employee.nickname}
          </div>
          {employee.position ? (
            <div className="truncate text-xs text-muted-foreground">
              {employee.position}
            </div>
          ) : null}
        </div>
      </div>
      {description ? (
        <p className="mt-3 border-t pt-3 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
