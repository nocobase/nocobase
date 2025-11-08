/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFieldInterface } from '../../data-source/collection-field-interface/CollectionFieldInterface';
import { operators, autoFill, primaryKey, unique } from './properties';

export class UUIDFieldInterface extends CollectionFieldInterface {
  name = 'uuid';
  type = 'object';
  group = 'advanced';
  order = 0;
  title = '{{t("UUID")}}';
  hidden = false;
  sortable = true;
  default = {
    type: 'uuid',
    uiSchema: {
      type: 'string',
      'x-component': 'Input',
      'x-validator': 'uuid',
    },
  };
  availableTypes = ['uid', 'uuid'];
  validationType = 'string';
  availableValidationOptions = ['uuid', 'pattern'];
  properties = {
    'uiSchema.title': {
      type: 'string',
      title: '{{t("Field display name")}}',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    name: {
      type: 'string',
      title: '{{t("Field name")}}',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-disabled': '{{ !createOnly }}',
      description:
        "{{t('Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.')}}",
    },
    autoFill,
    layout: {
      type: 'void',
      title: '{{t("Index")}}',
      'x-component': 'Space',
      'x-decorator': 'FormItem',
      'x-decorator-props': {
        style: {
          marginBottom: '0px',
        },
      },
      properties: {
        primaryKey,
        unique,
      },
    },
  };
  filterable = {
    operators: operators.string,
  };
  titleUsable = true;
}
