import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaInitializer } from '../SchemaInitializer';
import { gridRowColWrap, useFormItemInitializerFields } from './utils';

// Grid 组件里配置字段
export const GridFormItemInitializers = (props: any) => {
  const { t } = useTranslation();
  return (
    <SchemaInitializer.Button
      wrap={gridRowColWrap}
      items={[
        {
          type: 'itemGroup',
          title: t('Display fields'),
          children: useFormItemInitializerFields(),
        },
        {
          type: 'divider',
        },
        {
          type: 'item',
          title: t('Add text'),
          component: 'GeneralInitializer',
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
      ]}
    >
      {t('Configure fields')}
    </SchemaInitializer.Button>
  );
};
