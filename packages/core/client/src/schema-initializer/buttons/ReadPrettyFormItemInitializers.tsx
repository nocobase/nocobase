import { union } from 'lodash';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaInitializer } from '../SchemaInitializer';
import { gridRowColWrap, useAssociatedFormItemInitializerFields, useFormItemInitializerFields ,useInheritsFormItemInitializerFields} from '../utils';

export const ReadPrettyFormItemInitializers = (props: any) => {
  const { t } = useTranslation();
  const { insertPosition, component } = props;
  const associationFields = useAssociatedFormItemInitializerFields({ readPretty: true, block: 'Form' });
  const inheritFields = useInheritsFormItemInitializerFields();

  const fieldItems: any[] = [
    {
      type: 'itemGroup',
      title: t('Display fields'),
      children: useFormItemInitializerFields(),
    },
  ];
  if (inheritFields?.length > 0) {
    inheritFields.forEach((inherit) => {
      fieldItems.push(
        {
          type: 'divider',
        },
        {
          type: 'itemGroup',
          title: t(`Parent collection fields(${Object.keys(inherit)[0]})`),
          children: Object.values(inherit)[0],
        },
      );
    });
  }
  associationFields.length > 0 &&
    fieldItems.push([
      {
        type: 'divider',
      },
      {
        type: 'itemGroup',
        title: t('Display association fields'),
        children: associationFields,
      },
    ]);

  fieldItems.push([
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
  ]);
  console.log(fieldItems)
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
