import { ISchema } from '@formily/json-schema';
import { useField, useFieldSchema } from '@formily/react';
import { useAPIClient } from '../../../../api-client';
import { useTableBlockContext, useFormBlockContext } from '../../../../block-provider';
import {
  useCollectionManager_deprecated,
  useCollection_deprecated,
  useSortFields,
} from '../../../../collection-manager';
import { mergeFilter, FilterBlockType } from '../../../../filter-provider';
import { useDesignable, removeNullCondition } from '../../../../schema-component';
import {
  SchemaSettingsBlockTitleItem,
  SchemaSettingsSortField,
  SchemaSettingsDataScope,
  SchemaSettingsConnectDataBlocks,
  SchemaSettingsTemplate,
} from '../../../../schema-settings';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrayItems } from '@formily/antd-v5';
import { FixedBlockDesignerItem } from '../../../../schema-component/antd/page/FixedBlockDesignerItem';
import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { setDataLoadingModeSettingsItem, useDataLoadingMode } from '../details-multi/setDataLoadingModeSettingsItem';

export const tableBlockSettings = new SchemaSettings({
  name: 'blockSettings:table',
  items: [
    {
      name: 'editBlockTitle',
      Component: SchemaSettingsBlockTitleItem,
    },
    {
      name: 'treeTable',
      type: 'switch',
      useComponentProps: () => {
        const { getCollectionField, getCollection } = useCollectionManager_deprecated();
        const field = useField();
        const fieldSchema = useFieldSchema();
        const { service } = useTableBlockContext();
        const { t } = useTranslation();
        const { dn } = useDesignable();
        const collection = useCollection_deprecated();
        const { resource } = field.decoratorProps;
        const collectionField = resource && getCollectionField(resource);
        const treeCollection = resource?.includes('.')
          ? getCollection(collectionField?.target)?.tree
          : !!collection?.tree;

        return {
          title: t('Tree table'),
          defaultChecked: true,
          checked: treeCollection ? field.decoratorProps.treeTable !== false : false,
          onChange: (flag) => {
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
          },
        };
      },
      useVisible: () => {
        const { getCollectionField } = useCollectionManager_deprecated();
        const field = useField();
        const collection = useCollection_deprecated();
        const { resource } = field.decoratorProps;
        const collectionField = resource && getCollectionField(resource);

        return collection?.tree && collectionField?.collectionName === collectionField?.target;
      },
    },
    {
      name: 'enableDragAndDropSorting',
      type: 'switch',
      useComponentProps: () => {
        const { getCollectionField } = useCollectionManager_deprecated();
        const field = useField();
        const fieldSchema = useFieldSchema();
        const { service } = useTableBlockContext();
        const { t } = useTranslation();
        const { dn } = useDesignable();
        const { resource } = field.decoratorProps;
        const collectionField = resource && getCollectionField(resource);
        const api = useAPIClient();

        return {
          title: t('Enable drag and drop sorting'),
          checked: field.decoratorProps.dragSort,
          onChange: async (dragSort) => {
            if (dragSort && collectionField) {
              const { data } = await api.resource('collections.fields', collectionField.collectionName).update({
                filterByTk: collectionField.name,
                values: {
                  sortable: true,
                },
              });
              const sortBy = data?.data?.[0]?.sortBy;
              fieldSchema['x-decorator-props'].dragSortBy = sortBy;
            }
            field.decoratorProps.dragSort = dragSort;
            fieldSchema['x-decorator-props'].dragSort = dragSort;
            service.run({ ...service.params?.[0], sort: fieldSchema['x-decorator-props'].dragSortBy });
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
      name: 'SortField',
      Component: SchemaSettingsSortField,
      useVisible() {
        const field = useField();
        return field.decoratorProps.dragSort;
      },
    },
    {
      name: 'FixBlock',
      Component: FixedBlockDesignerItem,
    },
    {
      name: 'SetTheDataScope',
      Component: SchemaSettingsDataScope,
      useComponentProps: () => {
        const { name } = useCollection_deprecated();
        const field = useField();
        const fieldSchema = useFieldSchema();
        const { form } = useFormBlockContext();
        const { service } = useTableBlockContext();
        const { dn } = useDesignable();
        const dataLoadingMode = useDataLoadingMode();
        const onDataScopeSubmit = useCallback(
          ({ filter }) => {
            filter = removeNullCondition(filter);
            const params = field.decoratorProps.params || {};
            params.filter = filter;
            field.decoratorProps.params = params;
            fieldSchema['x-decorator-props']['params'] = params;
            const filters = service.params?.[1]?.filters || {};

            if (dataLoadingMode === 'auto') {
              service.run(
                { ...service.params?.[0], filter: mergeFilter([...Object.values(filters), filter]), page: 1 },
                { filters },
              );
            }

            dn.emit('patch', {
              schema: {
                ['x-uid']: fieldSchema['x-uid'],
                'x-decorator-props': fieldSchema['x-decorator-props'],
              },
            });
          },
          [dn, field.decoratorProps, fieldSchema, service],
        );

        return {
          collectionName: name,
          defaultFilter: fieldSchema?.['x-decorator-props']?.params?.filter || {},
          form: form,
          onSubmit: onDataScopeSubmit,
        };
      },
    },
    {
      name: 'SetDefaultSortingRules',
      type: 'modal',
      useComponentProps() {
        const { name } = useCollection_deprecated();
        const field = useField();
        const fieldSchema = useFieldSchema();
        const sortFields = useSortFields(name);
        const { service } = useTableBlockContext();
        const { t } = useTranslation();
        const { dn } = useDesignable();
        const defaultSort = fieldSchema?.['x-decorator-props']?.params?.sort || [];
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

        return {
          title: t('Set default sorting rules'),
          components: { ArrayItems },
          schema: {
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
          } as ISchema,
          onSubmit: ({ sort }) => {
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
          },
        };
      },
      useVisible() {
        const field = useField();
        const { dragSort } = field.decoratorProps;

        return !dragSort;
      },
    },
    setDataLoadingModeSettingsItem,
    {
      name: 'RecordsPerPage',
      type: 'select',
      useComponentProps() {
        const field = useField();
        const fieldSchema = useFieldSchema();
        const { service } = useTableBlockContext();
        const { t } = useTranslation();
        const { dn } = useDesignable();

        return {
          title: t('Records per page'),
          value: field.decoratorProps?.params?.pageSize || 20,
          options: [
            { label: '10', value: 10 },
            { label: '20', value: 20 },
            { label: '50', value: 50 },
            { label: '100', value: 100 },
            { label: '200', value: 200 },
          ],
          onChange: (pageSize) => {
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
          },
        };
      },
    },
    {
      name: 'ConnectDataBlocks',
      Component: SchemaSettingsConnectDataBlocks,
      useComponentProps() {
        const { t } = useTranslation();
        return {
          type: FilterBlockType.TABLE,
          emptyDescription: t('No blocks to connect'),
        };
      },
    },
    {
      name: 'divider',
      type: 'divider',
      useVisible: () => {
        const fieldSchema = useFieldSchema();
        const supportTemplate = !fieldSchema?.['x-decorator-props']?.disableTemplate;
        return supportTemplate;
      },
    },
    {
      name: 'ConvertReferenceToDuplicate',
      Component: SchemaSettingsTemplate,
      useComponentProps() {
        const { name } = useCollection_deprecated();
        const fieldSchema = useFieldSchema();
        const defaultResource =
          fieldSchema?.['x-decorator-props']?.resource || fieldSchema?.['x-decorator-props']?.association;
        return {
          componentName: 'Table',
          collectionName: name,
          resourceName: defaultResource,
        };
      },
      useVisible: () => {
        const fieldSchema = useFieldSchema();
        const supportTemplate = !fieldSchema?.['x-decorator-props']?.disableTemplate;
        return supportTemplate;
      },
    },
    {
      name: 'divider2',
      type: 'divider',
    },
    {
      name: 'delete',
      type: 'remove',
      useComponentProps: () => {
        return {
          removeParentsIfNoChildren: true,
          breakRemoveOn: {
            'x-component': 'Grid',
          },
        };
      },
    },
  ],
});
