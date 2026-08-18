/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { parentPort, threadId } from 'node:worker_threads';

import { executeJsTemplateCompileJob } from './JsTemplateCompileJobExecutor';
import type {
  JsTemplateCompileWorkerMessage,
  JsTemplateCompileWorkerRequest,
  JsTemplateCompileWorkerResponse,
} from './JsTemplateCompileWorkerProtocol';

if (!parentPort) {
  throw new Error('JS Template compile worker must run inside a worker thread');
}

const workerPort = parentPort;

async function handleCompileRequest(message: JsTemplateCompileWorkerRequest): Promise<void> {
  if (message.type !== 'compile') {
    return;
  }
  const result = await executeJsTemplateCompileJob({
    job: message.job,
    workerId: message.workerId,
    attempt: message.attempt,
  });
  const response: JsTemplateCompileWorkerResponse = {
    type: 'result',
    result,
  };
  workerPort.postMessage(response);
}

async function handleWorkerMessage(message: JsTemplateCompileWorkerMessage): Promise<void> {
  if (message.type === 'shutdown') {
    const response: JsTemplateCompileWorkerResponse = { type: 'shutdown-complete' };
    workerPort.postMessage(response);
    workerPort.close();
    return;
  }
  await handleCompileRequest(message);
}

workerPort.on('message', (message: JsTemplateCompileWorkerMessage) => {
  handleWorkerMessage(message).catch((error: unknown) => {
    setImmediate(() => {
      throw error;
    });
  });
});

const ready: JsTemplateCompileWorkerResponse = { type: 'ready', threadId };
workerPort.postMessage(ready);
