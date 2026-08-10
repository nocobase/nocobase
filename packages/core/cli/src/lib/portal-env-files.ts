/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const PORTAL_SERVER_DEV_ENV_FILE = '.env.server.dev';
export const PORTAL_SERVER_PROD_ENV_FILE = '.env.server.prod';

function upsertEnvContent(content: string, values: Record<string, string>): string {
  const nextValues = { ...values };
  const lines = content ? content.replace(/\r\n/g, '\n').split('\n') : [];
  const result: string[] = [];

  for (const line of lines) {
    if (!line && result.length === lines.length - 1) {
      continue;
    }
    const match = line.match(/^(\s*)([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    const key = match?.[2];
    if (key && Object.prototype.hasOwnProperty.call(nextValues, key)) {
      result.push(`${key}=${nextValues[key]}`);
      delete nextValues[key];
      continue;
    }
    result.push(line);
  }

  for (const [key, value] of Object.entries(nextValues)) {
    result.push(`${key}=${value}`);
  }

  return `${result.join('\n').replace(/\n*$/, '')}\n`;
}

export async function upsertPortalEnvFile(filePath: string, values: Record<string, string>): Promise<void> {
  let content = '';
  try {
    content = await readFile(filePath, 'utf-8');
  } catch {
    content = '';
  }
  await writeFile(filePath, upsertEnvContent(content, values), 'utf-8');
}

export async function updatePortalEnvFiles(params: {
  portalDir: string;
  portal: string;
  apiBaseUrl: string;
}): Promise<void> {
  const values = {
    NOCOBASE_PORTAL_NAME: params.portal,
    NOCOBASE_API_PROXY_TARGET: params.apiBaseUrl,
  };
  await upsertPortalEnvFile(path.join(params.portalDir, PORTAL_SERVER_DEV_ENV_FILE), values);
  await upsertPortalEnvFile(path.join(params.portalDir, PORTAL_SERVER_PROD_ENV_FILE), values);
}
