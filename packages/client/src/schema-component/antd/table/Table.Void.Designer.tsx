import { ISchema, useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useCollection, useResourceActionContext } from '../../../collection-manager';
import { useCollectionFilterOptions } from '../../../collection-manager/action-hooks';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';
import { useDesignable } from '../../hooks';

export const TableVoidDesigner = () => {
  const { name, title } = useCollection();
  const field = useField();
  const fieldSchema = useFieldSchema();
  const dataSource = useCollectionFilterOptions(name);
  const ctx = useResourceActionContext();
  const { dn } = useDesignable();
  const defaultFilter = fieldSchema?.['x-decorator-props']?.request?.params?.filter || {};
  return (
    <GeneralSchemaDesigner title={title || name}>
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
        onSubmit={({ filter }) => {
          const params = field.decoratorProps.request.params || {};
          params.filter = filter;
          field.decoratorProps.request.params = params;
          fieldSchema['x-decorator-props']['request']['params'] = params;
          ctx.run({ ...ctx.params?.[0], filter });
          dn.emit('patch', {
            schema: {
              ['x-uid']: fieldSchema['x-uid'],
              'x-decorator-props': fieldSchema['x-decorator-props'],
            },
          });
        }}
      />
      <SchemaSettings.SelectItem
        title={'每页显示'}
        value={field.decoratorProps.request.params?.pageSize || 20}
        options={[
          { label: '10', value: 10 },
          { label: '20', value: 20 },
          { label: '50', value: 50 },
          { label: '100', value: 100 },
          { label: '200', value: 200 },
        ]}
        onChange={(pageSize) => {
          const params = field.decoratorProps.request.params || {};
          params.pageSize = pageSize;
          field.decoratorProps.request.params = params;
          fieldSchema['x-decorator-props']['request']['params'] = params;
          ctx.run({ ...ctx.params?.[0], pageSize });
          dn.emit('patch', {
            schema: {
              ['x-uid']: fieldSchema['x-uid'],
              'x-decorator-props': fieldSchema['x-decorator-props'],
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
