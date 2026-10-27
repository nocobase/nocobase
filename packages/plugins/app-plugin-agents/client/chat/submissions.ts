import {
  MESSAGE_CONTENT_MAX,
  type ConversationDetail,
  type CreateConversationRequest,
  type MessageAttachment,
  type PageContext,
} from '../../shared/conversations.js';
import { clonePageUIContext } from '../../shared/page-ui-context.js';
import type { ChatApi } from './api.js';
import type { AppUIMessage } from '../../shared/online-agent.js';
import { createClientId } from './client-id.js';
export interface SubmissionSend {
  readonly agentId?: string;
  readonly content: string;
  readonly clientId: string;
  readonly context?: PageContext;
  readonly attachmentIds?: readonly string[];
}
export interface ChatSubmissionApi extends Pick<
  ChatApi,
  'createConversation' | 'messages'
> {
  sendMessage(
    id: string,
    input: SubmissionSend,
  ): Promise<{ message: AppUIMessage; conversation: ConversationDetail }>;
}

export interface SubmissionInput {
  /** Final pending Runner selection, captured together with this message. */
  readonly agentId?: string;
  readonly content: string;
  readonly context: PageContext | undefined;
  readonly attachments: readonly MessageAttachment[];
  readonly conversationId: string | null;
  readonly editorKey: string;
  readonly create: CreateConversationRequest;
}
export interface ChatSubmission extends SubmissionInput {
  conversationId: string | null;
  readonly clientId: string;
  readonly createdAt: string;
  status:
    | 'creating'
    | 'sending'
    | 'creationUnknown'
    | 'unknown'
    | 'confirmed'
    | 'notSubmitted'
    | 'rejected';
  /** The user explicitly permits another input without asserting the old write failed. */
  released?: boolean;
  operation: number;
  message?: AppUIMessage;
  error?: unknown;
}

