/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'crypto';

import { Context } from '@nocobase/actions';
import { Transaction } from 'sequelize';

import { createSkillCapabilityToken, hashSkillCapabilityToken, verifySkillCapabilityToken } from '../security';
import { isHeartbeatRunStatus } from '../../shared/runState';
import { ModelRecord, getModelNumber, getModelString, getModelValue } from './utils';

export interface SkillCapabilityBinding {
  nodeId: string;
  runId: string;
  claimAttempt: number;
  skillVersionId: string;
  sha256: string;
  expiresAt: Date;
}

export interface IssuedSkillCapability extends SkillCapabilityBinding {
  capabilityToken: string;
}

function getDateFromModel(model: ModelRecord, key: string) {
  const value = getModelValue(model, key);
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function issueSkillDownloadCapability(
  ctx: Context,
  binding: SkillCapabilityBinding,
  transaction: Transaction,
): Promise<IssuedSkillCapability> {
  const capability = createSkillCapabilityToken();
  await ctx.db.getRepository('agSkillDownloadCapabilities').create({
    values: {
      id: randomUUID(),
      tokenHash: capability.tokenHash,
      nodeId: binding.nodeId,
      runId: binding.runId,
      claimAttempt: binding.claimAttempt,
      skillVersionId: binding.skillVersionId,
      sha256: binding.sha256,
      expiresAt: binding.expiresAt,
    },
    transaction,
  });
  return {
    ...binding,
    capabilityToken: capability.token,
  };
}

export async function revokeSkillDownloadCapabilitiesForRun(ctx: Context, runId: string, transaction: Transaction) {
  await ctx.db.getRepository('agSkillDownloadCapabilities').destroy({
    filter: {
      runId,
    },
    transaction,
  });
}

export async function validateSkillDownloadCapability(
  ctx: Context,
  options: {
    capabilityToken: string;
    nodeId: string;
    runId: string;
    claimAttempt: number;
    skillVersionId: string;
    sha256: string;
    transaction?: Transaction;
  },
) {
  if (!options.capabilityToken) {
    return null;
  }
  const capability = (await ctx.db.getRepository('agSkillDownloadCapabilities').findOne({
    filter: {
      tokenHash: hashSkillCapabilityToken(options.capabilityToken),
      nodeId: options.nodeId,
      runId: options.runId,
      claimAttempt: options.claimAttempt,
      skillVersionId: options.skillVersionId,
      sha256: options.sha256,
    },
    transaction: options.transaction,
  })) as ModelRecord | null;
  if (!capability || !verifySkillCapabilityToken(options.capabilityToken, getModelString(capability, 'tokenHash'))) {
    return null;
  }

  const now = Date.now();
  const expiresAt = getDateFromModel(capability, 'expiresAt');
  if (!expiresAt || expiresAt.getTime() <= now) {
    return null;
  }

  const [node, run] = (await Promise.all([
    ctx.db.getRepository('agNodes').findOne({
      filterByTk: options.nodeId,
      transaction: options.transaction,
    }),
    ctx.db.getRepository('agRuns').findOne({
      filterByTk: options.runId,
      transaction: options.transaction,
    }),
  ])) as [ModelRecord | null, ModelRecord | null];
  if (!node || getModelString(node, 'status') !== 'active' || !run) {
    return null;
  }
  if (
    getModelString(run, 'nodeId') !== options.nodeId ||
    getModelNumber(run, 'claimAttempt') !== options.claimAttempt ||
    !isHeartbeatRunStatus(getModelString(run, 'status')) ||
    getModelValue(run, 'cancelRequested') === true
  ) {
    return null;
  }
  const claimExpiresAt = getDateFromModel(run, 'claimExpiresAt');
  if (!claimExpiresAt || claimExpiresAt.getTime() <= now) {
    return null;
  }

  return {
    capability,
    run,
  };
}
