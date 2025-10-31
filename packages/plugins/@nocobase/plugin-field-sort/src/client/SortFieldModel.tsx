/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { InputNumber } from 'antd';
import React from 'react';
import { EditableItemModel, DisplayItemModel } from '@nocobase/flow-engine';
import { FieldModel } from '@nocobase/client';

export class SortFieldModel extends FieldModel {
  render() {
    return <InputNumber {...this.props} style={{ width: '100%' }} />;
  }
}

EditableItemModel.bindModelToInterface('SortFieldModel', ['sort'], { isDefault: true });
DisplayItemModel.bindModelToInterface('DisplayNumberFieldModel', ['sort'], { isDefault: true });
