/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model, Transaction } from '@nocobase/database';

import { VscError } from '../../shared/errors';
import type {
  RemoteSyncErrorCode,
  VscFileRemoteRecord,
  VscRemoteNormalizedConfig,
  VscRemoteProvider,
} from '../../shared/remote-sync-types';
import { normalizeGitHubRemoteConfig, RemoteSyncError } from './RemoteSyncAdapter';
import { parseVscRemoteAuthRef } from './credentialRef';

const blockingJobStatuses = ['pending', 'running', 'finalize-pending'] as const;
const credentialErrorCodes = new Set<RemoteSyncErrorCode>([
  'CREDENTIAL_UNAVAILABLE',
  'AUTH_FAILED',
  'AUTH_REF_INVALID',
]);
const sensitiveConfigKeyPattern = /(?:token|authorization|password|secret|credential|privatekey)/i;

export interface CreateRemoteInput {
  repoId: string;
  name: string;
  provider: VscRemoteProvider;
  config: VscRemoteNormalizedConfig;
  authRef: string | null;
}

export interface UpdateRemoteTargetInput {
  provider: VscRemoteProvider;
  config: VscRemoteNormalizedConfig;
  authRef: string | null;
}

export interface RecordRemoteCheckInput {
  remoteTargetVersion: number;
  checkedAt?: Date;
  lastErrorCode: RemoteSyncErrorCode | null;
}

export interface RecordRemoteSyncInput {
  remoteTargetVersion: number;
  syncedAt?: Date;
  lastErrorCode?: RemoteSyncErrorCode | null;
}

export type RemoteStoreClock = () => Date;

export class RemoteStore {
  constructor(
    private readonly db: Database,
    private readonly clock: RemoteStoreClock = () => new Date(),
  ) {}

  async create(input: CreateRemoteInput, transaction?: Transaction): Promise<VscFileRemoteRecord> {
    return this.withTransaction(transaction, async (currentTransaction) => {
      await this.lockRepository(input.repoId, currentTransaction);
      const config = validateNormalizedConfig(input.provider, input.config);
      validateAuthRef(input.authRef);
      const record = await this.db.getRepository('vscFileRemotes').create({
        values: {
          repoId: input.repoId,
          name: input.name,
          provider: input.provider,
          config,
          authRef: input.authRef,
          status: 'active',
          version: 1,
          lastCheckedAt: null,
          lastSyncedAt: null,
          lastErrorCode: null,
        },
        transaction: currentTransaction,
      });

      return remoteFromRecord(record);
    });
  }

  async get(remoteId: string, transaction?: Transaction): Promise<VscFileRemoteRecord> {
    const record = await this.db.getRepository('vscFileRemotes').findOne({
      filterByTk: remoteId,
      transaction,
    });

    if (!record) {
      throw remoteNotFound(remoteId);
    }

    return remoteFromRecord(record);
  }

  async getByRepoAndName(repoId: string, name: string, transaction?: Transaction): Promise<VscFileRemoteRecord | null> {
    const record = await this.db.getRepository('vscFileRemotes').findOne({
      filter: { repoId, name },
      transaction,
    });

    return record ? remoteFromRecord(record) : null;
  }

  async updateTarget(
    remoteId: string,
    input: UpdateRemoteTargetInput,
    transaction?: Transaction,
  ): Promise<VscFileRemoteRecord> {
    return this.withTransaction(transaction, async (currentTransaction) => {
      const record = await this.lockRemote(remoteId, currentTransaction);
      const current = remoteFromRecord(record);
      const config = validateNormalizedConfig(input.provider, input.config);
      validateAuthRef(input.authRef);
      const targetChanged = current.provider !== input.provider || !sameConfig(current.config, config);

      if (targetChanged || current.authRef !== input.authRef) {
        await this.assertNoBlockingJobs(remoteId, currentTransaction);
      }

      const authRefChanged = current.authRef !== input.authRef;
      const clearsCredentialError = authRefChanged && isCredentialError(current.lastErrorCode);
      await record.update(
        {
          provider: input.provider,
          config,
          authRef: input.authRef,
          status: 'active',
          version: targetChanged ? current.version + 1 : current.version,
          lastCheckedAt: targetChanged ? null : record.get('lastCheckedAt'),
          lastSyncedAt: targetChanged ? null : record.get('lastSyncedAt'),
          lastErrorCode: targetChanged || clearsCredentialError ? null : current.lastErrorCode,
        },
        { transaction: currentTransaction },
      );

      return remoteFromRecord(record);
    });
  }

