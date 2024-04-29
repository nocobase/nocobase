/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseValueParser } from './base-value-parser';

export class BooleanValueParser extends BaseValueParser {
  async setValue(value: any) {
    // Boolean
    if (typeof value === 'boolean') {
      this.value = value;
    }
    // Number
    else if (typeof value === 'number' && [0, 1].includes(value)) {
      this.value = value === 1;
    }
    // String
    else if (typeof value === 'string') {
      if (!value) {
        this.value = null;
      }
      if (['1', 'y', 'yes', 'true', '是'].includes(value.toLowerCase())) {
        this.value = true;
      } else if (['0', 'n', 'no', 'false', '否'].includes(value.toLowerCase())) {
        this.value = false;
      } else {
        this.errors.push(`Invalid value - ${JSON.stringify(this.value)}`);
      }
    } else {
      this.errors.push(`Invalid value - ${JSON.stringify(this.value)}`);
    }
  }
}
