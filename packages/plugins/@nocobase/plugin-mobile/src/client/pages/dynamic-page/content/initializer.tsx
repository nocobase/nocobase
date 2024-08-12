/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaInitializer, gridRowColWrap } from '@nocobase/client';
import { generatePluginTranslationTemplate } from '../../../locale';

export const mobileAddBlockInitializer = new SchemaInitializer({
  title: '{{t("Add block")}}',
  name: 'mobile:addBlock',
  icon: 'PlusOutlined',
  wrap: gridRowColWrap,
  style: {
    margin: 20,
  },
  items: [
    {
      name: 'dataBlocks',
      title: '{{t("Desktop data blocks")}}',
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
        },
        {
          name: 'details',
          title: '{{t("Details")}}',
          Component: 'DetailsBlockInitializer',
        },
        // {
        //   name: 'list',
        //   title: '{{t("List")}}',
        //   Component: 'ListBlockInitializer',
        // },
        {
          name: 'gridCard',
          title: '{{t("Grid Card")}}',
          Component: 'GridCardBlockInitializer',
        },
      ],
    },
    {
      name: 'otherBlocks',
      type: 'itemGroup',
      title: '{{t("Other desktop blocks")}}',
      children: [
        {
          name: 'markdown',
          title: '{{t("Markdown")}}',
          Component: 'MarkdownBlockInitializer',
        },
        {
          name: 'settings',
          title: generatePluginTranslationTemplate('Settings'),
          Component: 'MobileSettingsBlockInitializer',
        },
      ],
    },
  ],
});
