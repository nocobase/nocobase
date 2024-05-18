/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { CompatibleSchemaInitializer } from '../../application/schema-initializer/CompatibleSchemaInitializer';
import { SchemaInitializerChildren } from '../../application/schema-initializer/components/SchemaInitializerChildren';
import { useCompile } from '../../schema-component';
import { gridRowColWrap, useCustomFormItemInitializerFields, useInheritsFormItemInitializerFields } from '../utils';

// 表单里配置字段
const ParentCollectionFields = () => {
  const inheritFields = useInheritsFormItemInitializerFields({ component: 'AssignedField' });
  const { t } = useTranslation();
  const compile = useCompile();
  if (!inheritFields?.length) return null;
  const res = [];
  inheritFields.forEach((inherit) => {
    Object.values(inherit)[0].length &&
      res.push({
        type: 'itemGroup',
        divider: true,
        title: t(`Parent collection fields`) + '(' + compile(`${Object.keys(inherit)[0]}`) + ')',
        children: Object.values(inherit)[0],
      });
  });
  return <SchemaInitializerChildren>{res}</SchemaInitializerChildren>;
};

const commonOptions = {
  wrap: gridRowColWrap,
  icon: 'SettingOutlined',
  title: '{{t("Configure fields")}}',
  items: [
    {
      type: 'itemGroup',
      title: '{{t("Configure fields")}}',
      name: 'configureFields',
      useChildren: useCustomFormItemInitializerFields,
    },
    {
      name: 'parentCollectionFields',
      Component: ParentCollectionFields,
    },
  ],
};

/**
 * @deprecated
 * use `customFormItemInitializers` instead
 */
export const customFormItemInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'CustomFormItemInitializers',
  ...commonOptions,
});

export const customFormItemInitializers = new CompatibleSchemaInitializer(
  {
    name: 'assignFieldValuesForm:configureFields',
    ...commonOptions,
  },
  customFormItemInitializers_deprecated,
);
