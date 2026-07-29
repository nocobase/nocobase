import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MousePointer2, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
  type RefCallback,
} from "react";
import { createPortal } from "react-dom";
import {
  AIPageContextResolverProvider,
  createAIPageContextReference,
  useOptionalAIFrontendToolRegistry,
  type AIFrontendToolManifest,
  type AIFrontendToolRegistration,
  type AIWorkContextItem,
} from "../../providers";

const PAGE_ELEMENT_ATTRIBUTE = "data-ai-page-element";

export type AIPageElementDescriptor = {
  id?: string;
  title: string;
  kind?: string;
  getContext: () => unknown | Promise<unknown>;
  tools?: AIFrontendToolRegistration[];
};

type AIPageElementRuntimeDescriptor = AIPageElementDescriptor & {
  frontendTools?: AIFrontendToolManifest[];
};

export type AIPageElementPickerOptions = {
  chatId?: string;
  onSelect: (item: AIWorkContextItem) => void;
  onCancel?: () => void;
};

export type AIPageContextFailurePolicy = "throw" | "omit";

export type AIPageElementProviderProps = PropsWithChildren<{
  contextFailurePolicy?: AIPageContextFailurePolicy;
}>;

export class AIPageContextResolutionError extends Error {
  constructor(
    message: string,
    readonly failures: Array<{ item: AIWorkContextItem; reason: unknown }>
  ) {
    super(message);
    this.name = "AIPageContextResolutionError";
  }
}

type RegisteredPageElement = {
  element: HTMLElement;
  getDescriptor: () => AIPageElementRuntimeDescriptor;
};

type PickerRequest = AIPageElementPickerOptions & {
  token: symbol;
  resolving: boolean;
  error?: string;
};

type AIPageElementContextValue = {
  picking: boolean;
  registeredCount: number;
  register: (
    runtimeId: string,
    element: HTMLElement,
    getDescriptor: () => AIPageElementRuntimeDescriptor
  ) => () => void;
  startPicking: (options: AIPageElementPickerOptions) => void;
  cancelPicking: () => void;
};

const AIPageElementContext = createContext<AIPageElementContextValue | null>(
  null
);

const findRegisteredElement = (
  target: EventTarget | null,
  registry: Map<string, RegisteredPageElement>
) => {
  if (!(target instanceof Element)) return undefined;
  const element = target.closest<HTMLElement>(`[${PAGE_ELEMENT_ATTRIBUTE}]`);
  if (!element) return undefined;
  const runtimeId = element.getAttribute(PAGE_ELEMENT_ATTRIBUTE);
  if (!runtimeId) return undefined;
  const registered = registry.get(runtimeId);
  return registered ? { runtimeId, registered } : undefined;
};

