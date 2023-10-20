import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCompile } from '../../schema-component';
import { SchemaInitializer } from '../SchemaInitializer';
import {
  gridRowColWrap,
  useAssociatedFormItemInitializerFields,
  useFilterAssociatedFormItemInitializerFields,
  useFilterFormItemInitializerFields,
  useFilterInheritsFormItemInitializerFields,
  useFormItemInitializerFields,
  useInheritsFormItemInitializerFields,
} from '../utils';
import { SchemaInitializerChildren, SchemaInitializerV2 } from '../../application';

// 表单里配置字段
export const FormItemInitializers = (props: any) => {
  const { t } = useTranslation();
  const { insertPosition, component } = props;
  const associationFields = useAssociatedFormItemInitializerFields({
    readPretty: true,
    block: 'Form',
  });
  const inheritFields = useInheritsFormItemInitializerFields();
  const compile = useCompile();
  const fieldItems: any[] = [
    {
      type: 'itemGroup',
      title: t('Display fields'),
      children: useFormItemInitializerFields(),
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
  associationFields.length > 0 &&
    fieldItems.push(
      {
        type: 'divider',
      },
      {
        type: 'itemGroup',
        title: t('Display association fields'),
        children: associationFields,
      },
    );

  fieldItems.push(
    {
      type: 'divider',
    },
    {
      type: 'item',
      title: t('Add text'),
      component: 'BlockInitializer',
      schema: {
        type: 'void',
        'x-editable': false,
        'x-decorator': 'FormItem',
        'x-designer': 'Markdown.Void.Designer',
        'x-component': 'Markdown.Void',
        'x-component-props': {
          content: t('This is a demo text, **supports Markdown syntax**.'),
        },
      },
    },
  );
  return (
    <SchemaInitializer.Button
      data-testid="configure-fields-button-of-form-item"
      wrap={gridRowColWrap}
      icon={'SettingOutlined'}
      items={fieldItems}
      insertPosition={insertPosition}
      component={component}
      title={component ? null : t('Configure fields')}
    />
  );
};

export const FilterFormItemInitializers = (props: any) => {
  const { t } = useTranslation();
  const { insertPosition, component } = props;
  const associationFields = useFilterAssociatedFormItemInitializerFields();
  const inheritFields = useFilterInheritsFormItemInitializerFields();
  const compile = useCompile();
  const fieldItems: any[] = [
    {
      type: 'itemGroup',
      title: t('Display fields'),
      children: useFilterFormItemInitializerFields(),
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

  associationFields.length > 0 &&
    fieldItems.push(
      {
        type: 'divider',
      },
      {
        type: 'itemGroup',
        title: t('Display association fields'),
        children: associationFields,
      },
    );

  fieldItems.push(
    {
      type: 'divider',
    },
    {
      type: 'item',
      title: t('Add text'),
      component: 'BlockInitializer',
      schema: {
        type: 'void',
        'x-editable': false,
        'x-decorator': 'FormItem',
        'x-designer': 'Markdown.Void.Designer',
        'x-component': 'Markdown.Void',
        'x-component-props': {
          content: t('This is a demo text, **supports Markdown syntax**.'),
        },
      },
    },
  );
  return (
    <SchemaInitializer.Button
      data-testid="configure-fields-button-of-filter-form-item"
      wrap={gridRowColWrap}
      icon={'SettingOutlined'}
      items={fieldItems}
      insertPosition={insertPosition}
      component={component}
      title={component ? null : t('Configure fields')}
    />
  );
};

const ParentCollectionFields = () => {
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

export const formItemInitializers = new SchemaInitializerV2({
  name: 'FormItemInitializers',
  'data-testid': 'configure-fields-button-of-form-item',
  wrap: gridRowColWrap,
  icon: 'SettingOutlined',
  title: '{{t("Configure fields")}}',
  items: [
    {
      type: 'itemGroup',
      name: 'display-fields',
      title: '{{t("Display fields")}}',
      useChildren: useFormItemInitializerFields,
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
      type: 'divider',
    },
    {
      title: '{{t("Add text")}}',
      Component: 'BlockInitializer',
      schema: {
        type: 'void',
        'x-editable': false,
        'x-decorator': 'FormItem',
        'x-designer': 'Markdown.Void.Designer',
        'x-component': 'Markdown.Void',
        'x-component-props': {
          content: '{{t("This is a demo text, **supports Markdown syntax**.")}}',
        },
      },
    },
  ],
});

export const FilterParentCollectionFields = () => {
  const inheritFields = useFilterInheritsFormItemInitializerFields();
  const { t } = useTranslation();
  const compile = useCompile();
  const res = [];
  if (inheritFields?.length > 0) {
    inheritFields.forEach((inherit) => {
      Object.values(inherit)[0].length &&
        res.push({
          divider: true,
          type: 'itemGroup',
          title: t(`Parent collection fields`) + '(' + compile(`${Object.keys(inherit)[0]}`) + ')',
          children: Object.values(inherit)[0],
        });
    });
  }

  return <SchemaInitializerChildren>{res}</SchemaInitializerChildren>;
};

export const FilterAssociatedFields = () => {
  const associationFields = useFilterAssociatedFormItemInitializerFields();
  const { t } = useTranslation();
  const res: any[] = [
    {
      type: 'itemGroup',
      title: t('Display association fields'),
      children: associationFields,
    },
  ];
  return <SchemaInitializerChildren>{res}</SchemaInitializerChildren>;
};

export const filterFormItemInitializers = new SchemaInitializerV2({
  name: 'FilterFormItemInitializers',
  'data-testid': 'configure-fields-button-of-filter-form-item',
  wrap: gridRowColWrap,
  icon: 'SettingOutlined',
  title: '{{t("Configure fields")}}',
  items: [
    {
      type: 'itemGroup',
      name: 'display-fields',
      title: '{{t("Display fields")}}',
      useChildren: useFilterFormItemInitializerFields,
    },
    {
      name: 'parent-collection-fields',
      Component: FilterParentCollectionFields,
    },
    {
      name: 'association-fields',
      Component: FilterAssociatedFields,
    },
    {
      type: 'divider',
    },
    {
      title: '{{t("Add text")}}',
      Component: 'BlockInitializer',
      name: 'add-text',
      schema: {
        type: 'void',
        'x-editable': false,
        'x-decorator': 'FormItem',
        'x-designer': 'Markdown.Void.Designer',
        'x-component': 'Markdown.Void',
        'x-component-props': {
          content: '{{t("This is a demo text, **supports Markdown syntax**.")}}',
        },
      },
    },
  ],
});
