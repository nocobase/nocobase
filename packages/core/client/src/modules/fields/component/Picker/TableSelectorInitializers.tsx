/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCollection_deprecated } from '../../../..';
import { CompatibleSchemaInitializer } from '../../../../application/schema-initializer/CompatibleSchemaInitializer';
import { gridRowColWrap } from '../../../../schema-initializer/utils';

const commonOptions = {
  wrap: gridRowColWrap,
  title: '{{t("Add block")}}',
  icon: 'PlusOutlined',
  items: [
    {
      type: 'itemGroup',
      title: '{{t("Selector")}}',
      name: 'selector',
      children: [
        {
          name: 'title',
          title: 'Table',
          Component: 'TableSelectorInitializer',
        },
      ],
    },
    {
      type: 'itemGroup',
      title: '{{t("Filter blocks")}}',
      name: 'filterBlocks',
      useChildren() {
        const { name, dataSource } = useCollection_deprecated();
        return [
          {
            name: 'filterFormBlockInTableSelector',
            title: '{{t("Form")}}',
            Component: 'FilterFormBlockInitializer',
            componentProps: {
              filterCollections() {
                return false;
              },
              onlyCurrentDataSource: true,
            },
            collectionName: name,
            dataSource,
          },
          {
            name: 'filterCollapseBlockInTableSelector',
            title: '{{t("Collapse")}}',
            Component: 'FilterCollapseBlockInitializer',
            componentProps: {
              filterCollections() {
                return false;
              },
              onlyCurrentDataSource: true,
            },
            collectionName: name,
            dataSource,
          },
        ];
      },
    },
    {
      type: 'itemGroup',
      title: '{{t("Other blocks")}}',
      name: 'otherBlocks',
      children: [
        {
          name: 'markdown',
          title: '{{t("Markdown")}}',
          Component: 'MarkdownBlockInitializer',
        },
      ],
    },
  ],
};

/**
 * @deprecated
 * use `tableSelectorInitializers` instead
 */
export const tableSelectorInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'TableSelectorInitializers',
  ...commonOptions,
});

export const tableSelectorInitializers = new CompatibleSchemaInitializer(
  {
    name: 'popup:tableSelector:addBlock',
    ...commonOptions,
  },
  tableSelectorInitializers_deprecated,
);
