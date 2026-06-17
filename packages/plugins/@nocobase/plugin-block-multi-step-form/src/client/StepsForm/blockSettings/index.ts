/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  SchemaSettings,
  SchemaSettingsBlockTitleItem,
  SchemaSettingsBlockHeightItem,
  SchemaSettingsLinkageRules,
  useSchemaToolbar,
  useCollection,
  SchemaSettingsTemplate,
  useBlockTemplateContext,
} from '@nocobase/client';
import { StepsFormName, ComponentType } from '../../constants';

export const blockSettings: any = new SchemaSettings({
  name: `blockSettings:${StepsFormName}`,
  items: [
    {
      name: 'StepsForm',
      Component: SchemaSettingsBlockTitleItem,
    },
    {
      name: 'StepsFormHeight',
      Component: SchemaSettingsBlockHeightItem,
    },
    {
      name: 'StepsFormLink',
      Component: SchemaSettingsLinkageRules,
      useComponentProps() {
        const { name } = useCollection();
        const { linkageRulesProps } = useSchemaToolbar();
        return {
          ...linkageRulesProps,
          collectionName: name,
        };
      },
    },
    {
      name: 'divider',
      type: 'divider',
    },
    // {
    //   name: 'StepsFormTemplate',
    //   Component: SchemaSettingsTemplate,
    //   useComponentProps() {
    //     const { name } = useCollection();
    //     const { componentNamePrefix } = useBlockTemplateContext();
    //     return {
    //       componentName: `${componentNamePrefix}${ComponentType}`,
    //       collectionName: name,
    //     };
    //   },
    // },
    // {
    //   name: 'divider2',
    //   type: 'divider',
    // },
    {
      type: 'remove',
      name: 'remove',
      componentProps: {
        removeParentsIfNoChildren: true,
        breakRemoveOn: {
          'x-component': 'Grid',
        },
      },
    },
  ],
});
