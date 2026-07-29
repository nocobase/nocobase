import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useAI,
  useAIPageContextScope,
  useGlobalAIChatController,
  type AIChatController,
  type AIEmployee,
  type AIEmployeeTask,
  type AIWorkContextItem,
} from "../../providers";
import { AIEmployeeAvatar } from "../chat/ai-employee-avatar";
import { Send, TextCursorInput } from "lucide-react";
import { useState } from "react";

export type AIEmployeeShortcutProps = {
  aiEmployee: string | AIEmployee;
  tasks?: AIEmployeeTask[];
  context?: AIWorkContextItem[];
  target?: AIChatController;
  auto?: boolean;
  size?: number;
  label?: string;
  showNotice?: boolean;
  className?: string;
  onTrigger?: (task?: AIEmployeeTask) => void;
};

export function AIEmployeeShortcut({
  aiEmployee,
  tasks = [],
  context,
  target,
  auto,
  size = 48,
  label,
  showNotice = false,
  className,
  onTrigger,
}: AIEmployeeShortcutProps) {
  const ai = useAI();
  const [focused, setFocused] = useState(false);
  const globalController = useGlobalAIChatController();
  const inheritedContext = useAIPageContextScope();
  const controller = target ?? globalController;
  const employee =
    typeof aiEmployee === "string"
      ? ai.employees.find((item) => item.username === aiEmployee)
      : ai.employees.find((item) => item.username === aiEmployee.username) ??
        aiEmployee;

  if (!employee) return null;

  const trigger = (task?: AIEmployeeTask) => {
    onTrigger?.(task);
    controller.triggerTask({
      aiEmployee: employee,
      task,
      tasks: task ? undefined : tasks,
      context: context?.length ? context : inheritedContext,
      auto,
      open: true,
    });
  };

  const visibleTasks = tasks.filter((task) => task.title);

  return (
    <HoverCard>
      <HoverCardTrigger
        render={
          <button
            type="button"
            className={cn(
              "group/ai-shortcut relative inline-flex items-center gap-2 rounded-full outline-none transition-transform hover:scale-[1.04] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              label && "border bg-background pr-3 shadow-sm",
              className
            )}
            onClick={() => trigger()}
            onMouseEnter={() => setFocused(true)}
            onMouseLeave={() => setFocused(false)}
          />
        }
      >
        <AIEmployeeAvatar
          employee={employee}
          flip={focused || showNotice}
          className="transition-[filter] group-hover/ai-shortcut:brightness-105"
          style={{ width: size, height: size }}
        />
        {label ? <span className="text-sm font-medium">{label}</span> : null}
        {showNotice ? (
          <span className="absolute top-0 right-0 size-2.5 rounded-full border-2 border-background bg-foreground" />
        ) : null}
      </HoverCardTrigger>
      <HoverCardContent side="top" align="start" className="w-72 p-3">
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
        {employee.bio ?? employee.description ? (
          <p className="mt-3 border-t pt-3 text-xs leading-5 text-muted-foreground">
            {employee.bio ?? employee.description}
          </p>
        ) : null}
        {visibleTasks.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5 border-t pt-3">
            {visibleTasks.map((task, index) => (
              <Button
                key={`${task.title}-${index}`}
                variant="secondary"
                size="sm"
                className="h-auto min-h-7 whitespace-normal py-1 text-left"
                onClick={(event) => {
                  event.stopPropagation();
                  trigger(task);
                }}
              >
                {task.autoSend ? (
                  <Send className="size-3.5" />
                ) : (
                  <TextCursorInput className="size-3.5" />
                )}
                <span>{task.title}</span>
                <span className="text-[10px] text-muted-foreground">
                  {task.autoSend ? "Auto send" : "Fill composer"}
                </span>
              </Button>
            ))}
          </div>
        ) : null}
      </HoverCardContent>
    </HoverCard>
  );
}
