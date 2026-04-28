/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const CLI_HOME_DIRNAME = '.nocobase';
export type CliHomeScope = 'auto' | 'project' | 'global';
export const NB_CONFIG_SCOPE_ENV = 'NB_CONFIG_SCOPE';
export const NB_CLI_ROOT_ENV = 'NB_CLI_ROOT';

export function resolveDefaultConfigScope(): Exclude<CliHomeScope, 'auto'> {
  const raw = String(process.env[NB_CONFIG_SCOPE_ENV] ?? '').trim().toLowerCase();
  return raw === 'project' ? 'project' : 'global';
}

function readConfiguredPath(name: string) {
  const value = String(process.env[name] ?? '').trim();
  return value || undefined;
}

function resolveGlobalCliHomeRoot() {
  return readConfiguredPath(NB_CLI_ROOT_ENV) ?? os.homedir();
}

export function resolveCliHomeRoot(scope: CliHomeScope = resolveDefaultConfigScope()) {
  const cwdRoot = process.cwd();
  if (scope === 'project') {
    return cwdRoot;
  }

  if (scope === 'global') {
    return resolveGlobalCliHomeRoot();
  }

  const cwdCliHome = path.join(cwdRoot, CLI_HOME_DIRNAME);
  if (fs.existsSync(cwdCliHome)) {
    return cwdRoot;
  }

  return resolveGlobalCliHomeRoot();
}

export function resolveCliHomeDir(scope: CliHomeScope = resolveDefaultConfigScope()) {
  return path.join(resolveCliHomeRoot(scope), CLI_HOME_DIRNAME);
}

export function resolveEnvRoot(scope: CliHomeScope = resolveDefaultConfigScope()) {
  const envRoot = readConfiguredPath(NB_CLI_ROOT_ENV);
  if (envRoot) {
    return path.resolve(envRoot);
  }

  return resolveCliHomeRoot(scope);
}

export function resolveEnvRelativePath(
  relativePath: string,
  scope: CliHomeScope = resolveDefaultConfigScope(),
) {
  return path.resolve(resolveEnvRoot(scope), relativePath);
}

export function resolveConfiguredEnvPath(
  value: unknown,
  scope: CliHomeScope = resolveDefaultConfigScope(),
): string | undefined {
  const text = String(value ?? '').trim();
  if (!text) {
    return undefined;
  }

  return path.isAbsolute(text) ? text : resolveEnvRelativePath(text, scope);
}

export function formatCliHomeScope(scope: Exclude<CliHomeScope, 'auto'>) {
  return scope === 'project' ? 'project' : 'global';
}
