import type { ProviderSendResult } from '../types.js';

import { sanitizeProviderErrorMessage } from '../error.js';

export async function evaluateJsonResult(
  response: Response,
  fields: {
    readonly code: readonly (readonly string[])[];
    readonly message: readonly (readonly string[])[];
    readonly success: (code: unknown) => boolean;
  },
): Promise<ProviderSendResult> {
  const body: unknown = await response.json();
  const code = firstNestedValue(body, fields.code);
  if (fields.success(code)) return { status: 'accepted' };
  const message = firstNestedValue(body, fields.message);
  const messageText = typeof message === 'string' ? message : undefined;
  const category = providerCategory(code, messageText);
  return {
    status: 'failed',
    disposition:
      category === 'rate_limit' ||
      (category === 'provider' && isTransientProviderError(code, messageText))
        ? 'same_provider'
        : 'never',
    error: {
      code: scalarString(code),
      category,
      message:
        typeof message === 'string'
          ? sanitizeProviderErrorMessage(
              message,
              'IM Provider rejected the message.',
            )
          : 'IM Provider rejected the message.',
    },
  };
}

function firstNestedValue(
  value: unknown,
  paths: readonly (readonly string[])[],
): unknown {
  for (const path of paths) {
    const nested = nestedValue(value, path);
    if (nested !== undefined) return nested;
  }
  return undefined;
}

function nestedValue(value: unknown, path: readonly string[]): unknown {
  let current = value;
  for (const key of path) {
    if (!current || typeof current !== 'object' || !(key in current))
      return undefined;
    current = current[key as keyof typeof current];
  }
  return current;
}

function providerCategory(
  code: unknown,
  message?: string,
): 'authentication' | 'provider' | 'rate_limit' {
  const normalized = scalarString(code)?.toLowerCase() ?? '';
  const detail = message?.toLowerCase() ?? '';
  if (
    normalized === '429' ||
    normalized === '45009' ||
    includesAny(detail, [
      'rate limit',
      'too many',
      'frequency',
      'frequent',
      '限流',
      '频率',
      '频繁',
    ])
  )
    return 'rate_limit';
  return normalized.includes('token') ||
    normalized.includes('sign') ||
    detail.includes('token') ||
    detail.includes('sign')
    ? 'authentication'
    : 'provider';
}

function isTransientProviderError(code: unknown, message?: string): boolean {
  return (
    scalarString(code) === '-1' ||
    includesAny(message?.toLowerCase() ?? '', [
      'system busy',
      'internal error',
      'temporarily unavailable',
      '系统繁忙',
    ])
  );
}

function includesAny(value: string, fragments: readonly string[]): boolean {
  return fragments.some((fragment) => value.includes(fragment));
}

function scalarString(value: unknown): string | undefined {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : undefined;
}
