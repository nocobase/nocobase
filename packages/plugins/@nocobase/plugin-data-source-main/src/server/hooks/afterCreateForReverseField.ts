/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database from '@nocobase/database';

export function afterCreateForReverseField(db: Database) {
  return async (model, { transaction }) => {
    const Field = db.getCollection('fields');
    const reverseKey = model.get('reverseKey');

    if (!reverseKey) {
      return;
    }

    const reverse = await Field.model.findByPk(reverseKey, { transaction });
    await reverse.update({ reverseKey: model.get('key') }, { hooks: false, transaction });
  };
}
