/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { APIResponse, Page } from '@playwright/test';

export type RootApiSession = {
  token: string;
  locale: string;
  authenticator: 'basic';
  role: 'root';
  headers: Record<string, string>;
};

export type RootApiSignInOptions = {
  account?: string;
  password?: string;
  locale?: string;
};

type BrowserStorageValues = {
  token: string;
  locale: string;
  authenticator: string;
  role: string;
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function unwrapApiData<T>(body: unknown): T {
  if (!isRecord(body) || !Object.prototype.hasOwnProperty.call(body, 'data')) {
    return body as T;
  }

  const first = body.data;
  if (isRecord(first) && Object.prototype.hasOwnProperty.call(first, 'data')) {
    return first.data as T;
  }
  return first as T;
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function assertApiResponseOk(response: APIResponse, operation: string): Promise<void> {
  if (response.ok()) {
    return;
  }

  const responseText = await response.text();
  throw new Error(`${operation} failed with HTTP ${response.status()}: ${responseText}`);
}

export async function readApiResponse<T>(response: APIResponse, operation: string): Promise<T> {
  await assertApiResponseOk(response, operation);
  const body: unknown = await response.json();
  return unwrapApiData<T>(body);
}

export async function signInRootApi(page: Page, options: RootApiSignInOptions = {}): Promise<RootApiSession> {
  const locale = options.locale || 'en-US';
  const authenticator = 'basic' as const;
  const role = 'root' as const;
  const response = await page.request.post('/api/auth:signIn', {
    headers: {
      'X-Authenticator': authenticator,
      'X-Locale': locale,
    },
    data: {
      account: options.account || process.env.INIT_ROOT_USERNAME || 'nocobase',
      password: options.password || process.env.INIT_ROOT_PASSWORD || 'admin123',
    },
  });
  const result = await readApiResponse<unknown>(response, 'Root API sign-in');
  if (!isRecord(result) || typeof result.token !== 'string' || !result.token) {
    throw new Error('Root API sign-in response does not contain a token');
  }

  return {
    token: result.token,
    locale,
    authenticator,
    role,
    headers: {
      Authorization: `Bearer ${result.token}`,
      'X-Authenticator': authenticator,
      'X-Locale': locale,
      'X-Role': role,
      'X-Timezone': '+08:00',
      'X-With-Acl-Meta': 'true',
    },
  };
}

function writeBrowserStorage(values: BrowserStorageValues): void {
  window.localStorage.setItem('NOCOBASE_TOKEN', values.token);
  window.localStorage.setItem('NOCOBASE_LOCALE', values.locale);
  window.localStorage.setItem('NOCOBASE_AUTH', values.authenticator);
  window.localStorage.setItem('NOCOBASE_ROLE', values.role);
  window.localStorage.setItem('NOCOBASE_DESIGNABLE', 'true');
  window.localStorage.setItem('NOCOBASE_V2_FLOW_SETTINGS_ENABLED', '1');
}

export async function installRootBrowserSession(page: Page, session: RootApiSession): Promise<void> {
  const values: BrowserStorageValues = {
    token: session.token,
    locale: session.locale,
    authenticator: session.authenticator,
    role: session.role,
  };

  await page.addInitScript(writeBrowserStorage, values);
  if (/^https?:\/\//u.test(page.url())) {
    await page.evaluate(writeBrowserStorage, values);
  }
}

export async function signInRootApiAndInstallBrowserSession(
  page: Page,
  options: RootApiSignInOptions = {},
): Promise<RootApiSession> {
  const session = await signInRootApi(page, options);
  await installRootBrowserSession(page, session);
  return session;
}
