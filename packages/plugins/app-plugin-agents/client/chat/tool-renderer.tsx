/* eslint-disable react-refresh/only-export-components -- The public renderer SDK intentionally colocates its provider, lookup hook and pure source resolver. */
import {
  createContext,
  useContext,
  useMemo,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from 'react';

import type { ResolvedPageContext } from '../../shared/conversations.js';
import type { AppUIMessage } from '../../shared/ui-message.js';

/** The existing public SDK tool part, never the provider-private execution result. */
export type AIToolPart = Extract<
  AppUIMessage['parts'][number],
  { type: `tool-${string}` | 'dynamic-tool' }
>;

export interface AIToolRendererContext {
  readonly readOnly: boolean;
  readonly streaming: boolean;
  /** Only the exact server-linked user message; null when its history page is unavailable. */
  readonly sourceMessage: Readonly<AppUIMessage> | null;
  readonly sourceContext: Readonly<ResolvedPageContext> | null;
  readonly approval: {
    readonly disabled: boolean;
    readonly pending: boolean;
    readonly error: boolean;
    /** The existing SDK approval operation, bound to this part, message and execution. */
    readonly respond: (approved: boolean, reason?: string) => Promise<void>;
  };
}

export interface AIToolRendererProps {
  readonly toolName: string;
  readonly part: Readonly<AIToolPart>;
  readonly message: Readonly<AppUIMessage>;
  readonly context: AIToolRendererContext;
}

export type AIToolRendererMap = Readonly<
  Record<string, ComponentType<AIToolRendererProps>>
>;

export interface AIToolRendererProviderProps {
  readonly renderers: AIToolRendererMap;
  readonly children: ReactNode;
}

const RendererContext = createContext<AIToolRendererMap>({});

/** Inner providers override matching own keys and inherit all other parent renderers. */
export function AIToolRendererProvider({
  renderers,
  children,
}: AIToolRendererProviderProps): ReactElement {
  const parent = useContext(RendererContext);
  const value = useMemo(
    () => ({ ...parent, ...renderers }),
    [parent, renderers],
  );
  return (
    <RendererContext.Provider value={value}>
      {children}
    </RendererContext.Provider>
  );
}

/** Exact SDK tool name lookup; prototype properties never register a renderer. */
export function useAIToolRenderer(
  toolName: string,
): ComponentType<AIToolRendererProps> | undefined {
  const renderers = useContext(RendererContext);
  return Object.hasOwn(renderers, toolName) ? renderers[toolName] : undefined;
}

/** Resolve durable server metadata only, never adjacency or model-supplied tool input. */
export function getAIToolSourceMessage(
  message: AppUIMessage,
  messages: readonly AppUIMessage[],
): AppUIMessage | null {
  const sourceId = message.metadata?.sourceUserMessageId;
  const conversationId = message.metadata?.conversationId;
  if (message.role !== 'assistant' || !sourceId || !conversationId) return null;
  const sources = messages.filter(
    (candidate) =>
      candidate.id === sourceId &&
      candidate.role === 'user' &&
      candidate.metadata?.conversationId === conversationId,
  );
  return sources.length === 1 ? sources[0] : null;
}
