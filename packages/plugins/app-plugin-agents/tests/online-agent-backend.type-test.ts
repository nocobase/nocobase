import { expectTypeOf } from 'vitest';
import type {
  BackgroundOnlineAgent,
  RealtimeOnlineAgent,
} from '../server/online-agent/agent.js';
import type {
  OnlineAgentBackend,
  OnlineAgentBoundary,
  OnlineAgentConfiguration,
  OnlineAgentInitialConfiguration,
  OnlineAgentNotification,
} from '../server/online-agent/backend.js';
import type {
  OnlineAgentContext,
  OnlineAgentOptions,
} from '../server/online-agent/config.js';
import type { NativeOnlineAgentBackend } from '../server/online-agent/native-backend.js';
import type {
  NativeBackgroundOnlineAgent,
  NativeRealtimeOnlineAgent,
} from '../server/online-agent/native-session.js';
import type { NativeApproval } from '../server/online-agent/native-store.js';
import type { OnlineAgentRealtimeOptions } from '../server/online-agent/realtime.js';
import type {
  RunnerOnlineAgentAdapter,
  RunnerRealtimeOnlineAgent,
} from '../server/online-agent/runner.js';
import type { ModelRef } from '../shared/models.js';
import type { AppUIMessage } from '../shared/online-agent.js';

interface ExpectedBackend {
  readonly kind: 'native' | 'runner';
  createRealtime(
    context: OnlineAgentContext,
    initial: OnlineAgentInitialConfiguration,
    options: OnlineAgentRealtimeOptions,
    boundary?: OnlineAgentBoundary,
  ): Promise<RealtimeOnlineAgent>;
  restoreRealtime(
    context: OnlineAgentContext,
    options: OnlineAgentRealtimeOptions & { sessionId: string },
    boundary?: OnlineAgentBoundary,
  ): Promise<RealtimeOnlineAgent>;
  createBackground(
    context: OnlineAgentContext,
    initial: OnlineAgentInitialConfiguration,
    options: OnlineAgentRealtimeOptions,
    boundary?: OnlineAgentBoundary,
  ): Promise<BackgroundOnlineAgent>;
  restoreBackground(
    context: OnlineAgentContext,
    options: OnlineAgentRealtimeOptions & { sessionId: string },
    boundary?: OnlineAgentBoundary,
  ): Promise<BackgroundOnlineAgent>;
  configuration(
    context: OnlineAgentContext,
    id: string,
  ): Promise<OnlineAgentConfiguration | null>;
  configure(
    context: OnlineAgentContext,
    id: string,
    options: OnlineAgentOptions,
    selectedModel?: ModelRef,
    boundary?: OnlineAgentBoundary,
  ): Promise<OnlineAgentConfiguration>;
  deliverNotification(
    context: OnlineAgentContext,
    id: string,
    input: OnlineAgentNotification,
  ): Promise<AppUIMessage>;
  isActive(id: string): boolean;
  producerAvailable(id: string, persistedRunning?: boolean): Promise<boolean>;
  recoverAtStartup(): Promise<void>;
  shutdown(): Promise<void>;
}

// Compile-only checks: this file is included by tsconfig.type-tests.json, not Vitest.
function checkContract(): void {
  expectTypeOf<keyof OnlineAgentBackend>().toEqualTypeOf<
    keyof ExpectedBackend
  >();
  expectTypeOf<OnlineAgentBackend>().toEqualTypeOf<ExpectedBackend>();
  expectTypeOf<OnlineAgentBackend>().toEqualTypeOf<
    Required<OnlineAgentBackend>
  >();
  expectTypeOf<NativeOnlineAgentBackend>().toExtend<OnlineAgentBackend>();
  expectTypeOf<RunnerOnlineAgentAdapter>().toExtend<OnlineAgentBackend>();
  expectTypeOf<NativeOnlineAgentBackend['kind']>().toEqualTypeOf<'native'>();
  expectTypeOf<RunnerOnlineAgentAdapter['kind']>().toEqualTypeOf<'runner'>();

  expectTypeOf<
    Extract<keyof BackgroundOnlineAgent, 'send' | 'receive'>
  >().toEqualTypeOf<never>();
  expectTypeOf<
    Extract<keyof NativeBackgroundOnlineAgent, 'send' | 'receive'>
  >().toEqualTypeOf<never>();
  expectTypeOf<RealtimeOnlineAgent['approve']>().toEqualTypeOf<
    (input: NativeApproval) => Promise<number>
  >();
  expectTypeOf<Pick<RealtimeOnlineAgent, 'approve'>>().toEqualTypeOf<
    Required<Pick<RealtimeOnlineAgent, 'approve'>>
  >();

  expectTypeOf<NativeRealtimeOnlineAgent>().toExtend<RealtimeOnlineAgent>();
  expectTypeOf<RunnerRealtimeOnlineAgent>().toExtend<RealtimeOnlineAgent>();
  expectTypeOf<NativeBackgroundOnlineAgent>().toExtend<BackgroundOnlineAgent>();
  expectTypeOf<
    NativeRealtimeOnlineAgent['backend']
  >().toEqualTypeOf<'native'>();
  expectTypeOf<
    RunnerRealtimeOnlineAgent['backend']
  >().toEqualTypeOf<'runner'>();
  expectTypeOf<
    ReturnType<NativeOnlineAgentBackend['createRealtime']>
  >().toEqualTypeOf<Promise<NativeRealtimeOnlineAgent>>();
  expectTypeOf<
    ReturnType<NativeOnlineAgentBackend['restoreRealtime']>
  >().toEqualTypeOf<Promise<NativeRealtimeOnlineAgent>>();
  expectTypeOf<
    ReturnType<NativeOnlineAgentBackend['createBackground']>
  >().toEqualTypeOf<Promise<NativeBackgroundOnlineAgent>>();
  expectTypeOf<
    ReturnType<NativeOnlineAgentBackend['restoreBackground']>
  >().toEqualTypeOf<Promise<NativeBackgroundOnlineAgent>>();
  expectTypeOf<
    ReturnType<RunnerOnlineAgentAdapter['createRealtime']>
  >().toEqualTypeOf<Promise<RunnerRealtimeOnlineAgent>>();
  expectTypeOf<
    ReturnType<RunnerOnlineAgentAdapter['restoreRealtime']>
  >().toEqualTypeOf<Promise<RunnerRealtimeOnlineAgent>>();
}

void checkContract;
