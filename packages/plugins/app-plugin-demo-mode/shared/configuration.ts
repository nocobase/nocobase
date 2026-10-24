/** Visitor chat through the application's simulated model. */
export interface DemoChatConfiguration {
  /** Enabled by default; only applications that call the integration methods use demo chat. */
  enabled: boolean;
  /** Explicit overrides; otherwise use the supplied mock or an explicitly marked local read. */
  tools: Record<string, 'read' | 'mock' | 'deny'>;
}
export interface DemoMockAdapter {
  readonly id: string;
  readonly title: string;
  readonly kind: 'model' | 'tool' | 'runner';
  readonly scope: string;
  /** Defaults to true for registered adapters; disabling never enables real calls. */
  readonly defaultEnabled?: boolean;
  invoke(input: unknown): Promise<unknown>;
}
export interface DemoDailySchedule {
  enabled: boolean;
  hour: number;
  minute: number;
  timezone: string;
  language: string;
}
export interface DemoConfiguration {
  revision: number;
  collections: string[];
  mocks: Record<string, boolean>;
  schedule: DemoDailySchedule | null;
  chat: DemoChatConfiguration;
}
export interface DemoConfigurationView extends DemoConfiguration {
  busy: boolean;
  enabled: boolean;
  fixedCollections: readonly string[];
  adapters: readonly Omit<DemoMockAdapter, 'invoke'>[];
  nextRun: string | null;
}
