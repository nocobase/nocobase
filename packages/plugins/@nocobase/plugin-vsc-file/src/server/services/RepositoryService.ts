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
import type { VscRefRecord, VscRepositoryIdentity, VscRepositoryRecord } from '../../shared/types';

export interface EnsureRepositoryRecordResult {
  repository: VscRepositoryRecord;
  created: boolean;
}

export class RepositoryService {
  constructor(private readonly db: Database) {}

  async createRepositoryRecord(input: VscRepositoryIdentity, transaction?: Transaction): Promise<VscRepositoryRecord> {
    const record = await this.db.getRepository('vscFileRepositories').create({
      values: repositoryDefaults(input),
      transaction,
    });
    const repository = repositoryFromRecord(record);

    await this.createDefaultRefs(repository.id, transaction);

    return repository;
  }

  async ensureRepositoryRecord(
    input: VscRepositoryIdentity,
    transaction?: Transaction,
  ): Promise<EnsureRepositoryRecordResult> {
    const model = this.db.getModel<Model<VscRepositoryRecord>>('vscFileRepositories');
    const [record, created] = await model.findOrCreate({
      where: {
        ownerType: input.ownerType,
        ownerId: input.ownerId,
        name: input.name,
      },
      defaults: repositoryDefaults(input),
      transaction,
    });
    const repository = repositoryFromRecord(record);

    if (created) {
      await this.createDefaultRefs(repository.id, transaction);
    }

    return {
      repository,
      created,
    };
  }

  async getRepository(repoId: string, transaction?: Transaction): Promise<VscRepositoryRecord> {
    const record = await this.db.getRepository('vscFileRepositories').findOne({
      filterByTk: repoId,
      transaction,
    });

    if (!record) {
      throw new VscError('REPO_NOT_FOUND', `Repository "${repoId}" was not found`);
    }

    return repositoryFromRecord(record);
  }

  async findRepositoryByIdentity(
    input: VscRepositoryIdentity,
    transaction?: Transaction,
  ): Promise<VscRepositoryRecord | null> {
    const record = await this.db.getRepository('vscFileRepositories').findOne({
      filter: {
        ownerType: input.ownerType,
        ownerId: input.ownerId,
        name: input.name,
      },
      transaction,
    });

    return record ? repositoryFromRecord(record) : null;
  }

  async getRef(repoId: string, name: string, transaction?: Transaction): Promise<VscRefRecord> {
    const record = await this.db.getRepository('vscFileRefs').findOne({
      filter: {
        repoId,
        name,
      },
      transaction,
    });

    if (!record) {
      throw new VscError('REF_NOT_FOUND', `Ref "${name}" was not found`);
    }

    return refFromRecord(record);
  }

  async updateHead(
    repository: VscRepositoryRecord,
    commitId: string,
    seq: number,
    transaction?: Transaction,
  ): Promise<VscRepositoryRecord> {
    const repositoryModel = this.db.getModel<Model<VscRepositoryRecord>>('vscFileRepositories');
    const [updatedCount] = await repositoryModel.update(
      {
        headCommitId: commitId,
        headSeq: seq,
      },
      {
        where: {
          id: repository.id,
          headCommitId: repository.headCommitId,
        },
        transaction,
      },
    );

    if (updatedCount !== 1) {
      throw new VscError('BASE_COMMIT_OUTDATED', 'Repository head was updated by another writer');
    }

    const refModel = this.db.getModel<Model<VscRefRecord>>('vscFileRefs');
    const [refUpdatedCount] = await refModel.update(
      {
        commitId,
      },
      {
        where: {
          repoId: repository.id,
          name: 'head',
        },
        transaction,
      },
    );

    if (refUpdatedCount !== 1) {
      throw new VscError('REF_NOT_FOUND', 'Head ref was not found');
    }

    return this.getRepository(repository.id, transaction);
  }

  private async createDefaultRefs(repoId: string, transaction?: Transaction) {
    await this.db.getRepository('vscFileRefs').createMany({
      records: [
        {
          repoId,
          name: 'head',
          type: 'branch',
          commitId: null,
        },
        {
          repoId,
          name: 'published',
          type: 'branch',
          commitId: null,
        },
      ],
      transaction,
    });
  }
}

function repositoryDefaults(input: VscRepositoryIdentity) {
  return {
    ownerType: input.ownerType,
    ownerId: input.ownerId,
    name: input.name,
    status: 'active',
    defaultRef: 'head',
    headCommitId: null,
    publishedCommitId: null,
    headSeq: 0,
  };
}

export function repositoryFromRecord(record: Model): VscRepositoryRecord {
  return {
    id: record.get('id') as string,
    ownerType: record.get('ownerType') as string,
    ownerId: record.get('ownerId') as string,
    name: record.get('name') as string,
    status: record.get('status') as VscRepositoryRecord['status'],
    defaultRef: record.get('defaultRef') as string,
    headCommitId: (record.get('headCommitId') as string | null) || null,
    publishedCommitId: (record.get('publishedCommitId') as string | null) || null,
    headSeq: record.get('headSeq') as number,
  };
}

export function refFromRecord(record: Model): VscRefRecord {
  return {
    id: record.get('id') as string,
    repoId: record.get('repoId') as string,
    name: record.get('name') as string,
    type: record.get('type') as string,
    commitId: (record.get('commitId') as string | null) || null,
  };
}
