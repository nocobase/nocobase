/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* istanbul ignore file -- @preserve */

import { Migration } from '@nocobase/server';

const indexes = [
  {
    name: 'flow_model_tree_path_ancestor_depth',
    fields: ['ancestor', 'depth'],
  },
  {
    name: 'flow_model_tree_path_descendant_depth',
    fields: ['descendant', 'depth'],
  },
];

const normalizeIndexFields = (index: any) => {
  return (index?.fields || []).map((field) => field?.attribute || field?.name || field).filter(Boolean);
};

export default class extends Migration {
  on = 'afterLoad';

  async up() {
    if (!this.db.hasCollection('flowModelTreePath')) {
      return;
    }

    const collection = this.db.getCollection('flowModelTreePath');
    const tableName = collection.getTableNameWithSchema();
    const queryInterface = this.db.sequelize.getQueryInterface();
    const existingIndexes = await queryInterface.showIndex(tableName);

    for (const index of indexes) {
      const exists = existingIndexes.some(
        (existing) =>
          existing.name === index.name ||
          JSON.stringify(normalizeIndexFields(existing)) === JSON.stringify(index.fields),
      );

      if (!exists) {
        await queryInterface.addIndex(tableName, index.fields, { name: index.name });
      }
    }
  }

  async down() {
    if (!this.db.hasCollection('flowModelTreePath')) {
      return;
    }

    const collection = this.db.getCollection('flowModelTreePath');
    const tableName = collection.getTableNameWithSchema();
    const queryInterface = this.db.sequelize.getQueryInterface();
    const existingIndexes = await queryInterface.showIndex(tableName);

    for (const index of indexes) {
      if (existingIndexes.some((existing) => existing.name === index.name)) {
        await queryInterface.removeIndex(tableName, index.name);
      }
    }
  }
}
