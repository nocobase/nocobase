/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { PresetFields } from '../components/PresetFields';

export const defaultConfigurableProperties = {
  title: {
    type: 'string',
    title: '{{ t("Collection display name") }}',
    required: true,
    'x-decorator': 'FormItem',
    'x-component': 'Input',
  },
  name: {
    type: 'string',
    title: '{{t("Collection name")}}',
    required: true,
    'x-disabled': '{{ !createOnly }}',
    'x-decorator': 'FormItem',
    'x-component': 'Input',
    'x-validator': 'uid',
    description:
      "{{t('Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.')}}",
  },
  inherits: {
    title: '{{t("Inherits")}}',
    type: 'hasMany',
    name: 'inherits',
    'x-decorator': 'FormItem',
    'x-component': 'Select',
    'x-component-props': {
      mode: 'multiple',
    },
    'x-disabled': '{{ !createOnly }}',
    'x-visible': '{{ enableInherits}}',
    'x-reactions': ['{{useAsyncDataSource(loadCollections, ["file"])}}'],
  },
  category: {
    title: '{{t("Categories")}}',
    type: 'hasMany',
    name: 'category',
    'x-decorator': 'FormItem',
    'x-component': 'Select',
    'x-component-props': {
      mode: 'multiple',
    },
    'x-reactions': ['{{useAsyncDataSource(loadCategories)}}'],
  },
  description: {
    title: '{{t("Description")}}',
    type: 'string',
    name: 'description',
    'x-decorator': 'FormItem',
    'x-component': 'Input.TextArea',
  },
  simplePaginate: {
    'x-content': '{{t("Use simple pagination mode")}}',
    type: 'string',
    name: 'simplePaginate',
    'x-decorator': 'FormItem',
    'x-component': 'Checkbox',
    description:
      '{{t("Skip getting the total number of table records during paging to speed up loading. It is recommended to enable this option for data tables with a large amount of data")}}',
  },
  presetFields: {
    title: '{{t("Preset fields")}}',
    type: 'void',
    'x-decorator': 'FormItem',
    'x-visible': '{{ createOnly }}',
    'x-decorator-props': {
      className: css`
        .ant-formily-item {
          margin-bottom: 0;
        }
      `,
    },
    'x-component': PresetFields,
    'x-component-props': {
      disabled: '{{ presetFieldsDisabled }}',
      presetFieldsDisabledIncludes: '{{presetFieldsDisabledIncludes}}',
    },
  },
};

export type DefaultConfigurableKeys =
  | 'name'
  | 'title'
  | 'inherits'
  | 'category'
  | 'autoGenId'
  | 'createdBy'
  | 'updatedBy'
  | 'createdAt'
  | 'updatedAt'
  | 'sortable'
  | 'description'
  | 'simplePaginate'
  | 'presetFields';

export const getConfigurableProperties = (...keys: DefaultConfigurableKeys[]) => {
  const props = {} as Record<DefaultConfigurableKeys, any>;
  for (const key of keys) {
    if (defaultConfigurableProperties[key]) {
      props[key] = defaultConfigurableProperties[key];
    }
  }
  return props;
};
