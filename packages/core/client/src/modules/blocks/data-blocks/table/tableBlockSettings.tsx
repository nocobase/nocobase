/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useField, useFieldSchema } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../../../../api-client';
import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { createSwitchSettingsItem } from '../../../../application/schema-settings/utils/createSwitchSettingsItem';
import { useTableBlockContext } from '../../../../block-provider';
import { useCollectionManager_deprecated, useCollection_deprecated } from '../../../../collection-manager';
import { FilterBlockType } from '../../../../filter-provider/utils';
import { useDesignable } from '../../../../schema-component';
import { SchemaSettingsBlockHeightItem } from '../../../../schema-settings/SchemaSettingsBlockHeightItem';
import { SchemaSettingsBlockTitleItem } from '../../../../schema-settings/SchemaSettingsBlockTitleItem';
import { SchemaSettingsConnectDataBlocks } from '../../../../schema-settings/SchemaSettingsConnectDataBlocks';
import { SchemaSettingsSortField } from '../../../../schema-settings/SchemaSettingsSortField';
import { SchemaSettingsTemplate } from '../../../../schema-settings/SchemaSettingsTemplate';
import { setDefaultSortingRulesSchemaSettingsItem } from '../../../../schema-settings/setDefaultSortingRulesSchemaSettingsItem';
import { setTheDataScopeSchemaSettingsItem } from '../../../../schema-settings/setTheDataScopeSchemaSettingsItem';
import { useBlockTemplateContext } from '../../../../schema-templates/BlockTemplateProvider';
import { setDataLoadingModeSettingsItem } from '../details-multi/setDataLoadingModeSettingsItem';
import { SchemaSettingsItemType } from '../../../../application';
import { SchemaSettingsLinkageRules } from '../../../../schema-settings';
import { LinkageRuleCategory } from '../../../../schema-settings/LinkageRules/type';

const enabledIndexColumn: SchemaSettingsItemType = {
  name: 'enableIndexColumn',
  type: 'switch',
  useComponentProps: () => {
    const field = useField();
    const fieldSchema = useFieldSchema();
    const { t } = useTranslation();
    const { dn } = useDesignable();
    return {
      title: t('Enable index column'),
      checked: field.decoratorProps.enableIndexColumn !== false,
      onChange: async (enableIndexColumn) => {
        field.decoratorProps = field.decoratorProps || {};
        field.decoratorProps.enableIndexColumn = enableIndexColumn;
        fieldSchema['x-decorator-props'].enableIndexColumn = enableIndexColumn;
        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-decorator-props': fieldSchema['x-decorator-props'],
          },
        });
      },
    };
  },
};

export const tableBlockSettings = new SchemaSettings({
  name: 'blockSettings:table',
  items: [
    {
      name: 'editBlockTitle',
      Component: SchemaSettingsBlockTitleItem,
    },
    {
      name: 'setTheBlockHeight',
      Component: SchemaSettingsBlockHeightItem,
    },
    {
      name: 'linkageRules',
      Component: SchemaSettingsLinkageRules,
      useComponentProps() {
        const { name } = useCollection_deprecated();
        const { t } = useTranslation();
        return {
          collectionName: name,
          title: t('Block Linkage rules'),
          category: LinkageRuleCategory.block,
        };
      },
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
          checked: treeCollection ? field.decoratorProps.treeTable : false,
          onChange: (flag) => {
            field.decoratorProps.treeTable = flag;
            fieldSchema['x-decorator-props'].treeTable = flag;

            if (flag === false) {
              fieldSchema['x-decorator-props'].expandFlag = false;
            }

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
    createSwitchSettingsItem({
      name: 'expandFlag',
      title: (t) => t('Expand All'),
      defaultValue: false,
      schemaKey: 'x-decorator-props.expandFlag',
      useVisible() {
        const field = useField();
        return field.decoratorProps.treeTable;
      },
    }),
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
    enabledIndexColumn,
    setTheDataScopeSchemaSettingsItem,
    setDefaultSortingRulesSchemaSettingsItem,
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
            { label: '5', value: 5 },
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
      name: 'tableSize',
      type: 'select',
      useComponentProps() {
        const field = useField();
        const fieldSchema = useFieldSchema();
        const { t } = useTranslation();
        const { dn } = useDesignable();
        const schema = fieldSchema.reduceProperties((_, s) => {
          if (s['x-component'] === 'TableV2') {
            return s;
          }
        }, null);
        return {
          title: t('Table size'),
          value: schema?.['x-component-props']?.size || 'small',
          options: [
            { label: t('Large'), value: 'large' },
            { label: t('Middle'), value: 'middle' },
            { label: t('Small'), value: 'small' },
          ],
          onChange: (size) => {
            schema['x-component-props'] = schema['x-component-props'] || {};
            schema['x-component-props']['size'] = size;
            dn.emit('patch', {
              schema: {
                ['x-uid']: schema['x-uid'],
                'x-component-props': schema['x-component-props'],
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
      sort: 7000,
      useVisible: () => {
        const fieldSchema = useFieldSchema();
        const supportTemplate = !fieldSchema?.['x-decorator-props']?.disableTemplate;
        return supportTemplate;
      },
    },
    {
      name: 'ConvertReferenceToDuplicate',
      sort: 8000,
      Component: SchemaSettingsTemplate,
      useComponentProps() {
        const { name } = useCollection_deprecated();
        const fieldSchema = useFieldSchema();
        const { componentNamePrefix } = useBlockTemplateContext();
        const defaultResource =
          fieldSchema?.['x-decorator-props']?.resource || fieldSchema?.['x-decorator-props']?.association;
        return {
          componentName: `${componentNamePrefix}Table`,
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
      sort: 9000,
    },
    {
      name: 'delete',
      type: 'remove',
      sort: 10000,
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
