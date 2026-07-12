/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { normalizeAgentProviderCapabilities } from '../../shared/providerCapabilities';
import { detectOpenCodeSessionId, normalizeOpenCodeEvent } from '../../shared/providerLogNormalizers/opencode';
import { AgentAdapter, BuildResumeCommandInput, BuildStartCommandInput } from './types';

export { parseOpenCodeJsonLine } from '../../shared/providerLogNormalizers/opencode';

export const opencodeAdapter: AgentAdapter = {
  provider: 'opencode',
  capabilities: normalizeAgentProviderCapabilities('opencode'),
  projectSkillTargetDirs: ['.agents/skills'],
  buildStartCommand(input: BuildStartCommandInput) {
    const structuredArgs = input.outputMode === 'terminal' ? [] : ['--format', 'json'];
    return {
      commandKey: 'opencode',
      args: ['run', ...structuredArgs, ...(input.extraArgs || []), input.prompt],
      cwd: input.cwd,
      timeoutMs: input.timeoutMs,
    };
  },
  buildResumeCommand(_input: BuildResumeCommandInput) {
    throw new Error('OpenCode resume is not supported by this adapter');
  },
  detectSessionId: detectOpenCodeSessionId,
  normalizeEvent: normalizeOpenCodeEvent,
};
