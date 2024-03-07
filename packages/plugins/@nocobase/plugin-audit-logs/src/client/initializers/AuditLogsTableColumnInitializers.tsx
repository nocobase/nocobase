import {
  CompatibleSchemaInitializer,
  SchemaInitializerChildren,
  useAssociatedTableColumnInitializerFields,
  useCompile,
  useInheritsTableColumnInitializerFields,
  useTableColumnInitializerFields,
} from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';

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
        children: Object.values(inherit)[0].filter((v: any) => !v?.field?.isForeignKey),
      });
  });
  return <SchemaInitializerChildren>{res}</SchemaInitializerChildren>;
};

const AssociatedFields = () => {
  const associatedFields = useAssociatedTableColumnInitializerFields();
  const { t } = useTranslation();

  if (!associatedFields?.length) return null;
  const schema: any = [
    {
      type: 'itemGroup',
      divider: true,
      title: t('Display association fields'),
      children: associatedFields,
    },
  ];
  return <SchemaInitializerChildren>{schema}</SchemaInitializerChildren>;
};

/**
 * @deprecated
 */
export const auditLogsTableColumnInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'AuditLogsTableColumnInitializers',
  insertPosition: 'beforeEnd',
  icon: 'SettingOutlined',
  title: '{{t("Configure columns")}}',
  wrap(s) {
    if (s['x-action-column']) {
      return s;
    }
    return {
      type: 'void',
      'x-decorator': 'TableV2.Column.Decorator',
      'x-designer': 'TableV2.Column.Designer',
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
      name: 'actionColumn',
      title: '{{t("Action column")}}',
      Component: 'AuditLogsTableActionColumnInitializer',
    },
  ],
});

export const auditLogsTableColumnInitializers = new CompatibleSchemaInitializer(
  {
    name: 'auditLogsTable:configureColumns',
    insertPosition: 'beforeEnd',
    icon: 'SettingOutlined',
    title: '{{t("Configure columns")}}',
    wrap(s) {
      if (s['x-action-column']) {
        return s;
      }
      return {
        type: 'void',
        'x-decorator': 'TableV2.Column.Decorator',
        'x-designer': 'TableV2.Column.Designer',
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
        name: 'actionColumn',
        title: '{{t("Action column")}}',
        Component: 'AuditLogsTableActionColumnInitializer',
      },
    ],
  },
  auditLogsTableColumnInitializers_deprecated,
);
