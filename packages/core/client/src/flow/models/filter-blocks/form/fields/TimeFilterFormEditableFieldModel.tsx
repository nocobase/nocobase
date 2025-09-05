/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { TimePicker } from '@formily/antd-v5';
import { FilterFormEditableFieldModel } from './FilterFormEditableFieldModel';

export class TimeFilterFormEditableFieldModel extends FilterFormEditableFieldModel {
  static readonly supportedFieldInterfaces = ['time'];

  get component() {
    return [TimePicker, {}];
  }
}
