/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { EnvConfigEntry } from './auth-store.js';

export const ENV_HOOK_SCRIPT_CONFIG_PATH = '.nb/hooks.mjs';

export type HookPhase = 'init' | 'upgrade' | 'restore';
export type HookSource = 'npm' | 'git';

export type BeforeDependencyInstallHookContext = {
  phase: HookPhase;
  envName: string;
  source: HookSource;
  version?: string;
  appPath: string;
  sourcePath: string;
  storagePath: string;
  hookScript: string;
  envConfig: Record<string, unknown>;
};

type NocoBaseHooks = {
  beforeDependencyInstall?: (context: BeforeDependencyInstallHookContext) => unknown | Promise<unknown>;
};

function trimValue(value: unknown): string {
  return String(value ?? '').trim();
}

function normalizeHookPhase(value: unknown): HookPhase {
  const text = trimValue(value);
  if (text === 'upgrade' || text === 'restore') {
    return text;
  }
  return 'init';
}

function normalizeHookSource(value: unknown): HookSource | undefined {
  const text = trimValue(value);
  if (text === 'npm' || text === 'git') {
    return text;
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

export function resolveHookScriptPath(params: { appPath: string; hookScript?: unknown }): string | undefined {
  const hookScript = trimValue(params.hookScript);
  if (!hookScript) {
    return undefined;
  }

  return path.isAbsolute(hookScript) ? hookScript : path.join(params.appPath, hookScript);
}

export async function persistHookScript(params: { sourcePath: string; appPath: string }): Promise<string> {
  const sourcePath = path.resolve(params.sourcePath);
  const targetPath = path.join(params.appPath, ENV_HOOK_SCRIPT_CONFIG_PATH);

  await mkdir(path.dirname(targetPath), { recursive: true });
  if (path.resolve(sourcePath) !== path.resolve(targetPath)) {
    await copyFile(sourcePath, targetPath);
  }

  return ENV_HOOK_SCRIPT_CONFIG_PATH;
}

async function loadHookScript(hookScriptPath: string): Promise<NocoBaseHooks> {
  const url = pathToFileURL(hookScriptPath);
  url.searchParams.set('t', String(Date.now()));
  const imported = (await import(url.href)) as { default?: unknown };
  const hooks = imported.default ?? imported;

  if (!isRecord(hooks)) {
    throw new Error('Hook script must export an object.');
  }

  if (
    Object.prototype.hasOwnProperty.call(hooks, 'beforeDependencyInstall') &&
    typeof hooks.beforeDependencyInstall !== 'function'
  ) {
    throw new Error('Hook "beforeDependencyInstall" must be a function.');
  }

  return hooks as NocoBaseHooks;
}

export function buildBeforeDependencyInstallHookContext(params: {
  phase?: unknown;
  envName?: unknown;
  source: unknown;
  version?: unknown;
  appPath: string;
  sourcePath: string;
  storagePath: string;
  hookScript: string;
  envConfig?: EnvConfigEntry | Record<string, unknown>;
}): BeforeDependencyInstallHookContext | undefined {
  const source = normalizeHookSource(params.source);
  if (!source) {
    return undefined;
  }

  const version = trimValue(params.version);
  return {
    phase: normalizeHookPhase(params.phase),
    envName: trimValue(params.envName),
    source,
    ...(version ? { version } : {}),
    appPath: params.appPath,
    sourcePath: params.sourcePath,
    storagePath: params.storagePath,
    hookScript: params.hookScript,
    envConfig: { ...(params.envConfig ?? {}) },
  };
}

export async function runBeforeDependencyInstallHook(params: {
  hookScriptPath: string;
  context: BeforeDependencyInstallHookContext;
}): Promise<void> {
  try {
    const hooks = await loadHookScript(params.hookScriptPath);
    if (!hooks.beforeDependencyInstall) {
      return;
    }

    await hooks.beforeDependencyInstall(params.context);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      [`Hook script failed: ${params.hookScriptPath}`, 'Hook stage: beforeDependencyInstall', `Details: ${message}`].join(
        '\n',
      ),
    );
  }
}
