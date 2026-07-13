/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ExecDriverResult } from '../execDriver';
import type { AgentGatewayDaemonNodeClient } from '../gateway';
import { compactDeclaredArtifactSummary, reportExecOutputs } from '../runArtifacts';
import type { JsonRecord, RunLease } from '../types';
import { recoverTerminalConflict } from '../execution/leaseHeartbeat';
import type { RunProgressReporter } from './eventPublisher';
import { publishCompletionSnapshot } from './snapshotPublisher';

export type RunCompletionStatus = 'succeeded' | 'failed' | 'timeout' | 'canceled' | 'lease_lost';

export async function terminalizeRun(options: {
  gateway: AgentGatewayDaemonNodeClient;
  getLease(): RunLease;
  setLease(lease: RunLease): void;
  cancelController: AbortController;
  leaseLostController: AbortController;
  result: ExecDriverResult;
  progressReporter?: RunProgressReporter;
  observationWarnings?: string[];
  declaredArtifactSummary?: JsonRecord;
}): Promise<RunCompletionStatus> {
  const observationWarnings: string[] = [...(options.observationWarnings || [])];
  const declaredArtifactSummary = compactDeclaredArtifactSummary(options.declaredArtifactSummary);
  try {
    await reportExecOutputs(options.gateway, options.getLease(), options.result);
  } catch (error) {
    observationWarnings.push(error instanceof Error ? error.message : String(error));
  }
  try {
    await publishCompletionSnapshot({
      gateway: options.gateway,
      lease: options.getLease(),
      result: options.result,
      declaredArtifactSummary,
      observationWarnings,
    });
  } catch (error) {
    observationWarnings.push(error instanceof Error ? error.message : String(error));
  }

  try {
    if (options.result.status === 'succeeded') {
      await options.progressReporter?.append({
        phase: 'run.finalizing',
        status: 'succeeded',
        message: 'Run finalization completed',
        payloadJson: {
          exitCode: options.result.exitCode,
        },
      });
      await options.gateway.completeRun(options.getLease(), {
        status: 'succeeded',
        exitCode: options.result.exitCode,
        ...(Object.keys(declaredArtifactSummary).length ? { declaredArtifacts: declaredArtifactSummary } : {}),
        ...(observationWarnings.length ? { observationWarnings } : {}),
      });
      return 'succeeded';
    }
    if (options.result.status === 'timeout') {
      await options.progressReporter?.append({
        phase: 'run.finalizing',
        status: 'timeout',
        message: 'Run finalization timed out the process',
        payloadJson: {
          exitCode: options.result.exitCode,
          signal: options.result.signal,
        },
      });
      await options.gateway.timeoutRun(options.getLease(), 'Process timeout confirmed by daemon');
      return 'timeout';
    }
    if (options.result.status === 'canceled') {
      await options.progressReporter?.append({
        phase: 'run.finalizing',
        status: 'canceled',
        message: 'Run finalization acknowledged cancellation',
      });
      await options.gateway.cancelAckRun(options.getLease());
      return 'canceled';
    }
    if (options.result.status === 'lease_lost') {
      return 'lease_lost';
    }

    await options.progressReporter?.append({
      phase: 'run.finalizing',
      status: 'failed',
      message: `Run finalization failed after process exited with ${options.result.status}`,
      payloadJson: {
        exitCode: options.result.exitCode,
        signal: options.result.signal,
      },
    });
    await options.gateway.failRun(options.getLease(), `Process exited with ${options.result.status}`, {
      exitCode: options.result.exitCode,
      signal: options.result.signal,
      ...(Object.keys(declaredArtifactSummary).length ? { declaredArtifacts: declaredArtifactSummary } : {}),
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
