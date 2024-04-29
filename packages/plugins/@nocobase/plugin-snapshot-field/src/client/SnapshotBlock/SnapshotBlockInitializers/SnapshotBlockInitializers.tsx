/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CompatibleSchemaInitializer, gridRowColWrap } from '@nocobase/client';
import { NAMESPACE } from '../../locale';

/**
 * @deprecated
 * use `snapshotBlockInitializers` instead
 */
export const snapshotBlockInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'SnapshotBlockInitializers',
  wrap: gridRowColWrap,
  title: `{{t("Add block", { ns: "${NAMESPACE}" })}}`,
  icon: 'PlusOutlined',
  items: [
    {
      type: 'itemGroup',
      title: '{{t("Current record blocks")}}',
      name: 'currentRecordBlocks',
      children: [
        {
          name: 'details',
          title: '{{t("Details")}}',
          Component: 'SnapshotBlockInitializersDetailItem',
          actionInitializers: 'details:configureActions',
        },
      ],
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
});

export const snapshotBlockInitializers = new CompatibleSchemaInitializer(
  {
    name: 'popup:snapshot:addBlock',
    wrap: gridRowColWrap,
    title: `{{t("Add block", { ns: "${NAMESPACE}" })}}`,
    icon: 'PlusOutlined',
    items: [
      {
        type: 'itemGroup',
        title: '{{t("Current record blocks")}}',
        name: 'currentRecordBlocks',
        children: [
          {
            name: 'details',
            title: '{{t("Details")}}',
            Component: 'SnapshotBlockInitializersDetailItem',
            actionInitializers: 'details:configureActions',
          },
        ],
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
  },
  snapshotBlockInitializers_deprecated,
);
