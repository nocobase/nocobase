/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { SchemaSettingsItemType } from '../../../../application/schema-settings/types';
import { useCollection_deprecated } from '../../../../collection-manager';
import { SchemaSettingsFormItemTemplate, SchemaSettingsLinkageRules } from '../../../../schema-settings';
import { SchemaSettingsBlockTitleItem } from '../../../../schema-settings/SchemaSettingsBlockTitleItem';

const commonItems: SchemaSettingsItemType[] = [
  {
    name: 'title',
    Component: SchemaSettingsBlockTitleItem,
  },
  {
    name: 'linkageRules',
    Component: SchemaSettingsLinkageRules,
    useComponentProps() {
      const { name } = useCollection_deprecated();
      return {
        collectionName: name,
        readPretty: true,
      };
    },
  },
  {
    name: 'formItemTemplate',
    Component: SchemaSettingsFormItemTemplate,
    useComponentProps() {
      const { name } = useCollection_deprecated();
      const fieldSchema = useFieldSchema();
      const defaultResource =
        fieldSchema?.['x-decorator-props']?.resource || fieldSchema?.['x-decorator-props']?.association;
      return {
        insertAdjacentPosition: 'beforeEnd',
        componentName: 'ReadPrettyFormItem',
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
