/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model, Transaction } from '@nocobase/database';

import type { VscFileConflictRecord } from '../../shared/remote-sync-types';
import { RemoteSyncError } from './RemoteSyncAdapter';

export interface UpsertConflictInput {
  remoteId: string;
  remoteTargetVersion: number;
  baseLocalCommitId: string | null;
  baseRemoteRevision: string | null;
  currentLocalCommitId: string | null;
  currentRemoteRevision: string | null;
  localContentHash: string | null;
  remoteContentHash: string | null;
  reasonCode: string;
}

export type ConflictStoreClock = () => Date;

export class ConflictStore {
  constructor(
    private readonly db: Database,
    private readonly clock: ConflictStoreClock = () => new Date(),
  ) {}

  async upsert(input: UpsertConflictInput, transaction?: Transaction): Promise<VscFileConflictRecord> {
    return this.withTransaction(transaction, async (currentTransaction) => {
      await this.assertCurrentRemoteVersion(input.remoteId, input.remoteTargetVersion, currentTransaction);
      const existing = await this.db.getRepository('vscFileConflicts').findOne({
        filter: {
          remoteId: input.remoteId,
          remoteTargetVersion: input.remoteTargetVersion,
          baseLocalCommitId: input.baseLocalCommitId,
          baseRemoteRevision: input.baseRemoteRevision,
          currentLocalCommitId: input.currentLocalCommitId,
          currentRemoteRevision: input.currentRemoteRevision,
          localContentHash: input.localContentHash,
          remoteContentHash: input.remoteContentHash,
          reasonCode: input.reasonCode,
        },
        transaction: currentTransaction,
        lock: currentTransaction.LOCK.UPDATE,
      });

      if (existing) {
        if (existing.get('status') !== 'open') {
          await existing.update(
            {
              status: 'open',
              resolvedAt: null,
            },
            { transaction: currentTransaction },
          );
        }
        return conflictFromRecord(existing);
      }

      const record = await this.db.getRepository('vscFileConflicts').create({
        values: {
          ...input,
          status: 'open',
          resolvedAt: null,
        },
        transaction: currentTransaction,
      });

      return conflictFromRecord(record);
    });
  }

  async listOpen(remoteId: string, transaction?: Transaction): Promise<VscFileConflictRecord[]> {
    return this.withTransaction(transaction, async (currentTransaction) => {
      const version = await this.getCurrentRemoteVersion(remoteId, currentTransaction);
      const records = await this.db.getRepository('vscFileConflicts').find({
        filter: {
          remoteId,
          remoteTargetVersion: version,
          status: 'open',
        },
        sort: ['createdAt'],
        transaction: currentTransaction,
      });

      return records.map(conflictFromRecord);
    });
  }

  async resolve(conflictId: string, transaction?: Transaction): Promise<VscFileConflictRecord> {
    return this.withTransaction(transaction, async (currentTransaction) => {
      const model = this.db.getModel<Model>('vscFileConflicts');
      const initial = await model.findByPk(conflictId, {
        transaction: currentTransaction,
        attributes: ['remoteId'],
      });
      if (!initial) {
        throw new RemoteSyncError('DIVERGED', `Conflict "${conflictId}" was not found`, {
          details: { reasonCode: 'conflict-not-found' },
        });
      }

      const remoteId = initial.get('remoteId') as string;
      const currentVersion = await this.getCurrentRemoteVersion(remoteId, currentTransaction);
      const record = await model.findByPk(conflictId, {
        transaction: currentTransaction,
        lock: currentTransaction.LOCK.UPDATE,
      });
      if (!record) {
        throw new RemoteSyncError('DIVERGED', `Conflict "${conflictId}" was not found`, {
          details: { reasonCode: 'conflict-not-found' },
        });
      }
      if (record.get('remoteId') !== remoteId || (record.get('remoteTargetVersion') as number) !== currentVersion) {
        throw new RemoteSyncError('REMOTE_CHANGED', 'Remote target version changed', {
          details: { reasonCode: 'remote-target-version-changed', remoteTargetVersion: currentVersion },
        });
      }
      if (record.get('status') !== 'resolved') {
        await record.update(
          {
            status: 'resolved',
            resolvedAt: this.clock(),
          },
          { transaction: currentTransaction },
        );
      }

      return conflictFromRecord(record);
    });
  }

  private async assertCurrentRemoteVersion(
    remoteId: string,
    expectedVersion: number,
    transaction: Transaction,
  ): Promise<void> {
    const model = this.db.getModel<Model>('vscFileRemotes');
    const remote = await model.findByPk(remoteId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!remote) {
      throw new RemoteSyncError('REMOTE_NOT_FOUND', `Remote "${remoteId}" was not found`);
    }

    const currentVersion = remote.get('version') as number;
    if (currentVersion !== expectedVersion) {
      throw new RemoteSyncError('REMOTE_CHANGED', 'Remote target version changed', {
        details: { reasonCode: 'remote-target-version-changed', remoteTargetVersion: currentVersion },
      });
    }
  }

  private async getCurrentRemoteVersion(remoteId: string, transaction: Transaction): Promise<number> {
    const model = this.db.getModel<Model>('vscFileRemotes');
    const remote = await model.findByPk(remoteId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!remote) {
      throw new RemoteSyncError('REMOTE_NOT_FOUND', `Remote "${remoteId}" was not found`);
    }

    return remote.get('version') as number;
  }

  private async withTransaction<T>(
    transaction: Transaction | undefined,
    run: (transaction: Transaction) => Promise<T>,
  ): Promise<T> {
    if (transaction) {
      return run(transaction);
    }

    return this.db.sequelize.transaction(run);
  }
}

export function conflictFromRecord(record: Model): VscFileConflictRecord {
  return {
    id: record.get('id') as string,
    remoteId: record.get('remoteId') as string,
    remoteTargetVersion: record.get('remoteTargetVersion') as number,
    status: record.get('status') as VscFileConflictRecord['status'],
    baseLocalCommitId: nullableString(record.get('baseLocalCommitId')),
    baseRemoteRevision: nullableString(record.get('baseRemoteRevision')),
    currentLocalCommitId: nullableString(record.get('currentLocalCommitId')),
    currentRemoteRevision: nullableString(record.get('currentRemoteRevision')),
    localContentHash: nullableString(record.get('localContentHash')),
    remoteContentHash: nullableString(record.get('remoteContentHash')),
    reasonCode: record.get('reasonCode') as string,
    createdAt: nullableDateString(record.get('createdAt')) || undefined,
    updatedAt: nullableDateString(record.get('updatedAt')) || undefined,
    resolvedAt: nullableDateString(record.get('resolvedAt')),
  };
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function nullableDateString(value: unknown): string | null {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return typeof value === 'string' ? value : null;
}
