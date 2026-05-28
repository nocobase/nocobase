/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defaultProps } from './properties';
import { CollectionFieldInterface } from '../../collection-field-interface/CollectionFieldInterface';

export class TextareaFieldInterface extends CollectionFieldInterface {
  name = 'textarea';
  type = 'object';
  group = 'basic';
  order = 2;
  title = '{{t("Long text")}}';
  default = {
    interface: 'textarea',
    type: 'text',
    uiSchema: {
      type: 'string',
      'x-component': 'Input.TextArea',
    },
  };
  availableTypes = ['text', 'json', 'string'];
  validationType = 'string';
  availableValidationOptions = ['min', 'max', 'length', 'case', 'pattern'];
  hasDefaultValue = true;
  titleUsable = true;
  properties = {
    ...defaultProps,
    trim: {
      type: 'boolean',
      'x-content': '{{t("Automatically remove heading and tailing spaces")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    },
  };
  filterable = {
    operators: 'string',
  };
}
