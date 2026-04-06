/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export class FlowSurfaceBadRequestError extends Error {
  status = 400;

  constructor(message: string) {
    super(message);
    this.name = 'FlowSurfaceBadRequestError';
  }
}

export function isFlowSurfaceBadRequestError(error: unknown): error is FlowSurfaceBadRequestError {
  return error instanceof FlowSurfaceBadRequestError;
}

export function throwBadRequest(message: string): never {
  throw new FlowSurfaceBadRequestError(message);
}
