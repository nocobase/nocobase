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
import {
  checkExternalDbConnection,
  readExternalDbConnectionConfig,
} from '../../lib/db-connection-check.ts';
import {
  DEFAULT_DOCKER_REGISTRY,
  DEFAULT_DOCKER_VERSION,
  resolveDockerImageRef,
} from '../../lib/docker-image.ts';
import type { ManagedAppRuntime } from '../../lib/app-runtime.js';
import { formatMissingManagedAppEnvMessage, resolveManagedAppRuntime } from '../../lib/app-runtime.js';
import { buildRuntimeEnvVars } from '../../lib/runtime-env-vars.js';
import { resolveLicensePkgUrlFromConfig } from '../../lib/cli-config.js';
import { deepEqual, omitKeys } from '../../lib/object-utils.ts';
import { commandOutput } from '../../lib/run-npm.js';
import { appUrl } from '../env/shared.js';

export function createLicenseEnvFlag(description: string) {
  return Flags.string({
    char: 'e',
    description,
  });
}

export const licenseYesFlag = Flags.boolean({
  char: 'y',
  description: 'Confirm using --env when it targets a different env than the current env',
  default: false,
});

export const licenseJsonFlag = Flags.boolean({
  description: 'Output the result as JSON',
  default: false,
});

const DEFAULT_LICENSE_PKG_URL = 'https://pkg.nocobase.com/';
export const licensePkgUrlFlag = Flags.string({
  description: 'Commercial package service base URL',
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

function trimValue(value: unknown): string | undefined {
  const text = String(value ?? '').trim();
  return text || undefined;
}

function normalizeDockerPlatform(value: unknown): string | undefined {
  const text = trimValue(value);
  if (!text || text === 'auto') {
    return undefined;
  }

  if (text === 'linux/amd64' || text === 'linux/arm64') {
    return text;
  }

  return undefined;
}

function resolveDockerLicenseImageRef(runtime: Extract<ManagedAppRuntime, { kind: 'docker' }>): string {
  const config = runtime.env.config ?? {};
  return resolveDockerImageRef(config.dockerRegistry, config.downloadVersion, {
    defaultRegistry: DEFAULT_DOCKER_REGISTRY,
    defaultVersion: DEFAULT_DOCKER_VERSION,
  });
}

function buildDockerLicenseDbFlagArgs(envVars: Record<string, string>): string[] {
  return [
    '--db-dialect',
    String(envVars.DB_DIALECT ?? ''),
    '--db-host',
    String(envVars.DB_HOST ?? ''),
    '--db-port',
    String(envVars.DB_PORT ?? ''),
    '--db-database',
    String(envVars.DB_DATABASE ?? ''),
    '--db-user',
    String(envVars.DB_USER ?? ''),
    '--db-password',
    String(envVars.DB_PASSWORD ?? ''),
  ];
}

async function runDockerLicenseJsonCommand(
  runtime: Extract<ManagedAppRuntime, { kind: 'docker' }>,
  commandArgs: string[],
): Promise<any> {
  const args = [
    'run',
    '--rm',
    '--network',
    runtime.dockerNetworkName || runtime.workspaceName,
  ];
  const dockerPlatform = normalizeDockerPlatform(runtime.env.config?.dockerPlatform);
  if (dockerPlatform) {
    args.push('--platform', dockerPlatform);
  }
  args.push(
    '--entrypoint',
    'nb',
    resolveDockerLicenseImageRef(runtime),
    ...commandArgs,
    '--json',
  );

  const output = await commandOutput('docker', args, {
    errorName: 'docker run',
  });

  try {
    return JSON.parse(output);
  } catch {
    throw new Error(`Failed to parse Docker license command response: ${output}`);
  }
}

function buildLicenseDbConfigFromEnvVars(envVars: Record<string, string>) {
  return {
    builtinDb: false,
    dbDialect: trimValue(envVars.DB_DIALECT),
    dbHost: trimValue(envVars.DB_HOST),
    dbPort: trimValue(envVars.DB_PORT),
    dbDatabase: trimValue(envVars.DB_DATABASE),
    dbUser: trimValue(envVars.DB_USER),
    dbPassword: envVars.DB_PASSWORD,
  };
}

export async function validateLicenseDbConnectionFromEnvVars(envVars: Record<string, string>): Promise<void> {
  const connectionConfig = readExternalDbConnectionConfig(buildLicenseDbConfigFromEnvVars(envVars));
  if (!connectionConfig) {
    throw new Error('Unsupported or incomplete database settings for instance ID generation.');
  }

  const validationError = await checkExternalDbConnection(connectionConfig);
  if (validationError) {
    throw new Error(validationError);
  }
}

export async function withLicenseEnvVars<T>(
  nextEnv: Record<string, string>,
  task: () => Promise<T>,
): Promise<T> {
  const previous: Record<string, string | undefined> = {};

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

async function withLicenseEnv<T>(runtime: ManagedAppRuntime, task: () => Promise<T>): Promise<T> {
  return await withLicenseEnvVars(await buildRuntimeEnvVars(runtime), task);
}

export async function getCurrentLicenseEnv(runtime: ManagedAppRuntime): Promise<any> {
  if (runtime.kind === 'docker') {
    const envVars = await buildRuntimeEnvVars(runtime);
    const payload = await runDockerLicenseJsonCommand(runtime, [
      'license',
      'env',
      ...buildDockerLicenseDbFlagArgs(envVars),
    ]);
    return payload?.env;
  }

  return await withLicenseEnv(runtime, async () => await getEnvAsync());
}

export async function generateInstanceIdFromEnvVars(envVars: Record<string, string>): Promise<string> {
  const instanceId = String(await withLicenseEnvVars(envVars, async () => await getInstanceIdAsync())).trim();
  if (!instanceId) {
    throw new Error('Generated instance ID is empty.');
  }
  return instanceId;
}

export async function generateValidatedInstanceIdFromEnvVars(envVars: Record<string, string>): Promise<string> {
  await validateLicenseDbConnectionFromEnvVars(envVars);
  return await generateInstanceIdFromEnvVars(envVars);
}

async function generateInstanceIdForDockerRuntime(
  runtime: Extract<ManagedAppRuntime, { kind: 'docker' }>,
): Promise<string> {
  const envVars = await buildRuntimeEnvVars(runtime);
  const payload = await runDockerLicenseJsonCommand(runtime, [
    'license',
    'generate-id',
    ...buildDockerLicenseDbFlagArgs(envVars),
  ]) as { instanceId?: unknown };

  const instanceId = trimValue(payload.instanceId);
  if (!instanceId) {
    throw new Error('Docker instance ID generation did not return an instance ID.');
  }
  return instanceId;
}

export async function generateInstanceIdForRuntime(runtime: ManagedAppRuntime): Promise<string> {
  if (runtime.kind === 'docker') {
    return await generateInstanceIdForDockerRuntime(runtime);
  }

  if (runtime.kind === 'local') {
    return await generateValidatedInstanceIdFromEnvVars(await buildRuntimeEnvVars(runtime));
  }

  throw new Error(`Env "${runtime.envName}" does not support automatic instance ID generation.`);
}

export async function saveInstanceId(runtime: ManagedAppRuntime, instanceId: string): Promise<string> {
  const normalized = String(instanceId ?? '').trim();
  if (!normalized) {
    throw new Error('Generated instance ID is empty.');
  }
  await mkdir(resolveLicenseDir(runtime), { recursive: true });
  await writeFile(resolveInstanceIdFile(runtime), `${normalized}\n`);
  return normalized;
}

export async function generateAndSaveInstanceId(runtime: ManagedAppRuntime): Promise<string> {
  const instanceId = await generateInstanceIdForRuntime(runtime);
  return await saveInstanceId(runtime, instanceId);
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

  return deepEqual(omitKeys(currentDb, ['id']), omitKeys(licenseDb, ['id']));
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

  return deepEqual(normalize(env), normalize(instance));
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

export async function resolveLicenseServiceUrl(value?: string): Promise<string> {
  return (await resolveLicensePkgUrl(value)).replace(/\/+$/, '');
}

export async function resolveLicensePkgUrl(value?: string): Promise<string> {
  const normalized = String(value ?? '').trim() || await resolveLicensePkgUrlFromConfig();
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
