/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaInitializer } from '../../application/schema-initializer/SchemaInitializer';
import { GroupItem } from './GroupItem';
import { LinkMenuItem } from './LinkMenuItem';
import { PageMenuItem } from './PageMenuItem';

/**
 * @deprecated
 * use `menuItemInitializer` instead
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
      name: 'page',
      Component: PageMenuItem,
    },
    {
      name: 'link',
      Component: LinkMenuItem,
    },
  ],
});

export const menuItemInitializer = new SchemaInitializer({
  name: 'header:addMenuItem',
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
      name: 'page',
      Component: PageMenuItem,
    },
    {
      name: 'link',
      Component: LinkMenuItem,
    },
  ],
});
