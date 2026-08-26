/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'node:path';
import type { CliHomeScope } from './cli-home.js';
import { resolveConfiguredEnvPath } from './cli-home.js';

export type EnvPathConfig = {
  appPath?: unknown;
  appRootPath?: unknown;
  storagePath?: unknown;
};

function trimPathValue(value: unknown): string | undefined {
  const text = String(value ?? '').trim();
  return text || undefined;
}

function normalizePathForComparison(value: string): string {
  return value.replace(/[\\/]+/g, '/').replace(/\/+$/, '');
}

export function areConfiguredPathsEquivalent(left: unknown, right: unknown): boolean {
  const leftValue = trimPathValue(left);
  const rightValue = trimPathValue(right);
  if (!leftValue || !rightValue) {
    return leftValue === rightValue;
  }
  return normalizePathForComparison(leftValue) === normalizePathForComparison(rightValue);
}

function trimTrailingSeparators(value: string): string {
  return value.replace(/[\\/]+$/, '');
}

function hasTerminalPathSegment(value: string, segment: string): boolean {
  const normalized = normalizePathForComparison(value);
  return normalized.endsWith(`/${segment}`) || normalized === segment;
}

function dirnameWithTrailingSeparator(value: string): string | undefined {
  const trimmed = trimTrailingSeparators(value);
  if (!trimmed) {
    return undefined;
  }
  const separatorIndex = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'));
  if (separatorIndex < 0) {
    return undefined;
  }
  return trimmed.slice(0, separatorIndex + 1);
}

function inferAppPathFromLegacyConfigValue(value: string | undefined, leaf: 'source' | 'storage'): string | undefined {
  if (!value || !hasTerminalPathSegment(value, leaf)) {
    return undefined;
  }
  return dirnameWithTrailingSeparator(value);
}

export function deriveConfiguredSourcePath(appPath: string): string {
  const base = trimPathValue(appPath);
  if (!base) {
    return 'source/';
  }
  return `${base.replace(/[\\/]+$/, '')}/source/`;
}

export function deriveConfiguredStoragePath(appPath: string): string {
  const base = trimPathValue(appPath);
  if (!base) {
    return 'storage/';
  }
  return `${base.replace(/[\\/]+$/, '')}/storage/`;
}

export function inferConfiguredAppPathFromLegacyConfig(config: EnvPathConfig): string | undefined {
  const explicitAppPath = trimPathValue(config.appPath);
  if (explicitAppPath) {
    return explicitAppPath;
  }

  const candidates = [
    inferAppPathFromLegacyConfigValue(trimPathValue(config.appRootPath), 'source'),
    inferAppPathFromLegacyConfigValue(trimPathValue(config.storagePath), 'storage'),
  ].filter((value): value is string => Boolean(value));

  if (candidates.length === 0) {
    return undefined;
  }

  const [first] = candidates;
  if (!first) {
    return undefined;
  }

  return candidates.every((candidate) => areConfiguredPathsEquivalent(candidate, first)) ? first : undefined;
}

export function resolveConfiguredAppPath(
  config: EnvPathConfig,
  scope?: CliHomeScope,
): string | undefined {
  const configuredAppPath = inferConfiguredAppPathFromLegacyConfig(config);
  return configuredAppPath ? resolveConfiguredEnvPath(configuredAppPath, scope) : undefined;
}

export function resolveConfiguredSourcePath(
  config: EnvPathConfig,
  scope?: CliHomeScope,
): string | undefined {
  const legacySourcePath = trimPathValue(config.appRootPath);
  if (legacySourcePath) {
    return resolveConfiguredEnvPath(legacySourcePath, scope);
  }

  const appPath = resolveConfiguredAppPath(config, scope);
  return appPath ? path.join(appPath, 'source') : undefined;
}

export function resolveConfiguredStoragePath(
  config: EnvPathConfig,
  scope?: CliHomeScope,
): string | undefined {
  const legacyStoragePath = trimPathValue(config.storagePath);
  if (legacyStoragePath) {
    return resolveConfiguredEnvPath(legacyStoragePath, scope);
  }

  const appPath = resolveConfiguredAppPath(config, scope);
  return appPath ? path.join(appPath, 'storage') : undefined;
}
