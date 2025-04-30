/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { useCollection_deprecated } from '../../../../collection-manager';
import { useCollection } from '../../../../data-source/collection/CollectionProvider';
import { FilterBlockType } from '../../../../filter-provider';
import { SchemaSettingsFormItemTemplate, SchemaSettingsLinkageRules } from '../../../../schema-settings';
import { SchemaSettingsBlockHeightItem } from '../../../../schema-settings/SchemaSettingsBlockHeightItem';
import { SchemaSettingsBlockTitleItem } from '../../../../schema-settings/SchemaSettingsBlockTitleItem';
import { SchemaSettingsConnectDataBlocks } from '../../../../schema-settings/SchemaSettingsConnectDataBlocks';
import { useBlockTemplateContext } from '../../../../schema-templates/BlockTemplateProvider';
import { SchemaSettingsLayoutItem } from '../../../../schema-settings/SchemaSettingsLayoutItem';
import { LinkageRuleCategory } from '../../../../schema-settings/LinkageRules/type';

export const filterFormBlockSettings = new SchemaSettings({
  name: 'blockSettings:filterForm',
  items: [
    {
      name: 'title',
      Component: SchemaSettingsBlockTitleItem,
    },
    {
      name: 'setTheBlockHeight',
      Component: SchemaSettingsBlockHeightItem,
    },
    {
      name: 'formItemTemplate',
      Component: SchemaSettingsFormItemTemplate,
      useComponentProps() {
        const { componentNamePrefix } = useBlockTemplateContext();
        const { name } = useCollection();
        const fieldSchema = useFieldSchema();
        const defaultResource =
          fieldSchema?.['x-decorator-props']?.resource || fieldSchema?.['x-decorator-props']?.association;
        return {
          componentName: `${componentNamePrefix}FilterFormItem`,
          collectionName: name,
          resourceName: defaultResource,
        };
      },
    },
    {
      name: 'fieldLinkageRules',
      Component: SchemaSettingsLinkageRules,
      useComponentProps() {
        const { name } = useCollection_deprecated();
        const { t } = useTranslation();
        return {
          collectionName: name,
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
      name: 'connectDataBlocks',
      Component: SchemaSettingsConnectDataBlocks,
      useComponentProps() {
        const { t } = useTranslation();
        return {
          type: FilterBlockType.FORM,
          emptyDescription: t('No blocks to connect'),
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
  ],
});
