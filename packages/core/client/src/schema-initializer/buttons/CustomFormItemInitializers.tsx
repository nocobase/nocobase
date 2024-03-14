import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCompile } from '../../schema-component';
import { gridRowColWrap, useCustomFormItemInitializerFields, useInheritsFormItemInitializerFields } from '../utils';
import { SchemaInitializerChildren } from '../../application/schema-initializer/components/SchemaInitializerChildren';
import { CompatibleSchemaInitializer } from '../../application/schema-initializer/CompatibleSchemaInitializer';

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

/**
 * @deprecated
 */
export const customFormItemInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'CustomFormItemInitializers',
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
});

export const customFormItemInitializers = new CompatibleSchemaInitializer(
  {
    name: 'assignFieldValuesForm:configureFields',
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
  },
  customFormItemInitializers_deprecated,
);
