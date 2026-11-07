import type { DailyClaim, DailySettledData } from './daily-reset.js';
import type { DemoAgentAdapter, DemoAgentProxy } from './agent-proxy.js';
import type { DemoSqlRule } from '../guard.js';
import type {
  DemoConfigurationView,
  DemoMockAdapter,
} from '../../shared/configuration.js';

/** Public demo policy contract. Implementations and storage remain plugin-owned. */
export interface DemoConfigurationService {
  readonly enabled: boolean;
  requireEnabled(): void;
  registerMock(adapter: DemoMockAdapter): void;
  registerAgent<Input, Output>(
    adapter: DemoAgentAdapter<Input, Output>,
  ): DemoAgentProxy<Input, Output>;
  read(includeBusy?: boolean): Promise<DemoConfigurationView>;
  availableCollections(): Promise<{ name: string; title?: string }[]>;
  save(
    section: 'collections' | 'mocks' | 'chat',
    expectedRevision: number,
    input: unknown,
  ): Promise<DemoConfigurationView>;
  /** Enabled by default; returns the supplied simulated model in demo mode without redirecting other callers. */
  chatModel(simulated: {
    modelService: string;
    model: string;
  }): Promise<{ modelService: string; model: string } | undefined>;
  /** Uses an explicit policy, else the supplied mock or a host-declared local read. Other operations are refused. */
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
  /** Cheap admission check, so idle minutes of the per-minute schedule read no demo data status. */
  dailyDue(now: Date): Promise<boolean>;
  /** `settled` lets an unacknowledged claim be closed, or retried when its reset did not complete, by data outcome. */
  claimDaily(
    now: Date,
    options?: { readonly settled?: DailySettledData },
  ): Promise<DailyClaim | null>;
  renewDaily(claim: DailyClaim): Promise<void>;
  finishDaily(
    claim: DailyClaim,
    error?: unknown,
    retryable?: boolean,
  ): Promise<void>;
}
