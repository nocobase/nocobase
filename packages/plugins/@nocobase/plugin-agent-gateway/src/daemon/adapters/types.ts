/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AgentProviderCapabilities, AgentProviderKey } from '../../shared/providerCapabilities';
import { NormalizedAgentEvent, ProviderEventInput } from '../../shared/providerEvents';

export type { NormalizedAgentEvent, ProviderEventInput } from '../../shared/providerEvents';

export type AgentCapabilities = AgentProviderCapabilities;

export interface CommandSpec {
  args: string[];
  cwd?: string;
  timeoutMs?: number;
}

export interface BuildStartCommandInput {
  prompt: string;
  cwd?: string;
  timeoutMs?: number;
  outputMode?: 'structured' | 'terminal';
}

export interface BuildResumeCommandInput {
  providerSessionId: string;
  message: string;
  cwd?: string;
  timeoutMs?: number;
  outputMode?: 'structured' | 'terminal';
}

export interface AgentAdapter {
  provider: AgentProviderKey;
  capabilities: AgentCapabilities;
  projectSkillTargetDirs?: string[];
  validatePolicyArgs(args: string[]): void;
  buildStartCommand(input: BuildStartCommandInput): CommandSpec;
  buildResumeCommand(input: BuildResumeCommandInput): CommandSpec;
  detectSessionId(input: ProviderEventInput): string | null;
  normalizeEvent(input: ProviderEventInput): NormalizedAgentEvent[];
}
