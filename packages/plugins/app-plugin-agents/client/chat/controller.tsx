/* eslint-disable react-refresh/only-export-components -- shared controller provider and hooks */
import { CancelledError } from '@tanstack/react-query';
import { isToolUIPart } from 'ai';
import { Chat, useChat as useSDKChat } from '@ai-sdk/react';
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useApiClient } from '@nocobase/app-client';
import type { ConversationDetail } from '../../shared/conversations.js';
import type {
  AppUIMessage,
  AppUIToolApprovalInput,
} from '../../shared/online-agent.js';
import { ChatApi } from './api.js';
import { chatIsRunning } from './feedback.js';
import { ChatSubmissions, type SubmissionSend } from './submissions.js';
import { agentsQueryClient } from '../query.js';
import { chatKeys } from './keys.js';
import {
  EMPTY_MESSAGES,
  messagesReducer,
  mergeUIMessages,
  type MessagesAction,
  type MessagesState,
} from './message-model.js';

/** SDK transport state is presentation only. Business completion always comes from saved execution/history. */
export type StreamState = {
  readonly status: Chat<AppUIMessage>['status'];
  readonly error?: Error;
};
function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
} {
  let resolve!: (value: T) => void, reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
type History = {
  page: Omit<MessagesState, 'items' | 'pending'>;
  error?: unknown;
  loadingOlder: boolean;
  loadedThrough: number;
};
/** Application coordination around one SDK Chat per conversation, shared by every surface. */
export class ChatController {
  readonly submissions: ChatSubmissions;
  private chats = new Map<string, Chat<AppUIMessage>>();
  private histories = new Map<string, History>();
  private loads = new Map<string, Promise<void>>();
  private refreshAgain = new Set<string>();
  private resumed = new Set<string>();
  private resuming = new Map<string, Promise<void>>();
  private recoveryErrors = new Map<string, Error>();
  private admissions = new Map<
    string,
    { clientId: string; gate: ReturnType<typeof deferred<void>> }
  >();
  private watches = new Map<
    string,
    { refs: number; timer: ReturnType<typeof setInterval>; last: number }
  >();
  private messageVersions = new Map<string, number>();
  private revisionQueue = new Map<
    string,
    { pending: Set<string>; task: Promise<void> }
  >();
  private deferredReads = new Map<string, Set<string>>();
  private completionReads = new Set<string>();
  private stopRequests = new Set<string>();
  private approvalRequests = new Set<string>();
  private listeners = new Set<() => void>();
  private revision = 0;
  private disposed = false;
  private generation = 0;
  private detailVersions = new Map<string, number>();
  private commandVersions = new Map<string, number>();
  constructor(readonly api: ChatApi) {
    this.submissions = new ChatSubmissions(
      {
        createConversation: (input) => api.createConversation(input),
        messages: (id, query) => api.messages(id, query),
        sendMessage: (id, input) =>
          this.command(
            id,
            () => this.sendInput(id, input),
            (result) => result.conversation,
          ),
      },
      (detail, _record, created) => {
        if (created) this.remember(detail);
      },
      undefined,
      (id, message) => this.dispatch(id, { type: 'confirmed', message }),
    );
    this.submissions.subscribe(() => this.publish());
  }
  chat(id: string): Chat<AppUIMessage> {
    let chat = this.chats.get(id);
    if (!chat) {
      chat = new Chat<AppUIMessage>({
        id,
        transport: this.api.transport(id, (clientId) => {
          const admission = this.admissions.get(id);
          if (!this.disposed && admission?.clientId === clientId)
            admission.gate.resolve();
        }),
        onFinish: () => {
          if (!this.disposed && this.chats.get(id) === chat)
            this.scheduleRefresh(id);
        },
        onError: () => {
          if (this.disposed || this.chats.get(id) !== chat) return;
          this.scheduleRefresh(id);
        },
      });
      this.chats.set(id, chat);
    }
    return chat;
  }
  private renewChat(id: string, messages: AppUIMessage[]): Chat<AppUIMessage> {
    const previous = this.chats.get(id);
    this.chats.delete(id);
    const chat = this.chat(id);
    chat.messages = messages;
    void previous?.stop();
    this.publish();
    return chat;
  }
  history(id: string): {
    state: MessagesState;
    error?: unknown;
    loadingOlder: boolean;
    loadedThrough: number;
  } {
    const current = this.histories.get(id);
    return {
      state: {
        ...(current?.page ?? EMPTY_MESSAGES),
        items: this.chat(id).messages,
        pending: [],
      },
      error: current?.error,
      loadingOlder: current?.loadingOlder ?? false,
      loadedThrough: current?.loadedThrough ?? 0,
    };
  }
  private historyMeta(id: string): History {
    const previous = this.histories.get(id);
    if (previous) return previous;
    const { items: _items, pending: _pending, ...page } = EMPTY_MESSAGES;
    const created = { page, loadingOlder: false, loadedThrough: 0 };
    this.histories.set(id, created);
    return created;
  }
  dispatch(id: string, action: MessagesAction): void {
    if (this.disposed) return;
    if (action.type === 'discard') {
      const record = this.submissions
        .snapshot()
        .find((item) => item.clientId === action.clientId);
      if (record && ['notSubmitted', 'rejected'].includes(record.status)) {
        const chat = this.chat(id);
        chat.messages = chat.messages.filter(
          (message) =>
            message.id !== action.clientId ||
            message.metadata?.seq !== undefined,
        );
        chat.clearError();
      }
      this.submissions.editRejected(action.clientId);
      return;
    }
    const current = this.historyMeta(id);
    const before = this.history(id).state;
    const next = messagesReducer(before, action);
    const chat = this.chat(id);
    const streaming =
      chat.status === 'submitted' || chat.status === 'streaming';
    const activeId =
      streaming && chat.messages.at(-1)?.role === 'assistant'
        ? chat.messages.at(-1)!.id
        : undefined;
    if (action.type === 'page' || action.type === 'confirmed') {
      const incoming =
        action.type === 'page' ? action.page.items : [action.message];
      const lastUser = Math.max(
        0,
        ...[...chat.messages, ...incoming]
          .filter((message) => message.role === 'user')
          .map((message) => message.metadata?.seq ?? 0),
      );
      const batch = incoming.filter((message) => {
        const allowed =
          !streaming ||
          Boolean(activeId) ||
          message.role !== 'assistant' ||
          (message.metadata?.seq ?? Infinity) <= lastUser;
        if (!allowed) {
          const pending = this.deferredReads.get(id) ?? new Set<string>();
          pending.add(message.id);
          this.deferredReads.set(id, pending);
        }
        return allowed;
      });
      chat.messages = mergeUIMessages(chat.messages, batch, activeId);
    }
    const { items: _items, pending: _pending, ...page } = next;
    this.histories.set(id, {
      ...current,
      page,
      loadedThrough:
        action.type === 'page' && !action.older && !action.reread
          ? Math.max(
              current.loadedThrough,
              action.page.nextAfter ?? action.page.lastSeq,
            )
          : current.loadedThrough,
    });
    this.publish();
  }
  async loadHistory(id: string, older = false, fresh = false): Promise<void> {
    if (this.disposed) return;
    const pending = this.loads.get(id);
    if (pending) {
      if (fresh) this.refreshAgain.add(id);
      return pending;
    }
    const active = this.lifetime();
    const initial = this.history(id);
    if (older && !initial.state.olderToken) return;
    this.historyMeta(id).loadingOlder = older;
    this.publish();
    const task = (async () => {
      try {
        let after = initial.state.loaded ? initial.loadedThrough : undefined;
        const seen = new Set<number>();
        while (active()) {
          const page = await this.api.messages(
            id,
            older
              ? { pageToken: this.history(id).state.olderToken! }
              : after === undefined
                ? {}
                : { after },
          );
          if (!active()) return;
          this.dispatch(id, { type: 'page', page, older });
          this.submissions.observe(id, page.items);
          const metadata = this.historyMeta(id);
          if (!older) metadata.loadedThrough = page.nextAfter ?? page.lastSeq;
          if (!older && page.nextAfter !== undefined) {
            if (seen.has(page.nextAfter))
              throw new Error('History pagination did not advance.');
            seen.add(page.nextAfter);
            after = page.nextAfter;
            continue;
          }
          if (this.refreshAgain.delete(id)) {
            older = false;
            after = this.history(id).loadedThrough;
            continue;
          }
          break;
        }
        if (active()) {
          const pending = [...(this.deferredReads.get(id) ?? [])];
          const owner = this.chat(id);
          if (
            pending.length &&
            owner.status !== 'submitted' &&
            owner.status !== 'streaming'
          )
            await this.reread(id, pending);
          if (active()) this.historyMeta(id).error = undefined;
        }
      } catch (error) {
        if (active()) this.historyMeta(id).error = error;
      } finally {
        if (active()) {
          this.historyMeta(id).loadingOlder = false;
          this.loads.delete(id);
          this.publish();
        }
      }
    })();
    this.loads.set(id, task);
    return task;
  }
  async reread(id: string, ids: readonly string[]): Promise<AppUIMessage[]> {
    if (this.disposed) return [];
    const found: AppUIMessage[] = [];
    const active = this.lifetime();
    for (let offset = 0; offset < ids.length; offset += 100) {
      const page = await this.api.messages(id, {
        ids: ids.slice(offset, offset + 100).join(','),
      });
      if (!active()) return [];
      found.push(...page.items);
      const pending = this.deferredReads.get(id);
      for (const message of page.items) {
        if (
          (message.metadata?.revision ?? 0) >=
          (this.messageVersions.get(`${id}:${message.id}`) ?? 0)
        )
          pending?.delete(message.id);
      }
      if (pending?.size === 0) this.deferredReads.delete(id);
      this.dispatch(id, { type: 'page', page, reread: true });
      this.submissions.observe(id, page.items);
    }
    return found;
  }
  watch(id: string): () => void {
    let watch = this.watches.get(id);
    if (!watch) {
      const active = this.lifetime();
      const timer = setInterval(() => {
        if (!active() || document.visibilityState === 'hidden') return;
        const detail = agentsQueryClient().getQueryData<ConversationDetail>(
          chatKeys.conversation(id),
        );
        const current = this.watches.get(id)!;
        const interval = detail?.execution?.status === 'running' ? 5000 : 30000;
        if (Date.now() - current.last < interval) return;
        current.last = Date.now();
        void this.loadHistory(id, false, true);
      }, 5000);
      watch = { refs: 0, timer, last: Date.now() };
      this.watches.set(id, watch);
    }
    watch.refs++;
    return () => {
      const current = this.watches.get(id);
      if (current && --current.refs === 0) {
        clearInterval(current.timer);
        this.watches.delete(id);
      }
    };
  }
  reconnect(): void {
    for (const id of this.watches.keys()) void this.resume(id);
  }
  messageUpdated(id: string, messageId: string, revision: number): void {
    const key = `${id}:${messageId}`;
    if (
      ((this.messageVersions.get(key) ?? -1) >= revision &&
        !this.deferredReads.get(id)?.has(messageId)) ||
      this.disposed
    )
      return;
    this.messageVersions.set(
      key,
      Math.max(this.messageVersions.get(key) ?? -1, revision),
    );
    const previous = this.revisionQueue.get(id);
    if (previous) {
      previous.pending.add(messageId);
      return;
    }
    const queue = { pending: new Set([messageId]), task: Promise.resolve() };
    this.revisionQueue.set(id, queue);
    const active = this.lifetime();
    queue.task = (async () => {
      const attempted = new Set<string>();
      try {
        while (active() && queue.pending.size) {
          const ids = [...queue.pending];
          queue.pending.clear();
          ids.forEach((id) => attempted.add(id));
          await this.reread(id, ids);
        }
      } catch (error) {
        if (active()) {
          const retry = this.deferredReads.get(id) ?? new Set<string>();
          for (const messageId of [...attempted, ...queue.pending]) {
            retry.add(messageId);
          }
          this.deferredReads.set(id, retry);
          this.historyMeta(id).error = error;
          this.publish();
        }
      } finally {
        if (active()) this.revisionQueue.delete(id);
      }
    })();
  }
  private async sendInput(
    id: string,
    input: SubmissionSend,
  ): Promise<{ message: AppUIMessage; conversation: ConversationDetail }> {
    if (this.disposed) throw new CancelledError({ silent: true });
    const chat = this.chat(id);
    if (chat.status === 'submitted' || chat.status === 'streaming')
      throw new Error('This conversation is already receiving a response.');
    const admitted = deferred<void>();
    this.admissions.set(id, { clientId: input.clientId, gate: admitted });
    this.recoveryErrors.delete(id);
    const active = this.lifetime();
    const sending = chat.sendMessage(
      {
        id: input.clientId,
        role: 'user',
        metadata: {
          conversationId: id,
          createdAt: new Date().toISOString(),
          revision: 0,
          ...(input.context
            ? {
                context: {
                  route: input.context.route,
                  items: [],
                  dropped: 0,
                  ...(input.context.ui
                    ? { ui: structuredClone(input.context.ui) }
                    : {}),
                },
              }
            : {}),
        },
        parts: [{ type: 'text', text: input.content }],
      },
      {
        body: {
          ...(input.context ? { context: input.context } : {}),
          ...(input.attachmentIds?.length
            ? { attachmentIds: input.attachmentIds }
            : {}),
        },
      },
    );
    void sending.then(
      () =>
        admitted.reject(
          chat.error ??
            new Error(
              'The response ended before input admission was confirmed.',
            ),
        ),
      (error) => admitted.reject(error),
    );
    try {
      await admitted.promise;
    } finally {
      if (this.admissions.get(id)?.gate === admitted)
        this.admissions.delete(id);
    }
    if (!active()) throw new CancelledError({ silent: true });
    await this.loadHistory(id, false, true);
    const conversation = await this.api.conversation(id);
    if (!active()) throw new CancelledError({ silent: true });
    const message = this.chat(id).messages.find(
      (message) =>
        message.role === 'user' &&
        message.metadata?.seq !== undefined &&
        (message.metadata?.clientId ?? message.id) === input.clientId,
    );
    if (!message)
      throw new Error(
        'Input was accepted; reconcile its saved message before sending again.',
      );
    return { message, conversation };
  }
  state(id: string): StreamState | undefined {
    const chat = this.chats.get(id);
    return chat
      ? {
          status: chat.status,
          error: chat.error ?? this.recoveryErrors.get(id),
        }
      : undefined;
  }
  receive(id: string, known?: ConversationDetail): void {
    if (this.disposed || this.resumed.has(id)) return;
    const detail =
      known ??
      agentsQueryClient().getQueryData<ConversationDetail>(
        chatKeys.conversation(id),
      );
    if (!detail?.execution) return;
    this.resumed.add(id);
    if (
      detail?.execution?.status === 'idle' ||
      detail?.execution?.waitingApproval
    )
      return;
    void this.resume(id);
  }
  async resume(id: string): Promise<void> {
    if (this.disposed) return;
    const pending = this.resuming.get(id);
    if (pending) return pending;
    let chat = this.chat(id);
    if (chat.status === 'submitted' || chat.status === 'streaming') return;
    const active = this.lifetime();
    const canResume = () =>
      active() &&
      this.chats.get(id) === chat &&
      chat.status !== 'submitted' &&
      chat.status !== 'streaming';
    const task = (async () => {
      let interrupted: AppUIMessage | undefined;
      try {
        await this.loadHistory(id);
        // A new input can begin while the recovery snapshot is still being read.
        if (!canResume()) return;
        if (chat.error) {
          const previous = chat;
          interrupted = [...previous.messages]
            .reverse()
            .find((message) => message.role === 'assistant');
          // Shared recovery replays this response's full prefix. SDK disconnect state expects deltas instead.
          // Recreate its one shared owner using public state, never the SDK's private resumable cache.
          if (
            interrupted?.parts.some(
              (part) =>
                isToolUIPart(part) &&
                (part.state === 'input-streaming' ||
                  part.state === 'approval-responded'),
            )
          ) {
            const saved = await this.reread(id, [interrupted.id]);
            if (!canResume()) return;
            if (!saved.some((message) => message.id === interrupted!.id))
              previous.messages = previous.messages.filter(
                (message) => message.id !== interrupted!.id,
              );
          }
          chat = this.renewChat(id, previous.messages);
          if (!active()) return;
        }
        this.recoveryErrors.delete(id);
        chat.clearError();
        const response = [...chat.messages]
          .reverse()
          .find((message) => message.role === 'assistant');
        if (response)
          chat.messages = mergeUIMessages(chat.messages, [], response.id);
        await chat.resumeStream();
        if (active()) await this.refresh(id);
      } catch (error) {
        if (canResume())
          this.recoveryErrors.set(
            id,
            error instanceof Error
              ? error
              : new Error('Stream recovery failed.'),
          );
      } finally {
        if (active()) {
          const display = interrupted;
          if (
            display &&
            canResume() &&
            !chat.messages.some((message) => message.id === display.id)
          )
            chat.messages = mergeUIMessages(chat.messages, [display]);
          this.resuming.delete(id);
          this.publish();
        }
      }
    })();
    this.resuming.set(id, task);
    return task;
  }
  async approve(id: string, input: AppUIToolApprovalInput): Promise<void> {
    const active = this.lifetime();
    if (!active()) throw new CancelledError({ silent: true });
    const chat = this.chat(id);
    if (
      this.approvalRequests.has(id) ||
      chat.status === 'submitted' ||
      chat.status === 'streaming'
    )
      throw new Error('This conversation is busy.');
    this.approvalRequests.add(id);
    this.commandVersions.set(id, (this.commandVersions.get(id) ?? 0) + 1);
    this.nextDetailVersion(id);
    try {
      await agentsQueryClient().cancelQueries({
        queryKey: chatKeys.conversation(id),
        exact: true,
      });
      if (!active()) throw new CancelledError({ silent: true });
      chat.messages = mergeUIMessages(chat.messages, [], input.messageId);
      await chat.addToolApprovalResponse(input.approval);
      if (!active()) throw new CancelledError({ silent: true });
      await chat.sendMessage(undefined, { body: { approvalInput: input } });
      if (!active()) return;
      if (chat.error) throw chat.error;
      await this.refresh(id);
    } finally {
      if (active()) this.approvalRequests.delete(id);
    }
  }
  async finalize(id: string): Promise<void> {
    const active = this.lifetime();
    await this.command(
      id,
      () => this.api.finalize(id),
      (detail) => detail,
    );
    if (active()) await this.refresh(id);
  }
  async refresh(id: string): Promise<void> {
    if (this.disposed) return;
    const active = this.lifetime(),
      ordered = this.detailRequest(id);
    const detail = await this.api.conversation(id);
    if (!active() || !ordered()) return;
    await this.loadHistory(id, false, true);
    if (!active() || !ordered()) return;
    const history = this.history(id);
    if (history.error)
      throw history.error instanceof Error
        ? history.error
        : new Error('Saved history could not be read.');
    // Same-sequence approval revisions cannot be discovered by the insertion cursor.
    const latest = [...this.chat(id).messages]
      .reverse()
      .find((message) => message.role === 'assistant');
    const revisable = [
      ...new Set([
        ...(this.deferredReads.get(id) ?? []),
        ...(detail.execution?.messageId
          ? [detail.execution.messageId]
          : latest
            ? [latest.id]
            : []),
      ]),
    ];
    const saved = revisable.length ? await this.reread(id, revisable) : [];
    if (!active() || !ordered()) return;
    const owner = this.chat(id),
      receiving = owner.messages.at(-1);
    if (
      owner.status === 'streaming' &&
      receiving?.role === 'assistant' &&
      (detail.execution?.status === 'idle' ||
        detail.execution?.waitingApproval) &&
      saved.some(
        (message) =>
          message.id === receiving.id &&
          message.metadata?.seq !== undefined &&
          message.metadata?.executionId === receiving.metadata?.executionId &&
          message.metadata.revision >= (detail.execution?.revision ?? 0),
      )
    ) {
      // Durable completion can release a lost subscriber; this never calls business Stop.
      await owner.stop();
      if (!active() || !ordered()) return;
      owner.messages = mergeUIMessages(owner.messages, saved);
    }
    if (!active() || !ordered()) return;
    this.remember(detail);
    const chat = this.chat(id);
    if (detail.execution?.status === 'idle') {
      this.recoveryErrors.delete(id);
      if (
        chat.error &&
        saved.some(
          (message) =>
            message.id === chat.messages.at(-1)?.id &&
            message.metadata?.seq !== undefined,
        )
      )
        this.renewChat(id, chat.messages);
    } else if (
      detail.execution?.status === 'running' &&
      !detail.execution.waitingApproval &&
      chat.status !== 'submitted' &&
      chat.status !== 'streaming'
    )
      this.recoveryErrors.set(
        id,
        new Error(
          'Execution remains active; reconcile saved history or resume its stream.',
        ),
      );
    this.publish();
  }
  private scheduleRefresh(id: string): void {
    if (this.completionReads.has(id)) return;
    this.completionReads.add(id);
    queueMicrotask(() => {
      this.completionReads.delete(id);
      if (!this.disposed) void this.refresh(id).catch(() => {});
    });
  }
  observeDetail(detail: ConversationDetail): void {
    if (detail.execution?.status === 'running') this.receive(detail.id, detail);
    if (!chatIsRunning(detail)) {
      if (this.chats.get(detail.id)?.status === 'streaming')
        this.scheduleRefresh(detail.id);
      this.stopRequests.delete(detail.id);
      this.recoveryErrors.delete(detail.id);
      this.publish();
    }
  }
  isStopping(id: string): boolean {
    return this.stopRequests.has(id);
  }
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
    const active = this.lifetime(),
      version = this.nextDetailVersion(id);
    return () => active() && this.detailVersions.get(id) === version;
  }
  private remember(detail: ConversationDetail): void {
    this.nextDetailVersion(detail.id);
    this.observeDetail(detail);
    agentsQueryClient().setQueryData(chatKeys.conversation(detail.id), detail);
    void agentsQueryClient().invalidateQueries({ queryKey: chatKeys.lists });
  }
  async command<T>(
    id: string,
    request: () => Promise<T>,
    detail: (result: T) => ConversationDetail,
  ): Promise<T> {
    const active = this.lifetime(),
      version = (this.commandVersions.get(id) ?? 0) + 1;
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
  subscribe = (callback: () => void): (() => void) => {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  };
  snapshot = (): number => this.revision;
  private publish(): void {
    this.revision++;
    for (const callback of this.listeners) callback();
  }
  activate(): void {
    this.disposed = false;
  }
  invalidate(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.generation++;
    for (const chat of this.chats.values()) void chat.stop();
    for (const admission of this.admissions.values())
      admission.gate.reject(new CancelledError({ silent: true }));
    for (const watch of this.watches.values()) clearInterval(watch.timer);
    this.watches.clear();
    this.messageVersions.clear();
    this.revisionQueue.clear();
    this.deferredReads.clear();
    this.completionReads.clear();
    this.admissions.clear();
    this.loads.clear();
    this.refreshAgain.clear();
    this.commandVersions.clear();
    this.stopRequests.clear();
    this.approvalRequests.clear();
    this.resuming.clear();
    this.resumed.clear();
    this.submissions.invalidate();
    agentsQueryClient().removeQueries({ queryKey: chatKeys.all });
  }
  dispose(): void {
    this.invalidate();
    this.submissions.dispose();
    this.chats.clear();
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
  const controller = useMemo(
    () => new ChatController(new ChatApi(host)),
    [host],
  );
  const lifetimesRef = useRef(new Map<ChatController, number>());
  useLayoutEffect(() => {
    controller.activate();
    const lifetimes = lifetimesRef.current;
    lifetimes.set(controller, (lifetimes.get(controller) ?? 0) + 1);
    const reconnect = () => controller.reconnect();
    window.addEventListener('online', reconnect);
    return () => {
      window.removeEventListener('online', reconnect);
      controller.invalidate();
      lifetimes.set(controller, (lifetimes.get(controller) ?? 1) - 1);
      queueMicrotask(() => {
        if (lifetimes.get(controller) === 0) {
          controller.dispose();
          lifetimes.delete(controller);
        }
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
  const controller = useChatController();
  useSDKChat({ chat: controller.chat(id ?? 'draft') });
  useSyncExternalStore(
    controller.subscribe,
    controller.snapshot,
    controller.snapshot,
  );
  useEffect(() => {
    if (id) controller.receive(id);
  }, [controller, id]);
  return id ? controller.state(id) : undefined;
}
export function useChatStreamState(id: string | null): StreamState | undefined {
  const controller = useChatController();
  useSDKChat({ chat: controller.chat(id ?? 'draft') });
  useSyncExternalStore(
    controller.subscribe,
    controller.snapshot,
    controller.snapshot,
  );
  return id ? controller.state(id) : undefined;
}
