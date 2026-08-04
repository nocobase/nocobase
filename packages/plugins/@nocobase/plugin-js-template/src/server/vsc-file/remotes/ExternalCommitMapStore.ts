/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model, Transaction } from '@nocobase/database';

import type { VscFileExternalCommitMapRecord } from '../../../shared/vsc-file/remote-sync-types';
import { RemoteSyncError } from './RemoteSyncAdapter';

export interface RecordExternalCommitMapInput {
  remoteId: string;
  remoteTargetVersion: number;
  localCommitId: string;
  remoteRevision: string;
  contentHash: string;
}

export class ExternalCommitMapStore {
  constructor(private readonly db: Database) {}

  async record(
    input: RecordExternalCommitMapInput,
    transaction?: Transaction,
  ): Promise<VscFileExternalCommitMapRecord> {
    return this.withTransaction(transaction, async (currentTransaction) => {
      await this.assertCurrentRemoteVersion(input.remoteId, input.remoteTargetVersion, currentTransaction);
      const existing = await this.db.getRepository('vscFileExternalCommitMaps').findOne({
        filter: {
          remoteId: input.remoteId,
          remoteTargetVersion: input.remoteTargetVersion,
          $or: [{ localCommitId: input.localCommitId }, { remoteRevision: input.remoteRevision }],
        },
        transaction: currentTransaction,
      });

      if (existing) {
        const mapping = externalCommitMapFromRecord(existing);
        if (
          mapping.localCommitId === input.localCommitId &&
          mapping.remoteRevision === input.remoteRevision &&
          mapping.contentHash === input.contentHash
        ) {
          return mapping;
        }

        throw new RemoteSyncError('REMOTE_CHANGED', 'External commit mapping conflicts with an existing baseline', {
          details: { reasonCode: 'external-commit-map-conflict' },
        });
      }

      const record = await this.db.getRepository('vscFileExternalCommitMaps').create({
        values: input,
        transaction: currentTransaction,
      });

      return externalCommitMapFromRecord(record);
    });
  }

  async findLatest(remoteId: string, transaction?: Transaction): Promise<VscFileExternalCommitMapRecord | null> {
    return this.withTransaction(transaction, async (currentTransaction) => {
      const version = await this.getCurrentRemoteVersion(remoteId, currentTransaction);
      const record = await this.db.getRepository('vscFileExternalCommitMaps').findOne({
        filter: {
          remoteId,
          remoteTargetVersion: version,
        },
        sort: ['-createdAt'],
        transaction: currentTransaction,
      });

      return record ? externalCommitMapFromRecord(record) : null;
    });
  }

  async findByLocalCommit(
    remoteId: string,
    localCommitId: string,
    transaction?: Transaction,
  ): Promise<VscFileExternalCommitMapRecord | null> {
    return this.withTransaction(transaction, async (currentTransaction) => {
      const version = await this.getCurrentRemoteVersion(remoteId, currentTransaction);
      const record = await this.db.getRepository('vscFileExternalCommitMaps').findOne({
        filter: {
          remoteId,
          remoteTargetVersion: version,
          localCommitId,
        },
        transaction: currentTransaction,
      });

      return record ? externalCommitMapFromRecord(record) : null;
    });
  }

  async findByRemoteRevision(
    remoteId: string,
    remoteRevision: string,
    transaction?: Transaction,
  ): Promise<VscFileExternalCommitMapRecord | null> {
    return this.withTransaction(transaction, async (currentTransaction) => {
      const version = await this.getCurrentRemoteVersion(remoteId, currentTransaction);
      const record = await this.db.getRepository('vscFileExternalCommitMaps').findOne({
        filter: {
          remoteId,
          remoteTargetVersion: version,
          remoteRevision,
        },
        transaction: currentTransaction,
      });

      return record ? externalCommitMapFromRecord(record) : null;
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

export function externalCommitMapFromRecord(record: Model): VscFileExternalCommitMapRecord {
  return {
    id: record.get('id') as string,
    remoteId: record.get('remoteId') as string,
    remoteTargetVersion: record.get('remoteTargetVersion') as number,
    localCommitId: record.get('localCommitId') as string,
    remoteRevision: record.get('remoteRevision') as string,
    contentHash: record.get('contentHash') as string,
    createdAt: nullableDateString(record.get('createdAt')) || undefined,
  };
}

function nullableDateString(value: unknown): string | null {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return typeof value === 'string' ? value : null;
}
