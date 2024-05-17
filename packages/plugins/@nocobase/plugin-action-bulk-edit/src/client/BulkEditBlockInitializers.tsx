/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CompatibleSchemaInitializer, SchemaInitializer, gridRowColWrap } from '@nocobase/client';
import { CreateFormBulkEditBlockInitializer } from './CreateFormBulkEditBlockInitializer';

/**
 * @deprecated
 * 之所以还保留，仅是为了兼容旧版 schema
 */
export const CreateFormBulkEditBlockInitializers: SchemaInitializer = new SchemaInitializer({
  name: 'CreateFormBulkEditBlockInitializers',
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
          Component: CreateFormBulkEditBlockInitializer,
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
          Component: CreateFormBulkEditBlockInitializer,
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
 * use `bulkEditBlockInitializers` instead
 */
export const BulkEditBlockInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'BulkEditBlockInitializers',
  ...commonOptions,
});

export const bulkEditBlockInitializers = new CompatibleSchemaInitializer(
  {
    name: 'popup:bulkEdit:addBlock',
    ...commonOptions,
  },
  BulkEditBlockInitializers_deprecated,
);
