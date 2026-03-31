/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Shared URL matching logic — used by both server and client.
 */

export function globToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '\0GLOBSTAR\0')
    .replace(/\*/g, '[^/]*')
    .replace(/\0GLOBSTAR\0/g, '.*');
  return new RegExp(`^${escaped}$`);
}

export function compilePattern(pattern: string, mode: string): RegExp | null {
  try {
    return mode === 'regex' ? new RegExp(pattern) : globToRegex(pattern);
  } catch {
    return null;
  }
}

export function matchUrl(pattern: string, mode: string, url: string): boolean {
  const regex = compilePattern(pattern, mode);
  return regex ? regex.test(url) : false;
}
