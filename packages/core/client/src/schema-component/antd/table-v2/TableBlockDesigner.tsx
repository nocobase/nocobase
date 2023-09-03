import { ArrayItems } from '@formily/antd-v5';
import { ISchema, useField, useFieldSchema } from '@formily/react';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTableBlockContext } from '../../../block-provider';
import { mergeFilter } from '../../../block-provider/SharedFilterProvider';
import { useCollection, useCollectionManager } from '../../../collection-manager';
import { useCollectionFilterOptions, useSortFields } from '../../../collection-manager/action-hooks';
import { FilterBlockType } from '../../../filter-provider/utils';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';
import { useSchemaTemplate } from '../../../schema-templates';
import { useCompile, useDesignable } from '../../hooks';
import { removeNullCondition } from '../filter';
import { FixedBlockDesignerItem } from '../page';
import { FilterDynamicComponent } from './FilterDynamicComponent';

export const TableBlockDesigner = () => {
  const { name, title, sortable } = useCollection();
  const { getCollectionField, getCollection } = useCollectionManager();
  const field = useField();
  const fieldSchema = useFieldSchema();
  const dataSource = useCollectionFilterOptions(name);
  const sortFields = useSortFields(name);
  const { service } = useTableBlockContext();
  const { t } = useTranslation();
  const { dn } = useDesignable();
  const compile = useCompile();
  const defaultFilter = fieldSchema?.['x-decorator-props']?.params?.filter || {};
  const defaultSort = fieldSchema?.['x-decorator-props']?.params?.sort || [];
  const defaultResource = fieldSchema?.['x-decorator-props']?.resource;
  const supportTemplate = !fieldSchema?.['x-decorator-props']?.disableTemplate;
  const sort = defaultSort?.map((item: string) => {
    return item?.startsWith('-')
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
  const collection = useCollection();
  const { dragSort, resource } = field.decoratorProps;
  const collectionField = getCollectionField(resource);
  const treeCollection = resource?.includes('.') ? getCollection(collectionField?.target)?.tree : !!collection?.tree;
  const dataScopeSchema = useMemo(() => {
    return {
      type: 'object',
      title: t('Set the data scope'),
      properties: {
        filter: {
          default: defaultFilter,
          // title: '数据范围',
          enum: compile(dataSource),
          'x-component': 'Filter',
          'x-component-props': {
            dynamicComponent: (props) => FilterDynamicComponent({ ...props }),
          },
        },
      },
    } as ISchema;
  }, [dataSource, defaultFilter]);
  const onDataScopeSubmit = useCallback(
    ({ filter }) => {
      filter = removeNullCondition(filter);
      const params = field.decoratorProps.params || {};
      params.filter = filter;
      field.decoratorProps.params = params;
      fieldSchema['x-decorator-props']['params'] = params;
      const filters = service.params?.[1]?.filters || {};
      service.run(
        { ...service.params?.[0], filter: mergeFilter([...Object.values(filters), filter]), page: 1 },
        { filters },
      );
      dn.emit('patch', {
        schema: {
          ['x-uid']: fieldSchema['x-uid'],
          'x-decorator-props': fieldSchema['x-decorator-props'],
        },
      });
    },
    [field],
  );
  return (
    <GeneralSchemaDesigner template={template} title={title || name}>
      <SchemaSettings.BlockTitleItem />
      {collection?.tree && collectionField?.collectionName === collectionField?.target && (
        <SchemaSettings.SwitchItem
          title={t('Tree table')}
          defaultChecked={true}
          checked={treeCollection ? field.decoratorProps.treeTable !== false : false}
          onChange={(flag) => {
            field.decoratorProps.treeTable = flag;
            fieldSchema['x-decorator-props'].treeTable = flag;
            const params = {
              ...service.params?.[0],
              tree: flag ? true : null,
            };
            dn.emit('patch', {
              schema: fieldSchema,
            });
            dn.refresh();
            service.run(params);
          }}
        />
      )}
      {sortable && (
        <SchemaSettings.SwitchItem
          title={t('Enable drag and drop sorting')}
          checked={field.decoratorProps.dragSort}
          onChange={(dragSort) => {
            field.decoratorProps.dragSort = dragSort;
            fieldSchema['x-decorator-props'].dragSort = dragSort;
            service.run({ ...service.params?.[0], sort: 'sort' });
            dn.emit('patch', {
              schema: {
                ['x-uid']: fieldSchema['x-uid'],
                'x-decorator-props': fieldSchema['x-decorator-props'],
              },
            });
          }}
        />
      )}
      <FixedBlockDesignerItem />
      <SchemaSettings.ModalItem title={t('Set the data scope')} schema={dataScopeSchema} onSubmit={onDataScopeSubmit} />
      {!dragSort && (
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
                            required: true,
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
            const params = field.decoratorProps.params || {};
            params.sort = sortArr;
            field.decoratorProps.params = params;
            fieldSchema['x-decorator-props']['params'] = params;
            dn.emit('patch', {
              schema: {
                ['x-uid']: fieldSchema['x-uid'],
                'x-decorator-props': fieldSchema['x-decorator-props'],
              },
            });
            service.run({ ...service.params?.[0], sort: sortArr });
          }}
        />
      )}
      <SchemaSettings.SelectItem
        title={t('Records per page')}
        value={field.decoratorProps?.params?.pageSize || 20}
        options={[
          { label: '10', value: 10 },
          { label: '20', value: 20 },
          { label: '50', value: 50 },
          { label: '100', value: 100 },
          { label: '200', value: 200 },
        ]}
        onChange={(pageSize) => {
          const params = field.decoratorProps.params || {};
          params.pageSize = pageSize;
          field.decoratorProps.params = params;
          fieldSchema['x-decorator-props']['params'] = params;
          service.run({ ...service.params?.[0], pageSize, page: 1 });
          dn.emit('patch', {
            schema: {
              ['x-uid']: fieldSchema['x-uid'],
              'x-decorator-props': fieldSchema['x-decorator-props'],
            },
          });
        }}
      />
      <SchemaSettings.ConnectDataBlocks type={FilterBlockType.TABLE} emptyDescription={t('No blocks to connect')} />
      {supportTemplate && <SchemaSettings.Divider />}
      {supportTemplate && (
        <SchemaSettings.Template componentName={'Table'} collectionName={name} resourceName={defaultResource} />
      )}
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
