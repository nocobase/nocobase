/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFieldInterface } from '../../data-source/collection-field-interface/CollectionFieldInterface';
import { i18n } from '../../i18n';
import { defaultProps, operators } from './properties';
export class SubQueryFieldInterface extends CollectionFieldInterface {
  name = 'SUBQUERY';
  type = 'object';
  group = 'advanced';
  order = 3;
  title = '{{t("SQL sub query")}}';
  sortable = true;
  titleUsable = true;
  default = {
    type: 'subquery',
    uiSchema: {
      type: 'string',
      readPretty: true,
      'x-component': 'Input.ReadPretty',
    },
  };
  availableTypes = ['subquery'];
  hasDefaultValue = false;
  properties = {
    ...defaultProps,
    sql: {
      type: 'string',
      title: '{{t("Sub query")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
    },
  };
  filterable = {
    operators: operators.string,
  };
}
