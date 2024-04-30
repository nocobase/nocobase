/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { percent2float } from '../utils';
import { BaseValueParser } from './base-value-parser';

export class NumberValueParser extends BaseValueParser {
  async setValue(value: any) {
    if (value === null || value === undefined || typeof value === 'number') {
      this.value = value;
    } else if (typeof value === 'string') {
      if (!value) {
        this.value = null;
      } else if (['n/a', '-'].includes(value.toLowerCase())) {
        this.value = null;
      } else {
        value = value.replace(/,/g, '');
        if (value.endsWith('%')) {
          value = percent2float(value);
        } else {
          value = +value;
        }
        if (isNaN(value)) {
          this.errors.push(`Invalid value - "${value}"`);
        } else {
          this.value = value;
        }
      }
    } else {
      this.errors.push(`Invalid value - ${JSON.stringify(value)}`);
    }
  }
}
