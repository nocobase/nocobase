/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { storagePathJoin } from '@nocobase/utils';
import { execFile } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import {
  DEFAULT_PORTAL_APP_NAME,
  DEFAULT_PORTAL_NAME,
  PORTAL_MANIFEST_FILE,
  normalizePortalAppName,
  normalizePortalName,
} from './gateway/utils';

const execFileAsync = promisify(execFile);
const DEFAULT_PORTAL_TEMPLATE_PACKAGE = '@nocobase/portal-template-default';

export type InitDevelopmentMode = 'no-code' | 'vibe-coding';

export interface PortalManifest {
  defaultPortal: string;
  portals: Array<{
    app: string;
    name: string;
    path: string;
    source: {
      type: 'git' | 'local';
      url: string;
      commit?: string;
    };
  }>;
}

export interface InitPortalOptions {
  appName?: string;
  developmentMode?: string;
  portalName?: string;
  portalTemplate?: string;
}

function trimValue(value: unknown): string {
  return String(value ?? '').trim();
}

export function normalizeInitDevelopmentMode(value?: string): InitDevelopmentMode {
  const mode = trimValue(value);
  if (!mode) {
    return 'no-code';
  }
  if (mode === 'no-code' || mode === 'vibe-coding') {
    return mode;
  }
  throw new Error(`Invalid INIT_DEVELOPMENT_MODE "${mode}". Expected "no-code" or "vibe-coding".`);
}

export function validatePortalName(value?: string): string {
  const portalName = normalizePortalName(value || DEFAULT_PORTAL_NAME);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(portalName)) {
    throw new Error(
      `Invalid INIT_PORTAL_NAME "${portalName}". Use letters, numbers, underscores, or hyphens, and start with a letter or number.`,
    );
  }
  return portalName;
}

export function validatePortalAppName(value?: string): string {
  const appName = normalizePortalAppName(value || DEFAULT_PORTAL_APP_NAME);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(appName)) {
    throw new Error(
      `Invalid portal app name "${appName}". Use letters, numbers, underscores, or hyphens, and start with a letter or number.`,
    );
  }
  return appName;
}

function normalizeManifestPortalPath(value: unknown, fallbackName: string): string {
  const segment = String(value || '')
    .trim()
    .replace(/^\/+|\/+$/g, '');
  return `/${segment || normalizePortalName(fallbackName)}`;
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function tryResolveLocalTemplatePath(templateSource: string): string {
  if (templateSource.startsWith('file://')) {
    return fileURLToPath(templateSource);
  }
  return templateSource;
}

async function getLocalTemplateDir(templateSource: string): Promise<string | undefined> {
  let localPath: string;
  try {
    localPath = tryResolveLocalTemplatePath(templateSource);
  } catch {
    return undefined;
  }

  let stat: fs.Stats;
  try {
    stat = await fs.promises.stat(localPath);
  } catch {
    return undefined;
  }

  if (!stat.isDirectory()) {
    throw new Error(`Portal template "${templateSource}" is invalid: expected a directory.`);
  }
  return localPath;
}

async function copyTemplate(sourceDir: string, targetDir: string): Promise<void> {
  const ignoredSegments = new Set(['.git', 'node_modules']);
  await fs.promises.mkdir(path.dirname(targetDir), { recursive: true });
  await fs.promises.cp(sourceDir, targetDir, {
    recursive: true,
    filter: (source) =>
      !path
        .relative(sourceDir, source)
        .split(path.sep)
        .some((segment) => ignoredSegments.has(segment)),
  });
}

function resolveDefaultPortalTemplateDir(): string {
  try {
    return path.dirname(require.resolve(`${DEFAULT_PORTAL_TEMPLATE_PACKAGE}/package.json`));
  } catch {
    throw new Error(
      `Default Portal template package "${DEFAULT_PORTAL_TEMPLATE_PACKAGE}" is not installed. Set INIT_PORTAL_TEMPLATE or install the package.`,
    );
  }
}

async function readGitCommit(cwd: string): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd });
    return trimValue(stdout) || undefined;
  } catch {
    return undefined;
  }
}

async function readGitRemoteHead(repository: string): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync('git', ['ls-remote', repository, 'HEAD']);
    return trimValue(stdout).split(/\s+/, 1)[0] || undefined;
  } catch {
    return undefined;
  }
}

