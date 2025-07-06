/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Radio } from '@formily/antd-v5';
import { EditableFieldModel } from './EditableFieldModel';

export class RadioGroupEditableFieldModel extends EditableFieldModel {
  static supportedFieldInterfaces = ['radioGroup'];

  get component() {
    return [Radio.Group, {}];
  }
}
