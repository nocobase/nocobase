/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type RunJSRuntimeError = {
  code?: string;
  status?: number;
  reasonCode?: string;
  message?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function toNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function getFirstServerError(value: unknown): Record<string, unknown> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  if (Array.isArray(value.errors) && isRecord(value.errors[0])) {
    return value.errors[0];
  }
  return isRecord(value.error) ? value.error : undefined;
}

export function readRunJSRuntimeError(error: unknown): RunJSRuntimeError {
  if (!isRecord(error)) {
    return typeof error === 'string' ? { message: error } : {};
  }

  const response = isRecord(error.response) ? error.response : undefined;
  const serverError = getFirstServerError(response?.data) || getFirstServerError(error);
  const details = isRecord(serverError?.details) ? serverError.details : undefined;
  const code = toNonEmptyString(serverError?.code) || toNonEmptyString(error.code);
  const status = serverError
    ? toNumber(serverError.status) ?? toNumber(response?.status) ?? toNumber(error.status)
    : toNumber(error.status) ?? toNumber(response?.status);
  const reasonCode = toNonEmptyString(details?.reasonCode);
  const message = toNonEmptyString(serverError?.message) || toNonEmptyString(error.message);

  return {
    ...(code ? { code } : {}),
    ...(status !== undefined ? { status } : {}),
    ...(reasonCode ? { reasonCode } : {}),
    ...(message ? { message } : {}),
  };
}
