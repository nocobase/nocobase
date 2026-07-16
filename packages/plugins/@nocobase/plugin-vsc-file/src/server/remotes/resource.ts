/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import type { HandlerType, ResourceOptions } from '@nocobase/resourcer';

import { RemoteSyncError } from './RemoteSyncAdapter';

export const remoteInternalResourceNames = [
  'vscFileRemotes',
  'vscFileSyncJobs',
  'vscFileExternalCommitMaps',
  'vscFileConflicts',
] as const;

const deniedActionNames = ['list', 'get', 'create', 'update', 'destroy', 'firstOrCreate', 'updateOrCreate'] as const;

export function createRemoteInternalResources(): ResourceOptions[] {
  return remoteInternalResourceNames.map((name) => ({
    name,
    only: [...deniedActionNames],
    actions: Object.fromEntries(
      deniedActionNames.map((actionName) => [actionName, denyRemoteInternalAccess]),
    ) as Record<(typeof deniedActionNames)[number], HandlerType>,
  }));
}

const denyRemoteInternalAccess: HandlerType = async (ctx: Context) => {
  const error = new RemoteSyncError('PERMISSION_DENIED', 'Remote synchronization records are server-internal', {
    details: { reasonCode: 'remote-internal-resource' },
  });
  const resourceCtx = ctx as Context & {
    withoutDataWrapping?: boolean;
    type?: string;
    status?: number;
    body?: unknown;
  };
  resourceCtx.withoutDataWrapping = true;
  resourceCtx.type = 'application/json';
  resourceCtx.status = error.status;
  resourceCtx.body = error.toResponseBody();
};
