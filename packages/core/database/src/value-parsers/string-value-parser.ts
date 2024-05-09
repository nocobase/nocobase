/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseValueParser } from './base-value-parser';

export class StringValueParser extends BaseValueParser {
  async setValue(value: any) {
    const { map, set } = this.getOptions();
    if (set.size > 0) {
      if (map.has(value)) {
        value = map.get(value);
      }
      if (set.has(value)) {
        this.value = value;
      } else {
        this.errors.push(`No matching option found - ${JSON.stringify(value)}`);
      }
    } else {
      this.value = value;
    }
  }

  getOptions() {
    const options = this.field.options?.['uiSchema']?.enum || [];
    const map = new Map();
    const set = new Set();
    for (const option of options) {
      if (typeof option === 'string') {
        set.add(option);
        map.set(option, option);
      } else {
        set.add(option.value);
        set.add(option.label);
        map.set(option.label, option.value);
      }
    }
    return { map, set };
  }
}
