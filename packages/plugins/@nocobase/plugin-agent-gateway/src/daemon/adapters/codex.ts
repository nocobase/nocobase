/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { detectCodexSessionId, normalizeCodexEvent } from '../../shared/providerLogNormalizers/codex';
import { normalizeAgentProviderCapabilities } from '../../shared/providerCapabilities';
import { AgentAdapter, BuildResumeCommandInput, BuildStartCommandInput } from './types';

export { parseCodexJsonlLine } from '../../shared/providerLogNormalizers/codex';

const UNATTENDED_EXEC_ARGS = ['--skip-git-repo-check'];
const STRUCTURED_OUTPUT_ARGS = ['--json'];

function getStructuredOutputArgs(outputMode?: 'structured' | 'terminal') {
  return outputMode === 'terminal' ? [] : STRUCTURED_OUTPUT_ARGS;
}

export const codexAdapter: AgentAdapter = {
  provider: 'codex',
  capabilities: normalizeAgentProviderCapabilities('codex'),
  projectSkillTargetDirs: ['.agents/skills'],
  buildStartCommand(input: BuildStartCommandInput) {
    return {
      commandKey: 'codex',
      args: [
        'exec',
        ...UNATTENDED_EXEC_ARGS,
        ...getStructuredOutputArgs(input.outputMode),
        ...(input.extraArgs || []),
        input.prompt,
      ],
      cwd: input.cwd,
      timeoutMs: input.timeoutMs,
    };
  },
  buildResumeCommand(input: BuildResumeCommandInput) {
    return {
      commandKey: 'codex',
      args: [
        'exec',
        'resume',
        ...UNATTENDED_EXEC_ARGS,
        ...getStructuredOutputArgs(input.outputMode),
        ...(input.extraArgs || []),
        input.providerSessionId,
        input.message,
      ],
      cwd: input.cwd,
      timeoutMs: input.timeoutMs,
    };
  },
  detectSessionId: detectCodexSessionId,
  normalizeEvent: normalizeCodexEvent,
};
