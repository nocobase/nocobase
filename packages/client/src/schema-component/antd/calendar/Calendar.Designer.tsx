import { ISchema, useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useCompile, useDesignable } from '../..';
import { useCollection, useResourceActionContext } from '../../../collection-manager';
import { useCollectionFilterOptions } from '../../../collection-manager/action-hooks';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';

export const CalendarDesigner = () => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { name, title, fields } = useCollection();
  const dataSource = useCollectionFilterOptions(name);
  const ctx = useResourceActionContext();
  const { dn } = useDesignable();
  const compile = useCompile();
  const defaultFilter = fieldSchema?.['x-decorator-props']?.request?.params?.filter || {};
  const options = fields?.map((field) => {
    return {
      value: field.name,
      label: compile(field?.uiSchema?.title),
    };
  });
  const calendarSchema = fieldSchema.properties.calendar;
  const fieldNames = calendarSchema?.['x-component-props']?.['fieldNames'] || {};
  return (
    <GeneralSchemaDesigner title={title || name}>
      <SchemaSettings.SelectItem
        title={'标题字段'}
        value={fieldNames.title}
        options={options}
        onChange={(title) => {
          field.query(field.address.concat('calendar')).take((f) => {
            f.componentProps.fieldNames = {
              ...f.componentProps.fieldNames,
              title,
            };
            calendarSchema['x-component-props']['fieldNames'] = f.componentProps.fieldNames;
            dn.emit('patch', {
              schema: {
                ['x-uid']: calendarSchema['x-uid'],
                'x-component-props': calendarSchema['x-component-props'],
              },
            });
            dn.refresh();
            ctx.refresh();
          });
        }}
      />
      <SchemaSettings.SelectItem
        title={'开始日期字段'}
        value={fieldNames.start}
        options={options}
        onChange={(start) => {
          field.query(field.address.concat('calendar')).take((f) => {
            f.componentProps.fieldNames = {
              ...f.componentProps.fieldNames,
              start,
            };
            calendarSchema['x-component-props']['fieldNames'] = f.componentProps.fieldNames;
            dn.emit('patch', {
              schema: {
                ['x-uid']: calendarSchema['x-uid'],
                'x-component-props': calendarSchema['x-component-props'],
              },
            });
            dn.refresh();
            ctx.refresh();
          });
        }}
      />
      <SchemaSettings.SelectItem
        title={'结束日期字段'}
        value={fieldNames.end}
        options={options}
        onChange={(end) => {
          field.query(field.address.concat('calendar')).take((f) => {
            f.componentProps.fieldNames = {
              ...f.componentProps.fieldNames,
              end,
            };
            calendarSchema['x-component-props']['fieldNames'] = f.componentProps.fieldNames;
            dn.emit('patch', {
              schema: {
                ['x-uid']: calendarSchema['x-uid'],
                'x-component-props': calendarSchema['x-component-props'],
              },
            });
            dn.refresh();
            ctx.refresh();
          });
        }}
      />
      <SchemaSettings.ModalItem
        title={'设置数据范围'}
        schema={
          {
            type: 'object',
            title: '设置数据范围',
            properties: {
              filter: {
                default: defaultFilter,
                title: '数据范围',
                enum: dataSource,
                'x-component': 'Filter',
                'x-component-props': {},
              },
            },
          } as ISchema
        }
        initialValues={
          {
            // title: field.title,
            // icon: field.componentProps.icon,
          }
        }
        onSubmit={({ filter }) => {
          const params = field.decoratorProps.request.params || {};
          params.filter = filter;
          field.decoratorProps.request.params = params;
          fieldSchema['x-decorator-props']['request']['params'] = params;
          ctx.run({ filter });
          dn.emit('patch', {
            schema: {
              ['x-uid']: fieldSchema['x-uid'],
              'x-decorator-props': field.decoratorProps,
            },
          });
        }}
      />
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
