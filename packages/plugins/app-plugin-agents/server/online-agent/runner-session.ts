import type { ModelMessage } from 'ai';
import type { RealtimeOnlineAgent } from './agent.js';
import type {
  OnlineAgentContext,
  OnlineAgentOptions,
  OnlineAgentConfigurator,
} from './config.js';
import type { NativeHistoryPage, NativeHistoryQuery } from './native-store.js';
import type {
  OnlineAgentRunnerBackend,
  OnlineAgentSendOptions,
} from './realtime.js';
import { conflict } from '../kernel/errors.js';

/** Holds one facade's pending overrides and the stream belonging to its accepted submission. */
export class ConfiguredRunnerOnlineAgent implements RealtimeOnlineAgent {
  readonly backend = 'runner' as const;
  private submitted: RealtimeOnlineAgent;

  constructor(
    private runner: RealtimeOnlineAgent,
    private context: OnlineAgentContext,
    private adapter: OnlineAgentRunnerBackend,
    private configurator: OnlineAgentConfigurator,
    private agentId: string | undefined,
    private pendingOptions: OnlineAgentOptions | undefined,
  ) {
    this.submitted = runner;
  }

  get sessionId(): string {
    return this.runner.sessionId;
  }
  status(): ReturnType<RealtimeOnlineAgent['status']> {
    return this.runner.status();
  }
  history(): ReturnType<RealtimeOnlineAgent['history']> {
    return this.runner.history();
  }
  abort(): Promise<void> {
    return this.runner.abort();
  }
  retryFinalization(): Promise<void> {
    return this.runner.retryFinalization();
  }
  messages(query: NativeHistoryQuery): Promise<NativeHistoryPage> {
    return this.runner.messages(query);
  }
  receive(): ReturnType<RealtimeOnlineAgent['receive']> {
    return this.submitted.receive();
  }

  async send(
    messages: ModelMessage[],
    input?: OnlineAgentSendOptions,
  ): Promise<number> {
    if (
      (input?.overrides || this.pendingOptions) &&
      (await this.runner.status()) === 'running'
    ) {
      throw conflict('This conversation is busy.');
    }
    const current = (await this.adapter.configuration(
      this.context,
      this.sessionId,
    ))!;
    const requested = input?.overrides ?? this.pendingOptions;
    const resolved = requested
      ? await this.configurator.resolve(this.context, requested, current)
      : current;
    if (resolved.agentId !== this.agentId)
      throw conflict('Start a new conversation to choose another agent.');
    const opened = await this.adapter.open(
      this.context,
      resolved,
      { sessionId: this.sessionId, selectedModel: input?.selectedModel },
      current,
    );
    this.submitted = opened;
    const accepted = await opened.send(messages, {
      ...input,
      overrides: undefined,
    });
    this.pendingOptions = undefined;
    return accepted;
  }
}
