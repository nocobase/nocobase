/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseValueParser } from './base-value-parser';

export class JsonValueParser extends BaseValueParser {
  async setValue(value: any) {
    if (typeof value === 'string') {
      if (value.trim() === '') {
        this.value = null;
      } else {
        try {
          this.value = JSON.parse(value);
        } catch (error) {
          this.errors.push(error.message);
        }
      }
    } else {
      this.value = value;
    }
  }
}
