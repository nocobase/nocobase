/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { waitForFixtureCollectionsReady } from './flow-surfaces.fixture-ready';

describe('waitForFixtureCollectionsReady', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should use COLLECTION_MANAGER_SCHEMA when a custom collection is not loaded yet', async () => {
    vi.stubEnv('COLLECTION_MANAGER_SCHEMA', 'user_schema');
    const describedTables: any[] = [];

    const db = {
      getCollection: () => undefined,
      inDialect: (dialect: string) => dialect === 'postgres',
      options: {
        schema: 'nocobase',
      },
      sequelize: {
        getQueryInterface: () => ({
          describeTable: async (tableName: any) => {
            describedTables.push(tableName);
            if (tableName?.schema === 'user_schema') {
              return { title: {} };
            }
            throw new Error(`table not found in ${tableName?.schema || 'unknown schema'}`);
          },
        }),
      },
      utils: {
        addSchema: (tableName: string, schema: string) => ({
          tableName,
          schema,
        }),
      },
    };

    await waitForFixtureCollectionsReady(db as any, { categories: ['title'] }, 100);

    expect(describedTables).toEqual([{ tableName: 'categories', schema: 'user_schema' }]);
  });

  it('should fall back to the database schema when COLLECTION_MANAGER_SCHEMA does not contain the table', async () => {
    vi.stubEnv('COLLECTION_MANAGER_SCHEMA', 'user_schema');
    const describedTables: any[] = [];

    const db = {
      getCollection: () => undefined,
      inDialect: (dialect: string) => dialect === 'postgres',
      options: {
        schema: 'flow_schema',
      },
      sequelize: {
        getQueryInterface: () => ({
          describeTable: async (tableName: any) => {
            describedTables.push(tableName);
            if (tableName?.schema === 'flow_schema') {
              return { title: {} };
            }
            throw new Error(`table not found in ${tableName?.schema || 'unknown schema'}`);
          },
        }),
      },
      utils: {
        addSchema: (tableName: string, schema: string) => ({
          tableName,
          schema,
        }),
      },
    };

    await waitForFixtureCollectionsReady(db as any, { view_categories: ['title'] }, 100);

    expect(describedTables).toEqual([
      { tableName: 'view_categories', schema: 'user_schema' },
      { tableName: 'view_categories', schema: 'flow_schema' },
    ]);
  });

  it('should try the next schema when a same-named table is missing required columns', async () => {
    vi.stubEnv('COLLECTION_MANAGER_SCHEMA', 'user_schema');
    const describedTables: any[] = [];

    const db = {
      getCollection: () => undefined,
      inDialect: (dialect: string) => dialect === 'postgres',
      options: {
        schema: 'flow_schema',
      },
      sequelize: {
        getQueryInterface: () => ({
          describeTable: async (tableName: any) => {
            describedTables.push(tableName);
            if (tableName?.schema === 'user_schema') {
              return { id: {} };
            }
            if (tableName?.schema === 'flow_schema') {
              return { title: {}, status: {} };
            }
            throw new Error(`table not found in ${tableName?.schema || 'unknown schema'}`);
          },
        }),
      },
      utils: {
        addSchema: (tableName: string, schema: string) => ({
          tableName,
          schema,
        }),
      },
    };

    await waitForFixtureCollectionsReady(db as any, { view_categories: ['title', 'status'] }, 100);

    expect(describedTables).toEqual([
      { tableName: 'view_categories', schema: 'user_schema' },
      { tableName: 'view_categories', schema: 'flow_schema' },
    ]);
  });
});
