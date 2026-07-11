/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { spawn } from 'child_process';
import { StringDecoder } from 'string_decoder';

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

export type CommandProbe = (commandCandidates: string[], signal?: AbortSignal) => Promise<CommandProbeResult>;

export interface DetectAgentProfilesOptions {
  probeCommand?: CommandProbe;
  signal?: AbortSignal;
}

export interface CachedProfileDetectorOptions extends DetectAgentProfilesOptions {
  refreshIntervalMs?: number;
  now?: () => number;
}

export interface CommandProbeOptions {
  timeoutMs?: number;
  maxOutputBytes?: number;
  forceKillDelayMs?: number;
  signal?: AbortSignal;
}

export type AgentProfileDetector = (signal?: AbortSignal) => Promise<DetectedAgentProfile[]>;

const DEFAULT_PROFILE_REFRESH_INTERVAL_MS = 60_000;
export const DEFAULT_PROFILE_PROBE_TIMEOUT_MS = 5000;
export const DEFAULT_PROFILE_PROBE_MAX_OUTPUT_BYTES = 64 * 1024;
const DEFAULT_PROFILE_PROBE_FORCE_KILL_DELAY_MS = 500;

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

class BoundedProbeOutput {
  private readonly decoder = new StringDecoder('utf8');
  private readonly chunks: string[] = [];
  private sizeBytes = 0;
  private ended = false;

  constructor(private readonly maxBytes: number) {}

  append(rawChunk: unknown) {
    if (this.sizeBytes >= this.maxBytes) {
      return;
    }
    const chunk = Buffer.isBuffer(rawChunk) ? rawChunk : Buffer.from(String(rawChunk));
    const captured = chunk.subarray(0, this.maxBytes - this.sizeBytes);
    if (captured.length) {
      this.chunks.push(this.decoder.write(captured));
      this.sizeBytes += captured.length;
    }
  }

  finish() {
    if (!this.ended) {
      this.ended = true;
      this.chunks.push(this.decoder.end());
    }
    return this.chunks.join('');
  }
}

function signalProbeProcess(child: ReturnType<typeof spawn>, signal: NodeJS.Signals) {
  if (child.pid && process.platform !== 'win32') {
    try {
      process.kill(-child.pid, signal);
      return;
    } catch {
      // Fall through to signaling the direct child.
    }
  }
  child.kill(signal);
}

export function probeOneCommand(command: string, options: CommandProbeOptions = {}) {
  return new Promise<CommandProbeResult>((resolve) => {
    const timeoutMs = Math.max(1, options.timeoutMs ?? DEFAULT_PROFILE_PROBE_TIMEOUT_MS);
    const maxOutputBytes = Math.max(1, options.maxOutputBytes ?? DEFAULT_PROFILE_PROBE_MAX_OUTPUT_BYTES);
    const forceKillDelayMs = Math.max(1, options.forceKillDelayMs ?? DEFAULT_PROFILE_PROBE_FORCE_KILL_DELAY_MS);
    const child = spawn(command, ['--version'], {
      detached: process.platform !== 'win32',
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stdout = new BoundedProbeOutput(maxOutputBytes);
    const stderr = new BoundedProbeOutput(maxOutputBytes);
    let settled = false;
    let timedOut = false;
    let aborted = false;
    let forceKillTimer: ReturnType<typeof setTimeout> | null = null;
    let killCompletionTimer: ReturnType<typeof setTimeout> | null = null;
    const getStoppedResult = () => ({
      available: false,
      command,
      error: aborted ? 'Command probe aborted' : `Command probe timed out after ${timeoutMs}ms`,
    });
    const terminate = () => {
      signalProbeProcess(child, 'SIGTERM');
      forceKillTimer = setTimeout(() => {
        signalProbeProcess(child, 'SIGKILL');
        killCompletionTimer = setTimeout(() => {
          finish(getStoppedResult());
        }, forceKillDelayMs);
      }, forceKillDelayMs);
    };
    const onAbort = () => {
      aborted = true;
      terminate();
    };
    const finish = (result: CommandProbeResult) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeoutTimer);
      if (forceKillTimer) {
        clearTimeout(forceKillTimer);
      }
      if (killCompletionTimer) {
        clearTimeout(killCompletionTimer);
      }
      options.signal?.removeEventListener('abort', onAbort);
      resolve(result);
    };
    const timeoutTimer = setTimeout(() => {
      timedOut = true;
      terminate();
    }, timeoutMs);
    if (options.signal?.aborted) {
      onAbort();
    } else {
      options.signal?.addEventListener('abort', onAbort, { once: true });
    }

    child.stdout.on('data', (chunk) => {
      stdout.append(chunk);
    });
    child.stderr.on('data', (chunk) => {
      stderr.append(chunk);
    });
    child.on('error', (error) => {
      finish({
        available: false,
        command,
        error: error.message,
      });
    });
    child.on('close', (code) => {
      const stdoutText = stdout.finish();
      const stderrText = stderr.finish();
      if (timedOut || aborted) {
        finish(getStoppedResult());
        return;
      }
      if (code === 0) {
        finish({
          available: true,
          command,
          version: normalizeVersion(stdoutText || stderrText),
          authStatus: 'unknown',
        });
        return;
      }
      finish({
        available: false,
        command,
        error: normalizeVersion(stderrText || stdoutText) || `Command exited with code ${code}`,
      });
    });
  });
}

export async function defaultCommandProbe(commandCandidates: string[], signal?: AbortSignal) {
  let lastResult: CommandProbeResult = {
    available: false,
  };
  for (const command of commandCandidates) {
    if (signal?.aborted) {
      return {
        available: false,
        error: 'Command probe aborted',
      };
    }
    const result = await probeOneCommand(command, { signal });
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
    const result = await probeCommand(definition.commandCandidates, options.signal);
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

export function createCachedProfileDetector(options: CachedProfileDetectorOptions = {}): AgentProfileDetector {
  const refreshIntervalMs = options.refreshIntervalMs ?? DEFAULT_PROFILE_REFRESH_INTERVAL_MS;
  const now = options.now || Date.now;
  let cachedProfiles: DetectedAgentProfile[] | null = null;
  let cacheExpiresAt = 0;
  let inFlight: Promise<DetectedAgentProfile[]> | null = null;

  return async (signal?: AbortSignal) => {
    if (cachedProfiles && now() < cacheExpiresAt) {
      return cachedProfiles;
    }
    if (inFlight) {
      return await inFlight;
    }

    inFlight = detectAgentProfiles({
      probeCommand: options.probeCommand,
      signal,
    })
      .then((profiles) => {
        cachedProfiles = profiles;
        cacheExpiresAt = now() + refreshIntervalMs;
        return profiles;
      })
      .finally(() => {
        inFlight = null;
      });
    return await inFlight;
  };
}
