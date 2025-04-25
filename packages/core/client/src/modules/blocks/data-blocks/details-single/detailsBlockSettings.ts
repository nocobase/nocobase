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
import { SchemaSettingsItemType } from '../../../../application/schema-settings/types';
import { useCollection } from '../../../../data-source/collection/CollectionProvider';
import { useCollection_deprecated } from '../../../../collection-manager';
import { SchemaSettingsFormItemTemplate, SchemaSettingsLinkageRules } from '../../../../schema-settings';
import { SchemaSettingsBlockHeightItem } from '../../../../schema-settings/SchemaSettingsBlockHeightItem';
import { SchemaSettingsBlockTitleItem } from '../../../../schema-settings/SchemaSettingsBlockTitleItem';
import { useBlockTemplateContext } from '../../../../schema-templates/BlockTemplateProvider';
import { SchemaSettingsLayoutItem } from '../../../../schema-settings/SchemaSettingsLayoutItem';
import { LinkageRuleCategory } from '../../../../schema-settings/LinkageRules/type';

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
    name: 'formItemTemplate',
    Component: SchemaSettingsFormItemTemplate,
    useComponentProps() {
      const { name } = useCollection();
      const fieldSchema = useFieldSchema();
      const { componentNamePrefix } = useBlockTemplateContext();
      const defaultResource =
        fieldSchema?.['x-decorator-props']?.resource || fieldSchema?.['x-decorator-props']?.association;
      return {
        insertAdjacentPosition: 'beforeEnd',
        componentName: `${componentNamePrefix}ReadPrettyFormItem`,
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
 * 已弃用，请使用 detailsBlockSettings 代替
 */
export const singleDataDetailsBlockSettings = new SchemaSettings({
  name: 'blockSettings:singleDataDetails',
  items: commonItems,
});

export const detailsBlockSettings = new SchemaSettings({
  name: 'blockSettings:details',
  items: commonItems,
});
