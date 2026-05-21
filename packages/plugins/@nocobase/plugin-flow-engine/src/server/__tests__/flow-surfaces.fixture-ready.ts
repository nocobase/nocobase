/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';

function getFixtureTableCandidateKey(candidate: any) {
  return typeof candidate === 'string' ? candidate : `${candidate.schema || ''}.${candidate.tableName || ''}`;
}

function pushFixtureTableCandidate(candidates: any[], candidate: any) {
  if (!candidate) {
    return;
  }

  const candidateKey = getFixtureTableCandidateKey(candidate);
  const hasCandidate = candidates.some((item) => getFixtureTableCandidateKey(item) === candidateKey);
  if (!hasCandidate) {
    candidates.push(candidate);
  }
}

function resolveFixtureTableNameCandidates(db: Database, collectionName: string) {
  const collection = db.getCollection(collectionName);

  if (collection?.getTableNameWithSchema) {
    return [collection.getTableNameWithSchema() as any];
  }

  if (db.inDialect('postgres')) {
    const candidates = [];
    pushFixtureTableCandidate(candidates, db.utils.addSchema(collectionName, process.env.COLLECTION_MANAGER_SCHEMA));
    pushFixtureTableCandidate(candidates, db.utils.addSchema(collectionName, db.options.schema || 'public'));
    pushFixtureTableCandidate(candidates, db.utils.addSchema(collectionName, 'public'));
    return candidates;
  }

  return [collectionName];
}

function toUnderscoredColumnName(columnName: string) {
  return columnName
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();
}

function resolveFixtureColumnCandidates(db: Database, collectionName: string, requiredColumn: string) {
  const collection = db.getCollection(collectionName);
  const candidates = new Set<string>();

  if (requiredColumn) {
    candidates.add(requiredColumn);
  }

  const field = collection?.getField?.(requiredColumn);
  const columnName = typeof field?.columnName === 'function' ? field.columnName() : undefined;
  if (columnName) {
    candidates.add(columnName);
  }

  if (db.options.underscored && requiredColumn) {
    candidates.add(toUnderscoredColumnName(requiredColumn));
  }

  return Array.from(candidates).filter(Boolean);
}

export async function waitForFixtureCollectionsReady(
  db: Database,
  requiredCollections: Record<string, string[]>,
  timeoutMs?: number,
) {
  const resolvedTimeoutMs =
    timeoutMs ??
    (() => {
      const envTimeoutMs = Number(process.env.FLOW_SURFACES_FIXTURE_READY_TIMEOUT_MS);
      if (Number.isFinite(envTimeoutMs) && envTimeoutMs > 0) {
        return envTimeoutMs;
      }

      // Fresh association columns can lag behind collection field writes while
      // the full flow-surfaces suite creates many temporary collections back-to-back.
      if (db.inDialect('mysql')) {
        return process.env.CI ? 120000 : 60000;
      }

      return 60000;
    })();
  const deadline = Date.now() + resolvedTimeoutMs;
  const queryInterface = db.sequelize.getQueryInterface();
  let pendingCollections: string[] = [];

  while (Date.now() < deadline) {
    let allReady = true;
    pendingCollections = [];

    for (const [collectionName, requiredColumns] of Object.entries(requiredCollections)) {
      const tableNames = resolveFixtureTableNameCandidates(db, collectionName);

      try {
        let ready = false;
        const pendingReasons: string[] = [];

        for (const tableName of tableNames) {
          try {
            const columns = await queryInterface.describeTable(tableName as any);
            const missingColumns = requiredColumns.filter((column) => {
              const candidates = resolveFixtureColumnCandidates(db, collectionName, column);
              return !candidates.some((candidate) => columns?.[candidate]);
            });
            if (!missingColumns.length) {
              ready = true;
              break;
            }
            pendingReasons.push(`${getFixtureTableCandidateKey(tableName)} missing ${missingColumns.join(', ')}`);
          } catch (error) {
            pendingReasons.push(error instanceof Error ? error.message : 'describeTable failed');
          }
        }

        if (!ready) {
          allReady = false;
          pendingCollections.push(`${collectionName}(${pendingReasons.join('; ') || 'describeTable failed'})`);
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

  throw new Error(`Fixture collections are not ready after ${resolvedTimeoutMs}ms: ${pendingCollections.join(', ')}`);
}
