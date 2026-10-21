import type { DemoConfigurationService } from './service.js';

/** The application owns the result contract, including streaming if needed. */
export interface DemoAgentAdapter<Input, Output> {
  id: string;
  title: string;
  defaultEnabled?: boolean;
  execute(input: Input): Promise<Output>;
}

/** An environment-wide replacement at the Agent boundary. Disabled demo calls never fall back to a real Agent. */
export class DemoAgentProxy<Input, Output> {
  constructor(
    private readonly configuration: DemoConfigurationService,
    private readonly adapter: DemoAgentAdapter<Input, Output>,
  ) {
    configuration.registerMock({
      id: adapter.id,
      title: adapter.title,
      kind: 'runner',
      scope: 'environment',
      defaultEnabled: adapter.defaultEnabled,
      invoke: (input) => adapter.execute(input as Input),
    });
  }
  get id(): string {
    return this.adapter.id;
  }
  get title(): string {
    return this.adapter.title;
  }
  /** Call before enqueueing, and persist the selected proxy id with durable work. */
  async prepare(): Promise<boolean> {
    if (!this.configuration.enabled) return false;
    await this.configuration.requireMock(this.id);
    return true;
  }
  /** Rechecks configuration when queued work actually executes. */
  execute(input: Input): Promise<Output> {
    return this.configuration.invokeMock<Output>(this.id, input);
  }
  async run(input: Input, realAgent: () => Promise<Output>): Promise<Output> {
    return (await this.prepare()) ? this.execute(input) : realAgent();
  }
}
