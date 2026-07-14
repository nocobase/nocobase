/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { promises as fs } from 'fs';

import { isAgentGatewayLeaseLostError } from '../apiClient';
import { getAgentAdapter } from '../adapters';
import { AgentGatewayDaemonNodeClient } from '../gateway';
import { ExecDriverResult, executePolicyCommand, getExecutionPolicy } from '../execDriver';
import { AgentProfileDetector, DetectAgentProfilesOptions } from '../profileDetection';
import {
  cleanupProjectSkillsForRun,
  cleanupStaleProjectSkills,
  createProjectSkillRunState,
  installProjectSkillsForRun,
  ProjectSkillRunState,
} from '../projectSkills';
import { ClaimedRunLease, ExecutionPolicyDefinition, ExecutionPolicySet, RunLease } from '../types';
import { getLocalRunLeaseDeadlineMonotonicMs, getMonotonicTimeMs } from '../leaseDeadline';
import {
  AgentCommandOutputMode,
  assertRemoteExecutionPayloadIsSafe,
  getExecutionCommandSpec,
  getPayload,
  getRequestedExecutionPolicyKey,
  getRequestedTerminalBackend,
} from '../executionCommand';
import { compactDeclaredArtifactSummary } from '../runArtifacts';
import { getManagedTmuxSessionName } from '../tmuxTerminal';
import type { DaemonTerminalStreamClientOptions } from '../terminalStreamClient';
import {
  abortForRunCancel,
  forwardAbortSignal,
  heartbeatRunWithRetry,
  heartbeatWhileRunPhase,
  recoverTerminalConflict,
  refreshRunLeaseBeforeTerminal,
  type RunHeartbeatStatus,
} from './leaseHeartbeat';
import type { TerminalStreamHandle } from './terminalBackend';
import type { ControlRequestLoopHandle } from './controlRequestLoop';
import { createLiveTimelineReporter, type LiveTimelineReporter } from '../observations/liveTimelinePublisher';
import { reportProviderSessionAndCollectWarnings } from '../observations/providerReporter';
import type { DeclaredArtifactCollectionSummary } from '../observations/artifactCollector';
import { resolveExecutionServices, type ExecutionServiceOverrides } from './services';
import {
  compactProjectSkillCleanupResult,
  compactProjectSkillJanitorResult,
  getSkillVersions,
  markProjectSkillsRemoved,
  resolveWorkspaceCwd,
  syncSkillsForRun,
  withInstalledSkillMetadata,
  type SkillSyncFunction,
} from './skillLifecycle';

export interface RunDaemonOnceOptions {
  gateway: AgentGatewayDaemonNodeClient;
  executionPolicies: ExecutionPolicySet;
  skillsRoot: string;
  artifactDir: string;
  terminalBackend?: 'exec' | 'tmux';
  detectOptions?: DetectAgentProfilesOptions;
  detectProfiles?: AgentProfileDetector;
  claimProfileKey?: string;
  claimRunId?: string;
  runHeartbeatIntervalMs?: number;
  syncSkillVersion?: SkillSyncFunction;
  executeCommand?: typeof executePolicyCommand;
  maxOutputSpoolBytes?: number;
  terminalRingBufferMaxBytes?: number;
  terminalStreamClientFactory?: (options: DaemonTerminalStreamClientOptions) => TerminalStreamHandle;
  services?: ExecutionServiceOverrides;
  stopSignal?: AbortSignal;
}

export interface DaemonRunOnceResult {
  status: 'idle' | 'succeeded' | 'failed' | 'timeout' | 'canceled' | 'lease_lost';
  runId?: string;
  reason?: string;
}

