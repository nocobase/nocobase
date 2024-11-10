/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseInterface } from './base-interface';

export class ToManyInterface extends BaseInterface {
  async toValue(str: string, ctx?: any) {
    if (!str) {
      return null;
    }

    str = `${str}`.trim();

    const items = str.split(',');

    const { filterKey, targetCollection, transaction } = ctx;

    const targetInstances = await targetCollection.repository.find({
      filter: {
        [filterKey]: items,
      },
      transaction,
    });

    // check if all items are found
    items.forEach((item) => {
      if (!targetInstances.find((targetInstance) => targetInstance[filterKey] == item)) {
        throw new Error(`"${item}" not found in ${targetCollection.model.name} ${filterKey}`);
      }
    });

    const primaryKeyAttribute = targetCollection.model.primaryKeyAttribute;

    return targetInstances.map((targetInstance) => targetInstance[primaryKeyAttribute]);
  }
}
