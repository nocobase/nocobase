/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { commandOutput, run } from './run-npm.js';

const DEFAULT_PACKAGE_NAME = '@nocobase/cli';
const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export type SelfChannel = 'latest' | 'beta' | 'alpha';
export type SelfInstallMethod = 'npm-global' | 'package-local' | 'source' | 'unknown';

export type SelfStatus = {
  packageName: string;
  packageRoot: string;
  currentVersion: string;
  channel: SelfChannel;
  latestVersion?: string;
  updateAvailable: boolean;
  installMethod: SelfInstallMethod;
  updatable: boolean;
  updateBlockedReason?: string;
  globalPrefix?: string;
  registryError?: string;
};

type SelfManagerOptions = {
  channel?: SelfChannel | 'auto';
  commandOutputFn?: typeof commandOutput;
  currentVersion?: string;
  packageName?: string;
  packageRoot?: string;
};

type SelfUpdateOptions = SelfManagerOptions & {
  runFn?: typeof run;
  targetVersion?: string;
};

type ParsedVersion = {
  major: number;
  minor: number;
  patch: number;
  prerelease: string[];
};

function normalizePath(value: string): string {
  return path.resolve(value);
}

function isSubPath(parent: string, child: string): boolean {
  const relative = path.relative(normalizePath(parent), normalizePath(child));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function parseVersion(version: string): ParsedVersion | undefined {
  const normalized = String(version ?? '').trim();
  const match = normalized.match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-.]+))?$/);
  if (!match) {
    return undefined;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ? match[4].split('.').filter(Boolean) : [],
  };
}

function compareIdentifier(left: string, right: string): number {
  const leftNumeric = /^\d+$/.test(left);
  const rightNumeric = /^\d+$/.test(right);

  if (leftNumeric && rightNumeric) {
    return Number(left) - Number(right);
  }

  if (leftNumeric) {
    return -1;
  }

  if (rightNumeric) {
    return 1;
  }

  return left.localeCompare(right);
}

export function compareVersions(leftVersion: string, rightVersion: string): number {
  const left = parseVersion(leftVersion);
  const right = parseVersion(rightVersion);

  if (!left || !right) {
    return String(leftVersion ?? '').localeCompare(String(rightVersion ?? ''));
  }

  if (left.major !== right.major) {
    return left.major - right.major;
  }

  if (left.minor !== right.minor) {
    return left.minor - right.minor;
  }

  if (left.patch !== right.patch) {
    return left.patch - right.patch;
  }

  if (left.prerelease.length === 0 && right.prerelease.length === 0) {
    return 0;
  }

  if (left.prerelease.length === 0) {
    return 1;
  }

  if (right.prerelease.length === 0) {
    return -1;
  }

  const maxLength = Math.max(left.prerelease.length, right.prerelease.length);
  for (let index = 0; index < maxLength; index += 1) {
    const leftIdentifier = left.prerelease[index];
    const rightIdentifier = right.prerelease[index];

    if (leftIdentifier === undefined) {
      return -1;
    }

    if (rightIdentifier === undefined) {
      return 1;
    }

    const compared = compareIdentifier(leftIdentifier, rightIdentifier);
    if (compared !== 0) {
      return compared;
    }
  }

  return 0;
}

function detectChannel(currentVersion: string): SelfChannel {
  if (/-alpha(?:[.-]|$)/i.test(currentVersion)) {
    return 'alpha';
  }

  if (/-beta(?:[.-]|$)/i.test(currentVersion)) {
    return 'beta';
  }

  return 'latest';
}

function readCurrentVersion(packageRoot: string): string {
  const packageJsonPath = path.join(packageRoot, 'package.json');
  const content = fs.readFileSync(packageJsonPath, 'utf8');
  const pkg = JSON.parse(content) as { version?: string };
  return String(pkg.version ?? '').trim();
}

function detectInstallMethod(packageRoot: string, globalPrefix?: string): SelfInstallMethod {
  if (
    fs.existsSync(path.join(packageRoot, 'src'))
    && fs.existsSync(path.join(packageRoot, 'tsconfig.json'))
  ) {
    return 'source';
  }

  if (globalPrefix && isSubPath(globalPrefix, packageRoot)) {
    return 'npm-global';
  }

  if (packageRoot.includes(`${path.sep}node_modules${path.sep}`)) {
    return 'package-local';
  }

  return 'unknown';
}

async function readGlobalPrefix(commandOutputFn: typeof commandOutput): Promise<string | undefined> {
  try {
    return (await commandOutputFn('npm', ['prefix', '-g'], {
      errorName: 'npm prefix',
    })).trim();
  } catch {
    return undefined;
  }
}

