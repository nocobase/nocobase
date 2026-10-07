/**
 * The tool policy an agent starts from, as the server applies it (`DEFAULT_TOOL_POLICY` in `shared/agents.ts`), shown
 * in the agent's advanced settings so people see what they override.
 */
import { DEFAULT_TOOL_POLICY } from '../../shared/agents.js';

export const DEFAULT_ALLOWED_COMMANDS: readonly string[] =
  DEFAULT_TOOL_POLICY.allowedCommands;

export const DEFAULT_DENIED_PATTERNS: readonly string[] =
  DEFAULT_TOOL_POLICY.deniedPatterns;

/** 30 minutes. */
export const DEFAULT_IDLE_TIMEOUT_MS: number =
  DEFAULT_TOOL_POLICY.idleTimeoutMs;
