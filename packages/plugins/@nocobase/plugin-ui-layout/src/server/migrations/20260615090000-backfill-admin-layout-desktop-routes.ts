/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { BelongsToManyRepository, Database, Model, Transaction } from '@nocobase/database';
import { Migration } from '@nocobase/server';
import { DEFAULT_ADMIN_UI_LAYOUT } from '../../constants';

function hasRelationRecords(route: Model, relationName: string) {
  const records = route.get(relationName);
  return Array.isArray(records) && records.length > 0;
}

function hasRelation(db: Database, collectionName: string, relationName: string) {
  return !!db.getCollection(collectionName)?.getField(relationName);
}

async function backfillAdminLayoutDesktopRoutesInTransaction(db: Database, transaction: Transaction) {
  if (!db.getCollection('desktopRoutes') || !db.getCollection('uiLayouts')) {
    return;
  }
  if (!hasRelation(db, 'desktopRoutes', 'uiLayouts')) {
    return;
  }

  const adminLayout = await db.getRepository('uiLayouts').findOne({
    filterByTk: DEFAULT_ADMIN_UI_LAYOUT.uid,
    transaction,
  });
  if (!adminLayout) {
    return;
  }

  const hasMultiPortalRelation = !!db.getCollection('multiPortals') && hasRelation(db, 'desktopRoutes', 'multiPortals');
  const appends = hasMultiPortalRelation ? ['uiLayouts', 'multiPortals'] : ['uiLayouts'];
  const routes = await db.getRepository('desktopRoutes').find({
    appends,
    transaction,
  });

  for (const route of routes) {
    const routeId = route.get('id');
    if (routeId === null || routeId === undefined) {
      continue;
    }
    if (hasRelationRecords(route, 'uiLayouts')) {
      continue;
    }
    if (hasMultiPortalRelation && hasRelationRecords(route, 'multiPortals')) {
      continue;
    }

    await db.getRepository<BelongsToManyRepository>('desktopRoutes.uiLayouts', routeId).set({
      tk: [DEFAULT_ADMIN_UI_LAYOUT.uid],
      transaction,
    });
  }
}

export async function backfillAdminLayoutDesktopRoutes(db: Database) {
  await db.sequelize.transaction(async (transaction) => {
    await backfillAdminLayoutDesktopRoutesInTransaction(db, transaction);
  });
}

export default class extends Migration {
  on = 'afterSync';

  async up() {
    await backfillAdminLayoutDesktopRoutes(this.db);
  }
}
