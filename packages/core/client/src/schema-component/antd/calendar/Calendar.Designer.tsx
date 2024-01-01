import { useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FixedBlockDesignerItem, removeNullCondition, useCompile, useDesignable } from '../..';
import { useCalendarBlockContext, useFormBlockContext } from '../../../block-provider';
import { RecordProvider, useRecord } from '../../../record-provider';
import {
  GeneralSchemaDesigner,
  SchemaSettingsBlockTitleItem,
  SchemaSettingsCascaderItem,
  SchemaSettingsDataScope,
  SchemaSettingsDivider,
  SchemaSettingsRemove,
  SchemaSettingsSelectItem,
  SchemaSettingsSwitchItem,
  SchemaSettingsTemplate,
} from '../../../schema-settings';
import { useSchemaTemplate } from '../../../schema-templates';
import { getCollectionFieldsOptions, useCollectionManagerV2, useCollectionV2 } from '../../../application';

export const CalendarDesigner = () => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { form } = useFormBlockContext();
  const collection = useCollectionV2();
  const cm = useCollectionManagerV2();
  const { service } = useCalendarBlockContext();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const template = useSchemaTemplate();
  const compile = useCompile();
  const record = useRecord();
  const fieldNames = fieldSchema?.['x-decorator-props']?.['fieldNames'] || {};
  const defaultResource = fieldSchema?.['x-decorator-props']?.resource;

  return (
    <RecordProvider parent={record} record={{}}>
      <GeneralSchemaDesigner template={template} title={collection.title || collection.name}>
        <SchemaSettingsBlockTitleItem />
        <SchemaSettingsSelectItem
          title={t('Title field')}
          value={fieldNames.title}
          options={getCollectionFieldsOptions(collection.name, 'string', { collectionManager: cm, compile })}
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
          options={getCollectionFieldsOptions(collection.name, 'date', {
            association: ['o2o', 'obo', 'oho', 'm2o'],
            collectionManager: cm,
            compile,
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
          options={getCollectionFieldsOptions(collection.name, 'date', {
            association: ['o2o', 'obo', 'oho', 'm2o'],
            collectionManager: cm,
            compile,
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
          collectionName={collection.name}
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
