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

export class RichTextFieldInterface extends CollectionFieldInterface {
  name = 'richText';
  type = 'object';
  group = 'media';
  order = 2;
  title = '{{t("Rich Text")}}';
  default = {
    interface: 'richText',
    type: 'text',
    uiSchema: {
      type: 'string',
      'x-component': 'RichText',
    },
  };
  availableTypes = ['text', 'json', 'string'];
  hasDefaultValue = true;
  properties = {
    ...defaultProps,
  };
  filterable = {
    operators: 'bigField',
  };
}
