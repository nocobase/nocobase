/** The idle timeout an agent starts from, as the server applies it (`DEFAULT_TOOL_POLICY` in `shared/agents.ts`). */
import { DEFAULT_TOOL_POLICY } from '../../shared/agents.js';

/** 30 minutes. */
export const DEFAULT_IDLE_TIMEOUT_MS: number =
  DEFAULT_TOOL_POLICY.idleTimeoutMs;
