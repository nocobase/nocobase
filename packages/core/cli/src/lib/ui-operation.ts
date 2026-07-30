/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const UI_OPERATION_QUERY_KEY = '_operation_';
export const UI_OPERATION_VERSION = 1;
const MAX_UI_OPERATION_ENCODED_LENGTH = 8 * 1024;

export interface UIOperation<
  TOperationId extends string = string,
  TParams extends Record<string, unknown> = Record<string, unknown>,
> {
  v: typeof UI_OPERATION_VERSION;
  operationId: TOperationId;
  params?: TParams;
}

export interface UIOperationCodec {
  encode(value: string): string;
  decode(value: string): string | undefined;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function encodeUIOperation(operation: UIOperation, codec: UIOperationCodec): string {
  if (
    !isPlainObject(operation) ||
    operation.v !== UI_OPERATION_VERSION ||
    typeof operation.operationId !== 'string' ||
    !operation.operationId ||
    (operation.params !== undefined && !isPlainObject(operation.params))
  ) {
    throw new TypeError('Invalid UI operation.');
  }

  const encoded = codec.encode(JSON.stringify(operation));
  if (encoded.length > MAX_UI_OPERATION_ENCODED_LENGTH) {
    throw new RangeError(`UI operation exceeds the ${MAX_UI_OPERATION_ENCODED_LENGTH}-byte encoded length limit.`);
  }

  return encoded;
}
