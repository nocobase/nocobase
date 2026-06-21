/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import {
  FilterBlockType,
  SchemaSettings,
  SchemaSettingsBlockHeightItem,
  SchemaSettingsBlockTitleItem,
  SchemaSettingsConnectDataBlocks,
  SchemaSettingsTemplate,
  setDefaultSortingRulesSchemaSettingsItem,
  setTheDataScopeSchemaSettingsItem,
  useBlockTemplateContext,
  useCollection,
  SchemaSettingsLinkageRules,
  LinkageRuleCategory,
} from '@nocobase/client';
import { useTranslation } from 'react-i18next';

import { BlockNameLowercase } from '../constants';
import { useTreeTranslation } from '../locale';
import { expandAllSchemaSettingsItem } from './items/expandAll';
import { recordsCountFieldSchemaSettingsItem } from './items/recordsCount';
import { searchableSchemaSettingsItem } from './items/searchable';
import { titleFieldSchemaSettingsItem } from './items/titleField';

export const treeSettings = new SchemaSettings({
  name: `blockSettings:${BlockNameLowercase}`,
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
      name: 'blockLinkageRules',
      Component: SchemaSettingsLinkageRules,
      useComponentProps() {
        const { t } = useTranslation();
        return {
          title: t('Block Linkage rules', { ns: 'client' }),
          category: LinkageRuleCategory.block,
        };
      },
    },
    setDefaultSortingRulesSchemaSettingsItem,
    setTheDataScopeSchemaSettingsItem,
    searchableSchemaSettingsItem,
    expandAllSchemaSettingsItem,
    titleFieldSchemaSettingsItem,
    recordsCountFieldSchemaSettingsItem,
    {
      name: 'ConnectDataBlocks',
      Component: SchemaSettingsConnectDataBlocks,
      useComponentProps() {
        const { t } = useTranslation();
        return {
          type: FilterBlockType.TREE,
          emptyDescription: t('No blocks to connect'),
        };
      },
    },
    {
      type: 'divider',
      name: 'divider-1',
    },
    {
      name: 'ConvertReferenceToDuplicate',
      Component: SchemaSettingsTemplate,
      useComponentProps() {
        const collection = useCollection();
        const fieldSchema = useFieldSchema();
        const { componentNamePrefix } = useBlockTemplateContext();
        const defaultResource =
          fieldSchema?.['x-decorator-props']?.resource || fieldSchema?.['x-decorator-props']?.association;
        return {
          componentName: `${componentNamePrefix}Tree`,
          useTranslationHooks: useTreeTranslation,
          collectionName: collection.name,
          resourceName: defaultResource,
        };
      },
    },
    {
      type: 'divider',
      name: 'divider-2',
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
  ],
});
