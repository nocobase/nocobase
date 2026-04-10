/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';

export async function waitForFixtureCollectionsReady(
  db: Database,
  requiredCollections: Record<string, string[]>,
  timeoutMs = process.env.CI ? 60000 : 30000,
) {
  const deadline = Date.now() + timeoutMs;
  const queryInterface = db.sequelize.getQueryInterface();

  while (Date.now() < deadline) {
    let allReady = true;

    for (const [collectionName, requiredColumns] of Object.entries(requiredCollections)) {
      const collection = db.getCollection(collectionName);
      const tableName = collection?.model?.getTableName?.() || collection?.name || collectionName;

      try {
        const columns = await queryInterface.describeTable(tableName as any);
        const missingColumns = requiredColumns.filter((column) => !columns?.[column]);
        if (missingColumns.length) {
          allReady = false;
          break;
        }
      } catch {
        allReady = false;
        break;
      }
    }

    if (allReady) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error(`Fixture collections are not ready: ${Object.keys(requiredCollections).join(', ')}`);
}
