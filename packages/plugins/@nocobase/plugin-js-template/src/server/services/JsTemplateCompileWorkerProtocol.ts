/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { JsTemplateCompileJob, JsTemplateCompileResult } from './JsTemplateCompileContract';

export interface JsTemplateCompileWorkerRequest {
  type: 'compile';
  workerId: number;
  attempt: number;
  job: JsTemplateCompileJob;
}

export interface JsTemplateCompileWorkerShutdownRequest {
  type: 'shutdown';
}

export type JsTemplateCompileWorkerMessage = JsTemplateCompileWorkerRequest | JsTemplateCompileWorkerShutdownRequest;

export type JsTemplateCompileWorkerResponse =
  | {
      type: 'result';
      result: JsTemplateCompileResult;
    }
  | {
      type: 'ready';
      threadId: number;
    }
  | {
      type: 'shutdown-complete';
    };
