/** Online chat policy; credentials stay in the host model service. */
export interface DemoChatConfiguration {
  enabled: boolean;
  model: { modelService: string; model: string } | null;
  tools: Record<string, 'read' | 'mock' | 'deny'>;
}
export interface DemoMockAdapter {
  readonly id: string;
  readonly title: string;
  readonly kind: 'model' | 'tool' | 'runner';
  readonly scope: string;
  /** Existing integrations may opt in initially; disabling never enables real calls. */
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
