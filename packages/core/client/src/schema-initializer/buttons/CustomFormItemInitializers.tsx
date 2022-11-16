import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaInitializer } from '../SchemaInitializer';
import { gridRowColWrap, useCustomFormItemInitializerFields,useInheritsFormItemInitializerFields } from '../utils';
import { useCompile } from '../../schema-component';

// 表单里配置字段
export const CustomFormItemInitializers = (props: any) => {
  const { t } = useTranslation();
  const compile = useCompile();
  const { insertPosition, component } = props;
  const inheritFields = useInheritsFormItemInitializerFields();
  const fieldItems:any[]=[
    {
      type: 'itemGroup',
      title: t('Configure fields'),
      children: useCustomFormItemInitializerFields(),
    },
  ]
  if (inheritFields?.length > 0) {
    inheritFields.forEach((inherit) => {
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
  return (
    <SchemaInitializer.Button
      wrap={gridRowColWrap}
      icon={'SettingOutlined'}
      items={fieldItems}
      insertPosition={insertPosition}
      component={component}
      title={component ? null : t('Configure fields')}
    />
  );
};
