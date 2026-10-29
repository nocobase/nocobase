import type { OnlineAgentResendOptions } from '../../../../shared/resend.js';
import type { JSONSchema7, ModelMessage } from 'ai';
import type {
  BackgroundOnlineAgent,
  OnlineAgent,
  RealtimeOnlineAgent,
  NativeSessionHost,
} from '../contracts.js';
import type {
  OnlineAgentContext,
  OnlineAgentOptions,
  OnlineAgentJson,
  NativeApproval,
  NativeHistoryPage,
  NativeHistoryQuery,
  OnlineAgentRealtimeOptions,
  OnlineAgentSendOptions,
  OnlineAgentBoundary,
  OnlineAgentResult,
} from '../types.js';
import type { ModelRef } from '../../../../shared/models.js';
import type { OnlineAgentSession } from '../persistence/types.js';
import type { OnlineAgentExecution } from './types.js';
import { OnlineAgentResultError, unsupportedCapability } from '../errors.js';
import { nativeExecutionStatus } from '../persistence/state.js';
import { createOutputSchema } from '../messages/validation.js';
import { conflict, invalid } from '../../../kernel/errors.js';

abstract class NativeAgentSession implements OnlineAgent {
  readonly sessionId: string;
  protected requestedOverrides: OnlineAgentOptions | undefined;
  protected requestedModel: ModelRef | undefined;
  private readonly kind: OnlineAgentSession['kind'];

  constructor(
    protected host: NativeSessionHost,
    protected context: OnlineAgentContext,
    session: OnlineAgentSession,
    options: OnlineAgentRealtimeOptions,
    protected boundary?: OnlineAgentBoundary,
  ) {
    this.sessionId = session.id;
    this.kind = session.kind;
    const {
      sessionId,
      selectedModel,
      source: _source,
      title: _title,
      showInChatList: _showInChatList,
      projectId: _projectId,
      ...requested
    } = options;
    this.requestedModel = sessionId ? selectedModel : undefined;
    this.requestedOverrides =
      sessionId && Object.keys(requested).length ? requested : undefined;
    if (
      sessionId &&
      (this.requestedOverrides || this.requestedModel) &&
      (host.isActive(session.id) ||
        session.call?.state === 'running' ||
        session.call?.state === 'waitingApproval' ||
        session.call?.closing)
    ) {
      throw conflict('This conversation is busy.');
    }
  }

  async status(): Promise<'running' | 'idle'> {
    const row = await this.host.sessions.load(
      this.context.user.id,
      this.sessionId,
    );
    return nativeExecutionStatus(row.call, this.host.isActive(this.sessionId));
  }

  history(): ReturnType<OnlineAgent['history']> {
    return this.host.sessions.native.history(
      this.context.user.id,
      this.sessionId,
    );
  }

  abort(): Promise<void> {
    return this.host.abort(this.context, this.sessionId, this.kind);
  }

  retryFinalization(): Promise<void> {
    return this.host.retryFinalization(this.context, this.sessionId);
  }

  protected consumed(): void {
    this.requestedOverrides = undefined;
    this.requestedModel = undefined;
  }
}

export class NativeRealtimeOnlineAgent
  extends NativeAgentSession
  implements RealtimeOnlineAgent
{
  readonly backend = 'native' as const;
  private responseExecution: OnlineAgentExecution | undefined;

  async send(
    messages: ModelMessage[],
    input?: OnlineAgentSendOptions,
  ): Promise<number> {
    const seq = await this.host.start(
      this.context,
      this.sessionId,
      messages,
      {
        ...input,
        overrides: input?.overrides ?? this.requestedOverrides,
        selectedModel: input?.selectedModel ?? this.requestedModel,
        boundary: this.boundary,
      },
      undefined,
      (execution) => {
        this.responseExecution = execution;
      },
    );
    this.consumed();
    return seq;
  }

  queue(): Promise<number> {
    return Promise.reject(unsupportedCapability('native', 'queued messages'));
  }

  async resend(options: OnlineAgentResendOptions = {}): Promise<number> {
    const seq = await this.host.resend(
      this.context,
      this.sessionId,
      options,
      {
        overrides: this.requestedOverrides,
        selectedModel: this.requestedModel,
        boundary: this.boundary,
      },
      (execution) => {
        this.responseExecution = execution;
      },
    );
    this.consumed();
    return seq;
  }
  async receive(): ReturnType<RealtimeOnlineAgent['receive']> {
    await this.host.sessions.load(this.context.user.id, this.sessionId);
    return this.host.native.receive(
      this.context.user.id,
      this.sessionId,
      this.responseExecution,
    );
  }

  approve(input: NativeApproval): Promise<number> {
    return this.host.approve(
      this.context,
      this.sessionId,
      input,
      (execution) => {
        this.responseExecution = execution;
      },
    );
  }

  messages(query: NativeHistoryQuery): Promise<NativeHistoryPage> {
    return this.host.sessions.native.page(
      this.context.user.id,
      this.sessionId,
      query,
    );
  }
}

export class NativeBackgroundOnlineAgent
  extends NativeAgentSession
  implements BackgroundOnlineAgent
{
  async run(
    messages: ModelMessage[],
    schema: JSONSchema7,
    input?: { overrides?: OnlineAgentOptions; selectedModel?: ModelRef },
  ): Promise<void> {
    const output = createOutputSchema(schema);
    await this.host.start(
      this.context,
      this.sessionId,
      messages,
      {
        ...input,
        overrides: input?.overrides ?? this.requestedOverrides,
        selectedModel: input?.selectedModel ?? this.requestedModel,
        boundary: this.boundary,
      },
      output,
    );
    this.consumed();
  }

  async get(): Promise<OnlineAgentJson> {
    const result = await this.host.observe(
      this.context.user.id,
      this.sessionId,
    );
    if (result.ok) return result.data;
    if (result.reason === 'pending')
      throw conflict('The execution has not finished.');
    throw new OnlineAgentResultError(result.reason, result.error);
  }

  try(options?: { wait?: number }): Promise<OnlineAgentResult> {
    const wait = options?.wait === undefined ? 0 : options.wait;
    if (!Number.isFinite(wait) || wait < 0)
      return Promise.reject(
        invalid('wait must be a finite non-negative number.'),
      );
    return this.host.observe(this.context.user.id, this.sessionId, wait);
  }
}
