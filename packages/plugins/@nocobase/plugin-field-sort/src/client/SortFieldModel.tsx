/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { InputNumber } from 'antd';
import { EditableItemModel } from '@nocobase/flow-engine';
import { FormFieldModel } from '@nocobase/client';

export class SortFieldModel extends FormFieldModel {
  static supportedFieldInterfaces = ['sort'];

  get component() {
    return [InputNumber, {}];
  }
}

EditableItemModel.bindModelToInterface('SortFieldModel', ['sort'], { isDefault: true });
