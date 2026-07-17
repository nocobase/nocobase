/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { parentPort, threadId } from 'node:worker_threads';

import { executeLightExtensionCompileJob } from './LightExtensionCompileJobExecutor';
import type {
  LightExtensionCompileWorkerRequest,
  LightExtensionCompileWorkerResponse,
} from './LightExtensionCompileWorkerProtocol';

if (!parentPort) {
  throw new Error('Light extension compile worker must run inside a worker thread');
}

const workerPort = parentPort;

async function handleCompileRequest(message: LightExtensionCompileWorkerRequest): Promise<void> {
  if (message.type !== 'compile') {
    return;
  }
  const result = await executeLightExtensionCompileJob({
    job: message.job,
    workerId: message.workerId,
    attempt: message.attempt,
  });
  const response: LightExtensionCompileWorkerResponse = {
    type: 'result',
    result,
  };
  workerPort.postMessage(response);
}

workerPort.on('message', (message: LightExtensionCompileWorkerRequest) => {
  handleCompileRequest(message).catch((error: unknown) => {
    setImmediate(() => {
      throw error;
    });
  });
});

const ready: LightExtensionCompileWorkerResponse = { type: 'ready', threadId };
workerPort.postMessage(ready);
