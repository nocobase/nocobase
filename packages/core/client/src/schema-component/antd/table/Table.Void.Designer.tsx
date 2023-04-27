import { ArrayItems } from '@formily/antd';
import { ISchema, useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCollection, useResourceActionContext } from '../../../collection-manager';
import { useCollectionFilterOptions, useSortFields } from '../../../collection-manager/action-hooks';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';
import { useSchemaTemplate } from '../../../schema-templates';
import { useDesignable } from '../../hooks';

export const TableVoidDesigner = () => {
  const { name, title } = useCollection();
  const field = useField();
  const fieldSchema = useFieldSchema();
  const dataSource = useCollectionFilterOptions(name);
  const sortFields = useSortFields(name);
  const ctx = useResourceActionContext();
  const { t } = useTranslation();
  const { dn } = useDesignable();
  const defaultFilter = fieldSchema?.['x-decorator-props']?.request?.params?.filter || {};
  const defaultSort = fieldSchema?.['x-decorator-props']?.request?.params?.sort || [];
  const sort = defaultSort?.map((item: string) => {
    return item.startsWith('-')
      ? {
          field: item.substring(1),
          direction: 'desc',
        }
      : {
          field: item,
          direction: 'asc',
        };
  });
  const template = useSchemaTemplate();
  return (
    <GeneralSchemaDesigner template={template} title={title || name}>
      <SchemaSettings.SwitchItem
        title={t('Enable drag and drop sorting')}
        checked={field.decoratorProps.dragSort}
        onChange={(dragSort) => {
          field.decoratorProps.dragSort = dragSort;
          fieldSchema['x-decorator-props'].dragSort = dragSort;
          ctx.run({ ...ctx.params?.[0], sort: 'sort' });
          dn.emit('patch', {
            schema: {
              ['x-uid']: fieldSchema['x-uid'],
              'x-decorator-props': fieldSchema['x-decorator-props'],
            },
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
      <SchemaSettings.ModalItem
        title={t('Set default sorting rules')}
        components={{ ArrayItems }}
        schema={
          {
            type: 'object',
            title: t('Set default sorting rules'),
            properties: {
              sort: {
                type: 'array',
                default: sort,
                'x-component': 'ArrayItems',
                'x-decorator': 'FormItem',
                items: {
                  type: 'object',
                  properties: {
                    space: {
                      type: 'void',
                      'x-component': 'Space',
                      properties: {
                        sort: {
                          type: 'void',
                          'x-decorator': 'FormItem',
                          'x-component': 'ArrayItems.SortHandle',
                        },
                        field: {
                          type: 'string',
                          enum: sortFields,
                          'x-decorator': 'FormItem',
                          'x-component': 'Select',
                          'x-component-props': {
                            style: {
                              width: 260,
                            },
                          },
                        },
                        direction: {
                          type: 'string',
                          'x-decorator': 'FormItem',
                          'x-component': 'Radio.Group',
                          'x-component-props': {
                            optionType: 'button',
                          },
                          enum: [
                            {
                              label: t('ASC'),
                              value: 'asc',
                            },
                            {
                              label: t('DESC'),
                              value: 'desc',
                            },
                          ],
                        },
                        remove: {
                          type: 'void',
                          'x-decorator': 'FormItem',
                          'x-component': 'ArrayItems.Remove',
                        },
                      },
                    },
                  },
                },
                properties: {
                  add: {
                    type: 'void',
                    title: t('Add sort field'),
                    'x-component': 'ArrayItems.Addition',
                  },
                },
              },
            },
          } as ISchema
        }
        onSubmit={({ sort }) => {
          const sortArr = sort.map((item) => {
            return item.direction === 'desc' ? `-${item.field}` : item.field;
          });
          const params = field.decoratorProps.request.params || {};
          params.sort = sortArr;
          field.decoratorProps.request.params = params;
          fieldSchema['x-decorator-props']['request']['params'] = params;
          dn.emit('patch', {
            schema: {
              ['x-uid']: fieldSchema['x-uid'],
              'x-decorator-props': fieldSchema['x-decorator-props'],
            },
          });
          ctx.run({ ...ctx.params?.[0], sort: sortArr });
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
      <SchemaSettings.Template componentName={'Table'} collectionName={name} />
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
