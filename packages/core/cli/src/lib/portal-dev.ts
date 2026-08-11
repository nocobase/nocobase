/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { stat } from 'node:fs/promises';
import path from 'node:path';
import { executeApiRequest } from './api-client.js';
import { translateCli } from './cli-locale.js';
import {
  buildPortalBasePath,
  resolvePortalAppContext,
  resolveSavedPortalSourcePath,
  resolvePortalSourcePath,
  validatePortalSlug,
  type PortalCreateEnvLike,
} from './portal-create.js';
import { buildPortalCommandEnv } from './portal-command-env.js';
import { updatePortalEnvFiles } from './portal-env-files.js';
import { run, runPnpmCommand, type RunCommand } from './run-npm.js';

type ApiRequest = typeof executeApiRequest;

export type PortalDevEnvLike = PortalCreateEnvLike;

export type PortalDevOptions = {
  portal: string;
  env: PortalDevEnvLike;
  envName?: string;
  cliVersion?: string;
  runCommand?: RunCommand;
  apiRequest?: ApiRequest;
  onStart?: (result: PortalDevResult) => void;
};

export type PortalDevMode = 'local' | 'docker' | 'http';

export type PortalDevResult = {
  app: string;
  portal: string;
  portalDir: string;
  portalBase: string;
  mode: PortalDevMode;
};

const portalDevText = (key: string, values?: Record<string, unknown>, fallback?: string) =>
  translateCli(`commands.portalDev.${key}`, values, { fallback });

function trimValue(value: unknown): string {
  return String(value ?? '').trim();
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function assertFileExists(filePath: string, message: string): Promise<void> {
  try {
    const fileStat = await stat(filePath);
    if (fileStat.isFile()) {
      return;
    }
  } catch {
    // Throw the normalized message below.
  }
  throw new Error(message);
}

export async function devPortalWorkspace(options: PortalDevOptions): Promise<PortalDevResult> {
  const portal = validatePortalSlug(options.portal);
  const apiBaseUrl = trimValue(options.env.apiBaseUrl);
  if (options.env.kind === 'ssh') {
    throw new Error(
      portalDevText(
        'errors.sshUnsupported',
        undefined,
        'Cannot start a portal in dev mode for ssh envs in the first version.',
      ),
    );
  }
  const { app, appPublicPath, portalBaseApp } = await resolvePortalAppContext(options);
  const portalBase = buildPortalBasePath({ app: portalBaseApp ?? app, appPublicPath, portal });
  const portalDir = resolveSavedPortalSourcePath(options.env, portal) ?? resolvePortalSourcePath(portal);

  if (!(await pathExists(portalDir))) {
    throw new Error(
      portalDevText(
        'errors.workspaceMissing',
        { portalDir, portal },
        `Portal does not exist: ${portalDir}\nRun \`nb portal create ${portal}\` first.`,
      ),
    );
  }
  await assertFileExists(
    path.join(portalDir, 'package.json'),
    portalDevText(
      'errors.packageJsonMissing',
      { portalDir },
      `Portal is invalid: package.json is missing in ${portalDir}.`,
    ),
  );

  await updatePortalEnvFiles({
    portalDir,
    portal,
    apiBaseUrl,
  });

  const result: PortalDevResult = {
    app,
    portal,
    portalDir,
    portalBase,
    mode: options.env.kind as PortalDevMode,
  };
  options.onStart?.(result);

  const runCommand = options.runCommand ?? run;
  await runPnpmCommand(runCommand, ['dev'], {
    cwd: portalDir,
    env: buildPortalCommandEnv({
      NOCOBASE_PORTAL_NAME: portal,
      NOCOBASE_API_PROXY_TARGET: apiBaseUrl,
    }),
    envMode: 'replace',
    errorName: 'pnpm dev',
  });

  return result;
}
