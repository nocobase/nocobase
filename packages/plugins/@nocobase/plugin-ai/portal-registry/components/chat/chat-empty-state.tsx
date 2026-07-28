import { Button } from "@/components/ui/button";
import { useAIChatBase } from "../../providers";
import { ArrowUpRight, Send, TextCursorInput } from "lucide-react";
import { AIEmployeeAvatar } from "./ai-employee-avatar";

export function ChatEmptyState() {
  const { currentEmployee, availableTasks, runTask } = useAIChatBase();

  return (
    <div className="flex min-h-full items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm text-center">
        <AIEmployeeAvatar
          employee={currentEmployee}
          className="mx-auto size-12"
        />
        <p className="mx-auto mt-4 max-w-xs text-sm leading-6 text-muted-foreground">
          {currentEmployee.greeting ??
            `Hi, I’m ${currentEmployee.nickname}. How can I help?`}
        </p>
        {availableTasks.length ? (
          <div className="mt-6 grid gap-2 text-left">
            {availableTasks.map((task, index) => {
              const Icon = task.autoSend ? Send : TextCursorInput;
              return (
                <Button
                  key={`${task.title ?? "task"}-${index}`}
                  variant="outline"
                  className="h-auto justify-start gap-3 whitespace-normal px-3 py-3 text-left font-normal"
                  onClick={() => runTask(task)}
                >
                  <Icon className="size-4 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block">
                      {task.title ?? task.message?.user ?? `Task ${index + 1}`}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      {task.autoSend
                        ? "Send automatically"
                        : "Fill the composer before sending"}
                    </span>
                  </span>
                  <ArrowUpRight className="size-3.5 text-muted-foreground" />
                </Button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
