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
    ];

    for (const name of expectedCollections) {
      expect(db.getCollection(name)).toBeDefined();
    }

    await expectIndex('vscFileRepositories', ['ownerType', 'ownerId', 'name'], true);
    await expectIndex('vscFileTreeEntries', ['treeHash', 'pathHash'], true);
    await expectIndex('vscFileTreeEntries', ['treeHash', 'pathLowerHash'], true);
    await expectIndex('vscFileCommits', ['repoId', 'seq'], true);
    await expectIndex('vscFileCommits', ['repoId', 'hash'], true);
    await expectIndex('vscFileRefs', ['repoId', 'name'], true);
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
});
