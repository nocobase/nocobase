/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Tag } from 'antd';
import { DisplayItemModel, escapeT } from '@nocobase/flow-engine';
import { ClickableFieldModel } from './ClickableFieldModel';

interface FieldNames {
  value: string;
  label?: string;
}

interface Option {
  value: any;
  label: any;
}

function getCurrentOptions(value: any | any[], options: any[] = [], fieldNames: FieldNames): Option[] {
  const values = Array.isArray(value) ? value : [value];
  return values.map((val) => {
    const found = options.find((opt) => opt[fieldNames.value] == val);
    return (
      found ?? {
        value: val,
        label: val?.toString?.() ?? val,
      }
    );
  });
}

const fieldNames = {
  label: 'label',
  value: 'value',
  color: 'color',
};

export class DisplayEnumFieldModel extends ClickableFieldModel {
  public renderComponent(value) {
    const { options = [] } = this.props;
    const currentOptions = getCurrentOptions(value, options, fieldNames);

    if (!value || !currentOptions.length) {
      return null;
    }

    return currentOptions.map((option) => (
      <Tag key={option[fieldNames.value]} color={option[fieldNames.color]}>
        {this.translate(option[fieldNames.label])}
      </Tag>
    ));
  }
}
DisplayEnumFieldModel.define({
  label: escapeT('Select'),
});
DisplayItemModel.bindModelToInterface(
  'DisplayEnumFieldModel',
  ['select', 'multipleSelect', 'radioGroup', 'checkboxGroup'],
  {
    isDefault: true,
  },
);

DisplayItemModel.bindModelToInterface('DisplayEnumFieldModel', ['checkbox'], {
  isDefault: true,
  defaultProps: (ctx) => {
    return {
      options: [
        {
          label: '{{t("Yes")}}',
          value: true,
        },
        {
          label: '{{t("No")}}',
          value: false,
        },
      ],
    };
  },
});
