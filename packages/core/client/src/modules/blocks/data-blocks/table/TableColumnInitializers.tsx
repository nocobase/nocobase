/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CompatibleSchemaInitializer } from '../../../../application/schema-initializer/CompatibleSchemaInitializer';
import { SchemaInitializerChildren } from '../../../../application/schema-initializer/components/SchemaInitializerChildren';
import { useCompile } from '../../../../schema-component/hooks/useCompile';
import {
  useAssociatedTableColumnInitializerFields,
  useInheritsTableColumnInitializerFields,
  useTableColumnInitializerFields,
} from '../../../../schema-initializer/utils';

// 表格列配置
const ParentCollectionFields = () => {
  const inheritFields = useInheritsTableColumnInitializerFields();
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
  const associatedFields = useAssociatedTableColumnInitializerFields();
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const schema: any = useMemo(
    () => [
      {
        type: 'itemGroup',
        title: t('Display association fields'),
        children: associatedFields,
      },
    ],
    [associatedFields, t],
  );
  if (!associatedFields?.length || fieldSchema['x-component'] === 'AssociationField.SubTable') return null;
  return <SchemaInitializerChildren>{schema}</SchemaInitializerChildren>;
};

const commonOptions = {
  insertPosition: 'beforeEnd',
  icon: 'SettingOutlined',
  title: '{{t("Configure columns")}}',
  wrap: (s, { isInSubTable }) => {
    if (s['x-action-column']) {
      return s;
    }
    return {
      type: 'void',
      'x-decorator': 'TableV2.Column.Decorator',
      // 'x-designer': 'TableV2.Column.Designer',
      'x-toolbar': 'TableColumnSchemaToolbar',
      'x-settings': 'fieldSettings:TableColumn',
      'x-component': 'TableV2.Column',
      properties: {
        [s.name]: {
          ...s,
        },
      },
    };
  },
  items: [
    {
      name: 'displayFields',
      type: 'itemGroup',
      title: '{{t("Display fields")}}',
      // children: DisplayFields,
      useChildren: useTableColumnInitializerFields,
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
      useVisible() {
        const fieldSchema = useFieldSchema();
        return fieldSchema['x-component'] !== 'AssociationField.SubTable';
      },
    },
    {
      type: 'item',
      name: 'add',
      title: '{{t("Action column")}}',
      Component: 'TableActionColumnInitializer',
      useVisible() {
        const fieldSchema = useFieldSchema();
        return fieldSchema['x-component'] !== 'AssociationField.SubTable';
      },
    },
  ],
};

/**
 * @deprecated
 * use `tableColumnInitializers` instead
 */
export const tableColumnInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'TableColumnInitializers',
  ...commonOptions,
});

export const tableColumnInitializers = new CompatibleSchemaInitializer(
  {
    name: 'table:configureColumns',
    ...commonOptions,
  },
  tableColumnInitializers_deprecated,
);
