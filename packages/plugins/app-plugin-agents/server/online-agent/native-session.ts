import type { JSONSchema7, ModelMessage, Schema } from 'ai';
import type {
  BackgroundOnlineAgent,
  OnlineAgent,
  RealtimeOnlineAgent,
} from './agent.js';
import type { OnlineAgentContext, OnlineAgentOptions } from './config.js';
import type { ModelRef } from '../../shared/models.js';
import type { OnlineAgentJson } from './codec.js';
import type { NativeOnlineAgent } from './native.js';
import type { OnlineAgentUIStreams } from './ui-streams.js';
import type {
  NativeApproval,
  NativeHistoryPage,
  NativeHistoryQuery,
} from './native-store.js';
import type {
  OnlineAgentRealtimeOptions,
  OnlineAgentSendOptions,
} from './realtime.js';
import type {
  OnlineAgentSession,
  OnlineAgentSessionManager,
} from './sessions.js';
import {
  OnlineAgentResultError,
  type OnlineAgentExecution,
  type OnlineAgentResult,
} from './service.js';
import { nativeExecutionStatus } from './execution.js';
import { createOutputSchema } from './output.js';
import { conflict, invalid } from '../kernel/errors.js';

/** Internal execution capabilities, shared by all facades of the application's one service. */
export type NativeSessionHost = {
  sessions: OnlineAgentSessionManager;
  native: NativeOnlineAgent;
  uiStreams: OnlineAgentUIStreams;
  active: Map<string, OnlineAgentExecution>;
  gate<T>(id: string, work: () => Promise<T>): Promise<T>;
  finish(execution: OnlineAgentExecution): Promise<void> | undefined;
  start(
    context: OnlineAgentContext,
    id: string,
    messages: ModelMessage[],
    input?: OnlineAgentSendOptions,
    schema?: Schema<OnlineAgentJson>,
    onExecution?: (execution: OnlineAgentExecution) => void,
  ): Promise<number>;
  approve(
    context: OnlineAgentContext,
    id: string,
    input: NativeApproval,
    onExecution?: (execution: OnlineAgentExecution) => void,
  ): Promise<number>;
  observe(
    userId: string,
    id: string,
    wait?: number,
  ): Promise<OnlineAgentResult>;
};

abstract class NativeAgentSession implements OnlineAgent {
  readonly sessionId: string;
  protected requestedOverrides: OnlineAgentOptions | undefined;
  protected requestedModel: ModelRef | undefined;

  constructor(
    protected host: NativeSessionHost,
    protected context: OnlineAgentContext,
    session: OnlineAgentSession,
    options: OnlineAgentRealtimeOptions,
  ) {
    this.sessionId = session.id;
    const {
      sessionId,
      selectedModel,
      source: _source,
      title: _title,
      showInChatList: _showInChatList,
      ...requested
    } = options;
    this.requestedModel = sessionId ? selectedModel : undefined;
    this.requestedOverrides =
      sessionId && Object.keys(requested).length ? requested : undefined;
    if (
      sessionId &&
      (this.requestedOverrides || this.requestedModel) &&
      (host.active.has(session.id) ||
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
    return nativeExecutionStatus(
      row.call,
      this.host.active.has(this.sessionId),
    );
  }

  history(): ReturnType<OnlineAgent['history']> {
    return this.host.sessions.native.history(
      this.context.user.id,
      this.sessionId,
    );
  }

  abstract abort(): Promise<void>;

  async retryFinalization(): Promise<void> {
    const current = await this.host.sessions.load(
      this.context.user.id,
      this.sessionId,
    );
    const execution = this.host.active.get(this.sessionId);
    if (execution) {
      await execution.task;
      await this.host.finish(execution);
    } else if (current.call?.state === 'running' || current.call?.closing) {
      throw conflict(
        'Finalization requires the live producer that owns its snapshot; reconcile history and execution.',
      );
    }
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
      },
      undefined,
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

  async abort(): Promise<void> {
    // This facade was authorized when opened. Signal the local producer before asynchronous reads.
    const execution = this.host.active.get(this.sessionId);
    if (execution) {
      execution.abort.abort();
      await execution.task;
      await this.host.finish(execution);
      return;
    }
    const current = await this.host.sessions.load(
      this.context.user.id,
      this.sessionId,
    );
    if (current.call?.state === 'waitingApproval') {
      await this.host.sessions.native.stop(
        this.context.user.id,
        this.sessionId,
      );
      return;
    }
    if (
      current.call?.state === 'running' &&
      !this.host.active.has(this.sessionId)
    ) {
      if (
        current.call.executionId &&
        (await this.host.uiStreams.requestStop(
          this.context.user.id,
          this.sessionId,
          current.call.executionId,
        ))
      )
        return;
      throw conflict(
        'The producer is unavailable; stopping has not been confirmed.',
      );
    }
    await this.host.sessions.load(this.context.user.id, this.sessionId);
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

  async abort(): Promise<void> {
    await this.host.sessions.load(this.context.user.id, this.sessionId);
    const execution = await this.host.gate(this.sessionId, async () => {
      const current = this.host.active.get(this.sessionId);
      current?.abort.abort();
      return current;
    });
    if (execution) {
      await execution.task;
      await this.host.finish(execution);
    }
  }
}
