import type { BackgroundOnlineAgent, RealtimeOnlineAgent } from './agent.js';
import type {
  OnlineAgentConfig,
  OnlineAgentContext,
  OnlineAgentOptions,
} from './config.js';
import type { OnlineAgentRealtimeOptions } from './realtime.js';
import type { ModelRef } from '../../shared/models.js';
import type { AppUIMessage } from '../../shared/online-agent.js';
import { invalid } from '../kernel/errors.js';

export type OnlineAgentBackendKind = 'native' | 'runner';
export type OnlineAgentBoundary = 'http' | undefined;
export type OnlineAgentConfiguration = OnlineAgentConfig & {
  selectedModel: ModelRef | null;
};
export type OnlineAgentInitialConfiguration = {
  config: OnlineAgentConfig;
  hasModel: boolean;
  defaultModel?: ModelRef;
};
export type OnlineAgentNotification = {
  id: string;
  parts: AppUIMessage['parts'];
};

/** Full execution contract. Unsupported capabilities reject; they are never optional or redirected. */
export interface OnlineAgentBackend {
  readonly kind: OnlineAgentBackendKind;
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

/** Keep the existing protocol error domain, with one machine-readable capability discriminator. */
export function unsupportedCapability(
  backend: OnlineAgentBackendKind,
  capability: string,
): ReturnType<typeof invalid> {
  return invalid(`The ${backend} backend does not support ${capability}.`, {
    reason: 'UNSUPPORTED_CAPABILITY',
    backend,
    capability,
  });
}
