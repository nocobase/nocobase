import { useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useCollection, useCollectionFilterOptions } from '../../../collection-manager';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';
import { useSchemaTemplate } from '../../../schema-templates';
import { useTranslation } from 'react-i18next';
import { useCompile, useDesignable, useTreeBlockContext } from '@nocobase/client';

export const TreeBlockDesigner = () => {
  const { name, title } = useCollection();
  const fieldSchema = useFieldSchema();
  const defaultResource = fieldSchema?.['x-decorator-props']?.resource;

  const template = useSchemaTemplate();
  const compile = useCompile();

  const { t } = useTranslation();
  const field = useField();
  const { service } = useTreeBlockContext();
  const { dn } = useDesignable();
  const dataSource = useCollectionFilterOptions(name);
  const fieldNames = field.decoratorProps?.fieldNames;
  const options = dataSource.map((value) => {
    return { label: compile(value?.title), value: value?.name };
  });
  return (
    <GeneralSchemaDesigner template={template} title={title || name}>
      <SchemaSettings.BlockTitleItem />
      <SchemaSettings.Divider />
      <SchemaSettings.SelectItem
        title={t('Tree key field')}
        value={fieldNames?.key}
        options={options}
        onChange={(key) => {
          field.decoratorProps.fieldNames.key = key;
          fieldSchema['x-decorator-props'].fieldNames.key = key;
          service.refresh();
          dn.emit('patch', {
            schema: {
              ['x-uid']: fieldSchema['x-uid'],
              'x-decorator-props': fieldSchema['x-decorator-props'],
            },
          });
        }}
      />
      <SchemaSettings.SelectItem
        title={t('Tree title field')}
        value={fieldNames?.title}
        options={options}
        onChange={(title) => {
          field.decoratorProps.fieldNames.title = title;
          fieldSchema['x-decorator-props'].fieldNames.title = title;
          service.refresh();
          dn.emit('patch', {
            schema: {
              ['x-uid']: fieldSchema['x-uid'],
              'x-decorator-props': fieldSchema['x-decorator-props'],
            },
          });
        }}
      />
      <SchemaSettings.Template componentName={'Tree'} collectionName={name} resourceName={defaultResource} />
      <SchemaSettings.Divider />
      <SchemaSettings.Remove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};
