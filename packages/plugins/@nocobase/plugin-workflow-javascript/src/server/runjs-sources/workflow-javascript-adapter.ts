/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { NoPermissionError, checkFilterParams, createUserProvider, parseJsonTemplate } from '@nocobase/acl';
import type { Database, Model, Transaction } from '@nocobase/database';
import {
  VscError,
  buildRunJSOwnerFingerprint,
  type RunJSLegacySource,
  type RunJSPublishedWriteResult,
  type RunJSSourceAdapter,
  type RunJSSourceAdapterContext,
  type RunJSSourceLocator,
  type RunJSSourcePermissionResult,
} from '@nocobase/plugin-vsc-file';

type WorkflowJavaScriptLocator = Extract<RunJSSourceLocator, { kind: 'workflow.javascript' }>;
type JsonRecord = Record<string, unknown>;

export function createWorkflowJavaScriptRunJSSourceAdapter(
  db: Database,
): RunJSSourceAdapter<WorkflowJavaScriptLocator> {
  return {
    kind: 'workflow.javascript',
    async assertCanRead({ locator, ctx }) {
      await assertScriptNodePermission(db, ctx, locator.nodeId, ['config']);
      await loadScriptNode(db, locator, ctx);
    },
    async assertCanWrite({ locator, ctx }) {
      await assertScriptNodePermission(db, ctx, locator.nodeId, ['config']);
      const node = await loadScriptNode(db, locator, ctx);
      await assertWorkflowNodeCanWrite(db, node, ctx);
    },
    async readLegacy({ locator, ctx }) {
      const node = await loadScriptNode(db, locator, ctx);
      const config = getNodeConfig(node);

      return {
        code: typeof config.content === 'string' ? config.content : '',
        version: 'workflow-js',
        label: buildNodeLabel(node),
        surfaceStyle: 'workflow',
        language: 'javascript',
        entryPath: 'src/main.js',
        entry: 'src/main.js',
        ownerFingerprint: buildWorkflowFingerprint(locator, node),
      } satisfies RunJSLegacySource;
    },
    async getFingerprint({ locator, ctx }) {
      return buildWorkflowFingerprint(locator, await loadScriptNode(db, locator, ctx));
    },
    async writePublished({ locator, artifact, baseOwnerFingerprint, ctx }) {
      const transaction = requireTransaction(ctx);
      await assertScriptNodePermission(db, ctx, locator.nodeId, ['config']);
      const node = await lockScriptNodeForUpdate(db, locator, transaction);
      await assertScriptNodePermission(db, ctx, locator.nodeId, ['config']);
      assertOwnerFingerprintMatches(buildWorkflowFingerprint(locator, node), baseOwnerFingerprint, locator.kind);
      await assertWorkflowNodeCanWrite(db, node, ctx);

      const config = cloneRecord(getNodeConfig(node));
      config.content = artifact.code;
      await node.update(
        {
          config,
        },
        {
          transaction,
        },
      );
      await touchWorkflow(db, node, transaction);

      return {
        ownerFingerprint: await this.getFingerprint({ locator, ctx }),
      } satisfies RunJSPublishedWriteResult;
    },
  };
}

