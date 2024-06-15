/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaInitializer } from '@nocobase/client';
import { PluginName } from '../../constants';
import { MenuInitializerComponent } from './MenuInitializerComponent';

export const mobileMenuInitializer = new SchemaInitializer({
  name: `${PluginName}:menu`,
  title: 'Add Block',
  insertPosition: 'beforeEnd',
  Component: MenuInitializerComponent,
  items: [
    {
      type: 'item',
      name: 'a1',
      title: 'A1',
    },
    {
      type: 'item',
      name: 'a2',
      title: 'A2',
    },
  ],
});
