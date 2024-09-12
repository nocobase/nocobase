/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DateField } from './date-field';
import { BaseColumnFieldOptions } from './field';

export class DatetimeTzField extends DateField {}

export interface DatetimeTzFieldOptions extends BaseColumnFieldOptions {
  type: 'datetimeTz';
}
