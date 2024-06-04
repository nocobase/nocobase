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
import { WorkbenchScanActionSchemaInitializerItem } from './WorkbenchScanActionSchemaInitializerItem';

export const workbenchConfigureActions = new SchemaInitializer({
  name: 'workbench:configureActions',
  title: 'Configure actions',
  // 插入位置
  insertPosition: 'beforeEnd',
  items: [
    {
      name: 'link',
      title: 'Link',
      Component: WorkbenchLinkActionSchemaInitializerItem,
    },
    {
      name: 'qrcode',
      title: 'Scan Qr code',
      Component: WorkbenchScanActionSchemaInitializerItem,
    },
  ],
});
