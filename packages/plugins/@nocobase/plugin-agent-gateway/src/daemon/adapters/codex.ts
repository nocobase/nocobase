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

const FORBIDDEN_CODEX_ARGS = new Set([
  '-C',
  '--cd',
  '--add-dir',
  '--sandbox',
  '--dangerously-bypass-approvals-and-sandbox',
  '-c',
  '--config',
]);

function validateCodexPolicyArgs(args: string[]) {
  const forbidden = args.find(
    (arg) =>
      FORBIDDEN_CODEX_ARGS.has(arg) ||
      [...FORBIDDEN_CODEX_ARGS].some((flag) => arg.startsWith(`${flag}=`)) ||
      (arg.startsWith('-C') && arg !== '-C'),
  );
  if (forbidden) {
    throw new Error(`Codex execution policy contains a forbidden argument: ${forbidden}`);
  }
}

export const codexAdapter: AgentAdapter = {
  provider: 'codex',
  capabilities: normalizeAgentProviderCapabilities('codex'),
  projectSkillTargetDirs: ['.agents/skills'],
  validatePolicyArgs: validateCodexPolicyArgs,
  buildStartCommand(input: BuildStartCommandInput) {
    return {
      args: ['exec', ...UNATTENDED_EXEC_ARGS, ...getStructuredOutputArgs(input.outputMode), input.prompt],
      cwd: input.cwd,
      timeoutMs: input.timeoutMs,
    };
  },
  buildResumeCommand(input: BuildResumeCommandInput) {
    return {
      args: [
        'exec',
        'resume',
        ...UNATTENDED_EXEC_ARGS,
        ...getStructuredOutputArgs(input.outputMode),
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
