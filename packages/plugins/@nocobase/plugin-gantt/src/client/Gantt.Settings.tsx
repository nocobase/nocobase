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
  SchemaSettingsBlockTitleItem,
  SchemaSettingsDataScope,
  SchemaSettingsSelectItem,
  SchemaSettingsTemplate,
  removeNullCondition,
  setDataLoadingModeSettingsItem,
  useBlockTemplateContext,
  useCollection,
  useCollection_deprecated,
  useCompile,
  useDesignable,
  useFormBlockContext,
  SchemaSettingsLinkageRules,
  LinkageRuleCategory,
} from '@nocobase/client';
import { useTranslation } from 'react-i18next';
import { useGanttBlockContext } from './GanttBlockProvider';
import { useGanttTranslation, useOptions } from './utils';

/**
 * @deprecated
 * 用于兼容旧版 schema
 */
export const oldGanttSettings = new SchemaSettings({
  name: 'GanttBlockSettings',
  items: [
    {
      name: 'title',
      Component: SchemaSettingsBlockTitleItem,
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
        const { t } = useGanttTranslation();
        const fieldSchema = useFieldSchema();
        const fieldNames = fieldSchema?.['x-decorator-props']?.['fieldNames'] || {};
        const { service } = useGanttBlockContext();
        const field = useField();
        const { dn } = useDesignable();
        return {
          title: t('Title field'),
          value: fieldNames.title,
          options: useOptions('string'),
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
      name: 'timeScale',
      Component: SchemaSettingsSelectItem,
      useComponentProps() {
        const { t } = useGanttTranslation();
        const fieldSchema = useFieldSchema();
        const fieldNames = fieldSchema?.['x-decorator-props']?.['fieldNames'] || {};
        const field = useField();
        const { service } = useGanttBlockContext();
        const { dn } = useDesignable();
        const compile = useCompile();
        return {
          title: t('Time scale'),
          value: fieldNames.range || 'day',
          options: [
            { label: compile('{{t("Hour")}}'), value: 'hour', color: 'orange' },
            { label: compile('{{t("Quarter of day")}}'), value: 'quarterDay', color: 'default' },
            { label: compile('{{t("Half of day")}}'), value: 'halfDay', color: 'blue' },
            { label: compile('{{t("Day")}}'), value: 'day', color: 'yellow' },
            { label: compile('{{t("Week")}}'), value: 'week', color: 'pule' },
            { label: compile('{{t("Month")}}'), value: 'month', color: 'green' },
            { label: compile('{{t("QuarterYear")}}'), value: 'quarterYear', color: 'red' },
            { label: compile('{{t("Year")}}'), value: 'year', color: 'green' },
          ],
          onChange: (range) => {
            const fieldNames = field.decoratorProps.fieldNames || {};
            fieldNames['range'] = range;
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
      name: 'startDateField',
      Component: SchemaSettingsSelectItem,
      useComponentProps() {
        const { t } = useGanttTranslation();
        const fieldSchema = useFieldSchema();
        const fieldNames = fieldSchema?.['x-decorator-props']?.['fieldNames'] || {};
        const field = useField();
        const { dn } = useDesignable();
        const { service } = useGanttBlockContext();
        return {
          title: t('Start date field'),
          value: fieldNames.start,
          options: useOptions('date'),
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
      Component: SchemaSettingsSelectItem,
      useComponentProps() {
        const { t } = useGanttTranslation();
        const fieldSchema = useFieldSchema();
        const field = useField();
        const { service } = useGanttBlockContext();
        const { dn } = useDesignable();
        const fieldNames = fieldSchema?.['x-decorator-props']?.['fieldNames'] || {};
        return {
          title: t('End date field'),
          value: fieldNames.end,
          options: useOptions('date'),
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
      name: 'processField',
      Component: SchemaSettingsSelectItem,
      useComponentProps() {
        const { t } = useGanttTranslation();
        const fieldSchema = useFieldSchema();
        const fieldNames = fieldSchema?.['x-decorator-props']?.['fieldNames'] || {};
        const { service } = useGanttBlockContext();
        const { dn } = useDesignable();
        const field = useField();

        return {
          title: t('Progress field'),
          value: fieldNames.progress,
          options: useOptions('float'),
          onChange: (progress) => {
            const fieldNames = field.decoratorProps.fieldNames || {};
            fieldNames['progress'] = progress;
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
        const { name } = useCollection_deprecated();
        const fieldSchema = useFieldSchema();
        const { form } = useFormBlockContext();
        const field = useField();
        const { dn } = useDesignable();
        return {
          collectionName: name,
          defaultFilter: fieldSchema?.['x-decorator-props']?.params?.filter || {},
          form,
          onSubmit: ({ filter }) => {
            filter = removeNullCondition(filter);
            const params = field.decoratorProps.params || {};
            params.filter = filter;
            field.decoratorProps.params = params;
            fieldSchema['x-decorator-props']['params'] = params;

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
        const { name } = useCollection_deprecated();
        const { componentNamePrefix } = useBlockTemplateContext();
        return {
          componentName: `${componentNamePrefix}Gantt`,
          collectionName: name,
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

export const ganttSettings = new SchemaSettings({
  name: 'blockSettings:gantt',
  items: [
    {
      name: 'title',
      Component: SchemaSettingsBlockTitleItem,
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
        const { t } = useGanttTranslation();
        const fieldSchema = useFieldSchema();
        const fieldNames = fieldSchema?.['x-decorator-props']?.['fieldNames'] || {};
        const { service } = useGanttBlockContext();
        const field = useField();
        const { dn } = useDesignable();
        return {
          title: t('Title field'),
          value: fieldNames.title,
          options: useOptions('string'),
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
      name: 'timeScale',
      Component: SchemaSettingsSelectItem,
      useComponentProps() {
        const { t } = useGanttTranslation();
        const fieldSchema = useFieldSchema();
        const fieldNames = fieldSchema?.['x-decorator-props']?.['fieldNames'] || {};
        const field = useField();
        const { service } = useGanttBlockContext();
        const { dn } = useDesignable();
        const compile = useCompile();
        return {
          title: t('Time scale'),
          value: fieldNames.range || 'day',
          options: [
            { label: compile('{{t("Hour")}}'), value: 'hour', color: 'orange' },
            { label: compile('{{t("Quarter of day")}}'), value: 'quarterDay', color: 'default' },
            { label: compile('{{t("Half of day")}}'), value: 'halfDay', color: 'blue' },
            { label: compile('{{t("Day")}}'), value: 'day', color: 'yellow' },
            { label: compile('{{t("Week")}}'), value: 'week', color: 'pule' },
            { label: compile('{{t("Month")}}'), value: 'month', color: 'green' },
            { label: compile('{{t("QuarterYear")}}'), value: 'quarterYear', color: 'red' },
            { label: compile('{{t("Year")}}'), value: 'year', color: 'green' },
          ],
          onChange: (range) => {
            const fieldNames = field.decoratorProps.fieldNames || {};
            fieldNames['range'] = range;
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
      name: 'startDateField',
      Component: SchemaSettingsSelectItem,
      useComponentProps() {
        const { t } = useGanttTranslation();
        const fieldSchema = useFieldSchema();
        const fieldNames = fieldSchema?.['x-decorator-props']?.['fieldNames'] || {};
        const field = useField();
        const { dn } = useDesignable();
        const { service } = useGanttBlockContext();
        return {
          title: t('Start date field'),
          value: fieldNames.start,
          options: useOptions(['date', 'datetime', 'dateOnly', 'datetimeNoTz']),
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
    setDataLoadingModeSettingsItem,
    {
      name: 'endDateField',
      Component: SchemaSettingsSelectItem,
      useComponentProps() {
        const { t } = useGanttTranslation();
        const fieldSchema = useFieldSchema();
        const field = useField();
        const { service } = useGanttBlockContext();
        const { dn } = useDesignable();
        const fieldNames = fieldSchema?.['x-decorator-props']?.['fieldNames'] || {};
        return {
          title: t('End date field'),
          value: fieldNames.end,
          options: useOptions(['date', 'datetime', 'dateOnly', 'datetimeNoTz']),
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
      name: 'processField',
      Component: SchemaSettingsSelectItem,
      useComponentProps() {
        const { t } = useGanttTranslation();
        const fieldSchema = useFieldSchema();
        const fieldNames = fieldSchema?.['x-decorator-props']?.['fieldNames'] || {};
        const { service } = useGanttBlockContext();
        const { dn } = useDesignable();
        const field = useField();

        return {
          title: t('Progress field'),
          value: fieldNames.progress,
          options: useOptions('float'),
          onChange: (progress) => {
            const fieldNames = field.decoratorProps.fieldNames || {};
            fieldNames['progress'] = progress;
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
          form,
          onSubmit: ({ filter }) => {
            filter = removeNullCondition(filter);
            const params = field.decoratorProps.params || {};
            params.filter = filter;
            field.decoratorProps.params = params;
            fieldSchema['x-decorator-props']['params'] = params;

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
        const { componentNamePrefix } = useBlockTemplateContext();
        return {
          componentName: `${componentNamePrefix}Gantt`,
          collectionName: name,
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
