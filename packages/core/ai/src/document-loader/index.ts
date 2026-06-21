/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Document } from '@langchain/core/documents';
import { Worker } from 'node:worker_threads';
import path from 'node:path';

export const loadByWorker = async (extname: string, blob: Blob): Promise<Document[]> => {
  const buffer = Buffer.from(await blob.arrayBuffer());
  const isTsRuntime = __filename.endsWith('.ts');
  const workerPath = path.join(__dirname, `loader.worker.${isTsRuntime ? 'ts' : 'js'}`);
  const worker = new Worker(workerPath, {
    execArgv: isTsRuntime ? ['--require', 'tsx/cjs'] : undefined,
  });
  return new Promise<Document[]>((resolve, reject) => {
    let settled = false;
    const close = (error?: Error, result?: Document[]) => {
      if (settled) {
        return;
      }
      settled = true;
      if (error) {
        reject(error);
        return;
      }
      resolve(result || []);
    };

    worker.once('message', (payload: { documents?: Document[]; error?: string }) => {
      if (payload?.error) {
        close(new Error(payload.error));
        return;
      }
      close(undefined, payload?.documents || []);
    });
    worker.once('error', (error) => close(error));
    worker.once('exit', (code) => {
      if (!settled && code !== 0) {
        close(new Error(`Document loader worker exited with code ${code}`));
      }
    });

    worker.postMessage({
      extname,
      mimeType: blob.type,
      buffer: Uint8Array.from(buffer),
    });
  }).finally(() => {
    worker.terminate().catch(() => undefined);
  });
};
