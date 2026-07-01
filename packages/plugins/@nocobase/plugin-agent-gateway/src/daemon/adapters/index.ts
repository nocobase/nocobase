/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { codexAdapter } from './codex';
import { AgentAdapter, AgentProviderKey } from './types';

export * from './codex';
export * from './types';

const adapters: Record<AgentProviderKey, AgentAdapter | null> = {
  codex: codexAdapter,
  opencode: null,
  'claude-code': null,
};

export function getAgentAdapter(provider: string): AgentAdapter | null {
  if (provider === 'codex' || provider === 'opencode' || provider === 'claude-code') {
    return adapters[provider];
  }
  return null;
}