  async rotateAuthRef(
    remoteId: string,
    authRef: string | null,
    transaction?: Transaction,
  ): Promise<VscFileRemoteRecord> {
    return this.withTransaction(transaction, async (currentTransaction) => {
      const record = await this.lockRemote(remoteId, currentTransaction);
      const current = remoteFromRecord(record);
      validateAuthRef(authRef);
      if (current.authRef !== authRef) {
        await this.assertNoBlockingJobs(remoteId, currentTransaction);
      }
      await record.update(
        {
          authRef,
          lastErrorCode:
            current.authRef !== authRef && isCredentialError(current.lastErrorCode) ? null : current.lastErrorCode,
        },
        { transaction: currentTransaction },
      );

      return remoteFromRecord(record);
    });
  }

  async recordCheck(
    remoteId: string,
    input: RecordRemoteCheckInput,
    transaction?: Transaction,
  ): Promise<VscFileRemoteRecord> {
    return this.withTransaction(transaction, async (currentTransaction) => {
      const record = await this.lockRemote(remoteId, currentTransaction);
      assertRemoteTargetVersion(record, input.remoteTargetVersion);
      await record.update(
        {
          lastCheckedAt: input.checkedAt || this.clock(),
          lastErrorCode: input.lastErrorCode,
        },
        { transaction: currentTransaction },
      );

      return remoteFromRecord(record);
    });
  }

  async recordSync(
    remoteId: string,
    input: RecordRemoteSyncInput,
    transaction?: Transaction,
  ): Promise<VscFileRemoteRecord> {
    return this.withTransaction(transaction, async (currentTransaction) => {
      const record = await this.lockRemote(remoteId, currentTransaction);
      assertRemoteTargetVersion(record, input.remoteTargetVersion);
      const syncedAt = input.syncedAt || this.clock();
      await record.update(
        {
          lastCheckedAt: syncedAt,
          lastSyncedAt: syncedAt,
          lastErrorCode: input.lastErrorCode ?? null,
        },
        { transaction: currentTransaction },
      );

      return remoteFromRecord(record);
    });
  }

  async disconnect(remoteId: string, transaction?: Transaction): Promise<VscFileRemoteRecord> {
    return this.withTransaction(transaction, async (currentTransaction) => {
      const record = await this.lockRemote(remoteId, currentTransaction);
      await this.assertNoBlockingJobs(remoteId, currentTransaction);
      await record.update({ status: 'disabled', authRef: null }, { transaction: currentTransaction });

      return remoteFromRecord(record);
    });
  }

  async deleteRemote(remoteId: string, transaction?: Transaction): Promise<void> {
    await this.withTransaction(transaction, async (currentTransaction) => {
      const record = await this.lockRemote(remoteId, currentTransaction);
      await this.assertNoBlockingJobs(remoteId, currentTransaction);
      await record.destroy({ transaction: currentTransaction });
    });
  }

  async deleteRepository(repoId: string, transaction?: Transaction): Promise<void> {
    await this.withTransaction(transaction, async (currentTransaction) => {
      const repository = await this.lockRepository(repoId, currentTransaction);
      const remotes = await this.db.getRepository('vscFileRemotes').find({
        filter: { repoId },
        fields: ['id'],
        transaction: currentTransaction,
        lock: currentTransaction.LOCK.UPDATE,
      });

      for (const remote of remotes) {
        await this.assertNoBlockingJobs(remote.get('id') as string, currentTransaction);
      }

      await repository.destroy({ transaction: currentTransaction });
    });
  }

  async hasBlockingJobs(remoteId: string, transaction?: Transaction): Promise<boolean> {
    return (
      (await this.db.getRepository('vscFileSyncJobs').count({
        filter: {
          remoteId,
          status: { $in: [...blockingJobStatuses] },
        },
        transaction,
      })) > 0
    );
  }

