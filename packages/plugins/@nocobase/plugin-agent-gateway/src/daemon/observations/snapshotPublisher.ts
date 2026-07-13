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
import type { JsonRecord, RunLease } from '../types';

export async function publishCompletionSnapshot(options: {
  gateway: AgentGatewayDaemonNodeClient;
  lease: RunLease;
  result: ExecDriverResult;
  declaredArtifactSummary: JsonRecord;
  observationWarnings: string[];
}) {
  await options.gateway.registerSnapshot(options.lease, {
    snapshotType: 'agent',
    snapshotJson: {
      status: options.result.status,
      exitCode: options.result.exitCode,
      signal: options.result.signal,
      ...(Object.keys(options.declaredArtifactSummary).length
        ? { declaredArtifacts: options.declaredArtifactSummary }
        : {}),
      ...(options.observationWarnings.length ? { observationWarnings: options.observationWarnings } : {}),
    },
  });
}
