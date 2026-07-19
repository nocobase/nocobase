/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, createMockDatabase } from '@nocobase/database';
import path from 'path';
import { UniqueConstraintError } from 'sequelize';

describe('vsc-file remote collections', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
    await db.import({
      directory: path.resolve(__dirname, '../collections'),
    });
    await db.sync();
  });

  afterEach(async () => {
    await db?.close();
  });

  it('registers remote persistence with cross-dialect indexes', async () => {
    for (const name of ['vscFileRemotes', 'vscFileSyncJobs', 'vscFileExternalCommitMaps', 'vscFileConflicts']) {
      expect(db.getCollection(name)).toBeDefined();
    }

    await expectIndex('vscFileRemotes', ['repoId', 'name'], true);
    await expectIndex('vscFileSyncJobs', ['remoteId', 'remoteTargetVersion', 'idempotencyKey'], true);
    await expectIndex('vscFileSyncJobs', ['status', 'leaseExpiresAt'], false);
    await expectIndex('vscFileExternalCommitMaps', ['remoteId', 'remoteTargetVersion', 'localCommitId'], true);
    await expectIndex('vscFileExternalCommitMaps', ['remoteId', 'remoteTargetVersion', 'remoteRevision'], true);
    await expectIndex('vscFileConflicts', ['remoteId', 'remoteTargetVersion', 'status'], false);
  });

  it('enforces repository and remote foreign keys with cascading cleanup', async () => {
    const repository = await db.getRepository('vscFileRepositories').create({
      values: {
        ownerType: 'plugin',
        ownerId: 'remote-collections',
        name: 'main',
      },
    });
    const remote = await db.getRepository('vscFileRemotes').create({
      values: {
        repoId: repository.get('id'),
        name: 'origin',
        provider: 'github',
        config: { owner: 'nocobase', repository: 'extensions', branch: 'main', subdirectory: null },
      },
    });
    const remoteId = remote.get('id') as string;

    await db.getRepository('vscFileSyncJobs').create({
      values: {
        remoteId,
        remoteTargetVersion: 1,
        operation: 'push',
        idempotencyKey: 'push-1',
      },
    });
    await db.getRepository('vscFileExternalCommitMaps').create({
      values: {
        remoteId,
        remoteTargetVersion: 1,
        localCommitId: 'local-1',
        remoteRevision: 'remote-1',
        contentHash: 'sha256:content',
      },
    });
    await db.getRepository('vscFileConflicts').create({
      values: {
        remoteId,
        remoteTargetVersion: 1,
        status: 'open',
        reasonCode: 'diverged',
      },
    });

    await expectForeignKey('vscFileRemotes', 'repoId');
    await expectForeignKey('vscFileSyncJobs', 'remoteId');
    await expectForeignKey('vscFileExternalCommitMaps', 'remoteId');
    await expectForeignKey('vscFileConflicts', 'remoteId');

    await repository.destroy();

    await expect(db.getRepository('vscFileRemotes').count()).resolves.toBe(0);
    await expect(db.getRepository('vscFileSyncJobs').count()).resolves.toBe(0);
    await expect(db.getRepository('vscFileExternalCommitMaps').count()).resolves.toBe(0);
    await expect(db.getRepository('vscFileConflicts').count()).resolves.toBe(0);
  });

  it('rejects duplicate remote names and idempotency keys in the same version', async () => {
    const repository = await db.getRepository('vscFileRepositories').create({
      values: {
        ownerType: 'plugin',
        ownerId: 'remote-uniqueness',
        name: 'main',
      },
    });
    const remoteValues = {
      repoId: repository.get('id'),
      name: 'origin',
      provider: 'github',
      config: { owner: 'nocobase', repository: 'extensions', branch: 'main', subdirectory: null },
    };
    const remote = await db.getRepository('vscFileRemotes').create({ values: remoteValues });

    await expect(db.getRepository('vscFileRemotes').create({ values: remoteValues })).rejects.toBeInstanceOf(
      UniqueConstraintError,
    );

    const jobValues = {
      remoteId: remote.get('id'),
      remoteTargetVersion: 1,
      operation: 'push',
      idempotencyKey: 'same-request',
    };
    await db.getRepository('vscFileSyncJobs').create({ values: jobValues });
    await expect(db.getRepository('vscFileSyncJobs').create({ values: jobValues })).rejects.toBeInstanceOf(
      UniqueConstraintError,
    );
  });

  async function expectIndex(collectionName: string, fields: string[], unique: boolean) {
    const collection = db.getCollection(collectionName);
    const indexes = (await db.sequelize.getQueryInterface().showIndex(collection.getTableNameWithSchema())) as Array<{
      unique: boolean;
      fields: Array<{ attribute?: string; name?: string } | string>;
    }>;

    expect(
      indexes.some((index) => {
        const attributes = index.fields.map((field) => {
          if (typeof field === 'string') {
            return field;
          }
          return field.attribute || field.name;
        });

        return index.unique === unique && fields.every((field, index) => attributes[index] === field);
      }),
    ).toBe(true);
  }

  async function expectForeignKey(collectionName: string, columnName: string) {
    const collection = db.getCollection(collectionName);
    const references = (await db.sequelize
      .getQueryInterface()
      .getForeignKeyReferencesForTable(collection.getTableNameWithSchema())) as Array<{ columnName?: string }>;

    expect(references.some((reference) => reference.columnName === columnName)).toBe(true);
  }
});
