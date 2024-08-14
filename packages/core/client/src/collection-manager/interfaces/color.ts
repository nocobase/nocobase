/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFieldInterface } from '../../data-source/collection-field-interface/CollectionFieldInterface';
import { defaultProps, operators } from './properties';

export class ColorFieldInterface extends CollectionFieldInterface {
  name = 'color';
  type = 'object';
  group = 'basic';
  order = 10;
  title = '{{t("Color")}}';
  default = {
    type: 'string',
    uiSchema: {
      type: 'string',
      'x-component': 'ColorPicker',
      default: '#1677FF',
    },
  };
  availableTypes = ['string'];
  hasDefaultValue = true;
  properties = {
    ...defaultProps,
  };
  filterable = {
    operators: operators.string,
  };
}
