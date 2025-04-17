/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { BaseInterface } from './base-interface';
dayjs.extend(utc);
export class TimeInterface extends BaseInterface {
  toValue(value: any, ctx?: any) {
    if (this.validate(value)) {
      const result = dayjs.utc(value).format('HH:mm:ss');
      return result;
    }
    return value;
  }

  validate(value) {
    const result = dayjs(value).isValid();
    return result;
  }
}
