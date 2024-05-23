/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CompatibleSchemaInitializer } from '../../../application/schema-initializer/CompatibleSchemaInitializer';
import { gridRowColWrap } from '../../../schema-initializer/utils';

const commonOptions = {
  wrap: gridRowColWrap,
  title: '{{t("Add block")}}',
  icon: 'PlusOutlined',
  items: [
    {
      type: 'itemGroup',
      title: '{{t("Data blocks")}}',
      name: 'dataBlocks',
      children: [
        {
          name: 'form',
          title: '{{t("Form")}}',
          Component: 'FormBlockInitializer',
          /** 表示是通过 Other collections 选项创建的区块（由于历史遗留问题，这里的命名暂不做更改） */
          isCusomeizeCreate: true,
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
};

/**
 * @deprecated
 * use `customizeCreateFormBlockInitializers` instead
 */
export const customizeCreateFormBlockInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'CusomeizeCreateFormBlockInitializers',
  ...commonOptions,
});

export const customizeCreateFormBlockInitializers = new CompatibleSchemaInitializer(
  {
    name: 'popup:addRecord:addBlock',
    ...commonOptions,
  },
  customizeCreateFormBlockInitializers_deprecated,
);
