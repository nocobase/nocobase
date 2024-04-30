/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseValueParser } from './base-value-parser';

export class ArrayValueParser extends BaseValueParser {
  async setValue(value: any) {
    const { map, set } = this.getOptions();
    const values = this.toArr(value);
    if (set.size > 0) {
      const filtered = values.map((v) => (map.has(v) ? map.get(v) : v)).filter((v) => set.has(v));
      if (values.length === filtered.length) {
        this.value = filtered;
      } else {
        this.errors.push(`No matching option found - ${JSON.stringify(value)}`);
      }
    } else {
      this.value = values;
    }
  }

  getOptions() {
    const options = this.field.options?.['uiSchema']?.enum || [];
    const map = new Map();
    const set = new Set();
    for (const option of options) {
      set.add(option.value);
      set.add(option.label);
      map.set(option.label, option.value);
    }
    return { map, set };
  }
}
