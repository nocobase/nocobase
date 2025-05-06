/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaInitializerItemTypeWithoutName, usePlugin } from '@nocobase/client';
import { TemplateBlockInitializer } from './TemplateBlockInitializer';

export const templateBlockInitializerItem: SchemaInitializerItemTypeWithoutName = {
  name: 'templates',
  Component: TemplateBlockInitializer,
  title: '{{t("Block template")}}',
  icon: 'TableOutlined',
  // // sort: -1,
  wrap: (t) => t,
  useVisible: () => false,
};
