import type {
  OnlineAgentConfig,
  OnlineAgentJson,
  OnlineAgentOutcome,
} from '../types.js';
import type { ModelRef } from '../../../../shared/models.js';

export type OnlineAgentCall = {
  actorId: string;
  state: 'running' | 'idle' | 'waitingApproval';
  executionId?: string;
  messageId?: string;
  revision?: number;
  approvalExpiresAt?: string;
  outcome?: OnlineAgentOutcome;
  closing?: boolean;
  result?: OnlineAgentJson;
  error?: string;
  /** Legacy hint only; never an admission condition. Removed after finalization. */
  requiresEffectReview?: boolean;
};
export type OnlineAgentSession = {
  id: string;
  kind: 'realtime' | 'background';
  config: OnlineAgentConfig;
  model: ModelRef;
  call: OnlineAgentCall | null;
  lastSeq: number;
};
export type OnlineAgentSessionIdentity =
  | { backend: 'native'; kind: OnlineAgentSession['kind'] }
  | { backend: 'runner'; kind: 'realtime' };

export type OnlineAgentMetadata = {
  version: 1;
  kind: OnlineAgentSession['kind'];
  config: OnlineAgentConfig;
  call: OnlineAgentCall | null;
};
/** Runner rows keep their real agent identity and never acquire native metadata. */
export type RunnerOnlineAgentBinding = {
  version: 1;
  config: OnlineAgentConfig;
  closingRunId?: string;
  /** The reasoning effort chosen for the conversation's runs, one of its agent's tool's; absent: the agent's own. */
  effort?: string;
};
