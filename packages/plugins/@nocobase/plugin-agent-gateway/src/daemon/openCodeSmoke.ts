/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { buildTextArtifactUpload } from './artifactUpload';
import { DetectedAgentProfile, JsonRecord, RunLease } from './types';
import { detectAgentProfiles, DetectAgentProfilesOptions } from './profileDetection';
import { ExecDriverResult } from './execDriver';
import { SkillVersionInstallRecord, SyncNodeSkillVersionResult } from './skillSync';

export type OpenCodeSmokeTerminalStatus = 'succeeded' | 'failed' | 'timeout' | 'canceled' | 'skipped';

export interface OpenCodeSmokeGateway {
  heartbeatNode(options: { profiles: DetectedAgentProfile[]; currentConcurrency?: number }): Promise<JsonRecord>;
  createRun(values: JsonRecord): Promise<{ runId: string }>;
  claimRun(values: { profileKey: string; runId?: string }): Promise<RunLease>;
  heartbeatRun(
    lease: RunLease,
    status: 'running' | 'syncing_skills',
  ): Promise<RunLease & { cancelRequested?: boolean }>;
  appendEvent(lease: RunLease, values: JsonRecord): Promise<void>;
  registerArtifact(lease: RunLease, values: JsonRecord): Promise<void>;
  registerSnapshot(lease: RunLease, values: JsonRecord): Promise<void>;
  completeRun(lease: RunLease, resultSummary: JsonRecord): Promise<void>;
  failRun(lease: RunLease, errorSummary: string, resultSummary?: JsonRecord): Promise<void>;
  timeoutRun(lease: RunLease, errorSummary: string): Promise<void>;
  cancelAckRun(lease: RunLease): Promise<void>;
  skipRun(runId: string, reason: string, resultSummary?: JsonRecord): Promise<void>;
}

export interface RunOpenCodeSmokeOptions {
  gateway: OpenCodeSmokeGateway;
  detectOptions?: DetectAgentProfilesOptions;
  skillVersion: SkillVersionInstallRecord;
  syncSkillVersion: (skillVersion: SkillVersionInstallRecord) => Promise<SyncNodeSkillVersionResult>;
  executeOpenCode: (signals: { cancelSignal: AbortSignal; leaseLostSignal: AbortSignal }) => Promise<ExecDriverResult>;
  prompt?: string;
  runHeartbeatIntervalMs?: number;
}

export interface OpenCodeSmokeResult {
  terminalStatus: OpenCodeSmokeTerminalStatus;
  runId?: string;
  reason?: string;
  profile?: DetectedAgentProfile;
}

function isOpenCodeAvailable(profile: DetectedAgentProfile | undefined) {
  return Boolean(profile && profile.status === 'active');
}

function getTerminalStatus(result: ExecDriverResult): OpenCodeSmokeTerminalStatus {
  if (result.status === 'succeeded') {
    return 'succeeded';
  }
  if (result.status === 'timeout') {
    return 'timeout';
  }
  if (result.status === 'canceled') {
    return 'canceled';
  }
  return 'failed';
}

