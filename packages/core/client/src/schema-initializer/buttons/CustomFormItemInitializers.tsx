import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCompile } from '../../schema-component';
import { gridRowColWrap, useCustomFormItemInitializerFields, useInheritsFormItemInitializerFields } from '../utils';
import { SchemaInitializerChildren, SchemaInitializerV2 } from '../../application';

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

export const customFormItemInitializers = new SchemaInitializerV2({
  name: 'CustomFormItemInitializers',
  'data-testid': 'configure-fields-button-of-custom-form-item',
  wrap: gridRowColWrap,
  icon: 'SettingOutlined',
  title: '{{t("Configure fields")}}',
  items: [
    {
      type: 'itemGroup',
      title: '{{t("Configure fields")}}',
      name: 'configure-fields',
      useChildren: useCustomFormItemInitializerFields,
    },
    {
      name: 'parent-collection-fields',
      Component: ParentCollectionFields,
    },
  ],
});
