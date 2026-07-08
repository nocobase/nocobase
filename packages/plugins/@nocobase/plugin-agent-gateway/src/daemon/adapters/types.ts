/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { JsonRecord } from '../types';
import { AgentProviderCapabilities, AgentProviderKey } from '../../shared/providerCapabilities';

export type AgentCapabilities = AgentProviderCapabilities;

export interface CommandSpec {
  commandKey: AgentProviderKey;
  args: string[];
  cwd?: string;
  env?: Record<string, string>;
  timeoutMs?: number;
}

export interface BuildStartCommandInput {
  prompt: string;
  cwd?: string;
  extraArgs?: string[];
  timeoutMs?: number;
  outputMode?: 'structured' | 'terminal';
}

export interface BuildResumeCommandInput {
  providerSessionId: string;
  message: string;
  cwd?: string;
  extraArgs?: string[];
  timeoutMs?: number;
  outputMode?: 'structured' | 'terminal';
}

export interface ProviderEventInput {
  rawLine?: string;
  event?: unknown;
  source?: string;
}

export interface NormalizedAgentEvent {
  eventType: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  providerEventId?: string | null;
  correlationId?: string | null;
  confidence?: number | null;
  message?: string | null;
  payloadJson?: JsonRecord;
  rawLine?: string | null;
  rawEvent?: JsonRecord | null;
}

export interface AgentAdapter {
  provider: AgentProviderKey;
  capabilities: AgentCapabilities;
  projectSkillTargetDirs?: string[];
  buildStartCommand(input: BuildStartCommandInput): CommandSpec;
  buildResumeCommand(input: BuildResumeCommandInput): CommandSpec;
  detectSessionId(input: ProviderEventInput): string | null;
  normalizeEvent(input: ProviderEventInput): NormalizedAgentEvent[];
}
