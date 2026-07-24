/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash } from 'crypto';

import type { RunJSSourceLocator } from './contracts';

export function buildRunJSOwnerFingerprint(input: {
  locator: RunJSSourceLocator;
  ownerUpdatedAt?: unknown;
  selectedLegacyValue: unknown;
  selectedVersion: unknown;
}): string {
  return createHash('sha256')
    .update(
      stableSerialize({
        locator: input.locator,
        ownerUpdatedAt: input.ownerUpdatedAt ?? null,
        selectedLegacyValue: input.selectedLegacyValue ?? null,
        selectedVersion: input.selectedVersion ?? null,
      }),
    )
    .digest('hex');
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}
