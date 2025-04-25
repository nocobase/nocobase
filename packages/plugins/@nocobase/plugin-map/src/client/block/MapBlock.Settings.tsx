/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, useField, useFieldSchema } from '@formily/react';
import {
  FilterBlockType,
  SchemaSettings,
  SchemaSettingsBlockHeightItem,
  SchemaSettingsBlockTitleItem,
  SchemaSettingsCascaderItem,
  SchemaSettingsConnectDataBlocks,
  SchemaSettingsDataScope,
  SchemaSettingsDefaultSortingRules,
  SchemaSettingsModalItem,
  SchemaSettingsSelectItem,
  SchemaSettingsTemplate,
  setDataLoadingModeSettingsItem,
  useBlockTemplateContext,
  useCollection,
  useCollectionManager_deprecated,
  useDesignable,
  useFormBlockContext,
  useColumnSchema,
  SchemaSettingsLinkageRules,
  LinkageRuleCategory,
} from '@nocobase/client';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useMapTranslation } from '../locale';
import { useMapBlockContext } from './MapBlockProvider';
import { findNestedOption } from './utils';

export const defaultZoomLevel = {
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
        _.set(fieldSchema, 'x-component-props.zoom', zoom);
        field.componentProps.zoom = zoom;
        dn.emit('patch', {
          schema: {
            'x-uid': fieldSchema['x-uid'],
            'x-component-props': fieldSchema['x-component-props'],
          },
        });
        dn.refresh();
      },
    };
  },
  useVisible() {
    const { fieldSchema: tableColumnSchema } = useColumnSchema();
    return !tableColumnSchema;
  },
};

export const mapBlockSettings = new SchemaSettings({
  name: 'blockSettings:map',
  items: [
    {
      name: 'title',
      Component: SchemaSettingsBlockTitleItem,
    },
    {
      name: 'setTheBlockHeight',
      Component: SchemaSettingsBlockHeightItem,
    },
    {
      name: 'blockLinkageRules',
      Component: SchemaSettingsLinkageRules,
      useComponentProps() {
        const { name } = useCollection();
        const { t } = useTranslation();
        return {
          collectionName: name,
          title: t('Block Linkage rules'),
          category: LinkageRuleCategory.block,
        };
      },
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
        const mapFieldOptions = getCollectionFieldsOptions(name, ['point', 'lineString', 'polygon'], null, {
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
        const mapFieldOptions = getCollectionFieldsOptions(name, ['point', 'lineString', 'polygon'], null, {
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
    defaultZoomLevel,
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
        const { componentNamePrefix } = useBlockTemplateContext();
        const defaultResource =
          fieldSchema?.['x-decorator-props']?.resource || fieldSchema?.['x-decorator-props']?.association;
        return {
          componentName: `${componentNamePrefix}Map`,
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
