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
  lastLoadedSeq,
  type MessagesAction,
  type MessagesState,
} from './message-model.js';

import type { OnlineAgentStreamEvent } from '../../shared/online-agent.js';
export type StreamState = {
  phase: 'connecting' | 'streaming' | 'saved' | 'interrupted';
  items: ConversationMessage[];
  lastSeq?: number;
};
/** One application-owned sender and stream consumer, shared across all mounted chat views. */
export class ChatController {
  readonly submissions: ChatSubmissions;
  private histories = new Map<
    string,
    { state: MessagesState; error?: unknown; loadingOlder: boolean }
  >();
  private loads = new Map<string, Promise<void>>();
  private refreshAgain = new Set<string>();
  history(id: string): {
    state: MessagesState;
    error?: unknown;
    loadingOlder: boolean;
  } {
    return (
      this.histories.get(id) ?? { state: EMPTY_MESSAGES, loadingOlder: false }
    );
  }
  dispatch(id: string, action: MessagesAction): void {
    const previous = this.history(id);
    this.histories.set(id, {
      ...previous,
      state: messagesReducer(previous.state, action),
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
    const initial = this.history(id);
    if (older && !initial.state.olderToken) return;
    this.histories.set(id, { ...initial, loadingOlder: older });
    this.publish();
    const task = (async () => {
      try {
        while (!this.disposed) {
          const before = this.history(id).state;
          const page = await this.api.messages(
            id,
            older
              ? { pageToken: before.olderToken! }
              : before.loaded
                ? { after: fetchCursor(before) }
                : {},
          );
          if (this.disposed) return;
          this.dispatch(id, { type: 'page', page, older });
          this.submissions.observe(id, page.items);
          if (!older && this.refreshAgain.delete(id)) continue;
          if (
            older ||
            !page.items.length ||
            !before.loaded ||
            lastLoadedSeq(this.history(id).state) >= page.lastSeq
          )
            break;
        }
        const current = this.history(id);
        this.histories.set(id, {
          ...current,
          error: undefined,
          loadingOlder: false,
        });
      } catch (error) {
        if (!this.disposed)
          this.histories.set(id, {
            ...this.history(id),
            error,
            loadingOlder: false,
          });
      } finally {
        this.loads.delete(id);
        if (!this.disposed) this.publish();
      }
    })();
    this.loads.set(id, task);
    return task;
  }
  private streams = new Map<string, StreamState>();
  private aborts = new Map<string, AbortController>();
  private listeners = new Set<() => void>();
  private revision = 0;
  private disposed = false;
  constructor(readonly api: ChatApi) {
    this.submissions = new ChatSubmissions(api, (detail, _record, created) => {
      agentsQueryClient().setQueryData(
        chatKeys.conversation(detail.id),
        detail,
      );
      void agentsQueryClient().invalidateQueries({ queryKey: chatKeys.lists });
      if (_record.message)
        this.dispatch(detail.id, {
          type: 'confirmed',
          message: _record.message,
        });
      if (!created) this.receive(detail.id, true);
    });
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
    const detail = await this.api.conversation(id);
    if (!current()) return;
    await this.loadHistory(id, false, true);
    const loaded = this.history(id);
    if (loaded.error)
      throw loaded.error instanceof Error
        ? loaded.error
        : new Error('Saved history could not be loaded.');
    const page = loaded.state;
    if (!current()) return;
    agentsQueryClient().setQueryData(chatKeys.conversation(id), detail);
    this.submissions.observe(id, page.items);
    if (detail.execution?.status === 'idle') {
      const stream = this.streams.get(id);
      if (stream)
        this.streams.set(id, {
          ...stream,
          phase: 'saved',
          lastSeq: page.lastSeq,
        });
    }
    this.publish();
  }
  activate(): void {
    this.disposed = false;
  }
  invalidate(): void {
    this.disposed = true;
    this.submissions.invalidate();
    for (const abort of this.aborts.values()) abort.abort();
    agentsQueryClient().removeQueries({ queryKey: chatKeys.all });
  }
  dispose(): void {
    this.disposed = true;
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
