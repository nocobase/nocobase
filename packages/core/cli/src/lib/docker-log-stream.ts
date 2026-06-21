/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { spawn } from 'node:child_process';

const DEFAULT_DOCKER_LOG_TAIL = 50;

export function startDockerLogFollower(
  containerName: string,
  options?: {
    tail?: number;
  },
): { stop: () => Promise<void> } {
  const tail = Math.max(0, options?.tail ?? DEFAULT_DOCKER_LOG_TAIL);
  const child = spawn('docker', ['logs', '--tail', String(tail), '--follow', containerName], {
    stdio: 'inherit',
  });

  let settled = false;
  let resolveClosed!: () => void;
  const closed = new Promise<void>((resolve) => {
    resolveClosed = resolve;
  });
  const settle = () => {
    if (!settled) {
      settled = true;
      resolveClosed();
    }
  };

  child.once('error', settle);
  child.once('close', settle);

  return {
    stop: async () => {
      if (settled) {
        return;
      }

      try {
        if (!child.kill()) {
          settle();
        }
      } catch {
        settle();
      }

      await closed;
    },
  };
}
