import { ISchema, useField, useFieldSchema } from '@formily/react';
import {
  FilterBlockType,
  FixedBlockDesignerItem,
  SchemaSettingsBlockTitleItem,
  SchemaSettingsCascaderItem,
  SchemaSettingsConnectDataBlocks,
  SchemaSettingsDataScope,
  SchemaSettingsDefaultSortingRules,
  SchemaSettingsModalItem,
  SchemaSettingsSelectItem,
  SchemaSettingsTemplate,
  mergeFilter,
  useCollection,
  useDesignable,
  useFormBlockContext,
  SchemaSettings,
  useCollectionManager_deprecated,
  setDataLoadingModeSettingsItem,
  useDataLoadingMode,
} from '@nocobase/client';
import lodash from 'lodash';
import { useMapTranslation } from '../locale';
import { useMapBlockContext } from './MapBlockProvider';
import { findNestedOption } from './utils';

export const mapBlockSettings = new SchemaSettings({
  name: 'blockSettings:map',
  items: [
    {
      name: 'title',
      Component: SchemaSettingsBlockTitleItem,
    },
    {
      name: 'fixBlock',
      Component: FixedBlockDesignerItem,
    },
    {
      name: 'mapField',
      Component: SchemaSettingsCascaderItem,
      useComponentProps() {
        const { getCollectionFieldsOptions } = useCollectionManager_deprecated();
        const { t } = useMapTranslation();
        const fieldSchema = useFieldSchema();
        const fieldNames = fieldSchema?.['x-decorator-props']?.['fieldNames'] || {};
        const field = useField();
        const { dn } = useDesignable();
        const { service } = useMapBlockContext();
        const { name } = useCollection();
        const mapFieldOptions = getCollectionFieldsOptions(name, ['point', 'lineString', 'polygon'], {
          association: ['o2o', 'obo', 'oho', 'o2m', 'm2o', 'm2m'],
        });
        return {
          title: t('Map field'),
          value: fieldNames.field,
          options: mapFieldOptions,
          allowClear: false,
          onChange: (v) => {
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
          },
        };
      },
    },
    {
      name: 'markerField',
      Component: SchemaSettingsSelectItem,
      useComponentProps() {
        const { t } = useMapTranslation();
        const fieldSchema = useFieldSchema();
        const fieldNames = fieldSchema?.['x-decorator-props']?.['fieldNames'] || {};
        const { service } = useMapBlockContext();
        const field = useField();
        const { dn } = useDesignable();
        const { getCollectionFieldsOptions } = useCollectionManager_deprecated();
        const { name } = useCollection();
        const markerFieldOptions = getCollectionFieldsOptions(name, 'string');
        return {
          title: t('Marker field'),
          value: fieldNames.marker,
          options: markerFieldOptions,
          onChange: (v) => {
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
          },
        };
      },
      useVisible() {
        const fieldSchema = useFieldSchema();
        const { getCollectionFieldsOptions } = useCollectionManager_deprecated();
        const { name } = useCollection();
        const fieldNames = fieldSchema?.['x-decorator-props']?.['fieldNames'] || {};
        const mapFieldOptions = getCollectionFieldsOptions(name, ['point', 'lineString', 'polygon'], {
          association: ['o2o', 'obo', 'oho', 'o2m', 'm2o', 'm2m'],
        });
        const isPointField = findNestedOption(fieldNames.field, mapFieldOptions)?.type === 'point';
        return isPointField;
      },
    },
    {
      name: 'setDefaultSortingRules',
      Component: SchemaSettingsDefaultSortingRules,
      useComponentProps() {
        const { t } = useMapTranslation();
        return {
          path: 'x-component-props.lineSort',
          title: t('Concatenation order field'),
        };
      },
    },
    setDataLoadingModeSettingsItem,
    {
      name: 'defaultZoomLevel',
      Component: SchemaSettingsModalItem,
      useComponentProps() {
        const { t } = useMapTranslation();
        const fieldSchema = useFieldSchema();
        const field = useField();
        const { dn } = useDesignable();
        const defaultZoom = fieldSchema?.['x-component-props']?.['zoom'] || 13;
        return {
          title: t('The default zoom level of the map'),
          schema: {
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
          } as ISchema,
          onSubmit: ({ zoom }) => {
            lodash.set(fieldSchema, 'x-component-props.zoom', zoom);
            Object.assign(field.componentProps, fieldSchema['x-component-props']);
            dn.emit('patch', {
              schema: {
                'x-uid': fieldSchema['x-uid'],
                'x-component-props': field.componentProps,
              },
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'dataScope',
      Component: SchemaSettingsDataScope,
      useComponentProps() {
        const { name } = useCollection();
        const fieldSchema = useFieldSchema();
        const { form } = useFormBlockContext();
        const field = useField();
        const { service } = useMapBlockContext();
        const { dn } = useDesignable();
        const dataLoadingMode = useDataLoadingMode();
        return {
          collectionName: name,
          defaultFilter: fieldSchema?.['x-decorator-props']?.params?.filter || {},
          form: form,
          onSubmit: ({ filter }) => {
            const params = field.decoratorProps.params || {};
            params.filter = filter;
            field.decoratorProps.params = params;
            fieldSchema['x-decorator-props']['params'] = params;
            const filters = service.params?.[1]?.filters || {};

            if (dataLoadingMode === 'auto') {
              service.run(
                { ...service.params?.[0], filter: mergeFilter([...Object.values(filters), filter]), page: 1 },
                { filters },
              );
            }

            dn.emit('patch', {
              schema: {
                ['x-uid']: fieldSchema['x-uid'],
                'x-decorator-props': fieldSchema['x-decorator-props'],
              },
            });
          },
        };
      },
    },
    {
      name: 'ConnectDataBlocks',
      Component: SchemaSettingsConnectDataBlocks,
      useComponentProps() {
        const { t } = useMapTranslation();
        return {
          type: FilterBlockType.TABLE,
          emptyDescription: t('No blocks to connect'),
        };
      },
    },

    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'template',
      Component: SchemaSettingsTemplate,
      useComponentProps() {
        const { name } = useCollection();
        const fieldSchema = useFieldSchema();
        const defaultResource =
          fieldSchema?.['x-decorator-props']?.resource || fieldSchema?.['x-decorator-props']?.association;
        return {
          componentName: 'Map',
          collectionName: name,
          resourceName: defaultResource,
        };
      },
    },
    {
      name: 'divider2',
      type: 'divider',
    },
    {
      name: 'remove',
      type: 'remove',
      componentProps: {
        removeParentsIfNoChildren: true,
        breakRemoveOn: {
          'x-component': 'Grid',
        },
      },
    },
  ],
});
