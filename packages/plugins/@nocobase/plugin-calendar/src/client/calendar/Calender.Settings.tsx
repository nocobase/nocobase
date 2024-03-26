import { useField, useFieldSchema } from '@formily/react';
import React from 'react';
import {
  SchemaSettings,
  SchemaSettingsBlockTitleItem,
  SchemaSettingsSelectItem,
  useCollection,
  SchemaSettingsSwitchItem,
  SchemaSettingsDataScope,
  useDesignable,
  FixedBlockDesignerItem,
  SchemaSettingsCascaderItem,
  useFormBlockContext,
  removeNullCondition,
  SchemaSettingsTemplate,
  useCollectionManager_deprecated,
} from '@nocobase/client';
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
      name: 'titleField',
      Component: SchemaSettingsSelectItem,
      useComponentProps() {
        const { t } = useTranslation();
        const fieldSchema = useFieldSchema();
        const fieldNames = fieldSchema?.['x-decorator-props']?.['fieldNames'] || {};
        const { service } = useCalendarBlockContext();
        const { getCollectionFieldsOptions } = useCollectionManager_deprecated();
        const { name, title } = useCollection();

        const field = useField();
        const { dn } = useDesignable();
        return {
          title: t('Title field'),
          value: fieldNames.title,
          options: getCollectionFieldsOptions(name, 'string'),
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
      name: 'showLunar',
      Component: ShowLunarDesignerItem,
    },
    {
      name: 'fixBlock',
      Component: FixedBlockDesignerItem,
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
        return {
          title: t('Start date field'),
          value: fieldNames.start,
          options: getCollectionFieldsOptions(name, 'date', {
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
        return {
          title: t('End date field'),
          value: fieldNames.end,
          options: getCollectionFieldsOptions(name, 'date', {
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
        const { service } = useCalendarBlockContext();
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
            service.run({ ...service?.params?.[0], filter });
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
          componentName: 'Calendar',
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
