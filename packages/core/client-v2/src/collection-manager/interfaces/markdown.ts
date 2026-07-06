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

export class MarkdownFieldInterface extends CollectionFieldInterface {
  name = 'markdown';
  type = 'object';
  title = '{{t("Markdown")}}';
  group = 'media';
  hidden = true;
  default = {
    type: 'text',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Markdown',
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
