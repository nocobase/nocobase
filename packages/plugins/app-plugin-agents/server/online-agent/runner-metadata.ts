import type { OnlineAgentConfig } from './config.js';
import { jsonObject } from '../kernel/values.js';

/** Runner rows keep their real agent identity and never acquire native metadata. */
export type RunnerOnlineAgentBinding = {
  version: 1;
  config: OnlineAgentConfig;
  closingRunId?: string;
};

export function runnerBinding(
  metadata: unknown,
): RunnerOnlineAgentBinding | null {
  const value = jsonObject(jsonObject(metadata).runnerOnlineAgent);
  return value.version === 1 && typeof value.config === 'object'
    ? (value as RunnerOnlineAgentBinding)
    : null;
}
