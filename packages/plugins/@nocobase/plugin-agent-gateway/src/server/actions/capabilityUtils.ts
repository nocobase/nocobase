/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';

import {
  AgentCapabilityKey,
  AgentProviderKey,
  getExplicitAgentProviderKey,
  normalizeAgentProviderCapabilities,
} from '../../shared/providerCapabilities';
import { JsonRecord, ModelRecord, getModelValue, getRecord, getString } from './utils';

export interface RunProviderCapabilitySummary {
  provider: AgentProviderKey;
  providerSource: 'run';
  capabilities: JsonRecord;
}

export async function getRunProviderCapabilitySummary(
  _ctx: Context,
  run: ModelRecord,
  _session?: ModelRecord | null,
  _suppliedProfile?: ModelRecord | null,
): Promise<RunProviderCapabilitySummary> {
  const provider = getExplicitAgentProviderKey(getString(getModelValue(run, 'provider')));
  if (!provider) {
    throw new Error('Run provider snapshot is missing or invalid');
  }
  const capabilities = normalizeAgentProviderCapabilities(
    provider,
    getRecord(getModelValue(run, 'capabilitiesSnapshotJson')),
  );
  return {
    provider,
    providerSource: 'run',
    capabilities,
  };
}

export function isRunCapabilitySupported(summary: RunProviderCapabilitySummary, capability: AgentCapabilityKey) {
  return summary.capabilities[capability] === true;
}
