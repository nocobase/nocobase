/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'crypto';

import { Context, Next } from '@nocobase/actions';
import { Plugin } from '@nocobase/server';
import { Transaction } from 'sequelize';

import { AGENT_GATEWAY_API_ACTIONS, getAgentGatewayApiActionName } from '../../shared/apiContract';
import { authenticateNodeToken } from '../security';
import {
  JsonRecord,
  ModelRecord,
  getBodyValues,
  asActionContext,
  getActionTargetKey,
  getDate,
  getModelJson,
  getModelString,
  getModelTargetKey,
  getRecord,
  getString,
} from './utils';

function getInstallStatus(ctx: Context, value: unknown) {
  const status = getString(value) || 'installed';
  if (!['pending', 'syncing', 'installed', 'failed', 'removed'].includes(status)) {
    ctx.throw(400, 'Skill install status must be pending, syncing, installed, failed, or removed');
  }
  return status;
}

function getRequiredString(ctx: Context, value: unknown, name: string) {
  const stringValue = getString(value);
  if (!stringValue) {
    ctx.throw(400, `${name} is required`);
  }
  return stringValue;
}

async function authenticateNodeId(ctx: Context, nodeId: string) {
  const auth = await authenticateNodeToken(ctx);
  if (String(auth.subject.nodeId) !== nodeId) {
    ctx.throw(403, 'Node token does not match requested node');
  }
  return auth;
}

async function assertSkillVersionExists(ctx: Context, skillVersionId: string, transaction: Transaction) {
  const skillVersion = (await ctx.db.getRepository('agSkillVersions').findOne({
    filterByTk: skillVersionId,
    transaction,
    lock: transaction.LOCK.UPDATE,
  })) as ModelRecord | null;
  if (!skillVersion) {
    ctx.throw(404, 'Skill version not found');
  }
}

function serializeInstall(install: ModelRecord) {
  return getModelJson(install);
}

function getInstallValues(ctx: Context, nodeId: string, skillVersionId: string, values: JsonRecord) {
  const status = getInstallStatus(ctx, values.status);
  const now = new Date();
  return {
    nodeId,
    skillVersionId,
    status,
    installedAt: getDate(values.installedAt) || (status === 'installed' ? now : null),
    lastSeenAt: getDate(values.lastSeenAt) || now,
    capabilitiesSnapshotJson: getRecord(values.capabilitiesSnapshotJson || values.capabilitiesSnapshot),
    settingsSnapshotJson: getRecord(values.settingsSnapshotJson || values.settingsSnapshot),
  };
}

async function upsertNodeSkillInstall(ctx: Context, nodeId: string) {
  await authenticateNodeId(ctx, nodeId);
  const values = getBodyValues(ctx);
  const skillVersionId = getRequiredString(ctx, values.skillVersionId, 'skillVersionId');
  const result = await ctx.db.sequelize.transaction(async (transaction) => {
    await assertSkillVersionExists(ctx, skillVersionId, transaction);
    const repo = ctx.db.getRepository('agNodeSkillInstalls');
    const existing = (await repo.findOne({
      filter: {
        nodeId,
        skillVersionId,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    })) as ModelRecord | null;

    const installValues = getInstallValues(ctx, nodeId, skillVersionId, values);
    if (existing) {
      await repo.update({
        filterByTk: getModelTargetKey(existing, 'id'),
        values: installValues,
        transaction,
      });
      const updated = (await repo.findOne({
        filterByTk: getModelTargetKey(existing, 'id'),
        transaction,
      })) as ModelRecord;
      return {
        ...serializeInstall(updated),
        idempotent: getModelString(existing, 'status') === installValues.status,
      };
    }

    const install = (await repo.create({
      values: {
        id: randomUUID(),
        ...installValues,
      },
      transaction,
    })) as ModelRecord;
    return {
      ...serializeInstall(install),
      idempotent: false,
    };
  });

  ctx.body = result;
}

export function registerSkillInstallRoutes(plugin: Plugin) {
  plugin.app.resourceManager.registerActionHandlers({
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.upsertNodeSkillInstall)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      await upsertNodeSkillInstall(actionCtx, getActionTargetKey(actionCtx));
      await next();
    },
  });
}
