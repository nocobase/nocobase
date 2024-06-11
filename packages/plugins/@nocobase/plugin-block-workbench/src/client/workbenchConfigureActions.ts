/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaInitializer } from '@nocobase/client';
import { WorkbenchLinkActionSchemaInitializerItem } from './WorkbenchLinkActionSchemaInitializerItem';

export const workbenchConfigureActions = new SchemaInitializer({
  name: 'workbench:configureActions',
  title: '{{t("Configure actions")}}',
  // 插入位置
  insertPosition: 'beforeEnd',
  items: [
    {
      name: 'link',
      title: '{{t("Link")}}',
      Component: WorkbenchLinkActionSchemaInitializerItem,
    },
  ],
});
