import { useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useCalendarBlockContext } from '../schema-initializer/CalendarBlockProvider';
import {
  useFormBlockContext,
  useCollection,
  useCollectionManager,
  useDesignable,
  useSchemaTemplate,
  useRecord,
  RecordProvider,
  GeneralSchemaDesigner,
  FixedBlockDesignerItem,
  removeNullCondition,
  SchemaSettingsBlockTitleItem,
  SchemaSettingsSelectItem,
  SchemaSettingsSwitchItem,
  SchemaSettingsCascaderItem,
  SchemaSettingsDataScope,
  SchemaSettingsDivider,
  SchemaSettingsTemplate,
  SchemaSettingsRemove,
} from '@nocobase/client';
import { useTranslation } from '../../locale';

export const CalendarDesigner = () => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { form } = useFormBlockContext();
  const { name, title } = useCollection();
  const { getCollectionFieldsOptions } = useCollectionManager();
  const { service } = useCalendarBlockContext();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const template = useSchemaTemplate();
  const record = useRecord();
  const fieldNames = fieldSchema?.['x-decorator-props']?.['fieldNames'] || {};
  const defaultResource = fieldSchema?.['x-decorator-props']?.resource;

  return (
    <RecordProvider parent={record} record={{}}>
      <GeneralSchemaDesigner template={template} title={title || name}>
        <SchemaSettingsBlockTitleItem />
        <SchemaSettingsSelectItem
          title={t('Title field')}
          value={fieldNames.title}
          options={getCollectionFieldsOptions(name, 'string')}
          onChange={(title) => {
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
          }}
        />
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
        <FixedBlockDesignerItem />
        <SchemaSettingsCascaderItem
          title={t('Start date field')}
          value={fieldNames.start}
          options={getCollectionFieldsOptions(name, 'date', {
            association: ['o2o', 'obo', 'oho', 'm2o'],
          })}
          onChange={(start) => {
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
          }}
        />
        <SchemaSettingsCascaderItem
          title={t('End date field')}
          value={fieldNames.end}
          options={getCollectionFieldsOptions(name, 'date', {
            association: ['o2o', 'obo', 'oho', 'm2o'],
          })}
          onChange={(end) => {
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
          }}
        />
        <SchemaSettingsDataScope
          collectionName={name}
          defaultFilter={fieldSchema?.['x-decorator-props']?.params?.filter || {}}
          form={form}
          onSubmit={({ filter }) => {
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
          }}
        />
        <SchemaSettingsDivider />
        <SchemaSettingsTemplate componentName={'Calendar'} collectionName={name} resourceName={defaultResource} />
        <SchemaSettingsDivider />
        <SchemaSettingsRemove
          removeParentsIfNoChildren
          breakRemoveOn={{
            'x-component': 'Grid',
          }}
        />
      </GeneralSchemaDesigner>
    </RecordProvider>
  );
};
