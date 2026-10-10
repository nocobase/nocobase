import {
  MESSAGE_CONTENT_MAX,
  type ConversationDetail,
  type ConversationMessage,
  type CreateConversationRequest,
  type MessageAttachment,
  type PageContext,
} from '@nocobase/app-plugin-agents/shared/conversations';
import type { ChatApi } from '@nocobase/app-plugin-agents/client/chat';

export interface SubmissionInput {
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
  operation: number;
  message?: ConversationMessage;
  error?: unknown;
}

/** Requests live above views. clientId correlates messages; it is NOT server idempotency. */
export class ChatSubmissions {
  private records: ChatSubmission[] = [];
  private generation = 0;
  private readonly listeners = new Set<() => void>();
  public constructor(
    private readonly api: Pick<
      ChatApi,
      'createConversation' | 'sendMessage' | 'messages'
    >,
    private readonly updated: (
      detail: ConversationDetail,
      record: ChatSubmission,
      created: boolean,
    ) => void,
    private readonly timeoutMs = 30_000,
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
    const record: ChatSubmission = {
      ...structuredClone(input),
      clientId: crypto.randomUUID(),
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
      (['INVALID_REQUEST', 'FORBIDDEN'].includes(value.reason) ||
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
        this.updated(created, record, true);
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
          content: record.content,
          clientId: record.clientId,
          ...(record.context ? { context: record.context } : {}),
          ...(record.attachments.length
            ? { attachmentIds: record.attachments.map((file) => file.id) }
            : {}),
        }),
      );
      if (!this.valid(record, generation, operation)) return;
      record.message = result.message;
      record.status = 'confirmed';
      this.updated(result.conversation, record, false);
      this.publish();
    } catch (error) {
      if (!this.valid(record, generation, operation) || record.message) return;
      record.error = error;
      record.status = this.refused(error, false) ? 'notSubmitted' : 'unknown';
      this.publish();
      if (record.status === 'unknown') void this.reconcile(record.clientId);
    }
  }
  public observe(id: string, messages: readonly ConversationMessage[]): void {
    let changed = false;
    for (const record of this.records) {
      if (record.conversationId !== id || record.status === 'confirmed')
        continue;
      const found = messages.find(
        (message) => message.metadata?.clientId === record.clientId,
      );
      if (found) {
        record.message = found;
        record.status = 'confirmed';
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
  }
}
