/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Input } from 'antd';
import React from 'react';
import { FieldModel } from '@nocobase/client';
import { EditableItemModel, DisplayItemModel } from '@nocobase/flow-engine';

export class SequenceFieldModel extends FieldModel {
  render() {
    return <Input {...this.props} />;
  }
}

EditableItemModel.bindModelToInterface('SequenceFieldModel', ['sequence'], { isDefault: true });
DisplayItemModel.bindModelToInterface('DisplayTextFieldModel', ['sequence'], { isDefault: true });
