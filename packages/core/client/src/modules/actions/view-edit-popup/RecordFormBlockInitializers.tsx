/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaInitializer } from '../../../application/schema-initializer/SchemaInitializer';
import { gridRowColWrap } from '../../../schema-initializer/utils';

/**
 * @deprecated
 */
export const recordFormBlockInitializers = new SchemaInitializer({
  name: 'RecordFormBlockInitializers',
  title: '{{ t("Add block") }}',
  icon: 'PlusOutlined',
  wrap: gridRowColWrap,
  items: [
    {
      type: 'itemGroup',
      title: '{{ t("Data blocks") }}',
      name: 'dataBlocks',
      children: [
        {
          name: 'form',
          title: '{{ t("Form") }}',
          Component: 'RecordFormBlockInitializer',
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
