/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'path';

import { buildTextArtifactUpload } from './artifactUpload';
import { AgentGatewayDaemonNodeClient } from './gateway';
import {
  ExecCommandAllowlist,
  ExecDriverResult,
  executeAllowlistedCommand,
  getAllowlistedDefinition,
} from './execDriver';
import { detectAgentProfiles, DetectAgentProfilesOptions } from './profileDetection';
import {
  SkillVersionInstallRecord,
  SkillVersionSource,
  syncNodeSkillVersion,
  SyncNodeSkillVersionResult,
} from './skillSync';
import { JsonRecord, RunLease } from './types';
import { executeTmuxCommand, getManagedTmuxSessionName } from './tmuxTerminal';

export interface RunDaemonOnceOptions {
  gateway: AgentGatewayDaemonNodeClient;
  allowlist: ExecCommandAllowlist;
  workspaceRoot: string;
  skillsRoot: string;
  artifactDir: string;
  terminalBackend?: 'exec' | 'tmux';
  detectOptions?: DetectAgentProfilesOptions;
  claimProfileKey?: string;
  claimRunId?: string;
  runHeartbeatIntervalMs?: number;
  syncSkillVersion?: typeof syncNodeSkillVersion;
  executeCommand?: typeof executeAllowlistedCommand;
}

export interface DaemonRunLoopOptions extends RunDaemonOnceOptions {
  pollIntervalMs?: number;
  stopSignal?: AbortSignal;
}

export interface DaemonRunOnceResult {
  status: 'idle' | 'succeeded' | 'failed' | 'timeout' | 'canceled' | 'lease_lost';
  runId?: string;
  reason?: string;
}

const DEFAULT_RUN_HEARTBEAT_INTERVAL_MS = 10_000;

