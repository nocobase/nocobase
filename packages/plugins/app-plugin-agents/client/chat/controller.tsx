/* eslint-disable react-refresh/only-export-components -- shared controller provider and hooks */
import type { OnlineAgentResendOptions } from '../../shared/resend.js';
import type { ConversationChanged } from '../../shared/conversations.js';
import { ApiClientError } from '@nocobase/app-client';

export type ResendResult = {
  outcome: 'accepted' | 'rejected' | 'unknown';
  needsSync?: boolean;
  error?: unknown;
};
type HistoryReplacement = Extract<
  ConversationChanged,
  { kind: 'conversation.historyReplaced' }
>;
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
  readonly recovery?: 'recovering' | 'history' | 'interrupted';
};
type Recovery = {
  key: string;
  phase: NonNullable<StreamState['recovery']> | 'live';
  error?: Error;
  task?: Promise<void>;
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
  private historyEpochs = new Map<string, number>();
  private replacements = new Map<
    string,
    { executionId: string; revision: number; seq: number; lastSeq: number }
  >();
  private resendRequests = new Map<
    string,
    { accepted: boolean; gate: ReturnType<typeof deferred<ResendResult>> }
  >();
  private reconciles = new Map<string, Promise<void>>();
  readonly submissions: ChatSubmissions;
  private chats = new Map<string, Chat<AppUIMessage>>();
  private histories = new Map<string, History>();
  private loads = new Map<string, Promise<void>>();
  private refreshAgain = new Set<string>();
  private recoveries = new Map<string, Recovery>();
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
        transport: this.api.transport(
          id,
          (clientId) => {
            const admission = this.admissions.get(id);
            if (!this.disposed && admission?.clientId === clientId)
              admission.gate.resolve();
          },
          (options) => this.resendAccepted(id, options),
          () => {
            const active = this.lifetime(),
              recovery = this.recoveries.get(id);
            return (available) => {
              if (
                !active() ||
                this.chats.get(id) !== chat ||
                !recovery ||
                this.recoveries.get(id) !== recovery
              )
                return;
              recovery.phase = available ? 'live' : 'history';
              recovery.error = undefined;
              // Reads started before reconnection must not replace its replay or revive old errors.
              this.nextDetailVersion(id);
              this.invalidateHistoryReads(id);
              this.publish();
            };
          },
        ),
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
    if (action.type === 'confirmed') {
      const boundary = this.replacements.get(id),
        seq = action.message.metadata?.seq;
      if (
        boundary &&
        seq !== undefined &&
        seq > boundary.seq &&
        seq <= boundary.lastSeq &&
        action.message.metadata?.executionId !== boundary.executionId
      )
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
    if (action.type === 'replaceHistory') chat.messages = [...next.items];
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
  private historyLifetime(id: string): () => boolean {
    const active = this.lifetime(),
      epoch = this.historyEpochs.get(id) ?? 0,
      command = this.commandVersions.get(id);
    return () =>
      active() &&
      (this.historyEpochs.get(id) ?? 0) === epoch &&
      this.commandVersions.get(id) === command;
  }

  private invalidateHistoryReads(id: string, discardDeferred = false): void {
    this.historyEpochs.set(id, (this.historyEpochs.get(id) ?? 0) + 1);
    this.loads.delete(id);
    this.refreshAgain.delete(id);
    this.revisionQueue.delete(id);
    if (discardDeferred) this.deferredReads.delete(id);
    for (const key of this.messageVersions.keys())
      if (key.startsWith(`${id}:`)) this.messageVersions.delete(key);
    this.historyMeta(id).loadingOlder = false;
  }

  historyReplaced(event: HistoryReplacement): void {
    if (this.disposed || !this.replaceHistory(event)) return;
    const active = this.historyLifetime(event.conversationId);
    void this.reread(event.conversationId, [event.messageId])
      .then(async () => {
        if (!active()) return;
        await this.refresh(event.conversationId);
        if (
          !this.disposed &&
          !this.resendRequests.has(event.conversationId) &&
          this.replacements.get(event.conversationId)?.executionId ===
            event.executionId
        )
          await this.resume(event.conversationId);
      })
      .catch((error: unknown) => {
        if (active()) {
          this.historyMeta(event.conversationId).error = error;
          this.publish();
        }
      });
  }

  private replaceHistory(event: HistoryReplacement): boolean {
    const id = event.conversationId,
      previous = this.replacements.get(id);
    if (
      previous?.executionId === event.executionId ||
      (previous && previous.lastSeq > event.lastSeq)
    )
      return false;
    this.invalidateHistoryReads(id, true);
    this.recoveries.delete(id);
    this.replacements.set(id, event);
    this.dispatch(id, { type: 'replaceHistory', ...event });
    this.historyMeta(id).loadedThrough = Math.max(
      this.historyMeta(id).loadedThrough,
      event.lastSeq,
    );
    const chat = this.chat(id);
    // A replacement owns a different response. Detach only the local subscriber, never business Stop.
    if (!this.resendRequests.has(id)) this.renewChat(id, chat.messages);
    return true;
  }

  private async resendAccepted(
    id: string,
    options: OnlineAgentResendOptions,
  ): Promise<void> {
    const request = this.resendRequests.get(id);
    if (!request || this.disposed) throw new CancelledError({ silent: true });
    request.accepted = true;
    const active = this.lifetime();
    try {
      const page = await this.api.messages(id, { ids: options.messageId });
      if (!active() || this.resendRequests.get(id) !== request)
        throw new CancelledError({ silent: true });
      const target = page.items.find(
        (m) => m.id === options.messageId && m.role === 'user',
      );
      if (!target?.metadata?.executionId || target.metadata.seq === undefined)
        throw new Error('Accepted input requires history synchronization.');
      this.replaceHistory({
        kind: 'conversation.historyReplaced',
        conversationId: id,
        messageId: target.id,
        seq: target.metadata.seq,
        revision: target.metadata.revision,
        lastSeq: page.lastSeq,
        executionId: target.metadata.executionId,
      });
      this.dispatch(id, { type: 'confirmed', message: target });
      request.gate.resolve({ outcome: 'accepted' });
    } catch (error) {
      request.gate.resolve({ outcome: 'accepted', needsSync: true, error });
      throw error;
    }
  }

  isResending(id: string): boolean {
    return this.resendRequests.has(id);
  }

  async resend(
    id: string,
    options: OnlineAgentResendOptions & { messageId: string },
  ): Promise<ResendResult> {
    const detail = agentsQueryClient().getQueryData<ConversationDetail>(
      chatKeys.conversation(id),
    );
    const chat = this.chat(id);
    if (
      this.disposed ||
      this.resendRequests.has(id) ||
      this.approvalRequests.has(id) ||
      this.stopRequests.has(id) ||
      chat.status === 'submitted' ||
      chat.status === 'streaming' ||
      (detail && (detail.mode !== 'online' || chatIsRunning(detail)))
    )
      return {
        outcome: 'rejected',
        error: new Error(
          'This conversation is busy or does not support resend.',
        ),
      };
    const request = { accepted: false, gate: deferred<ResendResult>() };
    this.resendRequests.set(id, request);
    this.publish();
    const active = this.lifetime();
    this.commandVersions.set(id, (this.commandVersions.get(id) ?? 0) + 1);
    this.nextDetailVersion(id);
    try {
      await agentsQueryClient().cancelQueries({
        queryKey: chatKeys.conversation(id),
        exact: true,
      });
      if (!active()) throw new CancelledError({ silent: true });
      let target = chat.messages.find(
        (message) =>
          message.id === options.messageId && message.role === 'user',
      );
      if (!target) {
        const lookupActive = this.historyLifetime(id);
        try {
          const page = await this.api.messages(id, { ids: options.messageId });
          if (!active() || !lookupActive())
            throw new CancelledError({ silent: true });
          target = page.items.find(
            (message) =>
              message.id === options.messageId && message.role === 'user',
          );
          if (target) this.dispatch(id, { type: 'confirmed', message: target });
        } catch (error) {
          return { outcome: 'rejected', error };
        }
      }
      if (!target)
        return {
          outcome: 'rejected',
          error: new Error('The resend target is no longer available.'),
        };
      const before = [...chat.messages];
      this.invalidateHistoryReads(id);
      const historyActive = this.historyLifetime(id);
      chat.clearError();
      const body = { resendInput: structuredClone(options) };
      let textReplaced = false;
      const sending = options.input
        ? chat.sendMessage(
            {
              ...target,
              messageId: target.id,
              parts: [
                ...target.parts.flatMap<AppUIMessage['parts'][number]>(
                  (part) => {
                    if (part.type !== 'text') return [part];
                    if (textReplaced) return [];
                    textReplaced = true;
                    return [
                      { type: 'text' as const, text: options.input!.text },
                    ];
                  },
                ),
                ...(!target.parts.some((part) => part.type === 'text')
                  ? [{ type: 'text' as const, text: options.input.text }]
                  : []),
              ],
            },
            { body },
          )
        : chat.regenerate({ messageId: target.id, body });
      const failed = async (error: unknown) => {
        if (request.accepted) {
          request.gate.resolve({ outcome: 'accepted', needsSync: true, error });
          return;
        }
        const rejected =
          error instanceof ApiClientError &&
          error.status >= 400 &&
          error.status < 500 &&
          error.status !== 408 &&
          error.status !== 499;
        const outcome = rejected ? 'rejected' : 'unknown';
        let needsSync = false;
        if (active() && historyActive()) {
          if (outcome === 'rejected') chat.messages = before;
          try {
            // Unknown admission never restores a stale snapshot or retries the POST.
            await this.reread(
              id,
              before.map((message) => message.id),
            );
          } catch {
            needsSync = true;
          }
        }
        request.gate.resolve({ outcome, needsSync, error });
      };
      void sending.then(() => {
        if (!request.accepted)
          return failed(
            chat.error ??
              new Error(
                'Resend admission is unknown. Synchronize before trying again.',
              ),
          );
      }, failed);
      return await request.gate.promise;
    } finally {
      if (active() && this.resendRequests.get(id) === request) {
        this.resendRequests.delete(id);
        this.publish();
        void this.refresh(id).catch(() => {});
      }
    }
  }

  /** Only a successful read of every requested ID proves absence; never delete an unqueried message. */
  private async reconcile(
    id: string,
    detail: ConversationDetail,
  ): Promise<void> {
    const pending = this.reconciles.get(id);
    if (pending) return pending;
    if (this.resendRequests.has(id)) return;
    this.invalidateHistoryReads(id);
    const active = this.historyLifetime(id);
    const initial = this.chat(id).messages.filter(
      (m) => m.metadata?.seq !== undefined,
    );
    const task = (async () => {
      const found: AppUIMessage[] = [];
      for (let offset = 0; offset < initial.length; offset += 100) {
        const page = await this.api.messages(id, {
          ids: initial
            .slice(offset, offset + 100)
            .map((m) => m.id)
            .join(','),
        });
        if (!active()) return;
        found.push(...page.items);
      }
      const present = new Set(found.map((m) => m.id));
      const missing = new Set(
        initial.filter((m) => !present.has(m.id)).map((m) => m.id),
      );
      let window: import('./message-model.js').UIMessagePage | undefined;
      if (missing.size) {
        const oldest = Math.min(...initial.map((m) => m.metadata!.seq!));
        const seen = new Set<string>();
        do {
          window = await this.api.messages(
            id,
            window?.nextCursor ? { pageToken: window.nextCursor } : {},
          );
          if (!active()) return;
          found.push(...window.items);
          if (
            !window.nextCursor ||
            !window.items.length ||
            window.items[0].metadata!.seq! <= oldest
          )
            break;
          if (seen.has(window.nextCursor))
            throw new Error('History pagination did not advance.');
          seen.add(window.nextCursor);
        } while (window.nextCursor);
      }
      if (!active()) return;
      const changed = found.find(
        (m) =>
          m.role === 'user' &&
          initial.some(
            (old) =>
              old.id === m.id &&
              (old.metadata?.revision ?? 0) < (m.metadata?.revision ?? 0),
          ),
      );
      if (
        changed?.metadata?.executionId &&
        changed.metadata.seq !== undefined
      ) {
        this.replaceHistory({
          kind: 'conversation.historyReplaced',
          conversationId: id,
          messageId: changed.id,
          seq: changed.metadata.seq,
          revision: changed.metadata.revision,
          lastSeq: window?.lastSeq ?? this.history(id).state.lastSeq,
          executionId: changed.metadata.executionId,
        });
      }
      const owner = this.chat(id),
        response = owner.messages.at(-1);
      if (
        owner.status === 'streaming' &&
        response?.id &&
        detail.execution?.messageId &&
        response.id !== detail.execution.messageId
      ) {
        this.renewChat(
          id,
          owner.messages.filter((m) => m.id !== response.id),
        );
      }
      const chat = this.chat(id);
      const receiving =
        chat.status === 'submitted' || chat.status === 'streaming';
      const activeId =
        receiving && chat.messages.at(-1)?.id === detail.execution?.messageId
          ? chat.messages.at(-1)?.id
          : undefined;
      chat.messages = mergeUIMessages(
        chat.messages.filter((m) => !missing.has(m.id) || m.id === activeId),
        found,
        activeId,
      );
      if (window)
        this.historyMeta(id).page = {
          ...this.historyMeta(id).page,
          hasMore: window.hasMore,
          olderToken: window.nextCursor,
        };
      this.publish();
    })();
    this.reconciles.set(id, task);
    try {
      await task;
    } finally {
      if (this.reconciles.get(id) === task) this.reconciles.delete(id);
    }
  }
  async loadHistory(id: string, older = false, fresh = false): Promise<void> {
    if (this.disposed) return;
    const pending = this.loads.get(id);
    if (pending) {
      if (fresh) this.refreshAgain.add(id);
      return pending;
    }
    const active = this.historyLifetime(id);
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
    const active = this.historyLifetime(id);
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
        void this.refresh(id).catch(() => {});
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
    for (const id of this.watches.keys())
      void this.refresh(id)
        .then(() => this.resume(id))
        .catch(() => {});
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
    const active = this.historyLifetime(id);
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
  /**
   * A message sent while the agent works: it joins that work and shows as queued until the agent takes it. Throws
   * the server's refusal (`409` when the agent is not working any more), which the caller answers by sending it.
   */
  async queue(id: string, input: SubmissionSend): Promise<AppUIMessage> {
    if (this.disposed) throw new CancelledError({ silent: true });
    const message = await this.api.queue(id, input);
    this.dispatch(id, { type: 'confirmed', message });
    return message;
  }

  /** Takes back a queued message the agent has not taken; rereads it either way, so it shows where it stands. */
  async withdraw(id: string, messageId: string): Promise<void> {
    try {
      await this.api.withdraw(id, messageId);
    } finally {
      await this.reread(id, [messageId]).catch(() => {});
    }
  }

  private async sendInput(
    id: string,
    input: SubmissionSend,
  ): Promise<{ message: AppUIMessage; conversation: ConversationDetail }> {
    if (this.disposed) throw new CancelledError({ silent: true });
    let chat = this.chat(id);
    if (chat.status === 'submitted' || chat.status === 'streaming')
      throw new Error('This conversation is already receiving a response.');
    if (this.resendRequests.has(id))
      throw new Error('This conversation is busy.');
    const admitted = deferred<void>();
    this.admissions.set(id, { clientId: input.clientId, gate: admitted });
    this.recoveries.delete(id);
    // A new turn owns its callbacks, including when the previous transport finishes late.
    chat = this.renewChat(id, chat.messages);
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
          ...(input.agentId ? { agentId: input.agentId } : {}),
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
    const recovery = this.recoveries.get(id);
    const recovering = recovery?.phase === 'recovering';
    const error = recovering ? undefined : (chat?.error ?? recovery?.error);
    return chat
      ? {
          status: chat.status,
          error,
          recovery: recovering
            ? 'recovering'
            : error
              ? 'interrupted'
              : recovery?.phase === 'history'
                ? 'history'
                : undefined,
        }
      : undefined;
  }
  private recoveryKey(id: string, detail: ConversationDetail): string {
    return (
      detail.run?.id ??
      detail.execution?.messageId ??
      (detail.execution?.status === 'running'
        ? this.recoveries.get(id)?.key
        : undefined) ??
      [...this.chat(id).messages].reverse().find((m) => m.role === 'user')
        ?.id ??
      ''
    );
  }
  receive(id: string, known?: ConversationDetail): void {
    if (this.disposed) return;
    const detail =
      known ??
      agentsQueryClient().getQueryData<ConversationDetail>(
        chatKeys.conversation(id),
      );
    if (
      !detail ||
      this.recoveries.get(id)?.key === this.recoveryKey(id, detail)
    )
      return;
    void this.resume(id, detail);
  }
  async resume(id: string, known?: ConversationDetail): Promise<void> {
    if (this.disposed) return;
    const detail =
      known ??
      agentsQueryClient().getQueryData<ConversationDetail>(
        chatKeys.conversation(id),
      );
    if (!detail) return;
    if (!chatIsRunning(detail) || detail.execution?.waitingApproval) {
      const chat = this.chats.get(id);
      if (chat?.status !== 'submitted' && chat?.status !== 'streaming')
        await this.loadHistory(id);
      return;
    }
    const key = this.recoveryKey(id, detail);
    const pending = this.recoveries.get(id);
    let chat = this.chat(id);
    if (chat.status === 'submitted' || chat.status === 'streaming') {
      if (!pending || pending.key !== key)
        this.recoveries.set(id, { key, phase: 'live' });
      return;
    }
    if (pending?.key === key) {
      if (pending.task) return pending.task;
      if (pending.phase === 'history') return;
    }
    const active = this.lifetime();
    const replacement = this.replacements.get(id);
    const command = this.commandVersions.get(id);
    const recovery: Recovery = { key, phase: 'recovering' };
    this.recoveries.set(id, recovery);
    this.publish();
    const current = () =>
      active() &&
      this.commandVersions.get(id) === command &&
      this.recoveries.get(id) === recovery &&
      this.replacements.get(id) === replacement &&
      this.chats.get(id) === chat;
    const canResume = () =>
      current() && chat.status !== 'submitted' && chat.status !== 'streaming';
    const task = (async () => {
      let interrupted: AppUIMessage | undefined;
      try {
        await this.loadHistory(id);
        // A new input can begin while the recovery snapshot is still being read.
        if (!canResume()) return;
        if (this.history(id).error) throw this.history(id).error;
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
        chat.clearError();
        const response = [...chat.messages]
          .reverse()
          .find((message) => message.role === 'assistant');
        if (
          response &&
          (response === interrupted ||
            !key ||
            response.metadata?.executionId === key ||
            response.id === detail.execution?.messageId)
        ) {
          interrupted ??= response;
          chat.messages = mergeUIMessages(chat.messages, [], response.id);
        }
        await chat.resumeStream();
        if (current()) {
          if (chat.error) {
            recovery.phase = 'interrupted';
            recovery.error = chat.error;
          }
          await this.refresh(id);
        }
      } catch (error) {
        if (current()) {
          if (chat.error) {
            recovery.phase = 'interrupted';
            recovery.error = chat.error;
          } else {
            // A failed history read is not evidence that the transport failed.
            this.historyMeta(id).error = error;
            if (recovery.phase === 'recovering') recovery.phase = 'live';
          }
        }
      } finally {
        if (current()) {
          const display = interrupted;
          if (
            display &&
            canResume() &&
            !chat.messages.some((message) => message.id === display.id)
          )
            chat.messages = mergeUIMessages(chat.messages, [display]);
          recovery.task = undefined;
          if (
            recovery.phase === 'recovering' &&
            (chat.status === 'submitted' || chat.status === 'streaming')
          )
            recovery.phase = 'live';
          this.publish();
        }
      }
    })();
    recovery.task = task;
    return task;
  }
  async approve(id: string, input: AppUIToolApprovalInput): Promise<void> {
    const active = this.lifetime();
    if (!active()) throw new CancelledError({ silent: true });
    const chat = this.chat(id);
    if (
      this.approvalRequests.has(id) ||
      this.resendRequests.has(id) ||
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
    const submittedOwner = this.chat(id);
    const submittedInput =
      submittedOwner.status === 'submitted' && !this.admissions.has(id)
        ? [...submittedOwner.messages]
            .reverse()
            .find(
              (message) =>
                message.role === 'user' && message.metadata?.seq !== undefined,
            )
        : undefined;
    const detail = await this.api.conversation(id);
    if (!active() || !ordered()) return;
    await this.reconcile(id, detail);
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
    const lastUser = [...owner.messages]
      .reverse()
      .find((message) => message.role === 'user');
    const executionId =
      submittedInput?.metadata?.executionId ?? this.recoveries.get(id)?.key;
    const submittedTerminal =
      owner === submittedOwner &&
      owner.status === 'submitted' &&
      submittedInput &&
      lastUser?.id === submittedInput.id &&
      detail.execution?.status === 'idle' &&
      [...saved, ...owner.messages].some(
        (message) =>
          message.role !== 'user' &&
          message.metadata?.seq !== undefined &&
          message.metadata.seq > submittedInput.metadata!.seq! &&
          ((executionId && message.metadata.executionId === executionId) ||
            message.id === detail.execution?.messageId),
      );
    if (
      submittedTerminal ||
      (owner.status === 'streaming' &&
        receiving?.role === 'assistant' &&
        (detail.execution?.status === 'idle' ||
          detail.execution?.waitingApproval) &&
        saved.some(
          (message) =>
            message.id === receiving.id &&
            message.metadata?.seq !== undefined &&
            message.metadata?.executionId === receiving.metadata?.executionId &&
            message.metadata.revision >= (detail.execution?.revision ?? 0),
        ))
    ) {
      // Durable completion can release a lost subscriber; this never calls business Stop.
      await owner.stop();
      if (!active() || !ordered()) return;
      owner.messages = mergeUIMessages(owner.messages, saved);
    }
    if (!active() || !ordered()) return;
    this.remember(detail, false);
    const chat = this.chat(id);
    if (detail.execution?.status === 'idle') {
      this.recoveries.delete(id);
      if (chat.error) this.renewChat(id, chat.messages);
    }
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
  observeDetail(detail: ConversationDetail, refresh = true): void {
    if (detail.execution?.status === 'running') this.receive(detail.id, detail);
    if (!chatIsRunning(detail)) {
      if (
        refresh &&
        (this.chats.get(detail.id)?.status === 'streaming' ||
          this.chats.get(detail.id)?.status === 'submitted')
      )
        this.scheduleRefresh(detail.id);
      this.stopRequests.delete(detail.id);
      this.recoveries.delete(detail.id);
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
  private remember(detail: ConversationDetail, refresh = true): void {
    this.nextDetailVersion(detail.id);
    this.observeDetail(detail, refresh);
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
    this.invalidateHistoryReads(id);
    const recovery = this.recoveries.get(id);
    if (recovery?.phase === 'history')
      this.recoveries.set(id, { key: recovery.key, phase: 'history' });
    else this.recoveries.delete(id);
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
    for (const request of this.resendRequests.values())
      request.gate.reject(new CancelledError({ silent: true }));
    this.resendRequests.clear();
    this.historyEpochs.clear();
    this.replacements.clear();
    this.reconciles.clear();
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
    this.recoveries.clear();
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
