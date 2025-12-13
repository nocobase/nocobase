/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Radio } from 'antd';
import React from 'react';
import { EditableItemModel, tExpr } from '@nocobase/flow-engine';
import { FieldModel } from '../base';

export class RadioGroupFieldModel extends FieldModel {
  render() {
    return <Radio.Group {...this.props} />;
  }
}

RadioGroupFieldModel.define({
  label: tExpr('RadioGroup'),
});
EditableItemModel.bindModelToInterface('RadioGroupFieldModel', ['radioGroup'], {
  isDefault: true,
});
