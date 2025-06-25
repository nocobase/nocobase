/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useField, useFieldSchema } from '@formily/react';
import {
  SchemaSettings,
  SchemaSettingsBlockHeightItem,
  SchemaSettingsBlockTitleItem,
  SchemaSettingsCascaderItem,
  SchemaSettingsDataScope,
  SchemaSettingsSelectItem,
  SchemaSettingsSwitchItem,
  SchemaSettingsTemplate,
  removeNullCondition,
  useBlockTemplateContext,
  useCollection,
  useCollectionManager_deprecated,
  useDesignable,
  useFormBlockContext,
  usePopupSettings,
  useApp,
  SchemaSettingsLinkageRules,
  LinkageRuleCategory,
  useCollection_deprecated,
} from '@nocobase/client';
import React, { useMemo } from 'react';
import { useTranslation } from '../../locale';
import { useCalendarBlockContext } from '../schema-initializer/CalendarBlockProvider';

export const ShowLunarDesignerItem = () => {
  const field = useField();
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  return (
    <SchemaSettingsSwitchItem
      title={t('Show lunar')}
      checked={field.decoratorProps.showLunar}
      onChange={(v) => {
        field.decoratorProps.showLunar = v;
        fieldSchema['x-decorator-props']['showLunar'] = v;
        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-decorator-props': field.decoratorProps,
          },
        });
        dn.refresh();
      }}
    />
  );
};

