// The adapters this runner can start, by tool kind.
//
// Claude Code, Codex, OpenCode and Pi all have real adapters. `NOCOBASE_RUNNER_ADAPTER=echo` makes the echo adapter stand in for every
// tool kind, which is how the tests and local development drive the runner without a coding tool.
import type { AgentTool } from '../../protocol/index.ts';
import { createClaudeAdapter } from './claude.ts';
import { createCodexAdapter } from './codex.ts';
import { createEchoAdapter } from './echo.ts';
import { createOpencodeAdapter } from './opencode.ts';
import { createPiAdapter } from './pi.ts';
import type { AgentAdapter } from './types.ts';

const KINDS: readonly AgentTool[] = ['claude', 'codex', 'opencode', 'pi'];

export function loadAdapters(
  env: NodeJS.ProcessEnv = process.env,
): Map<AgentTool, AgentAdapter> {
  const adapters = new Map<AgentTool, AgentAdapter>();
  if (env.NOCOBASE_RUNNER_ADAPTER === 'echo') {
    for (const kind of KINDS) adapters.set(kind, createEchoAdapter({ kind }));
    return adapters;
  }
  adapters.set('claude', createClaudeAdapter());
  adapters.set('codex', createCodexAdapter());
  adapters.set('opencode', createOpencodeAdapter());
  adapters.set('pi', createPiAdapter());
  return adapters;
}
