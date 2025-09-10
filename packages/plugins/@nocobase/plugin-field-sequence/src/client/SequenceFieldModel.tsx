/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Input } from '@formily/antd-v5';
import { FormFieldModel } from '@nocobase/client';
import { EditableItemModel } from '@nocobase/flow-engine';

export class SequenceFieldModel extends FormFieldModel {
  static supportedFieldInterfaces = ['sequence'];

  get component() {
    return [Input, {}];
  }
}

EditableItemModel.bindModelToInterface('SequenceFieldModel', ['sequence'], { isDefault: true });
