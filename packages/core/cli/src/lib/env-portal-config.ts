/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type EnvPortalConfigEntry = {
  path?: string;
};

export type EnvPortalsConfig = Record<string, EnvPortalConfigEntry>;

function trimValue(value: unknown): string {
  return String(value ?? '').trim();
}

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function normalizeEnvPortalsConfig(value: unknown): EnvPortalsConfig | undefined {
  const input = readRecord(value);
  const portals: EnvPortalsConfig = {};

  for (const [portal, rawEntry] of Object.entries(input)) {
    const portalName = trimValue(portal);
    if (!portalName) {
      continue;
    }
    const entry = readRecord(rawEntry);
    const portalPath = trimValue(entry.path);
    if (portalPath) {
      portals[portalName] = { path: portalPath };
    }
  }

  return Object.keys(portals).length > 0 ? portals : undefined;
}

