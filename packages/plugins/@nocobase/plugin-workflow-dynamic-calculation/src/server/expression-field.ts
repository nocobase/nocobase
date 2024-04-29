/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseFieldOptions, DataTypes, Field } from '@nocobase/database';

export interface ExpressionFieldOptions extends BaseFieldOptions {
  type: 'expression';
}

export class ExpressionField extends Field {
  get dataType() {
    return DataTypes.TEXT;
  }
}
