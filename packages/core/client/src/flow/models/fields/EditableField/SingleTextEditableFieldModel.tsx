/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EditableFieldModel } from './EditableFieldModel';
import { Input } from '@formily/antd-v5';

export class SingleTextEditableFieldModel extends EditableFieldModel {
  static supportedFieldInterfaces = ['input', 'email', 'phone', 'uuid', 'url'];
  get component() {
    return [Input, {}];
  }
}
