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
import { FilterBlockType } from '../../../../filter-provider';
import { SchemaSettingsLinkageRules } from '../../../../schema-settings';
import { SchemaSettingsBlockHeightItem } from '../../../../schema-settings/SchemaSettingsBlockHeightItem';
import { SchemaSettingsBlockTitleItem } from '../../../../schema-settings/SchemaSettingsBlockTitleItem';
import { SchemaSettingsConnectDataBlocks } from '../../../../schema-settings/SchemaSettingsConnectDataBlocks';
import { SchemaSettingsTemplate } from '../../../../schema-settings/SchemaSettingsTemplate';
import { useBlockTemplateContext } from '../../../../schema-templates/BlockTemplateProvider';
import { LinkageRuleCategory } from '../../../../schema-settings/LinkageRules/type';
import { useCollection } from '../../../../data-source/collection/CollectionProvider';

export const filterCollapseBlockSettings = new SchemaSettings({
  name: 'blockSettings:filterCollapse',
  items: [
    {
      name: 'EditBlockTitle',
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
      name: 'ConvertReferenceToDuplicate',
      Component: SchemaSettingsTemplate,
      useComponentProps() {
        const { name } = useCollection_deprecated();
        const fieldSchema = useFieldSchema();
        const { componentNamePrefix } = useBlockTemplateContext();
        const defaultResource =
          fieldSchema?.['x-decorator-props']?.resource || fieldSchema?.['x-decorator-props']?.association;

        return {
          componentName: `${componentNamePrefix}FilterCollapse`,
          collectionName: name,
          resourceName: defaultResource,
        };
      },
    },
    {
      name: 'ConnectDataBlocks',
      Component: SchemaSettingsConnectDataBlocks,
      useComponentProps() {
        const { t } = useTranslation();

        return {
          type: FilterBlockType.COLLAPSE,
          emptyDescription: t('No blocks to connect'),
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
