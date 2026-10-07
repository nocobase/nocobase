import type { Logger } from '@nocobase/logging';
import { DefaultChatMessageConverters } from './message/converters.js';
import type { AgentProviders, CreateAgentProvidersOptions } from './types.js';
import { DEFAULT_AGENT_FEATURES } from './types.js';

class NoopLogger {
  public readonly level = 'silent';
  public fatal(): void {}
  public error(): void {}
  public warn(): void {}
  public info(): void {}
  public debug(): void {}
  public trace(): void {}
  public silent(): void {}
  public child(): NoopLogger {
    return this;
  }
  public bindings(): Record<string, never> {
    return {};
  }
  public flush(): void {}
  public isLevelEnabled(): boolean {
    return false;
  }
}

const noopLogger = new NoopLogger() as unknown as Logger;

class DefaultAgentProviders implements AgentProviders {
  public readonly conversation: AgentProviders['conversation'];
  public readonly context: AgentProviders['context'];
  public readonly converters: AgentProviders['converters'];
  public readonly logger: Logger;
  public readonly features: AgentProviders['features'];
  public readonly checkpointer: AgentProviders['checkpointer'];
  public readonly restoresReleasedThreads: boolean;
  public readonly container: AgentProviders['container'];

  public constructor(options: CreateAgentProvidersOptions) {
    this.conversation = options.conversation;
    this.context = options.context;
    this.logger = options.logger ?? noopLogger;
    this.converters = options.converters ?? new DefaultChatMessageConverters();
    this.features = { ...DEFAULT_AGENT_FEATURES, ...(options.features ?? {}) };
    this.checkpointer = options.checkpointer;
    this.restoresReleasedThreads = options.restoresReleasedThreads ?? false;
    this.container = options.container;
  }
}

export function createAgentProviders(
  options: CreateAgentProvidersOptions,
): AgentProviders {
  return new DefaultAgentProviders(options);
}
