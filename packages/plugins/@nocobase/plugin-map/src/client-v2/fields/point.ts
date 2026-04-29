/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { generateNTemplate } from '../locale';
import { CommonSchema } from './schema';

export class PointFieldInterface extends CommonSchema {
  name = 'point';
  type = 'object';
  group = 'map';
  order = 1;
  title = generateNTemplate('Point');
  description = generateNTemplate('Point');
  availableTypes = ['point', 'json'];
  sortable = true;
  default = {
    type: 'point',
    uiSchema: {
      type: 'void',
      'x-component': 'Map',
      'x-component-designer': 'Map.Designer',
      'x-component-props': {},
    },
  };
}