async function readDistTags(
  packageName: string,
  commandOutputFn: typeof commandOutput,
): Promise<Record<string, string>> {
  const output = await commandOutputFn('npm', ['view', packageName, 'dist-tags', '--json'], {
    errorName: 'npm view',
  });
  const parsed = JSON.parse(output) as Record<string, string>;
  return parsed ?? {};
}

function getUnsupportedSelfUpdateReason(installMethod: SelfInstallMethod): string | undefined {
  if (installMethod === 'source') {
    return [
      'This CLI is running from source in a repository checkout.',
      'Automatic self-update is only supported for standard global npm installs.',
      'Upgrade this checkout through your repo workflow instead.',
    ].join(' ');
  }

  if (installMethod === 'package-local') {
    return [
      'This CLI is installed from a local project dependency tree.',
      'Automatic self-update is only supported for standard global npm installs.',
      'Upgrade the parent project dependency that provides this CLI instead.',
    ].join(' ');
  }

  if (installMethod === 'unknown') {
    return [
      'This CLI install could not be recognized as a standard global npm install.',
      'Automatic self-update is only supported for standard global npm installs.',
    ].join(' ');
  }

  return undefined;
}

export function getRecommendedSelfUpdateCommand(status: Pick<SelfStatus, 'updatable' | 'updateAvailable'>): string | undefined {
  if (!status.updatable || !status.updateAvailable) {
    return undefined;
  }

  return 'nb self update --yes';
}

export function formatSelfUpdateUnavailableMessage(status: Pick<SelfStatus, 'packageName' | 'registryError'>): string {
  if (status.registryError) {
    return [
      `Couldn't resolve the latest published version for ${status.packageName}.`,
      'Check your npm registry access and try again.',
      `Details: ${status.registryError}`,
    ].join('\n');
  }

  return [
    `Couldn't resolve the latest published version for ${status.packageName}.`,
    'Check your npm registry access and try again.',
  ].join('\n');
}

export function getSelfUpdatePackageSpec(status: Pick<SelfStatus, 'packageName' | 'channel'>): string {
  return `${status.packageName}@${status.channel}`;
}

export async function inspectSelfStatus(options: SelfManagerOptions = {}): Promise<SelfStatus> {
  const packageRoot = options.packageRoot ? normalizePath(options.packageRoot) : PACKAGE_ROOT;
  const packageName = options.packageName ?? DEFAULT_PACKAGE_NAME;
  const currentVersion = options.currentVersion ?? readCurrentVersion(packageRoot);
  const channel = options.channel && options.channel !== 'auto' ? options.channel : detectChannel(currentVersion);
  const commandOutputFn = options.commandOutputFn ?? commandOutput;
  const globalPrefix = await readGlobalPrefix(commandOutputFn);
  const installMethod = detectInstallMethod(packageRoot, globalPrefix);

  let latestVersion: string | undefined;
  let registryError: string | undefined;

  try {
    const distTags = await readDistTags(packageName, commandOutputFn);
    latestVersion = distTags[channel] || distTags.latest;
  } catch (error: unknown) {
    registryError = error instanceof Error ? error.message : String(error);
  }

  const updateAvailable = latestVersion ? compareVersions(latestVersion, currentVersion) > 0 : false;

  return {
    packageName,
    packageRoot,
    currentVersion,
    channel,
    latestVersion,
    updateAvailable,
    installMethod,
    updatable: installMethod === 'npm-global',
    updateBlockedReason: getUnsupportedSelfUpdateReason(installMethod),
    globalPrefix,
    registryError,
  };
}

export function formatUnsupportedSelfUpdateMessage(status: SelfStatus): string {
  return status.updateBlockedReason
    ?? [
      'Automatic self-update is only supported for standard global npm installs.',
    ].join('\n');
}

export async function updateSelf(options: SelfUpdateOptions = {}): Promise<{
  action: 'noop' | 'updated';
  status: SelfStatus;
  targetVersion?: string;
  packageSpec?: string;
}> {
  const status = await inspectSelfStatus(options);
  if (!status.updatable) {
    throw new Error(formatUnsupportedSelfUpdateMessage(status));
  }

  const targetVersion = options.targetVersion ?? status.latestVersion;
  if (!targetVersion) {
    throw new Error(formatSelfUpdateUnavailableMessage(status));
  }

  if (!targetVersion || compareVersions(targetVersion, status.currentVersion) <= 0) {
    return {
      action: 'noop',
      status,
      targetVersion,
      packageSpec: getSelfUpdatePackageSpec(status),
    };
  }

  const packageSpec = getSelfUpdatePackageSpec(status);
  await (options.runFn ?? run)('npm', ['install', '-g', packageSpec], {
    stdio: 'inherit',
    errorName: 'npm install',
  });

  return {
    action: 'updated',
    status,
    targetVersion,
    packageSpec,
  };
}