async function lockScriptNodeForUpdate(
  db: Database,
  locator: WorkflowJavaScriptLocator,
  transaction: Transaction,
): Promise<Model> {
  const node = await db.getCollection('flow_nodes').model.findByPk(locator.nodeId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (!node || node.get('type') !== 'script') {
    throw new VscError('RUNJS_SOURCE_NOT_FOUND', `Workflow JavaScript node "${locator.nodeId}" was not found`, {
      details: {
        nodeId: locator.nodeId,
      },
    });
  }

  return node;
}

async function loadScriptNode(
  db: Database,
  locator: WorkflowJavaScriptLocator,
  ctx: RunJSSourceAdapterContext,
): Promise<Model> {
  const node = await db.getRepository('flow_nodes').findOne({
    filterByTk: locator.nodeId,
    transaction: ctx.transaction as Transaction | undefined,
  });

  if (!node || node.get('type') !== 'script') {
    throw new VscError('RUNJS_SOURCE_NOT_FOUND', `Workflow JavaScript node "${locator.nodeId}" was not found`, {
      details: {
        nodeId: locator.nodeId,
      },
    });
  }

  return node;
}

async function assertWorkflowNodeCanWrite(db: Database, node: Model, ctx: RunJSSourceAdapterContext): Promise<void> {
  const workflowId = node.get('workflowId');
  if (workflowId === undefined || workflowId === null) {
    return;
  }

  const workflow = await db.getRepository('workflows').findOne({
    filterByTk: workflowId,
    appends: ['versionStats'],
    transaction: ctx.transaction as Transaction | undefined,
  });
  const versionStats = workflow?.get('versionStats');

  if (isExecutedVersionStats(versionStats)) {
    throw new VscError('RUNJS_SOURCE_READONLY', 'Nodes in executed workflow could not be reconfigured', {
      details: {
        workflowId,
        nodeId: node.get('id'),
      },
    });
  }
}

async function assertScriptNodePermission(
  db: Database,
  ctx: RunJSSourceAdapterContext,
  nodeId: string | number,
  fields: string[],
): Promise<void> {
  const permission = requireSourcePermission(ctx, 'flow_nodes', 'update');
  assertPermissionAllowsFields(permission, fields, 'flow_nodes', 'update');
  await assertRecordMatchesPermissionFilter(db, ctx, 'flow_nodes', nodeId, permission);
}

function requireSourcePermission(
  ctx: RunJSSourceAdapterContext,
  resource: string,
  action: string,
): RunJSSourcePermissionResult {
  const permission = ctx.can?.({ resource, action });
  if (permission) {
    return permission;
  }

  throw new VscError('PERMISSION_DENIED', `RunJS source requires ${resource}:${action} permission`, {
    details: {
      resource,
      action,
    },
  });
}

async function assertRecordMatchesPermissionFilter(
  db: Database,
  ctx: RunJSSourceAdapterContext,
  resource: string,
  filterByTk: string | number,
  permission: RunJSSourcePermissionResult,
): Promise<void> {
  const filter = await parsePermissionFilter(db, ctx, resource, permission.params?.filter);
  if (!filter) {
    return;
  }

  const record = await db.getRepository(resource).findOne({
    filterByTk,
    filter,
    transaction: ctx.transaction as Transaction | undefined,
  });
  if (record) {
    return;
  }

  throw new VscError('PERMISSION_DENIED', `RunJS source owner is outside ${resource} permission scope`, {
    details: {
      resource,
      filterByTk,
    },
  });
}

async function parsePermissionFilter(
  db: Database,
  ctx: RunJSSourceAdapterContext,
  resource: string,
  filter: unknown,
): Promise<unknown> {
  if (!filter) {
    return undefined;
  }

  try {
    checkFilterParams(db.getCollection(resource), filter);
    return (
      (await parseJsonTemplate(filter, {
        state: ctx.state || {},
        timezone: ctx.timezone,
        userProvider: createUserProvider({
          db,
          currentUser: ctx.currentUser,
        }),
      })) ?? filter
    );
  } catch (error) {
    if (error instanceof NoPermissionError) {
      throw new VscError('PERMISSION_DENIED', `RunJS source requires ${resource} permission scope`, {
        details: {
          resource,
        },
      });
    }
    throw error;
  }
}

function assertPermissionAllowsFields(
  permission: RunJSSourcePermissionResult,
  fields: string[],
  resource: string,
  action: string,
): void {
  const whitelist = toStringList(permission.params?.whitelist || permission.params?.fields);
  if (whitelist && fields.some((field) => !whitelist.includes(field))) {
    throw new VscError('PERMISSION_DENIED', `RunJS source requires ${resource}:${action} field permission`, {
      details: {
        resource,
        action,
        fields,
      },
    });
  }

  const blacklist = toStringList(permission.params?.blacklist);
  if (blacklist && fields.some((field) => blacklist.includes(field))) {
    throw new VscError('PERMISSION_DENIED', `RunJS source requires ${resource}:${action} field permission`, {
      details: {
        resource,
        action,
        fields,
      },
    });
  }
}

function toStringList(value: unknown): string[] | null {
  if (typeof value === 'string' && value) {
    return [value];
  }
  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
    return value;
  }

  return null;
}

function buildWorkflowFingerprint(locator: WorkflowJavaScriptLocator, node: Model): string {
  const config = getNodeConfig(node);

  return buildRunJSOwnerFingerprint({
    locator,
    ownerUpdatedAt: {
      nodeId: node.get('id'),
      workflowId: node.get('workflowId'),
      updatedAt: toISOStringValue(node.get('updatedAt')),
      config,
    },
    selectedLegacyValue: config.content,
    selectedVersion: 'workflow-js',
  });
}

function assertOwnerFingerprintMatches(current: string, expected: string, kind: string): void {
  if (current === expected) {
    return;
  }

  throw new VscError('RUNJS_SOURCE_OWNER_OUTDATED', 'RunJS source owner was changed by another writer', {
    details: {
      expected: current,
      received: expected,
      kind,
    },
  });
}

function getNodeConfig(node: Model): JsonRecord {
  const config = node.get('config');
  return isRecord(config) ? config : {};
}

function buildNodeLabel(node: Model): string {
  const title = node.get('title');
  return typeof title === 'string' && title.trim() ? title.trim() : `Workflow JavaScript #${String(node.get('id'))}`;
}

function isExecutedVersionStats(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }
  const executed = value.executed;
  if (typeof executed === 'number') {
    return executed > 0;
  }
  if (typeof executed === 'string') {
    return /^[1-9]\d*$/.test(executed);
  }

  return false;
}

async function touchWorkflow(db: Database, node: Model, transaction: Transaction): Promise<void> {
  const workflowId = node.get('workflowId');
  if (workflowId === undefined || workflowId === null) {
    return;
  }

  await db.getCollection('workflows').model.update(
    {
      updatedAt: new Date(),
    },
    {
      where: {
        id: workflowId,
      },
      transaction,
      hooks: false,
    },
  );
}

function requireTransaction(ctx: RunJSSourceAdapterContext): Transaction {
  if (!ctx.transaction) {
    throw new VscError('INTERNAL_ERROR', 'RunJS source adapter writes require a transaction');
  }

  return ctx.transaction as Transaction;
}

function cloneRecord(value: JsonRecord): JsonRecord {
  return JSON.parse(JSON.stringify(value)) as JsonRecord;
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toISOStringValue(value: unknown): string | null {
  return value instanceof Date ? value.toISOString() : null;
}
