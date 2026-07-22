/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { cp, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { commandOutput, run } from './run-npm.js';

const DEFAULT_PORTAL_APP_NAME = 'main';
const DEFAULT_PORTAL_NAME = 'admin';
const PORTAL_MANIFEST_FILE = 'portal-manifest.json';
const PORTAL_CLIENT_PREFIX = 'x';

type PortalSourceType = 'git' | 'local';

type PortalManifest = {
  defaultPortal: string;
  portals: PortalManifestEntry[];
};

type PortalManifestEntry = {
  app: string;
  name: string;
  path: string;
  source: {
    type: PortalSourceType;
    url: string;
    commit?: string;
  };
};

type PortalPackageManager = {
  executable: 'yarn' | 'pnpm' | 'npm';
  installArgs: string[];
  buildArgs: string[];
};

type RunOptions = {
  cwd?: string;
  env?: Record<string, string>;
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

function manifestPortalPath(value: unknown, fallbackName: string): string {
  const segment = String(value || '')
    .trim()
    .replace(/^\/+|\/+$/g, '');
  return `/${segment || normalizePortalName(fallbackName)}`;
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

async function resolvePortalPackageManager(portalDir: string): Promise<PortalPackageManager> {
  if (await pathExists(path.join(portalDir, 'yarn.lock'))) {
    return { executable: 'yarn', installArgs: ['install'], buildArgs: ['build'] };
  }
  if (await pathExists(path.join(portalDir, 'pnpm-lock.yaml'))) {
    return { executable: 'pnpm', installArgs: ['install'], buildArgs: ['build'] };
  }
  if (await pathExists(path.join(portalDir, 'package-lock.json'))) {
    return { executable: 'npm', installArgs: ['install'], buildArgs: ['run', 'build'] };
  }
  throw new Error(
    `Portal template is invalid: expected yarn.lock, pnpm-lock.yaml, or package-lock.json in ${portalDir}.`,
  );
}

async function installAndBuildPortal(params: {
  portalDir: string;
  portalName: string;
  verbose?: boolean;
  runCommand: RunCommand;
}): Promise<void> {
  const packageManager = await resolvePortalPackageManager(params.portalDir);
  const stdio = params.verbose ? 'inherit' : 'ignore';
  await params.runCommand(packageManager.executable, packageManager.installArgs, {
    cwd: params.portalDir,
    errorName: `${packageManager.executable} install`,
    stdio,
  });
  await params.runCommand(packageManager.executable, packageManager.buildArgs, {
    cwd: params.portalDir,
    env: {
      NOCOBASE_API_URL: '/api',
      NOCOBASE_PORTAL_BASE: `/${PORTAL_CLIENT_PREFIX}/${params.portalName}/`,
    },
    errorName: `${packageManager.executable} build`,
    stdio,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function normalizeManifestEntry(value: unknown, defaultPortal: string): PortalManifestEntry | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const name = normalizePortalName(trimValue(value.name) || defaultPortal);
  const source = isRecord(value.source) ? value.source : {};
  const sourceType = trimValue(source.type) === 'local' ? 'local' : 'git';
  const commit = trimValue(source.commit);
  return {
    app: normalizePortalAppName(trimValue(value.app) || DEFAULT_PORTAL_APP_NAME),
    name,
    path: manifestPortalPath(value.path, name),
    source: {
      type: sourceType,
      url: trimValue(source.url),
      ...(commit ? { commit } : {}),
    },
  };
}

async function readPortalManifest(manifestPath: string, defaultPortal: string): Promise<PortalManifest> {
  const fallback: PortalManifest = {
    defaultPortal,
    portals: [],
  };
  if (!(await pathExists(manifestPath))) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(await readFile(manifestPath, 'utf-8')) as unknown;
    if (!isRecord(parsed)) {
      return fallback;
    }
    const normalizedDefaultPortal = normalizePortalName(trimValue(parsed.defaultPortal) || defaultPortal);
    const portals = Array.isArray(parsed.portals)
      ? parsed.portals
          .map((portal) => normalizeManifestEntry(portal, normalizedDefaultPortal))
          .filter((portal): portal is PortalManifestEntry => Boolean(portal))
      : [];
    return {
      defaultPortal: normalizedDefaultPortal,
      portals,
    };
  } catch {
    return fallback;
  }
}

async function writePortalManifest(params: {
  storagePath: string;
  appName: string;
  portalName: string;
  templateUrl: string;
  sourceType: PortalSourceType;
  commit?: string;
}): Promise<void> {
  const manifestPath = path.join(params.storagePath, 'portals', PORTAL_MANIFEST_FILE);
  const manifest = await readPortalManifest(manifestPath, params.portalName);
  const entry: PortalManifestEntry = {
    app: params.appName,
    name: params.portalName,
    path: `/${params.portalName}`,
    source: {
      type: params.sourceType,
      url: params.templateUrl,
      ...(params.commit ? { commit: params.commit } : {}),
    },
  };
  const existingIndex = manifest.portals.findIndex(
    (portal) => portal.app === params.appName && portal.name === params.portalName,
  );

  if (existingIndex >= 0) {
    manifest.portals[existingIndex] = entry;
  } else {
    manifest.portals.push(entry);
  }
  if (params.appName === DEFAULT_PORTAL_APP_NAME || !manifest.defaultPortal) {
    manifest.defaultPortal = params.portalName;
  }

  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8');
}

async function manifestHasPortal(params: { storagePath: string; appName: string; portalName: string }): Promise<boolean> {
  const manifestPath = path.join(params.storagePath, 'portals', PORTAL_MANIFEST_FILE);
  const manifest = await readPortalManifest(manifestPath, params.portalName);
  return manifest.portals.some((portal) => portal.app === params.appName && portal.name === params.portalName);
}

async function readGitCommit(cwd: string, commandOutputFn: CommandOutput): Promise<string | undefined> {
  try {
    return trimValue(await commandOutputFn('git', ['rev-parse', 'HEAD'], { cwd, errorName: 'git rev-parse' })) || undefined;
  } catch {
    return undefined;
  }
}

async function readGitRemoteHead(repository: string, commandOutputFn: CommandOutput): Promise<string | undefined> {
  try {
    const stdout = await commandOutputFn('git', ['ls-remote', repository, 'HEAD'], { errorName: 'git ls-remote' });
    return trimValue(stdout).split(/\s+/, 1)[0] || undefined;
  } catch {
    return undefined;
  }
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
    if (await manifestHasPortal({ storagePath, appName, portalName })) {
      return { prepared: false, skippedReason: 'already-prepared' };
    }
    await rm(portalDir, { recursive: true, force: true });
  }

  options.onStartTask?.(`Preparing Portal "${portalName}" from template...`);
  const runCommand = options.runCommand ?? run;
  const commandOutputFn = options.commandOutput ?? commandOutput;
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'nocobase-portal-template-'));
  let cleanupPortalDir = false;

  try {
    const localTemplateDir = await getLocalTemplateDir(templateUrl);
    const templateDir = localTemplateDir || tempDir;
    const sourceType: PortalSourceType = localTemplateDir ? 'local' : 'git';
    if (!localTemplateDir) {
      await runCommand('git', ['clone', '--depth', '1', templateUrl, tempDir], {
        errorName: 'git clone',
        stdio: options.verbose ? 'inherit' : 'ignore',
      });
    }

    if (!(await pathExists(path.join(templateDir, 'package.json')))) {
      throw new Error(`Portal template "${templateUrl}" is invalid: package.json is missing.`);
    }

    const commit =
      sourceType === 'git'
        ? (await readGitCommit(tempDir, commandOutputFn)) || (await readGitRemoteHead(templateUrl, commandOutputFn))
        : undefined;
    cleanupPortalDir = true;
    await copyTemplate(templateDir, portalDir);
    await installAndBuildPortal({
      portalDir,
      portalName,
      verbose: options.verbose,
      runCommand,
    });
    await writePortalManifest({
      storagePath,
      appName,
      portalName,
      templateUrl,
      sourceType,
      commit,
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
