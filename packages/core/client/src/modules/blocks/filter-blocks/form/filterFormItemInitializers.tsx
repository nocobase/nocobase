/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CompatibleSchemaInitializer } from '../../../../application/schema-initializer/CompatibleSchemaInitializer';
import {
  FilterAssociatedFields,
  FilterParentCollectionFields,
} from '../../../../schema-initializer/buttons/FormItemInitializers';
import { gridRowColWrap, useFilterFormItemInitializerFields } from '../../../../schema-initializer/utils';

const commonOptions = {
  wrap: gridRowColWrap,
  icon: 'SettingOutlined',
  title: '{{t("Configure fields")}}',
  items: [
    {
      type: 'itemGroup',
      name: 'displayFields',
      title: '{{t("Display fields")}}',
      useChildren: useFilterFormItemInitializerFields,
    },
    {
      name: 'parentCollectionFields',
      Component: FilterParentCollectionFields,
    },
    {
      name: 'associationFields',
      Component: FilterAssociatedFields,
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      title: '{{t("Add Markdown")}}',
      Component: 'MarkdownFormItemInitializer',
      name: 'addText',
    },
  ],
};

/**
 * @deprecated
 * use `filterFormItemInitializers` instead
 */
export const filterFormItemInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'FilterFormItemInitializers',
  ...commonOptions,
});

export const filterFormItemInitializers = new CompatibleSchemaInitializer(
  {
    name: 'filterForm:configureFields',
    ...commonOptions,
  },
  filterFormItemInitializers_deprecated,
);
