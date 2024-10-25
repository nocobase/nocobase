/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model } from '@nocobase/database';

export class JSONModel extends Model {
  async save(options: any) {
    const hook = this.isNewRecord ? 'Create' : 'Update';
    if (options.validate) {
      await this.validate(options);
    }
    if (options.hooks) {
      // @ts-ignore
      await this.constructor.runHooks(`before${hook}`, this, options);

      // @ts-ignore
      await this.constructor.runHooks(`after${hook}`, this, options);
    }
    return this;
  }

  async findAll(options: any) {
    if (options.hooks) {
      // @ts-ignore
      await this.constructor.runHooks('beforeFind', this, options);

      // @ts-ignore
      await this.constructor.runHooks('afterFind', this, options);
    }
    return this;
  }
}
