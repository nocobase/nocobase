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

export const claudeCodeAdapter: AgentAdapter = {
  provider: 'claude-code',
  capabilities: normalizeAgentProviderCapabilities('claude-code'),
  projectSkillTargetDirs: ['.claude/skills'],
  buildStartCommand(input: BuildStartCommandInput) {
    const structuredArgs = input.outputMode === 'terminal' ? [] : ['--output-format', 'stream-json'];
    return {
      commandKey: 'claude-code',
      args: ['-p', input.prompt, ...structuredArgs, ...(input.extraArgs || [])],
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
