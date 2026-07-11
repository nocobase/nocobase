/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataTypes, Database, createMockDatabase } from '@nocobase/database';
import path from 'path';

import RemovePublicationStateMigration from '../migrations/20260711000000-remove-publication-state';
import { VscFileService } from '../services/VscFileService';

describe('vsc-file single-version migration', () => {
  let db: Database;

  afterEach(async () => {
    await db?.close();
  });

  it.each([
    { column: 'publishedCommitId', underscored: false },
    { column: 'published_commit_id', underscored: true },
  ])(
    'removes the $column publication column, index, and ref while preserving head',
    async ({ column, underscored }) => {
      db = await createMockDatabase({ underscored });
      await db.clean({ drop: true });
      await db.import({
        directory: path.resolve(__dirname, '../collections'),
      });
      await db.sync();

      const service = new VscFileService(db);
      const { repository } = await service.createRepository({
        ownerType: 'plugin',
        ownerId: 'demo',
        name: 'main',
      });
      const queryInterface = db.sequelize.getQueryInterface();
      const repositoriesTable = db.getCollection('vscFileRepositories').getTableNameWithSchema();

      await queryInterface.addColumn(repositoriesTable, column, {
        type: DataTypes.STRING,
        allowNull: true,
      });
      await queryInterface.addIndex(repositoriesTable, [column]);
      await db.getRepository('vscFileRefs').create({
        values: {
          repoId: repository.id,
          name: 'published',
          type: 'branch',
          commitId: null,
        },
      });

      const migration = new RemovePublicationStateMigration({ db } as never);
      await migration.up();
      await migration.up();

      const columns = await queryInterface.describeTable(repositoriesTable);
      const refs = await db.getRepository('vscFileRefs').find({
        filter: {
          repoId: repository.id,
        },
        sort: ['name'],
      });

      expect(columns).not.toHaveProperty(column);
      expect(refs.map((ref) => ref.get('name'))).toEqual(['head']);
    },
  );
});
