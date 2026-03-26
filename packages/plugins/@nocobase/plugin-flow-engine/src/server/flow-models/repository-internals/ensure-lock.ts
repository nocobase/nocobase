/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Transaction } from '@nocobase/database';

const ensureObjectChildLockWaiters = new Map<string, Promise<void>>();
const ensureObjectChildLockOwners = new Map<string, string>();

export function getEnsureObjectChildLockKey(parentId: string, subKey: string) {
  return `object-child:${parentId}\u0000${subKey}\u0000object`;
}

export function getTransactionId(transaction?: Transaction) {
  const rawTransactionId = (transaction as (Transaction & { id?: string | number }) | undefined)?.id;
  return rawTransactionId == null ? undefined : String(rawTransactionId);
}

export async function acquireEnsureObjectChildLock(key: string, ownerTransactionId?: string) {
  const previous = ensureObjectChildLockWaiters.get(key);
  let releaseCurrent!: () => void;
  const current = new Promise<void>((resolve) => {
    releaseCurrent = resolve;
  });
  ensureObjectChildLockWaiters.set(key, current);

  await previous;

  if (ownerTransactionId) {
    ensureObjectChildLockOwners.set(key, ownerTransactionId);
  }

  let released = false;
  return () => {
    if (released) {
      return;
    }
    released = true;
    if (ownerTransactionId && ensureObjectChildLockOwners.get(key) === ownerTransactionId) {
      ensureObjectChildLockOwners.delete(key);
    }
    releaseCurrent();
    if (ensureObjectChildLockWaiters.get(key) === current) {
      ensureObjectChildLockWaiters.delete(key);
    }
  };
}

export function isEnsureObjectChildLockOwner(key: string, transaction?: Transaction) {
  const transactionId = getTransactionId(transaction);
  return !!transactionId && ensureObjectChildLockOwners.get(key) === transactionId;
}

export function registerEnsureObjectChildLockRelease(
  database: any,
  transaction: Transaction | undefined,
  release: () => void,
) {
  const transactionId = getTransactionId(transaction);
  if (!database || !transaction || !transactionId) {
    return false;
  }

  const eventName = `transactionRollback:${transactionId}`;
  let settled = false;

  const releaseOnce = () => {
    if (settled) {
      return;
    }
    settled = true;
    release();
  };

  const onRollback = () => {
    releaseOnce();
  };

  database.once(eventName, onRollback);
  transaction.afterCommit(() => {
    database.removeListener?.(eventName, onRollback);
    releaseOnce();
  });

  return true;
}

export async function emitFlowModelTransactionRollback(database: any, transaction?: Transaction) {
  const transactionId = getTransactionId(transaction);
  if (!database || !transactionId) {
    return;
  }

  await database.emitAsync?.(`transactionRollback:${transactionId}`);
}
