/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AgentProviderKey } from '../providerCapabilities';
import { NormalizedAgentEvent, ProviderEventInput } from '../providerEvents';
import { normalizeClaudeCodeEvent } from './claudeCode';
import { normalizeCodexEvent } from './codex';
import { normalizeOpenCodeEvent } from './opencode';

type ProviderLogNormalizer = (input: ProviderEventInput) => NormalizedAgentEvent[];

const PROVIDER_LOG_NORMALIZERS: Partial<Record<AgentProviderKey, ProviderLogNormalizer>> = {
  codex: normalizeCodexEvent,
  opencode: normalizeOpenCodeEvent,
  'claude-code': normalizeClaudeCodeEvent,
};

export function normalizeProviderLogEvent(provider: AgentProviderKey, input: ProviderEventInput) {
  return PROVIDER_LOG_NORMALIZERS[provider]?.(input) || [];
}

export function hasProviderLogNormalizer(provider: AgentProviderKey) {
  return Boolean(PROVIDER_LOG_NORMALIZERS[provider]);
}
