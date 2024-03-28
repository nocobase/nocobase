import { ArrayItems } from '@formily/antd-v5';
import { ISchema, useField, useFieldSchema } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { useFormBlockContext } from '../../../../block-provider';
import { useDetailsBlockContext } from '../../../../block-provider/DetailsBlockProvider';
import { useCollection_deprecated, useSortFields } from '../../../../collection-manager';
import { removeNullCondition, useDesignable } from '../../../../schema-component';
import { SchemaSettingsBlockTitleItem, SchemaSettingsTemplate } from '../../../../schema-settings';
import { SchemaSettingsDataScope } from '../../../../schema-settings/SchemaSettingsDataScope';
import { setDataLoadingModeSettingsItem, useDataLoadingMode } from './setDataLoadingModeSettingsItem';
import { SchemaSettingsItemType } from '../../../../application/schema-settings/types';

const commonItems: SchemaSettingsItemType[] = [
  {
    name: 'title',
    Component: SchemaSettingsBlockTitleItem,
  },
  {
    name: 'dataScope',
    Component: SchemaSettingsDataScope,
    useComponentProps() {
      const { name } = useCollection_deprecated();
      const fieldSchema = useFieldSchema();
      const { form } = useFormBlockContext();
      const field = useField();
      const { service } = useDetailsBlockContext();
      const { dn } = useDesignable();
      const dataLoadingMode = useDataLoadingMode();
      return {
        collectionName: name,
        defaultFilter: fieldSchema?.['x-decorator-props']?.params?.filter || {},
        form,
        onSubmit: ({ filter }) => {
          filter = removeNullCondition(filter);
          const params = field.decoratorProps.params || {};
          params.filter = filter;
          field.decoratorProps.params = params;
          fieldSchema['x-decorator-props']['params'] = params;

          if (dataLoadingMode === 'auto') {
            service.run({ ...service.params?.[0], filter });
          }

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
    name: 'sortingRules',
    type: 'modal',
    useComponentProps() {
      const { name } = useCollection_deprecated();
      const { t } = useTranslation();
      const fieldSchema = useFieldSchema();
      const field = useField();
      const { service } = useDetailsBlockContext();
      const { dn } = useDesignable();
      const sortFields = useSortFields(name);
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
        components: {
          ArrayItems,
        },
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
        onSubmit({ sort }) {
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
  },
  setDataLoadingModeSettingsItem,
  {
    name: 'template',
    Component: SchemaSettingsTemplate,
    useComponentProps() {
      const { name } = useCollection_deprecated();
      const fieldSchema = useFieldSchema();
      const defaultResource =
        fieldSchema?.['x-decorator-props']?.resource || fieldSchema?.['x-decorator-props']?.association;
      return {
        componentName: 'Details',
        collectionName: name,
        resourceName: defaultResource,
      };
    },
  },
  {
    name: 'divider',
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
];

/**
 * @deprecated
 * 已弃用，请使用 detailsWithPaginationSettings 代替
 */
export const multiDataDetailsBlockSettings = new SchemaSettings({
  name: 'blockSettings:multiDataDetails',
  items: commonItems,
});

export const detailsWithPaginationSettings = new SchemaSettings({
  name: 'blockSettings:detailsWithPagination',
  items: commonItems,
});
