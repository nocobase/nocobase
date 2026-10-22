import type { DemoAgentAdapter, DemoAgentProxy } from './agent-proxy.js';
import type { DemoSqlRule } from '../guard.js';
import type {
  DemoConfigurationView,
  DemoDailySchedule,
  DemoMockAdapter,
  DemoWriteCapability,
  DemoWriteRule,
} from '../../shared/configuration.js';

/** Public demo policy contract. Implementations and storage remain plugin-owned. */
export interface DemoConfigurationService {
  readonly enabled: boolean;
  requireEnabled(): void;
  registerWrite(capability: DemoWriteCapability): void;
  registerMock(adapter: DemoMockAdapter): void;
  registerAgent<Input, Output>(
    adapter: DemoAgentAdapter<Input, Output>,
  ): DemoAgentProxy<Input, Output>;
  read(includeBusy?: boolean): Promise<DemoConfigurationView>;
  availableCollections(): Promise<{ name: string; title?: string }[]>;
  save(
    section: 'rules' | 'collections' | 'mocks' | 'schedule' | 'chat',
    expectedRevision: number,
    input: unknown,
  ): Promise<DemoConfigurationView>;
  chatModel(simulated: {
    modelService: string;
    model: string;
  }): Promise<{ modelService: string; model: string } | undefined>;
  runChatTool<T>(
    id: string,
    operation: {
      readOnly?: boolean;
      run: () => Promise<T>;
      mock?: () => Promise<T>;
    },
  ): Promise<T>;
  /** Host authorization and conversation ownership checks must run before this callback. */
  runOnlineConversation<T>(run: () => Promise<T>): Promise<T>;
  runWrite<T>(
    id: string,
    operation: DemoWriteRule['operation'],
    input: unknown,
    run: () => Promise<T>,
  ): Promise<T>;
  runWrites<T>(
    entries: readonly (readonly [string, DemoWriteRule['operation']])[],
    input: unknown,
    run: () => Promise<T>,
  ): Promise<T>;
  requireMock(id: string): Promise<void>;
  invokeMock<T = unknown>(id: string, input: unknown): Promise<T>;
  /** Workers start a fresh execution policy rather than inheriting an HTTP snapshot. */
  withFreshPolicy<T>(run: () => Promise<T>): Promise<T>;
}

/** Lifecycle and request-guard hooks used only by this plugin's providers. */
export interface DemoConfigurationRuntime extends DemoConfigurationService {
  initialize(): Promise<void>;
  runWithPolicy<T>(run: () => Promise<T>): Promise<T>;
  wholeCollectionRules(): Promise<readonly DemoSqlRule[]>;
  claimDaily(now: Date): Promise<DemoDailySchedule | null>;
}