function heartbeatWhileRunPhase(options: {
  gateway: OpenCodeSmokeGateway;
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
  gateway: OpenCodeSmokeGateway;
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
  gateway: OpenCodeSmokeGateway;
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

async function reportExecOutputs(gateway: OpenCodeSmokeGateway, lease: RunLease, result: ExecDriverResult) {
  if (result.stdout.text) {
    await gateway.appendEvent(lease, {
      source: 'stdout',
      sequence: 1,
      eventType: 'agent.output.chunk',
      level: 'info',
      message: result.stdout.text,
    });
  }
  if (result.stderr.text) {
    await gateway.appendEvent(lease, {
      source: 'stderr',
      sequence: 1,
      eventType: 'agent.output.chunk',
      level: result.status === 'succeeded' ? 'info' : 'error',
      message: result.stderr.text,
    });
  }
  for (const [streamName, output] of [
    ['stdout', result.stdout],
    ['stderr', result.stderr],
  ] as const) {
    if (output.artifactPath) {
      const artifactUpload = await buildTextArtifactUpload(output.artifactPath, output.sizeBytes);
      await gateway.registerArtifact(lease, {
        artifactKey: `opencode-${streamName}`,
        artifactType: streamName,
        mimeType: 'text/plain',
        sizeBytes: output.sizeBytes,
        contentText: artifactUpload.contentText,
        metadata: artifactUpload.metadata,
      });
    }
  }
}

async function collectObservationWarnings(gateway: OpenCodeSmokeGateway, lease: RunLease, result: ExecDriverResult) {
  const observationWarnings: string[] = [];
  try {
    await reportExecOutputs(gateway, lease, result);
  } catch (error) {
    observationWarnings.push(error instanceof Error ? error.message : String(error));
  }
  try {
    await gateway.registerSnapshot(lease, {
      snapshotType: 'agent',
      snapshot: {
        profileKey: 'opencode',
        status: result.status,
        exitCode: result.exitCode,
        ...(observationWarnings.length ? { observationWarnings } : {}),
      },
    });
  } catch (error) {
    observationWarnings.push(error instanceof Error ? error.message : String(error));
  }
  return observationWarnings;
}

export async function runOpenCodeSmoke(options: RunOpenCodeSmokeOptions): Promise<OpenCodeSmokeResult> {
  const profiles = await detectAgentProfiles(options.detectOptions);
  await options.gateway.heartbeatNode({
    profiles,
  });
  const opencodeProfile = profiles.find((profile) => profile.profileKey === 'opencode');
  const run = await options.gateway.createRun({
    sourceType: 'opencode-smoke',
    profileKey: 'opencode',
    promptSnapshot: {
      text: options.prompt || 'Create a minimal NocoBase UI build smoke result.',
    },
    executionPayload: {
      driver: 'exec',
      profileKey: 'opencode',
      skillVersionId: options.skillVersion.skillVersionId,
      skillVersion: options.skillVersion,
    },
  });
  if (!isOpenCodeAvailable(opencodeProfile)) {
    const reason = 'missing_dependency: opencode is not installed or not authenticated';
    await options.gateway.skipRun(run.runId, reason, {
      smoke: 'opencode',
      skipped: true,
      reason,
    });
    return {
      terminalStatus: 'skipped',
      runId: run.runId,
      reason,
      profile: opencodeProfile,
    };
  }

  const claimedLease = await options.gateway.claimRun({
    profileKey: 'opencode',
    runId: run.runId,
  });
  if (claimedLease.claimed === false || claimedLease.runId !== run.runId) {
    const reason = claimedLease.claimed === false ? 'opencode smoke run was not claimed' : 'claimed run mismatch';
    await options.gateway.skipRun(run.runId, reason, {
      smoke: 'opencode',
      skipped: true,
      reason,
    });
    return {
      terminalStatus: 'skipped',
      runId: run.runId,
      reason,
      profile: opencodeProfile,
    };
  }
  let activeLease = await options.gateway.heartbeatRun(claimedLease, 'syncing_skills');
  const syncCancelController = new AbortController();
  const syncLeaseLostController = new AbortController();
  if (activeLease.cancelRequested) {
    await options.gateway.cancelAckRun(activeLease);
    return {
      terminalStatus: 'canceled',
      runId: run.runId,
      profile: opencodeProfile,
    };
  }
  let stopSyncHeartbeat: (() => Promise<void>) | null = heartbeatWhileRunPhase({
    gateway: options.gateway,
    getLease: () => activeLease,
    setLease: (nextLease) => {
      activeLease = nextLease;
    },
    status: 'syncing_skills',
    cancelController: syncCancelController,
    leaseLostController: syncLeaseLostController,
    intervalMs: options.runHeartbeatIntervalMs || 10_000,
  });
  try {
    await options.syncSkillVersion(options.skillVersion);
  } catch (error) {
    if (stopSyncHeartbeat) {
      await stopSyncHeartbeat();
      stopSyncHeartbeat = null;
    }
    if (syncLeaseLostController.signal.aborted) {
      return {
        terminalStatus: 'failed',
        runId: run.runId,
        reason: 'lease_lost',
        profile: opencodeProfile,
      };
    }
    if (syncCancelController.signal.aborted) {
      await options.gateway.cancelAckRun(activeLease);
      return {
        terminalStatus: 'canceled',
        runId: run.runId,
        reason: 'skill_sync_canceled',
        profile: opencodeProfile,
      };
    }
    try {
      await options.gateway.failRun(activeLease, error instanceof Error ? error.message : String(error), {
        smoke: 'opencode',
        phase: 'skill_sync',
      });
    } catch {
      return {
        terminalStatus: 'failed',
        runId: run.runId,
        reason: 'lease_lost',
        profile: opencodeProfile,
      };
    }
    return {
      terminalStatus: 'failed',
      runId: run.runId,
      reason: 'skill_sync_failed',
      profile: opencodeProfile,
    };
  } finally {
    if (stopSyncHeartbeat) {
      await stopSyncHeartbeat();
    }
  }
  if (syncLeaseLostController.signal.aborted) {
    return {
      terminalStatus: 'failed',
      runId: run.runId,
      reason: 'lease_lost',
      profile: opencodeProfile,
    };
  }
  if (syncCancelController.signal.aborted) {
    await options.gateway.cancelAckRun(activeLease);
    return {
      terminalStatus: 'canceled',
      runId: run.runId,
      reason: 'skill_sync_canceled',
      profile: opencodeProfile,
    };
  }
  const runningLease = await options.gateway.heartbeatRun(activeLease, 'running');
  activeLease = runningLease;
  if (runningLease.cancelRequested) {
    await options.gateway.cancelAckRun(runningLease);
    return {
      terminalStatus: 'canceled',
      runId: run.runId,
      profile: opencodeProfile,
    };
  }

  const cancelController = new AbortController();
  const leaseLostController = new AbortController();
  let stopHeartbeat: (() => Promise<void>) | null = heartbeatWhileRunPhase({
    gateway: options.gateway,
    getLease: () => activeLease,
    setLease: (nextLease) => {
      activeLease = nextLease;
    },
    status: 'running',
    cancelController,
    leaseLostController,
    intervalMs: options.runHeartbeatIntervalMs || 10_000,
  });

  let execResult: ExecDriverResult;
  try {
    execResult = await options.executeOpenCode({
      cancelSignal: cancelController.signal,
      leaseLostSignal: leaseLostController.signal,
    });
    if (stopHeartbeat) {
      await stopHeartbeat();
      stopHeartbeat = null;
    }
    if (leaseLostController.signal.aborted) {
      return {
        terminalStatus: 'failed',
        runId: run.runId,
        reason: 'lease_lost',
        profile: opencodeProfile,
      };
    }
    const refreshedLeaseStatus = await refreshRunLeaseBeforeTerminal({
      gateway: options.gateway,
      getLease: () => activeLease,
      setLease: (nextLease) => {
        activeLease = nextLease;
      },
      cancelController,
      leaseLostController,
    });
    if (refreshedLeaseStatus === 'lease_lost') {
      return {
        terminalStatus: 'failed',
        runId: run.runId,
        reason: 'lease_lost',
        profile: opencodeProfile,
      };
    }
    if (refreshedLeaseStatus === 'cancel_requested') {
      await options.gateway.cancelAckRun(activeLease);
      return {
        terminalStatus: 'canceled',
        runId: run.runId,
        profile: opencodeProfile,
      };
    }
  } catch (error) {
    if (stopHeartbeat) {
      await stopHeartbeat();
      stopHeartbeat = null;
    }
    const reason = error instanceof Error ? error.message : String(error);
    if (!leaseLostController.signal.aborted) {
      await options.gateway.failRun(activeLease, reason, {
        smoke: 'opencode',
        phase: 'execute',
      });
    }
    return {
      terminalStatus: 'failed',
      runId: run.runId,
      reason: leaseLostController.signal.aborted ? 'lease_lost' : reason,
      profile: opencodeProfile,
    };
  } finally {
    if (stopHeartbeat) {
      await stopHeartbeat();
    }
  }

  if (cancelController.signal.aborted && execResult.status === 'succeeded') {
    execResult = {
      ...execResult,
      status: 'canceled',
    };
  }

  const observationWarnings = await collectObservationWarnings(options.gateway, activeLease, execResult);

  const terminalStatus = getTerminalStatus(execResult);
  try {
    if (terminalStatus === 'succeeded') {
      await options.gateway.completeRun(activeLease, {
        smoke: 'opencode',
        status: execResult.status,
        ...(observationWarnings.length ? { observationWarnings } : {}),
      });
    } else if (terminalStatus === 'timeout') {
      await options.gateway.timeoutRun(activeLease, 'OpenCode smoke timed out and was stopped');
    } else if (terminalStatus === 'canceled') {
      await options.gateway.cancelAckRun(activeLease);
    } else {
      await options.gateway.failRun(activeLease, `OpenCode smoke finished with ${execResult.status}`, {
        exitCode: execResult.exitCode,
        signal: execResult.signal,
        ...(observationWarnings.length ? { observationWarnings } : {}),
      });
    }
  } catch (error) {
    const recoveredStatus = await recoverTerminalConflict({
      gateway: options.gateway,
      getLease: () => activeLease,
      setLease: (nextLease) => {
        activeLease = nextLease;
      },
      cancelController,
      leaseLostController,
    });
    if (recoveredStatus === 'canceled') {
      return {
        terminalStatus: 'canceled',
        runId: run.runId,
        profile: opencodeProfile,
      };
    }
    if (recoveredStatus === 'lease_lost') {
      return {
        terminalStatus: 'failed',
        runId: run.runId,
        reason: 'lease_lost',
        profile: opencodeProfile,
      };
    }
    throw error;
  }

  return {
    terminalStatus,
    runId: run.runId,
    profile: opencodeProfile,
  };
}
