import { useRef, useSyncExternalStore } from "react";
import type { AIEmployeeTaskTrigger } from "./types";

export type AIChatControllerSnapshot = {
  open: boolean;
};

export type AIChatController = {
  getSnapshot: () => AIChatControllerSnapshot;
  subscribe: (listener: () => void) => () => void;
  setOpen: (open: boolean) => void;
  open: () => void;
  close: () => void;
  triggerTask: (options: AIEmployeeTaskTrigger) => void;
  bindTaskHandler: (
    handler: (options: AIEmployeeTaskTrigger) => void | Promise<void>
  ) => () => void;
};

export function createAIChatController(): AIChatController {
  let snapshot: AIChatControllerSnapshot = { open: false };
  let taskHandler:
    | ((options: AIEmployeeTaskTrigger) => void | Promise<void>)
    | undefined;
  const listeners = new Set<() => void>();
  const pendingTasks: AIEmployeeTaskTrigger[] = [];

  const setOpen = (open: boolean) => {
    if (snapshot.open === open) return;
    snapshot = { open };
    listeners.forEach((listener) => listener());
  };

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setOpen,
    open: () => setOpen(true),
    close: () => setOpen(false),
    triggerTask: (options) => {
      if (taskHandler) {
        void taskHandler(options);
        return;
      }
      pendingTasks.push(options);
      if (pendingTasks.length > 20) pendingTasks.shift();
    },
    bindTaskHandler: (handler) => {
      if (taskHandler && taskHandler !== handler) {
        console.warn(
          "An AIChatController should be bound to only one AIChatProvider at a time."
        );
      }
      taskHandler = handler;
      pendingTasks.splice(0).forEach((task) => void handler(task));
      return () => {
        if (taskHandler === handler) taskHandler = undefined;
      };
    },
  };
}

export function useAIChatController() {
  const controllerRef = useRef<AIChatController | null>(null);
  if (!controllerRef.current) {
    controllerRef.current = createAIChatController();
  }
  return controllerRef.current;
}

const visibleControllerSnapshot: AIChatControllerSnapshot = { open: true };
const subscribeToVisibleController = () => () => undefined;
const getVisibleControllerSnapshot = () => visibleControllerSnapshot;

export function useAIChatControllerState(controller?: AIChatController) {
  return useSyncExternalStore(
    controller?.subscribe ?? subscribeToVisibleController,
    controller?.getSnapshot ?? getVisibleControllerSnapshot,
    controller?.getSnapshot ?? getVisibleControllerSnapshot
  );
}
