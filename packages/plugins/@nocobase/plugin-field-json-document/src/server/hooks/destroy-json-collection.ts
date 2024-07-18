/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, Model } from '@nocobase/database';

export const destroyJSONCollection = (db: Database) => {
  return async (model: Model, { transaction }) => {
    const type = model.get('type');
    if (type !== 'JSONDocument') {
      return;
    }
    console.log(model);
    const target = model.get('options')?.target;
    if (!target) {
      return;
    }
    await db.getRepository('collections').destroy({
      filterByTk: target,
      transaction,
    });
    db.getCollection(target)?.remove();
  };
};
