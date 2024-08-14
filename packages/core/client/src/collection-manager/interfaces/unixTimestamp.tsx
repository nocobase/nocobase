/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFieldInterface } from '../../data-source/collection-field-interface/CollectionFieldInterface';
import { defaultProps, operators } from './properties';
import { CustomRadio } from './components';
export class UnixTimestampFieldInterface extends CollectionFieldInterface {
  name = 'unixTimestamp';
  type = 'object';
  group = 'datetime';
  order = 1;
  title = '{{t("Unix Timestamp")}}';
  sortable = true;
  default = {
    type: 'unixTimestamp',
    uiSchema: {
      type: 'unixTimestamp',
      'x-component': 'UnixTimestamp',
      'x-component-props': {
        accuracy: 'second',
        showTime: true,
        timezone: 'server',
      },
    },
  };
  availableTypes = ['integer', 'bigInt', 'unixTimestamp'];
  hasDefaultValue = true;
  properties = {
    ...defaultProps,
    'uiSchema.x-component-props.timezone': {
      type: 'string',
      title: '{{t("Timezone")}}',
      'x-component': CustomRadio,
      'x-decorator': 'FormItem',
      default: 'server',
      'x-component-props': {
        options: [
          {
            label: '{{t("None")}}',
            value: 'server',
          },
          {
            label: '{{t("Client\'s time zone")}}',
            value: 'client',
          },
          {
            label: 'custom',
            value: 'custom',
          },
        ],
      },
    },
    'uiSchema.x-component-props.accuracy': {
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
      'x-content': '{{t("Default to current time")}}',
    },
    onUpdateToCurrentTime: {
      type: 'boolean',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      'x-content': '{{t("Automatically update timestamp on update")}}',
    },
  };
  filterable = {
    operators: operators.number,
  };
  titleUsable = true;
}
