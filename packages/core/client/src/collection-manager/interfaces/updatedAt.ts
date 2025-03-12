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

export class UpdatedAtFieldInterface extends CollectionFieldInterface {
  name = 'updatedAt';
  type = 'object';
  group = 'systemInfo';
  order = 2;
  title = '{{t("Last updated at")}}';
  sortable = true;
  default = {
    type: 'date',
    field: 'updatedAt',
    uiSchema: {
      type: 'datetime',
      title: '{{t("Last updated at")}}',
      'x-component': 'DatePicker',
      'x-component-props': {},
      'x-read-pretty': true,
    },
  };
  description = '{{t("Store the last update time of each record")}}';
  availableTypes = [];
  properties = {
    ...defaultProps,
    ...dateTimeProps,
  };
  filterable = {
    operators: operators.datetime,
  };
  titleUsable = true;
}
