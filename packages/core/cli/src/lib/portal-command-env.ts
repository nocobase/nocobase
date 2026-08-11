/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const PORTAL_COMMAND_BASE_ENV_KEYS = [
  'PATH',
  'Path',
  'PATHEXT',
  'SystemRoot',
  'WINDIR',
  'ComSpec',
  'HOME',
  'USERPROFILE',
  'TMPDIR',
  'TEMP',
  'TMP',
] as const;

export function buildPortalCommandEnv(env: Record<string, string> = {}): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of PORTAL_COMMAND_BASE_ENV_KEYS) {
    const value = process.env[key];
    if (value) {
      out[key] = value;
    }
  }
  return { ...out, ...env };
}

export function buildPortalTemplateCommandEnv(params: {
  portal: string;
  portalBase: string;
  apiBaseUrl: string;
  apiUrl: string;
}): Record<string, string> {
  return {
    NOCOBASE_PORTAL_NAME: params.portal,
    NOCOBASE_API_PROXY_TARGET: params.apiBaseUrl,
    NOCOBASE_PORTAL_BASE: params.portalBase,
    NOCOBASE_API_URL: params.apiUrl,
  };
}