export function AIPageElementProvider({
  children,
  contextFailurePolicy = "throw",
}: AIPageElementProviderProps) {
  const registryRef = useRef(new Map<string, RegisteredPageElement>());
  const [registeredCount, setRegisteredCount] = useState(0);
  const [request, setRequest] = useState<PickerRequest>();
  const [hoveredId, setHoveredId] = useState<string>();
  const [hoveredRect, setHoveredRect] = useState<DOMRect>();
  const picking = Boolean(request);
  const requestRef = useRef(request);
  const hoveredIdRef = useRef(hoveredId);
  requestRef.current = request;
  hoveredIdRef.current = hoveredId;

  const register = useCallback<AIPageElementContextValue["register"]>(
    (runtimeId, element, getDescriptor) => {
      const contextId = getDescriptor().id ?? runtimeId;
      const duplicate = [...registryRef.current.entries()].find(
        ([registeredRuntimeId, entry]) =>
          registeredRuntimeId !== runtimeId &&
          (entry.getDescriptor().id ?? registeredRuntimeId) === contextId
      );
      if (duplicate) {
        throw new Error(
          `AI page context id "${contextId}" is already registered`
        );
      }
      element.setAttribute(PAGE_ELEMENT_ATTRIBUTE, runtimeId);
      registryRef.current.set(runtimeId, { element, getDescriptor });
      setRegisteredCount(registryRef.current.size);
      return () => {
        if (element.getAttribute(PAGE_ELEMENT_ATTRIBUTE) === runtimeId) {
          element.removeAttribute(PAGE_ELEMENT_ATTRIBUTE);
        }
        if (registryRef.current.get(runtimeId)?.element === element) {
          registryRef.current.delete(runtimeId);
        }
        if (hoveredIdRef.current === runtimeId) {
          hoveredIdRef.current = undefined;
          setHoveredId(undefined);
          setHoveredRect(undefined);
        }
        setRegisteredCount(registryRef.current.size);
      };
    },
    []
  );

  const cancelPicking = useCallback(() => {
    const current = requestRef.current;
    requestRef.current = undefined;
    setRequest(undefined);
    setHoveredId(undefined);
    setHoveredRect(undefined);
    current?.onCancel?.();
  }, []);

  const startPicking = useCallback((options: AIPageElementPickerOptions) => {
    const current = requestRef.current;
    const nextRequest: PickerRequest = {
      ...options,
      token: Symbol("page-element-picker"),
      resolving: false,
    };
    requestRef.current = nextRequest;
    setRequest(nextRequest);
    setHoveredId(undefined);
    setHoveredRect(undefined);
    current?.onCancel?.();
  }, []);

  const resolvePageContext = useCallback(
    async (items: AIWorkContextItem[]) => {
      const resolved = await Promise.allSettled(
        items.map(async (item) => {
          if (item.type !== "page-element") return item;
          const registeredEntry = [...registryRef.current.entries()].find(
            ([runtimeId, entry]) =>
              (entry.getDescriptor().id ?? runtimeId) === item.id
          );
          if (!registeredEntry) {
            if (item.content !== undefined) return item;
            throw new Error(
              `Page context "${item.title ?? item.id ?? "unknown"}" is not mounted`
            );
          }
          const [runtimeId, entry] = registeredEntry;
          const descriptor = entry.getDescriptor();
          const contextId = item.id ?? descriptor.id ?? runtimeId;
          const frontendTools = descriptor.frontendTools ?? [];
          return {
            ...item,
            id: contextId,
            title: item.title ?? descriptor.title,
            kind: item.kind ?? descriptor.kind,
            content: await descriptor.getContext(),
            ...(frontendTools.length ? { uid: contextId, frontendTools } : {}),
          } satisfies AIWorkContextItem;
        })
      );
      const failures = resolved.flatMap((result, index) =>
        result.status === "rejected"
          ? [{ item: items[index], reason: result.reason }]
          : []
      );
      if (failures.length && contextFailurePolicy === "throw") {
        const labels = failures.map(({ item, reason }) => {
          const label = item.title ?? item.id ?? "unknown page context";
          return reason instanceof Error
            ? `${label} (${reason.message})`
            : label;
        });
        throw new AIPageContextResolutionError(
          `Unable to read page context: ${labels.join(", ")}`,
          failures
        );
      }
      return resolved.flatMap((result) =>
        result.status === "fulfilled" ? [result.value] : []
      );
    },
    [contextFailurePolicy]
  );

  useEffect(() => {
    if (!picking) return;

    const updateHoveredElement = (event: PointerEvent) => {
      const match = findRegisteredElement(event.target, registryRef.current);
      setHoveredId(match?.runtimeId);
      setHoveredRect(match?.registered.element.getBoundingClientRect());
    };
    const clearHoveredElement = () => {
      setHoveredId(undefined);
      setHoveredRect(undefined);
    };
    const updateHoveredRect = () => {
      const currentHoveredId = hoveredIdRef.current;
      if (!currentHoveredId) return;
      const entry = registryRef.current.get(currentHoveredId);
      setHoveredRect(entry?.element.getBoundingClientRect());
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") cancelPicking();
    };
    const handleClick = async (event: MouseEvent) => {
      const match = findRegisteredElement(event.target, registryRef.current);
      const currentRequest = requestRef.current;
      if (!match || !currentRequest || currentRequest.resolving) return;
      event.preventDefault();
      event.stopPropagation();
      const descriptor = match.registered.getDescriptor();
      const resolvingRequest = {
        ...currentRequest,
        resolving: true,
        error: undefined,
      };
      requestRef.current = resolvingRequest;
      setRequest(resolvingRequest);
      try {
        const content = await descriptor.getContext();
        if (requestRef.current?.token !== currentRequest.token) return;
        const contextId = descriptor.id ?? match.runtimeId;
        const frontendTools = descriptor.frontendTools ?? [];
        currentRequest.onSelect({
          type: "page-element",
          id: contextId,
          title: descriptor.title,
          kind: descriptor.kind,
          content,
          ...(frontendTools.length ? { uid: contextId, frontendTools } : {}),
        });
        requestRef.current = undefined;
        setRequest(undefined);
        clearHoveredElement();
      } catch (error) {
        if (requestRef.current?.token !== currentRequest.token) return;
        const failedRequest = {
          ...currentRequest,
          resolving: false,
          error:
            error instanceof Error
              ? error.message
              : "Unable to read this page element",
        };
        requestRef.current = failedRequest;
        setRequest(failedRequest);
      }
    };

    document.addEventListener("pointermove", updateHoveredElement, true);
    document.addEventListener("pointerleave", clearHoveredElement, true);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("scroll", updateHoveredRect, true);
    window.addEventListener("resize", updateHoveredRect);
    return () => {
      document.removeEventListener("pointermove", updateHoveredElement, true);
      document.removeEventListener("pointerleave", clearHoveredElement, true);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("scroll", updateHoveredRect, true);
      window.removeEventListener("resize", updateHoveredRect);
    };
  }, [cancelPicking, picking]);

  const value = useMemo<AIPageElementContextValue>(
    () => ({
      picking,
      registeredCount,
      register,
      startPicking,
      cancelPicking,
    }),
    [cancelPicking, picking, register, registeredCount, startPicking]
  );

  return (
    <AIPageContextResolverProvider resolve={resolvePageContext}>
      <AIPageElementContext.Provider value={value}>
        {children}
        {request && typeof document !== "undefined"
          ? createPortal(
              <>
                {hoveredRect ? (
                  <div
                    className="pointer-events-none fixed z-[2000] rounded-lg border-2 border-foreground bg-foreground/5 shadow-[0_0_0_9999px_rgba(0,0,0,0.08)]"
                    style={{
                      left: hoveredRect.left,
                      top: hoveredRect.top,
                      width: hoveredRect.width,
                      height: hoveredRect.height,
                    }}
                  >
                    <div className="absolute -top-7 left-0 max-w-[min(320px,80vw)] truncate rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background shadow-sm">
                      {hoveredId
                        ? registryRef.current.get(hoveredId)?.getDescriptor()
                            .title
                        : null}
                    </div>
                  </div>
                ) : null}
                <div className="fixed bottom-6 left-1/2 z-[2001] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-xl border bg-background px-3 py-2 shadow-xl">
                  <MousePointer2
                    className={cn(
                      "size-4 shrink-0",
                      request.resolving && "animate-pulse"
                    )}
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {request.resolving
                        ? "Reading page element…"
                        : "Pick a page element"}
                    </div>
                    <div
                      className={cn(
                        "truncate text-xs text-muted-foreground",
                        request.error && "text-destructive"
                      )}
                    >
                      {request.error ??
                        "Hover a highlighted element, then click to add it."}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Cancel picking page element"
                    disabled={request.resolving}
                    onClick={cancelPicking}
                  >
                    <X />
                  </Button>
                </div>
              </>,
              document.body
            )
          : null}
      </AIPageElementContext.Provider>
    </AIPageContextResolverProvider>
  );
}

