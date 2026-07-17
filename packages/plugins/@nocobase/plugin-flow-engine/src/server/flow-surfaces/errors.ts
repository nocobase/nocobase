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
  index?: number;
  message: string;
  type: FlowSurfaceErrorType;
  code: string;
  status: number;
  path?: string;
  ruleId?: string;
  details?: Record<string, any>;
}

export type FlowSurfaceErrorItemInput = Omit<FlowSurfaceErrorItem, 'type' | 'code' | 'status'> &
  Partial<Pick<FlowSurfaceErrorItem, 'type' | 'code' | 'status'>>;

export type FlowSurfaceErrorOptions = {
  path?: string;
  ruleId?: string;
  details?: Record<string, any>;
};

export class FlowSurfaceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly type: FlowSurfaceErrorType,
    public readonly code: string,
    public readonly options: FlowSurfaceErrorOptions = {},
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
  constructor(message: string, code?: string, options: FlowSurfaceErrorOptions = {}) {
    super(message, 400, 'bad_request', code || 'FLOW_SURFACE_BAD_REQUEST', options);
    this.name = 'FlowSurfaceBadRequestError';
  }
}

export class FlowSurfaceForbiddenError extends FlowSurfaceError {
  constructor(message: string, code = 'FLOW_SURFACE_FORBIDDEN', options: FlowSurfaceErrorOptions = {}) {
    super(message, 403, 'forbidden', code, options);
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

export class FlowSurfaceAggregateError extends FlowSurfaceError {
  public readonly errors: FlowSurfaceErrorItem[];

  constructor(errors: FlowSurfaceErrorItemInput[], message?: string) {
    const normalizedErrors = errors.map((error, index) =>
      normalizeFlowSurfaceErrorItemInput({
        ...error,
        index: index + 1,
      }),
    );
    super(
      message || buildAggregateBadRequestMessage(normalizedErrors.length),
      400,
      'bad_request',
      'FLOW_SURFACE_AUTHORING_VALIDATION_FAILED',
    );
    this.name = 'FlowSurfaceAggregateError';
    this.errors = normalizedErrors;
  }

  toResponseBody() {
    return {
      message: this.message,
      errorCount: this.errors.length,
      details: buildAggregateBadRequestDetails(this.errors),
      errors: this.errors,
    };
  }
}

export function isFlowSurfaceError(error: unknown): error is FlowSurfaceError {
  return error instanceof FlowSurfaceError;
}

export function isFlowSurfaceBadRequestError(error: unknown): error is FlowSurfaceBadRequestError {
  return error instanceof FlowSurfaceBadRequestError;
}

export function isFlowSurfaceAggregateError(error: unknown): error is FlowSurfaceAggregateError {
  return error instanceof FlowSurfaceAggregateError;
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
  return buildDefinedErrorItem({
    message: error.message,
    type: error.type,
    code: error.code,
    status: error.status,
    path: error.options.path,
    ruleId: error.options.ruleId,
    details: error.options.details,
  });
}

export function normalizeFlowSurfaceError(error: unknown): FlowSurfaceError {
  if (error instanceof FlowSurfaceError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  return new FlowSurfaceInternalError(message);
}

export function throwBadRequest(
  message: string,
  codeOrOptions?: string | FlowSurfaceErrorOptions,
  options: FlowSurfaceErrorOptions = {},
): never {
  if (typeof codeOrOptions === 'object' && codeOrOptions) {
    throw new FlowSurfaceBadRequestError(message, undefined, codeOrOptions);
  }
  const code = typeof codeOrOptions === 'string' ? codeOrOptions : undefined;
  throw new FlowSurfaceBadRequestError(message, code, options);
}

export function throwAggregateBadRequest(errors: FlowSurfaceErrorItemInput[]): never {
  throw new FlowSurfaceAggregateError(errors);
}

export function throwForbidden(message: string, code?: string, options: FlowSurfaceErrorOptions = {}): never {
  throw new FlowSurfaceForbiddenError(message, code, options);
}

export function throwConflict(message: string, code?: string): never {
  throw new FlowSurfaceConflictError(message, code);
}

export function throwInternalError(message: string, code?: string): never {
  throw new FlowSurfaceInternalError(message, code);
}

function buildDefinedErrorItem(input: FlowSurfaceErrorItem): FlowSurfaceErrorItem {
  const output: FlowSurfaceErrorItem = {
    message: input.message,
    type: input.type,
    code: input.code,
    status: input.status,
  };
  if (typeof input.index !== 'undefined') {
    output.index = input.index;
  }
  if (typeof input.path !== 'undefined') {
    output.path = input.path;
  }
  if (typeof input.ruleId !== 'undefined') {
    output.ruleId = input.ruleId;
  }
  if (typeof input.details !== 'undefined') {
    output.details = input.details;
  }
  return output;
}

function normalizeFlowSurfaceErrorItemInput(input: FlowSurfaceErrorItemInput): FlowSurfaceErrorItem {
  return buildDefinedErrorItem({
    message: input.message,
    index: input.index,
    type: input.type || 'bad_request',
    code: input.code || 'FLOW_SURFACE_AUTHORING_VALIDATION_ERROR',
    status: input.status || 400,
    path: input.path,
    ruleId: input.ruleId,
    details: input.details,
  });
}

function buildAggregateBadRequestMessage(errorCount: number) {
  return `flowSurfaces authoring validation failed with ${errorCount} error(s); fix all errors before retrying the same write`;
}

function buildAggregateBadRequestDetails(errors: FlowSurfaceErrorItem[]) {
  const requiredBlockTypes = Array.from(
    new Set(
      errors
        .map((error) => error.details?.requiredBlockType)
        .filter(
          (requiredBlockType): requiredBlockType is string =>
            typeof requiredBlockType === 'string' && !!requiredBlockType,
        ),
    ),
  );

  return {
    errorCount: errors.length,
    mustFixAllErrorsBeforeRetry: true,
    retryPolicy: 'fix_all_errors_before_retry_same_write',
    sameWriteRetryRequired: true,
    agentInstruction:
      'Read the complete errors[] array. Fix every listed error in one payload revision before retrying the same write. Do not fix only the first error and immediately retry. Do not drop, defer, or replace required chart, jsBlock, or JS/RunJS work to bypass validation.',
    ...(requiredBlockTypes.length
      ? {
          requiredBlockPolicy: {
            requiredBlockTypes,
            fixStrategy: 'repair_same_block_type',
            doNotReplaceOrDrop: true,
          },
        }
      : {}),
  };
}
