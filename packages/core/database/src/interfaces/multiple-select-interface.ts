/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseInterface } from './base-interface';
import lodash from 'lodash';

export class MultipleSelectInterface extends BaseInterface {
  toString(value: any, ctx?: any) {
    const enumConfig = this.options.uiSchema?.enum || [];
    return lodash
      .castArray(value)
      .map((value) => {
        const option = enumConfig.find((item) => item.value === value);
        return option ? option.label : value;
      })
      .join(',');
  }
}
