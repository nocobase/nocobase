/** Online chat policy; credentials stay in the host model service. */
export interface DemoChatConfiguration {
  enabled: boolean;
  model: { modelService: string; model: string } | null;
  tools: Record<string, 'read' | 'mock' | 'deny'>;
}
/** Application-owned, explicitly registered write capabilities. This is not business authorization. */
export interface DemoWriteCapability {
  readonly id: string;
  readonly title: string;
  readonly table: string;
  readonly operations: readonly ('insert' | 'update' | 'delete')[];
  readonly scopes: readonly { readonly id: string; readonly title: string }[];
  /** Called only by runWrite, after the application's normal authorization. Validate persisted record ownership. */
  checkScope?(scope: string, input: unknown): Promise<boolean>;
}
export interface DemoWriteRule {
  capability: string;
  operation: 'insert' | 'update' | 'delete';
  scope: string;
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
/** Environment-wide exceptions; normal application authorization still applies. */
export interface DemoTableRule {
  table: string;
  operations: ('insert' | 'update' | 'delete')[];
}
export interface DemoConfiguration {
  revision: number;
  rules: DemoWriteRule[];
  tableRules: DemoTableRule[];
  mocks: Record<string, boolean>;
  schedule: DemoDailySchedule | null;
  chat: DemoChatConfiguration;
}
export interface DemoConfigurationView extends DemoConfiguration {
  busy: boolean;
  mode: 'off' | 'read-only' | 'observe';
  fixedTables: readonly string[];
  capabilities: readonly Omit<DemoWriteCapability, 'checkScope'>[];
  adapters: readonly Omit<DemoMockAdapter, 'invoke'>[];
  nextRun: string | null;
}
