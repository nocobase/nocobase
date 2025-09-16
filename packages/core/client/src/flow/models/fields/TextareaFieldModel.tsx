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
import { largeField, EditableItemModel } from '@nocobase/flow-engine';
import { FieldModel } from '../base';

@largeField()
export class TextareaFieldModel extends FieldModel {
  render() {
    const { value, onChange, ...rest } = this.props;

    return <Input.TextArea {...rest} defaultValue={value} onChange={onChange} />;
  }
}

EditableItemModel.bindModelToInterface('TextareaFieldModel', ['textarea', 'markdown'], {
  isDefault: true,
  defaultProps: {
    autoSize: {
      maxRows: 10,
      minRows: 3,
    },
  },
});
