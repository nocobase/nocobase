/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EditableFieldModel } from '@nocobase/client';
import { NumberPicker } from '@formily/antd-v5';

export class SortFieldModel extends EditableFieldModel {
  static supportedFieldInterfaces = ['sort'];

  get component() {
    return [NumberPicker, {}];
  }
}
