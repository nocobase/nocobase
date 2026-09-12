/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type ErrorResponseData = {
  errors?: Array<{ message?: unknown }>;
  messages?: Array<{ message?: unknown } | unknown>;
  error?: { message?: unknown };
  message?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getNestedRecord(value: unknown, path: string[]): Record<string, unknown> | undefined {
  let current: unknown = value;
  for (const key of path) {
    if (!isRecord(current)) {
      return undefined;
    }
    current = current[key];
  }
  return isRecord(current) ? current : undefined;
}

function getNestedValue(value: unknown, path: string[]): unknown {
  let current: unknown = value;
  for (const key of path) {
    if (!isRecord(current)) {
      return undefined;
    }
    current = current[key];
  }
  return current;
}

function normalizeMessage(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}

function getMessages(messages: ErrorResponseData['messages']) {
  if (!Array.isArray(messages)) {
    return undefined;
  }
  const text = messages
    .map((item) => (isRecord(item) ? item.message : item))
    .filter((item): item is string => typeof item === 'string' && Boolean(item))
    .join('\n');
  return text || undefined;
}

function getErrors(errors: ErrorResponseData['errors']) {
  if (!Array.isArray(errors)) {
    return undefined;
  }
  const text = errors
    .map((item) => item.message)
    .filter((item): item is string => typeof item === 'string' && Boolean(item))
    .join('\n');
  return text || undefined;
}

function getResponseData(error: unknown) {
  return getNestedRecord(error, ['response', 'data']) as ErrorResponseData | undefined;
}

export function isFormValidationError(error: unknown) {
  return Array.isArray(getNestedValue(error, ['errorFields']));
}

export function getErrorMessage(error: unknown, fallback?: string) {
  if (typeof error === 'string') {
    return error;
  }
  const responseData = getResponseData(error);
  const message =
    normalizeMessage(getNestedValue(error, ['errorFields', '0', 'errors', '0'])) ||
    getErrors(responseData?.errors) ||
    getMessages(responseData?.messages) ||
    normalizeMessage(responseData?.error?.message) ||
    normalizeMessage(responseData?.message) ||
    normalizeMessage(getNestedValue(error, ['message']));

  return message || fallback;
}

export function getResponseErrorMessage(response: unknown) {
  const data = getNestedRecord(response, ['data']) as ErrorResponseData | undefined;
  return (
    getErrors(data?.errors) ||
    getMessages(data?.messages) ||
    normalizeMessage(data?.error?.message) ||
    normalizeMessage(data?.message)
  );
}
