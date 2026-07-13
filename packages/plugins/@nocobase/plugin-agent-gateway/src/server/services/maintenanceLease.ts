/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { UniqueConstraintError } from 'sequelize';

import { ModelRecord, getModelString, getModelValue } from '../actions/utils';

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof UniqueConstraintError ||
    (error instanceof Error && error.name === 'SequelizeUniqueConstraintError')
  );
}

async function tryAcquireMaintenanceLease(plugin: Pick<Plugin, 'db'>, key: string, ownerId: string, ttlMs: number) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs);
  return await plugin.db.sequelize.transaction(async (transaction) => {
    const repository = plugin.db.getRepository('agMaintenanceLeases');
    const lease = (await repository.findOne({
      filterByTk: key,
      transaction,
      lock: transaction.LOCK.UPDATE,
    })) as ModelRecord | null;
    if (!lease) {
      await repository.create({
        values: { key, ownerId, expiresAt },
        transaction,
      });
      return true;
    }

    const currentOwnerId = getModelString(lease, 'ownerId');
    const currentExpiryValue = getModelValue(lease, 'expiresAt');
    const currentExpiry = currentExpiryValue ? new Date(String(currentExpiryValue)) : null;
    if (currentOwnerId !== ownerId && currentExpiry && currentExpiry.getTime() > now.getTime()) {
      return false;
    }

    await repository.update({
      filterByTk: key,
      values: { ownerId, expiresAt },
      transaction,
    });
    return true;
  });
}

async function releaseMaintenanceLease(plugin: Pick<Plugin, 'db'>, key: string, ownerId: string) {
  await plugin.db.sequelize.transaction(async (transaction) => {
    const repository = plugin.db.getRepository('agMaintenanceLeases');
    const lease = (await repository.findOne({
      filterByTk: key,
      transaction,
      lock: transaction.LOCK.UPDATE,
    })) as ModelRecord | null;
    if (!lease || getModelString(lease, 'ownerId') !== ownerId) {
      return;
    }
    await repository.destroy({
      filterByTk: key,
      transaction,
    });
  });
}

export async function runWithMaintenanceLease<T>(
  plugin: Pick<Plugin, 'db'>,
  options: {
    key: string;
    ownerId: string;
    ttlMs: number;
    task(): Promise<T>;
  },
): Promise<{ acquired: boolean; result?: T }> {
  let acquired = false;
  try {
    acquired = await tryAcquireMaintenanceLease(plugin, options.key, options.ownerId, options.ttlMs);
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }
    acquired = await tryAcquireMaintenanceLease(plugin, options.key, options.ownerId, options.ttlMs);
  }
  if (!acquired) {
    return { acquired: false };
  }

  try {
    return {
      acquired: true,
      result: await options.task(),
    };
  } finally {
    await releaseMaintenanceLease(plugin, options.key, options.ownerId);
  }
}
