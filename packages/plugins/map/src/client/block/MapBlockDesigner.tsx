import { ISchema, useField, useFieldSchema } from '@formily/react';
import {
  useCollection,
  useCollectionFilterOptions,
  useDesignable,
  useSchemaTemplate,
  useFixedBlockDesignerSetting,
  GeneralSchemaDesigner,
  SchemaSettings,
  mergeFilter,
  useCollectionManager,
} from '@nocobase/client';
import set from 'lodash/set';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useMapBlockContext } from './MapBlockProvider';

export const MapBlockDesigner = () => {
  const { name, title } = useCollection();
  const field = useField();
  const fieldSchema = useFieldSchema();
  const dataSource = useCollectionFilterOptions(name);
  const { service } = useMapBlockContext();
  const { t } = useTranslation();
  const { dn } = useDesignable();
  const { getCollectionFieldsOptions } = useCollectionManager();
  const collection = useCollection();
  const defaultFilter = fieldSchema?.['x-decorator-props']?.params?.filter || {};
  const defaultResource = fieldSchema?.['x-decorator-props']?.resource;
  const fieldNames = fieldSchema?.['x-decorator-props']?.['fieldNames'] || {};
  const defaultZoom = fieldSchema?.['x-component-props']?.['zoom'] || 13;

  const template = useSchemaTemplate();
  const fixedBlockDesignerSetting = useFixedBlockDesignerSetting();

  const mapFieldOptions = getCollectionFieldsOptions(collection?.name, ['point', 'lineString', 'polygon']);
  const markerFieldOptions = getCollectionFieldsOptions(collection?.name, 'string');

  return (
    <GeneralSchemaDesigner template={template} title={title || name}>
      <SchemaSettings.BlockTitleItem />
      {fixedBlockDesignerSetting}
      <SchemaSettings.SelectItem
        title={t('Map field')}
        value={fieldNames.field}
        options={mapFieldOptions}
        onChange={(v) => {
          const fieldNames = field.decoratorProps.fieldNames || {};
          fieldNames['field'] = v;
          field.decoratorProps.fieldNames = fieldNames;
          fieldSchema['x-decorator-props']['fieldNames'] = fieldNames;
          service.refresh();
          dn.emit('patch', {
            schema: {
              ['x-uid']: fieldSchema['x-uid'],
              'x-decorator-props': field.decoratorProps,
            },
          });
          dn.refresh();
        }}
      />
      <SchemaSettings.SelectItem
        title={t('Marker field')}
        value={fieldNames.marker}
        options={markerFieldOptions}
        onChange={(v) => {
          const fieldNames = field.decoratorProps.fieldNames || {};
          fieldNames['marker'] = v;
          field.decoratorProps.fieldNames = fieldNames;
          fieldSchema['x-decorator-props']['fieldNames'] = fieldNames;
          service.refresh();
          dn.emit('patch', {
            schema: {
              ['x-uid']: fieldSchema['x-uid'],
              'x-decorator-props': field.decoratorProps,
            },
          });
          dn.refresh();
        }}
      />
      <SchemaSettings.ModalItem
        title={t('Default zoom')}
        schema={
          {
            type: 'object',
            title: t('Set the default zoom of map'),
            properties: {
              zoom: {
                title: t('Zoom'),
                default: defaultZoom,
                'x-component': 'InputNumber',
                'x-decorator': 'FormItem',
                'x-component-props': {
                  precision: 0,
                },
              },
            },
          } as ISchema
        }
        onSubmit={({ zoom }) => {
          set(fieldSchema, 'x-component-props.zoom', zoom);
          Object.assign(field.componentProps, fieldSchema['x-component-props']);
          dn.emit('patch', {
            schema: {
              'x-uid': fieldSchema['x-uid'],
              'x-component-props': field.componentProps,
            },
          });
          dn.refresh();
        }}
      ></SchemaSettings.ModalItem>
      <SchemaSettings.ModalItem
        title={t('Set the data scope')}
        schema={
          {
            type: 'object',
            title: t('Set the data scope'),
            properties: {
              filter: {
                default: defaultFilter,
                // title: '数据范围',
                enum: dataSource,
                'x-component': 'Filter',
                'x-component-props': {},
              },
            },
          } as ISchema
        }
        onSubmit={({ filter }) => {
          const params = field.decoratorProps.params || {};
          params.filter = filter;
          field.decoratorProps.params = params;
          fieldSchema['x-decorator-props']['params'] = params;
          const filters = service.params?.[1]?.filters || {};
          service.run(
            { ...service.params?.[0], filter: mergeFilter([...Object.values(filters), filter]), page: 1 },
            { filters },
          );
          dn.emit('patch', {
            schema: {
              ['x-uid']: fieldSchema['x-uid'],
              'x-decorator-props': fieldSchema['x-decorator-props'],
            },
          });
        }}
      />
      <SchemaSettings.Divider />
      <SchemaSettings.Template componentName={'Map'} collectionName={name} resourceName={defaultResource} />
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
