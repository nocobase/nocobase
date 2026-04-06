/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type FlowSurfaceErrorType = 'bad_request' | 'forbidden' | 'conflict' | 'internal_error';

export interface FlowSurfaceErrorItem {
  message: string;
  type: FlowSurfaceErrorType;
  code: string;
  status: number;
}

export class FlowSurfaceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly type: FlowSurfaceErrorType,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'FlowSurfaceError';
  }

  toResponseBody() {
    return {
      errors: [toFlowSurfaceErrorItem(this)],
    };
  }
}

export class FlowSurfaceBadRequestError extends FlowSurfaceError {
  constructor(message: string, code = 'FLOW_SURFACE_BAD_REQUEST') {
    super(message, 400, 'bad_request', code);
    this.name = 'FlowSurfaceBadRequestError';
  }
}

export class FlowSurfaceForbiddenError extends FlowSurfaceError {
  constructor(message: string, code = 'FLOW_SURFACE_FORBIDDEN') {
    super(message, 403, 'forbidden', code);
    this.name = 'FlowSurfaceForbiddenError';
  }
}

export class FlowSurfaceConflictError extends FlowSurfaceError {
  constructor(message: string, code = 'FLOW_SURFACE_CONFLICT') {
    super(message, 409, 'conflict', code);
    this.name = 'FlowSurfaceConflictError';
  }
}

export class FlowSurfaceInternalError extends FlowSurfaceError {
  constructor(message: string, code = 'FLOW_SURFACE_INTERNAL_ERROR') {
    super(message, 500, 'internal_error', code);
    this.name = 'FlowSurfaceInternalError';
  }
}

export function isFlowSurfaceError(error: unknown): error is FlowSurfaceError {
  return error instanceof FlowSurfaceError;
}

export function isFlowSurfaceBadRequestError(error: unknown): error is FlowSurfaceBadRequestError {
  return error instanceof FlowSurfaceBadRequestError;
}

export function isFlowSurfaceForbiddenError(error: unknown): error is FlowSurfaceForbiddenError {
  return error instanceof FlowSurfaceForbiddenError;
}

export function isFlowSurfaceConflictError(error: unknown): error is FlowSurfaceConflictError {
  return error instanceof FlowSurfaceConflictError;
}

export function isFlowSurfaceInternalError(error: unknown): error is FlowSurfaceInternalError {
  return error instanceof FlowSurfaceInternalError;
}

export function toFlowSurfaceErrorItem(error: FlowSurfaceError): FlowSurfaceErrorItem {
  return {
    message: error.message,
    type: error.type,
    code: error.code,
    status: error.status,
  };
}

export function normalizeFlowSurfaceError(error: unknown): FlowSurfaceError {
  if (error instanceof FlowSurfaceError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  return new FlowSurfaceInternalError(message);
}

export function throwBadRequest(message: string, code?: string): never {
  throw new FlowSurfaceBadRequestError(message, code);
}

export function throwForbidden(message: string, code?: string): never {
  throw new FlowSurfaceForbiddenError(message, code);
}

export function throwConflict(message: string, code?: string): never {
  throw new FlowSurfaceConflictError(message, code);
}

export function throwInternalError(message: string, code?: string): never {
  throw new FlowSurfaceInternalError(message, code);
}
