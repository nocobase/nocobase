/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { copyFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import type { EnvConfigEntry } from './auth-store.js';

export const ENV_HOOK_SCRIPT_CONFIG_PATH = '.nb/hooks.mjs';
const require = createRequire(import.meta.url);
const { spawn } = require('node:child_process') as typeof import('node:child_process');

export type HookName = 'beforeDependencyInstall' | 'beforeAppInstall' | 'afterAppStart';
export type HookPhase = 'init' | 'upgrade' | 'restore' | 'source-download' | 'app-start';
export type HookCommand = 'init' | 'source:download' | 'app:start' | 'app:restart' | 'app:upgrade';
export type HookSource = 'npm' | 'git' | 'docker';

export type NocoBaseHookContext = {
  phase: HookPhase;
  command: HookCommand;
  envName: string;
  source: HookSource;
  version?: string;
  appPath: string;
  sourcePath: string;
  storagePath: string;
  hookScript: string;
  envConfig: Record<string, unknown>;
};

export type BeforeDependencyInstallHookContext = NocoBaseHookContext & {
  source: 'npm' | 'git';
};

type NocoBaseHooks = {
  [key in HookName]?: (context: NocoBaseHookContext) => unknown | Promise<unknown>;
};

function trimValue(value: unknown): string {
  return String(value ?? '').trim();
}

function normalizeHookPhase(value: unknown): HookPhase {
  const text = trimValue(value);
  if (text === 'init' || text === 'upgrade' || text === 'restore' || text === 'source-download' || text === 'app-start') {
    return text;
  }
  return 'init';
}

function normalizeHookCommand(value: unknown): HookCommand {
  const text = trimValue(value);
  if (text === 'source:download' || text === 'app:start' || text === 'app:restart' || text === 'app:upgrade') {
    return text;
  }
  return 'init';
}

function normalizeHookSource(value: unknown): HookSource | undefined {
  const text = trimValue(value);
  if (text === 'npm' || text === 'git' || text === 'docker') {
    return text;
  }
  return undefined;
}

function isDependencyHookSource(source: HookSource): source is 'npm' | 'git' {
  return source === 'npm' || source === 'git';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
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

const hookRunnerScript = `
import { pathToFileURL } from 'node:url';

const knownHookNames = ['beforeDependencyInstall', 'beforeAppInstall', 'afterAppStart'];
const [, hookScriptPath, hookName, contextJson] = process.argv;
const url = pathToFileURL(hookScriptPath);
url.searchParams.set('t', String(Date.now()));

const imported = await import(url.href);
const hooks = imported.default ?? imported;

if (!hooks || typeof hooks !== 'object' || Array.isArray(hooks)) {
  throw new Error('Hook script must export an object.');
}

for (const knownHookName of knownHookNames) {
  if (Object.prototype.hasOwnProperty.call(hooks, knownHookName) && typeof hooks[knownHookName] !== 'function') {
    throw new Error(\`Hook "\${knownHookName}" must be a function.\`);
  }
}

const hook = hooks[hookName];
if (typeof hook === 'function') {
  await hook(JSON.parse(contextJson));
}
`;

async function runHookInSubprocess(params: {
  hookScriptPath: string;
  hookName: HookName;
  context: NocoBaseHookContext;
}): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ['--input-type=module', '--eval', hookRunnerScript, params.hookScriptPath, params.hookName, JSON.stringify(params.context)],
      {
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );

    let stdout = '';
    let stderr = '';

    child.stdout?.on?.('data', (chunk: Buffer | string) => {
      stdout += String(chunk);
    });
    child.stderr?.on?.('data', (chunk: Buffer | string) => {
      stderr += String(chunk);
    });
    child.once('error', reject);
    child.once('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      const output = stderr.trim() || stdout.trim();
      reject(new Error(output || `Hook process exited with code ${code ?? 'unknown'}.`));
    });
  });
}

export function buildHookContext(params: {
  phase?: unknown;
  command?: unknown;
  envName?: unknown;
  source: unknown;
  version?: unknown;
  appPath: string;
  sourcePath: string;
  storagePath: string;
  hookScript: string;
  envConfig?: EnvConfigEntry | Record<string, unknown>;
}): NocoBaseHookContext | undefined {
  const source = normalizeHookSource(params.source);
  if (!source) {
    return undefined;
  }

  const version = trimValue(params.version);
  return {
    phase: normalizeHookPhase(params.phase),
    command: normalizeHookCommand(params.command),
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

export function buildBeforeDependencyInstallHookContext(params: {
  phase?: unknown;
  command?: unknown;
  envName?: unknown;
  source: unknown;
  version?: unknown;
  appPath: string;
  sourcePath: string;
  storagePath: string;
  hookScript: string;
  envConfig?: EnvConfigEntry | Record<string, unknown>;
}): BeforeDependencyInstallHookContext | undefined {
  const context = buildHookContext(params);
  if (!context || !isDependencyHookSource(context.source)) {
    return undefined;
  }
  return context as BeforeDependencyInstallHookContext;
}

export async function runHookScriptHook(params: {
  hookScriptPath: string;
  hookName: HookName;
  context: NocoBaseHookContext;
}): Promise<void> {
  try {
    await runHookInSubprocess(params);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      [`Hook script failed: ${params.hookScriptPath}`, `Hook stage: ${params.hookName}`, `Details: ${message}`].join(
        '\n',
      ),
    );
  }
}

export async function runBeforeDependencyInstallHook(params: {
  hookScriptPath: string;
  context: BeforeDependencyInstallHookContext;
}): Promise<void> {
  await runHookScriptHook({
    hookScriptPath: params.hookScriptPath,
    hookName: 'beforeDependencyInstall',
    context: params.context,
  });
}
