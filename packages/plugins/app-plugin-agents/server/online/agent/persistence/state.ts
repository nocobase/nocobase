import { jsonObject } from '../../../kernel/values.js';
import { invalid } from '../../../kernel/errors.js';
import type { ConversationRecord } from '../../../core/conversations/conversation.store.js';
import type {
  OnlineAgentSessionIdentity,
  RunnerOnlineAgentBinding,
} from './types.js';

/** Classify persisted bindings without reading configuration through either execution backend. */
export function sessionIdentity(
  row: ConversationRecord,
): OnlineAgentSessionIdentity {
  const bindings = jsonObject(row.metadata);
  if ('onlineAgent' in bindings && 'runnerOnlineAgent' in bindings)
    throw invalid('Conflicting OnlineAgent backend bindings.');
  const native = jsonObject(bindings.onlineAgent);
  const nativeConfig = jsonObject(native.config);
  if (
    row.mode === 'online' &&
    native === bindings.onlineAgent &&
    native.version === 1 &&
    nativeConfig === native.config &&
    (nativeConfig.agentId === undefined || nativeConfig.agentId === 'online') &&
    (native.kind === 'realtime' || native.kind === 'background')
  )
    return { backend: 'native', kind: native.kind };
  const runner = jsonObject(bindings.runnerOnlineAgent);
  const runnerConfig = jsonObject(runner.config);
  if (
    row.mode === 'runner' &&
    runner === bindings.runnerOnlineAgent &&
    runner.version === 1 &&
    runnerConfig === runner.config &&
    typeof runnerConfig.agentId === 'string' &&
    runnerConfig.agentId.length > 0 &&
    runnerConfig.agentId !== 'online' &&
    runnerConfig.agentId === row.agentId
  )
    return { backend: 'runner', kind: 'realtime' };
  throw invalid('This conversation has no valid OnlineAgent backend binding.');
}
export function runnerBinding(
  metadata: unknown,
): RunnerOnlineAgentBinding | null {
  const value = jsonObject(jsonObject(metadata).runnerOnlineAgent);
  return value.version === 1 && typeof value.config === 'object'
    ? (value as RunnerOnlineAgentBinding)
    : null;
}
/** Shared native occupancy projection; callers supply their already-authorized persisted row. */
export function nativeExecutionStatus(
  call: { state?: unknown; closing?: unknown } | null | undefined,
  active: boolean,
): 'running' | 'idle' {
  return active ||
    call?.state === 'running' ||
    call?.state === 'waitingApproval' ||
    call?.closing
    ? 'running'
    : 'idle';
}
