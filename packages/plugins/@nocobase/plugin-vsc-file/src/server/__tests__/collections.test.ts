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

import { pathHash, pathLowerHash } from '../../shared/path';

describe('vsc-file collections', () => {
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

  it('registers all Phase 1 collections and key indexes', async () => {
    const expectedCollections = [
      'vscFileRepositories',
      'vscFileBlobs',
      'vscFileTrees',
      'vscFileTreeEntries',
      'vscFileCommits',
      'vscFileRefs',
      'vscFileRemotes',
      'vscFileSyncJobs',
      'vscFileExternalCommitMaps',
      'vscFileConflicts',
    ];

    for (const name of expectedCollections) {
      expect(db.getCollection(name)).toBeDefined();
    }

    await expectIndex('vscFileRepositories', ['ownerType', 'ownerId', 'name'], true, 'vscr_owner_name_uq');
    await expectIndex('vscFileTreeEntries', ['treeHash', 'pathHash'], true, 'vscte_path_uq');
    await expectIndex('vscFileTreeEntries', ['treeHash', 'pathLowerHash'], true, 'vscte_lower_path_uq');
    await expectIndex('vscFileCommits', ['repoId', 'seq'], true, 'vscc_repo_seq_uq');
    await expectIndex('vscFileCommits', ['repoId', 'hash'], true, 'vscc_repo_hash_uq');
    await expectIndex('vscFileRefs', ['repoId', 'name'], true, 'vscref_repo_name_uq');
    await expectIndex('vscFileRemotes', ['repoId', 'name'], true, 'vscrem_repo_name_uq');
    await expectIndex(
      'vscFileSyncJobs',
      ['remoteId', 'remoteTargetVersion', 'idempotencyKey'],
      true,
      'vscjob_remote_key_uq',
    );
    await expectIndex(
      'vscFileExternalCommitMaps',
      ['remoteId', 'remoteTargetVersion', 'localCommitId'],
      true,
      'vscmap_local_uq',
    );
    await expectIndex(
      'vscFileExternalCommitMaps',
      ['remoteId', 'remoteTargetVersion', 'remoteRevision'],
      true,
      'vscmap_remote_uq',
    );
  });

  it('rejects duplicate repository owner/name tuples', async () => {
    const repository = db.getRepository('vscFileRepositories');

    await repository.create({
      values: {
        ownerType: 'plugin',
        ownerId: 'demo',
        name: 'main',
      },
    });

    await expect(
      repository.create({
        values: {
          ownerType: 'plugin',
          ownerId: 'demo',
          name: 'main',
        },
      }),
    ).rejects.toBeInstanceOf(UniqueConstraintError);
  });

  it('rejects case-only duplicate paths within the same tree', async () => {
    const treeEntries = db.getRepository('vscFileTreeEntries');
    const treeHash = 'a'.repeat(64);

    await treeEntries.create({
      values: {
        treeHash,
        path: 'Foo.ts',
        pathHash: pathHash('Foo.ts'),
        pathLowerHash: pathLowerHash('Foo.ts'),
        blobHash: 'b'.repeat(64),
        size: 1,
      },
    });

    await expect(
      treeEntries.create({
        values: {
          treeHash,
          path: 'foo.ts',
          pathHash: pathHash('foo.ts'),
          pathLowerHash: pathLowerHash('foo.ts'),
          blobHash: 'c'.repeat(64),
          size: 1,
        },
      }),
    ).rejects.toBeInstanceOf(UniqueConstraintError);
  });

  async function expectIndex(collectionName: string, fields: string[], unique: boolean, name: string) {
    const collection = db.getCollection(collectionName);
    const indexes = (await db.sequelize.getQueryInterface().showIndex(collection.getTableNameWithSchema())) as Array<{
      name?: string;
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

        return (
          index.name === name && index.unique === unique && fields.every((field, index) => attributes[index] === field)
        );
      }),
    ).toBe(true);
  }
});
