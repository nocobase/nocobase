/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';

const FIXED_LAYOUT_PORTALS = [
  {
    uid: '__default_admin__',
    portalType: 'no-code',
    portalName: 'admin',
    routePath: '/admin',
    uiLayoutUid: 'admin-layout-model',
  },
  {
    uid: '__default_mobile__',
    portalType: 'no-code',
    portalName: 'mobile',
    routePath: '/mobile',
    uiLayoutUid: 'mobile-layout-model',
  },
] as const;

export default class extends Migration {
  on = 'afterLoad';

  async up() {
    const collection = this.db.getCollection('multiPortals');
    if (!collection) {
      return;
    }

    const repository = this.db.getRepository('multiPortals');
    for (const portal of FIXED_LAYOUT_PORTALS) {
      const existing = await repository.findOne({
        filterByTk: portal.uid,
        fields: ['uid', 'portalType', 'portalName', 'routePath', 'uiLayoutUid'],
      });
      if (
        existing?.get('portalName') !== portal.portalName ||
        existing.get('routePath') !== portal.routePath ||
        existing.get('uiLayoutUid') !== portal.uiLayoutUid ||
        existing.get('portalType') === portal.portalType
      ) {
        continue;
      }
      await repository.update({
        filterByTk: portal.uid,
        values: {
          portalType: portal.portalType,
        },
      });
    }
  }
}
