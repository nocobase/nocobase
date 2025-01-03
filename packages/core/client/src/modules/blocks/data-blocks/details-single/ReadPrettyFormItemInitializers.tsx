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
import { CompatibleSchemaInitializer } from '../../../../application/schema-initializer/CompatibleSchemaInitializer';
import { SchemaInitializerChildren } from '../../../../application/schema-initializer/components/SchemaInitializerChildren';
import { useCompile } from '../../../../schema-component';
import {
  gridRowColWrap,
  useAssociatedFormItemInitializerFields,
  useFormItemInitializerFields,
  useInheritsFormItemInitializerFields,
} from '../../../../schema-initializer/utils';

export const ParentCollectionFields = () => {
  const inheritFields = useInheritsFormItemInitializerFields();
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

const AssociatedFields = () => {
  const associationFields = useAssociatedFormItemInitializerFields({
    readPretty: true,
    block: 'Form',
  });
  const { t } = useTranslation();
  if (associationFields.length === 0) return null;
  const schema: any = [
    {
      type: 'itemGroup',
      title: t('Display association fields'),
      children: associationFields,
    },
  ];
  return <SchemaInitializerChildren>{schema}</SchemaInitializerChildren>;
};

const commonOptions = {
  wrap: gridRowColWrap,
  icon: 'SettingOutlined',
  title: '{{t("Configure fields")}}',
  items: [
    {
      type: 'itemGroup',
      name: 'displayFields',
      title: '{{t("Display fields")}}',
      useChildren: useFormItemInitializerFields,
    },
    {
      name: 'parentCollectionFields',
      Component: ParentCollectionFields,
    },
    {
      name: 'associationFields',
      Component: AssociatedFields,
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'addText',
      title: '{{t("Add Markdown")}}',
      Component: 'BlockItemInitializer',
      schema: {
        type: 'void',
        'x-editable': false,
        'x-decorator': 'FormItem',
        'x-decorator-props': {
          engine: 'handlebars',
        },
        // 'x-designer': 'Markdown.Void.Designer',
        'x-toolbar': 'FormItemSchemaToolbar',
        'x-settings': 'blockSettings:markdown',
        'x-component': 'Markdown.Void',
        'x-component-props': {
          content: '{{t("This is a demo text, **supports Markdown syntax**.")}}',
        },
      },
    },
    {
      name: 'addDivider',
      title: '{{t("Add group")}}',
      Component: 'BlockItemInitializer',
      schema: {
        type: 'void',
        'x-decorator': 'FormItem',
        'x-toolbar': 'FormItemSchemaToolbar',
        'x-settings': 'blockSettings:divider',
        'x-component': 'Divider',
        'x-component-props': {
          children: '{{t("Group")}}',
        },
      },
    },
  ],
};

/**
 * @deprecated
 * use `readPrettyFormItemInitializers` instead
 */
export const readPrettyFormItemInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'ReadPrettyFormItemInitializers',
  ...commonOptions,
});

export const readPrettyFormItemInitializers = new CompatibleSchemaInitializer(
  {
    name: 'details:configureFields',
    ...commonOptions,
  },
  readPrettyFormItemInitializers_deprecated,
);
