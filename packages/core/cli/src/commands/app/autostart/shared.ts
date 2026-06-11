/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { AuthConfig, EnvConfigEntry } from '../../../lib/auth-store.js';
import { loadExactAuthConfig, saveAuthConfig } from '../../../lib/auth-store.js';

export function isAutostartEnabled(config?: Pick<EnvConfigEntry, 'autostart'>): boolean {
  return config?.autostart?.enabled === true;
}

export function ensureManagedAutostartRuntime(config: EnvConfigEntry & { name?: string }): void {
  const kind = String(config.kind ?? '').trim();
  const source = String(config.source ?? '').trim();
  const inferredLocal = source === 'npm' || source === 'git' || source === 'local';
  if (kind === 'local' || kind === 'docker' || (!kind && (source === 'docker' || inferredLocal))) {
    return;
  }

  const envName = String(config.name ?? '').trim() || 'unknown';
  throw new Error(
    [
      `Env "${envName}" cannot be added to app autostart.`,
      'Only local and Docker envs with CLI-managed app runtimes can be started automatically on this machine.',
    ].join('\n'),
  );
}

export async function updateAutostartSetting(
  envName: string,
  enabled: boolean,
): Promise<{ config: AuthConfig; changed: boolean }> {
  const config = await loadExactAuthConfig();
  const previous = config.envs[envName];

  if (!previous) {
    throw new Error(`Env "${envName}" is not configured`);
  }

  ensureManagedAutostartRuntime({ ...previous, name: envName });

  const next = { ...previous };
  const wasEnabled = isAutostartEnabled(previous);
  if (enabled) {
    next.autostart = { enabled: true };
  } else {
    delete next.autostart;
  }

  config.envs[envName] = next;

  if (wasEnabled !== enabled) {
    await saveAuthConfig(config);
  }

  return {
    config,
    changed: wasEnabled !== enabled,
  };
}
