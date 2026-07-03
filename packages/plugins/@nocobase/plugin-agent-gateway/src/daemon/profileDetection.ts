/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { spawn } from 'child_process';

import { getAgentAdapter } from './adapters';
import { getAgentProviderKey, normalizeAgentProviderCapabilities } from '../shared/providerCapabilities';
import { AgentGatewayProfileKey, AgentGatewayProfileStatus, DetectedAgentProfile, JsonRecord } from './types';

interface ProfileProbeDefinition {
  profileKey: AgentGatewayProfileKey;
  displayName: string;
  commandCandidates: string[];
}

export interface CommandProbeResult {
  available: boolean;
  command?: string;
  version?: string;
  authStatus?: 'ok' | 'missing' | 'expired' | 'unknown';
  error?: string;
}

export type CommandProbe = (commandCandidates: string[]) => Promise<CommandProbeResult>;

export interface DetectAgentProfilesOptions {
  probeCommand?: CommandProbe;
}

const PROFILE_DEFINITIONS: ProfileProbeDefinition[] = [
  {
    profileKey: 'opencode',
    displayName: 'OpenCode',
    commandCandidates: ['opencode'],
  },
  {
    profileKey: 'codex',
    displayName: 'Codex',
    commandCandidates: ['codex'],
  },
  {
    profileKey: 'claude-code',
    displayName: 'Claude Code',
    commandCandidates: ['claude', 'claude-code'],
  },
];

function normalizeVersion(rawOutput: string) {
  return rawOutput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)[0];
}

function probeOneCommand(command: string) {
  return new Promise<CommandProbeResult>((resolve) => {
    const child = spawn(command, ['--version'], {
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('error', (error) => {
      resolve({
        available: false,
        command,
        error: error.message,
      });
    });
    child.on('close', (code) => {
      if (code === 0) {
        resolve({
          available: true,
          command,
          version: normalizeVersion(stdout || stderr),
          authStatus: 'unknown',
        });
        return;
      }
      resolve({
        available: false,
        command,
        error: normalizeVersion(stderr || stdout) || `Command exited with code ${code}`,
      });
    });
  });
}

export async function defaultCommandProbe(commandCandidates: string[]) {
  let lastResult: CommandProbeResult = {
    available: false,
  };
  for (const command of commandCandidates) {
    const result = await probeOneCommand(command);
    if (result.available) {
      return result;
    }
    lastResult = result;
  }
  return lastResult;
}

function buildProfileStatus(result: CommandProbeResult): AgentGatewayProfileStatus {
  if (!result.available) {
    return 'missing';
  }
  if (result.authStatus === 'missing' || result.authStatus === 'expired') {
    return 'auth_required';
  }
  return 'active';
}

function buildCapabilities(definition: ProfileProbeDefinition, result: CommandProbeResult): JsonRecord {
  const provider = getAgentProviderKey(definition.profileKey);
  const adapter = getAgentAdapter(provider);
  return {
    ...normalizeAgentProviderCapabilities(provider, adapter?.capabilities || {}),
    commandKey: definition.profileKey,
    detectedCommand: result.command || null,
    version: result.version || null,
    authStatus: result.authStatus || 'unknown',
    supportsExecDriver: result.available,
  };
}

export async function detectAgentProfiles(options: DetectAgentProfilesOptions = {}): Promise<DetectedAgentProfile[]> {
  const probeCommand = options.probeCommand || defaultCommandProbe;
  const profiles: DetectedAgentProfile[] = [];

  for (const definition of PROFILE_DEFINITIONS) {
    const result = await probeCommand(definition.commandCandidates);
    const provider = getAgentProviderKey(definition.profileKey);
    profiles.push({
      profileKey: definition.profileKey,
      provider,
      displayName: definition.displayName,
      agentType: 'code',
      driver: 'exec',
      status: buildProfileStatus(result),
      capabilities: buildCapabilities(definition, result),
      metadata: {
        detector: 'agent-gateway-daemon',
        detectionError: result.available ? null : result.error || 'Command is not installed',
      },
    });
  }

  return profiles;
}
