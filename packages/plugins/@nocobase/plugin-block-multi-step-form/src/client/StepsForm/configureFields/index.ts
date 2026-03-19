/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFieldsToFormInitializerItems, Grid, SchemaInitializer } from '@nocobase/client';
import { StepsFormName } from '../../constants';
import { tStr } from '../../locale';

export const configureFieldsInitializer: any = new SchemaInitializer({
  name: `${StepsFormName}:configureFields`,
  icon: 'SettingOutlined',
  wrap: Grid.wrap,
  title: tStr('Configure fields'),
  items: [
    {
      name: 'collectionFields',
      Component: CollectionFieldsToFormInitializerItems,
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'addText',
      title: tStr('Add text'),
      Component: 'MarkdownFormItemInitializer',
    },
  ],
});
