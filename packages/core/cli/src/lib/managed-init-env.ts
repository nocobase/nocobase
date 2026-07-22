/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { EnvConfigEntry } from './auth-store.js';

export type ManagedSetupState = 'prepared' | 'installed';

function trimValue(value: unknown): string {
  return String(value ?? '').trim();
}

export function resolveManagedSetupState(value: unknown): ManagedSetupState | undefined {
  return value === 'prepared' || value === 'installed' ? value : undefined;
}

export function isPreparedSetupState(value: unknown): boolean {
  return resolveManagedSetupState(value) === 'prepared';
}

export function buildInitAppEnvVarsFromConfig(
  config?: Pick<EnvConfigEntry, 'rootUsername' | 'rootEmail' | 'rootPassword' | 'rootNickname'> & {
    lang?: string;
    developmentMode?: string;
    portalName?: string;
    portalTemplate?: string;
  },
): Record<string, string> {
  const out: Record<string, string> = {};
  const put = (key: string, value: unknown) => {
    const text = trimValue(value);
    if (text) {
      out[key] = text;
    }
  };

  put('INIT_APP_LANG', config?.lang);
  put('INIT_ROOT_USERNAME', config?.rootUsername);
  put('INIT_ROOT_EMAIL', config?.rootEmail);
  put('INIT_ROOT_PASSWORD', config?.rootPassword);
  put('INIT_ROOT_NICKNAME', config?.rootNickname);
  put('INIT_DEVELOPMENT_MODE', config?.developmentMode);
  put('INIT_PORTAL_NAME', config?.portalName);
  put('INIT_PORTAL_TEMPLATE', config?.portalTemplate);
  return out;
}
