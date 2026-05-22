/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { InputNumber } from 'antd';
import { DisplayItemModel, EditableItemModel, FilterableItemModel } from '@nocobase/flow-engine';
import { FieldModel } from '@nocobase/client-v2';
import { tExpr } from '../locale';

export class SortFieldModel extends FieldModel {
  render() {
    return <InputNumber {...this.props} style={{ width: '100%', ...this.props?.style }} />;
  }
}

SortFieldModel.define({
  label: tExpr('Sort'),
});

EditableItemModel.bindModelToInterface('SortFieldModel', ['sort'], { isDefault: true });
DisplayItemModel.bindModelToInterface('DisplayNumberFieldModel', ['sort'], { isDefault: true });
FilterableItemModel.bindModelToInterface('NumberFieldModel', ['sort'], { isDefault: true });
