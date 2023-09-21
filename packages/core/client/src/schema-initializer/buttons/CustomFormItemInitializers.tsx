import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCompile } from '../../schema-component';
import { SchemaInitializer } from '../SchemaInitializer';
import { gridRowColWrap, useCustomFormItemInitializerFields, useInheritsFormItemInitializerFields } from '../utils';

// 表单里配置字段
export const CustomFormItemInitializers = (props: any) => {
  const { t } = useTranslation();
  const compile = useCompile();
  const { insertPosition, component } = props;
  const inheritFields = useInheritsFormItemInitializerFields({ component: 'AssignedField' });
  const fieldItems: any[] = [
    {
      type: 'itemGroup',
      title: t('Configure fields'),
      children: useCustomFormItemInitializerFields(),
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
  return (
    <SchemaInitializer.Button
      data-testid="configure-fields-button-of-custom-form-item"
      wrap={gridRowColWrap}
      icon={'SettingOutlined'}
      items={fieldItems}
      insertPosition={insertPosition}
      component={component}
      title={component ? null : t('Configure fields')}
    />
  );
};
