/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { cp, mkdir, mkdtemp, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPortalCommandEnv } from './portal-command-env.js';
import { run } from './run-npm.js';

const DEFAULT_PORTAL_APP_NAME = 'main';
const DEFAULT_PORTAL_NAME = 'admin';
const PORTAL_CLIENT_PREFIX = 'x';

type RunOptions = {
  cwd?: string;
  env?: Record<string, string>;
  envMode?: 'inherit' | 'replace';
  errorName?: string;
  stdio?: 'inherit' | 'pipe' | 'ignore';
  timeoutMs?: number;
};

type RunCommand = (name: string, args: string[], options?: RunOptions) => Promise<void>;
type CommandOutput = (
  name: string,
  args: string[],
  options?: Pick<RunOptions, 'cwd' | 'env' | 'errorName' | 'timeoutMs'>,
) => Promise<string>;
export type PrepareInitialPortalOptions = {
  appName?: string;
  developmentMode?: string;
  portalName?: string;
  portalTemplate?: string;
  storagePath?: string;
  verbose?: boolean;
  runCommand?: RunCommand;
  commandOutput?: CommandOutput;
  onStartTask?: (message: string) => void;
  onSucceedTask?: (message: string) => void;
  onFailTask?: (message: string) => void;
};

export type PrepareInitialPortalResult = {
  prepared: boolean;
  skippedReason?: 'no-code' | 'already-prepared';
};

function trimValue(value: unknown): string {
  return String(value ?? '').trim();
}

function normalizePortalName(value?: string): string {
  const segment = String(value || '')
    .trim()
    .replace(/^\/+|\/+$/g, '');
  return segment || DEFAULT_PORTAL_NAME;
}

function normalizePortalAppName(value?: string): string {
  const segment = String(value || '')
    .trim()
    .replace(/^\/+|\/+$/g, '');
  return segment || DEFAULT_PORTAL_APP_NAME;
}

function validatePortalSegment(kind: string, value: string): void {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(value)) {
    throw new Error(
      `Invalid ${kind} "${value}". Use letters, numbers, underscores, or hyphens, and start with a letter or number.`,
    );
  }
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

function resolveLocalTemplatePath(templateSource: string): string {
  if (templateSource.startsWith('file://')) {
    return fileURLToPath(templateSource);
  }
  return templateSource;
}

async function getLocalTemplateDir(templateSource: string): Promise<string | undefined> {
  let localPath: string;
  try {
    localPath = resolveLocalTemplatePath(templateSource);
  } catch {
    return undefined;
  }

  let result: Awaited<ReturnType<typeof stat>>;
  try {
    result = await stat(localPath);
  } catch {
    return undefined;
  }

  if (!result.isDirectory()) {
    throw new Error(`Portal template "${templateSource}" is invalid: expected a directory.`);
  }
  return localPath;
}

async function copyTemplate(sourceDir: string, targetDir: string): Promise<void> {
  await mkdir(path.dirname(targetDir), { recursive: true });
  await cp(sourceDir, targetDir, {
    recursive: true,
    filter: (source) => !source.split(path.sep).includes('.git'),
  });
}

async function buildPortalHtml(params: {
  portalDir: string;
  portalName: string;
  verbose?: boolean;
  runCommand: RunCommand;
}): Promise<void> {
  const stdio = params.verbose ? 'inherit' : 'ignore';
  await params.runCommand('yarn', ['build:html'], {
    cwd: params.portalDir,
    env: buildPortalCommandEnv({
      NOCOBASE_API_URL: '/api',
      NOCOBASE_PORTAL_BASE: `/${PORTAL_CLIENT_PREFIX}/${params.portalName}/`,
    }),
    envMode: 'replace',
    errorName: 'yarn build:html',
    stdio,
  });
}

export async function prepareInitialPortalTemplate(
  options: PrepareInitialPortalOptions,
): Promise<PrepareInitialPortalResult> {
  const developmentMode = trimValue(options.developmentMode);
  if (developmentMode !== 'vibe-coding') {
    return { prepared: false, skippedReason: 'no-code' };
  }

  const storagePath = trimValue(options.storagePath);
  if (!storagePath) {
    throw new Error('Cannot prepare an initial Portal template without a storage path.');
  }

  const templateUrl = trimValue(options.portalTemplate);
  if (!templateUrl) {
    throw new Error('Initial Portal template is required when development mode is "vibe-coding".');
  }

  const appName = normalizePortalAppName(options.appName);
  const portalName = normalizePortalName(options.portalName);
  validatePortalSegment('portal app name', appName);
  validatePortalSegment('Portal name', portalName);

  const portalDir = path.join(storagePath, 'portals', appName, portalName);
  if (await pathExists(portalDir)) {
    if (await pathExists(path.join(portalDir, 'dist', 'index.html'))) {
      return { prepared: false, skippedReason: 'already-prepared' };
    }
    await rm(portalDir, { recursive: true, force: true });
  }

  options.onStartTask?.(`Preparing Portal "${portalName}" from template...`);
  const runCommand = options.runCommand ?? run;
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'nocobase-portal-template-'));
  let cleanupPortalDir = false;

  try {
    const localTemplateDir = await getLocalTemplateDir(templateUrl);
    const templateDir = localTemplateDir || tempDir;
    if (!localTemplateDir) {
      await runCommand('git', ['clone', '--depth', '1', templateUrl, tempDir], {
        errorName: 'git clone',
        stdio: options.verbose ? 'inherit' : 'ignore',
      });
    }

    if (!(await pathExists(path.join(templateDir, 'package.json')))) {
      throw new Error(`Portal template "${templateUrl}" is invalid: package.json is missing.`);
    }

    cleanupPortalDir = true;
    await copyTemplate(templateDir, portalDir);
    await rm(path.join(portalDir, 'node_modules'), { recursive: true, force: true });
    await buildPortalHtml({
      portalDir,
      portalName,
      verbose: options.verbose,
      runCommand,
    });
    cleanupPortalDir = false;
    options.onSucceedTask?.(`Portal "${portalName}" is ready.`);
    return { prepared: true };
  } catch (error) {
    if (cleanupPortalDir) {
      await rm(portalDir, { recursive: true, force: true });
    }
    options.onFailTask?.(`Failed to prepare Portal "${portalName}".`);
    throw error;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
