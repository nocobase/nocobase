/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { largeField, EditableItemModel } from '@nocobase/flow-engine';
import React from 'react';
import { JsonInput } from '../../components';
import { FieldModel } from '../base';

@largeField()
export class JsonFieldModel extends FieldModel {
  render() {
    return <JsonInput {...this.props} />;
  }
}

EditableItemModel.bindModelToInterface('JsonFieldModel', ['json'], {
  isDefault: true,
});
