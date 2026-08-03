/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'node:path';
import { executeApiRequest, type RequestOperation } from './api-client.js';
import { translateCli } from './cli-locale.js';

type ApiRequest = typeof executeApiRequest;

export type PortalSourceStorage = 'nocobase' | 'git';

export type PortalGitConfig = {
  repo: string;
  branch: string;
  path: string;
};

export type PortalConfig = {
  sourceStorage: PortalSourceStorage;
  git?: PortalGitConfig;
};

export type BuildPortalConfigOptions = {
  portal: string;
  sourceStorage?: string;
  gitRepo?: string;
  gitBranch?: string;
  gitPath?: string;
  existingConfig?: PortalConfig;
};

export const DEFAULT_PORTAL_GIT_PATH = '.';

const portalConfigText = (key: string, values?: Record<string, unknown>, fallback?: string) =>
  translateCli(`commands.portalConfig.${key}`, values, { fallback });

const UPDATE_PORTAL_OPERATION: RequestOperation = {
  method: 'POST',
  pathTemplate: '/multiPortals:update',
  hasBody: true,
  bodyRequired: true,
  parameters: [
    {
      name: 'filter',
      flagName: 'filter',
      in: 'query',
      type: 'object',
      required: true,
    },
  ],
};

function trimValue(value: unknown): string {
  return String(value ?? '').trim();
}

function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function validatePortalSourceStorage(value?: string): PortalSourceStorage {
  const sourceStorage = trimValue(value) || 'nocobase';
  if (sourceStorage === 'nocobase' || sourceStorage === 'git') {
    return sourceStorage;
  }
  throw new Error(
    portalConfigText(
      'errors.invalidSourceStorage',
      { value: sourceStorage },
      `Invalid source storage "${sourceStorage}". Use "nocobase" or "git".`,
    ),
  );
}

function isFullGitRemoteUrl(value: string): boolean {
  return /^(?:https?:\/\/|ssh:\/\/|file:\/\/|git@[^:]+:).+/.test(value);
}

function validateGitPath(value: string): string {
  const gitPath = trimValue(value);
  if (!gitPath || path.isAbsolute(gitPath) || gitPath.split(/[\\/]+/).includes('..')) {
    throw new Error(
      portalConfigText(
        'errors.invalidGitPath',
        { value },
        '--git-path must be a relative path inside the Git repository.',
      ),
    );
  }
  return gitPath.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
}

export function buildPortalConfig(options: BuildPortalConfigOptions): PortalConfig {
  const sourceStorage = validatePortalSourceStorage(options.sourceStorage ?? options.existingConfig?.sourceStorage);
  const hasGitOption = Boolean(trimValue(options.gitRepo) || trimValue(options.gitBranch) || trimValue(options.gitPath));
  if (sourceStorage === 'nocobase') {
    if (hasGitOption) {
      throw new Error(
        portalConfigText(
          'errors.gitOptionsForNocobaseStorage',
          undefined,
          '--git-repo, --git-branch, and --git-path can only be used with --source-storage git.',
        ),
      );
    }
    return { sourceStorage };
  }

  const repo = trimValue(options.gitRepo) || options.existingConfig?.git?.repo || '';
  if (!repo) {
    throw new Error(
      portalConfigText('errors.gitRepoRequired', undefined, '--git-repo is required when --source-storage is git.'),
    );
  }
  if (!isFullGitRemoteUrl(repo)) {
    throw new Error(
      portalConfigText('errors.gitRepoInvalid', undefined, '--git-repo must be a full Git remote URL.'),
    );
  }

  return {
    sourceStorage,
    git: {
      repo,
      branch: trimValue(options.gitBranch) || options.existingConfig?.git?.branch || 'main',
      path: validateGitPath(trimValue(options.gitPath) || options.existingConfig?.git?.path || DEFAULT_PORTAL_GIT_PATH),
    },
  };
}

export function buildPortalConfigFromOptions(options: unknown, portal: string): PortalConfig {
  const sourceOptions = readObject(options);
  const git = readObject(sourceOptions.git);
  return buildPortalConfig({
    portal,
    sourceStorage: trimValue(sourceOptions.sourceStorage) || 'nocobase',
    gitRepo: trimValue(git.repo),
    gitBranch: trimValue(git.branch),
    gitPath: trimValue(git.path),
  });
}

export function mergePortalConfigIntoOptions(config: PortalConfig, currentOptions?: Record<string, unknown>) {
  const nextOptions: Record<string, unknown> = {
    ...(currentOptions ?? {}),
    sourceStorage: config.sourceStorage,
  };

  if (config.sourceStorage === 'git') {
    nextOptions.git = config.git;
  } else {
    delete nextOptions.git;
  }

  return nextOptions;
}

export async function syncPortalConfigToRemote(options: {
  portal: string;
  config: PortalConfig;
  currentOptions?: Record<string, unknown>;
  envName?: string;
  cliVersion?: string;
  apiRequest?: ApiRequest;
}): Promise<void> {
  const apiRequest = options.apiRequest ?? executeApiRequest;
  const response = await apiRequest({
    cliVersion: options.cliVersion ?? '',
    envName: options.envName,
    flags: {
      filter: {
        portalName: options.portal,
      },
      body: JSON.stringify({
        options: mergePortalConfigIntoOptions(options.config, options.currentOptions),
      }),
    },
    operation: UPDATE_PORTAL_OPERATION,
  });

  if (!response.ok) {
    throw new Error(
      portalConfigText(
        'errors.updateFailed',
        { status: response.status, details: JSON.stringify(response.data, null, 2) },
        `Portal config update failed with status ${response.status}\n${JSON.stringify(response.data, null, 2)}`,
      ),
    );
  }
}
