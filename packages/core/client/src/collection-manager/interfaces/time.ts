/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFieldInterface } from '../../data-source/collection-field-interface/CollectionFieldInterface';
import { defaultProps, operators, timeProps } from './properties';

export class TimeFieldInterface extends CollectionFieldInterface {
  name = 'time';
  type = 'object';
  group = 'datetime';
  order = 4;
  title = '{{t("Time")}}';
  sortable = true;
  default = {
    type: 'time',
    uiSchema: {
      type: 'string',
      'x-component': 'TimePicker',
    },
  };
  availableTypes = ['time'];
  hasDefaultValue = true;
  properties = {
    ...defaultProps,
    ...timeProps,
  };
  filterable = {
    operators: operators.time,
  };
  titleUsable = true;
}
