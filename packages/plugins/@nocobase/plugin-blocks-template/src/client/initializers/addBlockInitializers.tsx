/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  gridRowColWrap,
  SchemaInitializer,
  useActionAvailable,
  useCollection,
  useCreateEditFormBlock,
} from '@nocobase/client';

export const addBlockInitializers = new SchemaInitializer({
  name: 'template:addBlock',
  title: '{{t("Add block")}}',
  icon: 'PlusOutlined',
  wrap: gridRowColWrap,
  items: [
    {
      name: 'dataBlocks',
      title: '{{t("Data blocks")}}',
      type: 'itemGroup',
      children: [
        {
          name: 'table',
          title: '{{t("Table")}}',
          Component: 'TableBlockInitializer',
        },
        {
          name: 'form',
          title: '{{t("Form")}}',
          Component: 'FormBlockInitializer',
          useComponentProps: () => {
            const filterCollections = ({ collection }) => {
              const { unavailableActions, availableActions } = collection?.options || {};
              if (availableActions) {
                return availableActions.includes?.('create');
              }
              if (unavailableActions) {
                return !unavailableActions?.includes?.('create');
              }
              return true;
            };
            return { filterCollections };
          },
        },
        // {
        //   name: 'editForm',
        //   title: '{{t("Form (Edit)")}}',
        //   Component: 'FormBlockInitializer',
        //   useComponentProps() {
        //     return {
        //       filterCollections({ collection }) {
        //         const { unavailableActions, availableActions } = collection?.options || {};
        //         if (availableActions) {
        //           return availableActions.includes?.('update');
        //         }
        //         if (unavailableActions) {
        //           return !unavailableActions?.includes?.('update');
        //         }
        //         return true;
        //       },
        //     };
        //   },
        //   useVisible: () => useActionAvailable('update'),
        // },
        {
          name: 'details',
          title: '{{t("Details")}}',
          Component: 'DetailsBlockInitializer',
        },
        {
          name: 'list',
          title: '{{t("List")}}',
          Component: 'ListBlockInitializer',
        },
        {
          name: 'gridCard',
          title: '{{t("Grid Card")}}',
          Component: 'GridCardBlockInitializer',
        },
      ],
    },
    {
      name: 'filterBlocks',
      title: '{{t("Filter blocks")}}',
      type: 'itemGroup',
      children: [
        {
          name: 'filterForm',
          title: '{{t("Form")}}',
          Component: 'FilterFormBlockInitializer',
        },
        {
          name: 'filterCollapse',
          title: '{{t("Collapse")}}',
          Component: 'FilterCollapseBlockInitializer',
        },
      ],
    },
    {
      name: 'otherBlocks',
      type: 'itemGroup',
      title: '{{t("Other blocks")}}',
      children: [
        {
          name: 'markdown',
          title: '{{t("Markdown")}}',
          Component: 'MarkdownBlockInitializer',
        },
      ],
    },
  ],
});
