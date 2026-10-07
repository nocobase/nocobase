import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  type RefCallback,
} from 'react';
import {
  createAIPageContextReference,
  useOptionalAIFrontendToolRegistry,
  type AIFrontendToolManifest,
  type AIFrontendToolRegistration,
  type AIWorkContextItem,
} from '../../providers/index.js';

export const PAGE_ELEMENT_ATTRIBUTE = 'data-ai-page-element';

export type AIPageElementDescriptor = {
  id?: string;
  title: string;
  kind?: string;
  /** The result is awaited, so an implementation may return a promise. */
  getContext: () => unknown;
  tools?: AIFrontendToolRegistration[];
};

export type AIPageElementRuntimeDescriptor = AIPageElementDescriptor & {
  frontendTools?: AIFrontendToolManifest[];
};

export type AIPageElementPickerOptions = {
  chatId?: string;
  onSelect: (item: AIWorkContextItem) => void;
  onCancel?: () => void;
};

export type AIPageContextFailurePolicy = 'throw' | 'omit';

export class AIPageContextResolutionError extends Error {
  constructor(
    message: string,
    readonly failures: Array<{ item: AIWorkContextItem; reason: unknown }>,
  ) {
    super(message);
    this.name = 'AIPageContextResolutionError';
  }
}

export type RegisteredPageElement = {
  element: HTMLElement;
  getDescriptor: () => AIPageElementRuntimeDescriptor;
};

export type PickerRequest = AIPageElementPickerOptions & {
  token: symbol;
  resolving: boolean;
  error?: string;
};

export type AIPageElementContextValue = {
  picking: boolean;
  registeredCount: number;
  register: (
    runtimeId: string,
    element: HTMLElement,
    getDescriptor: () => AIPageElementRuntimeDescriptor,
  ) => () => void;
  startPicking: (options: AIPageElementPickerOptions) => void;
  cancelPicking: () => void;
};

export const AIPageElementContext =
  createContext<AIPageElementContextValue | null>(null);

export const findRegisteredElement = (
  target: EventTarget | null,
  registry: Map<string, RegisteredPageElement>,
) => {
  if (!(target instanceof Element)) return undefined;
  const element = target.closest<HTMLElement>(`[${PAGE_ELEMENT_ATTRIBUTE}]`);
  if (!element) return undefined;
  const runtimeId = element.getAttribute(PAGE_ELEMENT_ATTRIBUTE);
  if (!runtimeId) return undefined;
  const registered = registry.get(runtimeId);
  return registered ? { runtimeId, registered } : undefined;
};

export function useAIPageElementPicker(): AIPageElementContextValue {
  const value = useContext(AIPageElementContext);
  if (!value) {
    throw new Error(
      'useAIPageElementPicker must be used inside AIPageElementProvider',
    );
  }
  return value;
}

export function useAIPageElement(
  descriptor: AIPageElementDescriptor,
): RefCallback<HTMLElement> {
  const { register } = useAIPageElementPicker();
  const frontendTools = useOptionalAIFrontendToolRegistry();
  const reactId = useId();
  const descriptorRef = useRef(descriptor);
  useEffect(() => {
    descriptorRef.current = descriptor;
  }, [descriptor]);
  const runtimeIdRef = useRef(`page-element-${reactId.replace(/:/g, '')}`);
  const toolManifestsRef = useRef<AIFrontendToolManifest[]>([]);
  const unregisterRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    if (!frontendTools) {
      if (descriptor.tools?.length) {
        throw new Error(
          'Page element frontend Tools require AIProvider above AIPageElementProvider',
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
    [register],
  );
}

export type AIPageElementHandle = {
  ref: RefCallback<HTMLElement>;
  context: AIWorkContextItem;
};

export function useAIPageElementHandle(
  descriptor: AIPageElementDescriptor & { id: string },
): AIPageElementHandle {
  const ref = useAIPageElement(descriptor);
  const context = useMemo(
    () =>
      createAIPageContextReference({
        id: descriptor.id,
        title: descriptor.title,
        kind: descriptor.kind,
      }),
    [descriptor.id, descriptor.kind, descriptor.title],
  );
  return useMemo(() => ({ ref, context }), [context, ref]);
}
