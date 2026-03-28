/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModelOperationError } from './repository-internals/errors';

export function respondWithFlowModelOperationError(ctx: any, error: FlowModelOperationError) {
  const responseError: {
    message: string;
    code: string;
    details?: any;
    opId?: string;
    opIndex?: number;
  } = {
    message: error.message,
    code: error.code,
  };

  if (typeof error.details !== 'undefined') {
    responseError.details = error.details;
  }

  const opId =
    typeof error.details?.opId === 'string'
      ? error.details.opId
      : typeof (error as any)?.opId === 'string'
        ? (error as any).opId
        : undefined;
  if (opId) {
    responseError.opId = opId;
  }

  const opIndex =
    typeof error.details?.opIndex === 'number'
      ? error.details.opIndex
      : typeof (error as any)?.opIndex === 'number'
        ? (error as any).opIndex
        : undefined;
  if (typeof opIndex === 'number') {
    responseError.opIndex = opIndex;
  }

  ctx.status = error.status;
  ctx.withoutDataWrapping = true;
  ctx.body = {
    errors: [responseError],
  };
}
