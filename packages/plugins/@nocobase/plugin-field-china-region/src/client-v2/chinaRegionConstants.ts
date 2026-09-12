/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@formily/shared';

export const CHINA_REGION_INTERFACE_NAME = 'chinaRegion';
export const CHINA_REGION_TARGET = 'chinaRegions';

export const CHINA_REGION_FIELD_NAMES = {
  label: 'name',
  value: 'code',
  children: 'children',
};

export const CHINA_REGION_LEVEL_OPTIONS = [
  { value: 1, label: '{{t("Province")}}' },
  { value: 2, label: '{{t("City")}}' },
  { value: 3, label: '{{t("Area")}}' },
  { value: 4, label: '{{t("Street")}}', disabled: true },
  { value: 5, label: '{{t("Village")}}', disabled: true },
];

export const CHINA_REGION_BASE_COMPONENT_PROPS = {
  changeOnSelectLast: false,
  labelInValue: true,
  maxLevel: 3,
  fieldNames: CHINA_REGION_FIELD_NAMES,
};

export const CHINA_REGION_BASE_DEFAULT = {
  interface: CHINA_REGION_INTERFACE_NAME,
  type: 'belongsToMany',
  target: CHINA_REGION_TARGET,
  targetKey: 'code',
  sortBy: 'level',
  uiSchema: {
    type: 'array',
    'x-component': 'Cascader',
  },
};

export const CHINA_REGION_FILTERABLE_CHILD_BASE = {
  name: 'name',
  title: '{{t("Province/city/area name")}}',
  schema: {
    title: '{{t("Province/city/area name")}}',
    type: 'string',
    'x-component': 'Input',
  },
};

export function initializeChinaRegionValues(values: any): void {
  if (!values.through) {
    values.through = `t_${uid()}`;
  }
  if (!values.foreignKey) {
    values.foreignKey = `f_${uid()}`;
  }
  if (!values.otherKey) {
    values.otherKey = `f_${uid()}`;
  }
  if (!values.sourceKey) {
    values.sourceKey = 'id';
  }
  if (!values.targetKey) {
    values.targetKey = 'id';
  }
}
