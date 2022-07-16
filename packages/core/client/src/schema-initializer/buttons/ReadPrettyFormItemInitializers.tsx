import { union } from 'lodash';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaInitializer } from '../SchemaInitializer';
import { gridRowColWrap, useAssociatedFormItemInitializerFields, useFormItemInitializerFields } from '../utils';

export const ReadPrettyFormItemInitializers = (props: any) => {
  const { t } = useTranslation();
  const { insertPosition, component } = props;
  const associationFields = useAssociatedFormItemInitializerFields({ readPretty: true, block: 'Form' });

  return (
    <SchemaInitializer.Button
      wrap={gridRowColWrap}
      icon={'SettingOutlined'}
      items={union<any>(
        [
          {
            type: 'itemGroup',
            title: t('Display fields'),
            children: useFormItemInitializerFields(),
          },
        ],
        associationFields.length > 0
          ? [
              {
                type: 'divider',
              },
              {
                type: 'itemGroup',
                title: t('Display association fields'),
                children: associationFields,
              },
            ]
          : [],
        [
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
        ],
      )}
      insertPosition={insertPosition}
      component={component}
      title={component ? null : t('Configure fields')}
    />
  );
};
