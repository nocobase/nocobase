import nocobaseAIChatIcon from "../../assets/nocobase-ai-chat.svg";
import { cn } from "@/lib/utils";
import {
  useAI,
  useAIChatControllerState,
  useGlobalAIChatController,
} from "../../providers";
import type { AIChatController } from "../../providers";

export type AIChatFloatingTriggerProps = {
  aiEmployee?: string;
  controller?: AIChatController;
  unreadCount?: number;
  position?: "fixed" | "absolute";
  hideWhenOpen?: boolean;
  className?: string;
};

export function AIChatFloatingTrigger({
  aiEmployee,
  controller: providedController,
  unreadCount = 0,
  position = "fixed",
  hideWhenOpen = true,
  className,
}: AIChatFloatingTriggerProps) {
  const ai = useAI();
  const globalController = useGlobalAIChatController();
  const controller = providedController ?? globalController;
  const { open } = useAIChatControllerState(controller);

  if (hideWhenOpen && open) return null;

  const openChat = () => {
    const employee = aiEmployee ?? ai.employees[0]?.username;
    if (employee) {
      controller.triggerTask({ aiEmployee: employee, open: true });
      return;
    }
    controller.open();
  };

  return (
    <button
      type="button"
      aria-label="Open AI chat"
      className={cn(
        "group/ai-floating z-40 flex items-center rounded-l-full border bg-background py-2.5 pr-5 pl-3 shadow-lg transition-[transform,opacity,box-shadow] duration-300 hover:translate-x-0 hover:opacity-100 hover:shadow-xl focus-visible:translate-x-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        position === "fixed"
          ? "fixed right-0 bottom-10"
          : "absolute right-0 bottom-8",
        "translate-x-2 opacity-80",
        className
      )}
      onClick={openChat}
    >
      <span className="relative flex size-[42px] items-center justify-center">
        <span className="flex size-full overflow-hidden rounded-lg">
          <img
            src={nocobaseAIChatIcon}
            alt=""
            className="size-full object-contain"
          />
        </span>
        {unreadCount > 0 ? (
          <span className="absolute -top-1.5 -right-1.5 z-10 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-4 font-semibold text-white ring-2 ring-background">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </span>
    </button>
  );
}
