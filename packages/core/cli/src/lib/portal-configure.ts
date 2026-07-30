/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { stat } from 'node:fs/promises';
import { executeApiRequest } from './api-client.js';
import { translateCli } from './cli-locale.js';
import {
  resolvePortalAppFromApiBaseUrl,
  validatePortalSlug,
  type PortalCreateEnvLike,
} from './portal-create.js';
import {
  buildPortalConfig,
  assertPortalConfigMatches,
  readPortalConfig,
  syncPortalConfigToRemote,
  writePortalConfig,
  type PortalConfig,
  type PortalSourceStorage,
} from './portal-config.js';
import { findPortalListItem } from './portal-info.js';
import { listPortalWorkspaces } from './portal-list.js';
import { resolvePortalWorkspaceDirectory } from './portal-workspace.js';

type ApiRequest = typeof executeApiRequest;

export type PortalConfigureEnvLike = PortalCreateEnvLike;

export type PortalConfigureOptions = {
  portal: string;
  directory?: string;
  env: PortalConfigureEnvLike;
  envName?: string;
  cliVersion?: string;
  sourceStorage?: PortalSourceStorage;
  gitRepo?: string;
  gitBranch?: string;
  gitPath?: string;
  apiRequest?: ApiRequest;
};

export type PortalConfigureResult = {
  app: string;
  portal: string;
  portalDir: string;
  config: PortalConfig;
  remoteSynced: boolean;
};

const portalConfigureText = (key: string, values?: Record<string, unknown>, fallback?: string) =>
  translateCli(`commands.portalConfigure.${key}`, values, { fallback });

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

function hasConfigurationChange(options: PortalConfigureOptions): boolean {
  return Boolean(
    options.sourceStorage !== undefined ||
      trimValue(options.gitRepo) ||
      trimValue(options.gitBranch) ||
      trimValue(options.gitPath),
  );
}

export async function configurePortalWorkspace(options: PortalConfigureOptions): Promise<PortalConfigureResult> {
  if (!hasConfigurationChange(options)) {
    throw new Error(
      portalConfigureText(
        'errors.noChanges',
        undefined,
        'No portal configuration changes were provided. Pass --source-storage or a --git-* flag.',
      ),
    );
  }

  const portal = validatePortalSlug(options.portal);
  const apiBaseUrl = trimValue(options.env.apiBaseUrl);
  const { app } = resolvePortalAppFromApiBaseUrl(apiBaseUrl, options.env.config.appPublicPath);
  const portalDir = await resolvePortalWorkspaceDirectory({
    portal,
    directory: options.directory,
    mode: 'existing',
  });

  if (!(await pathExists(portalDir))) {
    throw new Error(
      portalConfigureText(
        'errors.workspaceMissing',
        { portalDir, portal },
        `Portal does not exist: ${portalDir}\nRun \`nb portal create ${portal}\` or \`nb portal pull ${portal}\` first.`,
      ),
    );
  }

  const list = await listPortalWorkspaces({
    env: options.env,
    directory: portalDir,
    envName: options.envName,
    cliVersion: options.cliVersion,
    apiRequest: options.apiRequest,
  });
  const remoteItem = findPortalListItem(list.items, portal);
  const existingConfig = await readPortalConfig(portalDir);
  assertPortalConfigMatches(existingConfig, portal, portalDir);
  const config = buildPortalConfig({
    portal,
    sourceStorage: options.sourceStorage,
    gitRepo: options.gitRepo,
    gitBranch: options.gitBranch,
    gitPath: options.gitPath,
    existingConfig,
  });

  await writePortalConfig(portalDir, config);

  if (remoteItem) {
    await syncPortalConfigToRemote({
      portal,
      config,
      currentOptions: remoteItem.options,
      envName: options.envName,
      cliVersion: options.cliVersion,
      apiRequest: options.apiRequest,
    });
  }

  return {
    app,
    portal,
    portalDir,
    config,
    remoteSynced: Boolean(remoteItem),
  };
}
