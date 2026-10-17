import { CancelledError } from '@tanstack/react-query';
/* eslint-disable react-refresh/only-export-components -- shared controller provider and hooks */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useApiClient } from '@nocobase/app-client';
import type {
  ConversationMessage,
  ConversationDetail,
} from '../../shared/conversations.js';
import { ChatApi } from './api.js';
import { ChatSubmissions } from './submissions.js';
import { agentsQueryClient } from '../query.js';
import { chatKeys } from './keys.js';
import {
  EMPTY_MESSAGES,
  messagesReducer,
  fetchCursor,
  type MessagesAction,
  type MessagesState,
} from './message-model.js';

import type { OnlineAgentStreamEvent } from '../../shared/online-agent.js';
export type StreamState = {
  phase: 'connecting' | 'streaming' | 'saved' | 'interrupted';
  items: ConversationMessage[];
  lastSeq?: number;
  outcome?: import('../../shared/online-agent.js').OnlineAgentOutcome;
};
/** One application-owned sender and stream consumer, shared across all mounted chat views. */
export class ChatController {
  readonly submissions: ChatSubmissions;
  private histories = new Map<
    string,
    {
      state: MessagesState;
      error?: unknown;
      loadingOlder: boolean;
      loadedThrough: number;
    }
  >();
  private loads = new Map<string, Promise<void>>();
  private refreshAgain = new Set<string>();
  history(id: string): {
    state: MessagesState;
    error?: unknown;
    loadingOlder: boolean;
    loadedThrough: number;
  } {
    return (
      this.histories.get(id) ?? {
        state: EMPTY_MESSAGES,
        loadingOlder: false,
        loadedThrough: 0,
      }
    );
  }
  dispatch(id: string, action: MessagesAction): void {
    const previous = this.history(id);
    this.histories.set(id, {
      ...previous,
      state: messagesReducer(previous.state, action),
      // A confirmed single message does not cover any intervening history.
      loadedThrough:
        action.type === 'page' && !action.older
          ? Math.max(
              previous.loadedThrough,
              ...action.page.items.map((item) => item.seq),
            )
          : previous.loadedThrough,
    });
    this.publish();
  }
  async loadHistory(id: string, older = false, fresh = false): Promise<void> {
    if (this.disposed) return;
    const loading = this.loads.get(id);
    if (loading) {
      if (fresh) this.refreshAgain.add(id);
      return loading;
    }
    const active = this.lifetime();
    const initial = this.history(id);
    if (older && !initial.state.olderToken) return;
    this.histories.set(id, { ...initial, loadingOlder: older });
    this.publish();
    const task = (async () => {
      try {
        while (active()) {
          const before = this.history(id).state;
          const page = await this.api.messages(
            id,
            older
              ? { pageToken: before.olderToken! }
              : before.loaded
                ? {
                    after: Math.min(
                      fetchCursor(before),
                      this.history(id).loadedThrough,
                    ),
                  }
                : {},
          );
          if (!active()) return;
          this.dispatch(id, { type: 'page', page, older });
          this.submissions.observe(id, page.items);
          if (this.refreshAgain.delete(id)) {
            older = false;
            continue;
          }
          if (
            older ||
            !page.items.length ||
            !before.loaded ||
            this.history(id).loadedThrough >= page.lastSeq
          )
            break;
        }
        if (!active()) return;
        const current = this.history(id);
        this.histories.set(id, {
          ...current,
          error: undefined,
          loadingOlder: false,
        });
      } catch (error) {
        if (active())
          this.histories.set(id, {
            ...this.history(id),
            error,
            loadingOlder: false,
          });
      } finally {
        if (active()) {
          this.loads.delete(id);
          this.publish();
        }
      }
    })();
    this.loads.set(id, task);
    return task;
  }
  private streams = new Map<string, StreamState>();
  private stopRequests = new Set<string>();
  observeDetail(detail: ConversationDetail): void {
    if (
      detail.execution?.status === 'idle' &&
      this.stopRequests.delete(detail.id)
    )
      this.publish();
  }
  isStopping(id: string): boolean {
    return this.stopRequests.has(id);
  }
  /** A processed cancellation request stays pending until execution actually becomes idle. */
  async stop(id: string): Promise<ConversationDetail> {
    const active = this.lifetime();
    this.stopRequests.add(id);
    this.publish();
    try {
      return await this.command(
        id,
        () => this.api.stop(id),
        (detail) => detail,
      );
    } catch (error) {
      if (active()) {
        this.stopRequests.delete(id);
        this.publish();
      }
      throw error;
    }
  }

