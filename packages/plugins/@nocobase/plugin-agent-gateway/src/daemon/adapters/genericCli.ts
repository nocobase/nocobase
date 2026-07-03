/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { normalizeAgentProviderCapabilities } from '../../shared/providerCapabilities';
import { AgentAdapter, BuildResumeCommandInput, BuildStartCommandInput } from './types';

export const genericCliAdapter: AgentAdapter = {
  provider: 'generic-cli',
  capabilities: normalizeAgentProviderCapabilities('generic-cli'),
  buildStartCommand(input: BuildStartCommandInput) {
    return {
      commandKey: 'generic-cli',
      args: [...(input.extraArgs || []), input.prompt],
      cwd: input.cwd,
      timeoutMs: input.timeoutMs,
    };
  },
  buildResumeCommand(_input: BuildResumeCommandInput) {
    throw new Error('Generic CLI resume is not supported by this adapter');
  },
  detectSessionId() {
    return null;
  },
  normalizeEvent() {
    return [];
  },
};