async function writePortalManifestForApp(
  appName: string,
  portalName: string,
  templateUrl: string,
  sourceType: PortalManifest['portals'][number]['source']['type'],
  commit?: string,
): Promise<void> {
  const manifestPath = storagePathJoin('portals', PORTAL_MANIFEST_FILE);
  const fallbackManifest: PortalManifest = {
    defaultPortal: portalName,
    portals: [],
  };

  let manifest = fallbackManifest;
  if (await pathExists(manifestPath)) {
    try {
      manifest = {
        ...fallbackManifest,
        ...(JSON.parse(await fs.promises.readFile(manifestPath, 'utf-8')) as Partial<PortalManifest>),
      };
      manifest.portals = Array.isArray(manifest.portals) ? manifest.portals : [];
      manifest.defaultPortal = normalizePortalName(manifest.defaultPortal || portalName);
      manifest.portals = manifest.portals.map((portal) => {
        const normalizedName = normalizePortalName(portal.name || manifest.defaultPortal);
        return {
          ...portal,
          app: normalizePortalAppName((portal as any).app || DEFAULT_PORTAL_APP_NAME),
          name: normalizedName,
          path: normalizeManifestPortalPath((portal as any).path, normalizedName),
        };
      });
    } catch {
      manifest = fallbackManifest;
    }
  }

  const entry = {
    app: appName,
    name: portalName,
    path: `/${portalName}`,
    source: {
      type: sourceType,
      url: templateUrl,
      ...(commit ? { commit } : {}),
    },
  };
  const existingIndex = manifest.portals.findIndex(
    (portal) =>
      normalizePortalAppName((portal as any).app || DEFAULT_PORTAL_APP_NAME) === appName &&
      normalizePortalName(portal.name) === portalName,
  );

  if (existingIndex >= 0) {
    manifest.portals[existingIndex] = {
      ...manifest.portals[existingIndex],
      ...entry,
    };
  } else {
    manifest.portals.push(entry);
  }

  if (appName === DEFAULT_PORTAL_APP_NAME || !manifest.defaultPortal) {
    manifest.defaultPortal = portalName;
  }

  await fs.promises.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8');
}

export async function initializePortalFromEnv(options: InitPortalOptions = {}): Promise<void> {
  const developmentMode = normalizeInitDevelopmentMode(options.developmentMode ?? process.env.INIT_DEVELOPMENT_MODE);
  if (developmentMode === 'no-code') {
    return;
  }

  const appName = validatePortalAppName(options.appName ?? process.env.INIT_PORTAL_APP);
  const portalName = validatePortalName(options.portalName ?? process.env.INIT_PORTAL_NAME);
  const templateUrl =
    trimValue(options.portalTemplate ?? process.env.INIT_PORTAL_TEMPLATE) || resolveDefaultPortalTemplateDir();

  const portalDir = storagePathJoin('portals', appName, portalName);
  if (await pathExists(portalDir)) {
    throw new Error(`Portal "${portalName}" already exists at ${portalDir}. Refusing to overwrite it.`);
  }

  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'nocobase-portal-template-'));
  let cleanupPortalDir = false;
  try {
    const localTemplateDir = await getLocalTemplateDir(templateUrl);
    const templateDir = localTemplateDir || tempDir;
    if (!localTemplateDir) {
      await execFileAsync('git', ['clone', '--depth', '1', templateUrl, tempDir]);
    }

    const packageJsonPath = path.join(templateDir, 'package.json');
    if (!(await pathExists(packageJsonPath))) {
      throw new Error(`Portal template "${templateUrl}" is invalid: package.json is missing.`);
    }
    const sourceType = localTemplateDir ? 'local' : 'git';
    const commit =
      sourceType === 'git' ? (await readGitCommit(tempDir)) || (await readGitRemoteHead(templateUrl)) : undefined;
    cleanupPortalDir = true;
    await copyTemplate(templateDir, portalDir);
    await writePortalManifestForApp(appName, portalName, templateUrl, sourceType, commit);
    cleanupPortalDir = false;
  } catch (error) {
    if (cleanupPortalDir) {
      await fs.promises.rm(portalDir, { recursive: true, force: true });
    }
    throw error;
  } finally {
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
}