/** Requests live above views. clientId correlates messages; it is NOT server idempotency. */
export class ChatSubmissions {
  private records: ChatSubmission[] = [];
  private generation = 0;
  private observers = new Set<
    (
      detail: ConversationDetail,
      record: ChatSubmission,
      created: boolean,
    ) => void
  >();
  public onUpdated(
    callback: (
      detail: ConversationDetail,
      record: ChatSubmission,
      created: boolean,
    ) => void,
  ): () => void {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }
  private notify(
    detail: ConversationDetail,
    record: ChatSubmission,
    created: boolean,
  ) {
    this.updated(detail, record, created);
    for (const callback of this.observers) callback(detail, record, created);
  }
  private readonly listeners = new Set<() => void>();
  public constructor(
    private readonly api: ChatSubmissionApi,
    private readonly updated: (
      detail: ConversationDetail,
      record: ChatSubmission,
      created: boolean,
    ) => void,
    private readonly timeoutMs = 30_000,
    private readonly confirmed: (
      id: string,
      message: AppUIMessage,
    ) => void = () => {},
  ) {}
  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  public snapshot = (): readonly ChatSubmission[] => this.records;
  private publish(): void {
    this.records = [...this.records];
    for (const listener of this.listeners) listener();
  }
  public blocked(id: string | null, key: string): boolean {
    return this.records.some(
      (record) =>
        (id ? record.conversationId === id : record.editorKey === key) &&
        !record.released &&
        !['confirmed', 'rejected'].includes(record.status),
    );
  }
  public submit(input: SubmissionInput): boolean {
    if (
      (!input.content.trim() && !input.attachments.length) ||
      [...input.content].length > MESSAGE_CONTENT_MAX ||
      this.blocked(input.conversationId, input.editorKey)
    )
      return false;
    // Validate before structuredClone can normalize prototypes or preserve non-JSON values.
    const ui = input.context?.ui
      ? clonePageUIContext(input.context.ui)
      : undefined;
    const record: ChatSubmission = {
      ...structuredClone(input),
      ...(input.context
        ? {
            context: {
              ...structuredClone(input.context),
              ...(ui ? { ui } : {}),
            },
          }
        : {}),
      clientId: createClientId(),
      createdAt: new Date().toISOString(),
      operation: 0,
      status: input.conversationId ? 'sending' : 'creating',
    };
    this.records.push(record);
    this.publish();
    void this.run(record);
    return true;
  }
  private async deadline<T>(request: Promise<T>): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        request,
        new Promise<never>((_resolve, reject) => {
          timer = setTimeout(
            () => reject(new Error('Chat response timed out')),
            this.timeoutMs,
          );
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
  private valid(
    record: ChatSubmission,
    generation: number,
    operation: number,
  ): boolean {
    return generation === this.generation && record.operation === operation;
  }
  /** Audited before-write protocol errors only. NOT_FOUND may occur after send commits. */
  private refused(error: unknown, creating: boolean): boolean {
    if (!error || typeof error !== 'object') return false;
    const value = error as { domain?: string; reason?: string };
    return (
      value.domain === 'agents' &&
      typeof value.reason === 'string' &&
      (['INVALID_REQUEST', 'FORBIDDEN', 'CONFLICT'].includes(value.reason) ||
        (creating &&
          ['AGENT_NOT_FOUND', 'CONVERSATION_CONFLICT'].includes(value.reason)))
    );
  }
  private async run(record: ChatSubmission): Promise<void> {
    const generation = this.generation;
    const operation = record.operation;
    let id = record.conversationId;
    if (!id) {
      try {
        const created = await this.deadline(
          this.api.createConversation(record.create),
        );
        if (!this.valid(record, generation, operation)) return;
        id = created.id;
        record.conversationId = id;
        record.status = 'sending';
        this.notify(created, record, true);
        this.publish();
      } catch (error) {
        if (!this.valid(record, generation, operation)) return;
        record.error = error;
        record.status = this.refused(error, true)
          ? 'notSubmitted'
          : 'creationUnknown';
        this.publish();
        return;
      }
    }
    try {
      const result = await this.deadline(
        this.api.sendMessage(id, {
          ...(record.agentId ? { agentId: record.agentId } : {}),
          content: record.content,
          clientId: record.clientId,
          ...(record.context ? { context: record.context } : {}),
          ...(record.attachments.length
            ? { attachmentIds: record.attachments.map((file) => file.id) }
            : {}),
        }),
      );
      if (!this.valid(record, generation, operation)) return;
      this.confirm(record, result.message);
      this.notify(result.conversation, record, false);
      this.publish();
    } catch (error) {
      if (!this.valid(record, generation, operation) || record.message) return;
      record.error = error;
      record.status = this.refused(error, false) ? 'notSubmitted' : 'unknown';
      this.publish();
      if (record.status === 'unknown') void this.reconcile(record.clientId);
    }
  }
  private confirm(record: ChatSubmission, message: AppUIMessage): void {
    record.message = message;
    record.status = 'confirmed';
    this.confirmed(message.metadata!.conversationId, message);
  }
  public observe(id: string, messages: readonly AppUIMessage[]): void {
    let changed = false;
    for (const record of this.records) {
      if (record.conversationId !== id || record.status === 'confirmed')
        continue;
      const found = messages.find(
        (message) =>
          (message.metadata?.clientId ?? message.id) === record.clientId,
      );
      if (found) {
        this.confirm(record, found);
        changed = true;
      }
    }
    if (changed) this.publish();
  }
  public async reconcile(clientId: string): Promise<void> {
    const record = this.records.find((item) => item.clientId === clientId);
    if (!record?.conversationId || record.status !== 'unknown') return;
    const generation = this.generation;
    const operation = record.operation;
    let cursor: string | null = null;
    const seen = new Set<string>();
    try {
      do {
        const page: Awaited<ReturnType<ChatApi['messages']>> =
          await this.deadline(
            this.api.messages(record.conversationId, {
              ...(cursor ? { pageToken: cursor } : {}),
            }),
          );
        if (!this.valid(record, generation, operation)) return;
        this.observe(record.conversationId, page.items);
        if (record.message) return;
        cursor = page.nextCursor;
        if (cursor && seen.has(cursor)) return;
        if (cursor) seen.add(cursor);
      } while (cursor);
    } catch {
      /* A failed read or absent message cannot prove a write failed. */
    }
  }
  public resumeCreation(clientId: string, id: string | null): boolean {
    const record = this.records.find((item) => item.clientId === clientId);
    if (
      !record ||
      record.status !== 'creationUnknown' ||
      (id && this.blocked(id, record.editorKey))
    )
      return false;
    record.operation += 1;
    record.conversationId = id;
    record.status = id ? 'sending' : 'creating';
    this.publish();
    void this.run(record);
    return true;
  }
  public releaseUnknown(clientId: string): boolean {
    const record = this.records.find((item) => item.clientId === clientId);
    if (record?.status !== 'unknown' || record.released) return false;
    record.released = true;
    record.operation += 1;
    this.publish();
    return true;
  }
  public editRejected(clientId: string): ChatSubmission | null {
    const record = this.records.find((item) => item.clientId === clientId);
    if (record?.status !== 'notSubmitted') return null;
    record.status = 'rejected';
    this.publish();
    return record;
  }
  public invalidate(): void {
    this.generation += 1;
  }
  public dispose(): void {
    this.invalidate();
    this.records = [];
    this.listeners.clear();
    this.observers.clear();
  }
}
