/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFieldInterface } from '../../data-source/collection-field-interface/CollectionFieldInterface';
import { dateTimeProps, defaultProps, operators } from './properties';

export class UnixTimestampFieldInterface extends CollectionFieldInterface {
  name = 'unixTimestamp';
  type = 'object';
  group = 'datetime';
  order = 1;
  title = '{{t("Unix Timestamp")}}';
  sortable = true;
  default = {
    type: 'bigInt',
    uiSchema: {
      type: 'number',
      'x-component': 'UnixTimestamp',
      'x-component-props': {
        accuracy: 'second',
        showTime: true,
      },
    },
  };
  availableTypes = ['integet', 'bigInt'];
  hasDefaultValue = true;
  properties = {
    ...defaultProps,
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
  };
  filterable = {
    operators: operators.number,
  };
  titleUsable = true;
}