const DEFAULT_RUN_HEARTBEAT_INTERVAL_MS = 10_000;
export async function executeClaimedRun(
  options: RunDaemonOnceOptions,
  claimedLease: ClaimedRunLease,
): Promise<DaemonRunOnceResult> {
  const services = resolveExecutionServices(options.services);
  if (options.stopSignal?.aborted) {
    return {
      status: 'lease_lost',
      runId: claimedLease.runId,
      reason: 'daemon_stopped',
    };
  }
  let lease: RunLease;
  try {
    lease = await heartbeatRunWithRetry(options.gateway, claimedLease, 'syncing_skills', options.stopSignal);
  } catch {
    return {
      status: 'lease_lost',
      runId: claimedLease.runId,
      reason: 'skill_sync_heartbeat_failed',
    };
  }
  let executionLeaseBase = claimedLease;
  const activeLease = () => ({
    ...executionLeaseBase,
    ...lease,
  });
  const progressReporter = services.observations.createProgressReporter({
    gateway: options.gateway,
    getLease: activeLease,
  });
  let cwd = '';
  let executionPolicy: ExecutionPolicyDefinition | null = null;
  let projectSkillState: ProjectSkillRunState | null = null;
  let projectSkillCleanupDone = false;
  const cleanupProjectSkills = async (reportProgress = true) => {
    if (!projectSkillState || projectSkillCleanupDone) {
      return [];
    }
    projectSkillCleanupDone = true;
    try {
      if (reportProgress) {
        await progressReporter.append({
          phase: 'skill.cleanup',
          status: 'started',
          message: 'Temporary project Skill cleanup started',
        });
      }
      const cleanupResult = await cleanupProjectSkillsForRun(projectSkillState);
      await markProjectSkillsRemoved({
        gateway: options.gateway,
        nodeId: options.gateway.nodeId,
        cleanupResult,
      });
      if (reportProgress) {
        await progressReporter.append({
          phase: 'skill.cleanup',
          status: 'succeeded',
          message: 'Temporary project Skill cleanup completed',
          payloadJson: compactProjectSkillCleanupResult(cleanupResult),
        });
      }
      return cleanupResult.warnings;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (reportProgress) {
        await progressReporter.append({
          phase: 'skill.cleanup',
          status: 'failed',
          level: 'warning',
          message,
        });
      }
      return [`Temporary project Skill cleanup failed: ${message}`];
    }
  };

  const syncCancelController = new AbortController();
  const syncLeaseLostController = new AbortController();
  if (lease.cancelRequested) {
    await options.gateway.cancelAckRun(activeLease());
    return {
      status: 'canceled',
      runId: claimedLease.runId,
    };
  }
  const stopForwardingSyncAbort = forwardAbortSignal(options.stopSignal, syncLeaseLostController);
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
    const syncPayload = getPayload(activeLease());
    assertRemoteExecutionPayloadIsSafe(syncPayload);
    const executionPolicyKey = getRequestedExecutionPolicyKey(activeLease(), syncPayload);
    executionPolicy = getExecutionPolicy(options.executionPolicies, executionPolicyKey);
    cwd = await resolveWorkspaceCwd(executionPolicy.workspaceRoot, syncPayload.cwd);
    if (getSkillVersions(syncPayload).length) {
      projectSkillState = createProjectSkillRunState(cwd, claimedLease.runId);
    }
    await progressReporter.append({
      phase: 'skill.sync',
      status: 'started',
      message: 'Skill sync started',
    });
    const syncResults = await syncSkillsForRun(
      options,
      activeLease(),
      projectSkillState?.stagingRoot,
      syncLeaseLostController.signal,
    );
    if (!syncLeaseLostController.signal.aborted && !syncCancelController.signal.aborted) {
      if (syncResults.length && !projectSkillState) {
        projectSkillState = createProjectSkillRunState(cwd, claimedLease.runId);
      }
      if (projectSkillState) {
        const provider = executionPolicy.provider;
        const adapter = getAgentAdapter(provider);
        const projectSkillTargetDirs = adapter?.projectSkillTargetDirs || [];
        if (projectSkillTargetDirs.length) {
          const janitorResult = await cleanupStaleProjectSkills({
            cwd,
            runId: claimedLease.runId,
            projectSkillTargetDirs,
          });
          if (janitorResult.removedPaths.length || janitorResult.warnings.length) {
            await progressReporter.append({
              phase: 'skill.janitor',
              status: janitorResult.warnings.length ? 'warning' : 'succeeded',
              level: janitorResult.warnings.length ? 'warning' : 'info',
              message: 'Stale temporary project Skill cleanup completed',
              payloadJson: compactProjectSkillJanitorResult(janitorResult),
            });
          }
        }
        projectSkillState = await installProjectSkillsForRun({
          state: projectSkillState,
          provider,
          projectSkillTargetDirs,
          syncResults,
        });
      }
    }
    executionLeaseBase = withInstalledSkillMetadata(executionLeaseBase, syncResults, projectSkillState);
    await progressReporter.append({
      phase: 'skill.sync',
      status: 'succeeded',
      message: 'Skill sync completed',
      payloadJson: {
        skillCount: syncResults.length,
      },
    });
  } catch (error) {
    if (!syncLeaseLostController.signal.aborted) {
      await progressReporter.append({
        phase: 'skill.sync',
        status: 'failed',
        message: error instanceof Error ? error.message : String(error),
      });
    }
    if (stopSyncHeartbeat) {
      await stopSyncHeartbeat();
      stopSyncHeartbeat = null;
    }
    await cleanupProjectSkills();
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
    stopForwardingSyncAbort();
    if (stopSyncHeartbeat) {
      await stopSyncHeartbeat();
    }
  }
  if (syncLeaseLostController.signal.aborted) {
    await cleanupProjectSkills();
    return {
      status: 'lease_lost',
      runId: claimedLease.runId,
      reason: 'skill_sync_lease_lost',
    };
  }
  if (syncCancelController.signal.aborted) {
    await cleanupProjectSkills();
    await options.gateway.cancelAckRun(activeLease());
    return {
      status: 'canceled',
      runId: claimedLease.runId,
      reason: 'skill_sync_canceled',
    };
  }

  try {
    lease = await heartbeatRunWithRetry(options.gateway, activeLease(), 'running', options.stopSignal);
  } catch {
    await cleanupProjectSkills();
    return {
      status: 'lease_lost',
      runId: claimedLease.runId,
      reason: 'execution_heartbeat_failed',
    };
  }
  if (lease.cancelRequested) {
    await options.gateway.cancelAckRun(activeLease());
    return {
      status: 'canceled',
      runId: claimedLease.runId,
    };
  }

  const payload = getPayload(activeLease());
  const terminalBackend = getRequestedTerminalBackend(options.terminalBackend);
  const tmuxSessionName = getManagedTmuxSessionName(claimedLease.runId);
  const usesManagedTmux = terminalBackend === 'tmux' && !options.executeCommand;
  if (!executionPolicy) {
    throw new Error('Execution policy was not resolved before command execution');
  }
  const requestedAdapter = getAgentAdapter(executionPolicy.provider);
  const commandOutputMode: AgentCommandOutputMode =
    !usesManagedTmux || requestedAdapter?.capabilities.structuredEvents ? 'structured' : 'terminal';
  let terminalStream: TerminalStreamHandle | null = null;
  let liveTimelineReporter: LiveTimelineReporter | null = null;
  const cancelController = new AbortController();
  const leaseLostController = new AbortController();
  const stopForwardingExecutionAbort = forwardAbortSignal(options.stopSignal, leaseLostController);
  let stopHeartbeat: (() => Promise<void>) | null = null;
  let controlRequests: ControlRequestLoopHandle | null = null;
  let runHeartbeatStatus: RunHeartbeatStatus = 'running';
  const managedOutputArtifactPaths = new Set<string>();

  try {
    const commandSpec = getExecutionCommandSpec(activeLease(), executionPolicy, cwd, commandOutputMode);
    await progressReporter.append({
      phase: 'agent.process',
      status: 'started',
      message: 'Agent process started',
      payloadJson: {
        executionPolicyKey: commandSpec.executionPolicyKey,
        terminalBackend,
      },
    });
    stopHeartbeat = heartbeatWhileRunPhase({
      gateway: options.gateway,
      getLease: activeLease,
      setLease: (nextLease) => {
        lease = nextLease;
      },
      status: () => runHeartbeatStatus,
      cancelController,
      leaseLostController,
      intervalMs: options.runHeartbeatIntervalMs || DEFAULT_RUN_HEARTBEAT_INTERVAL_MS,
    });
    if (usesManagedTmux) {
      liveTimelineReporter = createLiveTimelineReporter({
        gateway: options.gateway,
        getLease: activeLease,
        provider: commandSpec.provider,
      });
      terminalStream = services.terminal.createStream({
        runOptions: options,
        runId: claimedLease.runId,
        sessionName: tmuxSessionName,
        getLease: activeLease,
        onControlAvailable: () => {
          controlRequests?.wake();
        },
      });
      await terminalStream.start();
    }
    const startManagedTmuxControls = async (terminalStartedAt: string) => {
      await options.gateway.updateRunTerminal(activeLease(), {
        terminalBackend: 'tmux',
        terminalSessionName: tmuxSessionName,
        terminalStatus: 'active',
        terminalStartedAt,
      });
      if (!controlRequests) {
        controlRequests = services.controlRequests.start({
          gateway: options.gateway,
          getLease: activeLease,
          sessionName: tmuxSessionName,
          cancelController,
          intervalMs: Math.max(
            250,
            Math.floor((options.runHeartbeatIntervalMs || DEFAULT_RUN_HEARTBEAT_INTERVAL_MS) / 2),
          ),
        });
      }
    };

    const result = usesManagedTmux
      ? await services.terminal.executeTmux({
          runId: claimedLease.runId,
          policy: executionPolicy,
          args: commandSpec.args,
          cwd: commandSpec.cwd,
          timeoutMs: commandSpec.timeoutMs || DEFAULT_RUN_HEARTBEAT_INTERVAL_MS * 180,
          cancelSignal: cancelController.signal,
          leaseLostSignal: leaseLostController.signal,
          artifactDir: options.artifactDir,
          maxOutputSpoolBytes: options.maxOutputSpoolBytes,
          outputMode: commandOutputMode,
          onOutputChunk: async (chunk) => {
            await terminalStream?.appendText(chunk);
            await liveTimelineReporter?.appendText(chunk);
            await progressReporter.appendHarnessMarkers(chunk);
          },
          onSessionStarted: async (metadata) => {
            await startManagedTmuxControls(metadata.startedAt);
          },
        })
      : await (options.executeCommand || executePolicyCommand)({
          executionPolicyKey: commandSpec.executionPolicyKey,
          executionPolicies: options.executionPolicies,
          args: commandSpec.args,
          cwd: commandSpec.cwd,
          timeoutMs: commandSpec.timeoutMs,
          cancelSignal: cancelController.signal,
          leaseLostSignal: leaseLostController.signal,
          artifactDir: options.artifactDir,
          maxOutputSpoolBytes: options.maxOutputSpoolBytes,
        });
    if (!options.executeCommand) {
      for (const output of [result.stdout, result.stderr]) {
        if (output.artifactPath) {
          managedOutputArtifactPaths.add(output.artifactPath);
        }
      }
    }
    if (!usesManagedTmux) {
      await progressReporter.appendHarnessMarkers(result.stdout.text || '');
      await progressReporter.appendHarnessMarkers(result.stderr.text || '');
    }
    await progressReporter.append({
      phase: 'agent.process',
      status: result.status === 'succeeded' ? 'succeeded' : result.status === 'timeout' ? 'timeout' : 'failed',
      message: `Agent process finished with ${result.status}`,
      payloadJson: {
        status: result.status,
        exitCode: result.exitCode,
        signal: result.signal,
      },
    });
    await liveTimelineReporter?.flush();
    runHeartbeatStatus = 'finalizing';
    try {
      const finalizingLease = await options.gateway.heartbeatRun(activeLease(), 'finalizing');
      lease = {
        ...activeLease(),
        ...finalizingLease,
      };
      if (finalizingLease.cancelRequested) {
        abortForRunCancel(cancelController, finalizingLease);
      }
    } catch (error) {
      if (
        isAgentGatewayLeaseLostError(error) ||
        getMonotonicTimeMs() >= getLocalRunLeaseDeadlineMonotonicMs(activeLease())
      ) {
        leaseLostController.abort();
      }
    }
    if (controlRequests) {
      await controlRequests.stop();
      controlRequests = null;
    }
    if (leaseLostController.signal.aborted) {
      if (usesManagedTmux) {
        await services.terminal.close(options, activeLease(), claimedLease.runId, result.exitCode);
        await terminalStream?.end('disconnected');
      }
      return {
        status: 'lease_lost',
        runId: claimedLease.runId,
      };
    }
    let terminalEndDelivered = true;
    if (usesManagedTmux) {
      await services.terminal.close(options, activeLease(), claimedLease.runId, result.exitCode);
      terminalEndDelivered = (await terminalStream?.end(services.terminal.toEndReason(result.status))) ?? false;
    }
    const sessionObservationWarnings = liveTimelineReporter?.getWarnings() || [];
    if (!terminalEndDelivered) {
      sessionObservationWarnings.push('Terminal stream final frame was not acknowledged before run finalization');
    }
    for (const [streamName, output] of [
      ['stdout', result.stdout],
      ['stderr', result.stderr],
    ] as const) {
      if (output.truncated) {
        sessionObservationWarnings.push(
          `${streamName} spool truncated after ${output.capturedBytes ?? output.sizeBytes} captured bytes`,
        );
      }
    }
    sessionObservationWarnings.push(
      ...(await reportProviderSessionAndCollectWarnings({
        gateway: options.gateway,
        getLease: activeLease,
        provider: commandSpec.provider,
        result,
      })),
    );
    let declaredArtifactSummary: DeclaredArtifactCollectionSummary | undefined;
    await progressReporter.append({
      phase: 'artifacts.collect',
      status: 'started',
      message: 'Artifact collection started',
    });
    try {
      declaredArtifactSummary = await services.observations
        .createArtifactCollector({
          gateway: options.gateway,
          getLease: activeLease,
        })
        .collect({
          payload,
          cwd: commandSpec.cwd,
        });
      await progressReporter.append({
        phase: 'artifacts.collect',
        status: 'succeeded',
        message: 'Artifact collection completed',
        payloadJson: compactDeclaredArtifactSummary(declaredArtifactSummary),
      });
    } catch (error) {
      sessionObservationWarnings.push(
        `Declared artifact upload failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      await progressReporter.append({
        phase: 'artifacts.collect',
        status: 'failed',
        message: error instanceof Error ? error.message : String(error),
      });
    }
    sessionObservationWarnings.push(...(await cleanupProjectSkills()));
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
      await options.gateway.cancelAckRun(activeLease());
      return {
        status: 'canceled',
        runId: claimedLease.runId,
      };
    }
    const terminalResult: ExecDriverResult =
      cancelController.signal.aborted && result.status === 'succeeded'
        ? {
            ...result,
            status: 'canceled',
          }
        : result;
    await progressReporter.append({
      phase: 'run.finalizing',
      status: 'started',
      message: 'Run finalization started',
      payloadJson: {
        status: terminalResult.status,
      },
    });
    const status = await services.observations.complete({
      gateway: options.gateway,
      getLease: activeLease,
      setLease: (nextLease) => {
        lease = nextLease;
      },
      cancelController,
      leaseLostController,
      result: terminalResult,
      progressReporter,
      observationWarnings: [...sessionObservationWarnings, ...progressReporter.getWarnings()],
      declaredArtifactSummary,
    });
    return {
      status,
      runId: claimedLease.runId,
    };
  } catch (error) {
    await liveTimelineReporter?.flush();
    if (stopHeartbeat) {
      await stopHeartbeat();
      stopHeartbeat = null;
    }
    if (controlRequests) {
      await controlRequests.stop();
      controlRequests = null;
    }
    if (usesManagedTmux) {
      await services.terminal.close(options, activeLease(), claimedLease.runId, null);
      await terminalStream?.end(leaseLostController.signal.aborted ? 'disconnected' : 'failed');
    }
    await cleanupProjectSkills();
    if (!leaseLostController.signal.aborted) {
      try {
        await progressReporter.append({
          phase: 'run.finalizing',
          status: 'failed',
          message: error instanceof Error ? error.message : String(error),
        });
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
    stopForwardingExecutionAbort();
    if (stopHeartbeat) {
      await stopHeartbeat();
    }
    if (controlRequests) {
      await controlRequests.stop();
    }
    await cleanupProjectSkills(false);
    terminalStream?.close();
    for (const artifactPath of managedOutputArtifactPaths) {
      await fs.unlink(artifactPath).catch(() => {
        // The runner owns logs created by its default exec and tmux backends.
      });
    }
  }
}

export async function claimAndExecuteOnce(
  options: RunDaemonOnceOptions,
  onActiveRunChange?: (active: boolean) => void,
): Promise<DaemonRunOnceResult> {
  const claim = await options.gateway.claimRun({
    profileKey: options.claimProfileKey,
    runId: options.claimRunId,
  });
  if (claim.claimed === false) {
    return {
      status: 'idle',
      reason: 'no_claimable_run',
    };
  }
  onActiveRunChange?.(true);
  try {
    return await executeClaimedRun(options, claim);
  } finally {
    onActiveRunChange?.(false);
  }
}
