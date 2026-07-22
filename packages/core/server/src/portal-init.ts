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
import { promisify } from 'util';
import { DEFAULT_PORTAL_NAME, PORTAL_MANIFEST_FILE, normalizePortalName } from './gateway/utils';

const execFileAsync = promisify(execFile);

export type InitDevelopmentMode = 'no-code' | 'vibe-coding';

export interface PortalManifest {
  defaultPortal: string;
  portals: Array<{
    name: string;
    source: {
      type: 'git';
      url: string;
      commit?: string;
    };
  }>;
}

export interface InitPortalOptions {
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

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function copyTemplate(sourceDir: string, targetDir: string): Promise<void> {
  await fs.promises.mkdir(path.dirname(targetDir), { recursive: true });
  await fs.promises.cp(sourceDir, targetDir, {
    recursive: true,
    filter: (source) => !source.split(path.sep).includes('.git'),
  });
}

async function readGitCommit(cwd: string): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd });
    return trimValue(stdout) || undefined;
  } catch {
    return undefined;
  }
}

async function writePortalManifest(portalName: string, templateUrl: string, commit?: string): Promise<void> {
  const manifestPath = storagePathJoin('portals', PORTAL_MANIFEST_FILE);
  const manifest: PortalManifest = {
    defaultPortal: portalName,
    portals: [
      {
        name: portalName,
        source: {
          type: 'git',
          url: templateUrl,
          ...(commit ? { commit } : {}),
        },
      },
    ],
  };
  await fs.promises.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8');
}

export async function initializePortalFromEnv(options: InitPortalOptions = {}): Promise<void> {
  const developmentMode = normalizeInitDevelopmentMode(options.developmentMode ?? process.env.INIT_DEVELOPMENT_MODE);
  if (developmentMode === 'no-code') {
    return;
  }

  const portalName = validatePortalName(options.portalName ?? process.env.INIT_PORTAL_NAME);
  const templateUrl = trimValue(options.portalTemplate ?? process.env.INIT_PORTAL_TEMPLATE);
  if (!templateUrl) {
    throw new Error('INIT_PORTAL_TEMPLATE is required when INIT_DEVELOPMENT_MODE is "vibe-coding".');
  }

  const portalDir = storagePathJoin('portals', portalName);
  if (await pathExists(portalDir)) {
    throw new Error(`Portal "${portalName}" already exists at ${portalDir}. Refusing to overwrite it.`);
  }

  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'nocobase-portal-template-'));
  let cleanupPortalDir = false;
  try {
    await execFileAsync('git', ['clone', '--depth', '1', templateUrl, tempDir]);
    const packageJsonPath = path.join(tempDir, 'package.json');
    if (!(await pathExists(packageJsonPath))) {
      throw new Error(`Portal template "${templateUrl}" is invalid: package.json is missing.`);
    }
    const commit = await readGitCommit(tempDir);
    cleanupPortalDir = true;
    await copyTemplate(tempDir, portalDir);
    await writePortalManifest(portalName, templateUrl, commit);
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
