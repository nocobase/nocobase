/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseInterface } from '@nocobase/database';

export class ChinaRegionInterface extends BaseInterface {
  toString(value: any, ctx?: any) {
    const values = (Array.isArray(value) ? value : [value]).sort((a, b) =>
      a.level !== b.level ? a.level - b.level : a.sort - b.sort,
    );

    return values.map((item) => item.name).join('/');
  }
}
