/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { normalizeAgentProviderCapabilities } from '../../shared/providerCapabilities';
import { detectClaudeCodeSessionId, normalizeClaudeCodeEvent } from '../../shared/providerLogNormalizers/claudeCode';
import { AgentAdapter, BuildResumeCommandInput, BuildStartCommandInput } from './types';

export { parseClaudeCodeJsonLine } from '../../shared/providerLogNormalizers/claudeCode';

const FORBIDDEN_CLAUDE_CODE_ARGS = new Set([
  '--permission-mode',
  '--add-dir',
  '--additional-dir',
  '--dangerously-skip-permissions',
  '--settings',
  '--setting-sources',
  '--plugin-dir',
  '--mcp-config',
]);

function validateClaudeCodePolicyArgs(args: string[]) {
  const forbidden = args.find(
    (arg) =>
      FORBIDDEN_CLAUDE_CODE_ARGS.has(arg) || [...FORBIDDEN_CLAUDE_CODE_ARGS].some((flag) => arg.startsWith(`${flag}=`)),
  );
  if (forbidden) {
    throw new Error(`Claude Code execution policy contains a forbidden argument: ${forbidden}`);
  }
}

export const claudeCodeAdapter: AgentAdapter = {
  provider: 'claude-code',
  capabilities: normalizeAgentProviderCapabilities('claude-code'),
  projectSkillTargetDirs: ['.claude/skills'],
  validatePolicyArgs: validateClaudeCodePolicyArgs,
  buildStartCommand(input: BuildStartCommandInput) {
    const structuredArgs = input.outputMode === 'terminal' ? [] : ['--output-format', 'stream-json'];
    return {
      args: ['-p', input.prompt, ...structuredArgs],
      cwd: input.cwd,
      timeoutMs: input.timeoutMs,
    };
  },
  buildResumeCommand(_input: BuildResumeCommandInput) {
    throw new Error('Claude-style resume is not supported by this adapter');
  },
  detectSessionId: detectClaudeCodeSessionId,
  normalizeEvent: normalizeClaudeCodeEvent,
};
