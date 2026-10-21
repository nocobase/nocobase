import type { DemoConfigurationService } from './service.js';
import { demoDataError } from '../data/service.js';

/** The application owns scope resolution and the result contract, including streaming if needed. */
export interface DemoAgentAdapter<Input, Output> {
  id: string;
  title: string;
  scope: string;
  defaultEnabled?: boolean;
  matches(input: Input): Promise<boolean>;
  execute(input: Input): Promise<Output>;
}

/** A typed replacement at the Agent boundary. Disabled demo calls never fall back to a real Agent. */
export class DemoAgentProxy<Input, Output> {
  constructor(
    private readonly configuration: DemoConfigurationService,
    private readonly adapter: DemoAgentAdapter<Input, Output>,
  ) {
    configuration.registerMock({
      id: adapter.id,
      title: adapter.title,
      kind: 'runner',
      scope: adapter.scope,
      defaultEnabled: adapter.defaultEnabled,
      invoke: async (input) => {
        if (!(await adapter.matches(input as Input)))
          throw demoDataError(
            'DEMO_SCOPE_DENIED',
            'This Agent call is outside the demo scope.',
          );
        return adapter.execute(input as Input);
      },
    });
  }
  get id(): string {
    return this.adapter.id;
  }
  get title(): string {
    return this.adapter.title;
  }
  matches(input: Input): Promise<boolean> {
    return this.adapter.matches(input);
  }
  /** Call before enqueueing, and persist the selected proxy id with durable work. */
  async prepare(input: Input): Promise<boolean> {
    if (!(await this.matches(input))) return false;
    await this.configuration.requireMock(this.id);
    return true;
  }
  /** Rechecks scope and configuration when queued work actually executes. */
  execute(input: Input): Promise<Output> {
    return this.configuration.invokeMock<Output>(this.id, input);
  }
  async run(input: Input, realAgent: () => Promise<Output>): Promise<Output> {
    return (await this.prepare(input)) ? this.execute(input) : realAgent();
  }
}
