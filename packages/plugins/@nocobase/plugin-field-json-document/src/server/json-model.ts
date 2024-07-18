/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model } from '@nocobase/database';
import { SaveOptions } from 'sequelize';

export class JSONModel extends Model {
  async save(options: SaveOptions) {
    const hook = this.isNewRecord ? 'Create' : 'Update';
    if (options.hooks) {
      // @ts-ignore
      await this.constructor.runHooks(`before${hook}`, this, options);

      // @ts-ignore
      await this.constructor.runHooks(`after${hook}`, this, options);
    }
    return this;
  }
}
