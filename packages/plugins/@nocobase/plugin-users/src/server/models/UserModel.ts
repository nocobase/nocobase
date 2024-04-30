/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model } from '@nocobase/database';

export class UserModel extends Model {
  desensitize() {
    const { fields } = (this.constructor as typeof UserModel).collection;
    const result = (this.constructor as typeof UserModel).build({}, { isNewRecord: this.isNewRecord });
    for (const [name, value] of Object.entries(this.get())) {
      const field = fields.get(name);
      if (field && !field.options.hidden) {
        result.set(name, value);
      }
    }
    return result;
  }
}
