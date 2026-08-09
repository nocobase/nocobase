/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const APP_CLIENT_ENTRY_MODES = [
  'legacy-default',
  'modern-default',
  'modern-only',
  'settings-default',
] as const;

export const PUBLIC_APP_CLIENT_ENTRY_MODES = ['legacy-default', 'modern-default', 'modern-only'] as const;

export type AppClientEntryMode = (typeof APP_CLIENT_ENTRY_MODES)[number];
export type PublicAppClientEntryMode = (typeof PUBLIC_APP_CLIENT_ENTRY_MODES)[number];

export function normalizeAppClientEntryMode(value: unknown): AppClientEntryMode | undefined {
  const text = String(value ?? '').trim();
  return APP_CLIENT_ENTRY_MODES.includes(text as AppClientEntryMode) ? (text as AppClientEntryMode) : undefined;
}

export function normalizePublicAppClientEntryMode(value: unknown): PublicAppClientEntryMode | undefined {
  const text = String(value ?? '').trim();
  return PUBLIC_APP_CLIENT_ENTRY_MODES.includes(text as PublicAppClientEntryMode)
    ? (text as PublicAppClientEntryMode)
    : undefined;
}

export function defaultAppClientEntryModeForDownloadVersion(version: unknown): PublicAppClientEntryMode {
  return String(version ?? '').trim() === 'latest' ? 'legacy-default' : 'modern-only';
}
