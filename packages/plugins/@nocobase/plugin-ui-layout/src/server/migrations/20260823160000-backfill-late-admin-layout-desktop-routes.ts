/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import { Migration } from '@nocobase/server';
import { ensureDefaultUiLayout } from '../ensureDefaultUiLayout';
import { backfillAdminLayoutDesktopRoutes } from './20260615090000-backfill-admin-layout-desktop-routes';

function assertDesktopRouteLayoutSchema(db: Database) {
  const desktopRoutes = db.getCollection('desktopRoutes');
  if (!desktopRoutes) {
    throw new Error('The desktopRoutes collection is required to backfill late AdminLayout routes');
  }
  if (!db.getCollection('uiLayouts')) {
    throw new Error('The uiLayouts collection is required to backfill late AdminLayout routes');
  }
  if (!desktopRoutes.getField('uiLayouts')) {
    throw new Error('The desktopRoutes.uiLayouts relation is required to backfill late AdminLayout routes');
  }
}

export default class extends Migration {
  // The legacy menu migration creates desktop routes during afterLoad, after the original afterSync backfill.
  on = 'afterLoad';

  async up() {
    assertDesktopRouteLayoutSchema(this.db);
    await ensureDefaultUiLayout(this.db);
    await backfillAdminLayoutDesktopRoutes(this.db);
  }
}
