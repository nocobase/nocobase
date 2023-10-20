import {
  itemsMerge,
  SchemaInitializer,
  SchemaInitializerChildren,
  SchemaInitializerV2,
  useAssociatedTableColumnInitializerFields,
  useCompile,
  useInheritsTableColumnInitializerFields,
  useTableColumnInitializerFields,
} from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';

// 表格列配置
export const AuditLogsTableColumnInitializers = (props: any) => {
  const { items = [] } = props;
  const { t } = useTranslation();
  const associatedFields = useAssociatedTableColumnInitializerFields();
  const inheritFields = useInheritsTableColumnInitializerFields();
  const compile = useCompile();
  const fieldItems: any[] = [
    {
      type: 'itemGroup',
      title: t('Display fields'),
      children: useTableColumnInitializerFields(),
    },
  ];
  if (inheritFields?.length > 0) {
    inheritFields.forEach((inherit) => {
      Object.values(inherit)[0].length &&
        fieldItems.push(
          {
            type: 'divider',
          },
          {
            type: 'itemGroup',
            title: t(`Parent collection fields`) + '(' + compile(`${Object.keys(inherit)[0]}`) + ')',
            children: Object.values(inherit)[0],
          },
        );
    });
  }
  if (associatedFields?.length > 0) {
    fieldItems.push(
      {
        type: 'divider',
      },
      {
        type: 'itemGroup',
        title: t('Display association fields'),
        children: associatedFields,
      },
    );
  }
  fieldItems.push(
    {
      type: 'divider',
    },
    {
      type: 'item',
      title: t('Action column'),
      component: 'AuditLogsTableActionColumnInitializer',
    },
  );
  return (
    <SchemaInitializer.Button
      insertPosition={'beforeEnd'}
      icon={'SettingOutlined'}
      wrap={(s) => {
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
      }}
      items={itemsMerge(fieldItems)}
    >
      {t('Configure columns')}
    </SchemaInitializer.Button>
  );
};

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

export const auditLogsTableColumnInitializers = new SchemaInitializerV2({
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
      type: 'itemGroup',
      title: '{{t("Display fields")}}',
      useChildren: useTableColumnInitializerFields,
    },
    {
      name: 'parent-collection-fields',
      Component: ParentCollectionFields,
    },
    {
      name: 'association-fields',
      Component: AssociatedFields,
    },
    {
      name: 'action-column',
      title: '{{t("Action column")}}',
      Component: 'AuditLogsTableActionColumnInitializer',
    },
  ],
});
