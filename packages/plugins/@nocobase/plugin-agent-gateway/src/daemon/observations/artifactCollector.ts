/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { AgentGatewayDaemonNodeClient } from '../gateway';
import { reportDeclaredArtifacts } from '../runArtifacts';
import type { JsonRecord, RunLease } from '../types';

export interface ArtifactCollector {
  collect(options: { payload: JsonRecord; cwd: string }): Promise<JsonRecord>;
}

export function createArtifactCollector(options: {
  gateway: AgentGatewayDaemonNodeClient;
  getLease(): RunLease;
}): ArtifactCollector {
  return {
    collect: async ({ payload, cwd }) => {
      return await reportDeclaredArtifacts({
        gateway: options.gateway,
        getLease: options.getLease,
        payload,
        cwd,
      });
    },
  };
}
