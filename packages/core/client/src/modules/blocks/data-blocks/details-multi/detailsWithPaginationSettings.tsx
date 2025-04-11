/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ArrayItems } from '@formily/antd-v5';
import { ISchema, useField, useFieldSchema } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { SchemaSettingsItemType } from '../../../../application/schema-settings/types';
import { useDetailsBlockContext } from '../../../../block-provider/DetailsBlockProvider';
import { useFormBlockContext } from '../../../../block-provider/FormBlockProvider';
import { useSortFields } from '../../../../collection-manager';
import { removeNullCondition, useDesignable } from '../../../../schema-component';
import { SchemaSettingsLinkageRules } from '../../../../schema-settings';
import { SchemaSettingsBlockHeightItem } from '../../../../schema-settings/SchemaSettingsBlockHeightItem';
import { SchemaSettingsBlockTitleItem } from '../../../../schema-settings/SchemaSettingsBlockTitleItem';
import { SchemaSettingsDataScope } from '../../../../schema-settings/SchemaSettingsDataScope';
import { SchemaSettingsTemplate } from '../../../../schema-settings/SchemaSettingsTemplate';
import { useBlockTemplateContext } from '../../../../schema-templates/BlockTemplateProvider';
import { setDataLoadingModeSettingsItem } from './setDataLoadingModeSettingsItem';
import { SchemaSettingsLayoutItem } from '../../../../schema-settings/SchemaSettingsLayoutItem';
import { LinkageRuleCategory } from '../../../../schema-settings/LinkageRules/type';
import { useCollection } from '../../../../data-source';

const commonItems: SchemaSettingsItemType[] = [
  {
    name: 'title',
    Component: SchemaSettingsBlockTitleItem,
  },
  {
    name: 'setTheBlockHeight',
    Component: SchemaSettingsBlockHeightItem,
  },
  {
    name: 'fieldLinkageRules',
    Component: SchemaSettingsLinkageRules,
    useComponentProps() {
      const { name } = useCollection();
      const { t } = useTranslation();
      return {
        collectionName: name,
        readPretty: true,
        title: t('Field Linkage rules'),
      };
    },
  },
  {
    name: 'blockLinkageRules',
    Component: SchemaSettingsLinkageRules,
    useComponentProps() {
      const { name } = useCollection();
      const { t } = useTranslation();
      return {
        collectionName: name,
        title: t('Block Linkage rules'),
        category: LinkageRuleCategory.block,
      };
    },
  },
  {
    name: 'dataScope',
    Component: SchemaSettingsDataScope,
    useComponentProps() {
      const { name } = useCollection();
      const fieldSchema = useFieldSchema();
      const { form } = useFormBlockContext();
      const field = useField();
      const { dn } = useDesignable();
      const { service } = useDetailsBlockContext();

      return {
        collectionName: name,
        defaultFilter: fieldSchema?.['x-decorator-props']?.params?.filter || {},
        form,
        noRecord: true,
        onSubmit: ({ filter }) => {
          filter = removeNullCondition(filter);
          const params = field.decoratorProps.params || {};
          params.filter = filter;
          field.decoratorProps.params = params;
          fieldSchema['x-decorator-props']['params'] = params;

          dn.emit('patch', {
            schema: {
              ['x-uid']: fieldSchema['x-uid'],
              'x-decorator-props': fieldSchema['x-decorator-props'],
            },
          });
          service.params[0].page = 1;
        },
      };
    },
  },
  {
    name: 'sortingRules',
    type: 'modal',
    useComponentProps() {
      const { name } = useCollection();
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
      const { name } = useCollection();
      const fieldSchema = useFieldSchema();
      const { componentNamePrefix } = useBlockTemplateContext();
      const defaultResource =
        fieldSchema?.['x-decorator-props']?.resource || fieldSchema?.['x-decorator-props']?.association;
      return {
        componentName: `${componentNamePrefix}Details`,
        collectionName: name,
        resourceName: defaultResource,
      };
    },
  },
  {
    name: 'setBlockLayout',
    Component: SchemaSettingsLayoutItem,
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
