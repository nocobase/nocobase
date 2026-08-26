/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFieldInterface } from '@nocobase/client-v2';
import {
  CHINA_REGION_BASE_COMPONENT_PROPS,
  CHINA_REGION_BASE_DEFAULT,
  CHINA_REGION_FILTERABLE_CHILD_BASE,
  CHINA_REGION_INTERFACE_NAME,
  CHINA_REGION_LEVEL_OPTIONS,
  initializeChinaRegionValues,
} from './chinaRegionConstants';

export class ChinaRegionFieldInterface extends CollectionFieldInterface {
  name = CHINA_REGION_INTERFACE_NAME;
  type = 'object';
  group = 'choices';
  order = 7;
  title = '{{t("China region")}}';
  isAssociation = true;
  default = {
    ...CHINA_REGION_BASE_DEFAULT,
    uiSchema: {
      ...CHINA_REGION_BASE_DEFAULT.uiSchema,
      'x-component-props': { ...CHINA_REGION_BASE_COMPONENT_PROPS },
    },
  };
  availableTypes = ['belongsToMany'];

  initialize(values: any): void {
    initializeChinaRegionValues(values);
  }

  configure = {
    items: [
      {
        name: 'uiSchema.x-component-props.maxLevel',
        title: '{{t("Select level")}}',
        component: 'Radio.Group',
        defaultValue: 3,
        options: CHINA_REGION_LEVEL_OPTIONS,
      },
      {
        name: 'uiSchema.x-component-props.changeOnSelectLast',
        title: '{{t("Must select to the last level")}}',
        component: 'Checkbox',
      },
    ],
  };

  filterable = {
    children: [
      {
        ...CHINA_REGION_FILTERABLE_CHILD_BASE,
        operators: 'string',
      },
    ],
  };
}
