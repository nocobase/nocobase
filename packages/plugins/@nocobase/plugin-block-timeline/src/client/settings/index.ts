/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  SchemaSettings,
  SchemaSettingsBlockTitleItem,
  SchemaSettingsBlockHeightItem,
  SchemaSettingsTemplate,
  useCollection,
  useBlockTemplateContext,
  SchemaSettingsDataScope,
  useFormBlockContext,
  SchemaSettingsSelectItem,
  useCollectionManager_deprecated,
  SchemaSettingsCascaderItem,
  useDesignable,
  useApp,
  useBlockRequestContext,
  useDataBlockRequest,
} from '@nocobase/client';
import { ISchema, useField, useFieldSchema } from '@formily/react';
import { useT } from '../locale';
export const timelineSettings = new SchemaSettings({
  name: 'blockSettings:timeline',
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
      name: 'titleField',
      Component: SchemaSettingsSelectItem,
      useComponentProps() {
        const t = useT();
        const fieldSchema = useFieldSchema();
        const fieldNames = fieldSchema?.['x-decorator-props']?.['timeline'] || {};
        //   const { service } = useMapBlockContext();
        const { runAsync } = useDataBlockRequest();
        const field = useField();
        const { dn } = useDesignable();
        const { getCollectionFieldsOptions } = useCollectionManager_deprecated();
        const { name } = useCollection();
        const titleFieldOptions = getCollectionFieldsOptions(name, ['string', 'text'])?.filter(
          (item) => item.interface == 'input' || item.interface == 'textarea',
        );
        return {
          title: t('Title Field'),
          value: fieldNames.titleField,
          options: titleFieldOptions,
          onChange: (v) => {
            const fieldNames = field.decoratorProps.timeline || {};
            fieldNames['titleField'] = v;
            field.decoratorProps.timeline = fieldNames;
            fieldSchema['x-decorator-props']['timeline'] = fieldNames;
            //   service.refresh();
            runAsync();
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
      name: 'timeField',
      Component: SchemaSettingsSelectItem,
      useComponentProps() {
        const t = useT();
        const fieldSchema = useFieldSchema();
        const fieldNames = fieldSchema?.['x-decorator-props']?.['timeline'] || {};
        //   const { service } = useMapBlockContext();
        const { runAsync } = useDataBlockRequest();
        const field = useField();
        const { dn } = useDesignable();
        const { getCollectionFieldsOptions } = useCollectionManager_deprecated();
        const { name } = useCollection();
        const timeFieldOptions = getCollectionFieldsOptions(
          name,
          ['date', 'datetime', 'time', 'datetimeNoTz', 'unixTimestamp', 'dateOnly'],
          {
            association: ['o2o', 'obo', 'oho', 'm2o'],
          },
        );
        return {
          title: t('Time Field'),
          value: fieldNames.timeField,
          options: timeFieldOptions,
          onChange: (v) => {
            const fieldNames = field.decoratorProps.timeline || {};
            fieldNames['timeField'] = v;
            field.decoratorProps.timeline = fieldNames;
            fieldSchema['x-decorator-props']['timeline'] = fieldNames;
            //   service.refresh();
            runAsync();
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
      name: 'colorField',
      Component: SchemaSettingsSelectItem,
      useComponentProps() {
        const t = useT();
        const fieldSchema = useFieldSchema();
        const fieldNames = fieldSchema?.['x-decorator-props']?.['timeline'] || {};
        //   const { service } = useMapBlockContext();
        const { runAsync } = useDataBlockRequest();
        const field = useField();
        const { dn } = useDesignable();
        const { getCollectionFieldsOptions } = useCollectionManager_deprecated();
        const { name } = useCollection();
        const timeFieldOptions = getCollectionFieldsOptions(name, ['string'])?.filter(
          (item) => item.interface == 'select',
        );
        return {
          title: t('Color Field'),
          value: fieldNames.colorField,
          options: timeFieldOptions,
          onChange: (v) => {
            const fieldNames = field.decoratorProps.timeline || {};
            fieldNames['colorField'] = v;
            field.decoratorProps.timeline = fieldNames;
            fieldSchema['x-decorator-props']['timeline'] = fieldNames;
            //   service.refresh();
            runAsync();
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
      name: 'mode',
      Component: SchemaSettingsSelectItem,
      useComponentProps() {
        const t = useT();
        const fieldSchema = useFieldSchema();
        const fieldNames = fieldSchema?.['x-decorator-props']?.['timeline'] || {};
        //   const { service } = useMapBlockContext();
        const { runAsync } = useDataBlockRequest();
        const field = useField();
        const { dn } = useDesignable();

        return {
          title: t('Mode'),
          value: fieldNames.mode,
          options: [
            { label: t('Left'), value: 'left' },
            { label: t('Alternate'), value: 'alternate' },
            { label: t('Right'), value: 'right' },
          ],
          onChange: (v) => {
            const fieldNames = field.decoratorProps.timeline || {};
            fieldNames['mode'] = v;
            field.decoratorProps.timeline = fieldNames;
            fieldSchema['x-decorator-props']['timeline'] = fieldNames;
            //   service.refresh();
            runAsync();
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
      name: 'sort',
      type: 'switch',
      useComponentProps() {
        const t = useT();
        const fieldSchema = useFieldSchema();
        const fieldNames = fieldSchema?.['x-decorator-props']?.['timeline'] || {};
        //   const { service } = useMapBlockContext();
        // const { runAsync } = useDataBlockRequest();
        const field = useField();
        const { dn } = useDesignable();

        return {
          title: t('Sort'),
          value: fieldNames.sort,
          onChange: (v) => {
            const fieldNames = field.decoratorProps.timeline || {};
            fieldNames['sort'] = v;
            field.decoratorProps.timeline = fieldNames;
            fieldSchema['x-decorator-props']['timeline'] = fieldNames;
            //   service.refresh();
            // runAsync();
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
      name: 'dataScope',
      Component: SchemaSettingsDataScope,
      useComponentProps() {
        const { name } = useCollection();
        const fieldSchema = useFieldSchema();
        const { form } = useFormBlockContext();
        const field = useField();
        //   const { service } = useMapBlockContext();
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
            //   const filters = service.params?.[1]?.filters || {};

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
          componentName: `${componentNamePrefix}Timeline`,
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
      type: 'remove',
      name: 'remove',
      componentProps: {
        removeParentsIfNoChildren: true,
        breakRemoveOn: {
          'x-component': 'Grid',
        },
      },
    },
  ],
});
