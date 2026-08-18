/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Transaction } from '@nocobase/database';
import type { Application } from '@nocobase/server';
import {
  buildRunJSSourceRepositoryIdentity,
  getOrCreateRunJSWorkspaceServerModule,
  type RunJSSourceLocator,
  VscFileService,
} from '@nocobase/runjs/workspace/server';
import _ from 'lodash';

import { resolveFlowSurfaceRunJSHost } from '../flow-surfaces/page-surface-contract';

type RunJSRepositoryRecord = {
  id: string;
  status?: string;
};

export async function archiveRunJSRepositoriesForNodeTree(
  app: Application,
  db: Database,
  node: unknown,
  options: {
    transaction?: Transaction;
    requestSource: string;
  },
): Promise<void> {
  const repositories = await collectRunJSRepositoriesForNodeTree(db, node, options.transaction);
  if (!repositories.size) {
    return;
  }

  const permissionHooks = getOrCreateRunJSWorkspaceServerModule(app, db).getPermissionHookRegistry();
  const vscFileService = new VscFileService(db, permissionHooks);

  for (const repository of repositories.values()) {
    if (repository.status === 'archived') {
      continue;
    }
    await vscFileService.archiveRepository(
      { repoId: repository.id },
      {
        transaction: options.transaction,
        request: {
          resourceName: 'runJSSources',
          actionName: 'archiveRepository',
          requestSource: options.requestSource,
        },
      },
    );
  }
}

async function collectRunJSRepositoriesForNodeTree(
  db: Database,
  node: unknown,
  transaction?: Transaction,
): Promise<Map<string, RunJSRepositoryRecord>> {
  if (!db.hasCollection('vscFileRepositories')) {
    return new Map();
  }
  const repositoryRecords = await Promise.all(
    collectRunJSSourceLocatorsForNodeTree(node).map(async (locator) => {
      const identity = buildRunJSSourceRepositoryIdentity(locator);
      return db.getRepository('vscFileRepositories').findOne({
        filter: {
          ownerType: identity.ownerType,
          ownerId: identity.ownerId,
          name: identity.name,
        },
        fields: ['id', 'status'],
        transaction,
      });
    }),
  );
  const repositories = new Map<string, RunJSRepositoryRecord>();
  for (const repository of repositoryRecords) {
    const repoId = readRecordField(repository, 'id');
    if (typeof repoId !== 'string' || !repoId) {
      continue;
    }
    const status = readRecordField(repository, 'status');
    repositories.set(repoId, {
      id: repoId,
      ...(typeof status === 'string' ? { status } : {}),
    });
  }
  return repositories;
}

function collectRunJSSourceLocatorsForNodeTree(node: unknown): RunJSSourceLocator[] {
  const locators: RunJSSourceLocator[] = [];
  const visit = (value: unknown) => {
    if (!_.isPlainObject(value)) {
      return;
    }
    const current = value as Record<string, unknown>;
    if (typeof current.uid !== 'string' || !current.uid) {
      return;
    }
    const modelUid = current.uid;
    const runJSHost = resolveFlowSurfaceRunJSHost(current.use);
    if (runJSHost) {
      locators.push({
        kind: 'flowModel.step',
        modelUid,
        flowKey: runJSHost.flowKey,
        stepKey: 'runJs',
        paramPath: ['code'],
        versionPath: ['version'],
      });
    }
    const flowRegistry = _.isPlainObject(current.flowRegistry) ? current.flowRegistry : {};
    Object.entries(flowRegistry).forEach(([flowKey, flowValue]) => {
      const flow = _.isPlainObject(flowValue) ? (flowValue as Record<string, unknown>) : {};
      const steps = _.isPlainObject(flow.steps) ? (flow.steps as Record<string, unknown>) : {};
      Object.entries(steps).forEach(([stepKey, stepValue]) => {
        if (!_.isPlainObject(stepValue)) {
          return;
        }
        const step = stepValue as Record<string, unknown>;
        if (String(step.use || step.type || '').trim() !== 'runjs') {
          return;
        }
        const params = _.isPlainObject(step.params) ? (step.params as Record<string, unknown>) : {};
        const defaultParams = _.isPlainObject(step.defaultParams)
          ? (step.defaultParams as Record<string, unknown>)
          : {};
        const sourcePath = typeof params.code === 'string' ? ['params', 'code'] : ['defaultParams', 'code'];
        if (typeof params.code === 'string' || typeof defaultParams.code === 'string') {
          locators.push({
            kind: 'flowModel.flowRegistry.runjs',
            modelUid,
            flowKey,
            stepKey,
            sourcePath,
          });
        }
      });
    });
    const subModels = _.isPlainObject(current.subModels) ? (current.subModels as Record<string, unknown>) : {};
    Object.values(subModels).forEach((children) => {
      _.castArray(children).forEach(visit);
    });
  };

  visit(node);
  return locators;
}

function readRecordField(record: unknown, field: string): unknown {
  if (!record || typeof record !== 'object') {
    return undefined;
  }
  const model = record as { get?: (key: string) => unknown } & Record<string, unknown>;
  return typeof model.get === 'function' ? model.get(field) : model[field];
}
