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

export class DatetimeFieldInterface extends CollectionFieldInterface {
  name = 'datetime';
  type = 'object';
  group = 'datetime';
  order = 1;
  title = '{{t("Datetime")}}';
  sortable = true;
  default = {
    type: 'date',
    uiSchema: {
      type: 'string',
      'x-component': 'DatePicker',
      'x-component-props': {
        showTime: false,
      },
    },
  };
  availableTypes = ['date', 'dateOnly', 'string'];
  hasDefaultValue = true;
  properties = {
    ...defaultProps,
    ...dateTimeProps,
    'uiSchema.x-component-props.gmt': {
      type: 'boolean',
      title: '{{t("GMT")}}',
      'x-hidden': true,
      'x-component': 'Checkbox',
      'x-content': '{{t("Use the same time zone (GMT) for all users")}}',
      'x-decorator': 'FormItem',
      default: false,
    },
  };
  filterable = {
    operators: operators.datetime,
  };
  titleUsable = true;
}
