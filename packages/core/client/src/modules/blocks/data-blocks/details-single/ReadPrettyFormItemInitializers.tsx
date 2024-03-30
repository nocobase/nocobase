import React from 'react';
import { useTranslation } from 'react-i18next';
import { CompatibleSchemaInitializer } from '../../../../application/schema-initializer/CompatibleSchemaInitializer';
import { useCompile } from '../../../../schema-component';
import {
  gridRowColWrap,
  useAssociatedFormItemInitializerFields,
  useFormItemInitializerFields,
  useInheritsFormItemInitializerFields,
} from '../../../../schema-initializer/utils';
import { SchemaInitializerChildren } from '../../../../application/schema-initializer/components/SchemaInitializerChildren';

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

/**
 * @deprecated
 * 已弃用，请使用 readPrettyFormItemInitializers 代替
 */
export const readPrettyFormItemInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'ReadPrettyFormItemInitializers',
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
      title: '{{t("Add text")}}',
      Component: 'BlockItemInitializer',
      schema: {
        type: 'void',
        'x-editable': false,
        'x-decorator': 'FormItem',
        // 'x-designer': 'Markdown.Void.Designer',
        'x-toolbar': 'BlockSchemaToolbar',
        'x-settings': 'blockSettings:markdown',
        'x-component': 'Markdown.Void',
        'x-component-props': {
          content: '{{t("This is a demo text, **supports Markdown syntax**.")}}',
        },
      },
    },
  ],
});

export const readPrettyFormItemInitializers = new CompatibleSchemaInitializer(
  {
    name: 'details:configureFields',
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
        title: '{{t("Add text")}}',
        Component: 'BlockItemInitializer',
        schema: {
          type: 'void',
          'x-editable': false,
          'x-decorator': 'FormItem',
          // 'x-designer': 'Markdown.Void.Designer',
          'x-toolbar': 'BlockSchemaToolbar',
          'x-settings': 'blockSettings:markdown',
          'x-component': 'Markdown.Void',
          'x-component-props': {
            content: '{{t("This is a demo text, **supports Markdown syntax**.")}}',
          },
        },
      },
    ],
  },
  readPrettyFormItemInitializers_deprecated,
);
