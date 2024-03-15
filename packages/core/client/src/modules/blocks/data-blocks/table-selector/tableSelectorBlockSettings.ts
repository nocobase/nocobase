import { ArrayItems } from '@formily/antd-v5';
import { ISchema, useField, useFieldSchema } from '@formily/react';
import { cloneDeep } from 'lodash';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { recursiveParent, useFormBlockContext, useTableSelectorContext } from '../../../../block-provider';
import {
  useCollection_deprecated,
  useCollectionManager_deprecated,
  useSortFields,
} from '../../../../collection-manager';
import { removeNullCondition, useDesignable } from '../../../../schema-component';
import { SchemaSettingsDataScope } from '../../../../schema-settings/SchemaSettingsDataScope';
import { setDataLoadingModeSettingsItem, useDataLoadingMode } from '../details-multi/setDataLoadingModeSettingsItem';

export const tableSelectorBlockSettings = new SchemaSettings({
  name: 'blockSettings:tableSelector',
  items: [
    {
      name: 'SetTheDataScope',
      Component: SchemaSettingsDataScope,
      useComponentProps: () => {
        const { name } = useCollection_deprecated();
        const field = useField();
        const fieldSchema = useFieldSchema();
        const { form } = useFormBlockContext();
        const { service, extraFilter } = useTableSelectorContext();
        const { dn } = useDesignable();
        const dataLoadingMode = useDataLoadingMode();
        const onDataScopeSubmit = useCallback(
          ({ filter }) => {
            filter = removeNullCondition(filter);
            const params = field.decoratorProps.params || {};
            params.filter = filter;
            field.decoratorProps.params = params;
            fieldSchema['x-decorator-props']['params'] = params;
            let serviceFilter = cloneDeep(filter);
            if (extraFilter) {
              if (serviceFilter) {
                serviceFilter = {
                  $and: [extraFilter, serviceFilter],
                };
              } else {
                serviceFilter = extraFilter;
              }
            }

            if (dataLoadingMode === 'auto') {
              service.run({ ...service.params?.[0], filter: serviceFilter, page: 1 });
            }

            dn.emit('patch', {
              schema: {
                ['x-uid']: fieldSchema['x-uid'],
                'x-decorator-props': fieldSchema['x-decorator-props'],
              },
            });
          },
          [field.decoratorProps, fieldSchema, extraFilter, dataLoadingMode, dn, service],
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
      name: 'treeTable',
      type: 'switch',
      useComponentProps: () => {
        const field = useField();
        const fieldSchema = useFieldSchema();
        const { service } = useTableSelectorContext();
        const { t } = useTranslation();
        const { dn } = useDesignable();

        return {
          title: t('Tree table'),
          defaultChecked: true,
          checked: field.decoratorProps.treeTable !== false,
          onChange: (flag) => {
            field.form.clearFormGraph(`${field.address}.*`);
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
        const { getCollectionJoinField } = useCollectionManager_deprecated();
        const fieldSchema = useFieldSchema();
        const collection = useCollection_deprecated();
        const collectionFieldSchema = recursiveParent(fieldSchema, 'CollectionField');
        const collectionField = getCollectionJoinField(collectionFieldSchema?.['x-collection-field']);

        return collection?.tree && collectionField?.target === collectionField?.collectionName;
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
        const { service } = useTableSelectorContext();
        const { t } = useTranslation();
        const { dn } = useDesignable();
        const defaultSort = fieldSchema?.['x-decorator-props']?.params?.sort || [];
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
        const { service } = useTableSelectorContext();
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
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'delete',
      type: 'remove',
      useComponentProps() {
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
