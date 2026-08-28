/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { spawn } from 'node:child_process';

export async function openUrlInDefaultBrowser(url: string): Promise<boolean> {
  const [command, args, options] =
    process.platform === 'darwin'
      ? ['open', [url], { detached: true, stdio: 'ignore' as const }]
      : process.platform === 'win32'
        ? ['cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' as const, windowsHide: true }]
        : ['xdg-open', [url], { detached: true, stdio: 'ignore' as const }];

  return new Promise((resolve) => {
    try {
      const child = spawn(command, args, options);
      child.once('error', () => resolve(false));
      child.once('spawn', () => {
        child.unref();
        resolve(true);
      });
    } catch {
      resolve(false);
    }
  });
}
