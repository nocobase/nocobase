/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CompatibleSchemaInitializer } from '../../../../application/schema-initializer/CompatibleSchemaInitializer';
import { AssociatedFields, ParentCollectionFields } from '../../../../schema-initializer/buttons/FormItemInitializers';
import { gridRowColWrap, useFormItemInitializerFields } from '../../../../schema-initializer/utils';

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
      Component: 'MarkdownFormItemInitializer',
    },
    {
      name: 'addDivider',
      title: '{{t("Add group")}}',
      Component: 'DividerFormItemInitializer',
    },
  ],
};

/**
 * @deprecated
 * use `formItemInitializers` instead
 * 表单里配置字段
 */
export const formItemInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'FormItemInitializers',
  ...commonOptions,
});

export const formItemInitializers = new CompatibleSchemaInitializer(
  {
    name: 'form:configureFields',
    ...commonOptions,
  },
  formItemInitializers_deprecated,
);
