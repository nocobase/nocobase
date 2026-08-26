/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defaultProps, operators, CollectionFieldInterface } from '@nocobase/client';
import {
  CHINA_REGION_BASE_COMPONENT_PROPS,
  CHINA_REGION_BASE_DEFAULT,
  CHINA_REGION_FILTERABLE_CHILD_BASE,
  CHINA_REGION_INTERFACE_NAME,
  CHINA_REGION_LEVEL_OPTIONS,
  initializeChinaRegionValues,
} from '../client-v2/chinaRegionConstants';

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
      'x-component-props': {
        ...CHINA_REGION_BASE_COMPONENT_PROPS,
        useDataSource: '{{ useChinaRegionDataSource }}',
        useLoadData: '{{ useChinaRegionLoadData }}',
      },
    },
  };
  availableTypes = ['belongsToMany'];
  initialize(values: any): void {
    initializeChinaRegionValues(values);
  }

  properties = {
    ...defaultProps,
    'uiSchema.x-component-props.maxLevel': {
      type: 'number',
      'x-component': 'Radio.Group',
      'x-decorator': 'FormItem',
      title: '{{t("Select level")}}',
      default: 3,
      enum: CHINA_REGION_LEVEL_OPTIONS,
    },
    'uiSchema.x-component-props.changeOnSelectLast': {
      type: 'boolean',
      'x-component': 'Checkbox',
      'x-content': '{{t("Must select to the last level")}}',
      'x-decorator': 'FormItem',
    },
  };

  filterable = {
    children: [
      {
        ...CHINA_REGION_FILTERABLE_CHILD_BASE,
        operators: operators.string,
      },
    ],
  };
}
