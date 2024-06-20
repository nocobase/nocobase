/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// import { Button } from 'antd-mobile';
import { SchemaInitializer, gridRowColWrap } from '@nocobase/client';

export const mobileContentInitializer = new SchemaInitializer({
  title: '{{t("Add block")}}',
  name: 'mobile:content',
  icon: 'PlusOutlined',
  wrap: gridRowColWrap,
  // Component: Button,
  style: {
    margin: 20,
  },
  items: [
    {
      name: 'dataBlocks',
      title: '{{t("Data blocks")}}',
      type: 'itemGroup',
      children: [
        {
          name: 'table',
          type: 'item',
          title: '{{t("Table")}}',
        },
      ],
    },
  ],
});
