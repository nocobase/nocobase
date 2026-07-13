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
  hasAgentCapabilitySignal,
  isAgentCapabilitySupported,
  normalizeAgentProviderCapabilities,
} from '../../shared/providerCapabilities';
import { EXTERNAL_IMPORT_CAPABILITIES, EXTERNAL_IMPORT_SOURCE_TYPE } from '../../shared/externalRunImport';
import { JsonRecord, ModelRecord, getModelValue, getRecord, getString } from './utils';

export interface RunProviderCapabilitySummary {
  provider: AgentProviderKey;
  providerSource: 'session' | 'run' | 'profile' | 'payload' | 'fallback';
  capabilities: JsonRecord;
  enforceCapabilities: boolean;
}

function getModelTargetString(model: ModelRecord, key: string) {
  const value = getModelValue(model, key);
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function getExecutionPayloadProvider(run: ModelRecord) {
  const payload = getRecord(getModelValue(run, 'executionPayloadJson'));
  const explicitCapabilities = getRecord(payload.capabilities || payload.agentProviderCapabilities);
  const sourceType = getString(getModelValue(run, 'sourceType'));
  return {
    provider: getExplicitAgentProviderKey(payload.provider) || getExplicitAgentProviderKey(payload.agentProvider),
    capabilities:
      hasAgentCapabilitySignal(explicitCapabilities) || sourceType === EXTERNAL_IMPORT_SOURCE_TYPE
        ? {
            ...(sourceType === EXTERNAL_IMPORT_SOURCE_TYPE ? EXTERNAL_IMPORT_CAPABILITIES : {}),
            ...explicitCapabilities,
          }
        : {},
  };
}

async function getProfile(ctx: Context, run: ModelRecord) {
  const profileId = getModelTargetString(run, 'agentProfileId');
  if (!profileId) {
    return null;
  }
  return (await ctx.db.getRepository('agAgentProfiles').findOne({
    filterByTk: profileId,
  })) as ModelRecord | null;
}

async function getSession(ctx: Context, run: ModelRecord) {
  const sessionId = getModelTargetString(run, 'agentSessionId');
  if (!sessionId) {
    return null;
  }
  return (await ctx.db.getRepository('agAgentSessions').findOne({
    filterByTk: sessionId,
  })) as ModelRecord | null;
}

export async function getRunProviderCapabilitySummary(
  ctx: Context,
  run: ModelRecord,
  session?: ModelRecord | null,
  suppliedProfile?: ModelRecord | null,
): Promise<RunProviderCapabilitySummary> {
  const runProvider = getExplicitAgentProviderKey(getString(getModelValue(run, 'agentSessionProvider')));
  const profile = suppliedProfile === undefined ? await getProfile(ctx, run) : suppliedProfile;
  const profileProvider = profile ? getExplicitAgentProviderKey(getString(getModelValue(profile, 'provider'))) : null;
  const profileCapabilities = profile ? getRecord(getModelValue(profile, 'capabilitiesJson')) : {};
  const payloadProvider = getExecutionPayloadProvider(run);
  const sourceType = getString(getModelValue(run, 'sourceType'));
  const resolvedSession = session === undefined ? await getSession(ctx, run) : session;
  const sessionProvider = resolvedSession
    ? getExplicitAgentProviderKey(getString(getModelValue(resolvedSession, 'provider')))
    : null;
  const provider = sessionProvider || runProvider || profileProvider || payloadProvider.provider || 'generic-cli';

  if (resolvedSession) {
    const capabilities = getRecord(getModelValue(resolvedSession, 'capabilitiesJson'));
    if (hasAgentCapabilitySignal(capabilities)) {
      return {
        provider,
        providerSource: 'session',
        capabilities: normalizeAgentProviderCapabilities(provider, capabilities),
        enforceCapabilities: true,
      };
    }
    if (sessionProvider && hasAgentCapabilitySignal(profileCapabilities)) {
      return {
        provider,
        providerSource: 'profile',
        capabilities: normalizeAgentProviderCapabilities(provider, profileCapabilities),
        enforceCapabilities: true,
      };
    }
    if (sessionProvider) {
      return {
        provider,
        providerSource: 'session',
        capabilities: normalizeAgentProviderCapabilities(provider, {}),
        enforceCapabilities: true,
      };
    }
  }

  if (runProvider) {
    if (sourceType === EXTERNAL_IMPORT_SOURCE_TYPE && hasAgentCapabilitySignal(payloadProvider.capabilities)) {
      return {
        provider: runProvider,
        providerSource: 'payload',
        capabilities: normalizeAgentProviderCapabilities(runProvider, payloadProvider.capabilities),
        enforceCapabilities: true,
      };
    }
    if (hasAgentCapabilitySignal(profileCapabilities)) {
      return {
        provider: runProvider,
        providerSource: 'profile',
        capabilities: normalizeAgentProviderCapabilities(runProvider, profileCapabilities),
        enforceCapabilities: true,
      };
    }
    return {
      provider: runProvider,
      providerSource: 'run',
      capabilities: normalizeAgentProviderCapabilities(runProvider, {}),
      enforceCapabilities: true,
    };
  }

  if (profile) {
    if (profileProvider) {
      return {
        provider: profileProvider,
        providerSource: 'profile',
        capabilities: normalizeAgentProviderCapabilities(profileProvider, profileCapabilities),
        enforceCapabilities: true,
      };
    }
    if (payloadProvider.provider && hasAgentCapabilitySignal(profileCapabilities)) {
      return {
        provider: payloadProvider.provider,
        providerSource: 'profile',
        capabilities: normalizeAgentProviderCapabilities(payloadProvider.provider, profileCapabilities),
        enforceCapabilities: true,
      };
    }
    if (hasAgentCapabilitySignal(profileCapabilities)) {
      return {
        provider: 'generic-cli',
        providerSource: 'profile',
        capabilities: normalizeAgentProviderCapabilities('generic-cli', profileCapabilities),
        enforceCapabilities: true,
      };
    }
  }

  if (payloadProvider.provider) {
    if (hasAgentCapabilitySignal(payloadProvider.capabilities)) {
      return {
        provider: payloadProvider.provider,
        providerSource: 'payload',
        capabilities: normalizeAgentProviderCapabilities(payloadProvider.provider, payloadProvider.capabilities),
        enforceCapabilities: true,
      };
    }
    return {
      provider: payloadProvider.provider,
      providerSource: 'payload',
      capabilities: normalizeAgentProviderCapabilities(payloadProvider.provider, {}),
      enforceCapabilities: true,
    };
  }

  return {
    provider: 'generic-cli',
    providerSource: 'fallback',
    capabilities: normalizeAgentProviderCapabilities('generic-cli', {}),
    enforceCapabilities: true,
  };
}

export function isRunCapabilitySupported(summary: RunProviderCapabilitySummary, capability: AgentCapabilityKey) {
  if (!summary.enforceCapabilities) {
    return true;
  }
  return isAgentCapabilitySupported(summary.provider, summary.capabilities, capability);
}
