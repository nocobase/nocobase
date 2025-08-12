/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFieldInterface } from '../../data-source/collection-field-interface/CollectionFieldInterface';
import { defaultProps, operators, dateTimeProps } from './properties';
export class UnixTimestampFieldInterface extends CollectionFieldInterface {
  name = 'unixTimestamp';
  type = 'object';
  group = 'datetime';
  order = 4;
  title = '{{t("Unix Timestamp")}}';
  sortable = true;
  default = {
    type: 'unixTimestamp',
    accuracy: 'second',
    timezone: true,
    defaultToCurrentTime: false,
    onUpdateToCurrentTime: false,
    uiSchema: {
      type: 'number',
      'x-component': 'UnixTimestamp',
      'x-component-props': {
        showTime: true,
      },
    },
  };
  availableTypes = ['unixTimestamp'];
  hasDefaultValue = false;
  validationType = 'date';
  availableValidationOptions = ['timestamp'];
  properties = {
    ...defaultProps,
    ...dateTimeProps,
    accuracy: {
      type: 'string',
      title: '{{t("Accuracy")}}',
      'x-component': 'Radio.Group',
      'x-decorator': 'FormItem',
      default: 'second',
      enum: [
        { value: 'millisecond', label: '{{t("Millisecond")}}' },
        { value: 'second', label: '{{t("Second")}}' },
      ],
    },
    defaultToCurrentTime: {
      type: 'boolean',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      'x-content': '{{t("Default value to current time")}}',
    },
    onUpdateToCurrentTime: {
      type: 'boolean',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      'x-content': '{{t("Automatically update timestamp on update")}}',
    },
  };
  filterable = {
    operators: operators.datetime,
  };
  titleUsable = true;
}
