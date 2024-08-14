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

export class DateFieldInterface extends CollectionFieldInterface {
  name = 'date';
  type = 'object';
  group = 'datetime';
  order = 1;
  title = '{{t("Date")}}';
  sortable = true;
  default = {
    type: 'dateOnly',
    uiSchema: {
      type: 'string',
      'x-component': 'DatePicker',
    },
  };
  availableTypes = ['date', 'dateOnly', 'string'];
  hasDefaultValue = true;
  properties = {
    ...defaultProps,
    'uiSchema.x-component-props.dateFormat': {
      type: 'string',
      title: '{{t("Date format")}}',
      'x-component': 'Radio.Group',
      'x-decorator': 'FormItem',
      default: 'YYYY-MM-DD',
      enum: [
        {
          label: '{{t("Year/Month/Day")}}',
          value: 'YYYY/MM/DD',
        },
        {
          label: '{{t("Year-Month-Day")}}',
          value: 'YYYY-MM-DD',
        },
        {
          label: '{{t("Day/Month/Year")}}',
          value: 'DD/MM/YYYY',
        },
      ],
    },
  };
  filterable = {
    operators: operators.datetime,
  };
  titleUsable = true;
}
