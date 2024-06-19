/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseInterface, Repository } from '@nocobase/database';

export class ChinaRegionInterface extends BaseInterface {
  async toValue(str: string, ctx?: any): Promise<any> {
    if (!str) {
      return null;
    }
    const { field } = ctx;
    const items = str.split('/');
    const repository = field.database.getRepository(field.target) as Repository;

    const instances = await repository.find({
      filter: {
        name: items,
      },
    });

    for (let i = 0; i < items.length; i++) {
      const instance = instances.find((item) => item.name === items[i]);
      if (!instance) {
        throw new Error(`china region "${items[i]}" does not exist`);
      }
      items[i] = instance.get('code');
    }

    return items;
  }

  toString(value: any, ctx?: any) {
    const values = (Array.isArray(value) ? value : [value]).sort((a, b) =>
      a.level !== b.level ? a.level - b.level : a.sort - b.sort,
    );

    return values.map((item) => item.name).join('/');
  }
}