  private aborts = new Map<string, AbortController>();
  private listeners = new Set<() => void>();
  private revision = 0;
  private disposed = false;
  private generation = 0;
  private detailVersions = new Map<string, number>();
  private commandVersions = new Map<string, number>();
  /** A callback belongs to this Provider lifetime, rather than to a history row. */
  lifetime(): () => boolean {
    const generation = this.generation;
    return () => !this.disposed && this.generation === generation;
  }
  private nextDetailVersion(id: string): number {
    const version = (this.detailVersions.get(id) ?? 0) + 1;
    this.detailVersions.set(id, version);
    return version;
  }
  detailRequest(id: string): () => boolean {
    const active = this.lifetime();
    const version = this.nextDetailVersion(id);
    return () => active() && this.detailVersions.get(id) === version;
  }
  private remember(detail: ConversationDetail): void {
    this.nextDetailVersion(detail.id);
    if (detail.execution?.status === 'idle')
      this.stopRequests.delete(detail.id);
    this.publish();
    agentsQueryClient().setQueryData(chatKeys.conversation(detail.id), detail);
    void agentsQueryClient().invalidateQueries({ queryKey: chatKeys.lists });
  }
  /** Order cache commits without blocking Stop behind an uncertain send response. */
  async command<T>(
    id: string,
    request: () => Promise<T>,
    detail: (result: T) => ConversationDetail,
  ): Promise<T> {
    const active = this.lifetime();
    const version = (this.commandVersions.get(id) ?? 0) + 1;
    this.commandVersions.set(id, version);
    this.nextDetailVersion(id);
    await agentsQueryClient().cancelQueries({
      queryKey: chatKeys.conversation(id),
      exact: true,
    });
    if (!active()) throw new CancelledError({ silent: true });
    const result = await request();
    if (active() && this.commandVersions.get(id) === version)
      this.remember(detail(result));
    return result;
  }
  constructor(readonly api: ChatApi) {
    this.submissions = new ChatSubmissions(
      {
        createConversation: (input) => api.createConversation(input),
        sendMessage: (id, input) =>
          this.command(
            id,
            () => api.sendMessage(id, input),
            (result) => result.conversation,
          ),
        messages: (id, query) => api.messages(id, query),
      },
      (detail, _record, created) => {
        if (created) this.remember(detail);
        if (!created) this.receive(detail.id, true);
      },
      undefined,
      (id, message) => this.dispatch(id, { type: 'confirmed', message }),
    );
    this.submissions.subscribe(() => this.publish());
  }
  subscribe = (callback: () => void): (() => void) => {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  };
  snapshot = (): number => this.revision;
  state(id: string): StreamState | undefined {
    return this.streams.get(id);
  }
  private publish() {
    this.revision++;
    for (const callback of this.listeners) callback();
  }
  receive(id: string, newInput = false): void {
    if (this.disposed || (!newInput && this.streams.has(id))) return;
    this.aborts.get(id)?.abort();
    const abort = new AbortController();
    this.aborts.set(id, abort);
    this.streams.set(id, { phase: 'connecting', items: [] });
    this.publish();
    const current = () =>
      !this.disposed && this.aborts.get(id) === abort && !abort.signal.aborted;
    void (async () => {
      try {
        const stream = await this.api.events(id, abort.signal);
        if (!current()) {
          await stream?.cancel();
          return;
        }
        if (!stream) {
          await this.refresh(id);
          if (!current()) return;
          if (
            agentsQueryClient().getQueryData<ConversationDetail>(
              chatKeys.conversation(id),
            )?.execution?.status === 'running'
          )
            throw new Error(
              'Execution is still running; refresh saved history to confirm the result.',
            );
          this.streams.set(id, { phase: 'saved', items: [] });
          this.publish();
          return;
        }
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let saved = false;
        const at = new Date().toISOString();
        try {
          while (current()) {
            const next = await reader.read();
            if (next.done) break;
            buffer += decoder
              .decode(next.value, { stream: true })
              .replace(/\r\n/g, '\n');
            let end: number;
            while ((end = buffer.indexOf('\n\n')) >= 0) {
              const block = buffer.slice(0, end);
              buffer = buffer.slice(end + 2);
              const data = block
                .split('\n')
                .filter((line) => line.startsWith('data:'))
                .map((line) => line.slice(5).trimStart())
                .join('\n');
              if (!data || !current()) continue;
              const event = JSON.parse(data) as OnlineAgentStreamEvent;
              const state = this.streams.get(id)!;
              if (event.type === 'saved') {
                saved = true;
                this.streams.set(id, {
                  ...state,
                  phase: 'saved',
                  lastSeq: event.lastSeq,
                  outcome: event.outcome,
                });
                await this.refresh(id);
              } else if (event.type === 'message') {
                this.streams.set(id, {
                  phase: 'streaming',
                  items: [
                    ...state.items.filter(
                      (item) => item.id !== event.message.id,
                    ),
                    event.message,
                  ].sort((a, b) => a.seq - b.seq),
                });
              } else if (
                event.type === 'delta' ||
                (event.type === 'part' && event.item.role === 'assistant')
              ) {
                const seq = event.boundary.afterSeq + event.messageIndex + 1;
                const message: ConversationMessage = {
                  id: `stream:${id}:${event.boundary.afterSeq}:${event.messageIndex}`,
                  conversationId: id,
                  seq,
                  role: 'assistant',
                  content: {
                    type: 'text',
                    content:
                      event.type === 'part'
                        ? event.item.parts.map((part) => part.text).join('')
                        : (state.items.find((item) => item.seq === seq)?.content
                            .content ?? '') + event.text,
                  },
                  toolCalls: null,
                  attachments: null,
                  workContext: null,
                  metadata: { streaming: true },
                  runId: null,
                  createdAt: at,
                };
                this.streams.set(id, {
                  phase: 'streaming',
                  items: [
                    ...state.items.filter((item) => item.seq !== seq),
                    message,
                  ].sort((a, b) => a.seq - b.seq),
                });
              }
              this.publish();
            }
          }
        } finally {
          await reader.cancel();
        }
        if (current() && !saved)
          throw new Error(
            'The connection ended before the result was confirmed.',
          );
      } catch {
        if (current()) {
          const state = this.streams.get(id)!;
          this.streams.set(id, { ...state, phase: 'interrupted' });
          this.publish();
        }
      }
    })();
  }
  /** Explicit history refresh never reopens a stream or repeats input. */
  async refresh(id: string): Promise<void> {
    const subscription = this.aborts.get(id);
    const current = () =>
      !this.disposed &&
      this.aborts.get(id) === subscription &&
      !subscription?.signal.aborted;
    const ordered = this.detailRequest(id);
    const detail = await this.api.conversation(id);
    if (!current() || !ordered()) return;
    await this.loadHistory(id, false, true);
    const loaded = this.history(id);
    if (loaded.error)
      throw loaded.error instanceof Error
        ? loaded.error
        : new Error('Saved history could not be loaded.');
    const page = loaded.state;
    if (!current() || !ordered()) return;
    agentsQueryClient().setQueryData(chatKeys.conversation(id), detail);
    this.submissions.observe(id, page.items);
    if (detail.execution?.status === 'idle') {
      this.stopRequests.delete(id);
      const stream = this.streams.get(id);
      if (stream)
        this.streams.set(id, {
          ...stream,
          phase: 'saved',
          lastSeq: page.lastSeq,
          ...(stream.lastSeq !== page.lastSeq ? { outcome: undefined } : {}),
        });
    }
    this.publish();
  }
  activate(): void {
    this.disposed = false;
  }
  invalidate(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.generation++;
    this.loads.clear();
    this.refreshAgain.clear();
    this.commandVersions.clear();
    this.stopRequests.clear();
    this.submissions.invalidate();
    for (const abort of this.aborts.values()) abort.abort();
    agentsQueryClient().removeQueries({ queryKey: chatKeys.all });
  }
  dispose(): void {
    this.invalidate();
    this.submissions.dispose();
    for (const abort of this.aborts.values()) abort.abort();
    this.streams.clear();
    this.histories.clear();
    this.listeners.clear();
  }
}
const ControllerContext = createContext<ChatController | null>(null);
export function ChatClientProvider({
  children,
}: {
  children?: ReactNode;
}): ReactElement {
  const host = useApiClient();
  const [controller] = useState(() => new ChatController(new ChatApi(host)));
  const lifetimeRef = useRef(0);
  useEffect(() => {
    controller.activate();
    const lifetime = lifetimeRef;
    const generation = ++lifetime.current;
    return () => {
      controller.invalidate();
      queueMicrotask(() => {
        if (lifetime.current === generation) controller.dispose();
      });
    };
  }, [controller]);
  return (
    <ControllerContext.Provider value={controller}>
      {children}
    </ControllerContext.Provider>
  );
}
export function useChatController(): ChatController {
  const controller = useContext(ControllerContext);
  if (!controller) throw new Error('ChatProvider is required.');
  return controller;
}
export function useChatStream(id: string | null): StreamState | undefined {
  const controller = useContext(ControllerContext);
  useSyncExternalStore(
    controller?.subscribe ?? noSubscribe,
    controller?.snapshot ?? zero,
    controller?.snapshot ?? zero,
  );
  useEffect(() => {
    if (id) controller?.receive(id);
  }, [controller, id]);
  return id ? controller?.state(id) : undefined;
}

const noSubscribe = (): (() => void) => () => {};
const zero = (): number => 0;

export function useChatStreamState(id: string | null): StreamState | undefined {
  const controller = useContext(ControllerContext);
  useSyncExternalStore(
    controller?.subscribe ?? noSubscribe,
    controller?.snapshot ?? zero,
    controller?.snapshot ?? zero,
  );
  return id ? controller?.state(id) : undefined;
}
