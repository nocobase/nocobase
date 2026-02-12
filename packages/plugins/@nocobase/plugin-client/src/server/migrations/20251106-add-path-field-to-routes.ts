/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';

export default class AddPathFieldToRoutes20251106 extends Migration {
  appVersion = '2.0.0-alpha.0';

  async up() {
    const result = await this.app.version.satisfies('>2.0.0-alpha.0');
    if (!result) {
      return;
    }

    const { transaction } = this.context;
    const db = this.app.db;

    // Check if desktopRoutes collection exists
    const desktopRoutesExists = await db.collectionManager.hasCollection('desktopRoutes');
    if (desktopRoutesExists) {
      const desktopRoutesCollection = db.getCollection('desktopRoutes');
      
      // Check if path field already exists
      if (!desktopRoutesCollection.hasField('path')) {
        await desktopRoutesCollection.addField('path', {
          type: 'string',
          unique: true,
        }, { transaction });
      }
    }

    // Check if mobileRoutes collection exists
    const mobileRoutesExists = await db.collectionManager.hasCollection('mobileRoutes');
    if (mobileRoutesExists) {
      const mobileRoutesCollection = db.getCollection('mobileRoutes');
      
      // Check if path field already exists
      if (!mobileRoutesCollection.hasField('path')) {
        await mobileRoutesCollection.addField('path', {
          type: 'string',
          unique: true,
        }, { transaction });
      }
    }
  }

  async down() {
    // No down migration provided to avoid data loss
  }
}