import { ISchema, useField, useFieldSchema } from '@formily/react';
import {
  FilterBlockType,
  FixedBlockDesignerItem,
  GeneralSchemaDesigner,
  SchemaSettingsBlockTitleItem,
  SchemaSettingsCascaderItem,
  SchemaSettingsConnectDataBlocks,
  SchemaSettingsDataScope,
  SchemaSettingsDefaultSortingRules,
  SchemaSettingsDivider,
  SchemaSettingsModalItem,
  SchemaSettingsRemove,
  SchemaSettingsSelectItem,
  SchemaSettingsTemplate,
  getCollectionFieldsOptions,
  mergeFilter,
  useCollectionManagerV2,
  useCollectionV2,
  useCompile,
  useDesignable,
  useFormBlockContext,
  useSchemaTemplate,
} from '@nocobase/client';
import lodash from 'lodash';
import React from 'react';
import { useMapTranslation } from '../locale';
import { useMapBlockContext } from './MapBlockProvider';
import { findNestedOption } from './utils';

export const MapBlockDesigner = () => {
  const collection = useCollectionV2();
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { form } = useFormBlockContext();
  const { service } = useMapBlockContext();
  const { t } = useMapTranslation();
  const { dn } = useDesignable();
  const cm = useCollectionManagerV2();
  const defaultResource = fieldSchema?.['x-decorator-props']?.resource;
  const fieldNames = fieldSchema?.['x-decorator-props']?.['fieldNames'] || {};
  const defaultZoom = fieldSchema?.['x-component-props']?.['zoom'] || 13;
  const compile = useCompile();
  const template = useSchemaTemplate();

  const mapFieldOptions = getCollectionFieldsOptions(collection?.name, ['point', 'lineString', 'polygon'], {
    association: ['o2o', 'obo', 'oho', 'o2m', 'm2o', 'm2m'],
    collectionManager: cm,
    compile,
  });
  const markerFieldOptions = getCollectionFieldsOptions(collection?.name, 'string', {
    collectionManager: cm,
    compile,
  });
  const isPointField = findNestedOption(fieldNames.field, mapFieldOptions)?.type === 'point';

  return (
    <GeneralSchemaDesigner template={template} title={collection.title || collection.name}>
      <SchemaSettingsBlockTitleItem />
      <FixedBlockDesignerItem />
      <SchemaSettingsCascaderItem
        title={t('Map field')}
        value={fieldNames.field}
        options={mapFieldOptions}
        allowClear={false}
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
      {isPointField ? (
        <SchemaSettingsSelectItem
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
      ) : null}
      <SchemaSettingsDefaultSortingRules path="x-component-props.lineSort" title={t('Concatenation order field')} />
      <SchemaSettingsModalItem
        title={t('The default zoom level of the map')}
        schema={
          {
            type: 'object',
            title: t('Set default zoom level'),
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
          lodash.set(fieldSchema, 'x-component-props.zoom', zoom);
          Object.assign(field.componentProps, fieldSchema['x-component-props']);
          dn.emit('patch', {
            schema: {
              'x-uid': fieldSchema['x-uid'],
              'x-component-props': field.componentProps,
            },
          });
          dn.refresh();
        }}
      ></SchemaSettingsModalItem>
      <SchemaSettingsDataScope
        collectionName={collection.name}
        defaultFilter={fieldSchema?.['x-decorator-props']?.params?.filter || {}}
        form={form}
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
      <SchemaSettingsConnectDataBlocks type={FilterBlockType.TABLE} emptyDescription={t('No blocks to connect')} />
      <SchemaSettingsDivider />
      <SchemaSettingsTemplate componentName={'Map'} collectionName={name} resourceName={defaultResource} />
      <SchemaSettingsDivider />
      <SchemaSettingsRemove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};
