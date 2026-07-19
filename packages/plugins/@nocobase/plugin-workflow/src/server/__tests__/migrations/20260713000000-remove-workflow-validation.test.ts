/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataTypes } from '@nocobase/database';
import { getApp } from '@nocobase/plugin-workflow-test';
import { MockServer } from '@nocobase/test';
import { describe, expect, it, vi } from 'vitest';

import Migration from '../../migrations/20260713000000-remove-workflow-validation';

type TableIndex = {
  fields?: Array<{ attribute?: string }>;
  unique?: boolean;
};

function hasWorkflowVersionIndex(indexes: object) {
  if (!Array.isArray(indexes)) {
    return false;
  }

  return indexes.some((index: TableIndex) => {
    const fields = index.fields?.map((field) => field.attribute) ?? [];
    return index.unique === true && fields.length === 2 && fields.includes('key') && fields.includes('current');
  });
}

describe('20260713000000-remove-workflow-validation', () => {
  it('physically removes validation and remains idempotent', async () => {
    const app: MockServer = await getApp();

    try {
      const workflows = app.db.getCollection('workflows');
      const tableInfo = workflows.getTableNameWithSchema();
      const queryInterface = app.db.sequelize.getQueryInterface();

      await queryInterface.addColumn(tableInfo, 'validation', {
        type: DataTypes.JSON,
      });

      const before = await queryInterface.describeTable(tableInfo);
      expect(before).toHaveProperty('invalid');
      expect(before).toHaveProperty('validation');
      expect(hasWorkflowVersionIndex(await queryInterface.showIndex(tableInfo))).toBe(true);

      const migration = new Migration({ app, db: app.db } as never);
      expect(migration.on).toBe('afterSync');
      expect(migration.appVersion).toBe('');

      await migration.up();

      const after = await queryInterface.describeTable(tableInfo);
      expect(after).toHaveProperty('invalid');
      expect(after).not.toHaveProperty('validation');
      expect(hasWorkflowVersionIndex(await queryInterface.showIndex(tableInfo))).toBe(true);
      await expect(migration.up()).resolves.toBeUndefined();
    } finally {
      await app.destroy();
    }
  });

  it('skips safely when the workflows table does not exist', async () => {
    const transaction = {};
    const queryInterface = {
      tableExists: vi.fn().mockResolvedValue(false),
    };
    const db = {
      getCollection: vi.fn(() => ({ getTableNameWithSchema: () => 'missing_workflows' })),
      sequelize: {
        getQueryInterface: () => queryInterface,
        transaction: vi.fn(async (callback: (currentTransaction: object) => Promise<void>) => callback(transaction)),
      },
    };
    const migration = new Migration({ db } as never);

    await migration.up();

    expect(queryInterface.tableExists).toHaveBeenCalledWith('missing_workflows', { transaction });
  });

  it('resyncs workflow indexes after SQLite rebuilds the table', async () => {
    const transaction = {};
    const sync = vi.fn();
    const queryInterface = {
      describeTable: vi.fn().mockResolvedValue({ validation: {} }),
      removeColumn: vi.fn(),
      tableExists: vi.fn().mockResolvedValue(true),
    };
    const db = {
      getCollection: vi.fn(() => ({ getTableNameWithSchema: () => 'workflows', model: { sync } })),
      sequelize: {
        getDialect: () => 'sqlite',
        getQueryInterface: () => queryInterface,
        transaction: vi.fn(async (callback: (currentTransaction: object) => Promise<void>) => callback(transaction)),
      },
    };
    const migration = new Migration({ db } as never);

    await migration.up();

    expect(queryInterface.removeColumn).toHaveBeenCalledWith('workflows', 'validation', { transaction });
    expect(sync).toHaveBeenCalledWith({ hooks: false, transaction });
  });
});
