/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaInitializer } from '../../application/schema-initializer/SchemaInitializer';
import { FlowPageMenuItem } from './FlowPageMenuItem';
import { GroupItem } from './GroupItem';
import { LinkMenuItem } from './LinkMenuItem';
import { PageMenuItem } from './PageMenuItem';

/**
 * @deprecated
 */
export const menuItemInitializer_deprecated = new SchemaInitializer({
  name: 'MenuItemInitializers',
  insertPosition: 'beforeEnd',
  icon: 'PlusOutlined',
  title: '{{t("Add menu item")}}',
  style: {
    width: '100%',
  },
  items: [
    {
      name: 'group',
      Component: GroupItem,
    },
    {
      name: 'page1',
      Component: PageMenuItem,
    },
    {
      name: 'page2',
      Component: PageMenuItem,
    },
    {
      name: 'link',
      Component: LinkMenuItem,
    },
  ],
});

export const menuItemInitializer = new SchemaInitializer({
  name: 'menuInitializers:menuItem',
  insertPosition: 'beforeEnd',
  icon: 'PlusOutlined',
  title: '{{t("Add menu item")}}',
  items: [
    {
      name: 'group',
      Component: GroupItem,
    },
    {
      name: 'page1',
      Component: PageMenuItem,
    },
    {
      name: 'page2',
      Component: FlowPageMenuItem,
    },
    {
      name: 'link',
      Component: LinkMenuItem,
    },
  ],
});
