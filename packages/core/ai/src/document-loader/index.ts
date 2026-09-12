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

export type DocumentLoaderWorkerOptions = {
  filePath: string;
  mimeType?: string;
  /** Timeout in milliseconds for the worker to complete. Defaults to 5 minutes. */
  timeout?: number;
};

const DEFAULT_WORKER_TIMEOUT = 5 * 60 * 1000;

export const loadByWorker = async (extname: string, options: DocumentLoaderWorkerOptions): Promise<Document[]> => {
  const isTsRuntime = __filename.endsWith('.ts');
  const workerPath = path.join(__dirname, `loader.worker.${isTsRuntime ? 'ts' : 'js'}`);
  const worker = new Worker(workerPath, {
    execArgv: isTsRuntime ? ['--require', 'tsx/cjs'] : undefined,
  });
  const timeout = options.timeout ?? DEFAULT_WORKER_TIMEOUT;
  return new Promise<Document[]>((resolve, reject) => {
    let settled = false;
    const close = (error?: Error, result?: Document[]) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      if (error) {
        reject(error);
        return;
      }
      resolve(result || []);
    };

    const timer = setTimeout(() => {
      close(new Error(`Document loading timed out after ${Math.round(timeout / 1000)}s`));
    }, timeout);

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
      filePath: options.filePath,
      mimeType: options.mimeType,
    });
  }).finally(() => {
    worker.terminate().catch(() => undefined);
  });
};
