/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { BaseInterface } from './base-interface';

export class InputInterface extends BaseInterface {
  toValue(value) {
    if (value === null || value === undefined || typeof value === 'string') {
      return value;
    }

    if (this.validate(value)) {
      return value.toString();
    }
    throw new Error('Invalid value, expected string');
  }

  validate(value): boolean {
    return _.isString(value) || _.isNumber(value);
  }
}
