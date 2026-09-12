/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import os from 'node:os';
import path from 'node:path';

export const CLI_HOME_DIRNAME = '.nocobase';
export type CliHomeScope = 'global';
export const NB_CLI_ROOT_ENV = 'NB_CLI_ROOT';

export function resolveDefaultConfigScope(): CliHomeScope {
  return 'global';
}

function readConfiguredPath(name: string) {
  const value = String(process.env[name] ?? '').trim();
  return value || undefined;
}

function resolveGlobalCliHomeRoot() {
  return readConfiguredPath(NB_CLI_ROOT_ENV) ?? os.homedir();
}

export function resolveCliHomeRoot(scope: CliHomeScope = resolveDefaultConfigScope()) {
  void scope;
  return resolveGlobalCliHomeRoot();
}

export function resolveCliHomeDir(scope: CliHomeScope = resolveDefaultConfigScope()) {
  return path.join(resolveCliHomeRoot(scope), CLI_HOME_DIRNAME);
}

export function resolveEnvRoot(scope: CliHomeScope = resolveDefaultConfigScope()) {
  void scope;
  return resolveCliHomeRoot();
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

export function formatCliHomeScope(scope: CliHomeScope) {
  void scope;
  return 'global';
}