export function useAIPageElementPicker() {
  const value = useContext(AIPageElementContext);
  if (!value) {
    throw new Error(
      "useAIPageElementPicker must be used inside AIPageElementProvider"
    );
  }
  return value;
}

export function useAIPageElement(
  descriptor: AIPageElementDescriptor
): RefCallback<HTMLElement> {
  const { register } = useAIPageElementPicker();
  const frontendTools = useOptionalAIFrontendToolRegistry();
  const reactId = useId();
  const descriptorRef = useRef(descriptor);
  descriptorRef.current = descriptor;
  const runtimeIdRef = useRef(`page-element-${reactId.replace(/:/g, "")}`);
  const toolManifestsRef = useRef<AIFrontendToolManifest[]>([]);
  const unregisterRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    if (!frontendTools) {
      if (descriptor.tools?.length) {
        throw new Error(
          "Page element frontend Tools require AIProvider above AIPageElementProvider"
        );
      }
      toolManifestsRef.current = [];
      return;
    }
    const contextId = descriptor.id ?? runtimeIdRef.current;
    const unregisterTools: Array<() => void> = [];
    try {
      for (const tool of descriptor.tools ?? []) {
        unregisterTools.push(frontendTools.register(contextId, tool));
      }
    } catch (error) {
      unregisterTools.forEach((unregister) => unregister());
      throw error;
    }
    toolManifestsRef.current = frontendTools.list(contextId);
    return () => {
      unregisterTools.forEach((unregister) => unregister());
      toolManifestsRef.current = [];
    };
  }, [descriptor.id, descriptor.tools, frontendTools]);

  return useCallback(
    (element) => {
      unregisterRef.current();
      unregisterRef.current = element
        ? register(runtimeIdRef.current, element, () => ({
            ...descriptorRef.current,
            frontendTools: toolManifestsRef.current,
          }))
        : () => undefined;
    },
    [register]
  );
}

export type AIPageElementHandle = {
  ref: RefCallback<HTMLElement>;
  context: AIWorkContextItem;
};

export function useAIPageElementHandle(
  descriptor: AIPageElementDescriptor & { id: string }
): AIPageElementHandle {
  const ref = useAIPageElement(descriptor);
  const context = useMemo(
    () =>
      createAIPageContextReference({
        id: descriptor.id,
        title: descriptor.title,
        kind: descriptor.kind,
      }),
    [descriptor.id, descriptor.kind, descriptor.title]
  );
  return useMemo(() => ({ ref, context }), [context, ref]);
}