export const calendarBlockSettings = new SchemaSettings({
  name: 'blockSettings:calendar',
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
        const { name } = useCollection_deprecated();
        const { t } = useTranslation();
        return {
          collectionName: name,
          title: t('Block Linkage rules'),
          category: LinkageRuleCategory.block,
        };
      },
    },
    {
      name: 'titleField',
      Component: SchemaSettingsSelectItem,
      useComponentProps() {
        const { t } = useTranslation();
        const fieldSchema = useFieldSchema();
        const fieldNames = fieldSchema?.['x-decorator-props']?.['fieldNames'] || {};
        const { service } = useCalendarBlockContext();
        const { getCollectionFieldsOptions } = useCollectionManager_deprecated();
        const { name } = useCollection();
        const app = useApp();
        const plugin = app.pm.get('calendar') as any;
        const { titleFieldInterfaces } = plugin;

        const field = useField();
        const { dn } = useDesignable();
        return {
          title: t('Title field'),
          value: fieldNames.title,
          options: getCollectionFieldsOptions(name, null, Object.keys(titleFieldInterfaces)),
          onChange: (title) => {
            const fieldNames = field.decoratorProps.fieldNames || {};
            fieldNames['title'] = title;
            field.decoratorProps.params = fieldNames;
            fieldSchema['x-decorator-props']['params'] = fieldNames;
            // Select切换option后value未按照预期切换，固增加以下代码
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
      name: 'colorField',
      Component: SchemaSettingsSelectItem,
      useComponentProps() {
        const { t } = useTranslation();
        const fieldSchema = useFieldSchema();
        const fieldNames = fieldSchema?.['x-decorator-props']?.['fieldNames'] || {};
        const { service } = useCalendarBlockContext();
        const { getCollectionFieldsOptions } = useCollectionManager_deprecated();
        const { name } = useCollection();
        const field = useField();
        const { dn } = useDesignable();
        const app = useApp();
        const plugin = app.pm.get('calendar') as any;
        const { colorFieldInterfaces } = plugin;
        const fliedList = getCollectionFieldsOptions(name, null, Object.keys(colorFieldInterfaces));
        const filteredItems = [{ label: t('Not selected'), value: '' }, ...fliedList];

        return {
          title: t('Color field'),
          value: fieldNames.colorFieldName || '',
          options: filteredItems,
          onChange: (colorFieldName: string) => {
            const fieldNames = fieldSchema['x-decorator-props']?.fieldNames || {};
            fieldNames.colorFieldName = colorFieldName;
            field.decoratorProps.fieldNames = fieldNames;
            fieldSchema['x-decorator-props'].fieldNames = fieldNames;
            service.refresh();
            dn.emit('patch', {
              schema: {
                ['x-uid']: fieldSchema['x-uid'],
                'x-decorator-props': fieldSchema['x-decorator-props'],
              },
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'defaultView',
      Component: SchemaSettingsSelectItem,
      useComponentProps() {
        const { t } = useTranslation();
        const fieldSchema = useFieldSchema();
        const field = useField();
        const { dn } = useDesignable();
        return {
          title: t('Default view'),
          value: field['decoratorProps']['defaultView'] || 'month',
          options: [
            { value: 'month', label: t('Month') },
            { value: 'week', label: t('Week') },
            { value: 'day', label: t('Day') },
          ],
          onChange: (v) => {
            field.decoratorProps.defaultView = v;
            fieldSchema['x-decorator-props']['defaultView'] = v;
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
      name: 'eventOpenMode',
      Component: SchemaSettingsSelectItem,
      useComponentProps() {
        const { t } = useTranslation();
        const fieldSchema = useFieldSchema();
        const field = useField();
        const { dn } = useDesignable();
        const { isPopupVisibleControlledByURL } = usePopupSettings();
        const eventSchema = Object.values(fieldSchema['properties'])?.[0]?.['properties']['event'];
        const modeOptions = useMemo(() => {
          if (isPopupVisibleControlledByURL()) {
            return [
              { label: t('Drawer'), value: 'drawer' },
              { label: t('Dialog'), value: 'modal' },
              { label: t('Page'), value: 'page' },
            ];
          }

          return [
            { label: t('Drawer'), value: 'drawer' },
            { label: t('Dialog'), value: 'modal' },
          ];
        }, [t, isPopupVisibleControlledByURL()]);
        return {
          title: t('Event open mode'),
          value: eventSchema['x-component-props']?.['openMode'] || 'drawer',
          options: modeOptions,
          onChange: (v) => {
            if (eventSchema['x-component-props']) {
              eventSchema['x-component-props']['openMode'] = v;
            } else {
              eventSchema['x-component-props'] = {};
              eventSchema['x-component-props']['openMode'] = v;
            }
            dn.emit('patch', {
              schema: {
                ['x-uid']: eventSchema['x-uid'],
                'x-component-props': eventSchema['x-component-props'],
              },
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'quickCreateEvent',
      Component: SchemaSettingsSwitchItem,
      useComponentProps() {
        const { t } = useTranslation();
        const fieldSchema = useFieldSchema();
        const field = useField();
        const { dn } = useDesignable();
        return {
          title: t('Quick create event'),
          checked: field.decoratorProps?.enableQuickCreateEvent ?? true,
          onChange: (v) => {
            field.decoratorProps.enableQuickCreateEvent = v;
            fieldSchema['x-decorator-props']['enableQuickCreateEvent'] = v;
            dn.emit('patch', {
              schema: {
                ['x-uid']: fieldSchema['x-uid'],
                'x-decorator-props': field.decoratorProps,
              },
            });
          },
        };
      },
    },
    {
      name: 'showLunar',
      Component: ShowLunarDesignerItem,
    },
    {
      name: 'startDateField',
      Component: SchemaSettingsCascaderItem,
      useComponentProps() {
        const { getCollectionFieldsOptions } = useCollectionManager_deprecated();
        const { t } = useTranslation();
        const fieldSchema = useFieldSchema();
        const fieldNames = fieldSchema?.['x-decorator-props']?.['fieldNames'] || {};
        const field = useField();
        const { dn } = useDesignable();
        const { service } = useCalendarBlockContext();
        const { name } = useCollection();
        const app = useApp();
        const plugin = app.pm.get('calendar') as any;
        const { dateTimeFieldInterfaces } = plugin;
        return {
          title: t('Start date field'),
          value: fieldNames.start,
          options: getCollectionFieldsOptions(name, null, dateTimeFieldInterfaces, {
            association: ['o2o', 'obo', 'oho', 'm2o'],
          }),
          onChange: (start) => {
            const fieldNames = field.decoratorProps.fieldNames || {};
            fieldNames['start'] = start;
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
      name: 'endDateField',
      Component: SchemaSettingsCascaderItem,
      useComponentProps() {
        const { t } = useTranslation();
        const fieldSchema = useFieldSchema();
        const field = useField();
        const { service } = useCalendarBlockContext();
        const { getCollectionFieldsOptions } = useCollectionManager_deprecated();
        const { dn } = useDesignable();
        const { name } = useCollection();
        const fieldNames = fieldSchema?.['x-decorator-props']?.['fieldNames'] || {};
        const app = useApp();
        const plugin = app.pm.get('calendar') as any;
        const { dateTimeFieldInterfaces } = plugin;
        return {
          title: t('End date field'),
          value: fieldNames.end,
          options: getCollectionFieldsOptions(name, null, dateTimeFieldInterfaces, {
            association: ['o2o', 'obo', 'oho', 'm2o'],
          }),
          onChange: (end) => {
            const fieldNames = field.decoratorProps.fieldNames || {};
            fieldNames['end'] = end;
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
      name: 'dataScope',
      Component: SchemaSettingsDataScope,
      useComponentProps() {
        const { name } = useCollection();
        const fieldSchema = useFieldSchema();
        const { form } = useFormBlockContext();
        const field = useField();
        const { dn } = useDesignable();
        return {
          collectionName: name,
          defaultFilter: fieldSchema?.['x-decorator-props']?.params?.filter || {},
          form: form,
          onSubmit: ({ filter }) => {
            filter = removeNullCondition(filter);
            const params = field.decoratorProps.params || {};
            params.filter = filter;
            field.decoratorProps.params = params;
            fieldSchema['x-decorator-props']['params'] = params;
            dn.emit('patch', {
              schema: {
                ['x-uid']: fieldSchema['x-uid'],
                'x-decorator-props': field.decoratorProps,
              },
            });
          },
        };
      },
    },
    {
      name: 'weekStart',
      Component: SchemaSettingsSelectItem,
      useComponentProps() {
        const { t } = useTranslation();
        const fieldSchema = useFieldSchema();
        const field = useField();
        const { dn } = useDesignable();
        return {
          title: t('Week start day'),
          value: field['decoratorProps']['weekStart'] || '1',
          options: [
            { value: '1', label: t('Monday') },
            { value: '0', label: t('Sunday') },
          ],
          onChange: (v) => {
            field.decoratorProps.weekStart = v;
            fieldSchema['x-decorator-props']['weekStart'] = v;
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
          componentName: `${componentNamePrefix}Calendar`,
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