  private async assertNoBlockingJobs(remoteId: string, transaction: Transaction): Promise<void> {
    if (await this.hasBlockingJobs(remoteId, transaction)) {
      throw new RemoteSyncError('BUSY', 'Remote has an active synchronization job', {
        details: { reasonCode: 'active-sync-job' },
      });
    }
  }

  private async lockRemote(remoteId: string, transaction: Transaction): Promise<Model> {
    const model = this.db.getModel<Model>('vscFileRemotes');
    const record = await model.findByPk(remoteId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!record) {
      throw remoteNotFound(remoteId);
    }

    return record;
  }

  private async lockRepository(repoId: string, transaction: Transaction): Promise<Model> {
    const model = this.db.getModel<Model>('vscFileRepositories');
    const record = await model.findByPk(repoId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!record) {
      throw new VscError('REPO_NOT_FOUND', `Repository "${repoId}" was not found`);
    }

    return record;
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

export function remoteFromRecord(record: Model): VscFileRemoteRecord {
  const provider = record.get('provider') as VscRemoteProvider;

  return {
    id: record.get('id') as string,
    repoId: record.get('repoId') as string,
    name: record.get('name') as string,
    provider,
    config: validateNormalizedConfig(provider, record.get('config') as VscRemoteNormalizedConfig),
    authRef: nullableString(record.get('authRef')),
    status: record.get('status') as VscFileRemoteRecord['status'],
    version: record.get('version') as number,
    lastCheckedAt: nullableDateString(record.get('lastCheckedAt')),
    lastSyncedAt: nullableDateString(record.get('lastSyncedAt')),
    lastErrorCode: nullableString(record.get('lastErrorCode')) as RemoteSyncErrorCode | null,
    createdAt: nullableDateString(record.get('createdAt')) || undefined,
    updatedAt: nullableDateString(record.get('updatedAt')) || undefined,
  };
}

function validateNormalizedConfig(
  provider: VscRemoteProvider,
  config: VscRemoteNormalizedConfig,
): VscRemoteNormalizedConfig {
  assertNoSensitiveConfigKeys(config);

  if (provider === 'github') {
    return normalizeGitHubRemoteConfig(config);
  }

  throw new RemoteSyncError('UNSUPPORTED_PROVIDER', `Unsupported remote provider "${provider}"`);
}

function assertNoSensitiveConfigKeys(value: unknown): void {
  if (!value || typeof value !== 'object') {
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => assertNoSensitiveConfigKeys(item));
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const normalizedKey = key.replace(/[^A-Za-z0-9]/g, '');
    if (sensitiveConfigKeyPattern.test(normalizedKey)) {
      throw new RemoteSyncError('CONFIG_INVALID', 'Remote config contains a sensitive field', {
        details: { reasonCode: 'sensitive-config-key' },
      });
    }
    assertNoSensitiveConfigKeys(nestedValue);
  }
}

function validateAuthRef(authRef: string | null): void {
  if (authRef !== null) {
    parseVscRemoteAuthRef(authRef);
  }
}

function sameConfig(left: VscRemoteNormalizedConfig, right: VscRemoteNormalizedConfig): boolean {
  return (
    left.owner === right.owner &&
    left.repository === right.repository &&
    left.branch === right.branch &&
    left.subdirectory === right.subdirectory
  );
}

function isCredentialError(code: RemoteSyncErrorCode | null): boolean {
  return code !== null && credentialErrorCodes.has(code);
}

function remoteNotFound(remoteId: string): RemoteSyncError {
  return new RemoteSyncError('REMOTE_NOT_FOUND', `Remote "${remoteId}" was not found`);
}

function assertRemoteTargetVersion(record: Model, expectedVersion: number): void {
  const currentVersion = record.get('version') as number;
  if (currentVersion !== expectedVersion) {
    throw new RemoteSyncError('REMOTE_CHANGED', 'Remote target version changed', {
      details: { reasonCode: 'remote-target-version-changed', remoteTargetVersion: currentVersion },
    });
  }
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