function isRecord(value: unknown): value is JsonRecord {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function getPayload(lease: RunLease) {
  const run = isRecord(lease.run) ? lease.run : {};
  return isRecord(run.executionPayloadJson) ? run.executionPayloadJson : {};
}

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function getStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function getStringMap(value: unknown) {
  if (!isRecord(value)) {
    return {};
  }
  const result: Record<string, string> = {};
  for (const [key, entryValue] of Object.entries(value)) {
    if (typeof entryValue === 'string') {
      result[key] = entryValue;
    }
  }
  return result;
}

function getNumber(value: unknown) {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : undefined;
}

function isSkillVersionSource(value: unknown): value is SkillVersionSource {
  if (!isRecord(value)) {
    return false;
  }
  if (value.type === 'zip') {
    return (
      typeof value.sha256 === 'string' &&
      (typeof value.archivePath === 'string' || typeof value.archiveUrl === 'string')
    );
  }
  if (value.type === 'github') {
    return typeof value.repoUrl === 'string';
  }
  return false;
}

function getSkillVersions(payload: JsonRecord) {
  const versions: SkillVersionInstallRecord[] = [];
  const appendVersion = (value: unknown) => {
    if (!isRecord(value) || typeof value.skillVersionId !== 'string' || !isSkillVersionSource(value.source)) {
      return;
    }
    versions.push({
      skillVersionId: value.skillVersionId,
      versionLabel: getString(value.versionLabel) || value.skillVersionId,
      source: value.source,
    });
  };

  appendVersion(payload.skillVersion);
  if (Array.isArray(payload.skillVersions)) {
    for (const value of payload.skillVersions) {
      appendVersion(value);
    }
  }
  return versions;
}

async function reportExecOutputs(gateway: AgentGatewayDaemonNodeClient, lease: RunLease, result: ExecDriverResult) {
  let sequence = 1;
  for (const [streamName, output] of [
    ['stdout', result.stdout],
    ['stderr', result.stderr],
  ] as const) {
    if (output.text) {
      await gateway.appendEvent(lease, {
        source: streamName,
        sequence,
        eventType: 'agent.output.chunk',
        level: streamName === 'stderr' && result.status !== 'succeeded' ? 'error' : 'info',
        message: output.text,
      });
      sequence += 1;
    }
    if (output.artifactPath) {
      const artifactUpload = await buildTextArtifactUpload(output.artifactPath, output.sizeBytes);
      await gateway.registerArtifact(lease, {
        artifactKey: `${streamName}-main`,
        artifactType: streamName,
        mimeType: 'text/plain',
        sizeBytes: output.sizeBytes,
        contentText: artifactUpload.contentText,
        metadata: artifactUpload.metadata,
      });
    }
  }
}

function dedupeSkillVersions(skillVersions: SkillVersionInstallRecord[]) {
  const result: SkillVersionInstallRecord[] = [];
  const seen = new Set<string>();
  for (const skillVersion of skillVersions) {
    if (!seen.has(skillVersion.skillVersionId)) {
      result.push(skillVersion);
      seen.add(skillVersion.skillVersionId);
    }
  }
  return result;
}

async function syncSkillsForRun(options: RunDaemonOnceOptions, lease: RunLease): Promise<SyncNodeSkillVersionResult[]> {
  const payload = getPayload(lease);
  const skillVersions = dedupeSkillVersions(getSkillVersions(payload));
  const results: SyncNodeSkillVersionResult[] = [];
  for (const skillVersion of skillVersions) {
    results.push(
      await (options.syncSkillVersion || syncNodeSkillVersion)({
        nodeId: options.gateway.nodeId,
        skillsRoot: options.skillsRoot,
        skillVersion,
        downloadHeaders: options.gateway.getNodeAuthHeaders(),
        trustedArchiveServerUrl: options.gateway.serverUrl,
        writeInstallStatus: async (installPayload) => {
          await options.gateway.upsertSkillInstall(installPayload);
        },
      }),
    );
  }
  return results;
}

function heartbeatWhileRunPhase(options: {
  gateway: AgentGatewayDaemonNodeClient;
  getLease(): RunLease;
  setLease(lease: RunLease): void;
  status: 'syncing_skills' | 'running';
  cancelController: AbortController;
  leaseLostController: AbortController;
  intervalMs: number;
}) {
  let inFlight: Promise<void> | null = null;
  const sendHeartbeat = () => {
    if (inFlight) {
      return;
    }
    inFlight = options.gateway
      .heartbeatRun(options.getLease(), options.status)
      .then((lease) => {
        options.setLease({
          ...options.getLease(),
          ...lease,
        });
        if (lease.cancelRequested) {
          options.cancelController.abort();
        }
      })
      .catch(() => {
        options.leaseLostController.abort();
      })
      .finally(() => {
        inFlight = null;
      });
  };
  const timer = setInterval(() => {
    sendHeartbeat();
  }, options.intervalMs);
  return async () => {
    clearInterval(timer);
    await inFlight;
  };
}

async function refreshRunLeaseBeforeTerminal(options: {
  gateway: AgentGatewayDaemonNodeClient;
  getLease(): RunLease;
  setLease(lease: RunLease): void;
  cancelController: AbortController;
  leaseLostController: AbortController;
}) {
  try {
    const refreshedLease = await options.gateway.heartbeatRun(options.getLease(), 'running');
    options.setLease({
      ...options.getLease(),
      ...refreshedLease,
    });
    if (refreshedLease.cancelRequested) {
      options.cancelController.abort();
      return 'cancel_requested';
    }
    return 'active';
  } catch {
    options.leaseLostController.abort();
    return 'lease_lost';
  }
}

async function recoverTerminalConflict(options: {
  gateway: AgentGatewayDaemonNodeClient;
  getLease(): RunLease;
  setLease(lease: RunLease): void;
  cancelController: AbortController;
  leaseLostController: AbortController;
}) {
  const refreshedLeaseStatus = await refreshRunLeaseBeforeTerminal(options);
  if (refreshedLeaseStatus === 'cancel_requested') {
    await options.gateway.cancelAckRun(options.getLease());
    return 'canceled';
  }
  if (refreshedLeaseStatus === 'lease_lost') {
    return 'lease_lost';
  }
  return null;
}

async function terminalizeRun(options: {
  gateway: AgentGatewayDaemonNodeClient;
  getLease(): RunLease;
  setLease(lease: RunLease): void;
  cancelController: AbortController;
  leaseLostController: AbortController;
  result: ExecDriverResult;
}) {
  const observationWarnings: string[] = [];
  try {
    await reportExecOutputs(options.gateway, options.getLease(), options.result);
  } catch (error) {
    observationWarnings.push(error instanceof Error ? error.message : String(error));
  }
  try {
    await options.gateway.registerSnapshot(options.getLease(), {
      snapshotType: 'agent',
      snapshot: {
        status: options.result.status,
        exitCode: options.result.exitCode,
        signal: options.result.signal,
        ...(observationWarnings.length ? { observationWarnings } : {}),
      },
    });
  } catch (error) {
    observationWarnings.push(error instanceof Error ? error.message : String(error));
  }

  try {
    if (options.result.status === 'succeeded') {
      await options.gateway.completeRun(options.getLease(), {
        status: 'succeeded',
        exitCode: options.result.exitCode,
        ...(observationWarnings.length ? { observationWarnings } : {}),
      });
      return 'succeeded';
    }
    if (options.result.status === 'timeout') {
      await options.gateway.timeoutRun(options.getLease(), 'Process timeout confirmed by daemon');
      return 'timeout';
    }
    if (options.result.status === 'canceled') {
      await options.gateway.cancelAckRun(options.getLease());
      return 'canceled';
    }
    if (options.result.status === 'lease_lost') {
      return 'lease_lost';
    }

    await options.gateway.failRun(options.getLease(), `Process exited with ${options.result.status}`, {
      exitCode: options.result.exitCode,
      signal: options.result.signal,
    });
    return 'failed';
  } catch (error) {
    const recoveredStatus = await recoverTerminalConflict(options);
    if (recoveredStatus) {
      return recoveredStatus;
    }
    throw error;
  }
}

async function closeTmuxTerminalQuietly(
  options: RunDaemonOnceOptions,
  lease: RunLease,
  runId: string,
  exitCode: number | null,
) {
  try {
    await options.gateway.updateRunTerminal(lease, {
      terminalBackend: 'tmux',
      terminalSessionName: getManagedTmuxSessionName(runId),
      terminalStatus: 'closed',
      terminalEndedAt: new Date().toISOString(),
      terminalExitCode: exitCode,
    });
  } catch {
    // Terminal metadata is observational; run terminalization remains authoritative.
  }
}

export async function executeClaimedRun(
  options: RunDaemonOnceOptions,
  claimedLease: RunLease,
): Promise<DaemonRunOnceResult> {
  let lease = await options.gateway.heartbeatRun(claimedLease, 'syncing_skills');
  const activeLease = () => ({
    ...claimedLease,
    ...lease,
  });

  const syncCancelController = new AbortController();
  const syncLeaseLostController = new AbortController();
  if (lease.cancelRequested) {
    await options.gateway.cancelAckRun(activeLease());
    return {
      status: 'canceled',
      runId: claimedLease.runId,
    };
  }
  let stopSyncHeartbeat: (() => Promise<void>) | null = heartbeatWhileRunPhase({
    gateway: options.gateway,
    getLease: activeLease,
    setLease: (nextLease) => {
      lease = nextLease;
    },
    status: 'syncing_skills',
    cancelController: syncCancelController,
    leaseLostController: syncLeaseLostController,
    intervalMs: options.runHeartbeatIntervalMs || DEFAULT_RUN_HEARTBEAT_INTERVAL_MS,
  });
  try {
    await syncSkillsForRun(options, activeLease());
  } catch (error) {
    if (stopSyncHeartbeat) {
      await stopSyncHeartbeat();
      stopSyncHeartbeat = null;
    }
    if (syncLeaseLostController.signal.aborted) {
      return {
        status: 'lease_lost',
        runId: claimedLease.runId,
        reason: 'skill_sync_lease_lost',
      };
    }
    if (syncCancelController.signal.aborted) {
      await options.gateway.cancelAckRun(activeLease());
      return {
        status: 'canceled',
        runId: claimedLease.runId,
        reason: 'skill_sync_canceled',
      };
    }
    try {
      await options.gateway.failRun(activeLease(), error instanceof Error ? error.message : String(error));
    } catch {
      return {
        status: 'lease_lost',
        runId: claimedLease.runId,
        reason: 'skill_sync_terminal_failed',
      };
    }
    return {
      status: 'failed',
      runId: claimedLease.runId,
      reason: 'skill_sync_failed',
    };
  } finally {
    if (stopSyncHeartbeat) {
      await stopSyncHeartbeat();
    }
  }
  if (syncLeaseLostController.signal.aborted) {
    return {
      status: 'lease_lost',
      runId: claimedLease.runId,
      reason: 'skill_sync_lease_lost',
    };
  }
  if (syncCancelController.signal.aborted) {
    await options.gateway.cancelAckRun(activeLease());
    return {
      status: 'canceled',
      runId: claimedLease.runId,
      reason: 'skill_sync_canceled',
    };
  }

  lease = await options.gateway.heartbeatRun(activeLease(), 'running');
  if (lease.cancelRequested) {
    await options.gateway.cancelAckRun(activeLease());
    return {
      status: 'canceled',
      runId: claimedLease.runId,
    };
  }

  const payload = getPayload(claimedLease);
  const commandKey = getString(payload.commandKey || payload.profileKey);
  const cwd = path.resolve(options.workspaceRoot, getString(payload.cwd) || '.');
  const terminalBackend = options.terminalBackend || 'exec';
  const cancelController = new AbortController();
  const leaseLostController = new AbortController();
  if (terminalBackend === 'tmux' && !options.executeCommand) {
    await options.gateway.updateRunTerminal(activeLease(), {
      terminalBackend: 'tmux',
      terminalSessionName: getManagedTmuxSessionName(claimedLease.runId),
      terminalStatus: 'active',
      terminalStartedAt: new Date().toISOString(),
    });
  }
  let stopHeartbeat: (() => Promise<void>) | null = heartbeatWhileRunPhase({
    gateway: options.gateway,
    getLease: activeLease,
    setLease: (nextLease) => {
      lease = nextLease;
    },
    status: 'running',
    cancelController,
    leaseLostController,
    intervalMs: options.runHeartbeatIntervalMs || DEFAULT_RUN_HEARTBEAT_INTERVAL_MS,
  });

  try {
    const result =
      terminalBackend === 'tmux' && !options.executeCommand
        ? await executeTmuxCommand({
            runId: claimedLease.runId,
            definition: getAllowlistedDefinition(options.allowlist, commandKey),
            args: getStringArray(payload.args),
            cwd,
            workspaceRoot: options.workspaceRoot,
            env: getStringMap(payload.env),
            timeoutMs: getNumber(payload.timeoutMs) || DEFAULT_RUN_HEARTBEAT_INTERVAL_MS * 180,
            cancelSignal: cancelController.signal,
            leaseLostSignal: leaseLostController.signal,
            artifactDir: options.artifactDir,
          })
        : await (options.executeCommand || executeAllowlistedCommand)({
            commandKey,
            allowlist: options.allowlist,
            args: getStringArray(payload.args),
            cwd,
            workspaceRoot: options.workspaceRoot,
            env: getStringMap(payload.env),
            timeoutMs: getNumber(payload.timeoutMs),
            cancelSignal: cancelController.signal,
            leaseLostSignal: leaseLostController.signal,
            artifactDir: options.artifactDir,
          });
    if (stopHeartbeat) {
      await stopHeartbeat();
      stopHeartbeat = null;
    }
    if (leaseLostController.signal.aborted) {
      return {
        status: 'lease_lost',
        runId: claimedLease.runId,
      };
    }
    const refreshedLeaseStatus = await refreshRunLeaseBeforeTerminal({
      gateway: options.gateway,
      getLease: activeLease,
      setLease: (nextLease) => {
        lease = nextLease;
      },
      cancelController,
      leaseLostController,
    });
    if (refreshedLeaseStatus === 'lease_lost') {
      return {
        status: 'lease_lost',
        runId: claimedLease.runId,
      };
    }
    if (refreshedLeaseStatus === 'cancel_requested') {
      if (terminalBackend === 'tmux' && !options.executeCommand) {
        await closeTmuxTerminalQuietly(options, activeLease(), claimedLease.runId, result.exitCode);
      }
      await options.gateway.cancelAckRun(activeLease());
      return {
        status: 'canceled',
        runId: claimedLease.runId,
      };
    }
    if (terminalBackend === 'tmux' && !options.executeCommand) {
      await closeTmuxTerminalQuietly(options, activeLease(), claimedLease.runId, result.exitCode);
    }
    const terminalResult: ExecDriverResult =
      cancelController.signal.aborted && result.status === 'succeeded'
        ? {
            ...result,
            status: 'canceled',
          }
        : result;
    const status = await terminalizeRun({
      gateway: options.gateway,
      getLease: activeLease,
      setLease: (nextLease) => {
        lease = nextLease;
      },
      cancelController,
      leaseLostController,
      result: terminalResult,
    });
    return {
      status,
      runId: claimedLease.runId,
    };
  } catch (error) {
    if (stopHeartbeat) {
      await stopHeartbeat();
      stopHeartbeat = null;
    }
    if (terminalBackend === 'tmux' && !options.executeCommand) {
      await closeTmuxTerminalQuietly(options, activeLease(), claimedLease.runId, null);
    }
    if (!leaseLostController.signal.aborted) {
      try {
        await options.gateway.failRun(activeLease(), error instanceof Error ? error.message : String(error));
      } catch {
        const recoveredStatus = await recoverTerminalConflict({
          gateway: options.gateway,
          getLease: activeLease,
          setLease: (nextLease) => {
            lease = nextLease;
          },
          cancelController,
          leaseLostController,
        });
        if (recoveredStatus) {
          return {
            status: recoveredStatus,
            runId: claimedLease.runId,
          };
        }
        return {
          status: 'lease_lost',
          runId: claimedLease.runId,
        };
      }
    }
    return {
      status: leaseLostController.signal.aborted ? 'lease_lost' : 'failed',
      runId: claimedLease.runId,
    };
  } finally {
    if (stopHeartbeat) {
      await stopHeartbeat();
    }
  }
}

export async function runDaemonOnce(options: RunDaemonOnceOptions): Promise<DaemonRunOnceResult> {
  const profiles = await detectAgentProfiles(options.detectOptions);
  await options.gateway.heartbeatNode({
    profiles,
  });
  const claim = await options.gateway.claimRun({
    profileKey: options.claimProfileKey,
    runId: options.claimRunId,
  });
  if (claim.claimed === false || !claim.runId) {
    return {
      status: 'idle',
      reason: 'no_claimable_run',
    };
  }
  return await executeClaimedRun(options, {
    ...claim,
    claimed: true,
  });
}

function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

export async function runDaemonLoop(options: DaemonRunLoopOptions) {
  const pollIntervalMs = options.pollIntervalMs || 10_000;
  while (!options.stopSignal?.aborted) {
    await runDaemonOnce(options);
    await delay(pollIntervalMs, options.stopSignal);
  }
}
