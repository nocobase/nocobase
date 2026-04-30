/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Flags } from '@oclif/core';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getEnvAsync, getInstanceIdAsync, keyDecrypt } from '@nocobase/license-kit';
import isEqual from 'lodash/isEqual';
import omit from 'lodash/omit';
import type { ManagedAppRuntime } from '../../lib/app-runtime.js';
import { formatMissingManagedAppEnvMessage, resolveManagedAppRuntime } from '../../lib/app-runtime.js';
import { appUrl } from '../env/shared.js';

export const licenseEnvFlag = Flags.string({
  char: 'e',
  description: 'CLI env name (from `nb env` / `nb init`). Defaults to the current env when omitted',
});

export const licenseJsonFlag = Flags.boolean({
  description: 'Output the result as JSON',
  default: false,
});

const DEFAULT_LICENSE_PKG_URL = 'https://pkg.nocobase.com/';

export const licensePkgUrlFlag = Flags.string({
  description: 'Commercial package service base URL',
  default: DEFAULT_LICENSE_PKG_URL,
  hidden: true,
});

export type LicenseStatus = 'active' | 'invalid';

export type LicenseKeyData = {
  accessKeyId?: string;
  accessKeySecret?: string;
  service?: {
    domain?: string;
    headers?: Record<string, string>;
  };
  licenseKey?: {
    domain?: string;
    licenseStatus?: string;
    [key: string]: unknown;
  };
  instanceData?: {
    sys?: string;
    osVer?: string;
    db?: {
      id?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type LicenseValidationResult = {
  current: {
    env: any;
    domain: string;
  };
  keyData?: LicenseKeyData;
  keyStatus?: 'invalid' | 'notfound';
  dbMatch: boolean;
  sysMatch: boolean;
  envMatch: boolean;
  domainMatch: boolean;
  licenseStatus: LicenseStatus;
};

export async function requireLicenseRuntime(envName?: string): Promise<ManagedAppRuntime> {
  const runtime = await resolveManagedAppRuntime(envName);
  if (!runtime) {
    throw new Error(formatMissingManagedAppEnvMessage(envName));
  }
  return runtime;
}

export function resolveLicenseDir(runtime: ManagedAppRuntime): string {
  return path.resolve(runtime.env.storagePath, '.license');
}

export function resolveInstanceIdFile(runtime: ManagedAppRuntime): string {
  return path.resolve(resolveLicenseDir(runtime), 'instance-id');
}

export function resolveLicenseKeyFile(runtime: ManagedAppRuntime): string {
  return path.resolve(resolveLicenseDir(runtime), 'license-key');
}

export async function readSavedInstanceId(runtime: ManagedAppRuntime): Promise<string | undefined> {
  try {
    const value = await readFile(resolveInstanceIdFile(runtime), 'utf8');
    const normalized = value.trim();
    return normalized || undefined;
  } catch {
    return undefined;
  }
}

async function withLicenseEnv<T>(runtime: ManagedAppRuntime, task: () => Promise<T>): Promise<T> {
  const previous: Record<string, string | undefined> = {};
  const nextEnv = runtime.env.envVars;

  for (const [key, value] of Object.entries(nextEnv)) {
    previous[key] = process.env[key];
    process.env[key] = value;
  }

  try {
    return await task();
  } finally {
    for (const key of Object.keys(nextEnv)) {
      const value = previous[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

export async function getCurrentLicenseEnv(runtime: ManagedAppRuntime): Promise<any> {
  return await withLicenseEnv(runtime, async () => await getEnvAsync());
}

export async function generateAndSaveInstanceId(runtime: ManagedAppRuntime): Promise<string> {
  const instanceId = String(await withLicenseEnv(runtime, async () => await getInstanceIdAsync())).trim();
  if (!instanceId) {
    throw new Error('Generated instance ID is empty.');
  }
  await mkdir(resolveLicenseDir(runtime), { recursive: true });
  await writeFile(resolveInstanceIdFile(runtime), `${instanceId}\n`);
  return instanceId;
}

export async function ensureInstanceId(runtime: ManagedAppRuntime, options: { force?: boolean } = {}): Promise<string> {
  if (!options.force) {
    const saved = await readSavedInstanceId(runtime);
    if (saved) {
      return saved;
    }
  }
  return await generateAndSaveInstanceId(runtime);
}

export function parseLicenseKey(key: string): LicenseKeyData {
  try {
    return JSON.parse(keyDecrypt(key));
  } catch {
    throw new Error('invalid');
  }
}

export async function saveLicenseKey(runtime: ManagedAppRuntime, key: string): Promise<string> {
  await mkdir(resolveLicenseDir(runtime), { recursive: true });
  const filePath = resolveLicenseKeyFile(runtime);
  await writeFile(filePath, key.trim());
  return filePath;
}

export async function readSavedLicenseKey(runtime: ManagedAppRuntime): Promise<string | undefined> {
  try {
    const value = await readFile(resolveLicenseKeyFile(runtime), 'utf8');
    const normalized = value.trim();
    return normalized || undefined;
  } catch {
    return undefined;
  }
}

function matchSingleDomain(licenseDomain: string, currentDomain: string): boolean {
  let hostname = '';
  let port = '';

  try {
    const url = new URL(currentDomain);
    hostname = url.hostname;
    port = url.port ? `:${url.port}` : '';
  } catch {
    return false;
  }

  const fullDomain = hostname + port;
  if (!licenseDomain.includes('*')) {
    return fullDomain === licenseDomain;
  }

  const base = licenseDomain.replace('*', '');
  return fullDomain.endsWith(base);
}

export function isDomainMatch(currentDomain: string, keyData?: LicenseKeyData): boolean {
  if (!keyData?.licenseKey?.domain || !currentDomain) {
    return false;
  }

  const licenseDomains = String(keyData.licenseKey.domain)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return licenseDomains.some((licenseDomain) => matchSingleDomain(licenseDomain, currentDomain));
}

export function isDbMatch(env: any, keyData?: LicenseKeyData): boolean {
  const currentDb = env?.db;
  const licenseDb = keyData?.instanceData?.db;

  if (!currentDb || !licenseDb) {
    return false;
  }

  if (currentDb?.id && licenseDb?.id) {
    return currentDb.id === licenseDb.id;
  }

  return isEqual(omit(currentDb, ['id']), omit(licenseDb, ['id']));
}

export function isSysMatch(env: any, keyData?: LicenseKeyData): boolean {
  const instance = keyData?.instanceData;
  if (!env || !instance) {
    return false;
  }

  const normalize = (item: any) => ({
    sys: item?.sys ?? null,
    osVer: item?.osVer ?? null,
  });

  return isEqual(normalize(env), normalize(instance));
}

export async function getLicenseStatus(keyData?: LicenseKeyData): Promise<LicenseStatus> {
  if (!keyData) {
    return 'invalid';
  }

  if (keyData.licenseKey?.licenseStatus === 'invalid') {
    return 'invalid';
  }

  const domain = String(keyData.service?.domain ?? '').trim();
  const accessKeyId = String(keyData.accessKeyId ?? '').trim();
  const accessKeySecret = String(keyData.accessKeySecret ?? '').trim();
  if (!domain || !accessKeyId || !accessKeySecret) {
    return 'active';
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${domain.replace(/\/$/, '')}/api/license_keys:getKeyStatus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(keyData.service?.headers ?? {}),
      },
      body: JSON.stringify({
        access_key_id: accessKeyId,
        access_key_secret: accessKeySecret,
      }),
      signal: controller.signal,
    });
    const payload = await response.json() as { data?: { status?: string } };
    return payload?.data?.status === 'active' ? 'active' : 'invalid';
  } catch {
    return 'active';
  } finally {
    clearTimeout(timeout);
  }
}

export async function validateLicenseKey(runtime: ManagedAppRuntime, key: string): Promise<LicenseValidationResult> {
  let keyData: LicenseKeyData | undefined;
  let keyStatus: 'invalid' | 'notfound' | undefined;

  try {
    keyData = parseLicenseKey(key);
  } catch {
    keyStatus = 'invalid';
  }

  const currentEnv = await getCurrentLicenseEnv(runtime);
  const currentDomain = appUrl(runtime);
  const dbMatch = isDbMatch(currentEnv, keyData);
  const sysMatch = isSysMatch(currentEnv, keyData);
  const envMatch = dbMatch && sysMatch;
  const domainMatch = isDomainMatch(currentDomain, keyData);
  const licenseStatus = await getLicenseStatus(keyData);

  return {
    current: {
      env: currentEnv,
      domain: currentDomain ? new URL(currentDomain).host : '',
    },
    keyData,
    keyStatus,
    dbMatch,
    sysMatch,
    envMatch,
    domainMatch,
    licenseStatus,
  };
}

export function redactLicenseKey(value: string): string {
  const text = String(value ?? '').trim();
  if (!text) {
    return '';
  }
  if (text.length <= 8) {
    return '*'.repeat(text.length);
  }
  return `${text.slice(0, 4)}...${text.slice(-4)}`;
}

export function resolveLicenseServiceUrl(value?: string): string {
  return resolveLicensePkgUrl(value).replace(/\/+$/, '');
}

export function resolveLicensePkgUrl(value?: string): string {
  const normalized = String(value ?? '').trim() || DEFAULT_LICENSE_PKG_URL;
  return normalized.replace(/\/+$/, '') + '/';
}

function shouldRedactOutputKey(key: string): boolean {
  return /accesskeyid|accesskeysecret|secret|token|password|authorization/i.test(key);
}

function redactOutputValue(value: string): string {
  const text = String(value ?? '').trim();
  if (!text) {
    return '';
  }
  if (text.length <= 8) {
    return '*'.repeat(text.length);
  }
  return `${text.slice(0, 2)}***${text.slice(-2)}`;
}

export function sanitizeLicenseOutput<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeLicenseOutput(item)) as T;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
        key,
        shouldRedactOutputKey(key)
          ? redactOutputValue(String(nestedValue ?? ''))
          : sanitizeLicenseOutput(nestedValue),
      ]),
    ) as T;
  }

  return value;
}
