/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { codexAdapter } from './codex';
import { claudeCodeAdapter } from './claudeCode';
import { genericCliAdapter } from './genericCli';
import { opencodeAdapter } from './opencode';
import { AgentProviderKey } from '../../shared/providerCapabilities';
import { AgentAdapter } from './types';

export * from './codex';
export * from './claudeCode';
export * from './genericCli';
export * from './opencode';
export * from './types';

const adapters: Record<AgentProviderKey, AgentAdapter> = {
  codex: codexAdapter,
  opencode: opencodeAdapter,
  'claude-code': claudeCodeAdapter,
  'generic-cli': genericCliAdapter,
};

export function getAgentAdapter(provider: string): AgentAdapter | null {
  if (provider === 'codex' || provider === 'opencode' || provider === 'claude-code' || provider === 'generic-cli') {
    return adapters[provider];
  }
  return null;
}
