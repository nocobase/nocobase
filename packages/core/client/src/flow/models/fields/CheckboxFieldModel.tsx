/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Checkbox } from 'antd';
import React from 'react';
import { EditableItemModel } from '@nocobase/flow-engine';
import { FieldModel } from '../base';

export class CheckboxFieldModel extends FieldModel {
  render() {
    return <Checkbox {...this.props} />;
  }
}

EditableItemModel.bindModelToInterface('CheckboxFieldModel', ['checkbox'], {
  isDefault: true,
});
