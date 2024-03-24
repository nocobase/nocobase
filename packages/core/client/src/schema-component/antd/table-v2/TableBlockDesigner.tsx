import { ArrayItems } from '@formily/antd-v5';
import { ISchema, useField, useFieldSchema } from '@formily/react';
import { Field } from '@formily/core';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../../../api-client';
import { useFormBlockContext, useTableBlockContext } from '../../../block-provider';
import { useCollectionManager_deprecated, useCollection_deprecated } from '../../../collection-manager';
import { useSortFields } from '../../../collection-manager/action-hooks';
import { FilterBlockType, mergeFilter } from '../../../filter-provider/utils';
import { useRecord } from '../../../record-provider';
import {
  GeneralSchemaDesigner,
  SchemaSettingsBlockTitleItem,
  SchemaSettingsConnectDataBlocks,
  SchemaSettingsDivider,
  SchemaSettingsModalItem,
  SchemaSettingsRemove,
  SchemaSettingsSelectItem,
  SchemaSettingsSwitchItem,
  SchemaSettingsTemplate,
} from '../../../schema-settings';
import { useSchemaTemplate } from '../../../schema-templates';
import { useDesignable } from '../../hooks';
import { removeNullCondition } from '../filter';
import { useCompile } from '../../';
import { SchemaSettingsDataScope } from '../../../schema-settings/SchemaSettingsDataScope';
import { FixedBlockDesignerItem } from '../page/FixedBlockDesignerItem';
import { SetDataLoadingMode } from '../../../modules/blocks/data-blocks/details-multi/setDataLoadingModeSettingsItem';

export const EditSortField = () => {
  const { fields } = useCollection_deprecated();
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const { dn } = useDesignable();
  const compile = useCompile();
  const { service } = useTableBlockContext();

  const options = fields
    .filter((field) => !field?.target && field.interface === 'sort')
    .map((field) => ({
      value: field?.name,
      label: compile(field?.uiSchema?.title) || field?.name,
    }));

  return (
    <SchemaSettingsSelectItem
      key="sort-field"
      title={t('Drag and drop sorting field')}
      options={options}
      value={field.decoratorProps.dragSortBy}
      onChange={(dragSortBy) => {
        fieldSchema['x-decorator-props'].dragSortBy = dragSortBy;
        service.run({ ...service.params?.[0], sort: dragSortBy });
        field.decoratorProps.dragSortBy = dragSortBy;
        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-decorator-props': fieldSchema['x-decorator-props'],
          },
        });
        dn.refresh();
      }}
    />
  );
};

export const TableBlockDesigner = () => {
  const { name, title } = useCollection_deprecated();
  const { getCollectionField, getCollection } = useCollectionManager_deprecated();
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { form } = useFormBlockContext();
  const sortFields = useSortFields(name);
  const { service } = useTableBlockContext();
  const { t } = useTranslation();
  const { dn } = useDesignable();

  const defaultSort = fieldSchema?.['x-decorator-props']?.params?.sort || [];
  const defaultResource =
    fieldSchema?.['x-decorator-props']?.resource || fieldSchema?.['x-decorator-props']?.association;
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
  const collection = useCollection_deprecated();
  const { dragSort, resource } = field.decoratorProps;
  const collectionField = resource && getCollectionField(resource);
  const treeCollection = resource?.includes('.') ? getCollection(collectionField?.target)?.tree : !!collection?.tree;
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
    [dn, field.decoratorProps, fieldSchema, service],
  );
  const api = useAPIClient();
  return (
    <GeneralSchemaDesigner template={template} title={title || name}>
      <SchemaSettingsBlockTitleItem />
      {collection?.tree && collectionField?.collectionName === collectionField?.target && (
        <SchemaSettingsSwitchItem
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
      <SchemaSettingsSwitchItem
        title={t('Enable drag and drop sorting')}
        checked={field.decoratorProps.dragSort}
        onChange={async (dragSort) => {
          if (dragSort && collectionField) {
            const { data } = await api.resource('collections.fields', collectionField.collectionName).update({
              filterByTk: collectionField.name,
              values: {
                sortable: true,
              },
            });
            // const sortBy = data?.data?.[0]?.sortBy;
            // fieldSchema['x-decorator-props'].dragSortBy = sortBy;
          }
          field.decoratorProps.dragSort = dragSort;
          fieldSchema['x-decorator-props'].dragSort = dragSort;
          // service.run({ ...service.params?.[0], sort: fieldSchema['x-decorator-props'].dragSortBy });
          dn.emit('patch', {
            schema: {
              ['x-uid']: fieldSchema['x-uid'],
              'x-decorator-props': fieldSchema['x-decorator-props'],
            },
          });
        }}
      />
      {field.decoratorProps.dragSort && <EditSortField />}
      <FixedBlockDesignerItem />
      <SchemaSettingsDataScope
        collectionName={name}
        defaultFilter={fieldSchema?.['x-decorator-props']?.params?.filter || {}}
        form={form}
        onSubmit={onDataScopeSubmit}
      />
      {!dragSort && (
        <SchemaSettingsModalItem
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
      <SetDataLoadingMode />
      <SchemaSettingsSelectItem
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
      <SchemaSettingsConnectDataBlocks type={FilterBlockType.TABLE} emptyDescription={t('No blocks to connect')} />
      {supportTemplate && <SchemaSettingsDivider />}
      {supportTemplate && (
        <SchemaSettingsTemplate componentName={'Table'} collectionName={name} resourceName={defaultResource} />
      )}
      <SchemaSettingsDivider />
      <SchemaSettingsRemove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};
