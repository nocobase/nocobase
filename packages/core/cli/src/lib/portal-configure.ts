/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { executeApiRequest } from './api-client.js';
import { translateCli } from './cli-locale.js';
import {
  resolvePortalAppContext,
  resolvePortalSourcePath,
  resolveSavedPortalSourcePath,
  validatePortalSlug,
  type PortalCreateEnvLike,
} from './portal-create.js';
import {
  buildPortalConfig,
  buildPortalConfigFromOptions,
  syncPortalConfigToRemote,
  type PortalConfig,
  type PortalSourceStorage,
} from './portal-config.js';
import { findPortalListItem } from './portal-info.js';
import { listPortalWorkspaces } from './portal-list.js';

type ApiRequest = typeof executeApiRequest;

export type PortalConfigureEnvLike = PortalCreateEnvLike;

export type PortalConfigureOptions = {
  portal: string;
  env: PortalConfigureEnvLike;
  envName?: string;
  cliVersion?: string;
  sourceStorage?: PortalSourceStorage;
  gitRepo?: string;
  gitBranch?: string;
  gitPath?: string;
  sourcePath?: string;
  apiRequest?: ApiRequest;
};

export type PortalConfigureResult = {
  app: string;
  portal: string;
  portalDir: string;
  config?: PortalConfig;
  remoteSynced: boolean;
  pathUpdated: boolean;
};

const portalConfigureText = (key: string, values?: Record<string, unknown>, fallback?: string) =>
  translateCli(`commands.portalConfigure.${key}`, values, { fallback });

function trimValue(value: unknown): string {
  return String(value ?? '').trim();
}

function hasSourceConfigurationChange(options: PortalConfigureOptions): boolean {
  return Boolean(
    options.sourceStorage !== undefined ||
      trimValue(options.gitRepo) ||
      trimValue(options.gitBranch) ||
      trimValue(options.gitPath),
  );
}

function hasPathConfigurationChange(options: PortalConfigureOptions): boolean {
  return Boolean(trimValue(options.sourcePath));
}

function buildConfigFromRemoteOptions(params: {
  portal: string;
  options?: Record<string, unknown>;
  sourceStorage?: string;
  gitRepo?: string;
  gitBranch?: string;
  gitPath?: string;
}): PortalConfig | undefined {
  if (params.options && Object.keys(params.options).length > 0) {
    return buildPortalConfigFromOptions(params.options, params.portal);
  }
  if (!params.sourceStorage && !params.gitRepo && !params.gitBranch && !params.gitPath) {
    return undefined;
  }
  return buildPortalConfig({
    portal: params.portal,
    sourceStorage: params.sourceStorage,
    gitRepo: params.gitRepo,
    gitBranch: params.gitBranch,
    gitPath: params.gitPath,
  });
}

export async function configurePortalWorkspace(options: PortalConfigureOptions): Promise<PortalConfigureResult> {
  const hasSourceChange = hasSourceConfigurationChange(options);
  const hasPathChange = hasPathConfigurationChange(options);
  if (!hasSourceChange && !hasPathChange) {
    throw new Error(
      portalConfigureText(
        'errors.noChanges',
        undefined,
        'No portal configuration changes were provided. Pass --path, --source-storage, or a --git-* flag.',
      ),
    );
  }

  const portal = validatePortalSlug(options.portal);
  const portalDir = hasPathChange
    ? resolvePortalSourcePath(portal, options.sourcePath)
    : resolveSavedPortalSourcePath(options.env, portal) ?? '';
  if (!hasSourceChange) {
    return {
      app: '',
      portal,
      portalDir,
      config: undefined,
      remoteSynced: false,
      pathUpdated: hasPathChange,
    };
  }

  const appContext = await resolvePortalAppContext(options);
  const { app } = appContext;
  let config: PortalConfig | undefined;
  let remoteSynced = false;

  const list = await listPortalWorkspaces({
    env: options.env,
    envName: options.envName,
    cliVersion: options.cliVersion,
    apiRequest: options.apiRequest,
    appContext,
  });
  const remoteItem = findPortalListItem(list.items, portal);
  if (!remoteItem) {
    throw new Error(
      portalConfigureText(
        'errors.notFound',
        { portal },
        `Portal "${portal}" was not found. Run \`nb portal list\` to see available portals.`,
      ),
    );
  }
  const existingConfig = buildConfigFromRemoteOptions({
    portal,
    options: remoteItem.options,
    sourceStorage: remoteItem.sourceStorage,
    gitRepo: remoteItem.gitRepo,
    gitBranch: remoteItem.gitBranch,
    gitPath: remoteItem.gitPath,
  });
  config = buildPortalConfig({
    portal,
    sourceStorage: options.sourceStorage,
    gitRepo: options.gitRepo,
    gitBranch: options.gitBranch,
    gitPath: options.gitPath,
    existingConfig,
  });
  await syncPortalConfigToRemote({
    portal,
    config,
    currentOptions: remoteItem.options,
    envName: options.envName,
    cliVersion: options.cliVersion,
    apiRequest: options.apiRequest,
  });
  remoteSynced = true;

  return {
    app,
    portal,
    portalDir,
    config,
    remoteSynced,
    pathUpdated: hasPathChange,
  };
}
