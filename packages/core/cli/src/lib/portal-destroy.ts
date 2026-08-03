/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { executeApiRequest, type RequestOperation } from './api-client.js';
import { translateCli } from './cli-locale.js';
import {
  buildPortalBasePath,
  resolvePortalAppContext,
  resolvePortalDeployPath,
  resolveSavedPortalSourcePath,
  resolvePortalStoragePath,
  validatePortalSlug,
  type PortalCreateEnvLike,
} from './portal-create.js';

type ApiRequest = typeof executeApiRequest;

export type PortalDestroyEnvLike = PortalCreateEnvLike;

export type PortalDestroyMode = 'local' | 'docker' | 'http';

export type PortalDestroyOptions = {
  portal: string;
  env: PortalDestroyEnvLike;
  envName?: string;
  cliVersion?: string;
  force?: boolean;
  deleteDevPath?: boolean;
  apiRequest?: ApiRequest;
};

export type PortalDestroyResult = {
  app: string;
  portal: string;
  developmentPath: string;
  deploymentPath: string;
  portalBase: string;
  mode: PortalDestroyMode;
  recordDeleted: boolean;
  developmentPathDeleted: boolean;
  deploymentPathDeleted: boolean;
};

const portalDestroyText = (key: string, values?: Record<string, unknown>, fallback?: string) =>
  translateCli(`commands.portalDestroy.${key}`, values, { fallback });

const DESTROY_PORTAL_OPERATION: RequestOperation = {
  method: 'POST',
  pathTemplate: '/multiPortals:destroy',
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

async function pathExists(target: string): Promise<boolean> {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

function assertPortalDirIsInsideParent(parentDir: string, portalDir: string): void {
  const relative = path.relative(parentDir, portalDir);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(
      portalDestroyText(
        'errors.outsideParent',
        { parentDir, portalDir },
        `Refusing to delete a portal outside ${parentDir}: ${portalDir}`,
      ),
    );
  }
}

async function destroyMultiPortalRecord(params: {
  portal: string;
  envName?: string;
  cliVersion?: string;
  force?: boolean;
  apiRequest?: ApiRequest;
}): Promise<boolean> {
  const apiRequest = params.apiRequest ?? executeApiRequest;
  const response = await apiRequest({
    cliVersion: params.cliVersion ?? '',
    envName: params.envName,
    flags: {
      filter: {
        portalName: params.portal,
      },
    },
    operation: DESTROY_PORTAL_OPERATION,
  });

  if (response.ok) {
    return true;
  }

  if (params.force && response.status === 404) {
    return false;
  }

  throw new Error(
    portalDestroyText(
      'errors.recordDestroyFailed',
      { status: response.status, details: JSON.stringify(response.data, null, 2) },
      `Portal record destroy failed with status ${response.status}\n${JSON.stringify(response.data, null, 2)}`,
    ),
  );
}

export async function destroyPortalWorkspace(options: PortalDestroyOptions): Promise<PortalDestroyResult> {
  const portal = validatePortalSlug(options.portal);
  const storagePath = resolvePortalStoragePath(options.env);
  const { app, appPublicPath, portalBaseApp } = await resolvePortalAppContext(options);
  const portalBase = buildPortalBasePath({ app: portalBaseApp ?? app, appPublicPath, portal });
  const portalDeployDir = resolvePortalDeployPath({ storagePath, app, portal });
  const portalDevDir = resolveSavedPortalSourcePath(options.env, portal) ?? '';
  const mode = options.env.kind;

  if (mode !== 'local' && mode !== 'docker' && mode !== 'http') {
    throw new Error(
      portalDestroyText(
        'errors.unsupportedEnvKind',
        { kind: mode },
        `Cannot destroy a portal for ${mode} envs in the first version.`,
      ),
    );
  }
  const destroyMode: PortalDestroyMode = mode;

  if (portalDevDir) {
    assertPortalDirIsInsideParent(path.dirname(portalDevDir), portalDevDir);
  }
  assertPortalDirIsInsideParent(path.dirname(portalDeployDir), portalDeployDir);

  const developmentPathIsDeploymentPath = portalDevDir
    ? path.resolve(portalDevDir) === path.resolve(portalDeployDir)
    : false;
  const deploymentPathExists = await pathExists(portalDeployDir);
  const developmentPathExists =
    options.deleteDevPath && portalDevDir && !developmentPathIsDeploymentPath
      ? await pathExists(portalDevDir)
      : false;

  const recordDeleted = await destroyMultiPortalRecord({
    portal,
    envName: options.envName,
    cliVersion: options.cliVersion,
    force: options.force,
    apiRequest: options.apiRequest,
  });

  if (deploymentPathExists) {
    await rm(portalDeployDir, { recursive: true, force: true });
  }
  if (developmentPathExists) {
    await rm(portalDevDir, { recursive: true, force: true });
  }

  return {
    app,
    portal,
    developmentPath: portalDevDir,
    deploymentPath: portalDeployDir,
    portalBase,
    mode: destroyMode,
    recordDeleted,
    developmentPathDeleted:
      developmentPathExists || (Boolean(options.deleteDevPath) && developmentPathIsDeploymentPath && deploymentPathExists),
    deploymentPathDeleted: deploymentPathExists,
  };
}
