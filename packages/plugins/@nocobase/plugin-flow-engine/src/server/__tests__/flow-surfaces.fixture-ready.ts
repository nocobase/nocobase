/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';

function resolveFixtureTableName(db: Database, collectionName: string) {
  const collection = db.getCollection(collectionName);

  if (collection?.getTableNameWithSchema) {
    return collection.getTableNameWithSchema() as any;
  }

  if (db.inDialect('postgres')) {
    return db.utils.addSchema(collectionName, db.options.schema || 'public');
  }

  return collectionName;
}

export async function waitForFixtureCollectionsReady(
  db: Database,
  requiredCollections: Record<string, string[]>,
  timeoutMs = process.env.CI ? 60000 : 30000,
) {
  const deadline = Date.now() + timeoutMs;
  const queryInterface = db.sequelize.getQueryInterface();
  let pendingCollections: string[] = [];

  while (Date.now() < deadline) {
    let allReady = true;
    pendingCollections = [];

    for (const [collectionName, requiredColumns] of Object.entries(requiredCollections)) {
      const tableName = resolveFixtureTableName(db, collectionName);

      try {
        const columns = await queryInterface.describeTable(tableName as any);
        const missingColumns = requiredColumns.filter((column) => !columns?.[column]);
        if (missingColumns.length) {
          allReady = false;
          pendingCollections.push(`${collectionName}(${missingColumns.join(', ')})`);
          break;
        }
      } catch (error) {
        allReady = false;
        pendingCollections.push(
          `${collectionName}(${error instanceof Error ? error.message : 'describeTable failed'})`,
        );
        break;
      }
    }

    if (allReady) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error(`Fixture collections are not ready: ${pendingCollections.join(', ')}`);
}
